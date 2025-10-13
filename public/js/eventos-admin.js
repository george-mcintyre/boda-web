// Sistema de gestión de eventos para el panel de administración
class EventosAdmin {
  constructor() {
    this.eventos = [];
    this.currentEventId = null;
    this.currentSubeventId = null;
    this.selectedIcon = 'fas fa-calendar-alt';
    this.init();
  }

  async init() {
    console.log('🚀 Inicializando sistema de gestión de eventos...');
    await this.loadEventos();
    this.setupEventListeners();
    this.renderEventos();
  }

  // Cargar eventos desde el servidor
  async loadEventos() {
    try {
      const response = await fetch('/api/eventos');
      if (response.ok) {
        const data = await response.json();
        this.eventos = data.eventos || [];
        console.log('✅ Eventos cargados:', this.eventos);
      } else {
        console.error('❌ Error cargando eventos:', response.statusText);
        this.eventos = [];
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      this.eventos = [];
    }
  }

  // Guardar eventos en el servidor
  async saveEventos() {
    try {
      console.log('📤 Enviando eventos al servidor:', this.eventos);
      
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventos: this.eventos })
      });

      console.log('📥 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Eventos guardados correctamente:', result);
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Error guardando eventos:', response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión al guardar:', error);
      return false;
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Event listeners se configurarán dinámicamente cuando se renderice el contenido
    console.log('🔧 Event listeners configurados');
    
    // Configurar actualización automática del estado de bloqueo cada 5 segundos
    this.intervalId = setInterval(() => {
      this.actualizarEstadoBloqueo();
    }, 5000);
  }

  // Actualizar estado de bloqueo desde el servidor
  async actualizarEstadoBloqueo() {
    try {
      const response = await fetch('/api/config/agenda/bloqueo');
      if (response.ok) {
        const data = await response.json();
        const nuevoEstado = data.agenda && data.agenda.bloqueada;
        
        // Si el estado cambió, actualizar la interfaz
        if (window.AGENDA_BLOQUEADA !== nuevoEstado) {
          console.log('🔄 Estado de bloqueo cambiado:', window.AGENDA_BLOQUEADA, '→', nuevoEstado);
          window.AGENDA_BLOQUEADA = nuevoEstado;
          this.renderEventos();
        }
      }
    } catch (error) {
      console.error('❌ Error al actualizar estado de bloqueo:', error);
    }
  }

  // Renderizar la lista de eventos
  async renderEventos() {
    const container = document.getElementById('eventosContainer');
    if (!container) {
      console.error('❌ Contenedor de eventos no encontrado');
      return;
    }

    // Verificar si la agenda está bloqueada (actualizar desde servidor)
    await this.actualizarEstadoBloqueo();
    const agendaBloqueada = window.AGENDA_BLOQUEADA || false;
    console.log('🔒 Estado de bloqueo de agenda:', agendaBloqueada);

    if (this.eventos.length === 0) {
      container.innerHTML = `
        <div class="events-empty">
          <i class="fas fa-calendar-plus"></i>
          <h3>No hay eventos configurados</h3>
          <p>Comienza creando el primer evento de la boda</p>
          ${!agendaBloqueada ? `
            <button onclick="eventosAdmin.addEvent()" class="event-btn event-btn-primary">
              <i class="fas fa-plus"></i> Crear Primer Evento
            </button>
          ` : `
            <div class="locked-agenda-notice">
              <i class="fas fa-lock"></i>
              <p>La agenda está bloqueada. No se pueden crear nuevos eventos.</p>
            </div>
          `}
        </div>
      `;
      return;
    }

    // Ordenar eventos por fecha
    const eventosOrdenados = [...this.eventos].sort((a, b) => 
      new Date(a.fecha) - new Date(b.fecha)
    );

    container.innerHTML = `
      <div class="events-header">
        <div class="events-title">
          <i class="fas fa-calendar-alt"></i>
          <span>Gestión de Eventos (${eventosOrdenados.length})</span>
          ${agendaBloqueada ? `
            <span class="locked-agenda-badge">
              <i class="fas fa-lock"></i> AGENDA BLOQUEADA
            </span>
          ` : ''}
        </div>
        <div class="events-actions">
          <button onclick=\"eventosAdmin.actualizarEstadoBloqueo()\" class=\"event-btn event-btn-secondary\" title=\"Actualizar estado de bloqueo\">
            <i class=\"fas fa-sync\"></i> Actualizar
          </button>
          ${!agendaBloqueada ? `
            <button onclick=\"eventosAdmin.addEvent()\" class=\"event-btn event-btn-primary\">
              <i class=\"fas fa-plus\"></i> Nuevo Evento
            </button>
          ` : `
            <div class=\"locked-agenda-notice\">
              <i class=\"fas fa-lock\"></i>
              <span>No se pueden crear eventos mientras la agenda esté bloqueada</span>
            </div>
          `}
        </div>
      </div>
      <div class="events-list">
        ${eventosOrdenados.map(evento => this.renderEvento(evento)).join('')}
      </div>
    `;

    // Configurar event listeners para los botones
    this.setupEventListeners();
  }

  // Renderizar un evento individual
  renderEvento(evento) {
    const subeventosHTML = evento.subeventos && evento.subeventos.length > 0 
      ? evento.subeventos.map(subevento => this.renderSubevento(subevento, evento.id)).join('')
      : '';

    // Verificar si la agenda está bloqueada
    const agendaBloqueada = window.AGENDA_BLOQUEADA || false;

    return `
      <div class="event-card" data-event-id="${evento.id}">
        <div class="event-header">
          <div class="event-info">
            <div class="event-icon">
              <i class="${evento.icono || 'fas fa-calendar-alt'}"></i>
            </div>
            <div>
              <div class="event-title">${evento.titulo}</div>
              <div class="event-description">${evento.descripcion}</div>
            </div>
          </div>
          <div class="event-actions">
            ${!agendaBloqueada ? `
              <button onclick="eventosAdmin.editEvent(${evento.id})" class="event-action primary">
                <i class="fas fa-edit"></i> Editar
              </button>
              <button onclick="eventosAdmin.addSubevent(${evento.id})" class="event-action secondary">
                <i class="fas fa-plus"></i> Subevento
              </button>
              <button onclick="eventosAdmin.deleteEvent(${evento.id})" class="event-action danger">
                <i class="fas fa-trash"></i> Eliminar
              </button>
            ` : `
              <div class="locked-agenda-notice">
                <i class="fas fa-lock"></i>
                <span>Evento bloqueado</span>
              </div>
            `}
          </div>
        </div>
        
                 <div class="event-details">
           <div class="event-detail">
             <i class="fas fa-calendar"></i>
             <span>${this.formatDate(evento.fecha)}</span>
           </div>
           <div class="event-detail">
             <i class="fas fa-clock"></i>
             <span>${evento.horaInicio} - ${evento.horaFin}</span>
           </div>
           <div class="event-detail">
             <i class="fas fa-map-marker-alt"></i>
             <span>${evento.lugar}</span>
           </div>
           <div class="event-detail">
             <i class="fas fa-map"></i>
             <span>${evento.direccion}</span>
           </div>
           ${evento.coordenadas && evento.coordenadas.lat && evento.coordenadas.lng ? `
           <div class="event-detail">
             <i class="fas fa-location-dot"></i>
             <span>${evento.coordenadas.lat}, ${evento.coordenadas.lng}</span>
             <button onclick="eventosAdmin.viewMap(${evento.coordenadas.lat}, ${evento.coordenadas.lng})" class="map-link-btn" title="Ver en Google Maps">
               <i class="fas fa-external-link-alt"></i>
             </button>
           </div>
           ` : ''}
         </div>

        ${subeventosHTML ? `
          <div class="subevents-section">
            <div class="subevents-header">
              <div class="subevents-title">
                <i class="fas fa-list"></i>
                <span>Subeventos (${evento.subeventos.length})</span>
              </div>
            </div>
            <div class="subevents-list">
              ${subeventosHTML}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Renderizar un subevento
  renderSubevento(subevento, eventoId) {
    // Verificar si la agenda está bloqueada
    const agendaBloqueada = window.AGENDA_BLOQUEADA || false;

    return `
      <div class="subevent-card" data-subevent-id="${subevento.id}">
        <div class="subevent-header">
          <div class="subevent-info">
            <div class="subevent-icon">
              <i class="${subevento.icono || 'fas fa-clock'}"></i>
            </div>
            <div>
              <div class="subevent-title">${subevento.titulo}</div>
              <div class="subevent-description">${subevento.descripcion}</div>
            </div>
          </div>
          <div class="subevent-actions">
            ${!agendaBloqueada ? `
              <button onclick="eventosAdmin.editSubevent(${eventoId}, ${subevento.id})" class="subevent-action primary">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="eventosAdmin.deleteSubevent(${eventoId}, ${subevento.id})" class="subevent-action danger">
                <i class="fas fa-trash"></i>
              </button>
            ` : `
              <div class="locked-agenda-notice">
                <i class="fas fa-lock"></i>
                <span>Subevento bloqueado</span>
              </div>
            `}
          </div>
        </div>
        
                 <div class="subevent-details">
           <div class="subevent-detail">
             <i class="fas fa-clock"></i>
             <span>${subevento.horaInicio} - ${subevento.horaFin}</span>
           </div>
           <div class="subevent-detail">
             <i class="fas fa-map-marker-alt"></i>
             <span>${subevento.lugar}</span>
           </div>
           <div class="subevent-detail">
             <i class="fas fa-map"></i>
             <span>${subevento.direccion}</span>
           </div>
           ${subevento.coordenadas && subevento.coordenadas.lat && subevento.coordenadas.lng ? `
           <div class="subevent-detail">
             <i class="fas fa-location-dot"></i>
             <span>${subevento.coordenadas.lat}, ${subevento.coordenadas.lng}</span>
             <button onclick="eventosAdmin.viewMap(${subevento.coordenadas.lat}, ${subevento.coordenadas.lng})" class="map-link-btn" title="Ver en Google Maps">
               <i class="fas fa-external-link-alt"></i>
             </button>
           </div>
           ` : ''}
         </div>
      </div>
    `;
  }

  // Mostrar formulario para crear/editar evento
  showEventForm(evento = null) {
    const isEdit = evento !== null;
    this.currentEventId = isEdit ? evento.id : null;
    this.selectedIcon = evento?.icono || 'fas fa-calendar-alt';

    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
      <div class="event-modal-content">
        <div class="event-modal-header">
          <h3>
            <i class="fas fa-${isEdit ? 'edit' : 'plus'}"></i>
            ${isEdit ? 'Editar Evento' : 'Nuevo Evento'}
          </h3>
          <button onclick="eventosAdmin.closeModal()" class="event-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="event-modal-body">
          <form class="event-form" id="eventoForm">
            <div class="event-form-row">
              <div class="evento-form-group">
                <label for="eventoIcono">
                  <i class="fas fa-image"></i>
                  Icono del Evento
                </label>
                <div class="icon-selector">
                  <button type="button" class="icon-selector-toggle" onclick="eventosAdmin.toggleIconSelector()">
                    <i class="${this.selectedIcon}"></i>
                    <span>${EVENTOS_ICONS[this.selectedIcon] || 'Seleccionar icono'}</span>
                    <i class="fas fa-chevron-down"></i>
                  </button>
                  <div class="icon-selector-dropdown" id="iconSelectorDropdown">
                    <div class="icon-selector-search">
                      <input type="text" placeholder="Buscar icono..." onkeyup="eventosAdmin.filterIcons(this.value)">
                    </div>
                    <div class="icon-selector-categories">
                      ${this.renderIconCategories()}
                    </div>
                    <div class="icon-selector-grid" id="iconGrid">
                      ${this.renderIconOptions()}
                    </div>
                  </div>
                </div>
              </div>
              <div class="evento-form-group">
                <label for="eventoTitulo">
                  <i class="fas fa-heading"></i>
                  Título del Evento *
                </label>
                <input type="text" id="eventoTitulo" value="${evento?.titulo || ''}" required>
              </div>
            </div>

            <div class="evento-form-group full-width">
              <label for="eventoDescripcion">
                <i class="fas fa-align-left"></i>
                Descripción
              </label>
              <textarea id="eventoDescripcion" rows="3">${evento?.descripcion || ''}</textarea>
            </div>

            <div class="evento-form-row">
              <div class="evento-form-group">
                <label for="eventoFecha">
                  <i class="fas fa-calendar"></i>
                  Fecha *
                </label>
                <input type="date" id="eventoFecha" value="${evento?.fecha || ''}" required>
              </div>
              <div class="evento-form-group">
                <label for="eventoHoraInicio">
                  <i class="fas fa-clock"></i>
                  Hora de Inicio *
                </label>
                <input type="time" id="eventoHoraInicio" value="${evento?.horaInicio || ''}" required>
              </div>
            </div>

            <div class="evento-form-row">
              <div class="evento-form-group">
                <label for="eventoHoraFin">
                  <i class="fas fa-clock"></i>
                  Hora de Fin *
                </label>
                <input type="time" id="eventoHoraFin" value="${evento?.horaFin || ''}" required>
              </div>
              <div class="evento-form-group">
                <label for="eventoLugar">
                  <i class="fas fa-map-marker-alt"></i>
                  Lugar *
                </label>
                <input type="text" id="eventoLugar" value="${evento?.lugar || ''}" required>
              </div>
            </div>

            <div class="evento-form-group full-width">
              <label for="eventoDireccion">
                <i class="fas fa-map"></i>
                Dirección *
              </label>
              <input type="text" id="eventoDireccion" value="${evento?.direccion || ''}" required>
            </div>

                         <div class="evento-form-group full-width">
               <label>
                 <i class="fas fa-location-dot"></i>
                 Coordenadas de Google Maps
               </label>
               <input type="text" id="eventoCoordenadas" placeholder="Ej: 40.4168,-3.7038" value="${this.formatCoordinates(evento?.coordenadas)}">
               <small class="form-help">Formato: latitud,longitud (ej: 40.4168,-3.7038)</small>
             </div>

            <div class="evento-form-actions">
              <button type="button" onclick="eventosAdmin.closeModal()" class="evento-btn evento-btn-secondary">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" class="evento-btn evento-btn-primary">
                <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'} Evento
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Configurar el formulario
    const form = document.getElementById('eventoForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.saveEvent();
    };
  }

  // Mostrar formulario para crear/editar subevento
  showSubeventForm(eventoId, subevento = null) {
    const isEdit = subevento !== null;
    this.currentEventId = eventoId;
    this.currentSubeventId = isEdit ? subevento.id : null;
    this.selectedIcon = subevento?.icono || 'fas fa-clock';

    const modal = document.createElement('div');
    modal.className = 'evento-modal';
    modal.innerHTML = `
      <div class="evento-modal-content">
        <div class="evento-modal-header">
          <h3>
            <i class="fas fa-${isEdit ? 'edit' : 'plus'}"></i>
            ${isEdit ? 'Editar Subevento' : 'Nuevo Subevento'}
          </h3>
          <button onclick="eventosAdmin.closeModal()" class="evento-modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="evento-modal-body">
          <form class="evento-form" id="subeventoForm">
            <div class="evento-form-row">
              <div class="evento-form-group">
                <label for="subeventoIcono">
                  <i class="fas fa-image"></i>
                  Icono del Subevento
                </label>
                <div class="icon-selector">
                  <button type="button" class="icon-selector-toggle" onclick="eventosAdmin.toggleIconSelector()">
                    <i class="${this.selectedIcon}"></i>
                    <span>${EVENTOS_ICONS[this.selectedIcon] || 'Seleccionar icono'}</span>
                    <i class="fas fa-chevron-down"></i>
                  </button>
                  <div class="icon-selector-dropdown" id="iconSelectorDropdown">
                    <div class="icon-selector-search">
                      <input type="text" placeholder="Buscar icono..." onkeyup="eventosAdmin.filterIcons(this.value)">
                    </div>
                    <div class="icon-selector-categories">
                      ${this.renderIconCategories()}
                    </div>
                    <div class="icon-selector-grid" id="iconGrid">
                      ${this.renderIconOptions()}
                    </div>
                  </div>
                </div>
              </div>
              <div class="evento-form-group">
                <label for="subeventoTitulo">
                  <i class="fas fa-heading"></i>
                  Título del Subevento *
                </label>
                <input type="text" id="subeventoTitulo" value="${subevento?.titulo || ''}" required>
              </div>
            </div>

            <div class="evento-form-group full-width">
              <label for="subeventoDescripcion">
                <i class="fas fa-align-left"></i>
                Descripción
              </label>
              <textarea id="subeventoDescripcion" rows="3">${subevento?.descripcion || ''}</textarea>
            </div>

            <div class="evento-form-row">
              <div class="evento-form-group">
                <label for="subeventoHoraInicio">
                  <i class="fas fa-clock"></i>
                  Hora de Inicio *
                </label>
                <input type="time" id="subeventoHoraInicio" value="${subevento?.horaInicio || ''}" required>
              </div>
              <div class="evento-form-group">
                <label for="subeventoHoraFin">
                  <i class="fas fa-clock"></i>
                  Hora de Fin *
                </label>
                <input type="time" id="subeventoHoraFin" value="${subevento?.horaFin || ''}" required>
              </div>
            </div>

            <div class="evento-form-row">
              <div class="evento-form-group">
                <label for="subeventoLugar">
                  <i class="fas fa-map-marker-alt"></i>
                  Lugar *
                </label>
                <input type="text" id="subeventoLugar" value="${subevento?.lugar || ''}" required>
              </div>
              <div class="evento-form-group">
                <label for="subeventoDireccion">
                  <i class="fas fa-map"></i>
                  Dirección *
                </label>
                <input type="text" id="subeventoDireccion" value="${subevento?.direccion || ''}" required>
              </div>
            </div>

                         <div class="evento-form-group full-width">
               <label>
                 <i class="fas fa-location-dot"></i>
                 Coordenadas de Google Maps
               </label>
               <input type="text" id="subeventoCoordenadas" placeholder="Ej: 40.4168,-3.7038" value="${this.formatCoordinates(subevento?.coordenadas)}">
               <small class="form-help">Formato: latitud,longitud (ej: 40.4168,-3.7038)</small>
             </div>

            <div class="evento-form-actions">
              <button type="button" onclick="eventosAdmin.closeModal()" class="evento-btn evento-btn-secondary">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" class="evento-btn evento-btn-primary">
                <i class="fas fa-save"></i> ${isEdit ? 'Actualizar' : 'Crear'} Subevento
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Configurar el formulario
    const form = document.getElementById('subeventoForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.saveSubevent();
    };
  }

  // Renderizar categorías de iconos
  renderIconCategories() {
    const categories = getCategories();
    return categories.map(category => `
      <button type="button" class="icon-category-btn" onclick="eventosAdmin.filterIconsByCategory('${category}')">
        ${category}
      </button>
    `).join('');
  }

  // Renderizar opciones de iconos
  renderIconOptions(filteredIcons = null) {
    const icons = filteredIcons || getAllEventIcons();
    return Object.entries(icons).map(([iconClass, description]) => `
      <div class="icon-option ${iconClass === this.selectedIcon ? 'selected' : ''}" 
           onclick="eventosAdmin.selectIcon('${iconClass}')">
        <i class="${iconClass}"></i>
        <span>${description}</span>
      </div>
    `).join('');
  }

  // Filtrar iconos por texto
  filterIcons(searchText) {
    const filteredIcons = searchIcons(searchText);
    const iconGrid = document.getElementById('iconGrid');
    if (iconGrid) {
      iconGrid.innerHTML = this.renderIconOptions(filteredIcons);
    }
  }

  // Filtrar iconos por categoría
  filterIconsByCategory(category) {
    const categoryIcons = getIconsByCategory(category);
    const filteredIcons = {};
    categoryIcons.forEach(iconClass => {
      filteredIcons[iconClass] = EVENTOS_ICONS[iconClass];
    });
    
    const iconGrid = document.getElementById('iconGrid');
    if (iconGrid) {
      iconGrid.innerHTML = this.renderIconOptions(filteredIcons);
    }

    // Actualizar botones de categoría
    document.querySelectorAll('.icon-category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  }

  // Seleccionar icono
  selectIcon(iconClass) {
    this.selectedIcon = iconClass;
    
    // Actualizar el botón del selector
    const toggle = document.querySelector('.icon-selector-toggle');
    if (toggle) {
      toggle.innerHTML = `
        <i class="${iconClass}"></i>
        <span>${EVENTOS_ICONS[iconClass]}</span>
        <i class="fas fa-chevron-down"></i>
      `;
    }

    // Actualizar iconos seleccionados en la grilla
    document.querySelectorAll('.icon-option').forEach(option => {
      option.classList.remove('selected');
    });
    event.target.closest('.icon-option').classList.add('selected');
  }

  // Alternar selector de iconos
  toggleIconSelector() {
    const dropdown = document.getElementById('iconSelectorDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  }

  // Guardar evento
  async saveEvent() {
    console.log('💾 Iniciando guardado de evento...');
    
    const coordenadasValue = document.getElementById('eventoCoordenadas').value.trim();
    const coordenadas = this.parseCoordinates(coordenadasValue);
    
    const formData = {
      icono: this.selectedIcon,
      titulo: document.getElementById('eventoTitulo').value,
      descripcion: document.getElementById('eventoDescripcion').value,
      fecha: document.getElementById('eventoFecha').value,
      horaInicio: document.getElementById('eventoHoraInicio').value,
      horaFin: document.getElementById('eventoHoraFin').value,
      lugar: document.getElementById('eventoLugar').value,
      direccion: document.getElementById('eventoDireccion').value,
      coordenadas: coordenadas
    };

    console.log('📋 Datos del formulario:', formData);

    // Validaciones básicas
    if (!formData.titulo || !formData.fecha || !formData.horaInicio || !formData.horaFin || !formData.lugar || !formData.direccion) {
      console.error('❌ Validación fallida: campos obligatorios incompletos');
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    if (this.currentEventId) {
      // Editar evento existente
      console.log('✏️ Editando evento existente:', this.currentEventId);
      const index = this.eventos.findIndex(e => e.id === this.currentEventId);
      if (index !== -1) {
        this.eventos[index] = { ...this.eventos[index], ...formData };
        console.log('✅ Evento actualizado en memoria');
      }
    } else {
      // Crear nuevo evento
      console.log('➕ Creando nuevo evento');
      const newEvent = {
        id: Date.now(), // ID temporal
        ...formData,
        subeventos: []
      };
      this.eventos.push(newEvent);
      console.log('✅ Nuevo evento añadido a memoria:', newEvent);
    }

    console.log('💾 Guardando eventos en servidor...');
    const success = await this.saveEventos();
    
    if (success) {
      console.log('✅ Guardado exitoso');
      this.closeModal();
      this.renderEventos();
      this.showMessage('Evento guardado correctamente', 'success');
    } else {
      console.error('❌ Error en el guardado');
      this.showMessage('Error al guardar el evento', 'error');
    }
  }

  // Guardar subevento
  async saveSubevent() {
    const coordenadasValue = document.getElementById('subeventoCoordenadas').value.trim();
    const coordenadas = this.parseCoordinates(coordenadasValue);
    
    const formData = {
      icono: this.selectedIcon,
      titulo: document.getElementById('subeventoTitulo').value,
      descripcion: document.getElementById('subeventoDescripcion').value,
      horaInicio: document.getElementById('subeventoHoraInicio').value,
      horaFin: document.getElementById('subeventoHoraFin').value,
      lugar: document.getElementById('subeventoLugar').value,
      direccion: document.getElementById('subeventoDireccion').value,
      coordenadas: coordenadas
    };

    // Validaciones básicas
    if (!formData.titulo || !formData.horaInicio || !formData.horaFin || !formData.lugar || !formData.direccion) {
      alert('Por favor, completa todos los campos obligatorios');
      return;
    }

    const eventoIndex = this.eventos.findIndex(e => e.id === this.currentEventId);
    if (eventoIndex === -1) {
      this.showMessage('Error: evento no encontrado', 'error');
      return;
    }

    if (!this.eventos[eventoIndex].subeventos) {
      this.eventos[eventoIndex].subeventos = [];
    }

    if (this.currentSubeventId) {
      // Editar subevento existente
      const subeventIndex = this.eventos[eventoIndex].subeventos.findIndex(s => s.id === this.currentSubeventId);
      if (subeventIndex !== -1) {
        this.eventos[eventoIndex].subeventos[subeventIndex] = { 
          ...this.eventos[eventoIndex].subeventos[subeventIndex], 
          ...formData 
        };
      }
    } else {
      // Crear nuevo subevento
      const newSubevent = {
        id: Date.now(), // ID temporal
        ...formData
      };
      this.eventos[eventoIndex].subeventos.push(newSubevent);
    }

    const success = await this.saveEventos();
    if (success) {
      this.closeModal();
      this.renderEventos();
      this.showMessage('Subevento guardado correctamente', 'success');
    } else {
      this.showMessage('Error al guardar el subevento', 'error');
    }
  }

  // Editar evento
  editEvent(eventId) {
    const evento = this.eventos.find(e => e.id === eventId);
    if (evento) {
      this.showEventForm(evento);
    }
  }

  // Editar subevento
  editSubevent(eventId, subeventId) {
    const evento = this.eventos.find(e => e.id === eventId);
    if (evento && evento.subeventos) {
      const subevento = evento.subeventos.find(s => s.id === subeventId);
      if (subevento) {
        this.showSubeventForm(eventId, subevento);
      }
    }
  }

  // Eliminar evento
  async deleteEvent(eventId) {
    if (confirm('¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.')) {
      this.eventos = this.eventos.filter(e => e.id !== eventId);
      const success = await this.saveEventos();
      if (success) {
        this.renderEventos();
        this.showMessage('Evento eliminado correctamente', 'success');
      } else {
        this.showMessage('Error al eliminar el evento', 'error');
      }
    }
  }

  // Eliminar subevento
  async deleteSubevent(eventId, subeventId) {
    if (confirm('¿Estás seguro de que quieres eliminar este subevento? Esta acción no se puede deshacer.')) {
      const eventoIndex = this.eventos.findIndex(e => e.id === eventId);
      if (eventoIndex !== -1 && this.eventos[eventoIndex].subeventos) {
        this.eventos[eventoIndex].subeventos = this.eventos[eventoIndex].subeventos.filter(s => s.id !== subeventId);
        const success = await this.saveEventos();
        if (success) {
          this.renderEventos();
          this.showMessage('Subevento eliminado correctamente', 'success');
        } else {
          this.showMessage('Error al eliminar el subevento', 'error');
        }
      }
    }
  }

  // Añadir evento
  addEvent() {
    this.showEventForm();
  }

  // Añadir subevento
  addSubevent(eventId) {
    this.showSubeventForm(eventId);
  }

  // Cerrar modal
  closeModal() {
    const modal = document.querySelector('.event-modal');
    if (modal) {
      modal.remove();
    }
    this.currentEventId = null;
    this.currentSubeventId = null;
  }

  // Limpiar recursos
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Mostrar mensaje
  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `event-message ${type}`;
    messageDiv.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;

    const container = document.getElementById('eventosContainer');
    if (container) {
      container.insertBefore(messageDiv, container.firstChild);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  // Formatear fecha
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Ver mapa
  viewMap(lat, lng) {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      alert('No hay coordenadas disponibles para este evento');
    }
  }

  // Formatear coordenadas para mostrar en el input
  formatCoordinates(coordenadas) {
    if (!coordenadas || !coordenadas.lat || !coordenadas.lng) {
      return '';
    }
    return `${coordenadas.lat},${coordenadas.lng}`;
  }

  // Parsear coordenadas desde el input
  parseCoordinates(coordenadasString) {
    if (!coordenadasString || coordenadasString.trim() === '') {
      return { lat: null, lng: null };
    }

    // Limpiar espacios y caracteres extra
    const cleanString = coordenadasString.replace(/\s+/g, '');
    
    // Buscar el patrón latitud,longitud
    const match = cleanString.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validar rangos de coordenadas
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat: lat, lng: lng };
      }
    }
    
    // Si no es válido, mostrar error y retornar null
    alert('Formato de coordenadas inválido. Use: latitud,longitud (ej: 40.4168,-3.7038)');
    return { lat: null, lng: null };
  }
}

// Inicializar el sistema cuando se carga la página
let eventosAdmin;

// Función para inicializar el sistema de eventos
function initEventosAdmin() {
  if (typeof EVENTOS_ICONS === 'undefined') {
    console.error('❌ Biblioteca de iconos no cargada');
    return;
  }
  
  // Verificar el estado de bloqueo de la agenda
  if (typeof window.AGENDA_BLOQUEADA === 'undefined') {
    console.log('🔍 Estado de bloqueo no configurado, verificando desde el servidor...');
    // Intentar obtener el estado de bloqueo desde el servidor
    fetch('/api/config/agenda/bloqueo')
      .then(response => response.json())
      .then(config => {
        window.AGENDA_BLOQUEADA = config.agenda && config.agenda.bloqueada;
        console.log('🔒 Estado de bloqueo obtenido del servidor:', window.AGENDA_BLOQUEADA);
        eventosAdmin = new EventosAdmin();
        console.log('✅ Sistema de gestión de eventos inicializado');
      })
      .catch(error => {
        console.error('❌ Error al obtener estado de bloqueo:', error);
        window.AGENDA_BLOQUEADA = false;
        eventosAdmin = new EventosAdmin();
        console.log('✅ Sistema de gestión de eventos inicializado (sin bloqueo)');
      });
  } else {
    eventosAdmin = new EventosAdmin();
    console.log('✅ Sistema de gestión de eventos inicializado');
  }
}

// Exportar para uso global
window.eventosAdmin = eventosAdmin;
window.initEventosAdmin = initEventosAdmin;
