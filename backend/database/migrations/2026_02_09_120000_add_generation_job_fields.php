<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('generation_jobs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->unsignedBigInteger('template_id')->nullable()->after('user_id');
            $table->string('status', 32)->default('pending')->after('template_id');
            $table->text('user_prompt')->nullable()->after('status');
            $table->text('merged_prompt')->nullable()->after('user_prompt');
            $table->string('video_path')->nullable()->after('merged_prompt');
            $table->text('error_message')->nullable()->after('video_path');
            $table->json('input')->nullable()->after('error_message');
        });
    }

    public function down(): void
    {
        Schema::table('generation_jobs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'template_id', 'status', 'user_prompt', 'merged_prompt',
                'video_path', 'error_message', 'input',
            ]);
        });
    }
};
