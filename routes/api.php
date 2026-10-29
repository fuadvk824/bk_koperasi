<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BerandaController;
use App\Http\Controllers\Api\SimpananController;
use App\Http\Controllers\Api\PinjamanController;
use App\Http\Controllers\Api\AngsuranController;

// Endpoint publik
Route::post('/login', [AuthController::class, 'login']);

// Endpoint yang wajib memakai token Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/beranda', [BerandaController::class, 'index']);

    Route::get('/simpanan', [SimpananController::class, 'index']);
    Route::get('/simpanan/{id}', [SimpananController::class, 'show']);
    Route::post('/simpanan/pengajuan', [
        SimpananController::class,
        'store',
    ]);

    Route::get('/pinjaman', [PinjamanController::class, 'index']);
    Route::get('/pengaturan/bunga-pinjaman', [PinjamanController::class, 'bungaPinjaman']);
    Route::post('/pinjaman/pengajuan', [PinjamanController::class, 'store']);

    Route::get('/angsuran', [AngsuranController::class, 'index']);
    Route::get('/angsuran/{id}', [AngsuranController::class, 'show']);
});
