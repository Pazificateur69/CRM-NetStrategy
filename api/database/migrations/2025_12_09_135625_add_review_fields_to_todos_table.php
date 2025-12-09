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
            $table->string('review_status')->default('none')->after('statut'); // none, pending, approved, rejected, correction
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete()->after('review_status');
            $table->text('review_comment')->nullable()->after('approver_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            $table->dropForeign(['approver_id']);
            $table->dropColumn(['review_status', 'approver_id', 'review_comment']);
        });
    }
};
