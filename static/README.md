# 🛍️ SANI-FÉRÉ PRO - MARKETPLACE PUBLIQUE

Marketplace publique complète pour SANI-FÉRÉ Pro avec design moderne, couleurs vives africaines et scroll infini.

## 🎨 DESIGN & FONCTIONNALITÉS

### Couleurs
- **Palette africaine vibrante** : Vert `#00B074`, Orange `#FF6B35`, Or `#FFB800`, Rouge `#E63946`, Violet `#7209B7`
- **Premium** : Dégradé doré `#FFD700` → `#FFA500`
- **Fond** : Blanc cassé `#F8F9FA` pour le confort visuel

### Pages Principales
1. **index.html** - Page d'accueil
   - Hero avec slogan
   - Catégories populaires
   - Vendeurs Premium en carrousel
   - Produits récents avec scroll infini

2. **catalogue.html** - Catalogue complet
   - Filtres avancés (catégorie, vendeur, localisation, prix)
   - Tri (récent, prix, popularité)
   - Recherche
   - Scroll infini

3. **vendeur.html** - Profil/Boutique vendeur
   - Profil complet avec stats
   - Tous les produits du vendeur
   - Onglets : Produits, Avis, À Propos
   - Contact WhatsApp direct

4. **produit.html** - Page produit individuelle
   - Galerie photos avec thumbnails
   - Description complète
   - Informations vendeur
   - Bouton achat Orange Money

## 📁 STRUCTURE DES FICHIERS

```
marketplace-sanifere-pro/
├── index.html           # Page d'accueil
├── catalogue.html       # Page catalogue avec filtres
├── vendeur.html         # Page profil vendeur
├── produit.html         # Page produit individuelle
├── styles.css           # CSS global avec design system
├── app.js              # JavaScript principal (accueil)
├── catalogue.js        # JavaScript catalogue
├── vendeur.js          # JavaScript vendeur
└── README.md           # Ce fichier
```

## 🚀 DÉPLOIEMENT SUR RAILWAY

### Option 1 : Intégration au backend existant (RECOMMANDÉ)

1. **Copier les fichiers dans ton repo GitHub**
   ```
   ssanifere-hue/marche-sani-fere-pro/
   ├── static/              ← CRÉER CE DOSSIER
   │   ├── index.html
   │   ├── catalogue.html
   │   ├── vendeur.html
   │   ├── produit.html
   │   ├── styles.css
   │   ├── app.js
   │   ├── catalogue.js
   │   └── vendeur.js
   └── main.py              ← Ton backend existant
   ```

2. **Modifier main.py pour servir les fichiers statiques**
   
   Ajoute cette ligne après `app = FastAPI()` :
   ```python
   from fastapi.staticfiles import StaticFiles
   
   # Servir les fichiers statiques
   app.mount("/", StaticFiles(directory="static", html=True), name="static")
   ```

3. **Commit sur GitHub** (via web editor)
   - Va sur ton repo
   - Upload tous les fichiers dans `static/`
   - Commit

4. **Railway redéploie automatiquement** ✅

### Option 2 : Déploiement séparé sur Vercel/Netlify

1. **Créer un nouveau repo GitHub**
   - `sanifere-marketplace-public`
   - Upload tous les fichiers HTML/CSS/JS

2. **Connecter à Vercel**
   - vercel.com
   - Import project
   - Sélectionner le repo
   - Deploy

3. **Mettre à jour l'URL de l'API**
   
   Dans tous les fichiers JS, remplace :
   ```javascript
   const API_BASE_URL = 'https://web-production-8f94.up.railway.app';
   ```

## 🔌 ENDPOINTS API NÉCESSAIRES

Le frontend attend ces endpoints dans ton backend FastAPI :

### Produits
- `GET /api/produits?page=1&limit=20&categorie=&premium=&search=&sort=`
- `GET /api/produits/{id}`

### Vendeurs
- `GET /api/vendeurs/premium`
- `GET /api/vendeurs/{id}`
- `GET /api/vendeurs/{id}/produits?page=1&limit=24`
- `GET /api/vendeurs/{id}/avis`

### Réponses attendues

**GET /api/produits**
```json
{
  "produits": [
    {
      "id": "prod123",
      "titre": "Samsung Galaxy A32",
      "prix": 65000,
      "images": ["url1.jpg", "url2.jpg"],
      "vendeur_id": "vend456",
      "vendeur_nom": "AGI 2000",
      "vendeur_premium": true,
      "categorie": "electronique",
      "description": "...",
      "localisation": "Bamako",
      "date_creation": "2026-05-01"
    }
  ],
  "total": 150
}
```

**GET /api/vendeurs/premium**
```json
{
  "vendeurs": [
    {
      "id": "vend456",
      "nom": "AGI 2000",
      "abonnement": "premium",
      "ventes": 245,
      "note": 4.8,
      "total_produits": 87
    }
  ]
}
```

## ⚙️ CONFIGURATION

### Modifier l'URL de l'API

Si ton API n'est pas sur `web-production-8f94.up.railway.app`, modifie dans :
- `app.js` ligne 2
- `catalogue.js` ligne 2
- `vendeur.js` ligne 2

### Personnalisation des couleurs

Tout se passe dans `styles.css` lignes 1-30 (variables CSS) :
```css
:root {
  --primary-green: #00B074;   /* Change cette couleur */
  --primary-orange: #FF6B35;  /* Change cette couleur */
  /* etc. */
}
```

## 📱 RESPONSIVE

- **Mobile-first** : optimisé pour écrans 360px+
- **Tablette** : s'adapte automatiquement
- **Desktop** : max-width 1200px centré

## 🎯 PROCHAINES ÉTAPES

1. ✅ Déployer la marketplace publique
2. ⏳ Créer les endpoints API manquants dans `main.py`
3. ⏳ Intégrer le vrai paiement Orange Money
4. ⏳ Ajouter le chatbot IA sur toutes les pages
5. ⏳ Système de notifications temps réel
6. ⏳ Application mobile (React Native ou PWA)

## 🐛 DÉBOGAGE

Si ça ne marche pas :

1. **Vérifier la console navigateur** (F12)
2. **Vérifier les URLs d'API** (sont-elles correctes ?)
3. **Vérifier CORS** dans `main.py` :
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

## 📞 SUPPORT

Pour toute question, contacter l'équipe technique SANI-FÉRÉ Pro.

---

**Créé le** : 10 mai 2026  
**Dernière mise à jour** : 10 mai 2026  
**Version** : 1.0.0  

🇲🇱 **SANI-FÉRÉ PRO** - Alliance Sahel Services
