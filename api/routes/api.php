<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AuthController,
    ClientController,
    ProspectController,
    RappelController,
    TodoController,
    DashboardController,
    ComptabiliteController,
    PrestationController,
    ContenuFicheController,
    UserController
};

// ===================================================
// 🔓 1. ROUTES PUBLIQUES
// ===================================================
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ===================================================
// 🔒 2. ROUTES PROTÉGÉES PAR SANCTUM
// ===================================================
Route::middleware('auth:sanctum')->group(function () {

    // --- 🔹 AUTHENTIFICATION ---
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- 🔹 PROFIL UTILISATEUR CONNECTÉ ---
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
            'roles' => method_exists($user, 'getRoleNames')
                ? $user->getRoleNames()
                : [$user->role],
            'pole'  => $user->pole ?? 'non_defini',
        ]);
    });

    // ===================================================
    // 🧭 DASHBOARD
    // ===================================================
    Route::get('/dashboard/clients-overview', [DashboardController::class, 'clientOverview']);

    // ===================================================
    // 👤 UTILISATEURS (ADMIN)
    // ===================================================
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // ===================================================
    // 🧱 CLIENTS & PROSPECTS
    // ===================================================
    Route::apiResource('clients', ClientController::class)
        ->middleware('permission:view clients|manage clients');

    Route::apiResource('prospects', ProspectController::class)
        ->middleware('permission:view prospects|manage prospects');

    // Conversion prospect → client
    Route::post('/prospects/{prospect}/convert', [ProspectController::class, 'convertToClient'])
        ->middleware('permission:manage prospects');

    // ===================================================
    // ✅ TÂCHES (TODOS) & RAPPELS
    // ===================================================

    // ⚠️ Les routes personnalisées AVANT les resources
    Route::get('/todos/pole/{pole}', [TodoController::class, 'getByPole']);
    Route::get('/rappels/pole/{pole}', [RappelController::class, 'getByPole']);

    Route::apiResource('todos', TodoController::class);
    Route::apiResource('rappels', RappelController::class);

    // ===================================================
    // 📁 CONTENUS / FICHIERS
    // ===================================================
    Route::post('/contenu', [ContenuFicheController::class, 'store']);
    Route::get('/contenu/client/{client}', [ContenuFicheController::class, 'index']);
    Route::get('/contenu/{id}/download', [ContenuFicheController::class, 'download']);
    Route::delete('/contenu/{id}', [ContenuFicheController::class, 'destroy']);

    // ===================================================
    // ⚙️ PRESTATIONS
    // ===================================================
    Route::apiResource('prestations', PrestationController::class)
        ->only(['index', 'store', 'show', 'update', 'destroy'])
        ->middleware('permission:view clients');

    // ===================================================
    // 💰 COMPTABILITÉ
    // ===================================================
    Route::middleware(['role:comptabilite|admin', 'check.ip'])->group(function () {
        Route::apiResource('comptabilite', ComptabiliteController::class)
            ->only(['index', 'show']);
    });
});
