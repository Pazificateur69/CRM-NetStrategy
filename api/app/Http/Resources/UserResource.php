<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'pole' => $this->pole,
            'notification_preferences' => $this->notification_preferences,
            'dashboard_preferences' => $this->dashboard_preferences,
            'last_seen_at' => $this->last_seen_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // Roles & Permissions if needed (eager loaded via Spatie)
            'roles' => $this->whenLoaded('roles', function () {
                return $this->getRoleNames();
            }),
            'permissions' => $this->whenLoaded('permissions', function () {
                return $this->getAllPermissions()->pluck('name');
            }),
        ];
    }
}
