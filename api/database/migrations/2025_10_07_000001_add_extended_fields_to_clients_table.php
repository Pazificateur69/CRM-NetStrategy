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
            $table->string('adresse')->nullable()->after('gerant');
            $table->string('ville')->nullable()->after('adresse');
            $table->string('code_postal', 20)->nullable()->after('ville');
            $table->string('site_web')->nullable()->after('code_postal');
            $table->text('description_generale')->nullable()->after('site_web');

            $table->decimal('montant_mensuel_total', 10, 2)->nullable()->after('date_echeance');
            $table->string('frequence_facturation')->nullable()->after('montant_mensuel_total');
            $table->string('mode_paiement')->nullable()->after('frequence_facturation');
            $table->string('iban', 34)->nullable()->after('mode_paiement');
            $table->text('notes_comptables')->nullable()->after('iban');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'adresse',
                'ville',
                'code_postal',
                'site_web',
                'description_generale',
                'montant_mensuel_total',
                'frequence_facturation',
                'mode_paiement',
                'iban',
                'notes_comptables',
            ]);
        });
    }
};
