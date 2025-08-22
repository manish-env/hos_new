/**
 * Cart API
 * 
 * This script provides methods for interacting with the Shopify cart API
 * to add, update, and remove items without page reloads.
 */

class CartAPI {
  constructor() {
    this.cartDrawer = document.querySelector('cart-drawer');
    this.cartIconBubble = document.querySelector('.header__icon--cart .cart-count-bubble');
    this.cartCount = document.querySelector('.cart-count-bubble span[aria-hidden="true"]');
    this.events = {};
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  trigger(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get the current cart state
   * @returns {Promise} - Promise resolving to cart data
   */
  getCart() {
    return fetch('/cart.js')
      .then(response => response.json())
      .catch(error => console.error('Error fetching cart:', error));
  }

  /**
   * Add an item to the cart
   * @param {FormData|Object} data - Form data or object with item details
   * @returns {Promise} - Promise resolving to updated cart data
   */
  addToCart(data) {
    let fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data instanceof FormData) {
      const formEntries = Array.from(data.entries());
      const formObject = formEntries.reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
      
      fetchOptions.body = JSON.stringify({
        items: [{
          id: formObject.id,
          quantity: formObject.quantity || 1,
          properties: formObject.properties || {}
        }]
      });
    } else {
      fetchOptions.body = JSON.stringify({
        items: [data]
      });
    }

    return fetch('/cart/add.js', fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.trigger('item-added', data);
        return this.getCart();
      })
      .then(cart => {
        this.updateCartUI(cart);
        return cart;
      })
      .catch(error => {
        console.error('Error adding item to cart:', error);
        this.trigger('error', error);
      });
  }

  /**
   * Update the cart UI elements
   * @param {Object} cart - Cart data
   */
  updateCartUI(cart) {
    // Update cart count
    if (this.cartCount) {
      this.cartCount.textContent = cart.item_count;
    }

    // Show/hide cart bubble
    if (this.cartIconBubble) {
      if (cart.item_count > 0) {
        this.cartIconBubble.classList.remove('hidden');
      } else {
        this.cartIconBubble.classList.add('hidden');
      }
    }

    // Open cart drawer if it exists
    if (this.cartDrawer) {
      this.cartDrawer.open();
    }
  }

  /**
   * Update an item in the cart
   * @param {string} id - Line item ID
   * @param {number} quantity - New quantity
   * @returns {Promise} - Promise resolving to updated cart data
   */
  updateItem(id, quantity) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: id,
        quantity: quantity
      })
    })
      .then(response => response.json())
      .then(cart => {
        this.updateCartUI(cart);
        this.trigger('cart-updated', cart);
        return cart;
      })
      .catch(error => {
        console.error('Error updating item:', error);
        this.trigger('error', error);
      });
  }

  /**
   * Remove an item from the cart
   * @param {string} id - Line item ID
   * @returns {Promise} - Promise resolving to updated cart data
   */
  removeItem(id) {
    return this.updateItem(id, 0);
  }

  /**
   * Clear the cart
   * @returns {Promise} - Promise resolving to empty cart data
   */
  clearCart() {
    return fetch('/cart/clear.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .then(response => response.json())
      .then(cart => {
        this.updateCartUI(cart);
        this.trigger('cart-cleared', cart);
        return cart;
      })
      .catch(error => {
        console.error('Error clearing cart:', error);
        this.trigger('error', error);
      });
  }
}

// Create a global instance of the cart API
window.cartAPI = new CartAPI();
