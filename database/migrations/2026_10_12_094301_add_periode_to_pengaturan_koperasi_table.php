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
        Schema::table('pengaturan_koperasi', function (Blueprint $table) {
            $table->date('berlaku_mulai')->after('bunga_pinjaman')->nullable();
            $table->date('berlaku_sampai')->after('berlaku_mulai')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengaturan_koperasi', function (Blueprint $table) {
            $table->dropColumn([
                'berlaku_mulai',
                'berlaku_sampai',
            ]);
        });
    }
};
