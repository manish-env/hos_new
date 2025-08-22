/**
 * Floating Product Video
 * 
 * This script handles the functionality of the floating video button and modal.
 */

class FloatingVideoButton {
  constructor() {
    this.buttons = document.querySelectorAll('[data-modal-opener]');
    this.modals = document.querySelectorAll('modal-dialog');
    this.init();
  }

  init() {
    if (!this.buttons.length) return;

    // Initialize modal functionality
    this.buttons.forEach(button => {
      const modalId = button.dataset.modalOpener;
      const modal = document.getElementById(modalId);
      
      if (!modal) return;
      
      // Open modal when button is clicked
      button.addEventListener('click', () => {
        this.openModal(modal);
      });
      
      // Close modal when close button is clicked
      const closeButton = modal.querySelector('.floating-video-modal__toggle');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.closeModal(modal);
        });
      }
      
      // Close modal when clicking outside content
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          this.closeModal(modal);
        }
      });
      
      // Close modal when pressing Escape key
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.hasAttribute('open')) {
          this.closeModal(modal);
        }
      });
    });
  }

  openModal(modal) {
    if (!modal) return;
    
    // Pause all videos when opening a new modal
    this.pauseAllVideos();
    
    // Set the modal to open
    modal.setAttribute('open', '');
    
    // Set focus to the modal
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }

  closeModal(modal) {
    if (!modal) return;
    
    // Remove the open attribute
    modal.removeAttribute('open');
    
    // Pause any videos in the modal
    const videos = modal.querySelectorAll('video, iframe');
    videos.forEach(video => {
      this.pauseVideo(video);
    });
    
    // Re-enable body scrolling
    document.body.style.overflow = '';
  }

  pauseAllVideos() {
    const videos = document.querySelectorAll('video, iframe');
    videos.forEach(video => {
      this.pauseVideo(video);
    });
  }

  pauseVideo(video) {
    if (video.tagName === 'VIDEO') {
      video.pause();
    } else if (video.tagName === 'IFRAME') {
      // For YouTube and Vimeo iframes
      const src = video.src;
      video.src = src;
    }
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  new FloatingVideoButton();
});
