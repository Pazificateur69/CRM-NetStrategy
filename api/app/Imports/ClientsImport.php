<?php

namespace App\Imports;

use App\Models\Client;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ClientsImport implements ToModel, WithHeadingRow
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // On vérifie que la société est présente, sinon on ignore ou on met un placeholder
        if (empty($row['societe'])) {
            return null;
        }

        return new Client([
            'societe' => $row['societe'],
            'gerant' => $row['gerant'] ?? 'N/C',
            'emails' => $this->parseList($row['email'] ?? $row['emails'] ?? ''),
            'telephones' => $this->parseList($row['telephone'] ?? $row['telephones'] ?? ''),
            'site_web' => $row['site_web'] ?? null,
            'adresse' => $row['adresse'] ?? null,
            'ville' => $row['ville'] ?? null,
            'code_postal' => $row['code_postal'] ?? null,
            'siret' => $row['siret'] ?? null,
            'mode_paiement' => $row['mode_paiement'] ?? 'Virement',
            'frequence_facturation' => $row['frequence'] ?? 'Mensuel',
            'couleur_statut' => 'vert',
        ]);
    }

    private function parseList($value)
    {
        if (empty($value))
            return [];
        // Supporte virgule ou point-virgule
        return array_map('trim', preg_split('/[,;]/', $value));
    }
}
