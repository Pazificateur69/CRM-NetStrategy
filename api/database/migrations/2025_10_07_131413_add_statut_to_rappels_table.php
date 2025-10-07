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
    Schema::table('rappels', function (Blueprint $table) {
        $table->string('statut')->default('planifie');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            //
        });
    }
};
