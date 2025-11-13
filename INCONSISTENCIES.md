# Incohérences Frontend ↔ Backend - CRM NetStrategy

## 📊 Vue d'ensemble

Ce document liste toutes les incohérences détectées entre le frontend (TypeScript/Next.js) et le backend (Laravel/PHP), avec des recommandations pour les résoudre.

---

## ✅ CORRIGÉ - Table `todos` - Colonnes manquantes

**Statut :** ✅ **Corrigé** (migration créée)

### Colonnes ajoutées :
- `client_id` (foreignId nullable)
- `ordre` (integer, default: 0)
- `priorite` (enum: basse|moyenne|haute, default: 'moyenne')
- `pole` (string nullable)
- `assigned_to` (foreignId nullable vers users)

**Fichier :** `/api/database/migrations/2025_11_13_000001_add_missing_fields_to_todos_table.php`

---

## ✅ CORRIGÉ - Table `rappels` - Colonne manquante

**Statut :** ✅ **Corrigé** (migration créée)

### Colonne ajoutée :
- `priorite` (enum: basse|moyenne|haute, default: 'moyenne')

**Fichier :** `/api/database/migrations/2025_11_13_000002_add_priorite_to_rappels_table.php`

---

## ⚠️ ATTENTION - Table `clients` - Champs supplémentaires dans le frontend

**Statut :** ⚠️ **À traiter** (selon les besoins métier)

### Champs présents dans le TypeScript mais absents du backend :

| Champ Frontend | Type | Présent dans Backend | Action recommandée |
|----------------|------|----------------------|---------------------|
| `adresse` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `ville` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `code_postal` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `site_web` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `description_generale` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `montant_mensuel_total` | number \| null | ❌ | Ajouter colonne ou retirer du type |
| `frequence_facturation` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `mode_paiement` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `iban` | string \| null | ❌ | Ajouter colonne ou retirer du type |
| `notes_comptables` | string \| null | ❌ | Ajouter colonne ou retirer du type |

### Options de résolution :

#### Option 1 : Ajouter les colonnes au backend (recommandé si ces champs seront utilisés)

Créer une migration :

```php
<?php
// 2025_11_13_000003_add_additional_fields_to_clients_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // Informations de contact
            $table->string('adresse')->nullable()->after('gerant');
            $table->string('ville')->nullable()->after('adresse');
            $table->string('code_postal', 10)->nullable()->after('ville');
            $table->string('site_web')->nullable()->after('telephones');
            $table->text('description_generale')->nullable()->after('site_web');

            // Informations financières
            $table->decimal('montant_mensuel_total', 10, 2)->nullable()->after('contrat');
            $table->enum('frequence_facturation', ['mensuel', 'trimestriel', 'annuel'])->nullable()->after('montant_mensuel_total');
            $table->string('mode_paiement')->nullable()->after('frequence_facturation');
            $table->string('iban')->nullable()->after('mode_paiement');
            $table->text('notes_comptables')->nullable()->after('iban');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'adresse', 'ville', 'code_postal', 'site_web', 'description_generale',
                'montant_mensuel_total', 'frequence_facturation', 'mode_paiement',
                'iban', 'notes_comptables'
            ]);
        });
    }
};
```

Puis ajouter au modèle `Client` (fillable) :

```php
protected $fillable = [
    'societe',
    'gerant',
    'adresse',
    'ville',
    'code_postal',
    'siret',
    'emails',
    'telephones',
    'site_web',
    'description_generale',
    'contrat',
    'montant_mensuel_total',
    'frequence_facturation',
    'mode_paiement',
    'iban',
    'notes_comptables',
    'date_contrat',
    'date_echeance',
    'lien_externe',
];
```

#### Option 2 : Retirer les champs inutilisés du TypeScript

Si ces champs ne sont pas utilisés par l'application, simplement les retirer de l'interface `ClientDetail` dans `/front/services/types/crm.ts`.

---

## 🔍 Vérifications supplémentaires

### 1. Énumérations - Vérifier la cohérence

#### Statuts Prospect

**Frontend** (`types/crm.ts` ligne 132) :
```typescript
statut: 'en_attente' | 'relance' | 'signé' | 'converti'
```

**Backend** (migration `create_prospects_table.php` ligne 17) :
```php
enum('statut', ['en_attente', 'relance', 'perdu', 'converti'])
```

⚠️ **Incohérence détectée :**
- Frontend a : `'signé'`
- Backend a : `'perdu'`
- Backend n'a pas : `'signé'`

**Recommandation :** Harmoniser les deux. Soit :
1. Ajouter `'signé'` et `'perdu'` au frontend
2. OU modifier la migration backend pour correspondre au frontend

#### Couleur Statut

**Frontend** (`types/crm.ts` ligne 4) :
```typescript
type StatutCouleur = 'vert' | 'jaune' | 'rouge';
```

**Backend** (migration `add_couleur_statut_to_clients_and_prospects.php` ligne 12) :
```php
enum('couleur_statut', ['vert', 'orange', 'rouge'])
```

⚠️ **Incohérence détectée :**
- Frontend a : `'jaune'`
- Backend a : `'orange'`

**Recommandation :** Choisir une seule valeur et l'harmoniser partout.

---

## 📦 Résumé des migrations à exécuter

### Migrations créées (à exécuter) :

```bash
cd api
php artisan migrate
```

**Fichiers de migration :**
1. `2025_11_13_000001_add_missing_fields_to_todos_table.php` ✅
2. `2025_11_13_000002_add_priorite_to_rappels_table.php` ✅

### Migrations recommandées (selon besoins) :

3. `2025_11_13_000003_add_additional_fields_to_clients_table.php` ⚠️ (optionnel)
4. Modifier `create_prospects_table.php` pour harmoniser les statuts ⚠️
5. Modifier `add_couleur_statut_to_clients_and_prospects.php` pour harmoniser jaune/orange ⚠️

---

## 🧪 Tests recommandés après migrations

### 1. Tester la création de Todos

```bash
curl -X POST http://localhost:8000/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test Todo",
    "description": "Description test",
    "client_id": 1,
    "statut": "en_cours",
    "priorite": "haute",
    "pole": "dev"
  }'
```

**Résultat attendu :** Status 201, todo créé avec tous les champs

### 2. Tester la création de Rappels

```bash
curl -X POST http://localhost:8000/api/rappels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test Rappel",
    "description": "Description test",
    "client_id": 1,
    "date_rappel": "2025-12-01",
    "priorite": "moyenne",
    "pole": "com"
  }'
```

**Résultat attendu :** Status 201, rappel créé avec tous les champs

### 3. Tester le Kanban (drag & drop)

```bash
curl -X PUT http://localhost:8000/api/todos/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statut": "termine",
    "ordre": 5
  }'
```

**Résultat attendu :** Status 200, todo mis à jour

### 4. Tester l'affichage des fiches clients

Vérifier que tous les champs s'affichent correctement dans :
- `/front/app/clients/[id]/page.tsx`
- Onglets : Informations, Prestations, Journal

---

## 📝 Checklist de cohérence complète

- [x] Migrations créées pour `todos` (colonnes manquantes)
- [x] Migrations créées pour `rappels` (colonne priorite)
- [x] Types TypeScript mis à jour (`Todo` et `Rappel`)
- [x] Correction `legacyBehavior` Next.js
- [ ] Décider du sort des champs supplémentaires de `Client`
- [ ] Harmoniser les statuts de `Prospect` (frontend vs backend)
- [ ] Harmoniser `couleur_statut` (jaune vs orange)
- [ ] Tester l'application complète après migrations
- [ ] Vérifier les permissions (Spatie)
- [ ] Tester l'authentification Sanctum

---

## 🚀 Commandes rapides

### Exécuter toutes les migrations :
```bash
cd /home/user/CRM-NetStrategy/api
php artisan migrate
```

### Vérifier les colonnes d'une table :
```bash
php artisan tinker
> Schema::getColumnListing('todos');
> Schema::getColumnListing('rappels');
> Schema::getColumnListing('clients');
```

### Rollback la dernière migration (si problème) :
```bash
php artisan migrate:rollback
```

### Recréer toute la DB (⚠️ ATTENTION - PERTE DE DONNÉES) :
```bash
php artisan migrate:fresh
```

---

**Date :** 2025-11-13
**Branche :** `claude/remove-legacy-link-behavior-011CV5nvdxea7LQSEyFFFcib`
**Statut global :** ✅ Corrections critiques appliquées | ⚠️ Incohérences mineures à traiter
