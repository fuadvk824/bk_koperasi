<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
 

class PinjamanController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $pinjaman = DB::table('pinjaman')
            ->where('user_id', $userId)
            ->orderByRaw("
            CASE
                WHEN status_approve = 'menunggu' THEN 0
                WHEN status_approve = 'disetujui'
                    AND status = 'aktif' THEN 1
                ELSE 2
            END
        ")
            ->orderByDesc('id')
            ->first();

        // Ringkasan hanya menghitung pinjaman yang sudah disetujui.
        $pinjamanDisetujui = DB::table('pinjaman')
            ->where('user_id', $userId)
            ->where('status_approve', 'disetujui');

        $ringkasan = [
            'total_pinjaman' => (float) (clone $pinjamanDisetujui)
                ->sum('total_pinjaman'),

            'sisa_pinjaman' => (float) (clone $pinjamanDisetujui)
                ->where('status', 'aktif')
                ->sum('sisa_pinjaman'),

            'jumlah_pinjaman_aktif' => (clone $pinjamanDisetujui)
                ->where('status', 'aktif')
                ->count(),
        ];

        return response()->json([
            'data' => $pinjaman ? [
                'id' => $pinjaman->id,
                'jumlah_pinjaman' => (float) $pinjaman->jumlah_pinjaman,
                'bunga_persen' => (float) $pinjaman->bunga_persen,
                'total_pinjaman' => (float) $pinjaman->total_pinjaman,
                'sisa_pinjaman' => (float) $pinjaman->sisa_pinjaman,
                'lama_angsuran' => $pinjaman->lama_angsuran,
                'angsuran_per_bulan' => (float) $pinjaman->angsuran_per_bulan,
                'angsuran_bulan_terakhir' => (float) $pinjaman->angsuran_bulan_terakhir,
                'tanggal_pinjaman' => $pinjaman->tanggal_pinjaman,
                'jatuh_tempo_terakhir' => $pinjaman->jatuh_tempo_terakhir,

                // Dua status ini yang membedakan pengajuan dan pinjaman berjalan.
                'status' => $pinjaman->status,
                'status_approve' => $pinjaman->status_approve,
            ] : null,

            'ringkasan' => $ringkasan,
        ]);
    }

    public function bungaPinjaman()
    {
        $tanggal = now()->toDateString();

        $pengaturan = DB::table('pengaturan_koperasi')
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('berlaku_mulai')
                    ->orWhereDate('berlaku_mulai', '<=', $tanggal);
            })
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $tanggal);
            })
            ->orderByRaw('berlaku_mulai IS NULL ASC')
            ->orderByDesc('berlaku_mulai')
            ->orderByDesc('id')
            ->first();

        return response()->json([
            'data' => [
                'bunga_pinjaman' => (float) (
                    $pengaturan->bunga_pinjaman ?? 0
                ),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'jumlah_pinjaman' => [
                'required',
                'integer',
            ],
            'lama_angsuran' => [
                'required',
                'integer',
            ],
        ]);

        $userId = $request->user()->id;

        $pinjaman = DB::transaction(function () use (
            $validated,
            $userId
        ) {
            // Kunci baris anggota agar pengajuan bersamaan dapat
            // diperiksa secara berurutan.
            $anggota = DB::table('users')
                ->where('id', $userId)
                ->lockForUpdate()
                ->first();

            if (
                ! $anggota ||
                $anggota->status !== 'active' ||
                $anggota->active_at === null
            ) {
                abort(403, 'Hanya anggota aktif yang dapat mengajukan pinjaman.');
            }

            // Cegah pengajuan baru selama masih ada pengajuan menunggu
            // atau pinjaman yang sudah disetujui dan masih aktif.
            $adaPengajuan = DB::table('pinjaman')
                ->where('user_id', $userId)
                ->where(function ($query) {
                    $query->where('status_approve', 'menunggu')
                        ->orWhere(function ($q) {
                            $q->where('status_approve', 'disetujui')
                                ->where('status', 'aktif');
                        });
                })
                ->exists();

            if ($adaPengajuan) {
                abort(
                    422,
                    'Kamu masih memiliki pengajuan yang menunggu '
                        . 'persetujuan atau pinjaman aktif.'
                );
            }

            $tanggal = now()->toDateString();

            $pengaturan = DB::table('pengaturan_koperasi')
                ->where(function ($query) use ($tanggal) {
                    $query->whereNull('berlaku_mulai')
                        ->orWhereDate('berlaku_mulai', '<=', $tanggal);
                })
                ->where(function ($query) use ($tanggal) {
                    $query->whereNull('berlaku_sampai')
                        ->orWhereDate('berlaku_sampai', '>=', $tanggal);
                })
                ->orderByRaw('berlaku_mulai IS NULL ASC')
                ->orderByDesc('berlaku_mulai')
                ->orderByDesc('id')
                ->first();

            if (! $pengaturan) {
                abort(
                    422,
                    'Pengaturan bunga pinjaman belum tersedia untuk tanggal ini.'
                );
            }

            $jumlah = (int) $validated['jumlah_pinjaman'];
            $tenor = (int) $validated['lama_angsuran'];
            $bungaPersen = (float) $pengaturan->bunga_pinjaman;

            if ($bungaPersen < 0) {
                abort(422, 'Pengaturan bunga pinjaman tidak valid.');
            }

            // Samakan rumus dengan kalkulator dan proses pinjaman yang ada.
            $totalBunga = ($jumlah * $bungaPersen) / 100;
            $total = $jumlah + $totalBunga;

            $angsuranNormal = floor(($total / $tenor) / 100) * 100;
            $totalAngsuranNormal = $angsuranNormal * $tenor;
            $sisaPembulatan = $total - $totalAngsuranNormal;

            $pokokNormal = floor(($jumlah / $tenor) / 100) * 100;

            $totalPokokNormal = $pokokNormal * $tenor;

            return DB::table('pinjaman')->insertGetId([
                'user_id' => $userId,
                'jumlah_pinjaman' => $jumlah,
                'bunga_persen' => $bungaPersen,
                'total_pinjaman' => $total,
                'sisa_pinjaman' => $total,
                'lama_angsuran' => $tenor,
                'angsuran_per_bulan' => $angsuranNormal,
                'angsuran_bulan_terakhir' => $angsuranNormal
                    + $sisaPembulatan,
                'tanggal_pinjaman' => $tanggal,
                'jatuh_tempo_terakhir' => null,
                'status' => 'aktif',
                'status_approve' => 'menunggu',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Pengajuan pinjaman berhasil dikirim dan menunggu persetujuan admin.',
            'data' => DB::table('pinjaman')->where('id', $pinjaman)->first(),
        ], 201);
    }
}
