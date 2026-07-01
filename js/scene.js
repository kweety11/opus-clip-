/* ============================================================
   FILM TREND — procedural still generator
   Renders each catalogue shot as a self-contained cinematic
   SVG frame (2.39:1) from its movie palette + composition type.
   Swap this for real CDN stills in production.
   ============================================================ */

function sceneSVG(shot, seedOffset = 0) {
  const movie = MOVIES.find(m => m.slug === shot.movie) || MOVIES[0];
  const [c0, c1, c2] = movie.palette;
  const uid = `s${shot.id}_${seedOffset}`;
  const W = 720, H = 300;
  const rng = mulberry(shot.id * 7919 + seedOffset);

  const defs = `
    <defs>
      <linearGradient id="${uid}_sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${shade(c1, -30)}"/>
      </linearGradient>
      <radialGradient id="${uid}_glow" cx="50%" cy="50%" r="55%">
        <stop offset="0" stop-color="${c1}" stop-opacity=".95"/>
        <stop offset="1" stop-color="${c1}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${uid}_grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.05 0"/>
      </filter>
    </defs>`;

  let scene = "";
  switch (shot.comp) {
    case "horizon": {
      const sunX = 200 + rng() * 320, sunY = 120 + rng() * 40, sunR = 26 + rng() * 36;
      scene = `
        <rect width="${W}" height="${H}" fill="url(#${uid}_sky)"/>
        <circle cx="${sunX}" cy="${sunY}" r="${sunR * 3.2}" fill="url(#${uid}_glow)"/>
        <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="${tint(c1, 40)}"/>
        <rect y="${H * .62}" width="${W}" height="${H * .38}" fill="${shade(c0, -55)}"/>
        <rect y="${H * .62}" width="${W}" height="3" fill="${tint(c1, 15)}" opacity=".5"/>
        ${silhouette(W * (.3 + rng() * .4), H * .62, 1 + rng() * .3, shade(c0, -75))}
        ${hills(uid, W, H, shade(c0, -68), rng)}`;
      break;
    }
    case "neon": {
      let signs = "";
      for (let i = 0; i < 7; i++) {
        const x = 30 + rng() * (W - 90), y = 30 + rng() * (H * .5), w = 14 + rng() * 60, h = 8 + rng() * 46;
        const col = [c1, c2, tint(c1, 30)][i % 3];
        signs += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col}" opacity=".85"/>
                  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col}" opacity=".3" filter="blur(6px)"/>`;
      }
      scene = `
        <rect width="${W}" height="${H}" fill="${shade(c0, -40)}"/>
        <rect y="${H * .55}" width="${W}" height="${H * .45}" fill="#05060a"/>
        ${buildings(uid, W, H, shade(c0, -20), rng)}
        ${signs}
        <rect y="${H * .78}" width="${W}" height="${H * .22}" fill="${c2}" opacity=".08"/>
        ${silhouette(W * .5, H * .82, 1.15, "#020308")}`;
      break;
    }
    case "corridor": {
      const vx = W / 2, vy = H * .45;
      let walls = "";
      for (let i = 5; i >= 1; i--) {
        const t = i / 5, x = vx - (vx * t), y = vy - (vy * t * .9), w = W * t * 1.0 + (W - W * t), h = H;
        walls += `<rect x="${vx - (W / 2) * t}" y="${vy - (H / 2) * t * .92}" width="${W * t}" height="${H * t * .92 + (H / 2) * t}" fill="${mix(c0, c1, 1 - t)}" opacity="${.5 + t * .5}" stroke="${tint(c1, 10)}" stroke-opacity=".25"/>`;
      }
      scene = `
        <rect width="${W}" height="${H}" fill="${shade(c0, -50)}"/>
        ${walls}
        <rect x="${vx - 26}" y="${vy - 34}" width="52" height="78" fill="${tint(c1, 25)}" opacity=".9"/>
        ${silhouette(vx, vy + 44, .62, shade(c0, -80))}`;
      break;
    }
    case "window": {
      const wx = W * (.32 + rng() * .2), wy = H * .16, ww = W * .3, wh = H * .58;
      scene = `
        <rect width="${W}" height="${H}" fill="${shade(c0, -62)}"/>
        <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${tint(c1, 20)}"/>
        <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#${uid}_glow)" opacity=".7"/>
        <rect x="${wx + ww / 2 - 3}" y="${wy}" width="6" height="${wh}" fill="${shade(c0, -70)}"/>
        <rect x="${wx}" y="${wy + wh / 2 - 3}" width="${ww}" height="6" fill="${shade(c0, -70)}"/>
        <rect x="${wx - 14}" y="${wy + wh}" width="${ww + 28}" height="${H}" fill="${shade(c0, -70)}"/>
        ${silhouette(wx + ww * (.3 + rng() * .4), wy + wh, .95, "#04050a")}
        <rect width="${W}" height="${H}" fill="${c2}" opacity=".05"/>`;
      break;
    }
    case "road": {
      scene = `
        <rect width="${W}" height="${H * .55}" fill="url(#${uid}_sky)"/>
        <rect y="${H * .55}" width="${W}" height="${H * .45}" fill="${shade(c0, -65)}"/>
        <polygon points="${W * .42},${H * .55} ${W * .58},${H * .55} ${W * .88},${H} ${W * .12},${H}" fill="${shade(c0, -45)}"/>
        <polygon points="${W * .495},${H * .55} ${W * .505},${H * .55} ${W * .53},${H} ${W * .47},${H}" fill="${tint(c1, 30)}" opacity=".8"/>
        <circle cx="${W * .46}" cy="${H * .8}" r="9" fill="${tint(c1, 55)}"/>
        <circle cx="${W * .54}" cy="${H * .8}" r="9" fill="${tint(c1, 55)}"/>
        <circle cx="${W * .5}" cy="${H * .8}" r="60" fill="url(#${uid}_glow)" opacity=".55"/>
        ${hills(uid, W, H * 1.05, shade(c0, -60), rng)}`;
      break;
    }
    case "rain": {
      let drops = "";
      for (let i = 0; i < 46; i++) {
        const x = rng() * W, y = rng() * H, l = 12 + rng() * 22;
        drops += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + l}" stroke="${tint(c2, 40)}" stroke-opacity="${.18 + rng() * .3}" stroke-width="1.4"/>`;
      }
      scene = `
        <rect width="${W}" height="${H}" fill="url(#${uid}_sky)"/>
        <circle cx="${W * .72}" cy="${H * .3}" r="90" fill="url(#${uid}_glow)" opacity=".8"/>
        <rect y="${H * .7}" width="${W}" height="${H * .3}" fill="${shade(c0, -70)}"/>
        ${silhouette(W * .3, H * .7, 1.1, "#04050a")}
        ${drops}`;
      break;
    }
    case "closeup": {
      const bokeh = Array.from({ length: 8 }, () => {
        const x = rng() * W, y = rng() * H * .7, r = 10 + rng() * 34;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${[c1, c2][Math.round(rng())]}" opacity="${.12 + rng() * .2}"/>`;
      }).join("");
      scene = `
        <rect width="${W}" height="${H}" fill="${shade(c0, -45)}"/>
        ${bokeh}
        <circle cx="${W * .62}" cy="${H * .52}" r="130" fill="url(#${uid}_glow)" opacity=".85"/>
        <ellipse cx="${W * .62}" cy="${H * .78}" rx="92" ry="118" fill="${shade(c0, -78)}"/>
        <circle cx="${W * .62}" cy="${H * .48}" r="60" fill="${shade(c0, -74)}"/>
        <path d="M ${W * .62 - 60} ${H * .5} q 60 -26 120 0" stroke="${tint(c1, 30)}" stroke-width="2.5" fill="none" opacity=".5"/>`;
      break;
    }
    case "symmetry":
    default: {
      let win = "";
      const cols = 7, rows = 3;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const lit = rng() > .45;
          win += `<rect x="${W * .18 + c * (W * .64 / cols) + 8}" y="${H * .22 + r * (H * .5 / rows) + 6}" width="${W * .64 / cols - 16}" height="${H * .5 / rows - 12}" rx="2" fill="${lit ? tint(c1, 25) : shade(c0, -50)}"/>`;
        }
      scene = `
        <rect width="${W}" height="${H}" fill="url(#${uid}_sky)"/>
        <rect x="${W * .16}" y="${H * .14}" width="${W * .68}" height="${H * .64}" fill="${mix(c0, c1, .45)}" stroke="${tint(c2, 10)}" stroke-opacity=".4"/>
        ${win}
        <rect x="${W * .47}" y="${H * .56}" width="${W * .06}" height="${H * .22}" fill="${shade(c0, -60)}"/>
        <rect y="${H * .78}" width="${W}" height="${H * .22}" fill="${shade(c0, -58)}"/>
        ${silhouette(W * .5, H * .78, .8, shade(c0, -80))}`;
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
    ${defs}${scene}
    <rect width="${W}" height="${H}" filter="url(#${uid}_grain)"/>
    <rect width="${W}" height="${H}" fill="none" stroke="#000" stroke-opacity=".4"/>
  </svg>`;
}

/* small deterministic PRNG so every render is stable */
function mulberry(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function silhouette(x, baseY, s, fill) {
  return `<g transform="translate(${x} ${baseY}) scale(${s})">
    <circle cx="0" cy="-64" r="11" fill="${fill}"/>
    <path d="M -11 -54 Q 0 -60 11 -54 L 14 -6 Q 0 0 -14 -6 Z" fill="${fill}"/>
  </g>`;
}

function hills(uid, W, H, fill, rng) {
  const y = H * .62;
  let d = `M 0 ${y}`;
  for (let x = 0; x <= W; x += 90) d += ` L ${x} ${y - rng() * 44}`;
  return `<path d="${d} L ${W} ${y} Z" fill="${fill}"/>`;
}

function buildings(uid, W, H, fill, rng) {
  let b = "";
  for (let x = 0; x < W; x += 46 + rng() * 40) {
    const h = 60 + rng() * 110;
    b += `<rect x="${x}" y="${H * .55 - h}" width="${34 + rng() * 34}" height="${h}" fill="${fill}"/>`;
  }
  return b;
}

/* colour helpers */
function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b) { return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function shade(h, amt) { const [r, g, b] = hexRGB(h); return rgbHex(r + amt, g + amt, b + amt); }
function tint(h, amt) { return shade(h, Math.abs(amt)); }
function mix(h1, h2, t) {
  const a = hexRGB(h1), b = hexRGB(h2);
  return rgbHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}
