document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const messageDiv = document.getElementById('loginMessage');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const continueBtn = document.getElementById('continueBtn');
  const backBtn = document.getElementById('backBtn');
  const passwordSection = document.getElementById('passwordSection');
  const emailDisplay = document.getElementById('emailDisplay');
  const loginBtn = document.getElementById('loginBtn');
  const togglePassword = document.getElementById('togglePassword');

  let currentEmail = '';
  let userType = '';

  // Función para obtener traducción
  function translate(key) {
    const currentLang = localStorage.getItem('i18nextLng') || 'es';
    const translations = {
      es: {
        'login:successMessage': 'Acceso exitoso. Redirigiendo...',
        'login:errorEmailRequired': 'Por favor, introduce tu email.',
        'login:errorEmailNotFound': 'Email no encontrado en la lista de invitados',
        'login:errorConnection': 'Error de conexión con el servidor',
        'login:continueButton': 'Acceder',
        'login:backButton': '← Volver',
        'login:passwordLabel': 'Contraseña:',
        'login:passwordPlaceholder': 'Introduce tu contraseña',
        'login:accessButton': 'Acceder',
        'login:adminSuccessMessage': 'Acceso de administrador exitoso. Redirigiendo...',
        'login:errorPasswordRequired': 'Por favor, introduce tu contraseña.',
        'login:errorLogin': 'Error en el acceso',
        'login:submitButton': 'Acceder'
      },
      en: {
        'login:successMessage': 'Access successful. Redirecting...',
        'login:errorEmailRequired': 'Please enter your email.',
        'login:errorEmailNotFound': 'Email not found in guest list',
        'login:errorConnection': 'Server connection error',
        'login:continueButton': 'Access',
        'login:backButton': '← Back',
        'login:passwordLabel': 'Password:',
        'login:passwordPlaceholder': 'Enter your password',
        'login:accessButton': 'Access',
        'login:adminSuccessMessage': 'Administrator access successful. Redirecting...',
        'login:errorPasswordRequired': 'Please enter your password.',
        'login:errorLogin': 'Login error',
        'login:submitButton': 'Access'
      },
      fr: {
        'login:successMessage': 'Accès réussi. Redirection...',
        'login:errorEmailRequired': 'Veuillez entrer votre email.',
        'login:errorEmailNotFound': 'Email non trouvé dans la liste des invités',
        'login:errorConnection': 'Erreur de connexion au serveur',
        'login:continueButton': 'Accéder',
        'login:backButton': '← Retour',
        'login:passwordLabel': 'Mot de passe:',
        'login:passwordPlaceholder': 'Entrez votre mot de passe',
        'login:accessButton': 'Accéder',
        'login:adminSuccessMessage': 'Accès administrateur réussi. Redirection...',
        'login:errorPasswordRequired': 'Veuillez entrer votre mot de passe.',
        'login:errorLogin': 'Erreur de connexion',
        'login:submitButton': 'Accéder'
      }
    };
    
    return translations[currentLang]?.[key] || translations.es[key] || key;
  }

  function showMessage(msg, type = 'error') {
    messageDiv.textContent = msg;
    messageDiv.style.background = type === 'error' ? '#ffebee' : '#e8f5e8';
    messageDiv.style.color = type === 'error' ? '#c62828' : '#2e7d32';
    messageDiv.style.border = type === 'error' ? '1px solid #ffcdd2' : '1px solid #c8e6c9';
    messageDiv.style.padding = '10px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.textAlign = 'center';
  }
  
  function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.style.background = '';
    messageDiv.style.color = '';
    messageDiv.style.border = '';
    messageDiv.style.padding = '';
    messageDiv.style.borderRadius = '';
  }

  function showStep1() {
    step1.style.display = 'block';
    step2.style.display = 'none';
    passwordSection.style.display = 'none';
    clearMessage();
    emailInput.value = '';
    passwordInput.value = '';
    currentEmail = '';
    userType = '';
  }

  function showStep2(email, type) {
    currentEmail = email;
    userType = type;
    step1.style.display = 'none';
    step2.style.display = 'block';
    emailDisplay.textContent = email;
    
    if (type === 'admin') {
      passwordSection.style.display = 'block';
      passwordInput.required = true;
      loginBtn.textContent = translate('login:submitButton');
    } else {
      passwordSection.style.display = 'none';
      passwordInput.required = false;
      loginBtn.textContent = translate('login:accessButton');
    }
    
    clearMessage();
  }

  // Toggle password visibility
  togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Limpiar mensaje al escribir
  emailInput.addEventListener('input', clearMessage);
  passwordInput.addEventListener('input', clearMessage);

  // Botón continuar (Paso 1) - Ahora maneja acceso directo para invitados
  continueBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    if (!email) {
      emailInput.style.borderColor = '#a00';
      showMessage(translate('login:errorEmailRequired'), 'error');
      return;
    } else {
      emailInput.style.borderColor = '';
    }

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.tipo === 'invitado') {
          // Para invitados: acceso directo sin contraseña
          const loginResponse = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('nombre', loginData.nombre);
            localStorage.setItem('email', loginData.email);
            localStorage.setItem('isAdmin', 'false');
            showMessage(translate('login:successMessage'), 'success');
            setTimeout(() => {
              window.location.href = 'invitados-i18n.html';
            }, 800);
          } else {
            showMessage(loginData.error || translate('login:errorLogin'), 'error');
          }
        } else if (data.tipo === 'admin') {
          // Para administradores: mostrar paso 2 con contraseña
          showStep2(email, data.tipo);
        }
      } else {
        showMessage(data.error || translate('login:errorEmailNotFound'), 'error');
      }
    } catch (err) {
      showMessage(translate('login:errorConnection'), 'error');
    }
  });

  // Botón volver
  backBtn.addEventListener('click', () => {
    showStep1();
  });

  // Submit del formulario (Paso 2) - Solo para administradores
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = currentEmail;
    const password = passwordInput.value.trim();
    
    // Validación para administradores
    if (userType === 'admin' && !password) {
      passwordInput.style.borderColor = '#a00';
      showMessage(translate('login:errorPasswordRequired'), 'error');
      return;
    } else {
      passwordInput.style.borderColor = '';
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Guardar el token y datos en localStorage
        if (data.tipo === 'admin') {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('isAdmin', 'true');
          showMessage(translate('login:adminSuccessMessage'), 'success');
          setTimeout(() => {
            window.location.href = 'admin-i18n.html';
          }, 800);
        }
      } else {
        if (data.requierePassword) {
          showStep2(email, 'admin');
          showMessage(data.error, 'error');
        } else {
          showMessage(data.error || translate('login:errorLogin'), 'error');
        }
      }
    } catch (err) {
      showMessage(translate('login:errorConnection'), 'error');
    }
  });

  // Enter key en el campo email
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      continueBtn.click();
    }
  });

  // Enter key en el campo password
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      loginBtn.click();
    }
  });
});
