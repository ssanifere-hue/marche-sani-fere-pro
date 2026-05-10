# 🚀 GUIDE DE DÉMARRAGE RAPIDE
## MARCHÉ SANI-FÉRÉ PRO - Déploiement en 15 minutes

---

## ✅ CE QUE TU VAS CRÉER

Une plateforme complète qui te rapporte de l'argent automatiquement :
- 💰 Abonnements vendeurs (5k-10k FCFA/mois)
- 💵 Commissions sur ventes (3-5%)
- 🎁 Programme de parrainage
- 📊 Dashboard analytics en temps réel

**Revenus potentiels : 500k - 1M FCFA/mois** 🚀

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### 🗂️ ÉTAPE 1 : Télécharger le projet
✅ Télécharge le fichier `marche-sani-fere-pro.zip`
✅ Décompresse-le sur ton ordinateur

### 📦 ÉTAPE 2 : Créer la base de données (5 min)

1. Va sur **https://www.mongodb.com/cloud/atlas**
2. Crée un compte gratuit (avec Google c'est rapide)
3. Clique sur "Build a Database" → **FREE** (M0)
4. Choisis la région la plus proche (Frankfurt ou Paris)
5. Clique sur "Create"

**Configuration importante :**
- Database Access → "Add New Database User"
  - Username : `sahel` (ou ce que tu veux)
  - Password : Crée un mot de passe FORT (note-le bien !)
  - Clique "Add User"

- Network Access → "Add IP Address"
  - Clique "Allow Access from Anywhere" (0.0.0.0/0)
  - Clique "Confirm"

- Database → "Connect"
  - Choisis "Connect your application"
  - Copie l'URL (ressemble à : `mongodb+srv://sahel:ton_password@cluster0.xxxxx.mongodb.net/`)
  - ⚠️ **REMPLACE `<password>` par ton vrai mot de passe !**

✅ Tu as maintenant ton URL MongoDB !

---

### 🚂 ÉTAPE 3 : Déployer le Backend sur Railway (5 min)

1. Va sur **https://railway.app**
2. Clique "Login" → "Login with GitHub"
3. Autorise Railway à accéder à GitHub

**Upload le projet :**
- Clique "New Project"
- Choisis "Deploy from GitHub repo"
- Clique "Configure GitHub App"
- Autorise Railway
- Sélectionne "New repo" ou upload le dossier `backend`

**Variables d'environnement :**
Clique sur ton projet → "Variables" → Ajoute :
```
MONGODB_URL = ton_url_mongodb_complet_ici
SECRET_KEY = genere_une_cle_securisee_longue_ici
PORT = 8000
```

Pour `SECRET_KEY`, tape des caractères aléatoires (minimum 32 caractères) ou utilise : `https://randomkeygen.com/`

✅ Railway va déployer automatiquement (2-3 min)
✅ Note l'URL du backend (ex: `https://web-production-abc123.up.railway.app`)

---

### 🌐 ÉTAPE 4 : Déployer le Frontend sur Vercel (3 min)

**IMPORTANT : Avant de déployer, édite les fichiers :**

1. Ouvre `frontend/index.html`
2. Ligne **618**, remplace :
   ```javascript
   const API_URL = 'https://TON-URL-RAILWAY.up.railway.app/api';
   ```
   Par ton URL Railway de l'étape 3 (garde le `/api` à la fin)

3. Fais pareil dans `frontend/admin.html` ligne **197**

**Upload sur Vercel :**
1. Va sur **https://vercel.com**
2. "Sign Up" → "Continue with GitHub"
3. "Import Project"
4. "Import Git Repository"
5. Sélectionne ton repo
6. **Root Directory** : Change en `frontend`
7. Clique "Deploy"

✅ Vercel va déployer (1-2 min)
✅ Note l'URL frontend (ex: `https://marche-sani-fere-pro.vercel.app`)

---

## 🎉 C'EST FINI !

### URLs importantes :
- **Dashboard Vendeur** : `https://ton-url-vercel.vercel.app/`
- **Dashboard Admin (TOI)** : `https://ton-url-vercel.vercel.app/admin.html`
- **API Backend** : `https://ton-url-railway.up.railway.app/`

---

## 🧪 TEST RAPIDE

1. Va sur ton URL Vercel
2. Clique "S'inscrire"
3. Crée ton compte admin
4. Tu reçois ton code de parrainage !
5. Explore le dashboard

**Pour tester un abonnement :**
- Va dans "Abonnement"
- Clique "Souscrire" sur un plan
- Note la référence de paiement
- Va sur `ton-url-vercel/admin.html`
- Clique "Valider" sur l'abonnement

✅ Le vendeur devient Premium !

---

## 💰 COMMENT GAGNER DE L'ARGENT

### 1. **Recruter des vendeurs**
Partage ton lien d'inscription : `https://ton-url-vercel.vercel.app/?ref=TON_CODE`

### 2. **Promouvoir les abonnements Premium**
- Basic : 5 000 FCFA/mois
- Premium : 10 000 FCFA/mois

**Exemple :**
- 20 vendeurs Basic = 100 000 FCFA/mois
- 30 vendeurs Premium = 300 000 FCFA/mois
- **Total = 400 000 FCFA/mois passif** 💸

### 3. **Commissions sur ventes**
Chaque vente génère 3-5% de commission automatique

### 4. **Programme de parrainage**
1 000 FCFA par vendeur parrainé qui passe Premium

---

## 🔧 PROCHAINES ÉTAPES

1. **Intégrer Orange Money** (pour paiements automatiques)
2. **Créer du contenu marketing** (vidéos TikTok, posts Facebook)
3. **Cibler les groupes WhatsApp** de commerçants maliens
4. **Offrir 1 mois gratuit** aux 10 premiers vendeurs Premium

---

## 📞 SUPPORT

Si tu as un problème :
1. Vérifie que MongoDB est bien configuré (0.0.0.0/0)
2. Vérifie que les URLs sont bien mises à jour dans index.html et admin.html
3. Regarde les logs Railway si l'API ne répond pas

---

## 🎯 OBJECTIF : 1 MILLION FCFA/MOIS

**Plan réaliste sur 3 mois :**

**Mois 1 :** 10 vendeurs Premium (10k) = 100k FCFA
**Mois 2 :** 30 vendeurs Premium = 300k FCFA
**Mois 3 :** 60 vendeurs Premium = 600k FCFA + Commissions = 800k FCFA

**🚀 Avec 100 vendeurs Premium = 1M FCFA/mois !**

---

**LET'S GO MON POTE ! 💪🔥**
