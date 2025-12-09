<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Votre récapitulatif quotidien</title>
    <style>
        body {
            font-family: sans-serif;
            background-color: #f3f4f6;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #111827;
            font-size: 24px;
            margin-bottom: 10px;
        }

        h2 {
            color: #374151;
            font-size: 18px;
            margin-top: 25px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }

        ul {
            padding-left: 20px;
        }

        li {
            margin-bottom: 8px;
            color: #4b5563;
        }

        .empty {
            color: #9ca3af;
            font-style: italic;
        }

        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: bold;
            background: #e5e7eb;
            color: #374151;
        }

        .priority-high {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Bonjour {{ $user->name }} 👋</h1>
        <p>Voici votre programme pour la journée du {{ now()->translatedFormat('l d F Y') }} :</p>

        <!-- RAPPELS -->
        <h2>⏰ Rappels du jour</h2>
        @if(count($rappels) > 0)
            <ul>
                @foreach($rappels as $rappel)
                    <li>
                        <strong>{{ $rappel->titre }}</strong>
                        @if($rappel->prospect)
                            <br><small>Prospect: {{ $rappel->prospect->societe }}</small>
                        @endif
                    </li>
                @endforeach
            </ul>
        @else
            <p class="empty">Aucun rappel pour aujourd'hui.</p>
        @endif

        <!-- TODOS -->
        <h2>✅ Tâches à faire</h2>
        @if(count($todos) > 0)
            <ul>
                @foreach($todos as $todo)
                    <li>
                        <span class="badge {{ $todo->priorite === 'high' ? 'priority-high' : '' }}">{{ $todo->priorite }}</span>
                        {{ $todo->titre }}
                    </li>
                @endforeach
            </ul>
        @else
            <p class="empty">Toutes les tâches sont terminées !</p>
        @endif

        <!-- RENDEZ-VOUS -->
        <h2>📅 Rendez-vous</h2>
        @if(count($events) > 0)
            <ul>
                @foreach($events as $event)
                    <li>
                        <strong>{{ \Carbon\Carbon::parse($event->start)->format('H:i') }}</strong> - {{ $event->title }}
                    </li>
                @endforeach
            </ul>
        @else
            <p class="empty">Aucun rendez-vous prévu.</p>
        @endif

        <div class="footer">
            <p>Bonne journée ! <br> L'équipe CRM NetStrategy</p>
        </div>
    </div>
</body>

</html>