from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://ssanifere_db_user:mot de passe0.wmvvqjr.mongodb.net/sanifere?retryWrites=true&w=majority&appName=Cluster0")

print("APHRIKE JULA - Nettoyage base de donnees")
print("=" * 50)

client = MongoClient(MONGO_URI)
db = client.sanifere

# Supprimer doublons Scrabble
scrabbles = list(db.produits.find({"nom": {"$regex": "scrable", "$options": "i"}}))
if len(scrabbles) > 1:
    ids = [s['_id'] for s in scrabbles[1:]]
    db.produits.delete_many({'_id': {'$in': ids}})
    print(f"Scrabble: {len(ids)} doublon(s) supprime(s)")

# Supprimer doublons Mini moto
motos = list(db.produits.find({"nom": "Mini moto", "prix": 250000}))
if len(motos) > 1:
    ids = [m['_id'] for m in motos[1:]]
    db.produits.delete_many({'_id': {'$in': ids}})
    print(f"Mini moto: {len(ids)} doublon(s) supprime(s)")

# Corrections orthographe
db.produits.update_many({"nom": {"$regex": "scrable", "$options": "i"}}, {"$set": {"nom": "Jeu enfants-Scrabble"}})
print("Orthographe: scrable -> Scrabble")

db.produits.update_many({"nom": "iPhone 17 pro"}, {"$set": {"nom": "iPhone 15 Pro"}})
print("Nom produit: iPhone 17 -> iPhone 15 Pro")

# Stats finales
total = db.produits.count_documents({})
premium = db.produits.count_documents({"premium": True})

print("=" * 50)
print(f"Total produits: {total}")
print(f"Produits premium: {premium}")
print("Nettoyage termine!")

client.close()
