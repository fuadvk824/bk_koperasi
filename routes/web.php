<?php

use App\Http\Controllers\Web\AnggotaController;
use App\Http\Controllers\Web\AngsuranController;
use App\Http\Controllers\Web\BerandaController;
use App\Http\Controllers\Web\PinjamanController;
use App\Http\Controllers\Web\SimpananController;
use App\Http\Controllers\Web\TransaksiKasController;
use App\Http\Controllers\Web\UserController;
use App\Http\Controllers\Web\UserPreferenceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [BerandaController::class, 'index'])->name('dashboard');
    Route::get('/user/bg', [UserPreferenceController::class, 'show']);
    Route::post('/user/bg', [UserPreferenceController::class, 'update']);

    Route::middleware(['role:user'])->group(function () {
        Route::prefix('dashboardKoperasi')
            ->name('dashboardKoperasi.')
            ->group(function () {
                Route::get('/', function () {
                    return Inertia::render('member/index');
                })->name('index');
            });
    });
    Route::middleware(['role:super-admin|admin'])->group(function () {
        Route::prefix('userManagement')
            ->name('userManagement.')
            ->group(function () {
                Route::get('/', [UserController::class, 'index'])->name('index');

                Route::put('/{user}/update', [UserController::class, 'update'])->name('update');
            });
    });
    Route::middleware(['role:super-admin|admin'])->group(function () {
        Route::prefix('simpanan')
            ->name('simpanan.')
            ->group(function () {
                Route::get('/', [SimpananController::class, 'index'])->name('index');
                Route::post('/', [SimpananController::class, 'store'])->name('store');
                Route::put('/{simpanan}', [SimpananController::class, 'update'])->name('update');
                Route::delete('/{simpanan}', [SimpananController::class, 'destroy'])->name('destroy');
            });
        Route::prefix('anggota')
            ->name('anggota.')
            ->group(function () {
                Route::get('/', [AnggotaController::class, 'index'])->name('index');

                Route::post('/{user}/keluar', [AnggotaController::class, 'keluar'])
                    ->name('keluar');
            });

        Route::prefix('pinjaman')
            ->name('pinjaman.')
            ->group(function () {
                Route::get('/', [PinjamanController::class, 'index'])->name('index');
                Route::post('/', [PinjamanController::class, 'store'])->name('store');
                Route::put('/{pinjaman}', [PinjamanController::class, 'update'])->name('update');
                Route::delete('/{pinjaman}', [PinjamanController::class, 'destroy'])->name('destroy');
            });

        Route::prefix('angsuran')
            ->name('angsuran.')
            ->group(function () {
                Route::get('/', [AngsuranController::class, 'index'])->name('index');
                Route::patch('/{angsuran}/status', [AngsuranController::class, 'updateStatus'])->name('updateStatus');
            });

        Route::prefix('transaksikas')
            ->name('transaksikas.')
            ->group(function () {
                Route::get('/', [TransaksiKasController::class, 'index'])->name('index');
                Route::post('/', [TransaksiKasController::class, 'store'])->name('store');
            });
    });

  
});

require __DIR__ . '/settings.php';

