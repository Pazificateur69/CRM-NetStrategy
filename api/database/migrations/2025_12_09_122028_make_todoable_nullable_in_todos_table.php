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
        Schema::table('todos', function (Blueprint $table) {
            $table->unsignedBigInteger('todoable_id')->nullable()->change();
            $table->string('todoable_type')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            $table->unsignedBigInteger('todoable_id')->nullable(false)->change();
            $table->string('todoable_type')->nullable(false)->change();
        });
    }
};
