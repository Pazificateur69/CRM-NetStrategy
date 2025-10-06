<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('contenu_fiches', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('type');
        $table->text('texte')->nullable();
        $table->string('chemin_fichier')->nullable();
        $table->string('nom_original_fichier')->nullable();
        $table->nullableMorphs('contenuable'); // permet d'attacher à Todo, Rappel, etc.
        $table->timestamps();
    });
}


    public function down(): void
    {
        Schema::dropIfExists('contenu_fiches');
    }
};