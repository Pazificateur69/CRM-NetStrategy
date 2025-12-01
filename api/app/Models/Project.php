<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\Client;
use App\Models\User;
use App\Models\Todo;

class Project extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
        'start_date',
        'due_date',
        'client_id',
        'user_id',
        'budget',
        'progress',
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tasks()
    {
        return $this->hasMany(Todo::class);
    }
}
