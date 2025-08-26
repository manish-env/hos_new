(function(){
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  function formatMoney(cents){
    try { return Shopify.formatMoney(cents, window.shopMoneyFormat || Shopify.money_format || "${{amount}}" ); }
    catch(e){ return (cents/100).toFixed(2); }
  }

  function fetchAndRenderCartUI(addResponse){
    // Determine which UI is present
    var drawer = document.querySelector('cart-drawer');
    var notif = document.querySelector('cart-notification');
    var sections = [];
    if(drawer){ sections = ['cart-drawer','cart-icon-bubble']; }
    else if(notif){ sections = ['cart-notification-product','cart-notification-button','cart-icon-bubble']; }
    else { return Promise.resolve(); }

    var url = window.location.pathname + '?sections=' + encodeURIComponent(sections.join(','));
    return fetch(url)
      .then(function(r){ return r.json(); })
      .then(function(data){
        // Build parsedState similar to Dawn
        var firstItem = (addResponse && addResponse.items && addResponse.items[0]) || null;
        var parsedState = { sections: data };
        if(firstItem){
          parsedState.key = firstItem.key;
          parsedState.id = firstItem.product_id || firstItem.id;
        }
        if(drawer && drawer.renderContents){ drawer.renderContents(parsedState); }
        if(!drawer && notif && notif.renderContents){ notif.renderContents(parsedState); }
      })
      .catch(function(){ /* noop */ });
  }

  ready(function(){
    var sections = document.querySelectorAll('[id^="StitchingServices-"]');
    if(!sections.length) return;

    sections.forEach(function(root){
      var priceEl = root.querySelector('[data-stitching-price]');
      var radios = root.querySelectorAll('input[type="radio"][name^="properties[Service]"]');
      var standardPanel = root.querySelector('[data-panel="standard"]');
      var customPanel = root.querySelector('[data-panel="custom"]');
      var standardVariantId = parseInt(root.getAttribute('data-standard-variant-id')||'0',10);
      var standardPrice = parseInt(root.getAttribute('data-standard-price-cents')||'0',10);
      var customVariantId = parseInt(root.getAttribute('data-custom-variant-id')||'0',10);
      var customPrice = parseInt(root.getAttribute('data-custom-price-cents')||'0',10);
      var cartBehavior = root.getAttribute('data-cart-behavior')||'drawer';

      // New multi-service UI support
      var servicesRoot = root.querySelector('[data-services]');
      var serviceItems = servicesRoot ? Array.prototype.slice.call(servicesRoot.querySelectorAll('[data-service]')) : [];
      var isSubmitting = false;

      function selected(){
        var r = root.querySelector('input[type="radio"][name^="properties[Service]"]:checked');
        if(!r) return {label:'Unstitched', id:0, price:0, type:'unstitched'};
        var type = r.getAttribute('data-service');
        if(type==='standard') return {label:r.value, id:standardVariantId, price:standardPrice, type:'standard'};
        if(type==='custom') return {label:r.value, id:customVariantId, price:customPrice, type:'custom'};
        return {label:r.value, id:0, price:0, type:'unstitched'};
      }

      function togglePanels(){
        var s = selected();
        if(standardPanel) standardPanel.hidden = s.type!=='standard';
        if(customPanel) customPanel.hidden = s.type!=='custom';
      }

      function calcServicesTotal(){
        if(!servicesRoot) return 0;
        var total = 0;
        serviceItems.forEach(function(item){
          var enabled = item.querySelector('[data-service-enable]')?.checked;
          if(enabled){
            var cents = parseInt(item.getAttribute('data-price-cents')||'0',10);
            total += isNaN(cents) ? 0 : cents;
          }
        });
        return total;
      }

      function updatePrice(){
        if(!priceEl) return;
        // Prefer multi-services price if present; fallback to original single service price
        if(servicesRoot){ priceEl.textContent = formatMoney(calcServicesTotal()); return; }
        var s = selected(); priceEl.textContent = formatMoney(s.price);
      }

      function validate(){
        // Multi-service validation
        if(servicesRoot){
          for(var i=0;i<serviceItems.length;i++){
            var item = serviceItems[i];
            var enabled = item.querySelector('[data-service-enable]')?.checked;
            if(!enabled) continue;
            var type = item.getAttribute('data-service-type');
            if(type==='sizes' || type==='all'){
              var sizeSel = item.querySelector('[data-service-size]');
              if(sizeSel && !sizeSel.value){ sizeSel.focus(); return false; }
            }
            if(type==='input' || type==='all'){
              var inp = item.querySelector('[data-service-input]');
              if(inp && !inp.value){ inp.focus(); return false; }
            }
            if(type==='dropdown' || type==='all'){
              var dd = item.querySelector('[data-service-dropdown]');
              if(dd && !dd.value){ dd.focus(); return false; }
            }
          }
          return true;
        }
        // Legacy single-service validation
        var s = selected();
        if(s.type==='standard' && standardPanel){
          // Support either radio swatches or a fallback select
          var checkedRadio = standardPanel.querySelector('input.stitching-size__radio:checked');
          var sel = standardPanel.querySelector('select');
          var hasSize = !!(checkedRadio && checkedRadio.value) || !!(sel && sel.value);
          if(!hasSize){
            if(standardPanel.querySelector('input.stitching-size__radio')){
              // Focus first radio label for accessibility
              var firstLbl = standardPanel.querySelector('label.stitching-size__label');
              if(firstLbl) firstLbl.focus();
            } else if(sel) { sel.focus(); }
            return false;
          }
        }
        if(s.type==='custom' && customPanel){
          var inputs = customPanel.querySelectorAll('input');
          for(var i=0;i<inputs.length;i++){ if(!inputs[i].value){ inputs[i].focus(); return false; } }
        }
        return true;
      }

      function collectProperties(){
        // For multi-services, embed per-service details as properties
        if(servicesRoot){
          var props = {};
          serviceItems.forEach(function(item){
            var enabled = item.querySelector('[data-service-enable]')?.checked;
            if(!enabled) return;
            var title = item.getAttribute('data-service-title') || 'Service';
            props['Service - ' + title] = 'Yes';
            var sizeSel = item.querySelector('[data-service-size]');
            if(sizeSel && sizeSel.value) props[title + ' Size'] = sizeSel.value;
            var inp = item.querySelector('[data-service-input]');
            if(inp && inp.value) props[title + ' Note'] = inp.value;
            var dd = item.querySelector('[data-service-dropdown]');
            if(dd && dd.value) props[title + ' Option'] = dd.value;
          });
          return props;
        }
        // Legacy single-service properties
        var s = selected();
        var props = { 'Service': s.label };
        if(s.type==='standard' && standardPanel){
          var checkedRadio = standardPanel.querySelector('input.stitching-size__radio:checked');
          var sel = standardPanel.querySelector('select');
          var sizeVal = checkedRadio ? checkedRadio.value : (sel && sel.value ? sel.value : '');
          if(sizeVal) props['Service Size'] = sizeVal;
        }
        if(s.type==='custom' && customPanel){
          var inputs = customPanel.querySelectorAll('input');
          inputs.forEach(function(i){ if(i.name && i.value){ var key = i.name.replace(/^properties\[(.*)\]$/,'$1'); props[key] = i.value; } });
        }
        return props;
      }

      // Resolve the correct product form for this block
      function resolveProductForm(){
        // 1) Try radios' form attribute
        var anyRadio = root.querySelector('input[type="radio"][name^="properties[Service]"]');
        if(anyRadio){
          var formId = anyRadio.getAttribute('form');
          if(formId){
            var viaId = document.getElementById(formId);
            if(viaId) return viaId;
          }
        }
        // 2) Try nearest form within same section/container
        var nearestForm = root.closest('section, .product, .product__info-wrapper')?.querySelector('form[action^="/cart/add"]');
        if(nearestForm) return nearestForm;
        // 3) Fallback: first add-to-cart form on page
        return document.querySelector('form[action^="/cart/add"]');
      }

      var productForm = resolveProductForm();
      if(!productForm) return;

      // Change handlers
      radios.forEach(function(r){ r.addEventListener('change', function(){ togglePanels(); updatePrice(); }); });
      if(servicesRoot){
        // Toggle show/hide controls per service
        serviceItems.forEach(function(item){
          var checkbox = item.querySelector('[data-service-enable]');
          var controls = item.querySelector('.service-controls');
          if(checkbox){ checkbox.addEventListener('change', function(){ if(controls) controls.hidden = !checkbox.checked; updatePrice(); }); }
          // Inputs also update price (not necessary for now but future-proof)
          item.addEventListener('change', updatePrice);
        });
      }
      togglePanels(); updatePrice();

      function handleSubmit(e){
        // Multi-service flow
        if(servicesRoot){
          var anyEnabled = serviceItems.some(function(item){ return item.querySelector('[data-service-enable]')?.checked; });
          if(!anyEnabled) return; // nothing selected; normal submit
          e.preventDefault();
          if(e.stopImmediatePropagation) e.stopImmediatePropagation();
          if(e.stopPropagation) e.stopPropagation();
          if(isSubmitting) return;
          isSubmitting = true;
          if(!validate()) return;

          var qtyInput = productForm.querySelector('input[name="quantity"]');
          var qty = qtyInput ? parseInt(qtyInput.value||'1',10) : 1;
          var mainId = parseInt((productForm.querySelector('input[name="id"]')||{}).value,10);
          if(!mainId){ productForm.submit(); return; }

          var props = collectProperties();
          var items = [{ id: mainId, quantity: qty, properties: props }];
          serviceItems.forEach(function(item){
            var enabled = item.querySelector('[data-service-enable]')?.checked;
            if(!enabled) return;
            var vid = parseInt(item.getAttribute('data-variant-id')||'0',10);
            if(vid) items.push({ id: vid, quantity: qty });
          });

          fetch('/cart/add.js', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: items }) })
            .then(function(r){ return r.json(); })
            .then(function(addResp){
              if(cartBehavior==='redirect'){ window.location.href = '/cart'; return; }
              return fetchAndRenderCartUI(addResp).then(function(){
                document.body.dispatchEvent(new CustomEvent('cart:update'));
                isSubmitting = false;
              });
            })
            .catch(function(){ isSubmitting = false; });
          return;
        }

        // Legacy single-service flow
        var s = selected();
        if(!s.id){ return; } // Unstitched; let normal flow proceed
        // We are adding a service product alongside the main product
        e.preventDefault();
        // Prevent theme's default product-form JS from also submitting
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        if(e.stopPropagation) e.stopPropagation();
        if(isSubmitting) return; // guard against double fires
        isSubmitting = true;
        if(!validate()) return;

        var qtyInput = productForm.querySelector('input[name="quantity"]');
        var qty = qtyInput ? parseInt(qtyInput.value||'1',10) : 1;
        var mainId = parseInt((productForm.querySelector('input[name="id"]')||{}).value,10);
        if(!mainId){ productForm.submit(); return; }

        var props = collectProperties();

        var items = [
          { id: mainId, quantity: qty, properties: props },
          { id: s.id, quantity: qty }
        ];

        fetch('/cart/add.js', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ items: items }) })
          .then(function(r){ return r.json(); })
          .then(function(addResp){
            if(cartBehavior==='redirect'){ window.location.href = '/cart'; return; }
            // Refresh cart UI sections and open the appropriate UI
            return fetchAndRenderCartUI(addResp).then(function(){
              document.body.dispatchEvent(new CustomEvent('cart:update'));
              isSubmitting = false;
            });
          })
          .catch(function(){ isSubmitting = false; /* swallow to avoid duplicate adds */ });
      }

      // Attach to this specific form (once)
      if(!productForm.dataset.stitchingBound){
        productForm.addEventListener('submit', handleSubmit, true);
        productForm.dataset.stitchingBound = 'true';
      }
    });
  });
})();
