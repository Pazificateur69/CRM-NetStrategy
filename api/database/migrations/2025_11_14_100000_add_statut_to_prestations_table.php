<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prestations', function (Blueprint $table) {
            // Ajout du champ statut pour gérer la validation des prestations
            // Valeurs possibles: 'en_attente', 'validee'
            $table->string('statut')->default('en_attente')->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('prestations', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
