/* BriefDrop – Build loading state */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const loading = $('#loading'), error = $('#error');

  function showError(message) {
    console.error('Brief generation failed:', message);
    loading.hidden = true;
    $('#error-message').textContent = message;
    error.hidden = false;
  }

  async function generate() {
    const started = performance.now();
    try {
      const settings = JSON.parse(sessionStorage.getItem('briefdrop.build') || 'null');
      if (!settings || !settings.skill) throw new Error('Your build choices are missing. Return to the build page and try again.');
      const { briefs } = await window.BriefAI.generate({
        count: 1,
        discipline: settings.skill,
        level: settings.level || undefined,
        topic: settings.industry || undefined,
        avoid: [],
      });
      const brief = briefs && briefs[0];
      if (!brief || !brief.id) throw new Error('No brief was returned. Please try again.');
      const goal = typeof settings.goal === 'string' ? settings.goal.trim() : '';
      if (goal) brief.goal = goal;
      if (settings.platform) brief.platform = settings.platform;
      if (settings.time) brief.time = settings.time;
      brief.summary = [brief.summary, goal && `Goal: ${goal}`].filter(Boolean).join(' · ').slice(0, 260);
      sessionStorage.setItem('briefdrop.project', JSON.stringify(brief));

      const delay = Math.max(0, 700 - (performance.now() - started));
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      location.replace('build-success.html');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'We couldn’t create your brief. Please try again.');
    }
  }

  $('#retry').addEventListener('click', () => location.reload());
  generate();
})();
