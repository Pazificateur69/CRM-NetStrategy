<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        Client::create([
            'societe' => 'Alpha SARL',
            'gerant' => 'Jean Dupont',
            'siret' => '12345678900011',
            'emails' => ['contact@alpha.fr'],
            'telephones' => ['0601020304'],
            'contrat' => 'Site 1450 + SEO 350/24 mois',
            'date_contrat' => now()->subMonths(2),
            'date_echeance' => now()->addMonths(22),
        ]);

        Client::create([
            'societe' => 'Beta Industries',
            'gerant' => 'Claire Martin',
            'siret' => '98765432100022',
            'emails' => ['info@beta.com', 'support@beta.com'],
            'telephones' => ['0611223344', '0145789652'],
            'contrat' => 'SEO 500€/mois',
            'date_contrat' => now()->subMonths(6),
            'date_echeance' => now()->addMonths(18),
        ]);
    }
}
