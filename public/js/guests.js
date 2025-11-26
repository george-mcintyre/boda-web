
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
    console.log('Loading menu selections...');
    try {
      // Get party members and menu data in parallel
      const [partyResponse, menuResponse, menuChoicesResponse] = await Promise.all([
        fetch('/api/guest/party', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/menu', {
          method: 'GET',
          headers: { 'Authorization': token }
        }),
        fetch('/api/guest/menu-choices', {
          method: 'GET',
          headers: { 'Authorization': token }
        })
      ]);

      const partyData = await partyResponse.json();
      const menuData = await menuResponse.json();
      const menuChoicesData = menuChoicesResponse.ok ? await menuChoicesResponse.json() : [];

      const menuContent = document.getElementById('menuContent');
      if (!menuContent) return;

      if (!partyResponse.ok || !menuResponse.ok) {
        menuContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Menu selections</h4>
          <p class="no-selection">Error loading menu data. Please try again later.</p>
        `;
        return;
      }

      // Group courses by type using the menu data (which already contains all options)
      const coursesByType = {};
      menuData.forEach(course => {
        if (!coursesByType[course.course]) {
          coursesByType[course.course] = [];
        }
        coursesByType[course.course].push(course);
      });

      // Create menu cards for each party member
      let menuHTML = '';
      
      partyData.forEach(member => {
        const memberChoices = menuChoicesData.find(choice => 
          choice.partyGuestId === member.id || choice.partyGuestId === `primary-${member.id}`
        ) || { choices: [], specialRequest: null };

        menuHTML += `
          <div class="menu-card">
            <h4 class="menu-card-title">
              <i class="fas fa-utensils"></i>
              Menu for ${member.name}
            </h4>
            <div class="menu-sections">
        `;

        // Define the order of course types
        const courseTypes = ['starter', 'main', 'dessert', 'drinks'];
        const courseLabels = {
          starter: 'Starters',
          main: 'Main Course',
          dessert: 'Desserts',
          drinks: 'Drinks'
        };

        courseTypes.forEach(courseType => {
          const courses = coursesByType[courseType] || [];
          
          menuHTML += `
            <div class="menu-section">
              <h5 class="section-title">
                <i class="fas fa-${courseType === 'starter' ? ' appetizers' : courseType === 'main' ? 'drumstick-bite' : courseType === 'dessert' ? 'ice-cream' : 'cocktail'}"></i>
                ${courseLabels[courseType]}
              </h5>
          `;

          courses.forEach(course => {
            const courseOptions = course.options || [];
            
            // Find existing choice for this course, or select first option if no choice made
            const selectedChoice = memberChoices.choices.find(choice => choice.courseId === course.id);
            let selectedOptionId = null;
            
            if (selectedChoice) {
              // Choice exists, use the selected option
              selectedOptionId = selectedChoice.optionId;
            } else if (course.selectionRequired && courseOptions.length > 0) {
              // No choice made (404 case), select first option by default
              selectedOptionId = courseOptions[0].id;
            }
            
            menuHTML += `
              <div class="course-card">
                <h6 class="course-title">${course.label}</h6>
                <div class="options-container">
            `;

            courseOptions.forEach((option, optionIndex) => {
              const isSelected = selectedOptionId === option.id;
              const radioName = `menu-${member.id}-${course.id}`;
              const hasImage = option.image && (option.image.startsWith('data:') || option.image.length === 24);
              
              menuHTML += `
                <div class="option-card ${isSelected ? 'selected' : ''}">
                  ${hasImage ? `
                    <div class="option-image">
                      <img src="${option.image}" alt="${option.label}" onerror="this.parentElement.style.display='none';" />
                    </div>
                  ` : ''}
                  <div class="option-content">
                    <div class="option-header">
                      <label for="${radioName}-${optionIndex}" class="option-label">
                        ${option.label}
                        ${option.dietaryIcons ? `<span class="dietary-icons">${option.dietaryIcons}</span>` : ''}
                      </label>
                      ${course.selectionRequired ? `
                        <input 
                          type="radio" 
                          id="${radioName}-${optionIndex}" 
                          name="${radioName}" 
                          value="${option.id}"
                          ${isSelected ? 'checked' : ''}
                          onchange="saveMenuSelection('${member.id}', '${course.id}', '${option.id}')"
                        />
                      ` : ''}
                    </div>
                    ${option.description ? `
                      <p class="option-description">${option.description}</p>
                    ` : ''}
                  </div>
                </div>
              `;
            });

            menuHTML += `
                </div>
              </div>
            `;
          });

          menuHTML += `</div>`;
        });

        // Add special requests section
        menuHTML += `
          <div class="special-requests">
            <h5 class="section-title">
              <i class="fas fa-exclamation-triangle"></i>
              Special Requests
            </h5>
            <div class="special-request-options">
              <select name="special-request-${member.id}" onchange="saveSpecialRequest('${member.id}', this.value)">
                <option value="">None</option>
                <option value="vegan" ${memberChoices.specialRequest === 'vegan' ? 'selected' : ''}>Vegan</option>
                <option value="vegetarian" ${memberChoices.specialRequest === 'vegetarian' ? 'selected' : ''}>Vegetarian</option>
                <option value="nut allergy" ${memberChoices.specialRequest === 'nut allergy' ? 'selected' : ''}>Nut Allergy</option>
                <option value="other" ${memberChoices.specialRequest === 'other' ? 'selected' : ''}>Other</option>
              </select>
              ${memberChoices.specialRequestDetail ? `
                <textarea 
                  placeholder="Please specify..." 
                  name="special-request-detail-${member.id}"
                  onchange="saveSpecialRequestDetail('${member.id}', this.value)"
                >${memberChoices.specialRequestDetail}</textarea>
              ` : `
                <textarea 
                  placeholder="Please specify..." 
                  name="special-request-detail-${member.id}"
                  style="display: none;"
                  onchange="saveSpecialRequestDetail('${member.id}', this.value)"
                ></textarea>
              `}
            </div>
          </div>
        `;

        menuHTML += `
            </div>
          </div>
        `;
      });

      menuContent.innerHTML = menuHTML || `
        <p class="no-selection">No party members found.</p>
      `;

      console.log('Menu selections loaded successfully');

    } catch (err) {
      console.error('Error loading menu selections:', err);
      const menuContent = document.getElementById('menuContent');
      if (menuContent) {
        menuContent.innerHTML = `
          <h4><i class="fas fa-info-circle"></i> Menu selections</h4>
          <p class="no-selection">Error loading menu data. Please try again later.</p>
        `;
      }
    }
  }

  // Save menu selection function
  window.saveMenuSelection = async (partyGuestId, courseId, optionId) => {
    try {
      const currentChoices = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      }).then(res => res.json());

      // Find or create choice for this party member
      let memberChoices = currentChoices.find(choice => 
        choice.partyGuestId === partyGuestId
      );

      if (!memberChoices) {
        memberChoices = {
          partyGuestId: partyGuestId,
          choices: []
        };
        currentChoices.push(memberChoices);
      }

      // Remove existing choice for this course and add new one
      memberChoices.choices = memberChoices.choices.filter(choice => choice.courseId !== courseId);
      memberChoices.choices.push({ courseId, optionId });

      // Update on server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: currentChoices })
      });

      if (response.ok) {
        showToast('Menu selection saved successfully!', 'success');
      } else {
        showToast('Error saving menu selection', 'error');
      }
    } catch (err) {
      console.error('Error saving menu selection:', err);
      showToast('Error saving menu selection', 'error');
    }
  };

  // Save special request function
  window.saveSpecialRequest = async (partyGuestId, specialRequest) => {
    try {
      const currentChoices = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      }).then(res => res.json());

      // Find or create choice for this party member
      let memberChoices = currentChoices.find(choice => 
        choice.partyGuestId === partyGuestId
      );

      if (!memberChoices) {
        memberChoices = {
          partyGuestId: partyGuestId,
          choices: []
        };
        currentChoices.push(memberChoices);
      }

      memberChoices.specialRequest = specialRequest || null;
      if (specialRequest !== 'other') {
        memberChoices.specialRequestDetail = null;
      }

      // Update on server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: currentChoices })
      });

      if (response.ok) {
        showToast('Special request saved successfully!', 'success');
        
        // Show/hide detail textarea based on selection
        const detailTextarea = document.querySelector(`textarea[name="special-request-detail-${partyGuestId}"]`);
        if (detailTextarea) {
          detailTextarea.style.display = specialRequest === 'other' ? 'block' : 'none';
        }
      } else {
        showToast('Error saving special request', 'error');
      }
    } catch (err) {
      console.error('Error saving special request:', err);
      showToast('Error saving special request', 'error');
    }
  };

  // Save special request detail function
  window.saveSpecialRequestDetail = async (partyGuestId, specialRequestDetail) => {
    try {
      const currentChoices = await fetch('/api/guest/menu-choices', {
        method: 'GET',
        headers: { 'Authorization': token }
      }).then(res => res.json());

      // Find or create choice for this party member
      let memberChoices = currentChoices.find(choice => 
        choice.partyGuestId === partyGuestId
      );

      if (!memberChoices) {
        memberChoices = {
          partyGuestId: partyGuestId,
          choices: []
        };
        currentChoices.push(memberChoices);
      }

      memberChoices.specialRequestDetail = specialRequestDetail || null;

      // Update on server
      const response = await fetch('/api/guest/menu-choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ choices: currentChoices })
      });

      if (response.ok) {
        showToast('Special request details saved successfully!', 'success');
      } else {
        showToast('Error saving special request details', 'error');
      }
    } catch (err) {
      console.error('Error saving special request details:', err);
      showToast('Error saving special request details', 'error');
    }
  };
  
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
      
      const eventStatusContent = document.getElementById('eventStatusContent');
      if (!eventStatusContent) return;
      
      if (eventsRes.ok && events.length > 0) {
        // Mostrar eventos disponibles para RSVP
        eventStatusContent.innerHTML = `
          <h4><i class="fas fa-check-circle"></i> Tus confirmaciones de eventos</h4>
          <p class="no-selection">Visita la pestaña RSVP para confirmar tu asistencia a cada evento.</p>
        `;
      } else {
        eventStatusContent.innerHTML = `
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

  // Load gifts content
  async function loadGiftsContent() {
  }

  // Load messages content
  async function loadMessagesContent() {
  }

   // Function to load the events content in the events tab
   async function loadEventsContent() {
     const eventsContent = document.getElementById('eventsContent');
     
     try {
       const [eventsRes, eventChoicesRes] = await Promise.all([
         fetch('/api/guest/events',{
          method: 'GET',
          headers: { 'Authorization': token }
         }),
         fetch('/api/guest/event-choices', {
           method: 'GET',
           headers: { 'Authorization': token }
         })
       ]);
      
       const events = await eventsRes.json().catch(() => []);
       const eventChoices = await eventChoicesRes.json().catch(() => ({}));
       
       if (events) {
         events.forEach(event => {
           console.out(event);
         });
         
         let eventHTML = '';
         
         // Mostrar confirmaciones actuales si existen
         if (confirmations && Object.keys(confirmations).length > 0) {
           eventHTML += `
             <div class="current-confirmations">
               <h3><i class="fas fa-check-circle"></i> Tus confirmaciones actuales</h3>
               <div class="confirmation-summary">
           `;
           
           Object.keys(confirmations).forEach(eventoId => {
             const confirmado = confirmations[eventoId];
             const statusText = confirmado ? 'Confirmado' : 'No confirmado';
             const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
             
             eventHTML += `
               <div class="confirmation-item">
                 <span class="confirmation-label">Evento ${eventoId}:</span>
                 <span class="confirmation-value">
                   <span class="status-badge ${statusClass}">${statusText}</span>
                 </span>
               </div>
             `;
           });
           
           eventHTML += '</div></div>';
         }
         
         // Mostrar la event de eventos
         eventHTML += '<div class="event-content">';
         
         // Agrupar eventos por día
         const eventosPorDia = {};
         events.forEach(evento => {
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
           eventHTML += `
             <div class="event-day">
               <h3 class="day-title">
                 <i class="fas fa-calendar-day"></i>
                 ${dia}
               </h3>
               <div class="day-events">
           `;
           
           eventosPorDia[dia].forEach(evento => {
             const confirmado = confirmations && confirmations[evento.id];
             const statusText = confirmado ? 'Confirmado' : 'No confirmado';
             const statusClass = confirmado ? 'status-confirmado' : 'status-no-confirmado';
             
             eventHTML += `
               <div class="event-item">
                 <div class="event-event-info">
                   <h4 class="event-event-title">${evento.titulo}</h4>
                   <p class="event-event-description">${evento.descripcion}</p>
                   <p class="event-event-time">
                     <i class="fas fa-clock"></i>
                     ${new Date(evento.fecha).toLocaleTimeString('es-ES', { 
                       hour: '2-digit', 
                       minute: '2-digit' 
                     })}
                   </p>
                 </div>
                 <div class="evento-acciones">
                   <span class="status-badge ${statusClass}">${statusText}</span>
                   ${eventBloqueada ? `
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
           
           eventHTML += '</div></div>';
         });
         
         eventHTML += '</div>';
         eventsContent.innerHTML = eventHTML;
         
       } else {
         eventsContent.innerHTML = '<p class="error">Error al cargar la event.</p>';
       }
     } catch (err) {
       eventsContent.innerHTML = '<p class="error">Error de conexión al cargar la event.</p>';
     }
   }

   // Global function to confirm events
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
           cargarContenidoAgenda(); // Recargar la event
           cargarStatusAgenda(); // Actualizar el status en la pestaña resumen
         }, 1000);
       } else {
         // Verificar si es un error de bloqueo
         if (res.status === 403) {
           showToast(`La event está bloqueada: ${data.error}`, 'error');
           // Recargar la event para mostrar el estado de bloqueo
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

   // Function to load the gifts content in the gifts tab
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
        loadMenuSelections();
      }
      
      // If the tab is events, load the events content
      if (targetTab === 'agenda') {
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

