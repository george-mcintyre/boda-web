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

  // Función para mostrar la selección actual
  function mostrarSeleccionActual(seleccion) {
    const currentSelectionDiv = document.getElementById('currentSelection');
    const currentSelectionContent = document.getElementById('currentSelectionContent');
    
    if (seleccion && (seleccion.entrante || seleccion.principal || seleccion.postre)) {
      currentSelectionContent.innerHTML = `
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
      `;
      currentSelectionDiv.style.display = 'block';
    } else {
      currentSelectionDiv.style.display = 'none';
    }
  }

  // Obtener y mostrar el menú
  try {
    const response = await fetch('/api/menu');
    const menu = await response.json();
    
    if (response.ok) {
      // Llenar select de entrantes
      const entranteSelect = document.getElementById('entrante');
      menu.entrantes.forEach(entrante => {
        const option = document.createElement('option');
        option.value = entrante;
        option.textContent = entrante;
        entranteSelect.appendChild(option);
      });

      // Llenar select de principales
      const principalSelect = document.getElementById('principal');
      menu.principales.forEach(principal => {
        const option = document.createElement('option');
        option.value = principal;
        option.textContent = principal;
        principalSelect.appendChild(option);
      });

      // Llenar select de postres
      const postreSelect = document.getElementById('postre');
      menu.postres.forEach(postre => {
        const option = document.createElement('option');
        option.value = postre;
        option.textContent = postre;
        postreSelect.appendChild(option);
      });
    } else {
      showMessage('menuMessage', 'Error al cargar el menú.', 'error');
    }
  } catch (err) {
    showMessage('menuMessage', 'Error de conexión al cargar el menú.', 'error');
  }

  // Cargar selección actual del invitado
  try {
    const response = await fetch('/api/invitado', {
      method: 'GET',
      headers: { 'Authorization': token }
    });
    const data = await response.json();
    
    if (response.ok && data.seleccionMenu) {
      mostrarSeleccionActual(data.seleccionMenu);
      
      // Pre-llenar el formulario con la selección actual
      if (data.seleccionMenu.entrante) {
        document.getElementById('entrante').value = data.seleccionMenu.entrante;
      }
      if (data.seleccionMenu.principal) {
        document.getElementById('principal').value = data.seleccionMenu.principal;
      }
      if (data.seleccionMenu.postre) {
        document.getElementById('postre').value = data.seleccionMenu.postre;
      }
      if (data.seleccionMenu.opcion) {
        document.getElementById('opcion').value = data.seleccionMenu.opcion;
      }
      if (data.seleccionMenu.alergias) {
        document.getElementById('alergias').value = data.seleccionMenu.alergias;
      }
    }
  } catch (err) {
    console.error('Error al cargar la selección actual:', err);
  }

  // Formulario de menú
  const menuForm = document.getElementById('menuForm');
  if (menuForm) {
    menuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(menuForm);
      const menuData = {
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
          body: JSON.stringify(menuData)
        });
        const data = await res.json();
        
        if (res.ok) {
          showMessage('menuMessage', data.mensaje, 'success');
          showToast('Selección guardada correctamente', 'success');
          
          // Actualizar la visualización de la selección actual
          mostrarSeleccionActual(menuData);
        } else {
          showMessage('menuMessage', data.error || 'Error al guardar la selección.', 'error');
          showToast('Error al guardar la selección', 'error');
        }
      } catch (err) {
        showMessage('menuMessage', 'Error de conexión al guardar la selección.', 'error');
        showToast('Error de conexión', 'error');
      }
    });
  }

  // Función de logout
  window.logoutInvitado = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('nombre');
    localStorage.removeItem('email');
    window.location.href = 'login.html';
  };
});

