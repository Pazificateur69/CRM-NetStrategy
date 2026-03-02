<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TodoResource extends JsonResource
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
            'statut' => $this->statut,
            'priorite' => $this->priorite,
            'date_echeance' => $this->date_echeance,
            'ordre' => $this->ordre,
            'pole' => $this->pole,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Relations
            'client' => $this->whenLoaded('client', function () {
                return [
                    'id' => $this->client->id,
                    'societe' => $this->client->societe,
                ];
            }),
            'entity' => $this->whenLoaded('todoable', function () {
                if (!$this->todoable) {
                    return null;
                }
                return [
                    'type' => class_basename($this->todoable_type),
                    'id' => $this->todoable->id,
                    'name' => $this->todoable->societe,
                ];
            }),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'pole' => $this->user->pole,
                ];
            }),
            'assigned_user' => $this->whenLoaded('assignedUser', function () {
                return [
                    'id' => $this->assignedUser->id,
                    'name' => $this->assignedUser->name,
                    'email' => $this->assignedUser->email,
                    'pole' => $this->assignedUser->pole,
                ];
            }),
        ];
    }
}
