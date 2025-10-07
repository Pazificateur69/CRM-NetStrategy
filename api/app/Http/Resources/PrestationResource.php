<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrestationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'type' => $this->type,
            'notes' => $this->notes,
            'assigned_user_id' => $this->assigned_user_id,
            'tarif_ht' => $this->tarif_ht !== null ? (float) $this->tarif_ht : null,
            'frequence' => $this->frequence,
            'engagement_mois' => $this->engagement_mois,
            'date_debut' => $this->date_debut,
            'date_fin' => $this->date_fin,
            'responsable' => $this->responsable ? [
                'id' => $this->responsable->id,
                'name' => $this->responsable->name,
            ] : null,
            'contenu' => $this->whenLoaded('contenu', function () {
                return $this->contenu->map(function ($contenu) {
                    return [
                        'id' => $contenu->id,
                        'type' => $contenu->type,
                        'texte' => $contenu->texte,
                        'chemin_fichier' => $contenu->chemin_fichier,
                        'nom_original_fichier' => $contenu->nom_original_fichier,
                        'user' => $contenu->relationLoaded('user') && $contenu->user ? [
                            'id' => $contenu->user->id,
                            'name' => $contenu->user->name,
                        ] : null,
                        'created_at' => $contenu->created_at?->format('Y-m-d H:i:s'),
                        'updated_at' => $contenu->updated_at?->format('Y-m-d H:i:s'),
                    ];
                })->values();
            }),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
