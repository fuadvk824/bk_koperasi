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

            'tahun' => $this->tahun,
            'bulan' => $this->nama_bulan, //dari assessor getNamaBulanAttribute di model Angsuran
            'periode' => $this->nama_bulan . ' ' . $this->tahun,
            'tanggal_bayar' => optional($this->tanggal_bayar)->format('Y-m-d') ?? '-',

            'status' => $this->status,
            'status_approval' => $this->status_approval,
            'catatan_approval' => $this->catatan_approval,
            'bukti_transfer' => $this->bukti_transfer ? asset('storage/' . $this->bukti_transfer) : null,

            'is_last_installment' => (bool) $this->is_last_installment,
            'has_unpaid_previous' => (bool) $this->has_unpaid_previous,
        ];
    }
}
