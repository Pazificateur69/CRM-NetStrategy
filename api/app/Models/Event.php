<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Client;

class Event extends Model
{
    protected $fillable = [
        'title',
        'start',
        'end',
        'description',
        'type',
        'user_id',
        'client_id',
        'prospect_id',
    ];

    protected $casts = [
        'start' => 'datetime',
        'end' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function prospect()
    {
        return $this->belongsTo(Prospect::class);
    }
}
