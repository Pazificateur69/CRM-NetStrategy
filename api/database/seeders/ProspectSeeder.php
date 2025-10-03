<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prospect;

class ProspectSeeder extends Seeder
{
    public function run(): void
    {
        Prospect::create([
            'societe' => 'Startup XYZ',
            'contact' => 'Alice Dupuis',
            'emails' => ['alice@xyz.com'],
            'telephones' => ['0707070707'],
            'statut' => 'en_attente',
        ]);

        Prospect::create([
            'societe' => 'Future Corp',
            'contact' => 'Marc Lefebvre',
            'emails' => ['contact@futurecorp.com'],
            'telephones' => ['0606060606'],
            'statut' => 'relance',
        ]);
    }
}
