<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnggotaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $totalSimpanan = $this->simpanan_sum_jumlah ?? 0;
        $totalPinjaman = $this->pinjaman_sum_sisa_pinjaman ?? 0;

        return [
            'id' => $this->id,
            'office_id' => $this->office_id,
            'nama' => $this->name,

            'office_name' => optional($this->office)->name,

            'total_simpanan' => $totalSimpanan,
            'simpanan_wajib' => $this->simpanan_sum_simpanan_wajib ?? 0,
            'simpanan_sukarela' => $this->simpanan_sum_simpanan_sukarela ?? 0,
            'simpanan_modal' => $this->simpanan_sum_simpanan_modal ?? 0,

            'total_pinjaman' => $totalPinjaman,
            'total_angsuran' => $this->angsuran_sum_jumlah_bayar ?? 0,

             
            'sisa_simpanan' => $totalSimpanan - $totalPinjaman,
        ];
    }
}
