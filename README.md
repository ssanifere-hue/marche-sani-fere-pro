# ⭐ APHRIKE JULA - PUBLIC MARKETPLACE

Complete public marketplace for APHRIKE JULA (formerly SANI-FÉRÉ Pro) featuring a modern design, vibrant African colors, and multiple features for both sellers and buyers.

## 🎨 DESIGN & FEATURES

### Visual Theme
- **Palette**: Royal Blue `#1565C0`, Gold `#FFD700`, Green `#00B074`, Orange `#FF6B35`
- **Premium**: Golden Gradient
- **Background**: Off-white `#F8F9FA` for visual comfort

### Main Features Implemented
- **Buyer/Seller Separation**: Separate registration processes for buyers (clients) and sellers. Buyers do not have access to the seller dashboard.
- **Orange Money Payment**: Integrated payment modal for products, including transfer instructions and a direct WhatsApp link to send payment proof.
- **Store Customization**: Sellers can update their logo, banner, WhatsApp number, physical address, and contact email directly from their dashboard.
- **Administration**: Dedicated interface (`admin-produits.html`) allowing administrators to delete products in bulk.

### Main Pages
1. **`index.html`** - Homepage (Hero, popular categories, premium carousel, recent products)
2. **`catalogue.html`** - Full Catalog (Advanced filters, search, sorting, infinite scrolling)
3. **`vendeur.html`** - Vendor Profile/Store (Banner, logo, direct WhatsApp contact, product list)
4. **`produit.html`** - Detailed Product Page (Image gallery, description, Orange Money payment)
5. **`connexion.html`** - Login and Registration for buyers
6. **`vendre.html`** - Specific Registration page to become a seller
7. **`dashboard.html`** - Seller Dashboard (Product management, store customization)
8. **`admin-produits.html`** - Administration interface for product moderation

## 📁 FILE STRUCTURE

```
marche-sani-fere-pro/
├── backend/
│   └── main.py          # FastAPI Backend (Full marketplace API)
├── static/              # Static Frontend (Served by FastAPI)
│   ├── index.html
│   ├── catalogue.html
│   ├── vendeur.html
│   ├── produit.html
│   ├── connexion.html
│   ├── vendre.html
│   ├── dashboard.html
│   ├── admin-produits.html
│   ├── styles.css       # Global Design System
│   ├── app.js           # Homepage JS and navbar logic
│   ├── catalogue.js     # Catalog page JS
│   └── vendeur.js       # Public vendor store JS
└── README.md            # Project documentation
```

## 🚀 DEPLOYMENT

The project is fully configured for continuous deployment via **Railway**.
- Backend: FastAPI (Python)
- Frontend: Static files served via FastAPI (`app.mount("/"...)`)
- Database: MongoDB Atlas

1. **Commit & Push**: `git push` to the GitHub repository.
2. **Railway**: Automatically rebuilds and deploys the application (Backend + Frontend).

## ⚙️ KEY API ENDPOINTS

### Vendors
- `POST /api/auth/register`: Registration (`role: "vendeur"` or `"client"`)
- `GET /api/vendeurs/me`: Fetch the logged-in vendor's profile
- `PUT /api/vendeurs/profil`: Store customization (logo, banner, contacts)
- `GET /api/vendeurs/{id}`: Public profile containing `total_produits` (total products count)
- `GET /api/vendeurs/{id}/produits`: List of vendor products returned as `{"produits": [...]}`

### Administration
- `DELETE /api/admin/produits/bulk`: Bulk deletion of products

## 📞 HOW TO ACCESS THE PAGES (Routing)

The application is served via FastAPI from the root of the site. Below are the paths you can use to access the pages on your Railway deployment or locally:

- **Homepage**: `https://[RAILWAY-URL]/index.html` (or simply `https://[RAILWAY-URL]/`)
- **Catalog**: `https://[RAILWAY-URL]/catalogue.html`
- **Become a Seller**: `https://[RAILWAY-URL]/vendre.html`
- **Buyer Area (Login/Register)**: `https://[RAILWAY-URL]/connexion.html`
- **Seller Dashboard**: `https://[RAILWAY-URL]/dashboard`
- **Admin Products**: `https://[RAILWAY-URL]/admin-produits.html`

---

**Version**: 1.1.0  
⭐ **APHRIKE JULA** (Formerly SANI-FÉRÉ PRO)
