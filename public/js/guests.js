
// Configure event listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Refresh settings when window regains focus (in case admin changed settings)
  window.addEventListener('focus', async () => {
    await initializeSettingsVisibility();
  });

  //////////////////////////////////////////////////////////////
  // Main
  //////////////////////////////////////////////////////////////

  // If user is an Admin then also log in as guest
  if (window.isAdminLoggedIn()) {
    try {
      const email = localStorage.getItem('adminEmail'); 
      // See if a guest exists with the same email as the admin
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const guest = await response.json();
      if (response.ok) {
        // Save token and data in localStorage
        localStorage.setItem('token', guest.token);
        localStorage.setItem('name', guest.name);
        localStorage.setItem('email', guest.email);
      }
    } catch (e) { }
  }

  if (!window.token) {
    window.location.href = 'login.html';
    return;
  }  

  // Make globally accessible
  window.loadEventsContent  = loadEventsContent;
  window.saveEventChoices   = saveEventChoices;
  window.loadGiftsContent   = loadGiftsContent;
  window.loadPartyContent   = loadPartyContent;
  window.loadSummaryContent = loadSummaryContent;

  // Initialize settings-based visibility
  await window.initializeSettingsVisibility();
  
  try {
    const response = await fetch('/api/guest/profile', {
      method: 'GET',
      headers: { 'Authorization': window.token }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const name = data.name || data.name || 'guest';
      console.log(`Welcome, ${name}!`);
      const uiLang = window.currentLanguage;
      const storedLang = data.lang;
      if (uiLang && uiLang !== storedLang) {
        fetch('/api/guest/me/lang', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': window.token },
          body: JSON.stringify({ lang: uiLang }),
        }).catch(() => {});
      }
    } else {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error connecting to the server.');
  }
  
  window.tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchToTab(targetTab);
    });
  });

  // Load preferred language
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang && languages[savedLang]) {
    window.currentLanguage = savedLang;
  }

  const activeTab = document.querySelector('.tab-btn.active');
  const targetTab = activeTab.getAttribute('data-tab');
  const urlParams = new URLSearchParams(window.location.search);
  const urlTab = urlParams.get('tab');
  switchToTab(urlTab || targetTab || 'summary', urlTab ? false : true)
});

