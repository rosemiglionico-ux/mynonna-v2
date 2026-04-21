// ── Settings Module ──────────────────────────────────────────────
const Settings = (function() {

  async function signOut() {
    if (!confirm('Sign out of MyNonna?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    App.setUser(null);
    App.setDemoMode(false);
    localStorage.removeItem('mn_intro_seen');
    App.navigate('intro');
    App.toast('Signed out. A presto! 👋');
  }

  async function deleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;
    const doubleCheck = confirm('This will permanently delete all your recipes, Nonnas, and family data. Continue?');
    if (!doubleCheck) return;
    try {
      const res = await fetch('/api/auth/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      App.navigate('intro');
      App.toast('Account deleted. Arrivederci 💔');
    } catch (err) {
      App.toast('Could not delete account: ' + err.message, 'error');
    }
  }

  function openSubscription() {
    App.toast('Subscription plans coming soon! 🌟');
  }

  function openNotifications() {
    App.toast('Notification settings coming soon!');
  }

  function openPrivacy() {
    App.toast('Privacy & Security settings coming soon!');
  }

  function init() {
    document.getElementById('signout-btn')?.addEventListener('click', signOut);
    document.getElementById('delete-account-btn')?.addEventListener('click', deleteAccount);
  }

  document.addEventListener('DOMContentLoaded', init);
  return { openSubscription, openNotifications, openPrivacy };
})();
