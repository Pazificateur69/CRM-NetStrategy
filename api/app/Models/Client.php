<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'societe',
        'gerant',
        'siret',
        'emails',
        'telephones',
        'contrat',
        'date_contrat',
        'date_echeance',
    ];

    protected $casts = [
        'emails' => 'array',
        'telephones' => 'array',
        'date_contrat' => 'datetime',
        'date_echeance' => 'datetime',
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
