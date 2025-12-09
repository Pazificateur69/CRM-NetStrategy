<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Fiche Client - {{ $client->societe }}</title>
    <style>
        body {
            font-family: sans-serif;
            color: #333;
            line-height: 1.6;
        }

        .header {
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
        }

        .client-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        h1 {
            font-size: 20px;
            margin-bottom: 5px;
            color: #1e293b;
        }

        h2 {
            font-size: 16px;
            margin-top: 20px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            color: #475569;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 14px;
        }

        th,
        td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            color: #64748b;
            font-weight: 600;
        }

        .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-planifie {
            background: #f1f5f9;
            color: #64748b;
        }

        .status-termine {
            background: #dcfce7;
            color: #166534;
        }

        .status-retard {
            background: #ffe4e6;
            color: #9f1239;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo">Net Strategy</div>
        <div style="font-size: 12px; color: #64748b;">Fiche Client générée le {{ date('d/m/Y') }}</div>
    </div>

    <div class="client-info">
        <h1>{{ $client->societe }}</h1>
        <div><strong>Contact :</strong> {{ $client->prenom }} {{ $client->nom }}</div>
        <div><strong>Email :</strong> {{ $client->email }}</div>
        <div><strong>Téléphone :</strong> {{ $client->telephone }}</div>
        <div><strong>Statut :</strong> {{ ucfirst($client->statut) }}</div>
    </div>

    <h2>Historique des Interactions</h2>
    @if($client->activites->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                @foreach($client->activites as $activite)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($activite->created_at)->format('d/m/Y') }}</td>
                        <td>{{ ucfirst($activite->type) }}</td>
                        <td>{{ $activite->description }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p style="font-style: italic; color: #94a3b8;">Aucune interaction enregistrée.</p>
    @endif

    <h2>Tâches Associées</h2>
    @if($client->todos->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Titre</th>
                    <th>Échéance</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                @foreach($client->todos as $todo)
                    <tr>
                        <td>{{ $todo->titre }}</td>
                        <td>{{ $todo->date_echeance ? \Carbon\Carbon::parse($todo->date_echeance)->format('d/m/Y') : '-' }}</td>
                        <td>{{ ucfirst($todo->priorite) }}</td>
                        <td>
                            <span class="status status-{{ $todo->statut }}">
                                {{ str_replace('_', ' ', ucfirst($todo->statut)) }}
                            </span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p style="font-style: italic; color: #94a3b8;">Aucune tâche en cours.</p>
    @endif
</body>

</html>