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
    Schema::table('contenu_fiches', function (Blueprint $table) {
        $table->unsignedBigInteger('prestation_id')->nullable()->after('client_id');
        $table->foreign('prestation_id')->references('id')->on('prestations')->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('contenu_fiches', function (Blueprint $table) {
        $table->dropForeign(['prestation_id']);
        $table->dropColumn('prestation_id');
    });
}

};
