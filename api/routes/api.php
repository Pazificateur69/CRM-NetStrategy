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

// ===============================
// 🔓 1. ROUTES PUBLIQUES
// ===============================
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ===============================
// 🔒 2. ROUTES PROTÉGÉES PAR SANCTUM
// ===============================
Route::middleware('auth:sanctum')->group(function () {

    // --- 🔹 Authentification ---
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- 🔹 Profil utilisateur connecté ---
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(), // ✅ renvoie ["admin", "dev", ...]
        ]);
    });

    // --- 🔹 Dashboard ---
    Route::get('/dashboard/clients-overview', [DashboardController::class, 'clientOverview']);

    // --- 🔹 Gestion des utilisateurs (ADMIN UNIQUEMENT) ---
    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // --- 🔹 Clients & Prospects ---
    Route::apiResource('clients', ClientController::class)
        ->middleware('permission:view clients|manage clients');

    Route::apiResource('prospects', ProspectController::class)
        ->middleware('permission:view prospects|manage prospects');

    // --- 🔹 Conversion prospect → client ---
    Route::post('/prospects/{prospect}/convert', [ProspectController::class, 'convertToClient'])
        ->middleware('permission:manage prospects');

    // ===============================
    // ✅ 3. TÂCHES (TODOS) & RAPPELS PERSONNELS
    // ===============================
    Route::apiResource('todos', TodoController::class);
    Route::apiResource('rappels', RappelController::class);

    // ===============================
    // ✅ 4. CONTENUS / FICHIERS / COMMENTAIRES
    // ===============================
    // ➜ Créer un contenu (texte ou fichier)
    Route::post('/contenu', [ContenuFicheController::class, 'store']);

    // ➜ Lister les contenus associés à un client
    Route::get('/contenu/client/{client}', [ContenuFicheController::class, 'index']);

    // ➜ Télécharger un fichier spécifique
    Route::get('/contenu/{id}/download', [ContenuFicheController::class, 'download']);

    // ➜ Supprimer un contenu
    Route::delete('/contenu/{id}', [ContenuFicheController::class, 'destroy']);

    // ===============================
    // ✅ 5. PRESTATIONS (Modules de service)
    // ===============================
    Route::apiResource('prestations', PrestationController::class)
        ->only(['index', 'store', 'show', 'update', 'destroy'])
        ->middleware('permission:view clients');

    // ===============================
    // ✅ 6. COMPTABILITÉ (Admin ou Comptable + IP interne)
    // ===============================
    Route::middleware(['role:comptabilite|admin', 'check.ip'])->group(function () {
        Route::apiResource('comptabilite', ComptabiliteController::class)
            ->only(['index', 'show']);
    });
});
