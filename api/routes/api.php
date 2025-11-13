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

    // ===================================================
    // 👤 UTILISATEUR CONNECTÉ
    // ===================================================
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
    // 🚪 AUTHENTIFICATION
    // ===================================================
    Route::post('/logout', [AuthController::class, 'logout']);

    // ===================================================
    // 📊 DASHBOARD
    // ===================================================
    Route::get('/dashboard/clients-overview', [DashboardController::class, 'clientOverview']);

    // ===================================================
    // 🧱 CLIENTS & PROSPECTS
    // ===================================================
    Route::apiResource('clients', ClientController::class)
        ->middleware('permission:view clients|manage clients');

    // Route spéciale pour récupérer les infos comptables d'un client
    Route::get('/clients/{id}/compta', [ClientController::class, 'getCompta'])
        ->middleware('permission:view clients|manage clients');

    Route::apiResource('prospects', ProspectController::class)
        ->middleware('permission:view prospects|manage prospects');

    // Conversion d'un prospect en client
    Route::post('/prospects/{prospect}/convert', [ProspectController::class, 'convertToClient'])
        ->middleware('permission:manage prospects');

    // ===================================================
    // ✅ TÂCHES (TODOS) & RAPPELS
    // ===================================================
    Route::get('/todos/pole/{pole}', [TodoController::class, 'getByPole']);
    Route::get('/rappels/pole/{pole}', [RappelController::class, 'getByPole']);

    // Décaler un rappel de X jours
    Route::post('/rappels/{id}/decaler', [RappelController::class, 'decaler']);

    Route::apiResource('todos', TodoController::class);
    Route::apiResource('rappels', RappelController::class);

    // ===================================================
    // 📁 CONTENU / FICHIERS CLIENT
    // ===================================================
    Route::post('/contenu', [ContenuFicheController::class, 'store']);
    Route::get('/contenu/client/{client}', [ContenuFicheController::class, 'index']);
    Route::get('/contenu/{id}/download', [ContenuFicheController::class, 'download']);
    Route::delete('/contenu/{id}', [ContenuFicheController::class, 'destroy']);

    // ===================================================
    // ⚙️ PRESTATIONS (LIAISON AVEC COMPTABILITÉ)
    // ===================================================
    Route::post('/clients/{client}/prestations', [PrestationController::class, 'store'])
        ->middleware('permission:manage clients');

    Route::apiResource('prestations', PrestationController::class)
        ->only(['index', 'show', 'update', 'destroy'])
        ->middleware('permission:view clients');

    // ===================================================
    // 💰 COMPTABILITÉ
    // ===================================================
    Route::middleware(['role:comptabilite|admin', 'check.ip'])->group(function () {
        Route::apiResource('comptabilite', ComptabiliteController::class)
            ->only(['index', 'show']);
    });

    // ===================================================
    // 👥 UTILISATEURS (ADMIN UNIQUEMENT)
    // ===================================================
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // ===================================================
    // 🧩 NOUVELLE ROUTE : UTILISATEURS PAR PÔLE
    // ===================================================
    Route::get('/users/by-pole/{pole}', [UserController::class, 'getByPole']);
});
