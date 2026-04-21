// ── Home Tab ─────────────────────────────────────────────────────
const Home = (function() {
  async function refresh() {
    if (App.isDemoMode()) return loadDemo();
    try {
      const [rRes, pRes, fRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/personas'),
        fetch('/api/family')
      ]);

      const rData = rRes.ok ? await rRes.json() : { recipes: [] };
      const pData = pRes.ok ? await pRes.json() : { personas: [] };
      const fData = fRes.ok ? await fRes.json() : { family: null };

      const recipes        = rData.recipes  || [];
      const personas       = pData.personas || [];
      const familyMembers  = fData.family?.members?.length || 1;

      document.getElementById('stat-recipes').textContent  = recipes.length;
      document.getElementById('stat-personas').textContent = personas.length;
      document.getElementById('stat-family').textContent   = familyMembers;

      renderRecentRecipes(recipes.slice(0, 5));
    } catch (err) {
      console.error('Home refresh error:', err);
    }
  }

  function loadDemo() {
    document.getElementById('stat-recipes').textContent  = '1';
    document.getElementById('stat-personas').textContent = '1';
    document.getElementById('stat-family').textContent   = '1';
    renderRecentRecipes([{
      _id: 'demo',
      title: "Nonna's Spaghetti al Pomodoro",
      prepTime: '40 minutes',
      servings: '4',
      createdAt: new Date().toISOString()
    }]);
  }

  function renderRecentRecipes(recipes) {
    const list = document.getElementById('recent-recipes-list');
    if (!list) return;
    if (!recipes.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <div class="empty-title">No recipes yet</div>
          <p class="text-muted" style="font-size:13px;">Head to Cook to add your first recipe!</p>
        </div>`;
      return;
    }
    list.innerHTML = recipes.map(r => `
      <div class="recipe-card-row card-tap" onclick="App.switchTab('vault')">
        <div class="recipe-thumb">${r.imageUrl ? `<img src="${r.imageUrl}" />` : '🍝'}</div>
        <div class="recipe-info">
          <div class="recipe-name">${r.title}</div>
          <div class="recipe-meta">${r.prepTime || ''} ${r.servings ? '· ' + r.servings + ' servings' : ''}</div>
        </div>
        <div class="recipe-arrow">›</div>
      </div>`).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initial load handled by App.init → switchTab('home') → Home.refresh()
  });

  return { refresh };
})();
