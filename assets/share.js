if (!customElements.get('share-button')) {
  customElements.define(
    'share-button',
    class ShareButton extends DetailsDisclosure {
      constructor() {
        super();

        this.elements = {
          shareButton: this.querySelector('button'),
          shareSummary: this.querySelector('summary'),
          closeButton: this.querySelector('.share-button__close'),
          successMessage: this.querySelector('[id^="ShareMessage"]'),
          urlInput: this.querySelector('input'),
          socialSharing: this.querySelector('.social-sharing')
        };
        this.urlToShare = this.elements.urlInput ? this.elements.urlInput.value : document.location.href;
        
        // Check if it's a mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (navigator.share && this.isMobile) {
          // For mobile devices with Web Share API support
          this.mainDetailsToggle.setAttribute('hidden', '');
          this.elements.shareButton.classList.remove('hidden');
          this.elements.shareButton.addEventListener('click', () => {
            navigator.share({ 
              url: this.urlToShare, 
              title: document.title,
              text: document.title
            });
          });
        } else if (this.isMobile) {
          // For mobile devices without Web Share API support
          // Show the social sharing buttons
          this.mainDetailsToggle.addEventListener('toggle', this.toggleDetails.bind(this));
          this.mainDetailsToggle
            .querySelector('.share-button__copy')
            .addEventListener('click', this.copyToClipboard.bind(this));
          this.mainDetailsToggle.querySelector('.share-button__close').addEventListener('click', this.close.bind(this));
        } else {
          // For desktop: just copy the URL
          this.elements.shareSummary.addEventListener('click', (event) => {
            event.preventDefault();
            this.copyToClipboard();
            
            // Show success message
            this.elements.successMessage.classList.remove('hidden');
            this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess || 'Link copied to clipboard';
            
            // Hide success message after 2 seconds
            setTimeout(() => {
              this.elements.successMessage.classList.add('hidden');
            }, 2000);
          });
          
          // Hide the details content for desktop
          if (this.elements.socialSharing) {
            this.elements.socialSharing.style.display = 'none';
          }
        }
      }

      toggleDetails() {
        if (!this.mainDetailsToggle.open) {
          this.elements.successMessage.classList.add('hidden');
          this.elements.successMessage.textContent = '';
          this.elements.closeButton.classList.add('hidden');
          this.elements.shareSummary.focus();
        }
      }

      copyToClipboard() {
        navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
          this.elements.successMessage.classList.remove('hidden');
          this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess || 'Link copied to clipboard';
          this.elements.closeButton.classList.remove('hidden');
          this.elements.closeButton.focus();
        });
      }

      updateUrl(url) {
        this.urlToShare = url;
        this.elements.urlInput.value = url;
      }
    }
  );
}
