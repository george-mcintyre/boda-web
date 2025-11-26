
      // Hacer las traducciones disponibles globalmente
      window.currentTranslations = translations;
  
      // Inicializar el sistema i18n
      document.addEventListener('DOMContentLoaded', () => {
        const i18n = initI18n(translations);
        
        // Mostrar name del invitado si está logueado
        showGuestName();
        
        // Escuchar cambios de idioma para actualizar el mensaje de bienvenida
        window.addEventListener('languageChanged', () => {
          updateGuestWelcome();
        });
      });
      
      // Función para mostrar el name del invitado
      function showGuestName() {
        const guestName = localStorage.getItem('name');
        const guestEmail = localStorage.getItem('email');
        
        if (guestName && guestEmail) {
          const guestNameDisplay = document.getElementById('guestNameDisplay');
          
          if (guestNameDisplay) {
            guestNameDisplay.textContent = guestName;
            guestNameDisplay.style.display = 'inline-block';
          }
        }
      }
      
      // Función para actualizar el mensaje de bienvenida cuando cambie el idioma
      function updateGuestWelcome() {
        // Esta función ya no es necesaria ya que el título se mantiene igual
        // Solo actualizamos el name si es necesario
        showGuestName();
      }
      
      // Función para activar modo administrador (solo para desarrollo)
      window.enableAdminMode = () => {
        localStorage.setItem('isAdmin', 'true');
        if (window.commentsSystem) {
          window.commentsSystem.updateAdminStatus(true);
        }
        alert('Modo administrador activado. Ahora puedes eliminar comentarios.');
      };
      
      // Función para desactivar modo administrador
      window.disableAdminMode = () => {
        localStorage.setItem('isAdmin', 'false');
        if (window.commentsSystem) {
          window.commentsSystem.updateAdminStatus(false);
        }
        alert('Modo administrador desactivado.');
      };
  
      // Funcionalidad para regalos en efectivo
      let selectedAmount = 0;
      let selectedOption = null;
      const stripe = Stripe('pk_test_51S3mEM1VZvSGk6xq2xUlkklkqrZtPH8zSPbZJRAARzmLLyDUBvCzjp1iEzn3xBYpEvgIGDHSgDd4McnqokupordX00JH8BtacP');
  
      function selectAmount(amount, element) {
        selectedAmount = amount;
        selectedOption = element;
        
        // Remover selección anterior
        document.querySelectorAll('.amount-option').forEach(option => {
          option.classList.remove('selected');
        });
        
        // Agregar selección actual
        if (element) {
          element.classList.add('selected');
        }
        
        
        updatePaymentSummary();
        checkFormValidity();
      }
  
  
      function updatePaymentSummary() {
        const summary = document.getElementById('paymentSummary');
        const amountDisplay = document.getElementById('selectedAmount');
        
        if (selectedAmount > 0) {
          summary.style.display = 'block';
          amountDisplay.textContent = `€${selectedAmount}`;
        } else {
          summary.style.display = 'none';
        }
      }
  
      function checkFormValidity() {
        const name = document.getElementById('donorName').value.trim();
        const email = document.getElementById('donorEmail').value.trim();
        const payButton = document.getElementById('payButton');
        
        // Los campos de name y email se llenan automáticamente, solo necesitamos verificar que hay una cantidad seleccionada
        if (selectedAmount > 0 && name && email) {
          payButton.disabled = false;
        } else {
          payButton.disabled = true;
        }
      }
  
      function showMessage(message, type = 'info') {
        const container = document.getElementById('cashGiftsMessage');
        container.innerHTML = `<div class="message ${type}">${message}</div>`;
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
          container.innerHTML = '';
        }, 5000);
      }
  
      async function processPayment() {
        if (!selectedAmount || selectedAmount <= 0) {
          showMessage(translate('guests:selectAmount'), 'error');
          return;
        }
  
        const name = document.getElementById('donorName').value.trim();
        const email = document.getElementById('donorEmail').value.trim();
        const message = document.getElementById('donorMessage').value.trim();
  
        // Los campos de name y email se llenan automáticamente, pero verificamos que estén presentes
        if (!name || !email) {
          showMessage('Error: No se encontraron los datos del invitado. Por favor, recarga la página.', 'error');
          return;
        }
  
        const payButton = document.getElementById('payButton');
        payButton.disabled = true;
        payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${translate('guests:processing')}`;
  
        try {
          // Crear sesión de pago en el backend
          const response = await fetch('/api/create-payment-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: Math.round(selectedAmount * 100), // Convertir a centavos
              currency: 'eur',
              donorName: name,
              donorEmail: email,
              donorMessage: message,
              successUrl: `${window.location.origin}/guests.html?success=true`,
              cancelUrl: `${window.location.origin}/guests.html?canceled=true`
            })
          });
  
          const session = await response.json();
  
          if (session.error) {
            throw new Error(session.error);
          }
  
          // Redirigir a Stripe Checkout
          const { error } = await stripe.redirectToCheckout({
            sessionId: session.id
          });
  
          if (error) {
            throw new Error(error.message);
          }
  
        } catch (error) {
          console.error('Error:', error);
          showMessage(translate('guests:error') + ': ' + error.message, 'error');
          
          // Restaurar botón
          payButton.disabled = false;
          payButton.innerHTML = `<i class="fas fa-credit-card"></i> ${translate('guests:proceedPayment')}`;
        }
      }
  
      // Function to load payment cards from the server
      async function loadCashGiftCards() {
        try {
          // Automatically fill the authenticated guest data
          const guestName = localStorage.getItem('name');
          const guestEmail = localStorage.getItem('email');
          
          if (guestName && guestEmail) {
            const donorNameInput = document.getElementById('donorName');
            const donorEmailInput = document.getElementById('donorEmail');
            
            if (donorNameInput) donorNameInput.value = guestName;
            if (donorEmailInput) donorEmailInput.value = guestEmail;
          }
          
          // Add timestamp to avoid cache
          const response = await fetch(`/api/cash-gift-cards?_t=${Date.now()}`);
          const cards = await response.json();
          
          const amountOptionsContainer = document.querySelector('.amount-options');
          if (amountOptionsContainer) {
            // Limpiar opciones existentes
            amountOptionsContainer.innerHTML = '';
            
            // Add all cards from the server (including the default ones)
            cards.forEach(card => {
              const cardElement = document.createElement('div');
              cardElement.className = 'amount-option';
              cardElement.dataset.amount = card.amount;
              
              // Si la tarjeta tiene imagen de fondo, aplicarla
              const backgroundStyle = card.imageUrl ? 
                `background-image: url('${card.imageUrl}'); background-size: cover; background-position: center; background-blend-mode: overlay;` : '';
              
              cardElement.style.cssText = backgroundStyle;
              
              cardElement.innerHTML = `
                <div class="amount">€${card.amount}</div>
                <div class="label">${card.label}</div>
              `;
              
              // Agregar descripción si existe
              if (card.description) {
                const descElement = document.createElement('div');
                descElement.className = 'description';
                descElement.style.cssText = 'font-size: 0.8em; color: #6c757d; margin-top: 5px;';
                descElement.textContent = card.description;
                cardElement.appendChild(descElement);
              }
              
              amountOptionsContainer.appendChild(cardElement);
            });
            
            // Agregar event listeners a las nuevas opciones
            document.querySelectorAll('.amount-option').forEach(option => {
              option.addEventListener('click', () => {
                const amount = parseFloat(option.dataset.amount);
                selectAmount(amount, option);
              });
            });
          }
        } catch (error) {
          console.error('Error loading cash gift cards:', error);
          // En caso de error, mostrar mensaje de error
          const amountOptionsContainer = document.querySelector('.amount-options');
          if (amountOptionsContainer) {
            amountOptionsContainer.innerHTML = `
              <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3em; margin-bottom: 15px; opacity: 0.5;"></i>
                <h4>Error al cargar las tarjetas de pago</h4>
                <p>Por favor, recarga la página o contacta con el administrador.</p>
              </div>
            `;
          }
        }
      }
  
      // Función para recargar tarjetas cuando se cambie a la pestaña de efectivo
      function reloadCashGiftCards() {
        const efectivoTab = document.querySelector('[data-tab="gifts"]');
        if (efectivoTab) {
          efectivoTab.addEventListener('click', () => {
            // Recargar tarjetas cuando se haga clic en la pestaña de efectivo
            setTimeout(() => {
              loadCashGiftCards();
            }, 100);
          });
        }
      }
  
      // Inicializar funcionalidad de regalos en efectivo cuando se carga la página
      document.addEventListener('DOMContentLoaded', () => {
        // Cargar tarjetas de pago del servidor
        loadCashGiftCards();
        
        // Configurar recarga automática en la pestaña de efectivo
        reloadCashGiftCards();
  
  
        // Validación de formulario
        const donorNameInput = document.getElementById('donorName');
        const donorEmailInput = document.getElementById('donorEmail');
        if (donorNameInput) donorNameInput.addEventListener('input', checkFormValidity);
        if (donorEmailInput) donorEmailInput.addEventListener('input', checkFormValidity);
  
        // Botón de pago
        const payButton = document.getElementById('payButton');
        if (payButton) {
          payButton.addEventListener('click', processPayment);
        }
  
        // Manejar parámetros de URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
          showMessage('¡Gracias por tu generoso regalo! Los novios estarán muy agradecidos.', 'success');
        } else if (urlParams.get('canceled') === 'true') {
          showMessage('El pago fue cancelado. Puedes intentar nuevamente cuando quieras.', 'info');
        }
      });