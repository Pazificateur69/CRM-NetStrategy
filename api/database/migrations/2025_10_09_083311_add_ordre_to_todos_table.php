<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            if (!Schema::hasColumn('todos', 'ordre')) {
                $table->integer('ordre')->default(0)->after('statut');
            }
        });
    }

    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            if (Schema::hasColumn('todos', 'ordre')) {
                $table->dropColumn('ordre');
            }
        });
    }
};
