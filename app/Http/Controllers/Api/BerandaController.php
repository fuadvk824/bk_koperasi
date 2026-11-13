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
            ->where('status_approval', 'disetujui')
            ->sum('jumlah');

        $transaksi = DB::table('transaksi_kas')
            ->where('user_id', $user->id)
            ->where('status', 'berhasil')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->limit(5)
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
            ],
            'transaksi' => $transaksi,
        ]);
    }

    public function aktivitas(Request $request)
    {
        $user = $request->user();

        $perPage = 5;

        $transaksi = DB::table('transaksi_kas')
            ->where('user_id', $user->id)
            ->where('status', 'berhasil')
            ->orderByDesc('tanggal')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->through(function ($item) {
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

        return response()->json($transaksi);
    }
}
