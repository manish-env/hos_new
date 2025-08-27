(function(){
  'use strict';

  var STORAGE_KEY = 'hos_wishlist';
  var toastEl = null;
  var toastTimer = null;

  function safeParse(json, fallback){
    try { return JSON.parse(json); } catch(_e) { return fallback; }
  }

  function getStore(){
    try {
      if (!('localStorage' in window)) return null;
      // Test availability (Safari private mode, etc.)
      var testKey = '__wl_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return window.localStorage;
    } catch(_e){
      return null;
    }
  }

  var store = getStore();

  // Wishlist store structure: { [productId: string]: { id, title, url, image, price, currency, handle } }
  function getWishlist(){
    if (!store) return {};
    var raw = store.getItem(STORAGE_KEY);
    var obj = safeParse(raw, {});
    return (obj && typeof obj === 'object') ? obj : {};
  }

  function saveWishlist(obj){
    if (!store) return;
    try { store.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch(_e) {}
  }

  function hasInWishlist(obj, id){
    id = String(id);
    return !!(obj && Object.prototype.hasOwnProperty.call(obj, id));
  }

  function addToWishlist(obj, product){
    if (!product || !product.id) return obj;
    var id = String(product.id);
    var next = Object.assign({}, obj);
    next[id] = product;
    return next;
  }

  function removeFromWishlist(obj, id){
    id = String(id);
    if (!obj || !Object.prototype.hasOwnProperty.call(obj, id)) return obj || {};
    var next = Object.assign({}, obj);
    delete next[id];
    return next;
  }

  function updateHeaderIcon(hasAny){
    try {
      var link = document.querySelector('.header__icon--heart');
      if (!link) return;
      var icon = link.querySelector('i');
      if (!icon) return;
      icon.classList.toggle('fa-solid', !!hasAny);
      icon.classList.toggle('fa-regular', !hasAny);
      link.classList.toggle('active', !!hasAny);
      link.setAttribute('aria-label', hasAny ? 'Wishlist (items saved)' : 'Wishlist');
      link.title = hasAny ? 'Wishlist (items saved)' : 'Wishlist';
    } catch(_e) {}
  }

  function setBtnState(btn, active){
    try {
      btn.classList.toggle('active', !!active);
      btn.setAttribute('aria-pressed', !!active);
      var icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-solid', !!active);
        icon.classList.toggle('fa-regular', !active);
      }
      // Also support SVG-based heart wrapper
      var svgWrap = btn.querySelector('.wishlist-svg');
      if (svgWrap) {
        svgWrap.classList.toggle('is-active', !!active);
      }
    } catch(_e) {}
  }

  function ensureToast(){
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.style.position = 'fixed';
    toastEl.style.left = '50%';
    toastEl.style.bottom = '24px';
    toastEl.style.transform = 'translateX(-50%)';
    toastEl.style.zIndex = '2147483647';
    toastEl.style.background = 'rgba(0,0,0,0.85)';
    toastEl.style.color = '#fff';
    toastEl.style.padding = '10px 14px';
    toastEl.style.borderRadius = '8px';
    toastEl.style.fontSize = '14px';
    toastEl.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)';
    toastEl.style.opacity = '0';
    toastEl.style.pointerEvents = 'none';
    toastEl.style.transition = 'opacity 200ms ease';
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(message){
    try {
      var el = ensureToast();
      el.textContent = message;
      el.style.opacity = '1';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function(){
        el.style.opacity = '0';
      }, 1600);
    } catch(_e) {}
  }

  function initButtonsFromStore(){
    var storeObj = getWishlist();
    var buttons = document.querySelectorAll('.product__wishlist-btn[data-product-id]');
    buttons.forEach(function(btn){
      var id = btn.getAttribute('data-product-id');
      var active = id && hasInWishlist(storeObj, id);
      setBtnState(btn, active);
    });
    updateHeaderIcon(Object.keys(storeObj).length > 0);
  }

  // Persist when any wishlist button toggles (snippet dispatches this event already)
  document.addEventListener('wishlist:toggle', function(e){
    try {
      var detail = e && e.detail || {};
      var id = detail.productId != null ? String(detail.productId) : null;
      if (!id) return;
      var btn = (e.target && e.target.closest) ? e.target.closest('.product__wishlist-btn[data-product-id]') : null;
      // Defer to ensure the inline script's class toggles are applied
      setTimeout(function(){
        try {
          // If storage is not available, inform user and just sync UI (non-persistent)
          if (!store) {
            setBtnState(btn || { classList: { contains: function(){ return !!(detail && detail.active); } }, setAttribute: function(){} }, !!(detail && detail.active));
            showToast('Wishlist is unavailable in this browser (storage disabled)');
            return;
          }
          var obj = getWishlist();
          var isActive = !!(btn && btn.classList.contains('active'));
          if (isActive) {
            var product = {
              id: id,
              title: (btn && btn.getAttribute('data-product-title')) || '',
              handle: (btn && btn.getAttribute('data-product-handle')) || '',
              url: (btn && btn.getAttribute('data-product-url')) || '',
              image: (btn && btn.getAttribute('data-product-image')) || '',
              price: (btn && parseInt(btn.getAttribute('data-product-price') || '0', 10)) || 0,
              currency: (btn && btn.getAttribute('data-product-currency')) || (window.Shopify && Shopify.currency && Shopify.currency.active) || ''
            };
            obj = addToWishlist(obj, product);
            saveWishlist(obj);
            updateHeaderIcon(true);
            showToast('Added to wishlist');
          } else {
            obj = removeFromWishlist(obj, id);
            saveWishlist(obj);
            updateHeaderIcon(Object.keys(obj).length > 0);
            showToast('Removed from wishlist');
          }
        } catch(_e) {}
      }, 0);
    } catch(_e) {}
  }, true);

  // If product cards elsewhere reuse same class, keep them in sync on click too
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('.product__wishlist-btn[data-product-id]');
    if (!btn) return;
    // Defer to snippet handler to toggle UI, we only sync other instances on the page
    setTimeout(function(){
      try {
        var id = String(btn.getAttribute('data-product-id'));
        var active = btn.classList.contains('active');
        // Ensure aria-pressed is updated on the clicked button as well
        setBtnState(btn, active);
        // Sync all other buttons for same product id
        document.querySelectorAll('.product__wishlist-btn[data-product-id="' + CSS.escape(id) + '"]').forEach(function(other){
          if (other === btn) return;
          setBtnState(other, active);
        });
      } catch(_e) {}
    }, 0);
  });

  // Initialize on DOM ready
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initButtonsFromStore);
  } else {
    initButtonsFromStore();
  }

  // Expose minimal API for debugging
  window.Wishlist = window.Wishlist || {
    get: function(){ return getWishlist(); },
    clear: function(){ saveWishlist({}); updateHeaderIcon(false); initButtonsFromStore(); },
    has: function(id){ return hasInWishlist(getWishlist(), id); }
  };
})();
