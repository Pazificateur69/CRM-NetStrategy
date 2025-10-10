<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            if (!Schema::hasColumn('rappels', 'statut')) {
                $table->string('statut')->default('planifie')->after('date_rappel');
            }
        });
    }

    public function down(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
