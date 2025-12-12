<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ClientsTemplateExport implements FromArray, WithHeadings, ShouldAutoSize
{
    /**
     * @return array
     */
    public function array(): array
    {
        return [
            [
                'NetStrategy',
                'Jean Dupont',
                'contact@net-strategy.fr, compta@net-strategy.fr',
                '0601020304',
                'https://net-strategy.fr',
                '10 Rue de Rivoli',
                'Paris',
                '75001',
                '12345678900012',
                'Mensuel',
                'Virement'
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'societe',
            'gerant',
            'emails',
            'telephones',
            'site_web',
            'adresse',
            'ville',
            'code_postal',
            'siret',
            'frequence',
            'mode_paiement'
        ];
    }
}
