document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');
  const emailInput = document.getElementById('email');

  // Clear field on page load
  emailInput.value = '';

  function showMessage(msg, type = 'error') {
    messageDiv.textContent = msg;
    messageDiv.style.background = type === 'error' ? '#ffdddd' : '#ddffdd';
    messageDiv.style.color = type === 'error' ? '#a00' : '#070';
    messageDiv.style.border = '1px solid ' + (type === 'error' ? '#a00' : '#070');
    messageDiv.style.padding = '0.7em';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.textAlign = 'center';
  }
  
  function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.style.background = '';
    messageDiv.style.color = '';
    messageDiv.style.border = '';
    messageDiv.style.padding = '';
    messageDiv.style.borderRadius = '';
  }

  // Clear message on typing
  emailInput.addEventListener('input', clearMessage);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    
    // Empty field visual validation
    if (!email) {
      emailInput.style.borderColor = '#a00';
      showMessage(window.translate('login:enterEmail'), 'error');
      return;
    } else {
      emailInput.style.borderColor = '';
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        // Save token and data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('email', data.email);
        showMessage(window.translate('login:successRedirect'), 'success');
        setTimeout(() => {
          window.location.href = 'guests.html';
        }, 800);
      } else {
        showMessage(data.error || window.translate('login:emailNotFound'), 'error');
      }
    } catch (err) {
      showMessage(window.translate('login:serverError'), 'error');
    }
  });
});