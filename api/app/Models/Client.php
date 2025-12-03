<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Client extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'societe',
        'gerant',
        'siret',
        'site_web',
        'adresse',
        'ville',
        'code_postal',
        'emails',
        'telephones',
        'contrat',
        'date_contrat',
        'date_echeance',
        'montant_mensuel_total',
        'frequence_facturation',
        'mode_paiement',
        'iban',
        'description_generale',
        'notes_comptables',
        'lien_externe',
        'liens_externes',
        'interlocuteurs',
        'couleur_statut',
    ];

    protected $casts = [
        'emails' => 'array',
        'telephones' => 'array',
        'liens_externes' => 'array',
        'interlocuteurs' => 'array',
        'date_contrat' => 'datetime',
        'date_echeance' => 'datetime',
        'montant_mensuel_total' => 'decimal:2',
    ];

    // ✅ Relations directes (corrigées pour utiliser client_id)
    public function todos(): HasMany
    {
        return $this->hasMany(Todo::class, 'client_id')->orderBy('created_at', 'desc');
    }

    public function rappels(): HasMany
    {
        return $this->hasMany(Rappel::class, 'client_id')->orderBy('created_at', 'desc');
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