<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 64)->unique();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Backfill from existing templates.category (if any)
        if (Schema::hasTable('templates') && Schema::hasColumn('templates', 'category')) {
            $names = DB::table('templates')
                ->whereNotNull('category')
                ->where('category', '<>', '')
                ->distinct()
                ->pluck('category')
                ->filter(fn ($v) => is_string($v) && trim($v) !== '')
                ->values();

            $now = now();
            foreach ($names as $name) {
                DB::table('template_categories')->updateOrInsert(
                    ['name' => $name],
                    ['sort_order' => 0, 'created_at' => $now, 'updated_at' => $now]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('template_categories');
    }
};

