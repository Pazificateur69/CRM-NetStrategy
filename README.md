# 🚀 Next Gen CRM - Guide de Démarrage

Ce CRM utilise une architecture moderne composée de plusieurs services qui doivent tourner simultanément pour que toutes les fonctionnalités (IA, Chat Temps Réel, Backend, Frontend) soient opérationnelles.

## 📋 Prérequis

Assurez-vous d'avoir installé :
- **PHP 8.2+** (avec extensions sqlite, curl, fileinfo)
- **Node.js 18+** & NPM
- **Composer**
- **Ollama** (pour l'intelligence artificielle)

---

## 🛠️ Installation Rapide

Si c'est la première fois que vous lancez le projet :

1. **Backend (Laravel)**
   ```bash
   cd api
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate:fresh --seed
   php artisan storage:link
   ```

2. **Frontend (Next.js)**
   ```bash
   cd front
   npm install
   ```

---

## ▶️ Comment Lancer le CRM (Quotidien)

Vous devez ouvrir **5 terminaux** différents (ou utiliser un gestionnaire de processus comme Supervisor).

### 1. Intelligence Artificielle (Ollama)
Sert le modèle LLM pour les analyses de prospects.
```bash
ollama serve
```

### 2. Backend (Laravel API)
Sert l'API REST à l'adresse `http://localhost:8000`.
```bash
cd api
php artisan serve
```

### 3. WebSockets (Reverb)
Gère le chat en temps réel et les notifications.
```bash
cd api
php artisan reverb:start
```

### 4. Workers & Planificateur
Gère les tâches de fond (emails, analyses IA) et les tâches planifiées.
```bash
cd api
php artisan queue:work
# Et dans un autre onglet pour le scheduler (optionnel si pas de cron)
php artisan schedule:work
```

### 5. Frontend (Next.js)
L'interface utilisateur accessible sur `http://localhost:3000`.
```bash
cd front
npm run dev
```

---

## 🌐 Accès

Une fois tout lancé :
- **Application** : [http://localhost:3000](http://localhost:3000)
- **API** : [http://localhost:8000](http://localhost:8000)
- **Mailpit** (Emails locaux) : [http://localhost:8025](http://localhost:8025) (si installé)

## ⚠️ Dépannage Courant

- **Erreur Audio / Micro** : Assurez-vous d'utiliser `localhost` ou `HTTPS`. Les navigateurs bloquent le micro sur `http://` (sauf localhost).
- **Erreur 403 / API** : Vérifiez que le Backend tourne bien sur le port 8000.
- **Chat ne marche pas** : Vérifiez que `php artisan reverb:start` tourne bien et que le port 8080 est libre.
