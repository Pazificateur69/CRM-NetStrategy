<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Client;
use App\Models\User;

class Rappel extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'date_rappel',
        'fait',
        'statut',
        'ordre', // ✅ indispensable
        'priorite', // ✅ haute, moyenne, basse
        'pole',
        'user_id',
        'client_id',
        'rappelable_id',
        'rappelable_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function rappelable()
    {
        return $this->morphTo();
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'rappel_user');
    }

}
