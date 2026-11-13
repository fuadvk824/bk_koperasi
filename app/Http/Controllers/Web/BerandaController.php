<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Simpanan;
use App\Models\Pinjaman;
use App\Models\Angsuran;
use App\Models\PengaturanKoperasi;
use App\Models\TransaksiKas;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;


class BerandaController extends Controller
{
    public function index(Request $request)
    {

        $validated = $request->validate([
            'bulan' => ['sometimes', 'integer', 'between:1,12'],
            'tahun' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
        ]);

        $bulan = (int) ($validated['bulan'] ?? now()->month);
        $tahun = (int) ($validated['tahun'] ?? now()->year);

        $startOfMonth = Carbon::create($tahun, $bulan, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        $tanggalAwal = $startOfMonth->toDateString();
        $tanggalAkhir = $endOfMonth->toDateString();


        /*_________________________________________________
         |
         | ANGGOTA
         |_________________________________________________*/
        $anggotaAktifPadaAkhirPeriode = function ($query) use ($tanggalAkhir) {
            $query
                ->whereNotIn('id', [1, 98])
                ->whereNotNull('active_at')
                ->whereDate('active_at', '<=', $tanggalAkhir)
                ->where(function ($q) use ($tanggalAkhir) {
                    $q->whereNull('inactive_at')
                        ->orWhereDate('inactive_at', '>', $tanggalAkhir);
                });
        };

        $totalAnggota = User::query()
            ->where($anggotaAktifPadaAkhirPeriode)
            ->count();

        $anggotaBaruBulanIni = User::query()
            ->whereBetween('active_at', [$tanggalAwal, $tanggalAkhir])
            ->where($anggotaAktifPadaAkhirPeriode)
            ->count();


        /*_________________________________________________
         |
         | SIMPANAN
         |_________________________________________________*/
        $rekapSimpanan = Simpanan::query()
            ->where('status_approval', 'disetujui')
            ->selectRaw("
            COALESCE(SUM(CASE WHEN jenis = 'wajib'
                THEN jumlah ELSE 0 END), 0) AS wajib,
            COALESCE(SUM(CASE WHEN jenis = 'sukarela'
                THEN jumlah ELSE 0 END), 0) AS sukarela,
            COALESCE(SUM(CASE WHEN jenis = 'modal'
                THEN jumlah ELSE 0 END), 0) AS modal,
            COALESCE(SUM(CASE WHEN jenis = 'penarikan'
                THEN jumlah ELSE 0 END), 0) AS penarikan
        ")
            ->first();

        $totalSimpananWajib = (float) $rekapSimpanan->wajib;
        $totalSimpananSukarela = (float) $rekapSimpanan->sukarela;
        $totalSimpananModal = (float) $rekapSimpanan->modal;
        $totalPenarikan = (float) $rekapSimpanan->penarikan;

        // Diasumsikan nilai penarikan pada tabel simpanan sudah negatif.
        $totalSimpanan = $totalSimpananWajib
            + $totalSimpananSukarela
            + $totalSimpananModal
            + $totalPenarikan;

        $rekapSimpananBulanIni = Simpanan::query()
            ->where('status_approval', 'disetujui')
            ->whereBetween('tanggal', [$tanggalAwal, $tanggalAkhir])
            ->selectRaw("
            COALESCE(SUM(CASE WHEN jenis = 'wajib'
                THEN jumlah ELSE 0 END), 0) AS wajib,
            COALESCE(SUM(CASE WHEN jenis = 'sukarela'
                THEN jumlah ELSE 0 END), 0) AS sukarela,
            COALESCE(SUM(CASE WHEN jenis = 'modal'
                THEN jumlah ELSE 0 END), 0) AS modal,
            COALESCE(SUM(CASE WHEN jenis = 'penarikan'
                THEN jumlah ELSE 0 END), 0) AS penarikan
        ")
            ->first();

        $simpananWajibBulanIni = (float) $rekapSimpananBulanIni->wajib;
        $simpananSukarelaBulanIni = (float) $rekapSimpananBulanIni->sukarela;
        $simpananModalBulanIni = (float) $rekapSimpananBulanIni->modal;
        $penarikanBulanIni = (float) $rekapSimpananBulanIni->penarikan;

        $totalSimpananBulanIni = $simpananWajibBulanIni
            + $simpananSukarelaBulanIni
            + $simpananModalBulanIni
            + $penarikanBulanIni;

        $pengaturan = PengaturanKoperasi::query()
            ->where(function ($query) use ($tanggalAwal) {
                $query->whereNull('berlaku_mulai')
                    ->orWhereDate('berlaku_mulai', '<=', $tanggalAwal);
            })
            ->where(function ($query) use ($tanggalAwal) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $tanggalAwal);
            })
            ->orderByRaw('berlaku_mulai IS NULL ASC')
            ->orderByDesc('berlaku_mulai')
            ->orderByDesc('id')
            ->first();

        $simpananWajibPerBulan = (float) ($pengaturan?->simpanan_wajib ?? 0);

        $targetSimpananWajib = $totalAnggota * $simpananWajibPerBulan;

        $persentaseSimpananWajib = $targetSimpananWajib > 0
            ? min(
                100,
                round(
                    ($simpananWajibBulanIni / $targetSimpananWajib) * 100,
                    1
                )
            )
            : 0;

        $kekuranganSimpananWajib = max(
            0,
            $targetSimpananWajib - $simpananWajibBulanIni
        );


        /*_________________________________________________
         |
         | PINJAMAN
         |_________________________________________________*/
        $queryPinjamanPeriode = Pinjaman::query()
            ->where('status_approval', 'disetujui');

        $totalNilaiPinjaman = (float) (clone $queryPinjamanPeriode)
            ->sum('total_pinjaman');
        $totalSisaPinjaman = (float) (clone $queryPinjamanPeriode)
            ->sum('sisa_pinjaman');

        $totalPinjamanAktif = (clone $queryPinjamanPeriode)
            ->where('status', 'aktif')
            ->count();
        $totalPinjamanLunas = (clone $queryPinjamanPeriode)
            ->where('status', 'lunas')
            ->count();
        $totalPinjamanMacet = (clone $queryPinjamanPeriode)
            ->where('status', 'macet')
            ->count();
        $totalNominalPinjamanMacet = (float) (clone $queryPinjamanPeriode)
            ->where('status', 'macet')
            ->sum('sisa_pinjaman');

        $queryPinjamanBulanIni = Pinjaman::query()
            ->where('status_approval', 'disetujui')
            ->whereBetween('tanggal_pinjaman', [
                $tanggalAwal,
                $tanggalAkhir,
            ]);

        $jumlahPinjamanBulanIni = (clone $queryPinjamanBulanIni)
            ->count();
        $totalPinjamanBulanIni = (float) (clone $queryPinjamanBulanIni)
            ->sum('total_pinjaman');

        $totalPokokPinjamanBulanIni = (float) (clone $queryPinjamanBulanIni)
            ->sum('jumlah_pinjaman');
        $keuntunganPinjamanBulanIni =  $totalPinjamanBulanIni - $totalPokokPinjamanBulanIni;

        $rataRataPinjamanBulanIni = $jumlahPinjamanBulanIni > 0
            ? $totalPinjamanBulanIni / $jumlahPinjamanBulanIni
            : 0;

        /*_________________________________________________
         |
         | ANGSURAN
         |_________________________________________________*/
        $jadwalAngsuranBulanIni = Angsuran::query()
            ->where('status_approval', 'disetujui')
            ->where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->get();

        $angsuranTerbayarBulanIni = $jadwalAngsuranBulanIni
            ->where('status', 'sudah_bayar');

        $angsuranBelumBayarBulanIni = $jadwalAngsuranBulanIni
            ->where('status', 'belum_bayar');

        // Total nominal angsuran yang sudah dibayar
        $jumlahAngsuranTerbayarBulanIni = (float) $angsuranTerbayarBulanIni
            ->sum(fn($item) => (float) ($item->jumlah_bayar));

        // Total nominal angsuran yang belum dibayar
        $jumlahAngsuranBelumBayarBulanIni = (float) $angsuranBelumBayarBulanIni
            ->sum('jumlah_bayar');

        // Total nominal jadwal angsuran bulan ini
        $jumlahJadwalAngsuranBulanIni = (float) $jadwalAngsuranBulanIni
            ->sum('jumlah_bayar');

        // Jumlah jadwal yang sudah dan belum dibayar
        $targetAngsuran = $jadwalAngsuranBulanIni->count();
        $jumlahSudahBayar = $angsuranTerbayarBulanIni->count();
        $jumlahBelumBayar = $angsuranBelumBayarBulanIni->count();

        $persentaseAngsuran = $targetAngsuran > 0
            ? round(($jumlahSudahBayar / $targetAngsuran) * 100, 1)
            : 0;

        $kekuranganAngsuran = max(
            0,
            $jumlahJadwalAngsuranBulanIni - $jumlahAngsuranTerbayarBulanIni
        );

        $angsuranTunggakan = Angsuran::query()
            ->where('status_approval', 'disetujui')
            ->where(function ($query) {
                $query->whereNull('tanggal_bayar')
                    ->orWhere('status', 'belum_bayar');
            })
            ->where(function ($query) {
                $query->where('tahun', '<', now()->year)
                    ->orWhere(function ($q) {
                        $q->where('tahun', now()->year)
                            ->where('bulan', '<', now()->month);
                    });
            })
            ->get();

        $jumlahTunggakan = (float) $angsuranTunggakan
            ->sum('jumlah_bayar');

        $jumlahTunggakanCount = $angsuranTunggakan
            ->count();


        /*_________________________________________________
         |
         | TRANSAKSI KAS
         |_________________________________________________*/
        $queryKasPeriode = TransaksiKas::query()
            ->where('status', 'berhasil');
        // ->whereDate('tanggal', '<=', $tanggalAkhir);

        $totalKasMasuk = (float) (clone $queryKasPeriode)
            ->where('jenis', 'masuk')
            ->sum('jumlah');

        $totalKasKeluar = (float) (clone $queryKasPeriode)
            ->where('jenis', 'keluar')
            ->sum('jumlah');

        $saldoKas = $totalKasMasuk - $totalKasKeluar;


        $queryKasBulanIni = TransaksiKas::query()
            ->where('status', 'berhasil')
            ->whereBetween('tanggal', [
                $startOfMonth->toDateTimeString(),
                $endOfMonth->toDateTimeString(),
            ]);

        $kasMasukBulanIni = (float) (clone $queryKasBulanIni)
            ->where('jenis', 'masuk')
            ->sum('jumlah');

        $kasKeluarBulanIni = (float) (clone $queryKasBulanIni)
            ->where('jenis', 'keluar')
            ->sum('jumlah');

        $saldoKasBulanIni = $kasMasukBulanIni - $kasKeluarBulanIni;


        //pengganti
        $kasPerKategori = TransaksiKas::query()
            ->where('status', 'berhasil')
            ->whereBetween('tanggal', [
                $startOfMonth->toDateTimeString(),
                $endOfMonth->toDateTimeString(),
            ])
            ->selectRaw("
            kategori,
            SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) AS masuk,
            SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) AS keluar
        ")
            ->groupBy('kategori')
            ->get()
            ->keyBy('kategori');

        $kasMasukKategori = $kasPerKategori
            ->map(fn($item) => (float) $item->masuk)
            ->all();

        $kasKeluarKategori = $kasPerKategori
            ->map(fn($item) => (float) $item->keluar)
            ->all();


        $dataKasHarian = TransaksiKas::query()
            ->where('status', 'berhasil')
            ->whereBetween('tanggal', [
                $startOfMonth->toDateTimeString(),
                $endOfMonth->toDateTimeString(),
            ])
            ->selectRaw("
                DATE(tanggal) AS tanggal,
                SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) AS masuk,
                SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) AS keluar
            ")
            ->groupByRaw('DATE(tanggal)')
            ->orderByRaw('DATE(tanggal)')
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->tanggal)->toDateString();
            });

        $grafikKas = [];
        $tanggalIterasi = $startOfMonth->copy();

        while ($tanggalIterasi->lte($endOfMonth)) {
            $tanggal = $tanggalIterasi->toDateString();
            $data = $dataKasHarian->get($tanggal);

            $grafikKas[] = [
                'tanggal' => $tanggal,
                'label' => $tanggalIterasi->format('d'),
                'masuk' => (float) ($data->masuk ?? 0),
                'keluar' => (float) ($data->keluar ?? 0),
            ];

            $tanggalIterasi->addDay();
        }

        $transaksiKasTerbaru = TransaksiKas::query()
            ->leftJoin('users as anggota', 'anggota.id', '=', 'transaksi_kas.user_id')
            ->leftJoin('users as admin', 'admin.id', '=', 'transaksi_kas.by_admin')
            ->whereDate('transaksi_kas.tanggal', '<=', $tanggalAkhir)
            ->orderByDesc('transaksi_kas.tanggal')
            ->orderByDesc('transaksi_kas.id')
            ->limit(10)
            ->get([
                'transaksi_kas.id',
                'transaksi_kas.tanggal',
                'transaksi_kas.jenis',
                'transaksi_kas.kategori',
                'transaksi_kas.jumlah',
                'transaksi_kas.keterangan',
                'transaksi_kas.status',
                'anggota.name as nama_anggota',
                'admin.name as nama_admin',
            ])
            ->map(function ($transaksi) {
                return [
                    'id' => $transaksi->id,
                    'tanggal' => Carbon::parse($transaksi->tanggal)->toDateTimeString(),
                    // 'tanggal' => Carbon::parse($transaksi->tanggal)->format('d-m-Y'),
                    'jenis' => $transaksi->jenis,
                    'kategori' => $transaksi->kategori,
                    'jumlah' => (float) $transaksi->jumlah,
                    'keterangan' => $transaksi->keterangan,
                    'status' => $transaksi->status,
                    'user' => $transaksi->nama_anggota,
                    'admin' => $transaksi->nama_admin,
                ];
            });

        return Inertia::render('beranda/index', [
            'periode' => [
                'bulan' => $bulan,
                'tahun' => $tahun,
                'nama_bulan' => $startOfMonth->locale('id')->translatedFormat('F'),
            ],

            'pilihan_tahun' => range(
                min(2020, $tahun),
                max(now()->year, $tahun)
            ),

            'total_anggota' => $totalAnggota,
            'anggota_baru_bulan_ini' => $anggotaBaruBulanIni,

            'total_kas' => $saldoKas,
            'total_kas_masuk' => $totalKasMasuk,
            'total_kas_keluar' => $totalKasKeluar,

            'total_simpanan' => $totalSimpanan,
            'total_simpanan_wajib' => $totalSimpananWajib,
            'total_simpanan_sukarela' => $totalSimpananSukarela,
            'total_simpanan_modal' => $totalSimpananModal,
            'total_penarikan' => $totalPenarikan,

            'simpanan_bulan_ini' => [
                'wajib' => $simpananWajibBulanIni,
                'sukarela' => $simpananSukarelaBulanIni,
                'modal' => $simpananModalBulanIni,
                'penarikan' => $penarikanBulanIni,
                'total' => $totalSimpananBulanIni,
            ],

            'target_simpanan_wajib' => $targetSimpananWajib,
            'simpanan_wajib_bulan_ini' => $simpananWajibBulanIni,
            'persentase_simpanan_wajib' => $persentaseSimpananWajib,
            'kekurangan_simpanan_wajib' => $kekuranganSimpananWajib,

            'pinjaman' => [
                'aktif' => $totalPinjamanAktif,
                'lunas' => $totalPinjamanLunas,
                'macet' => $totalPinjamanMacet,
                'total_diberikan' => $totalNilaiPinjaman,
                'total_sisa' => $totalSisaPinjaman,
                'total_macet' => $totalNominalPinjamanMacet,
            ],

            'pinjaman_bulan_ini' => [
                'jumlah' => $jumlahPinjamanBulanIni,
                'total_diberikan' => $totalPinjamanBulanIni,
                'total_pokok' => $totalPokokPinjamanBulanIni,
                'rata_rata' => $rataRataPinjamanBulanIni,
                'keuntungan' => $keuntunganPinjamanBulanIni,
            ],

            'angsuran' => [
                'target' => $targetAngsuran,
                'sudah_bayar' => $jumlahSudahBayar,
                'belum_bayar' => $jumlahBelumBayar,

                'jumlah_target' => $jumlahJadwalAngsuranBulanIni,
                'jumlah_sudah_bayar' => $jumlahAngsuranTerbayarBulanIni,
                'jumlah_belum_bayar' => $jumlahAngsuranBelumBayarBulanIni,

                'persentase' => $persentaseAngsuran,
                'kekurangan' => $kekuranganAngsuran,

                'tunggakan' => $jumlahTunggakanCount,
                'jumlah_tunggakan' => $jumlahTunggakan,
            ],

            'kas_bulan_ini' => [
                'masuk' => $kasMasukBulanIni,
                'keluar' => $kasKeluarBulanIni,
                'bersih' => $saldoKasBulanIni,
            ],

            'kas_masuk_kategori' => $kasMasukKategori,
            'kas_keluar_kategori' => $kasKeluarKategori,

            'grafik_kas' => $grafikKas,
            'transaksi_terbaru' => $transaksiKasTerbaru,
        ]);
    }
}
