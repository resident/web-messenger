<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_storage', function (Blueprint $table) {
            $table->uuid('id');
            $table->foreignIdFor(User::class)->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('key');
            $table->json('value');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['user_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_storage');
    }
};
