<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppVersion extends Model
{
    protected $fillable = [
        'version',
        'apk_url',
        // 'apk_arm64',
        // 'apk_v7a',
        'force_update',
        'message',
    ];

    protected $casts = [
        'force_update' => 'boolean',
    ];
}
