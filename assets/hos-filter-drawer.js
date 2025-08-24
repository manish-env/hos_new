// HOS Filter Drawer: custom dropdown logic
(function () {
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
    const btn = e.target.closest('[data-hos-toggle]');
    if (!btn) return;
    e.preventDefault();
    toggleGroup(btn);
  }

  function init(root) {
    const container = root || document;
    container.addEventListener('click', onClick);
    // initialize ARIA states
    container.querySelectorAll('.hos-filter__group .hos-filter__summary').forEach((btn) => {
      if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
