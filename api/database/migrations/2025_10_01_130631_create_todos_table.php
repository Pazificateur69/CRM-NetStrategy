<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('todos', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->enum('statut', ['en_cours', 'termine', 'retard'])->default('en_cours');
            $table->date('date_echeance')->nullable();

            // Relation polymorphe : todo lié à un client OU prospect
            $table->nullableMorphs('todoable'); // crée todoable_id (BIGINT) + todoable_type (VARCHAR)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('todos');
    }
};
