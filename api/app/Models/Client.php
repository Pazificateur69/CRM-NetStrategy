<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'societe',
        'gerant',
        'adresse',
        'ville',
        'code_postal',
        'site_web',
        'description_generale',
        'siret',
        'emails',
        'telephones',
        'contrat',
        'date_contrat',
        'date_echeance',
        'montant_mensuel_total',
        'frequence_facturation',
        'mode_paiement',
        'iban',
        'notes_comptables',
    ];

    protected $casts = [
        'emails' => 'array',
        'telephones' => 'array',
        'date_contrat' => 'datetime',
        'date_echeance' => 'datetime',
        'montant_mensuel_total' => 'decimal:2',
    ];

    // ✅ Relations polymorphiques
    public function todos(): MorphMany
    {
        return $this->morphMany(Todo::class, 'todoable');
    }

    public function rappels(): MorphMany
    {
        return $this->morphMany(Rappel::class, 'rappelable');
    }

    public function contenu(): MorphMany
    {
        return $this->morphMany(ContenuFiche::class, 'contenuable');
    }

    // ✅ Relation simple
    public function prestations(): HasMany
    {
        return $this->hasMany(Prestation::class);
    }
}
