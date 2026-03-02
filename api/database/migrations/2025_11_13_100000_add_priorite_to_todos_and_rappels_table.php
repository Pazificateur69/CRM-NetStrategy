<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            if (!Schema::hasColumn('todos', 'priorite')) {
                $table->enum('priorite', ['basse', 'moyenne', 'haute'])->default('moyenne')->after('ordre');
            }
        });

        Schema::table('rappels', function (Blueprint $table) {
            if (!Schema::hasColumn('rappels', 'priorite')) {
                $table->enum('priorite', ['basse', 'moyenne', 'haute'])->default('moyenne')->after('ordre');
            }
        });
    }

    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            if (Schema::hasColumn('todos', 'priorite')) {
                $table->dropColumn('priorite');
            }
        });

        Schema::table('rappels', function (Blueprint $table) {
            if (Schema::hasColumn('rappels', 'priorite')) {
                $table->dropColumn('priorite');
            }
        });
    }
};
