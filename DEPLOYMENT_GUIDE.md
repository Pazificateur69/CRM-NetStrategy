# 🚀 Guide de Déploiement Production - CRM NetStrategy

Ce guide décrit les étapes complètes pour déployer le CRM en production de manière sécurisée.

---

## 📋 Prérequis Serveur

### Serveur Backend (Laravel API)
- Ubuntu 22.04 LTS ou supérieur
- PHP 8.2 ou supérieur
- Composer 2.x
- Nginx ou Apache
- SQLite ou MySQL/PostgreSQL
- Certificat SSL (Let's Encrypt recommandé)
- Accès SSH root ou sudo

### Serveur Frontend (Next.js)
- Node.js 18.x ou supérieur
- npm ou yarn
- PM2 pour la gestion des processus
- Nginx comme reverse proxy

---

## 🔧 1. Préparation du Serveur Backend

### Installation des dépendances
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation PHP 8.2 et extensions
sudo apt install -y php8.2-fpm php8.2-cli php8.2-common \
    php8.2-sqlite3 php8.2-curl php8.2-mbstring \
    php8.2-xml php8.2-zip php8.2-bcmath php8.2-gd

# Installation Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Installation Nginx
sudo apt install -y nginx

# Installation Certbot pour SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Configuration PHP
```bash
sudo nano /etc/php/8.2/fpm/php.ini
```

Modifier ces valeurs :
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M
expose_php = Off
```

Redémarrer PHP-FPM :
```bash
sudo systemctl restart php8.2-fpm
```

---

## 📦 2. Déploiement Backend (API Laravel)

### Cloner le projet
```bash
# Créer le dossier du projet
sudo mkdir -p /var/www/crm
cd /var/www/crm

# Cloner depuis votre dépôt Git
git clone https://github.com/votre-compte/crm.git .

# Ou transférer via SFTP/rsync
```

### Installation des dépendances
```bash
cd /var/www/crm/api

# Installer les dépendances PHP
composer install --optimize-autoloader --no-dev

# Copier et configurer .env
cp .env.example .env
nano .env
```

### Configuration .env de production
```bash
APP_NAME="NetStrategy CRM"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.votre-domaine.com

# Générer une nouvelle clé
php artisan key:generate

# Frontend URL (séparé par virgule si plusieurs)
FRONTEND_URL=https://votre-domaine.com,https://www.votre-domaine.com

# Base de données (exemple MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crm_netstrategy
DB_USERNAME=crm_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE

# Sessions sécurisées
SESSION_DRIVER=database
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

# Sanctum
SANCTUM_TOKEN_EXPIRATION=480

# IPs comptabilité (remplacer par vos IPs réelles)
ALLOWED_ACCOUNTING_IPS=192.168.1.10,10.0.0.5

# Mail (configurer avec vos identifiants SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.votre-provider.com
MAIL_PORT=587
MAIL_USERNAME=votre@email.com
MAIL_PASSWORD=votre_mot_de_passe
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@votre-domaine.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Migrations et permissions
```bash
# Créer la base de données SQLite (ou utiliser MySQL)
touch /var/www/crm/api/database/database.sqlite

# Lancer les migrations
php artisan migrate --force

# Créer les rôles et permissions
php artisan db:seed --class=RolePermissionSeeder --force

# Optimiser pour la production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Permissions
sudo chown -R www-data:www-data /var/www/crm/api
sudo chmod -R 755 /var/www/crm/api
sudo chmod -R 775 /var/www/crm/api/storage
sudo chmod -R 775 /var/www/crm/api/bootstrap/cache
```

### Configuration Nginx
```bash
# Copier la configuration
sudo cp /var/www/crm/nginx-production.conf /etc/nginx/sites-available/crm-api

# Adapter le fichier
sudo nano /etc/nginx/sites-available/crm-api
# Remplacer "votre-domaine.com" par votre domaine réel

# Activer le site
sudo ln -s /etc/nginx/sites-available/crm-api /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Générer le certificat SSL
sudo certbot --nginx -d api.votre-domaine.com

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 🎨 3. Déploiement Frontend (Next.js)

### Installation Node.js
```bash
# Via nvm (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Installation PM2 globalement
npm install -g pm2
```

### Configuration du projet
```bash
cd /var/www/crm/front

# Copier .env.local
cp .env.local .env.production
nano .env.production
```

Contenu de `.env.production` :
```bash
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com/api
```

### Build et démarrage
```bash
# Installer les dépendances
npm ci --production=false

# Build de production
npm run build

# Démarrer avec PM2
pm2 start npm --name "crm-frontend" -- start

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

### Configuration Nginx pour le frontend
Le fichier `nginx-production.conf` contient déjà la configuration. Assurez-vous que :

```bash
# Générer le certificat SSL pour le frontend
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 🔒 4. Sécurité Additionnelle

### Firewall (UFW)
```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Bloquer le port 3000 (Next.js) de l'extérieur
sudo ufw deny 3000

# Vérifier le statut
sudo ufw status
```

### Fail2Ban (protection brute force)
```bash
# Installation
sudo apt install -y fail2ban

# Configuration Laravel
sudo nano /etc/fail2ban/filter.d/laravel.conf
```

Contenu :
```ini
[Definition]
failregex = .*"POST .*\/api\/login.*" 401.*
            .*"POST .*\/api\/login.*" 429.*
ignoreregex =
```

```bash
# Jail Laravel
sudo nano /etc/fail2ban/jail.local
```

Contenu :
```ini
[laravel]
enabled = true
port = http,https
filter = laravel
logpath = /var/www/crm/api/storage/logs/laravel.log
maxretry = 5
bantime = 3600
```

```bash
# Redémarrer Fail2Ban
sudo systemctl restart fail2ban
```

### Surveillance des logs
```bash
# Installer Logrotate pour gérer les logs
sudo nano /etc/logrotate.d/crm
```

Contenu :
```
/var/www/crm/api/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## 📊 5. Monitoring et Maintenance

### Surveillance du système
```bash
# Installer Netdata (monitoring en temps réel)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Accessible sur http://votre-ip:19999
```

### Backups automatiques
```bash
# Créer un script de backup
sudo nano /usr/local/bin/crm-backup.sh
```

Contenu :
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/crm"
mkdir -p $BACKUP_DIR

# Backup base de données
cd /var/www/crm/api
php artisan db:backup --database=sqlite --destination=$BACKUP_DIR/db_$DATE.sqlite

# Backup fichiers
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/crm/api/storage/app/public

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -name "*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/crm-backup.sh

# Ajouter au crontab (tous les jours à 2h du matin)
sudo crontab -e
```

Ajouter :
```
0 2 * * * /usr/local/bin/crm-backup.sh
```

### Monitoring des erreurs (Sentry - optionnel)
```bash
cd /var/www/crm/api
composer require sentry/sentry-laravel

# Suivre la documentation Sentry pour la configuration
```

---

## ✅ 6. Checklist Post-Déploiement

### Tests Fonctionnels
- [ ] Page de login accessible (https://votre-domaine.com/login)
- [ ] Connexion avec un utilisateur test
- [ ] Création/modification/suppression d'un client
- [ ] Upload d'un fichier (PDF, image)
- [ ] Tentative d'upload d'un fichier interdit (.php) → doit échouer
- [ ] Accès comptabilité avec IP non autorisée → doit bloquer
- [ ] 6 tentatives de login échouées → rate limiting actif
- [ ] Token expire après 8h → reconnexion nécessaire

### Tests de Sécurité
```bash
# Test HTTPS
curl -I https://api.votre-domaine.com

# Vérifier les en-têtes de sécurité
curl -I https://votre-domaine.com | grep -E 'X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security'

# Scan des vulnérabilités (depuis votre machine locale)
nmap -sV --script vuln api.votre-domaine.com

# Test SSL (recommandé)
# Aller sur https://www.ssllabs.com/ssltest/ et tester votre domaine
```

### Performance
```bash
# Test de charge (installer Apache Bench)
ab -n 1000 -c 10 https://api.votre-domaine.com/api/user

# Vérifier les logs
tail -f /var/www/crm/api/storage/logs/laravel.log
tail -f /var/log/nginx/crm-api-error.log
```

---

## 🆘 7. Dépannage

### Laravel en mode maintenance
```bash
cd /var/www/crm/api

# Activer le mode maintenance
php artisan down

# Désactiver
php artisan up
```

### Vider les caches
```bash
cd /var/www/crm/api

php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Recréer les caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Logs en temps réel
```bash
# Logs Laravel
tail -f /var/www/crm/api/storage/logs/laravel.log

# Logs Nginx
tail -f /var/log/nginx/crm-api-error.log

# Logs PM2 (Next.js)
pm2 logs crm-frontend
```

### Redémarrage des services
```bash
# PHP-FPM
sudo systemctl restart php8.2-fpm

# Nginx
sudo systemctl restart nginx

# Next.js
pm2 restart crm-frontend

# Tous les services
sudo systemctl restart php8.2-fpm nginx
pm2 restart all
```

---

## 📞 Support

Pour toute question ou problème lors du déploiement :

1. Consulter les logs : `/var/www/crm/api/storage/logs/laravel.log`
2. Vérifier la configuration Nginx : `sudo nginx -t`
3. Tester les connexions API : `curl -X POST https://api.votre-domaine.com/api/login`

---

## 📝 Notes Importantes

- **Ne jamais commiter les fichiers .env** dans Git
- **Changer APP_KEY** en production (différent du développement)
- **Sauvegardes régulières** de la base de données
- **Surveiller les logs** quotidiennement
- **Mettre à jour** les dépendances régulièrement : `composer update` et `npm update`

---

**Dernière mise à jour** : 22 novembre 2025
**Version** : 1.0