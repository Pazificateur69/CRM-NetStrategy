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
            'site_web' => $this->site_web,
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'code_postal' => $this->code_postal,
            'description_generale' => $this->description_generale,
            'notes_comptables' => $this->notes_comptables,
            'lien_externe' => $this->lien_externe,
            'liens_externes' => $this->liens_externes ?? [],
            'interlocuteurs' => $this->interlocuteurs ?? [],
            'contrat' => $this->contrat,
            'date_contrat' => $this->date_contrat,
            'date_echeance' => $this->date_echeance,
            'montant_mensuel_total' => $this->montant_mensuel_total,
            'frequence_facturation' => $this->frequence_facturation,
            'mode_paiement' => $this->mode_paiement,
            'iban' => $this->iban,
            'couleur_statut' => $this->couleur_statut ?? 'vert',

            // Relations chargées
            'prestations' => $this->whenLoaded('prestations', function () {
                return $this->prestations->map(fn($p) => [
                    'id' => $p->id,
                    'type' => $p->type,
                    'responsable' => $p->responsable?->name,
                    'notes' => $p->notes,
                    'tarif_ht' => $p->tarif_ht,
                    'frequence' => $p->frequence,
                    'statut' => $p->statut,
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
