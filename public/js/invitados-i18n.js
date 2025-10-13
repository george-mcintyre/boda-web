document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = 'login-i18n.html';
    return;
  }

  // Función para mostrar toast de confirmación (sistema de ayer)
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
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 5000);
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

  // Función para traducir texto
  function translate(key) {
    if (window.currentTranslations && window.currentTranslations[currentLanguage]) {
      return window.currentTranslations[currentLanguage][key] || key;
    }
    return key;
  }

  // Obtener idioma actual
  const currentLanguage = localStorage.getItem('language') || 'es';

  // Verificar estado de bloqueo de la agenda
  async function verificarBloqueoAgenda() {
    try {
      const response = await fetch('/api/config/agenda/bloqueo');
      const data = await response.json();
      return data.agenda && data.agenda.bloqueada;
    } catch (error) {
      console.error('Error al verificar bloqueo de agenda:', error);
      return false;
    }
  }

  // Inicializar el sistema de pestañas
  async function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const target = tab.getAttribute('data-tab');
        
        // Verificar bloqueo de agenda antes de permitir acceso a cualquier pestaña
        if (target === 'agenda' || target === 'menu' || target === 'regalos' || target === 'efectivo' || target === 'resumen') {
          const agendaBloqueada = await verificarBloqueoAgenda();
          if (agendaBloqueada) {
            // Mostrar mensaje de bloqueo y no cambiar de pestaña
            const mensaje = target === 'agenda' ? 'La agenda está bloqueada temporalmente' :
                           target === 'menu' ? 'La selección de menú está bloqueada temporalmente' :
                           target === 'regalos' ? 'La lista de regalos está bloqueada temporalmente' :
                           target === 'efectivo' ? 'Los regalos en efectivo están bloqueados temporalmente' :
                           'El resumen está bloqueado temporalmente';
            showToast(mensaje, 'error');
            // Si intenta abrir Resumen estando bloqueado, reemplazar contenido por aviso
            if (target === 'resumen') {
              const resumenTab = document.getElementById('resumen-tab');
              if (resumenTab) {
                resumenTab.innerHTML = `
                  <div class="agenda-blocked-container">
                    <div class="agenda-blocked-content">
                      <div class="agenda-blocked-icon">
                        <i class="fas fa-lock"></i>
                      </div>
                      <h2>Bloqueado temporalmente</h2>
                      <p>El resumen está bloqueado mientras la Agenda de Eventos permanezca bloqueada.</p>
                      <div class="agenda-blocked-info">
                        <p><i class=\"fas fa-info-circle\"></i> Vuelve más tarde cuando la agenda esté disponible.</p>
                      </div>
                    </div>
                  </div>
                `;
              }
            }
            // Si intenta abrir Regalos en Efectivo estando bloqueado, reemplazar contenido por aviso
            if (target === 'efectivo') {
              const efectivoTab = document.getElementById('efectivo-tab');
              if (efectivoTab) {
                efectivoTab.innerHTML = `
                  <div class="agenda-blocked-container">
                    <div class="agenda-blocked-content">
                      <div class="agenda-blocked-icon">
                        <i class="fas fa-lock"></i>
                      </div>
                      <h2>Regalos en Efectivo Bloqueados</h2>
                      <p>Los regalos en efectivo están bloqueados temporalmente por los organizadores.</p>
                      <div class="agenda-blocked-info">
                        <p><i class=\"fas fa-info-circle\"></i> Vuelve más tarde cuando los regalos estén disponibles.</p>
                      </div>
                    </div>
                  </div>
                `;
              }
            }
            return;
          }
        }
        
        // Remover clase active de todas las pestañas y contenidos
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        // Agregar clase active a la pestaña y contenido seleccionado
        tab.classList.add('active');
        const targetContent = document.getElementById(target + '-tab');
        if (targetContent) {
          targetContent.classList.add('active');
        }
        
        // Cargar contenido según la pestaña
        if (target === 'resumen') {
          cargarStatusMenu();
          cargarStatusAgenda();
          cargarStatusRegalos();
          cargarStatusMensajes();
        } else if (target === 'regalos') {
          loadRegalosContent();
        } else if (target === 'efectivo') {
          loadEfectivoContent();
        } else if (target === 'agenda') {
          loadAgendaContent();
        } else if (target === 'menu') {
          loadMenuContent();
        } else if (target === 'mensajes') {
          loadMensajesContent();
        }
      });
    });
    
    // Cargar contenido inicial de la pestaña activa
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const target = activeTab.getAttribute('data-tab');
      // Si la agenda está bloqueada y la pestaña activa es Resumen, mostrar aviso y no cargar datos
      if (target === 'resumen') {
        const agendaBloqueada = await verificarBloqueoAgenda();
        if (agendaBloqueada) {
          const resumenTab = document.getElementById('resumen-tab');
          if (resumenTab) {
            resumenTab.innerHTML = `
              <div class="agenda-blocked-container">
                <div class="agenda-blocked-content">
                  <div class="agenda-blocked-icon">
                    <i class="fas fa-lock"></i>
                  </div>
                  <h2>Bloqueado temporalmente</h2>
                  <p>El resumen está bloqueado mientras la Agenda de Eventos permanezca bloqueada.</p>
                  <div class="agenda-blocked-info">
                    <p><i class=\"fas fa-info-circle\"></i> Vuelve más tarde cuando la agenda esté disponible.</p>
                  </div>
                </div>
              </div>
            `;
          }
        } else {
          cargarStatusMenu();
          cargarStatusAgenda();
          cargarStatusRegalos();
          cargarStatusEfectivo();
          cargarStatusMensajes();
        }
      } else if (target === 'regalos') {
        loadRegalosContent();
      } else if (target === 'efectivo') {
        loadEfectivoContent();
      } else if (target === 'menu') {
        loadMenuContent();
      } else if (target === 'agenda') {
        loadAgendaContent();
      } else if (target === 'mensajes') {
        loadMensajesContent();
      }
    }
  }

  // Cargar contenido de la pestaña Regalos (versión mejorada de anteayer)
  async function loadRegalosContent() {
    const regalosContent = document.getElementById('regalosContent');
    if (!regalosContent) return;

    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        regalosContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La lista de regalos está actualmente bloqueada y no está disponible para modificaciones.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la lista esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const response = await fetch('/api/regalos', {
        headers: { 'Authorization': token }
      });
      const regalos = await response.json();

      if (response.ok) {
        // Obtener el email del usuario actual
        const userEmail = localStorage.getItem('email');
        
        regalosContent.innerHTML = `
          <div class="regalos-container">
            <div class="regalos-content">
              <div class="gift-grid">
                ${regalos.map(regalo => {
                  let estado;
                  if (regalo.reservadoPor) {
                    if (regalo.reservadoPor === userEmail) {
                      // Regalo reservado por el usuario actual - mostrar botón de cancelar
                      estado = `<button class="btn-cancel-reservation" data-id="${regalo.id}">
                        <i class="fas fa-times"></i>
                        Cancelar reserva
                      </button>`;
                    } else {
                      // Regalo reservado por otro usuario
                      estado = `<span class="reserved-state">
                        <i class="fas fa-gift"></i>
                        Reservado por ${regalo.reservadoPor}
                      </span>`;
                    }
                  } else {
                    // Regalo disponible
                    estado = `<button class="btn-reservation" data-id="${regalo.id}">
                      <i class="fas fa-heart"></i>
                      Reservar
                    </button>`;
                  }
                  
                  return `
                    <div class="gift-card ${regalo.reservadoPor === userEmail ? 'reservado-por-mi' : ''}">
                      <div class="gift-info">
                        <h4>${regalo.nombre}</h4>
                        <p>${regalo.descripcion}</p>
                        ${regalo.enlace ? `<a href="${regalo.enlace}" target="_blank" class="gift-link">
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
            </div>
          </div>
        `;
        
        // Añadir listeners a los botones de reservar
        document.querySelectorAll('.btn-reservation').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const regaloCard = btn.closest('.gift-card');
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
                setTimeout(loadRegalosContent, 2000);
              } else {
                // Restaurar botón en caso de error
                btn.innerHTML = '<i class="fas fa-heart"></i> Reservar';
                btn.disabled = false;
                btn.style.background = '';
                showToast(data.error || 'Error al reservar el regalo.', 'error');
              }
            } catch (err) {
              // Restaurar botón en caso de error
              btn.innerHTML = '<i class="fas fa-heart"></i> Reservar';
              btn.disabled = false;
              btn.style.background = '';
              showToast('Error de conexión al reservar el regalo.', 'error');
            }
          });
        });

        // Añadir listeners a los botones de cancelar reserva
        document.querySelectorAll('.btn-cancel-reservation').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const regaloCard = btn.closest('.gift-card');
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
                    setTimeout(loadRegalosContent, 2000);
                  } else {
                    // Restaurar botón en caso de error
                    btn.innerHTML = '<i class="fas fa-times"></i> Cancelar reserva';
                    btn.disabled = false;
                    btn.style.background = '';
                    showToast(data.error || 'Error al cancelar la reserva.', 'error');
                  }
                } catch (err) {
                  // Restaurar botón en caso de error
                  btn.innerHTML = '<i class="fas fa-times"></i> Cancelar reserva';
                  btn.disabled = false;
                  btn.style.background = '';
                  showToast('Error de conexión al cancelar la reserva.', 'error');
                }
              },
              () => {
                // Función de cancelación - no hacer nada
              }
            );
          });
        });
      } else {
        regalosContent.innerHTML = '<p class="no-gifts">No hay regalos disponibles en este momento.</p>';
      }
    } catch (err) {
      console.error('Error loading gifts:', err);
      regalosContent.innerHTML = '<p class="error">Error de conexión al cargar la lista de regalos.</p>';
    }
  }

  // Cargar contenido de la pestaña Regalos en Efectivo
  async function loadEfectivoContent() {
    const efectivoContent = document.querySelector('#efectivo-tab .cash-gifts-container');
    if (!efectivoContent) return;

    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        efectivoContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Regalos en Efectivo Bloqueados</h2>
              <p>Los regalos en efectivo están actualmente bloqueados y no están disponibles.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando los regalos estén disponibles.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, el contenido normal ya está en el HTML
      // No necesitamos cargar nada adicional ya que el formulario está en el HTML
      
    } catch (err) {
      console.error('Error loading cash gifts:', err);
      efectivoContent.innerHTML = '<p class="error">Error de conexión al cargar los regalos en efectivo.</p>';
    }
  }

  // Cargar contenido de la pestaña Agenda
  async function loadAgendaContent() {
    const agendaContent = document.getElementById('agendaContent');
    if (!agendaContent) return;

    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        agendaContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La agenda de eventos está actualmente bloqueada y no está disponible para modificaciones.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la agenda esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const [eventosRes, confirmacionesRes] = await Promise.all([
        fetch('/api/eventos'),
        fetch('/api/eventos/confirmaciones', {
          headers: { 'Authorization': token }
        })
      ]);
      
      const eventosData = await eventosRes.json();
      const confirmacionesData = await confirmacionesRes.json();

      if (eventosRes.ok) {
        let agendaHTML = '';
        
        if (eventosData && eventosData.eventos && eventosData.eventos.length > 0) {
          agendaHTML += `
            <div class="agenda-container">
              <div class="agenda-content">
                ${eventosData.eventos.map(evento => {
                  const confirmado = confirmacionesData.confirmaciones && confirmacionesData.confirmaciones[evento.id];
                  const estadoTexto = confirmado ? 'Confirmado' : 'No confirmado';
                  const estadoClase = confirmado ? 'state-confirmed' : 'state-cancelled';
                  const estadoIcono = confirmado ? 'fa-check-circle' : 'fa-times-circle';
                  
                  // Mostrar botones según el estado de bloqueo
                  let botonHTML;
                  if (agendaBloqueada) {
                    // Si está bloqueada, mostrar botón deshabilitado
                    botonHTML = `
                      <button disabled class="btn-disabled" title="Agenda bloqueada">
                        <i class="fas fa-lock"></i>
                        Bloqueado
                      </button>
                    `;
                  } else {
                    // Si no está bloqueada, mostrar botones normales
                    if (confirmado) {
                      // Si está confirmado, mostrar solo botón de cancelar
                      botonHTML = `
                        <button onclick="confirmarEvento(${evento.id}, false)" class="btn-cancelar">
                          <i class="fas fa-times"></i> Cancelar
                        </button>
                      `;
                    } else {
                      // Si no está confirmado, mostrar solo botón de confirmar
                      botonHTML = `
                        <button onclick="confirmarEvento(${evento.id}, true)" class="btn-confirmar">
                          <i class="fas fa-check"></i> Confirmar
                        </button>
                      `;
                    }
                  }
                  
                  return `
                    <div class="evento-card">
                      <div class="evento-info">
                        <h4>${evento.titulo}</h4>
                        <p><i class="fas fa-clock"></i> ${evento.fecha} - ${evento.horaInicio}${evento.horaFin ? ` - ${evento.horaFin}` : ''}</p>
                        <p><i class="fas fa-map-marker-alt"></i> ${evento.lugar}</p>
                        <p>${evento.descripcion}</p>
                      </div>
                      <div class="evento-accion">
                        <div class="event-state">
                          <span class="${estadoClase}">
                            <i class="fas ${estadoIcono}"></i>
                            ${estadoTexto}
                          </span>
                        </div>
                        <div class="event-buttons">
                          ${botonHTML}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        } else {
          agendaHTML += `
            <div class="agenda-container">
              <div class="agenda-content">
                <div class="no-events-message">
                  <i class="fas fa-calendar-times"></i>
                  <h3>No hay eventos programados</h3>
                  <p>Actualmente no hay eventos en la agenda. Los eventos se mostrarán aquí cuando estén disponibles.</p>
                </div>
              </div>
            </div>
          `;
        }
        
        agendaContent.innerHTML = agendaHTML;
      } else {
        // Si hay error en la respuesta de eventos
        console.error('Error en respuesta de eventos:', eventosRes.status, eventosRes.statusText);
        agendaContent.innerHTML = `
          <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar la agenda</h3>
            <p>No se pudo cargar la información de eventos. Código de error: ${eventosRes.status}</p>
            <button onclick="loadAgendaContent()" class="btn-retry">
              <i class="fas fa-redo"></i> Intentar de nuevo
            </button>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error loading agenda:', err);
      agendaContent.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error de conexión</h3>
          <p>No se pudo conectar con el servidor para cargar la agenda.</p>
          <p><strong>Detalles:</strong> ${err.message}</p>
          <button onclick="loadAgendaContent()" class="btn-retry">
            <i class="fas fa-redo"></i> Intentar de nuevo
          </button>
        </div>
      `;
    }
  }

  // Cargar contenido de la pestaña Menú
  async function loadMenuContent() {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;

    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        menuContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La selección de menú está actualmente bloqueada y no está disponible para modificaciones.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la selección esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const menuResponse = await fetch('/api/menu');
      const menu = await menuResponse.json();
      
      // Obtener la selección actual del usuario
      const userResponse = await fetch('/api/invitado', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const userData = await userResponse.json();
      
      let menuHTML = `
        <div class="menu-container">
          
          <!-- Mostrar selección actual si existe -->
          ${userData.seleccionMenu ? `
            <div class="current-selection">
              <h3><i class="fas fa-check-circle"></i> Tu selección actual</h3>
              <div class="selection-item">
                <span class="selection-label">Entrante:</span>
                <span class="selection-value">${userData.seleccionMenu.entrante || 'No seleccionado'}</span>
              </div>
              <div class="selection-item">
                <span class="selection-label">Plato principal:</span>
                <span class="selection-value">${userData.seleccionMenu.principal || 'No seleccionado'}</span>
              </div>
              <div class="selection-item">
                <span class="selection-label">Postre:</span>
                <span class="selection-value">${userData.seleccionMenu.postre || 'No seleccionado'}</span>
              </div>

              ${userData.seleccionMenu.alergias ? `
                <div class="selection-item">
                  <span class="selection-label">Alergias:</span>
                  <span class="selection-value">${userData.seleccionMenu.alergias}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="menu-content">
            <form id="menuForm">
              <div class="form-group">
                <label for="entrante">
                  <i class="fas fa-appetizers"></i>
                  Entrante
                </label>
                <select id="entrante" name="entrante" required>
                  <option value="">Selecciona un entrante</option>
                  ${(menu.entrantes || []).map(entrante => `<option value="${entrante.nombre}">${entrante.nombre}</option>`).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label for="principal">
                  <i class="fas fa-drumstick-bite"></i>
                  Plato principal
                </label>
                <select id="principal" name="principal" required>
                  <option value="">Selecciona un plato principal</option>
                  ${(menu.principales || []).map(principal => `<option value="${principal.nombre}">${principal.nombre}</option>`).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label for="postre">
                  <i class="fas fa-ice-cream"></i>
                  Postre
                </label>
                <select id="postre" name="postre" required>
                  <option value="">Selecciona un postre</option>
                  ${(menu.postres || []).map(postre => `<option value="${postre.nombre}">${postre.nombre}</option>`).join('')}
                </select>
              </div>
              

              <div class="form-group">
                <label for="alergias">
                  <i class="fas fa-exclamation-triangle"></i>
                  Alergias, patologías y otras consideraciones
                </label>
                <input type="text" id="alergias" name="alergias" placeholder="Ej: Sin frutos secos, celiaquía, intolerancia a la lactosa...">
              </div>
              
              <button type="submit" class="submit-btn">
                <i class="fas fa-save"></i>
                Guardar selección
              </button>
            </form>
            
            <div id="menuMessage" class="message"></div>
          </div>
        </div>
      `;
      
      menuContent.innerHTML = menuHTML;
      
      // Pre-llenar el formulario con la selección actual si existe
      if (userData.seleccionMenu) {
        if (userData.seleccionMenu.entrante) {
          document.getElementById('entrante').value = userData.seleccionMenu.entrante;
        }
        if (userData.seleccionMenu.principal) {
          document.getElementById('principal').value = userData.seleccionMenu.principal;
        }
        if (userData.seleccionMenu.postre) {
          document.getElementById('postre').value = userData.seleccionMenu.postre;
        }

        if (userData.seleccionMenu.alergias) {
          document.getElementById('alergias').value = userData.seleccionMenu.alergias;
        }
      }
      
      // Agregar event listener al formulario
      const menuForm = document.getElementById('menuForm');
      if (menuForm) {
        menuForm.addEventListener('submit', handleMenuSubmit);
      }
      
    } catch (err) {
      console.error('Error loading menu:', err);
      menuContent.innerHTML = `
        <div class="menu-container">
          <div class="menu-header">
            <h1>${translate('guests:menuSelection')}</h1>
            <p>Error al cargar el menú. Por favor, intenta de nuevo.</p>
          </div>
        </div>
      `;
    }
  }

  // Cargar contenido de la pestaña Mensajes
  function loadMensajesContent() {
    const mensajesContent = document.getElementById('mensajesContent');
    if (!mensajesContent) return;

    mensajesContent.innerHTML = `
      <div class="mensajes-form">
        <form id="mensajeFormTab">
          <div class="form-group">
            <label for="mensaje">
              <i class="fas fa-heart"></i> ${translate('guests:messageLabel')}
            </label>
            <textarea id="mensaje" name="mensaje" rows="6" placeholder="${translate('guests:messagePlaceholder')}" required></textarea>
          </div>
          <button type="submit" class="submit-btn">
            <i class="fas fa-paper-plane"></i> ${translate('guests:sendMessage')}
          </button>
        </form>
        <div id="mensajeStatus" class="message"></div>
      </div>
    `;

    // Agregar event listener al formulario
    document.getElementById('mensajeFormTab').addEventListener('submit', handleMensajeSubmit);
  }

  // Cargar y mostrar el status del menú
  async function cargarStatusMenu() {
    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      const menuStatusContent = document.getElementById('menuStatusContent');
      if (!menuStatusContent) return;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        menuStatusContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La información del menú está actualmente bloqueada y no está disponible.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la información esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const response = await fetch('/api/invitado', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const data = await response.json();
      
      if (response.ok && data.seleccionMenu) {
        const seleccion = data.seleccionMenu;
        menuStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tu selección actual</h4>
          <div class="menu-status-item">
            <span class="menu-status-label">Entrante:</span>
            <span class="menu-status-value">${seleccion.entrante || '<span class="no-selection">No seleccionado</span>'}</span>
          </div>
          <div class="menu-status-item">
            <span class="menu-status-label">Plato principal:</span>
            <span class="menu-status-value">${seleccion.principal || '<span class="no-selection">No seleccionado</span>'}</span>
          </div>
          <div class="menu-status-item">
            <span class="menu-status-label">Postre:</span>
            <span class="menu-status-value">${seleccion.postre || '<span class="no-selection">No seleccionado</span>'}</span>
          </div>
          ${seleccion.opcion ? `
          <div class="menu-status-item">
            <span class="menu-status-label">Opción especial:</span>
            <span class="menu-status-value">${seleccion.opcion}</span>
          </div>
          ` : ''}
          ${seleccion.alergias ? `
          <div class="menu-status-item">
            <span class="menu-status-label">Alergias:</span>
            <span class="menu-status-value">${seleccion.alergias}</span>
          </div>
          ` : ''}
        `;
      } else {
        menuStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de selección</h4>
          <p class="no-selection">Aún no has realizado tu selección de menú. Haz clic en la pestaña Menú para comenzar.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status del menú:', err);
    }
  }

  // Cargar y mostrar el status de la agenda
  async function cargarStatusAgenda() {
    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      const agendaStatusContent = document.getElementById('agendaStatusContent');
      if (!agendaStatusContent) return;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        agendaStatusContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La información de la agenda está actualmente bloqueada y no está disponible.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la información esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const [eventosRes, confirmacionesRes] = await Promise.all([
        fetch('/api/eventos'),
        fetch('/api/eventos/confirmaciones', {
          headers: { 'Authorization': token }
        })
      ]);
      
      const eventosData = await eventosRes.json();
      const data = await confirmacionesRes.json();
      
      if (confirmacionesRes.ok && data.confirmaciones && Object.keys(data.confirmaciones).length > 0) {
        const confirmaciones = data.confirmaciones;
        const eventos = eventosData.eventos || [];
        
        // Debug: Mostrar qué datos llegan
        console.log('Eventos completos:', eventos);
        console.log('Confirmaciones recibidas:', confirmaciones);
        
        // Crear un mapa de eventos por ID para obtener los nombres
        const eventosMap = {};
        eventos.forEach(evento => {
          eventosMap[evento.id] = evento;
        });
        
        console.log('Mapa de eventos creado:', eventosMap);
        
        // Filtrar solo eventos confirmados y que existan en la agenda
        const eventosConfirmados = Object.keys(confirmaciones)
          .filter(eventoId => {
            const confirmado = confirmaciones[eventoId] === true;
            const existeEnAgenda = eventosMap[eventoId];
            console.log(`Evento ${eventoId}: confirmado=${confirmado}, existeEnAgenda=${!!existeEnAgenda}`);
            return confirmado && existeEnAgenda;
          });
        
        console.log('Eventos confirmados y válidos:', eventosConfirmados);
        
        if (eventosConfirmados.length > 0) {
          agendaStatusContent.innerHTML = `
            <h4><i class="fas fa-check-circle"></i> Tus confirmaciones de eventos</h4>
            ${eventosConfirmados.map(eventoId => {
              const evento = eventosMap[eventoId];
              return `
                <div class="agenda-status-item">
                  <span class="agenda-status-label">${evento.titulo}:</span>
                  <span class="agenda-status-value">Confirmado</span>
                </div>
              `;
            }).join('')}
          `;
        } else {
          agendaStatusContent.innerHTML = `
            <h4><i class="fas fa-info-circle"></i> Estado de confirmaciones</h4>
            <p class="no-selection">Aún no has confirmado tu asistencia a ningún evento. Haz clic en la pestaña Agenda para comenzar.</p>
          `;
        }
      } else {
        agendaStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de confirmaciones</h4>
          <p class="no-selection">Aún no has confirmado tu asistencia a ningún evento. Haz clic en la pestaña Agenda para comenzar.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status de la agenda:', err);
      const agendaStatusContent = document.getElementById('agendaStatusContent');
      if (agendaStatusContent) {
        agendaStatusContent.innerHTML = `
          <h4><i class="fas fa-exclamation-triangle"></i> Error al cargar confirmaciones</h4>
          <p class="no-selection">No se pudo cargar el estado de tus confirmaciones. Intenta recargar la página.</p>
        `;
      }
    }
  }

  // Cargar y mostrar el status de regalos
  async function cargarStatusRegalos() {
    // Gifts (non-cash) have been removed from the site; skip loading status
    return;
  //
    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      const regalosStatusContent = document.getElementById('regalosStatusContent');
      if (!regalosStatusContent) return;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        regalosStatusContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La información de regalos está actualmente bloqueada y no está disponible.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la información esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const response = await fetch('/api/regalos', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const regalos = await response.json();
      
      // Obtener el email del usuario actual
      const userEmail = localStorage.getItem('email');
      
      // Filtrar solo los regalos reservados por el usuario actual
      const regalosReservadosPorMi = regalos.filter(regalo => regalo.reservadoPor === userEmail);
      
      if (regalosReservadosPorMi.length > 0) {
        regalosStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tus regalos reservados</h4>
          ${regalosReservadosPorMi.map(regalo => `
            <div class="regalos-status-item">
              <span class="regalos-status-label">${regalo.nombre}:</span>
              <span class="regalos-status-value">Reservado</span>
            </div>
          `).join('')}
        `;
      } else {
        regalosStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de regalos</h4>
          <p class="no-selection">Aún no has reservado ningún regalo. Haz clic en la pestaña Regalos para ver la lista.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status de regalos:', err);
    }
  }

  // Cargar y mostrar el status de mensajes
  async function cargarStatusMensajes() {
    try {
      // Verificar estado de bloqueo primero
      const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
      const configBloqueo = await bloqueoRes.json();
      const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

      const mensajesStatusContent = document.getElementById('mensajesStatusContent');
      if (!mensajesStatusContent) return;

      // Si la agenda está bloqueada, mostrar mensaje de bloqueo
      if (agendaBloqueada) {
        mensajesStatusContent.innerHTML = `
          <div class="agenda-blocked-container">
            <div class="agenda-blocked-content">
              <div class="agenda-blocked-icon">
                <i class="fas fa-lock"></i>
              </div>
              <h2>Bloqueado temporalmente</h2>
              <p>La información de mensajes está actualmente bloqueada y no está disponible.</p>
              <div class="agenda-blocked-info">
                <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la información esté disponible.</p>
              </div>
            </div>
          </div>
        `;
        return;
      }

      // Si no está bloqueada, cargar contenido normal
      const response = await fetch('/api/mensajes', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const mensajes = await response.json();
      
      // Obtener el email del usuario actual
      const userEmail = localStorage.getItem('email');
      
      // Filtrar mensajes del usuario actual
      const misMensajes = mensajes.filter(mensaje => mensaje.email === userEmail);
      
      if (misMensajes.length > 0) {
        mensajesStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tus mensajes enviados</h4>
          ${misMensajes.map(mensaje => `
            <div class="mensajes-status-item">
              <div class="mensaje-info">
                <span class="mensaje-fecha">${new Date(mensaje.fecha).toLocaleDateString('es-ES')}</span>
                <span class="mensaje-texto">${mensaje.mensaje.substring(0, 100)}${mensaje.mensaje.length > 100 ? '...' : ''}</span>
              </div>
            </div>
          `).join('')}
        `;
      } else {
        mensajesStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de mensajes</h4>
          <p class="no-selection">Aún no has enviado ningún mensaje. Haz clic en la pestaña Mensajes para escribir uno.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status de mensajes:', err);
    }
  }

  // Manejadores de formularios
  async function handleMenuSubmit(e) {
    e.preventDefault();
    console.log('Formulario de menú enviado');
    
    const formData = new FormData(e.target);
    const menuData = Object.fromEntries(formData.entries());
    
    // Validar que los campos requeridos estén completos
    if (!menuData.entrante || !menuData.principal || !menuData.postre) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    console.log('Datos del menú a enviar:', menuData);

    try {
      const response = await fetch('/api/menu/seleccion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(menuData)
      });

      console.log('Respuesta del servidor:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Resultado del guardado:', result);
        showToast('Selección de menú guardada correctamente', 'success');
        
        // Actualizar el resumen y recargar el contenido del menú
        cargarStatusMenu();
        loadMenuContent();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        showToast(`Error al guardar el menú: ${errorData.message || 'Error desconocido'}`, 'error');
      }
    } catch (err) {
      console.error('Error saving menu:', err);
      showToast('Error de conexión al guardar el menú', 'error');
    }
  }

  async function handleMensajeSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const mensaje = formData.get('mensaje');

    try {
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ mensaje })
      });

      if (response.ok) {
        showToast('Mensaje enviado con éxito', 'success');
        e.target.reset();
      } else {
        showToast('Error al enviar el mensaje', 'error');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      showToast('Error de conexión', 'error');
    }
  }

  // Funciones globales para los botones
  window.confirmarEvento = async function(eventoId, confirmar) {
    try {
      const response = await fetch('/api/eventos/confirmar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ eventoId, confirmar })
      });

      if (response.ok) {
        showToast(confirmar ? 'Evento confirmado' : 'Confirmación cancelada', 'success');
        cargarStatusAgenda(); // Actualizar el resumen
        loadAgendaContent(); // Recargar la pestaña agenda
      } else {
        // Verificar si es un error de bloqueo
        if (response.status === 403) {
          const data = await response.json();
          showToast(`La agenda está bloqueada: ${data.error}`, 'error');
          // Recargar la agenda para mostrar el estado de bloqueo
          setTimeout(() => {
            loadAgendaContent();
          }, 1000);
        } else {
          showToast('Error al confirmar evento', 'error');
        }
      }
    } catch (err) {
      console.error('Error confirming event:', err);
      showToast('Error de conexión', 'error');
    }
  };

  window.reservarRegalo = async function(regaloId) {
    try {
      const response = await fetch('/api/regalos/reservar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ id: regaloId })
      });

      if (response.ok) {
        showToast('Regalo reservado con éxito', 'success');
        cargarStatusRegalos(); // Actualizar el resumen
        loadRegalosContent(); // Recargar la pestaña regalos
      } else {
        showToast('Error al reservar regalo', 'error');
      }
    } catch (err) {
      console.error('Error reserving gift:', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Función de logout
  window.logoutInvitado = function() {
    localStorage.removeItem('token');
    window.location.href = 'login-i18n.html';
  };

  // Agregar event listener al formulario estático de mensajes
  const mensajeFormStatic = document.getElementById('mensajeFormStatic');
  if (mensajeFormStatic) {
    mensajeFormStatic.addEventListener('submit', handleMensajeSubmit);
  }

  // Inicializar el sistema de pestañas
  initTabs();
  
  // Cargar estados iniciales
  cargarStatusMenu();
  cargarStatusAgenda();
  cargarStatusRegalos();
  cargarStatusEfectivo();
  cargarStatusMensajes();
});

// Función para cargar y mostrar el status de regalos en efectivo
async function cargarStatusEfectivo() {
  try {
    // Verificar estado de bloqueo primero
    const bloqueoRes = await fetch('/api/config/agenda/bloqueo');
    const configBloqueo = await bloqueoRes.json();
    const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;

    const efectivoStatusContent = document.getElementById('efectivoStatusContent');
    if (!efectivoStatusContent) return;

    // Si la agenda está bloqueada, mostrar mensaje de bloqueo
    if (agendaBloqueada) {
      efectivoStatusContent.innerHTML = `
        <div class="agenda-blocked-container">
          <div class="agenda-blocked-content">
            <div class="agenda-blocked-icon">
              <i class="fas fa-lock"></i>
            </div>
            <h2>Bloqueado temporalmente</h2>
            <p>La información de regalos en efectivo está actualmente bloqueada y no está disponible.</p>
            <div class="agenda-blocked-info">
              <p><i class="fas fa-info-circle"></i> Intenta acceder más tarde cuando la información esté disponible.</p>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Cash gifts have been removed; show N/A and return.
    const efectivoStatusContent = document.getElementById('efectivoStatusContent');
    if (efectivoStatusContent) {
      efectivoStatusContent.innerHTML = '<span class="no-gifts">N/A</span>';
    }
    return;

    if (false) {
      // Calcular total y fechas
      const totalAmount = regalosDelUsuario.reduce((sum, regalo) => sum + (regalo.amount / 100), 0);
      const lastGift = regalosDelUsuario.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
      
      // Formatear fecha del último regalo
      const lastGiftDate = new Date(lastGift.completedAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      efectivoStatusContent.innerHTML = `
        <h4><i class="fas fa-check-circle"></i> ${translate('guests:cashGiftsSummary')}</h4>
        <div class="efectivo-status-item">
          <span class="efectivo-status-label">${translate('guests:totalAmount')}</span>
          <span class="efectivo-status-value">€${totalAmount.toFixed(2)}</span>
        </div>
        <div class="efectivo-status-item">
          <span class="efectivo-status-label">${translate('guests:giftCount')}</span>
          <span class="efectivo-status-value">${regalosDelUsuario.length}</span>
        </div>
        <div class="efectivo-status-item">
          <span class="efectivo-status-label">${translate('guests:lastGift')}</span>
          <span class="efectivo-status-value">€${(lastGift.amount / 100).toFixed(2)} - ${lastGiftDate}</span>
        </div>
        
        <div style="margin-top: 15px;">
          <h5 style="margin-bottom: 10px; color: var(--primary-color);">${translate('guests:giftHistory') || 'Historial de regalos'}:</h5>
          ${regalosDelUsuario.map(regalo => `
            <div class="cash-gift-item">
              <div class="cash-gift-amount">€${(regalo.amount / 100).toFixed(2)}</div>
              <div class="cash-gift-date">
                <i class="fas fa-calendar"></i> ${new Date(regalo.completedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              ${regalo.donorMessage ? `
                <div class="cash-gift-message">
                  <i class="fas fa-quote-left"></i> "${regalo.donorMessage}"
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      efectivoStatusContent.innerHTML = `
        <div class="no-cash-gifts">
          <i class="fas fa-money-bill-wave"></i>
          <p>${translate('guests:noCashGifts')}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error al cargar regalos en efectivo:', error);
    const efectivoStatusContent = document.getElementById('efectivoStatusContent');
    if (efectivoStatusContent) {
      efectivoStatusContent.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error</h3>
          <p>No se pudo cargar la información de regalos en efectivo.</p>
        </div>
      `;
    }
  }
}
