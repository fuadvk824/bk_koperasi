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
        Schema::create('transaksi_kas', function (Blueprint $table) {
            $table->id();
          
            $table
                ->foreignId('by_admin')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete()
                ->name('transaksi_kas_by_admin_foreign')
                ->index();
            $table
                ->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete()
                ->name('transaksi_kas_user_id_foreign')
                ->index();

            $table->enum('jenis', ['masuk', 'keluar'])->index();
            $table->enum('kategori', ['simpanan', 'pinjaman', 'angsuran', 'mutasi'])->index();

            $table->decimal('jumlah', 15, 2);
            $table->string('keterangan')->nullable();
            $table->dateTime('tanggal')->index();

            $table->unsignedBigInteger('ref_id')->nullable();
            $table->string('ref_type')->nullable();
            $table->unsignedBigInteger('reversal_of')->nullable()->unique();

            $table
                ->enum('status', ['pending', 'berhasil', 'dibatalkan'])
                ->default('berhasil')
                ->index();

            $table->index(['ref_type', 'ref_id', 'kategori']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
