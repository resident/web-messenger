<?php

declare(strict_types=1);

use App\Enums\MessageStatusEnum;
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
        Schema::table('chat_room_messages', function (Blueprint $table) {
            $table->string('status')->default(MessageStatusEnum::SENT)->after('message_key_iv');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_room_messages', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
