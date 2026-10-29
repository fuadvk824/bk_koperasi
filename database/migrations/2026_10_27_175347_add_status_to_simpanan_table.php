<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('simpanan', function (Blueprint $table) {
            $table->enum('status', [
                'menunggu',
                'disetujui',
                'ditolak',
            ])
                ->default('disetujui')
                ->after('jumlah')
                ->index();

            $table->string('bukti_transfer')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('simpanan', function (Blueprint $table) {

            $table->dropColumn([
                'status',
               
                'bukti_transfer',
            ]);
        });
    }
};
