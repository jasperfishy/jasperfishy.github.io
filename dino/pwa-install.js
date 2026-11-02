(function () {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return;

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById('pwa-install-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.textContent = '⬇ Install Dino Universe';
    btn.setAttribute('style', 'position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:9999; padding:14px 22px; border-radius:999px; border:none; background:#2ecc71; color:#05221b; font:600 16px system-ui; box-shadow:0 6px 24px rgba(0,0,0,.35); cursor:pointer; min-height:48px; min-width:48px;');
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.remove();
    });
    document.body.appendChild(btn);
  }

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  if (isIOS && isSafari) {
    const key = 'dino-ios-banner-dismissed';
    if (localStorage.getItem(key)) return;
    const banner = document.createElement('div');
    banner.innerHTML = '<span>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to play offline</span><button aria-label="Dismiss" style="margin-left:12px; border:none; background:transparent; color:#0b1a2b; font-size:20px; cursor:pointer; min-width:48px; min-height:48px;">✕</button>';
    banner.setAttribute('style', 'position:fixed; bottom:16px; left:16px; right:16px; z-index:9999; padding:12px 16px; border-radius:14px; background:#fff; color:#0b1a2b; font:500 15px system-ui; display:flex; align-items:center; justify-content:space-between; box-shadow:0 6px 24px rgba(0,0,0,.3);');
    banner.querySelector('button').addEventListener('click', () => { localStorage.setItem(key, '1'); banner.remove(); });
    document.body.appendChild(banner);
  }
})();
