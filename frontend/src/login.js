document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value;
    const password = form.password.value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        // Guardar el token y datos en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('email', data.email);
        // Redirigir a la zona privada
        window.location.href = 'invitados.html';
      } else {
        messageDiv.textContent = data.error || 'Error en el login';
      }
    } catch (err) {
      messageDiv.textContent = 'Error de conexión con el servidor';
    }
  });
}); 