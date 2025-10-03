<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rappel extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'description',
        'date_rappel',
        'fait',
        'rappelable_id',
        'rappelable_type',
    ];

    protected $casts = [
        'date_rappel' => 'datetime',
        'fait' => 'boolean',
    ];

    public function rappelable()
    {
        return $this->morphTo();
    }
}
