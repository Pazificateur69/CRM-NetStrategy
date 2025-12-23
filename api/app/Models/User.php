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
        'notification_preferences',
        'dashboard_preferences',
        'pole',
        'google_calendar_token',
        'last_seen_at', // ✅ Track user presence
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
        'google_calendar_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'notification_preferences' => 'array',
        'dashboard_preferences' => 'array',
        'two_factor_confirmed_at' => 'datetime',
        'google_calendar_token' => 'array',
        'last_seen_at' => 'datetime', // ✅ Auto-cast to Carbon
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

    public function loginHistory()
    {
        return $this->hasMany(LoginHistory::class);
    }

    public function assignedTodos()
    {
        return $this->hasMany(Todo::class, 'assigned_to');
    }

    public function assignedRappels()
    {
        return $this->belongsToMany(Rappel::class, 'rappel_user');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
