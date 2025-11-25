# ✅ Checklist de Production - CRM NetStrategy

**Avant de déployer en production, vérifiez tous ces points.**

---

## 🔴 CRITIQUE - À FAIRE ABSOLUMENT

### Backend (api/.env)
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` configuré avec votre domaine réel
- [ ] `FRONTEND_URL` configuré avec votre(vos) domaine(s) frontend
- [ ] `APP_KEY` regénéré (différent du développement)
- [ ] `SESSION_ENCRYPT=true`
- [ ] `SESSION_SECURE_COOKIE=true`
- [ ] `ALLOWED_ACCOUNTING_IPS` configuré avec IPs réelles (pas `*`)
- [ ] `DB_*` configuré avec base de données production
- [ ] `MAIL_*` configuré avec serveur SMTP réel

### Frontend (front/.env.production)
- [ ] `NEXT_PUBLIC_API_URL` configuré avec URL API réelle
- [ ] Supprimer tout fallback d'URL

### Serveur
- [ ] HTTPS activé avec certificat SSL valide
- [ ] Firewall configuré (ports 80, 443 ouverts)
- [ ] Permissions correctes : `storage/` et `bootstrap/cache/` en 775
- [ ] Bloquer exécution PHP dans `/storage/public/`
- [ ] Fail2Ban configuré pour Laravel
- [ ] Backups automatiques configurés

---

## 🟠 IMPORTANT - Recommandé

### Sécurité
- [ ] Audit des dépendances : `composer audit` et `npm audit`
- [ ] Scanner SSL sur https://www.ssllabs.com/ssltest/
- [ ] Tester rate limiting (6 tentatives login max)
- [ ] Vérifier expiration tokens (8h)
- [ ] Tester upload fichiers interdits (.php, .js) → doit échouer

### Monitoring
- [ ] Logs Laravel configurés et rotationnés
- [ ] Monitoring serveur actif (Netdata, New Relic, etc.)
- [ ] Alertes erreurs configurées (Sentry, Bugsnag)
- [ ] Monitoring uptime (UptimeRobot, Pingdom)

### Performance
- [ ] Caches Laravel activés :
  - [ ] `php artisan config:cache`
  - [ ] `php artisan route:cache`
  - [ ] `php artisan view:cache`
- [ ] Next.js build optimisé : `npm run build`
- [ ] PM2 configuré pour redémarrer automatiquement
- [ ] Compression Gzip/Brotli activée dans Nginx

---

## 🟡 OPTIONNEL - Améliorations

### Sécurité Avancée
- [ ] 2FA pour comptes admin
- [ ] WAF (Web Application Firewall) configuré
- [ ] httpOnly cookies au lieu de localStorage
- [ ] Content Security Policy (CSP)
- [ ] Rate limiting global sur toutes les routes

### Fonctionnalités
- [ ] Emails transactionnels testés
- [ ] Notifications en temps réel (si implémenté)
- [ ] Export/Import de données
- [ ] Système d'audit des actions sensibles

---

## 🧪 Tests de Validation

### Tests Fonctionnels
```bash
# Test 1 : Login
curl -X POST https://api.votre-domaine.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Test 2 : Accès protégé sans token
curl https://api.votre-domaine.com/api/user
# Doit retourner 401 Unauthenticated

# Test 3 : Rate limiting
# Faire 7 tentatives de login échouées rapidement
# La 7ème doit retourner 429 Too Many Requests

# Test 4 : CORS
curl -H "Origin: https://domaine-non-autorise.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://api.votre-domaine.com/api/login
# Doit bloquer si domaine non autorisé
```

### Tests de Sécurité
```bash
# Test 5 : Upload fichier interdit
# Via l'interface, essayer d'uploader un fichier .php
# Doit être rejeté avec erreur de validation

# Test 6 : Accès comptabilité depuis IP non autorisée
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  https://api.votre-domaine.com/api/comptabilite
# Doit retourner 403 si IP non dans ALLOWED_ACCOUNTING_IPS

# Test 7 : En-têtes de sécurité
curl -I https://votre-domaine.com
# Doit contenir : X-Frame-Options, X-Content-Type-Options, etc.

# Test 8 : Expiration token
# Attendre 8h après connexion, essayer d'accéder à /api/user
# Doit retourner 401 Unauthenticated
```

---

## 📊 Résultat Attendu

Si tous les points sont validés :

✅ **Score de sécurité** : 9.5/10
✅ **Prêt pour la production**
✅ **Conforme RGPD** (avec politique de confidentialité)
✅ **Performance optimale**

---

## 🚨 Signes d'Alerte

### Si vous constatez :
- ❌ Stack traces visibles sur l'interface → `APP_DEBUG=true` (à corriger)
- ❌ Aucun certificat SSL → Configurer HTTPS
- ❌ CORS errors dans la console → Vérifier `FRONTEND_URL`
- ❌ 500 errors → Consulter `/var/www/crm/api/storage/logs/laravel.log`
- ❌ Upload de .php réussit → Vérifier validation MIME

**→ NE PAS METTRE EN PRODUCTION tant que ces problèmes persistent**

---

## 📞 Contact d'Urgence

En cas de problème critique en production :

1. **Mode maintenance** : `php artisan down`
2. **Consulter les logs** : `tail -f /var/www/crm/api/storage/logs/laravel.log`
3. **Rollback** : Restaurer backup base de données
4. **Redémarrer services** :
   ```bash
   sudo systemctl restart php8.2-fpm nginx
   pm2 restart crm-frontend
   ```

---

## 📚 Documentation Complète

- **Corrections appliquées** : Voir [SECURITY_FIXES.md](SECURITY_FIXES.md)
- **Guide de déploiement** : Voir [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Configuration Nginx** : Voir [nginx-production.conf](nginx-production.conf)

---

**Date de validation** : _____________
**Validé par** : _____________
**Signature** : _____________

---

**Version** : 1.0
**Dernière mise à jour** : 22 novembre 2025