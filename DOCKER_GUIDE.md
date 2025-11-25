# 🐳 Guide de Déploiement Docker - CRM NetStrategy

Ce guide vous explique comment déployer votre CRM en utilisant Docker et Docker Compose.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation rapide](#installation-rapide)
- [Configuration](#configuration)
- [Commandes utiles](#commandes-utiles)
- [Architecture](#architecture)
- [Dépannage](#dépannage)
- [Production](#production)

---

## 🔧 Prérequis

Assurez-vous d'avoir installé :

- **Docker** (version 20.10 ou supérieure)
  - [Télécharger Docker Desktop](https://www.docker.com/get-started)
- **Docker Compose** (version 2.0 ou supérieure)
  - Inclus avec Docker Desktop

Vérifiez l'installation :

```bash
docker --version
docker-compose --version
```

---

## 🚀 Installation rapide

### Option 1 : Script automatique (recommandé)

```bash
# Rendre le script exécutable
chmod +x docker-start.sh

# Lancer le déploiement
./docker-start.sh
```

Le script va :
1. ✅ Vérifier les prérequis
2. ⚙️ Configurer l'environnement
3. 🏗️ Construire les images Docker
4. 🚀 Démarrer les conteneurs
5. ⏳ Attendre que les services soient prêts

### Option 2 : Manuelle

```bash
# 1. Copier le fichier de configuration
cp .env.docker .env
cp api/.env.example api/.env

# 2. Construire les images
docker-compose build

# 3. Démarrer les conteneurs
docker-compose up -d

# 4. Vérifier l'état
docker-compose ps
```

---

## ⚙️ Configuration

### Fichier `.env` (racine du projet)

Configurez les variables d'environnement principales :

```env
# Ports d'exposition
API_PORT=8000
FRONTEND_PORT=3000

# Environnement
APP_ENV=production
APP_DEBUG=false

# URLs
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Sanctum Auth
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
```

### Fichier `api/.env` (Laravel)

Le fichier `.env.example` sera copié automatiquement. Personnalisez-le si nécessaire :

```env
APP_NAME=CRM
APP_KEY=base64:... # Généré automatiquement
DB_CONNECTION=sqlite
DB_DATABASE=/var/www/html/database/database.sqlite
```

---

## 📦 Architecture Docker

### Services déployés

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  🌐 Frontend (Next.js)                         │
│  Port: 3000                                     │
│  Container: crm-frontend                        │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │
                   │ API Calls
                   │
┌──────────────────▼──────────────────────────────┐
│                                                 │
│  🔧 API (Laravel + PHP-FPM + Nginx)            │
│  Port: 8000                                     │
│  Container: crm-api                             │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │
                   │ SQLite
                   │
┌──────────────────▼──────────────────────────────┐
│                                                 │
│  💾 Base de données SQLite                     │
│  Volume persistant                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Conteneurs

| Service   | Image                | Port  | Description                    |
|-----------|---------------------|-------|--------------------------------|
| api       | crm-api:latest      | 8000  | Backend Laravel + Nginx        |
| frontend  | crm-frontend:latest | 3000  | Frontend Next.js               |

### Volumes persistants

- `./api/database` : Base de données SQLite
- `./api/storage/logs` : Logs Laravel
- `./api/storage/app` : Fichiers uploadés

---

## 🛠️ Commandes utiles

### Gestion des conteneurs

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer les services
docker-compose restart

# Reconstruire et redémarrer
docker-compose up -d --build

# Voir l'état des conteneurs
docker-compose ps
```

### Logs et débogage

```bash
# Voir tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f api
docker-compose logs -f frontend

# Logs en temps réel avec 100 dernières lignes
docker-compose logs -f --tail=100 api
```

### Accès aux conteneurs

```bash
# Shell dans le conteneur API
docker-compose exec api sh

# Shell dans le conteneur frontend
docker-compose exec frontend sh

# Exécuter une commande Artisan
docker-compose exec api php artisan migrate
docker-compose exec api php artisan cache:clear

# Exécuter une commande npm
docker-compose exec frontend npm run build
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer aussi les volumes (⚠️ efface la base de données)
docker-compose down -v

# Nettoyer les images non utilisées
docker system prune -a
```

---

## 🌐 Accès aux services

Une fois les conteneurs démarrés :

| Service          | URL                              |
|------------------|----------------------------------|
| Frontend         | http://localhost:3000            |
| API              | http://localhost:8000/api        |
| Health Check API | http://localhost:8000/api/health |

### Test rapide

```bash
# Tester l'API
curl http://localhost:8000/api/health

# Tester le frontend
curl http://localhost:3000
```

---

## 🔍 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier l'état
docker-compose ps

# Reconstruire depuis zéro
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Erreur "Port already in use"

Si les ports 3000 ou 8000 sont occupés :

```bash
# Modifier le fichier .env
API_PORT=8001
FRONTEND_PORT=3001

# Redémarrer
docker-compose down
docker-compose up -d
```

### Base de données corrompue

```bash
# Arrêter les services
docker-compose down

# Supprimer la base de données
rm api/database/database.sqlite

# Redémarrer (la base sera recréée)
docker-compose up -d

# Relancer les migrations
docker-compose exec api php artisan migrate --force
docker-compose exec api php artisan db:seed --class=RolePermissionSeeder --force
```

### Problèmes de permissions

```bash
# Réparer les permissions sur l'API
docker-compose exec api chown -R www-data:www-data /var/www/html
docker-compose exec api chmod -R 755 /var/www/html
docker-compose exec api chmod -R 775 /var/www/html/storage
```

### L'API ne répond pas

```bash
# Vérifier que Nginx et PHP-FPM fonctionnent
docker-compose exec api ps aux

# Redémarrer le service
docker-compose restart api

# Vérifier la configuration Nginx
docker-compose exec api nginx -t
```

---

## 🚀 Déploiement en production

### 1. Configuration pour la production

Modifiez le fichier `.env` :

```env
APP_ENV=production
APP_DEBUG=false
API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com/api
SANCTUM_STATEFUL_DOMAINS=votre-domaine.com,www.votre-domaine.com
SESSION_DOMAIN=votre-domaine.com
```

### 2. Sécurité

#### Variables sensibles

- ✅ Générez une clé `APP_KEY` unique
- ✅ Utilisez des mots de passe forts
- ✅ Ne commitez JAMAIS le fichier `.env`

#### HTTPS/SSL

Pour la production, utilisez un reverse proxy (Nginx, Traefik, Caddy) avec SSL :

```yaml
# docker-compose.prod.yml (exemple)
version: '3.8'

services:
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - frontend
```

### 3. Optimisation

```bash
# Construire avec optimisations de production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Démarrer
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Monitoring

```bash
# Vérifier la santé des conteneurs
docker-compose ps

# Surveiller les ressources
docker stats

# Logs en production
docker-compose logs -f --tail=100
```

### 5. Backups

```bash
# Backup de la base de données SQLite
docker-compose exec api cp /var/www/html/database/database.sqlite /var/www/html/database/database.backup.sqlite

# Copier le backup localement
docker cp crm-api:/var/www/html/database/database.backup.sqlite ./backup-$(date +%Y%m%d).sqlite

# Backup des uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz api/storage/app
```

---

## 📚 Ressources

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation Laravel](https://laravel.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)

---

## 💡 Conseils

1. **Développement** : Utilisez `docker-compose up` (sans `-d`) pour voir les logs en direct
2. **Production** : Toujours utiliser `-d` (mode détaché) et surveiller avec `logs -f`
3. **Performance** : Sur Mac/Windows, utilisez les volumes nommés plutôt que les bind mounts
4. **Sécurité** : Ne jamais exposer le port 3000 en production, utilisez un reverse proxy

---

## 🆘 Support

En cas de problème :

1. Vérifiez les logs : `docker-compose logs -f`
2. Vérifiez l'état : `docker-compose ps`
3. Consultez les issues GitHub
4. Contactez le support technique

---

**Version** : 1.0
**Dernière mise à jour** : Novembre 2025
