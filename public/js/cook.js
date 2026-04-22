// ── Cook Module ──────────────────────────────────────────────────
const Cook = (function() {
  let currentRecipe   = null;
  let currentPersona  = null;
  let currentStep     = 0;
  let isPlaying       = false;
  let cameraStream    = null;
  let selectedPersonaId = null;

  // ── View management ──────────────────────────────────────────
  function showView(name) {
    document.querySelectorAll('.cook-view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(`cook-${name}`);
    if (view) view.classList.add('active');
  }

  // ── Recipe Upload / Scan ─────────────────────────────────────
  async function scanImage(file) {
    showScanningOverlay(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/recipes/scan', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      loadRecipePreview(data.recipe);
    } catch (err) {
      App.toast('Could not read recipe: ' + err.message, 'error');
      showView('add-recipe');
    } finally {
      showScanningOverlay(false);
    }
  }

  async function loadDemoRecipe() {
    showScanningOverlay(true);
    try {
      const res  = await fetch('/api/recipes/demo');
      const data = await res.json();
      loadRecipePreview(data.recipe);
    } catch (err) {
      App.toast('Could not load demo recipe', 'error');
    } finally {
      showScanningOverlay(false);
    }
  }

  function showScanningOverlay(show) {
    const el = document.getElementById('cook-scanning-overlay');
    if (el) el.classList.toggle('hidden', !show);
  }

  function loadRecipePreview(recipe) {
    currentRecipe = recipe;
    document.getElementById('preview-title').textContent  = recipe.title;
    document.getElementById('preview-meta').textContent   = [recipe.prepTime, recipe.servings ? recipe.servings + ' servings' : ''].filter(Boolean).join(' · ');
    document.getElementById('preview-ingredients').innerHTML = (recipe.ingredients || []).map(i => `<div class="ingredient-item">• ${i}</div>`).join('');
    document.getElementById('preview-steps').innerHTML = (recipe.steps || []).map((s, idx) => `<div class="step-item"><span class="step-num">${idx + 1}</span><span>${s}</span></div>`).join('');
    showView('recipe-preview');
  }

  // ── Camera ────────────────────────────────────────────────────
  async function openCamera() {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.getElementById('camera-video');
      video.srcObject = cameraStream;
      document.getElementById('camera-modal').classList.add('open');
    } catch (err) {
      App.toast('Camera not available — please upload a file instead', 'error');
    }
  }

  function closeCamera() {
    cameraStream?.getTracks().forEach(t => t.stop());
    cameraStream = null;
    document.getElementById('camera-modal').classList.remove('open');
  }

  function capturePhoto() {
    const video  = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      closeCamera();
      if (blob) scanImage(new File([blob], 'recipe.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  }

  // ── Persona Selection ───────────────────────────────────────
  async function loadPersonaSelect() {
    showView('persona-select');
    selectedPersonaId = null;
    document.getElementById('begin-cook-btn').disabled = true;

    let personas = [];
    if (!App.isDemoMode()) {
      const res = await fetch('/api/personas');
      if (res.ok) { const d = await res.json(); personas = d.personas || []; }
    } else {
      personas = [{ _id: 'demo', name: 'Nonna Rosa', description: 'Warm, from Naples. Loves garlic!', imageUrl: null }];
    }

    const grid = document.getElementById('persona-select-grid');
    grid.innerHTML = personas.map(p => `
      <div class="persona-card card-tap" data-id="${p._id}" onclick="Cook.selectPersona('${p._id}', this)">
        <div class="persona-photo">${p.imageUrl ? `<img src="${p.imageUrl}" />` : ''}</div>
        <div class="persona-name">${p.name}</div>
        <div class="persona-desc">${p.description || ''}</div>
      </div>`).join('') + `
      <div class="persona-card add-persona-card card-tap" onclick="Cook.openPersonaModal()">
        <div class="persona-photo" style="font-size:28px; color:var(--orange);">+</div>
        <div class="persona-name text-orange">New Nonna</div>
        <div class="persona-desc">Create a custom guide</div>
      </div>`;

    if (personas.length === 1) {
      // Auto-select the only one
      const card = grid.querySelector(`[data-id="${personas[0]._id}"]`);
      Cook.selectPersona(personas[0]._id, card);
      currentPersona = personas[0];
    }
  }

  function selectPersona(id, el) {
    document.querySelectorAll('#persona-select-grid .persona-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedPersonaId = id;

    // Find persona object
    const allCards = document.querySelectorAll('#persona-select-grid [data-id]');
    allCards.forEach(c => {
      if (c.dataset.id === id) {
        currentPersona = {
          _id: id,
          name: c.querySelector('.persona-name')?.textContent,
          description: c.querySelector('.persona-desc')?.textContent,
          imageUrl: c.querySelector('img')?.src || null
        };
      }
    });
    document.getElementById('begin-cook-btn').disabled = false;
  }

  // ── Persona Create Modal ──────────────────────────────────────
  let personaImageData = null;

  function openPersonaModal() {
    document.getElementById('persona-modal').classList.add('open');
    document.getElementById('persona-name-input').value = '';
    document.getElementById('persona-desc-input').value = '';
    document.getElementById('persona-avatar-preview').innerHTML = '';
    personaImageData = null;
  }

  function closePersonaModal() {
    document.getElementById('persona-modal').classList.remove('open');
  }

  async function savePersona() {
    const name = document.getElementById('persona-name-input')?.value.trim();
    const desc = document.getElementById('persona-desc-input')?.value.trim();
    if (!name) return App.toast('Please give your Nonna a name', 'error');

    const btn = document.getElementById('persona-modal-save');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      if (App.isDemoMode()) {
        App.toast('Demo mode — persona saved locally', 'success');
        currentPersona = { _id: 'new-' + Date.now(), name, description: desc, imageUrl: personaImageData };
        closePersonaModal();
        loadPersonaSelect();
        return;
      }

      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', desc || '');
      if (personaImageData) {
        const blob = await (await fetch(personaImageData)).blob();
        fd.append('image', blob, 'persona.jpg');
      }

      const res  = await fetch('/api/personas', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      App.toast(`${name} is ready! `, 'success');
      closePersonaModal();
      loadPersonaSelect();
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      btn.textContent = 'Create Nonna ';
      btn.disabled = false;
    }
  }

  // ── Cook Session ─────────────────────────────────────────────
  function beginSession() {
    if (!currentPersona || !currentRecipe) return;
    currentStep = 0;
    showView('cook-session-view');
    renderSession();
    speakStep();
  }

  function renderSession() {
    const steps = currentRecipe.steps || [];
    const step  = steps[currentStep] || '';
    const total = steps.length;

    document.getElementById('step-counter').textContent  = `Step ${currentStep + 1} of ${total}`;
    document.getElementById('step-text').textContent     = step;
    document.getElementById('session-persona-name').textContent   = currentPersona.name || 'Nonna';
    document.getElementById('session-recipe-title').textContent   = currentRecipe.title || 'Recipe';
    document.getElementById('step-progress-fill').style.width     = `${((currentStep + 1) / total) * 100}%`;
    document.getElementById('prev-step-btn').disabled = currentStep === 0;
    document.getElementById('next-step-btn').textContent = currentStep === total - 1 ? ' Finish!' : 'Next Step';

    // Persona image
    const imgEl = document.getElementById('session-persona-img');
    imgEl.innerHTML = currentPersona.imageUrl
      ? `<img src="${currentPersona.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
      : '';
    const bubbleAvatar = document.getElementById('session-bubble-avatar');
    bubbleAvatar.innerHTML = currentPersona.imageUrl
      ? `<img src="${currentPersona.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
      : '';

    document.getElementById('persona-response-bubble').classList.add('hidden');
    document.getElementById('qa-input-field').value = '';
  }

  async function speakStep() {
    const step = (currentRecipe.steps || [])[currentStep];
    if (!step) return;
    await speakText(step);
  }

  async function speakText(text) {
    if (App.isDemoMode()) return; // No TTS in demo mode
    try {
      showAudioIndicator(true);
      const res  = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: currentPersona?.voiceId || 'XrExE9yKIg1WjnnlVkGX' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const audio = document.getElementById('tts-audio');
      audio.src = `data:audio/mpeg;base64,${data.audio}`;
      audio.onended = () => showAudioIndicator(false);
      audio.onerror = () => showAudioIndicator(false);
      await audio.play();
    } catch (err) {
      showAudioIndicator(false);
      console.warn('TTS error:', err.message);
    }
  }

  function showAudioIndicator(show) {
    document.getElementById('audio-indicator')?.classList.toggle('hidden', !show);
    isPlaying = show;
  }

  async function askQuestion(question) {
    if (!question.trim()) return;
    try {
      const res  = await fetch('/api/openai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          personaName: currentPersona?.name,
          personaDescription: currentPersona?.description,
          recipeTitle: currentRecipe?.title,
          currentStep: (currentRecipe?.steps || [])[currentStep]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const answer = data.answer;
      document.getElementById('persona-response-text').textContent = answer;
      document.getElementById('persona-response-bubble').classList.remove('hidden');
      await speakText(answer);
    } catch (err) {
      App.toast('Could not get a response: ' + err.message, 'error');
    }
  }

  // Voice recognition
  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return App.toast('Voice not supported in this browser', 'error');
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    const btn = document.getElementById('mic-btn');
    btn.classList.add('listening');
    rec.start();
    rec.onresult = e => {
      const t = e.results[0][0].transcript.toLowerCase();
      btn.classList.remove('listening');
      if (t.includes('next') || t.includes('next step') || t.includes('continue')) {
        nextStep();
      } else if (t.includes('previous') || t.includes('go back') || t.includes('back')) {
        prevStep();
      } else {
        document.getElementById('qa-input-field').value = e.results[0][0].transcript;
        askQuestion(e.results[0][0].transcript);
      }
    };
    rec.onerror = () => btn.classList.remove('listening');
    rec.onend   = () => btn.classList.remove('listening');
  }

  function nextStep() {
    const steps = currentRecipe?.steps || [];
    if (currentStep >= steps.length - 1) return completeRecipe();
    currentStep++;
    renderSession();
    speakStep();
  }

  function prevStep() {
    if (currentStep > 0) { currentStep--; renderSession(); speakStep(); }
  }

  async function completeRecipe() {
    // Stop audio
    const audio = document.getElementById('tts-audio');
    audio.pause();
    showAudioIndicator(false);

    // Save to vault
    if (!App.isDemoMode() && currentRecipe) {
      try {
        await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...currentRecipe, personaId: currentPersona?._id })
        });
      } catch (err) {
        console.warn('Could not save recipe:', err);
      }
    }
    showView('cook-complete-view');
  }

  function endSession() {
    if (confirm('End cooking session?')) {
      document.getElementById('tts-audio')?.pause();
      showView('add-recipe');
    }
  }

  function init() {
    // File upload
    document.getElementById('upload-file-card')?.addEventListener('click', () => {
      document.getElementById('recipe-file-input')?.click();
    });
    document.getElementById('recipe-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) scanImage(file);
    });

    // Camera
    document.getElementById('camera-card')?.addEventListener('click', openCamera);
    document.getElementById('camera-cancel-btn')?.addEventListener('click', closeCamera);
    document.getElementById('camera-capture-btn')?.addEventListener('click', capturePhoto);
    document.getElementById('camera-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('camera-modal')) closeCamera();
    });

    // Demo recipe
    document.getElementById('demo-recipe-card')?.addEventListener('click', loadDemoRecipe);

    // Start cooking → persona select
    document.getElementById('start-cooking-btn')?.addEventListener('click', loadPersonaSelect);

    // Begin session
    document.getElementById('begin-cook-btn')?.addEventListener('click', beginSession);

    // Session controls
    document.getElementById('next-step-btn')?.addEventListener('click', nextStep);
    document.getElementById('prev-step-btn')?.addEventListener('click', prevStep);
    document.getElementById('mic-btn')?.addEventListener('click', startListening);
    document.getElementById('qa-input-field')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') askQuestion(e.target.value);
    });

    // Persona modal
    document.getElementById('persona-modal-cancel')?.addEventListener('click', closePersonaModal);
    document.getElementById('persona-modal-save')?.addEventListener('click', savePersona);
    document.getElementById('persona-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('persona-modal')) closePersonaModal();
    });

    // Persona image picker
    const personaImgTrigger = document.getElementById('persona-avatar-upload-trigger');
    const personaImgPreview = document.getElementById('persona-avatar-preview');
    const personaImgInput   = document.getElementById('persona-image-input');
    personaImgTrigger?.addEventListener('click', () => personaImgInput?.click());
    personaImgPreview?.addEventListener('click', () => personaImgInput?.click());
    personaImgInput?.addEventListener('change', () => {
      const file = personaImgInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        personaImageData = e.target.result;
        personaImgPreview.innerHTML = `<img src="${personaImageData}" alt="persona" />`;
      };
      reader.readAsDataURL(file);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { showView, selectPersona, openPersonaModal, endSession };
})();
