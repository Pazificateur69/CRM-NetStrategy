<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProspectController;
use App\Http\Controllers\RappelController;
use App\Http\Controllers\TodoController;

// Auth publiques
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protégées par Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('clients', ClientController::class);
    Route::apiResource('prospects', ProspectController::class);
    Route::apiResource('rappels', RappelController::class);
    Route::apiResource('todos', TodoController::class);
});
