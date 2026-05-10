// Configuration API
const API_BASE_URL = 'https://web-production-8f94.up.railway.app';

// State global
let currentPage = 1;
let currentFilter = 'tous';
let isLoading = false;
let hasMore = true;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadPremiumVendors();
    loadProducts();
    setupInfiniteScroll();
});

// ========================================
// VENDEURS PREMIUM
// ========================================

async function loadPremiumVendors() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vendeurs/premium`);
        const data = await response.json();
        
        const container = document.getElementById('premiumVendors');
        
        if (!data.vendeurs || data.vendeurs.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;">Aucun vendeur premium pour le moment</p>';
            return;
        }
        
        container.innerHTML = data.vendeurs.map(vendor => `
            <a href="vendeur.html?id=${vendor.id}" class="vendor-card">
                <div class="premium-badge">✓ PREMIUM</div>
                <div class="vendor-avatar">${vendor.nom.charAt(0).toUpperCase()}</div>
                <div class="vendor-name">${vendor.nom}</div>
                <div class="vendor-stats">
                    <div class="stat">
                        <div class="stat-value">${vendor.ventes || 0}</div>
                        <div>Ventes</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${vendor.note || '5.0'}</div>
                        <div>⭐</div>
                    </div>
                </div>
            </a>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement vendeurs premium:', error);
        document.getElementById('premiumVendors').innerHTML = 
            '<p style="text-align:center;padding:2rem;">Erreur de chargement</p>';
    }
}

// ========================================
// PRODUITS
// ========================================

async function loadProducts(reset = false) {
    if (isLoading) return;
    
    if (reset) {
        currentPage = 1;
        hasMore = true;
        document.getElementById('productsGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    isLoading = true;
    updateLoadMoreButton(true);
    
    try {
        let url = `${API_BASE_URL}/api/produits?page=${currentPage}&limit=20`;
        
        if (currentFilter !== 'tous') {
            if (currentFilter === 'premium') {
                url += '&premium=true';
            } else {
                url += `&categorie=${currentFilter}`;
            }
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        const grid = document.getElementById('productsGrid');
        
        if (!data.produits || data.produits.length === 0) {
            if (reset) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:3rem;">
                        <h3>Aucun produit trouvé</h3>
                        <p>Essayez un autre filtre ou catégorie</p>
                    </div>
                `;
            }
            hasMore = false;
            updateLoadMoreButton(false);
            isLoading = false;
            return;
        }
        
        const productsHTML = data.produits.map(product => createProductCard(product)).join('');
        
        if (reset) {
            grid.innerHTML = productsHTML;
        } else {
            grid.insertAdjacentHTML('beforeend', productsHTML);
        }
        
        // Vérifier s'il y a plus de produits
        hasMore = data.produits.length === 20;
        currentPage++;
        
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        const grid = document.getElementById('productsGrid');
        if (reset) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem;">
                    <h3>Erreur de chargement</h3>
                    <p>Impossible de charger les produits. Vérifiez votre connexion.</p>
                </div>
            `;
        }
    } finally {
        isLoading = false;
        updateLoadMoreButton(false);
    }
}

function createProductCard(product) {
    const isPremium = product.vendeur_premium || false;
    const premiumBadge = isPremium ? '<div class="product-badge">✓ PREMIUM</div>' : '';
    const verifiedIcon = isPremium ? '<span class="vendor-verified">✓</span>' : '';
    
    // Image par défaut si pas d'image
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : `https://via.placeholder.com/300x300/E9ECEF/6C757D?text=${encodeURIComponent(product.titre || 'Produit')}`;
    
    return `
        <a href="produit.html?id=${product.id}" class="product-card">
            ${premiumBadge}
            <img src="${imageUrl}" alt="${product.titre}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300/E9ECEF/6C757D?text=Image'">
            <div class="product-info">
                <div class="product-title">${product.titre}</div>
                <div class="product-price">${formatPrice(product.prix)} FCFA</div>
                <div class="product-vendor">
                    👤 ${product.vendeur_nom || 'Vendeur'} ${verifiedIcon}
                </div>
            </div>
        </a>
    `;
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price);
}

// ========================================
// FILTRES
// ========================================

function filterByCategory(category) {
    currentFilter = category;
    
    // Mettre à jour UI des boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Recharger les produits
    loadProducts(true);
}

// ========================================
// RECHERCHE
// ========================================

function searchProducts() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        alert('Veuillez entrer un terme de recherche');
        return;
    }
    
    // Rediriger vers la page de recherche
    window.location.href = `catalogue.html?search=${encodeURIComponent(query)}`;
}

// Recherche sur Enter
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
});

// ========================================
// SCROLL INFINI
// ========================================

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        // Charger plus quand l'utilisateur est à 80% du scroll
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            loadMoreProducts();
        }
    });
}

function loadMoreProducts() {
    if (!hasMore || isLoading) return;
    loadProducts(false);
}

function updateLoadMoreButton(loading) {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;
    
    if (loading) {
        btn.disabled = true;
        btn.textContent = 'Chargement...';
    } else if (!hasMore) {
        btn.disabled = true;
        btn.textContent = 'Tous les produits chargés';
    } else {
        btn.disabled = false;
        btn.textContent = 'Voir Plus de Produits';
    }
}

// ========================================
// UTILITAIRES
// ========================================

// Générer des données de démo si l'API ne répond pas
function generateDemoProducts(count = 20) {
    const categories = ['Mode', 'Électronique', 'Maison', 'Beauté'];
    const products = [];
    
    for (let i = 0; i < count; i++) {
        products.push({
            id: `demo-${i}`,
            titre: `Produit ${i + 1} - ${categories[i % categories.length]}`,
            prix: Math.floor(Math.random() * 100000) + 5000,
            images: [],
            vendeur_nom: `Vendeur ${Math.floor(Math.random() * 20) + 1}`,
            vendeur_premium: Math.random() > 0.7
        });
    }
    
    return products;
}

// Afficher les produits de démo
function showDemoProducts() {
    const grid = document.getElementById('productsGrid');
    const products = generateDemoProducts(20);
    grid.innerHTML = products.map(p => createProductCard(p)).join('');
}
