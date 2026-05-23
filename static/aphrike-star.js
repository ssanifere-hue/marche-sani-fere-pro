// 🌍⭐ APHRIKE JULA - Système d'étoile dorée automatique
(function() {
    'use strict';
    
    console.log('🌍⭐ APHRIKE JULA - Initialisation...');
    
    // Remplacer l'emoji étoile par carte Afrique + étoile dorée
    function updateBrandIcon() {
        const navbar = document.querySelector('.aj-navbar');
        if (navbar) {
            navbar.innerHTML = navbar.innerHTML.replace('⭐', '🌍⭐');
            console.log('✅ Icône mise à jour');
        }
    }
    
    // Ajouter badges PREMIUM sur produits
    function addPremiumBadges() {
        const produits = document.querySelectorAll('[data-premium="true"]');
        produits.forEach(produit => {
            if (!produit.querySelector('.badge-premium')) {
                const badge = document.createElement('span');
                badge.className = 'badge-premium';
                badge.innerHTML = '⭐ PREMIUM';
                badge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: linear-gradient(45deg, #FFD700, #FFA500);
                    color: #000;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.8em;
                    box-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
                    animation: sparkle 2s infinite;
                `;
                produit.style.position = 'relative';
                produit.appendChild(badge);
            }
        });
    }
    
    // Injecter les animations CSS
    function injectStyles() {
        if (!document.getElementById('aphrike-star-styles')) {
            const style = document.createElement('style');
            style.id = 'aphrike-star-styles';
            style.textContent = `
                @keyframes sparkle {
                    0%, 100% { transform: scale(1); box-shadow: 0 2px 10px rgba(255, 215, 0, 0.5); }
                    50% { transform: scale(1.05); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.8); }
                }
                
                .aj-navbar:hover {
                    transform: scale(1.05);
                    transition: transform 0.3s;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Styles injectés');
        }
    }
    
    // Initialisation
    function init() {
        injectStyles();
        updateBrandIcon();
        addPremiumBadges();
        
        // Observer pour les changements dynamiques
        const observer = new MutationObserver(() => {
            updateBrandIcon();
            addPremiumBadges();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('🎉 APHRIKE JULA - Prêt !');
    }
    
    // Lancer quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
