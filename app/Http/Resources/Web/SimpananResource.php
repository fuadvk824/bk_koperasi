<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimpananResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nama_user' => $this->user?->name,
            'jenis' => $this->jenis,
            'jumlah' => (float) $this->jumlah,
            'tanggal' => $this->tanggal->format('Y-m-d'),
        ];
    }
}