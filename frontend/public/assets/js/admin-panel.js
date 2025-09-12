document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos desde localStorage o usar datos de ejemplo
    let invitadosData = JSON.parse(localStorage.getItem('invitadosData')) || [
        { id: 1, nombre: 'Ana García', email: 'ana.garcia@email.com', estado: 'confirmado', acompañantes: 1, menu: 'Sin alergias' },
        { id: 2, nombre: 'Juan Pérez', email: 'juan.perez@email.com', estado: 'confirmado', acompañantes: 0, menu: 'Vegetariano' },
        { id: 3, nombre: 'Marta López', email: 'marta.lopez@email.com', estado: 'pendiente', acompañantes: 0, menu: 'Sin especificar' },
        { id: 4, nombre: 'Carlos Ruiz', email: 'carlos.ruiz@email.com', estado: 'rechazado', acompañantes: 0, menu: 'Sin especificar' },
    ];

    const mensajesData = [
        { id: 1, autor: 'Ana García', fecha: '25/07/2025', mensaje: '¡Qué alegría! No podemos esperar a celebrar con vosotros. ¡Todo lo mejor para los dos!' },
        { id: 2, autor: 'Juan Pérez', fecha: '26/07/2025', mensaje: '¡Nos vemos en la boda! Gracias por la invitación.' },
    ];

    const agendaData = [
        { id: 1, titulo: 'Ceremonia en la Iglesia', hora: '12:00h', lugar: 'Iglesia de San Miguel', estado: 'confirmado' },
        { id: 2, titulo: 'Sesión de fotos', hora: '13:30h', lugar: 'Jardines de la Iglesia', estado: 'confirmado' },
        { id: 3, titulo: 'Cóctel y aperitivos', hora: '14:00h', lugar: 'Palacio de los Duques', estado: 'confirmado' },
        { id: 4, titulo: 'Banquete nupcial', hora: '15:30h', lugar: 'Palacio de los Duques', estado: 'confirmado' },
        { id: 5, titulo: 'Primer baile y fiesta', hora: '18:00h', lugar: 'Palacio de los Duques', estado: 'confirmado' },
    ];

    const regalosData = [
        { id: 1, articulo: 'Licuadora de alta potencia', estado: 'disponible', reservadoPor: '' },
        { id: 2, articulo: 'Set de sartenes de titanio', estado: 'reservado', reservadoPor: 'Ana García' },
        { id: 3, articulo: 'Experiencia gastronómica', estado: 'disponible', reservadoPor: '' },
        { id: 4, articulo: 'Viaje a la luna de miel', estado: 'reservado', reservadoPor: 'Familia Pérez' },
    ];

    // Funciones para cargar los datos en el HTML
    function cargarEstadisticas() {
        const totalGuests = invitadosData.length;
        const confirmedGuests = invitadosData.filter(i => i.estado === 'confirmado').length;
        const declinedGuests = invitadosData.filter(i => i.estado === 'rechazado').length;
        const pendingGuests = invitadosData.filter(i => i.estado === 'pendiente').length;
        const specialMenuGuests = invitadosData.filter(i => i.menu !== 'Sin alergias' && i.menu !== 'Sin especificar').length;

        document.getElementById('totalGuests').textContent = totalGuests;
        document.getElementById('confirmedGuests').textContent = confirmedGuests;
        document.getElementById('declinedGuests').textContent = declinedGuests;
        document.getElementById('pendingGuests').textContent = pendingGuests;
        document.getElementById('specialMenuGuests').textContent = specialMenuGuests;
    }

    function cargarInvitados() {
        const tbody = document.getElementById('guestsTableBody');
        tbody.innerHTML = '';
        
        // Ordenar invitados alfabéticamente por nombre
        const invitadosOrdenados = [...invitadosData].sort((a, b) => 
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
        
        invitadosOrdenados.forEach(invitado => {
            let badgeClass;
            switch(invitado.estado) {
                case 'confirmado': badgeClass = 'status-confirmed'; break;
                case 'rechazado': badgeClass = 'status-declined'; break;
                default: badgeClass = 'status-pending';
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${invitado.nombre}</strong></td>
                <td>${invitado.email}</td>
                <td><span class="status-badge ${badgeClass}">${invitado.estado}</span></td>
                <td>${invitado.acompañantes}</td>
                <td>${invitado.menu}</td>
                <td>
                    <button class="small-btn edit-btn" title="Editar" onclick="editarInvitado(${invitado.id})"><i class="fas fa-edit"></i></button>
                    <button class="small-btn delete-btn" title="Eliminar" onclick="eliminarInvitado(${invitado.id})"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function cargarMensajes() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        mensajesData.forEach(mensaje => {
            const card = document.createElement('div');
            card.className = 'message-card';
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-author">${mensaje.autor}</span>
                    <span class="message-date">${mensaje.fecha}</span>
                </div>
                <p class="message-content">${mensaje.mensaje}</p>
            `;
            container.appendChild(card);
        });
    }

    async function cargarAgenda() {
        const container = document.getElementById('agendaContainer');
        container.innerHTML = '<div class="loading">Cargando agenda...</div>';
        
        try {
            const [agendaRes, bloqueoRes] = await Promise.all([
                fetch('/api/admin/agenda'),
                fetch('/api/config/agenda/bloqueo')
            ]);
            
            const agenda = await agendaRes.json();
            const configBloqueo = await bloqueoRes.json();
            const agendaBloqueada = configBloqueo.agenda && configBloqueo.agenda.bloqueada;
            
            container.innerHTML = '';
            
            // Agregar controles de bloqueo
            const bloqueoHTML = `
                <div class="agenda-controls">
                    <div class="bloqueo-section">
                        <h4><i class="fas fa-lock"></i> Control de Bloqueo de Agenda</h4>
                        <div class="bloqueo-status">
                            <span class="status-label">Estado actual:</span>
                            <span class="status-value ${agendaBloqueada ? 'bloqueada' : 'desbloqueada'}">
                                ${agendaBloqueada ? 'BLOQUEADA' : 'DESBLOQUEADA'}
                            </span>
                        </div>
                        ${agendaBloqueada ? `
                            <div class="bloqueo-info">
                                <p><strong>Motivo:</strong> ${configBloqueo.agenda.motivoBloqueo || 'No especificado'}</p>
                                <p><strong>Bloqueada desde:</strong> ${new Date(configBloqueo.agenda.fechaBloqueo).toLocaleString('es-ES')}</p>
                            </div>
                        ` : ''}
                        <div class="bloqueo-actions">
                            ${agendaBloqueada ? `
                                <button onclick="desbloquearAgenda()" class="btn-desbloquear">
                                    <i class="fas fa-unlock"></i> Desbloquear Agenda
                                </button>
                            ` : `
                                <button onclick="mostrarModalBloqueo()" class="btn-bloquear">
                                    <i class="fas fa-lock"></i> Bloquear Agenda
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = bloqueoHTML;
            
            // Mostrar eventos de la agenda
            if (agenda && agenda.length > 0) {
                const eventosHTML = `
                    <div class="agenda-events">
                        <h4><i class="fas fa-calendar-alt"></i> Eventos de la Agenda</h4>
                        <div class="events-list">
                            ${agenda.map(evento => `
                                <div class="evento-item">
                                    <div class="evento-info">
                                        <h5>${evento.titulo}</h5>
                                        <p><i class="fas fa-calendar"></i> ${evento.dia} - ${evento.hora}</p>
                                        <p><i class="fas fa-map-marker-alt"></i> ${evento.lugar}</p>
                                        ${evento.descripcion ? `<p>${evento.descripcion}</p>` : ''}
                                    </div>
                                    <div class="evento-actions">
                                        <button class="small-btn edit-btn" onclick="editarEvento(${evento.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="small-btn delete-btn" onclick="eliminarEvento(${evento.id})">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                container.innerHTML += eventosHTML;
            } else {
                container.innerHTML += '<p>No hay eventos en la agenda.</p>';
            }
            
        } catch (error) {
            console.error('Error cargando agenda:', error);
            container.innerHTML = '<p class="error">Error al cargar la agenda.</p>';
        }
    }

    function cargarRegalos() {
        const tbody = document.getElementById('giftsTableBody');
        tbody.innerHTML = '';
        regalosData.forEach(regalo => {
            let statusBadgeClass = '';
            let statusText = '';
            let reservadoPor = regalo.reservadoPor;

            if (regalo.estado === 'disponible') {
                statusBadgeClass = 'status-available';
                statusText = 'Disponible';
                reservadoPor = '—';
            } else if (regalo.estado === 'reservado') {
                statusBadgeClass = 'status-reserved';
                statusText = 'Reservado';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${regalo.articulo}</td>
                <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
                <td>${reservadoPor}</td>
                <td>
                    <button class="small-btn edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="small-btn delete-btn"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Funcionalidad de las pestañas
    const tabs = document.querySelectorAll('.adminTab');
    const sections = document.querySelectorAll('.admin-content');
    const loadingIndicator = document.getElementById('loadingIndicator');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            sections.forEach(s => s.style.display = 'none');
            
            loadingIndicator.style.display = 'block';

            // Simular carga de datos
            setTimeout(() => {
                loadingIndicator.style.display = 'none';
                const contentId = tab.id.replace('Tab', 'Content');
                document.getElementById(contentId).style.display = 'block';
                
                // Cargar datos según la pestaña
                switch(contentId) {
                    case 'statsContent': cargarEstadisticas(); break;
                    case 'guestsContent': cargarInvitados(); break;
                    case 'messagesContent': cargarMensajes(); break;
                    case 'agendaContent': cargarAgenda(); break;
                    case 'giftsContent': cargarRegalos(); break;
                }
            }, 500); // Retardo de 500ms para simular carga
        });
    });

    // Cargar la primera pestaña al inicio
    cargarEstadisticas();
    
    // Debug: Verificar que las funciones estén disponibles
    console.log('Funciones disponibles:', {
        addInvitado: typeof window.addInvitado,
        closeModal: typeof window.closeModal,
        saveInvitado: typeof saveInvitado
    });

    // Funcionalidad del botón de logout
    document.getElementById('logoutAdmin').addEventListener('click', () => {
        alert('Cerrando sesión. Volviendo a la página principal.');
        window.location.href = 'index.html';
    });

    // Función para añadir invitado
    window.addInvitado = () => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h3><i class="fas fa-user-plus"></i> Añadir Nuevo Invitado</h3>
              <button onclick="closeModal()" class="modal-close">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <form id="addInvitadoForm">
                <div class="form-group">
                  <label for="nombre">Nombre completo *</label>
                  <input type="text" id="nombre" name="nombre" required>
                </div>
                <div class="form-group">
                  <label for="email">Email *</label>
                  <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                  <label for="estado">Estado de asistencia</label>
                  <select id="estado" name="estado">
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="confirmado">✅ Confirmado</option>
                    <option value="rechazado">❌ No asistirá</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="acompañantes">Número de acompañantes</label>
                  <input type="number" id="acompañantes" name="acompañantes" min="0" max="5" value="0">
                </div>
                <div class="form-group">
                  <label for="menu">Menú especial</label>
                  <select id="menu" name="menu">
                    <option value="Sin alergias">Sin alergias</option>
                    <option value="Vegetariano">Vegetariano</option>
                    <option value="Vegano">Vegano</option>
                    <option value="Sin gluten">Sin gluten</option>
                    <option value="Sin lactosa">Sin lactosa</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="notas">Notas adicionales</label>
                  <textarea id="notas" name="notas" rows="3" placeholder="Alergias, preferencias especiales, etc."></textarea>
                </div>
                <div class="form-actions">
                  <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
                  <button type="submit" class="btn-primary">
                    <i class="fas fa-save"></i> Guardar Invitado
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Manejar el envío del formulario
        document.getElementById('addInvitadoForm').addEventListener('submit', (e) => {
          e.preventDefault();
          saveInvitado();
        });
    };
    
    // Función para cerrar el modal
    window.closeModal = () => {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
          modal.remove();
        }
    };
    
    // Función para guardar el invitado
    function saveInvitado() {
        const form = document.getElementById('addInvitadoForm');
        const formData = new FormData(form);
        
        const nuevoInvitado = {
          id: Date.now(), // ID temporal
          nombre: formData.get('nombre'),
          email: formData.get('email'),
          estado: formData.get('estado'),
          acompañantes: parseInt(formData.get('acompañantes')) || 0,
          menu: formData.get('menu'),
          notas: formData.get('notas') || ''
        };
        
        // Validaciones básicas
        if (!nuevoInvitado.nombre || !nuevoInvitado.email) {
          alert('Por favor, completa los campos obligatorios (nombre y email).');
          return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(nuevoInvitado.email)) {
          alert('Por favor, introduce un email válido.');
          return;
        }
        
        // Validar que el email no esté duplicado
        const emailExists = invitadosData.some(inv => inv.email === nuevoInvitado.email);
        if (emailExists) {
          alert('Ya existe un invitado con ese email. Por favor, usa un email diferente.');
          return;
        }
        
        // Añadir el nuevo invitado a los datos locales
        invitadosData.push(nuevoInvitado);
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('invitadosData', JSON.stringify(invitadosData));
        
        // Mostrar mensaje de éxito
        alert(`Invitado "${nuevoInvitado.nombre}" añadido correctamente.`);
        
        // Cerrar modal y recargar la lista
        closeModal();
        cargarInvitados(); // Recargar la lista de invitados
        cargarEstadisticas(); // Actualizar estadísticas
    }

    // Función para editar invitado
    window.editarInvitado = (id) => {
        console.log('Función editarInvitado llamada con ID:', id);
        const invitado = invitadosData.find(inv => inv.id === id);
        if (!invitado) {
            alert('Invitado no encontrado.');
            return;
        }
        console.log('Invitado encontrado:', invitado);

        // Crear el modal con estilos inline para asegurar visibilidad
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        modal.innerHTML = `
          <div style="
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 0;
          ">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1.5rem 2rem;
              border-bottom: 1px solid rgba(139, 90, 150, 0.1);
              background: #f8f9fa;
              border-radius: 12px 12px 0 0;
            ">
              <h3 style="margin: 0; color: #8B5A96; display: flex; align-items: center; gap: 0.8rem; font-size: 1.3rem;">
                <i class="fas fa-user-edit"></i> Editar Invitado
              </h3>
              <button onclick="closeModal()" style="
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #6c757d;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 6px;
                transition: all 0.3s ease;
              ">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div style="padding: 2rem;">
              <form id="editInvitadoForm">
                <div style="margin-bottom: 1.5rem;">
                  <label for="editNombre" style="display: block; font-weight: 600; color: #2C1810; margin-bottom: 0.5rem; font-size: 0.95rem;">Nombre completo *</label>
                  <input type="text" id="editNombre" name="nombre" value="${invitado.nombre}" required style="
                    width: 100%;
                    padding: 0.8rem 1rem;
                    border: 2px solid #E8E0E8;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    background: white;
                    transition: all 0.3s ease;
                    color: #2C1810;
                  ">
                </div>
                <div style="margin-bottom: 1.5rem;">
                  <label for="editEmail" style="display: block; font-weight: 600; color: #2C1810; margin-bottom: 0.5rem; font-size: 0.95rem;">Email *</label>
                  <input type="email" id="editEmail" name="email" value="${invitado.email}" required style="
                    width: 100%;
                    padding: 0.8rem 1rem;
                    border: 2px solid #E8E0E8;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    background: white;
                    transition: all 0.3s ease;
                    color: #2C1810;
                  ">
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <label for="editEstado" style="display: block; font-weight: 600; color: #2C1810; margin-bottom: 0.5rem; font-size: 0.95rem;">Estado de asistencia</label>
                  <select id="editEstado" name="estado" style="
                    width: 100%;
                    padding: 0.8rem 1rem;
                    border: 2px solid #E8E0E8;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    background: white;
                    transition: all 0.3s ease;
                    color: #2C1810;
                  ">
                    <option value="pendiente" ${invitado.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                    <option value="confirmado" ${invitado.estado === 'confirmado' ? 'selected' : ''}>✅ Confirmado</option>
                    <option value="rechazado" ${invitado.estado === 'rechazado' ? 'selected' : ''}>❌ No asistirá</option>
                  </select>
                </div>
                <div style="margin-bottom: 1.5rem;">
                  <label for="editAcompañantes" style="display: block; font-weight: 600; color: #2C1810; margin-bottom: 0.5rem; font-size: 0.95rem;">Número de acompañantes</label>
                  <input type="number" id="editAcompañantes" name="acompañantes" min="0" max="5" value="${invitado.acompañantes || 0}" style="
                    width: 100%;
                    padding: 0.8rem 1rem;
                    border: 2px solid #E8E0E8;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    background: white;
                    transition: all 0.3s ease;
                    color: #2C1810;
                  ">
                </div>
                <div style="margin-bottom: 1.5rem;">
                  <label for="editMenu" style="display: block; font-weight: 600; color: #2C1810; margin-bottom: 0.5rem; font-size: 0.95rem;">Menú especial</label>
                  <select id="editMenu" name="menu" style="
                    width: 100%;
                    padding: 0.8rem 1rem;
                    border: 2px solid #E8E0E8;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    background: white;
                    transition: all 0.3s ease;
                    color: #2C1810;
                  ">
                    <option value="Sin alergias" ${invitado.menu === 'Sin alergias' ? 'selected' : ''}>Sin alergias</option>
                    <option value="Vegetariano" ${invitado.menu === 'Vegetariano' ? 'selected' : ''}>Vegetariano</option>
                    <option value="Vegano" ${invitado.menu === 'Vegano' ? 'selected' : ''}>Vegano</option>
                    <option value="Sin gluten" ${invitado.menu === 'Sin gluten' ? 'selected' : ''}>Sin gluten</option>
                    <option value="Sin lactosa" ${invitado.menu === 'Sin lactosa' ? 'selected' : ''}>Sin lactosa</option>
                    <option value="Otro" ${invitado.menu === 'Otro' ? 'selected' : ''}>Otro</option>
                  </select>
                </div>
                <div style="margin-bottom: 1.5rem;">
                  <label for="editNotas" style="display: block; font-weight: 600; color: #2C1810; margin-bottom: 0.5rem; font-size: 0.95rem;">Notas adicionales</label>
                  <textarea id="editNotas" name="notas" rows="3" placeholder="Alergias, preferencias especiales, etc." style="
                    width: 100%;
                    padding: 0.8rem 1rem;
                    border: 2px solid #E8E0E8;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-family: 'Inter', sans-serif;
                    background: white;
                    transition: all 0.3s ease;
                    color: #2C1810;
                    resize: vertical;
                  ">${invitado.notas || ''}</textarea>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(139, 90, 150, 0.1);">
                  <button type="button" onclick="closeModal()" style="
                    padding: 0.8rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.95rem;
                    min-width: 120px;
                    justify-content: center;
                    background: #6c757d;
                    color: white;
                  ">Cancelar</button>
                  <button type="submit" style="
                    padding: 0.8rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.95rem;
                    min-width: 120px;
                    justify-content: center;
                    background: linear-gradient(135deg, #8B5A96 0%, #D4A5A5 100%);
                    color: white;
                  ">
                    <i class="fas fa-save"></i> Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Modal agregado al DOM con estilos inline');
        
        // Manejar el envío del formulario de edición
        document.getElementById('editInvitadoForm').addEventListener('submit', (e) => {
          e.preventDefault();
          guardarEdicionInvitado(id);
        });
    };

    // Función para guardar la edición del invitado
    function guardarEdicionInvitado(id) {
        const form = document.getElementById('editInvitadoForm');
        const formData = new FormData(form);
        
        const invitadoEditado = {
          id: id,
          nombre: formData.get('nombre'),
          email: formData.get('email'),
          estado: formData.get('estado'),
          acompañantes: parseInt(formData.get('acompañantes')) || 0,
          menu: formData.get('menu'),
          notas: formData.get('notas') || ''
        };
        
        // Validaciones básicas
        if (!invitadoEditado.nombre || !invitadoEditado.email) {
          alert('Por favor, completa los campos obligatorios (nombre y email).');
          return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(invitadoEditado.email)) {
          alert('Por favor, introduce un email válido.');
          return;
        }
        
        // Validar que el email no esté duplicado (excluyendo el invitado actual)
        const emailExists = invitadosData.some(inv => inv.email === invitadoEditado.email && inv.id !== id);
        if (emailExists) {
          alert('Ya existe otro invitado con ese email. Por favor, usa un email diferente.');
          return;
        }
        
        // Actualizar el invitado en los datos locales
        const index = invitadosData.findIndex(inv => inv.id === id);
        if (index !== -1) {
          invitadosData[index] = invitadoEditado;
          
          // Guardar en localStorage para persistencia
          localStorage.setItem('invitadosData', JSON.stringify(invitadosData));
          
          // Mostrar mensaje de éxito
          alert(`Invitado "${invitadoEditado.nombre}" actualizado correctamente.`);
          
          // Cerrar modal y recargar la lista
          closeModal();
          cargarInvitados(); // Recargar la lista de invitados
          cargarEstadisticas(); // Actualizar estadísticas
        } else {
          alert('Error: No se pudo encontrar el invitado para editar.');
        }
    }

    // Función para eliminar invitado
    window.eliminarInvitado = (id) => {
        const invitado = invitadosData.find(inv => inv.id === id);
        if (!invitado) {
            alert('Invitado no encontrado.');
            return;
        }

        // Mostrar confirmación antes de eliminar
        if (confirm(`¿Estás seguro de que quieres eliminar a "${invitado.nombre}" de la lista de invitados?\n\nEsta acción no se puede deshacer.`)) {
            // Eliminar el invitado de los datos locales
            invitadosData = invitadosData.filter(inv => inv.id !== id);
            
            // Guardar en localStorage para persistencia
            localStorage.setItem('invitadosData', JSON.stringify(invitadosData));
            
            // Mostrar mensaje de éxito
            alert(`Invitado "${invitado.nombre}" eliminado correctamente.`);
            
            // Recargar la lista y estadísticas
            cargarInvitados();
            cargarEstadisticas();
        }
    };

    // ===== FUNCIONES PARA GESTIÓN DE BLOQUEO DE AGENDA =====

    // Función para mostrar modal de bloqueo
    window.mostrarModalBloqueo = () => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h3><i class="fas fa-lock"></i> Bloquear Agenda de Eventos</h3>
              <button onclick="closeModal()" class="modal-close">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <form id="bloquearAgendaForm">
                <div class="form-group">
                  <label for="motivoBloqueo">Motivo del bloqueo *</label>
                  <textarea id="motivoBloqueo" name="motivoBloqueo" rows="4" placeholder="Explica el motivo por el cual se bloquea la agenda (ej: Finalización de confirmaciones, Preparación de la boda, etc.)" required></textarea>
                </div>
                <div class="form-group">
                  <label>
                    <input type="checkbox" id="confirmarBloqueo" required>
                    Confirmo que quiero bloquear la agenda de eventos
                  </label>
                  <p class="form-help">
                    <i class="fas fa-info-circle"></i>
                    Al bloquear la agenda, los invitados no podrán modificar sus confirmaciones de eventos.
                  </p>
                </div>
                <div class="form-actions">
                  <button type="button" onclick="closeModal()" class="btn-secondary">Cancelar</button>
                  <button type="submit" class="btn-primary">
                    <i class="fas fa-lock"></i> Bloquear Agenda
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Manejar el envío del formulario
        document.getElementById('bloquearAgendaForm').addEventListener('submit', (e) => {
          e.preventDefault();
          bloquearAgenda();
        });
    };

    // Función para bloquear agenda
    async function bloquearAgenda() {
        const form = document.getElementById('bloquearAgendaForm');
        const formData = new FormData(form);
        const motivoBloqueo = formData.get('motivoBloqueo');
        
        if (!motivoBloqueo.trim()) {
            alert('Por favor, especifica un motivo para el bloqueo.');
            return;
        }
        
        try {
            const response = await fetch('/api/config/agenda/bloqueo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'admin-token' // En un entorno real, usar el token real del admin
                },
                body: JSON.stringify({
                    bloqueada: true,
                    motivoBloqueo: motivoBloqueo
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Agenda bloqueada correctamente.');
                closeModal();
                cargarAgenda(); // Recargar la agenda para mostrar el nuevo estado
            } else {
                alert(`Error al bloquear la agenda: ${data.error}`);
            }
        } catch (error) {
            console.error('Error al bloquear agenda:', error);
            alert('Error de conexión al bloquear la agenda.');
        }
    }

    // Función para desbloquear agenda
    window.desbloquearAgenda = async () => {
        if (!confirm('¿Estás seguro de que quieres desbloquear la agenda?\n\nLos invitados podrán volver a modificar sus confirmaciones de eventos.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/config/agenda/bloqueo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'admin-token' // En un entorno real, usar el token real del admin
                },
                body: JSON.stringify({
                    bloqueada: false,
                    motivoBloqueo: null
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Agenda desbloqueada correctamente.');
                cargarAgenda(); // Recargar la agenda para mostrar el nuevo estado
            } else {
                alert(`Error al desbloquear la agenda: ${data.error}`);
            }
        } catch (error) {
            console.error('Error al desbloquear agenda:', error);
            alert('Error de conexión al desbloquear la agenda.');
        }
    };
});