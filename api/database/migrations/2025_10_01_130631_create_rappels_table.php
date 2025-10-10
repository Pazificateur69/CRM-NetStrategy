<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rappels', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->dateTime('date_rappel')->nullable();

            // ✅ Nouveaux champs essentiels
            $table->boolean('fait')->default(false);
            $table->string('statut')->default('planifie'); // planifie | en_cours | termine
            $table->integer('ordre')->default(0);          // position dans la colonne Kanban
            $table->string('pole')->nullable();            // pôle utilisateur (com, dev, etc.)

            // 🔄 Polymorphique (client, prospect, etc.)
            $table->morphs('rappelable');

            // 🔗 Relations
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rappels');
    }
};
