// Minimal admin client script to avoid 404s and provide basic behavior
(function(){
  const content = document.getElementById('adminContent');
  const logoutBtn = document.getElementById('logoutAdmin');

  function t(key, fallback){
    try{
      if (typeof window.translate === 'function'){
        const v = window.translate(key);
        if (v && v !== key) return v;
      }
    } catch(_){}
    return fallback || key;
  }

  function showWelcome(){
    if (!content) return;
    const email = localStorage.getItem('adminEmail') || '';
    content.innerHTML = `
      <div class="card" style="padding:1rem;">
        <h3><i class="fas fa-user-shield"></i> ${t('admin:welcomeTitle','Welcome, Administrator')}</h3>
        <p>${t('admin:welcomeDesc','Manage all wedding information for Iluminada and George')}</p>
        ${email ? `<p style="opacity:.8">${email}</p>` : ''}
        <div style="margin-top:1rem;">
          <small>${t('admin:loading','Loading admin panel...')}</small>
        </div>
      </div>`;
  }

  function ensureAuth(){
    const token = localStorage.getItem('adminToken');
    if (!token){
      window.location.href = '/admin-login.html';
      return false;
    }
    return true;
  }

  if (!ensureAuth()) return;
  showWelcome();

  if (logoutBtn){
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminEmail');
      window.location.href = '/index.html';
    });
  }
})();
