document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('/api/invitado', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const data = await response.json();
    if (response.ok) {
      document.getElementById('menuContent').textContent = 'Aquí irá el menú personalizado.';
      document.getElementById('agendaContent').textContent = 'Aquí irá la agenda de la boda.';
      document.getElementById('regalosContent').textContent = 'Aquí irá la lista de regalos.';
      document.getElementById('mensajesContent').textContent = `¡Bienvenido, ${data.nombre}!`;
    } else {
      // Token inválido o expirado
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  } catch (err) {
    document.body.innerHTML = '<p>Error de conexión con el servidor.</p>';
  }
}); 