# ⭐ APHRIKE JULA - MARKETPLACE PUBLIQUE

Marketplace publique complète pour APHRIKE JULA (anciennement SANI-FÉRÉ Pro) avec un design moderne, des couleurs africaines vibrantes et de nombreuses fonctionnalités pour les vendeurs et les acheteurs.

## 🎨 DESIGN & FONCTIONNALITÉS

### Thème Visuel
- **Palette** : Bleu Royal `#1565C0`, Or `#FFD700`, Vert `#00B074`, Orange `#FF6B35`
- **Premium** : Dégradé doré
- **Fond** : Blanc cassé `#F8F9FA` pour le confort visuel

### Fonctionnalités Principales
- **Séparation Acheteur / Vendeur** : Processus d'inscription séparés pour les acheteurs (clients) et les vendeurs. Les acheteurs n'ont pas accès au tableau de bord vendeur.
- **Paiement Orange Money** : Modale de paiement intégrée avec instructions de transfert et lien WhatsApp direct pour envoyer la preuve de paiement.
- **Personnalisation de Boutique** : Les vendeurs peuvent modifier leur logo, bannière, numéro WhatsApp, adresse physique et email de contact depuis leur tableau de bord.
- **Administration** : Interface dédiée (`admin-produits.html`) permettant aux administrateurs de supprimer des produits en masse.
- **Tableau de Bord Vendeur** : En-tête bleu professionnel avec message de bienvenue, cartes KPI améliorées avec bordures colorées et icônes.

### Pages Principales
1. **`index.html`** — Page d'accueil (Hero, catégories populaires, carrousel premium, produits récents)
2. **`catalogue.html`** — Catalogue complet (Filtres avancés, recherche, tri, scroll infini)
3. **`vendeur.html`** — Profil / Boutique du vendeur (Bannière, logo, contact WhatsApp direct, liste des produits)
4. **`produit.html`** — Page produit détaillée (Galerie d'images, description, paiement Orange Money)
5. **`connexion.html`** — Connexion et inscription pour les acheteurs
6. **`vendre.html`** — Inscription spécifique pour devenir vendeur
7. **`dashboard.html`** — Tableau de bord vendeur (Gestion des produits, personnalisation de la boutique)
8. **`admin-produits.html`** — Interface d'administration pour la modération des produits

## 📁 STRUCTURE DES FICHIERS

```
marche-sani-fere-pro/
├── backend/
│   └── main.py              # Backend FastAPI (API complète de la marketplace)
├── static/                  # Frontend statique (servi par FastAPI)
│   ├── index.html
│   ├── catalogue.html
│   ├── vendeur.html
│   ├── produit.html
│   ├── connexion.html
│   ├── vendre.html
│   ├── dashboard.html
│   ├── admin-produits.html
│   ├── styles.css           # Design System global
│   ├── app.js               # JS de la page d'accueil et navbar
│   ├── catalogue.js         # JS de la page catalogue
│   └── vendeur.js           # JS de la boutique publique du vendeur
└── README.md                # Documentation du projet
```

## 🚀 DÉPLOIEMENT

Le projet est configuré pour un déploiement continu via **Railway**.
- **Backend** : FastAPI (Python)
- **Frontend** : Fichiers statiques servis par FastAPI (`app.mount("/"...)`)
- **Base de données** : MongoDB Atlas

1. **Commit & Push** : `git push` vers le dépôt GitHub.
2. **Railway** : Reconstruit et déploie automatiquement l'application.

## ⚙️ ENDPOINTS API CLÉS

### Vendeurs
- `POST /api/auth/register` — Inscription (`role: "vendeur"` ou `"client"`)
- `GET /api/vendeurs/me` — Récupérer le profil du vendeur connecté
- `PUT /api/vendeurs/profil` — Personnalisation de la boutique (logo, bannière, contacts)
- `GET /api/vendeurs/{id}` — Profil public avec `total_produits`
- `GET /api/vendeurs/{id}/produits` — Liste des produits au format `{"produits": [...]}`

### Administration
- `DELETE /api/admin/produits/bulk` — Suppression groupée de produits

## 📞 ACCÈS AUX PAGES

L'application est servie via FastAPI depuis la racine du site :

| Page | URL |
|------|-----|
| Accueil | `https://[URL-RAILWAY]/index.html` |
| Catalogue | `https://[URL-RAILWAY]/catalogue.html` |
| Devenir Vendeur | `https://[URL-RAILWAY]/vendre.html` |
| Connexion Acheteur | `https://[URL-RAILWAY]/connexion.html` |
| Tableau de Bord Vendeur | `https://[URL-RAILWAY]/dashboard` |
| Administration Produits | `https://[URL-RAILWAY]/admin-produits.html` |

## 📧 CONTACT

- **Email** : aphrikejula@gmail.com
- **WhatsApp** : +223 70 70 05 20
- **Adresse** : Bamako, Mali

---

**Version** : 1.2.0
⭐ **APHRIKE JULA** (Anciennement SANI-FÉRÉ PRO)
