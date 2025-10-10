<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prestation extends Model
{
    use HasFactory;

    protected $table = 'prestations';

    protected $fillable = [
        'client_id',
        'assigned_user_id',
        'type',
        'tarif_ht',
        'frequence',
        'engagement_mois',
        'date_debut',
        'date_fin',
        'notes',
    ];

    protected $casts = [
        'tarif_ht' => 'decimal:2',
        'engagement_mois' => 'integer',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    /**
     * 🔗 Relation vers le client parent
     */
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * 🔗 Utilisateur responsable de la prestation (optionnel)
     */
    public function responsable()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * 📂 Contenus ou fichiers liés à cette prestation
     */
    public function contenu()
    {
        return $this->hasMany(ContenuFiche::class);
    }
}
