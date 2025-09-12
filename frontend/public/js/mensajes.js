document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Función para mostrar mensajes
  function showMessage(elementId, msg, type = 'error') {
    const element = document.getElementById(elementId);
    element.textContent = msg;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  // Función para mostrar toast de confirmación
  function showToast(message, type = 'success') {
    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Añadir al body
    document.body.appendChild(toast);
    
    // Mostrar con animación
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // Enviar mensaje
  const mensajeForm = document.getElementById('mensajeForm');
  if (mensajeForm) {
    mensajeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mensaje = mensajeForm.mensaje.value.trim();
      if (!mensaje) return;
      
      try {
        const res = await fetch('/api/mensajes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({ mensaje })
        });
        const data = await res.json();
        if (res.ok) {
          showMessage('mensajeStatus', data.mensaje, 'success');
          showToast('Mensaje enviado con éxito');
          mensajeForm.reset();
        } else {
          showMessage('mensajeStatus', data.error || 'Error al enviar el mensaje.', 'error');
        }
      } catch (err) {
        showMessage('mensajeStatus', 'Error de conexión al enviar el mensaje.', 'error');
      }
    });
  }
});

