<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('generation_jobs', function (Blueprint $table) {
            $table->string('original_video_path')->nullable()->after('video_path');
            $table->string('watermarked_video_path')->nullable()->after('original_video_path');
        });
    }

    public function down(): void
    {
        Schema::table('generation_jobs', function (Blueprint $table) {
            $table->dropColumn(['original_video_path', 'watermarked_video_path']);
        });
    }
};

