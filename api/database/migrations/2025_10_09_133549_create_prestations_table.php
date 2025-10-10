<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prestations', function (Blueprint $table) {
            $table->id();

            // 🔗 Relation client
            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->onDelete('cascade');

            // 🔗 Utilisateur assigné (responsable)
            $table->foreignId('assigned_user_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            // 📦 Informations générales
            $table->string('type'); // Ex: SEO, Ads, Dev, Comptabilité
            $table->decimal('tarif_ht', 10, 2)->default(0);
            $table->string('frequence')->nullable(); // Ex: Mensuel, Unique
            $table->integer('engagement_mois')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();

            // 📝 Notes internes
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestations');
    }
};
