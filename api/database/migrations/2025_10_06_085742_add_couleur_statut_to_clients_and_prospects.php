<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('couleur_statut', ['vert', 'orange', 'rouge'])->default('vert')->after('telephones');
        });

        Schema::table('prospects', function (Blueprint $table) {
            $table->enum('couleur_statut', ['vert', 'orange', 'rouge'])->default('orange')->after('telephones');
        });
    }

    public function down()
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('couleur_statut');
        });

        Schema::table('prospects', function (Blueprint $table) {
            $table->dropColumn('couleur_statut');
        });
    }
};