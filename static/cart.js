// ===== APHRIKE JULA — Cart System (MongoDB-backed) =====
const CART_API = 'https://web-production-8f94.up.railway.app/api/panier';

// Get cart ID — uses logged-in user's ID for cross-device sync, or a random UUID for anonymous users
function getCartId() {
    // If user is logged in, use their account ID so cart syncs across devices
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) return 'user_' + user.id;
            if (user && user.telephone) return 'user_' + user.telephone;
        }
    } catch(e) {}
    
    // Anonymous fallback — random ID per browser
    let id = localStorage.getItem('aj_cart_id');
    if (!id) {
        id = 'anon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('aj_cart_id', id);
    }
    return id;
}

// ===== Badge =====
async function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    try {
        const res = await fetch(`${CART_API}/${getCartId()}`);
        const data = await res.json();
        if (data.count > 0) {
            badge.style.display = 'flex';
            badge.textContent = data.count;
        } else {
            badge.style.display = 'none';
        }
    } catch(e) {
        badge.style.display = 'none';
    }
}

// ===== Add to cart =====
async function ajouterAuPanier(produitId, deliveryNom, deliveryPrix) {
    try {
        const res = await fetch(`${CART_API}/ajouter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cart_id: getCartId(),
                produit_id: produitId,
                qty: 1,
                delivery_nom: deliveryNom || null,
                delivery_prix: deliveryPrix || 0
            })
        });
        if (res.ok) {
            const data = await res.json();
            updateCartBadge();
            alert('Produit ajouté au panier !');
            return data;
        } else {
            alert('Erreur lors de l\'ajout au panier');
        }
    } catch(e) {
        console.error(e);
        alert('Erreur de connexion');
    }
}

// ===== Drawer toggle =====
function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (!drawer) return;
    const isOpen = drawer.classList.contains('cart-open');
    if (isOpen) {
        drawer.classList.remove('cart-open');
        if (overlay) overlay.style.display = 'none';
    } else {
        drawer.classList.add('cart-open');
        if (overlay) overlay.style.display = 'block';
        renderCart();
    }
}

// ===== Render cart =====
async function renderCart() {
    const container = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:2rem;"><div class="spinner"></div></div>';

    try {
        const res = await fetch(`${CART_API}/${getCartId()}`);
        const data = await res.json();
        const items = data.items || [];

        if (items.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">Votre panier est vide</p>';
            if (totalEl) totalEl.textContent = '0 FCFA';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }
        if (checkoutBtn) checkoutBtn.disabled = false;

        let total = 0;
        container.innerHTML = items.map((item, idx) => {
            const itemTotal = item.prix * item.qty + (item.delivery_prix || 0);
            total += itemTotal;
            return `
            <div style="display:flex;gap:0.75rem;align-items:center;padding:0.75rem 0;border-bottom:1px solid #f0f0f0;">
                <img src="${item.image || 'https://placehold.co/50x50?text=📦'}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;" onerror="this.src='https://placehold.co/50x50?text=📦'">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.nom}</div>
                    <div style="font-size:0.8rem;color:#666;">${formatCartPrice(item.prix)} FCFA × ${item.qty}</div>
                    ${item.delivery_nom ? '<div style="font-size:0.7rem;color:#999;">🚚 ' + item.delivery_nom + '</div>' : ''}
                </div>
                <div style="display:flex;align-items:center;gap:4px;">
                    <button onclick="changeCartQty('${item.produit_id}',${item.qty - 1})" style="width:26px;height:26px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-weight:700;font-size:1rem;">−</button>
                    <span style="width:22px;text-align:center;font-size:0.85rem;font-weight:600;">${item.qty}</span>
                    <button onclick="changeCartQty('${item.produit_id}',${item.qty + 1})" style="width:26px;height:26px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer;font-weight:700;font-size:1rem;">+</button>
                </div>
                <button onclick="removeCartItem('${item.produit_id}')" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:1.1rem;" title="Supprimer">🗑️</button>
            </div>`;
        }).join('');

        if (totalEl) totalEl.textContent = formatCartPrice(total) + ' FCFA';
    } catch(e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center;color:#dc3545;padding:1rem;">Erreur de chargement</p>';
    }
}

// ===== Change quantity =====
async function changeCartQty(produitId, newQty) {
    try {
        if (newQty <= 0) {
            await removeCartItem(produitId);
            return;
        }
        await fetch(`${CART_API}/${getCartId()}/item/${produitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qty: newQty })
        });
        renderCart();
        updateCartBadge();
    } catch(e) { console.error(e); }
}

// ===== Remove item =====
async function removeCartItem(produitId) {
    try {
        await fetch(`${CART_API}/${getCartId()}/item/${produitId}`, { method: 'DELETE' });
        renderCart();
        updateCartBadge();
    } catch(e) { console.error(e); }
}

// ===== Checkout =====
async function checkoutCart() {
    const phone = prompt('Votre numéro de téléphone (8 chiffres) :');
    if (!phone || phone.length < 8) { alert('Numéro invalide'); return; }

    const btn = document.getElementById('cartCheckoutBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Traitement...'; }

    try {
        const res = await fetch(`${CART_API}/${getCartId()}`);
        const data = await res.json();
        const items = data.items || [];
        if (items.length === 0) { alert('Panier vide'); return; }

        const API_BASE = 'https://web-production-8f94.up.railway.app';
        let totalPay = 0;
        let lastRef = '';
        let hasError = false;

        for (const item of items) {
            try {
                const r = await fetch(`${API_BASE}/api/ventes/enregistrer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        produit_id: item.produit_id,
                        acheteur_telephone: phone,
                        montant: item.prix * item.qty,
                        methode_livraison: item.delivery_nom || null,
                        frais_livraison: item.delivery_prix || 0
                    })
                });
                if (r.ok) {
                    const d = await r.json();
                    totalPay += (item.prix * item.qty) + (item.delivery_prix || 0);
                    lastRef = d.vente_id;
                } else { hasError = true; }
            } catch(e) { hasError = true; }
        }

        if (!hasError) {
            // Clear cart in MongoDB
            await fetch(`${CART_API}/${getCartId()}`, { method: 'DELETE' });
            updateCartBadge();
            toggleCartDrawer();

            // Show OM modal if exists
            const omModal = document.getElementById('omModal');
            if (omModal) {
                document.getElementById('omRef').textContent = 'REF-' + lastRef.substring(lastRef.length - 6).toUpperCase();
                document.getElementById('omAmount').textContent = formatCartPrice(totalPay) + ' FCFA';
                omModal.style.display = 'flex';
            } else {
                alert('Commande créée ! Total: ' + formatCartPrice(totalPay) + ' FCFA\nRéférence: REF-' + lastRef.substring(lastRef.length - 6).toUpperCase() + '\n\nEnvoyez le paiement Orange Money au +223 70 70 05 20');
            }
        } else {
            alert('Certaines commandes ont échoué. Réessayez.');
        }
    } catch(e) {
        console.error(e);
        alert('Erreur de connexion');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Commander tout'; }
    }
}

function formatCartPrice(p) {
    return new Intl.NumberFormat('fr-FR').format(p);
}

// ===== Inject cart drawer HTML =====
function injectCartDrawer() {
    if (document.getElementById('cartDrawer')) return; // already exists

    const drawerHTML = `
    <div id="cartOverlay" onclick="toggleCartDrawer()" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:2999;"></div>
    <div id="cartDrawer" style="position:fixed;top:0;right:-400px;width:100%;max-width:380px;height:100%;background:white;z-index:3000;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,0.15);transition:right 0.3s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid #eee;background:#1565C0;color:white;">
            <h3 style="margin:0;font-size:1.1rem;">🛒 Mon Panier</h3>
            <button onclick="toggleCartDrawer()" style="background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;">&times;</button>
        </div>
        <div id="cartItems" style="flex:1;overflow-y:auto;padding:0 1.25rem;"></div>
        <div style="border-top:2px solid #eee;padding:1rem 1.25rem;">
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.15rem;margin-bottom:0.75rem;">
                <span>Total:</span>
                <span id="cartTotal" style="color:#1565C0;">0 FCFA</span>
            </div>
            <button id="cartCheckoutBtn" onclick="checkoutCart()" disabled style="width:100%;padding:0.85rem;background:#FFD700;color:#1565C0;border:none;border-radius:100px;font-weight:700;font-size:1rem;cursor:pointer;">Commander tout</button>
            <a href="suivi.html" style="display:block;text-align:center;margin-top:0.5rem;font-size:0.85rem;color:#1565C0;">📦 Suivre une commande</a>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);
}

// Override toggle to use CSS transition
(function() {
    const origToggle = toggleCartDrawer;
    toggleCartDrawer = function() {
        const drawer = document.getElementById('cartDrawer');
        const overlay = document.getElementById('cartOverlay');
        if (!drawer) { injectCartDrawer(); }
        const d = document.getElementById('cartDrawer');
        const o = document.getElementById('cartOverlay');
        const isOpen = d.style.right === '0px';
        if (isOpen) {
            d.style.right = '-400px';
            if (o) o.style.display = 'none';
        } else {
            d.style.right = '0px';
            if (o) o.style.display = 'block';
            renderCart();
        }
    };
})();

// ===== Init on page load =====
document.addEventListener('DOMContentLoaded', function() {
    injectCartDrawer();
    updateCartBadge();
});
