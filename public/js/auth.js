// ── Auth Module ──────────────────────────────────────────────────
const Auth = (function() {
  // Temp storage across create steps
  const pending = { name: '', email: '', password: '', username: '', avatar: null };

  function togglePw(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn   = document.getElementById(btnId);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  }

  // ── Sign In ──────────────────────────────────────────────────
  async function signIn() {
    const email    = document.getElementById('signin-email')?.value.trim();
    const password = document.getElementById('signin-password')?.value;
    if (!email || !password) return App.toast('Please fill in all fields', 'error');

    const btn = document.getElementById('signin-submit-btn');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const res  = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      App.setUser(data.user);
      App.toast('Welcome back! ', 'success');
      App.showApp();
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  }

  // ── Create Step 1 ───────────────────────────────────────────
  function step1Next() {
    const name = document.getElementById('create-name')?.value.trim();
    if (!name) return App.toast('Please enter your name', 'error');
    pending.name = name;
    App.navigate('create-2');
  }

  // ── Create Step 2 ───────────────────────────────────────────
  function step2Next() {
    const email   = document.getElementById('create-email')?.value.trim();
    const pw      = document.getElementById('create-password')?.value;
    const pwConf  = document.getElementById('create-password-confirm')?.value;
    if (!email || !pw) return App.toast('Please fill in all fields', 'error');
    if (pw.length < 8) return App.toast('Password must be at least 8 characters', 'error');
    if (pw !== pwConf) return App.toast('Passwords do not match', 'error');
    pending.email    = email;
    pending.password = pw;
    App.navigate('create-3');
  }

  // ── Create Step 3 & Submit ───────────────────────────────────
  async function submitCreate() {
    const username = document.getElementById('create-username')?.value.trim();
    if (!username) return App.toast('Please choose a username', 'error');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return App.toast('Username: letters, numbers and _ only', 'error');
    pending.username = username;

    const btn = document.getElementById('create-step3-submit');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      // Register
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pending.name, email: pending.email, password: pending.password, username: pending.username })
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

      // Upload avatar if chosen
      if (pending.avatar) {
        await fetch('/api/auth/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: pending.avatar })
        });
        regData.user.avatar = pending.avatar;
      }

      App.setUser(regData.user);
      App.toast(`Welcome, ${pending.name}! `, 'success');
      App.showApp();
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      btn.textContent = 'Create My Kitchen ';
      btn.disabled = false;
    }
  }

  // ── Avatar picker ────────────────────────────────────────────
  function initAvatarPicker(triggerEl, previewEl, inputEl) {
    triggerEl?.addEventListener('click', () => inputEl?.click());
    previewEl?.addEventListener('click', () => inputEl?.click());
    inputEl?.addEventListener('change', () => {
      const file = inputEl.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const data = e.target.result;
        pending.avatar = data;
        previewEl.innerHTML = `<img src="${data}" alt="avatar" />`;
      };
      reader.readAsDataURL(file);
    });
  }

  function init() {
    // Sign In
    document.getElementById('signin-submit-btn')?.addEventListener('click', signIn);
    document.getElementById('signin-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('signin-password')?.focus(); });
    document.getElementById('signin-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') signIn(); });
    document.getElementById('switch-to-create')?.addEventListener('click', () => App.navigate('create-1'));
    document.getElementById('switch-to-signin-from-create')?.addEventListener('click', () => App.navigate('signin'));
    togglePw('signin-password', 'toggle-signin-pw');
    togglePw('create-password', 'toggle-create-pw');

    // Create steps
    document.getElementById('create-step1-next')?.addEventListener('click', step1Next);
    document.getElementById('create-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') step1Next(); });
    document.getElementById('create-step2-next')?.addEventListener('click', step2Next);
    document.getElementById('create-step3-submit')?.addEventListener('click', submitCreate);

    initAvatarPicker(
      document.getElementById('avatar-upload-trigger'),
      document.getElementById('avatar-preview-create'),
      document.getElementById('avatar-file-input')
    );
  }

  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
