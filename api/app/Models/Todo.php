<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Client;
use App\Models\User;

class Todo extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'date_echeance',
        'statut',
        'ordre', // ✅ indispensable
        'pole',
        'user_id',
        'client_id',
        'todoable_id',
        'todoable_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function todoable()
    {
        return $this->morphTo();
    }
    public function assignedUser()
{
    return $this->belongsTo(User::class, 'assigned_to');
}

}
