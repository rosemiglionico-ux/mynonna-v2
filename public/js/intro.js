// ── Intro Slides ────────────────────────────────────────────────
const Intro = (function() {
  let current = 0;
  const total = 5;

  function goTo(index) {
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    current = index;
    const track = document.getElementById('slides-track');
    if (track) track.style.transform = `translateX(-${current * 100}%)`;
    updateButtons();
  }

  function next() {
    if (current < total - 1) goTo(current + 1);
  }

  function updateDots() {
    document.querySelectorAll('#slide-dots .dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function updateButtons() {
    const nextBtn = document.getElementById('slide-next-btn');
    const skipBtn = document.getElementById('slide-skip-btn');
    const backBtn = document.getElementById('slide-back-btn');
    if (!nextBtn) return;
    if (current === total - 1) {
      // Last slide = auth landing, hide all nav
      nextBtn.classList.add('hidden');
      skipBtn.classList.add('hidden');
      backBtn.classList.remove('hidden');
      backBtn.style.margin = '0 auto';
    } else {
      nextBtn.classList.remove('hidden');
      skipBtn.classList.remove('hidden');
      backBtn.style.margin = '';
      // Hide Back on first slide
      if (current === 0) {
        backBtn.classList.add('hidden');
      } else {
        backBtn.classList.remove('hidden');
      }
      nextBtn.textContent = current === total - 2 ? 'Get Started →' : 'Next →';
    }
  }

  function jumpToSlide(i) { goTo(i); }

  function init() {
    const nextBtn = document.getElementById('slide-next-btn');
    const skipBtn = document.getElementById('slide-skip-btn');

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (skipBtn) skipBtn.addEventListener('click', () => {
      goTo(total - 1);
      localStorage.setItem('mn_intro_seen', '1');
    });
    const backBtn = document.getElementById('slide-back-btn');
    if (backBtn) backBtn.addEventListener('click', () => goTo(current - 1));

    // Auth landing buttons
    document.getElementById('goto-create')?.addEventListener('click', () => {
      localStorage.setItem('mn_intro_seen', '1');
      App.navigate('create-1');
    });
    document.getElementById('goto-signin')?.addEventListener('click', () => {
      localStorage.setItem('mn_intro_seen', '1');
      App.navigate('signin');
    });
    document.getElementById('try-demo')?.addEventListener('click', () => {
      localStorage.setItem('mn_intro_seen', '1');
      App.setDemoMode(true);
      App.setUser({ name: 'Demo User', username: 'demo', avatar: null, familyId: null });
      App.showApp();
      App.toast('Demo mode — some features are limited ');
    });

    // Touch swipe support for slides
    let startX = 0;
    const wrapper = document.querySelector('.slides-wrapper');
    if (wrapper) {
      wrapper.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      wrapper.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0 && current < total - 1) next();
          else if (diff < 0 && current > 0) goTo(current - 1);
        }
      }, { passive: true });
    }

    updateDots();
    updateButtons();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { jumpToSlide };
})();
