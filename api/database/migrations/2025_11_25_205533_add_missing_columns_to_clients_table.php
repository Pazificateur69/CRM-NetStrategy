<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('site_web')->nullable()->after('siret');
            $table->text('adresse')->nullable()->after('site_web');
            $table->string('ville')->nullable()->after('adresse');
            $table->string('code_postal')->nullable()->after('ville');
            $table->decimal('montant_mensuel_total', 10, 2)->nullable()->after('date_echeance');
            $table->string('frequence_facturation')->nullable()->after('montant_mensuel_total');
            $table->string('mode_paiement')->nullable()->after('frequence_facturation');
            $table->string('iban')->nullable()->after('mode_paiement');
            $table->text('description_generale')->nullable()->after('iban');
            $table->text('notes_comptables')->nullable()->after('description_generale');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'site_web',
                'adresse',
                'ville',
                'code_postal',
                'montant_mensuel_total',
                'frequence_facturation',
                'mode_paiement',
                'iban',
                'description_generale',
                'notes_comptables',
            ]);
        });
    }
};
