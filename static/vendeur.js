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
});

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
    const isPremium = vendor.abonnement === 'premium';
    const premiumBadge = isPremium ? '<span style="background: var(--premium-gradient); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.9rem;">✓ PREMIUM</span>' : '';
    
    const initial = vendor.nom ? vendor.nom.charAt(0).toUpperCase() : 'V';
    
    const html = `
        <div class="vendor-avatar-large">${initial}</div>
        <div class="vendor-info">
            <div class="vendor-name-large">
                ${vendor.nom || 'Vendeur'}
                ${premiumBadge}
            </div>
            <div class="vendor-bio">
                ${vendor.bio || 'Vendeur sur SANI-FÉRÉ PRO'}
            </div>
            <div class="vendor-stats-large">
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
                    <span class="stat-large-value">${formatMemberDate(vendor.date_creation)}</span>
                    <span class="stat-large-label">Membre depuis</span>
                </div>

            </div>
            <button class="contact-vendor" onclick="contactVendor()">
                💬 Contacter le Vendeur
            </button>
        </div>
    `;
    
    document.getElementById('vendorProfile').innerHTML = html;
    document.getElementById('productsCount').textContent = vendor.total_produits || 0;
    document.getElementById('reviewsCount').textContent = vendor.total_avis || 0;
}

// Afficher À Propos
function displayVendorAbout(vendor) {
    const isPremium = vendor.abonnement === 'premium';
    
    const html = `
        <div style="display: grid; gap: 1rem;">
            <div>
                <strong>📍 Localisation:</strong> ${vendor.localisation || 'Mali'}
            </div>
            <div>
                <strong>📅 Membre depuis:</strong> ${formatFullDate(vendor.date_creation)}
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
    const imageUrl = product.images?.[0] 
        ? product.images[0] 
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
        const message = encodeURIComponent(`Bonjour ${nom}, je vous contacte depuis SANI-FÉRÉ PRO à propos de vos produits.`);
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
    if (!dateStr) return 'Récemment';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Récemment';
    
    const month = date.toLocaleString('fr-FR', { month: 'long' });
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${capitalizedMonth} ${date.getFullYear()}`;
}
