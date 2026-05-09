// ─── SONS ───────────────────────────────────────────────

// ✅ Certo — relativo à pasta onde o script.js está
const soundclick =        new Audio('./assets/sounds/click.mp3');
const soundhover =        new Audio('./assets/sounds/hover.mp3');
const sounderror =        new Audio('./assets/sounds/error.mp3');
const soundnotification = new Audio('./assets/sounds/notification.mp3');
const soundsubmit =       new Audio('./assets/sounds/submit.mp3');

// ─── ELEMENTOS ──────────────────────────────────────────

const buttons = document.querySelectorAll('button');

// ─── FUNÇÃO DE TOQUE DE SONS ─────────────────────────────

function playSound(sound) {
  if (!sound) return;

  sound.currentTime = 0;
  sound.volume = 1.0;

  sound.play().catch(err => {
    console.log('Erro ao tocar som:', err);
  });
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => playSound(soundclick));
  btn.addEventListener('mouseenter', () => playSound(soundhover));
});