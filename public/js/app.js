// ── App State & Router ──────────────────────────────────────────
const App = (function() {
  const state = {
    user: null,
    currentScreen: 'intro',
    currentTab: 'home',
    recipes: [],
    personas: [],
    demoMode: false
  };

  function navigate(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screen}`);
    if (target) target.classList.add('active');
    state.currentScreen = screen;
  }

  function switchTab(tab) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pane = document.getElementById(`tab-${tab}`);
    const nav  = document.getElementById(`nav-${tab}`);
    if (pane) pane.classList.add('active');
    if (nav)  nav.classList.add('active');
    state.currentTab = tab;
    // Fire tab-specific init
    if (tab === 'home')   Home.refresh();
    if (tab === 'vault')  Vault.refresh();
    if (tab === 'family') Family.refresh();
  }

  function setUser(user) {
    state.user = user;
    updateHeaderAvatar();
    updateGreeting();
  }

  function getUser()      { return state.user; }
  function getState()     { return state; }
  function setDemoMode(v) { state.demoMode = v; }
  function isDemoMode()   { return state.demoMode; }

  function updateHeaderAvatar() {
    const btn = document.getElementById('profile-avatar-btn');
    if (!btn) return;
    if (state.user?.avatar) {
      btn.innerHTML = `<img src="${state.user.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      btn.textContent = state.user?.name?.[0]?.toUpperCase() || '';
    }
  }

  function updateGreeting() {
    const el = document.getElementById('home-greeting-text');
    if (!el) return;
    const h = new Date().getHours();
    const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const name = state.user?.name?.split(' ')[0] || 'Chef';
    el.textContent = `Good ${part}, ${name}! `;
  }

  function showApp() {
    navigate('app');
    switchTab('home');
  }

  function toast(msg, type = '') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  async function init() {
    // Check if already logged in
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showApp();
        return;
      }
    } catch (_) {}

    // Check if intro already seen
    if (localStorage.getItem('mn_intro_seen')) {
      navigate('intro');
      // Jump straight to last slide (auth landing)
      if (window.Intro) Intro.jumpToSlide(4);
    } else {
      navigate('intro');
    }
  }

  // Wire up bottom nav
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    init();
  });

  return { navigate, switchTab, setUser, getUser, getState, setDemoMode, isDemoMode, showApp, toast, updateHeaderAvatar };
})();
