/** poster.js — deterministic, local-only meditation poster rendering. */

function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawStupa(ctx, cx, ground, scale, fill, glow = '#d8ad58') {
  ctx.save();
  ctx.translate(cx, ground);
  ctx.scale(scale, scale);
  ctx.fillStyle = fill;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 34;

  const tier = (y, width, height) => {
    roundRect(ctx, -width / 2, y - height, width, height, 5);
    ctx.fill();
  };
  tier(0, 430, 30);
  tier(-34, 370, 26);
  tier(-64, 315, 23);
  tier(-92, 265, 20);

  ctx.beginPath();
  ctx.moveTo(-118, -112);
  ctx.bezierCurveTo(-112, -225, -76, -306, 0, -336);
  ctx.bezierCurveTo(76, -306, 112, -225, 118, -112);
  ctx.closePath();
  ctx.fill();

  tier(-345, 86, 18);
  for (let i = 0; i < 10; i++) tier(-370 - i * 17, 78 - i * 5.5, 8);

  ctx.beginPath();
  ctx.moveTo(-7, -540);
  ctx.lineTo(0, -675);
  ctx.lineTo(7, -540);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -686, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function text(ctx, value, x, y, options = {}) {
  ctx.save();
  ctx.fillStyle = options.color || 'rgba(238,224,196,.86)';
  ctx.font = options.font || '32px "Noto Serif SC", serif';
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = options.baseline || 'alphabetic';
  if (options.letterSpacing && typeof ctx.letterSpacing !== 'undefined') ctx.letterSpacing = options.letterSpacing;
  ctx.fillText(value, x, y, options.maxWidth);
  ctx.restore();
}

export function renderMeditationPoster(canvas, analysis, copy) {
  const width = 1080;
  const height = 1350;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const seed = Math.floor((analysis.endedAt || Date.now()) / 1000) ^ analysis.score * 7919;
  const random = mulberry32(seed);

  const bg = ctx.createRadialGradient(540, 700, 80, 540, 700, 900);
  bg.addColorStop(0, '#1d160a');
  bg.addColorStop(0.52, '#090705');
  bg.addColorStop(1, '#020202');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Fine sand remains around the formed stupa. Higher average cohesion pulls
  // a larger share inward, mirroring the live artwork without exporting data.
  const gathered = analysis.meanCohesion;
  for (let i = 0; i < 950; i++) {
    const near = random() < gathered;
    const angle = random() * Math.PI * 2;
    const radius = near ? 90 + random() * 300 : 260 + random() * 500;
    const x = 540 + Math.cos(angle) * radius;
    const y = 910 + Math.sin(angle) * radius * 0.28 + (random() - 0.5) * 50;
    const alpha = near ? 0.12 + random() * 0.28 : 0.04 + random() * 0.12;
    ctx.fillStyle = analysis.meanGold > 0.55
      ? `rgba(219,177,93,${alpha})`
      : `rgba(190,157,111,${alpha})`;
    ctx.fillRect(x, y, 1.2 + random() * 2.2, 1.2 + random() * 2.2);
  }

  const gold = ctx.createLinearGradient(540, 350, 540, 980);
  gold.addColorStop(0, '#f1d897');
  gold.addColorStop(0.48, analysis.meanGold > 0.55 ? '#d8ad58' : '#b79461');
  gold.addColorStop(1, '#806032');
  drawStupa(ctx, 540, 970, 0.92, gold, analysis.meanGold > 0.55 ? '#d8ad58' : '#9f7b4d');

  // The participant's respiration trace becomes a nearly calligraphic line.
  if (analysis.breathTrace?.length > 1) {
    ctx.save();
    ctx.beginPath();
    analysis.breathTrace.forEach((value, index) => {
      const x = 110 + index / (analysis.breathTrace.length - 1) * 860;
      const y = 1110 - value * 24;
      index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = 'rgba(127,201,168,.32)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  text(ctx, copy.title, 80, 96, {
    font: '500 25px "Manrope", sans-serif', color: 'rgba(216,177,105,.72)',
  });
  text(ctx, copy.date, 1000, 96, {
    font: '300 20px "Manrope", sans-serif', color: 'rgba(232,220,198,.36)', align: 'right',
  });
  text(ctx, copy.statePrimary, 540, 198, {
    font: copy.primaryLanguage === 'zh'
      ? '400 58px "Noto Serif SC", serif'
      : '500 68px "Cormorant Garamond", serif',
    color: '#ead19a', align: 'center',
  });
  text(ctx, copy.stateSecondary, 540, 245, {
    font: '400 22px "Manrope", sans-serif', color: 'rgba(232,220,198,.42)', align: 'center',
  });

  text(ctx, copy.quotePrimary, 540, 1192, {
    font: copy.primaryLanguage === 'zh'
      ? '300 28px "Noto Serif SC", serif'
      : '400 34px "Cormorant Garamond", serif',
    color: 'rgba(238,224,196,.82)', align: 'center', maxWidth: 880,
  });
  text(ctx, copy.quoteSecondary, 540, 1238, {
    font: '300 20px "Manrope", sans-serif', color: 'rgba(232,220,198,.38)', align: 'center', maxWidth: 900,
  });

  ctx.strokeStyle = 'rgba(216,177,105,.25)';
  ctx.beginPath(); ctx.moveTo(80, 1284); ctx.lineTo(1000, 1284); ctx.stroke();
  text(ctx, `${copy.durationLabel}  ${copy.duration}`, 80, 1320, {
    font: '400 18px "Manrope", sans-serif', color: 'rgba(232,220,198,.44)',
  });
  text(ctx, `${copy.breathLabel}  ${analysis.breathCycles}`, 1000, 1320, {
    font: '400 18px "Manrope", sans-serif', color: 'rgba(232,220,198,.44)', align: 'right',
  });
}

export function downloadPoster(canvas, filename = 'sand-to-stupa-reflection.png') {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
