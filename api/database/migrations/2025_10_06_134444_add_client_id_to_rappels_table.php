<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            if (!Schema::hasColumn('rappels', 'client_id')) {
                $table->unsignedBigInteger('client_id')->nullable()->after('id');
                $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('rappels', function (Blueprint $table) {
            if (Schema::hasColumn('rappels', 'client_id')) {
                $table->dropForeign(['client_id']);
                $table->dropColumn('client_id');
            }
        });
    }
};
