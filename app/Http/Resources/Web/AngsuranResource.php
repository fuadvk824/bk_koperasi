<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AngsuranResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pinjaman_id' => $this->pinjaman_id,
            'nama_user' => $this->user->name,

            'angsuran_ke' => $this->angsuran_ke,

            'dana_pinjaman' => $this->dana_pinjaman,
            'jumlah_bayar' => $this->jumlah_bayar,
            'real_bayar' => $this->real_bayar,

            'bulan' => $this->bulan,
            'tahun' => $this->tahun,

            'bulan' => $this->nama_bulan, //dari assessor getNamaBulanAttribute di model Angsuran
            'tahun' => $this->tahun,
            'periode' => $this->nama_bulan . ' ' . $this->tahun,
            'tanggal_bayar' => optional($this->tanggal_bayar)->format('Y-m-d') ?? '-',

            'status' => $this->status,

        ];
    }
}
