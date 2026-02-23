<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('openai_prompt_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generation_job_id')->nullable()->constrained('generation_jobs')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('template_prompt');
            $table->text('user_prompt');
            $table->text('merged_prompt')->nullable();
            $table->string('source', 32); // openai_success | openai_failed | fallback_no_key | fallback_empty_prompt
            $table->text('openai_error')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('generation_job_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('openai_prompt_logs');
    }
};
