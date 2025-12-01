<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProspectResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'societe' => $this->societe,
            'contact' => $this->contact,
            'emails' => $this->emails,
            'telephones' => $this->telephones,
            'statut' => $this->statut,
            'score' => $this->score,
            'score_details' => $this->score_details,
            'couleur_statut' => $this->couleur_statut ?? 'orange',
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'code_postal' => $this->code_postal,
            'site_web' => $this->site_web,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relations (chargées conditionnellement)
            'todos' => TodoResource::collection($this->whenLoaded('todos')),
            'rappels' => $this->whenLoaded('rappels'), // On pourra faire un RappelResource plus tard
            'contenu' => $this->whenLoaded('contenu'),
        ];
    }
}
