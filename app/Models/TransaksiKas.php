<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransaksiKas extends Model
{
    protected $table = 'transaksi_kas';

    protected $fillable = [
        'by_admin',
        'user_id',
        'jenis',
        'kategori',
        'jumlah',
        'keterangan',
        'tanggal',
        'ref_id',
        'ref_type',
        'reversal_of',
        'status',
    ];

    protected $casts = [
        'tanggal' => 'datetime:Y-m-d',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'by_admin');
    }
}
