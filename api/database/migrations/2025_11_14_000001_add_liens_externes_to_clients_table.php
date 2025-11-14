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
        Schema::table('clients', function (Blueprint $table) {
            // Colonne JSON pour stocker tous les liens externes
            // Format: { "site_web": "https://...", "analytics": "https://...", etc. }
            if (!Schema::hasColumn('clients', 'liens_externes')) {
                $table->json('liens_externes')->nullable()->after('lien_externe');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            if (Schema::hasColumn('clients', 'liens_externes')) {
                $table->dropColumn('liens_externes');
            }
        });
    }
};
