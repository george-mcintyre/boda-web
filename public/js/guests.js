
// Configurar event listeners
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  console.log('DOM loaded, initializing i18n system...');

  // Show welcome message
  function showMessage(elementId, msg, type = 'error') {
    const element = document.getElementById(elementId);
    element.textContent = msg;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  // Function to show toast of confirmation
  function showToast(message, type = 'success') {
    // Create a toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    //Add to the body
    document.body.appendChild(toast);
    
    // Show with animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // Function to show custom confirmation
  function showConfirmDialog(message, onConfirm, onCancel) {
    // Create a confirmation overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-content">
          <i class="fas fa-question-circle"></i>
          <h3>Confirm action</h3>
          <p>${message}</p>
          <div class="confirm-buttons">
            <button class="btn-cancel-confirm">cancel</button>
            <button class="btn-confirm-action">confirm</button>
          </div>
        </div>
      </div>
    `;
    
    // Add to the body
    document.body.appendChild(overlay);
    
    // Show with animation
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
    
    // Close with Escape
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

  // Load and menu selections
  async function loadMenuSelections() {
    try {
      const response = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      });
      const data = await response.json();
      
      const menuStatusContent = document.getElementById('menuStatusContent');
      if (!menuStatusContent) return;
      
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
          <h4><i class="fas fa-info-circle"></i> Menu selections</h4>
          <p class="no-selection">Something went wrong with the menu selections. Please try again later.</p>
        `;
      }
    } catch (err) {
      console.error('Error al cargar el status del menú:', err);
    }
  }
  
    // Cargar y mostrar el status del RSVP
  async function cargarStatusRSVP() {
    try {
      // Obtener eventos y selecciones de RSVP
      const [eventsRes, guestRes] = await Promise.all([
        fetch('/api/event'),
        fetch('/api/invitado', {
          headers: { 'Authorization': token }
        })
      ]);
      
      const events = await eventsRes.json().catch(() => []);
      const guestData = await guestRes.json().catch(() => ({}));
      
      const agendaStatusContent = document.getElementById('agendaStatusContent');
      if (!agendaStatusContent) return;
      
      if (eventsRes.ok && events.length > 0) {
        // Mostrar eventos disponibles para RSVP
        agendaStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tus confirmaciones de eventos</h4>
          <p class="no-selection">Visita la pestaña RSVP para confirmar tu asistencia a cada evento.</p>
        `;
      } else {
        agendaStatusContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Estado de RSVP</h4>
          <p class="no-selection">Aún no hay eventos disponibles para confirmar asistencia.</p>
        `;
      }
    } catch (err) {
      console.error('Error loading the RSVP Status:', err);
    }
  }
  
  // Load and show the gift status
  async function loadStatusGifts() {
  }

// Load messages
  async function loadMessages() {
  }

  // Load menu content
  async function loadMenuContent() {
  }

  // Load events content
  async function loadEventsContent() {
  }

  // Load gifts content
  async function loadGiftsContent() {
  }

  // Load messages content
  async function loadMessagesContent() {
  }

  // Load menu content
  async function loadMenuContent() {
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
                loadMenuSelections(); // Actualizar el status en la pestaña resumen
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
   async function loadEventsContent() {
     const agendaContent = document.getElementById('agendaContent');
     
     try {
       const [agendaRes, guestRes] = await Promise.all([
         fetch('/api/event'),
         fetch('/api/invitado', {
           headers: { 'Authorization': token }
         })
       ]);
      
       const agenda = await agendaRes.json().catch(() => []);
       const guestData = await guestRes.json().catch(() => ({}));
       const confirmaciones = (guestRes.ok ? (guestData.confirmaciones || guestData.confirmacionesAgenda) : {}) || {};
       const agendaBloqueada = false;
       
       if (agendaRes.ok) {
         let agendaHTML = '';
         
         // Mostrar aviso de bloqueo si la agenda está bloqueada
         if (agendaBloqueada) {
           agendaHTML += `
             <div class="agenda-blocked-warning">
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
             <div class="agenda-day">
               <h3 class="day-title">
                 <i class="fas fa-calendar-day"></i>
                 ${dia}
               </h3>
               <div class="day-events">
           `;
           
           eventosPorDia[dia].forEach(evento => {
             const confirmado = confirmaciones && confirmaciones[evento.id];
             const statusText = confirmado ? 'Confirmado' : 'No confirmado';
             const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
             
             agendaHTML += `
               <div class="event-item">
                 <div class="agenda-event-info">
                   <h4 class="agenda-event-title">${evento.titulo}</h4>
                   <p class="agenda-event-description">${evento.descripcion}</p>
                   <p class="agenda-event-time">
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
   window.confirmEventAttendance = async (eventoId, confirmar) => {
     try {
       const res = await fetch('/api/event/confirm', {
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
   async function loadGiftsContent() {
     const regalosContent = document.getElementById('regalosContent');
     
     try {
       const regalosRes = await fetch('/api/invitado/regalos', {
         headers: { 'Authorization': token }
       });
       const regalos = await regalosRes.json();
       
       if (regalosRes.ok && Array.isArray(regalos)) {
         let regalosHTML = '<div class="gift-grid">';
         
         regalos.forEach(regalo => {
           const available = regalo.available - regalo.purchased;
           const isAvailable = available > 0;
           
           // Helper function to get image URL
           function getGiftImageUrl(gift) {
             if (!gift.image) return null;
             
             // Handle different image formats
             if (typeof gift.image === 'string') {
               // Base64 data or ObjectId
               if (gift.image.startsWith('data:')) {
                 return gift.image; // Already base64 encoded
               } else if (gift.image.length === 24 && /^[0-9a-fA-F]{24}$/.test(gift.image)) {
                 // ObjectId - use the image endpoint
                 return `/api/admin/gifts/${gift.id}/image/thumbnail`;
               } else {
                 return gift.image; // Legacy URL
               }
             } else if (gift.image && gift.image.data) {
               // Database-stored image with base64 data
               return gift.image;
             }
             
             return null;
           };
           
           const imageUrl = getGiftImageUrl(regalo);
           
           regalosHTML += `
             <div class="gift-card">
               <div class="gift-card-image">
                 <img src="${imageUrl || '/assets/images/placeholder-gift.jpg'}" alt="${regalo.name}" onerror="this.src='/assets/images/placeholder-gift.jpg';" />
               </div>
               <div class="gift-card-content">
                 <h4>${regalo.name}</h4>
                 <p class="gift-description">${regalo.description}</p>
                 <div class="gift-details">
                   <div class="gift-price">${regalo.priceDisplay}</div>
                   <div class="gift-availability">
                     <span class="available-count">${available} available</span>
                     <span class="purchased-count">${regalo.purchased} purchased</span>
                   </div>
                 </div>
                 <div class="gift-actions">
                   ${isAvailable ? `
                     <button onclick="comprarRegalo('${regalo.id}')" class="btn-buy-gift">
                       <i class="fas fa-gift"></i>
                       Purchase Gift
                     </button>
                   ` : `
                     <button disabled class="btn-disabled">
                       <i class="fas fa-times"></i>
                       Sold Out
                     </button>
                   `}
                 </div>
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

   // Load messages content
   async function loadMessagesContent() {
   }

   // Configure the messages form
   const messagesForm = document.getElementById('messagesForm');
   if (messagesForm) {
     messagesForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const message = messagesForm.message.value.trim();
       if (!message) return;
       
       try {
         const res = await fetch('/api/messages', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify({ mensaje })
         });
         const data = await res.json();
         if (res.ok) {
           showMessage('mensajeStatus', 'Mensaje enviado con éxito', 'success');
           showToast('Mensaje enviado con éxito');
           mensajeForm.reset();
           cargarMensajes();
         } else {
           showMessage('mensajeStatus', data.error || 'Error al enviar el mensaje.', 'error');
         }
       } catch (err) {
         showMessage('mensajeStatus', 'Error de conexión al enviar el mensaje.', 'error');
       }
     });
   }

   // Global function to reserve gifts
   window.reserveGift = async (giftId) => {
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

   // Global function to cancel gifts
   window.cancelGift = async (giftId) => {
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

   // Global function to buy gifts
   window.buyGift = async (giftId) => {
     try {
       const message = prompt('Leave a message with your gift (optional):');
       
       const res = await fetch('/api/invitado/create-payment-session', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': token
         },
         body: JSON.stringify({ giftId, message })
       });
       
       const data = await res.json();
       if (res.ok) {
         showToast('Gift added to cart! Redirecting to checkout...', 'success');
         // Redirect to checkout (implement based on your payment system)
         setTimeout(() => {
           window.open(data.checkoutUrl, '_blank');
           cargarContenidoRegalos(); // Recargar la lista de regalos
         }, 1000);
       } else {
         showToast(data.error || 'Error al procesar el regalo.', 'error');
       }
     } catch (err) {
       showToast('Error de conexión al procesar el regalo.', 'error');
     }
   };

   // Global logout function
  window.logoutGuest = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    window.location.href = 'login.html';
  };
  
  // Main function
  try {
    const response = await fetch('/api/guest/profile', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const name = data.name || data.name || 'guest';
      console.log(`Welcome, ${name}!`);
    } else {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error connecting to the server.');
  }

  // Tabs functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      //Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to the clicked button and its content
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // If the tab is menu, load the menu content
      if (targetTab === 'menu') {
        loadMenuContent();
      }
      
      // If the tab is events, load the events content
      if (targetTab === 'events') {
        loadEventsContent();
      }
      
      // If the tab is gifts, load the gifts content
      if (targetTab === 'gifts') {
        loadGiftsContent();
      }
      
      // If the tab is messages, load the messages content
      if (targetTab === 'messages') {
        loadMessagesContent();
      }
      
      // If the tab is summary, reload all the status data
      if (targetTab === 'summary') {
        loadSummaryContent();
      }

    });
  });

  // Load preferred language
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang && languages[savedLang]) {
    currentLanguage = savedLang;
  }
  
  // Initialize
  updateDocumentDirection();
  updatePageContent();
  updateLanguageSelector();
  updateFormatting();
  
  console.log(`i18n system initialized, language: ${currentLanguage}`);
});

