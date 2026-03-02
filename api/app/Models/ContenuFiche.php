<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContenuFiche extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'pole',
        'texte',
        'chemin_fichier',
        'nom_original_fichier',
        'prestation_id',
        'user_id',
        'contenuable_id',
        'contenuable_type',
    ];


    public function contenuable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
