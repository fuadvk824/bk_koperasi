<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BerandaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $totalSimpanan = DB::table('simpanan')
            ->where('user_id', $user->id)
            ->sum('jumlah');

        $totalPinjaman = DB::table('pinjaman')
            ->where('user_id', $user->id)
            ->sum('total_pinjaman');

        $sisaPinjaman = DB::table('pinjaman')
            ->where('user_id', $user->id)
            ->where('status', 'aktif')
            ->sum('sisa_pinjaman');

        $transaksi = DB::table('transaksi_kas')
            ->where('user_id', $user->id)
            ->where('status', 'berhasil')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'judul' => $item->keterangan
                        ?? ucfirst($item->kategori),
                    'tanggal' => $item->tanggal,
                    'jumlah' => (float) $item->jumlah,
                    'masuk' => $item->jenis === 'masuk',
                    'kategori' => $item->kategori,
                ];
            });

        return response()->json([
            'anggota' => [
                'id' => $user->id,
                'nama' => $user->name,
                'nomor_anggota' => $user->nomor_anggota,
            ],
            'ringkasan' => [
                'total_simpanan' => (float) $totalSimpanan,
                'shu' => 0,
                'total_pinjaman' => (float) $totalPinjaman,
                'sisa_pinjaman' => (float) $sisaPinjaman,
            ],
            'transaksi' => $transaksi,
        ]);
    }
}
