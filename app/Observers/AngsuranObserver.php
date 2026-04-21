<?php

namespace App\Observers;

use App\Models\Angsuran;
use App\Models\TransaksiKas;

class AngsuranObserver
{
    /**
     * Handle the Angsuran "created" event.
     */
    public function created(Angsuran $angsuran): void
    {
        //
    }

    /**
     * Handle the Angsuran "updated" event.
     */

    // public function updated(Angsuran $angsuran)
    // {
    //     if ($angsuran->isDirty('status') && $angsuran->status === 'sudah_bayar') {
    //         $sudahAda = TransaksiKas::where('ref_type', 'angsuran')->where('ref_id', $angsuran->id)->exists();

    //         if ($sudahAda) {
    //             return;
    //         }

    //         $realBayar = $angsuran->real_bayar ?? $angsuran->jumlah_bayar;
    //         $angsuranWajib = $angsuran->jumlah_bayar;
    //         $selisih = $realBayar - $angsuranWajib;

    //         TransaksiKas::create([
    //             'user_id' => $angsuran->user_id,
    //             'jenis' => 'masuk',
    //             'kategori' => 'angsuran',
    //             'jumlah' => $angsuranWajib,
    //             'keterangan' => 'Angsuran ke-' . $angsuran->angsuran_ke,
    //             'tanggal' => $angsuran->tanggal_bayar,
    //             'ref_type' => 'angsuran',
    //             'ref_id' => $angsuran->id,
    //             'status' => 'berhasil',
    //         ]);

    //         if ($selisih > 0) {
    //             TransaksiKas::create([
    //                 'user_id' => $angsuran->user_id,
    //                 'jenis' => 'masuk',
    //                 'kategori' => 'simpanan',
    //                 'jumlah' => $selisih,
    //                 'keterangan' => 'Simpanan sukarela dari kelebihan angsuran ke-' . $angsuran->angsuran_ke,
    //                 'tanggal' => $angsuran->tanggal_bayar,
    //                 'ref_type' => 'angsuran',
    //                 'ref_id' => $angsuran->id,
    //                 'status' => 'berhasil',
    //             ]);
    //         }
    //     }
    // }

    /**
     * Handle the Angsuran "deleted" event.
     */
    public function deleted(Angsuran $angsuran): void
    {
        //
    }

    /**
     * Handle the Angsuran "restored" event.
     */
    public function restored(Angsuran $angsuran): void
    {
        //
    }

    /**
     * Handle the Angsuran "force deleted" event.
     */
    public function forceDeleted(Angsuran $angsuran): void
    {
        //
    }
}


// public function updated(Angsuran $angsuran)
//     {
//         if ($angsuran->isDirty('status') && $angsuran->status === 'sudah_bayar') {
//             $sudahAda = TransaksiKas::where('ref_type', 'angsuran')->where('ref_id', $angsuran->id)->exists();

//             if ($sudahAda) {
//                 return;
//             }
//             TransaksiKas::create([
//                 'user_id' => $angsuran->user_id,
//                 'jenis' => 'masuk',
//                 'kategori' => 'angsuran',
//                 'jumlah' => $angsuran->jumlah_bayar,
//                 'keterangan' => 'Angsuran ke-' . $angsuran->angsuran_ke,
//                 'tanggal' => $angsuran->tanggal_bayar,
//                 'ref_type' => 'angsuran',
//                 'ref_id' => $angsuran->id,
//                 'status' => 'berhasil',
//             ]);
//         }
//     }
