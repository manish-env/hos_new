(function () {
  const mq = window.matchMedia('(max-width: 749px)');

  function applyState() {
    const accordions = document.querySelectorAll('.footer-accordion');
    const isMobile = mq.matches;

    accordions.forEach((acc) => {
      // Only toggle if not explicitly controlled by user interaction since last resize
      if (isMobile) {
        acc.removeAttribute('open');
      } else {
        acc.setAttribute('open', '');
      }
    });
  }

  // Initialize after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyState);
  } else {
    applyState();
  }

  // Update on breakpoint changes
  try {
    mq.addEventListener('change', applyState);
  } catch (e) {
    // Safari fallback
    mq.addListener(applyState);
  }
})();
