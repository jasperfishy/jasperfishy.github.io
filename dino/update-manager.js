(function () {
  if (window.self !== window.top) return;
  if (!("serviceWorker" in navigator)) return;

  const scriptUrl = document.currentScript && document.currentScript.src;
  if (!scriptUrl) return;
  const appRoot = new URL("./", scriptUrl);
  const workerUrl = new URL("sw.js", appRoot);
  const CHECK_KEY = "du-update-last-check";
  const AUTO_KEY = "du-update-auto";
  const DAY = 24 * 60 * 60 * 1000;
  const watched = new WeakSet();
  let busy = false;
  let applying = false;
  let reloadTimer = 0;
  let automaticApplyStarted = false;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = "du-update-trigger";
  trigger.textContent = "↻ Updates";
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "du-update-panel");
  const panel = document.createElement("section");
  panel.id = "du-update-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "du-update-heading");
  panel.hidden = true;
  panel.innerHTML =
    '<header><strong id="du-update-heading">Game updates</strong><button type="button" id="du-update-close" aria-label="Close updates">×</button></header>' +
    '<p id="du-update-status" role="status" aria-live="polite">Checks the latest game published at jasperfish.com once a day.</p>' +
    '<button type="button" id="du-update-check">Check for updates</button>' +
    '<button type="button" id="du-update-apply" hidden>Update available · Update now</button>' +
    '<label class="du-update-auto"><input type="checkbox" id="du-update-auto"> Install updates automatically</label>' +
    '<small>Automatic checks use this device’s browser. Your saved game progress stays on this device.</small>';
  const style = document.createElement("style");
  style.textContent =
    "#du-update-trigger{position:fixed;z-index:2147483000;top:68px;right:12px;min-height:38px;padding:7px 12px;border:1px solid rgba(255,255,255,.9);border-radius:13px;background:rgba(255,255,255,.94);color:#24445d;font:700 13px system-ui,sans-serif;box-shadow:0 4px 16px rgba(20,35,55,.2);cursor:pointer}" +
    "#du-update-trigger.du-ready{background:#fff1b9;border-color:#e5b324;color:#553f00}" +
    "#du-update-panel{position:fixed;z-index:2147483001;top:112px;right:12px;width:min(320px,calc(100vw - 24px));padding:14px;border:1px solid #d3e0e5;border-radius:16px;background:rgba(255,255,255,.98);box-shadow:0 12px 34px rgba(15,35,55,.28);color:#24445d;font:14px/1.4 system-ui,sans-serif;backdrop-filter:blur(10px)}" +
    "#du-update-panel[hidden]{display:none}" +
    "#du-update-panel header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:16px}" +
    "#du-update-panel header button{width:30px;height:30px;border:0;border-radius:9px;background:#edf3f7;color:#234;font-size:20px;cursor:pointer}" +
    "#du-update-status{margin:5px 0 11px;color:#526879;font-size:13px}" +
    "#du-update-check,#du-update-apply{width:100%;min-height:38px;margin:4px 0;padding:8px 10px;border:0;border-radius:10px;background:#e9f1f7;color:#24445d;font:700 13px system-ui,sans-serif;cursor:pointer}" +
    "#du-update-apply{background:#16845f;color:#fff}" +
    "#du-update-panel button:focus-visible,#du-update-trigger:focus-visible,#du-update-panel input:focus-visible{outline:3px solid #e2a800;outline-offset:2px}" +
    "#du-update-panel .du-update-auto{display:flex;align-items:center;gap:8px;margin:9px 0;font-weight:700;font-size:13px;cursor:pointer}" +
    "#du-update-panel .du-update-auto input{width:18px;height:18px;accent-color:#16845f}" +
    "#du-update-panel small{display:block;color:#6b7d89;font-size:11px}" +
    "@media(max-width:600px){#du-update-trigger{top:66px;right:8px;min-height:34px;padding:6px 9px;font-size:12px}#du-update-panel{top:106px;right:8px}}";
  document.head.appendChild(style);
  document.body.append(trigger, panel);

  const status = panel.querySelector("#du-update-status");
  const checkButton = panel.querySelector("#du-update-check");
  const applyButton = panel.querySelector("#du-update-apply");
  const autoToggle = panel.querySelector("#du-update-auto");
  const autoEnabled = () => {
    try { return localStorage.getItem(AUTO_KEY) === "1"; } catch { return false; }
  };
  autoToggle.checked = autoEnabled();

  function setStatus(message, available) {
    status.textContent = message;
    applyButton.hidden = !available;
    trigger.textContent = available ? "Update available" : "↻ Updates";
    trigger.classList.toggle("du-ready", !!available);
    trigger.setAttribute("aria-label", available ? "Update available from jasperfish.com" : "Check for game updates");
    if (available) {
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
  }
  function openPanel(open) {
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(!!open));
    if (open) panel.querySelector("#du-update-check").focus();
  }
  async function relevantRegistrations() {
    let registrations = await navigator.serviceWorker.getRegistrations();
    if (!registrations.some((reg) => reg.scope === appRoot.href)) {
      await navigator.serviceWorker.register(workerUrl.href, { scope: appRoot.href, updateViaCache: "none" });
      registrations = await navigator.serviceWorker.getRegistrations();
    }
    const relevant = registrations.filter((reg) => reg.scope.indexOf(appRoot.href) === 0);
    relevant.forEach(watchRegistration);
    return relevant;
  }
  function watchRegistration(registration) {
    if (watched.has(registration)) return;
    watched.add(registration);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) updateAvailable();
      });
    });
    if (registration.waiting) updateAvailable();
  }
  function waitingWorkers(registrations) {
    return registrations.map((reg) => reg.waiting).filter(Boolean);
  }
  function updateAvailable() {
    setStatus("A newer version is published at jasperfish.com.", true);
    if (autoEnabled() && !automaticApplyStarted) {
      automaticApplyStarted = true;
      window.setTimeout(applyUpdate, 150);
    }
  }
  function waitForInstall(registration) {
    const worker = registration.installing;
    if (!worker) return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => {
        if (worker.state === "installed" || worker.state === "activated" || worker.state === "redundant") {
          worker.removeEventListener("statechange", finish);
          resolve();
        }
      };
      worker.addEventListener("statechange", finish);
      finish();
      window.setTimeout(resolve, 9000);
    });
  }
  async function checkForUpdates(manual) {
    if (busy) return;
    busy = true;
    checkButton.disabled = true;
    setStatus("Checking the latest game published at jasperfish.com…", false);
    try {
      const registrations = await relevantRegistrations();
      const results = await Promise.all(registrations.map((reg) => reg.update().then(() => ({ ok: true, reg })).catch((error) => ({ ok: false, reg, error }))));
      await Promise.all(registrations.map(waitForInstall));
      try { localStorage.setItem(CHECK_KEY, String(Date.now())); } catch { /* daily check still works in memory */ }
      const waiting = waitingWorkers(registrations);
      if (waiting.length) {
        updateAvailable();
      } else if (results.some((result) => !result.ok)) {
        setStatus("Could not reach jasperfish.com. Check your connection and try again.", false);
      } else {
        setStatus(manual ? "You’re up to date with the game published at jasperfish.com." : "No game update is waiting.", false);
      }
    } catch {
      setStatus("Could not check jasperfish.com. Check your connection and try again.", false);
    } finally {
      busy = false;
      checkButton.disabled = false;
    }
  }
  async function applyUpdate() {
    if (applying) return;
    applying = true;
    applyButton.disabled = true;
    checkButton.disabled = true;
    setStatus("Applying the game update…", false);
    try {
      const registrations = await relevantRegistrations();
      const waiting = waitingWorkers(registrations);
      if (!waiting.length) {
        applying = false;
        applyButton.disabled = false;
        await checkForUpdates(true);
        return;
      }
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!applying) return;
        applying = false;
        window.clearTimeout(reloadTimer);
        window.location.reload();
      }, { once: true });
      waiting.forEach((worker) => worker.postMessage({ type: "DU_SKIP_WAITING" }));
      reloadTimer = window.setTimeout(() => window.location.reload(), 6000);
    } catch {
      applying = false;
      applyButton.disabled = false;
      checkButton.disabled = false;
      setStatus("The update could not be applied. Please try again.", true);
    }
  }

  trigger.addEventListener("click", () => openPanel(panel.hidden));
  panel.querySelector("#du-update-close").addEventListener("click", () => openPanel(false));
  checkButton.addEventListener("click", () => checkForUpdates(true));
  applyButton.addEventListener("click", applyUpdate);
  autoToggle.addEventListener("change", () => {
    try { localStorage.setItem(AUTO_KEY, autoToggle.checked ? "1" : "0"); } catch { /* setting is optional */ }
    if (autoToggle.checked && applyButton.hidden === false) applyUpdate();
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (applying) {
      applying = false;
      window.clearTimeout(reloadTimer);
      window.location.reload();
    }
  });

  async function start() {
    try {
      const registrations = await relevantRegistrations();
      if (registrations.some((reg) => reg.waiting)) updateAvailable();
      let last = 0;
      try { last = Number(localStorage.getItem(CHECK_KEY)) || 0; } catch { /* run a check */ }
      if (Date.now() - last >= DAY) checkForUpdates(false);
    } catch {
      setStatus("Updates need an internet connection and a browser that supports app updates.", false);
    }
  }
  window.setTimeout(start, 450);
  window.addEventListener("focus", () => {
    let last = 0;
    try { last = Number(localStorage.getItem(CHECK_KEY)) || 0; } catch { /* run a check */ }
    if (Date.now() - last >= DAY) checkForUpdates(false);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    let last = 0;
    try { last = Number(localStorage.getItem(CHECK_KEY)) || 0; } catch { /* run a check */ }
    if (Date.now() - last >= DAY) checkForUpdates(false);
  });
})();