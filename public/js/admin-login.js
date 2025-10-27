document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Helper i18n with fallback
  const t = (key, fallback) => {
    try {
      if (typeof window.translate === 'function') {
        const txt = window.translate(key);
        if (txt && txt !== key) return txt;
      }
    } catch (_) {}
    return fallback || key;
  };

  // Create or reuse a message area under the form
  let msg = document.getElementById('adminLoginMsg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'adminLoginMsg';
    msg.style.marginTop = '1rem';
    msg.style.textAlign = 'center';
    form.parentNode.insertBefore(msg, form.nextSibling);
  }

  const showMsg = (text, type = 'info') => {
    msg.textContent = text;
    const palette = {
      info: { bg: '#eef', border: '#88f', color: '#224' },
      success: { bg: '#ddffdd', border: '#070', color: '#070' },
      error: { bg: '#ffdddd', border: '#a00', color: '#a00' }
    };
    const p = palette[type] || palette.info;
    msg.style.background = p.bg;
    msg.style.border = `1px solid ${p.border}`;
    msg.style.color = p.color;
    msg.style.padding = '0.75rem';
    msg.style.borderRadius = '6px';
  };

  const setBusy = (busy) => {
    if (submitBtn) {
      submitBtn.disabled = busy;
      submitBtn.style.opacity = busy ? '0.7' : '';
      submitBtn.style.cursor = busy ? 'wait' : '';
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (usernameEl?.value || '').trim();
    const password = (passwordEl?.value || '').trim();

    if (!email || !password) {
      showMsg(t('adminLogin:enterCredentials', 'Please enter username and password'), 'error');
      return;
    }

    setBusy(true);
    showMsg(t('common:loading', 'Loading...'), 'info');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.token) {
        // Expect server to return tipo: 'admin' for admins
        if (data.tipo && data.tipo !== 'admin') {
          showMsg(t('adminLogin:notAdmin', 'This account is not an admin'), 'error');
          setBusy(false);
          return;
        }
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminEmail', email);
        showMsg(t('adminLogin:successRedirect', 'Login successful. Redirecting...'), 'success');
        setTimeout(() => {
          window.location.href = '/admin.html';
        }, 500);
      } else {
        const err = (data && (data.error || data.message)) || t('adminLogin:invalid', 'Invalid username or password');
        showMsg(err, 'error');
        setBusy(false);
      }
    } catch (error) {
      console.error('Admin login error:', error);
      showMsg(t('adminLogin:serverError', 'Server connection error'), 'error');
      setBusy(false);
    }
  });
});
