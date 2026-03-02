<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Fiche Client - {{ $client->societe }}</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }

        .header {
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
        }

        .date {
            font-size: 11px;
            color: #64748b;
            margin-top: 5px;
        }

        .section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #4f46e5;
        }

        h1 {
            font-size: 22px;
            margin: 0 0 10px 0;
            color: #1e293b;
        }

        h2 {
            font-size: 14px;
            margin: 20px 0 10px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-grid {
            display: table;
            width: 100%;
        }

        .info-row {
            display: table-row;
        }

        .info-label {
            display: table-cell;
            padding: 5px 10px 5px 0;
            color: #64748b;
            font-weight: 600;
            width: 140px;
            vertical-align: top;
        }

        .info-value {
            display: table-cell;
            padding: 5px 0;
            color: #1e293b;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
        }

        th,
        td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 600;
        }

        .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-planifie,
        .status-todo {
            background: #f1f5f9;
            color: #64748b;
        }

        .status-termine,
        .status-done {
            background: #dcfce7;
            color: #166534;
        }

        .status-retard,
        .status-overdue {
            background: #ffe4e6;
            color: #9f1239;
        }

        .status-en_cours,
        .status-in_progress {
            background: #dbeafe;
            color: #1e40af;
        }

        .empty {
            font-style: italic;
            color: #94a3b8;
            padding: 10px 0;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo">Net Strategy</div>
        <div class="date">Fiche Client générée le {{ date('d/m/Y à H:i') }}</div>
    </div>

    <div class="section">
        <h1>{{ $client->societe }}</h1>

        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Contact principal</div>
                <div class="info-value">{{ $client->gerant ?? 'Non spécifié' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Email(s)</div>
                <div class="info-value">
                    @if(is_array($client->emails) && count($client->emails) > 0)
                        {{ implode(', ', $client->emails) }}
                    @elseif($client->email)
                        {{ $client->email }}
                    @else
                        -
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone(s)</div>
                <div class="info-value">
                    @if(is_array($client->telephones) && count($client->telephones) > 0)
                        {{ implode(', ', $client->telephones) }}
                    @elseif($client->phone)
                        {{ $client->phone }}
                    @else
                        -
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Adresse</div>
                <div class="info-value">
                    {{ $client->adresse ?? '' }}
                    @if($client->code_postal || $client->ville)
                        <br>{{ $client->code_postal }} {{ $client->ville }}
                    @endif
                </div>
            </div>
            @if($client->site_web)
                <div class="info-row">
                    <div class="info-label">Site Web</div>
                    <div class="info-value">{{ $client->site_web }}</div>
                </div>
            @endif
            @if($client->siret)
                <div class="info-row">
                    <div class="info-label">SIRET</div>
                    <div class="info-value">{{ $client->siret }}</div>
                </div>
            @endif
        </div>
    </div>

    @if($client->description_generale)
        <h2>Description</h2>
        <p>{{ $client->description_generale }}</p>
    @endif

    @if($client->prestations && $client->prestations->count() > 0)
        <h2>Prestations Actives</h2>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Tarif HT</th>
                    <th>Fréquence</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                @foreach($client->prestations as $prestation)
                    <tr>
                        <td>{{ $prestation->type }}</td>
                        <td>{{ number_format($prestation->tarif_ht ?? 0, 2, ',', ' ') }} €</td>
                        <td>{{ $prestation->frequence ?? 'Mensuel' }}</td>
                        <td>
                            <span class="status status-{{ strtolower($prestation->statut ?? 'actif') }}">
                                {{ $prestation->statut ?? 'Actif' }}
                            </span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <h2>Tâches Associées</h2>
    @if($client->todos && $client->todos->count() > 0)
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
                        <td>{{ ucfirst($todo->priorite ?? 'normale') }}</td>
                        <td>
                            <span class="status status-{{ str_replace(' ', '_', strtolower($todo->statut ?? 'todo')) }}">
                                {{ str_replace('_', ' ', ucfirst($todo->statut ?? 'À faire')) }}
                            </span>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="empty">Aucune tâche en cours.</p>
    @endif

    @if($client->contenu && $client->contenu->count() > 0)
        <h2>Documents & Notes</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                @foreach($client->contenu->take(10) as $item)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($item->created_at)->format('d/m/Y') }}</td>
                        <td>{{ ucfirst($item->type) }}</td>
                        <td>{{ \Illuminate\Support\Str::limit($item->texte ?? $item->titre ?? '-', 100) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        Document généré automatiquement par NetStrategy CRM - {{ date('Y') }}
    </div>
</body>

</html>