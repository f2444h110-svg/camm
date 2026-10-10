/* Petal & Paper — mega asset pack.
   Most items here are generated from small "families" (colourways, patterns, shapes) so the library is
   large but visually consistent. Everything is drawn in code — no external images. */
(function () {
  'use strict';
  const A = window.ASSETS, H = A._h;
  const { f, svg, at, rng, circleP, ellipseP, rectP, heartP, scallopP, ringPts, rectPts, tornP, blobP,
    leaf, rose, blossom, bowParts, bowAt, pearl, pearlDefs, goldDefs, sparkleD, SERIF, SANS } = H;
  const ROUND = `font-family="'Arial Rounded MT Bold','Arial Black',Arial,sans-serif"`;
  const HAND = `font-family="'Comic Sans MS','Chalkboard SE','Marker Felt',cursive"`;
  const MONO = `font-family="'Courier New',Courier,monospace"`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), t = k < 0 ? 0 : 255, a = Math.abs(k);
    return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v + (t - v) * a).toString(16).padStart(2, '0')).join('');
  }
  const starP = (cx, cy, R, r, n = 5, rot = -90) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R; pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`); }
    return 'M' + pts.join(' L') + ' Z';
  };
  const polyP = (cx, cy, r, n, rot = -90) => 'M' + Array.from({ length: n }, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return `${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`; }).join(' L') + ' Z';
  const lin = (id, a, b, v = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;

  const PAL = [
    { id: 'blush', name: 'Blush', hex: '#F4B6C2' }, { id: 'rose', name: 'Rose', hex: '#E8758F' }, { id: 'red', name: 'Red', hex: '#D8344F' },
    { id: 'peach', name: 'Peach', hex: '#F8B98F' }, { id: 'butter', name: 'Butter', hex: '#F5D76E' }, { id: 'mint', name: 'Mint', hex: '#9ED9C0' },
    { id: 'sage', name: 'Sage', hex: '#A9B68E' }, { id: 'sky', name: 'Sky', hex: '#9CC9F0' }, { id: 'navy', name: 'Navy', hex: '#2F4A73' },
    { id: 'lilac', name: 'Lilac', hex: '#BBA4E0' }, { id: 'black', name: 'Black', hex: '#2A2326' }, { id: 'white', name: 'Ivory', hex: '#FFFDF8' },
    { id: 'gold', name: 'Gold', hex: '#D4AF5A' }, { id: 'brown', name: 'Mocha', hex: '#9A6B4F' }
  ];
  const P = id => PAL.find(p => p.id === id).hex;

  /* pattern fills used by tapes, hearts and frames */
  function pat(id, kind, base, accent, s = 16) {
    const h = s / 2;
    const inner = {
      gingham: `<rect width="${s}" height="${s}" fill="${base}"/><rect width="${h}" height="${s}" fill="${accent}" opacity=".45"/><rect width="${s}" height="${h}" fill="${accent}" opacity=".45"/>`,
      dots: `<rect width="${s}" height="${s}" fill="${base}"/><circle cx="${s * 0.25}" cy="${s * 0.25}" r="${s * 0.13}" fill="${accent}"/><circle cx="${s * 0.75}" cy="${s * 0.75}" r="${s * 0.13}" fill="${accent}"/>`,
      stripes: `<rect width="${s}" height="${s}" fill="${base}"/><rect width="${h * 0.8}" height="${s}" fill="${accent}" opacity=".8"/>`,
      checker: `<rect width="${s}" height="${s}" fill="${base}"/><rect width="${h}" height="${h}" fill="${accent}"/><rect x="${h}" y="${h}" width="${h}" height="${h}" fill="${accent}"/>`,
      hearts: `<rect width="${s}" height="${s}" fill="${base}"/><path d="M${h} ${s * 0.78}C${s * 0.12} ${s * 0.5} ${s * 0.12} ${s * 0.2} ${s * 0.36} ${s * 0.2}C${s * 0.44} ${s * 0.2} ${h} ${s * 0.28} ${h} ${s * 0.34}C${h} ${s * 0.28} ${s * 0.56} ${s * 0.2} ${s * 0.64} ${s * 0.2}C${s * 0.88} ${s * 0.2} ${s * 0.88} ${s * 0.5} ${h} ${s * 0.78}Z" fill="${accent}"/>`,
      stars: `<rect width="${s}" height="${s}" fill="${base}"/><path d="M${h} ${s * 0.15}L${s * 0.58} ${s * 0.42}L${s * 0.85} ${h}L${s * 0.58} ${s * 0.58}L${h} ${s * 0.85}L${s * 0.42} ${s * 0.58}L${s * 0.15} ${h}L${s * 0.42} ${s * 0.42}Z" fill="${accent}"/>`,
      plaid: `<rect width="${s}" height="${s}" fill="${base}"/><rect y="${s * 0.35}" width="${s}" height="${s * 0.3}" fill="${accent}" opacity=".5"/><rect x="${s * 0.35}" width="${s * 0.3}" height="${s}" fill="${accent}" opacity=".5"/><rect y="${s * 0.48}" width="${s}" height="${s * 0.04}" fill="#fff" opacity=".7"/>`,
      solid: `<rect width="${s}" height="${s}" fill="${base}"/><rect y="${s * 0.45}" width="${s}" height="${s * 0.06}" fill="${accent}" opacity=".35"/>`
    }[kind];
    const tr = kind === 'stripes' ? ' patternTransform="rotate(45)"' : '';
    return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"${tr}>${inner}</pattern>`;
  }

  /* =====================================================================
     STICKERS
     ===================================================================== */
  const add = (id, name, cat, w, h, s) => A.STICKERS.push({ id, name, cat, w, h, svg: s });

  /* ---- colourway families (coquette) ---- */
  PAL.forEach(p => {
    const b = bowParts('b', shade(p.hex, 0.35), p.hex, shade(p.hex, -0.38));
    add('m-bow-' + p.id, p.name + ' bow', 'coquette', 220, 200, svg(220, 200, b.body, b.defs));
  });
  PAL.forEach(p => {
    add('m-heart-' + p.id, p.name + ' heart', 'coquette', 200, 180, svg(200, 180,
      `<path d="${heartP(100, 92, 0.6)}" fill="url(#hg)" stroke="${shade(p.hex, -0.35)}" stroke-width="2.5"/>` +
      `<path d="M48 64C52 48 66 40 80 44" stroke="#fff" stroke-opacity=".7" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="46" cy="80" r="3.5" fill="#fff" opacity=".7"/>`,
      lin('hg', shade(p.hex, 0.35), shade(p.hex, -0.12))));
  });
  [['gingham', 'blush', 'Gingham'], ['dots', 'red', 'Polka'], ['stripes', 'sky', 'Striped'], ['checker', 'lilac', 'Checker'], ['hearts', 'rose', 'Lovey'], ['plaid', 'sage', 'Plaid']].forEach(([k, c, n]) => {
    add('m-pheart-' + k, n + ' heart', 'coquette', 200, 180, svg(200, 180,
      `<path d="${heartP(100, 92, 0.6)}" fill="url(#pp)" stroke="${shade(P(c), -0.35)}" stroke-width="3"/>`, pat('pp', k, '#FFFDF8', P(c), 18)));
  });
  ['rose', 'lilac', 'gold', 'sky'].forEach(c => {
    const r = rng(c.length * 7);
    let g = '';
    for (let i = 0; i < 70; i++) g += `<circle cx="${f(30 + r() * 140)}" cy="${f(30 + r() * 130)}" r="${f(0.8 + r() * 2.2)}" fill="#fff" opacity="${f(0.4 + r() * 0.6)}"/>`;
    add('m-glitter-' + c, 'Glitter heart', 'coquette', 200, 180, svg(200, 180,
      `<path d="${heartP(100, 92, 0.6)}" fill="url(#gg)" stroke="${shade(P(c), -0.3)}" stroke-width="2"/><g clip-path="url(#gc)">${g}</g>`,
      lin('gg', shade(P(c), 0.25), shade(P(c), -0.2)) + `<clipPath id="gc"><path d="${heartP(100, 92, 0.6)}"/></clipPath>`));
  });
  ['rose', 'black', 'red', 'lilac', 'gold', 'white'].forEach(c => {
    add('m-oheart-' + c, 'Outline heart', 'doodles', 180, 170, svg(180, 170,
      `<path d="${heartP(90, 88, 0.55)}" fill="none" stroke="${c === 'white' ? '#fff' : P(c)}" stroke-width="7" stroke-linejoin="round"/>`));
  });
  function butterflySvg(c1, c2, dark) {
    const st = `stroke="${dark}" stroke-width="2" stroke-linejoin="round"`;
    return svg(220, 180,
      `<path d="M108 70C100 50 92 40 82 34M112 70C120 50 128 40 138 34" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/><circle cx="82" cy="34" r="3" fill="${dark}"/><circle cx="138" cy="34" r="3" fill="${dark}"/>` +
      `<path d="M106 96C70 98 40 118 46 146C54 170 90 152 106 108ZM114 96C150 98 180 118 174 146C166 170 130 152 114 108ZM106 88C80 30 30 12 18 42C8 68 40 98 104 98ZM114 88C140 30 190 12 202 42C212 68 180 98 116 98Z" fill="url(#bw)" ${st}/>` +
      `<circle cx="44" cy="52" r="7" fill="#fff" opacity=".7"/><circle cx="176" cy="52" r="7" fill="#fff" opacity=".7"/><ellipse cx="110" cy="100" rx="6" ry="34" fill="${dark}"/>`,
      `<linearGradient id="bw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
  }
  ['peach', 'butter', 'mint', 'sage', 'navy', 'red', 'black', 'gold'].forEach(c => add('m-bfly-' + c, PAL.find(p => p.id === c).name + ' butterfly', 'coquette', 220, 180,
    butterflySvg(shade(P(c), 0.45), P(c), shade(P(c), -0.45))));
  PAL.slice(0, 10).forEach(p => add('m-star-' + p.id, p.name + ' star', 'coquette', 160, 160, svg(160, 160,
    `<path d="${starP(80, 84, 70, 30)}" fill="${p.hex}" stroke="${shade(p.hex, -0.3)}" stroke-width="5" stroke-linejoin="round"/><path d="M60 52L70 44" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`)));
  ['white', 'gold', 'rose', 'sky', 'lilac', 'mint', 'butter', 'black'].forEach(c => add('m-spark-' + c, 'Sparkle', 'coquette', 160, 160, svg(160, 160,
    at(70, 86, 1.1, 0, `<path d="${sparkleD}" fill="${P(c)}" stroke="${shade(P(c), -0.25)}" stroke-width="1.5"/>`) + at(130, 34, 0.38, 0, `<path d="${sparkleD}" fill="${P(c)}"/>`) + at(134, 128, 0.26, 0, `<path d="${sparkleD}" fill="${P(c)}"/>`))));

  /* ---- florals (colourways) ---- */
  [['blush', '#F2BCC6', '#C7788A', '#FBDDE2'], ['red', '#B8506A', '#6E2A3A', '#D06F86'], ['cream', '#F7E6D2', '#BF9873', '#FFF5EA'], ['peach', '#F8C3A0', '#C47F55', '#FFE2CC'],
    ['lilac', '#C9B5E8', '#7E66A8', '#E6DAF7'], ['butter', '#F7DC8A', '#C29A2E', '#FFF0C2'], ['white', '#FFFDF8', '#C9BBA8', '#FFFFFF'], ['coral', '#F28B82', '#B4473F', '#FBC3BE']].forEach(([id, a, b, c]) => {
    add('m-rose-' + id, id[0].toUpperCase() + id.slice(1) + ' rose', 'florals', 170, 170, svg(170, 170, at(40, 130, 0.9, 150, leaf()) + at(130, 130, 0.9, 30, leaf()) + at(85, 80, 1.15, 0, rose(a, b, c))));
  });
  [['white', '#FFFDF8', '#EDBB4A'], ['pink', '#F7C3CF', '#F2D98B'], ['lilac', '#D8C9F0', '#F2D98B'], ['yellow', '#F9DC6A', '#B8742A'], ['blue', '#B9D5F2', '#F7E07A'], ['orange', '#F8B26A', '#7A3E1A']].forEach(([id, pc, cc]) => {
    let s = '';
    for (let i = 0; i < 14; i++) s += `<ellipse cx="90" cy="44" rx="10" ry="30" fill="${pc}" stroke="${shade(pc, -0.18)}" stroke-width="1.2" transform="rotate(${i * 360 / 14} 90 90)"/>`;
    add('m-daisy-' + id, id[0].toUpperCase() + id.slice(1) + ' daisy', 'florals', 180, 180, svg(180, 180, s + `<circle cx="90" cy="90" r="18" fill="${cc}" stroke="${shade(cc, -0.25)}" stroke-width="1.5"/>`));
  });
  ['blush', 'peach', 'butter', 'lilac', 'sky', 'mint', 'white', 'red'].forEach(c => {
    let s = at(40, 120, 0.9, 160, leaf()) + at(140, 116, 0.9, 20, leaf()) + at(92, 140, 0.8, 95, leaf());
    [[60, 70, 1.3], [100, 54, 1.2], [132, 82, 1.1], [86, 100, 1.25], [118, 116, 0.9]].forEach(([x, y, s2]) => s += at(x, y, s2, x * 4, blossom(P(c), c === 'butter' ? '#C9932A' : '#F2D98B', shade(P(c), -0.2))));
    add('m-bloom-' + c, 'Blossom bunch', 'florals', 180, 170, svg(180, 170, s));
  });

  /* ---- washi & tape (8 patterns × 3 colourways) ---- */
  function tapePath() {
    const pts = [];
    for (let x = 12; x <= 248; x += 8) pts.push([x, 6]);
    let k = 0;
    for (let y = 6; y <= 58; y += 6.5) pts.push([k++ % 2 ? 254 : 248, y]);
    for (let x = 248; x >= 12; x -= 8) pts.push([x, 58]);
    k = 0;
    for (let y = 58; y >= 6; y -= 6.5) pts.push([k++ % 2 ? 6 : 12, y]);
    return 'M' + pts.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z';
  }
  const TAPE = tapePath();
  ['gingham', 'dots', 'stripes', 'checker', 'hearts', 'stars', 'plaid', 'solid'].forEach(k => {
    [['blush', '#FFF3F5'], ['sky', '#F2F8FE'], ['butter', '#FFFBEA']].forEach(([c, base]) => {
      add(`m-tape-${k}-${c}`, k[0].toUpperCase() + k.slice(1) + ' tape', 'tapes', 260, 64,
        svg(260, 64, `<path d="${TAPE}" fill="url(#tp)" opacity=".86"/>`, pat('tp', k, k === 'solid' ? shade(P(c), 0.35) : base, P(c), 16)));
    });
  });

  /* ---- words & tags ---- */
  function wordSticker(word, shape, col, ink, fontAttr) {
    const fs = 32, tw = Math.round([...word].length * fs * 0.6), pad = 34;
    let w = Math.max(130, tw + pad * 2), h = 92, body = '', ty = h / 2 + fs * 0.34, defs = '';
    const T = (x, y, extra = '') => `<text x="${x}" y="${y}" ${fontAttr} font-size="${fs}" font-weight="bold" fill="${ink}" text-anchor="middle" ${extra}>${esc(word)}</text>`;
    switch (shape) {
      case 'pill':
        body = `<rect x="4" y="12" width="${w - 8}" height="${h - 24}" rx="${(h - 24) / 2}" fill="${col}" stroke="${shade(col, -0.25)}" stroke-width="3"/>` + T(w / 2, ty);
        break;
      case 'tag':
        w += 24;
        body = `<path d="M30 12H${w - 6}V${h - 12}H30L6 ${h / 2}Z ${circleP(30, h / 2, 6)}" fill="${col}" fill-rule="evenodd" stroke="${shade(col, -0.25)}" stroke-width="3" stroke-linejoin="round"/>` + T(w / 2 + 10, ty);
        break;
      case 'bubble':
        h = 120; ty = 52 + fs * 0.34;
        body = `<path d="M20 8H${w - 20}A16 16 0 0 1 ${w - 4} 24V80A16 16 0 0 1 ${w - 20} 96H64L36 116L42 96H20A16 16 0 0 1 4 80V24A16 16 0 0 1 20 8Z" fill="${col}" stroke="${shade(col, -0.3)}" stroke-width="3" stroke-linejoin="round"/>` + T(w / 2, ty);
        break;
      case 'banner':
        w += 50;
        body = `<path d="M4 22H40V76H4L18 49Z" fill="${shade(col, -0.25)}"/><path d="M${w - 4} 22H${w - 40}V76H${w - 4}L${w - 18} 49Z" fill="${shade(col, -0.25)}"/>` +
          `<rect x="26" y="12" width="${w - 52}" height="58" fill="${col}" stroke="${shade(col, -0.3)}" stroke-width="2"/>` + T(w / 2, 41 + fs * 0.34);
        break;
      case 'burst': {
        const s = Math.max(170, tw + 70); w = h = s; ty = s / 2 + fs * 0.34;
        body = `<path d="${starP(s / 2, s / 2, s / 2 - 4, s / 2 - 22, 16)}" fill="${col}" stroke="${shade(col, -0.3)}" stroke-width="3" stroke-linejoin="round"/>` + T(s / 2, ty);
        break;
      }
      case 'circle': {
        const s = Math.max(150, tw + 60); w = h = s; ty = s / 2 + fs * 0.34;
        body = `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 4}" fill="${col}" stroke="${shade(col, -0.3)}" stroke-width="3"/><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 14}" fill="none" stroke="${ink}" stroke-width="2" stroke-dasharray="4 5" opacity=".6"/>` + T(s / 2, ty);
        break;
      }
      case 'dymo': {
        const up = word.toUpperCase();
        w = Math.max(140, Math.round(up.length * fs * 0.66) + 50);
        body = `<rect x="4" y="16" width="${w - 8}" height="${h - 32}" rx="6" fill="${col}"/><rect x="4" y="16" width="${w - 8}" height="6" rx="3" fill="#fff" opacity=".15"/>` +
          `<text x="${w / 2}" y="${ty}" ${MONO} font-size="${fs}" font-weight="bold" fill="#fff" text-anchor="middle" letter-spacing="3" stroke="rgba(0,0,0,.25)" stroke-width="1" paint-order="stroke">${esc(up)}</text>`;
        break;
      }
      case 'ticket':
        defs = `<mask id="tk"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="4" cy="${h / 2}" r="12" fill="#000"/><circle cx="${w - 4}" cy="${h / 2}" r="12" fill="#000"/></mask>`;
        body = `<g mask="url(#tk)"><rect x="4" y="10" width="${w - 8}" height="${h - 20}" rx="6" fill="${col}"/></g><rect x="16" y="20" width="${w - 32}" height="${h - 40}" rx="3" fill="none" stroke="${ink}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".6"/>` + T(w / 2, ty);
        break;
      default: { // cloud
        w += 30; h = 110; ty = h / 2 + fs * 0.34;
        body = `<path d="${scallopP(ringPts(w / 2, h / 2, w / 2 - 22, h / 2 - 20, 12))}" fill="${col}" stroke="${shade(col, -0.25)}" stroke-width="3"/>` + T(w / 2, ty);
      }
    }
    return { w, h, svg: svg(w, h, body, defs) };
  }
  const SHAPES = ['pill', 'bubble', 'tag', 'banner', 'burst', 'circle', 'dymo', 'ticket', 'cloud'];
  const FONTS_SVG = [ROUND, HAND, SERIF + ' font-style="italic"', ROUND];
  [['xoxo', 'blush'], ['omg!', 'butter'], ['bff', 'lilac'], ['cute', 'blush'], ['slay', 'black'], ['love u', 'red'], ['yay!', 'mint'], ['mood', 'navy'],
    ['vibes', 'peach'], ['so pretty', 'blush'], ['hello', 'sky'], ['bonjour', 'white'], ['thank you', 'sage'], ['miss you', 'lilac'], ['happy birthday', 'butter'],
    ['best day ever', 'rose'], ['me & you', 'blush'], ['forever', 'gold'], ['iconic', 'black'], ['obsessed', 'red'], ['girls trip', 'peach'], ['summer', 'butter'],
    ['weekend', 'mint'], ['oops', 'sky'], ['wow', 'butter'], ['sweet', 'blush'], ['dreamy', 'lilac'], ['bloom', 'sage'], ['adventure', 'navy'], ['cheers', 'gold'],
    ['good vibes only', 'peach'], ['self love', 'rose']].forEach(([word, c], i) => {
    const col = P(c), dark = ['black', 'navy', 'red', 'rose', 'brown'].includes(c), shape = SHAPES[i % SHAPES.length];
    const ink = shape === 'dymo' ? '#fff' : dark ? '#FFFDF8' : shade(col, -0.62);
    const ws = wordSticker(word, shape, shape === 'dymo' ? (dark ? col : shade(col, -0.45)) : col, ink, FONTS_SVG[i % FONTS_SVG.length]);
    add('m-word-' + i, word, 'words', ws.w, ws.h, ws.svg);
  });

  /* ---- cute objects ---- */
  const fun = (id, name, w, h, body, defs = '') => add('m-fun-' + id, name, 'fun', w, h, svg(w, h, body, defs));
  (function () {
    const cols = ['#F4A7A7', '#F8C8A0', '#F5E3A0', '#BFE3C0', '#A9CBEF', '#C9B5E8'];
    const cloud = x => `<g fill="#fff" stroke="#E6DDEA" stroke-width="2"><circle cx="${x - 14}" cy="122" r="14"/><circle cx="${x}" cy="112" r="17"/><circle cx="${x + 15}" cy="122" r="13"/></g><g fill="#fff"><circle cx="${x - 14}" cy="122" r="12"/><circle cx="${x}" cy="112" r="15"/><circle cx="${x + 15}" cy="122" r="11"/></g>`;
    fun('rainbow', 'Rainbow', 240, 140, cols.map((c, i) => { const r = 96 - i * 12; return `<path d="M${120 - r} 120A${r} ${r} 0 0 1 ${120 + r} 120" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`; }).join('') + cloud(26) + cloud(214));
  })();
  fun('cloud', 'Happy cloud', 200, 140,
    `<g stroke="#D9E6F2" stroke-width="8"><circle cx="60" cy="85" r="36"/><circle cx="100" cy="64" r="46"/><circle cx="145" cy="85" r="36"/><rect x="58" y="80" width="90" height="42" rx="20"/></g>` +
    `<g fill="#fff"><circle cx="60" cy="85" r="36"/><circle cx="100" cy="64" r="46"/><circle cx="145" cy="85" r="36"/><rect x="58" y="80" width="90" height="42" rx="20"/></g>` +
    `<circle cx="86" cy="86" r="4.5" fill="#3A2C2A"/><circle cx="118" cy="86" r="4.5" fill="#3A2C2A"/><path d="M94 96Q102 104 110 96" stroke="#3A2C2A" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="74" cy="98" rx="8" ry="5" fill="#F7B6C8"/><ellipse cx="130" cy="98" rx="8" ry="5" fill="#F7B6C8"/>`);
  fun('sun', 'Sunny', 200, 200,
    Array.from({ length: 12 }, (_, i) => `<path d="M100 14L110 40H90Z" fill="#FFC94D" transform="rotate(${i * 30} 100 100)"/>`).join('') +
    `<circle cx="100" cy="100" r="54" fill="#FFD95A" stroke="#F2A93B" stroke-width="4"/><circle cx="84" cy="94" r="5" fill="#3A2C2A"/><circle cx="116" cy="94" r="5" fill="#3A2C2A"/><path d="M84 112Q100 126 116 112" stroke="#3A2C2A" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="72" cy="110" rx="8" ry="5" fill="#F79A7A" opacity=".7"/><ellipse cx="128" cy="110" rx="8" ry="5" fill="#F79A7A" opacity=".7"/>`);
  fun('moon', 'Moon & stars', 200, 200,
    `<circle cx="96" cy="104" r="74" fill="#F7DC8A" stroke="#D9B04A" stroke-width="4" mask="url(#mm)"/>` + at(160, 40, 0.3, 0, `<path d="${sparkleD}" fill="#F7DC8A"/>`) + at(172, 140, 0.2, 0, `<path d="${sparkleD}" fill="#F7DC8A"/>`),
    `<mask id="mm"><rect width="200" height="200" fill="#fff"/><circle cx="132" cy="80" r="62" fill="#000"/></mask>`);
  fun('planet', 'Planet', 220, 160,
    `<ellipse cx="110" cy="84" rx="100" ry="24" fill="none" stroke="#F4A7C3" stroke-width="8" transform="rotate(-15 110 84)"/>` +
    `<circle cx="110" cy="84" r="48" fill="url(#pl)"/><path d="M10 84A100 24 0 0 0 210 84" fill="none" stroke="#F4A7C3" stroke-width="8" transform="rotate(-15 110 84)"/>` +
    `<circle cx="94" cy="68" r="8" fill="#fff" opacity=".35"/>`, `<linearGradient id="pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9B5E8"/><stop offset="1" stop-color="#8E7BB5"/></linearGradient>`);
  fun('bolt', 'Lightning', 120, 200, `<path d="M60 6L16 112H58L40 194L104 80H62L86 6Z" fill="#FFD84D" stroke="#E0A800" stroke-width="5" stroke-linejoin="round"/>`);
  fun('icecream', 'Ice cream', 140, 220,
    `<path d="M34 100H106L70 212Z" fill="#E8B470" stroke="#C48A45" stroke-width="3" stroke-linejoin="round"/><g clip-path="url(#cn)" stroke="#C48A45" stroke-width="2"><path d="M20 110L110 200M20 140L90 210M40 100L120 180M120 110L30 200M120 140L50 210M100 100L20 180"/></g>` +
    `<circle cx="70" cy="90" r="38" fill="#BDEBD6" stroke="#8CCFB2" stroke-width="3"/><circle cx="70" cy="54" r="34" fill="#F7B6C8" stroke="#E68CA6" stroke-width="3"/>` +
    `<circle cx="70" cy="18" r="9" fill="#D8344F"/><path d="M70 10C72 4 78 2 82 2" stroke="#5B6B3E" stroke-width="2" fill="none"/>` +
    `<g fill="#fff">${[[56, 46], [82, 60], [64, 70], [86, 40]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="3" rx="1.5" transform="rotate(${x} ${x} ${y})"/>`).join('')}</g>`,
    `<clipPath id="cn"><path d="M34 100H106L70 212Z"/></clipPath>`);
  fun('coffee', 'Iced coffee', 150, 220,
    `<path d="M30 50H120L108 210H42Z" fill="#FFFDF8" stroke="#C9B396" stroke-width="3" stroke-linejoin="round"/><path d="M34 100H116L112 150H38Z" fill="#C9A27A"/>` +
    `<path d="${heartP(75, 124, 0.07)}" fill="#fff"/><rect x="22" y="36" width="106" height="18" rx="6" fill="#8B6B57"/><rect x="40" y="24" width="70" height="14" rx="6" fill="#9E7B63"/>`);
  fun('boba', 'Bubble tea', 150, 240,
    `<rect x="80" y="0" width="12" height="150" rx="4" fill="#F4A7C3" transform="rotate(8 86 75)"/>` +
    `<path d="M28 60H122L110 226H40Z" fill="rgba(232,205,175,.92)" stroke="#B08B61" stroke-width="3" stroke-linejoin="round"/><path d="M28 60H122" stroke="#B08B61" stroke-width="6" stroke-linecap="round"/>` +
    (() => { const r = rng(41); let s = ''; for (let i = 0; i < 22; i++) s += `<circle cx="${f(50 + r() * 50)}" cy="${f(176 + r() * 40)}" r="7" fill="#3A2A20"/>`; return s; })() +
    `<path d="${heartP(75, 120, 0.08)}" fill="#fff" opacity=".7"/>`);
  fun('lemon', 'Lemon slice', 160, 160,
    `<circle cx="80" cy="80" r="70" fill="#F6D35B"/><circle cx="80" cy="80" r="60" fill="#FCF3C4"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M80 80L${f(80 + Math.cos((i * 45 + 4) * Math.PI / 180) * 54)} ${f(80 + Math.sin((i * 45 + 4) * Math.PI / 180) * 54)}A54 54 0 0 1 ${f(80 + Math.cos((i * 45 + 41) * Math.PI / 180) * 54)} ${f(80 + Math.sin((i * 45 + 41) * Math.PI / 180) * 54)}Z" fill="#F9E07A"/>`).join('') + `<circle cx="80" cy="80" r="7" fill="#FCF3C4"/>`);
  fun('watermelon', 'Watermelon', 220, 130,
    [[100, '#6BAA5A'], [92, '#EAF5D8'], [86, '#F0606F']].map(([r, c]) => `<path d="M${110 - r} 20A${r} ${r} 0 0 0 ${110 + r} 20Z" fill="${c}"/>`).join('') +
    [[80, 50], [110, 70], [140, 50], [95, 40], [125, 40], [110, 95]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="5" fill="#3A2C2A"/>`).join(''));
  fun('cupcake', 'Cupcake', 160, 210,
    `<path d="M30 120H130L116 200H44Z" fill="#F4A7C3" stroke="#D97898" stroke-width="3" stroke-linejoin="round"/><g stroke="#D97898" stroke-width="2">${[50, 66, 80, 94, 110].map(x => `<path d="M${x} 122L${x + (x - 80) * -0.15} 198"/>`).join('')}</g>` +
    `<g fill="#FFF3F6" stroke="#EBC3CF" stroke-width="2.5"><ellipse cx="80" cy="116" rx="58" ry="20"/><ellipse cx="80" cy="96" rx="48" ry="20"/><ellipse cx="80" cy="76" rx="34" ry="18"/></g>` +
    `<circle cx="80" cy="50" r="11" fill="#D8344F"/><path d="M80 40C82 30 88 26 94 24" stroke="#5B6B3E" stroke-width="2.5" fill="none"/>` +
    [['#9ED9C0', 56, 96], ['#F5D76E', 100, 104], ['#BBA4E0', 74, 112], ['#9CC9F0', 92, 84], ['#F8B98F', 64, 80]].map(([c, x, y]) => `<rect x="${x}" y="${y}" width="9" height="3.5" rx="1.7" fill="${c}" transform="rotate(${x} ${x} ${y})"/>`).join(''));
  fun('balloons', 'Balloons', 200, 240,
    `<path d="M60 112C70 160 100 190 110 236M110 102C112 150 110 190 110 236M155 120C140 160 118 200 110 236" fill="none" stroke="#B3A096" stroke-width="2"/>` +
    [[60, 70, 34, 42, '#F4A7C3'], [110, 58, 36, 44, '#BBA4E0'], [155, 80, 32, 40, '#9ED9C0']].map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/><path d="M${x - 5} ${y + ry + 6}L${x} ${y + ry - 2}L${x + 5} ${y + ry + 6}Z" fill="${c}"/><ellipse cx="${x - 12}" cy="${y - 16}" rx="7" ry="11" fill="#fff" opacity=".4"/>`).join(''));
  (function () {
    const b = bowAt('gb', 100, 66, 0.42, '#FFF4E4', '#EBD5B8', '#B89670');
    fun('gift', 'Gift box', 200, 200, `<rect x="30" y="96" width="140" height="96" rx="4" fill="#F4A7C3" stroke="#D97898" stroke-width="3"/><rect x="22" y="76" width="156" height="28" rx="4" fill="#F7B6C8" stroke="#D97898" stroke-width="3"/>` +
      `<rect x="90" y="76" width="20" height="116" fill="#FFF4E4"/>` + b.body, b.defs);
  })();
  fun('crown', 'Crown', 220, 150,
    `<path d="M20 128L30 40L75 90L110 20L145 90L190 40L200 128Z" fill="url(#cr)" stroke="#9A773A" stroke-width="3" stroke-linejoin="round"/><rect x="20" y="118" width="180" height="20" rx="4" fill="url(#cr)" stroke="#9A773A" stroke-width="3"/>` +
    `<circle cx="70" cy="128" r="6" fill="#D8344F"/><circle cx="110" cy="128" r="6" fill="#2F7FC1"/><circle cx="150" cy="128" r="6" fill="#3E9C6A"/>` + [30, 110, 190].map((x, i) => pearl(x, [40, 20, 40][i], 7)).join(''),
    goldDefs('cr') + pearlDefs());
  fun('diamond', 'Diamond', 180, 160,
    `<path d="M40 40H140L170 72L90 150L10 72Z" fill="#CDEBFA" stroke="#5F9CC7" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M40 40L60 72L90 40L120 72L140 40M10 72H170M60 72L90 150L120 72" fill="none" stroke="#5F9CC7" stroke-width="2"/><path d="M48 50L60 66" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`);
  fun('sunnies', 'Heart sunnies', 240, 110,
    `<path d="M106 50Q120 40 134 50" fill="none" stroke="#C2185B" stroke-width="5"/><path d="M28 40L6 30M212 40L234 30" stroke="#C2185B" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${heartP(68, 58, 0.3)} ${heartP(172, 58, 0.3)}" fill="rgba(240,96,140,.75)" stroke="#C2185B" stroke-width="4"/><path d="M44 42L58 34M148 42L162 34" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`);
  fun('mushroom', 'Mushroom', 160, 170,
    `<rect x="55" y="84" width="50" height="76" rx="18" fill="#FFF4E4" stroke="#D9C5A6" stroke-width="3"/><path d="M10 92C10 26 150 26 150 92Z" fill="#E5484D" stroke="#B5323A" stroke-width="3"/>` +
    [[46, 62, 9], [84, 48, 11], [118, 66, 8], [70, 78, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join(''));
  fun('lipstick', 'Lipstick', 110, 220,
    `<rect x="28" y="120" width="54" height="92" rx="6" fill="url(#lg)" stroke="#9A773A" stroke-width="2"/><rect x="33" y="82" width="44" height="42" rx="4" fill="#E3E6EB" stroke="#9AA1AB" stroke-width="2"/>` +
    `<path d="M36 84V40L74 20V84Z" fill="#C8174F" stroke="#8E0F37" stroke-width="2" stroke-linejoin="round"/><path d="M44 74V46" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>`, goldDefs('lg'));
  fun('mini-polaroid', 'Mini polaroid', 160, 190,
    `<rect x="12" y="10" width="136" height="168" rx="3" fill="rgba(70,45,30,.14)" transform="translate(3 4)"/><rect x="12" y="10" width="136" height="168" rx="3" fill="#FFFDF9"/>` +
    `<rect x="22" y="20" width="116" height="116" fill="url(#mp2)"/><path d="${heartP(80, 82, 0.12)}" fill="#fff" opacity=".85"/><path d="M40 160C60 150 90 164 120 154" stroke="#B3A096" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    lin('mp2', '#F4C7CF', '#9CC9F0'));
  fun('donut', 'Donut', 180, 180,
    `<path d="${circleP(90, 90, 76)} ${circleP(90, 90, 24)}" fill="#E8B470" fill-rule="evenodd"/><path d="${blobP(90, 88, 64, 6, 16, 3)} ${circleP(90, 90, 28)}" fill="#F7A1B5" fill-rule="evenodd"/>` +
    (() => { const r = rng(9), cs = ['#fff', '#9ED9C0', '#F5D76E', '#9CC9F0', '#BBA4E0']; let s = ''; for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 36 + r() * 22; const x = 90 + Math.cos(a) * d, y = 88 + Math.sin(a) * d; s += `<rect x="${f(x)}" y="${f(y)}" width="9" height="3.5" rx="1.7" fill="${cs[i % 5]}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`; } return s; })());
  fun('clover', 'Lucky clover', 160, 180,
    [0, 90, 180, 270].map(a => `<g transform="rotate(${a} 80 76)"><path d="${heartP(80, 46, 0.17)}" fill="#7FBF6A" stroke="#4E8C3E" stroke-width="2"/></g>`).join('') + `<path d="M80 80C84 120 96 150 110 172" stroke="#4E8C3E" stroke-width="5" fill="none" stroke-linecap="round"/>`);
  fun('evil-eye', 'Evil eye', 160, 160,
    `<circle cx="80" cy="80" r="70" fill="#1F4E9C"/><circle cx="80" cy="80" r="52" fill="#fff"/><circle cx="80" cy="80" r="36" fill="#7FB3D5"/><circle cx="80" cy="80" r="16" fill="#111"/><circle cx="72" cy="72" r="5" fill="#fff"/>`);

  /* ---- doodles (12 shapes × 3 inks) ---- */
  (function () {
    const spiral = (() => { let d = 'M90 90'; for (let t = 0; t < 22; t += 0.2) { const r = 3 * t; d += ` L${f(90 + Math.cos(t) * r)} ${f(90 + Math.sin(t) * r)}`; } return d; })();
    const squig = (() => { let d = 'M10 40'; for (let x = 10; x <= 210; x += 5) d += ` L${x} ${f(40 + Math.sin(x / 14) * 18)}`; return d; })();
    const D = [
      ['arrow', 'Doodle arrow', 200, 130, 'M20 104C60 44 120 30 172 60M150 44L174 60L152 78'],
      ['underline', 'Scribble underline', 200, 80, 'M10 40C60 18 120 62 190 30M20 56C80 40 140 70 186 48'],
      ['circle', 'Scribble circle', 200, 150, 'M100 20C170 18 190 80 150 112C110 140 30 130 20 80C12 40 60 14 112 22'],
      ['star', 'Doodle star', 160, 160, starP(80, 84, 68, 28)],
      ['heart2', 'Double heart', 180, 170, heartP(88, 86, 0.5) + ' ' + heartP(94, 92, 0.46)],
      ['burst', 'Doodle burst', 110, 110, 'M20 72L46 70M30 30L52 52M70 12L72 40M90 30L80 52'],
      ['spiral', 'Swirl', 180, 180, spiral],
      ['zigzag', 'Zigzag', 200, 70, 'M10 50L40 20L70 50L100 20L130 50L160 20L190 50'],
      ['squiggle', 'Squiggle', 220, 80, squig],
      ['emphasis', 'Emphasis marks', 120, 64, 'M28 10L40 52M60 6V50M92 12L80 52'],
      ['crown', 'Doodle crown', 180, 110, 'M20 92L30 30L60 66L90 20L120 66L150 30L160 92Z'],
      ['flower', 'Doodle flower', 160, 160, Array.from({ length: 6 }, (_, i) => { const a = i * 60 * Math.PI / 180, cx = 80 + Math.cos(a) * 36, cy = 80 + Math.sin(a) * 36; return ellipseP(cx, cy, 22, 22); }).join(' ') + ' ' + circleP(80, 80, 16)]
    ];
    [['ink', '#2A2326'], ['white', '#FFFFFF'], ['pink', '#E8758F']].forEach(([ink, c]) => D.forEach(([id, name, w, h, d]) =>
      add(`m-doodle-${id}-${ink}`, name, 'doodles', w, h, svg(w, h, `<path d="${d}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`))));
  })();

  /* =====================================================================
     FRAMES
     ===================================================================== */
  const frame = (id, name, cat, w, h, holes, body, defs = '', opts = {}) => A.FRAMES.push({ id, name, cat, w, h, holes, svg: svg(w, h, body, defs), ...opts });
  const cut = (outer, holes, fill, extra = '') => `<path d="${outer} ${holes.join(' ')}" fill="${fill}" fill-rule="evenodd" ${extra}/>`;

  /* --- classic: polaroid colourways & patterns, gallery borders --- */
  (function () {
    const hole = rectP(20, 20, 260, 260);
    ['lilac', 'mint', 'sky', 'butter', 'peach', 'sage', 'black', 'red', 'brown', 'navy'].forEach(c => {
      const col = c === 'brown' ? '#C9A27A' : P(c);
      frame('m-pol-' + c, PAL.find(p => p.id === c).name + ' polaroid', 'classic', 300, 360, [hole],
        cut(rectP(0, 0, 300, 360, 3), [hole], col) + `<path d="${hole}" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>`, '', { shadow: true });
    });
    [['gingham', 'blush'], ['gingham', 'sky'], ['dots', 'lilac'], ['stripes', 'mint'], ['hearts', 'red'], ['checker', 'butter']].forEach(([k, c], i) => {
      frame(`m-polp-${i}`, k[0].toUpperCase() + k.slice(1) + ' polaroid', 'classic', 300, 360, [hole],
        cut(rectP(0, 0, 300, 360, 3), [hole], 'url(#pp)') + `<path d="${hole}" fill="none" stroke="#fff" stroke-width="5"/>`, pat('pp', k, '#FFFDF8', P(c), 20), { shadow: true });
    });
    const g = (id, name, body, defs = '') => frame(id, name, 'classic', 320, 400, [rectP(40, 40, 240, 320)], body, defs, { shadow: true });
    const hole2 = rectP(40, 40, 240, 320);
    g('m-gal-white', 'Gallery white', cut(rectP(0, 0, 320, 400), [hole2], '#FFFFFF') + `<rect x="34" y="34" width="252" height="332" fill="none" stroke="#D9D4CE" stroke-width="1.5"/>`);
    g('m-gal-black', 'Gallery black', cut(rectP(0, 0, 320, 400), [hole2], '#1E1C1D') + `<rect x="8" y="8" width="304" height="384" fill="none" stroke="#3A3638" stroke-width="2"/>`);
    g('m-gal-cream', 'Cream mat', cut(rectP(0, 0, 320, 400), [hole2], '#F4ECDD') + `<rect x="0" y="0" width="320" height="400" fill="none" stroke="#C9B396" stroke-width="10"/><path d="${hole2}" fill="none" stroke="#D9C7A8" stroke-width="4"/>`);
    g('m-gal-gold', 'Thin gold', cut(rectP(0, 0, 320, 400), [hole2], '#FFFDF8') + `<rect x="5" y="5" width="310" height="390" fill="none" stroke="url(#gd)" stroke-width="10"/><path d="${hole2}" fill="none" stroke="#C9A45C" stroke-width="2"/>`, goldDefs('gd'));
    g('m-gal-wood', 'Wood frame', cut(rectP(0, 0, 320, 400), [hole2], 'url(#wd)') + `<rect x="18" y="18" width="284" height="364" fill="none" stroke="#6E4A32" stroke-width="2"/>`, lin('wd', '#B58457', '#7A5235', false));
    g('m-gal-silver', 'Silver frame', cut(rectP(0, 0, 320, 400), [hole2], 'url(#sv)') + `<rect x="18" y="18" width="284" height="364" fill="none" stroke="#7E8691" stroke-width="2"/>`, lin('sv', '#EEF0F4', '#9AA1AB'));
    g('m-gal-round', 'Rounded white', cut(rectP(0, 0, 320, 400, 40), [rectP(40, 40, 240, 320, 22)], '#FFFFFF'));
    g('m-gal-double', 'Double line', cut(rectP(0, 0, 320, 400), [hole2], '#FBF6EE') + `<rect x="14" y="14" width="292" height="372" fill="none" stroke="#8B6B57" stroke-width="2"/><rect x="22" y="22" width="276" height="356" fill="none" stroke="#8B6B57" stroke-width="1"/>`);
  })();

  /* --- shapes: any window shape, outlined (works with Put in frame / drag / double-click) --- */
  (function () {
    const S = {
      circle: circleP(170, 170, 132), hexagon: polyP(170, 170, 140, 6), diamond: polyP(170, 170, 145, 4), octagon: polyP(170, 170, 138, 8, -67.5),
      flower: scallopP(ringPts(170, 170, 112, 112, 8)), oval: ellipseP(170, 170, 118, 145), rounded: rectP(40, 40, 260, 260, 64), stadium: rectP(76, 26, 188, 288, 94),
      speech: 'M58 46H282A22 22 0 0 1 304 68V218A22 22 0 0 1 282 240H140L88 296L100 240H58A22 22 0 0 1 36 218V68A22 22 0 0 1 58 46Z',
      pentagon: polyP(170, 178, 140, 5), triangle: polyP(170, 196, 150, 3), shield: 'M170 30L292 70V160C292 230 240 280 170 310C100 280 48 230 48 160V70Z'
    };
    const NAMES = { circle: 'Circle', hexagon: 'Hexagon', diamond: 'Diamond', octagon: 'Octagon', flower: 'Flower', oval: 'Oval', rounded: 'Rounded square', stadium: 'Pill', speech: 'Speech bubble', pentagon: 'Pentagon', triangle: 'Triangle', shield: 'Shield' };
    const tints = ['#F4B6C2', '#BBA4E0', '#9ED9C0', '#9CC9F0', '#F5D76E', '#F8B98F'];
    Object.entries(S).forEach(([k, d], i) => {
      frame('m-shape-' + k, NAMES[k] + ' (white)', 'shapes', 340, 340, [d],
        `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="28" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2" stroke-linejoin="round"/>`, '', { shadow: true });
      const c = tints[i % tints.length];
      frame('m-shapec-' + k, NAMES[k] + ' (pastel)', 'shapes', 340, 340, [d],
        `<path d="${d}" fill="none" stroke="${c}" stroke-width="26" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 5" stroke-linejoin="round" transform="translate(0 0)"/>`, '', { shadow: true });
    });
  })();

  /* --- devices & social --- */
  (function () {
    const now = new Date(), p2 = n => String(n).padStart(2, '0'), time = `${now.getHours() % 12 || 12}:${p2(now.getMinutes())}`;
    let hole = rectP(14, 14, 232, 492, 30);
    frame('m-phone', 'Smartphone', 'devices', 260, 520, [hole],
      cut(rectP(0, 0, 260, 520, 42), [hole], '#1C1C21') + `<rect x="96" y="26" width="68" height="20" rx="10" fill="#0A0A0C"/>` +
      `<text x="40" y="42" ${SANS} font-size="14" font-weight="bold" fill="#fff">${time}</text><rect x="196" y="31" width="24" height="12" rx="3" fill="none" stroke="#fff" stroke-width="1.6"/><rect x="198" y="33" width="16" height="8" rx="1.5" fill="#fff"/>` +
      `<rect x="90" y="492" width="80" height="5" rx="2.5" fill="#fff" opacity=".85"/>`, '', { shadow: true });
    hole = rectP(34, 28, 452, 272, 4);
    frame('m-laptop', 'Laptop', 'devices', 520, 360, [hole],
      cut(rectP(18, 10, 484, 306, 16), [hole], '#2B2D33') + `<circle cx="260" cy="19" r="3" fill="#555"/>` +
      `<path d="M0 316H520L500 350H20Z" fill="url(#lt)" stroke="#9AA1AB" stroke-width="1.5"/><rect x="220" y="318" width="80" height="8" rx="4" fill="#B5BBC4"/>`, lin('lt', '#E6E9EE', '#B5BBC4'), { shadow: true });
    hole = rectP(40, 110, 268, 220, 34);
    frame('m-tv', 'Retro TV', 'devices', 440, 380, [hole],
      `<path d="M200 74L150 10M240 74L292 10" stroke="#5A4640" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="10" r="6" fill="#5A4640"/><circle cx="292" cy="10" r="6" fill="#5A4640"/>` +
      cut(rectP(10, 70, 420, 300, 30), [hole], 'url(#tv)', `stroke="#7A5235" stroke-width="3"`) + `<path d="${hole}" fill="none" stroke="#3A2C2A" stroke-width="8"/>` +
      `<rect x="330" y="110" width="84" height="220" rx="12" fill="#EADBC8" stroke="#7A5235" stroke-width="2"/><circle cx="372" cy="160" r="20" fill="#C9B396" stroke="#7A5235" stroke-width="3"/><circle cx="372" cy="224" r="20" fill="#C9B396" stroke="#7A5235" stroke-width="3"/>` +
      Array.from({ length: 5 }, (_, i) => `<rect x="346" y="${266 + i * 11}" width="52" height="4" rx="2" fill="#7A5235"/>`).join(''), lin('tv', '#C48A57', '#8A5A35'), { shadow: true });
    hole = rectP(50, 46, 340, 250, 12);
    frame('m-crt', 'Y2K monitor', 'devices', 440, 420, [hole],
      cut(rectP(10, 10, 420, 330, 22), [hole], '#E9E1D2', `stroke="#B8AC96" stroke-width="3"`) + `<path d="${hole}" fill="none" stroke="#5A564E" stroke-width="10"/>` +
      `<circle cx="390" cy="318" r="5" fill="#7CFC9A"/><rect x="30" y="312" width="60" height="10" rx="3" fill="#D3C8B4"/>` +
      `<path d="M170 340H270L290 400H150Z" fill="#DDD3C1" stroke="#B8AC96" stroke-width="3"/><rect x="110" y="398" width="220" height="16" rx="6" fill="#D3C8B4" stroke="#B8AC96" stroke-width="2"/>`, '', { shadow: true });
    hole = rectP(56, 52, 188, 160, 6);
    frame('m-handheld', 'Handheld console', 'devices', 300, 460, [hole],
      cut(rectP(4, 4, 292, 452, 28), [hole], 'url(#hh)', `stroke="#8E7BB5" stroke-width="3"`) + `<rect x="40" y="36" width="220" height="192" rx="10" fill="none" stroke="#4A4458" stroke-width="16"/>` +
      `<circle cx="34" cy="132" r="4" fill="#FF5A6E"/><path d="M76 320H104V292H124V320H152V340H124V368H104V340H76Z" fill="#3A3644"/>` +
      `<circle cx="214" cy="336" r="18" fill="#E5566F"/><circle cx="252" cy="306" r="18" fill="#E5566F"/><rect x="104" y="404" width="40" height="12" rx="6" fill="#6E6680" transform="rotate(-20 124 410)"/><rect x="160" y="404" width="40" height="12" rx="6" fill="#6E6680" transform="rotate(-20 180 410)"/>`,
      lin('hh', '#DCCFF0', '#B9A7D6'), { shadow: true });
    hole = rectP(62, 96, 216, 148, 10);
    frame('m-slide', '35mm slide', 'devices', 340, 340, [hole],
      cut(rectP(10, 10, 320, 320, 18), [hole], '#FBF8F2', `stroke="#D9D0C2" stroke-width="2"`) +
      `<text x="170" y="60" ${MONO} font-size="14" letter-spacing="3" fill="#8B6B57" text-anchor="middle">35mm ✦ ${now.getFullYear()}</text><text x="170" y="296" ${MONO} font-size="12" letter-spacing="2" fill="#B3A096" text-anchor="middle">No. ${p2(now.getMonth() + 1)}${p2(now.getDate())}</text>`, '', { shadow: true });
    hole = rectP(24, 24, 392, 292, 12);
    frame('m-tablet', 'Tablet', 'devices', 440, 340, [hole], cut(rectP(0, 0, 440, 340, 34), [hole], '#1C1C21') + `<circle cx="12" cy="170" r="3" fill="#444"/>`, '', { shadow: true });
    // social post card
    hole = rectP(0, 64, 360, 340);
    frame('m-post', 'Social post', 'devices', 360, 480, [hole],
      cut(rectP(0, 0, 360, 480, 18), [hole], '#FFFFFF') + `<circle cx="34" cy="32" r="18" fill="url(#av)"/><text x="62" y="37" ${SANS} font-size="14" font-weight="bold" fill="#262626">your.name</text><text x="330" y="38" ${SANS} font-size="18" fill="#262626" text-anchor="end">•••</text>` +
      `<path d="${heartP(30, 432, 0.085)}" fill="none" stroke="#262626" stroke-width="2.4"/><path d="M62 420A13 13 0 1 1 68 444L60 446L63 438A13 13 0 0 1 62 420Z" fill="none" stroke="#262626" stroke-width="2.4" stroke-linejoin="round"/><path d="M96 422L122 430L104 438L100 450Z" fill="none" stroke="#262626" stroke-width="2.4" stroke-linejoin="round"/><path d="M322 420H340V448L331 440L322 448Z" fill="none" stroke="#262626" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<text x="18" y="470" ${SANS} font-size="12" fill="#262626"><tspan font-weight="bold">your.name</tspan> golden hour ✨</text>`,
      lin('av', '#F4A7C3', '#F8B98F'), { shadow: true });
    hole = rectP(0, 0, 300, 533);
    frame('m-story', 'Story', 'devices', 300, 533, [hole],
      [0, 1, 2].map(i => `<rect x="${10 + i * 95}" y="10" width="90" height="3" rx="1.5" fill="#fff" opacity="${i ? 0.45 : 0.95}"/>`).join('') +
      `<circle cx="28" cy="36" r="13" fill="url(#av2)" stroke="#fff" stroke-width="2"/><text x="48" y="41" ${SANS} font-size="12" font-weight="bold" fill="#fff" stroke="rgba(0,0,0,.3)" stroke-width=".6" paint-order="stroke">your.name  <tspan font-weight="normal" opacity=".8">2h</tspan></text>` +
      `<rect x="14" y="490" width="220" height="32" rx="16" fill="none" stroke="#fff" stroke-width="1.6"/><text x="30" y="511" ${SANS} font-size="12" fill="#fff">Send message</text><path d="${heartP(262, 506, 0.07)}" fill="none" stroke="#fff" stroke-width="2.2"/>`,
      lin('av2', '#F4A7C3', '#BBA4E0'));
    hole = circleP(160, 150, 110);
    frame('m-profile', 'Profile circle', 'devices', 320, 380, [hole],
      `<circle cx="160" cy="150" r="122" fill="none" stroke="url(#ring)" stroke-width="12"/><circle cx="160" cy="150" r="114" fill="none" stroke="#fff" stroke-width="6"/>` +
      `<text x="160" y="310" ${SANS} font-size="20" font-weight="bold" fill="#3A2C2A" text-anchor="middle">your name ✿</text><rect x="110" y="328" width="100" height="32" rx="10" fill="#E8758F"/><text x="160" y="349" ${SANS} font-size="14" font-weight="bold" fill="#fff" text-anchor="middle">Follow</text>`,
      `<linearGradient id="ring" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F8B98F"/><stop offset=".5" stop-color="#E8758F"/><stop offset="1" stop-color="#BBA4E0"/></linearGradient>`);
  })();

  /* --- paper --- */
  (function () {
    let hole = rectP(22, 22, 232, 276, 2);
    frame('m-postcard', 'Postcard', 'paper', 460, 320, [hole],
      cut(rectP(0, 0, 460, 320, 6), [hole], '#FBF5EA', `stroke="#E2D6C2" stroke-width="1.5"`) + `<path d="M276 30V290" stroke="#D9CBB4" stroke-width="1.5"/>` +
      `<text x="350" y="46" ${SERIF} font-size="13" letter-spacing="4" fill="#8B6B57" text-anchor="middle">POST CARD</text>` +
      `<rect x="384" y="62" width="56" height="66" fill="#F4D3D8" stroke="#A94F63" stroke-width="1.5" stroke-dasharray="3 2"/><path d="${heartP(412, 98, 0.08)}" fill="#A94F63"/>` +
      [176, 204, 232, 260].map(y => `<path d="M292 ${y}H440" stroke="#CDBEA6" stroke-width="1.5"/>`).join('') +
      `<text x="292" y="150" font-family="Georgia, serif" font-style="italic" font-size="15" fill="#5B4A44">wish you were here ♡</text>`, '', { shadow: true });
    hole = rectP(24, 24, 300, 172, 6);
    frame('m-ticketframe', 'Ticket', 'paper', 480, 220, [hole],
      `<g mask="url(#tm2)">${cut(rectP(4, 4, 472, 212, 12), [hole], '#F3D9C9')}</g><path d="M356 16V204" stroke="#A94F63" stroke-width="1.5" stroke-dasharray="3 4"/>` +
      `<text x="0" y="0" ${SERIF} font-size="20" letter-spacing="4" fill="#6E2A3A" text-anchor="middle" transform="translate(394 110) rotate(-90)">ADMIT ONE</text>` +
      Array.from({ length: 14 }, (_, i) => `<rect x="${420 + (i % 2) * 2}" y="${36 + i * 11}" width="${[34, 22, 30, 18][i % 4]}" height="${i % 3 ? 4 : 6}" fill="#6E2A3A"/>`).join(''),
      `<mask id="tm2"><rect width="480" height="220" fill="#fff"/><circle cx="356" cy="4" r="14" fill="#000"/><circle cx="356" cy="216" r="14" fill="#000"/></mask>`, { shadow: true });
    hole = rectP(0, 0, 360, 480);
    frame('m-magazine', 'Magazine cover', 'paper', 360, 480, [hole],
      `<text x="180" y="78" ${SERIF} font-weight="bold" font-size="70" letter-spacing="4" fill="#fff" text-anchor="middle" stroke="rgba(0,0,0,.25)" stroke-width="1" paint-order="stroke">MUSE</text>` +
      `<text x="180" y="98" ${SANS} font-size="10" letter-spacing="4" fill="#fff" text-anchor="middle">ISSUE Nº 26 · THE SOFT ISSUE</text>` +
      `<text x="20" y="300" ${SERIF} font-style="italic" font-size="26" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width=".8" paint-order="stroke">main</text><text x="20" y="326" ${SERIF} font-style="italic" font-size="26" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width=".8" paint-order="stroke">character</text>` +
      `<text x="20" y="350" ${SANS} font-size="10" letter-spacing="2" fill="#fff">STYLE · BEAUTY · LIFE</text>` +
      `<rect x="282" y="410" width="60" height="50" fill="#fff"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${288 + i * 4}" y="414" width="${i % 3 ? 2 : 3}" height="32" fill="#111"/>`).join(''));
    // polaroid stack
    hole = rectP(60, 55, 260, 260);
    const card = (t) => `<g transform="${t}"><rect x="40" y="35" width="300" height="360" rx="3" fill="#FFFDF9" stroke="rgba(0,0,0,.08)" stroke-width="2"/></g>`;
    frame('m-polstack', 'Polaroid stack', 'paper', 380, 430, [hole],
      card('rotate(-8 190 215)') + card('rotate(6 190 215)') + cut(rectP(40, 35, 300, 360, 3), [hole], '#FFFDF9', `stroke="rgba(0,0,0,.08)" stroke-width="2"`), '', { shadow: true });
    // receipt
    hole = rectP(30, 76, 200, 200);
    const zig = (() => { let d = 'M0 10'; for (let x = 0; x <= 260; x += 10) d += ` L${x} ${x % 20 ? 0 : 10}`; d += ' V450'; for (let x = 260; x >= 0; x -= 10) d += ` L${x} ${x % 20 ? 460 : 450}`; return d + ' Z'; })();
    frame('m-receipt', 'Receipt', 'paper', 260, 460, [hole],
      cut(zig, [hole], '#FFFFFF') + `<text x="130" y="44" ${MONO} font-size="15" font-weight="bold" fill="#333" text-anchor="middle">PHOTO RECEIPT</text><text x="130" y="62" ${MONO} font-size="10" fill="#666" text-anchor="middle">${new Date().toLocaleDateString('en-GB')}</text>` +
      [['1x core memory', '∞'], ['1x good vibes', '0.00'], ['1x bestie', 'priceless']].map(([a, b], i) => `<text x="22" y="${306 + i * 20}" ${MONO} font-size="11" fill="#333">${a}</text><text x="238" y="${306 + i * 20}" ${MONO} font-size="11" fill="#333" text-anchor="end">${b}</text>`).join('') +
      `<path d="M22 370H238" stroke="#333" stroke-dasharray="3 3"/><text x="22" y="390" ${MONO} font-size="12" font-weight="bold" fill="#333">TOTAL</text><text x="238" y="390" ${MONO} font-size="12" font-weight="bold" fill="#333" text-anchor="end">LOVE</text>` +
      Array.from({ length: 30 }, (_, i) => `<rect x="${40 + i * 6}" y="408" width="${[2, 3, 1, 4][i % 4]}" height="26" fill="#333"/>`).join(''));
    // scrapbook page
    hole = rectP(60, 60, 300, 330, 2);
    frame('m-scrapbook', 'Scrapbook page', 'paper', 420, 500, [hole],
      cut(rectP(0, 0, 420, 500, 4), [hole], '#D9B98F') + `<path d="${hole}" fill="none" stroke="#fff" stroke-width="12"/>` +
      `<g transform="rotate(-12 80 60)"><rect x="40" y="46" width="90" height="26" fill="#F2C4C8" opacity=".85"/></g><g transform="rotate(10 340 60)"><rect x="296" y="46" width="90" height="26" fill="#DDE4CB" opacity=".9"/></g>` +
      `<text x="210" y="450" ${HAND} font-size="26" fill="#5B3A2E" text-anchor="middle">best day ever ♡</text>`, '', { shadow: true });
  })();

  /* --- decorated borders --- */
  (function () {
    const R = rectP(40, 40, 260, 340), base = (fill = '#FFFDF8') => cut(rectP(0, 0, 340, 420, 6), [R], fill);
    const dec = (id, name, body, defs = '', holes = [R], w = 340, h = 420) => frame('m-dec-' + id, name, 'decor', w, h, holes, body, defs, { shadow: true });
    dec('floral', 'Floral corners', base() + `<path d="${R}" fill="none" stroke="#C9A45C" stroke-width="2"/>` +
      at(40, 40, 0.5, 0, rose()) + at(84, 30, 0.7, 10, leaf()) + at(28, 84, 0.7, 80, leaf()) + at(78, 40, 0.3, 0, rose(...H.ROSE_CREAM)) +
      at(300, 380, 0.5, 0, rose(...H.ROSE_BLUSH)) + at(256, 390, 0.7, 190, leaf()) + at(312, 336, 0.7, 260, leaf()) + at(262, 380, 0.3, 0, rose(...H.ROSE_CREAM)));
    let hearts = '';
    rectPts(20, 20, 300, 380, 34).forEach(([x, y], i) => hearts += `<path d="${heartP(x, y, 0.06)}" fill="${['#E8758F', '#F4B6C2', '#D8344F'][i % 3]}"/>`);
    dec('hearts', 'Hearts border', base('#FFF6F8') + hearts);
    let stars = '';
    rectPts(20, 20, 300, 380, 40).forEach(([x, y], i) => stars += at(x, y, 0.16 + (i % 3) * 0.04, 0, `<path d="${sparkleD}" fill="${i % 2 ? '#D4AF5A' : '#F5D76E'}"/>`));
    dec('stars', 'Starry border', base('#1F2340') + stars);
    let conf = '';
    const r = rng(77), cols = ['#F4B6C2', '#9ED9C0', '#F5D76E', '#9CC9F0', '#BBA4E0', '#F8B98F'];
    for (let i = 0; i < 120; i++) {
      const side = i % 4, t = r();
      const x = side === 0 ? t * 340 : side === 1 ? 340 - r() * 36 : side === 2 ? t * 340 : r() * 36;
      const y = side === 0 ? r() * 36 : side === 1 ? t * 420 : 420 - r() * 36;
      const y2 = side === 3 ? t * 420 : y;
      conf += i % 2 ? `<circle cx="${f(x)}" cy="${f(y2)}" r="${f(2.5 + r() * 3)}" fill="${cols[i % 6]}"/>` : `<rect x="${f(x)}" y="${f(y2)}" width="10" height="4" rx="2" fill="${cols[i % 6]}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y2)})"/>`;
    }
    dec('confetti', 'Confetti', base() + conf);
    const vy = (() => { let d = 'M20 20'; for (let x = 20; x <= 320; x += 6) d += ` L${x} ${f(20 + Math.sin(x / 18) * 6)}`; return d; })();
    let vleaves = '';
    for (let x = 30; x <= 310; x += 28) { vleaves += at(x, 20, 0.45, x % 56 ? -50 : 50, leaf()) + at(x, 400, 0.45, x % 56 ? 230 : 130, leaf()); }
    for (let y = 50; y <= 370; y += 28) { vleaves += at(20, y, 0.45, y % 56 ? 140 : 40, leaf()) + at(320, y, 0.45, y % 56 ? -40 : 220, leaf()); }
    dec('vine', 'Leafy vine', base('#F7F6EE') + `<path d="${vy}" fill="none" stroke="#6F7F52" stroke-width="2.5"/>` + vleaves);
    const bow = bowAt('db', 170, 36, 0.62, '#F8CAD3', '#E59AAA', '#C46B80');
    dec('bowtop', 'Bow on top', base() + `<path d="${R}" fill="none" stroke="#F4B6C2" stroke-width="3"/>` + bow.body, bow.defs);
    const bow2 = bowAt('rw', 288, 362, 0.5, '#D8344F', '#A82C42', '#741B2C');
    dec('ribbon', 'Ribbon wrap', base('#FFFDF8') + `<path d="M200 420L340 280V320L240 420Z" fill="#C8243F"/><path d="M340 340L260 420H300L340 380Z" fill="#C8243F" opacity=".75"/>` + bow2.body, bow2.defs);
    const archH = 'M70 400V190A100 100 0 0 1 270 190V400Z';
    const RB = ['#F4A7A7', '#F8C8A0', '#F5E3A0', '#BFE3C0', '#A9CBEF', '#C9B5E8'];
    dec('rainbow', 'Rainbow arch', cut(rectP(0, 0, 340, 420, 6), [archH], '#FFFDF8') + RB.map((c, i) => `<path d="M${30 + i * 7} 400V190A${140 - i * 7} ${140 - i * 7} 0 0 1 ${310 - i * 7} 190V400" fill="none" stroke="${c}" stroke-width="7"/>`).join(''), '', [archH]);
    let pearls = '';
    rectPts(24, 24, 292, 372, 15).forEach(([x, y]) => pearls += pearl(x, y, 6));
    dec('pearl', 'Pearl border', base('#FBF6F0') + pearls, pearlDefs());
    const cH = circleP(170, 170, 104);
    let petals = '';
    for (let i = 0; i < 22; i++) petals += `<ellipse cx="170" cy="36" rx="16" ry="38" fill="#FFFDF8" stroke="#E0D2C2" stroke-width="1.5" transform="rotate(${i * 360 / 22} 170 170)"/>`;
    dec('daisyring', 'Daisy ring', petals + `<circle cx="170" cy="170" r="114" fill="none" stroke="#F2C94C" stroke-width="16"/>`, '', [cH], 340, 340);
  })();

  /* --- more layouts --- */
  (function () {
    const L = (id, name, w, h, holes, fill = '#FFFFFF') => frame('m-lay-' + id, name, 'layouts', w, h, holes, cut(rectP(0, 0, w, h, 4), holes, fill), '', { shadow: true });
    L('2x1', 'Side by side', 600, 380, [rectP(14, 14, 279, 352), rectP(307, 14, 279, 352)]);
    L('1x2', 'Stacked pair', 380, 600, [rectP(14, 14, 352, 279), rectP(14, 307, 352, 279)]);
    const g9 = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g9.push(rectP(12 + c * 136, 12 + r * 136, 128, 128));
    L('3x3', '3×3 grid', 432, 432, g9);
    L('1+3', 'Feature + 3', 540, 420, [rectP(14, 14, 330, 392), rectP(358, 14, 168, 122), rectP(358, 149, 168, 122), rectP(358, 284, 168, 122)]);
    L('strip4', 'Photo strip (wide)', 780, 220, [0, 1, 2, 3].map(i => rectP(14 + i * 191, 14, 180, 192)), '#FFFDF8');
    L('mosaic5', 'Mosaic 5', 420, 560, [rectP(14, 14, 189, 160), rectP(217, 14, 189, 160), rectP(14, 188, 392, 184), rectP(14, 386, 189, 160), rectP(217, 386, 189, 160)]);
    L('polgrid', 'Polaroid grid', 420, 500, [rectP(24, 24, 170, 170), rectP(226, 24, 170, 170), rectP(24, 262, 170, 170), rectP(226, 262, 170, 170)], '#F7EEDC');
  })();

  /* =====================================================================
     BACKGROUNDS
     ===================================================================== */
  const MORE_BG = {
    marble(x, W, Hh, u, r) {
      x.fillStyle = '#F4F1EE'; x.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 14; i++) {
        x.strokeStyle = `rgba(150,140,140,${(0.08 + r() * 0.18).toFixed(2)})`; x.lineWidth = (0.6 + r() * 2.4) * u;
        x.beginPath(); let px = r() * W, py = -20; x.moveTo(px, py);
        while (py < Hh + 20) { px += (r() - 0.45) * 90 * u; py += (40 + r() * 60) * u; x.lineTo(px, py); }
        x.stroke();
      }
    },
    terrazzo(x, W, Hh, u, r) {
      x.fillStyle = '#F7F1EA'; x.fillRect(0, 0, W, Hh);
      const cs = ['#E8A598', '#9ED9C0', '#F5D76E', '#2F4A73', '#C9B5E8', '#E3C9A8'];
      for (let i = 0; i < W * Hh / (2400 * u * u); i++) {
        x.fillStyle = cs[i % cs.length]; const px = r() * W, py = r() * Hh, s = (4 + r() * 12) * u;
        x.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + r(); x.lineTo(px + Math.cos(a) * s * (0.6 + r() * 0.6), py + Math.sin(a) * s * (0.6 + r() * 0.6)); } x.fill();
      }
    },
    cork(x, W, Hh, u, r) { x.fillStyle = '#C69C6D'; x.fillRect(0, 0, W, Hh); H.speckle(x, W, Hh, u, r, '90,60,30', 120 * u * u, 0.4); H.speckle(x, W, Hh, u, r, '240,210,170', 300 * u * u, 0.4); },
    wood(x, W, Hh, u, r) {
      x.fillStyle = '#C49A6C'; x.fillRect(0, 0, W, Hh);
      for (let px = 0; px < W; px += (6 + r() * 10) * u) { x.strokeStyle = `rgba(110,70,40,${(0.05 + r() * 0.15).toFixed(2)})`; x.lineWidth = (1 + r() * 2) * u; x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + 20 * u, Hh * 0.3, px - 20 * u, Hh * 0.7, px + 10 * u, Hh); x.stroke(); }
      for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(110,70,40,.08)'; x.fillRect(Math.round(r() * 8) * W / 8, 0, 2 * u, Hh); }
    },
    denim(x, W, Hh, u, r) {
      x.fillStyle = '#4A6A93'; x.fillRect(0, 0, W, Hh);
      x.lineWidth = Math.max(0.5, u);
      for (let k = -Hh; k < W; k += 3 * u) { x.strokeStyle = `rgba(255,255,255,${(r() * 0.12).toFixed(3)})`; x.beginPath(); x.moveTo(k, 0); x.lineTo(k + Hh, Hh); x.stroke(); }
    },
    tartan(x, W, Hh, u) {
      x.fillStyle = '#8E2B3A'; x.fillRect(0, 0, W, Hh);
      const s = 120 * u;
      for (let p = 0; p < Math.max(W, Hh); p += s) {
        x.fillStyle = 'rgba(30,40,70,.45)'; x.fillRect(p, 0, s * 0.35, Hh); x.fillRect(0, p, W, s * 0.35);
        x.fillStyle = 'rgba(240,200,80,.5)'; x.fillRect(p + s * 0.6, 0, 3 * u, Hh); x.fillRect(0, p + s * 0.6, W, 3 * u);
      }
    },
    sunset(x, W, Hh) { const g = x.createLinearGradient(0, 0, 0, Hh); [['#FFB88C', 0], ['#F9A1B5', 0.45], ['#B9A7D6', 1]].forEach(([c, o]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, W, Hh); },
    pastel(x, W, Hh) { const g = x.createLinearGradient(0, 0, W, Hh); [['#FDE2E4', 0], ['#E2ECE9', 0.5], ['#DFE7FD', 1]].forEach(([c, o]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, W, Hh); },
    rainbow(x, W, Hh) { const cs = ['#F4A7A7', '#F8C8A0', '#F5E3A0', '#BFE3C0', '#A9CBEF', '#C9B5E8']; cs.forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * Hh / cs.length, W, Hh / cs.length + 1); }); },
    dotgrid(x, W, Hh, u) { x.fillStyle = '#FDFCF8'; x.fillRect(0, 0, W, Hh); x.fillStyle = 'rgba(120,110,100,.35)'; for (let py = 20 * u; py < Hh; py += 36 * u) for (let px = 20 * u; px < W; px += 36 * u) { x.beginPath(); x.arc(px, py, 2.2 * u, 0, Math.PI * 2); x.fill(); } },
    glitter(x, W, Hh, u, r) { const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#F7C6D3'); g.addColorStop(1, '#D8C6F0'); x.fillStyle = g; x.fillRect(0, 0, W, Hh); H.speckle(x, W, Hh, u, r, '255,255,255', 80 * u * u, 0.9); H.speckle(x, W, Hh, u, r, '255,215,120', 600 * u * u, 0.8); },
    newsprint(x, W, Hh, u, r) {
      x.fillStyle = '#EFEAE0'; x.fillRect(0, 0, W, Hh);
      x.fillStyle = 'rgba(40,35,30,.28)';
      const col = 200 * u;
      for (let cx = 30 * u; cx < W; cx += col + 24 * u) for (let py = 40 * u; py < Hh; py += 18 * u) x.fillRect(cx, py, col * (0.6 + r() * 0.4), 5 * u);
    }
  };
  const prevBg = A.makeBackground;
  A.makeBackground = (key, W, Hh) => {
    if (!MORE_BG[key]) return prevBg(key, W, Hh);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    MORE_BG[key](cv.getContext('2d'), W, Hh, W / 1080, rng(29));
    return cv;
  };
  A.BG_TEXTURES.push({ id: 'marble', name: 'Marble' }, { id: 'terrazzo', name: 'Terrazzo' }, { id: 'cork', name: 'Cork board' }, { id: 'wood', name: 'Wood' },
    { id: 'denim', name: 'Denim' }, { id: 'tartan', name: 'Tartan' }, { id: 'sunset', name: 'Sunset' }, { id: 'pastel', name: 'Pastel fade' },
    { id: 'rainbow', name: 'Rainbow' }, { id: 'dotgrid', name: 'Dot grid' }, { id: 'glitter', name: 'Glitter' }, { id: 'newsprint', name: 'Newsprint' });
  A.BG_COLORS.splice(A.BG_COLORS.length - 1, 0, '#FDE2E4', '#F9D5BB', '#FFF1C1', '#DDF2E3', '#D7EBF7', '#E4DDF4', '#F2E8DC', '#C9B5E8', '#9CC9F0', '#E8758F', '#2F4A73', '#1C1C21', '#6B4A3A', '#A9B68E');
  A.SIZES.push(
    { id: 'pin', name: 'Pinterest 2:3', w: 1000, h: 1500 }, { id: 'yt', name: 'Thumbnail 16:9', w: 1280, h: 720 }, { id: 'fbcover', name: 'Cover banner', w: 1640, h: 624 },
    { id: 'header', name: 'Header 3:1', w: 1500, h: 500 }, { id: 'wallpaper', name: 'Phone wallpaper', w: 1170, h: 2532 }, { id: 'desktop', name: 'Desktop 16:10', w: 1920, h: 1200 },
    { id: 'a4', name: 'A4 print', w: 1240, h: 1754 }, { id: 'a5', name: 'A5 print', w: 874, h: 1240 }, { id: '4x6', name: '4×6 print', w: 1200, h: 1800 }, { id: '5x7', name: '5×7 print', w: 1500, h: 2100 },
    { id: 'card', name: 'Postcard 3:2', w: 1800, h: 1200 }, { id: 'small', name: 'Square small', w: 800, h: 800 }
  );

  /* =====================================================================
     FONTS & TEXT
     ===================================================================== */
  const grp = name => A.FONTS.find(g => g.group === name);
  grp('Script & calligraphy').fonts.push('Satisfy', 'Kaushan Script', 'Playball', 'Lobster', 'Yellowtail', 'Alex Brush');
  grp('Handwritten').fonts.push('Permanent Marker', 'Shadows Into Light', 'Patrick Hand', 'Amatic SC', 'Kalam');
  grp('Vintage serif').fonts.push('EB Garamond', 'Lora', 'Old Standard TT', 'UnifrakturMaguntia', 'Rye');
  grp('Retro & Y2K').fonts.push('Righteous', 'Bungee', 'Lilita One', 'Bebas Neue');
  grp('Clean').fonts.push('Poppins', 'Montserrat', 'Quicksand', 'Comfortaa', 'Anton');
  A.TEXT_PRESETS.push(
    { label: 'Bold poster', text: 'WEEKEND', font: 'Anton', size: 120, fill: '#E8758F', charSpacing: 120 },
    { label: 'Marker scrawl', text: 'so good!!', font: 'Permanent Marker', size: 80, fill: '#2A2326' },
    { label: 'Retro diner', text: 'Milkshake', font: 'Lobster', size: 90, fill: '#D8344F', stroke: '#FFFFFF', strokeWidth: 6, shadow: { color: '#2F4A73', blur: 0, offsetX: 5, offsetY: 5 } },
    { label: 'Blackletter', text: 'Old Soul', font: 'UnifrakturMaguntia', size: 86, fill: '#2A2326' },
    { label: 'Western', text: 'HOWDY', font: 'Rye', size: 84, fill: '#9A6B4F' },
    { label: 'Minimal caps', text: 'MINIMAL', font: 'Montserrat', size: 56, fill: '#2A2326', charSpacing: 600 },
    { label: 'Bubbly round', text: 'sweet tooth', font: 'Comfortaa', size: 68, weight: 'bold', fill: '#BBA4E0' },
    { label: 'Thin script', text: 'forever & always', font: 'Alex Brush', size: 90, fill: '#6E2A3A' },
    { label: 'Arcade', text: 'GAME ON', font: 'Bungee', size: 72, fill: '#7B5CFF', shadow: { color: '#FF7EB9', blur: 0, offsetX: 4, offsetY: 4 } },
    { label: 'Tall condensed', text: 'GOLDEN HOUR', font: 'Bebas Neue', size: 110, fill: '#D4AF5A', charSpacing: 150 },
    { label: 'Elegant serif', text: 'La Dolce Vita', font: 'EB Garamond', size: 76, italic: true, fill: '#3A2C2A' },
    { label: 'Notebook', text: 'to do: be happy', font: 'Kalam', size: 62, fill: '#2F4A73' }
  );
  A.QUOTES.push(...[
    ['live, laugh, love', 'Satisfy', '#C47A88'], ['good things take time', 'Kaushan Script', '#6F7F52'], ['just breathe', 'Amatic SC', '#2A2326'],
    ['stay wild, moon child', 'Playball', '#8C78B6'], ['you are magic', 'Yellowtail', '#E8758F'], ['ESCAPE THE ORDINARY', 'Bebas Neue', '#2F4A73'],
    ['coffee first', 'Permanent Marker', '#6B4A3A'], ['dream big', 'Lobster', '#D8344F'], ['hello sunshine', 'Pacifico', '#F2A93B'],
    ['take me back', 'Shadows Into Light', '#3A2C2A'], ['born to sparkle', 'Alex Brush', '#C9A45C'], ['WANDERLUST', 'Montserrat', '#2A2326'],
    ['the best is yet to come', 'EB Garamond', '#6E2A3A'], ['positive vibes', 'Righteous', '#9ED9C0'], ['you got this', 'Patrick Hand', '#E8758F'],
    ['once in a lifetime', 'Cinzel', '#9A773A'], ['sunkissed', 'Sacramento', '#F28B82'], ['make memories', 'Kalam', '#2F4A73'],
    ['BESTIES', 'Bungee', '#FF7EB9'], ['always & forever', 'Italianno', '#A94F63'], ['be kind', 'Quicksand', '#6F7F52'], ['happy place', 'Lilita One', '#F5A04A'],
    ['moonlight', 'Old Standard TT', '#2F4A73'], ['sweet escape', 'Comfortaa', '#BBA4E0'], ['NO BAD DAYS', 'Anton', '#E8758F'], ['love you more', 'Mrs Saint Delafield', '#6E2A3A'],
    ['bon voyage', 'Lora', '#2F4A73'], ['vintage soul', 'Rye', '#9A6B4F'], ['plot twist', 'Lilita One', '#7B5CFF'], ['petite joie', 'Playball', '#C47A88']
  ].map(([text, font, fill]) => ({ text, font, size: 70, fill })));

  /* =====================================================================
     FILTER LOOKS (consumed by app.js; 'duo' needs the Duotone shader defined there)
     ===================================================================== */
  A.MORE_PRESETS = [
    // seasons
    { id: 'spring', name: 'Spring', cat: 'seasons', spec: [['bri', 0.05], ['sat', 0.12], ['tint', '#FFD6E0', 'screen', 0.14], ['gm', 0.08], ['con', -0.04]] },
    { id: 'summer', name: 'Summer', cat: 'seasons', spec: [['warm', 0.6], ['sat', 0.2], ['bri', 0.06], ['vib', 0.3], ['con', 0.1]] },
    { id: 'autumn', name: 'Autumn', cat: 'seasons', spec: [['warm', 0.8], ['tint', '#C96A2B', 'multiply', 0.15], ['sat', 0.08], ['con', 0.12], ['fade', 0.1]] },
    { id: 'winter', name: 'Winter', cat: 'seasons', spec: [['warm', -0.7], ['sat', -0.25], ['bri', 0.06], ['tint', '#DDEBFA', 'screen', 0.15]] },
    { id: 'beach', name: 'Beach Day', cat: 'seasons', spec: [['tint', '#8FE3E0', 'screen', 0.12], ['warm', 0.3], ['sat', 0.18], ['bri', 0.07]] },
    { id: 'forest', name: 'Forest', cat: 'seasons', spec: [['gm', -0.25], ['sat', -0.05], ['con', 0.12], ['grade', { sh: [-0.02, 0.03, 0.01], hi: [0.02, 0.03, -0.02], split: 1 }]] },
    { id: 'city', name: 'City Lights', cat: 'seasons', spec: [['con', 0.25], ['sat', -0.1], ['grade', { curve: 0.2, sh: [-0.02, 0, 0.05], hi: [0.05, 0.02, -0.03], split: 1 }], ['sharp', 0.3]] },
    { id: 'foodie', name: 'Foodie', cat: 'seasons', spec: [['warm', 0.4], ['sat', 0.22], ['con', 0.12], ['sharp', 0.35], ['bri', 0.04]] },
    // cinema
    { id: 'tealorange', name: 'Teal & Orange', cat: 'cinema', spec: [['grade', { curve: 0.2, sh: [-0.05, 0.02, 0.08], hi: [0.08, 0.03, -0.06], split: 1 }], ['sat', 0.05], ['vig', 0.25]] },
    { id: 'bleach', name: 'Bleach Bypass', cat: 'cinema', spec: [['sat', -0.55], ['con', 0.35], ['grade', { curve: 0.25 }], ['sharp', 0.25]] },
    { id: 'daynight', name: 'Day for Night', cat: 'cinema', spec: [['bri', -0.25], ['tint', '#1E3A6E', 'multiply', 0.45], ['sat', -0.3], ['con', 0.15], ['vig', 0.5]] },
    { id: 'matrix', name: 'Code Green', cat: 'cinema', spec: [['gm', -0.6], ['tint', '#9CFFB0', 'multiply', 0.18], ['con', 0.25], ['sat', -0.2]] },
    { id: 'pastelcine', name: 'Pastel Cinema', cat: 'cinema', spec: [['fade', 0.35], ['sat', 0.12], ['tint', '#FFD8C9', 'screen', 0.15], ['grade', { sh: [0.02, 0, 0.03], split: 1 }]] },
    { id: 'neon', name: 'Neon Nights', cat: 'cinema', spec: [['grade', { curve: 0.3, sh: [0.05, -0.02, 0.1], hi: [0.08, 0, 0.06], split: 1 }], ['sat', 0.3], ['con', 0.2], ['glow', 0.4, 0.025, 0.55]] },
    { id: 'western', name: 'Desert Western', cat: 'cinema', spec: [['warm', 1], ['tint', '#D9A066', 'multiply', 0.2], ['sat', -0.15], ['con', 0.2], ['noise', 20]] },
    { id: 'noirgold', name: 'Gold Noir', cat: 'cinema', spec: [['gray'], ['tint', '#C9A45C', 'multiply', 0.3], ['con', 0.3], ['vig', 0.5]] },
    // decades
    { id: 'd1920', name: '1920s', cat: 'decades', spec: [['sepia'], ['con', 0.2], ['blur', 0.004], ['noise', 50], ['vig', 0.7], ['fade', 0.2]] },
    { id: 'd1950', name: '1950s', cat: 'decades', spec: [['sat', 0.25], ['con', 0.15], ['warm', 0.25], ['grade', { curve: 0.15, roll: 0.3 }], ['noise', 18]] },
    { id: 'd1960', name: '1960s', cat: 'decades', spec: [['fade', 0.25], ['warm', 0.5], ['sat', -0.05], ['tint', '#E8D5A8', 'multiply', 0.12], ['noise', 30]] },
    { id: 'd1970', name: '1970s', cat: 'decades', spec: [['warm', 0.7], ['fade', 0.35], ['tint', '#E59B4C', 'multiply', 0.14], ['sat', -0.1], ['noise', 35]] },
    { id: 'd1980', name: '1980s', cat: 'decades', spec: [['sat', 0.3], ['con', 0.15], ['tint', '#FF7EB9', 'screen', 0.1], ['rgb', 0.002], ['glow', 0.25, 0.02, 0.6]] },
    { id: 'd1990', name: '1990s', cat: 'decades', spec: [['fade', 0.2], ['warm', 0.3], ['sat', 0.08], ['grade', { roll: 0.4 }], ['noise', 28], ['vig', 0.2]] },
    { id: 'd2010', name: '2010s Insta', cat: 'decades', spec: [['fade', 0.3], ['warm', 0.45], ['vig', 0.45], ['con', 0.1], ['sat', -0.05]] },
    // colour pop washes
    ...[['Rose', '#FF9EB5'], ['Mint', '#9EF0D2'], ['Sky', '#9CCBFF'], ['Lilac', '#CBB2FF'], ['Peach', '#FFC29E'], ['Honey', '#FFD27A'], ['Sage', '#C3D7A5'], ['Ocean', '#6FC3D9']]
      .map(([n, c]) => ({ id: 'pop-' + n.toLowerCase(), name: n + ' Wash', cat: 'color', spec: [['tint', c, 'screen', 0.22], ['tint', c, 'multiply', 0.1], ['con', 0.05]] })),
    // duotones
    ...[['Pink Sky', '#3B2A6B', '#FFB3C7'], ['Sunset', '#5B1E52', '#FFC38A'], ['Ocean', '#0E2F4F', '#8FE3E0'], ['Grape', '#2A1240', '#D9B8FF'], ['Forest', '#16301F', '#C8E6A0'],
      ['Coral', '#3A1C2A', '#FF9E80'], ['Lemon', '#283A1A', '#FFF08A'], ['Ice', '#1A2A40', '#E6F4FF'], ['Rose Gold', '#4A2A2A', '#F6D3C0'], ['Electric', '#1B0F5C', '#5CFFE1'],
      ['Cherry', '#3D0A16', '#FF6B8A'], ['Vintage', '#2E2416', '#F2E2C4']]
      .map(([n, a, b]) => ({ id: 'duo-' + n.toLowerCase().replace(/\s+/g, ''), name: n, cat: 'duotone', spec: [['duo', a, b]] }))
  ];
})();
