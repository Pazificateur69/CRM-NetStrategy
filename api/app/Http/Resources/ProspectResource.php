<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProspectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'societe' => $this->societe,
            'contact' => $this->contact,
            'emails' => $this->emails ?? [],
            'telephones' => $this->telephones ?? [],
            'statut' => $this->statut,
            'couleur_statut' => $this->couleur_statut ?? 'vert',

            // Relations
            'todos' => $this->whenLoaded('todos'),
            'rappels' => $this->whenLoaded('rappels'),
            'contenu' => $this->whenLoaded('contenu'),

            // Dates
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
