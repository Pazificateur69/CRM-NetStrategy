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
            'adresse' => $this->adresse,
            'ville' => $this->ville,
            'code_postal' => $this->code_postal,
            'site_web' => $this->site_web,
            'description_generale' => $this->description_generale,
            'emails' => $this->emails ?? [],
            'telephones' => $this->telephones ?? [],
            'siret' => $this->siret,
            'contrat' => $this->contrat,
            'date_contrat' => $this->date_contrat,
            'date_echeance' => $this->date_echeance,
            'montant_mensuel_total' => $this->montant_mensuel_total !== null
                ? (float) $this->montant_mensuel_total
                : null,
            'frequence_facturation' => $this->frequence_facturation,
            'mode_paiement' => $this->mode_paiement,
            'iban' => $this->iban,
            'notes_comptables' => $this->notes_comptables,
            'couleur_statut' => $this->couleur_statut ?? 'vert',

            // Relations chargées
            'prestations' => $this->whenLoaded('prestations', function () use ($request) {
                $prestations = $this->prestations;

                if ($request->user() && !$request->user()->hasRole('admin')) {
                    $prestations = $prestations->filter(fn ($prestation) => $request->user()->can('view', $prestation));
                }

                return $prestations->map(function ($prestation) {
                    return [
                        'id' => $prestation->id,
                        'type' => $prestation->type,
                        'notes' => $prestation->notes,
                        'tarif_ht' => $prestation->tarif_ht !== null
                            ? (float) $prestation->tarif_ht
                            : null,
                        'frequence' => $prestation->frequence,
                        'engagement_mois' => $prestation->engagement_mois,
                        'date_debut' => $prestation->date_debut,
                        'date_fin' => $prestation->date_fin,
                        'responsable' => $prestation->responsable
                            ? [
                                'id' => $prestation->responsable->id,
                                'name' => $prestation->responsable->name,
                            ]
                            : null,
                        'contenu' => $prestation->relationLoaded('contenu')
                            ? $prestation->contenu->map(function ($contenu) {
                                return [
                                    'id' => $contenu->id,
                                    'type' => $contenu->type,
                                    'texte' => $contenu->texte,
                                    'chemin_fichier' => $contenu->chemin_fichier,
                                    'nom_original_fichier' => $contenu->nom_original_fichier,
                                    'user' => $contenu->relationLoaded('user') && $contenu->user
                                        ? [
                                            'id' => $contenu->user->id,
                                            'name' => $contenu->user->name,
                                        ]
                                        : null,
                                    'created_at' => $contenu->created_at?->format('Y-m-d H:i:s'),
                                ];
                            })->values()
                            : [],
                        'created_at' => $prestation->created_at?->format('Y-m-d H:i:s'),
                        'updated_at' => $prestation->updated_at?->format('Y-m-d H:i:s'),
                    ];
                })->values();
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
