// commit-city: a year of GitHub contributions as a pixel city at night.
//
// Every week is a building: the more you committed that week, the taller it stands, and the
// more days you were active, the more of its windows are lit. The result is one self-contained
// animated SVG (stars twinkle, windows flicker, cars cross, the river shimmers) that a README
// can show as an image.

const W = 440; // drawn in "pixels" this size, shown at 2x
const H = 168;
const GROUND = 116; // the street
const WATER = 121; // the river starts here

// ------------------------------------------------------------------ helpers

/** Cheap repeatable noise in 0..1. */
const hash = (...n) => {
  const v = Math.sin(n.reduce((a, b, i) => a + b * (12.9898 + i * 78.233), 0)) * 43758.5453;
  return v - Math.floor(v);
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;

/** Where the moon is in its month at `date`, 0..1 (0 new, 0.5 full). */
function moonPhase(date) {
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5;
  return (((days / 29.530588853) % 1) + 1) % 1;
}

/** The moon as rows of pixels, shaded to its phase (never quite dark). */
function moon(cx, cy, r, phase, lit, dark) {
  let p = Math.min(0.92, Math.max(0.08, phase));
  const c = Math.cos(2 * Math.PI * (p < 0.5 ? p : p - 0.5));
  let out = '';
  for (let y = -r; y <= r; y++) {
    const w = Math.sqrt(Math.max(0, 1 - (y / r) ** 2));
    for (let x = -r; x <= r; x++) {
      const nx = x / r;
      if (nx * nx + (y / r) ** 2 > 1) continue;
      const term = w * c;
      const on = p < 0.5 ? nx > term : nx < term;
      out += rect(cx + x, cy + y, 1, 1, on ? lit : dark);
    }
  }
  return out;
}

// ------------------------------------------------------------------ the city

/**
 * calendar: GitHub's contributionCalendar ({ totalContributions, weeks: [{ contributionDays }] }).
 * opts: { login, date } (date decides the moon).
 */
/**
 * Which seasonal touches to draw. theme: 'auto' (by date), 'night' (none), 'snow', or 'newyear'
 * (fireworks, with snow). Auto: snow from 1 December to 10 January, fireworks 26 December to 7 January.
 */
export function seasonFor(theme, date) {
  if (theme === 'night') return { snow: false, fireworks: false };
  if (theme === 'snow') return { snow: true, fireworks: false };
  if (theme === 'newyear') return { snow: true, fireworks: true };
  const m = date.getMonth();
  const d = date.getDate();
  return {
    snow: m === 11 || (m === 0 && d <= 10),
    fireworks: (m === 11 && d >= 26) || (m === 0 && d <= 7),
  };
}

/** The year the fireworks are for: the coming one from July on, this one in early January. */
const newYear = (date) => date.getFullYear() + (date.getMonth() >= 6 ? 1 : 0);

const FW = ['#ff5a6a', '#ffd24a', '#6ad8ff', '#9dff7a', '#ff8ad8', '#ffffff', '#ffb04a', '#b58cff'];

/** Fireworks: rockets climb, burst into sparks that fall and fade, each on its own loop. */
function fireworks(add, date) {
  const shows = 9;
  for (let b = 0; b < shows; b++) {
    const cx = 40 + Math.floor(hash(b, 41) * (W - 80));
    const cy = 22 + Math.floor(hash(b, 42) * 34);
    const col = FW[Math.floor(hash(b, 43) * FW.length)];
    const col2 = FW[Math.floor(hash(b, 44) * FW.length)];
    const period = (5 + hash(b, 45) * 3).toFixed(2);
    const delay = (-hash(b, 46) * 8).toFixed(2);
    const timing = `animation-duration:${period}s;animation-delay:${delay}s`;
    // the rocket going up
    add(`<rect class="rk" x="${cx}" y="${GROUND - 8}" width="1" height="3" fill="#fff2d0" style="${timing};--up:${cy - (GROUND - 8)}px"/>`);
    // the flash at the core, then the sparks
    add(`<rect class="cr" x="${cx - 1}" y="${cy - 1}" width="3" height="3" fill="#ffffff" style="${timing}"/>`);
    const n = 44;
    const r = 16 + hash(b, 47) * 12;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + hash(b, k, 48) * 0.3;
      const reach = r * (0.45 + hash(b, k, 49) * 0.55); // a full, filled burst, not a hollow ring
      const dx = Math.round(Math.cos(a) * reach);
      const dy = Math.round(Math.sin(a) * reach + 6); // they sag as they fall
      const big = k % 3 === 0 ? 2 : 1;
      add(`<rect class="sp" x="${cx}" y="${cy}" width="${big}" height="${big}" fill="${k % 2 ? col2 : col}" style="${timing};--dx:${dx}px;--dy:${dy}px"/>`);
    }
  }
}

export function renderCity(calendar, { login = '', date = new Date(), theme = 'auto' } = {}) {
  const season = seasonFor(theme, date);
  const weeks = calendar.weeks.map((w) => {
    const days = w.contributionDays.map((d) => d.contributionCount);
    return { total: days.reduce((a, b) => a + b, 0), active: days.filter((n) => n > 0).length };
  });
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const parts = [];
  const add = (s) => parts.push(s);

  // ---- sky: bands of night blue, dithered where they meet
  const sky = ['#070a1c', '#0b1030', '#121846', '#1b1f58', '#262563', '#33296a'];
  const band = Math.ceil(GROUND / sky.length);
  sky.forEach((col, i) => add(rect(0, i * band, W, band + 1, col)));
  sky.slice(1).forEach((col, i) => add(rect(0, (i + 1) * band - 2, W, 2, `url(#d${i + 1})`)));

  // ---- stars, a few of them twinkling
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash(i, 1) * W);
    const y = Math.floor(hash(i, 2) ** 1.6 * 70);
    const tw = i % 3 === 0 ? ` class="tw t${i % 4}"` : '';
    add(rect(x, y, 1, 1, hash(i, 3) < 0.2 ? '#ffe7b0' : '#cfd8ff', tw));
  }

  // ---- the moon, as it is tonight
  // a soft round halo, in two dithered rings of pixels
  const halo = [];
  for (let y = -13; y <= 13; y++)
    for (let x = -13; x <= 13; x++) {
      const d = Math.hypot(x, y);
      if (d > 8 && d < 13 && (x + y) % 2 === 0) halo.push(rect(W - 62 + x, 23 + y, 1, 1, '#f4f0dc'));
    }
  add(`<g opacity="${(0.1).toFixed(2)}">${halo.join('')}</g>`);
  add(moon(W - 62, 23, 7, moonPhase(date), '#f4f0dc', '#262a52'));

  if (season.fireworks) fireworks(add, date);

  // ---- a far skyline, just a silhouette
  for (let x = 0; x < W; x += 6) {
    const h = 10 + Math.floor(hash(x, 7) * 26);
    add(rect(x, GROUND - h, 6, h, '#171640'));
  }

  // ---- the buildings: one per week
  const city = [];
  const bw = 7;
  const x0 = Math.round((W - weeks.length * (bw + 1)) / 2);
  const ranked = [...weeks].map((w, i) => [w.total, i]).sort((a, b) => b[0] - a[0]);
  const tallest = new Set(ranked.slice(0, 3).filter(([n]) => n > 0).map(([, i]) => i));
  const bodies = ['#2a2350', '#2e2a5c', '#241e46', '#342b62', '#28244e'];
  const lights = ['#ffd27a', '#ffd27a', '#ffe9a8', '#8fd3ff', '#ff9ad5'];
  weeks.forEach((w, i) => {
    const x = x0 + i * (bw + 1);
    // log scale: one big week shouldn't flatten the rest of the year
    const h = w.total ? 8 + Math.round((Math.log1p(w.total) / Math.log1p(max)) * 84) : 4;
    const top = GROUND - h;
    const body = bodies[Math.floor(hash(i, 11) * bodies.length)];
    city.push(rect(x, top, bw, h, body));
    city.push(rect(x, top, 1, h, '#3d3572')); // the lit edge
    city.push(rect(x, top, bw, 1, '#4a4080')); // the roof line
    if (season.snow) city.push(rect(x, top - 1, bw, 2, '#e8eefc'), rect(x + 1 + Math.floor(hash(i, 51) * 4), top + 1, 2, 1, '#e8eefc')); // snow on the roof, a drip down the edge
    // windows: two columns, a row every three pixels; how many are lit follows the active days
    const lit = w.total ? 0.12 + 0.85 * (w.active / 7) : 0;
    for (let y = top + 3; y < GROUND - 2; y += 3)
      for (const dx of [1, 4]) {
        const r = hash(i, y, dx);
        if (r < lit) {
          const col = lights[Math.floor(hash(i, y, dx, 5) * lights.length)];
          const flick = hash(i, y, dx, 9) < 0.06 ? ` class="fl f${Math.floor(hash(i, y) * 3)}"` : '';
          city.push(rect(x + dx, y, 2, 1, col, flick));
        } else city.push(rect(x + dx, y, 2, 1, '#1a163a'));
      }
    // a little variety on the roofs: a stepped top, a spire, a water tank
    const roof = hash(i, 31);
    const building = i === weeks.length - 1; // this week isn't over: it's still going up
    if (building) {
      // scaffolding instead of a roof, and a crane working over it
      for (let y = top - 4; y < top; y += 2) city.push(rect(x, y, bw, 1, '#5a4a7a'));
      city.push(rect(x, top - 4, 1, 4, '#5a4a7a'), rect(x + bw - 1, top - 4, 1, 4, '#5a4a7a'));
      const mx = x + bw + 3;
      city.push(rect(mx, top - 26, 1, 26 + (GROUND - top), '#e8b030'));
      city.push(rect(mx - 12, top - 26, 18, 1, '#e8b030'));
      city.push(rect(mx + 4, top - 25, 2, 2, '#8a8aa8')); // counterweight
      city.push(`<g class="hook">${rect(mx - 9, top - 25, 1, 9, '#8a8aa8')}${rect(mx - 10, top - 16, 3, 2, '#e8b030')}</g>`);
      city.push(rect(mx, top - 27, 1, 1, '#ff4a4a', ' class="bk"'));
    } else if (!tallest.has(i) && h > 14) {
      if (roof < 0.22) city.push(rect(x + 1, top - 3, bw - 2, 3, body), rect(x + 1, top - 3, bw - 2, 1, '#4a4080'));
      else if (roof < 0.36) city.push(rect(x + 3, top - 5, 1, 5, '#4a4080'), rect(x + 2, top - 2, 3, 2, body));
      else if (roof < 0.48) city.push(rect(x + 2, top - 4, 3, 3, '#3a3060'), rect(x + 2, top - 1, 1, 1, '#2a2350'), rect(x + 4, top - 1, 1, 1, '#2a2350'));
    }
    // the busiest weeks get an antenna with a blinking red light
    if (tallest.has(i) && !building) {
      city.push(rect(x + 3, top - 6, 1, 6, '#4a4080'));
      city.push(rect(x + 3, top - 7, 1, 1, '#ff4a4a', ' class="bk"'));
    }
  });
  add(`<g id="city">${city.join('')}</g>`);

  // ---- the street, lamps, and cars going both ways
  add(rect(0, GROUND, W, WATER - GROUND, '#14122c'));
  add(rect(0, GROUND, W, 1, '#3a3270'));
  if (season.snow) add(rect(0, GROUND - 1, W, 2, '#dfe6f6'));
  for (let x = 12; x < W; x += 44) {
    add(rect(x, GROUND - 5, 1, 5, '#3a3270'));
    add(rect(x - 1, GROUND - 6, 3, 1, '#ffe6a0'));
    add(`<g opacity=".18">${rect(x - 4, GROUND - 4, 9, 4, '#ffd27a')}</g>`);
  }
  add(`<g class="car c1">${rect(0, GROUND + 2, 6, 2, '#5a4a8a')}${rect(6, GROUND + 2, 1, 1, '#fff2c0')}${rect(-1, GROUND + 3, 1, 1, '#ff5a5a')}</g>`);
  add(`<g class="car c2">${rect(0, GROUND + 3, 6, 2, '#3a5a8a')}${rect(-1, GROUND + 3, 1, 1, '#fff2c0')}${rect(6, GROUND + 4, 1, 1, '#ff5a5a')}</g>`);

  // ---- the river: the city upside down in it, and ripples catching the light
  add(rect(0, WATER, W, H - WATER, '#0a0c24'));
  add(`<g clip-path="url(#water)"><g transform="translate(0 ${GROUND * 2 + 2}) scale(1 -1)" opacity=".3"><use href="#city"/></g></g>`);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hash(i, 21) * W);
    const y = WATER + 2 + Math.floor(hash(i, 22) * (H - WATER - 14));
    add(rect(x, y, 3 + Math.floor(hash(i, 23) * 6), 1, '#5a5aa8', ` class="rp r${i % 3}" opacity=".35"`));
  }

  // ---- snow, falling in front of everything and drifting with the wind
  if (season.snow)
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(hash(i, 61) * W);
      const big = hash(i, 62) < 0.25;
      const dur = (big ? 6 : 9) + hash(i, 63) * 5;
      add(`<rect class="sn" x="${x}" y="-4" width="${big ? 2 : 1}" height="${big ? 2 : 1}" fill="#ffffff" opacity="${big ? 0.95 : 0.7}" style="animation-duration:${dur.toFixed(2)}s;animation-delay:${(-hash(i, 64) * dur).toFixed(2)}s"/>`);
    }
  if (season.fireworks) {
    const text = `HAPPY NEW YEAR ${newYear(date)}`;
    add(`<text x="${W / 2}" y="14" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="8" font-weight="700" fill="#ffd27a" class="ny">${text}</text>`);
  }

  // ---- a caption on the water
  const caption = esc(`${login ? '@' + login + ' · ' : ''}${calendar.totalContributions.toLocaleString('en-US')} contributions in the last year`);
  add(`<text x="${W - 6}" y="${H - 5}" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="6" fill="#cfd8ff" opacity=".75">${caption}</text>`);

  const style = `
    .tw{animation:tw 3.2s ease-in-out infinite}.t1{animation-delay:-.8s}.t2{animation-delay:-1.6s}.t3{animation-delay:-2.4s}
    @keyframes tw{0%,100%{opacity:1}50%{opacity:.15}}
    .fl{animation:fl 7s steps(1) infinite}.f1{animation-delay:-2.3s}.f2{animation-delay:-4.6s}
    @keyframes fl{0%,100%{opacity:1}40%{opacity:.1}48%{opacity:1}52%{opacity:.1}60%{opacity:1}}
    .bk{animation:bk 1.4s steps(1) infinite}@keyframes bk{0%,100%{opacity:1}50%{opacity:0}}
    .car{animation:drive 11s linear infinite}.c2{animation-name:back;animation-duration:15s;animation-delay:-6s}
    @keyframes drive{from{transform:translateX(-12px)}to{transform:translateX(${W + 12}px)}}
    @keyframes back{from{transform:translateX(${W + 12}px)}to{transform:translateX(-12px)}}
    .hook{animation:hook 6s ease-in-out infinite}@keyframes hook{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
    .rp{animation:rp 4s ease-in-out infinite}.r1{animation-delay:-1.3s}.r2{animation-delay:-2.6s}
    @keyframes rp{0%,100%{opacity:.1}50%{opacity:.45}}
    .sn{animation:sn linear infinite}
    @keyframes sn{from{transform:translate(0,0)}to{transform:translate(-26px,${H + 8}px)}}
    .rk,.cr,.sp{opacity:0;animation-iteration-count:infinite;animation-timing-function:ease-out}
    .rk{animation-name:rk}.cr{animation-name:cr}.sp{animation-name:sp}
    @keyframes rk{0%{opacity:0;transform:translateY(0)}5%{opacity:1}38%{opacity:1;transform:translateY(var(--up))}40%,100%{opacity:0;transform:translateY(var(--up))}}
    @keyframes cr{0%,39%{opacity:0}40%{opacity:1}46%,100%{opacity:0}}
    @keyframes sp{0%,39%{opacity:0;transform:translate(0,0)}41%{opacity:1}75%{opacity:.9}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}
    .ny{animation:ny 2.4s ease-in-out infinite}@keyframes ny{0%,100%{opacity:1}50%{opacity:.7}}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}.rk,.cr{opacity:0}.sp{opacity:.8;transform:translate(var(--dx),var(--dy))}.sn{transform:translateY(60px)}}`;
  const dithers = sky
    .slice(1)
    .map((col, i) => `<pattern id="d${i + 1}" width="2" height="2" patternUnits="userSpaceOnUse">${rect(0, 0, 2, 2, sky[i])}${rect(0, 0, 1, 1, col)}${rect(1, 1, 1, 1, col)}</pattern>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}" shape-rendering="crispEdges" role="img" aria-label="${caption}, drawn as a city at night">
<title>${caption}</title>
<defs>${dithers}<clipPath id="water">${rect(0, WATER, W, H - WATER, '#000')}</clipPath></defs>
<style>${style}</style>
${parts.join('\n')}
</svg>`;
}
