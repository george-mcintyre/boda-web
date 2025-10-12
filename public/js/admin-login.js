document.addEventListener('DOMContentLoaded', () => {
  const adminLoginForm = document.getElementById('adminLoginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Limpiar campos al cargar
  usernameInput.value = '';
  passwordInput.value = '';

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      alert('Por favor, completa todos los campos');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: username,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Guardar token en localStorage
        localStorage.setItem('adminToken', data.token);
        
        // Redirigir al panel de administración con i18n
        window.location.href = 'admin-i18n.html';
      } else {
        alert(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión. Verifica que el servidor esté ejecutándose.');
    }
  });
});


