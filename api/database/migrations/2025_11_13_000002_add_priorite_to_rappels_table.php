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
        Schema::table('rappels', function (Blueprint $table) {
            if (!Schema::hasColumn('rappels', 'priorite')) {
                $table->string('priorite')->default('moyenne')->after('statut'); // basse, moyenne, haute
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            $table->dropColumn('priorite');
        });
    }
};
