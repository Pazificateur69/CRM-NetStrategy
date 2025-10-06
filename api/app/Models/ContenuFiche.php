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
        'texte',
        'chemin_fichier',
        'nom_original_fichier',
        'prestation_id',
        'user_id',
    ];

    public function contennuable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
