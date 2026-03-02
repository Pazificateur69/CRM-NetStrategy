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
        Schema::table('todos', function (Blueprint $table) {
            // Only add client_id if it doesn't exist
            if (!Schema::hasColumn('todos', 'client_id')) {
                $table->foreignId('client_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            }

            if (!Schema::hasColumn('todos', 'ordre')) {
                $table->integer('ordre')->default(0)->after('statut');
            }

            if (!Schema::hasColumn('todos', 'priorite')) {
                $table->string('priorite')->default('moyenne')->after('ordre'); // basse, moyenne, haute
            }

            if (!Schema::hasColumn('todos', 'pole')) {
                $table->string('pole')->nullable()->after('priorite');
            }

            if (!Schema::hasColumn('todos', 'assigned_to')) {
                $table->foreignId('assigned_to')->nullable()->after('pole')->constrained('users')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
            $table->dropColumn('ordre');
            $table->dropColumn('priorite');
            $table->dropColumn('pole');
            $table->dropForeign(['assigned_to']);
            $table->dropColumn('assigned_to');
        });
    }
};
