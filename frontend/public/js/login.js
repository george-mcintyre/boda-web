document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');
  const emailInput = document.getElementById('email');

  // Limpiar campo al cargar la página
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

  // Limpiar mensaje al escribir
  emailInput.addEventListener('input', clearMessage);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    
    // Validación visual de campo vacío
    if (!email) {
      emailInput.style.borderColor = '#a00';
      showMessage('Por favor, introduce tu email.', 'error');
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
        // Guardar el token y datos en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('email', data.email);
        showMessage('Acceso exitoso. Redirigiendo...', 'success');
        setTimeout(() => {
          window.location.href = 'invitados.html';
        }, 800);
      } else {
        showMessage(data.error || 'Email no encontrado en la lista de invitados', 'error');
      }
    } catch (err) {
      showMessage('Error de conexión con el servidor', 'error');
    }
  });
}); 