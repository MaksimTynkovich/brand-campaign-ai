<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CreativeController;
use App\Http\Controllers\Api\GenerationController;

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
