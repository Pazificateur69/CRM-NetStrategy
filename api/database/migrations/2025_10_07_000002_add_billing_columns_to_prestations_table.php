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
        Schema::table('prestations', function (Blueprint $table) {
            $table->decimal('tarif_ht', 10, 2)->nullable()->after('notes');
            $table->string('frequence')->nullable()->after('tarif_ht');
            $table->unsignedInteger('engagement_mois')->nullable()->after('frequence');
            $table->date('date_debut')->nullable()->after('engagement_mois');
            $table->date('date_fin')->nullable()->after('date_debut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prestations', function (Blueprint $table) {
            $table->dropColumn([
                'tarif_ht',
                'frequence',
                'engagement_mois',
                'date_debut',
                'date_fin',
            ]);
        });
    }
};
