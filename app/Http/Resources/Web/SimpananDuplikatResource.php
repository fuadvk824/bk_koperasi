<?php

namespace App\Http\Resources\Web;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimpananDuplikatResource extends JsonResource
{
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

            'user_id' => $this->user_id,
            'jenis' => $this->jenis,
            'jumlah' => (float) $this->jumlah,

            'tanggal' => Carbon::parse($this->tanggal)
                ->format('Y-m-d'),

            'created_at' => $this->created_at?->toISOString(),

            'transaksi_kas_id' => $this->transaksi_kas_id,

            'transaksi_kas_tanggal' => $this->transaksi_kas_tanggal
                ? Carbon::parse($this->transaksi_kas_tanggal)
                    ->format('Y-m-d')
                : null,

            'bulan_tersedia' => $this->bulan_tersedia ?? [],
        ];
    }
}
