<?php

namespace App\Observers;

use App\Models\Simpanan;
use App\Models\TransaksiKas;
use Illuminate\Support\Facades\DB;

class SimpananObserver
{
    // public function created(Simpanan $simpanan)
    // {
    //     if ($simpanan->jenis !== 'wajib') {
    //         return;
    //     }

    //     TransaksiKas::create([
    //         'user_id' => $simpanan->user_id,
    //         'jenis' => 'masuk',
    //         'kategori' => 'simpanan',
    //         'jumlah' => $simpanan->jumlah,
    //         'keterangan' => 'Simpanan ' . $simpanan->jenis,
    //         'tanggal' => $simpanan->tanggal,
    //         'ref_type' => 'simpanan',
    //         'ref_id' => $simpanan->id,
    //         'status' => 'berhasil',
    //     ]);
    // }

    // public function updated(Simpanan $simpanan): void
    // {
    //     if (!$simpanan->wasChanged('jumlah') && !$simpanan->wasChanged('jenis') && !$simpanan->wasChanged('tanggal')) {
    //         return;
    //     }

    //     DB::transaction(function () use ($simpanan) {
    //         //ambil transaksi asli (bukan reversal)
    //         $transaksiLama = TransaksiKas::where('ref_type', 'simpanan')
    //             ->where('ref_id', $simpanan->id)
    //             ->orderByDesc('id')
    //             ->first();

    //         if (!$transaksiLama) {
    //             //kalau data tidak ditemukan, buat ulang saja
    //             TransaksiKas::create([
    //                 'user_id' => $simpanan->user_id,
    //                 'jenis' => 'masuk',
    //                 'kategori' => 'simpanan',
    //                 'jumlah' => $simpanan->jumlah,
    //                 'keterangan' => 'Simpanan (recreate)',
    //                 'tanggal' => $simpanan->tanggal,
    //                 'ref_type' => 'simpanan',
    //                 'ref_id' => $simpanan->id,
    //                 'status' => 'berhasil',
    //             ]);

    //             return;
    //         }

    //         //reversal transaksi lama
    //         TransaksiKas::create([
    //             'user_id' => $transaksiLama->user_id,
    //             'jenis' => 'keluar',
    //             'kategori' => 'simpanan',
    //             'jumlah' => $transaksiLama->jumlah,
    //             'keterangan' => 'Reversal simpanan #' . $simpanan->id,
    //             'tanggal' => now(),
    //             'ref_type' => 'simpanan_reversal',
    //             'ref_id' => $simpanan->id,
    //             'reversal_of' => $transaksiLama->id,
    //             'status' => 'berhasil',
    //         ]);

    //         //transaksi baru
    //         TransaksiKas::create([
    //             'user_id' => $simpanan->user_id,
    //             'jenis' => 'masuk',
    //             'kategori' => 'simpanan',
    //             'jumlah' => $simpanan->jumlah,
    //             'keterangan' => 'Update simpanan #' . $simpanan->id,
    //             'tanggal' => $simpanan->tanggal,
    //             'ref_type' => 'simpanan',
    //             'ref_id' => $simpanan->id,
    //             'status' => 'berhasil',
    //         ]);
    //     });
    // }
}
