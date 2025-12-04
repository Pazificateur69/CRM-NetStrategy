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

    UserController,
    AIController,
    TwoFactorController,
    ProfileController,
    SearchController,
    EventController,
    ProjectController,
    NotificationController,
    SecurityController,
    OrganizationController
};

// ===================================================
// 🔓 1. ROUTES PUBLIQUES
// ===================================================
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:6,1'); // Max 6 tentatives par minute
Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:3,1'); // Max 3 inscriptions par minute

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
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'roles' => method_exists($user, 'getRoleNames')
                ? $user->getRoleNames()
                : [$user->role],
            'pole' => $user->pole ?? 'non_defini',
            'two_factor_enabled' => !is_null($user->two_factor_confirmed_at), // ✅ Statut 2FA
            'notification_preferences' => $user->notification_preferences, // ✅ Préférences
        ]);
    });

    // ===================================================
    // 🚪 AUTHENTIFICATION
    // ===================================================
    // ===================================================
    // 🚪 AUTHENTIFICATION
    // ===================================================
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/2fa/verify-login', [AuthController::class, 'verifyTwoFactorLogin']); // 🔐 Vérification OTP à la connexion

    // ===================================================
    // 🛡️ 2FA SETTINGS
    // ===================================================
    Route::post('/user/two-factor-authentication', [TwoFactorController::class, 'enable']);
    Route::post('/user/confirmed-two-factor-authentication', [TwoFactorController::class, 'confirm']);
    Route::delete('/user/two-factor-authentication', [TwoFactorController::class, 'disable']);
    Route::get('/user/two-factor-recovery-codes', [TwoFactorController::class, 'getRecoveryCodes']);
    Route::get('/user/two-factor-recovery-codes', [TwoFactorController::class, 'getRecoveryCodes']);
    Route::post('/user/two-factor-recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes']);

    // ===================================================
    // 👤 PROFILE & SETTINGS
    // ===================================================
    Route::put('/user/profile', [ProfileController::class, 'update']);
    Route::put('/user/password', [ProfileController::class, 'updatePassword']);
    Route::delete('/user/account', [ProfileController::class, 'deleteAccount']);
    Route::get('/user/export', [ProfileController::class, 'exportData']);
    Route::put('/user/notifications', [ProfileController::class, 'updateNotifications']);

    // ===================================================
    // 🛡️ SÉCURITÉ AVANCÉE
    // ===================================================
    Route::get('/user/login-history', [SecurityController::class, 'getLoginHistory']);
    Route::get('/user/active-sessions', [SecurityController::class, 'getActiveSessions']);
    Route::delete('/user/active-sessions/{id}', [SecurityController::class, 'revokeSession']);
    Route::get('/audit-logs', [SecurityController::class, 'getAuditLogs'])->middleware('role:admin');

    // ===================================================
    // 🏢 ORGANISATION (ADMIN)
    // ===================================================
    Route::middleware('role:admin')->group(function () {
        Route::get('/organization/settings', [OrganizationController::class, 'getSettings']);
        Route::put('/organization/settings', [OrganizationController::class, 'updateSettings']);
    });

    // ===================================================
    // 🔔 NOTIFICATIONS
    // ===================================================
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // ===================================================
    // 🔍 GLOBAL SEARCH
    // ===================================================
    Route::get('/search', [SearchController::class, 'globalSearch']);

    // ===================================================
    // 📊 DASHBOARD
    // ===================================================
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    Route::put('/dashboard/preferences', [DashboardController::class, 'updatePreferences']);
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
    Route::get('/todos/me', [TodoController::class, 'myTasks']); // ✅ Mes tâches
    Route::get('/rappels/me', [RappelController::class, 'myTasks']); // ✅ Mes rappels
    Route::get('/rappels/pole/{pole}', [RappelController::class, 'getByPole']);
    Route::get('/todos/user/{userId}', [TodoController::class, 'getByUser'])->middleware('role:admin'); // ✅ Admin voir tâches user
    Route::get('/rappels/user/{userId}', [RappelController::class, 'getByUser'])->middleware('role:admin'); // ✅ Admin voir rappels user

    // Décaler un rappel de X jours
    Route::post('/rappels/{id}/decaler', [RappelController::class, 'decaler']);

    Route::apiResource('todos', TodoController::class);
    Route::apiResource('rappels', RappelController::class);

    // ===================================================
    // 📁 CONTENU / FICHIERS CLIENT
    // ===================================================
    Route::post('/contenu', [ContenuFicheController::class, 'store']);
    Route::put('/contenu/{id}', [ContenuFicheController::class, 'update']); // ✅ NOUVEAU
    Route::get('/contenu/client/{client}', [ContenuFicheController::class, 'index']);
    Route::get('/contenu/{id}/download', [ContenuFicheController::class, 'download']);
    Route::get('/contenu/{id}/preview', [ContenuFicheController::class, 'preview']); // ✅ NOUVEAU
    Route::delete('/contenu/{id}', [ContenuFicheController::class, 'destroy']);

    // ===================================================
    // 📅 CALENDRIER / PLANNING
    // ===================================================
    Route::apiResource('events', EventController::class);

    // ===================================================
    // 🚀 GESTION DE PROJETS
    // ===================================================
    Route::apiResource('projects', ProjectController::class);

    // ===================================================
    // ⚙️ PRESTATIONS (LIAISON AVEC COMPTABILITÉ)
    // ===================================================
    Route::post('/clients/{client}/prestations', [PrestationController::class, 'store'])
        ->middleware('permission:manage clients');

    Route::apiResource('prestations', PrestationController::class)
        ->only(['index', 'show', 'update', 'destroy'])
        ->middleware('permission:view clients');

    // Route pour valider une prestation
    Route::post('/prestations/{prestation}/validate', [PrestationController::class, 'validatePrestation'])
        ->middleware('permission:manage clients');

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
    Route::get('/users/mentions', [UserController::class, 'listForMentions']); // ✅ Accessible à tous

    Route::middleware(['role:admin'])->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // ===================================================
    // 🧩 NOUVELLE ROUTE : UTILISATEURS PAR PÔLE (ADMIN UNIQUEMENT)
    // ===================================================
    Route::get('/users/by-pole/{pole}', [UserController::class, 'getByPole'])
        ->middleware('role:admin');
    // ===================================================
    // 💬 MESSAGERIE INTERNE
    // ===================================================
    Route::get('/messages/contacts', [App\Http\Controllers\MessageController::class, 'contacts']);
    Route::get('/messages/{userId}', [App\Http\Controllers\MessageController::class, 'index']);
    Route::post('/messages', [App\Http\Controllers\MessageController::class, 'store']);
    Route::post('/messages/typing', [App\Http\Controllers\MessageController::class, 'typing']);

    // ===================================================
    // 🤖 INTELLIGENCE ARTIFICIELLE
    // ===================================================
    Route::post('/ai/analyze-prospect/{id}', [AIController::class, 'analyzeProspect']);
});
