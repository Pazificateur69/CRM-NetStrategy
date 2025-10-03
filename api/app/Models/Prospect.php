<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prospect extends Model
{
    use HasFactory;

    protected $fillable = [
        'societe',
        'contact',
        'emails',
        'telephones',
        'statut',
    ];

    protected $casts = [
        'emails' => 'array',
        'telephones' => 'array',
    ];

    public function todos()
    {
        return $this->morphMany(Todo::class, 'todoable');
    }

    public function rappels()
    {
        return $this->morphMany(Rappel::class, 'rappelable');
    }
}
