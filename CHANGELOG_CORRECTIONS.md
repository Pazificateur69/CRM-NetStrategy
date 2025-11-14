# Changelog - Corrections & Nouvelles Fonctionnalités CRM

## 🔥 BUGS CRITIQUES CORRIGÉS

### 1. **Bug d'affichage des tâches et rappels** ✅
**Problème** : Les tâches (todos) et rappels créés n'apparaissaient pas immédiatement dans l'interface.

**Corrections apportées** :
- **RappelController.php** : Ajout du champ `client_id` lors de la création des rappels
- **ClientController.php** : Amélioration du chargement des relations (ajout de `assignedUser`, `assignedUsers`, `client`)
- **Rappel.php** : Ajout de la relation `client()` manquante

### 2. **Amélioration de l'affichage des commentaires** ✅
**Fonctionnalités ajoutées** :
- ✅ Tri par ordre inversé (plus récents en premier)
- ✅ Affichage par défaut des 3 derniers commentaires uniquement
- ✅ Bouton "Voir plus" / "Voir moins" dynamique
- ✅ Compteur de commentaires cachés dans le header

---

## 📋 FONCTIONNALITÉS À IMPLÉMENTER

### 3. **Attribution des tâches/rappels** (En cours)
- [x] Backend déjà prêt (`assigned_to` pour todos, `assignedUsers` pour rappels)
- [ ] Ajouter un sélecteur d'utilisateur dans l'UI de création de tâche
- [ ] Ajouter un sélecteur d'utilisateur dans l'UI d'édition de tâche
- [ ] Ajouter un sélecteur multi-utilisateurs pour les rappels
- [ ] Afficher l'utilisateur assigné dans la liste des tâches/rappels

### 4. **Système de permissions basé sur les rôles**
- [ ] Définir les permissions par rôle (admin, user, com, dev, etc.)
- [ ] Restreindre l'accès à certaines sections aux admins
- [ ] Limiter les actions de modification selon le rôle
- [ ] Ajouter des guards sur les routes sensibles

### 5. **Interlocuteurs du client**
À ajouter dans la fiche client :
- [ ] Migration : ajouter colonnes pour interlocuteurs (Gérant, Resp. com, Comptable, Administratif)
- [ ] Champs : Poste, Nom, Téléphone, Email, Document joint/note
- [ ] UI : Section dédiée dans la fiche client
- [ ] Backend : endpoints pour gérer les interlocuteurs

### 6. **Bloc Profil Client amélioré**
Remplacer le bloc "Présentation & éléments clés" par :
- [ ] **Présentation du client** : Métier, zone d'activité, spécialités
- [ ] **Prestations validées** : Liste des services actifs
  - Création site internet
  - Référencement naturel (zone géographique)
  - Gestion réseaux sociaux (fréquence, plateformes)
  - Google Ads
  - Etc.

### 7. **Boutons externes (liens rapides)**
Ajouter des boutons en haut de chaque pôle pour accéder rapidement aux outils externes :

**Liste globale** :
- Site Internet
- Google Analytics
- Search Console
- Rapport SEO (Notion/PDF)
- Fiche Google Maps
- Facebook
- Instagram
- LinkedIn
- TikTok
- Notion

**Boutons spécifiques par pôle** :
- **SEO** : Search Console, Analytics, Rapport SEO
- **ADS** : Google Ads, Meta Ads, Landing pages
- **Réseaux Sociaux** : Facebook, Instagram, TikTok
- **Branding** : Site Web, Drive Logo, Kit Graphique
- **Dev** : Repository Git, Documentation technique

**Structure de données** :
- [ ] Migration : ajouter colonnes pour stocker les URLs (JSON ou colonnes séparées)
- [ ] UI : Barre de boutons fixée en haut de chaque pôle
- [ ] Gestion : Modal pour éditer les liens

### 8. **Connexion avec logiciel comptable**
- [ ] Créer une table `comptabilite_sync`
- [ ] Ajouter des champs : `facture_id`, `montant`, `statut`, `date_paiement`
- [ ] Créer des endpoints pour la synchronisation
- [ ] UI : Section comptabilité avec vue des factures/paiements

---

## 📦 FICHIERS MODIFIÉS

### Backend (Laravel)
```
api/app/Http/Controllers/RappelController.php        - Ajout client_id
api/app/Http/Controllers/ClientController.php        - Amélioration eager loading
api/app/Models/Rappel.php                            - Ajout relation client()
```

### Frontend (Next.js)
```
front/app/clients/[id]/components/ClientInfoDetails.tsx  - Accordion commentaires
```

---

## 🚀 PROCHAINES ÉTAPES (Ordre de priorité)

1. **Implémenter l'attribution des tâches/rappels** (UI + UX)
2. **Créer le bloc Profil Client amélioré**
3. **Ajouter les boutons externes par pôle**
4. **Implémenter les interlocuteurs du client**
5. **Système de permissions**
6. **Connexion logiciel comptable**

---

## 📝 NOTES TECHNIQUES

### Relations polymorphiques
- Les `todos` et `rappels` utilisent des relations polymorphiques (`todoable`, `rappelable`)
- Mais ils ont aussi une relation directe via `client_id` pour la compatibilité

### Chargement des relations
- Toujours utiliser `with()` pour eager loading et éviter le problème N+1
- Inclure `assignedUser` et `assignedUsers` pour les todos/rappels

### Mapping des pôles
- Utiliser le `POLE_MAPPING` dans `ClientUtils.tsx` pour harmoniser les valeurs
- Valeurs standardisées : `BRANDING`, `ADS`, `SEO`, `DEV`, `RESEAUX_SOCIAUX`, `COMPTABILITE`

---

*Dernière mise à jour : 2025-11-14*
