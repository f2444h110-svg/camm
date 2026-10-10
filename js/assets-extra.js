/* Petal & Paper — extra asset pack: digicam / Y2K stickers & frames, more florals, coquette and
   vintage pieces, layout frames, new paper backgrounds, fonts and text presets.
   Builds on the drawing toolkit exposed by assets.js (ASSETS._h). */
(function () {
  'use strict';
  const A = window.ASSETS, H = A._h;
  const { C, f, svg, at, rng, circleP, ellipseP, rectP, heartP, scallopP, ringPts, rectPts, tornP, blobP,
    leaf, rose, blossom, bowParts, bowAt, pearl, pearlDefs, goldDefs, sparkleD, SERIF, SANS, BOW_PINK, BOW_CREAM } = H;
  const MONO = `font-family="'Courier New', Courier, monospace"`;

  /* today's date, digicam style */
  const now = new Date(), p2 = n => String(n).padStart(2, '0');
  const YY = String(now.getFullYear()).slice(2), MM = p2(now.getMonth() + 1), DD = p2(now.getDate());
  const DIGI_DATE = `'${YY} ${MM} ${DD}`;

  const starP = (cx, cy, R, r, n = 5, rot = -90) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const a = (rot + i * 180 / n) * Math.PI / 180, rr = i % 2 ? r : R; pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`); }
    return 'M' + pts.join(' L') + ' Z';
  };
  /* sample the parametric heart evenly by arc length */
  function heartPts(cx, cy, k, n) {
    const pt = t => [cx + k * 16 * Math.pow(Math.sin(t), 3), cy - k * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
    const dense = Array.from({ length: 601 }, (_, i) => pt(i / 600 * Math.PI * 2)), len = [0];
    for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const out = [];
    let j = 0;
    for (let i = 0; i < n; i++) { const tg = i / n * len[len.length - 1]; while (len[j] < tg) j++; out.push(dense[j]); }
    return { pts: out, poly: 'M' + dense.map(p => `${f(p[0])} ${f(p[1])}`).join(' L') + ' Z' };
  }

  const chromeDefs = (id = 'chr') => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".42" stop-color="#C9CED6"/><stop offset=".5" stop-color="#868E99"/><stop offset=".72" stop-color="#EEF0F4"/><stop offset="1" stop-color="#9AA1AB"/></linearGradient>`;
  const silverDefs = (id = 'sil') => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F5F8"/><stop offset=".55" stop-color="#D3D7DE"/><stop offset="1" stop-color="#A9AFB8"/></linearGradient>`;
  const lin = (id, a, b, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rad = (id, a, b, cx = '38%', cy = '35%') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="70%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;

  /* =====================================================================
     STICKERS
     ===================================================================== */
  const add = (id, name, cat, w, h, s) => A.STICKERS.push({ id, name, cat, w, h, svg: s });

  /* ---- digicam & Y2K ---- */
  add('digicam', 'Digicam', 'y2k', 240, 160, svg(240, 160,
    `<path d="M14 92C2 110 4 140 22 150" fill="none" stroke="#F4A7C3" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="176" y="10" width="38" height="16" rx="8" fill="#E8B4C0" stroke="#8D949E" stroke-width="1.5"/>` +
    `<rect x="8" y="20" width="224" height="132" rx="18" fill="url(#sil)" stroke="#8D949E" stroke-width="2"/>` +
    `<rect x="24" y="36" width="48" height="22" rx="4" fill="#F7F8FB" stroke="#9AA1AB" stroke-width="1.5"/><path d="M30 42h36M30 47h36M30 52h36" stroke="#D3D7DE" stroke-width="1.2"/>` +
    `<rect x="86" y="38" width="22" height="16" rx="3" fill="#2B2F36"/><circle cx="118" cy="46" r="3" fill="#FF6B7A"/>` +
    `<circle cx="160" cy="92" r="46" fill="#C3C8D0" stroke="#8D949E" stroke-width="2"/><circle cx="160" cy="92" r="36" fill="#2B2F36"/>` +
    `<circle cx="160" cy="92" r="24" fill="url(#lens)"/><ellipse cx="150" cy="82" rx="8" ry="5" fill="#fff" opacity=".55" transform="rotate(-30 150 82)"/>` +
    `<text x="24" y="138" ${SANS} font-size="10.5" letter-spacing="1.2" fill="#6B727C">DIGITAL 8.1MP</text>`,
    silverDefs() + rad('lens', '#6E7FA6', '#12151B')));

  add('flip-phone', 'Flip phone', 'y2k', 140, 270, svg(140, 270,
    `<rect x="18" y="6" width="100" height="122" rx="20" fill="url(#ph)" stroke="#C46B80" stroke-width="2"/>` +
    `<rect x="30" y="24" width="76" height="90" rx="7" fill="url(#scr)" stroke="#8E4558" stroke-width="1.5"/>` +
    `<path d="${heartP(68, 72, 0.09)}" fill="#fff" opacity=".9"/><path d="M36 32h4v4h-4zM42 30h4v6h-4zM48 28h4v8h-4z" fill="#fff"/><rect x="86" y="30" width="14" height="7" rx="1.5" fill="none" stroke="#fff" stroke-width="1.4"/>` +
    `<rect x="22" y="124" width="92" height="12" rx="6" fill="#E59AAA"/>` +
    `<rect x="18" y="132" width="100" height="128" rx="20" fill="url(#ph)" stroke="#C46B80" stroke-width="2"/>` +
    `<circle cx="68" cy="156" r="12" fill="#FBE3E9" stroke="#C46B80" stroke-width="1.5"/><circle cx="68" cy="156" r="4" fill="#C46B80"/>` +
    Array.from({ length: 12 }, (_, i) => `<rect x="${32 + (i % 3) * 26}" y="${178 + Math.floor(i / 3) * 18}" width="20" height="12" rx="5" fill="#fff" opacity=".85"/>`).join('') +
    `<path d="M116 30C128 40 130 56 124 70" fill="none" stroke="#C46B80" stroke-width="1.5"/><path d="${heartP(124, 82, 0.06)}" fill="#E5566F"/>` +
    `<path d="M28 18C40 12 54 12 64 14" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    lin('ph', '#FCD9E1', '#EFA3B4') + lin('scr', '#D3EDF9', '#9CC9E8')));

  (function () {
    const ring = circleP(100, 100, 92) + ' ' + circleP(100, 100, 15);
    add('cd', 'Holo CD', 'y2k', 200, 200, svg(200, 200,
      `<path d="${ring}" fill="url(#holo)" fill-rule="evenodd" stroke="#BFC5CE" stroke-width="1.5"/>` +
      `<g clip-path="url(#disc)"><path d="M100 100L40.9 29.5A92 92 0 0 1 84 9.4Z" fill="#fff" opacity=".45"/><path d="M100 100L159.1 170.5A92 92 0 0 1 116 190.6Z" fill="#fff" opacity=".45"/></g>` +
      `<circle cx="100" cy="100" r="34" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="10"/><circle cx="100" cy="100" r="22" fill="none" stroke="#C9CED6" stroke-width="1.5"/>`,
      `<linearGradient id="holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9D3E6"/><stop offset=".25" stop-color="#D3E5FA"/><stop offset=".5" stop-color="#DDF7D3"/><stop offset=".75" stop-color="#FAF0CF"/><stop offset="1" stop-color="#E2D3FA"/></linearGradient><clipPath id="disc"><path d="${ring}" clip-rule="evenodd"/></clipPath>`));
  })();

  add('rec', 'REC badge', 'y2k', 230, 76, svg(230, 76,
    `<rect x="4" y="4" width="222" height="68" rx="14" fill="rgba(20,20,26,.72)"/><circle cx="34" cy="38" r="11" fill="#FF3B4E"/>` +
    `<text x="54" y="48" ${MONO} font-size="27" font-weight="bold" letter-spacing="2" fill="#fff">REC</text>` +
    `<text x="128" y="46" ${MONO} font-size="18" fill="#fff">00:12:44</text>`));

  add('battery', 'Battery', 'y2k', 150, 74, svg(150, 74,
    `<rect x="6" y="8" width="122" height="58" rx="12" fill="rgba(0,0,0,.25)" stroke="#fff" stroke-width="6"/><rect x="130" y="26" width="12" height="22" rx="4" fill="#fff"/>` +
    `<rect x="20" y="20" width="28" height="34" rx="4" fill="#8DE3B5"/><rect x="54" y="20" width="28" height="34" rx="4" fill="#8DE3B5"/><rect x="88" y="20" width="28" height="34" rx="4" fill="#8DE3B5"/>`));

  (function () {
    const grid = ['..XX...XX..', '.XWWX.XRRX.', 'XWWRRXRRRRX', 'XWRRRRRRRRX', 'XRRRRRRRRRX', '.XRRRRRRRX.', '..XRRRRRX..', '...XRRRX...', '....XRX....', '.....X.....'];
    const col = { X: '#6E2A3A', R: '#F47A9A', W: '#FFFFFF' };
    let s = '';
    grid.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) s += `<rect x="${x * 14}" y="${y * 14}" width="14.4" height="14.4" fill="${col[ch]}"/>`; }));
    add('pixel-heart', '8-bit heart', 'y2k', 154, 140, svg(154, 140, s));
  })();

  add('chrome-heart', 'Chrome heart', 'y2k', 200, 180, svg(200, 180,
    `<path d="${heartP(100, 92, 0.6)}" fill="url(#chr)" stroke="#6F7782" stroke-width="3"/>` +
    `<path d="M46 70C50 50 66 42 82 46" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M126 52C140 48 152 54 156 66" stroke="#fff" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    at(150, 128, 0.22, 0, `<path d="${sparkleD}" fill="#fff"/>`), chromeDefs()));

  add('chrome-star', 'Chrome star', 'y2k', 180, 180, svg(180, 180,
    at(90, 90, 1.6, 0, `<path d="${sparkleD}" fill="url(#chr)" stroke="#6F7782" stroke-width="1.6"/>`) +
    at(90, 90, 0.5, 45, `<path d="${sparkleD}" fill="#fff" opacity=".85"/>`), chromeDefs()));

  add('popup', 'Love.exe', 'y2k', 280, 160, svg(280, 160,
    `<rect x="4" y="4" width="272" height="152" rx="8" fill="#F5F0FA" stroke="#8E7BB5" stroke-width="2"/>` +
    `<path d="M4 34V12a8 8 0 0 1 8-8h256a8 8 0 0 1 8 8v22Z" fill="url(#tb)"/>` +
    `<text x="14" y="24" ${SANS} font-size="13" font-weight="bold" fill="#fff">love.exe</text>` +
    [212, 233, 254].map((x, i) => `<rect x="${x - 8}" y="10" width="17" height="16" rx="3" fill="#fff" opacity=".92"/><text x="${x}" y="22.5" ${SANS} font-size="11" font-weight="bold" fill="#8E7BB5" text-anchor="middle">${['_', '□', '×'][i]}</text>`).join('') +
    `<path d="${heartP(40, 76, 0.1)}" fill="#F47A9A"/>` +
    `<text x="66" y="74" ${SANS} font-size="15" fill="#3A2C2A">you are so cute ♡</text><text x="66" y="94" ${SANS} font-size="11.5" fill="#8B746A">keep being you, ok?</text>` +
    `<rect x="104" y="114" width="72" height="28" rx="5" fill="#fff" stroke="#8E7BB5" stroke-width="1.5"/><text x="140" y="133" ${SANS} font-size="13" font-weight="bold" fill="#8E7BB5" text-anchor="middle">OK</text>`,
    lin('tb', '#F4A7C3', '#B9A7D6', false)));

  add('cursor', 'Cursor', 'y2k', 110, 130, svg(110, 130,
    `<path d="M10 8L10 100L34 78L52 118L68 110L50 72L82 72Z" fill="#fff" stroke="#1C1C21" stroke-width="5" stroke-linejoin="round"/>` +
    at(90, 22, 0.28, 0, `<path d="${sparkleD}" fill="#F47A9A"/>`)));

  add('smiley', 'Smiley', 'y2k', 160, 160, svg(160, 160,
    `<circle cx="80" cy="80" r="70" fill="#FFD84D" stroke="#E0A800" stroke-width="3"/><ellipse cx="56" cy="64" rx="8" ry="13" fill="#3A2C2A"/><ellipse cx="104" cy="64" rx="8" ry="13" fill="#3A2C2A"/>` +
    `<path d="M44 94C58 124 102 124 116 94" fill="none" stroke="#3A2C2A" stroke-width="6" stroke-linecap="round"/><ellipse cx="38" cy="92" rx="11" ry="7" fill="#F7A1B5" opacity=".8"/><ellipse cx="122" cy="92" rx="11" ry="7" fill="#F7A1B5" opacity=".8"/>`));

  (function () {
    const st = `stroke="#9C82D1" stroke-width="2" stroke-linejoin="round"`, fl = `fill="rgba(206,186,255,.55)"`;
    let glitter = '';
    const r = rng(17);
    for (let i = 0; i < 40; i++) glitter += `<circle cx="${f(25 + r() * 170)}" cy="${f(20 + r() * 140)}" r="${f(0.8 + r() * 1.6)}" fill="#fff" opacity="${f(0.5 + r() * 0.5)}"/>`;
    add('butterfly-clip', 'Butterfly clip', 'y2k', 220, 180, svg(220, 180,
      `<g clip-path="url(#bc)">${glitter}</g>` +
      `<path d="M106 96C70 98 40 118 46 146C54 170 90 152 106 108Z" ${fl} ${st}/><path d="M114 96C150 98 180 118 174 146C166 170 130 152 114 108Z" ${fl} ${st}/>` +
      `<path d="M106 88C80 30 30 12 18 42C8 68 40 98 104 98Z" ${fl} ${st}/><path d="M114 88C140 30 190 12 202 42C212 68 180 98 116 98Z" ${fl} ${st}/>` +
      `<g clip-path="url(#bc)">${glitter}</g>` +
      `<rect x="104" y="62" width="12" height="76" rx="6" fill="#B9A7D6" stroke="#9C82D1" stroke-width="1.5"/>`,
      `<clipPath id="bc"><path d="M106 96C70 98 40 118 46 146C54 170 90 152 106 108ZM114 96C150 98 180 118 174 146C166 170 130 152 114 108ZM106 88C80 30 30 12 18 42C8 68 40 98 104 98ZM114 88C140 30 190 12 202 42C212 68 180 98 116 98Z"/></clipPath>`));
  })();

  add('y2k-sparkles', 'Y2K sparkles', 'y2k', 200, 200, svg(200, 200,
    at(84, 108, 1.3, 0, `<path d="${sparkleD}" fill="url(#chr)" stroke="#6F7782" stroke-width="1.4"/>`) +
    at(158, 50, 0.5, 0, `<path d="${sparkleD}" fill="#9CC9FF"/>`) +
    `<path d="M160 140v24M148 152h24M38 30v18M29 39h18" stroke="#9CC9FF" stroke-width="5" stroke-linecap="round"/>`, chromeDefs()));

  add('music-notes', 'Music notes', 'y2k', 160, 160, svg(160, 160,
    `<path d="M58 118V36L132 22V104" fill="none" stroke="#E5566F" stroke-width="8" stroke-linejoin="round"/><path d="M58 36L132 22V40L58 54Z" fill="#E5566F"/>` +
    `<ellipse cx="44" cy="120" rx="18" ry="13" fill="#E5566F" transform="rotate(-20 44 120)"/><ellipse cx="118" cy="106" rx="18" ry="13" fill="#E5566F" transform="rotate(-20 118 106)"/>` +
    `<ellipse cx="38" cy="114" rx="5" ry="3" fill="#fff" opacity=".6" transform="rotate(-20 38 114)"/>`));

  /* ---- coquette ---- */
  (function () {
    const top = heartPts(120, 86, 4.3, 40), bot = heartPts(120, 108, 4.3, 40);
    let layers = '';
    for (let dy = 22; dy > 0; dy -= 2) layers += `<path d="${heartPts(120, 86 + dy, 4.3, 1).poly}" fill="#E8A0B0"/>`;
    const beads = (ps, col) => ps.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="5.2" fill="${col}" stroke="#EFB3C1" stroke-width=".8"/>`).join('');
    add('heart-cake', 'Heart cake', 'coquette', 240, 200, svg(240, 200,
      layers + beads(bot.pts.filter(p => p[1] > 120), '#FFF6F8') +
      `<path d="${top.poly}" fill="#F9CFD8"/>` + beads(top.pts, '#FFFFFF') +
      `<text x="120" y="100" ${SERIF} font-style="italic" font-size="28" fill="#C2485F" text-anchor="middle">love</text>` +
      `<circle cx="84" cy="40" r="9" fill="url(#ck)"/><circle cx="156" cy="40" r="9" fill="url(#ck)"/><path d="M84 31C86 22 92 18 98 16M156 31C154 22 148 18 142 16" stroke="#5B6B3E" stroke-width="2" fill="none"/>`,
      rad('ck', '#F26A80', '#A81E3A')));
  })();

  (function () {
    const r = rng(2);
    let seeds = '';
    for (let i = 0; i < 22; i++) { const x = 40 + r() * 60, y = 64 + r() * 74; seeds += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.8" ry="3" fill="#FCE8A0" transform="rotate(${f((x - 70) * 0.8)} ${f(x)} ${f(y)})"/>`; }
    add('strawberry', 'Strawberry', 'coquette', 140, 170, svg(140, 170,
      `<path d="M70 160C30 140 14 90 22 62C30 40 52 38 70 44C88 38 110 40 118 62C126 90 110 140 70 160Z" fill="url(#sb)" stroke="#9E1B32" stroke-width="2"/>` + seeds +
      `<path d="M70 48L50 30L62 44L40 46L60 52L52 62L70 54L88 62L80 52L100 46L78 44L90 30Z" fill="#7FA35B" stroke="#4E6B35" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<path d="M70 44C70 32 74 20 80 12" stroke="#4E6B35" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="76" rx="6" ry="12" fill="#fff" opacity=".35" transform="rotate(20 44 76)"/>`,
      rad('sb', '#FF6F85', '#C51F3E')));
  })();

  add('teacup', 'Teacup', 'coquette', 220, 170, svg(220, 170,
    `<ellipse cx="105" cy="146" rx="90" ry="18" fill="#FFFDF8" stroke="${C.gold}" stroke-width="2"/><ellipse cx="105" cy="143" rx="50" ry="8" fill="none" stroke="${C.gold}" stroke-width="1.2"/>` +
    `<path d="M168 76C202 70 204 114 160 116" fill="none" stroke="${C.gold}" stroke-width="13" stroke-linecap="round"/><path d="M168 76C202 70 204 114 160 116" fill="none" stroke="#FFFDF8" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M40 60H170C170 120 140 142 105 142C70 142 40 120 40 60Z" fill="#FFFDF8" stroke="${C.gold}" stroke-width="2"/>` +
    `<ellipse cx="105" cy="60" rx="65" ry="12" fill="#C99A6B" stroke="${C.gold}" stroke-width="2.5"/><ellipse cx="96" cy="58" rx="20" ry="3" fill="#fff" opacity=".35"/>` +
    at(78, 100, 0.22, 0, rose()) + at(132, 104, 0.18, 0, rose(...H.ROSE_BLUSH)) + at(104, 116, 0.3, 0, leaf()) + at(102, 112, 0.3, 180, leaf()) +
    `<path d="M150 82C156 96 156 112 148 124" stroke="${C.gold}" stroke-width="1.5" fill="none"/>` +
    `<path d="M88 40C80 30 96 24 88 12M112 42C104 30 120 24 112 10" fill="none" stroke="#D9CFC4" stroke-width="3" stroke-linecap="round"/>`));

  (function () {
    const b = bowAt('pb', 75, 62, 0.34, ...BOW_PINK);
    add('perfume', 'Perfume', 'coquette', 150, 210, svg(150, 210,
      `<rect x="56" y="22" width="38" height="28" rx="6" fill="url(#gl)" stroke="${C.goldD}" stroke-width="1.5"/>` +
      `<rect x="64" y="46" width="22" height="18" fill="#F6D2DA" stroke="#C46B80" stroke-width="1.5"/>` +
      `<rect x="20" y="62" width="110" height="138" rx="22" fill="rgba(247,190,205,.7)" stroke="#C46B80" stroke-width="2"/>` +
      `<rect x="30" y="74" width="16" height="110" rx="8" fill="#fff" opacity=".45"/>` +
      `<rect x="40" y="118" width="70" height="44" rx="4" fill="#FFF8F1" stroke="${C.gold}" stroke-width="1.2"/>` +
      `<text x="75" y="138" ${SERIF} font-style="italic" font-size="14" fill="${C.wine}" text-anchor="middle">eau de</text><text x="75" y="154" ${SERIF} font-size="11" letter-spacing="3" fill="${C.wine}" text-anchor="middle">ROSE</text>` +
      b.body, goldDefs('gl') + b.defs));
  })();

  add('kiss', 'Kiss mark', 'coquette', 200, 130, svg(200, 130,
    `<path d="M20 64C40 40 70 28 90 44C96 48 100 50 100 50C100 50 104 48 110 44C130 28 160 40 180 64C150 70 130 72 100 70C70 72 50 70 20 64Z" fill="#C8174F"/>` +
    `<path d="M20 66C50 74 70 76 100 74C130 76 150 74 180 66C160 102 130 118 100 118C70 118 40 102 20 66Z" fill="#C8174F"/>` +
    `<g stroke="#fff" stroke-opacity=".28" stroke-width="2" fill="none" stroke-linecap="round"><path d="M60 50C62 56 62 62 60 66M80 44C82 52 82 60 80 66M120 44C118 52 118 60 120 66M140 50C138 56 138 62 140 66"/><path d="M50 84C54 94 56 100 56 106M76 82C78 94 78 104 76 112M100 82V114M124 82C122 94 122 104 124 112M150 84C146 94 144 100 144 106"/></g>`));

  (function () {
    const b = bowAt('sw', 80, 102, 0.24, ...BOW_PINK);
    add('swan', 'Swan', 'coquette', 220, 200, svg(220, 200,
      `<path d="M30 176C60 168 90 184 120 176S180 168 200 178" fill="none" stroke="#9CC9E8" stroke-width="3" stroke-linecap="round"/><path d="M50 190C80 184 110 194 150 188" fill="none" stroke="#BFDDF0" stroke-width="2.5" stroke-linecap="round"/>` +
      `<path d="M80 114C64 84 96 64 84 40C78 28 62 26 54 36" fill="none" stroke="#D8D2CC" stroke-width="20" stroke-linecap="round"/>` +
      `<path d="M80 114C64 84 96 64 84 40C78 28 62 26 54 36" fill="none" stroke="#fff" stroke-width="15" stroke-linecap="round"/>` +
      `<path d="M40 150C40 118 70 104 110 108C130 110 150 118 172 112C190 106 198 92 194 80C210 98 206 134 180 154C150 174 70 176 40 150Z" fill="#fff" stroke="#D8D2CC" stroke-width="2.5"/>` +
      `<path d="M100 124C120 120 150 128 168 120M110 140C130 136 150 140 166 134" fill="none" stroke="#E4DED8" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M50 32L30 40L50 44Z" fill="#F2994A"/><circle cx="58" cy="34" r="2.5" fill="#3A2C2A"/>` + b.body, b.defs));
  })();

  (function () {
    const b = bowParts('bpl', ...BOW_CREAM);
    let pearls = '';
    [[96, 112, 70, 186], [124, 112, 150, 186]].forEach(([x0, y0, x1, y1]) => { for (let i = 0; i <= 6; i++) pearls += pearl(x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6 + Math.sin(i / 6 * Math.PI) * 8, 6); });
    add('bow-pearl', 'Pearl bow', 'coquette', 220, 200, svg(220, 200, b.body + pearls + pearl(110, 89, 9), b.defs + pearlDefs()));
  })();

  /* ---- florals ---- */
  (function () {
    const petal = `<path d="M0 0C-8-8-9-19-4-24L0-20L4-24C9-19 8-8 0 0Z" fill="#F9C6D3" stroke="#E79AB0" stroke-width="1"/>`;
    const flower = s => at(0, 0, 1, 0, [0, 72, 144, 216, 288].map(a => `<g transform="rotate(${a})">${petal}</g>`).join('') + `<circle r="4" fill="#E5566F"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="${f(Math.cos((a - 90) * Math.PI / 180) * 7)}" cy="${f(Math.sin((a - 90) * Math.PI / 180) * 7)}" r="1.4" fill="#C2485F"/>`).join('')}`);
    let s = `<path d="M10 150C60 140 110 120 160 96C200 78 240 70 290 62M120 126C130 100 150 80 170 66M200 82C214 100 230 110 256 114M70 140C76 160 90 168 110 172" fill="none" stroke="#6B4A3A" stroke-width="5" stroke-linecap="round"/>`;
    [[96, 128, 1], [164, 92, 1.1], [174, 60, 0.85], [228, 72, 1], [262, 112, 0.8], [282, 60, 0.75], [112, 170, 0.8], [60, 136, 0.7]].forEach(([x, y, sc]) => s += at(x, y, sc, x * 3, flower()));
    [[140, 112], [210, 78], [246, 64], [130, 80]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="5" fill="#F4A9BC" stroke="#E79AB0"/>`);
    add('cherry-blossom', 'Cherry blossom', 'florals', 300, 190, svg(300, 190, s));
  })();

  (function () {
    let s = '';
    for (let i = 0; i < 20; i++) s += `<ellipse cx="100" cy="46" rx="10" ry="30" fill="${i % 2 ? '#F6C445' : '#F9D35E'}" stroke="#D99A1E" stroke-width="1" transform="rotate(${i * 18 + 9} 100 100)"/>`;
    for (let i = 0; i < 20; i++) s += `<ellipse cx="100" cy="50" rx="10" ry="28" fill="#FBD658" stroke="#D99A1E" stroke-width="1" transform="rotate(${i * 18} 100 100)"/>`;
    const r = rng(8);
    let dots = '';
    for (let i = 0; i < 60; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 30; dots += `<circle cx="${f(100 + Math.cos(a) * d)}" cy="${f(100 + Math.sin(a) * d)}" r="1.8" fill="#3D2614" opacity=".7"/>`; }
    add('sunflower', 'Sunflower', 'florals', 200, 200, svg(200, 200, s + `<circle cx="100" cy="100" r="34" fill="#6B4423" stroke="#4A2E17" stroke-width="2"/>` + dots));
  })();

  (function () {
    const fl = (x, y, s) => at(x, y, s, x, [0, 72, 144, 216, 288].map(a => `<circle cx="${f(Math.cos((a - 90) * Math.PI / 180) * 7)}" cy="${f(Math.sin((a - 90) * Math.PI / 180) * 7)}" r="6.5" fill="#8DB6E8" stroke="#5F8FCB" stroke-width=".8"/>`).join('') + `<circle r="3.6" fill="#F7E07A" stroke="#fff" stroke-width="1"/>`);
    let s = at(40, 120, 1.0, -160, leaf()) + at(140, 118, 1.0, -20, leaf()) + at(90, 150, 0.9, 90, leaf());
    [[60, 70, 1.2], [92, 52, 1.1], [124, 72, 1.15], [78, 98, 1.05], [110, 102, 1.2], [140, 96, 0.9], [46, 96, 0.9], [96, 76, 0.8]].forEach(([x, y, sc]) => s += fl(x, y, sc));
    add('forget-me-not', 'Forget-me-nots', 'florals', 180, 170, svg(180, 170, s));
  })();

  (function () {
    let s = at(60, 140, 1.15, 150, leaf()) + at(160, 140, 1.15, 30, leaf()) + at(96, 160, 0.8, 115, leaf());
    ringPts(110, 100, 62, 56, 11).forEach(([x, y]) => s += `<circle cx="${f(x)}" cy="${f(y)}" r="30" fill="#F8D3DC" stroke="#E2A0B2" stroke-width="1.4"/>`);
    ringPts(110, 100, 40, 36, 9, 0.3).forEach(([x, y]) => s += `<circle cx="${f(x)}" cy="${f(y)}" r="25" fill="#F5BFCD" stroke="#DB8FA4" stroke-width="1.4"/>`);
    ringPts(110, 100, 18, 16, 7, 0.6).forEach(([x, y]) => s += `<circle cx="${f(x)}" cy="${f(y)}" r="18" fill="#F0A9BC" stroke="#D27F96" stroke-width="1.4"/>`);
    s += `<path d="M98 96C104 86 118 88 120 98C122 108 108 114 100 108" fill="none" stroke="#C26A84" stroke-width="2.4" stroke-linecap="round"/>`;
    add('peony', 'Peony', 'florals', 220, 200, svg(220, 200, s));
  })();

  (function () {
    const r = rng(23);
    let s = '';
    [[70, 236, 40, 40], [70, 236, 96, 30], [70, 236, 66, 70], [70, 236, 30, 110], [70, 236, 112, 96]].forEach(([x0, y0, x1, y1]) => {
      s += `<path d="M${x0} ${y0}Q${(x0 + x1) / 2 + 6} ${(y0 + y1) / 2} ${x1} ${y1}" stroke="#93A273" stroke-width="2" fill="none"/>`;
      for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = r() * 16; const px = x1 + Math.cos(a) * d, py = y1 + Math.sin(a) * d; s += `<path d="M${x1} ${y1}L${f(px)} ${f(py)}" stroke="#A7B386" stroke-width="1"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(3 + r() * 1.5)}" fill="#FFFDF8" stroke="#E0D4C2" stroke-width=".8"/>`; }
    });
    add('babys-breath', "Baby's breath", 'florals', 140, 240, svg(140, 240, s));
  })();

  /* ---- vintage ---- */
  (function () {
    let grooves = '';
    for (let r = 40; r < 92; r += 5) grooves += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="#3A3A3E" stroke-width="1"/>`;
    add('vinyl', 'Vinyl record', 'vintage', 200, 200, svg(200, 200,
      `<path d="${circleP(100, 100, 94)} ${circleP(100, 100, 4)}" fill="#141416" fill-rule="evenodd"/>` + grooves +
      `<path d="M100 100L44 28A94 94 0 0 1 86 7Z" fill="#fff" opacity=".1"/><path d="M100 100L156 172A94 94 0 0 1 114 193Z" fill="#fff" opacity=".1"/>` +
      `<path d="${circleP(100, 100, 32)} ${circleP(100, 100, 4)}" fill="#E7A3B0" fill-rule="evenodd"/>` +
      `<text x="100" y="92" ${SERIF} font-style="italic" font-size="10" fill="${C.wine}" text-anchor="middle">side A</text><text x="100" y="116" ${SERIF} font-size="7" letter-spacing="1.5" fill="${C.wine}" text-anchor="middle">33 ⅓ RPM</text>`));
  })();

  add('film-camera', 'Film camera', 'vintage', 250, 170, svg(250, 170,
    `<rect x="28" y="12" width="40" height="16" rx="4" fill="#C9CED6" stroke="#6F7782"/><rect x="176" y="8" width="30" height="20" rx="5" fill="#C9CED6" stroke="#6F7782"/><rect x="100" y="4" width="50" height="26" rx="4" fill="#D3D7DE" stroke="#6F7782"/>` +
    `<rect x="8" y="26" width="234" height="40" rx="8" fill="url(#sil)" stroke="#6F7782" stroke-width="2"/>` +
    `<rect x="8" y="60" width="234" height="96" rx="10" fill="#2A2627" stroke="#141213" stroke-width="2"/>` +
    `<path d="M8 66h234" stroke="#6F7782" stroke-width="2"/>` +
    `<circle cx="125" cy="100" r="46" fill="#C9CED6" stroke="#6F7782" stroke-width="2"/><circle cx="125" cy="100" r="36" fill="#1C1C21"/><circle cx="125" cy="100" r="24" fill="url(#lens2)"/><ellipse cx="114" cy="90" rx="8" ry="5" fill="#fff" opacity=".5" transform="rotate(-30 114 90)"/>` +
    `<rect x="26" y="36" width="26" height="18" rx="3" fill="#3A3A40"/><rect x="198" y="36" width="26" height="18" rx="3" fill="#3A3A40"/>` +
    `<text x="125" y="22" ${SANS} font-size="8" letter-spacing="1" fill="#6F7782" text-anchor="middle">35mm</text>`,
    silverDefs() + rad('lens2', '#7A6E9E', '#0E0F14')));

  add('instant-camera', 'Instant camera', 'vintage', 210, 200, svg(210, 200,
    `<rect x="10" y="22" width="190" height="166" rx="26" fill="#FBF3E6" stroke="#B8A893" stroke-width="2"/>` +
    `<rect x="10" y="22" width="190" height="62" rx="26" fill="#F3E3CF"/><rect x="10" y="60" width="190" height="24" fill="#F3E3CF"/>` +
    `<rect x="96" y="22" width="18" height="166" fill="#F4A7C3"/>` +
    `<rect x="26" y="34" width="46" height="30" rx="6" fill="#F9FAFC" stroke="#B8A893"/><rect x="146" y="34" width="34" height="26" rx="5" fill="#2B2F36"/>` +
    `<circle cx="105" cy="118" r="46" fill="#E9DCC9" stroke="#B8A893" stroke-width="2"/><circle cx="105" cy="118" r="34" fill="#2B2F36"/><circle cx="105" cy="118" r="22" fill="url(#lens3)"/><ellipse cx="96" cy="108" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-30 96 108)"/>` +
    `<rect x="40" y="176" width="130" height="5" rx="2.5" fill="#B8A893"/><circle cx="176" cy="160" r="8" fill="#E5566F"/>`,
    rad('lens3', '#6E7FA6', '#12151B')));

  add('key', 'Antique key', 'vintage', 230, 100, svg(230, 100,
    `<path d="${circleP(46, 50, 36)} ${circleP(46, 50, 18)}" fill="url(#kg)" fill-rule="evenodd" stroke="${C.goldD}" stroke-width="2"/>` +
    `<circle cx="46" cy="50" r="27" fill="none" stroke="${C.goldD}" stroke-width="1.2" stroke-dasharray="3 3"/>` +
    `<rect x="80" y="44" width="134" height="12" rx="3" fill="url(#kg)" stroke="${C.goldD}" stroke-width="1.5"/>` +
    `<path d="M178 56V82H192V70H200V82H214V56Z" fill="url(#kg)" stroke="${C.goldD}" stroke-width="1.5"/>` +
    `<rect x="94" y="40" width="8" height="20" rx="2" fill="url(#kg)" stroke="${C.goldD}"/>`, goldDefs('kg')));

  add('paperclip', 'Paperclip', 'vintage', 70, 170, svg(70, 170,
    `<path d="M48 40V128A16 16 0 0 1 16 128V26A12 12 0 0 1 40 26V116A6 6 0 0 1 28 116V44" fill="none" stroke="url(#pc)" stroke-width="5" stroke-linecap="round"/>`, goldDefs('pc')));

  add('gift-tag', 'Gift tag', 'vintage', 170, 230, svg(170, 230,
    `<path d="M66 50C40 30 50 4 76 8C100 12 100 40 84 54" fill="none" stroke="#B08B61" stroke-width="2.5"/>` +
    `<path d="M40 64L84 40L128 64V214H40Z" fill="#CDA77F" stroke="#9E7B55" stroke-width="2" stroke-linejoin="round"/>` +
    `<circle cx="84" cy="66" r="8" fill="#FFF8EE" stroke="#9E7B55" stroke-width="2"/>` +
    `<text x="84" y="140" ${SERIF} font-style="italic" font-size="26" fill="#5B3A2E" text-anchor="middle">for you</text>` +
    `<path d="${heartP(84, 170, 0.07)}" fill="#A94F63"/>`));

  add('newspaper', 'Newspaper clip', 'vintage', 270, 190, svg(270, 190,
    `<path d="${tornP(8, 8, 254, 174, 3, 31, 7)}" fill="rgba(70,45,30,.12)" transform="translate(2 3)"/><path d="${tornP(8, 8, 254, 174, 3, 31, 7)}" fill="#EFE8DA"/>` +
    `<text x="135" y="40" ${SERIF} font-weight="bold" font-size="22" fill="#2B2422" text-anchor="middle">The Daily Romance</text>` +
    `<path d="M22 48H248M22 52H248" stroke="#2B2422" stroke-width="1"/>` +
    `<text x="135" y="64" ${SERIF} font-size="8" letter-spacing="2" fill="#5B4A44" text-anchor="middle">VOL. XIV · ${now.getFullYear()} · ONE PENNY</text>` +
    `<rect x="22" y="74" width="90" height="70" fill="#CFC6B6"/><path d="M30 134L56 104L74 122L88 110L106 134Z" fill="#B3A894"/>` +
    Array.from({ length: 8 }, (_, i) => `<path d="M122 ${80 + i * 9}H${i === 7 ? 200 : 248}" stroke="#9D9384" stroke-width="2.4"/>`).join('') +
    Array.from({ length: 3 }, (_, i) => `<path d="M22 ${156 + i * 8}H${i === 2 ? 160 : 248}" stroke="#9D9384" stroke-width="2.4"/>`).join('')));

  add('film-roll', 'Film roll', 'vintage', 150, 180, svg(150, 180,
    `<path d="M92 64H140V120H124L116 128L108 120H92Z" fill="#3A2A20"/>` +
    Array.from({ length: 3 }, (_, i) => `<rect x="${100 + i * 13}" y="68" width="7" height="8" rx="1.5" fill="#EFE8DA"/><rect x="${100 + i * 13}" y="108" width="7" height="8" rx="1.5" fill="#EFE8DA"/>`).join('') +
    `<rect x="18" y="26" width="76" height="134" rx="8" fill="url(#can)" stroke="#9A773A" stroke-width="2"/>` +
    `<rect x="26" y="12" width="60" height="16" rx="4" fill="url(#sil)" stroke="#6F7782"/><rect x="40" y="4" width="32" height="10" rx="3" fill="#C9CED6" stroke="#6F7782"/><rect x="26" y="158" width="60" height="12" rx="4" fill="url(#sil)" stroke="#6F7782"/>` +
    `<rect x="18" y="70" width="76" height="46" fill="#C2485F"/><text x="56" y="92" ${SANS} font-weight="bold" font-size="14" fill="#fff" text-anchor="middle">FILM</text><text x="56" y="108" ${SANS} font-size="10" letter-spacing="2" fill="#fff" text-anchor="middle">400 · 36</text>`,
    lin('can', '#F6CD45', '#E0A820', false) + silverDefs()));

  /* =====================================================================
     FRAMES
     ===================================================================== */
  const CATS = {
    polaroid: 'classic', 'polaroid-blush': 'coquette', gilded: 'vintage', cameo: 'coquette', film: 'vintage', 'film-35': 'vintage',
    'floral-oval': 'coquette', 'bow-oval': 'coquette', arch: 'vintage', heart: 'coquette', gingham: 'coquette', stamp: 'vintage',
    torn: 'vintage', corners: 'classic', doily: 'coquette', booth: 'classic', nowplaying: 'y2k'
  };
  A.FRAMES.forEach(fr => { fr.cat = CATS[fr.id] || 'classic'; });
  const frame = (id, name, cat, w, h, holes, body, defs = '', opts = {}) => A.FRAMES.push({ id, name, cat, w, h, holes, svg: svg(w, h, body, defs), ...opts });
  const cut = (outer, holes, fill, extra = '') => `<path d="${outer} ${holes.join(' ')}" fill="${fill}" fill-rule="evenodd" ${extra}/>`;
  const battery = (x, y) => `<rect x="${x}" y="${y}" width="28" height="13" rx="2" fill="none" stroke="#fff" stroke-width="2"/><rect x="${x + 28}" y="${y + 4}" width="3" height="5" fill="#fff"/><rect x="${x + 3}" y="${y + 3}" width="6" height="7" fill="#fff"/><rect x="${x + 11}" y="${y + 3}" width="6" height="7" fill="#fff"/><rect x="${x + 19}" y="${y + 3}" width="6" height="7" fill="#fff"/>`;
  const dateStamp = (x, y, size = 20) => `<text x="${x}" y="${y}" ${MONO} font-weight="bold" font-size="${size}" fill="#FF8A1F" text-anchor="end" stroke="#B4500A" stroke-width=".6">${DIGI_DATE}</text>`;

  /* --- digicam & Y2K --- */
  (function () {
    const hole = rectP(14, 14, 372, 272, 6);
    frame('digi-lcd', 'Digicam screen', 'y2k', 400, 300, [hole],
      cut(rectP(0, 0, 400, 300, 16), [hole], '#1C1C21') +
      `<path d="M36 66V36H66M334 36H364V66M364 234V264H334M66 264H36V234" fill="none" stroke="#fff" stroke-width="3" opacity=".9"/>` +
      `<rect x="182" y="132" width="36" height="36" fill="none" stroke="#7CFC9A" stroke-width="2"/>` +
      `<circle cx="80" cy="47" r="6" fill="#FF3B4E"/><text x="92" y="52" ${MONO} font-weight="bold" font-size="15" fill="#fff">REC</text>` +
      battery(318, 40) +
      `<text x="50" y="256" ${MONO} font-size="11" fill="#fff" opacity=".9">ISO 100  F2.8  1/60</text>` + dateStamp(352, 258));
  })();

  /* camcorder viewfinder overlays (MiniDV / VHS era) — white HUD with a soft dark edge so it reads on any photo */
  (function () {
    const hole = rectP(14, 14, 372, 272, 6);
    const HUD = `${MONO} font-weight="bold" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"`;
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateLine = `${MONTHS[now.getMonth()]}. ${DD} ${now.getFullYear()}`;
    const h12 = now.getHours() % 12 || 12, timeLine = `${h12}:${p2(now.getMinutes())} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const body = cut(rectP(0, 0, 400, 300, 16), [hole], '#141417') +
      `<text x="40" y="256" ${HUD} font-size="16">${dateLine}</text>` +
      `<text x="360" y="256" ${HUD} font-size="16" text-anchor="end">${timeLine}</text>`;

    frame('camcorder', 'Camcorder play', 'y2k', 400, 300, [hole], body +
      `<text x="40" y="54" ${HUD} font-size="18">PLAY ▶</text>` +
      `<text x="40" y="78" ${HUD} font-size="14">SP</text>` +
      `<text x="360" y="54" ${HUD} font-size="18" text-anchor="end">0:03:27</text>` +
      battery(330, 66) +
      `<path d="M188 150H212M200 138V162" stroke="#fff" stroke-width="2" opacity=".75"/>`);

    frame('camcorder-rec', 'Camcorder REC', 'y2k', 400, 300, [hole], body +
      `<circle cx="47" cy="48" r="7" fill="#FF3B4E"/><text x="60" y="54" ${HUD} font-size="18">REC</text>` +
      `<text x="40" y="78" ${HUD} font-size="14">SP  ▣ AUTO</text>` +
      `<text x="360" y="54" ${HUD} font-size="18" text-anchor="end">0:00:42</text>` +
      battery(330, 66) +
      `<text x="132" y="228" ${HUD} font-size="13">W</text><text x="268" y="228" ${HUD} font-size="13" text-anchor="end">T</text>` +
      `<rect x="146" y="218" width="104" height="8" fill="none" stroke="#fff" stroke-width="1.5"/><rect x="146" y="218" width="38" height="8" fill="#fff"/>` +
      `<path d="M60 110V96H74M326 96H340V110M340 190V204H326M74 204H60V190" fill="none" stroke="#fff" stroke-width="2.5" opacity=".85"/>`);
  })();

  (function () {
    const hole = rectP(34, 38, 300, 226, 6);
    const btn = (x, y, label) => `<rect x="${x}" y="${y}" width="40" height="18" rx="9" fill="#E6E9EE" stroke="#8D949E" stroke-width="1.2"/><text x="${x + 20}" y="${y + 12.5}" ${SANS} font-size="8.5" font-weight="bold" fill="#6B727C" text-anchor="middle">${label}</text>`;
    frame('digicam-body', 'Digital camera', 'y2k', 480, 320, [hole],
      cut(rectP(0, 0, 480, 320, 26), [hole], 'url(#sil)', `stroke="#8D949E" stroke-width="2"`) +
      `<rect x="28" y="32" width="312" height="238" rx="9" fill="none" stroke="#2B2F36" stroke-width="7"/>` +
      `<circle cx="412" cy="150" r="40" fill="#CDD1D8" stroke="#8D949E" stroke-width="1.5"/><circle cx="412" cy="150" r="15" fill="#EEF0F4" stroke="#8D949E"/>` +
      `<path d="M412 116l-6 8h12zM412 184l-6-8h12zM378 150l8-6v12zM446 150l-8-6v12z" fill="#8D949E"/>` +
      btn(370, 62, 'MENU') + btn(414, 62, 'DISP') + btn(370, 222, '▶') + btn(414, 222, 'DEL') +
      `<text x="36" y="298" ${SANS} font-size="10" letter-spacing="1.5" fill="#6B727C">DIGITAL CAMERA · 8.1 MEGA PIXELS</text>` +
      battery(292, 48) + `<text x="46" y="60" ${MONO} font-weight="bold" font-size="12" fill="#fff">▣ 8M</text>` + dateStamp(322, 252, 18),
      silverDefs(), { shadow: true });
  })();

  (function () {
    const hole = rectP(34, 62, 192, 240, 6);
    frame('flip-phone', 'Flip phone', 'y2k', 260, 440, [hole],
      cut(rectP(4, 4, 252, 432, 40), [hole], 'url(#fp)', `stroke="#C46B80" stroke-width="2"`) +
      `<rect x="28" y="56" width="204" height="252" rx="11" fill="none" stroke="#3A2C2A" stroke-width="6"/>` +
      `<rect x="100" y="26" width="60" height="8" rx="4" fill="#C46B80" opacity=".6"/>` +
      `<path d="M44 82h4v6h-4zM51 79h4v9h-4zM58 76h4v12h-4z" fill="#fff"/>` + battery(188, 74) +
      `<text x="130" y="86" ${SANS} font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">12:34</text>` +
      `<rect x="52" y="352" width="40" height="14" rx="7" fill="#FBE3E9" stroke="#C46B80"/><rect x="168" y="352" width="40" height="14" rx="7" fill="#FBE3E9" stroke="#C46B80"/>` +
      `<circle cx="130" cy="372" r="26" fill="#F9D2DB" stroke="#C46B80" stroke-width="1.5"/><circle cx="130" cy="372" r="9" fill="#C46B80"/>` +
      `<path d="${heartP(226, 410, 0.05)}" fill="#E5566F"/>` + at(46, 332, 0.16, 0, `<path d="${sparkleD}" fill="#fff"/>`),
      lin('fp', '#FCD9E1', '#EFA3B4'), { shadow: true });
  })();

  (function () {
    const hole = rectP(14, 46, 392, 236);
    frame('y2k-window', 'Y2K window', 'y2k', 420, 340, [hole],
      cut(rectP(0, 0, 420, 340, 10), [hole], '#F5F0FA', `stroke="#8E7BB5" stroke-width="2"`) +
      `<path d="M0 38V10A10 10 0 0 1 10 0H410A10 10 0 0 1 420 10V38Z" fill="url(#wt)"/>` +
      `<text x="16" y="25" ${SANS} font-size="14" font-weight="bold" fill="#fff">my_favorite_memory.jpg</text>` +
      [344, 368, 392].map((x, i) => `<rect x="${x - 10}" y="9" width="20" height="19" rx="3" fill="#fff" opacity=".92"/><text x="${x}" y="23" ${SANS} font-size="12" font-weight="bold" fill="#8E7BB5" text-anchor="middle">${['_', '□', '×'][i]}</text>`).join('') +
      `<path d="${hole}" fill="none" stroke="#8E7BB5" stroke-width="1.5"/>` +
      `<text x="16" y="316" ${SANS} font-size="11" fill="#8B746A">100% loaded ♡</text>` +
      `<rect x="300" y="296" width="104" height="30" rx="6" fill="#fff" stroke="#8E7BB5" stroke-width="1.5"/><text x="352" y="316" ${SANS} font-size="13" font-weight="bold" fill="#8E7BB5" text-anchor="middle">OK ♡</text>`,
      lin('wt', '#F4A7C3', '#B9A7D6', false), { shadow: true });
  })();

  (function () {
    const hole = rectP(30, 30, 200, 170, 8);
    frame('mp3', 'MP3 player', 'y2k', 260, 440, [hole],
      cut(rectP(4, 4, 252, 432, 30), [hole], 'url(#mp)', `stroke="#D6D9DF" stroke-width="2"`) +
      `<rect x="26" y="26" width="208" height="178" rx="11" fill="none" stroke="#2B2F36" stroke-width="5"/>` +
      `<rect x="30" y="176" width="200" height="24" fill="rgba(0,0,0,.38)"/><text x="40" y="192" ${SANS} font-size="10" fill="#fff">♫ our song</text><rect x="120" y="186" width="100" height="3" rx="1.5" fill="rgba(255,255,255,.4)"/><rect x="120" y="186" width="44" height="3" rx="1.5" fill="#fff"/>` +
      `<circle cx="130" cy="318" r="84" fill="#F4C7CF" stroke="#E3A7B4" stroke-width="1.5"/><circle cx="130" cy="318" r="30" fill="url(#mp)" stroke="#E3A7B4" stroke-width="1.5"/>` +
      `<text x="130" y="258" ${SANS} font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">MENU</text><text x="130" y="390" ${SANS} font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">▶❚❚</text>` +
      `<text x="70" y="323" ${SANS} font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">◀◀</text><text x="190" y="323" ${SANS} font-size="12" font-weight="bold" fill="#fff" text-anchor="middle">▶▶</text>`,
      lin('mp', '#FFFFFF', '#E9ECF1'), { shadow: true });
  })();

  (function () {
    const hole = starP(170, 178, 132, 66);
    frame('star-window', 'Star window', 'y2k', 340, 340, [hole],
      cut(starP(170, 178, 168, 92), [hole], 'url(#chr)', `stroke="#6F7782" stroke-width="2" stroke-linejoin="round"`) +
      `<path d="${starP(170, 178, 150, 79)}" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" opacity=".9"/>` +
      `<path d="${hole}" fill="none" stroke="#6F7782" stroke-width="2" stroke-linejoin="round"/>` +
      at(296, 40, 0.3, 0, `<path d="${sparkleD}" fill="#9CC9FF"/>`) + at(40, 300, 0.22, 0, `<path d="${sparkleD}" fill="#F4A7C3"/>`),
      chromeDefs());
  })();

  /* --- classic --- */
  (function () {
    const hole = rectP(18, 24, 204, 276, 2);
    frame('mini-instant', 'Mini instant', 'classic', 240, 380, [hole],
      cut(rectP(0, 0, 240, 380, 5), [hole], '#FFFFFF') + `<path d="${hole}" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2"/>` +
      at(206, 346, 0.14, 0, `<path d="${sparkleD}" fill="${C.rose}"/>`), '', { shadow: true });
  })();
  (function () {
    const hole = rectP(20, 22, 260, 260);
    frame('polaroid-tape', 'Taped polaroid', 'classic', 300, 370, [hole],
      cut(rectP(0, 10, 300, 360, 3), [hole], '#FFFDF9') + `<path d="${hole}" fill="none" stroke="rgba(0,0,0,.10)" stroke-width="2"/>` +
      `<g transform="rotate(-4 150 16)"><rect x="98" y="0" width="104" height="32" fill="url(#tg2)" opacity=".85"/></g>` +
      `<path d="M50 334H250" stroke="#D9CFC2" stroke-width="1.5" stroke-dasharray="4 4"/>`,
      `<pattern id="tg2" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#FFF3F5"/><rect width="7" height="14" fill="#F2A9B8" opacity=".45"/><rect width="14" height="7" fill="#F2A9B8" opacity=".45"/></pattern>`,
      { shadow: true });
  })();

  /* --- layouts (multi-photo collages) --- */
  (function () {
    const g4 = [[16, 16], [204, 16], [16, 204], [204, 204]].map(([x, y]) => rectP(x, y, 180, 180));
    frame('grid-4', '2×2 grid', 'layouts', 400, 400, g4, cut(rectP(0, 0, 400, 400, 4), g4, '#FFFFFF'), '', { shadow: true });
    const g3 = [rectP(16, 16, 368, 280), rectP(16, 312, 176, 172), rectP(208, 312, 176, 172)];
    frame('grid-3', 'Trio layout', 'layouts', 400, 500, g3, cut(rectP(0, 0, 400, 500, 4), g3, '#FFFFFF'), '', { shadow: true });
    const tri = [14, 210, 406].map(x => rectP(x, 14, 180, 272));
    frame('triptych', 'Triptych', 'layouts', 600, 300, tri, cut(rectP(0, 0, 600, 300, 4), tri, '#FFFFFF'), '', { shadow: true });
    const g6 = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) g6.push(rectP(14 + c * 190, 14 + r * 190, 176, 176));
    frame('grid-6', 'Six grid', 'layouts', 394, 584, g6, cut(rectP(0, 0, 394, 584, 4), g6, '#FFFDF8') +
      `<text x="197" y="578" ${SERIF} font-style="italic" font-size="9" fill="#B3A096" text-anchor="middle"></text>`, '', { shadow: true });
    const scat = [rectP(22, 22, 210, 250, 2), rectP(250, 60, 176, 210, 2), rectP(60, 290, 180, 180, 2), rectP(258, 290, 160, 190, 2)];
    frame('moodboard', 'Moodboard', 'layouts', 450, 500, scat, cut(rectP(0, 0, 450, 500, 6), scat, '#F7EEDC') +
      scat.map(h => `<path d="${h}" fill="none" stroke="#fff" stroke-width="8"/>`).join('') +
      `<g transform="rotate(-8 126 22)"><rect x="96" y="10" width="60" height="22" fill="#F2C4C8" opacity=".85"/></g><g transform="rotate(6 338 60)"><rect x="308" y="48" width="60" height="22" fill="#DDE4CB" opacity=".9"/></g>` +
      at(244, 284, 0.12, 0, `<path d="${sparkleD}" fill="${C.gold}"/>`), '', { shadow: true });
  })();

  /* --- coquette --- */
  (function () {
    const holes = [heartP(130, 140, 0.66), heartP(350, 140, 0.66)];
    const bow = bowAt('dh', 240, 64, 0.3, ...BOW_PINK);
    frame('double-heart', 'Double hearts', 'coquette', 480, 270, holes,
      cut(heartP(130, 140, 0.8) + ' ' + heartP(350, 140, 0.8), holes, '#F7D6DB', `stroke="${C.rose}" stroke-width="2"`) +
      `<path d="${heartP(130, 140, 0.73)} ${heartP(350, 140, 0.73)}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 4"/>` +
      `<path d="${holes.join(' ')}" fill="none" stroke="${C.rose}" stroke-width="2"/>` + bow.body, bow.defs, { shadow: true });
  })();
  (function () {
    const hole = scallopP(ringPts(190, 160, 120, 80, 10));
    frame('cloud', 'Dreamy cloud', 'coquette', 380, 300, [hole],
      cut(scallopP(ringPts(190, 160, 152, 104, 10)), [hole], '#EEF6FC', `stroke="#A9CBE3" stroke-width="2"`) +
      `<path d="${scallopP(ringPts(190, 160, 137, 92, 10))}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="6 5"/>` +
      `<path d="${hole}" fill="none" stroke="#A9CBE3" stroke-width="2"/>` +
      at(344, 40, 0.24, 0, `<path d="${sparkleD}" fill="#F4C7CF"/>`) + at(30, 266, 0.18, 0, `<path d="${sparkleD}" fill="#B9D6EE"/>`), '', { shadow: true });
  })();
  (function () {
    const hole = circleP(160, 160, 108);
    frame('scallop-badge', 'Scallop badge', 'coquette', 320, 320, [hole],
      cut(scallopP(ringPts(160, 160, 136, 136, 24)), [hole], 'url(#dt)', `stroke="#E3B860" stroke-width="2"`) +
      `<circle cx="160" cy="160" r="120" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 5"/><path d="${hole}" fill="none" stroke="#E3B860" stroke-width="2"/>`,
      `<pattern id="dt" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#FBE7A6"/><circle cx="4" cy="4" r="2.2" fill="#fff"/><circle cx="12" cy="12" r="2.2" fill="#fff"/></pattern>`, { shadow: true });
  })();
  (function () {
    const hole = rectP(44, 44, 232, 312);
    const eyelets = rectPts(27, 27, 266, 346, 19).map(([x, y]) => circleP(x, y, 3.4));
    const bow = bowAt('lr', 160, 370, 0.4, ...BOW_PINK);
    frame('lace-rect', 'Lace rectangle', 'coquette', 320, 410, [hole],
      cut(scallopP(rectPts(10, 10, 300, 380, 19)), [hole, ...eyelets], C.ivory, `stroke="#E2D4C1" stroke-width="1.2"`) +
      `<rect x="36" y="36" width="248" height="328" fill="none" stroke="#E2D4C1" stroke-dasharray="3 3"/><path d="${hole}" fill="none" stroke="#E2D4C1" stroke-width="2"/>` + bow.body,
      bow.defs, { shadow: true });
  })();

  /* --- vintage --- */
  (function () {
    const hole = rectP(40, 70, 260, 240, 2);
    const holes = [];
    let wire = '';
    for (let x = 30; x <= 310; x += 28) { holes.push(circleP(x, 40, 5)); wire += `<path d="M${x} 40C${x - 2} 16 ${x + 10} 10 ${x + 12} 26" fill="none" stroke="#9AA1AB" stroke-width="3" stroke-linecap="round"/>`; }
    let lines = '';
    for (let y = 346; y < 420; y += 22) lines += `<path d="M22 ${y}H318" stroke="#C9D6E3" stroke-width="1.2"/>`;
    frame('notebook', 'Notebook page', 'vintage', 340, 430, [hole],
      cut(rectP(0, 22, 340, 408, 6), [hole, ...holes], '#FFFDF6', `stroke="#E2D8C6" stroke-width="1.2"`) + wire + lines +
      `<text x="30" y="340" font-family="Georgia, serif" font-style="italic" font-size="15" fill="#5B4A44">dear diary, today I felt like a movie ♡</text>` +
      `<g transform="rotate(-35 46 74)"><rect x="18" y="64" width="56" height="20" fill="#F2C4C8" opacity=".8"/></g><g transform="rotate(-35 294 306)"><rect x="266" y="296" width="56" height="20" fill="#F2C4C8" opacity=".8"/></g>`,
      '', { shadow: true });
  })();
  (function () {
    const hole = rectP(52, 18, 256, 300);
    frame('envelope-pocket', 'Envelope pocket', 'vintage', 360, 400, [hole],
      `<path d="${hole}" fill="none" stroke="#FFFFFF" stroke-width="14"/>` +
      `<path d="M10 214L180 304L350 214V392H10Z" fill="rgba(70,45,30,.14)" transform="translate(0 4)"/>` +
      `<path d="M10 214L180 304L350 214V392H10Z" fill="#F3E6D2" stroke="#CDB89A" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<path d="M10 392L150 300M350 392L210 300" stroke="#E0CFB6" stroke-width="1.5"/>` +
      `<path d="${blobP(180, 304, 22, 2.5, 14, 4)}" fill="#A8273C"/><circle cx="180" cy="304" r="15" fill="#B8314A" stroke="#7E1A2B" stroke-width="1.5"/><path d="${heartP(180, 305, 0.07)}" fill="#7E1A2B"/>` +
      `<text x="180" y="368" ${SERIF} font-style="italic" font-size="18" fill="#8B6B57" text-anchor="middle">to my favourite person</text>`);
  })();
  (function () {
    const hole = ellipseP(150, 190, 104, 138);
    let beads = '';
    ringPts(150, 190, 125, 161, 48).forEach(([x, y]) => beads += `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${C.goldL}" stroke="${C.goldD}" stroke-width=".6"/>`);
    frame('noir-oval', 'Noir oval', 'vintage', 300, 380, [hole],
      cut(ellipseP(150, 190, 146, 184), [hole], '#1E1A1A') +
      `<ellipse cx="150" cy="190" rx="140" ry="178" fill="none" stroke="${C.gold}" stroke-width="1.6"/>` + beads +
      `<ellipse cx="150" cy="190" rx="110" ry="144" fill="none" stroke="${C.gold}" stroke-width="2.5"/>` +
      `<g transform="translate(150 12)" fill="${C.goldL}" stroke="${C.goldD}" stroke-width="1"><path d="M-22 6C-18-8 18-8 22 6C12 0-12 0-22 6Z"/><circle cy="-2" r="4"/></g>`, '', { shadow: true });
  })();
  (function () {
    const holes = [0, 1, 2].map(i => rectP(30 + i * 240, 44, 220, 162, 3));
    const sprockets = [];
    for (let x = 10; x < 750; x += 28) { sprockets.push(rectP(x, 12, 14, 18, 3)); sprockets.push(rectP(x, 220, 14, 18, 3)); }
    const t = `font-family="'Courier New', monospace" font-size="10" letter-spacing="1.5" fill="#F0BE6E"`;
    frame('negative', 'Negative strip', 'vintage', 760, 250, holes,
      cut(rectP(0, 0, 760, 250), [...holes, ...sprockets], '#7E3F1C') +
      `<text x="40" y="40" ${t}>▸ 24</text><text x="280" y="40" ${t}>▸ 25</text><text x="520" y="40" ${t}>▸ 26</text><text x="380" y="216" ${t} text-anchor="middle">SAFETY FILM 400 ✦ ${YY}${MM}</text>`);
  })();

  /* =====================================================================
     BACKGROUNDS
     ===================================================================== */
  function heart2d(x, cx, cy, s) {
    x.beginPath(); x.moveTo(cx, cy + 6 * s);
    x.bezierCurveTo(cx - 10 * s, cy - 2 * s, cx - 6 * s, cy - 10 * s, cx, cy - 4 * s);
    x.bezierCurveTo(cx + 6 * s, cy - 10 * s, cx + 10 * s, cy - 2 * s, cx, cy + 6 * s);
    x.fill();
  }
  const EXTRA_BG = {
    checker(x, W, Hh, u) { x.fillStyle = '#FFF4F7'; x.fillRect(0, 0, W, Hh); x.fillStyle = '#F6BFD0'; const c = 90 * u; for (let j = 0; j * c < Hh; j++) for (let i = j % 2; i * c < W; i += 2) x.fillRect(i * c, j * c, c, c); },
    holo(x, W, Hh, u, r) {
      const g = x.createLinearGradient(0, 0, W, Hh);
      ['#F9D3E6', '#D3E5FA', '#DDF7D3', '#FAF0CF', '#E2D3FA', '#F9D3E6'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
      x.fillStyle = g; x.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 6; i++) { const cx = r() * W, cy = r() * Hh, rr = (250 + r() * 300) * u, gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gg.addColorStop(0, 'rgba(255,255,255,.55)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(0, 0, W, Hh); }
      H.speckle(x, W, Hh, u, r, '255,255,255', 900 * u * u, 0.6);
    },
    chrome(x, W, Hh) { const g = x.createLinearGradient(0, 0, 0, Hh); [['#F4F5F8', 0], ['#C9CED6', 0.3], ['#8A929C', 0.48], ['#E9ECF1', 0.62], ['#B5BBC4', 0.85], ['#F4F5F8', 1]].forEach(([c, o]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, W, Hh); },
    hearts(x, W, Hh, u, r) {
      x.fillStyle = '#FFF7F4'; x.fillRect(0, 0, W, Hh);
      const s = 110 * u;
      for (let j = 0, y = s / 2; y < Hh + s; y += s * 0.8, j++) for (let px = j % 2 ? s / 2 : 0; px < W + s; px += s) { x.fillStyle = ['#F4B3C2', '#E5566F', '#F9D3DC'][Math.floor(r() * 3)]; heart2d(x, px, y, 2.2 * u); }
    },
    stars(x, W, Hh, u, r) {
      const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#191838'); g.addColorStop(1, '#40305F'); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
      H.speckle(x, W, Hh, u, r, '255,255,255', 450 * u * u, 0.9);
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineCap = 'round';
      for (let i = 0; i < 26; i++) { const px = r() * W, py = r() * Hh, l = (6 + r() * 14) * u; x.lineWidth = 2 * u; x.beginPath(); x.moveTo(px - l, py); x.lineTo(px + l, py); x.moveTo(px, py - l); x.lineTo(px, py + l); x.stroke(); }
    },
    grid(x, W, Hh, u) {
      x.fillStyle = '#FDFDFB'; x.fillRect(0, 0, W, Hh);
      for (let k = 0, p = 0; p < Math.max(W, Hh); p += 30 * u, k++) {
        x.strokeStyle = k % 5 ? 'rgba(140,180,215,.35)' : 'rgba(110,160,205,.6)'; x.lineWidth = (k % 5 ? 1 : 1.6) * u;
        x.beginPath(); x.moveTo(p, 0); x.lineTo(p, Hh); x.moveTo(0, p); x.lineTo(W, p); x.stroke();
      }
    },
    sky(x, W, Hh, u, r) {
      const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#8EC5F0'); g.addColorStop(1, '#DDF0FB'); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 9; i++) { const cx = r() * W, cy = r() * Hh; for (let k = 0; k < 6; k++) { const bx = cx + (k - 2.5) * 50 * u, by = cy + Math.sin(k) * 14 * u, rr = (50 + r() * 40) * u, gg = x.createRadialGradient(bx, by, 0, bx, by, rr); gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.fillRect(bx - rr, by - rr, rr * 2, rr * 2); } }
    }
  };
  const baseBg = A.makeBackground;
  A.makeBackground = (key, W, Hh) => {
    if (!EXTRA_BG[key]) return baseBg(key, W, Hh);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    EXTRA_BG[key](cv.getContext('2d'), W, Hh, W / 1080, rng(13));
    return cv;
  };
  A.BG_TEXTURES.push({ id: 'checker', name: 'Y2K checker' }, { id: 'holo', name: 'Holographic' }, { id: 'chrome', name: 'Chrome' },
    { id: 'hearts', name: 'Hearts' }, { id: 'stars', name: 'Starry night' }, { id: 'grid', name: 'Graph paper' }, { id: 'sky', name: 'Blue sky' });

  /* =====================================================================
     FONTS & TEXT
     ===================================================================== */
  const grp = name => A.FONTS.find(g => g.group === name);
  grp('Script & calligraphy').fonts.push('Italianno', 'Mrs Saint Delafield', 'Monsieur La Doulaise', 'Sacramento');
  grp('Handwritten').fonts.push('Indie Flower', 'Reenie Beanie', 'Gloria Hallelujah');
  grp('Vintage serif').fonts.push('Cinzel', 'Bodoni Moda', 'DM Serif Display', 'Abril Fatface');
  A.FONTS.splice(A.FONTS.length - 1, 0, { group: 'Retro & Y2K', fonts: ['DSEG7 Classic', 'DSEG14 Classic', 'VT323', 'Silkscreen', 'Press Start 2P', 'Pacifico', 'Shrikhand', 'Fredoka', 'Monoton'] });

  const CHROME_STOPS = ['#FFFFFF', '#C9CED6', '#7E8691', '#EEF0F4', '#9AA1AB'];
  A.TEXT_PRESETS.push(
    { label: 'Digicam date', text: DIGI_DATE, font: 'DSEG7 Classic', size: 60, fill: '#FF9A3C', charSpacing: 80, shadow: { color: 'rgba(255,80,0,0.9)', blur: 18, offsetX: 0, offsetY: 0 } },
    { label: 'Y2K bubble', text: 'cutie', font: 'Fredoka', size: 120, weight: 'bold', fill: '#FF8CC6', stroke: '#FFFFFF', strokeWidth: 10, shadow: { color: 'rgba(230,80,150,0.55)', blur: 0, offsetX: 6, offsetY: 7 } },
    { label: 'Neon sign', text: 'good vibes', font: 'Pacifico', size: 84, fill: '#FFF0F7', stroke: '#FF7EB9', strokeWidth: 1.5, shadow: { color: 'rgba(255,60,150,0.95)', blur: 26, offsetX: 0, offsetY: 0 } },
    { label: 'Silver chrome', text: 'Y2K', font: 'Abril Fatface', size: 150, gradient: CHROME_STOPS, stroke: '#5B6470', strokeWidth: 2 },
    { label: 'Pixel', text: 'PRESS START', font: 'Press Start 2P', size: 34, fill: '#7B5CFF', shadow: { color: '#F4A7C3', blur: 0, offsetX: 4, offsetY: 4 } },
    { label: 'Label maker', text: ' BESTIES ', font: 'Courier Prime', size: 42, weight: 'bold', fill: '#FFFFFF', bg: '#B5174D', charSpacing: 300 },
    { label: 'Magazine', text: 'ISSUE Nº 26', font: 'Bodoni Moda', size: 80, fill: '#3A2C2A', charSpacing: 120 },
    { label: 'Retro script', text: 'Sunday Club', font: 'Shrikhand', size: 84, fill: '#E8735A', shadow: { color: '#F6C9A0', blur: 0, offsetX: 5, offsetY: 5 } },
    { label: 'Love note', text: 'thinking of you', font: 'Reenie Beanie', size: 78, fill: '#3A2C2A' },
    { label: 'Signature', text: 'with love, always', font: 'Mrs Saint Delafield', size: 96, fill: '#6E2A3A' },
    { label: 'Old cinema', text: 'THE END', font: 'Cinzel', size: 72, fill: '#C9A45C', charSpacing: 420 },
    { label: 'Marker highlight', text: 'core memory', font: 'Gloria Hallelujah', size: 56, fill: '#3A2C2A', hl: '#FFE58A' }
  );
  A.QUOTES.push(
    { text: 'main character energy', font: 'DM Serif Display', size: 62, italic: true, fill: '#6E2A3A' },
    { text: 'soft life', font: 'Sacramento', size: 110, fill: '#C47A88' },
    { text: "it's a vibe", font: 'Pacifico', size: 72, fill: '#FF7EB9' },
    { text: 'chasing sunsets', font: 'Italianno', size: 96, fill: '#C9733E' },
    { text: 'little moments', font: 'Indie Flower', size: 62, fill: '#4D6A80' },
    { text: 'daydreamer', font: 'Monsieur La Doulaise', size: 110, fill: '#8C78B6' },
    { text: 'princess era', font: 'Fredoka', size: 70, weight: 'bold', fill: '#FF8CC6', stroke: '#FFFFFF', strokeWidth: 8 },
    { text: 'CORE MEMORY', font: 'VT323', size: 72, fill: '#FF8A1F', shadow: { color: 'rgba(255,120,20,0.8)', blur: 8, offsetX: 0, offsetY: 0 } },
    { text: 'we were here', font: 'Special Elite', size: 46, fill: '#3A2C2A' },
    { text: 'kiss kiss', font: 'Shrikhand', size: 72, fill: '#C8174F' },
    { text: 'sweet like honey', font: 'Cormorant Garamond', size: 62, italic: true, fill: '#B5852A' },
    { text: 'bonjour mon cœur', font: 'Parisienne', size: 80, fill: '#A94F63' },
    { text: 'BE MINE', font: 'Cinzel', size: 60, fill: '#A94F63', charSpacing: 380 },
    { text: 'lol ♡ xoxo', font: 'Silkscreen', size: 48, fill: '#7B5CFF' }
  );

  A.DIGI_DATE = DIGI_DATE;
})();
