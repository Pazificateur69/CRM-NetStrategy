<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prestation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'type',
        'notes',
        'responsable',
        'created_at',
        'updated_at',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function responsable()
{
    return $this->belongsTo(User::class, 'responsable_id');
}


    public function contenu()
    {
        return $this->hasMany(ContenuFiche::class);
    }
}
