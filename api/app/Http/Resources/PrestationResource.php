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
            'assigned_user_id' => $this->assigned_user_id,
            'type' => $this->type,
            'tarif_ht' => $this->tarif_ht,
            'frequence' => $this->frequence,
            'engagement_mois' => $this->engagement_mois,
            'date_debut' => $this->date_debut,
            'date_fin' => $this->date_fin,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
