// Common functions shared across all modules

// Function to show toast notifications
window.showToast = function(message, type = 'success') {
  // Create a toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  //Add to the body
  document.body.appendChild(toast);
  
  // Show with animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}