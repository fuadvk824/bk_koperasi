<?php

namespace App\Providers;

use App\Models\Angsuran;
use App\Models\Pinjaman;
use App\Models\Simpanan;
use App\Observers\AngsuranObserver;
use App\Observers\PinjamanObserver;
use App\Observers\SimpananObserver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //for running in ngrok
        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }

        $this->configureDefaults();

        Simpanan::observe(SimpananObserver::class);
        Pinjaman::observe(PinjamanObserver::class);
        Angsuran::observe(AngsuranObserver::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(app()->isProduction());

        Password::defaults(
            fn(): ?Password => app()->isProduction()
                ? Password::min(12)->mixedCase()->letters()->numbers()->symbols()->uncompromised()
                : null,
        );
    }
}
