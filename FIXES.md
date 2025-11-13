# Corrections effectuées - CRM NetStrategy

## 📋 Résumé des corrections

### 1. ✅ Next.js Link - Suppression de `legacyBehavior`

**Problème :** Utilisation de `legacyBehavior` déprécié dans Next.js 15
**Fichiers corrigés :**
- `/front/app/clients/page.tsx` (ligne 36)
- `/front/app/prospects/page.tsx` (ligne 49)

**Solution :** Conversion de :
```tsx
<Link href="/path" passHref legacyBehavior>
  <button className="...">Text</button>
</Link>
```

Vers :
```tsx
<Link href="/path" className="...">
  Text
</Link>
```

---

### 2. ✅ Erreurs 500 Backend - Colonnes manquantes

**Problème :** Les tables `todos` et `rappels` n'avaient pas toutes les colonnes nécessaires

#### Table `todos` - Colonnes ajoutées :
- `client_id` (foreignId nullable)
- `ordre` (integer, default: 0)
- `priorite` (string, default: 'moyenne')
- `pole` (string nullable)
- `assigned_to` (foreignId nullable vers users)

#### Table `rappels` - Colonnes ajoutées :
- `priorite` (string, default: 'moyenne')

**Migrations créées :**
```bash
/api/database/migrations/2025_11_13_000001_add_missing_fields_to_todos_table.php
/api/database/migrations/2025_11_13_000002_add_priorite_to_rappels_table.php
```

---

### 3. ✅ Types TypeScript - Mise à jour complète

**Fichier :** `/front/services/types/crm.ts`

**Ajouts à l'interface `Todo` :**
```typescript
statut: 'planifie' | 'en_cours' | 'termine' | 'retard';  // ajout de 'planifie'
ordre?: number;
priorite?: 'basse' | 'moyenne' | 'haute';
pole?: string;
assigned_to?: number;
assignedUser?: User | null;
todoable_id?: number;
todoable_type?: string;
```

**Ajouts à l'interface `Rappel` :**
```typescript
statut?: 'planifie' | 'en_cours' | 'termine';
ordre?: number;
priorite?: 'basse' | 'moyenne' | 'haute';
pole?: string;
assigned_users?: number[];
assignedUsers?: User[];
rappelable_id?: number;
rappelable_type?: string;
```

---

## 🚀 Pour appliquer les corrections

### 1. Exécuter les migrations Laravel

Une fois que l'environnement backend est configuré (avec `vendor/`), exécutez :

```bash
cd api
composer install  # Si vendor/ n'existe pas encore
php artisan migrate
```

### 2. Tester l'application

**Backend :**
```bash
cd api
php artisan serve
```

**Frontend :**
```bash
cd front
npm install
npm run dev
```

### 3. Vérifier les endpoints

Testez la création de todos et rappels :

**Créer un Todo :**
```bash
POST /api/todos
{
  "titre": "Test Todo",
  "description": "Description test",
  "client_id": 1,
  "statut": "en_cours",
  "priorite": "haute",
  "pole": "dev"
}
```

**Créer un Rappel :**
```bash
POST /api/rappels
{
  "titre": "Test Rappel",
  "description": "Description test",
  "client_id": 1,
  "date_rappel": "2025-12-01",
  "priorite": "moyenne",
  "pole": "com"
}
```

---

## 🔍 Cohérence Frontend ↔ Backend

### Mapping des champs

| Champ Frontend | Champ Backend | Type | Requis |
|----------------|---------------|------|---------|
| `titre` | `titre` | string | ✅ Oui |
| `description` | `description` | string | ❌ Non |
| `statut` | `statut` | enum | ❌ Non (default: 'planifie') |
| `priorite` | `priorite` | enum | ❌ Non (default: 'moyenne') |
| `client_id` | `client_id` | number | ✅ Oui (pour todos) |
| `pole` | `pole` | string | ❌ Non (auto-détecté) |
| `assigned_to` | `assigned_to` | number | ❌ Non |
| `date_echeance` | `date_echeance` | date | ❌ Non |
| `date_rappel` | `date_rappel` | date | ❌ Non |

### Valeurs d'énumération

**Statuts Todo :**
- `planifie` - Non commencé
- `en_cours` - En cours
- `termine` - Terminé
- `retard` - En retard

**Statuts Rappel :**
- `planifie` - À venir
- `en_cours` - En cours
- `termine` - Fait

**Priorités :**
- `basse` - Priorité basse
- `moyenne` - Priorité moyenne (default)
- `haute` - Priorité haute

**Pôles disponibles :**
- `com` - Commercial
- `dev` - Développement
- `rh` - Ressources Humaines
- `reseaux` - Réseaux
- `admin` - Administration

---

## ✅ Tests à effectuer

Après avoir appliqué les migrations, testez :

1. ✅ Créer un todo depuis la fiche client
2. ✅ Créer un rappel depuis la fiche client
3. ✅ Modifier un todo (statut, priorité, etc.)
4. ✅ Modifier un rappel
5. ✅ Drag & drop dans le Kanban
6. ✅ Supprimer un todo/rappel
7. ✅ Assigner un todo à un utilisateur
8. ✅ Naviguer vers `/clients/create` et `/prospects/create`

---

## 📝 Notes importantes

1. **Migrations** : Les migrations doivent être exécutées **une seule fois** sur l'environnement de développement et de production.

2. **Relations polymorphes** : Les models utilisent `todoable` et `rappelable` pour lier les todos/rappels aux clients OU prospects.

3. **Ordre** : Le champ `ordre` est utilisé pour le drag & drop dans le Kanban. Il est calculé automatiquement lors de la création.

4. **Client ID** : Pour les todos, `client_id` est **requis**. Pour les rappels, il est **optionnel**.

5. **Authentification** : Tous les endpoints nécessitent un token Bearer valide (Laravel Sanctum).

---

## 🐛 Débogage

Si les erreurs 500 persistent après les migrations :

1. Vérifiez les logs Laravel :
```bash
tail -f api/storage/logs/laravel.log
```

2. Vérifiez que les colonnes existent :
```bash
php artisan tinker
> Schema::hasColumn('todos', 'priorite');
> Schema::hasColumn('rappels', 'priorite');
```

3. Vérifiez les permissions de la base de données

4. Vérifiez le fichier `.env` pour la connexion à la base de données

---

## 🎯 Prochaines étapes recommandées

1. Ajouter des tests unitaires pour les contrôleurs
2. Ajouter une validation côté frontend pour les champs obligatoires
3. Améliorer les messages d'erreur affichés à l'utilisateur
4. Ajouter un système de notifications pour les rappels
5. Implémenter la recherche et le filtrage dans les listes

---

**Date des corrections :** 2025-11-13
**Branche :** `claude/remove-legacy-link-behavior-011CV5nvdxea7LQSEyFFFcib`
