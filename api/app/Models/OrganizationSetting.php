<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
    ];
}
