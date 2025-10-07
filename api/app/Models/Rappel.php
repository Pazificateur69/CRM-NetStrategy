<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rappel extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'date_rappel',
        'statut',
        'pole',
        'user_id',
        'client_id',
        'rappelable_id',
        'rappelable_type',
    ];

    public function rappelable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
