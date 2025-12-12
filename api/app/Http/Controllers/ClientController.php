<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prestation;
use Illuminate\Http\Request;
use App\Http\Resources\ClientResource;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ClientsImport;
use App\Exports\ClientsTemplateExport;

class ClientController extends Controller
{
    /**
     * Liste des clients
     */
    public function index(): JsonResponse
    {
        $this->authorize('view clients');

        $clients = Client::with([
            'prestations.contenu.user',
            'prestations.responsable',
            'todos.user',
            'todos.assignedUser',
            'rappels.user',
            'rappels.assignedUsers',
            'contenu.user'
        ])->orderBy('created_at', 'desc')->get();

        return ClientResource::collection($clients)->response();
    }

    /**
     * Création d'un nouveau client
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'societe' => 'required|string|max:255',
            'gerant' => 'required|string|max:255',
            'siret' => 'nullable|string|max:14',
            'site_web' => 'nullable|string|max:255',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'emails' => 'required|array|min:1',
            'emails.*' => 'email|max:255',
            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',
            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
            'montant_mensuel_total' => 'nullable|numeric',
            'frequence_facturation' => 'nullable|string',
            'mode_paiement' => 'nullable|string',
            'iban' => 'nullable|string',
            'description_generale' => 'nullable|string',
            'notes_comptables' => 'nullable|string',
            'lien_externe' => 'nullable|string|url',
            'liens_externes' => 'nullable|array',
            'interlocuteurs' => 'nullable|array',
            'couleur_statut' => 'nullable|string',
        ]);

        // ✅ Création du client
        $client = Client::create($validated);

        // ✅ Création automatique des prestations de base
        $prestationTypes = ['Dev', 'SEO', 'Ads', 'Social Media', 'Branding', 'Comptabilite'];

        foreach ($prestationTypes as $type) {
            Prestation::create([
                'client_id' => $client->id,
                'type' => $type,
                'notes' => null,
                'assigned_user_id' => auth()->check() ? auth()->id() : null,
            ]);
        }

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    /**
     * Affichage détaillé d'un client
     */
    public function show($id): JsonResponse
    {
        $this->authorize('view clients');

        $client = Client::with([
            'prestations.contenu.user',
            'prestations.responsable',
            'todos.user',
            'todos.assignedUser',
            'todos.client:id,societe',
            'rappels.user',
            'rappels.assignedUsers',
            'contenu.user'
        ])->findOrFail($id);

        return (new ClientResource($client))->response();
    }

    /**
     * Mise à jour d'un client
     */
    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        $validated = $request->validate([
            'societe' => 'sometimes|required|string|max:255',
            'gerant' => 'sometimes|required|string|max:255',
            'siret' => 'nullable|string|max:14',
            'site_web' => 'nullable|string|max:255',
            'adresse' => 'nullable|string',
            'ville' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'emails' => 'sometimes|required|array|min:1',
            'emails.*' => 'email|max:255',
            'telephones' => 'nullable|array',
            'telephones.*' => 'string|max:50',
            'contrat' => 'nullable|string',
            'date_contrat' => 'nullable|date',
            'date_echeance' => 'nullable|date',
            'montant_mensuel_total' => 'nullable|numeric',
            'frequence_facturation' => 'nullable|string',
            'mode_paiement' => 'nullable|string',
            'iban' => 'nullable|string',
            'description_generale' => 'nullable|string',
            'notes_comptables' => 'nullable|string',
            'lien_externe' => 'nullable|string|url',
            'liens_externes' => 'nullable|array',
            'interlocuteurs' => 'nullable|array',
            'couleur_statut' => 'nullable|string',
        ]);

        $client->update($validated);

        // ✅ Recharger le client pour avoir toutes les données à jour
        $client->refresh();

        $client->load([
            'prestations.contenu.user',
            'prestations.responsable',
            'todos.user',
            'todos.assignedUser',
            'todos.client:id,societe',
            'rappels.user',
            'rappels.assignedUsers',
            'contenu.user'
        ]);

        return (new ClientResource($client))->response();
    }

    /**
     * Suppression d'un client
     */
    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('manage clients');

        $client->delete();

        return response()->json(['message' => 'Client supprimé avec succès.'], 200);
    }

    /**
     * Récupérer les informations comptables d'un client
     */
    public function getCompta($id): JsonResponse
    {
        $this->authorize('view clients');

        $client = Client::with(['prestations'])->findOrFail($id);

        return response()->json([
            'message' => 'Informations comptables récupérées avec succès.',
            'data' => [
                'client_id' => $client->id,
                'societe' => $client->societe,
                'montant_mensuel_total' => $client->montant_mensuel_total ?? 0,
                'frequence_facturation' => $client->frequence_facturation ?? 'Mensuel',
                'mode_paiement' => $client->mode_paiement ?? 'Virement',
                'iban' => $client->iban ?? '',
                'date_contrat' => $client->date_contrat,
                'date_echeance' => $client->date_echeance,
                'prestations' => $client->prestations->map(function ($prestation) {
                    return [
                        'id' => $prestation->id,
                        'type' => $prestation->type,
                        'tarif_ht' => $prestation->tarif_ht ?? 0,
                        'frequence' => $prestation->frequence,
                        'notes' => $prestation->notes,
                        'statut' => $prestation->statut,
                    ];
                }),
            ]
        ]);
    }

    /**
     * Importer des clients via Excel
     */
    public function import(Request $request): JsonResponse
    {
        $this->authorize('manage clients');

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        try {
            Excel::import(new ClientsImport, $request->file('file'));
            return response()->json(['message' => 'Import terminé avec succès.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'import : ' . $e->getMessage()], 500);
        }
    }

    /**
     * Télécharger le modèle d'import Excel
     */
    public function downloadTemplate()
    {
        return Excel::download(new ClientsTemplateExport, 'clients_template.xlsx');
    }
}