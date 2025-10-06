<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // On lie manuellement les middlewares Spatie pour éviter l’erreur "Target class [permission] does not exist"
        $this->app->bind('permission', PermissionMiddleware::class);
        $this->app->bind('role', RoleMiddleware::class);
        $this->app->bind('role_or_permission', RoleOrPermissionMiddleware::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
