<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RappelResource extends JsonResource
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
            'titre' => $this->titre,
            'description' => $this->description,
            'date_rappel' => $this->date_rappel,
            'fait' => (bool) $this->fait,
            'statut' => $this->statut,
            'priorite' => $this->priorite,
            'ordre' => $this->ordre,
            'pole' => $this->pole,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relations
            'client' => $this->whenLoaded('rappelable', function () {
                return $this->rappelable_type === 'App\Models\Client'
                    ? ['id' => $this->rappelable->id, 'societe' => $this->rappelable->societe]
                    : null; // Gérer d'autres types si nécessaire
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'pole' => $this->user->pole,
                ];
            }),
            'assigned_users' => $this->whenLoaded('assignedUsers', function () {
                return $this->assignedUsers->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'pole' => $user->pole,
                    ];
                });
            }),
        ];
    }
}
