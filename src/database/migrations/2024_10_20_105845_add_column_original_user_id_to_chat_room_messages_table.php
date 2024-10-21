<?php

declare(strict_types=1);

use App\Models\ChatRoomMessage;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chat_room_messages', function (Blueprint $table) {
            $table->foreignIdFor(User::class, 'original_user_id')->after('user_id');
        });

        ChatRoomMessage::query()->update([
            'original_user_id' => DB::raw('user_id'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_room_messages', function (Blueprint $table) {
            $table->dropColumn('original_user_id');
        });
    }
};
