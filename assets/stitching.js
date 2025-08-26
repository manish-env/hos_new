(function(){
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }

  ready(function(){
    var sectionEls = document.querySelectorAll('[id^="StitchingServices-"]');
    if(!sectionEls.length) return;

    sectionEls.forEach(function(root){
      var productInfo = root.closest('[id^="ProductInfo-"]');
      var form = productInfo && productInfo.querySelector('form[action^="/cart/add"]');
      var priceEl = root.querySelector('[data-stitching-price]');
      var radios = root.querySelectorAll('input[type="radio"][name^="properties[Service]"]');
      var standardPanel = root.querySelector('[data-panel="standard"]');
      var customPanel = root.querySelector('[data-panel="custom"]');
      var standardVariantId = parseInt(root.getAttribute('data-standard-variant-id')||'0',10);
      var standardPrice = parseInt(root.getAttribute('data-standard-price-cents')||'0',10);
      var customVariantId = parseInt(root.getAttribute('data-custom-variant-id')||'0',10);
      var customPrice = parseInt(root.getAttribute('data-custom-price-cents')||'0',10);
      var cartBehavior = root.getAttribute('data-cart-behavior')||'drawer';

      function money(cents){
        try { return Shopify.formatMoney(cents, window.shopMoneyFormat || Shopify.money_format || "${{amount}}" ); } catch(e){ return (cents/100).toFixed(2); }
      }

      function currentVariantPrice(){
        if(!form) return 0;
        var idInput = form.querySelector('input[name="id"]');
        if(!idInput) return 0;
        var priceFromDom = productInfo && productInfo.querySelector('#price-'+productInfo.id.split('-').pop()+' [data-price]');
        return 0; // we only need service price display here; Dawn handles base price UI
      }

      function selectedService(){
        var r = root.querySelector('input[type="radio"][name^="properties[Service]"]:checked');
        if(!r) return {key:'Unstitched', variantId:0, price:0};
        var val = r.value;
        if(r.getAttribute('data-service') === 'standard') return {key:val, variantId: standardVariantId, price: standardPrice};
        if(r.getAttribute('data-service') === 'custom') return {key:val, variantId: customVariantId, price: customPrice};
        return {key:val, variantId:0, price:0};
      }

      function showPanels(){
        var r = root.querySelector('input[type="radio"][name^="properties[Service]"]:checked');
        var type = r && r.getAttribute('data-service');
        if(standardPanel) standardPanel.hidden = type !== 'standard';
        if(customPanel) customPanel.hidden = type !== 'custom';
      }

      function updateServicePrice(){
        var s = selectedService();
        if(priceEl) priceEl.textContent = money(s.price);
      }

      function ensureValid(){
        var s = selectedService();
        if(s.variantId === standardVariantId && standardPanel){
          var sel = standardPanel.querySelector('select');
          if(sel && !sel.value){ return false; }
        }
        if(s.variantId === customVariantId && customPanel){
          var required = customPanel.querySelectorAll('input');
          for(var i=0;i<required.length;i++){ if(!required[i].value){ return false; } }
        }
        return true;
      }

      function addWithService(e){
        if(!form) return;
        var s = selectedService();
        if(!s.variantId){ return; }
        // prevent default submit, add two items
        e.preventDefault();
        if(!ensureValid()){ alert('Please complete stitching details.'); return; }
        var qtyInput = form.querySelector('input[name="quantity"]');
        var qty = qtyInput ? parseInt(qtyInput.value||'1',10) : 1;
        var mainId = parseInt(form.querySelector('input[name="id"]').value,10);

        var items = [
          { id: mainId, quantity: qty },
          { id: s.variantId, quantity: qty }
        ];

        // Use properties on main line item already bound via inputs in the DOM
        fetch('/cart/add.js', {
          method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ items: items })
        })
        .then(function(r){ return r.json(); })
        .then(function(){
          if(cartBehavior === 'redirect') { window.location.href = '/cart'; return; }
          // Try to open Dawn cart drawer/notification
          var drawer = document.querySelector('cart-drawer');
          if(drawer && drawer.open){ drawer.open(); }
          var notifier = document.querySelector('cart-notification');
          if(notifier && notifier.renderContents){ notifier.renderContents(); }
          // Dispatch a custom event so Dawn updates
          document.body.dispatchEvent(new CustomEvent('cart:update'));
        })
        .catch(function(){ form.submit(); });
      }

      radios.forEach(function(r){ r.addEventListener('change', function(){ showPanels(); updateServicePrice(); }); });
      showPanels();
      updateServicePrice();

      if(form){
        form.addEventListener('submit', function(e){ addWithService(e); });
      }
    });
  });
})();
