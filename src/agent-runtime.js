(() => {
  const query = new URLSearchParams(location.search);
  const agentMode = query.get('agent') === '1';
  if (agentMode) {
    document.documentElement.dataset.agentMode = 'true';
    const style = document.createElement('style');
    style.textContent = '[data-agent-mode="true"] *,html[data-agent-mode="true"] *{animation-duration:.01ms!important;transition-duration:.01ms!important}';
    document.head.append(style);
  }

  const shell = document.querySelector('[data-retro-runtime]');
  const frame = shell?.querySelector('iframe');
  const findStatus = () => document.getElementById('game-status') || document.querySelector('#result, .runtime-status, .status, [role="status"]');
  let status = findStatus();
  if (!status && shell) {
    status = document.createElement('div');
    status.className = 'agent-runtime-status';
    shell.prepend(status);
  }
  if (status) {
    status.id = 'game-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.dataset.runtimeState = 'loading';
  }

  const classify = (value = '') => {
    const text = value.toLowerCase();
    if (/error|failed|unavailable|crash/.test(text)) return 'error';
    if (/paused|pause/.test(text)) return 'paused';
    if (/stopped|closed/.test(text)) return 'stopped';
    if (/ready|running|playing|loaded|gameplay/.test(text)) return 'ready';
    return 'loading';
  };
  const setState = (state, message) => {
    if (!status) return;
    status.dataset.runtimeState = state;
    if (message && !status.textContent.trim()) status.textContent = message;
  };
  if (status) {
    const observer = new MutationObserver(() => { status.dataset.runtimeState = classify(status.textContent); });
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    window.setTimeout(() => { if (status.dataset.runtimeState === 'loading') setState('ready', `READY — ${document.title}`); }, 1800);
  }

  const click = (selector) => document.querySelector(selector)?.click();
  const pressKey = (key) => {
    const target = frame?.contentDocument?.activeElement || frame?.contentDocument?.querySelector('canvas') || document.activeElement || document.body;
    const init = { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, bubbles: true, cancelable: true };
    target?.dispatchEvent(new KeyboardEvent('keydown', init));
    window.setTimeout(() => target?.dispatchEvent(new KeyboardEvent('keyup', init)), 35);
  };
  const fullscreen = async () => {
    const target = shell?.querySelector('[data-runtime-fullscreen], #btn-fullscreen, #btn-fullscreen-touch') || shell;
    if (document.fullscreenElement) return document.exitFullscreen();
    if (target?.click && target !== shell) return target.click();
    return shell?.requestFullscreen?.({ navigationUI: 'hide' });
  };
  window.RetroPlayAgent = {
    launchGame(id) {
      const link = document.querySelector(`[data-game-id="${CSS.escape(id)}"] a[data-agent-action="launch-game"], a[data-game-id="${CSS.escape(id)}"]`);
      if (link?.href) location.href = link.href;
    },
    pause() { click('[data-agent-action="pause"], #btn-pause, #pause-button'); setState('paused'); },
    resume() { click('[data-agent-action="resume"], #btn-resume'); setState('playing'); },
    restart() { click('[data-agent-action="restart"], [data-runtime-restart], #btn-restart'); setState('loading'); },
    fullscreen,
    returnToHub() { location.href = './'; },
    pressKey,
    getState() { return status?.dataset.runtimeState || 'unknown'; }
  };

  document.querySelectorAll('[data-runtime-fullscreen], #btn-fullscreen, #btn-fullscreen-touch').forEach((el) => el.dataset.agentAction = 'fullscreen');
  document.querySelectorAll('[data-runtime-restart], #btn-restart').forEach((el) => el.dataset.agentAction = 'restart');
  document.querySelectorAll('#btn-resume').forEach((el) => el.dataset.agentAction = 'resume');
  document.querySelectorAll('[data-key], [data-tap-key]').forEach((el) => { if (!el.dataset.agentAction) el.dataset.agentAction = 'press-key'; });

  if (!shell) {
    window.RetroPlayAgent.launchGame = (id) => {
      const link = document.querySelector(`[data-game-id="${CSS.escape(id)}"] a`);
      if (link?.href) location.href = link.href;
    };
  }
})();
