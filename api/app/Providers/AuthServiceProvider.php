<?php

namespace App\Providers;

use App\Models\Prestation; // Import du modèle
use App\Policies\PrestationPolicy; // Import de la Policy
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
        Prestation::class => PrestationPolicy::class, // <-- NOUVELLE LIGNE
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}