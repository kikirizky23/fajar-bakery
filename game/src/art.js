// Procedural art for Fajar Bakery: every picture on screen is drawn with
// canvas shapes at run time. No image files, no fonts beyond the system stack.
export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

export function text(ctx, str, x, y, size, color, weight = 700, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Food drawings, all centred on (cx, cy), drawn at scale s ---------

export function drawDough(ctx, cx, cy, s) {
  ctx.fillStyle = '#f2d8a7';
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2 * s;
  circle(ctx, cx, cy, 16 * s); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c48d';
  circle(ctx, cx - 5 * s, cy - 4 * s, 3 * s); ctx.fill();
  circle(ctx, cx + 6 * s, cy + 3 * s, 2.5 * s); ctx.fill();
}

export function drawCroissant(ctx, cx, cy, s) {
  ctx.fillStyle = '#e8a94e';
  ctx.strokeStyle = '#b97a24';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(cx - 20 * s, cy + 6 * s);
  ctx.quadraticCurveTo(cx - 14 * s, cy - 16 * s, cx, cy - 12 * s);
  ctx.quadraticCurveTo(cx + 14 * s, cy - 16 * s, cx + 20 * s, cy + 6 * s);
  ctx.quadraticCurveTo(cx + 10 * s, cy + 12 * s, cx, cy + 8 * s);
  ctx.quadraticCurveTo(cx - 10 * s, cy + 12 * s, cx - 20 * s, cy + 6 * s);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c07f2a';
  ctx.beginPath();
  ctx.moveTo(cx - 8 * s, cy - 10 * s); ctx.lineTo(cx - 6 * s, cy + 4 * s);
  ctx.moveTo(cx, cy - 12 * s); ctx.lineTo(cx, cy + 6 * s);
  ctx.moveTo(cx + 8 * s, cy - 10 * s); ctx.lineTo(cx + 6 * s, cy + 4 * s);
  ctx.stroke();
}

export function drawChocoSwirl(ctx, cx, cy, s) {
  ctx.fillStyle = '#e9b96f';
  ctx.strokeStyle = '#b97a24';
  ctx.lineWidth = 2 * s;
  circle(ctx, cx, cy, 15 * s); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5d3418';
  ctx.lineWidth = 3.5 * s;
  ctx.beginPath();
  ctx.arc(cx, cy, 9 * s, 0.4, Math.PI * 1.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4 * s, 1.2, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = '#fff3f6';
  circle(ctx, cx - 9 * s, cy - 9 * s, 2 * s); ctx.fill();
  circle(ctx, cx + 10 * s, cy - 6 * s, 2 * s); ctx.fill();
  circle(ctx, cx + 4 * s, cy + 11 * s, 2 * s); ctx.fill();
}

export function drawBerryCake(ctx, cx, cy, s) {
  ctx.fillStyle = '#f6c9d4';
  ctx.strokeStyle = '#c98a9b';
  ctx.lineWidth = 2 * s;
  rr(ctx, cx - 17 * s, cy - 8 * s, 34 * s, 20 * s, 5 * s); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff3f6';
  rr(ctx, cx - 17 * s, cy - 12 * s, 34 * s, 8 * s, 4 * s); ctx.fill();
  ctx.fillStyle = '#d94f6a';
  circle(ctx, cx - 9 * s, cy - 13 * s, 4.5 * s); ctx.fill();
  circle(ctx, cx + 2 * s, cy - 14 * s, 4.5 * s); ctx.fill();
  circle(ctx, cx + 11 * s, cy - 12 * s, 4 * s); ctx.fill();
  ctx.fillStyle = '#3f7d4e';
  ctx.beginPath();
  ctx.moveTo(cx + 2 * s, cy - 18 * s); ctx.lineTo(cx + 6 * s, cy - 23 * s); ctx.lineTo(cx + 8 * s, cy - 17 * s);
  ctx.closePath(); ctx.fill();
}

export function drawDishIcon(ctx, recipeId, cx, cy, s) {
  if (recipeId === 'croissant') drawCroissant(ctx, cx, cy, s);
  else if (recipeId === 'choco-swirl') drawChocoSwirl(ctx, cx, cy, s);
  else if (recipeId === 'berry-cake') drawBerryCake(ctx, cx, cy, s);
  else drawDough(ctx, cx, cy, s);
}

export function drawStepIcon(ctx, step, cx, cy, s) {
  if (step === 'dough') drawDough(ctx, cx, cy, s);
  else if (step === 'choco') {
    ctx.fillStyle = '#7a4a2b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 12 * s); ctx.lineTo(cx + 10 * s, cy + 8 * s); ctx.lineTo(cx - 10 * s, cy + 8 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d3418';
    circle(ctx, cx - 3 * s, cy + 2 * s, 2 * s); ctx.fill();
    circle(ctx, cx + 4 * s, cy + 5 * s, 2 * s); ctx.fill();
  } else if (step === 'berry') {
    ctx.fillStyle = '#d94f6a';
    circle(ctx, cx, cy + 2 * s, 10 * s); ctx.fill();
    ctx.fillStyle = '#a32c46';
    circle(ctx, cx - 3 * s, cy, 1.6 * s); ctx.fill();
    circle(ctx, cx + 3 * s, cy + 4 * s, 1.6 * s); ctx.fill();
    ctx.fillStyle = '#3f7d4e';
    ctx.beginPath();
    ctx.moveTo(cx - 4 * s, cy - 8 * s); ctx.lineTo(cx, cy - 14 * s); ctx.lineTo(cx + 5 * s, cy - 7 * s);
    ctx.closePath(); ctx.fill();
  } else if (step === 'oven') {
    ctx.fillStyle = '#e8823a';
    rr(ctx, cx - 13 * s, cy - 11 * s, 26 * s, 22 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#ffd27a';
    rr(ctx, cx - 8 * s, cy - 5 * s, 16 * s, 10 * s, 2 * s); ctx.fill();
  } else if (step === 'frost') {
    ctx.fillStyle = '#fff3f6';
    ctx.strokeStyle = '#e8b7c4';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 13 * s, cy + 8 * s);
    ctx.quadraticCurveTo(cx - 13 * s, cy - 8 * s, cx, cy - 10 * s);
    ctx.quadraticCurveTo(cx + 13 * s, cy - 8 * s, cx + 13 * s, cy + 8 * s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d94f6a';
    circle(ctx, cx - 6 * s, cy - 2 * s, 1.8 * s); ctx.fill();
    circle(ctx, cx + 5 * s, cy + 1 * s, 1.8 * s); ctx.fill();
  }
}

// --- Customers: round little morning people with aprons ----------------

const CUSTOMER_LOOKS = [
  { skin: '#f2c79b', hair: '#4a2f22', shirt: '#4f7ec2', apron: false },
  { skin: '#e8b184', hair: '#1f1a17', shirt: '#c25a7a', apron: false },
  { skin: '#f7d7ae', hair: '#8a5a2b', shirt: '#5da271', apron: false },
  { skin: '#d99e6f', hair: '#2e2e2e', shirt: '#e0a33e', apron: false },
  { skin: '#f2c79b', hair: '#6b6b6b', shirt: '#7a5fb0', apron: false },
];

export function drawCustomer(ctx, lookIndex, cx, cy, s, mood) {
  const look = CUSTOMER_LOOKS[lookIndex % CUSTOMER_LOOKS.length];
  // body
  ctx.fillStyle = look.shirt;
  rr(ctx, cx - 22 * s, cy - 6 * s, 44 * s, 34 * s, 12 * s); ctx.fill();
  // head
  ctx.fillStyle = look.skin;
  circle(ctx, cx, cy - 20 * s, 17 * s); ctx.fill();
  // hair
  ctx.fillStyle = look.hair;
  ctx.beginPath();
  ctx.arc(cx, cy - 24 * s, 17 * s, Math.PI, Math.PI * 2);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(cx - 17 * s, cy - 26 * s, 6 * s, 8 * s);
  ctx.fillRect(cx + 11 * s, cy - 26 * s, 6 * s, 8 * s);
  // eyes + mouth by mood
  ctx.fillStyle = '#26221f';
  if (mood === 'angry') {
    ctx.fillRect(cx - 11 * s, cy - 24 * s, 6 * s, 2.5 * s);
    ctx.fillRect(cx + 5 * s, cy - 24 * s, 6 * s, 2.5 * s);
    ctx.beginPath(); ctx.moveTo(cx - 6 * s, cy - 10 * s); ctx.lineTo(cx + 6 * s, cy - 10 * s);
    ctx.strokeStyle = '#26221f'; ctx.lineWidth = 2 * s; ctx.stroke();
  } else {
    circle(ctx, cx - 7 * s, cy - 21 * s, 2.2 * s); ctx.fill();
    circle(ctx, cx + 7 * s, cy - 21 * s, 2.2 * s); ctx.fill();
    ctx.strokeStyle = '#26221f'; ctx.lineWidth = 2 * s;
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(cx, cy - 16 * s, 6 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    else ctx.arc(cx, cy - 14 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  // blush when happy
  if (mood === 'happy') {
    ctx.fillStyle = 'rgba(217,79,106,.45)';
    circle(ctx, cx - 12 * s, cy - 15 * s, 3 * s); ctx.fill();
    circle(ctx, cx + 12 * s, cy - 15 * s, 3 * s); ctx.fill();
  }
}

// --- Steam puff ----------------------------------------------------------
export function drawSteam(ctx, x, y, t, s) {
  ctx.strokeStyle = 'rgba(255,255,255,.55)';
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.9 + i * 0.33) % 1;
    const px = x + Math.sin(ph * 5 + i * 2) * 5 * s;
    const py = y - ph * 26 * s;
    ctx.globalAlpha = 0.55 * (1 - ph);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + 5 * s, py - 6 * s, px - 2 * s, py - 12 * s);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
