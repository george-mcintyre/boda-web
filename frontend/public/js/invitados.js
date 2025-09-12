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

  // Cargar y mostrar el status del menú
  async function cargarStatusMenu() {
    try {
      const response = await fetch('/api/invitado', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const data = await response.json();
      
      const menuStatusContent = document.getElementById('menuStatusContent');
      
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
          <p class="no-selection">Aún no has realizado tu selección de menú. Haz clic en el botón de arriba para comenzar.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status del menú:', err);
    }
  }
  
  // Cargar el status del menú
  cargarStatusMenu();

  // Mostrar mensaje de bienvenida
  try {
    const response = await fetch('/api/invitado', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const data = await response.json();
    if (response.ok) {
      // Mostrar nombre del invitado en algún lugar si es necesario
      console.log(`Bienvenido, ${data.nombre}!`);
    } else {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error de conexión con el servidor.');
  }

    // Cargar y mostrar el status de la agenda
  async function cargarStatusAgenda() {
    try {
      // Obtener tanto la agenda como las confirmaciones
      const [agendaRes, confirmacionesRes] = await Promise.all([
        fetch('/api/agenda'),
        fetch('/api/agenda/confirmaciones', {
          headers: { 'Authorization': token }
        })
      ]);
      
      const agenda = await agendaRes.json();
      const data = await confirmacionesRes.json();
      
      const agendaStatusContent = document.getElementById('agendaStatusContent');
      
      if (confirmacionesRes.ok && data.confirmaciones && Object.keys(data.confirmaciones).length > 0) {
        const confirmaciones = data.confirmaciones;
        
        // Crear un mapa de eventos por ID para obtener los nombres
        const eventosMap = {};
        agenda.forEach(evento => {
          eventosMap[evento.id] = evento;
        });
        
        agendaStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tus confirmaciones de eventos</h4>
          ${Object.keys(confirmaciones).map(eventoId => {
            const confirmado = confirmaciones[eventoId];
            const evento = eventosMap[eventoId];
            const statusText = confirmado ? 'Confirmado' : 'No confirmado';
            const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
            
            return `
              <div class="agenda-status-item">
                <span class="agenda-status-label">${evento ? evento.titulo : `Evento ${eventoId}`}:</span>
                <span class="agenda-status-value">
                  <span class="status-badge ${statusClass}">${statusText}</span>
                </span>
              </div>
            `;
          }).join('')}
        `;
      } else {
        agendaStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de agenda</h4>
          <p class="no-selection">Aún no has confirmado ningún evento. Haz clic en el botón de arriba para ver la agenda.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status de la agenda:', err);
    }
  }
  
  // Cargar el status de la agenda
  cargarStatusAgenda();

  // Cargar el status de regalos
  cargarStatusRegalos();

  // Función global para confirmar eventos (ya no se usa en esta página)
  // window.confirmarEvento = async (eventoId, confirmado) => { ... };

  // Cargar agenda inicial (ya no se usa en esta página)
  // cargarAgenda();

  // Cargar y mostrar el status de regalos
  async function cargarStatusRegalos() {
    try {
      const response = await fetch('/api/regalos');
      const regalos = await response.json();
      
      const regalosStatusContent = document.getElementById('regalosStatusContent');
      
      if (response.ok && regalos.length > 0) {
        const userEmail = localStorage.getItem('email');
        let totalRegalos = regalos.length;
        let regalosReservados = 0;
        
        // Filtrar los regalos reservados por el usuario actual
        const misRegalos = regalos.filter(regalo => regalo.reservadoPor === userEmail);
        
        regalos.forEach(regalo => {
          if (regalo.reservadoPor) {
            regalosReservados++;
          }
        });
        
        if (misRegalos.length > 0) {
          regalosStatusContent.innerHTML = `
            <h4><i class="fas fa-gift"></i> Mis regalos reservados</h4>
            <div class="regalos-lista">
              ${misRegalos.map(regalo => `
                <div class="regalo-item">
                  <i class="fas fa-gift"></i>
                  <span class="regalo-nombre">${regalo.nombre}</span>
                  ${regalo.descripcion ? `<span class="regalo-descripcion">${regalo.descripcion}</span>` : ''}
                </div>
              `).join('')}
            </div>
            <div class="regalos-stats">
              <div class="regalos-status-item">
                <span class="regalos-status-label">Regalos disponibles:</span>
                <span class="regalos-status-value">${totalRegalos - regalosReservados}</span>
              </div>
              <div class="regalos-status-item">
                <span class="regalos-status-label">Total de regalos:</span>
                <span class="regalos-status-value">${totalRegalos}</span>
              </div>
            </div>
          `;
        } else {
          regalosStatusContent.innerHTML = `
            <h4><i class="fas fa-info-circle"></i> Estado de regalos</h4>
            <p class="no-selection">Aún no has reservado ningún regalo. Haz clic en el botón de arriba para ver la lista de regalos disponibles.</p>
            <div class="regalos-stats">
              <div class="regalos-status-item">
                <span class="regalos-status-label">Regalos disponibles:</span>
                <span class="regalos-status-value">${totalRegalos - regalosReservados}</span>
              </div>
              <div class="regalos-status-item">
                <span class="regalos-status-label">Total de regalos:</span>
                <span class="regalos-status-value">${totalRegalos}</span>
              </div>
            </div>
          `;
        }
      } else {
        regalosStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de regalos</h4>
          <p class="no-selection">No hay regalos disponibles en este momento.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status de regalos:', err);
    }
  }



  // Cargar mensajes del invitado actual
  async function cargarMensajes() {
    try {
      const res = await fetch('/api/mensajes');
      const mensajes = await res.json();
      const mensajesDiv = document.getElementById('mensajesContent');
      
      if (res.ok && mensajes.length > 0) {
        // Obtener el email del usuario actual
        const userEmail = localStorage.getItem('email');
        
        // Filtrar solo los mensajes del usuario actual
        const misMensajes = mensajes.filter(m => m.email === userEmail);
        
        if (misMensajes.length > 0) {
          mensajesDiv.innerHTML = `
            <h4><i class="fas fa-comments"></i> Mis mensajes enviados</h4>
            <div class="mensajes-grid">
              ${misMensajes.map(m => `
                <div class="mensaje-card">
                  <div class="mensaje-header">
                    <span class="mensaje-autor">${m.nombre}</span>
                    <span class="mensaje-fecha">${new Date(m.fecha).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div class="mensaje-contenido">${m.mensaje}</div>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          mensajesDiv.innerHTML = '<p class="no-mensajes">Aún no has enviado ningún mensaje. Haz clic en el botón de arriba para enviar tu primer mensaje.</p>';
        }
      } else {
        mensajesDiv.innerHTML = '<p class="no-mensajes">Aún no hay mensajes. ¡Sé el primero en dejar uno!</p>';
      }
    } catch (err) {
      document.getElementById('mensajesContent').innerHTML = '<p class="error">Error de conexión al cargar los mensajes.</p>';
    }
  }

  // Cargar mensajes iniciales
  cargarMensajes();

  // Funcionalidad de pestañas
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remover clase active de todos los botones y contenidos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Añadir clase active al botón clickeado y su contenido
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // Si se activa la pestaña de menú, cargar el contenido del menú
      if (targetTab === 'menu') {
        cargarContenidoMenu();
      }
      
      // Si se activa la pestaña de agenda, cargar el contenido de la agenda
      if (targetTab === 'agenda') {
        cargarContenidoAgenda();
      }
      
      // Si se activa la pestaña de regalos, cargar el contenido de regalos
      if (targetTab === 'regalos') {
        cargarContenidoRegalos();
      }
      
      // Si se activa la pestaña de mensajes, cargar el contenido de mensajes
      if (targetTab === 'mensajes') {
        cargarContenidoMensajes();
      }
      
      // Si se activa la pestaña de resumen, recargar todos los datos del status
      if (targetTab === 'resumen') {
        cargarStatusMenu();
        cargarStatusAgenda();
        cargarStatusRegalos();
        cargarMensajes();
      }

    });
  });

  // Función para cargar el contenido del menú en la pestaña
  async function cargarContenidoMenu() {
    const menuContent = document.getElementById('menuContent');
    
    try {
      // Obtener el menú disponible
      const menuResponse = await fetch('/api/menu');
      const menu = await menuResponse.json();
      
      // Obtener la selección actual del usuario
      const userResponse = await fetch('/api/invitado', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const userData = await userResponse.json();
      
      let menuHTML = `
        <div class="menu-form">
          <form id="menuForm">
            <div class="form-group">
              <label for="entrante">
                <i class="fas fa-appetizers"></i>
                Entrante
              </label>
              <select id="entrante" name="entrante" required>
                <option value="">Selecciona un entrante</option>
                ${menu.entrantes.map(entrante => `<option value="${entrante}">${entrante}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="principal">
                <i class="fas fa-drumstick-bite"></i>
                Plato principal
              </label>
              <select id="principal" name="principal" required>
                <option value="">Selecciona un plato principal</option>
                ${menu.principales.map(principal => `<option value="${principal}">${principal}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="postre">
                <i class="fas fa-ice-cream"></i>
                Postre
              </label>
              <select id="postre" name="postre" required>
                <option value="">Selecciona un postre</option>
                ${menu.postres.map(postre => `<option value="${postre}">${postre}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="opcion">
                <i class="fas fa-leaf"></i>
                Opción especial (si aplica)
              </label>
              <select id="opcion" name="opcion">
                <option value="">Ninguna</option>
                <option value="Vegano">Vegano</option>
                <option value="Sin gluten">Sin gluten</option>
                <option value="Sin lactosa">Sin lactosa</option>
                <option value="Sin frutos secos">Sin frutos secos</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="alergias">
                <i class="fas fa-exclamation-triangle"></i>
                Alergias o patologías alimentarias
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
      `;
      
      // Si el usuario ya tiene una selección, mostrarla
      if (userResponse.ok && userData.seleccionMenu) {
        const seleccion = userData.seleccionMenu;
        menuHTML = `
          <div class="current-selection">
            <h3><i class="fas fa-check-circle"></i> Tu selección actual</h3>
            <div class="selection-item">
              <span class="selection-label">Entrante:</span>
              <span class="selection-value">${seleccion.entrante || 'No seleccionado'}</span>
            </div>
            <div class="selection-item">
              <span class="selection-label">Plato principal:</span>
              <span class="selection-value">${seleccion.principal || 'No seleccionado'}</span>
            </div>
            <div class="selection-item">
              <span class="selection-label">Postre:</span>
              <span class="selection-value">${seleccion.postre || 'No seleccionado'}</span>
            </div>
            ${seleccion.opcion ? `
            <div class="selection-item">
              <span class="selection-label">Opción especial:</span>
              <span class="selection-value">${seleccion.opcion}</span>
            </div>
            ` : ''}
            ${seleccion.alergias ? `
            <div class="selection-item">
              <span class="selection-label">Alergias:</span>
              <span class="selection-value">${seleccion.alergias}</span>
            </div>
            ` : ''}
          </div>
        ` + menuHTML;
      }
      
      menuContent.innerHTML = menuHTML;
      
      // Configurar el formulario del menú
      const menuForm = document.getElementById('menuForm');
      if (menuForm) {
        menuForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(menuForm);
          const seleccion = {
            entrante: formData.get('entrante'),
            principal: formData.get('principal'),
            postre: formData.get('postre'),
            opcion: formData.get('opcion'),
            alergias: formData.get('alergias')
          };
          
                     try {
             const res = await fetch('/api/menu/seleccion', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': token
               },
               body: JSON.stringify(seleccion)
             });
            
            const data = await res.json();
            if (res.ok) {
              showMessage('menuMessage', data.mensaje, 'success');
              setTimeout(() => {
                cargarContenidoMenu(); // Recargar para mostrar la selección actual
                cargarStatusMenu(); // Actualizar el status en la pestaña resumen
              }, 1000);
            } else {
              showMessage('menuMessage', data.error || 'Error al guardar la selección.', 'error');
            }
          } catch (err) {
            showMessage('menuMessage', 'Error de conexión al guardar la selección.', 'error');
          }
        });
      }
      
      // Si el usuario ya tiene una selección, preseleccionar los valores
      if (userResponse.ok && userData.seleccionMenu) {
        const seleccion = userData.seleccionMenu;
        if (seleccion.entrante) document.getElementById('entrante').value = seleccion.entrante;
        if (seleccion.principal) document.getElementById('principal').value = seleccion.principal;
        if (seleccion.postre) document.getElementById('postre').value = seleccion.postre;
        if (seleccion.opcion) document.getElementById('opcion').value = seleccion.opcion;
        if (seleccion.alergias) document.getElementById('alergias').value = seleccion.alergias;
      }
      
         } catch (err) {
       menuContent.innerHTML = '<p class="error">Error al cargar el menú.</p>';
     }
   }

   // Función para cargar el contenido de la agenda en la pestaña
   async function cargarContenidoAgenda() {
     const agendaContent = document.getElementById('agendaContent');
     
     try {
       const [agendaRes, confirmacionesRes, bloqueoRes] = await Promise.all([
         fetch('/api/agenda'),
         fetch('/api/agenda/confirmaciones', {
           headers: { 'Authorization': token }
         }),
         fetch('/api/config/agenda/bloqueo')
       ]);
       
       const agenda = await agendaRes.json();
       const confirmacionesData = await confirmacionesRes.json();
       const confirmaciones = confirmacionesData.confirmaciones || confirmacionesData;
       const configBloqueo = await bloqueoRes.json();
       const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;
       
       if (agendaRes.ok) {
         let agendaHTML = '';
         
         // Mostrar aviso de bloqueo si la agenda está bloqueada
         if (agendaBloqueada) {
           agendaHTML += `
             <div class="agenda-bloqueada-warning">
               <div class="warning-content">
                 <i class="fas fa-lock"></i>
                 <h3>Agenda Bloqueada</h3>
                 <p>La agenda de eventos está actualmente bloqueada y no se pueden realizar cambios en las confirmaciones.</p>
                 ${configBloqueo.agenda.motivoBloqueo ? `<p><strong>Motivo:</strong> ${configBloqueo.agenda.motivoBloqueo}</p>` : ''}
                 ${configBloqueo.agenda.fechaBloqueo ? `<p><strong>Bloqueada desde:</strong> ${new Date(configBloqueo.agenda.fechaBloqueo).toLocaleString('es-ES')}</p>` : ''}
               </div>
             </div>
           `;
         }
         
         // Mostrar confirmaciones actuales si existen
         if (confirmaciones && Object.keys(confirmaciones).length > 0) {
           agendaHTML += `
             <div class="current-confirmations">
               <h3><i class="fas fa-check-circle"></i> Tus confirmaciones actuales</h3>
               <div class="confirmation-summary">
           `;
           
           Object.keys(confirmaciones).forEach(eventoId => {
             const confirmado = confirmaciones[eventoId];
             const statusText = confirmado ? 'Confirmado' : 'No confirmado';
             const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
             
             agendaHTML += `
               <div class="confirmation-item">
                 <span class="confirmation-label">Evento ${eventoId}:</span>
                 <span class="confirmation-value">
                   <span class="status-badge ${statusClass}">${statusText}</span>
                 </span>
               </div>
             `;
           });
           
           agendaHTML += '</div></div>';
         }
         
         // Mostrar la agenda de eventos
         agendaHTML += '<div class="agenda-content">';
         
         // Agrupar eventos por día
         const eventosPorDia = {};
         agenda.forEach(evento => {
           const fecha = new Date(evento.fecha);
           const dia = fecha.toLocaleDateString('es-ES', { 
             weekday: 'long', 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric' 
           });
           
           if (!eventosPorDia[dia]) {
             eventosPorDia[dia] = [];
           }
           eventosPorDia[dia].push(evento);
         });
         
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
             const confirmado = confirmaciones && confirmaciones[evento.id];
             const statusText = confirmado ? 'Confirmado' : 'No confirmado';
             const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
             
             agendaHTML += `
               <div class="evento-item">
                 <div class="evento-info">
                   <h4 class="evento-titulo">${evento.titulo}</h4>
                   <p class="evento-descripcion">${evento.descripcion}</p>
                   <p class="evento-hora">
                     <i class="fas fa-clock"></i>
                     ${new Date(evento.fecha).toLocaleTimeString('es-ES', { 
                       hour: '2-digit', 
                       minute: '2-digit' 
                     })}
                   </p>
                 </div>
                 <div class="evento-acciones">
                   <span class="status-badge ${statusClass}">${statusText}</span>
                   ${agendaBloqueada ? `
                     <button disabled class="btn-disabled" title="Agenda bloqueada">
                       <i class="fas fa-lock"></i>
                       Bloqueado
                     </button>
                   ` : `
                     <button onclick="confirmarEvento('${evento.id}', ${!confirmado})" class="${confirmado ? 'btn-cancelar' : 'btn-confirmar'}">
                       ${confirmado ? 'Cancelar' : 'Confirmar'}
                     </button>
                   `}
                 </div>
               </div>
             `;
           });
           
           agendaHTML += '</div></div>';
         });
         
         agendaHTML += '</div>';
         agendaContent.innerHTML = agendaHTML;
         
       } else {
         agendaContent.innerHTML = '<p class="error">Error al cargar la agenda.</p>';
       }
     } catch (err) {
       agendaContent.innerHTML = '<p class="error">Error de conexión al cargar la agenda.</p>';
     }
   }

   // Función global para confirmar eventos
   window.confirmarEvento = async (eventoId, confirmar) => {
     try {
       const res = await fetch('/api/agenda/confirmar', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ eventoId, confirmar })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast(data.mensaje, 'success');
         setTimeout(() => {
           cargarContenidoAgenda(); // Recargar la agenda
           cargarStatusAgenda(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         // Verificar si es un error de bloqueo
         if (res.status === 403) {
           showToast(`La agenda está bloqueada: ${data.error}`, 'error');
           // Recargar la agenda para mostrar el estado de bloqueo
           setTimeout(() => {
             cargarContenidoAgenda();
           }, 1000);
         } else {
           showToast(data.error || 'Error al confirmar el evento.', 'error');
         }
       }
     } catch (err) {
       showToast('Error de conexión al confirmar el evento.', 'error');
     }
   };

   // Función para cargar el contenido de regalos en la pestaña
   async function cargarContenidoRegalos() {
     const regalosContent = document.getElementById('regalosContent');
     
     try {
       const regalosRes = await fetch('/api/regalos');
       const regalos = await regalosRes.json();
       
       if (regalosRes.ok) {
         const userEmail = localStorage.getItem('email');
         
         let regalosHTML = '<div class="regalos-grid">';
         
         regalos.forEach(regalo => {
           const esMio = regalo.reservadoPor === userEmail;
           const estaReservado = regalo.reservadoPor && regalo.reservadoPor !== userEmail;
           
           regalosHTML += `
             <div class="regalo-card ${esMio ? 'reservado-por-mi' : ''}">
               <div class="regalo-info">
                 <h4>${regalo.nombre}</h4>
                 <p>${regalo.descripcion}</p>
                 ${regalo.enlace ? `
                   <a href="${regalo.enlace}" target="_blank" class="regalo-enlace">
                     <i class="fas fa-external-link-alt"></i>
                     Ver en tienda
                   </a>
                 ` : ''}
               </div>
               <div class="regalo-accion">
                 ${esMio ? `
                   <span class="status-badge status-confirmado">Reservado por ti</span>
                   <button onclick="cancelarRegalo('${regalo.id}')" class="btn-cancelar">
                     <i class="fas fa-times"></i>
                     Cancelar
                   </button>
                 ` : estaReservado ? `
                   <span class="status-badge status-no-confirmado">Reservado por otro</span>
                   <button disabled class="btn-disabled">
                     <i class="fas fa-lock"></i>
                     No disponible
                   </button>
                 ` : `
                   <span class="status-badge status-available">Disponible</span>
                   <button onclick="reservarRegalo('${regalo.id}')" class="btn-confirmar">
                     <i class="fas fa-gift"></i>
                     Reservar
                   </button>
                 `}
               </div>
             </div>
           `;
         });
         
         regalosHTML += '</div>';
         regalosContent.innerHTML = regalosHTML;
         
       } else {
         regalosContent.innerHTML = '<p class="error">Error al cargar la lista de regalos.</p>';
       }
     } catch (err) {
       regalosContent.innerHTML = '<p class="error">Error de conexión al cargar la lista de regalos.</p>';
     }
   }

   // Función para cargar el contenido de mensajes en la pestaña
   async function cargarContenidoMensajes() {
     // La funcionalidad de mensajes ya está implementada en el HTML
     // No necesitamos cargar contenido adicional
   }

   // Configurar el formulario de mensajes
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

   // Función global para reservar regalos
   window.reservarRegalo = async (regaloId) => {
     try {
       const res = await fetch('/api/regalos/reservar', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ id: regaloId })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast(data.mensaje, 'success');
         setTimeout(() => {
           cargarContenidoRegalos(); // Recargar la lista de regalos
           cargarStatusRegalos(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         showToast(data.error || 'Error al reservar el regalo.', 'error');
       }
     } catch (err) {
       showToast('Error de conexión al reservar el regalo.', 'error');
     }
   };

   // Función global para cancelar regalos
   window.cancelarRegalo = async (regaloId) => {
     try {
       const res = await fetch('/api/regalos/cancelar', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ id: regaloId })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast(data.mensaje, 'success');
         setTimeout(() => {
           cargarContenidoRegalos(); // Recargar la lista de regalos
           cargarStatusRegalos(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         showToast(data.error || 'Error al cancelar el regalo.', 'error');
       }
     } catch (err) {
       showToast('Error de conexión al cancelar el regalo.', 'error');
     }
   };

   // Función de logout
  window.logoutInvitado = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('nombre');
  localStorage.removeItem('email');
  window.location.href = 'login.html';
  };
}); 