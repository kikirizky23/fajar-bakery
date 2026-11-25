// Boot for Fajar Bakery: wires the canvas, the game loop and input, and
// honours ?scene=cover|rush to stage a real mid-play state for screenshots.
import { BakeryGame } from './game.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const game = new BakeryGame(canvas);

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene === 'cover' || scene === 'rush') {
  game.applyScene(scene);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

canvas.addEventListener('pointerdown', (e) => {
  sfx.unlock();
  game.clickAt(e.clientX, e.clientY);
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') e.preventDefault();
  if (e.key === ' ') e.preventDefault();
  game.key(e.key);
});

// Expose a tiny probe handle so an automated playtest can read state
// without touching the DOM: window.__bakery = { game }.
window.__bakery = { game, sfx };
