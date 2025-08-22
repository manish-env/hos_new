/**
 * Floating Auto-Play Video
 * 
 * This script handles the functionality of the floating auto-play video and controls.
 */

class FloatingAutoplayVideo {
  constructor() {
    this.container = document.querySelector('.floating-autoplay-video-container');
    if (!this.container) return;
    
    // Always get the current product handle from the URL
    const currentProductHandle = window.location.pathname.includes('/products/') ? 
      window.location.pathname.split('/products/')[1].split('/')[0] : null;
    
    // If we're not on a product page, don't show the video
    if (!currentProductHandle) {
      this.container.style.display = 'none';
      return;
    }
    
    // Store the current product handle on the container for reference
    this.container.dataset.productHandle = currentProductHandle;
    
    // Check if a specific product handle is set in the section settings
    const containerProductHandle = this.container.dataset.sectionProductHandle || '';
    
    // If a specific product handle is set and doesn't match the current product, hide the video
    if (containerProductHandle && containerProductHandle !== '' && 
        currentProductHandle !== containerProductHandle) {
      this.container.style.display = 'none';
      return;
    }
    
    this.videoContainers = document.querySelectorAll('.floating-autoplay-video-container');
    this.pauseButtons = document.querySelectorAll('.floating-video-pause-button');
    this.closeButtons = document.querySelectorAll('.floating-video-close-button');
    this.expandButtons = document.querySelectorAll('.floating-video-expand-button');
    this.isVideoHidden = sessionStorage.getItem('floatingVideoHidden') === 'true';
    this.isPaused = false;
    this.init();
  }

  init() {
    // Check if video should be hidden based on session storage
    if (this.isVideoHidden) {
      this.videoContainers.forEach(container => {
        container.style.display = 'none';
      });
    } else {
      // Make sure video is visible if not explicitly hidden
      this.videoContainers.forEach(container => {
        container.style.display = 'block';
      });
    }

    // Initialize pause/play button functionality
    if (this.pauseButtons.length) {
      this.pauseButtons.forEach(button => {
        const container = button.closest('.floating-autoplay-video-container');
        if (!container) return;
        
        const youtubeVideo = container.querySelector('iframe[id^="YouTubeVideo-"]');
        const vimeoVideo = container.querySelector('iframe[id^="VimeoVideo-"]');
        const htmlVideo = container.querySelector('video[id^="HTMLVideo-"]');
        
        const iconPause = button.querySelector('.icon-pause');
        const iconPlay = button.querySelector('.icon-play');
        
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          
          if (!this.isPaused) {
            // Pause video
            if (htmlVideo) {
              htmlVideo.pause();
            } else if (youtubeVideo) {
              this.postMessageToYouTube(youtubeVideo, 'pauseVideo');
            } else if (vimeoVideo) {
              this.postMessageToVimeo(vimeoVideo, 'pause');
            }
            
            // Update UI
            iconPause.classList.add('hidden');
            iconPlay.classList.remove('hidden');
            button.setAttribute('aria-label', 'Play Video');
            this.isPaused = true;
          } else {
            // Play video
            if (htmlVideo) {
              htmlVideo.play();
            } else if (youtubeVideo) {
              this.postMessageToYouTube(youtubeVideo, 'playVideo');
            } else if (vimeoVideo) {
              this.postMessageToVimeo(vimeoVideo, 'play');
            }
            
            // Update UI
            iconPause.classList.remove('hidden');
            iconPlay.classList.add('hidden');
            button.setAttribute('aria-label', 'Pause Video');
            this.isPaused = false;
          }
        });
      });
    }
    
    // Initialize close button functionality
    if (this.closeButtons.length) {
      this.closeButtons.forEach(button => {
        const container = button.closest('.floating-autoplay-video-container');
        if (!container) return;
        
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          
          container.style.display = 'none';
          this.isVideoHidden = true;
          
          // Store in session storage that the user closed the video
          sessionStorage.setItem('floatingVideoHidden', 'true');
        });
      });
    }
    
    // Initialize expand button functionality
    if (this.expandButtons.length) {
      this.expandButtons.forEach(button => {
        const container = button.closest('.floating-autoplay-video-container');
        if (!container) return;
        
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Create modal if it doesn't exist
          let modal = document.getElementById('floating-video-expanded-modal');
          if (!modal) {
            modal = document.createElement('div');
            modal.id = 'floating-video-expanded-modal';
            modal.className = 'floating-video-modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'floating-video-modal__content';
            
            const closeButton = document.createElement('button');
            closeButton.className = 'floating-video-modal__toggle';
            closeButton.setAttribute('aria-label', 'Close');
            closeButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            `;
            closeButton.addEventListener('click', () => {
              modal.removeAttribute('open');
              
              // Add fade-out animation
              modal.classList.add('fade-out');
              setTimeout(() => {
                modal.classList.remove('fade-out');
              }, 400);
            });
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
              if (e.key === 'Escape' && modal.hasAttribute('open')) {
                closeButton.click();
              }
            });
            
            // Close on click outside content
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeButton.click();
              }
            });
            
            modalContent.appendChild(closeButton);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
          }
          
          // Get the video content
          const videoContainer = container.querySelector('.floating-autoplay-video');
          const videoContent = videoContainer.innerHTML;
          
          // Set modal content
          const modalContent = modal.querySelector('.floating-video-modal__content');
          const videoWrapper = document.createElement('div');
          videoWrapper.className = 'floating-video-container';
          videoWrapper.innerHTML = videoContent;
          
          // Remove control buttons from the modal version
          const controlButtons = videoWrapper.querySelectorAll('.floating-video-control-button');
          controlButtons.forEach(btn => btn.remove());
          
          // Clear previous content except close button
          const closeButton = modalContent.querySelector('.floating-video-modal__toggle');
          modalContent.innerHTML = '';
          modalContent.appendChild(closeButton);
          modalContent.appendChild(videoWrapper);
          
          // Show modal
          modal.setAttribute('open', '');
          
          // If video was paused, keep it paused in the modal
          if (this.isPaused) {
            const youtubeVideo = videoWrapper.querySelector('iframe[id^="YouTubeVideo-"]');
            const vimeoVideo = videoWrapper.querySelector('iframe[id^="VimeoVideo-"]');
            const htmlVideo = videoWrapper.querySelector('video[id^="HTMLVideo-"]');
            
            if (htmlVideo) {
              htmlVideo.pause();
            } else if (youtubeVideo) {
              this.postMessageToYouTube(youtubeVideo, 'pauseVideo');
            } else if (vimeoVideo) {
              this.postMessageToVimeo(vimeoVideo, 'pause');
            }
          }
        });
      });
    }
    
    // Add a simple scroll handler to show the video when scrolled down
    window.addEventListener('scroll', this.handleScroll.bind(this));
    // Initial check
    this.handleScroll();
  }
  
  handleScroll() {
    // Don't show if user explicitly closed the video
    if (this.isVideoHidden) return;
    
    const scrollY = window.scrollY || window.pageYOffset;
    const threshold = 300; // Show after scrolling down 300px
    
    if (scrollY > threshold) {
      this.videoContainers.forEach(container => {
        container.style.display = 'block';
      });
    } else {
      this.videoContainers.forEach(container => {
        container.style.display = 'none';
      });
    }
  }
  
  postMessageToYouTube(iframe, action) {
    if (!iframe) return;
    
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: action,
        args: ''
      }),
      '*'
    );
  }
  
  postMessageToVimeo(iframe, action) {
    if (!iframe) return;
    
    iframe.contentWindow.postMessage(
      JSON.stringify({
        method: action
      }),
      '*'
    );
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  new FloatingAutoplayVideo();
});
