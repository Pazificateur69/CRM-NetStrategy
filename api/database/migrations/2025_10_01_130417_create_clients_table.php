<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('societe');
            $table->string('gerant')->nullable();
            $table->string('siret')->nullable();
            $table->json('emails')->nullable();
            $table->json('telephones')->nullable();
            $table->string('contrat')->nullable();
            $table->date('date_contrat')->nullable();
            $table->date('date_echeance')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
