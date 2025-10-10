<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_create_rappel_user_table.php
public function up()
{
    Schema::create('rappel_user', function (Blueprint $table) {
        $table->id();
        $table->foreignId('rappel_id')->constrained('rappels')->onDelete('cascade');
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rappel_user');
    }
};
