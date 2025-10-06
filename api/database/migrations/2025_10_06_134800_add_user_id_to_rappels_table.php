<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            if (!Schema::hasColumn('rappels', 'user_id')) {
                $table->foreignId('user_id')
                      ->constrained('users')
                      ->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            if (Schema::hasColumn('rappels', 'user_id')) {
                $table->dropConstrainedForeignId('user_id');
            }
        });
    }
};
