// A dedicated, sampled title-screen roar. Never overlaps itself or ignores mute.
const roar = new Audio(new URL('./assets/rex/rex-roar.mp3', import.meta.url).href);
roar.preload = 'auto';
roar.volume = 0.85;
export function stopRexRoar() {
  roar.pause();
  roar.currentTime = 0;
}
export function playRexRoar() {
  if (!window.DUFX?.settings.sound || document.hidden) return;
  // Repeated taps animate Rex again without stacking loud audio tracks.
  if (!roar.paused) return;
  roar.currentTime = 0;
  roar.volume = window.DUFX.settings.calm ? 0.5 : 0.85;
  roar.play().catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopRexRoar(); });
window.addEventListener('pagehide', stopRexRoar);
