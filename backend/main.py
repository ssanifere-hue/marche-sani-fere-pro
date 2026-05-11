from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import secrets
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, File


# Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ORANGE_MONEY_API_KEY = os.getenv("ORANGE_MONEY_API_KEY", "")

app = FastAPI(title="Marche SANI-FÉRÉ PRO API")

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET"),
    secure=True
)


# Configuration du frontend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Monter le dossier static sur /app pour que /app/ serve index.html 
# et que les liens relatifs (styles.css, app.js) fonctionnent.
app.mount("/app", StaticFiles(directory=STATIC_DIR, html=True), name="static")

@app.get("/dashboard")
async def serve_dashboard():
    dashboard_path = os.path.join(STATIC_DIR, "dashboard.html")
    if not os.path.exists(dashboard_path):
        raise HTTPException(status_code=404, detail="Dashboard file not found")
    return FileResponse(dashboard_path)







# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
client = AsyncIOMotorClient(MONGODB_URL)
db = client.marche_sani_fere_pro

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ==================== MODELS ====================

class UserCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str = Field(..., pattern=r"^\d{8}$")
    email: EmailStr
    mot_de_passe: str
    role: str = "client"  # "client" ou "vendeur"
    nom_boutique: Optional[str] = None
    description_boutique: Optional[str] = None

class UserLogin(BaseModel):
    telephone: str
    mot_de_passe: str

class ProduitCreate(BaseModel):
    nom: str
    description: str
    prix: int
    categorie: str
    images: List[str] = []
    stock: int = 1
    est_premium: bool = False

class VendeurCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str
    email: EmailStr
    mot_de_passe: str
    nom_boutique: str
    description_boutique: Optional[str] = None

class VendeurLogin(BaseModel):
    telephone: str
    mot_de_passe: str


class AbonnementCreate(BaseModel):
    plan: str  # "basic" (5000 FCFA) ou "premium" (10000 FCFA)
    telephone_paiement: str

class ProduitBoost(BaseModel):
    produit_id: str
    duree_jours: int  # 7, 14, 30 jours
    budget: int  # en FCFA

class VenteCreate(BaseModel):
    produit_id: str
    acheteur_telephone: str
    montant: int
    commission_taux: float = 0.03  # 3% par défaut

class CodeParrainage(BaseModel):
    code: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    # Bcrypt a une limite de 72 octets
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password[:72], hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")

async def upload_image_to_cloudinary(file_or_base64):
    """Télécharge une image sur Cloudinary et retourne l'URL sécurisée"""
    try:
        upload_result = cloudinary.uploader.upload(file_or_base64, folder="marche_sani_fere_pro")
        return upload_result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'upload Cloudinary: {str(e)}")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentification échouée")

async def get_current_vendeur(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            # Rétrocompatibilité avec l'ancien token "vendeur_id"
            user_id = payload.get("vendeur_id")
            
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Chercher le vendeur lié à cet utilisateur
        vendeur = await db.vendeurs.find_one({"user_id": user_id})
        if not vendeur:
            # Essayer de chercher directement par ID (pour l'ancien format)
            vendeur = await db.vendeurs.find_one({"_id": ObjectId(user_id)})
            
        if not vendeur:
            raise HTTPException(status_code=401, detail="Profil vendeur non trouvé")
        
        return vendeur
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentification échouée")


def generer_code_parrainage():
    """Génère un code de parrainage unique"""
    return secrets.token_urlsafe(8).upper()[:8]

# ==================== ROUTES ====================

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur MARCHE SANI-FÉRÉ PRO API",
        "version": "1.0.0",
        "status": "operational"
    }

# ==================== AUTH ====================

@app.post("/api/auth/register")
async def register(user: UserCreate):
    """Inscription d'un nouvel utilisateur (Client ou Vendeur)"""
    
    # Vérifier si le téléphone existe déjà
    existing = await db.users.find_one({"telephone": user.telephone})
    if existing:
        raise HTTPException(status_code=400, detail="Ce numéro de téléphone est déjà utilisé")
    
    # Créer l'utilisateur
    user_data = {
        "nom": user.nom,
        "prenom": user.prenom,
        "telephone": user.telephone,
        "email": user.email,
        "mot_de_passe": hash_password(user.mot_de_passe),
        "role": user.role,
        "portefeuille": 1000,  # Bonus de bienvenue de 1000 FCFA
        "date_inscription": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Si c'est un vendeur, créer son profil automatiquement
    if user.role == "vendeur":
        vendeur_data = {
            "user_id": user_id,
            "nom_boutique": user.nom_boutique or f"Boutique de {user.nom}",
            "description_boutique": user.description_boutique,
            "telephone": user.telephone,
            "est_premium": False,
            "actif": False,  # Validation manuelle requise par l'admin
            "date_creation": datetime.utcnow(),
            "score": 0,
            "avis": []
        }
        await db.vendeurs.insert_one(vendeur_data)

    
    # Créer le token
    token = create_access_token({"user_id": user_id, "role": user.role})
    
    return {
        "message": "Inscription réussie",
        "user_id": user_id,
        "token": token,
        "bonus": 1000
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Connexion d'un utilisateur"""
    
    user = await db.users.find_one({"telephone": credentials.telephone})
    if not user or not verify_password(credentials.mot_de_passe, user["mot_de_passe"]):
        raise HTTPException(status_code=401, detail="Téléphone ou mot de passe incorrect")
    
    token = create_access_token({"user_id": str(user["_id"]), "role": user["role"]})
    
    return {
        "message": "Connexion réussie",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "nom": user["nom"],
            "prenom": user["prenom"],
            "role": user["role"]
        }
    }

# ==================== VENDEURS ====================


@app.post("/api/vendeurs/inscription")
async def inscription_vendeur(vendeur: VendeurCreate):
    """Inscription d'un nouveau vendeur"""
    
    # Vérifier si le téléphone existe déjà
    existing = await db.vendeurs.find_one({"telephone": vendeur.telephone})
    if existing:
        raise HTTPException(status_code=400, detail="Ce numéro de téléphone est déjà enregistré")
    
    # Créer le vendeur
    vendeur_data = {
        "nom": vendeur.nom,
        "prenom": vendeur.prenom,
        "telephone": vendeur.telephone,
        "email": vendeur.email,
        "mot_de_passe": hash_password(vendeur.mot_de_passe),
        "nom_boutique": vendeur.nom_boutique,
        "description_boutique": vendeur.description_boutique,
        "est_premium": False,
        "actif": False,  # Validation manuelle requise
        "code_parrainage": generer_code_parrainage(),
        "parrains": [],  # Liste des vendeurs parrainés
        "commission_parrainage_gagnee": 0,
        "date_creation": datetime.utcnow(),
        "derniere_connexion": datetime.utcnow()
    }

    
    result = await db.vendeurs.insert_one(vendeur_data)
    
    # Créer le token
    token = create_access_token({"vendeur_id": str(result.inserted_id)})
    
    return {
        "message": "Inscription réussie",
        "vendeur_id": str(result.inserted_id),
        "token": token,
        "code_parrainage": vendeur_data["code_parrainage"]
    }

@app.post("/api/vendeurs/connexion")
async def connexion_vendeur(credentials: VendeurLogin):
    """Connexion d'un vendeur"""
    
    vendeur = await db.vendeurs.find_one({"telephone": credentials.telephone})
    if not vendeur or not verify_password(credentials.mot_de_passe, vendeur["mot_de_passe"]):
        raise HTTPException(status_code=401, detail="Téléphone ou mot de passe incorrect")
    
    # Mettre à jour la dernière connexion
    await db.vendeurs.update_one(
        {"_id": vendeur["_id"]},
        {"$set": {"derniere_connexion": datetime.utcnow()}}
    )
    
    token = create_access_token({"vendeur_id": str(vendeur["_id"])})
    
    return {
        "message": "Connexion réussie",
        "token": token,
        "vendeur": {
            "id": str(vendeur["_id"]),
            "nom": vendeur["nom"],
            "prenom": vendeur["prenom"],
            "nom_boutique": vendeur["nom_boutique"],
            "est_premium": vendeur["est_premium"],
            "code_parrainage": vendeur["code_parrainage"]
        }
    }

@app.get("/api/vendeurs/profil")
async def profil_vendeur(vendeur = Depends(get_current_vendeur)):
    """Récupérer le profil du vendeur connecté"""
    
    # Calculer les statistiques
    total_ventes = await db.ventes.count_documents({"vendeur_id": str(vendeur["_id"])})
    revenus_ventes = await db.ventes.aggregate([
        {"$match": {"vendeur_id": str(vendeur["_id"])}},
        {"$group": {"_id": None, "total": {"$sum": "$montant"}}}
    ]).to_list(1)
    
    total_revenus = revenus_ventes[0]["total"] if revenus_ventes else 0
    
    return {
        "id": str(vendeur["_id"]),
        "nom": vendeur["nom"],
        "prenom": vendeur["prenom"],
        "telephone": vendeur["telephone"],
        "email": vendeur["email"],
        "nom_boutique": vendeur["nom_boutique"],
        "description_boutique": vendeur.get("description_boutique"),
        "est_premium": vendeur["est_premium"],
        "code_parrainage": vendeur["code_parrainage"],
        "statistiques": {
            "total_ventes": total_ventes,
            "revenus_totaux": total_revenus,
            "commission_parrainage": vendeur.get("commission_parrainage_gagnee", 0),
            "nombre_parraines": len(vendeur.get("parrains", []))
        },
        "date_creation": vendeur["date_creation"]
    }

# ==================== ABONNEMENTS ====================

@app.post("/api/abonnements/souscrire")
async def souscrire_abonnement(abo: AbonnementCreate, vendeur = Depends(get_current_vendeur)):
    """Souscrire à un abonnement premium"""
    
    # Tarifs
    tarifs = {
        "basic": 5000,    # 5000 FCFA/mois - boost basique
        "premium": 10000  # 10000 FCFA/mois - boost avancé + analytics
    }
    
    if abo.plan not in tarifs:
        raise HTTPException(status_code=400, detail="Plan invalide")
    
    montant = tarifs[abo.plan]
    
    # Créer la demande d'abonnement
    abonnement_data = {
        "vendeur_id": str(vendeur["_id"]),
        "plan": abo.plan,
        "montant": montant,
        "telephone_paiement": abo.telephone_paiement,
        "statut": "en_attente",  # en_attente, validé, expiré
        "date_debut": None,
        "date_fin": None,
        "date_creation": datetime.utcnow(),
        "reference_paiement": f"ABO-{secrets.token_hex(8).upper()}"
    }
    
    result = await db.abonnements.insert_one(abonnement_data)
    
    # TODO: Intégration Orange Money API pour paiement automatique
    # Pour l'instant, on retourne les infos pour paiement manuel
    
    return {
        "message": "Demande d'abonnement créée",
        "abonnement_id": str(result.inserted_id),
        "reference": abonnement_data["reference_paiement"],
        "montant": montant,
        "plan": abo.plan,
        "instructions": f"Veuillez envoyer {montant} FCFA via Orange Money au +223 70 70 05 20 avec la référence {abonnement_data['reference_paiement']}"
    }

@app.post("/api/abonnements/{abonnement_id}/valider")
async def valider_abonnement(abonnement_id: str):
    """Valider un paiement d'abonnement (ADMIN ONLY - à sécuriser)"""
    
    abonnement = await db.abonnements.find_one({"_id": ObjectId(abonnement_id)})
    if not abonnement:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
    
    # Mettre à jour l'abonnement
    date_debut = datetime.utcnow()
    date_fin = date_debut + timedelta(days=30)
    
    await db.abonnements.update_one(
        {"_id": ObjectId(abonnement_id)},
        {
            "$set": {
                "statut": "validé",
                "date_debut": date_debut,
                "date_fin": date_fin
            }
        }
    )
    
    # Activer le statut premium du vendeur
    await db.vendeurs.update_one(
        {"_id": ObjectId(abonnement["vendeur_id"])},
        {"$set": {"est_premium": True}}
    )
    
    return {
        "message": "Abonnement validé avec succès",
        "date_debut": date_debut,
        "date_fin": date_fin
    }

@app.get("/api/abonnements/mon-abonnement")
async def mon_abonnement(vendeur = Depends(get_current_vendeur)):
    """Récupérer l'abonnement actif du vendeur"""
    
    abonnement = await db.abonnements.find_one({
        "vendeur_id": str(vendeur["_id"]),
        "statut": "validé",
        "date_fin": {"$gte": datetime.utcnow()}
    })
    
    if not abonnement:
        return {
            "actif": False,
            "message": "Aucun abonnement actif"
        }
    
    return {
        "actif": True,
        "plan": abonnement["plan"],
        "date_debut": abonnement["date_debut"],
        "date_fin": abonnement["date_fin"],
        "jours_restants": (abonnement["date_fin"] - datetime.utcnow()).days
    }

# ==================== BOOST PRODUITS ====================

@app.post("/api/boost/creer")
async def creer_boost(boost: ProduitBoost, vendeur = Depends(get_current_vendeur)):
    """Créer un boost pour un produit (vendeurs premium uniquement)"""
    
    if not vendeur.get("est_premium"):
        raise HTTPException(status_code=403, detail="Fonctionnalité réservée aux vendeurs premium")
    
    # Créer le boost
    boost_data = {
        "vendeur_id": str(vendeur["_id"]),
        "produit_id": boost.produit_id,
        "duree_jours": boost.duree_jours,
        "budget": boost.budget,
        "impressions": 0,
        "clics": 0,
        "conversions": 0,
        "statut": "actif",
        "date_debut": datetime.utcnow(),
        "date_fin": datetime.utcnow() + timedelta(days=boost.duree_jours),
        "date_creation": datetime.utcnow()
    }
    
    result = await db.boosts.insert_one(boost_data)
    
    return {
        "message": "Boost créé avec succès",
        "boost_id": str(result.inserted_id),
        "date_fin": boost_data["date_fin"]
    }

@app.get("/api/boost/mes-boosts")
async def mes_boosts(vendeur = Depends(get_current_vendeur)):
    """Liste des boosts du vendeur"""
    
    boosts = await db.boosts.find({"vendeur_id": str(vendeur["_id"])}).to_list(100)
    
    return {
        "total": len(boosts),
        "boosts": [
            {
                "id": str(b["_id"]),
                "produit_id": b["produit_id"],
                "duree_jours": b["duree_jours"],
                "budget": b["budget"],
                "impressions": b["impressions"],
                "clics": b["clics"],
                "conversions": b["conversions"],
                "statut": b["statut"],
                "date_fin": b["date_fin"]
            }
            for b in boosts
        ]
    }

# ==================== VENTES & COMMISSIONS ====================

@app.post("/api/ventes/enregistrer")
async def enregistrer_vente(vente: VenteCreate, vendeur = Depends(get_current_vendeur)):
    """Enregistrer une vente et calculer les commissions"""
    
    # Calculer la commission
    commission = vente.montant * vente.commission_taux
    montant_net = vente.montant - commission
    
    vente_data = {
        "vendeur_id": str(vendeur["_id"]),
        "produit_id": vente.produit_id,
        "acheteur_telephone": vente.acheteur_telephone,
        "montant": vente.montant,
        "commission_taux": vente.commission_taux,
        "commission_montant": commission,
        "montant_net": montant_net,
        "statut": "completé",
        "date_vente": datetime.utcnow()
    }
    
    result = await db.ventes.insert_one(vente_data)
    
    # Enregistrer la commission pour l'admin
    commission_data = {
        "type": "vente",
        "vente_id": str(result.inserted_id),
        "vendeur_id": str(vendeur["_id"]),
        "montant": commission,
        "date": datetime.utcnow()
    }
    await db.commissions.insert_one(commission_data)
    
    return {
        "message": "Vente enregistrée",
        "vente_id": str(result.inserted_id),
        "montant": vente.montant,
        "commission": commission,
        "montant_net": montant_net
    }

@app.get("/api/ventes/historique")
async def historique_ventes(vendeur = Depends(get_current_vendeur)):
    """Historique des ventes du vendeur"""
    
    ventes = await db.ventes.find({"vendeur_id": str(vendeur["_id"])}).to_list(100)
    
    return {
        "total": len(ventes),
        "ventes": [
            {
                "id": str(v["_id"]),
                "produit_id": v["produit_id"],
                "montant": v["montant"],
                "commission": v["commission_montant"],
                "montant_net": v["montant_net"],
                "date": v["date_vente"]
            }
            for v in ventes
        ]
    }

# ==================== PARRAINAGE ====================

@app.post("/api/parrainage/utiliser-code")
async def utiliser_code_parrainage(code: CodeParrainage, vendeur = Depends(get_current_vendeur)):
    """Utiliser un code de parrainage lors de l'inscription"""
    
    # Trouver le parrain
    parrain = await db.vendeurs.find_one({"code_parrainage": code.code.upper()})
    if not parrain:
        raise HTTPException(status_code=404, detail="Code de parrainage invalide")
    
    if str(parrain["_id"]) == str(vendeur["_id"]):
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas utiliser votre propre code")
    
    # Ajouter le filleul à la liste du parrain
    await db.vendeurs.update_one(
        {"_id": parrain["_id"]},
        {"$push": {"parrains": str(vendeur["_id"])}}
    )
    
    # Enregistrer le lien de parrainage
    await db.vendeurs.update_one(
        {"_id": vendeur["_id"]},
        {"$set": {"parrain_id": str(parrain["_id"])}}
    )
    
    return {
        "message": "Code de parrainage appliqué",
        "parrain": parrain["nom_boutique"]
    }

@app.get("/api/parrainage/mes-filleuls")
async def mes_filleuls(vendeur = Depends(get_current_vendeur)):
    """Liste des vendeurs parrainés"""
    
    filleuls_ids = vendeur.get("parrains", [])
    
    if not filleuls_ids:
        return {"total": 0, "filleuls": []}
    
    filleuls = await db.vendeurs.find({
        "_id": {"$in": [ObjectId(fid) for fid in filleuls_ids]}
    }).to_list(100)
    
    return {
        "total": len(filleuls),
        "filleuls": [
            {
                "nom_boutique": f["nom_boutique"],
                "date_inscription": f["date_creation"],
                "est_premium": f["est_premium"]
            }
            for f in filleuls
        ],
        "commission_totale": vendeur.get("commission_parrainage_gagnee", 0)
    }

# ==================== PRODUITS ====================

@app.get("/api/produits")
async def lister_produits(
    page: int = 1,
    limit: int = 20,
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = "recent",
    premium: Optional[bool] = None
):
    """Lister les produits avec filtres et pagination"""
    
    query = {}
    
    # Filtres
    if q:
        query["$or"] = [
            {"nom": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    if category:
        query["categorie"] = category
    if min_price is not None or max_price is not None:
        query["prix"] = {}
        if min_price is not None: query["prix"]["$gte"] = min_price
        if max_price is not None: query["prix"]["$lte"] = max_price
    if premium is not None:
        query["est_premium"] = premium

    # Tri
    sort_query = [("date_creation", -1)]
    if sort == "prix_asc": sort_query = [("prix", 1)]
    elif sort == "prix_desc": sort_query = [("prix", -1)]
    
    # Exécution
    skip = (page - 1) * limit
    produits = await db.produits.find(query).sort(sort_query).skip(skip).limit(limit).to_list(limit)
    total = await db.produits.count_documents(query)
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "produits": [
            {
                "id": str(p["_id"]),
                "nom": p["nom"],
                "description": p["description"],
                "prix": p["prix"],
                "categorie": p["categorie"],
                "images": p.get("images", []),
                "est_premium": p.get("est_premium", False),
                "vendeur_id": p["vendeur_id"],
                "date_creation": p["date_creation"]
            }
            for p in produits
        ]
    }

@app.get("/api/produits/{produit_id}")
async def detail_produit(produit_id: str):
    """Récupérer les détails d'un produit"""
    
    produit = await db.produits.find_one({"_id": ObjectId(produit_id)})
    if not produit:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    # Récupérer les infos du vendeur
    vendeur = await db.vendeurs.find_one({"_id": ObjectId(produit["vendeur_id"])})
    
    return {
        "id": str(produit["_id"]),
        "nom": produit["nom"],
        "description": produit["description"],
        "prix": produit["prix"],
        "categorie": produit["categorie"],
        "images": produit.get("images", []),
        "vendeur": {
            "id": str(vendeur["_id"]),
            "nom_boutique": vendeur["nom_boutique"]
        } if vendeur else None,
        "date_creation": produit["date_creation"]
    }

@app.post("/api/produits")
async def creer_produit(produit: ProduitCreate, current_user = Depends(get_current_user)):
    """Ajouter un nouveau produit (Vendeur requis et actif)"""
    
    if current_user["role"] != "vendeur":
        raise HTTPException(status_code=403, detail="Seuls les vendeurs peuvent ajouter des produits")
    
    # Trouver le profil vendeur et vérifier s'il est actif
    vendeur = await db.vendeurs.find_one({"user_id": str(current_user["_id"])})
    if not vendeur:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")
    
    if not vendeur.get("actif", False):
        raise HTTPException(status_code=403, detail="Votre profil vendeur est en attente de validation par l'administrateur")
    
    # Gérer les images (Upload sur Cloudinary si c'est du base64)
    final_images = []
    for img in produit.images:
        if img.startswith("data:image/"):
            url = await upload_image_to_cloudinary(img)
            final_images.append(url)
        else:
            final_images.append(img)
    
    produit_data = {
        "nom": produit.nom,
        "description": produit.description,
        "prix": produit.prix,
        "categorie": produit.categorie,
        "images": final_images,
        "stock": produit.stock,
        "est_premium": produit.est_premium,
        "vendeur_id": str(vendeur["_id"]),
        "date_creation": datetime.utcnow()
    }
    
    result = await db.produits.insert_one(produit_data)
    
    return {
        "message": "Produit ajouté avec succès",
        "produit_id": str(result.inserted_id),
        "images": final_images
    }

@app.post("/api/media/upload")
async def upload_media(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    """Uploader une image directement sur Cloudinary"""
    # Lire le contenu du fichier
    contents = await file.read()
    url = await upload_image_to_cloudinary(contents)
    return {"url": url}


# ==================== VENDEURS (EXTENDED) ====================

@app.get("/api/vendeurs/premium")
async def lister_vendeurs_premium():
    """Lister les vendeurs premium"""
    
    vendeurs = await db.vendeurs.find({"est_premium": True}).to_list(100)
    
    return [
        {
            "id": str(v["_id"]),
            "nom_boutique": v["nom_boutique"],
            "description": v.get("description_boutique"),
            "score": v.get("score", 0)
        }
        for v in vendeurs
    ]

@app.get("/api/vendeurs/{vendeur_id}")
async def detail_vendeur(vendeur_id: str):
    """Récupérer le profil public d'un vendeur"""
    
    vendeur = await db.vendeurs.find_one({"_id": ObjectId(vendeur_id)})
    if not vendeur:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    
    return {
        "id": str(vendeur["_id"]),
        "nom_boutique": vendeur["nom_boutique"],
        "description": vendeur.get("description_boutique"),
        "est_premium": vendeur["est_premium"],
        "score": vendeur.get("score", 0),
        "date_creation": vendeur["date_creation"]
    }

@app.get("/api/vendeurs/{vendeur_id}/produits")
async def produits_vendeur(vendeur_id: str):
    """Lister les produits d'un vendeur"""
    
    produits = await db.produits.find({"vendeur_id": vendeur_id}).to_list(100)
    
    return [
        {
            "id": str(p["_id"]),
            "nom": p["nom"],
            "prix": p["prix"],
            "images": p.get("images", [])
        }
        for p in produits
    ]

@app.get("/api/vendeurs/{vendeur_id}/avis")
async def avis_vendeur(vendeur_id: str):
    """Récupérer les avis d'un vendeur"""
    
    vendeur = await db.vendeurs.find_one({"_id": ObjectId(vendeur_id)})
    if not vendeur:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    
    return vendeur.get("avis", [])

# ==================== ADMIN DASHBOARD ====================

@app.get("/api/admin/statistiques")
async def statistiques_admin():
    """Statistiques globales (À SÉCURISER avec authentification admin)"""
    
    # Total vendeurs
    total_vendeurs = await db.vendeurs.count_documents({})
    vendeurs_premium = await db.vendeurs.count_documents({"est_premium": True})
    
    # Revenus abonnements
    revenus_abonnements = await db.abonnements.aggregate([
        {"$match": {"statut": "validé"}},
        {"$group": {"_id": None, "total": {"$sum": "$montant"}}}
    ]).to_list(1)
    
    # Commissions ventes
    commissions_ventes = await db.commissions.aggregate([
        {"$match": {"type": "vente"}},
        {"$group": {"_id": None, "total": {"$sum": "$montant"}}}
    ]).to_list(1)
    
    total_revenus_abo = revenus_abonnements[0]["total"] if revenus_abonnements else 0
    total_commissions = commissions_ventes[0]["total"] if commissions_ventes else 0
    
    return {
        "vendeurs": {
            "total": total_vendeurs,
            "premium": vendeurs_premium,
            "gratuit": total_vendeurs - vendeurs_premium
        },
        "revenus": {
            "abonnements": total_revenus_abo,
            "commissions_ventes": total_commissions,
            "total": total_revenus_abo + total_commissions
        }
    }

@app.get("/api/admin/abonnements-en-attente")
async def abonnements_en_attente():
    """Liste des abonnements en attente de validation (ADMIN ONLY)"""
    
    abonnements = await db.abonnements.find({"statut": "en_attente"}).to_list(100)
    
    return {
        "total": len(abonnements),
        "abonnements": [
            {
                "id": str(a["_id"]),
                "vendeur_id": a["vendeur_id"],
                "plan": a["plan"],
                "montant": a["montant"],
                "reference": a["reference_paiement"],
                "telephone": a["telephone_paiement"],
                "date_creation": a["date_creation"]
            }
            for a in abonnements
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
