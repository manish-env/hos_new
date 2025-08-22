/**
 * Mobile Sticky Buy Bar
 * 
 * This script handles the functionality of the sticky buy bar for mobile devices.
 * It shows the bar when the original buy buttons are scrolled out of view.
 */

class MobileStickyBuyBar {
  constructor() {
    this.buyBar = document.querySelector('.mobile-sticky-buy-bar');
    if (!this.buyBar) return;

    this.lastScrollTop = 0;
    this.footer = document.querySelector('footer');
    this.mainProductSection = document.querySelector('[id^="MainProduct-"]');
    this.originalBuyButtons = document.querySelector('.product-form__buttons');
    
    this.init();
  }

  init() {
    // Only initialize on mobile devices
    if (window.innerWidth > 749) return;

    // Add class to main product section for padding
    if (this.mainProductSection) {
      this.mainProductSection.classList.add('has-sticky-buy-bar');
    }

    // Hide the bar initially
    this.buyBar.classList.remove('visible');

    // Handle scroll events
    window.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Handle variant changes to update the mobile sticky bar
    document.addEventListener('variant:change', this.handleVariantChange.bind(this));
    
    // Initial check
    this.handleScroll();
  }

  handleScroll() {
    // Only run on mobile
    if (window.innerWidth > 749) return;
    
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
    
    const mobileVariantInput = document.querySelector('#MobileSticky-product-form .product-variant-id');
    const mobileAddButton = document.querySelector('#MobileStickySubmitButton-' + this.buyBar.id.split('-').pop());
    const mobileBuyNowButton = document.querySelector('#mobile-buy-now');
    
    if (mobileVariantInput) {
      mobileVariantInput.value = event.detail.variant.id;
      mobileVariantInput.disabled = !event.detail.variant.available;
    }
    
    if (mobileAddButton) {
      const addButtonText = mobileAddButton.querySelector('span');
      if (addButtonText) {
        if (!event.detail.variant.available) {
          addButtonText.textContent = window.variantStrings ? window.variantStrings.soldOut : 'Sold out';
          mobileAddButton.disabled = true;
        } else {
          addButtonText.textContent = window.variantStrings ? window.variantStrings.addToCart : 'Add to bag';
          mobileAddButton.disabled = false;
        }
      }
    }
    
    if (mobileBuyNowButton) {
      if (!event.detail.variant.available) {
        mobileBuyNowButton.classList.add('disabled');
        mobileBuyNowButton.disabled = true;
      } else {
        mobileBuyNowButton.classList.remove('disabled');
        mobileBuyNowButton.disabled = false;
      }
    }
    
    // Update price in mobile sticky bar
    const priceContainer = this.buyBar.querySelector('.mobile-sticky-price');
    if (priceContainer) {
      const mainPriceContainer = document.querySelector('#price-' + this.buyBar.id.split('-').pop());
      if (mainPriceContainer) {
        priceContainer.innerHTML = mainPriceContainer.innerHTML;
      }
    }
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  new MobileStickyBuyBar();
});
