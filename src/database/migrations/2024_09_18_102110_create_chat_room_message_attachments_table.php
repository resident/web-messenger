<?php

use App\Models\ChatRoomMessage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_room_message_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignIdFor(ChatRoomMessage::class)->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('path');
            $table->string('name');
            $table->string('mime_type');
            $table->integer('size');
            $table->string('attachment_iv');
            $table->string('attachment_key');
            $table->string('attachment_key_iv');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_room_message_attachments');
    }
};
