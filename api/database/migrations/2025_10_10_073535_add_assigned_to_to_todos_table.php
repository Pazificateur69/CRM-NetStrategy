<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // database/migrations/xxxx_add_assigned_to_to_todos_table.php
public function up()
{
    Schema::table('todos', function (Blueprint $table) {
        $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            //
        });
    }
};
