<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CreativeController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\AuthController;

// Auth routes (public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/google', [AuthController::class, 'google']);
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Products
Route::apiResource('products', ProductController::class);

// Creatives
Route::apiResource('creatives', CreativeController::class);

// Generation
Route::post('/generation/start', [GenerationController::class, 'start']);
Route::get('/generation/status/{jobId}', [GenerationController::class, 'status']);
Route::get('/creatives/{creative}/download/video', [CreativeController::class, 'downloadVideo']);
Route::get('/creatives/{creative}/download/script', [CreativeController::class, 'downloadScript']);
