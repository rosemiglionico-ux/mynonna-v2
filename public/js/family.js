// ── Family Tab ────────────────────────────────────────────────────
const Family = (function() {
  let pollInterval = null;
  let lastMessageCount = 0;

  async function refresh() {
    await loadMembers();
    startChatPolling();
  }

  async function loadMembers() {
    try {
      const res  = await fetch('/api/family');
      if (!res.ok) return;
      const data = await res.json();
      const family  = data.family;
      const members = family?.members || [];

      document.getElementById('fam-stat-members').textContent = members.length;
      document.getElementById('fam-stat-active').textContent  = members.length; // simplified
      document.getElementById('family-member-count').textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

      const list = document.getElementById('family-members-list');
      const user = App.getUser();
      if (!list) return;

      if (!members.length) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><div class="empty-title">No family members yet</div><p class="text-muted" style="font-size:13px;">Use '+ Add Member' to invite your family!</p></div>`;
        return;
      }

      list.innerHTML = members.map(m => `
        <div class="member-item">
          <div class="member-avatar">${m.avatar ? `<img src="${m.avatar}" />` : (m.name?.[0]?.toUpperCase() || '')}</div>
          <div class="member-info">
            <div class="member-name">${m.name}</div>
            <div class="member-username">@${m.username || 'member'}</div>
          </div>
          ${m._id === family.adminId ? '<span class="member-badge">Admin</span>' : ''}
          ${(user && m._id === user._id) ? '<span class="member-badge" style="background:var(--orange-pale);color:var(--orange);">You</span>' : ''}
        </div>`).join('');
    } catch (err) {
      console.error('Family load error:', err);
    }
  }

  async function loadMessages() {
    try {
      const res  = await fetch('/api/family/chat');
      if (!res.ok) return;
      const data = await res.json();
      const messages = data.messages || [];
      if (messages.length === lastMessageCount) return;
      lastMessageCount = messages.length;
      renderMessages(messages);
    } catch (_) {}
  }

  function renderMessages(messages) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const user = App.getUser();
    container.innerHTML = messages.map(m => {
      const isMine = user && m.userId === user._id;
      return `
        <div class="chat-msg ${isMine ? 'mine' : 'theirs'}">
          ${!isMine ? `<div class="chat-msg-name">${m.username}</div>` : ''}
          <div class="chat-bubble">${escHtml(m.text)}</div>
        </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  async function sendMessage() {
    const input = document.getElementById('chat-input-field');
    const text  = input?.value.trim();
    if (!text) return;
    input.value = '';
    if (App.isDemoMode()) {
      renderMessages([{ userId: 'demo', username: 'You', text, timestamp: new Date() }]);
      return;
    }
    try {
      await fetch('/api/family/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      await loadMessages();
    } catch (err) {
      App.toast('Could not send message', 'error');
    }
  }

  function startChatPolling() {
    if (pollInterval) clearInterval(pollInterval);
    lastMessageCount = 0;
    loadMessages();
    pollInterval = setInterval(loadMessages, 4000);
  }

  function openInviteModal() {
    document.getElementById('invite-email-input').value = '';
    document.getElementById('invite-modal').classList.add('open');
  }

  function closeInviteModal() {
    document.getElementById('invite-modal').classList.remove('open');
  }

  async function sendInvite() {
    const email = document.getElementById('invite-email-input')?.value.trim();
    if (!email) return App.toast('Please enter an email address', 'error');

    const btn = document.getElementById('invite-modal-send');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const res  = await fetch('/api/family/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      App.toast(data.message || 'Invite sent! ', 'success');
      closeInviteModal();
      await loadMembers();
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      btn.textContent = 'Send Invite ';
      btn.disabled = false;
    }
  }

  function init() {
    document.getElementById('invite-family-btn')?.addEventListener('click', openInviteModal);
    document.getElementById('invite-modal-cancel')?.addEventListener('click', closeInviteModal);
    document.getElementById('invite-modal-send')?.addEventListener('click', sendInvite);
    document.getElementById('invite-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('invite-modal')) closeInviteModal();
    });
    document.getElementById('chat-send-btn')?.addEventListener('click', sendMessage);
    document.getElementById('chat-input-field')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  return { refresh };
})();
