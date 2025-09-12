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
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // Función para mostrar confirmación personalizada
  function showConfirmDialog(message, onConfirm, onCancel) {
    // Crear overlay de confirmación
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-content">
          <i class="fas fa-question-circle"></i>
          <h3>Confirmar acción</h3>
          <p>${message}</p>
          <div class="confirm-buttons">
            <button class="btn-cancel-confirm">Cancelar</button>
            <button class="btn-confirm-action">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    
    // Añadir al body
    document.body.appendChild(overlay);
    
    // Mostrar con animación
    setTimeout(() => overlay.classList.add('show'), 100);
    
    // Event listeners
    overlay.querySelector('.btn-cancel-confirm').addEventListener('click', () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
      }, 300);
    });
    
    overlay.querySelector('.btn-confirm-action').addEventListener('click', () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(overlay);
        if (onConfirm) onConfirm();
      }, 300);
    });
    
    // Cerrar con Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(overlay);
          if (onCancel) onCancel();
        }, 300);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Mostrar la lista de regalos con opción de reservar
  async function cargarRegalos() {
    try {
      const regalosRes = await fetch('/api/regalos');
      const regalos = await regalosRes.json();
      const regalosDiv = document.getElementById('regalosContent');
      
      if (regalosRes.ok) {
        // Obtener el email del usuario actual
        const userEmail = localStorage.getItem('email');
        
        regalosDiv.innerHTML = `
          <div class="regalos-grid">
            ${regalos.map(regalo => {
              let estado;
              if (regalo.reservadoPor) {
                if (regalo.reservadoPor === userEmail) {
                  // Regalo reservado por el usuario actual - mostrar botón de cancelar
                  estado = `<button class="btn-cancelar-reserva" data-id="${regalo.id}">
                    <i class="fas fa-times"></i>
                    Cancelar reserva
                  </button>`;
                } else {
                  // Regalo reservado por otro usuario
                  estado = `<span class="estado-reservado">
                    <i class="fas fa-gift"></i>
                    Reservado por ${regalo.reservadoPor}
                  </span>`;
                }
              } else {
                // Regalo disponible
                estado = `<button class="btn-reservar" data-id="${regalo.id}">
                  <i class="fas fa-heart"></i>
                  Reservar
                </button>`;
              }
              
              return `
                <div class="regalo-card ${regalo.reservadoPor === userEmail ? 'reservado-por-mi' : ''}">
                  <div class="regalo-info">
                    <h4>${regalo.nombre}</h4>
                    <p>${regalo.descripcion}</p>
                    ${regalo.enlace ? `<a href="${regalo.enlace}" target="_blank" class="regalo-enlace">
                      <i class="fas fa-external-link-alt"></i>
                      Ver/Comprar
                    </a>` : ''}
                  </div>
                  <div class="regalo-accion">
                    ${estado}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        
        // Añadir listeners a los botones de reservar
        document.querySelectorAll('.btn-reservar').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const regaloCard = btn.closest('.regalo-card');
            const regaloNombre = regaloCard.querySelector('h4').textContent;
            
            // Mostrar confirmación inmediata visual
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reservando...';
            btn.disabled = true;
            btn.style.background = '#6c757d';
            
            try {
              const res = await fetch('/api/regalos/reservar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token
                },
                body: JSON.stringify({ id })
              });
              const data = await res.json();
              if (res.ok) {
                // Confirmación inmediata y visual
                btn.innerHTML = '<i class="fas fa-check"></i> ¡Reservado!';
                btn.style.background = '#28a745';
                btn.style.color = 'white';
                
                // Añadir efecto visual al card
                regaloCard.classList.add('reservado');
                
                // Mostrar mensaje de éxito
                showToast(`¡Perfecto! Has reservado "${regaloNombre}"`, 'success');
                
                // Actualizar la lista completa después de un breve delay
                setTimeout(cargarRegalos, 2000);
              } else {
                // Restaurar botón en caso de error
                btn.innerHTML = '<i class="fas fa-heart"></i> Reservar';
                btn.disabled = false;
                btn.style.background = '';
                showMessage('regalosMessage', data.error || 'Error al reservar el regalo.', 'error');
              }
            } catch (err) {
              // Restaurar botón en caso de error
              btn.innerHTML = '<i class="fas fa-heart"></i> Reservar';
              btn.disabled = false;
              btn.style.background = '';
              showMessage('regalosMessage', 'Error de conexión al reservar el regalo.', 'error');
            }
          });
        });

        // Añadir listeners a los botones de cancelar reserva
        document.querySelectorAll('.btn-cancelar-reserva').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const regaloCard = btn.closest('.regalo-card');
            const regaloNombre = regaloCard.querySelector('h4').textContent;
            
            // Mostrar diálogo de confirmación
            showConfirmDialog(
              `¿Estás seguro de que quieres cancelar la reserva de "${regaloNombre}"?`,
              async () => {
                // Función de confirmación
                // Mostrar confirmación inmediata visual
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelando...';
                btn.disabled = true;
                btn.style.background = '#6c757d';
                
                try {
                  const res = await fetch('/api/regalos/cancelar', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token
                    },
                    body: JSON.stringify({ id })
                  });
                  
                  const data = await res.json();
                  
                  if (res.ok) {
                    // Confirmación inmediata y visual
                    btn.innerHTML = '<i class="fas fa-check"></i> ¡Cancelado!';
                    btn.style.background = '#dc3545';
                    btn.style.color = 'white';
                    
                    // Remover efecto visual del card
                    regaloCard.classList.remove('reservado-por-mi');
                    
                    // Mostrar mensaje de éxito
                    showToast(`Has cancelado la reserva de "${regaloNombre}"`, 'success');
                    
                    // Actualizar la lista completa después de un breve delay
                    setTimeout(cargarRegalos, 2000);
                  } else {
                    // Restaurar botón en caso de error
                    btn.innerHTML = '<i class="fas fa-times"></i> Cancelar reserva';
                    btn.disabled = false;
                    btn.style.background = '';
                    showMessage('regalosMessage', data.error || 'Error al cancelar la reserva.', 'error');
                  }
                } catch (err) {
                  // Restaurar botón en caso de error
                  btn.innerHTML = '<i class="fas fa-times"></i> Cancelar reserva';
                  btn.disabled = false;
                  btn.style.background = '';
                  showMessage('regalosMessage', 'Error de conexión al cancelar la reserva.', 'error');
                }
              },
              () => {
                // Función de cancelación - no hacer nada
              }
            );
          });
        });
      } else {
        regalosDiv.innerHTML = '<p class="no-regalos">No hay regalos disponibles en este momento.</p>';
      }
    } catch (err) {
      document.getElementById('regalosContent').innerHTML = '<p class="error">Error de conexión al cargar la lista de regalos.</p>';
    }
  }

  // Cargar regalos al iniciar
  cargarRegalos();

  // Función de logout
  window.logoutInvitado = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('email');
    window.location.href = 'login.html';
  };
});
