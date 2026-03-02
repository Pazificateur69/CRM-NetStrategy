<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rappels du jour</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333;">
  <h2>Bonjour {{ $user->name }},</h2>
  <p>Voici vos rappels prévus pour aujourd'hui :</p>

  <ul>
    @foreach ($rappels as $rappel)
      <li>
        <strong>{{ $rappel->titre }}</strong><br>
        {{ $rappel->description ?? '—' }}<br>
        <small>Prévu le : {{ \Carbon\Carbon::parse($rappel->date_rappel)->format('d/m/Y') }}</small>
      </li>
      <br>
    @endforeach
  </ul>

  <p>Bonne journée 🌞<br>L'équipe Net Strategy CRM</p>
</body>
</html>
