<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('angsuran', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->name('angsuran_user_id_foreign');
            $table
                ->foreignId('pinjaman_id')
                ->constrained('pinjaman')
                ->cascadeOnDelete()
                ->name('angsuran_pinjaman_id_foreign');

            $table->integer('angsuran_ke');
            $table->decimal('dana_pinjaman', 15, 2);
            $table->decimal('jumlah_bayar', 15, 2);
            $table->decimal('bunga_bayar', 15, 2)->default(0);
            $table->decimal('real_bayar', 15, 2)->nullable();
            
            $table->integer('bulan');
            $table->integer('tahun');
            $table->date('tanggal_bayar')->nullable();

            $table
                ->enum('status', ['belum_bayar', 'sudah_bayar'])
                ->default('belum_bayar')
                ->index();

            $table->timestamps();

            $table->unique(['pinjaman_id', 'angsuran_ke']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('angsuran');
    }
};
