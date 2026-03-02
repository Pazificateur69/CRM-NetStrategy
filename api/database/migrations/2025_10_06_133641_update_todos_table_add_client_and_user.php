<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('todos', function (Blueprint $table) {
        if (!Schema::hasColumn('todos', 'client_id')) {
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
        }
        if (!Schema::hasColumn('todos', 'user_id')) {
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
        }
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
