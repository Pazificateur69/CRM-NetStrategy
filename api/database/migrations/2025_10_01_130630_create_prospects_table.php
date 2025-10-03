<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prospects', function (Blueprint $table) {
            $table->id();
            $table->string('societe');
            $table->string('contact'); // NOM de la personne à contacter
            $table->json('emails')->nullable();
            $table->json('telephones')->nullable();
            $table->enum('statut', ['en_attente', 'relance', 'perdu', 'converti'])->default('en_attente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospects');
    }
};
