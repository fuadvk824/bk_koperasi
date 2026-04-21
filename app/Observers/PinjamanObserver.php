<?php

namespace App\Observers;

use App\Models\Pinjaman;
use App\Models\TransaksiKas;
use Illuminate\Support\Facades\DB;

class PinjamanObserver
{
    // public function created(Pinjaman $pinjaman)
    // {
    //     TransaksiKas::create([
    //         'user_id' => $pinjaman->user_id,
    //         'jenis' => 'keluar',
    //         'kategori' => 'pinjaman',
    //         'jumlah' => $pinjaman->jumlah_pinjaman,
    //         'keterangan' => 'Pencairan pinjaman #' . $pinjaman->id,
    //         'tanggal' => $pinjaman->tanggal_pinjaman,
    //         'ref_type' => 'pinjaman',
    //         'ref_id' => $pinjaman->id,
    //         'status' => 'berhasil',
    //     ]);
    // }

    // public function updated(Pinjaman $pinjaman): void
    // {
    //     if (
    //         !$pinjaman->wasChanged('jumlah_pinjaman') &&
    //         !$pinjaman->wasChanged('bunga_persen') &&
    //         !$pinjaman->wasChanged('lama_angsuran') &&
    //         !$pinjaman->wasChanged('tanggal_pinjaman')
    //     ) {
    //         return;
    //     }

    //     DB::transaction(function () use ($pinjaman) {
    //         // 1. ambil transaksi lama
    //         $transaksiLama = TransaksiKas::where('ref_type', 'pinjaman')
    //             ->where('ref_id', $pinjaman->id)
    //             ->orderByDesc('id')
    //             ->first();

    //         if ($transaksiLama) {
    //             // reversal
    //             TransaksiKas::create([
    //                 'user_id' => $transaksiLama->user_id,
    //                 'jenis' => 'masuk',
    //                 'kategori' => 'pinjaman',
    //                 'jumlah' => $transaksiLama->jumlah,
    //                 'keterangan' => 'Reversal pinjaman #' . $pinjaman->id,
    //                 'tanggal' => now(),
    //                 'ref_type' => 'pinjaman_reversal', // ✅ beda
    //                 'ref_id' => $pinjaman->id,
    //                 'reversal_of' => $transaksiLama->id,
    //                 'status' => 'berhasil',
    //             ]);
    //         }

    //         // 2. buat transaksi BARU (pakai ref_type berbeda 🔥)
    //         TransaksiKas::create([
    //             'user_id' => $pinjaman->user_id,
    //             'jenis' => 'keluar',
    //             'kategori' => 'pinjaman',
    //             'jumlah' => $pinjaman->jumlah_pinjaman,
    //             'keterangan' => 'Update pinjaman #' . $pinjaman->id,
    //             'tanggal' => $pinjaman->tanggal_pinjaman,
    //             'ref_type' => 'pinjaman_update', // ✅ INI KUNCI NYA
    //             'ref_id' => $pinjaman->id,
    //             'status' => 'berhasil',
    //         ]);
    //     });
    // }

}
