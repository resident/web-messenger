<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chat_room_user', function (Blueprint $table) {
            $table->timestamp('last_read_at')->useCurrent()->after('chat_room_key');
            $table->boolean('muted')->default(false)->after('last_read_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_room_user', function (Blueprint $table) {
            $table->dropColumn(['last_read_at', 'muted']);
        });
    }
};
