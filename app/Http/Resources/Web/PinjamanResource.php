<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PinjamanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),

            'jumlah_pinjaman' => $this->jumlah_pinjaman,
            'total_pinjaman' => $this->total_pinjaman,
            'sisa_pinjaman' => $this->sisa_pinjaman,
            'angsuran_per_bulan' => $this->angsuran_per_bulan,
            'angsuran_bulan_terakhir' => $this->angsuran_bulan_terakhir,

            'bunga_persen' => (float) $this->bunga_persen,
            'lama_angsuran' => $this->lama_angsuran, 

            'tanggal_pinjaman' => $this->tanggal_pinjaman->format('Y-m-d'),
            'jatuh_tempo_terakhir' => $this->jatuh_tempo_terakhir->format('Y-m-d'), 

            'status' => $this->status,
        ];
    }
}