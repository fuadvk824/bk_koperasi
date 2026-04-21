<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pinjaman extends Model
{
    use HasFactory;

    protected $table = 'pinjaman';

    protected $fillable = [
        'user_id',
        'jumlah_pinjaman',
        'bunga_persen',
        'total_pinjaman',
        'sisa_pinjaman',
        'lama_angsuran',
        'angsuran_per_bulan',
        'angsuran_bulan_terakhir',
        'tanggal_pinjaman',
        'jatuh_tempo_terakhir',
        'status',
    ];

    protected $casts = [
        'jumlah_pinjaman' => 'decimal:2',
        'bunga_persen' => 'decimal:2',
        'total_pinjaman' => 'decimal:2',
        'angsuran_per_bulan' => 'decimal:2',
        'tanggal_pinjaman' => 'date',
        'jatuh_tempo_terakhir' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function angsuran()
    {
        return $this->hasMany(Angsuran::class);
    }

    public function angsuranTerbayar()
    {
        return $this->angsuran()->where('status', 'sudah_bayar');
    }

    public function sisaAngsuran()
    {
        return $this->lama_angsuran - $this->angsuranTerbayar()->count();
    }
}
