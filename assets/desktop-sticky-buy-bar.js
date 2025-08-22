/**
 * Desktop Sticky Buy Bar
 * 
 * This script handles the functionality of the sticky buy bar for desktop view.
 * It shows the bar when the original buy buttons are scrolled out of view.
 */

class DesktopStickyBuyBar {
  constructor() {
    this.buyBar = document.querySelector('.desktop-sticky-buy-bar');
    if (!this.buyBar) return;

    this.lastScrollTop = 0;
    this.footer = document.querySelector('footer');
    this.mainProductSection = document.querySelector('[id^="MainProduct-"]');
    this.originalBuyButtons = document.querySelector('.product-form__buttons');
    this.originalQuantityInput = document.querySelector('.product-form__quantity .quantity__input');
    this.stickyQuantityInput = document.querySelector('.desktop-sticky-buy-bar__quantity .quantity__input');
    
    this.init();
  }

  init() {
    // Only initialize on desktop devices
    if (window.innerWidth < 750) return;

    // Add class to main product section for padding
    if (this.mainProductSection) {
      this.mainProductSection.classList.add('has-desktop-sticky-buy-bar');
    }

    // Hide the bar initially
    this.buyBar.classList.remove('visible');

    // Handle scroll events
    window.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Handle variant changes to update the desktop sticky bar
    document.addEventListener('variant:change', this.handleVariantChange.bind(this));
    
    // Handle quantity changes in both directions
    this.setupQuantitySyncEvents();
    
    // Initial check
    this.handleScroll();
  }

  setupQuantitySyncEvents() {
    // Sync from main form to sticky bar
    if (this.originalQuantityInput && this.stickyQuantityInput) {
      this.originalQuantityInput.addEventListener('change', (e) => {
        this.stickyQuantityInput.value = e.target.value;
      });
      
      // Sync from sticky bar to main form
      this.stickyQuantityInput.addEventListener('change', (e) => {
        this.originalQuantityInput.value = e.target.value;
        // Trigger change event on original input to update any dependent logic
        const event = new Event('change', { bubbles: true });
        this.originalQuantityInput.dispatchEvent(event);
      });
      
      // Set initial value
      this.stickyQuantityInput.value = this.originalQuantityInput.value;
    }
    
    // Handle quantity buttons in sticky bar
    const minusButton = this.buyBar.querySelector('.quantity__button[name="minus"]');
    const plusButton = this.buyBar.querySelector('.quantity__button[name="plus"]');
    
    if (minusButton && this.stickyQuantityInput) {
      minusButton.addEventListener('click', () => {
        const currentValue = parseInt(this.stickyQuantityInput.value);
        if (currentValue > 1) {
          this.stickyQuantityInput.value = currentValue - 1;
          // Sync with main form
          if (this.originalQuantityInput) {
            this.originalQuantityInput.value = this.stickyQuantityInput.value;
            const event = new Event('change', { bubbles: true });
            this.originalQuantityInput.dispatchEvent(event);
          }
        }
      });
    }
    
    if (plusButton && this.stickyQuantityInput) {
      plusButton.addEventListener('click', () => {
        const currentValue = parseInt(this.stickyQuantityInput.value);
        this.stickyQuantityInput.value = currentValue + 1;
        // Sync with main form
        if (this.originalQuantityInput) {
          this.originalQuantityInput.value = this.stickyQuantityInput.value;
          const event = new Event('change', { bubbles: true });
          this.originalQuantityInput.dispatchEvent(event);
        }
      });
    }
  }

  handleScroll() {
    // Only run on desktop
    if (window.innerWidth < 750) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if original buy buttons are visible
    if (this.originalBuyButtons) {
      const buttonRect = this.originalBuyButtons.getBoundingClientRect();
      
      // Show sticky bar when original buttons are out of view
      if (buttonRect.bottom < 0 || buttonRect.top > window.innerHeight) {
        this.buyBar.classList.add('visible');
      } else {
        this.buyBar.classList.remove('visible');
      }
    }
    
    // Always remove the hidden class - never hide at footer
    this.buyBar.classList.remove('hidden');
    
    this.lastScrollTop = scrollTop;
  }

  handleVariantChange(event) {
    if (!event.detail.variant) return;
    
    const desktopVariantInput = document.querySelector('#DesktopSticky-product-form .product-variant-id');
    const desktopAddButton = document.querySelector('#DesktopStickySubmitButton-' + this.buyBar.id.split('-').pop());
    const desktopBuyNowButton = document.querySelector('#desktop-buy-now');
    
    if (desktopVariantInput) {
      desktopVariantInput.value = event.detail.variant.id;
      desktopVariantInput.disabled = !event.detail.variant.available;
    }
    
    if (desktopAddButton) {
      const addButtonText = desktopAddButton.querySelector('span');
      if (addButtonText) {
        if (!event.detail.variant.available) {
          addButtonText.textContent = window.variantStrings ? window.variantStrings.soldOut : 'Sold out';
          desktopAddButton.disabled = true;
        } else {
          addButtonText.textContent = window.variantStrings ? window.variantStrings.addToCart : 'Add to bag';
          desktopAddButton.disabled = false;
        }
      }
    }
    
    if (desktopBuyNowButton) {
      if (!event.detail.variant.available) {
        desktopBuyNowButton.classList.add('disabled');
        desktopBuyNowButton.disabled = true;
      } else {
        desktopBuyNowButton.classList.remove('disabled');
        desktopBuyNowButton.disabled = false;
      }
    }
    
    // Update price in desktop sticky bar
    const priceContainer = this.buyBar.querySelector('.desktop-sticky-price');
    if (priceContainer) {
      const mainPriceContainer = document.querySelector('#price-' + this.buyBar.id.split('-').pop());
      if (mainPriceContainer) {
        priceContainer.innerHTML = mainPriceContainer.innerHTML;
      }
    }
    
    // Update product image in sticky bar
    const imageContainer = this.buyBar.querySelector('.desktop-sticky-buy-bar__image img');
    if (imageContainer && event.detail.variant.featured_image) {
      const newSrc = event.detail.variant.featured_image.src.replace(/(\.[^.]*)$/, '_100x$1');
      imageContainer.src = newSrc;
      imageContainer.alt = event.detail.variant.featured_image.alt || '';
    }
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  new DesktopStickyBuyBar();
});
