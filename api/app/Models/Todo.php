<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Todo extends Model
{
    use HasFactory;

    protected $fillable = [
    'titre',
    'description',
    'date_echeance',
    'statut',
    'user_id',
    'pole',
    'client_id',
    'todoable_type',
    'todoable_id',
];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function todoable(): MorphTo
    {
        return $this->morphTo();
    }

    public function client()
{
    return $this->belongsTo(Client::class);
}

}
