<?php

namespace App\Http\Resources\Web;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'office' => $this->whenLoaded('office', function () {
                return [
                    'id' => $this->office->id,
                    'name' => $this->office->name,
                ];
            }),
            'status' => $this->status,

            'roles' => $this->roles->map(
                fn($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ],
            ),
        ];
    }
}
