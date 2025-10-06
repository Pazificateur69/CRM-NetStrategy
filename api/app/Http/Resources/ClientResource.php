<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'societe' => $this->societe,
            'gerant' => $this->gerant,
            'emails' => $this->emails ?? [],
            'telephones' => $this->telephones ?? [],
            'siret' => $this->siret,
            'contrat' => $this->contrat,
            'date_contrat' => $this->date_contrat,
            'date_echeance' => $this->date_echeance,
            'couleur_statut' => $this->couleur_statut ?? 'vert',

            // Relations chargées
            'prestations' => $this->whenLoaded('prestations', function () {
                return $this->prestations->map(fn ($p) => [
                    'id' => $p->id,
                    'type' => $p->type,
                    'responsable' => $p->responsable?->name,
                    'notes' => $p->notes,
                    'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
                ]);
            }),
            'todos' => $this->whenLoaded('todos'),
            'rappels' => $this->whenLoaded('rappels'),
            'contenu' => $this->whenLoaded('contenu'),

            // Dates
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
