// Configuration API
var API_BASE_URL = window.location.origin;

// State global
let currentPage = 1;
let currentFilter = 'tous';
let isLoading = false;
let hasMore = true;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    loadCategories();
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
        if (!container) return; // Exit if not on the home page
        
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
        const container = document.getElementById('premiumVendors');
        if (container) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;">Erreur de chargement</p>';
        }
    }
}

// ========================================
// CATEGORIES DYNAMIQUES
// ========================================

async function loadCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (!response.ok) throw new Error('Erreur serveur');
        
        const categories = await response.json();
        
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;">Aucune catégorie disponible</p>';
            return;
        }
        
        container.innerHTML = categories.map(cat => `
            <a href="catalogue.html?category=${cat.slug}" class="category-card">
                <div class="category-icon">${cat.icone || '📦'}</div>
                <div class="category-name">${cat.nom}</div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
        container.innerHTML = '<p style="text-align:center;padding:2rem;">Erreur de chargement</p>';
    }
}

// ========================================
// PRODUITS
// ========================================

async function loadProducts(reset = false) {
    if (isLoading) return;
    
    if (reset || currentPage === 1) {
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
                url += `&category=${currentFilter}`;
            }
        }

        
        const response = await fetch(url);
        const data = await response.json();
        
        const grid = document.getElementById('productsGrid');
        if (!grid) return; // Exit if not on the home page
        
        if (!data.produits || data.produits.length === 0) {
            if (reset || currentPage === 1) {
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
        
        if (reset || currentPage === 1) {
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
        if (grid && (reset || currentPage === 1)) {
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
    const isPremium = product.est_premium || product.vendeur_premium || false;
    const premiumBadge = isPremium ? '<div class="product-badge">✓ PREMIUM</div>' : '';
    const verifiedIcon = isPremium ? '<span class="vendor-verified">✓</span>' : '';
    
    // Compatibilité: backend renvoie 'nom', frontend utilisait 'titre'
    const productName = product.nom || product.titre || 'Produit';
    
    // Image par défaut si pas d'image (filtre les chaînes vides)
    const validImages = (product.images || []).filter(img => img && img.trim());
    const imageUrl = validImages.length > 0 
        ? validImages[0] 
        : `https://via.placeholder.com/300x300/E9ECEF/6C757D?text=${encodeURIComponent(productName)}`;
    
    return `
        <a href="produit.html?id=${product.id}" class="product-card">
            ${premiumBadge}
            <img src="${imageUrl}" alt="${productName}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300/E9ECEF/6C757D?text=Image'">
            <div class="product-info">
                <div class="product-title">${productName}</div>
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
        // Si le bouton correspond à la catégorie, on l'active
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });
    
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
// SESSION & NAVBAR
// ========================================

function updateNavbar() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const navActions = document.querySelector('.nav-actions');

    if (token && userStr && navActions) {
        try {
            const user = JSON.parse(userStr);
            const firstName = user.prenom || user.nom || 'Compte';
            
            navActions.innerHTML = `
                ${user.role === 'vendeur' 
                    ? '<a href="/dashboard" class="nav-btn primary">Dashboard</a>' 
                    : '<a href="vendre.html" class="nav-btn primary">Vendre</a>'}
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-weight: 600; color: var(--text-dark);">👤 ${firstName}</span>
                    <a href="#" class="nav-btn" onclick="handleLogout(event)">Déconnexion</a>
                </div>
            `;
        } catch (e) {
            console.error('Erreur parsing user session:', e);
        }
    }
}

function handleLogout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

