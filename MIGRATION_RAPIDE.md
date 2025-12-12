# 🚀 Guide de Migration Rapide & Légère

Ce guide vous explique comment transférer votre CRM sur un autre serveur sans copier les dossiers lourds (`vendor`, `node_modules`, etc.), puis comment le lancer avec Docker.

---

## 📦 Étape 1 : Créer une archive légère (sur votre Mac)

Ouvrez votre terminal dans le dossier du projet `CRM` et lancez cette commande. Elle va créer un fichier compressé `crm-deploy.tar.gz` en excluant tous les fichiers inutiles.

```bash
# S'assurer d'être à la racine du projet
cd /Users/pazent/Desktop/CRM

# Créer l'archive (copier-coller cette commande)
tar --exclude='./api/vendor' \
    --exclude='./api/node_modules' \
    --exclude='./front/node_modules' \
    --exclude='./front/.next' \
    --exclude='./.git' \
    --exclude='./.idea' \
    --exclude='./.vscode' \
    --exclude='./*lock.json' \
    -czf crm-deploy.tar.gz .
```

*Résultat : Vous obtenez un fichier `crm-deploy.tar.gz` très léger (quelques Mo).*

---

## ✈️ Étape 2 : Envoyer sur le serveur

Utilisez `scp` pour envoyer ce fichier unique sur votre serveur distant.

*(Remplacez `user` et `ip-serveur` par vos infos)*

```bash
scp crm-deploy.tar.gz user@ip-serveur:/home/user/
```

---

## 🏗️ Étape 3 : Installer sur le serveur

Connectez-vous à votre serveur en SSH :

```bash
ssh user@ip-serveur
```

Puis lancez ces commandes pour tout installer :

```bash
# 1. Créer le dossier et aller dedans
mkdir crm
cd crm

# 2. Décompresser l'archive
tar -xzf ../crm-deploy.tar.gz

# 3. Lancer l'installation et le démarrage (tout est automatique)
chmod +x docker-start.sh
./docker-start.sh
```

---

## 🎉 C'est fini !

Le script `docker-start.sh` va automatiquement :
1. Télécharger les images Docker nécessaires.
2. Réinstaller les dépendances (`composer install` et `npm install`) à l'intérieur des conteneurs.
3. Configurer la base de données.
4. Démarrer l'API, le Frontend, le Chat et les Workers.

Votre CRM sera accessible sur l'IP de votre serveur :
- **Frontend** : `http://ip-serveur:3000`
- **API** : `http://ip-serveur:8000`

---

### Commandes utiles une fois connecté :

- **Arrêter** : `docker-compose down`
- **Redémarrer** : `docker-compose up -d`
- **Voir les logs** : `docker-compose logs -f`
- **Ajouter des données de test** : `docker-compose exec api php artisan db:seed`
