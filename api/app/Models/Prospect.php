<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Traits\Auditable;

class Prospect extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'societe',
        'contact',
        'emails',
        'telephones',
        'statut',
        'score_details',
        'couleur_statut',
        'adresse',
        'ville',
        'code_postal',
        'site_web',
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