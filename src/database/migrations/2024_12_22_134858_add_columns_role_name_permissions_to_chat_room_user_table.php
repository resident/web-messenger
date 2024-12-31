<?php

declare(strict_types=1);

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
        Schema::table('chat_room_user', function (Blueprint $table) {
            $table->string('role_name')->default('member')->after('muted');
            $table->json('permissions')->nullable()->after('role_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_room_user', function (Blueprint $table) {
            $table->dropColumn(['role_name', 'permissions']);
        });
    }
};
