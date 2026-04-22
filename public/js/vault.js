// ── Vault Tab ────────────────────────────────────────────────────
const Vault = (function() {
  let recipes = [], personas = [];

  async function refresh() {
    if (App.isDemoMode()) return loadDemo();
    try {
      const [rRes, pRes] = await Promise.all([fetch('/api/recipes'), fetch('/api/personas')]);
      const rData = rRes.ok ? await rRes.json() : { recipes: [] };
      const pData = pRes.ok ? await pRes.json() : { personas: [] };
      recipes  = rData.recipes  || [];
      personas = pData.personas || [];
      renderRecipes();
      renderPersonas();
    } catch (err) {
      console.error('Vault refresh error:', err);
    }
  }

  function loadDemo() {
    recipes  = [{ _id: 'demo', title: "Nonna's Spaghetti al Pomodoro", prepTime: '40 mins', servings: '4' }];
    personas = [{ _id: 'demo', name: 'Nonna Rosa', description: 'Warm and funny, from Naples.' }];
    renderRecipes(); renderPersonas();
  }

  function renderRecipes() {
    const grid  = document.getElementById('vault-recipes-grid');
    const empty = document.getElementById('vault-recipes-empty');
    if (!grid) return;
    if (!recipes.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    grid.innerHTML = recipes.map(r => `
      <div class="vault-card card-tap">
        <div class="vault-card-thumb">${r.imageUrl ? `<img src="${r.imageUrl}" />` : ''}</div>
        <div class="vault-card-body">
          <div class="vault-card-title">${r.title}</div>
          <div class="vault-card-meta">${r.prepTime || ''}</div>
        </div>
      </div>`).join('');
  }

  function renderPersonas() {
    const grid  = document.getElementById('vault-personas-grid');
    const empty = document.getElementById('vault-personas-empty');
    if (!grid) return;
    if (!personas.length) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    grid.innerHTML = personas.map(p => `
      <div class="vault-card card-tap">
        <div class="vault-card-thumb">${p.imageUrl ? `<img src="${p.imageUrl}" />` : ''}</div>
        <div class="vault-card-body">
          <div class="vault-card-title">${p.name}</div>
          <div class="vault-card-meta">${(p.description || '').slice(0, 40)}...</div>
        </div>
      </div>`).join('');
  }

  function showTab(tab) {
    document.getElementById('vault-tab-recipes')?.classList.toggle('active', tab === 'recipes');
    document.getElementById('vault-tab-personas')?.classList.toggle('active', tab === 'personas');
    document.getElementById('vault-recipes-pane')?.classList.toggle('hidden', tab !== 'recipes');
    document.getElementById('vault-personas-pane')?.classList.toggle('hidden', tab === 'recipes');
  }

  return { refresh, showTab, getPersonas: () => personas };
})();
