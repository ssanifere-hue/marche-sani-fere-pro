// Configuration
const API_BASE_URL = 'https://web-production-8f94.up.railway.app';

// État
let cataloguePage = 1;
let catalogueFilters = {
    search: '',
    category: '',
    vendorType: '',
    location: '',
    minPrice: null,
    maxPrice: null,
    sort: 'recent'
};
let isLoadingCatalogue = false;
let hasMoreCatalogue = true;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadURLParams();
    loadCatalogueProducts();
    setupCatalogueScroll();
});

// Charger les paramètres de l'URL
function loadURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('search')) {
        catalogueFilters.search = params.get('search');
        document.getElementById('searchInput').value = catalogueFilters.search;
    }
    
    if (params.has('categorie')) {
        catalogueFilters.category = params.get('categorie');
        document.getElementById('categoryFilter').value = catalogueFilters.category;
    }
}

// Charger les produits
async function loadCatalogueProducts(reset = false) {
    if (isLoadingCatalogue) return;
    
    if (reset) {
        cataloguePage = 1;
        hasMoreCatalogue = true;
        document.getElementById('catalogueGrid').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    }
    
    isLoadingCatalogue = true;
    updateLoadMoreCatalogueButton(true);
    
    try {
        // Construire l'URL avec tous les filtres
        let url = `${API_BASE_URL}/api/produits?page=${cataloguePage}&limit=24`;
        
        if (catalogueFilters.search) {
            url += `&search=${encodeURIComponent(catalogueFilters.search)}`;
        }
        if (catalogueFilters.category) {
            url += `&categorie=${catalogueFilters.category}`;
        }
        if (catalogueFilters.vendorType === 'premium') {
            url += `&premium=true`;
        }
        if (catalogueFilters.location) {
            url += `&localisation=${catalogueFilters.location}`;
        }
        if (catalogueFilters.minPrice) {
            url += `&prix_min=${catalogueFilters.minPrice}`;
        }
        if (catalogueFilters.maxPrice) {
            url += `&prix_max=${catalogueFilters.maxPrice}`;
        }
        if (catalogueFilters.sort) {
            url += `&sort=${catalogueFilters.sort}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        const grid = document.getElementById('catalogueGrid');
        
        if (!data.produits || data.produits.length === 0) {
            if (reset) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:3rem;">
                        <h3>😢 Aucun produit trouvé</h3>
                        <p>Essayez de modifier vos critères de recherche</p>
                        <button class="filter-btn" onclick="resetFilters()" style="margin-top: 1rem; background: var(--primary-orange); color: white; border-color: var(--primary-orange);">
                            Réinitialiser les Filtres
                        </button>
                    </div>
                `;
                updateResultsCount(0);
            }
            hasMoreCatalogue = false;
            updateLoadMoreCatalogueButton(false);
            isLoadingCatalogue = false;
            return;
        }
        
        const productsHTML = data.produits.map(product => createProductCard(product)).join('');
        
        if (reset) {
            grid.innerHTML = productsHTML;
        } else {
            grid.insertAdjacentHTML('beforeend', productsHTML);
        }
        
        // Mettre à jour le compteur
        if (reset) {
            updateResultsCount(data.total || data.produits.length);
        }
        
        // Vérifier s'il y a plus de produits
        hasMoreCatalogue = data.produits.length === 24;
        cataloguePage++;
        
    } catch (error) {
        console.error('Erreur chargement catalogue:', error);
        const grid = document.getElementById('catalogueGrid');
        if (reset) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem;">
                    <h3>❌ Erreur de chargement</h3>
                    <p>Impossible de charger les produits. Vérifiez votre connexion.</p>
                    <button class="filter-btn" onclick="loadCatalogueProducts(true)" style="margin-top: 1rem; background: var(--primary-green); color: white; border-color: var(--primary-green);">
                        Réessayer
                    </button>
                </div>
            `;
        }
    } finally {
        isLoadingCatalogue = false;
        updateLoadMoreCatalogueButton(false);
    }
}

// Créer une carte produit
function createProductCard(product) {
    const isPremium = product.est_premium || product.vendeur_premium || false;
    const premiumBadge = isPremium ? '<div class="product-badge">✓ PREMIUM</div>' : '';
    const verifiedIcon = isPremium ? '<span class="vendor-verified">✓</span>' : '';
    
    // Compatibilité: backend renvoie 'nom', frontend utilisait 'titre'
    const productName = product.nom || product.titre || 'Produit';
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
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

// Appliquer les filtres
function applyFilters() {
    catalogueFilters.category = document.getElementById('categoryFilter').value;
    catalogueFilters.vendorType = document.getElementById('vendorTypeFilter').value;
    catalogueFilters.location = document.getElementById('locationFilter').value;
    catalogueFilters.minPrice = document.getElementById('minPrice').value || null;
    catalogueFilters.maxPrice = document.getElementById('maxPrice').value || null;
    
    loadCatalogueProducts(true);
}

// Réinitialiser les filtres
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('vendorTypeFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = 'recent';
    
    catalogueFilters = {
        search: '',
        category: '',
        vendorType: '',
        location: '',
        minPrice: null,
        maxPrice: null,
        sort: 'recent'
    };
    
    loadCatalogueProducts(true);
}

// Appliquer le tri
function applySort() {
    catalogueFilters.sort = document.getElementById('sortSelect').value;
    loadCatalogueProducts(true);
}

// Recherche
function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    catalogueFilters.search = query;
    loadCatalogueProducts(true);
}

// Recherche sur Enter
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});

// Mettre à jour le compteur de résultats
function updateResultsCount(count) {
    const elem = document.getElementById('resultsCount');
    if (elem) {
        elem.textContent = `${count} produit${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
    }
}

// Scroll infini
function setupCatalogueScroll() {
    window.addEventListener('scroll', () => {
        if (isLoadingCatalogue || !hasMoreCatalogue) return;
        
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            loadMoreCatalogue();
        }
    });
}

function loadMoreCatalogue() {
    if (!hasMoreCatalogue || isLoadingCatalogue) return;
    loadCatalogueProducts(false);
}

function updateLoadMoreCatalogueButton(loading) {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;
    
    if (loading) {
        btn.disabled = true;
        btn.textContent = 'Chargement...';
    } else if (!hasMoreCatalogue) {
        btn.disabled = true;
        btn.textContent = 'Tous les produits chargés';
    } else {
        btn.disabled = false;
        btn.textContent = 'Voir Plus de Produits';
    }
}
