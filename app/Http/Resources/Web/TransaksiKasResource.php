<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransaksiKasResource extends JsonResource
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

            'by_admin' => $this->by_admin,
            'admin' => $this->whenLoaded('admin', function () {
                return [
                    'id' => $this->admin->id,
                    'name' => $this->admin->name,
                ];
            }),

            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),

            'jenis' => $this->jenis,
            'kategori' => $this->kategori,

            'jumlah' => (float) $this->jumlah,

            'keterangan' => $this->keterangan,
            'tanggal' => $this->tanggal->format('Y-m-d'),

            'ref_type' => $this->ref_type,
            'ref_id' => $this->ref_id,
            'status' => $this->status,
        ];
    }
}
