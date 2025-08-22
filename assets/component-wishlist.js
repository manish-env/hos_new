/**
 * Custom Wishlist Component
 * Integrates with Wishlist Hero app and provides enhanced wishlist functionality
 */
class CustomWishlist {
  constructor() {
    this.wishlistItems = [];
    this.currentFilter = 'all';
    this.init();
  }
  
  async init() {
    await this.loadWishlist();
    this.bindEvents();
    this.renderWishlist();
  }
  
  async loadWishlist() {
    try {
      // Wait for Wishlist Hero to be ready
      await this.waitForWishlistHero();
      
      // Get wishlist items from Wishlist Hero
      if (window.wishlistHero && window.wishlistHero.getWishlistItems) {
        this.wishlistItems = await window.wishlistHero.getWishlistItems();
      } else {
        // Fallback: try to get from localStorage or other methods
        this.wishlistItems = this.getWishlistFromStorage();
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      this.wishlistItems = [];
    }
  }
  
  waitForWishlistHero() {
    return new Promise((resolve) => {
      if (window.wishlistHero) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (window.wishlistHero) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      }
    });
  }
  
  getWishlistFromStorage() {
    try {
      const stored = localStorage.getItem('wishlist-hero-items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  bindEvents() {
    // Filter buttons
    document.querySelectorAll('.wishlist-filter-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.setActiveFilter(e.target.dataset.filter);
      });
    });
    
    // Listen for wishlist updates
    document.addEventListener('wishlist:updated', () => {
      this.loadWishlist().then(() => {
        this.renderWishlist();
      });
    });
    
    // Listen for custom wishlist events
    document.addEventListener('wishlist:item-added', () => {
      this.loadWishlist().then(() => {
        this.renderWishlist();
      });
    });
    
    document.addEventListener('wishlist:item-removed', () => {
      this.loadWishlist().then(() => {
        this.renderWishlist();
      });
    });
  }
  
  setActiveFilter(filter) {
    this.currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.wishlist-filter-button').forEach(button => {
      button.classList.toggle('active', button.dataset.filter === filter);
    });
    
    this.renderWishlist();
  }
  
  getFilteredItems() {
    if (this.currentFilter === 'all') {
      return this.wishlistItems;
    } else if (this.currentFilter === 'available') {
      return this.wishlistItems.filter(item => item.available !== false);
    } else if (this.currentFilter === 'sale') {
      return this.wishlistItems.filter(item => item.compare_at_price && item.compare_at_price > item.price);
    }
    return this.wishlistItems;
  }
  
  async renderWishlist() {
    const loadingEl = document.getElementById('wishlist-loading');
    const emptyEl = document.getElementById('wishlist-empty');
    const gridEl = document.getElementById('wishlist-grid');
    
    if (!loadingEl || !emptyEl || !gridEl) {
      console.error('Wishlist elements not found');
      return;
    }
    
    const filteredItems = this.getFilteredItems();
    
    // Hide loading
    loadingEl.style.display = 'none';
    
    if (filteredItems.length === 0) {
      emptyEl.style.display = 'block';
      gridEl.style.display = 'none';
      return;
    }
    
    emptyEl.style.display = 'none';
    gridEl.style.display = 'grid';
    
    // Render wishlist items
    gridEl.innerHTML = filteredItems.map(item => this.renderWishlistItem(item)).join('');
    
    // Bind item events
    this.bindItemEvents();
  }
  
  renderWishlistItem(item) {
    const saleBadge = item.compare_at_price && item.compare_at_price > item.price 
      ? `<div class="wishlist-item-badge">Sale</div>` 
      : '';
    
    const price = this.formatPrice(item.price);
    const comparePrice = item.compare_at_price ? this.formatPrice(item.compare_at_price) : '';
    
    const priceHtml = comparePrice 
      ? `<div class="wishlist-item-price">
           <span class="price-item--sale">${price}</span>
           <span class="price-item--regular">${comparePrice}</span>
         </div>`
      : `<div class="wishlist-item-price">${price}</div>`;
    
    return `
      <div class="wishlist-item" data-product-id="${item.id}">
        <div class="wishlist-item-image">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
          ${saleBadge}
          <button class="wishlist-item-remove" data-product-id="${item.id}" title="Remove from wishlist">
            ×
          </button>
        </div>
        <div class="wishlist-item-content">
          <h3 class="wishlist-item-title">
            <a href="${item.url}" style="color: inherit; text-decoration: none;">${item.title}</a>
          </h3>
          ${priceHtml}
          <div class="wishlist-item-actions">
            <button class="wishlist-item-add-to-cart" 
                    data-product-id="${item.id}" 
                    data-variant-id="${item.variant_id}"
                    ${!item.available ? 'disabled' : ''}>
              ${item.available ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <a href="${item.url}" class="wishlist-item-view">View</a>
          </div>
        </div>
      </div>
    `;
  }
  
  bindItemEvents() {
    // Remove from wishlist
    document.querySelectorAll('.wishlist-item-remove').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.removeFromWishlist(productId);
      });
    });
    
    // Add to cart
    document.querySelectorAll('.wishlist-item-add-to-cart').forEach(button => {
      button.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        const variantId = e.target.dataset.variantId;
        this.addToCart(productId, variantId);
      });
    });
  }
  
  async removeFromWishlist(productId) {
    try {
      if (window.wishlistHero && window.wishlistHero.removeFromWishlist) {
        await window.wishlistHero.removeFromWishlist(productId);
      }
      
      // Remove from local array
      this.wishlistItems = this.wishlistItems.filter(item => item.id != productId);
      
      // Re-render
      this.renderWishlist();
      
      // Show success message
      this.showMessage('Product removed from wishlist', 'success');
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('wishlist:item-removed', {
        detail: { productId }
      }));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      this.showMessage('Error removing product from wishlist', 'error');
    }
  }
  
  async addToCart(productId, variantId) {
    try {
      const formData = {
        items: [{
          id: variantId,
          quantity: 1
        }]
      };
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        this.showMessage('Product added to cart!', 'success');
        
        // Trigger cart update
        document.documentElement.dispatchEvent(new CustomEvent('cart:refresh'));
        
        // Update cart count if available
        if (window.updateCartCount) {
          window.updateCartCount();
        }
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showMessage('Error adding product to cart', 'error');
    }
  }
  
  formatPrice(price) {
    // Get currency from Shopify settings or use default
    const currency = window.Shopify?.currency?.active || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  }
  
  showMessage(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.wishlist-toast').forEach(toast => {
      document.body.removeChild(toast);
    });
    
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `wishlist-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  // Public methods for external use
  refresh() {
    return this.loadWishlist().then(() => {
      this.renderWishlist();
    });
  }
  
  getItemCount() {
    return this.wishlistItems.length;
  }
  
  hasItem(productId) {
    return this.wishlistItems.some(item => item.id == productId);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a wishlist page
  if (document.querySelector('.wishlist-section')) {
    window.customWishlist = new CustomWishlist();
  }
});

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomWishlist;
}
