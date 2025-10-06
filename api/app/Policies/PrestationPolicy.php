<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Prestation;
use Illuminate\Auth\Access\Response;

class PrestationPolicy
{
    /**
     * Permet aux admins de contourner toute vérification.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return null;
    }

    /**
     * Détermine si l'utilisateur peut voir la prestation.
     */
    public function view(User $user, Prestation $prestation): bool
    {
        $permissionNeeded = 'access ' . strtolower(str_replace(' ', '_', $prestation->type));
        
        // 1. L'utilisateur doit avoir la permission d'accès au module (ex: access seo)
        if ($user->can($permissionNeeded)) {
            
            // 2. Si non assigné spécifiquement, ou si l'utilisateur est l'assigné
            if ($prestation->assigned_user_id === null || $user->id === $prestation->assigned_user_id) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Détermine si l'utilisateur peut mettre à jour la prestation.
     * Les règles sont plus strictes ici: Seuls l'assigné et l'admin peuvent modifier.
     */
    public function update(User $user, Prestation $prestation): bool
    {
        return $user->id === $prestation->assigned_user_id;
    }
    
    // Pour les autres actions (create, delete, etc.), la vérification se fait via le middleware de permission sur le contrôleur.
}