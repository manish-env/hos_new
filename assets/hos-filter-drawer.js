// HOS Filter Drawer: custom dropdown logic
(function () {
  function stopAll(e) {
    if (!e) return;
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  }

  function toggleGroup(button) {
    const group = button.closest('.hos-filter__group');
    if (!group) return;
    const content = group.querySelector('.hos-filter__content');
    const expanded = button.getAttribute('aria-expanded') === 'true';
    const next = !expanded;
    button.setAttribute('aria-expanded', String(next));
    if (content) {
      if (next) {
        content.removeAttribute('hidden');
        group.classList.add('is-open');
      } else {
        content.setAttribute('hidden', '');
        group.classList.remove('is-open');
      }
    }
  }

  function onClick(e) {
    const withinHos = !!e.target.closest('.hos-filter-drawer');
    if (withinHos) {
      // Prevent parent drawer/disclosure listeners from reacting
      e.stopPropagation();
    }
    const btn = e.target.closest('[data-hos-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleGroup(btn);
  }

  function onChange(e) {
    if (e.target.closest('.hos-filter-drawer')) {
      // Let the control toggle normally; just stop bubbling to Shopify listeners
      e.stopPropagation();
    }
  }

  function applySelections() {
    const drawer = document.querySelector('.hos-filter-drawer');
    const form = document.getElementById('FacetFiltersFormMobile');
    if (!drawer || !form) return;
    // Remove previously generated hidden inputs
    form.querySelectorAll('input[data-hos-generated="true"]').forEach((n) => n.remove());

    // Collect checked checkboxes
    drawer.querySelectorAll('.hos-filter__checkbox:checked').forEach((cb) => {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = cb.name;
      hidden.value = cb.value;
      hidden.setAttribute('data-hos-generated', 'true');
      form.appendChild(hidden);
    });

    // Collect price inputs (if present)
    drawer.querySelectorAll('.hos-filter__price input[name]')?.forEach((inp) => {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = inp.name;
      hidden.value = inp.value;
      hidden.setAttribute('data-hos-generated', 'true');
      form.appendChild(hidden);
    });

    // Trigger Shopify filters update via input event on the form
    const ev = new Event('input', { bubbles: true });
    form.dispatchEvent(ev);
  }

  function init(root) {
    const container = root || document;
    container.addEventListener('click', onClick, true);
    // Also stop propagation for any click within the drawer content
    container.addEventListener(
      'click',
      function (e) {
        if (e.target.closest('.hos-filter-drawer')) {
          stopAll(e);
        }
      },
      true
    );
    // Prevent input/change bubbling to the Shopify form handler
    container.addEventListener('input', onChange, true);
    container.addEventListener('change', onChange, true);
    container.addEventListener('mousedown', function (e) {
      if (e.target.closest('.hos-filter-drawer')) e.stopPropagation();
    }, true);
    container.addEventListener('touchstart', function (e) {
      if (e.target.closest('.hos-filter-drawer')) e.stopPropagation();
    }, true);

    // initialize ARIA states
    container.querySelectorAll('.hos-filter__group .hos-filter__summary').forEach((btn) => {
      if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    });

    // Expose apply function globally for inline handler
    window.hosApplyFilters = applySelections;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
