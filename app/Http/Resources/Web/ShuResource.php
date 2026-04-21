<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShuResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'bulan' => $this->bulan,
            'tahun' => $this->tahun,

            'total_pokok' => (float) $this->total_pokok,
            'total_masuk' => (float) $this->total_masuk,
            'shu' => (float) $this->shu,
        ];
    }
}
