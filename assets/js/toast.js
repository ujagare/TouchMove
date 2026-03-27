window.showSuccessToast = function(message) {
  const toast = document.createElement('div');
  toast.className = 'tm-toast tm-toast-show';
  toast.textContent = message || 'Success! Your message has been sent.';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10050;
    background: rgba(34, 197, 94, 0.95);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

window.showErrorToast = function(message) {
  const toast = document.createElement('div');
  toast.className = 'tm-toast tm-toast-error tm-toast-show';
  toast.textContent = message || 'Error! Please try again.';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10050;
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    font-size: 14px;
    font-weight: 500;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  
  @media (max-width: 640px) {
    .tm-toast {
      top: auto !important;
      right: 10px !important;
      bottom: 10px !important;
      left: 10px !important;
      max-width: none !important;
    }
  }
`;
document.head.appendChild(style);
