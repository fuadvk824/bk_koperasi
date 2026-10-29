<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DevAktiflamaDatabaruResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'status' => $this->status,
            'active_at' => $this->active_at,
            'inactive_at' => $this->inactive_at,
            'tanggal_simpanan' => $this->tanggal_simpanan,
            'tanggal_pinjaman' => $this->tanggal_pinjaman,
            'tanggal_transaksi_kas' => $this->tanggal_transaksi_kas,
            'tandai' => $this->tandai,
        ];
    }
}
