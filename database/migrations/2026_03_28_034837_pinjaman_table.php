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
        Schema::create('pinjaman', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete()->name('pinjaman_user_id_foreign');

            $table->decimal('jumlah_pinjaman', 15, 2);  
            $table->decimal('bunga_persen', 5, 2);  
            $table->decimal('total_pinjaman', 15, 2);  
            $table->decimal('sisa_pinjaman', 15, 2);

            $table->integer('lama_angsuran');  

            $table->decimal('angsuran_per_bulan', 15, 2);  
            $table->decimal('angsuran_bulan_terakhir', 15, 2);

            $table->date('tanggal_pinjaman')->index();
            $table->date('jatuh_tempo_terakhir')->nullable();

            $table
                ->enum('status', ['aktif', 'lunas', 'macet'])
                ->default('aktif')
                ->index();

            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pinjaman');
    }
};
