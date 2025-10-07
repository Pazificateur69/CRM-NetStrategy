<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Prestation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'type',
        'notes',
        'assigned_user_id',
        'tarif_ht',
        'frequence',
        'engagement_mois',
        'date_debut',
        'date_fin',
    ];

    protected $casts = [
        'tarif_ht' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public const TYPE_PERMISSION_MAP = [
        'Dev' => 'access dev',
        'SEO' => 'access seo',
        'Ads' => 'access ads',
        'Social Media' => 'access social media',
        'Branding' => 'access branding',
        'Comptabilite' => 'access comptabilite',
    ];

    public static function permissionForType(string $type): string
    {
        return self::TYPE_PERMISSION_MAP[$type] ?? 'view clients';
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function contenu(): MorphMany
    {
        return $this->morphMany(ContenuFiche::class, 'contenuable');
    }
}
