(function(){
  'use strict';

  var STORAGE_KEY = 'hos_wishlist';

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

  function getWishlist(){
    if (!store) return new Set();
    var raw = store.getItem(STORAGE_KEY);
    var arr = Array.isArray(raw) ? raw : safeParse(raw, []);
    if (!Array.isArray(arr)) arr = [];
    return new Set(arr.map(String));
  }

  function saveWishlist(set){
    if (!store) return;
    try {
      var arr = Array.from(set);
      store.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch(_e) {}
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
      var icon = btn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-solid', !!active);
        icon.classList.toggle('fa-regular', !active);
      }
    } catch(_e) {}
  }

  function initButtonsFromStore(){
    var set = getWishlist();
    var buttons = document.querySelectorAll('.product__wishlist-btn[data-product-id]');
    buttons.forEach(function(btn){
      var id = btn.getAttribute('data-product-id');
      var active = id && set.has(String(id));
      setBtnState(btn, active);
    });
    updateHeaderIcon(set.size > 0);
  }

  // Persist when any wishlist button toggles (snippet dispatches this event already)
  document.addEventListener('wishlist:toggle', function(e){
    try {
      var detail = e && e.detail || {};
      var id = detail.productId != null ? String(detail.productId) : null;
      if (!id) return;
      var set = getWishlist();
      if (detail.active) set.add(id); else set.delete(id);
      saveWishlist(set);
      updateHeaderIcon(set.size > 0);
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
    get: function(){ return Array.from(getWishlist()); },
    clear: function(){ var s = getWishlist(); s.clear(); saveWishlist(s); updateHeaderIcon(false); },
    has: function(id){ return getWishlist().has(String(id)); }
  };
})();
