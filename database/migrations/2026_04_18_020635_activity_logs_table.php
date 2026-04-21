<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            $table
                ->foreignId('by_admin')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete()
                ->name('activity_logs_by_admin_foreign')
                ->index();
            $table
                ->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnDelete()
                ->name('activity_logs_user_id_foreign')
                ->index();

            $table->string('jenis_update');
            $table->json('old')->nullable();
            $table->json('new')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
