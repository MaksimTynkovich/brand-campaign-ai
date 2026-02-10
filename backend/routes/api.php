<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CreativeController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TemplateController;

// Auth routes (public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/google', [AuthController::class, 'google']);
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Dashboard (protected)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/stats', function (Request $request) {
        // Mock статистика
        return response()->json([
            'total_projects' => 12,
            'total_creatives' => 45,
            'completed_creatives' => 38,
            'videos_this_month' => 15,
        ]);
    });
});

// Products (без store — создание продукта убрано)
Route::apiResource('products', ProductController::class)->except(['store']);

// Creatives
Route::apiResource('creatives', CreativeController::class);

// Templates
Route::get('/templates', [TemplateController::class, 'index']);

// Generation
Route::post('/generation/start', [GenerationController::class, 'start']);
Route::get('/generation/status/{jobId}', [GenerationController::class, 'status']);
Route::get('/creatives/{creative}/download/video', [CreativeController::class, 'downloadVideo']);
Route::get('/creatives/{creative}/download/script', [CreativeController::class, 'downloadScript']);
