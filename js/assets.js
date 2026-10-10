/* Petal & Paper — asset library.
   Every sticker, frame, paper texture and preset is generated in code, so the
   editor works offline and exports are never tainted by remote images.
   Frames carry `holes`: SVG path strings (in the frame's own units) that are
   cut out of the artwork and used to clip photos placed inside. */
(function () {
  'use strict';

  const C = {
    blush: '#F4C7CF', rose: '#D98C9A', deep: '#A94F63', wine: '#6E2A3A',
    cream: '#FBF3E8', ivory: '#FFFDF8', paper: '#F7EEDC',
    sage: '#A9B68E', olive: '#6F7F52', moss: '#56663F',
    gold: '#C9A45C', goldL: '#EAD49C', goldD: '#9A773A',
    mocha: '#8B6B57', ink: '#3A2C2A', lav: '#B9A7D6', lavD: '#8C78B6', butter: '#F2D98B'
  };

  /* ---------- helpers ---------- */
  const f = n => Math.round(n * 100) / 100;
  const svg = (w, h, body, defs = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
  const at = (x, y, s, r, inner) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r)}) scale(${f(s)})">${inner}</g>`;
  const svgUrl = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const circleP = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
  const ellipseP = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)} a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0 a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0 Z`;
  function rectP(x, y, w, h, r = 0) {
    if (!r) return `M${x} ${y} h${w} v${h} h${-w} Z`;
    return `M${x + r} ${y} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r} a${r} ${r} 0 0 1 ${-r} ${r} h${-(w - 2 * r)} a${r} ${r} 0 0 1 ${-r} ${-r} v${-(h - 2 * r)} a${r} ${r} 0 0 1 ${r} ${-r} Z`;
  }
  const HEART = [[-110, 210, -140, 150, -130, 105], [-120, 55, -60, 40, -25, 75], [-12, 88, -4, 100, 0, 110],
    [4, 100, 12, 88, 25, 75], [60, 40, 120, 55, 130, 105], [140, 150, 110, 210, 0, 285]];
  function heartP(cx, cy, s) {
    const X = x => f(cx + x * s), Y = y => f(cy + (y - 166) * s);
    return `M${X(0)} ${Y(285)} ` + HEART.map(c => `C${X(c[0])} ${Y(c[1])} ${X(c[2])} ${Y(c[3])} ${X(c[4])} ${Y(c[5])}`).join(' ') + ' Z';
  }
  function scallopP(pts) {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i <= pts.length; i++) {
      const p = pts[i % pts.length], q = pts[i - 1];
      const r = Math.hypot(p[0] - q[0], p[1] - q[1]) / 2;
      d += ` A${f(r)} ${f(r)} 0 0 1 ${f(p[0])} ${f(p[1])}`;
    }
    return d + ' Z';
  }
  const ringPts = (cx, cy, rx, ry, n, off = -Math.PI / 2) =>
    Array.from({ length: n }, (_, i) => { const a = off + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  function rectPts(x, y, w, h, step) {
    const nx = Math.max(2, Math.round(w / step)), ny = Math.max(2, Math.round(h / step)), pts = [];
    for (let i = 0; i < nx; i++) pts.push([x + w * i / nx, y]);
    for (let i = 0; i < ny; i++) pts.push([x + w, y + h * i / ny]);
    for (let i = 0; i < nx; i++) pts.push([x + w - w * i / nx, y + h]);
    for (let i = 0; i < ny; i++) pts.push([x, y + h - h * i / ny]);
    return pts;
  }
  function tornP(x, y, w, h, amp, seed, step = 9) {
    const r = rng(seed), j = () => (r() - 0.5) * 2 * amp, pts = [];
    for (let i = 0; i <= w; i += step) pts.push([x + i, y + j()]);
    for (let i = step; i <= h; i += step) pts.push([x + w + j(), y + i]);
    for (let i = w - step; i >= 0; i -= step) pts.push([x + i, y + h + j()]);
    for (let i = h - step; i > 0; i -= step) pts.push([x + j(), y + i]);
    return 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z';
  }
  function blobP(cx, cy, r, jitter, n, seed) {
    const rnd = rng(seed);
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2, rr = r + (rnd() - 0.5) * 2 * jitter;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    });
    // smooth closed curve through points (Catmull-Rom → Bézier)
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + ' Z';
  }
  const quad = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  const quadAngle = (a, c, b, t) => {
    const dx = 2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
    const dy = 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  /* ---------- reusable drawn components (centered at 0,0) ---------- */
  const leaf = (fill = C.sage, vein = C.olive) =>
    `<path d="M0 0C10-13 32-14 44 0C32 14 10 13 0 0Z" fill="${fill}" stroke="${vein}" stroke-width="1.2"/><path d="M3 0L38 0" stroke="${vein}" stroke-width="1.2" stroke-linecap="round"/>`;

  function rose(base = C.rose, dark = C.deep, light = '#F2B6C1') {
    const petals = [[0, -22], [20.9, -6.8], [12.9, 17.8], [-12.9, 17.8], [-20.9, -6.8]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="28" fill="${base}" stroke="${dark}" stroke-width="1.6"/>`).join('');
    return petals +
      `<circle r="29" fill="${light}" stroke="${dark}" stroke-width="1.6"/>` +
      `<path d="M-24 8C-18 24 18 26 26 6" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round" opacity=".65"/>` +
      `<path d="M-2 2C6-6 16 0 12 10C8 20-12 20-16 6C-20-10-4-22 12-18C22-15 27-6 25 4" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  const ROSE_CREAM = ['#F7E6D2', '#BF9873', '#FFF5EA'];
  const ROSE_RED = ['#B8506A', '#6E2A3A', '#D06F86'];
  const ROSE_BLUSH = ['#F2BCC6', '#C7788A', '#FBDDE2'];

  function blossom(petal = '#FFFFFF', center = C.butter, edge = '#E6D6C6') {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = i * 72 * Math.PI / 180 - Math.PI / 2;
      s += `<circle cx="${f(Math.cos(a) * 8)}" cy="${f(Math.sin(a) * 8)}" r="7" fill="${petal}" stroke="${edge}" stroke-width="1"/>`;
    }
    return s + `<circle r="4.5" fill="${center}"/>`;
  }

  function bowParts(id, c1, c2, c3) {
    const defs = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
    const g = `url(#${id})`, st = `stroke="${c3}" stroke-width="2" stroke-linejoin="round"`;
    const body =
      `<path d="M104 96C96 124 80 152 62 186L80 178L90 196C102 162 110 130 114 100Z" fill="${g}" ${st}/>` +
      `<path d="M116 96C124 124 140 152 158 186L140 178L130 196C118 162 110 130 106 100Z" fill="${g}" ${st}/>` +
      `<path d="M104 80C80 40 30 22 18 50C8 74 22 110 52 112C72 114 92 102 104 92Z" fill="${g}" ${st}/>` +
      `<path d="M116 80C140 40 190 22 202 50C212 74 198 110 168 112C148 114 128 102 116 92Z" fill="${g}" ${st}/>` +
      `<path d="M100 84C78 66 52 56 34 60M100 90C80 94 60 98 42 94M120 84C142 66 168 56 186 60M120 90C140 94 160 98 178 94" fill="none" stroke="${c3}" stroke-width="1.4" opacity=".45" stroke-linecap="round"/>` +
      `<rect x="96" y="74" width="28" height="30" rx="11" fill="${g}" ${st}/>` +
      `<path d="M36 52C48 42 66 44 80 56M184 52C172 42 154 44 140 56" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>`;
    return { defs, body };
  }
  const bowAt = (id, x, y, s, c1, c2, c3) => {
    const b = bowParts(id, c1, c2, c3);
    return { defs: b.defs, body: `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)}) translate(-110 -92)">${b.body}</g>` };
  };
  const BOW_PINK = ['#F8CAD3', '#E59AAA', '#C46B80'];
  const BOW_CREAM = ['#FFF4E4', '#EBD5B8', '#B89670'];

  const pearlDefs = (id = 'pearl') => `<radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#F4ECE2"/><stop offset="1" stop-color="#C4B5A2"/></radialGradient>`;
  const pearl = (x, y, r, id = 'pearl') => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#${id})" stroke="#B8A893" stroke-width=".6"/>`;
  const goldDefs = (id = 'gold') => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.goldL}"/><stop offset=".45" stop-color="${C.gold}"/><stop offset=".7" stop-color="${C.goldL}"/><stop offset="1" stop-color="${C.goldD}"/></linearGradient>`;
  const sparkleD = 'M0-50C4-14 14-4 50 0C14 4 4 14 0 50C-4 14-14 4-50 0C-14-4-4-14 0-50Z';

  function perfMask(id, w, h, r, step) {
    let c = '';
    const nx = Math.round(w / step), ny = Math.round(h / step);
    for (let i = 0; i < nx; i++) { const x = (i + 0.5) * w / nx; c += `<circle cx="${f(x)}" cy="0" r="${r}"/><circle cx="${f(x)}" cy="${h}" r="${r}"/>`; }
    for (let i = 0; i < ny; i++) { const y = (i + 0.5) * h / ny; c += `<circle cx="0" cy="${f(y)}" r="${r}"/><circle cx="${w}" cy="${f(y)}" r="${r}"/>`; }
    return `<mask id="${id}"><rect width="${w}" height="${h}" fill="#fff"/><g fill="#000">${c}</g></mask>`;
  }
  const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
  const SANS = `font-family="'Helvetica Neue', Arial, sans-serif"`;

  /* =====================================================================
     STICKERS
     ===================================================================== */
  const S = [];
  const add = (id, name, cat, w, h, s) => S.push({ id, name, cat, w, h, svg: s });

  /* ---- florals ---- */
  add('rose', 'Rose', 'florals', 200, 260, svg(200, 260,
    `<path d="M100 120C96 160 104 200 99 252" stroke="${C.olive}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    at(101, 176, 1.1, -35, leaf()) + at(99, 206, 1.0, -150, leaf()) +
    at(100, 84, 1.22, 0, rose())));

  add('rose-bouquet', 'Rose trio', 'florals', 250, 220, svg(250, 220,
    at(46, 150, 1.15, 160, leaf()) + at(204, 152, 1.15, 20, leaf()) + at(62, 58, 1.0, -140, leaf()) + at(196, 50, 1.0, -40, leaf()) + at(126, 196, 1.0, 95, leaf()) +
    at(84, 92, 0.86, -10, rose(...ROSE_CREAM)) + at(166, 90, 0.8, 15, rose(...ROSE_BLUSH)) + at(124, 140, 0.92, 0, rose(...ROSE_RED))));

  add('tulip', 'Tulip', 'florals', 160, 260, svg(160, 260,
    `<path d="M80 128C78 170 82 210 80 255" stroke="${C.olive}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<path d="M80 250C40 230 28 190 36 148C56 178 72 208 80 250Z" fill="${C.sage}" stroke="${C.olive}" stroke-width="1.6"/>` +
    `<path d="M82 240C120 220 134 180 126 138C108 170 92 200 82 240Z" fill="${C.sage}" stroke="${C.olive}" stroke-width="1.6"/>` +
    `<path d="M42 50C38 100 56 132 80 134C104 132 122 100 118 50C108 62 100 70 96 78C92 60 86 46 80 34C74 46 68 60 64 78C60 70 52 62 42 50Z" fill="url(#tg)" stroke="${C.deep}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M80 38C73 70 72 104 80 132M64 80C62 100 66 118 76 130M96 80C98 100 94 118 84 130" fill="none" stroke="${C.deep}" stroke-width="1.4" opacity=".4"/>` +
    `<path d="M52 66C50 84 54 100 62 112" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    `<linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8C3CC"/><stop offset="1" stop-color="#D9788C"/></linearGradient>`));

  (function () {
    let back = '', front = '';
    for (let i = 0; i < 12; i++) {
      back += `<ellipse cx="100" cy="56" rx="10" ry="30" fill="#F3EADF" stroke="#DCCDBB" stroke-width="1" transform="rotate(${i * 30 + 15} 100 100)"/>`;
      front += `<ellipse cx="100" cy="58" rx="11" ry="30" fill="${C.ivory}" stroke="#E0D2C2" stroke-width="1.2" transform="rotate(${i * 30} 100 100)"/>`;
    }
    let dots = '';
    const r = rng(3);
    for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, d = r() * 12; dots += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="1.4" fill="#B57F22" opacity=".6"/>`; }
    add('daisy', 'Daisy', 'florals', 200, 200, svg(200, 200, back + front + `<circle cx="100" cy="100" r="19" fill="#EDBB4A" stroke="#C9932A" stroke-width="1.5"/>` + dots));
  })();

  function lavenderStems(base, tips, budCount = 9, spread = 0.05) {
    let s = '';
    tips.forEach(([tx, ty], k) => {
      const ctrl = [(base[0] + tx) / 2 + (k - (tips.length - 1) / 2) * 6, (base[1] + ty) / 2];
      s += `<path d="M${base[0]} ${base[1]}Q${f(ctrl[0])} ${f(ctrl[1])} ${tx} ${ty}" stroke="${C.olive}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < budCount; i++) {
        const u = 1 - i * spread, [px, py] = quad(base, ctrl, [tx, ty], u), a = quadAngle(base, ctrl, [tx, ty], u) - 90;
        const sc = 0.6 + i * 0.05, col = i % 2 ? C.lav : C.lavD;
        s += `<ellipse rx="${f(4.2 * sc)}" ry="${f(7.5 * sc)}" fill="${col}" transform="translate(${f(px)} ${f(py)}) rotate(${f(a + 28)}) translate(0 ${f(-4 * sc)})"/>`;
        s += `<ellipse rx="${f(4.2 * sc)}" ry="${f(7.5 * sc)}" fill="${i % 2 ? C.lavD : C.lav}" transform="translate(${f(px)} ${f(py)}) rotate(${f(a - 28)}) translate(0 ${f(-4 * sc)})"/>`;
      }
    });
    return s;
  }
  add('lavender', 'Lavender', 'florals', 180, 280, svg(180, 280,
    lavenderStems([90, 268], [[46, 40], [92, 20], [138, 42]]) +
    `<g fill="none" stroke="#B08B61" stroke-width="2.5" stroke-linecap="round"><path d="M90 226C76 208 62 214 70 226C76 236 86 230 90 226ZM90 226C104 208 118 214 110 226C104 236 94 230 90 226Z"/><path d="M90 227L80 250M90 227L100 252"/></g>`));

  (function () {
    const y = x => 60 + 26 * Math.sin((x - 10) / 150 * Math.PI * 2);
    let d = `M10 ${f(y(10))}`;
    for (let x = 16; x <= 450; x += 6) d += ` L${x} ${f(y(x))}`;
    let s = `<path d="${d}" fill="none" stroke="${C.olive}" stroke-width="3.5" stroke-linecap="round"/>`;
    let side = 1;
    for (let x = 28; x <= 440; x += 30) {
      const slope = Math.atan2(y(x + 1) - y(x - 1), 2) * 180 / Math.PI;
      s += at(x, y(x), 0.62, slope - side * 55, leaf());
      side *= -1;
    }
    [85, 235, 385].forEach(x => { s += at(x, y(x), 0.95, 0, blossom('#FBE1E6', C.butter, C.rose)); });
    [160, 310].forEach(x => { s += at(x, y(x), 0.7, 20, blossom('#FFFFFF', C.butter)); });
    add('vine', 'Leafy vine', 'florals', 460, 120, svg(460, 120, s));
  })();

  (function () {
    const yT = x => 30 + 7 * Math.sin(x / 26), xL = yy => 30 + 7 * Math.sin(yy / 26);
    let dT = 'M30 30', dL = 'M30 30';
    for (let x = 36; x <= 250; x += 6) dT += ` L${x} ${f(yT(x))}`;
    for (let yy = 36; yy <= 250; yy += 6) dL += ` L${f(xL(yy))} ${yy}`;
    let s = `<path d="${dT}" fill="none" stroke="${C.olive}" stroke-width="3" stroke-linecap="round"/><path d="${dL}" fill="none" stroke="${C.olive}" stroke-width="3" stroke-linecap="round"/>`;
    let side = 1;
    for (let p = 84; p <= 240; p += 24) {
      s += at(p, yT(p), 0.55, side > 0 ? -40 : 40, leaf());
      s += at(xL(p), p, 0.55, side > 0 ? 130 : 50, leaf());
      side *= -1;
    }
    s += at(150, yT(150), 0.75, 0, blossom('#FBE1E6', C.butter, C.rose)) + at(xL(150), 150, 0.75, 0, blossom('#FBE1E6', C.butter, C.rose));
    s += at(220, yT(220), 0.6, 0, blossom()) + at(xL(220), 220, 0.6, 0, blossom());
    s += at(76, 70, 0.9, 45, leaf()) + at(70, 76, 0.9, 45, leaf());
    s += at(100, 32, 0.38, 20, rose(...ROSE_CREAM)) + at(32, 100, 0.38, -20, rose(...ROSE_CREAM)) + at(44, 44, 0.62, 0, rose());
    add('floral-corner', 'Floral corner', 'florals', 260, 260, svg(260, 260, s));
  })();

  (function () {
    const base = [110, 258], r = rng(11);
    const tips = [
      { x: 38, y: 74, t: 'breath' }, { x: 74, y: 38, t: 'wheat' }, { x: 110, y: 24, t: 'blossom' }, { x: 146, y: 40, t: 'lav' },
      { x: 182, y: 76, t: 'breath' }, { x: 62, y: 116, t: 'blossom' }, { x: 160, y: 108, t: 'wheat' }, { x: 112, y: 86, t: 'breath' }
    ];
    let stems = '', heads = '';
    tips.forEach(tp => {
      const ctrl = [(base[0] + tp.x) / 2 + (tp.x - base[0]) * 0.15, (base[1] + tp.y) / 2];
      stems += `<path d="M${base[0]} ${base[1]}Q${f(ctrl[0])} ${f(ctrl[1])} ${tp.x} ${tp.y}" stroke="#8C9468" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      if (tp.t === 'breath') {
        for (let i = 0; i < 11; i++) {
          const a = r() * Math.PI * 2, d = 4 + r() * 15, px = tp.x + Math.cos(a) * d, py = tp.y + Math.sin(a) * d * 0.8;
          heads += `<path d="M${tp.x} ${tp.y}L${f(px)} ${f(py)}" stroke="#A7AE86" stroke-width="1"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(2.6 + r() * 1.6)}" fill="#FFFDF8" stroke="#E1D5C4" stroke-width=".8"/>`;
        }
      } else if (tp.t === 'wheat') {
        for (let i = 0; i < 6; i++) {
          const u = 1 - i * 0.045, [px, py] = quad(base, ctrl, [tp.x, tp.y], u), a = quadAngle(base, ctrl, [tp.x, tp.y], u) - 90;
          heads += `<ellipse rx="3.6" ry="7" fill="#DDBB80" stroke="#B08B4F" stroke-width=".8" transform="translate(${f(px)} ${f(py)}) rotate(${f(a + 24)}) translate(0 -4)"/><ellipse rx="3.6" ry="7" fill="#E6C892" stroke="#B08B4F" stroke-width=".8" transform="translate(${f(px)} ${f(py)}) rotate(${f(a - 24)}) translate(0 -4)"/>`;
        }
      } else if (tp.t === 'blossom') {
        heads += at(tp.x, tp.y, 1.1, r() * 60, blossom(C.blush, C.butter, C.rose));
      } else {
        heads += lavenderStems(base, [[tp.x, tp.y]], 7, 0.05).replace(/<path[^>]*\/>/, '');
      }
    });
    const bow = bowAt('bq', 110, 232, 0.36, ...BOW_CREAM);
    add('bouquet', 'Dried bouquet', 'florals', 220, 280, svg(220, 280, stems + heads + bow.body, bow.defs));
  })();

  (function () {
    const a = [70, 292], c = [56, 150], b = [80, 14];
    let s = `<path d="M70 292Q56 150 80 14" stroke="${C.moss}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    for (let i = 1; i <= 13; i++) {
      const u = i / 14, [px, py] = quad(a, c, b, u), ang = quadAngle(a, c, b, u), sz = 1.05 - u * 0.68;
      s += at(px, py, sz, ang - 52, leaf(i % 2 ? C.sage : '#B9C49F', C.moss)) + at(px, py, sz, ang + 52, leaf(i % 2 ? '#B9C49F' : C.sage, C.moss));
    }
    add('fern', 'Pressed fern', 'florals', 140, 300, svg(140, 300, s));
  })();

  /* ---- coquette ---- */
  const bowSvg = (c1, c2, c3) => { const b = bowParts('bg', c1, c2, c3); return svg(220, 200, b.body, b.defs); };
  add('bow-pink', 'Satin bow', 'coquette', 220, 200, bowSvg(...BOW_PINK));
  add('bow-velvet', 'Velvet bow', 'coquette', 220, 200, bowSvg('#4C3B40', '#271C1F', '#140D0F'));
  add('bow-cream', 'Cream bow', 'coquette', 220, 200, bowSvg(...BOW_CREAM));
  add('bow-red', 'Cherry bow', 'coquette', 220, 200, bowSvg('#DE5468', '#A82C42', '#741B2C'));

  add('heart', 'Glossy heart', 'coquette', 200, 180, svg(200, 180,
    `<path d="${heartP(100, 92, 0.6)}" fill="url(#hg)" stroke="#B45A6E" stroke-width="2"/>` +
    `<path d="M48 64C52 48 66 40 80 44" stroke="#fff" stroke-opacity=".7" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="46" cy="80" r="3.5" fill="#fff" opacity=".7"/>`,
    `<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7B9C5"/><stop offset="1" stop-color="#D66A82"/></linearGradient>`));

  add('hearts', 'Heart confetti', 'coquette', 220, 170, svg(220, 170,
    `<g transform="rotate(-14 78 92)"><path d="${heartP(78, 92, 0.36)}" fill="${C.rose}"/></g>` +
    `<g transform="rotate(12 156 62)"><path d="${heartP(156, 62, 0.24)}" fill="${C.blush}"/></g>` +
    `<g transform="rotate(18 164 130)"><path d="${heartP(164, 130, 0.17)}" fill="${C.deep}"/></g>` +
    `<g transform="rotate(-20 34 30)"><path d="${heartP(34, 30, 0.1)}" fill="none" stroke="${C.deep}" stroke-width="3"/></g>` +
    `<g transform="rotate(8 110 150)"><path d="${heartP(110, 150, 0.08)}" fill="${C.rose}"/></g>`));

  (function () {
    const cx = 110, cy = 110;
    let holes = '';
    ringPts(cx, cy, 88, 88, 28).forEach(([x, y]) => holes += ' ' + circleP(x, y, 4.4));
    ringPts(cx, cy, 70, 70, 14, -Math.PI / 2 + Math.PI / 14).forEach(([x, y]) => holes += ' ' + circleP(x, y, 6.5));
    ringPts(cx, cy, 52, 52, 28).forEach(([x, y]) => holes += ' ' + circleP(x, y, 2.4));
    const body = `<path d="${scallopP(ringPts(cx, cy, 102, 102, 30))}${holes}" fill="${C.ivory}" fill-rule="evenodd" stroke="#E2D4C1" stroke-width="1.2"/>` +
      `<circle cx="${cx}" cy="${cy}" r="96" fill="none" stroke="#E8DCCB" stroke-width="1" stroke-dasharray="2 3"/>` +
      `<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="#E8DCCB" stroke-width="1.2"/>` +
      `<circle cx="${cx}" cy="${cy}" r="32" fill="none" stroke="#E8DCCB" stroke-width="1" stroke-dasharray="3 3"/>`;
    add('doily', 'Lace doily', 'coquette', 220, 220, svg(220, 220, body));
  })();

  (function () {
    let d = 'M0 0 H420 V26';
    for (let x = 420; x > 0; x -= 30) d += ` A15 15 0 0 1 ${x - 30} 26`;
    d += ' Z';
    let holes = '';
    for (let x = 15; x < 420; x += 15) holes += ' ' + circleP(x, 13, 3.4);
    for (let x = 15; x < 420; x += 30) holes += ' ' + circleP(x, 34, 4);
    add('lace', 'Lace trim', 'coquette', 420, 50, svg(420, 50,
      `<path d="${d}${holes}" fill="${C.ivory}" fill-rule="evenodd" stroke="#E2D4C1" stroke-width="1"/><path d="M0 4H420M0 22H420" stroke="#E6D9C6" stroke-width="1" stroke-dasharray="3 3"/>`));
  })();

  function butterfly(c1, c2, dark) {
    const st = `stroke="${dark}" stroke-width="2" stroke-linejoin="round"`;
    return svg(220, 180,
      `<path d="M108 70C100 50 92 40 82 34M112 70C120 50 128 40 138 34" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/><circle cx="82" cy="34" r="3" fill="${dark}"/><circle cx="138" cy="34" r="3" fill="${dark}"/>` +
      `<path d="M106 96C70 98 40 118 46 146C54 170 90 152 106 108Z" fill="url(#bw)" ${st}/>` +
      `<path d="M114 96C150 98 180 118 174 146C166 170 130 152 114 108Z" fill="url(#bw)" ${st}/>` +
      `<path d="M106 88C80 30 30 12 18 42C8 68 40 98 104 98Z" fill="url(#bw)" ${st}/>` +
      `<path d="M114 88C140 30 190 12 202 42C212 68 180 98 116 98Z" fill="url(#bw)" ${st}/>` +
      `<path d="M100 88C80 52 50 38 36 50C28 62 50 86 98 92ZM120 88C140 52 170 38 184 50C192 62 170 86 122 92Z" fill="#fff" opacity=".28"/>` +
      `<circle cx="44" cy="52" r="7" fill="#fff" opacity=".7"/><circle cx="176" cy="52" r="7" fill="#fff" opacity=".7"/><circle cx="64" cy="136" r="5" fill="#fff" opacity=".6"/><circle cx="156" cy="136" r="5" fill="#fff" opacity=".6"/>` +
      `<ellipse cx="110" cy="100" rx="6" ry="34" fill="${dark}"/>`,
      `<linearGradient id="bw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
  }
  add('butterfly-lav', 'Lilac butterfly', 'coquette', 220, 180, butterfly('#DCCFF0', '#9F89C8', '#5E4C80'));
  add('butterfly-pink', 'Blush butterfly', 'coquette', 220, 180, butterfly('#FBD5DC', '#E08EA0', '#8E4558'));
  add('butterfly-blue', 'Powder butterfly', 'coquette', 220, 180, butterfly('#D7E6F0', '#8FB0C9', '#4D6A80'));

  add('sparkles', 'Sparkles', 'coquette', 200, 200, svg(200, 200,
    at(88, 104, 1.4, 0, `<path d="${sparkleD}" fill="url(#gold)" stroke="${C.goldD}" stroke-width="1"/>`) +
    at(160, 46, 0.62, 0, `<path d="${sparkleD}" fill="url(#gold)" stroke="${C.goldD}" stroke-width="1.6"/>`) +
    at(162, 150, 0.42, 0, `<path d="${sparkleD}" fill="#FFF8E8" stroke="${C.gold}" stroke-width="2"/>`), goldDefs()));

  add('sparkle-white', 'Twinkle', 'coquette', 160, 160, svg(160, 160,
    at(80, 80, 1.45, 0, `<path d="${sparkleD}" fill="#FFFFFF" stroke="#EADFD3" stroke-width="1"/>`) +
    at(80, 80, 0.7, 45, `<path d="${sparkleD}" fill="#FFFFFF" opacity=".8"/>`)));

  (function () {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 30 : 70; pts.push(`${f(80 + Math.cos(a) * r)} ${f(84 + Math.sin(a) * r)}`); }
    add('star', 'Gold star', 'coquette', 160, 160, svg(160, 160,
      `<path d="M${pts.join(' L')} Z" fill="url(#gold)" stroke="${C.goldD}" stroke-width="5" stroke-linejoin="round"/><path d="M${pts.join(' L')} Z" fill="none" stroke="${C.goldL}" stroke-width="1.5" stroke-linejoin="round" transform="translate(80 84) scale(.8) translate(-80 -84)"/>`, goldDefs()));
  })();

  (function () {
    const a = [20, 30], c = [200, 170], b = [380, 30];
    let s = `<path d="M20 30Q200 170 380 30" fill="none" stroke="#D8CBB8" stroke-width="1.5"/>`;
    for (let i = 0; i <= 23; i++) { const [x, y] = quad(a, c, b, i / 23); s += pearl(x, y, 10); }
    add('pearls', 'Pearl string', 'coquette', 400, 130, svg(400, 130, s, pearlDefs()));
  })();

  (function () {
    // sample the classic heart curve densely, then place pearls at equal arc-length steps
    const pt = t => [110 + 5.6 * 16 * Math.pow(Math.sin(t), 3), 92 - 5.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
    const dense = Array.from({ length: 601 }, (_, i) => pt(i / 600 * Math.PI * 2));
    const len = [0];
    for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const total = len[len.length - 1], n = 30;
    let s = '', j = 0;
    for (let i = 0; i < n; i++) {
      const target = i / n * total;
      while (len[j] < target) j++;
      s += pearl(dense[j][0], dense[j][1], 8);
    }
    add('pearl-heart', 'Pearl heart', 'coquette', 220, 200, svg(220, 200, s, pearlDefs()));
  })();

  (function () {
    const bow = bowAt('cb', 120, 36, 0.3, ...BOW_PINK);
    add('cherries', 'Cherries', 'coquette', 200, 220, svg(200, 220,
      `<path d="M70 122C78 92 96 62 120 34M132 132C130 100 124 66 120 34" stroke="#5B6B3E" stroke-width="4" fill="none" stroke-linecap="round"/>` +
      at(122, 36, 1.1, -24, leaf('#9EB07A', '#5B6B3E')) +
      `<circle cx="70" cy="152" r="32" fill="url(#cg)" stroke="#8E1F35" stroke-width="1.5"/><circle cx="132" cy="162" r="32" fill="url(#cg)" stroke="#8E1F35" stroke-width="1.5"/>` +
      `<ellipse cx="58" cy="138" rx="9" ry="6" fill="#fff" opacity=".55" transform="rotate(-30 58 138)"/><ellipse cx="120" cy="148" rx="9" ry="6" fill="#fff" opacity=".55" transform="rotate(-30 120 148)"/>` + bow.body,
      `<radialGradient id="cg" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#F26A80"/><stop offset="1" stop-color="#A81E3A"/></radialGradient>` + bow.defs));
  })();

  add('ribbon', 'Ribbon banner', 'coquette', 360, 130, svg(360, 130,
    `<path d="M14 54H70V108H14L32 81Z" fill="#C46B80"/><path d="M346 54H290V108H346L328 81Z" fill="#C46B80"/>` +
    `<path d="M70 98L54 108H70ZM290 98L306 108H290Z" fill="#8E4558"/>` +
    `<path d="M54 40Q180 6 306 40V94Q180 60 54 94Z" fill="url(#rg)" stroke="#B45A6E" stroke-width="1.5"/>` +
    `<path id="rp" d="M64 76Q180 44 296 76" fill="none"/>` +
    `<text ${SERIF} font-style="italic" font-size="26" fill="#FFF7F4" text-anchor="middle"><textPath href="#rp" startOffset="50%">with love</textPath></text>`,
    `<linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3B3C0"/><stop offset="1" stop-color="#D98C9A"/></linearGradient>`));

  /* ---- vintage ---- */
  add('stamp-rose', 'Rose stamp', 'vintage', 200, 240, svg(200, 240,
    `<g mask="url(#sm)"><rect width="200" height="240" fill="#FBF3E6"/></g>` +
    `<rect x="16" y="16" width="168" height="208" fill="#EFD0CB" stroke="#9E4E5E" stroke-width="1.5"/>` +
    at(52, 150, 0.9, -140, leaf()) + at(148, 150, 0.9, -40, leaf()) + at(100, 112, 0.8, 0, rose()) +
    `<text x="100" y="204" ${SERIF} font-size="17" letter-spacing="5" fill="#6E2A3A" text-anchor="middle">AMOUR</text>` +
    `<text x="28" y="42" ${SERIF} font-size="18" fill="#6E2A3A">25c</text><text x="172" y="40" ${SERIF} font-size="9" letter-spacing="2" fill="#6E2A3A" text-anchor="end">POSTES</text>`,
    perfMask('sm', 200, 240, 6, 16)));

  add('stamp-butterfly', 'Par avion stamp', 'vintage', 200, 240, svg(200, 240,
    `<g mask="url(#sm2)"><rect width="200" height="240" fill="#F6F1E6"/></g>` +
    `<rect x="16" y="16" width="168" height="208" fill="#D6E3EA" stroke="#4D6A80" stroke-width="1.5"/>` +
    `<path d="M16 168C60 150 120 176 184 158V224H16Z" fill="#BCD0B0"/>` +
    `<g transform="translate(100 104) scale(.62) translate(-110 -100)"><path d="M106 96C70 98 40 118 46 146C54 170 90 152 106 108ZM114 96C150 98 180 118 174 146C166 170 130 152 114 108ZM106 88C80 30 30 12 18 42C8 68 40 98 104 98ZM114 88C140 30 190 12 202 42C212 68 180 98 116 98Z" fill="#F1C9A5" stroke="#7C5236" stroke-width="2.6"/><ellipse cx="110" cy="100" rx="6" ry="34" fill="#7C5236"/></g>` +
    `<text x="100" y="208" ${SERIF} font-style="italic" font-size="18" fill="#2F4A5E" text-anchor="middle">par avion</text>` +
    `<text x="172" y="42" ${SERIF} font-size="18" fill="#2F4A5E" text-anchor="end">50c</text>`,
    perfMask('sm2', 200, 240, 6, 16)));

  add('postmark', 'Postmark', 'vintage', 240, 150, svg(240, 150,
    `<g fill="none" stroke="${C.ink}" stroke-width="2.4" opacity=".78"><circle cx="72" cy="75" r="58"/><circle cx="72" cy="75" r="38"/>` +
    [0, 1, 2, 3, 4].map(i => `<path d="M138 ${40 + i * 17}c12-8 22-8 34 0s22 8 34 0s22-8 30-2"/>`).join('') + `</g>` +
    `<text ${SERIF} font-size="12.5" letter-spacing="2.2" fill="${C.ink}" opacity=".8"><textPath href="#pm">PARIS ✦ 14 FEV ✦ 1962 ✦ PARIS</textPath></text>` +
    `<text x="72" y="84" text-anchor="middle" ${SERIF} font-size="26" fill="${C.ink}" opacity=".78">♡</text>`,
    `<path id="pm" d="M72 75m-48 0a48 48 0 1 1 96 0a48 48 0 1 1-96 0"/>`));

  const tornSticker = (fill, line, seed) => {
    const d = tornP(8, 16, 364, 78, 5, seed, 8);
    let lines = '';
    for (let y = 36; y < 92; y += 16) lines += `<path d="M18 ${y}H362" stroke="${line}" stroke-width="1"/>`;
    return svg(380, 110, `<path d="${d}" fill="rgba(70,45,30,.14)" transform="translate(2 3)"/><path d="${d}" fill="${fill}"/>${lines}`);
  };
  add('torn-paper', 'Torn note', 'vintage', 380, 110, tornSticker('#F8F0E2', 'rgba(150,170,200,.35)', 5));
  add('torn-kraft', 'Kraft scrap', 'vintage', 380, 110, tornSticker('#CDA77F', 'rgba(110,75,45,.0)', 9));

  function washi(defs, fill, opacity = 0.86) {
    const pts = [];
    for (let x = 12; x <= 248; x += 8) pts.push([x, 6]);
    let k = 0;
    for (let y = 6; y <= 58; y += 6.5) pts.push([k++ % 2 ? 254 : 248, y]);
    for (let x = 248; x >= 12; x -= 8) pts.push([x, 58]);
    k = 0;
    for (let y = 58; y >= 6; y -= 6.5) pts.push([k++ % 2 ? 6 : 12, y]);
    const d = 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z';
    return svg(260, 64, `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`, defs);
  }
  add('washi-gingham', 'Gingham tape', 'vintage', 260, 64, washi(
    `<pattern id="wg" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#FFF3F5"/><rect width="8" height="16" fill="#F2A9B8" opacity=".45"/><rect width="16" height="8" fill="#F2A9B8" opacity=".45"/></pattern>`, 'url(#wg)'));
  add('washi-dots', 'Dotted tape', 'vintage', 260, 64, washi(
    `<pattern id="wd" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#DDE4CB"/><circle cx="4" cy="4" r="2" fill="#fff"/><circle cx="11" cy="11" r="2" fill="#fff"/></pattern>`, 'url(#wd)'));
  add('washi-stripe', 'Striped tape', 'vintage', 260, 64, washi(
    `<pattern id="ws" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#FBEFD0"/><rect width="5" height="12" fill="#F2D98B" opacity=".8"/></pattern>`, 'url(#ws)'));

  (function () {
    const reel = (x) => {
      let teeth = '';
      for (let i = 0; i < 6; i++) teeth += `<rect x="-2" y="-12" width="4" height="6" rx="1" fill="#5A4640" transform="translate(${x} 80) rotate(${i * 60})"/>`;
      return `<circle cx="${x}" cy="80" r="15" fill="#F6EFE6" stroke="#5A4640" stroke-width="1.5"/>${teeth}<circle cx="${x}" cy="80" r="4" fill="#5A4640"/>`;
    };
    add('cassette', 'Mixtape', 'vintage', 300, 190, svg(300, 190,
      `<rect x="6" y="6" width="288" height="178" rx="14" fill="#EBDCCB" stroke="#8B6B57" stroke-width="2.5"/>` +
      [[18, 18], [282, 18], [18, 172], [282, 172]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#CDB8A2" stroke="#8B6B57"/>`).join('') +
      `<rect x="26" y="20" width="248" height="106" rx="8" fill="#FFF8EE" stroke="#8B6B57" stroke-width="1.5"/>` +
      `<path d="M26 28a8 8 0 0 1 8-8h232a8 8 0 0 1 8 8v14H26Z" fill="#E7A3B0"/>` +
      `<text x="40" y="37" ${SERIF} font-style="italic" font-size="14" fill="#fff">side A · mixtape ♡</text>` +
      `<rect x="78" y="58" width="144" height="44" rx="22" fill="#5A4640"/>` +
      `<rect x="122" y="70" width="56" height="20" fill="#3A2C2A"/><path d="M122 80H178" stroke="#8B6B57" stroke-width="3"/>` +
      reel(108) + reel(192) +
      `<rect x="26" y="108" width="248" height="10" fill="${C.sage}" opacity=".7"/>` +
      `<path d="M68 184L84 142H216L232 184" fill="#DCCAB6" stroke="#8B6B57" stroke-width="2"/>` +
      `<circle cx="112" cy="166" r="6" fill="#5A4640"/><circle cx="188" cy="166" r="6" fill="#5A4640"/><rect x="140" y="160" width="20" height="12" rx="2" fill="#5A4640"/>`));
  })();

  add('player', 'Now playing', 'vintage', 320, 176, svg(320, 176,
    `<rect x="4" y="7" width="312" height="166" rx="22" fill="rgba(110,70,60,.12)"/>` +
    `<rect x="4" y="4" width="312" height="166" rx="22" fill="#FFFBF6" stroke="#EADBCB" stroke-width="1.5"/>` +
    `<rect x="20" y="20" width="72" height="72" rx="12" fill="url(#ag)"/>` +
    `<path d="${heartP(56, 57, 0.1)}" fill="#fff" opacity=".85"/>` +
    `<text x="108" y="46" ${SERIF} font-style="italic" font-size="20" fill="#3A2C2A">dreamy afternoon</text>` +
    `<text x="108" y="68" ${SANS} font-size="12" letter-spacing=".5" fill="#9C8579">coquette radio</text>` +
    `<path d="${heartP(290, 44, 0.065)}" fill="${C.rose}"/>` +
    `<rect x="20" y="110" width="280" height="4" rx="2" fill="#EADBCB"/><rect x="20" y="110" width="120" height="4" rx="2" fill="#C77D8A"/>` +
    `<circle cx="140" cy="112" r="6.5" fill="#C77D8A" stroke="#fff" stroke-width="2"/>` +
    `<text x="20" y="132" ${SANS} font-size="10" fill="#9C8579">1:24</text><text x="300" y="132" ${SANS} font-size="10" fill="#9C8579" text-anchor="end">-2:06</text>` +
    `<g fill="#3A2C2A"><path d="M120 142v16l-12-8z"/><rect x="104" y="142" width="3" height="16" rx="1"/><path d="M200 142v16l12-8z"/><rect x="213" y="142" width="3" height="16" rx="1"/></g>` +
    `<circle cx="160" cy="150" r="15" fill="#3A2C2A"/><rect x="154" y="143" width="4" height="14" rx="1" fill="#fff"/><rect x="162" y="143" width="4" height="14" rx="1" fill="#fff"/>` +
    `<g fill="none" stroke="#9C8579" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M36 144h6l12 12h6M36 156h6l12-12h6M58 141l3 3-3 3M58 153l3 3-3 3"/><path d="M262 146h16a4 4 0 0 1 4 4M286 154h-16a4 4 0 0 1-4-4M275 142l3 4-3 4M273 150l-3 4 3 4"/></g>`,
    `<linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4C7CF"/><stop offset="1" stop-color="#C9A27A"/></linearGradient>`));

  add('ticket', 'Admit one', 'vintage', 300, 130, svg(300, 130,
    `<g mask="url(#tm)"><rect x="4" y="8" width="292" height="114" rx="8" fill="#F1D4C4"/></g>` +
    `<rect x="16" y="20" width="268" height="90" rx="4" fill="none" stroke="#A94F63" stroke-width="1.2" stroke-dasharray="4 3"/>` +
    `<path d="M222 14V116" stroke="#A94F63" stroke-width="1.5" stroke-dasharray="2 4"/>` +
    `<text x="118" y="64" ${SERIF} font-size="24" letter-spacing="4" fill="#6E2A3A" text-anchor="middle">ADMIT ONE</text>` +
    `<text x="118" y="88" ${SERIF} font-style="italic" font-size="13" fill="#8B4A57" text-anchor="middle">le petit cinéma · row 7</text>` +
    `<text x="0" y="0" ${SANS} font-size="11" letter-spacing="2" fill="#6E2A3A" text-anchor="middle" transform="translate(258 65) rotate(-90)">No 001247</text>`,
    `<mask id="tm"><rect width="300" height="130" fill="#fff"/><circle cx="4" cy="65" r="14" fill="#000"/><circle cx="296" cy="65" r="14" fill="#000"/></mask>`));

  add('envelope', 'Love letter', 'vintage', 240, 170, svg(240, 170,
    `<rect x="10" y="18" width="224" height="148" rx="6" fill="rgba(70,45,30,.12)"/>` +
    `<rect x="8" y="14" width="224" height="148" rx="6" fill="#F7EEDC" stroke="#C9B396" stroke-width="1.5"/>` +
    `<path d="M8 162L96 92M232 162L144 92" stroke="#E1D2BC" stroke-width="1.2"/>` +
    `<path d="M10 18L120 100L230 18" fill="#F2E6D0" stroke="#C9B396" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="${blobP(120, 100, 22, 2.5, 14, 4)}" fill="#A8273C"/>` +
    `<circle cx="120" cy="100" r="15" fill="#B8314A" stroke="#7E1A2B" stroke-width="1.5"/>` +
    `<path d="${heartP(120, 101, 0.07)}" fill="#7E1A2B"/>`));

  add('wax-seal', 'Wax seal', 'vintage', 140, 140, svg(140, 140,
    `<path d="${blobP(70, 70, 58, 6, 18, 8)}" fill="url(#wx)"/>` +
    `<circle cx="70" cy="70" r="42" fill="none" stroke="#7E1A2B" stroke-width="3"/>` +
    `<circle cx="70" cy="70" r="36" fill="none" stroke="#C8475E" stroke-width="1" opacity=".6"/>` +
    `<path d="${heartP(70, 72, 0.17)}" fill="#7E1A2B"/>` +
    `<path d="M34 46C42 34 56 26 72 26" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    `<radialGradient id="wx" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#D14A62"/><stop offset="1" stop-color="#8E1F35"/></radialGradient>`));

  add('label', 'Souvenir label', 'vintage', 260, 150, svg(260, 150,
    `<ellipse cx="130" cy="75" rx="124" ry="68" fill="#F7EEDC" stroke="${C.goldD}" stroke-width="2"/>` +
    `<ellipse cx="130" cy="75" rx="113" ry="57" fill="none" stroke="${C.goldD}" stroke-width="1" stroke-dasharray="2 4"/>` +
    `<text x="130" y="80" ${SERIF} font-style="italic" font-size="36" fill="${C.wine}" text-anchor="middle">souvenir</text>` +
    `<text x="130" y="106" ${SERIF} font-size="10.5" letter-spacing="4" fill="${C.mocha}" text-anchor="middle">DE PARIS · 1962</text>` +
    `<text x="130" y="44" ${SERIF} font-size="12" fill="${C.goldD}" text-anchor="middle">✦</text>`));

  /* =====================================================================
     FRAMES — artwork with transparent cut-outs + hole paths
     ===================================================================== */
  const FR = [];
  const frame = (id, name, w, h, holes, body, defs = '', opts = {}) => FR.push({ id, name, w, h, holes, svg: svg(w, h, body, defs), ...opts });
  const cut = (outer, holes, fill, extra = '') => `<path d="${outer} ${holes.join(' ')}" fill="${fill}" fill-rule="evenodd" ${extra}/>`;

  /* Polaroids */
  (function () {
    const hole = rectP(20, 20, 260, 260);
    frame('polaroid', 'Polaroid', 300, 360, [hole],
      cut(rectP(0, 0, 300, 360, 3), [hole], '#FFFDF9') + `<path d="${hole}" fill="none" stroke="rgba(0,0,0,.10)" stroke-width="2"/>`, '', { shadow: true });
    frame('polaroid-blush', 'Blush polaroid', 300, 360, [hole],
      cut(rectP(0, 0, 300, 360, 3), [hole], '#F9DDE1') + `<path d="${hole}" fill="none" stroke="rgba(120,40,60,.12)" stroke-width="2"/>` +
      `<path d="${heartP(264, 326, 0.07)}" fill="${C.deep}"/><path d="${heartP(244, 334, 0.04)}" fill="${C.rose}"/>`, '', { shadow: true });
  })();

  /* Gilded vintage frame */
  (function () {
    const hole = rectP(52, 52, 216, 296);
    const orn = `<g fill="${C.goldL}" stroke="${C.goldD}" stroke-width="1.2"><circle cx="20" cy="20" r="8"/><path d="M28 15C42 8 56 14 62 26C52 19 40 19 31 24Z"/><path d="M15 28C8 42 14 56 26 62C19 52 19 40 24 31Z"/><circle cx="20" cy="20" r="3" fill="${C.goldD}"/></g>`;
    const corners = [`translate(0 0)`, `translate(320 0) scale(-1 1)`, `translate(0 400) scale(1 -1)`, `translate(320 400) scale(-1 -1)`]
      .map(t => `<g transform="${t}">${orn}</g>`).join('');
    const shell = `<g fill="${C.goldL}" stroke="${C.goldD}" stroke-width="1.2"><path d="M-16 0C-14-12 14-12 16 0C10-4-10-4-16 0Z"/><circle cx="0" cy="-4" r="3"/></g>`;
    frame('gilded', 'Gilded vintage', 320, 400, [hole],
      cut(rectP(0, 0, 320, 400, 6), [hole], 'url(#gold)') +
      `<rect x="9" y="9" width="302" height="382" rx="3" fill="none" stroke="${C.goldD}" stroke-width="2"/>` +
      `<rect x="22" y="22" width="276" height="356" fill="none" stroke="url(#gold2)" stroke-width="9"/>` +
      `<rect x="36" y="36" width="248" height="328" fill="none" stroke="${C.goldD}" stroke-width="1.5"/>` +
      `<rect x="45" y="45" width="230" height="310" fill="none" stroke="${C.goldL}" stroke-width="4"/>` +
      `<path d="${hole}" fill="none" stroke="#5E4520" stroke-width="3"/>` + corners +
      `<g transform="translate(160 26)">${shell}</g><g transform="translate(160 374) scale(1 -1)">${shell}</g>`,
      goldDefs('gold') + `<linearGradient id="gold2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.goldD}"/><stop offset=".5" stop-color="${C.goldL}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`,
      { shadow: true });
  })();

  /* Oval cameo with pearls */
  (function () {
    const hole = ellipseP(150, 190, 104, 138);
    let pearls = '';
    ringPts(150, 190, 125, 161, 40).forEach(([x, y]) => pearls += pearl(x, y, 7.5));
    const bow = bowAt('cbw', 150, 22, 0.42, ...BOW_PINK);
    frame('cameo', 'Pearl cameo', 300, 380, [hole],
      cut(ellipseP(150, 190, 146, 184), [hole], 'url(#gold)') +
      `<ellipse cx="150" cy="190" rx="140" ry="178" fill="none" stroke="${C.goldD}" stroke-width="1.5"/>` + pearls +
      `<ellipse cx="150" cy="190" rx="109" ry="143" fill="none" stroke="${C.goldD}" stroke-width="2.5"/>` +
      `<path d="${hole}" fill="none" stroke="#5E4520" stroke-width="2"/>` + bow.body,
      goldDefs('gold') + pearlDefs() + bow.defs, { shadow: true });
  })();

  /* Film strips */
  (function () {
    const holes = [30, 262, 494].map(y => rectP(30, y, 180, 200, 3));
    let sprockets = [];
    for (let y = 6; y < 714; y += 24) { sprockets.push(rectP(9, y, 12, 14, 3)); sprockets.push(rectP(219, y, 12, 14, 3)); }
    const txt = (y, label) => `<text x="120" y="${y}" font-family="'Courier New', monospace" font-size="10" letter-spacing="1.5" fill="#E0A458" text-anchor="middle">${label}</text>`;
    frame('film', 'Film strip', 240, 724, holes,
      cut(rectP(0, 0, 240, 724), [...holes, ...sprockets], '#1F1A18') +
      txt(250, '▸ 14   400 SAFETY FILM   14A') + txt(482, '▸ 15   400 SAFETY FILM   15A') + txt(716, '▸ 16'));
  })();
  (function () {
    const hole = rectP(20, 56, 380, 188, 4);
    let sprockets = [];
    for (let x = 8; x < 410; x += 28) { sprockets.push(rectP(x, 8, 14, 18, 3)); sprockets.push(rectP(x, 274, 14, 18, 3)); }
    const t = `font-family="'Courier New', monospace" font-size="11" letter-spacing="2" fill="#E0A458"`;
    frame('film-35', '35mm frame', 420, 300, [hole],
      cut(rectP(0, 0, 420, 300), [hole, ...sprockets], '#1F1A18') +
      `<text x="22" y="46" ${t}>▸ 22</text><text x="210" y="46" ${t} text-anchor="middle">SAFETY FILM 400</text><text x="398" y="46" ${t} text-anchor="end">22A ◂</text>` +
      `<text x="210" y="264" ${t} text-anchor="middle">✦ ✦ ✦</text>`);
  })();

  /* Floral oval */
  (function () {
    const cx = 170, cy = 210, hole = ellipseP(cx, cy, 112, 150);
    const pos = (deg, rx = 130, ry = 168) => { const a = deg * Math.PI / 180; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; };
    let deco = '';
    [176, 190, 204, 218, 232, 246, 260, 274, -4, 10, 24, 38, 52, 66, 80, 94].forEach((d, i) => {
      const [x, y] = pos(d, 134, 172); deco += at(x, y, 0.72, d + (i % 2 ? 62 : -62), leaf());
    });
    [[120], [150], [300], [330]].forEach(([d]) => { const [x, y] = pos(d); deco += at(x, y, 0.7, d, blossom()); });
    [[200, 0.4, ROSE_BLUSH], [228, 0.5, null], [254, 0.36, ROSE_CREAM], [20, 0.5, null], [46, 0.4, ROSE_CREAM], [72, 0.36, ROSE_BLUSH]].forEach(([d, s, col]) => {
      const [x, y] = pos(d); deco += at(x, y, s, d, col ? rose(...col) : rose());
    });
    frame('floral-oval', 'Floral oval', 340, 420, [hole],
      cut(ellipseP(cx, cy, 128, 166), [hole], C.cream, `stroke="${C.gold}" stroke-width="2"`) +
      `<path d="${hole}" fill="none" stroke="${C.gold}" stroke-width="2"/>` + deco);
  })();

  /* Bow oval with scallops */
  (function () {
    const cx = 160, cy = 220, hole = ellipseP(cx, cy, 108, 146);
    const bow = bowAt('bo', 160, 54, 0.78, ...BOW_PINK);
    frame('bow-oval', 'Bow oval', 320, 410, [hole],
      cut(scallopP(ringPts(cx, cy, 134, 172, 44)), [hole], '#FFF6F1', `stroke="#E3A7B4" stroke-width="2"`) +
      `<ellipse cx="${cx}" cy="${cy}" rx="121" ry="159" fill="none" stroke="${C.rose}" stroke-width="1.6" stroke-dasharray="5 5"/>` +
      `<path d="${hole}" fill="none" stroke="#E3A7B4" stroke-width="2.5"/>` + bow.body, bow.defs, { shadow: true });
  })();

  /* Arched window */
  (function () {
    const hole = 'M44 344 V152 A106 106 0 0 1 256 152 V344 Z';
    let base = '';
    for (let x = 30; x <= 270; x += 40) base += at(x, 350, 0.62, -90 + (x % 80 ? 30 : -30), leaf());
    [40, 96, 150, 204, 260].forEach((x, i) => base += at(x, 352, 0.9, i * 20, blossom(i % 2 ? C.blush : '#FFFFFF', C.butter, i % 2 ? C.rose : '#E6D6C6')));
    frame('arch', 'Arched window', 300, 400, [hole],
      cut('M10 392 V152 A140 140 0 0 1 290 152 V392 Z', [hole], '#F4EBDD', `stroke="${C.mocha}" stroke-width="2"`) +
      `<path d="M26 384 V152 A124 124 0 0 1 274 152 V384" fill="none" stroke="${C.gold}" stroke-width="1.4"/>` +
      `<path d="${hole}" fill="none" stroke="${C.mocha}" stroke-width="2.5"/>` +
      `<rect x="10" y="352" width="280" height="40" fill="#E8DCCB" stroke="${C.mocha}" stroke-width="2"/>` + base, '', { shadow: true });
  })();

  /* Heart */
  (function () {
    const hole = heartP(170, 166, 1.0);
    const bow = bowAt('hb', 170, 96, 0.32, ...BOW_PINK);
    frame('heart', 'Lace heart', 340, 320, [hole],
      cut(heartP(170, 166, 1.18), [hole], '#F7D6DB', `stroke="${C.rose}" stroke-width="2"`) +
      `<path d="${heartP(170, 166, 1.09)}" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="6 5"/>` +
      `<path d="${hole}" fill="none" stroke="${C.rose}" stroke-width="2"/>` + bow.body, bow.defs, { shadow: true });
  })();

  /* Scalloped gingham square */
  (function () {
    const hole = rectP(56, 56, 228, 228, 4);
    frame('gingham', 'Gingham scallop', 340, 340, [hole],
      cut(scallopP(rectPts(14, 14, 312, 312, 19.5)), [hole], 'url(#gh)', `stroke="${C.rose}" stroke-width="2"`) +
      `<rect x="42" y="42" width="256" height="256" rx="8" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 5"/>` +
      `<path d="${hole}" fill="none" stroke="#fff" stroke-width="6"/>`,
      `<pattern id="gh" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#FFF7F4"/><rect width="10" height="20" fill="#F4B9C4" opacity=".5"/><rect width="20" height="10" fill="#F4B9C4" opacity=".5"/></pattern>`,
      { shadow: true });
  })();

  /* Postage stamp */
  (function () {
    const hole = rectP(32, 32, 236, 236);
    frame('stamp', 'Postage stamp', 300, 360, [hole],
      `<g mask="url(#fm)">${cut(rectP(0, 0, 300, 360), [hole], '#F8EFE2')}</g>` +
      `<rect x="22" y="22" width="256" height="316" fill="none" stroke="${C.deep}" stroke-width="1.5"/>` +
      `<path d="${hole}" fill="none" stroke="${C.deep}" stroke-width="1.5"/>` +
      `<text x="36" y="314" ${SERIF} font-size="30" letter-spacing="6" fill="${C.deep}">LOVE</text>` +
      `<text x="264" y="314" ${SERIF} font-size="22" fill="${C.deep}" text-anchor="end">50c</text>` +
      `<text x="150" y="332" ${SERIF} font-size="9" letter-spacing="3" fill="${C.deep}" text-anchor="middle">LETTRE · POSTE AÉRIENNE</text>`,
      perfMask('fm', 300, 360, 7, 18), { shadow: true });
  })();

  /* Torn paper */
  (function () {
    const hole = rectP(38, 38, 264, 296);
    const outer = tornP(8, 8, 324, 394, 4.5, 21, 8);
    frame('torn', 'Torn paper', 340, 410, [hole],
      cut(outer, [hole], '#F7EFE1', `stroke="#E2D3BC" stroke-width="1"`) +
      `<g transform="rotate(-6 170 24)"><rect x="118" y="6" width="104" height="32" fill="#F2C4C8" opacity=".78"/></g>` +
      `<path d="M60 372 H280" stroke="#D9C9B1" stroke-width="1.2" stroke-dasharray="3 4"/>`, '', { shadow: true });
  })();

  /* Photo corners (whole area is the window) */
  (function () {
    const hole = rectP(0, 0, 320, 400);
    const corner = `<path d="M0 0H62L0 62Z" fill="#2E2523"/><path d="M8 8H46" stroke="rgba(255,255,255,.25)" stroke-width="2" stroke-linecap="round"/>`;
    frame('corners', 'Photo corners', 320, 400, [hole],
      [`translate(0 0)`, `translate(320 0) scale(-1 1)`, `translate(0 400) scale(1 -1)`, `translate(320 400) scale(-1 -1)`].map(t => `<g transform="${t}">${corner}</g>`).join(''));
  })();

  /* Lace doily round */
  (function () {
    const hole = circleP(170, 170, 112);
    let holes = [];
    ringPts(170, 170, 146, 146, 36).forEach(([x, y]) => holes.push(circleP(x, y, 4)));
    ringPts(170, 170, 130, 130, 18, -Math.PI / 2 + Math.PI / 18).forEach(([x, y]) => holes.push(circleP(x, y, 5.5)));
    frame('doily', 'Lace doily', 340, 340, [hole],
      cut(scallopP(ringPts(170, 170, 162, 162, 36)), [hole, ...holes], C.ivory, `stroke="#E2D4C1" stroke-width="1.2"`) +
      `<circle cx="170" cy="170" r="119" fill="none" stroke="#E6D9C6" stroke-width="1.2" stroke-dasharray="3 3"/>` +
      `<circle cx="170" cy="170" r="155" fill="none" stroke="#EADFCF" stroke-width="1" stroke-dasharray="2 4"/>` +
      `<path d="${hole}" fill="none" stroke="#E2D4C1" stroke-width="2"/>`, '', { shadow: true });
  })();

  /* Photo-booth strip */
  (function () {
    const holes = [20, 180, 340, 500].map(y => rectP(20, y, 180, 148));
    frame('booth', 'Photo booth', 220, 700, holes,
      cut(rectP(0, 0, 220, 700, 3), holes, '#FFFDF8') + holes.map(h => `<path d="${h}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2"/>`).join('') +
      `<text x="110" y="680" ${SERIF} font-style="italic" font-size="22" fill="${C.deep}" text-anchor="middle">♡ xoxo ♡</text>`, '', { shadow: true });
  })();

  /* Now playing card */
  (function () {
    const hole = rectP(22, 22, 256, 256, 14);
    frame('nowplaying', 'Now playing', 300, 430, [hole],
      cut(rectP(0, 0, 300, 430, 22), [hole], '#FFFBF6', `stroke="#EADBCB" stroke-width="1.5"`) +
      `<text x="22" y="312" ${SERIF} font-style="italic" font-size="21" fill="#3A2C2A">summer of us</text>` +
      `<text x="22" y="334" ${SANS} font-size="12" letter-spacing=".6" fill="#9C8579">now playing ♡</text>` +
      `<path d="${heartP(270, 308, 0.075)}" fill="none" stroke="${C.rose}" stroke-width="2"/>` +
      `<rect x="22" y="354" width="256" height="4" rx="2" fill="#EADBCB"/><rect x="22" y="354" width="104" height="4" rx="2" fill="#C77D8A"/>` +
      `<circle cx="126" cy="356" r="6" fill="#C77D8A" stroke="#fff" stroke-width="2"/>` +
      `<text x="22" y="376" ${SANS} font-size="10" fill="#9C8579">1:42</text><text x="278" y="376" ${SANS} font-size="10" fill="#9C8579" text-anchor="end">-2:18</text>` +
      `<g fill="#3A2C2A"><path d="M112 396v16l-12-8z"/><rect x="96" y="396" width="3" height="16" rx="1"/><path d="M188 396v16l12-8z"/><rect x="201" y="396" width="3" height="16" rx="1"/></g>` +
      `<circle cx="150" cy="404" r="16" fill="#3A2C2A"/><rect x="144" y="397" width="4" height="14" rx="1" fill="#fff"/><rect x="152" y="397" width="4" height="14" rx="1" fill="#fff"/>`,
      '', { shadow: true });
  })();

  /* =====================================================================
     TEXT
     ===================================================================== */
  const FONTS = [
    { group: 'Script & calligraphy', fonts: ['Great Vibes', 'Pinyon Script', 'Parisienne', 'Allura', 'Dancing Script'] },
    { group: 'Handwritten', fonts: ['Homemade Apple', 'Caveat'] },
    { group: 'Typewriter', fonts: ['Special Elite', 'Courier Prime'] },
    { group: 'Vintage serif', fonts: ['Playfair Display', 'Cormorant Garamond', 'Libre Baskerville', 'IM Fell English'] },
    { group: 'Clean', fonts: ['Jost'] }
  ];

  const TEXT_PRESETS = [
    { label: 'Script heading', text: 'my little world', font: 'Great Vibes', size: 100, fill: '#6E2A3A' },
    { label: 'Typewriter note', text: 'dear diary, today was lovely', font: 'Special Elite', size: 38, fill: '#3A2C2A' },
    { label: 'Vintage serif', text: 'GOLDEN HOUR', font: 'Playfair Display', size: 66, fill: '#9A773A', charSpacing: 300 },
    { label: 'Handwritten', text: 'stay soft ♡', font: 'Caveat', size: 70, fill: '#A94F63' },
    { label: 'Elegant italic', text: 'a love letter to summer', font: 'Cormorant Garamond', size: 58, fill: '#4B3B36', italic: true },
    { label: 'Storybook', text: 'Once upon a time', font: 'IM Fell English', size: 60, fill: '#5B3A2E', italic: true }
  ];

  const QUOTES = [
    { text: 'romanticize your life', font: 'Pinyon Script', size: 78, fill: '#8B4A57' },
    { text: 'la vie en rose', font: 'Great Vibes', size: 92, fill: '#B0566B', shadow: { color: 'rgba(255,255,255,0.85)', blur: 14, offsetX: 0, offsetY: 0 } },
    { text: 'softly, slowly', font: 'Cormorant Garamond', size: 66, italic: true, fill: '#6E2A3A' },
    { text: '  made with love  ', font: 'Special Elite', size: 36, fill: '#3A2C2A', bg: '#F7EEDC' },
    { text: 'bloom where you are planted', font: 'Dancing Script', size: 56, fill: '#56663F' },
    { text: 'mon amour', font: 'Parisienne', size: 86, fill: '#A94F63' },
    { text: 'GOLDEN DAYS', font: 'Playfair Display', size: 56, fill: '#9A773A', charSpacing: 420 },
    { text: 'xoxo', font: 'Homemade Apple', size: 64, fill: '#3A2C2A' },
    { text: 'a little bit of magic', font: 'Allura', size: 78, fill: '#8C78B6' },
    { text: '  dear diary,  ', font: 'Courier Prime', size: 34, fill: '#FFFDF8', bg: '#3A2C2A' },
    { text: 'collect moments, not things', font: 'Caveat', size: 58, fill: '#8B6B57' },
    { text: "✦ c'est la vie ✦", font: 'IM Fell English', size: 56, italic: true, fill: '#4B3B36' }
  ];

  /* =====================================================================
     CANVAS BACKGROUNDS & FINISH TEXTURES
     ===================================================================== */
  const SIZES = [
    { id: 'portrait', name: 'Portrait 4:5', w: 1080, h: 1350 },
    { id: 'square', name: 'Square 1:1', w: 1080, h: 1080 },
    { id: 'story', name: 'Story 9:16', w: 1080, h: 1920 },
    { id: 'classic', name: 'Classic 3:4', w: 1080, h: 1440 },
    { id: 'landscape', name: 'Landscape 3:2', w: 1620, h: 1080 }
  ];
  const BG_COLORS = ['#FBF4EA', '#F7E3E3', '#E9EEDF', '#ECE4F2', '#E8D9C5', '#FFFFFF', '#2E2523', '#5B2333', '#3B4A3A', 'transparent'];
  const BG_TEXTURES = [
    { id: 'paper', name: 'Old paper' }, { id: 'gingham-pink', name: 'Pink gingham' }, { id: 'watercolor', name: 'Watercolor' },
    { id: 'florals', name: 'Ditsy florals' }, { id: 'kraft', name: 'Kraft' }, { id: 'lined', name: 'Diary page' },
    { id: 'dots', name: 'Polka dots' }, { id: 'gingham-sage', name: 'Sage gingham' }, { id: 'stripes', name: 'Candy stripe' },
    { id: 'linen', name: 'Linen' }, { id: 'noir', name: 'Noir film' }, { id: 'wine', name: 'Velvet wine' }
  ];

  function speckle(x, W, H, u, r, color, density, maxA) {
    const n = Math.round(W * H / density);
    for (let i = 0; i < n; i++) {
      x.fillStyle = `rgba(${color},${(r() * maxA).toFixed(3)})`;
      x.beginPath(); x.arc(r() * W, r() * H, (0.4 + r() * 1.1) * u, 0, Math.PI * 2); x.fill();
    }
  }
  function fibers(x, W, H, u, r, color, density, alpha) {
    const n = Math.round(W * H / density);
    x.lineWidth = Math.max(0.6, 0.8 * u);
    for (let i = 0; i < n; i++) {
      const px = r() * W, py = r() * H, len = (20 + r() * 50) * u, a = r() * Math.PI * 2;
      x.strokeStyle = `rgba(${color},${(r() * alpha).toFixed(3)})`;
      x.beginPath(); x.moveTo(px, py);
      x.quadraticCurveTo(px + Math.cos(a + 0.6) * len / 2, py + Math.sin(a + 0.6) * len / 2, px + Math.cos(a) * len, py + Math.sin(a) * len);
      x.stroke();
    }
  }
  function edgeShade(x, W, H, color, a) {
    const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.55);
    g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${a})`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  }
  function gingham(x, W, H, u, base, stripe) {
    x.fillStyle = base; x.fillRect(0, 0, W, H);
    const cell = 44 * u;
    x.fillStyle = stripe;
    for (let i = 0; i * cell < W; i += 2) x.fillRect(i * cell, 0, cell, H);
    for (let j = 0; j * cell < H; j += 2) x.fillRect(0, j * cell, W, cell);
  }
  function tinyFlower(x, cx, cy, s, petal, center) {
    x.fillStyle = petal;
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - Math.PI / 2; x.beginPath(); x.arc(cx + Math.cos(a) * 7 * s, cy + Math.sin(a) * 7 * s, 6 * s, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = center; x.beginPath(); x.arc(cx, cy, 3.6 * s, 0, Math.PI * 2); x.fill();
  }

  function makeBackground(key, W, H) {
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), u = W / 1080, r = rng(7);
    switch (key) {
      case 'paper': {
        const g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
        g.addColorStop(0, '#FAF3E6'); g.addColorStop(1, '#E9DAC0');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        speckle(x, W, H, u, r, '90,60,30', 700 * u * u, 0.12);
        fibers(x, W, H, u, r, '120,90,60', 9000 * u * u, 0.08);
        edgeShade(x, W, H, '130,90,50', 0.18);
        break;
      }
      case 'kraft':
        x.fillStyle = '#C49D76'; x.fillRect(0, 0, W, H);
        speckle(x, W, H, u, r, '70,45,20', 500 * u * u, 0.18);
        speckle(x, W, H, u, r, '255,240,220', 900 * u * u, 0.15);
        fibers(x, W, H, u, r, '80,50,25', 6000 * u * u, 0.12);
        break;
      case 'gingham-pink': gingham(x, W, H, u, '#FFF6F4', 'rgba(240,160,178,.36)'); speckle(x, W, H, u, r, '150,90,90', 2500 * u * u, 0.05); break;
      case 'gingham-sage': gingham(x, W, H, u, '#F7F7EF', 'rgba(150,170,120,.32)'); speckle(x, W, H, u, r, '80,90,60', 2500 * u * u, 0.05); break;
      case 'lined': {
        x.fillStyle = '#FBF7EE'; x.fillRect(0, 0, W, H);
        x.strokeStyle = 'rgba(150,180,210,.55)'; x.lineWidth = 1.6 * u;
        for (let y = 150 * u; y < H; y += 48 * u) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
        x.strokeStyle = 'rgba(225,140,150,.7)'; x.lineWidth = 2 * u;
        x.beginPath(); x.moveTo(120 * u, 0); x.lineTo(120 * u, H); x.stroke();
        speckle(x, W, H, u, r, '120,100,70', 1500 * u * u, 0.06);
        break;
      }
      case 'dots': {
        x.fillStyle = '#F6E3E3'; x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(255,255,255,.9)';
        const s = 60 * u;
        for (let j = 0, y = s / 2; y < H + s; y += s, j++) for (let px = (j % 2 ? s : s / 2); px < W + s; px += s) { x.beginPath(); x.arc(px, y, 7 * u, 0, Math.PI * 2); x.fill(); }
        break;
      }
      case 'stripes': {
        x.fillStyle = '#FCF2EC'; x.fillRect(0, 0, W, H);
        x.fillStyle = 'rgba(242,190,200,.55)';
        for (let px = 0; px < W; px += 80 * u) x.fillRect(px, 0, 40 * u, H);
        speckle(x, W, H, u, r, '150,90,90', 2500 * u * u, 0.05);
        break;
      }
      case 'linen': {
        x.fillStyle = '#EEE5D8'; x.fillRect(0, 0, W, H);
        x.lineWidth = Math.max(0.5, u);
        for (let y = 0; y < H; y += 3 * u) { x.strokeStyle = `rgba(120,95,70,${(r() * 0.07).toFixed(3)})`; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
        for (let px = 0; px < W; px += 3 * u) { x.strokeStyle = `rgba(255,255,255,${(r() * 0.12).toFixed(3)})`; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, H); x.stroke(); }
        break;
      }
      case 'watercolor': {
        x.fillStyle = '#FCF6F0'; x.fillRect(0, 0, W, H);
        const blobs = [['244,190,200', 0.55], ['250,214,190', 0.5], ['210,196,232', 0.4], ['200,214,186', 0.35], ['244,190,200', 0.4], ['250,230,190', 0.45]];
        blobs.forEach(([c, a], i) => {
          const cx = r() * W, cy = r() * H, rad = (300 + r() * 380) * u;
          const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
          g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
          x.fillStyle = g; x.fillRect(0, 0, W, H);
        });
        speckle(x, W, H, u, r, '150,110,100', 2200 * u * u, 0.05);
        break;
      }
      case 'florals': {
        x.fillStyle = '#F7F0E6'; x.fillRect(0, 0, W, H);
        const s = 120 * u, cols = [['#EDB3BF', '#F2D98B'], ['#FFFFFF', '#F2D98B'], ['#CDBDE3', '#F6EBD0'], ['#F4C9A8', '#FFF4DE']];
        for (let j = 0, y = s / 2; y < H + s; y += s * 0.86, j++) {
          for (let px = (j % 2 ? s / 2 : 0); px < W + s; px += s) {
            const jx = px + (r() - 0.5) * 40 * u, jy = y + (r() - 0.5) * 40 * u;
            x.fillStyle = 'rgba(150,165,120,.75)';
            x.save(); x.translate(jx, jy); x.rotate(r() * Math.PI * 2);
            x.beginPath(); x.ellipse(16 * u, 0, 10 * u, 4.5 * u, 0, 0, Math.PI * 2); x.fill();
            x.beginPath(); x.ellipse(-14 * u, 6 * u, 9 * u, 4 * u, 0.5, 0, Math.PI * 2); x.fill();
            x.restore();
            const [p, c] = cols[Math.floor(r() * cols.length)];
            tinyFlower(x, jx, jy, u * (0.8 + r() * 0.4), p, c);
          }
        }
        break;
      }
      case 'noir': {
        x.fillStyle = '#2A211F'; x.fillRect(0, 0, W, H);
        const g = x.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
        g.addColorStop(0, 'rgba(90,70,60,.55)'); g.addColorStop(1, 'rgba(0,0,0,.4)');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        speckle(x, W, H, u, r, '255,240,225', 900 * u * u, 0.1);
        x.lineWidth = Math.max(0.6, u);
        for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(255,240,225,${(r() * 0.07).toFixed(3)})`; const px = r() * W; x.beginPath(); x.moveTo(px, r() * H * 0.3); x.lineTo(px + (r() - 0.5) * 30 * u, H * (0.6 + r() * 0.4)); x.stroke(); }
        break;
      }
      case 'wine': {
        const g = x.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#6B2738'); g.addColorStop(1, '#3E1520');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        speckle(x, W, H, u, r, '255,220,220', 1400 * u * u, 0.06);
        edgeShade(x, W, H, '20,5,10', 0.45);
        break;
      }
      default:
        x.fillStyle = '#FBF4EA'; x.fillRect(0, 0, W, H);
    }
    return cv;
  }

  function makeNoiseTile(size = 256) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const x = cv.getContext('2d'), img = x.createImageData(size, size), r = rng(99);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 150;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return cv;
  }

  /* a soft generated "photo" for filter previews when nothing is selected */
  function sampleImage(size = 160) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const x = cv.getContext('2d'), s = size / 160;
    const sky = x.createLinearGradient(0, 0, 0, size);
    sky.addColorStop(0, '#9FBFD8'); sky.addColorStop(0.5, '#F6C3A8'); sky.addColorStop(0.75, '#FBE3C2');
    x.fillStyle = sky; x.fillRect(0, 0, size, size);
    x.fillStyle = '#FFEFC9'; x.beginPath(); x.arc(110 * s, 78 * s, 16 * s, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#9DAA80'; x.beginPath(); x.moveTo(0, 110 * s); x.quadraticCurveTo(60 * s, 80 * s, 160 * s, 112 * s); x.lineTo(160 * s, 160 * s); x.lineTo(0, 160 * s); x.fill();
    x.fillStyle = '#7A8B5E'; x.beginPath(); x.moveTo(0, 132 * s); x.quadraticCurveTo(90 * s, 110 * s, 160 * s, 136 * s); x.lineTo(160 * s, 160 * s); x.lineTo(0, 160 * s); x.fill();
    const r = rng(5);
    for (let i = 0; i < 26; i++) { x.fillStyle = ['#F4C7CF', '#FFFFFF', '#F2D98B'][i % 3]; x.beginPath(); x.arc(r() * size, (128 + r() * 32) * s, (1.6 + r() * 1.8) * s, 0, Math.PI * 2); x.fill(); }
    return cv;
  }

  window.ASSETS = {
    STICKERS: S, FRAMES: FR, FONTS, TEXT_PRESETS, QUOTES, SIZES, BG_COLORS, BG_TEXTURES,
    makeBackground, makeNoiseTile, sampleImage, svgUrl,
    // drawing toolkit shared with assets-extra.js
    _h: {
      C, f, svg, at, rng, circleP, ellipseP, rectP, heartP, scallopP, ringPts, rectPts, tornP, blobP, quad, quadAngle,
      leaf, rose, blossom, bowParts, bowAt, pearl, pearlDefs, goldDefs, sparkleD, perfMask, speckle, fibers, edgeShade,
      SERIF, SANS, ROSE_CREAM, ROSE_RED, ROSE_BLUSH, BOW_PINK, BOW_CREAM
    }
  };
})();
