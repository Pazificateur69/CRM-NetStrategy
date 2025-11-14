<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'poste',
        'nom',
        'telephone',
        'email',
        'notes',
        'document_path',
    ];

    /**
     * Get the client that owns the contact.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
