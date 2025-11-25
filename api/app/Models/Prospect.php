<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Prospect extends Model
{
    use HasFactory;

    protected $fillable = [
        'societe',
        'contact',
        'emails',
        'telephones',
        'statut',
        'score',
        'score_details',
    ];

    protected $casts = [
        'emails' => 'array',
        'telephones' => 'array',
        'score_details' => 'array',
    ];

    public function todos(): MorphMany
    {
        return $this->morphMany(Todo::class, 'todoable');
    }

    public function rappels(): MorphMany
    {
        return $this->morphMany(Rappel::class, 'rappelable');
    }

    public function contenu(): MorphMany // NOUVEAU
    {
        return $this->morphMany(ContenuFiche::class, 'contenuable');
    }
}