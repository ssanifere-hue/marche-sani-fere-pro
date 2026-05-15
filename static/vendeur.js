// Configuration
var API_BASE_URL = 'https://web-production-8f94.up.railway.app';

// État
let vendorId = null;
let vendorData = null;
let vendorProductsPage = 1;
let vendorProductsFilter = 'tous';
let isLoadingVendorProducts = false;
let hasMoreVendorProducts = true;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    vendorId = params.get('id');
    
    if (!vendorId) {
        window.location.href = 'index.html';
        return;
    }
    
    loadVendorProfile();
    loadVendorProducts();
    updateNavbar();
});

// Session navbar (même logique que app.js)
function updateNavbar() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const navActions = document.getElementById('navActions');
    if (token && userStr && navActions) {
        try {
            const user = JSON.parse(userStr);
            const firstName = user.prenom || user.nom || 'Compte';
            navActions.innerHTML = `
                ${user.role === 'vendeur'
                    ? '<a href="/dashboard" style="padding:8px 18px;border-radius:100px;font-size:14px;font-weight:600;border:none;cursor:pointer;background:#FFD700;color:#1565C0;text-decoration:none;transition:background 0.2s;">Dashboard</a><a href="vendre.html" style="padding:8px 18px;border-radius:100px;font-size:14px;font-weight:600;border:none;cursor:pointer;background:#FFD700;color:#1565C0;text-decoration:none;transition:background 0.2s;margin-left:8px;">Vendre</a>'
                    : ''}
                <div style="display:flex;align-items:center;gap:1rem;">
                    <span style="font-weight:600;color:var(--text-dark);">👤 ${firstName}</span>
                    <a href="#" style="padding:7px 16px;border-radius:100px;font-size:14px;font-weight:500;cursor:pointer;background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,0.5);text-decoration:none;transition:background 0.2s;" onclick="handleLogout(event)">Déconnexion</a>
                </div>
            `;
        } catch(e) {}
    }
}
function handleLogout(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

// Charger le profil vendeur
async function loadVendorProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vendeurs/${vendorId}`);
        const data = await response.json();
        
        // L'API renvoie les données directement (pas dans data.vendeur)
        if (!data.id && !data.nom_boutique) {
            throw new Error('Vendeur non trouvé');
        }
        
        vendorData = data;
        displayVendorProfile(vendorData);
        displayVendorAbout(vendorData);

        
    } catch (error) {
        console.error('Erreur chargement profil vendeur:', error);
        document.getElementById('vendorProfile').innerHTML = `
            <div style="text-align:center; padding:2rem;">
                <h3>❌ Vendeur non trouvé</h3>
                <p>Ce vendeur n'existe pas ou a été supprimé.</p>
                <a href="index.html" class="nav-btn primary" style="margin-top:1rem;">Retour à l'accueil</a>
            </div>
        `;
    }
}

// Afficher le profil vendeur
function displayVendorProfile(vendor) {
    const isPremium = vendor.est_premium || false;
    const premiumBadge = isPremium ? '<span style="background: var(--premium-gradient); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.9rem;">✓ PREMIUM</span>' : '';
    
    const vendorDisplayName = vendor.nom_boutique || vendor.nom || 'Vendeur';
    const initial = vendorDisplayName.charAt(0).toUpperCase();
    
    const bannerHtml = vendor.banniere 
        ? `<div style="height: 200px; width: 100%; background: url('${vendor.banniere}') center/cover; position: absolute; top: 0; left: 0; z-index: 0; border-radius: 12px 12px 0 0;"></div>` 
        : '';
        
    const avatarHtml = vendor.logo
        ? `<img src="${vendor.logo}" class="vendor-avatar-large" style="object-fit: cover; z-index: 1; border: 4px solid white; background: white;">`
        : `<div class="vendor-avatar-large" style="z-index: 1; border: 4px solid white;">${initial}</div>`;

    const contactActions = [];
    if (vendor.whatsapp) {
        contactActions.push(`<a href="https://wa.me/${vendor.whatsapp.replace(/\+/g, '')}" target="_blank" class="contact-vendor" style="background: #25D366; text-decoration: none;">📱 WhatsApp</a>`);
    } else {
        contactActions.push(`<button class="contact-vendor" onclick="contactVendor()">💬 Contacter le Vendeur</button>`);
    }

    const html = `
        ${bannerHtml}
        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%; ${vendor.banniere ? 'margin-top: 150px;' : ''}">
            ${avatarHtml}
            <div class="vendor-info" style="text-align: center;">
                <div class="vendor-name-large">
                    ${vendorDisplayName}
                    ${premiumBadge}
                </div>
                <div class="vendor-bio" style="max-width: 600px; margin: 1rem auto;">
                    ${vendor.description_boutique || vendor.bio || 'Vendeur sur APHRIKE JULA'}
                </div>
                ${vendor.adresse ? `<div style="color: var(--text-gray); margin-bottom: 1rem;">📍 ${vendor.adresse}</div>` : ''}
                
                <div class="vendor-stats-large" style="justify-content: center;">
                    <div class="stat-large">
                        <span class="stat-large-value">${vendor.total_ventes || 0}</span>
                        <span class="stat-large-label">Ventes</span>
                    </div>
                    <div class="stat-large">
                        <span class="stat-large-value">${vendor.note || '5.0'}</span>
                        <span class="stat-large-label">⭐ Note</span>
                    </div>
                    <div class="stat-large">
                        <span class="stat-large-value">${vendor.total_produits || 0}</span>
                        <span class="stat-large-label">Produits</span>
                    </div>
                    <div class="stat-large">
                        <span class="stat-large-value">${formatMemberDate(vendor.date_creation || vendor.date_inscription)}</span>
                        <span class="stat-large-label">Membre depuis</span>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                    ${contactActions.join('')}
                </div>
            </div>
        </div>
    `;
    
    // Assurez-vous que vendorProfile a position relative
    const vendorProfileDiv = document.getElementById('vendorProfile');
    vendorProfileDiv.style.position = 'relative';
    vendorProfileDiv.style.padding = vendor.banniere ? '0 0 2rem 0' : '2rem';
    vendorProfileDiv.innerHTML = html;
    
    document.getElementById('productsCount').textContent = vendor.total_produits || 0;
    document.getElementById('reviewsCount').textContent = vendor.total_avis || 0;
}

// Afficher À Propos
function displayVendorAbout(vendor) {
    const isPremium = vendor.est_premium || false;
    
    const html = `
        <div style="display: grid; gap: 1rem;">
            <div>
                <strong>📍 Localisation:</strong> ${vendor.localisation || 'Mali'}
            </div>
            <div>
                <strong>📅 Membre depuis:</strong> ${formatFullDate(vendor.date_creation || vendor.date_inscription)}
            </div>
            <div>
                <strong>✉️ Email:</strong> ${vendor.email || 'Non renseigné'}
            </div>
            <div>
                <strong>📱 Téléphone:</strong> ${vendor.telephone || 'Non renseigné'}
            </div>
            <div>
                <strong>🏆 Statut:</strong> ${isPremium ? 'Vendeur Premium ⭐' : 'Vendeur Basic'}
            </div>
            ${vendor.bio ? `
            <div>
                <strong>ℹ️ Bio:</strong><br>
                ${vendor.bio}
            </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('vendorAbout').innerHTML = html;
}

// Charger les produits du vendeur
async function loadVendorProducts(reset = false) {
    if (isLoadingVendorProducts) return;
    
    if (reset || vendorProductsPage === 1) {
        vendorProductsPage = 1;
        hasMoreVendorProducts = true;
        document.getElementById('vendorProductsGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }

    
    isLoadingVendorProducts = true;
    updateLoadMoreVendorButton(true);
    
    try {
        let url = `${API_BASE_URL}/api/vendeurs/${vendorId}/produits?page=${vendorProductsPage}&limit=24`;
        
        if (vendorProductsFilter && vendorProductsFilter !== 'tous') {
            url += `&sort=${vendorProductsFilter}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        const grid = document.getElementById('vendorProductsGrid');
        
        if (!data.produits || data.produits.length === 0) {
            if (reset || vendorProductsPage === 1) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:3rem;">
                        <h3>📦 Aucun produit disponible</h3>
                        <p>Ce vendeur n'a pas encore ajouté de produits</p>
                    </div>
                `;
            }
            hasMoreVendorProducts = false;
            updateLoadMoreVendorButton(false);
            isLoadingVendorProducts = false;
            return;
        }

        
        const productsHTML = data.produits.map(product => createVendorProductCard(product)).join('');
        
        if (reset || vendorProductsPage === 1) {
            grid.innerHTML = productsHTML;
        } else {
            grid.insertAdjacentHTML('beforeend', productsHTML);
        }

        
        hasMoreVendorProducts = data.produits.length === 24;
        vendorProductsPage++;
        
    } catch (error) {
        console.error('Erreur chargement produits vendeur:', error);
        const grid = document.getElementById('vendorProductsGrid');
        if (reset || vendorProductsPage === 1) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem;">
                    <h3>❌ Erreur de chargement</h3>
                    <p>Impossible de charger les produits</p>
                </div>
            `;
        }

    } finally {
        isLoadingVendorProducts = false;
        updateLoadMoreVendorButton(false);
    }
}

// Créer carte produit
function createVendorProductCard(product) {
    const productName = product.nom || product.titre || 'Produit';
    const validImages = (product.images || []).filter(img => img && img.trim());
    const imageUrl = validImages.length > 0 
        ? validImages[0] 
        : `https://via.placeholder.com/300x300/E9ECEF/6C757D?text=${encodeURIComponent(productName)}`;
    
    return `
        <a href="produit.html?id=${product.id}" class="product-card">
            <img src="${imageUrl}" alt="${productName}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300/E9ECEF/6C757D?text=Image'">
            <div class="product-info">
                <div class="product-title">${productName}</div>
                <div class="product-price">${formatPrice(product.prix)} FCFA</div>
            </div>
        </a>
    `;
}


// Filtrer produits vendeur
function filterVendorProducts(filter) {
    vendorProductsFilter = filter;
    
    // Mettre à jour UI
    document.querySelectorAll('.filters-bar .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${filter}'`)) {
            btn.classList.add('active');
        }
    });
    
    loadVendorProducts(true);
}


// Charger plus de produits
function loadMoreVendorProducts() {
    if (!hasMoreVendorProducts || isLoadingVendorProducts) return;
    loadVendorProducts(false);
}

function updateLoadMoreVendorButton(loading) {
    const btn = document.getElementById('loadMoreVendorBtn');
    if (!btn) return;
    
    if (loading) {
        btn.disabled = true;
        btn.textContent = 'Chargement...';
    } else if (!hasMoreVendorProducts) {
        btn.disabled = true;
        btn.textContent = 'Tous les produits chargés';
    } else {
        btn.disabled = false;
        btn.textContent = 'Voir Plus de Produits';
    }
}

// Recherche dans vendeur
function searchInVendor() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    window.location.href = `catalogue.html?search=${encodeURIComponent(query)}&vendeur=${vendorId}`;
}

// Contacter vendeur
function contactVendor() {
    if (!vendorData) return;
    
    const telephone = vendorData.telephone || '';
    const nom = vendorData.nom || 'le vendeur';
    
    if (telephone) {
        const message = encodeURIComponent(`Bonjour ${nom}, je vous contacte depuis APHRIKE JULA à propos de vos produits.`);
        window.open(`https://wa.me/${telephone}?text=${message}`, '_blank');
    } else {
        alert('Ce vendeur n\'a pas renseigné de numéro de téléphone. Essayez de le contacter via le chatbot.');
    }
}

// Gérer les tabs
function switchTab(tabName) {
    // Mettre à jour les boutons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(`'${tabName}'`)) {
            tab.classList.add('active');
        }
    });
    
    // Mettre à jour le contenu
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Charger les données si nécessaire
    if (tabName === 'avis') {
        loadVendorReviews();
    }
}

// Charger les avis
async function loadVendorReviews() {
    const container = document.getElementById('reviewsContainer');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/vendeurs/${vendorId}/avis`);
        const data = await response.json();
        
        if (!data.avis || data.avis.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:3rem;">
                    <h3>💬 Aucun avis pour le moment</h3>
                    <p>Soyez le premier à laisser un avis !</p>
                </div>
            `;
            return;
        }
        
        const html = data.avis.map(avis => `
            <div style="background: white; padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1rem; box-shadow: var(--shadow-sm);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${avis.auteur || 'Acheteur'}</strong>
                    <span style="color: var(--primary-gold);">${'⭐'.repeat(avis.note || 5)}</span>
                </div>
                <p style="color: var(--text-gray); margin-bottom: 0.5rem;">${avis.commentaire || ''}</p>
                <small style="color: var(--text-gray);">${formatDate(avis.date)}</small>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erreur chargement avis:', error);
        container.innerHTML = `
            <div style="text-align:center; padding:2rem;">
                <p>Impossible de charger les avis</p>
            </div>
        `;
    }
}

// Utilitaires
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFullDate(dateStr) {
    if (!dateStr) return 'Non renseigné';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Non renseigné';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMemberDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
        return `${diffDays}j`;
    } else if (diffDays < 365) {
        return `${Math.floor(diffDays / 30)}m`;
    } else {
        return `${Math.floor(diffDays / 365)}a`;
    }
}
