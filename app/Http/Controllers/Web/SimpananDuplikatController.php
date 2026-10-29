<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Resources\Web\SimpananDuplikatResource;
use App\Models\Simpanan;
use App\Models\TransaksiKas;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SimpananDuplikatController extends Controller
{
    
public function index(Request $request)
{
    $request->validate([
        'tahun' => ['nullable', 'integer', 'min:2000', 'max:2100'],
        'bulan' => ['nullable', 'integer', 'between:1,12'],
        'perPage' => ['nullable', 'integer', 'in:10,25,50,100'],
        'jenis' => ['nullable', 'in:all,wajib,sukarela,modal,penarikan'],
        'mode' => ['nullable', 'in:duplikat,belum-bayar'],
    ]);

    $tahun = (int) $request->input('tahun', now()->year);
    $bulan = (int) $request->input('bulan', now()->month);
    $perPage = (int) $request->input('perPage', 10);
    $jenis = $request->input('jenis', 'wajib');
    $mode = $request->input('mode', 'duplikat');

    $tanggalAwal = Carbon::create($tahun, $bulan, 1)->startOfMonth();
    $tanggalAkhir = $tanggalAwal->copy()->endOfMonth();

    if ($mode === 'belum-bayar') {
        $anggota = DB::table('users')
            ->whereNotNull('users.active_at')
            ->whereDate('users.active_at', '<=', $tanggalAkhir)
            ->where(function ($query) use ($tanggalAkhir) {
                $query->whereNull('users.inactive_at')
                    ->orWhereDate('users.inactive_at', '>', $tanggalAkhir);
            })
            ->whereNotExists(function ($query) use (
                $tahun,
                $bulan,
                $jenis
            ) {
                $query->selectRaw('1')
                    ->from('simpanan')
                    ->whereColumn('simpanan.user_id', 'users.id')
                    ->whereYear('simpanan.tanggal', $tahun)
                    ->whereMonth('simpanan.tanggal', $bulan)
                    ->when($jenis !== 'all', function ($query) use ($jenis) {
                        $query->where('simpanan.jenis', $jenis);
                    });
            })
            ->select([
                'users.id',
                'users.name',
                'users.active_at',
            ])
            ->orderBy('users.name')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render(
            'developer/simpanan-duplikat/index',
            [
                'simpanan' => [
                    'data' => $anggota->items(),
                    'links' => $anggota->linkCollection()->toArray(),
                    'meta' => [
                        'current_page' => $anggota->currentPage(),
                        'last_page' => $anggota->lastPage(),
                        'per_page' => $anggota->perPage(),
                        'total' => $anggota->total(),
                        'from' => $anggota->firstItem(),
                        'to' => $anggota->lastItem(),
                    ],
                ],
                'filters' => compact(
                    'tahun',
                    'bulan',
                    'perPage',
                    'jenis',
                    'mode'
                ),
                'tahunOptions' => range(now()->year, 2020),
            ]
        );
    }

    // Mode simpanan ganda: gunakan query duplikat yang sudah ada.
    $duplikat = DB::table('simpanan')
        ->select('user_id')
        ->selectRaw('YEAR(tanggal) AS tahun')
        ->selectRaw('MONTH(tanggal) AS bulan')
        ->whereYear('tanggal', $tahun)
        ->groupBy(
            'user_id',
            DB::raw('YEAR(tanggal)'),
            DB::raw('MONTH(tanggal)')
        )
        ->havingRaw('COUNT(*) > 1');
    $data = Simpanan::query()
        ->joinSub($duplikat, 'duplikat', function ($join) {
            $join->on('simpanan.user_id', '=', 'duplikat.user_id')
                ->whereRaw('YEAR(simpanan.tanggal) = duplikat.tahun')
                ->whereRaw('MONTH(simpanan.tanggal) = duplikat.bulan');
        })
        ->leftJoin('transaksi_kas', function ($join) {
            $join->on('transaksi_kas.ref_id', '=', 'simpanan.id')
                ->where('transaksi_kas.kategori', '=', 'simpanan');
        })
        ->with('user:id,name')
        ->select([
            'simpanan.*',
            'transaksi_kas.id as transaksi_kas_id',
            'transaksi_kas.tanggal as transaksi_kas_tanggal',
        ])
        ->when($jenis !== 'all', function ($query) use ($jenis) {
            $query->where('simpanan.jenis', $jenis);
        })
        ->orderBy('simpanan.user_id')
        ->orderBy('simpanan.tanggal')
        ->orderBy('simpanan.id')
        ->paginate($perPage)
        ->withQueryString();

    // Pertahankan pengolahan bulan_tersedia dari kode sebelumnya di sini.

    return Inertia::render(
        'developer/simpanan-duplikat/index',
        [
            'simpanan' => SimpananDuplikatResource::collection(
                $data
            )->response()->getData(true),
            'filters' => compact(
                'tahun',
                'bulan',
                'perPage',
                'jenis',
                'mode'
            ),
            'tahunOptions' => range(now()->year, 2020),
        ]
    );
}

    // public function index(Request $request)
    // {
    //     $request->validate([
    //         'tahun' => ['nullable', 'integer', 'min:2000', 'max:2100'],
    //         'perPage' => ['nullable', 'integer', 'in:10,25,50,100'],
    //         'jenis' => ['nullable', 'in:wajib,sukarela,modal,penarikan'],
    //     ]);

    //     $tahun = (int) $request->input('tahun', now()->year);
    //     $perPage = (int) $request->input('perPage', 10);
    //     $jenis = $request->input('jenis');

    //     // Cari anggota yang mempunyai lebih dari satu
    //     // data simpanan pada bulan yang sama.
    //     $duplikat = DB::table('simpanan')
    //         ->select('user_id')
    //         ->selectRaw('YEAR(tanggal) AS tahun')
    //         ->selectRaw('MONTH(tanggal) AS bulan')
    //         ->whereYear('tanggal', $tahun)
    //         ->groupBy(
    //             'user_id',
    //             DB::raw('YEAR(tanggal)'),
    //             DB::raw('MONTH(tanggal)')
    //         )
    //         ->havingRaw('COUNT(*) > 1');
    //     $data = Simpanan::query()
    //         ->joinSub($duplikat, 'duplikat', function ($join) {
    //             $join->on(
    //                 'simpanan.user_id',
    //                 '=',
    //                 'duplikat.user_id'
    //             )
    //                 ->whereRaw(
    //                     'YEAR(simpanan.tanggal) = duplikat.tahun'
    //                 )
    //                 ->whereRaw(
    //                     'MONTH(simpanan.tanggal) = duplikat.bulan'
    //                 );
    //         })
    //         ->leftJoin('transaksi_kas', function ($join) {
    //             $join->on(
    //                 'transaksi_kas.ref_id',
    //                 '=',
    //                 'simpanan.id'
    //             )->where(
    //                 'transaksi_kas.kategori',
    //                 '=',
    //                 'simpanan'
    //             );
    //         })
    //         ->with('user:id,name')
    //         ->select([
    //             'simpanan.*',
    //             'transaksi_kas.id as transaksi_kas_id',
    //             'transaksi_kas.tanggal as transaksi_kas_tanggal',
    //         ])->when($jenis, function ($query) use ($jenis) {
    //             $query->where('simpanan.jenis', $jenis);
    //         })
    //         ->orderBy('simpanan.user_id')
    //         ->orderBy('simpanan.tanggal')
    //         ->orderBy('simpanan.id')
    //         ->paginate($perPage)
    //         ->withQueryString();

    //     /*
    //      * Ambil bulan yang sudah digunakan oleh anggota
    //      * pada halaman ini. Satu query untuk semua anggota.
    //      */
    //     $userIds = $data->getCollection()
    //         ->pluck('user_id')
    //         ->unique()
    //         ->values();

    //     $bulanTerpakai = DB::table('simpanan')
    //         ->select('user_id')
    //         ->selectRaw('MONTH(tanggal) AS bulan')
    //         ->whereIn('user_id', $userIds)
    //         ->whereYear('tanggal', $tahun)
    //         ->groupBy('user_id', DB::raw('MONTH(tanggal)'))
    //         ->get()
    //         ->groupBy('user_id')
    //         ->map(fn($items) => $items
    //             ->pluck('bulan')
    //             ->map(fn($bulan) => (int) $bulan)
    //             ->all());

    //     $namaBulan = [
    //         1 => 'Januari',
    //         2 => 'Februari',
    //         3 => 'Maret',
    //         4 => 'April',
    //         5 => 'Mei',
    //         6 => 'Juni',
    //         7 => 'Juli',
    //         8 => 'Agustus',
    //         9 => 'September',
    //         10 => 'Oktober',
    //         11 => 'November',
    //         12 => 'Desember',
    //     ];

    //     // Sisipkan props bulan_tersedia ke setiap model.
    //     $data->getCollection()->transform(function ($item) use (
    //         $bulanTerpakai,
    //         $namaBulan
    //     ) {
    //         $terpakai = $bulanTerpakai->get(
    //             $item->user_id,
    //             []
    //         );

    //         $tersedia = [];

    //         foreach ($namaBulan as $nomor => $nama) {
    //             if (! in_array($nomor, $terpakai, true)) {
    //                 $tersedia[] = [
    //                     'bulan' => $nomor,
    //                     'nama' => $nama,
    //                     'tahun' => Carbon::parse(
    //                         $item->tanggal
    //                     )->year,
    //                 ];
    //             }
    //         }

    //         $item->setAttribute('bulan_tersedia', $tersedia);

    //         return $item;
    //     });

    //     return Inertia::render(
    //         'developer/simpanan-duplikat/index',
    //         [
    //             'simpanan' => SimpananDuplikatResource::collection(
    //                 $data
    //             )->response()->getData(true),

    //             'filters' => [
    //                 'tahun' => $tahun,
    //                 'perPage' => $perPage,
    //                 'jenis' => $jenis,
    //             ],
    //             'tahunOptions' => range(now()->year, 2020),
    //         ]
    //     );
    // }

     
    public function update(Request $request, Simpanan $simpanan)
    {
        $validated = $request->validate([
            'bulan' => ['required', 'integer', 'between:1,12'],
        ]);

        $bulanTujuan = (int) $validated['bulan'];

        DB::transaction(function () use (
            $simpanan,
            $bulanTujuan
        ) {
            $data = Simpanan::query()
                ->whereKey($simpanan->id)
                ->lockForUpdate()
                ->firstOrFail();

            $tanggalLama = Carbon::parse($data->tanggal);
            $tahun = $tanggalLama->year;

            if ($bulanTujuan === $tanggalLama->month) {
                throw ValidationException::withMessages([
                    'bulan' => 'Pilih bulan yang berbeda dari bulan asal.',
                ]);
            }

            // Pastikan tidak ada simpanan lain milik anggota
            // tersebut pada bulan dan tahun tujuan.
            $duplikat = Simpanan::query()
                ->where('user_id', $data->user_id)
                ->whereYear('tanggal', $tahun)
                ->whereMonth('tanggal', $bulanTujuan)
                ->where('id', '!=', $data->id)
                ->exists();

            if ($duplikat) {
                throw ValidationException::withMessages([
                    'bulan' => 'Anggota sudah memiliki simpanan pada bulan tersebut.',
                ]);
            }

            $jumlahHariTujuan = Carbon::create(
                $tahun,
                $bulanTujuan,
                1
            )->daysInMonth;

            $tanggalBaru = $tanggalLama->copy()->setDate(
                $tahun,
                $bulanTujuan,
                min($tanggalLama->day, $jumlahHariTujuan)
            );

            // Hanya tanggal simpanan yang diubah.
            $data->tanggal = $tanggalBaru->toDateString();
            $data->save();

            // Ubah bulan transaksi kas yang merujuk simpanan ini.
            $transaksiKas = TransaksiKas::query()
                ->where('ref_id', $data->id)
                ->where('kategori', 'simpanan')
                ->lockForUpdate()
                ->get();

            foreach ($transaksiKas as $kas) {
                $tanggalKasLama = Carbon::parse($kas->tanggal);

                $hariKas = min(
                    $tanggalKasLama->day,
                    $jumlahHariTujuan
                );

                // Pertahankan tahun, jam, menit, dan detik transaksi kas.
                $kas->tanggal = $tanggalKasLama->copy()->setDate(
                    $tanggalKasLama->year,
                    $bulanTujuan,
                    $hariKas
                );

                $kas->save();
            }
        });

        return back()->with(
            'success',
            'Tanggal simpanan dan transaksi kas berhasil diperbarui.'
        );
    }
}
