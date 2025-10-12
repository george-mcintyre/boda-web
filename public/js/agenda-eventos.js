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

  // Función para mostrar las confirmaciones actuales
  function mostrarConfirmacionesActuales(confirmaciones) {
    const currentConfirmationsDiv = document.getElementById('currentConfirmations');
    const currentConfirmationsContent = document.getElementById('currentConfirmationsContent');
    
    if (confirmaciones && Object.keys(confirmaciones).length > 0) {
      let confirmacionesHTML = '<div class="confirmation-summary">';
      
      Object.keys(confirmaciones).forEach(eventoId => {
        const confirmado = confirmaciones[eventoId];
        const statusText = confirmado ? 'Confirmado' : 'No confirmado';
        const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
        
        confirmacionesHTML += `
          <div class="confirmation-item">
            <span class="confirmation-label">Evento ${eventoId}:</span>
            <span class="confirmation-value">
              <span class="status-badge ${statusClass}">${statusText}</span>
            </span>
          </div>
        `;
      });
      
      confirmacionesHTML += '</div>';
      currentConfirmationsContent.innerHTML = confirmacionesHTML;
      currentConfirmationsDiv.style.display = 'block';
    } else {
      currentConfirmationsDiv.style.display = 'none';
    }
  }

  // Función para cargar y mostrar la agenda
  async function cargarAgenda() {
    try {
      console.log('Token usado para cargar agenda:', token);
      
      const [agendaRes, confirmacionesRes] = await Promise.all([
        fetch('/api/agenda'),
        fetch('/api/agenda/confirmaciones', {
          headers: { 'Authorization': token }
        })
      ]);
      
      console.log('Status de confirmaciones:', confirmacionesRes.status);

      const agenda = await agendaRes.json();
      const confirmacionesData = await confirmacionesRes.json();
      
      console.log('Respuesta de agenda:', agenda);
      console.log('Respuesta de confirmaciones:', confirmacionesData);
      
      // Extraer las confirmaciones del objeto de respuesta
      const confirmaciones = confirmacionesData.confirmaciones || confirmacionesData;
      console.log('Confirmaciones extraídas:', confirmaciones);

      if (agendaRes.ok) {
        const agendaDiv = document.getElementById('agendaContent');
        
        if (!agendaDiv) {
          showMessage('agendaMessage', 'Error: No se encontró el contenedor de agenda', 'error');
          return;
        }
        
        // Mostrar confirmaciones actuales
        mostrarConfirmacionesActuales(confirmaciones);
        
        // Agrupar eventos por día
        const eventosPorDia = {};
        agenda.forEach(evento => {
          if (!eventosPorDia[evento.dia]) {
            eventosPorDia[evento.dia] = [];
          }
          eventosPorDia[evento.dia].push(evento);
        });

        let agendaHTML = '';
        
        Object.keys(eventosPorDia).forEach(dia => {
          agendaHTML += `
            <div class="agenda-dia">
              <h3 class="dia-titulo">
                <i class="fas fa-calendar-day"></i>
                ${dia}
              </h3>
              <div class="eventos-del-dia">
          `;
          
          eventosPorDia[dia].forEach(evento => {
            const confirmado = confirmaciones[evento.id] === true;
            const statusText = confirmado ? 'Confirmado' : 'No confirmado';
            const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
            const btnClass = confirmado ? 'confirmado' : 'no-confirmado';
            const btnText = confirmado ? 'Cancelar' : 'Confirmar';
            const btnIcon = confirmado ? 'times' : 'check';
            
            console.log(`Evento ${evento.id} (${evento.titulo}): confirmado = ${confirmado}, confirmaciones[${evento.id}] = ${confirmaciones[evento.id]}`);
            
            agendaHTML += `
              <div class="evento-item">
                <div class="evento-info">
                  <h4 class="evento-titulo">${evento.titulo}</h4>
                  <p class="evento-descripcion">${evento.descripcion}</p>
                  <div class="evento-hora">
                    <i class="fas fa-clock"></i>
                    ${evento.hora}
                  </div>
                </div>
                <div class="evento-acciones">
                  <span class="status-badge ${statusClass}">${statusText}</span>
                  <button 
                    class="confirmar-btn ${btnClass}" 
                    onclick="toggleConfirmacion(${evento.id}, ${!confirmado})"
                    data-evento-id="${evento.id}"
                  >
                    <i class="fas fa-${btnIcon}"></i>
                    ${btnText}
                  </button>
                </div>
              </div>
            `;
          });
          
          agendaHTML += `
              </div>
            </div>
          `;
        });
        
        agendaDiv.innerHTML = agendaHTML;
      } else {
        showMessage('agendaMessage', 'Error al cargar la agenda', 'error');
      }
    } catch (err) {
      showMessage('agendaMessage', 'Error de conexión al cargar la agenda', 'error');
    }
  }

  // Función para alternar confirmación de evento
  window.toggleConfirmacion = async function(eventoId, confirmar) {
    console.log(`toggleConfirmacion llamado: eventoId = ${eventoId}, confirmar = ${confirmar}`);
    
    try {
      const response = await fetch('/api/agenda/confirmar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          eventoId: eventoId,
          confirmar: confirmar
        })
      });

      const data = await response.json();
      console.log(`Respuesta del servidor: status = ${response.status}, data =`, data);
      
      if (response.ok) {
        showToast(data.mensaje, 'success');
        
        // Actualizar la interfaz inmediatamente con los datos de la respuesta
        if (data.confirmaciones) {
          // Actualizar el botón específico sin recargar toda la página
          const button = document.querySelector(`button[data-evento-id="${eventoId}"]`);
          const statusBadge = button?.parentElement?.querySelector('.status-badge');
          
          if (button && statusBadge) {
            const confirmado = data.confirmaciones[eventoId] === true;
            const statusText = confirmado ? 'Confirmado' : 'No confirmado';
            const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
            const btnClass = confirmado ? 'confirmado' : 'no-confirmado';
            const btnText = confirmado ? 'Cancelar' : 'Confirmar';
            const btnIcon = confirmado ? 'times' : 'check';
            
            // Actualizar el badge de estado
            statusBadge.textContent = statusText;
            statusBadge.className = `status-badge ${statusClass}`;
            
            // Actualizar el botón
            button.className = `confirmar-btn ${btnClass}`;
            button.innerHTML = `<i class="fas fa-${btnIcon}"></i> ${btnText}`;
            button.onclick = () => toggleConfirmacion(eventoId, !confirmado);
            
            console.log(`Interfaz actualizada: evento ${eventoId} ahora está ${confirmado ? 'confirmado' : 'no confirmado'}`);
          }
          
          // Actualizar también la sección de confirmaciones actuales
          mostrarConfirmacionesActuales(data.confirmaciones);
        }
      } else {
        showToast(data.error || 'Error al confirmar evento', 'error');
      }
    } catch (err) {
      console.error('Error en toggleConfirmacion:', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Cargar la agenda al iniciar
  cargarAgenda();

  // Función de logout
  window.logoutInvitado = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('email');
    window.location.href = 'login.html';
  };
});

