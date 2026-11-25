// Fajar Bakery — Dawn Shift. A sunrise bakery game: customers order pastries,
// the player builds each dish on a plate (dough, filling, oven, frosting),
// then serves it before patience runs out. Three shifts, rising targets.
import { sfx } from './audio.js';
import { STEPS, RECIPES, SHIFTS, BAKE_SECONDS, MAX_STRIKES, recipeById, recipeMatches, recipePrefix, tipFor } from './recipes.js';
import { rr, circle, text, drawDough, drawCroissant, drawChocoSwirl, drawBerryCake, drawDishIcon, drawStepIcon, drawCustomer, drawSteam } from './art.js';

const W = 1280;
const H = 720;

const STATIONS = [
  { id: 'dough', x: 60, y: 470, w: 170, h: 170 },
  { id: 'choco', x: 250, y: 470, w: 170, h: 170 },
  { id: 'berry', x: 440, y: 470, w: 170, h: 170 },
  { id: 'oven', x: 630, y: 458, w: 200, h: 182 },
  { id: 'frost', x: 850, y: 470, w: 170, h: 170 },
  { id: 'trash', x: 1040, y: 470, w: 170, h: 170 },
];

const PLATE_SPOTS = [
  { x: 280, y: 330 },
  { x: 640, y: 330 },
  { x: 1000, y: 330 },
];

const CUSTOMER_SPOTS = [
  { x: 230, y: 128 },
  { x: 640, y: 128 },
  { x: 1050, y: 128 },
];

let nextCustomerId = 1;

export class BakeryGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screen = 'menu';
    this.time = 0;
    this.hits = [];
    this.floaters = [];
    this.shake = 0;
    this.selectedPlate = 0;
    this.resetRun();
    this.screen = 'menu'; // fresh load shows the title screen, not shift 1
  }

  resetRun() {
    this.shiftIndex = 0;
    this.totalEarnings = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.strikes = 0;
    this.startShift(0);
  }

  startShift(i) {
    const s = SHIFTS[i];
    this.shiftIndex = i;
    this.shiftTimeLeft = s.duration;
    this.shiftEarnings = 0;
    this.customers = [];
    this.plates = [0, 1, 2].map(() => ({ steps: [], baked: false, baking: false, mess: false }));
    this.oven = { plate: -1, t: 0 };
    this.spawnTimer = 1.2;
    this.screen = 'playing';
  }

  shift() { return SHIFTS[this.shiftIndex]; }

  // ---- spawning ---------------------------------------------------------
  spawnCustomer(forceRecipe) {
    if (this.customers.length >= 3) return;
    const s = this.shift();
    const pool = s.dishes;
    const recipeId = forceRecipe || pool[Math.floor(Math.random() * pool.length)];
    const patience = s.patience * (0.9 + Math.random() * 0.25);
    this.customers.push({
      id: nextCustomerId++,
      look: Math.floor(Math.random() * 5),
      recipeId,
      patience,
      patienceMax: patience,
      state: 'waiting',
      moodTimer: 0,
    });
  }

  // ---- actions ----------------------------------------------------------
  selectPlate(i) {
    if (this.screen !== 'playing') return;
    this.selectedPlate = i;
    sfx.click();
  }

  applyStation(stationId) {
    if (this.screen !== 'playing') return;
    const plate = this.plates[this.selectedPlate];
    if (stationId === 'trash') {
      if (plate.steps.length || plate.mess) {
        plate.steps = []; plate.baked = false; plate.baking = false; plate.mess = false;
        if (this.oven.plate === this.selectedPlate) this.oven = { plate: -1, t: 0 };
        sfx.place();
      }
      return;
    }
    if (plate.baking) { this.bump('Oven is baking!'); sfx.error(); return; }
    if (plate.mess) { this.bump('That plate is ruined — trash it!'); sfx.error(); return; }
    if (this.readyPlate(this.selectedPlate)) { this.bump('Dish is ready — serve it!'); sfx.error(); return; }
    if (stationId === 'oven') {
      const expected = this.nextStep(plate);
      if (expected !== 'oven') { this.bump('Nothing to bake yet'); sfx.error(); return; }
      if (this.oven.plate !== -1) { this.bump('Oven is busy!'); sfx.error(); return; }
      plate.steps.push('oven');
      plate.baking = true;
      this.oven = { plate: this.selectedPlate, t: 0 };
      sfx.ovenIn();
      return;
    }
    const expected = this.nextStep(plate);
    if (stationId !== expected) {
      plate.mess = true;
      this.bump('Wrong step — dish ruined!');
      sfx.error();
      return;
    }
    plate.steps.push(stationId);
    sfx.place();
    const recipe = recipeById(this.dishForPlate(plate));
    if (recipe && recipeMatches(plate.steps, recipe) && plate.baked) {
      sfx.ding();
      this.floaters.push({ x: PLATE_SPOTS[this.selectedPlate].x, y: 250, txt: recipe.name + ' ready!', life: 1.4, color: '#2e7d32' });
    }
  }

  nextStep(plate) {
    const prefix = recipePrefix(plate.steps);
    if (!prefix) return null;
    return prefix.steps[plate.steps.length] || null;
  }

  dishForPlate(plate) {
    const prefix = recipePrefix(plate.steps);
    return prefix ? prefix.id : null;
  }

  readyPlate(i) {
    const plate = this.plates[i];
    if (plate.mess || !plate.baked) return null;
    const recipe = RECIPES.find((r) => recipeMatches(plate.steps, r));
    return recipe || null;
  }

  serveCustomer(customer) {
    if (this.screen !== 'playing' || customer.state !== 'waiting') return;
    const pi = this.plates.findIndex((_, i) => {
      const r = this.readyPlate(i);
      return r && r.id === customer.recipeId;
    });
    if (pi === -1) {
      this.bump('No finished ' + recipeById(customer.recipeId).name + ' yet!');
      sfx.error();
      return;
    }
    const recipe = this.readyPlate(pi);
    const tip = tipFor(customer.patience, customer.patienceMax);
    this.combo += 1;
    this.comboTimer = 10;
    const mult = Math.min(2, 1 + 0.1 * (this.combo - 1));
    const coins = Math.round((recipe.price + tip) * mult);
    this.shiftEarnings += coins;
    this.totalEarnings += coins;
    this.plates[pi] = { steps: [], baked: false, baking: false, mess: false };
    customer.state = 'happy';
    customer.moodTimer = 0.9;
    const spot = CUSTOMER_SPOTS[this.customers.indexOf(customer)];
    this.floaters.push({ x: spot.x, y: 70, txt: '+$' + coins + (this.combo > 1 ? '  x' + mult.toFixed(1) + ' combo' : ''), life: 1.6, color: '#1b5e20' });
    sfx.serve();
    setTimeout(() => sfx.coin(), 180);
  }

  bump(msg) {
    this.floaters.push({ x: 640, y: 452, txt: msg, life: 1.2, color: '#b3261e' });
    this.shake = 6;
  }

  // ---- update -----------------------------------------------------------
  update(dt) {
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
    for (const f of this.floaters) f.life -= dt;
    this.floaters = this.floaters.filter((f) => f.life > 0);
    if (this.screen !== 'playing') return;

    this.shiftTimeLeft -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    if (this.oven.plate !== -1) {
      this.oven.t += dt;
      if (this.oven.t >= BAKE_SECONDS) {
        const plate = this.plates[this.oven.plate];
        plate.baking = false;
        plate.baked = true;
        this.oven = { plate: -1, t: 0 };
        sfx.ding();
        const recipe = recipeById(this.dishForPlate(plate));
        if (recipe && recipeMatches(plate.steps, recipe)) {
          this.floaters.push({ x: PLATE_SPOTS[this.plates.indexOf(plate)].x, y: 250, txt: recipe.name + ' ready!', life: 1.4, color: '#2e7d32' });
        }
      }
    }
    for (const c of this.customers) {
      if (c.state === 'waiting') {
        c.patience -= dt;
        if (c.patience <= 0) {
          c.state = 'angry';
          c.moodTimer = 1.1;
          this.strikes += 1;
          this.combo = 0;
          sfx.angry();
          this.floaters.push({ x: 640, y: 100, txt: 'Customer walked out!', life: 1.5, color: '#b3261e' });
        }
      } else {
        c.moodTimer -= dt;
      }
    }
    this.customers = this.customers.filter((c) => !(c.state !== 'waiting' && c.moodTimer <= 0));
    if (this.strikes >= MAX_STRIKES) {
      this.screen = 'gameover';
      sfx.gameOver();
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnCustomer();
      this.spawnTimer = this.shift().spawnEvery * (0.85 + Math.random() * 0.3);
    }
    if (this.shiftTimeLeft <= 0) {
      this.shiftTimeLeft = 0;
      if (this.shiftEarnings >= this.shift().target) {
        if (this.shiftIndex >= SHIFTS.length - 1) {
          this.screen = 'win';
        } else {
          this.screen = 'shiftDone';
        }
        sfx.shiftWin();
      } else {
        this.screen = 'gameover';
        sfx.gameOver();
      }
    }
  }

  // ---- input ------------------------------------------------------------
  clickAt(px, py) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (px - rect.left) * (W / rect.width);
    const y = (py - rect.top) * (H / rect.height);
    for (const h of this.hits) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        h.action();
        return true;
      }
    }
    return false;
  }

  key(key) {
    if (key === 'm' || key === 'M') return sfx.toggleMute();
    if (this.screen === 'menu' && (key === ' ' || key === 'Enter')) { this.resetRun(); sfx.unlock(); return; }
    if (this.screen === 'shiftDone' && (key === ' ' || key === 'Enter')) { this.startShift(this.shiftIndex + 1); return; }
    if ((this.screen === 'gameover' || this.screen === 'win') && (key === ' ' || key === 'Enter' || key === 'r' || key === 'R')) { this.resetRun(); return; }
    if (this.screen !== 'playing') return;
    const byKey = { 1: 'dough', 2: 'choco', 3: 'berry', 4: 'oven', 5: 'frost', 6: 'trash' };
    if (byKey[key]) this.applyStation(byKey[key]);
    if (key === 'Tab') { this.selectedPlate = (this.selectedPlate + 1) % 3; sfx.click(); }
  }

  // ---- screenshot staging ----------------------------------------------
  // Puts the game into a real mid-play state (same code paths as play) so a
  // screenshot can show a full kitchen: orders, a dish mid-assembly, the
  // oven baking and a finished plate, with the shift timer running.
  applyScene(name) {
    this.resetRun();
    this.screen = 'playing';
    this.shiftTimeLeft = name === 'rush' ? 41 : 132;
    this.shiftEarnings = name === 'rush' ? 58 : 23;
    this.totalEarnings = this.shiftEarnings;
    this.combo = name === 'rush' ? 4 : 2;
    this.comboTimer = 8;
    if (name === 'rush') this.shiftIndex = 2;
    const mk = (recipeId, patienceFrac, look) => ({
      id: nextCustomerId++, look, recipeId,
      patience: this.shift().patience * patienceFrac,
      patienceMax: this.shift().patience, state: 'waiting', moodTimer: 0,
    });
    this.customers = [
      mk('choco-swirl', 0.72, 0),
      mk('berry-cake', 0.45, 2),
      mk('croissant', 0.9, 4),
    ];
    this.plates = [
      { steps: ['dough', 'choco'], baked: false, baking: false, mess: false },
      { steps: ['dough', 'oven'], baked: false, baking: true, mess: false },
      { steps: ['dough', 'berry', 'oven', 'frost'], baked: true, baking: false, mess: false },
    ];
    this.oven = { plate: 1, t: 2.4 };
    this.selectedPlate = 0;
  }

  // ---- render -----------------------------------------------------------
  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    this.drawBackground(ctx);
    this.drawHeader(ctx);
    if (this.screen === 'menu') { this.drawMenu(ctx); ctx.restore(); this.registerHits(); return; }
    this.drawCustomers(ctx);
    this.drawBench(ctx);
    this.drawStations(ctx);
    this.drawFloaters(ctx);
    if (this.screen === 'shiftDone') this.drawShiftDone(ctx);
    if (this.screen === 'gameover') this.drawEnd(ctx, false);
    if (this.screen === 'win') this.drawEnd(ctx, true);
    ctx.restore();
    this.registerHits();
  }

  registerHits() {
    this.hits = [];
    if (this.screen === 'menu') {
      this.hits.push({ x: 490, y: 470, w: 300, h: 74, action: () => { sfx.unlock(); this.resetRun(); } });
      return;
    }
    if (this.screen === 'shiftDone') {
      this.hits.push({ x: 490, y: 480, w: 300, h: 74, action: () => this.startShift(this.shiftIndex + 1) });
      return;
    }
    if (this.screen === 'gameover' || this.screen === 'win') {
      this.hits.push({ x: 490, y: 520, w: 300, h: 74, action: () => this.resetRun() });
      return;
    }
    // playing
    this.customers.forEach((c, i) => {
      const s = CUSTOMER_SPOTS[i];
      this.hits.push({ x: s.x - 130, y: 66, w: 260, h: 130, action: () => this.serveCustomer(c) });
    });
    PLATE_SPOTS.forEach((p, i) => {
      this.hits.push({ x: p.x - 105, y: 268, w: 210, h: 118, action: () => this.selectPlate(i) });
    });
    for (const st of STATIONS) {
      this.hits.push({ x: st.x, y: st.y, w: st.w, h: st.h, action: () => this.applyStation(st.id) });
    }
    this.hits.push({ x: 1180, y: 8, w: 92, h: 42, action: () => sfx.toggleMute() });
  }

  drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffe3b3');
    g.addColorStop(0.45, '#f7d9a8');
    g.addColorStop(1, '#e8b878');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // sunrise window
    // (removed: the window sat behind the first customer ticket)
    // small sunrise badge at the left of the customers row
    ctx.fillStyle = '#ffb347';
    circle(ctx, 52, 82, 12); ctx.fill();
    ctx.fillStyle = '#ff8c42';
    circle(ctx, 52, 82, 7); ctx.fill();
    text(ctx, '6:00 AM', 70, 82, 13, '#8a5a2b', 700, 'left');
    // floor + counter back wall
    ctx.fillStyle = '#a9713f';
    ctx.fillRect(0, 196, W, 10);
    ctx.fillStyle = '#c98d54';
    ctx.fillRect(0, 206, W, 250);
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.fillRect(0, 206, W, 6);
    // shelf with jars on the wall, right of the workbench
    ctx.fillStyle = '#7a4a2b';
    rr(ctx, 1170, 240, 100, 10, 4); ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ['#d94f6a', '#e8a94e', '#7a4a2b'][i];
      rr(ctx, 1178 + i * 33, 206, 26, 34, 6); ctx.fill();
      ctx.fillStyle = '#fff3f6';
      ctx.fillRect(1178 + i * 33, 206, 26, 7);
    }
  }

  drawHeader(ctx) {
    ctx.fillStyle = '#4a2f22';
    ctx.fillRect(0, 0, W, 58);
    ctx.fillStyle = '#ffd27a';
    text(ctx, 'FAJAR BAKERY', 20, 30, 26, '#ffd27a', 800, 'left');
    text(ctx, 'Dawn Shift', 225, 30, 15, '#f7e8d0', 600, 'left');
    const s = this.shift();
    text(ctx, s.name, 640, 18, 15, '#f7e8d0', 700);
    // shift timer bar
    ctx.fillStyle = '#2b1d16';
    rr(ctx, 470, 32, 340, 16, 8); ctx.fill();
    const frac = Math.max(0, this.shiftTimeLeft / s.duration);
    ctx.fillStyle = frac > 0.5 ? '#7bc47f' : frac > 0.25 ? '#e8a94e' : '#d94f6a';
    rr(ctx, 470, 32, 340 * frac, 16, 8); ctx.fill();
    const mm = Math.floor(this.shiftTimeLeft / 60);
    const ss = Math.floor(this.shiftTimeLeft % 60).toString().padStart(2, '0');
    text(ctx, mm + ':' + ss, 640, 40, 12, '#fff', 800);
    text(ctx, '$' + this.shiftEarnings + ' / $' + s.target, 900, 22, 19, '#ffd27a', 800, 'left');
    text(ctx, 'Total $' + this.totalEarnings, 900, 44, 13, '#f7e8d0', 600, 'left');
    if (this.combo > 1) text(ctx, 'COMBO x' + Math.min(2, 1 + 0.1 * (this.combo - 1)).toFixed(1) + '  (' + this.combo + ')', 1080, 22, 15, '#ffb347', 800, 'left');
    for (let i = 0; i < MAX_STRIKES; i++) {
      ctx.fillStyle = i < this.strikes ? '#d94f6a' : 'rgba(255,255,255,.25)';
      circle(ctx, 1090 + i * 22, 44, 7); ctx.fill();
      if (i < this.strikes) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1086 + i * 22, 40); ctx.lineTo(1094 + i * 22, 48); ctx.moveTo(1094 + i * 22, 40); ctx.lineTo(1086 + i * 22, 48); ctx.stroke(); }
    }
    ctx.fillStyle = '#6b4226';
    rr(ctx, 1180, 8, 92, 42, 10); ctx.fill();
    text(ctx, sfx.muted ? 'Muted' : 'Sound', 1226, 30, 14, '#ffe3b3');
  }

  drawCustomers(ctx) {
    text(ctx, 'CUSTOMERS — click a ticket to serve a finished dish', 640, 82, 13, '#5d3418', 700);
    this.customers.forEach((c, i) => {
      const s = CUSTOMER_SPOTS[i];
      const recipe = recipeById(c.recipeId);
      const mood = c.state === 'happy' ? 'happy' : c.state === 'angry' ? 'angry' : (c.patience / c.patienceMax < 0.3 ? 'angry' : 'neutral');
      // ticket card
      ctx.fillStyle = c.state === 'waiting' ? '#fffaf0' : '#e8e0d0';
      ctx.strokeStyle = '#b98a5a';
      ctx.lineWidth = 2;
      rr(ctx, s.x - 130, 96, 260, 100, 12); ctx.fill(); ctx.stroke();
      drawCustomer(ctx, c.look, s.x - 88, 165, 1.05, mood);
      // recipe steps strip (small icons, own row so they never touch the dish)
      recipe.steps.forEach((step, j) => {
        drawStepIcon(ctx, step, s.x + 15 - (recipe.steps.length - 1) * 13 + j * 26, 122, 0.55);
      });
      drawDishIcon(ctx, c.recipeId, s.x + 15, 150, 1.0);
      text(ctx, recipe.name, s.x + 15, 174, 13, '#4a2f22', 700);
      text(ctx, '$' + recipe.price + ' + tip', s.x + 15, 190, 11, '#8a5a2b', 600);
      // patience bar
      const frac = Math.max(0, c.patience / c.patienceMax);
      ctx.fillStyle = '#e0c9a8';
      rr(ctx, s.x - 118, 100, 236, 10, 5); ctx.fill();
      ctx.fillStyle = frac > 0.5 ? '#7bc47f' : frac > 0.25 ? '#e8a94e' : '#d94f6a';
      rr(ctx, s.x - 118, 100, 236 * frac, 10, 5); ctx.fill();
    });
    if (this.customers.length === 0) {
      text(ctx, 'Fresh customers on their way…', 640, 150, 16, '#7a5a3a', 600);
    }
  }

  drawBench(ctx) {
    text(ctx, 'WORKBENCH — click a plate to pick it, then click a station', 640, 232, 14, '#5d3418', 700);
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, 120, 252, 1040, 148, 16); ctx.fill();
    ctx.fillStyle = '#a9713f';
    rr(ctx, 120, 252, 1040, 14, 7); ctx.fill();
    PLATE_SPOTS.forEach((p, i) => {
      const plate = this.plates[i];
      const selected = this.selectedPlate === i;
      if (selected) {
        ctx.strokeStyle = '#ffd27a';
        ctx.lineWidth = 4;
        rr(ctx, p.x - 108, p.y - 62, 216, 124, 14); ctx.stroke();
      }
      // plate
      ctx.fillStyle = '#fffaf0';
      ctx.strokeStyle = '#d8c9ae';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 18, 82, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f0e2c8';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 18, 60, 18, 0, 0, Math.PI * 2); ctx.fill();
      if (plate.mess) {
        ctx.fillStyle = '#6b6b6b';
        circle(ctx, p.x - 12, p.y + 8, 12); ctx.fill();
        circle(ctx, p.x + 14, p.y + 14, 10); ctx.fill();
        text(ctx, 'RUINED', p.x, p.y - 14, 15, '#5d3418', 800);
        text(ctx, 'click Trash', p.x, p.y + 44, 11, '#8a5a2b', 600);
      } else if (plate.steps.length === 0) {
        text(ctx, 'empty plate', p.x, p.y - 40, 13, '#e8cfae', 600);
      } else {
        const dishId = this.dishForPlate(plate);
        const done = this.readyPlate(i);
        if (done) {
          drawDishIcon(ctx, done.id, p.x, p.y - 2, 1.5);
          drawSteam(ctx, p.x, p.y - 26, this.time, 1);
          text(ctx, 'READY!', p.x, p.y - 42, 15, '#2e7d32', 800);
          ctx.fillStyle = 'rgba(255,210,122,.9)';
          for (let k = 0; k < 4; k++) {
            const a = this.time * 2 + (k * Math.PI) / 2;
            circle(ctx, p.x + Math.cos(a) * 46, p.y - 2 + Math.sin(a) * 18, 2.5); ctx.fill();
          }
        } else if (plate.baking) {
          drawDishIcon(ctx, dishId || 'croissant', p.x, p.y - 2, 1.2);
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.time * 6);
          text(ctx, 'BAKING…', p.x, p.y - 42, 14, '#ffd27a', 800);
          ctx.globalAlpha = 1;
        } else {
          // mid-assembly: show applied steps as icons on the plate
          plate.steps.forEach((step, j) => {
            drawStepIcon(ctx, step, p.x - (plate.steps.length - 1) * 20 + j * 40, p.y + 4, 0.9);
          });
          const next = this.nextStep(plate);
          if (next) {
            text(ctx, 'next: ' + STEPS[next].label, p.x, p.y - 40, 13, '#5d3418', 700);
            ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.time * 5);
            drawStepIcon(ctx, next, p.x + 62, p.y - 40, 0.7);
            ctx.globalAlpha = 1;
          }
        }
      }
      text(ctx, 'PLATE ' + (i + 1), p.x, p.y + 52, 11, '#e8cfae', 700);
    });
  }

  drawStations(ctx) {
    text(ctx, 'STATIONS — build in recipe order: dough, filling, oven, frosting', 640, 458, 13, '#5d3418', 700);
    for (const st of STATIONS) {
      const isOven = st.id === 'oven';
      const busy = isOven && this.oven.plate !== -1;
      ctx.fillStyle = '#fffaf0';
      ctx.strokeStyle = '#b98a5a';
      ctx.lineWidth = 2;
      rr(ctx, st.x, st.y, st.w, st.h, 14); ctx.fill(); ctx.stroke();
      const cx = st.x + st.w / 2;
      const cy = st.y + 62;
      if (st.id === 'trash') {
        ctx.fillStyle = '#8a8a8a';
        rr(ctx, cx - 20, cy - 16, 40, 32, 5); ctx.fill();
        ctx.fillStyle = '#5d5d5d';
        ctx.fillRect(cx - 24, cy - 20, 48, 6);
        text(ctx, 'TRASH', cx, cy + 34, 15, '#5d5d5d', 800);
      } else if (isOven) {
        ctx.fillStyle = '#4a2f22';
        rr(ctx, cx - 62, cy - 48, 124, 96, 10); ctx.fill();
        ctx.fillStyle = busy ? '#ff9a3d' : '#3a241a';
        rr(ctx, cx - 50, cy - 36, 100, 52, 6); ctx.fill();
        if (busy) {
          const frac = this.oven.t / BAKE_SECONDS;
          ctx.fillStyle = '#ffd27a';
          rr(ctx, cx - 50, cy - 36, 100 * frac, 52, 6); ctx.fill();
          drawDishIcon(ctx, this.dishForPlate(this.plates[this.oven.plate]) || 'croissant', cx, cy - 10, 0.9);
          drawSteam(ctx, cx, cy - 44, this.time, 1);
          text(ctx, Math.ceil(BAKE_SECONDS - this.oven.t) + 's', cx, cy + 34, 15, '#ffd27a', 800);
        } else {
          ctx.fillStyle = '#ffb347';
          text(ctx, 'OVEN', cx, cy - 10, 18, '#ffb347', 800);
          text(ctx, 'ready', cx, cy + 14, 12, '#e8cfae', 600);
        }
        text(ctx, 'OVEN  [4]', cx, cy + 64, 14, '#4a2f22', 800);
      } else {
        drawStepIcon(ctx, st.id, cx, cy, 1.6);
        text(ctx, STEPS[st.id].label.toUpperCase() + '  [' + STEPS[st.id].key + ']', cx, cy + 48, 14, '#4a2f22', 800);
      }
      if (st.id !== 'oven' && st.id !== 'trash') {
        // small stock dots for charm
        ctx.fillStyle = '#e8cfae';
        circle(ctx, cx - 14, st.y + st.h - 14, 3); ctx.fill();
        circle(ctx, cx, st.y + st.h - 14, 3); ctx.fill();
        circle(ctx, cx + 14, st.y + st.h - 14, 3); ctx.fill();
      }
    }
  }

  drawFloaters(ctx) {
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 1.4);
      text(ctx, f.txt, f.x, f.y - (1.6 - f.life) * 26, 20, f.color, 800);
      ctx.globalAlpha = 1;
    }
  }

  overlay(ctx, title, lines, buttonLabel) {
    ctx.fillStyle = 'rgba(43,29,22,.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fffaf0';
    ctx.strokeStyle = '#e8a94e';
    ctx.lineWidth = 3;
    rr(ctx, 340, 130, 600, 400, 18); ctx.fill(); ctx.stroke();
    text(ctx, title, 640, 190, 38, '#4a2f22', 800);
    lines.forEach((ln, i) => text(ctx, ln, 640, 250 + i * 34, 17, '#5d3418', 600));
    ctx.fillStyle = '#e8823a';
    rr(ctx, 490, 470, 300, 74, 12); ctx.fill();
    text(ctx, buttonLabel, 640, 508, 22, '#fff', 800);
  }

  drawMenu(ctx) {
    this.overlay(ctx, 'FAJAR BAKERY', [
      'The sun is up. The ovens are hot. The morning crowd is hungry.',
      '',
      'Build each order on a plate: dough, filling, oven, frosting.',
      'Serve before patience runs out — fast serves pay tips and build combo.',
      'Hit the target in all 3 shifts to win the festival day.',
      '',
      'Click a plate, then click stations. Click a customer ticket to serve.',
    ], 'START SHIFT 1');
    drawCroissant(ctx, 400, 190, 1.1);
    drawChocoSwirl(ctx, 880, 190, 1.1);
    drawBerryCake(ctx, 640, 128, 1.0);
    text(ctx, 'a dawn bakery game · mouse + keys 1-6', 640, 560, 13, '#e8cfae', 600);
  }

  drawShiftDone(ctx) {
    const s = this.shift();
    const next = SHIFTS[this.shiftIndex + 1];
    this.overlay(ctx, 'SHIFT COMPLETE!', [
      s.name + ' — earned $' + this.shiftEarnings + ' (target $' + s.target + ')',
      'Total so far: $' + this.totalEarnings,
      '',
      'Next: ' + next.name + ' — target $' + next.target,
      'Customers get hungrier and less patient…',
    ], 'START ' + next.name.toUpperCase());
  }

  drawEnd(ctx, won) {
    if (won) {
      const stars = this.totalEarnings >= 260 ? 3 : this.totalEarnings >= 200 ? 2 : 1;
      this.overlay(ctx, 'FESTIVAL DAY WON!', [
        'Three shifts, three targets, one very full bakery.',
        'Total earnings: $' + this.totalEarnings,
        '★'.repeat(stars) + '☆'.repeat(3 - stars),
        '',
        'Thanks for playing Fajar Bakery!',
      ], 'PLAY AGAIN');
    } else {
      const s = this.shift();
      const reason = this.strikes >= MAX_STRIKES
        ? 'Too many customers walked out (' + this.strikes + ' strikes).'
        : 'Target missed: $' + this.shiftEarnings + ' of $' + s.target + ' in ' + s.name + '.';
      this.overlay(ctx, 'SHIFT FAILED', [
        reason,
        'Total earnings: $' + this.totalEarnings,
        '',
        'The ovens stay warm. Try again tomorrow morning.',
      ], 'TRY AGAIN');
    }
  }
}
