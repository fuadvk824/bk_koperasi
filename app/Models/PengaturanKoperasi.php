<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaturanKoperasi extends Model
{
    protected $table = 'pengaturan_koperasi';

    protected $fillable = [
        'simpanan_wajib',
        'bunga_pinjaman',
        'berlaku_mulai',
        'berlaku_sampai',
    ];

    protected $casts = [
        'simpanan_wajib' => 'decimal:2',
        'bunga_pinjaman' => 'decimal:2',
        'berlaku_mulai' => 'date',
        'berlaku_sampai' => 'date',
    ];
    public function scopeBerlakuPada($query, $tanggal)
    {
        return $query
            ->whereDate('berlaku_mulai', '<=', $tanggal)
            ->where(function ($query) use ($tanggal) {
                $query->whereNull('berlaku_sampai')
                    ->orWhereDate('berlaku_sampai', '>=', $tanggal);
            });
    }

    
}
