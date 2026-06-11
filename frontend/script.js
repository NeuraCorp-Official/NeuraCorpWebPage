// ─── SONS ───────────────────────────────────────────────

const soundclick        = new Audio('./assets/sounds/click.mp3');
const soundhover        = new Audio('./assets/sounds/hover.mp3');
const sounderror        = new Audio('./assets/sounds/error.mp3');
const soundnotification = new Audio('./assets/sounds/notification.mp3');
const soundsubmit       = new Audio('./assets/sounds/submit.mp3');

// ─── ELEMENTOS ──────────────────────────────────────────

const buttons = document.querySelectorAll('.btn-sound');
const submitButton = document.querySelectorAll('.submit-btn');

// ─── CONFIGURAÇÃO DOS SONS ─────────────────────────────

// deixa os sons mais "tecnológicos"
soundclick.playbackRate = 0.92;
soundclick.volume = 0.5;

soundhover.playbackRate = 1.1;
soundhover.volume = 0.5;

sounderror.playbackRate = 0.85;
sounderror.volume = 0.7;

soundnotification.playbackRate = 1.05;
soundnotification.volume = 0.6;

soundsubmit.playbackRate = 0.95;

// ─── FUNÇÃO TOCAR SOM ──────────────────────────────────

function playSound(sound) {

  if (!sound) return;

  sound.pause();

  sound.currentTime = 0;

  sound.play().catch(err => {
    console.log('Erro ao tocar som:', err);
  });

}

// ─── EVENTOS DOS BOTÕES ─────────────────────────────────

buttons.forEach(button => {

  button.addEventListener('click', () => {
    playSound(soundclick);
  });

  button.addEventListener('mouseenter', () => {
    playSound(soundhover);
  });

});

submitButton.forEach(button => {
  
  button.addEventListener('click', () => {
    playSound(soundsubmit);
  });
  button.addEventListener('mouseenter', () => {
    playSound(soundhover);
});
});
// ─── SOM AO CARREGAR PÁGINA ─────────────────────────────

window.addEventListener('load', () => {

  setTimeout(() => {

    playSound(soundclick);

  }, 90);
});