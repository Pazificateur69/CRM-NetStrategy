<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('contenu_fiches', function (Blueprint $table) {
            $table->string('pole')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('contenu_fiches', function (Blueprint $table) {
            $table->dropColumn('pole');
        });
    }
};
