<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';

    protected $fillable = ['by_admin', 'user_id', 'jenis_update', 'old', 'new'];

    protected $casts = [
        'old' => 'array',
        'new' => 'array',
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
