<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'pole',
        'notification_preferences',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'notification_preferences' => 'array',
    ];

    /**
     * 🔁 Booted : assigne automatiquement un pôle selon le rôle à la création
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->pole) && !empty($user->role)) {
                $user->pole = match ($user->role) {
                    'admin' => 'admin',        // ✅ l’admin aura son pôle à lui
                    'com' => 'com',
                    'rh' => 'rh',
                    'reseaux' => 'reseaux',
                    'dev' => 'dev',
                    default => 'general',
                };
            }
        });
    }


    // 🔹 Relations
    public function todos()
    {
        return $this->hasMany(Todo::class);
    }

    public function rappels()
    {
        return $this->hasMany(Rappel::class);
    }
}
