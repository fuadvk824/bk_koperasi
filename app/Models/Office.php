<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    protected $fillable = ['office_code', 'name', 'image', 'address', 'phone', 'city', 'province', 'poscode', 'status'];

    public function users()
    {
        return $this->hasMany(User::class);
    }
}