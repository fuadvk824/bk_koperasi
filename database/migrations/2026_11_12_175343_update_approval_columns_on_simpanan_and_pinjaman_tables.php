<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('simpanan', function (Blueprint $table) {
            $table->renameColumn('status', 'status_approval');
        });

        Schema::table('simpanan', function (Blueprint $table) {
            $table->string('catatan_approval')
                ->nullable()
                ->after('status_approval');
        });


        Schema::table('pinjaman', function (Blueprint $table) {
            $table->renameColumn('status_approve', 'status_approval');
        });

        Schema::table('pinjaman', function (Blueprint $table) {
            $table->string('catatan_approval')
                ->nullable()
                ->after('status_approval');

            $table->string('surat_pengajuan')
                ->nullable()
                ->after('catatan_approval');
        });


        Schema::table('angsuran', function (Blueprint $table) {
            $table->enum('status_approval', [
                'belum_diajukan',
                'menunggu',
                'disetujui',
                'ditolak',
            ])
                ->default('belum_diajukan')
                ->after('status');

            $table->string('catatan_approval')
                ->nullable()
                ->after('status_approval');

            $table->string('bukti_transfer')
                ->nullable()
                ->after('catatan_approval');
        });
    }

    public function down(): void
    {
        Schema::table('angsuran', function (Blueprint $table) {
            $table->dropColumn([
                'status_approval',
                'catatan_approval',
                'bukti_transfer',
            ]);
        });

        Schema::table('pinjaman', function (Blueprint $table) {
            $table->dropColumn([
                'catatan_approval',
                'surat_pengajuan',
            ]);

            $table->renameColumn('status_approval', 'status_approve');
        });

        Schema::table('simpanan', function (Blueprint $table) {
            $table->dropColumn('catatan_approval');

            $table->renameColumn('status_approval', 'status');
        });
    }
};
