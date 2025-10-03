<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'statut',
        'date_echeance',
        'todoable_id',
        'todoable_type',
    ];

    protected $casts = [
        'date_echeance' => 'date',
    ];

    public function todoable()
    {
        return $this->morphTo();
    }
}
