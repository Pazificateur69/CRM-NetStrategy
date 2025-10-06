<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('contenu_fiches', function (Blueprint $table) {
        if (Schema::hasColumn('contenu_fiches', 'client_id')) {
            $table->dropConstrainedForeignId('client_id');
        }
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contenu_fiches', function (Blueprint $table) {
            //
        });
    }
};
