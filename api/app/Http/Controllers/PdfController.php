<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;

class PdfController extends Controller
{
    /**
     * Générer la fiche client en PDF
     */
    public function exportClient($id)
    {
        try {
            $client = Client::with([
                'todos' => function ($q) {
                    $q->orderBy('date_echeance');
                },
                'prestations',
                'contenu' => function ($q) {
                    $q->where('type', '!=', 'Fichier');
                }
            ])->findOrFail($id);

            // Render blade view to HTML
            $html = view('pdf.client_pdf', compact('client'))->render();

            // Configure Dompdf
            $options = new Options();
            $options->set('defaultFont', 'sans-serif');
            $options->set('isRemoteEnabled', true);
            $options->set('isHtml5ParserEnabled', true);

            $dompdf = new Dompdf($options);
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();

            // Determine filename
            $filename = 'Fiche_Client_' . str_replace(' ', '_', $client->societe) . '_' . date('Ymd') . '.pdf';

            return response($dompdf->output(), 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            \Log::error('PDF Export Error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Erreur lors de la génération du PDF',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
