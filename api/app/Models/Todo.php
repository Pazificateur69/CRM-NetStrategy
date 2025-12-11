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
        'priorite', // ✅ haute, moyenne, basse
        'pole',
        'user_id',
        'client_id',
        'todoable_id',
        'todoable_type',
        'assigned_to', // ✅ utilisateur assigné à la tâche
        'prospect_id',
        'rappel_id',
        'review_status',
        'approver_id',
        'review_comment',
        'project_id',
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

    public function project()
    {
        return $this->belongsTo(\App\Models\Project::class);
    }

}
