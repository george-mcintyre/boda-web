// Script de administración corregido con funcionalidades de edición
(function() {
  'use strict';
  
  // Variables globales
  let adminContent, adminTabs, logoutBtn;
  
  // Inicializar cuando el DOM esté listo
  function init() {
    adminContent = document.getElementById('adminContent');
    adminTabs = document.querySelectorAll('.adminTab');
    logoutBtn = document.getElementById('logoutAdmin');
    
    if (!adminContent || !adminTabs.length || !logoutBtn) {
      console.error('Elementos del panel de administración no encontrados');
      return;
    }
    
    console.log('Panel de administración inicializado');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar la pestaña de invitados por defecto
    showTab('invitados');
  }
  
  function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      window.location.href = 'admin-login.html';
    });
    
    // Tabs
    adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        console.log('Haciendo clic en pestaña:', tabName);
        showTab(tabName);
      });
    });
  }

  // Funciones de utilidad
  function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      ${message}
    `;
    messageDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 1000; 
      padding: 15px; border-radius: 8px; color: white; 
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
  }

  function showConfirmDialog(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
      align-items: center; justify-content: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white; padding: 30px; border-radius: 12px; 
      max-width: 400px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    dialog.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">Confirmar acción</h3>
      <p style="margin: 0 0 25px 0; color: #666;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="confirmYes" style="
          padding: 10px 20px; background: #dc3545; color: white; 
          border: none; border-radius: 6px; cursor: pointer;
        ">Sí, eliminar</button>
        <button id="confirmNo" style="
          padding: 10px 20px; background: #6c757d; color: white; 
          border: none; border-radius: 6px; cursor: pointer;
        ">Cancelar</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    document.getElementById('confirmYes').onclick = () => {
      overlay.remove();
      onConfirm();
    };
    
    document.getElementById('confirmNo').onclick = () => overlay.remove();
  }

  // Funciones de gestión de invitados
  async function addInvitado() {
    const nombre = prompt('Nombre del invitado:');
    if (!nombre) return;
    
    const email = prompt('Email del invitado:');
    if (!email) return;
    
    try {
      const response = await fetch('/api/admin/invitados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify({ nombre, email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Invitado añadido correctamente');
        showTab('invitados'); // Recargar la lista
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Error al añadir invitado', 'error');
    }
  }

  async function editInvitado(id, currentData) {
    const nombre = prompt('Nombre del invitado:', currentData.nombre);
    if (!nombre) return;
    
    const email = prompt('Email del invitado:', currentData.email);
    if (!email) return;
    
    const asistencia = prompt('Asistencia (si/no/pendiente):', currentData.asistencia);
    if (!asistencia) return;
    
    try {
      const response = await fetch(`/api/admin/invitados/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify({ nombre, email, asistencia })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Invitado actualizado correctamente');
        showTab('invitados'); // Recargar la lista
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Error al actualizar invitado', 'error');
    }
  }

  async function deleteInvitado(id, nombre) {
    showConfirmDialog(`¿Estás seguro de que quieres eliminar a ${nombre}?`, async () => {
      try {
        const response = await fetch(`/api/admin/invitados/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': localStorage.getItem('adminToken')
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showMessage('Invitado eliminado correctamente');
          showTab('invitados'); // Recargar la lista
        } else {
          showMessage(data.error, 'error');
        }
      } catch (error) {
        showMessage('Error al eliminar invitado', 'error');
      }
    });
  }

  // Funciones de gestión de regalos
  async function addRegalo() {
    const nombre = prompt('Nombre del regalo:');
    if (!nombre) return;
    
    const descripcion = prompt('Descripción del regalo:');
    const precio = prompt('Precio del regalo:');
    const categoria = prompt('Categoría del regalo:');
    const url = prompt('URL del regalo (opcional):');
    
    try {
      const response = await fetch('/api/admin/regalos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify({ nombre, descripcion, precio, categoria, url })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Regalo añadido correctamente');
        showTab('regalos'); // Recargar la lista
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Error al añadir regalo', 'error');
    }
  }

  async function editRegalo(id, currentData) {
    const nombre = prompt('Nombre del regalo:', currentData.nombre);
    if (!nombre) return;
    
    const descripcion = prompt('Descripción del regalo:', currentData.descripcion);
    const precio = prompt('Precio del regalo:', currentData.precio);
    const categoria = prompt('Categoría del regalo:', currentData.categoria);
    const url = prompt('URL del regalo:', currentData.url);
    
    try {
      const response = await fetch(`/api/admin/regalos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify({ nombre, descripcion, precio, categoria, url })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Regalo actualizado correctamente');
        showTab('regalos'); // Recargar la lista
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Error al actualizar regalo', 'error');
    }
  }

  async function deleteRegalo(id, nombre) {
    showConfirmDialog(`¿Estás seguro de que quieres eliminar el regalo "${nombre}"?`, async () => {
      try {
        const response = await fetch(`/api/admin/regalos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': localStorage.getItem('adminToken')
          }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showMessage('Regalo eliminado correctamente');
          showTab('regalos'); // Recargar la lista
        } else {
          showMessage(data.error, 'error');
        }
      } catch (error) {
        showMessage('Error al eliminar regalo', 'error');
      }
    });
  }

  // Funciones de gestión de agenda
  async function editEvento(id, currentData) {
    const evento = prompt('Nombre del evento:', currentData.evento);
    if (!evento) return;
    
    const fecha = prompt('Fecha del evento:', currentData.fecha);
    const dia = prompt('Día del evento:', currentData.dia);
    const hora = prompt('Hora del evento:', currentData.hora);
    const descripcion = prompt('Descripción del evento:', currentData.descripcion);
    const lugar = prompt('Lugar del evento:', currentData.lugar);
    const direccion = prompt('Dirección del evento:', currentData.direccion);
    
    try {
      const response = await fetch(`/api/admin/agenda/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify({ evento, fecha, dia, hora, descripcion, lugar, direccion })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('Evento actualizado correctamente');
        showTab('agenda'); // Recargar la lista
      } else {
        showMessage(data.error, 'error');
      }
    } catch (error) {
      showMessage('Error al actualizar evento', 'error');
    }
  }
  
  window.showTab = async function(tab) {
    console.log('Mostrando pestaña:', tab);
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No hay token, redirigiendo al login');
      window.location.href = 'admin-login.html';
      return;
    }
    
    // Actualizar pestañas activas
    adminTabs.forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.adminTab[data-tab="${tab}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Mostrar loading
    adminContent.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>';
    
    // Determinar URL
    let url = '';
    if (tab === 'invitados') url = '/api/admin/invitados';
    if (tab === 'rsvp') url = '/api/admin/rsvp';
    if (tab === 'regalos') url = '/api/admin/regalos';
    if (tab === 'mensajes') url = '/api/admin/mensajes';
    if (tab === 'agenda') url = '/api/admin/agenda';
    if (tab === 'menu') url = '/api/admin/menu';
    if (tab === 'configuracion') {
      showConfiguracion();
      return;
    }
    
    if (!url) {
      adminContent.innerHTML = '<div class="message error"><p>Pestaña no implementada</p></div>';
      return;
    }
    
    try {
      console.log('Haciendo petición a:', url);
      
      // Agregar timestamp para evitar cache
      const urlWithTimestamp = `${url}?_t=${Date.now()}`;
      console.log('URL con timestamp:', urlWithTimestamp);
      
      const res = await fetch(urlWithTimestamp, {
        headers: { 
          'Authorization': token,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Respuesta del servidor:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error del servidor:', errorData);
        adminContent.innerHTML = `
          <div class="message error">
            <h3>Error al cargar los datos</h3>
            <p>${errorData.error || 'Error desconocido'}</p>
            <p>Código de error: ${res.status}</p>
            <button onclick="window.showTab('${tab}')" class="submit-btn">
              <i class="fas fa-redo"></i>
              Reintentar
            </button>
          </div>
        `;
        return;
      }
      
      const data = await res.json();
      console.log('Datos recibidos:', data);
      
      // Renderizar contenido según la pestaña
      if (tab === 'invitados') {
        renderInvitados(data);
      } else if (tab === 'regalos') {
        renderRegalos(data);
      } else if (tab === 'mensajes') {
        renderMensajes(data);
      } else if (tab === 'agenda') {
        renderAgenda(data);
      } else if (tab === 'rsvp') {
        renderRSVP(data);
      } else if (tab === 'menu') {
        renderMenu(data);
      }
      
    } catch (err) {
      console.error('Error en la petición:', err);
      adminContent.innerHTML = `
        <div class="message error">
          <h3>Error de conexión</h3>
          <p>No se pudo conectar con el servidor</p>
          <p>Detalles: ${err.message}</p>
          <button onclick="window.showTab('${tab}')" class="submit-btn">
            <i class="fas fa-redo"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  }
  
  function renderInvitados(data) {
    // Ordenar invitados alfabéticamente por nombre
    const invitadosOrdenados = [...data].sort((a, b) => 
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
    
    const totalInvitados = invitadosOrdenados.length;
    const confirmados = invitadosOrdenados.filter(inv => inv.asistencia === 'si').length;
    const noConfirmados = invitadosOrdenados.filter(inv => inv.asistencia === 'no').length;
    const pendientes = totalInvitados - confirmados - noConfirmados;
    const conMenu = invitadosOrdenados.filter(inv => inv.seleccionMenu).length;
    
    adminContent.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>📊 Estadísticas de invitados</h3>
          <button onclick="addInvitado()" style="
            padding: 8px 16px; background: #28a745; color: white; 
            border: none; border-radius: 6px; cursor: pointer;
          ">
            <i class="fas fa-plus"></i> Añadir Invitado
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
          <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
            <strong>${totalInvitados}</strong><br>Total
          </div>
          <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 5px;">
            <strong>${confirmados}</strong><br>Confirmados
          </div>
          <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 5px;">
            <strong>${noConfirmados}</strong><br>No asistirán
          </div>
          <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <strong>${pendientes}</strong><br>Pendientes
          </div>
          <div style="text-align: center; padding: 10px; background: #cce5ff; border-radius: 5px;">
            <strong>${conMenu}</strong><br>Con menú
          </div>
        </div>
      </div>
      <h3>👥 Lista de invitados</h3>
      <div style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Nombre</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Email</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Asistencia</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Menú</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${invitadosOrdenados.map(inv => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px;">${inv.nombre}</td>
                <td style="padding: 10px;">${inv.email}</td>
                <td style="padding: 10px;">
                  <span style="padding: 3px 8px; border-radius: 12px; font-size: 0.8em; 
                    background: ${inv.asistencia === 'si' ? '#d4edda' : inv.asistencia === 'no' ? '#f8d7da' : '#fff3cd'};
                    color: ${inv.asistencia === 'si' ? '#155724' : inv.asistencia === 'no' ? '#721c24' : '#856404'};">
                    ${inv.asistencia === 'si' ? '✅ Sí' : inv.asistencia === 'no' ? '❌ No' : '⏳ Pendiente'}
                  </span>
                </td>
                <td style="padding: 10px;">
                  ${inv.seleccionMenu ? 
                    `<span style="color: #28a745;">✓ Seleccionado</span><br>
                     <small style="color: #6c757d;">
                       ${inv.seleccionMenu.entrante}, ${inv.seleccionMenu.principal}, ${inv.seleccionMenu.postre}
                       ${inv.seleccionMenu.alergias ? `<br>⚠️ ${inv.seleccionMenu.alergias}` : ''}
                     </small>` : 
                    '<span style="color: #6c757d;">No seleccionado</span>'
                  }
                </td>
                <td style="padding: 10px;">
                  <button onclick="editInvitado(${inv.id}, ${JSON.stringify(inv).replace(/"/g, '&quot;')})" style="
                    padding: 4px 8px; background: #007bff; color: white; 
                    border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;
                  ">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteInvitado(${inv.id}, '${inv.nombre}')" style="
                    padding: 4px 8px; background: #dc3545; color: white; 
                    border: none; border-radius: 4px; cursor: pointer;
                  ">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  function renderRegalos(data) {
    const totalRegalos = data.length;
    const reservados = data.filter(r => r.reservadoPor).length;
    const disponibles = totalRegalos - reservados;
    
    adminContent.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>🎁 Estadísticas de regalos</h3>
          <button onclick="addRegalo()" style="
            padding: 8px 16px; background: #28a745; color: white; 
            border: none; border-radius: 6px; cursor: pointer;
          ">
            <i class="fas fa-plus"></i> Añadir Regalo
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
          <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
            <strong>${totalRegalos}</strong><br>Total
          </div>
          <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 5px;">
            <strong>${reservados}</strong><br>Reservados
          </div>
          <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <strong>${disponibles}</strong><br>Disponibles
          </div>
        </div>
      </div>
      <h3>🎁 Lista de regalos</h3>
      <div style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Regalo</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Descripción</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Precio</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Estado</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(r => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px;">
                  <strong>${r.nombre}</strong>
                  ${r.url ? `<br><a href="${r.url}" target="_blank" style="color: #007bff; font-size: 0.9em;">Ver enlace</a>` : ''}
                </td>
                <td style="padding: 10px;">${r.descripcion || '-'}</td>
                <td style="padding: 10px;">${r.precio || '-'}</td>
                <td style="padding: 10px;">
                  ${r.reservadoPor ? 
                    `<span style="padding: 3px 8px; border-radius: 12px; font-size: 0.8em; background: #d4edda; color: #155724;">
                      ✅ Reservado por ${r.reservadoPor}
                    </span>` : 
                    `<span style="padding: 3px 8px; border-radius: 12px; font-size: 0.8em; background: #fff3cd; color: #856404;">
                      ⏳ Disponible
                    </span>`
                  }
                </td>
                <td style="padding: 10px;">
                  <button onclick="editRegalo(${r.id}, ${JSON.stringify(r).replace(/"/g, '&quot;')})" style="
                    padding: 4px 8px; background: #007bff; color: white; 
                    border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;
                  ">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button onclick="deleteRegalo(${r.id}, '${r.nombre}')" style="
                    padding: 4px 8px; background: #dc3545; color: white; 
                    border: none; border-radius: 4px; cursor: pointer;
                  ">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  function renderMensajes(data) {
    adminContent.innerHTML = `
      <h3>💬 Mensajes de invitados</h3>
      <div style="max-height: 400px; overflow-y: auto;">
        ${data.length > 0 ? data.map(msg => `
          <div style="margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <strong style="color: #28a745;">${msg.nombre}</strong>
              <small style="color: #6c757d;">${new Date(msg.fecha).toLocaleString()}</small>
            </div>
            <p style="margin: 0; color: #333;">${msg.mensaje}</p>
          </div>
        `).join('') : '<p style="text-align: center; color: #6c757d;">No hay mensajes aún.</p>'}
      </div>
    `;
  }
  
  function renderAgenda(data) {
    adminContent.innerHTML = `
      <div class="admin-section">
        <div class="admin-header-section">
          <h3><i class="fas fa-calendar-alt"></i> Agenda de Eventos</h3>
          <button onclick="addNewEvent()" class="admin-action">
            <i class="fas fa-plus"></i> Agregar Evento
          </button>
        </div>
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Evento</th>
                <th>Lugar</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(evento => `
                <tr>
                  <td>${evento.fecha} (${evento.dia})</td>
                  <td>${evento.hora}</td>
                  <td>
                    <strong>${evento.titulo}</strong><br>
                    <small style="color: #6c757d;">${evento.descripcion}</small>
                  </td>
                  <td>${evento.lugar}</td>
                  <td>${evento.direccion}</td>
                  <td>
                    <button onclick="editEvento(${evento.id})" class="admin-action small">
                      <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="deleteEvento(${evento.id})" class="admin-action small danger">
                      <i class="fas fa-trash"></i> Eliminar
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Función para editar evento
  window.editEvento = async function(id) {
    try {
      const response = await fetch(`/api/admin/agenda/${id}`, {
        headers: { 'Authorization': localStorage.getItem('adminToken') }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del evento');
      }
      
      const evento = await response.json();
      showEventForm(evento);
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error al cargar el evento', 'error');
    }
  }

  // Función para agregar nuevo evento
  window.addNewEvent = function() {
    const nuevoEvento = {
      id: null,
      fecha: '',
      dia: '',
      hora: '',
      titulo: '',
      descripcion: '',
      lugar: '',
      direccion: ''
    };
    showEventForm(nuevoEvento);
  }

  // Función para mostrar formulario de evento
  function showEventForm(evento) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
      align-items: center; justify-content: center;
    `;
    
    const form = document.createElement('div');
    form.style.cssText = `
      background: white; padding: 30px; border-radius: 12px; 
      max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    const isNew = !evento.id;
    form.innerHTML = `
      <h3 style="margin: 0 0 20px 0; color: #333;">
        <i class="fas fa-${isNew ? 'plus' : 'edit'}"></i> 
        ${isNew ? 'Agregar' : 'Editar'} Evento
      </h3>
      
      <form id="eventForm">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Fecha (YYYY-MM-DD):</label>
            <input type="date" id="fecha" value="${evento.fecha}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Hora:</label>
            <input type="time" id="hora" value="${evento.hora}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Título del Evento:</label>
          <input type="text" id="titulo" value="${evento.titulo}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Descripción:</label>
          <textarea id="descripcion" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${evento.descripcion}</textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Lugar:</label>
          <input type="text" id="lugar" value="${evento.lugar}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Dirección:</label>
          <input type="text" id="direccion" value="${evento.direccion}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" onclick="closeEventForm()" style="
            padding: 10px 20px; background: #6c757d; color: white; 
            border: none; border-radius: 6px; cursor: pointer;
          ">Cancelar</button>
          <button type="submit" style="
            padding: 10px 20px; background: #28a745; color: white; 
            border: none; border-radius: 6px; cursor: pointer;
          ">${isNew ? 'Agregar' : 'Guardar'}</button>
        </div>
      </form>
    `;
    
    overlay.appendChild(form);
    document.body.appendChild(overlay);
    
    // Configurar el formulario
    const eventForm = document.getElementById('eventForm');
    eventForm.onsubmit = (e) => {
      e.preventDefault();
      saveEvent(evento.id);
    };
    
    // Función para cerrar el formulario
    window.closeEventForm = () => {
      document.body.removeChild(overlay);
    };
  }

  // Función para guardar evento
  window.saveEvent = async function(id) {
    const formData = {
      fecha: document.getElementById('fecha').value,
      hora: document.getElementById('hora').value,
      titulo: document.getElementById('titulo').value,
      descripcion: document.getElementById('descripcion').value,
      lugar: document.getElementById('lugar').value,
      direccion: document.getElementById('direccion').value
    };
    
    // Generar el día en formato legible
    const fecha = new Date(formData.fecha);
    const opciones = { day: 'numeric', month: 'long' };
    formData.dia = fecha.toLocaleDateString('es-ES', opciones);
    
    try {
      const url = id ? `/api/admin/agenda/${id}` : '/api/admin/agenda';
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('adminToken')
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar el evento');
      }
      
      showMessage(id ? 'Evento actualizado correctamente' : 'Evento agregado correctamente', 'success');
      window.closeEventForm();
      showTab('agenda'); // Recargar la lista
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error al guardar el evento', 'error');
    }
  }

  // Función para eliminar evento
  window.deleteEvento = async function(id) {
    showConfirmDialog('¿Estás seguro de que quieres eliminar este evento?', async () => {
      try {
        const response = await fetch(`/api/admin/agenda/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': localStorage.getItem('adminToken') }
        });
        
        if (!response.ok) {
          throw new Error('Error al eliminar el evento');
        }
        
        showMessage('Evento eliminado correctamente', 'success');
        showTab('agenda'); // Recargar la lista
      } catch (error) {
        console.error('Error:', error);
        showMessage('Error al eliminar el evento', 'error');
      }
    });
  }
  
  function renderRSVP(data) {
    const stats = data.estadisticas;
    adminContent.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h3>📊 Estadísticas de Confirmaciones RSVP</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
          <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
            <strong>${stats.total}</strong><br>Total Invitados
          </div>
          <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 5px;">
            <strong>${stats.confirmados}</strong><br>Confirmados
          </div>
          <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 5px;">
            <strong>${stats.noConfirmados}</strong><br>No Asistirán
          </div>
          <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <strong>${stats.pendientes}</strong><br>Pendientes
          </div>
        </div>
      </div>
      <h3>📋 Lista de Confirmaciones RSVP</h3>
      <div style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Nombre</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Email</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Estado RSVP</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            ${data.invitados.map(inv => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px;">${inv.nombre}</td>
                <td style="padding: 10px;">${inv.email}</td>
                <td style="padding: 10px;">
                  <span style="padding: 3px 8px; border-radius: 12px; font-size: 0.8em; 
                    background: ${inv.asistencia === 'si' ? '#d4edda' : inv.asistencia === 'no' ? '#f8d7da' : '#fff3cd'};
                    color: ${inv.asistencia === 'si' ? '#155724' : inv.asistencia === 'no' ? '#721c24' : '#856404'};">
                    ${inv.asistencia === 'si' ? '✅ Confirmado' : inv.asistencia === 'no' ? '❌ No asistirá' : '⏳ Pendiente'}
                  </span>
                </td>
                <td style="padding: 10px; font-size: 0.9em; color: #6c757d;">${inv.fechaRegistro}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  function renderMenu(data) {
    const stats = data.estadisticas;
    const opciones = data.opcionesMenu;
    
    adminContent.innerHTML = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h3>🍽️ Estadísticas de Menús</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
          <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
            <strong>${stats.totalSelecciones}</strong><br>Menús Seleccionados
          </div>
          <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 5px;">
            <strong>${Object.keys(stats.entrantes).length}</strong><br>Tipos Entrantes
          </div>
          <div style="text-align: center; padding: 10px; background: #cce5ff; border-radius: 5px;">
            <strong>${Object.keys(stats.principales).length}</strong><br>Tipos Principales
          </div>
          <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 5px;">
            <strong>${Object.keys(stats.postres).length}</strong><br>Tipos Postres
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
          <h4>🥗 Entrantes</h4>
          ${Object.entries(stats.entrantes).map(([entrante, count]) => `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f8f9fa;">
              <span>${entrante}</span>
              <strong style="color: #28a745;">${count}</strong>
            </div>
          `).join('')}
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
          <h4>🍖 Platos Principales</h4>
          ${Object.entries(stats.principales).map(([principal, count]) => `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f8f9fa;">
              <span>${principal}</span>
              <strong style="color: #007bff;">${count}</strong>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
        <h4>🍰 Postres</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          ${Object.entries(stats.postres).map(([postre, count]) => `
            <div style="display: flex; justify-content: space-between; padding: 8px; background: #f8f9fa; border-radius: 5px;">
              <span>${postre}</span>
              <strong style="color: #ffc107;">${count}</strong>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${stats.alergias.length > 0 ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h4>⚠️ Alergias y Restricciones</h4>
          <div style="max-height: 200px; overflow-y: auto;">
            ${stats.alergias.map(alergia => `
              <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px;">
                <strong>${alergia.invitado}:</strong> ${alergia.alergias}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }
  
  function showConfiguracion() {
    adminContent.innerHTML = `
      <div class="configuracion-section">
        <h3><i class="fas fa-cog"></i> Configuración del Sistema</h3>
        <div class="config-grid">
          <div class="config-card">
            <h4><i class="fas fa-calendar"></i> Información de la Boda</h4>
            <p><strong>Fecha:</strong> 6 de Junio, 2026</p>
            <p><strong>Novios:</strong> Iluminada & George</p>
            <p><strong>Estado:</strong> <span class="status-badge status-confirmed">Activa</span></p>
          </div>
          <div class="config-card">
            <h4><i class="fas fa-server"></i> Estado del Servidor</h4>
            <p><strong>Backend:</strong> <span class="status-badge status-confirmed">Online</span></p>
            <p><strong>Base de datos:</strong> <span class="status-badge status-confirmed">Conectada</span></p>
            <p><strong>Última actualización:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="config-card">
            <h4><i class="fas fa-shield-alt"></i> Seguridad</h4>
            <p><strong>Autenticación:</strong> <span class="status-badge status-confirmed">Activa</span></p>
            <p><strong>Tokens:</strong> <span class="status-badge status-confirmed">Válidos</span></p>
            <p><strong>Sesión admin:</strong> <span class="status-badge status-confirmed">Activa</span></p>
          </div>
        </div>
      </div>
    `;
  }
  
  // Hacer funciones disponibles globalmente
  window.showTab = showTab;
  window.addInvitado = addInvitado;
  window.editInvitado = editInvitado;
  window.deleteInvitado = deleteInvitado;
  window.addRegalo = addRegalo;
  window.editRegalo = editRegalo;
  window.deleteRegalo = deleteRegalo;
  window.editEvento = editEvento;
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

