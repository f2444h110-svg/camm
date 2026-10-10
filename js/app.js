/* Petal & Paper — aesthetic photo editor & collage maker (fabric.js 5) */
(() => {
  'use strict';

  const A = window.ASSETS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = n => `<i data-lucide="${n}"></i>`;
  const refreshIcons = () => { if (window.lucide) lucide.createIcons(); };
  const isMobile = () => matchMedia('(max-width: 900px)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };

  if (!window.fabric) {
    document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Could not load the canvas library. Please check your internet connection and reload.</p>';
    return;
  }

  const ACCENT = '#C47A88';
  const SVG_SCALE = 4;                  // stickers/frames are rasterised from SVG at 4× for crisp exports
  const PROPS = ['id', 'kind', 'name', 'assetId', 'frameId', 'hole', 'attachTo', 'fx', 'curve', 'isLocked',
    'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hasControls', 'perPixelTargetFind', 'editable'];
  const FRAMES = Object.fromEntries(A.FRAMES.map(f => [f.id, f]));
  const STICKERS = Object.fromEntries(A.STICKERS.map(s => [s.id, s]));
  const T = fabric.util;

  /* ------------------------------------------------------------------ */
  /* fabric setup                                                        */
  /* ------------------------------------------------------------------ */
  fabric.textureSize = 4096;
  // fabric 5.3 sets the invalid value 'alphabetical'; map it to the real keyword to keep the console clean
  const tb = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'textBaseline');
  if (tb && tb.set) Object.defineProperty(CanvasRenderingContext2D.prototype, 'textBaseline', { ...tb, set(v) { tb.set.call(this, v === 'alphabetical' ? 'alphabetic' : v); } });
  Object.assign(fabric.Object.prototype, {
    transparentCorners: false, cornerStyle: 'circle', cornerColor: '#ffffff', cornerStrokeColor: ACCENT,
    borderColor: ACCENT, cornerSize: 12, touchCornerSize: 30, padding: 4, borderScaleFactor: 1.6
  });
  // curved text keeps its arc in `curve`; the path itself is rebuilt on load (fabric 5 can't revive text paths)
  const itextToObject = fabric.IText.prototype.toObject;
  fabric.IText.prototype.toObject = function (props) {
    const o = itextToObject.call(this, props);
    delete o.path;
    return o;
  };
  fabric.IText.prototype.cursorColor = ACCENT;
  fabric.IText.prototype.editingBorderColor = ACCENT;
  fabric.IText.prototype.selectionColor = 'rgba(196,122,136,.25)';

  function renderDelete(ctx, left, top) {
    ctx.save();
    ctx.translate(left, top);
    ctx.shadowColor = 'rgba(60,30,30,.25)'; ctx.shadowBlur = 6;
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, 4); ctx.moveTo(4, -4); ctx.lineTo(-4, 4); ctx.stroke();
    ctx.restore();
  }
  fabric.Object.prototype.controls.del = new fabric.Control({
    x: 0.5, y: -0.5, offsetX: 16, offsetY: -16, cursorStyle: 'pointer', cornerSize: 24,
    mouseUpHandler: (e, t) => { removeObjects(t.target); return true; },
    render: renderDelete
  });

  const canvas = new fabric.Canvas('c', {
    preserveObjectStacking: true, controlsAboveOverlay: true, stopContextMenu: true,
    backgroundColor: '#FBF4EA', selectionColor: 'rgba(196,122,136,.10)', selectionBorderColor: ACCENT,
    selectionLineWidth: 1.2, targetFindTolerance: 6
  });

  const page = { w: 1080, h: 1350, bg: { type: 'texture', value: 'gingham-pink' }, vignette: 0, grain: 0, leak: 0, dust: 0, paper: 0 };
  let viewZoom = 1, userZoom = 1, crop = null, pendingFill = null, photoCount = 0;

  /* ------------------------------------------------------------------ */
  /* view                                                                */
  /* ------------------------------------------------------------------ */
  function fit() {
    const wrap = $('#canvasWrap');
    if (wrap.clientWidth < 40 || wrap.clientHeight < 40) return; // hidden / collapsed
    const pad = isMobile() ? 20 : 72;
    const z = Math.max(0.05, Math.min((wrap.clientWidth - pad) / page.w, (wrap.clientHeight - pad) / page.h)) * userZoom;
    viewZoom = z;
    canvas.setDimensions({ width: Math.round(page.w * z), height: Math.round(page.h * z) });
    canvas.setZoom(z);
    canvas.requestRenderAll();
    $('#zoomLabel').textContent = Math.round(userZoom * 100) + '%';
  }

  function applyBackground() {
    const b = page.bg;
    if (b.type === 'color') {
      canvas.backgroundImage = null;
      canvas.backgroundColor = b.value === 'transparent' ? '' : b.value;
    } else {
      canvas.backgroundColor = '';
      canvas.backgroundImage = new fabric.Image(A.makeBackground(b.value, page.w, page.h), {
        left: 0, top: 0, originX: 'left', originY: 'top', selectable: false, evented: false, excludeFromExport: true, objectCaching: false
      });
    }
    canvas.requestRenderAll();
  }

  /* overlay "finish": vignette (multiply), film grain (overlay), light leak (screen) */
  let finish = null;
  const noiseTile = A.makeNoiseTile();
  function buildFinish() {
    const W = page.w, H = page.h;
    const mk = (draw, op) => {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      draw(cv.getContext('2d'));
      return new fabric.Image(cv, { left: 0, top: 0, originX: 'left', originY: 'top', globalCompositeOperation: op, objectCaching: false });
    };
    const vig = mk(x => {
      const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.56);
      g.addColorStop(0, 'rgba(60,32,20,0)'); g.addColorStop(0.55, 'rgba(60,32,20,.35)'); g.addColorStop(1, 'rgba(40,20,12,.95)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }, 'multiply');
    const grain = mk(x => { x.fillStyle = x.createPattern(noiseTile, 'repeat'); x.fillRect(0, 0, W, H); }, 'overlay');
    const leak = mk(x => {
      [[0, H * 0.12, W * 0.85, '255,140,80', 0.95], [W, H * 0.78, W * 0.75, '255,96,140', 0.75], [W * 0.15, H, W * 0.5, '255,200,120', 0.5]].forEach(([cx, cy, r, c, a]) => {
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`);
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      });
    }, 'screen');
    const dust = mk(x => {
      const r = (() => { let s = 42; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(), u = W / 1080;
      for (let i = 0; i < 420; i++) { x.fillStyle = r() > 0.35 ? 'rgba(255,255,255,.85)' : 'rgba(40,30,25,.6)'; x.beginPath(); x.arc(r() * W, r() * H, (0.6 + r() * 2.2) * u, 0, Math.PI * 2); x.fill(); }
      x.lineCap = 'round';
      for (let i = 0; i < 22; i++) { const px = r() * W, py = r() * H, l = (30 + r() * 160) * u; x.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,.6)' : 'rgba(40,30,25,.4)'; x.lineWidth = (0.6 + r()) * u; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + (r() - 0.5) * l, py + l / 2, px + (r() - 0.5) * l * 0.4, py + l); x.stroke(); }
    }, 'source-over');
    const paper = mk(x => { x.drawImage(A.makeBackground('paper', W, H), 0, 0); }, 'multiply');
    finish = {
      vig, grain, leak, dust, paper,
      group: new fabric.Group([paper, vig, grain, leak, dust], { originX: 'left', originY: 'top', objectCaching: false, selectable: false, evented: false, excludeFromExport: true })
    };
    updateFinish();
  }
  function updateFinish() {
    if (!finish) return;
    finish.vig.opacity = page.vignette / 100;
    finish.grain.opacity = page.grain / 100 * 0.85;
    finish.leak.opacity = page.leak / 100 * 0.85;
    finish.dust.opacity = (page.dust || 0) / 100;
    finish.paper.opacity = (page.paper || 0) / 100;
    canvas.overlayImage = (page.vignette || page.grain || page.leak || page.dust || page.paper) ? finish.group : null;
    canvas.requestRenderAll();
  }

  /* ------------------------------------------------------------------ */
  /* utilities                                                           */
  /* ------------------------------------------------------------------ */
  const loadImg = url => new Promise((res, rej) => fabric.Image.fromURL(url, (img, err) => (err || !img || !img.width) ? rej(new Error('Image failed to load')) : res(img)));
  const bigSvg = s => s.replace(/width="([\d.]+)" height="([\d.]+)"/, (m, w, h) => `width="${w * SVG_SCALE}" height="${h * SVG_SCALE}"`);
  const byId = id => canvas.getObjects().find(o => o.id === id);
  const activeObjs = () => { const o = canvas.getActiveObject(); return !o ? [] : o.type === 'activeSelection' ? o.getObjects() : [o]; };
  const activePhoto = () => { const o = canvas.getActiveObject(); return o && o.kind === 'photo' ? o : null; };
  const activeText = () => { const o = canvas.getActiveObject(); return o && o.type === 'i-text' ? o : null; };
  const center = () => ({ x: page.w / 2, y: page.h / 2 });
  const softShadow = () => new fabric.Shadow({ color: 'rgba(70,40,30,0.28)', blur: 30, offsetX: 0, offsetY: 12, nonScaling: true });

  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function readImageFile(file, max) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.naturalWidth * s)); cv.height = Math.max(1, Math.round(img.naturalHeight * s));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        const keepAlpha = /png|webp|gif|svg/.test(file.type);
        res(cv.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', 0.92));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Unsupported image')); };
      img.src = url;
    });
  }
  function makeThumb(src, size = 180) {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = cv.height = size;
        const s = Math.max(size / img.width, size / img.height);
        cv.getContext('2d').drawImage(img, (size - img.width * s) / 2, (size - img.height * s) / 2, img.width * s, img.height * s);
        res(cv.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => res(src);
      img.src = src;
    });
  }

  const fontReady = {};
  function ensureFont(name) {
    if (!document.fonts || !name) return Promise.resolve();
    if (!fontReady[name]) {
      fontReady[name] = Promise.race([
        Promise.all([document.fonts.load(`400 48px "${name}"`), document.fonts.load(`italic 400 48px "${name}"`)]),
        new Promise(r => setTimeout(r, 3500))
      ]).catch(() => {}).then(() => fabric.util.clearFabricFontCache(name));
    }
    return fontReady[name];
  }

  /* ------------------------------------------------------------------ */
  /* frames: holes, clipping & linked photos                             */
  /* ------------------------------------------------------------------ */
  const holeCache = new Map();
  const hitCtx = document.createElement('canvas').getContext('2d');
  function holeInfo(key, i) {
    const ck = key + '#' + i;
    if (!holeCache.has(ck)) {
      const d = FRAMES[key].holes[i];
      const p = new fabric.Path(d, { strokeWidth: 0 });
      holeCache.set(ck, { d, cx: p.pathOffset.x, cy: p.pathOffset.y, w: p.width, h: p.height, p2d: new Path2D(d) });
    }
    return holeCache.get(ck);
  }
  const frameK = fr => fr.width / FRAMES[fr.assetId].w;
  const photosIn = fr => canvas.getObjects().filter(o => o.frameId && o.frameId === fr.id);
  const emptyHoles = fr => FRAMES[fr.assetId].holes.map((_, i) => i).filter(i => !photosIn(fr).some(p => p.hole === i));

  /* canvas-space geometry of hole i of a frame */
  function holeGeom(fr, i) {
    const h = holeInfo(fr.assetId, i), k = frameK(fr), M = fr.calcTransformMatrix();
    const c = T.transformPoint(new fabric.Point(h.cx * k - fr.width / 2, h.cy * k - fr.height / 2), M);
    return { h, k, c, dec: T.qrDecompose(M) };
  }
  function clipFor(fr, i, clip) {
    const { h, k, c, dec } = holeGeom(fr, i);
    const grow = 1 + 4 / Math.min(h.w, h.h); // tuck the photo slightly under the frame edge
    clip = clip || new fabric.Path(h.d, { absolutePositioned: true, strokeWidth: 0, stroke: null, fill: '#000', objectCaching: false });
    clip.set({ originX: 'center', originY: 'center', left: c.x, top: c.y, angle: dec.angle, scaleX: dec.scaleX * k * grow, scaleY: dec.scaleY * k * grow, skewX: dec.skewX, skewY: 0 });
    clip.setCoords();
    return clip;
  }
  function computeRel(photo, fr) {
    photo._rel = T.multiplyTransformMatrices(T.invertTransform(fr.calcTransformMatrix()), photo.calcTransformMatrix());
  }
  function placeBelow(photo, fr) {
    const objs = canvas.getObjects(), pi = objs.indexOf(photo), fi = objs.indexOf(fr);
    if (pi < 0 || fi < 0) return;
    canvas.moveTo(photo, pi < fi ? fi - 1 : fi);
  }
  function linkPhoto(photo, fr, i) {
    const occupant = photosIn(fr).find(p => p.hole === i);
    if (occupant && occupant !== photo) unlinkPhoto(occupant);
    const { h, k, c, dec } = holeGeom(fr, i);
    const hw = h.w * k * Math.abs(dec.scaleX), hh = h.h * k * Math.abs(dec.scaleY);
    const s = Math.max(hw / photo.width, hh / photo.height) * 1.02;
    photo.set({ flipX: false, flipY: false, skewX: 0, skewY: 0, angle: fr.group ? dec.angle : fr.angle, scaleX: s, scaleY: s });
    photo.setPositionByOrigin(c, 'center', 'center');
    photo.setCoords();
    photo.frameId = fr.id;
    photo.hole = i;
    photo.objectCaching = false;
    photo.clipPath = clipFor(fr, i);
    placeBelow(photo, fr);
    computeRel(photo, fr);
    syncAttached(photo);
    canvas.requestRenderAll();
  }
  function unlinkPhoto(p) {
    p.clipPath = null; p.frameId = null; p.hole = null; p._rel = null;
    p.objectCaching = true; p.dirty = true;
  }
  /* keep linked photos glued to their frame while it moves/scales/rotates */
  function syncFrame(fr, movingSet) {
    photosIn(fr).forEach(p => {
      if (!movingSet || !movingSet.has(p)) {
        if (!p._rel) computeRel(p, fr);
        T.applyTransformToObject(p, T.multiplyTransformMatrices(fr.calcTransformMatrix(), p._rel));
        p.setCoords();
        syncAttached(p, movingSet);
      }
      p.clipPath = clipFor(fr, p.hole, p.clipPath);
    });
  }

  /* attached items (date stamps) ride along with their host photo or frame */
  const attachedTo = host => canvas.getObjects().filter(o => o.attachTo && o.attachTo === host.id);
  function computeAttachRel(o, host) {
    o._arel = T.multiplyTransformMatrices(T.invertTransform(host.calcTransformMatrix()), o.calcTransformMatrix());
  }
  function syncAttached(host, movingSet) {
    attachedTo(host).forEach(o => {
      if (movingSet && movingSet.has(o)) return;
      if (!o._arel) computeAttachRel(o, host);
      T.applyTransformToObject(o, T.multiplyTransformMatrices(host.calcTransformMatrix(), o._arel));
      o.setCoords();
    });
  }
  function placeAbove(o, host) {
    const objs = canvas.getObjects(), oi = objs.indexOf(o), hi = objs.indexOf(host);
    if (oi < 0 || hi < 0) return;
    if (oi < hi) canvas.moveTo(o, hi);
    else if (oi > hi + 1) canvas.moveTo(o, hi + 1);
  }
  function attach(o, host) { o.attachTo = host.id; computeAttachRel(o, host); placeAbove(o, host); }
  function detach(o) { o.attachTo = null; o._arel = null; }
  function relinkAll() {
    canvas.getObjects().forEach(o => {
      if (o.kind === 'frame') o.perPixelTargetFind = true;
      if (!o.frameId) return;
      const fr = byId(o.frameId);
      if (!fr || fr.kind !== 'frame' || !FRAMES[fr.assetId] || o.hole == null || o.hole >= FRAMES[fr.assetId].holes.length) { unlinkPhoto(o); return; }
      o.objectCaching = false;
      o.clipPath = clipFor(fr, o.hole);
      computeRel(o, fr);
    });
    canvas.getObjects().forEach(o => {
      if (!o.attachTo) return;
      const host = byId(o.attachTo);
      host ? computeAttachRel(o, host) : detach(o);
    });
  }
  function holeAt(pt, fr) {
    const def = FRAMES[fr.assetId];
    if (!def) return -1;
    const k = frameK(fr), lp = T.transformPoint(pt, T.invertTransform(fr.calcTransformMatrix()));
    const sx = (lp.x + fr.width / 2) / k, sy = (lp.y + fr.height / 2) / k;
    return def.holes.findIndex((_, i) => hitCtx.isPointInPath(holeInfo(fr.assetId, i).p2d, sx, sy));
  }
  function findHole(pt, { emptyOnly = false, exclude = null } = {}) {
    const frames = canvas.getObjects().filter(o => o.kind === 'frame' && o.visible && o !== exclude).reverse();
    for (const fr of frames) {
      const i = holeAt(new fabric.Point(pt.x, pt.y), fr);
      if (i < 0) continue;
      const occupant = photosIn(fr).find(p => p.hole === i);
      if (emptyOnly && occupant) continue;
      return { frame: fr, hole: i, occupant };
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* adding things                                                       */
  /* ------------------------------------------------------------------ */
  async function addPhoto(url, { slot, pt, trayId } = {}) {
    const img = await loadImg(url);
    photoCount++;
    img.set({ id: uid(), kind: 'photo', name: `Photo ${photoCount}`, assetId: trayId || null, fx: { ...FX0 }, originX: 'center', originY: 'center' });
    if (slot) {
      if (slot.occupant) canvas.remove(slot.occupant);
      canvas.add(img);
      linkPhoto(img, slot.frame, slot.hole);
    } else {
      const s = Math.min(page.w * 0.62 / img.width, page.h * 0.62 / img.height);
      const off = ((photoCount - 1) % 5) * 26 - 52;
      const c = pt || { x: page.w / 2 + off, y: page.h / 2 + off };
      img.set({ scaleX: s, scaleY: s, left: c.x, top: c.y });
      canvas.add(img);
    }
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    return img;
  }

  async function addSticker(def, pt) {
    const img = await loadImg(A.svgUrl(bigSvg(def.svg)));
    const disp = Math.min(def.w * 1.5, page.w * 0.5, page.h * 0.4 * def.w / def.h);
    const s = disp / img.width, c = pt || { x: page.w / 2 + (Math.random() - 0.5) * 120, y: page.h / 2 + (Math.random() - 0.5) * 120 };
    img.set({ id: uid(), kind: 'sticker', name: def.name, assetId: def.id, originX: 'center', originY: 'center', left: c.x, top: c.y, scaleX: s, scaleY: s });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    return img;
  }

  async function addImageSticker(url, pt) {
    const img = await loadImg(url);
    const s = Math.min(page.w * 0.36 / img.width, page.h * 0.36 / img.height, 1.5);
    const c = pt || center();
    img.set({ id: uid(), kind: 'sticker', name: 'My sticker', originX: 'center', originY: 'center', left: c.x, top: c.y, scaleX: s, scaleY: s });
    canvas.add(img);
    canvas.setActiveObject(img);
    return img;
  }

  async function addFrame(def, pt, opts = {}) {
    const img = await loadImg(A.svgUrl(bigSvg(def.svg)));
    const targetW = opts.width || Math.min(page.w * 0.86, page.h * 0.84 * def.w / def.h);
    const s = targetW / img.width, c = pt || center();
    img.set({
      id: uid(), kind: 'frame', name: def.name, assetId: def.id, originX: 'center', originY: 'center',
      left: c.x, top: c.y, scaleX: s, scaleY: s, angle: opts.angle || 0, perPixelTargetFind: true
    });
    if (def.shadow) img.shadow = softShadow();
    canvas.add(img);
    if (opts.select !== false) canvas.setActiveObject(img);
    canvas.requestRenderAll();
    return img;
  }

  /* picking a frame tile: wrap the selected photo, or just add the frame */
  async function onFrameTile(def, pt) {
    const sel = canvas.getActiveObject();
    if (!pt && sel && sel.kind === 'photo') {
      const h0 = holeInfo(def.id, 0);
      const holeW = Math.min(sel.getScaledWidth(), sel.getScaledHeight() * h0.w / h0.h, page.w * 0.7);
      const fr = await addFrame(def, sel.getCenterPoint(), { width: def.w * holeW / h0.w, select: false, angle: sel.angle });
      linkPhoto(sel, fr, 0);
      canvas.setActiveObject(fr);
      toast('Photo framed ✿ Click inside the window to reposition it');
    } else {
      await addFrame(def, pt);
      if (!pt) toast('Double-click the frame window to add a photo');
    }
    pushHistory();
  }

  const SEG7 = 'DSEG7 Classic', SEG14 = 'DSEG14 Classic';
  function segStyles(text) {
    const styles = {};
    String(text).split('\n').forEach((line, li) => [...line].forEach((ch, ci) => {
      if (ch === "'" || ch === '/') (styles[li] = styles[li] || {})[ci] = { fontFamily: SEG14 };
    }));
    return styles;
  }
  const mkGradient = stops => new fabric.Gradient({
    type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
    colorStops: stops.map((color, i) => ({ offset: i / (stops.length - 1), color }))
  });
  function addText(p, pt) {
    const c = pt || center();
    const t = new fabric.IText(p.text, {
      id: uid(), kind: 'text', name: 'Text', fontFamily: p.font, fontSize: p.size, fill: p.fill,
      fontStyle: p.italic ? 'italic' : 'normal', fontWeight: p.weight || 'normal', charSpacing: p.charSpacing || 0,
      lineHeight: 1.1, textAlign: 'center', originX: 'center', originY: 'center', left: c.x, top: c.y,
      curve: 0, backgroundColor: p.bg || '', padding: 6, paintFirst: 'stroke', strokeLineJoin: 'round',
      stroke: p.stroke || null, strokeWidth: p.strokeWidth || 0, textBackgroundColor: p.hl || ''
    });
    if (p.gradient) t.set('fill', mkGradient(p.gradient));
    if (p.font === SEG7) { t.set('styles', segStyles(p.text)); ensureFont(SEG14); }
    if (p.shadow) t.shadow = new fabric.Shadow(p.shadow);
    canvas.add(t);
    canvas.setActiveObject(t);
    ensureFont(p.font).then(() => { t.initDimensions(); t.setCoords(); canvas.requestRenderAll(); });
    return t;
  }

  /* curved text: put the text on a circular arc whose length equals the text width */
  function applyCurve(t) {
    const k = t.curve || 0;
    t.set('path', null);
    t.initDimensions();
    if (k) {
      const W = Math.max(10, t.calcTextWidth());
      const th = Math.abs(k) / 100 * Math.PI * 1.8, r = W / th, up = k > 0;
      const a0 = up ? -Math.PI / 2 - th / 2 : Math.PI / 2 + th / 2;
      const a1 = up ? -Math.PI / 2 + th / 2 : Math.PI / 2 - th / 2;
      const cy = up ? r : -r;
      const P = a => `${(r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
      const d = `M ${P(a0)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${th > Math.PI ? 1 : 0} ${up ? 1 : 0} ${P(a1)}`;
      t.set('path', new fabric.Path(d, { fill: '', stroke: '', strokeWidth: 0, objectCaching: false }));
      if (t.setPathInfo) t.setPathInfo();
      t.initDimensions();
    }
    t.objectCaching = !k;
    t.padding = k ? Math.round(t.fontSize * t.scaleY * viewZoom * 0.9) : 6;
    t.setCoords();
    t.dirty = true;
  }

  async function addAsset(kind, id, pt) {
    try {
      if (kind === 'sticker') await addSticker(STICKERS[id], pt);
      else if (kind === 'frame') return onFrameTile(FRAMES[id], pt);
      else if (kind === 'quote') addText(A.QUOTES[+id], pt);
      else if (kind === 'preset') addText(A.TEXT_PRESETS[+id], pt);
      else if (kind === 'custom') await addImageSticker(customStickers[+id], pt);
      else if (kind === 'tray') {
        const t = tray.find(x => x.id === id);
        if (t) await addPhoto(t.url, { slot: pt ? findHole(pt) : null, pt, trayId: t.id });
      }
      pushHistory();
      if (isMobile()) closeMobilePanel();
    } catch (e) { console.error(e); toast('Something went wrong adding that'); }
  }

  /* ------------------------------------------------------------------ */
  /* photo uploads                                                       */
  /* ------------------------------------------------------------------ */
  const tray = [];
  function addToTray(url) {
    const item = { id: uid(), url, thumb: null };
    tray.unshift(item);
    makeThumb(url).then(t => { item.thumb = t; renderTray(); renderLayers(); });
    renderTray();
    return item;
  }
  function renderTray() {
    const el = $('#tray');
    el.innerHTML = tray.length
      ? tray.map(t => `<button class="tray-item" draggable="true" data-kind="tray" data-id="${t.id}" title="Add again">${t.thumb ? `<img src="${t.thumb}" alt="">` : ''}</button>`).join('')
      : '<p class="empty">No photos yet</p>';
  }

  async function handlePhotoFiles(files, pt) {
    const list = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(f.name));
    if (!list.length) { pendingFill = null; return toast('Please choose image files'); }
    let target = pendingFill; pendingFill = null;
    const act = canvas.getActiveObject();
    const queue = (!target && !pt && act && act.kind === 'frame') ? emptyHoles(act).map(i => ({ frame: act, hole: i })) : [];
    for (const [n, file] of list.entries()) {
      try {
        const url = await readImageFile(file, 2400);
        const item = addToTray(url);
        const p = pt ? { x: pt.x + n * 30, y: pt.y + n * 30 } : null;
        const slot = target || queue.shift() || (p ? findHole(p) : null);
        target = null;
        await addPhoto(url, { slot, pt: p, trayId: item.id });
      } catch (e) {
        console.error(e);
        toast(`Couldn't open ${file.name} — try JPG or PNG`);
      }
    }
    pushHistory();
    if (isMobile()) closeMobilePanel();
  }

  /* ------------------------------------------------------------------ */
  /* object commands                                                     */
  /* ------------------------------------------------------------------ */
  function removeObjects(target) {
    const objs = !target ? [] : target.type === 'activeSelection' ? target.getObjects() : [target];
    if (!objs.length) return;
    canvas.discardActiveObject();
    objs.forEach(o => {
      if (o.kind === 'frame') photosIn(o).forEach(unlinkPhoto);
      attachedTo(o).forEach(a => canvas.remove(a));
      canvas.remove(o);
    });
    canvas.requestRenderAll();
    pushHistory();
  }

  function duplicate() {
    const objs = activeObjs();
    if (!objs.length) return;
    canvas.discardActiveObject();
    Promise.all(objs.map(src => new Promise(res => src.clone(c => res(c), PROPS)))).then(clones => {
      clones.forEach(c => {
        c.set({ id: uid(), left: c.left + 36, top: c.top + 36 });
        if (c.fx) c.fx = { ...c.fx };
        if (c.frameId) { c.frameId = null; c.hole = null; c.clipPath = null; c.objectCaching = true; }
        if (c.attachTo) { c.attachTo = null; c._arel = null; }
        if (c.type === 'i-text' && c.curve) applyCurve(c);
        canvas.add(c);
      });
      canvas.setActiveObject(clones.length === 1 ? clones[0] : new fabric.ActiveSelection(clones, { canvas }));
      canvas.requestRenderAll();
      pushHistory();
    });
  }

  function layer(op) {
    const o = canvas.getActiveObject();
    if (!o) return;
    if (o.kind === 'frame' && op === 'backward') {
      const objs = canvas.getObjects(), own = new Set(photosIn(o));
      let i = objs.indexOf(o) - 1;
      while (i >= 0 && own.has(objs[i])) i--;
      if (i >= 0) canvas.moveTo(o, i);
    } else {
      ({ forward: () => canvas.bringForward(o), backward: () => canvas.sendBackwards(o), front: () => canvas.bringToFront(o), back: () => canvas.sendToBack(o) })[op]();
    }
    activeObjs().forEach(x => { if (x.kind === 'frame') photosIn(x).forEach(p => placeBelow(p, x)); attachedTo(x).forEach(a => placeAbove(a, x)); });
    canvas.requestRenderAll();
    renderLayers();
    pushHistory();
  }

  function flip(prop) {
    const o = canvas.getActiveObject();
    if (!o) return;
    o.toggle(prop);
    o.setCoords();
    canvas.fire('object:modified', { target: o });
    canvas.requestRenderAll();
  }

  function setLocked(o, v) {
    o.set({ isLocked: v, lockMovementX: v, lockMovementY: v, lockScalingX: v, lockScalingY: v, lockRotation: v, hasControls: !v });
    if (o.type === 'i-text') o.editable = !v;
  }
  function toggleLock() {
    const objs = activeObjs();
    if (!objs.length) return;
    const v = !objs[0].isLocked;
    objs.forEach(o => setLocked(o, v));
    canvas.requestRenderAll();
    updateCtx(); renderLayers(); pushHistory();
    toast(v ? 'Locked — it stays put' : 'Unlocked');
  }
  function toggleShadow() {
    const objs = activeObjs();
    const on = !objs[0].shadow;
    objs.forEach(o => { o.shadow = on ? softShadow() : null; o.dirty = true; });
    canvas.requestRenderAll();
    updateCtx(); pushHistory();
  }
  /* "Put in frame": works for every frame shape (star, heart, cloud, layouts…).
     - photo(s) + frame selected together → photos fill that frame's windows
     - one photo selected → goes into the frame under it, else the nearest frame */
  function putInFrame() {
    const objs = activeObjs();
    const photos = objs.filter(o => o.kind === 'photo');
    if (!photos.length) return;
    let fr = objs.find(o => o.kind === 'frame');
    canvas.discardActiveObject(); // back to absolute coordinates before measuring
    if (!fr) {
      const c0 = photos[0].getCenterPoint(), frames = canvas.getObjects().filter(o => o.kind === 'frame' && o.visible);
      const under = findHole(c0);
      fr = under ? under.frame : frames
        .map(f => ({ f, d: f.getCenterPoint().distanceFrom(c0) - (f.intersectsWithObject(photos[0]) ? 1e6 : 0) }))
        .sort((a, b) => a.d - b.d).map(x => x.f)[0];
    }
    if (!fr) { toast('Add a frame from the Frames tab first'); return; }
    const total = FRAMES[fr.assetId].holes.length, used = new Set(), free = emptyHoles(fr);
    photos.forEach((p, i) => {
      let hole = holeAt(p.getCenterPoint(), fr);
      if (hole < 0 || used.has(hole)) hole = free.find(h => !used.has(h));
      if (hole == null) hole = [...Array(total).keys()].find(h => !used.has(h));
      if (hole == null) return; // more photos than windows: leave the rest outside
      used.add(hole);
      linkPhoto(p, fr, hole);
    });
    canvas.setActiveObject(fr);
    canvas.requestRenderAll();
    renderLayers(); pushHistory();
    toast(used.size > 1 ? `${used.size} photos placed in the frame ✿` : 'Photo placed in the frame ✿ click inside the window to reposition it');
  }
  function groupSelection() {
    const sel = canvas.getActiveObject();
    if (!sel || sel.type !== 'activeSelection') return;
    const g = sel.toGroup();
    g.set({ id: uid(), kind: 'group', name: 'Group' });
    canvas.requestRenderAll();
    updateCtx(); renderLayers(); pushHistory();
  }
  function ungroupSelection() {
    const g = canvas.getActiveObject();
    if (!g || g.type !== 'group' || g.kind !== 'group') return;
    g.toActiveSelection();
    canvas.requestRenderAll();
    updateCtx(); renderLayers(); pushHistory();
  }
  function releaseFromFrame() {
    const p = activePhoto();
    if (!p || !p.frameId) return;
    const fr = byId(p.frameId);
    unlinkPhoto(p);
    if (fr) canvas.moveTo(p, canvas.getObjects().indexOf(fr) + 1);
    p.set({ left: p.left + 40, top: p.top + 40 }); p.setCoords();
    canvas.requestRenderAll();
    updateCtx(); pushHistory();
  }
  function fillActiveFrame() {
    const fr = canvas.getActiveObject();
    if (!fr || fr.kind !== 'frame') return;
    const holes = emptyHoles(fr);
    pendingFill = { frame: fr, hole: holes.length ? holes[0] : 0, occupant: holes.length ? null : photosIn(fr).find(p => p.hole === 0) };
    $('#photoInput').click();
  }

  const CMDS = {
    forward: () => layer('forward'), backward: () => layer('backward'), front: () => layer('front'), back: () => layer('back'),
    dup: duplicate, flipx: () => flip('flipX'), flipy: () => flip('flipY'), shadow: toggleShadow, lock: toggleLock,
    del: () => removeObjects(canvas.getActiveObject()), crop: startCrop, filters: () => switchTab('filters'),
    unframe: releaseFromFrame, fill: fillActiveFrame,
    putframe: putInFrame, group: groupSelection, ungroup: ungroupSelection,
    detach: () => { activeObjs().forEach(detach); updateCtx(); pushHistory(); toast('Unpinned — it no longer follows the photo'); }, text: () => switchTab('text')
  };

  /* ------------------------------------------------------------------ */
  /* crop                                                                */
  /* ------------------------------------------------------------------ */
  /* change an image's crop window (in source pixels) without moving what stays visible */
  function setCropKeepPlace(img, cx, cy, w, h) {
    const c = T.transformPoint(new fabric.Point(cx - img.cropX - img.width / 2, cy - img.cropY - img.height / 2), img.calcTransformMatrix());
    img.set({ cropX: cx - w / 2, cropY: cy - h / 2, width: w, height: h });
    img.setPositionByOrigin(c, 'center', 'center');
    img.setCoords();
    img.dirty = true;
  }
  function startCrop() {
    const img = activePhoto();
    if (!img || crop) return;
    canvas.discardActiveObject();
    const nat = img.getOriginalSize();
    const prev = { cropX: img.cropX, cropY: img.cropY, width: img.width, height: img.height, left: img.left, top: img.top };
    const region = { cx: img.cropX + img.width / 2, cy: img.cropY + img.height / 2, w: img.width, h: img.height };
    const states = canvas.getObjects().map(o => [o, o.selectable, o.evented]);
    canvas.getObjects().forEach(o => { o.selectable = false; o.evented = false; });
    const clip = img.clipPath;
    img.clipPath = null;
    setCropKeepPlace(img, nat.width / 2, nat.height / 2, nat.width, nat.height);
    const c = T.transformPoint(new fabric.Point(region.cx - nat.width / 2, region.cy - nat.height / 2), img.calcTransformMatrix());
    const rect = new fabric.Rect({
      originX: 'center', originY: 'center', left: c.x, top: c.y, width: region.w, height: region.h,
      scaleX: Math.abs(img.scaleX), scaleY: Math.abs(img.scaleY), angle: img.angle,
      fill: 'rgba(255,255,255,0.01)', stroke: '#ffffff', strokeWidth: 2, strokeUniform: true, strokeDashArray: [10, 6],
      lockRotation: true, lockScalingFlip: true, excludeFromExport: true, kind: 'helper', hasBorders: false,
      cornerSize: 16, cornerColor: '#ffffff', cornerStrokeColor: ACCENT
    });
    rect.setControlsVisibility({ mtr: false, del: false });
    crop = { img, rect, prev, clip, states, mask: null, aspect: 0 };
    canvas.add(rect);
    canvas.setActiveObject(rect);
    updateCropMask();
    $('#ctxbar').hidden = true;
    $('#cropbar').hidden = false;
    $$('#aspectSeg button').forEach(b => b.classList.toggle('active', b.dataset.aspect === '0'));
    canvas.requestRenderAll();
  }
  function updateCropMask() {
    if (!crop) return;
    const { img, rect } = crop;
    img.setCoords(); rect.setCoords();
    const poly = pts => 'M' + pts.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L') + ' Z';
    const d = poly(img.getCoords(true, true)) + ' ' + poly(rect.getCoords(true, true));
    if (crop.mask) canvas.remove(crop.mask);
    crop.mask = new fabric.Path(d, { fill: 'rgba(30,20,22,0.55)', fillRule: 'evenodd', selectable: false, evented: false, excludeFromExport: true, kind: 'helper', objectCaching: false });
    canvas.insertAt(crop.mask, canvas.getObjects().indexOf(rect));
  }
  function setCropAspect(a) {
    if (!crop) return;
    crop.aspect = a;
    const { rect, img } = crop, nat = img.getOriginalSize();
    let w = rect.width * rect.scaleX / Math.abs(img.scaleX), h = rect.height * rect.scaleY / Math.abs(img.scaleY);
    if (a) {
      if (w / h > a) w = h * a; else h = w / a;
      if (w > nat.width) { w = nat.width; h = w / a; }
      if (h > nat.height) { h = nat.height; w = h * a; }
    }
    rect.set({ width: w, height: h, scaleX: Math.abs(img.scaleX), scaleY: Math.abs(img.scaleY) });
    rect.setControlsVisibility({ ml: !a, mr: !a, mt: !a, mb: !a });
    rect.setCoords();
    updateCropMask();
    canvas.requestRenderAll();
  }
  function endCrop(apply) {
    if (!crop) return;
    const { img, rect, prev, clip, states } = crop;
    if (apply) {
      const nat = img.getOriginalSize();
      const lp = T.transformPoint(rect.getCenterPoint(), T.invertTransform(img.calcTransformMatrix()));
      const w = rect.width * rect.scaleX / Math.abs(img.scaleX), h = rect.height * rect.scaleY / Math.abs(img.scaleY);
      const cx = lp.x + img.cropX + img.width / 2, cy = lp.y + img.cropY + img.height / 2;
      const x0 = clamp(cx - w / 2, 0, nat.width), y0 = clamp(cy - h / 2, 0, nat.height);
      const x1 = clamp(cx + w / 2, 0, nat.width), y1 = clamp(cy + h / 2, 0, nat.height);
      if (x1 - x0 > 8 && y1 - y0 > 8) setCropKeepPlace(img, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);
      else apply = false;
    }
    if (!apply) { img.set(prev); img.setCoords(); img.dirty = true; }
    canvas.remove(rect);
    if (crop.mask) canvas.remove(crop.mask);
    states.forEach(([o, s, e]) => { o.selectable = s; o.evented = e; });
    const fr = img.frameId && byId(img.frameId);
    if (fr && apply) {
      // keep the frame window filled: scale up around the window centre if the crop made the photo too small
      const { h, k, c, dec } = holeGeom(fr, img.hole);
      const need = Math.max(h.w * k * Math.abs(dec.scaleX) / img.getScaledWidth(), h.h * k * Math.abs(dec.scaleY) / img.getScaledHeight()) * 1.02;
      if (need > 1) {
        img.set({ scaleX: img.scaleX * need, scaleY: img.scaleY * need });
        img.setPositionByOrigin(c, 'center', 'center');
        img.setCoords();
      }
    }
    img.clipPath = fr ? clipFor(fr, img.hole, clip) : clip;
    if (fr) computeRel(img, fr);
    attachedTo(img).forEach(a => computeAttachRel(a, img));
    crop = null;
    $('#cropbar').hidden = true;
    canvas.setActiveObject(img);
    canvas.requestRenderAll();
    if (apply) pushHistory();
  }

  /* ------------------------------------------------------------------ */
  /* filters                                                             */
  /* ------------------------------------------------------------------ */
  const F = fabric.Image.filters;

  /* custom filters (WebGL shader + 2D fallback): radial vignette and chromatic RGB split */
  F.Vignette = fabric.util.createClass(F.BaseFilter, {
    type: 'Vignette', amount: 0, mainParameter: 'amount',
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform float uAmount;\nvarying vec2 vTexCoord;\nvoid main() {\nvec4 color = texture2D(uTexture, vTexCoord);\nfloat d = distance(vTexCoord, vec2(0.5));\ncolor.rgb *= 1.0 - uAmount * smoothstep(0.22, 0.75, d);\ngl_FragColor = color;\n}',
    applyTo2d(o) {
      const d = o.imageData.data, w = o.imageData.width, h = o.imageData.height, a = this.amount;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = x / w - 0.5, dy = y / h - 0.5;
        let t = clamp((Math.sqrt(dx * dx + dy * dy) - 0.22) / 0.53, 0, 1);
        t = t * t * (3 - 2 * t);
        const m = 1 - a * t, i = (y * w + x) * 4;
        d[i] *= m; d[i + 1] *= m; d[i + 2] *= m;
      }
    },
    getUniformLocations(gl, p) { return { uAmount: gl.getUniformLocation(p, 'uAmount') }; },
    sendUniformData(gl, u) { gl.uniform1f(u.uAmount, this.amount); }
  });
  F.Vignette.fromObject = F.BaseFilter.fromObject;
  F.RGBShift = fabric.util.createClass(F.BaseFilter, {
    type: 'RGBShift', amount: 0, mainParameter: 'amount',
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform float uShift;\nvarying vec2 vTexCoord;\nvoid main() {\nvec4 color = texture2D(uTexture, vTexCoord);\ncolor.r = texture2D(uTexture, vTexCoord + vec2(uShift, 0.0)).r;\ncolor.b = texture2D(uTexture, vTexCoord - vec2(uShift, 0.0)).b;\ngl_FragColor = color;\n}',
    applyTo2d(o) {
      const d = o.imageData.data, w = o.imageData.width, h = o.imageData.height, s = Math.round(this.amount * w);
      if (!s) return;
      const src = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] = src[(y * w + clamp(x + s, 0, w - 1)) * 4];
        d[i + 2] = src[(y * w + clamp(x - s, 0, w - 1)) * 4 + 2];
      }
    },
    getUniformLocations(gl, p) { return { uShift: gl.getUniformLocation(p, 'uShift') }; },
    sendUniformData(gl, u) { gl.uniform1f(u.uShift, this.amount); }
  });
  F.RGBShift.fromObject = F.BaseFilter.fromObject;

  /* Grade: S-curve, highlight roll-off, shadow lift and split-toning in one pass */
  const LUMA = [0.299, 0.587, 0.114];
  const GRADE_KEYS = ['lift', 'roll', 'curve', 'split', 'sh', 'hi'];
  F.Grade = fabric.util.createClass(F.BaseFilter, {
    type: 'Grade', lift: 0, roll: 0, curve: 0, split: 0, sh: [0, 0, 0], hi: [0, 0, 0],
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform float uLift;\nuniform float uRoll;\nuniform float uCurve;\nuniform float uSplit;\nuniform vec3 uSh;\nuniform vec3 uHi;\nvarying vec2 vTexCoord;\n' +
      'void main() {\nvec4 color = texture2D(uTexture, vTexCoord);\nvec3 c = color.rgb;\nvec3 s = c * c * (3.0 - 2.0 * c);\nc = clamp(c + (s - c) * uCurve, 0.0, 1.0);\n' +
      'float knee = 1.0 - 0.45 * uRoll;\nvec3 over = max(c - knee, 0.0);\nvec3 rolled = knee + (1.0 - knee) * (1.0 - exp(-over / max(1.0 - knee, 0.001)));\nc = mix(c, rolled, step(knee, c) * step(0.001, uRoll));\n' +
      'c = uLift + c * (1.0 - uLift);\nfloat l = dot(c, vec3(0.299, 0.587, 0.114));\nc += (uSh * (1.0 - l) + uHi * l) * uSplit;\ncolor.rgb = clamp(c, 0.0, 1.0);\ngl_FragColor = color;\n}',
    applyTo2d(o) {
      const d = o.imageData.data, { lift, roll, curve, split, sh, hi } = this, knee = 1 - 0.45 * roll;
      for (let i = 0; i < d.length; i += 4) {
        const c = [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255];
        for (let j = 0; j < 3; j++) {
          let v = c[j];
          v = clamp(v + (v * v * (3 - 2 * v) - v) * curve, 0, 1);
          if (roll > 0.001 && v > knee) v = knee + (1 - knee) * (1 - Math.exp(-(v - knee) / Math.max(1 - knee, 0.001)));
          c[j] = lift + v * (1 - lift);
        }
        const l = c[0] * LUMA[0] + c[1] * LUMA[1] + c[2] * LUMA[2];
        for (let j = 0; j < 3; j++) d[i + j] = clamp(c[j] + (sh[j] * (1 - l) + hi[j] * l) * split, 0, 1) * 255;
      }
    },
    isNeutralState() { return !this.lift && !this.roll && !this.curve && !this.split; },
    toObject() { const o = { type: this.type }; GRADE_KEYS.forEach(k => { o[k] = this[k]; }); return o; },
    getUniformLocations(gl, p) {
      const u = {};
      ['uLift', 'uRoll', 'uCurve', 'uSplit', 'uSh', 'uHi'].forEach(n => { u[n] = gl.getUniformLocation(p, n); });
      return u;
    },
    sendUniformData(gl, u) {
      gl.uniform1f(u.uLift, this.lift); gl.uniform1f(u.uRoll, this.roll); gl.uniform1f(u.uCurve, this.curve); gl.uniform1f(u.uSplit, this.split);
      gl.uniform3fv(u.uSh, this.sh); gl.uniform3fv(u.uHi, this.hi);
    }
  });
  F.Grade.fromObject = F.BaseFilter.fromObject;

  /* Glow: bloom from the bright parts of the image (golden-angle disc sampling), screened back on top */
  F.Glow = fabric.util.createClass(F.BaseFilter, {
    type: 'Glow', amount: 0, radius: 0.03, threshold: 0.5, mainParameter: 'amount',
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform float uAmount;\nuniform float uRadius;\nuniform float uThreshold;\nuniform float uAspect;\nvarying vec2 vTexCoord;\n' +
      'void main() {\nvec4 color = texture2D(uTexture, vTexCoord);\nvec3 acc = vec3(0.0);\nfor (int i = 0; i < 40; i++) {\nfloat fi = float(i);\nfloat a = fi * 2.39996;\nfloat r = sqrt((fi + 0.5) / 40.0) * uRadius;\n' +
      'vec3 s = texture2D(uTexture, vTexCoord + vec2(cos(a) * r, sin(a) * r * uAspect)).rgb;\nfloat b = max(0.0, dot(s, vec3(0.299, 0.587, 0.114)) - uThreshold) / (1.0 - uThreshold + 0.0001);\nacc += s * b;\n}\n' +
      'acc /= 40.0;\ncolor.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - clamp(acc * uAmount * 2.2, 0.0, 1.0));\ngl_FragColor = color;\n}',
    applyTo(o) { this._aspect = o.sourceWidth / o.sourceHeight; this.callSuper('applyTo', o); },
    applyTo2d(o) {
      const d = o.imageData.data, w = o.imageData.width, h = o.imageData.height, sc = 6;
      const sw = Math.max(1, Math.floor(w / sc)), shh = Math.max(1, Math.floor(h / sc));
      let buf = new Float32Array(sw * shh * 3);
      for (let y = 0; y < shh; y++) for (let x = 0; x < sw; x++) {
        const i = ((y * sc) * w + x * sc) * 4, r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        const k = Math.max(0, r * LUMA[0] + g * LUMA[1] + b * LUMA[2] - this.threshold) / (1 - this.threshold + 1e-4), j = (y * sw + x) * 3;
        buf[j] = r * k; buf[j + 1] = g * k; buf[j + 2] = b * k;
      }
      const R = Math.max(1, Math.round(this.radius * w / sc / 1.6));
      const blur = (src, horiz) => {
        const out = new Float32Array(src.length), n = horiz ? sw : shh, m = horiz ? shh : sw;
        for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
          let s0 = 0, s1 = 0, s2 = 0, cnt = 0;
          for (let t = Math.max(0, b - R); t <= Math.min(n - 1, b + R); t++) { const j = (horiz ? a * sw + t : t * sw + a) * 3; s0 += src[j]; s1 += src[j + 1]; s2 += src[j + 2]; cnt++; }
          const j = (horiz ? a * sw + b : b * sw + a) * 3; out[j] = s0 / cnt; out[j + 1] = s1 / cnt; out[j + 2] = s2 / cnt;
        }
        return out;
      };
      buf = blur(blur(buf, true), false);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const j = (Math.min(shh - 1, Math.floor(y / sc)) * sw + Math.min(sw - 1, Math.floor(x / sc))) * 3, i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) d[i + c] = 255 - (255 - d[i + c]) * (1 - clamp(buf[j + c] * this.amount * 2.2, 0, 1));
      }
    },
    toObject() { return { type: this.type, amount: this.amount, radius: this.radius, threshold: this.threshold }; },
    getUniformLocations(gl, p) { const u = {}; ['uAmount', 'uRadius', 'uThreshold', 'uAspect'].forEach(n => { u[n] = gl.getUniformLocation(p, n); }); return u; },
    sendUniformData(gl, u) { gl.uniform1f(u.uAmount, this.amount); gl.uniform1f(u.uRadius, this.radius); gl.uniform1f(u.uThreshold, this.threshold); gl.uniform1f(u.uAspect, this._aspect || 1); }
  });
  F.Glow.fromObject = F.BaseFilter.fromObject;

  /* VHS / MiniDV: line wobble, horizontal chroma bleed and scanlines */
  F.VHS = fabric.util.createClass(F.BaseFilter, {
    type: 'VHS', amount: 0, mainParameter: 'amount',
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform float uAmount;\nuniform float uLines;\nvarying vec2 vTexCoord;\n' +
      'void main() {\nvec2 uv = vTexCoord;\nfloat line = floor(uv.y * uLines);\nuv.x += (sin(line * 0.37) * 0.0006 + sin(line * 0.051) * 0.0014) * uAmount;\nvec4 color = texture2D(uTexture, uv);\nvec3 lw = vec3(0.299, 0.587, 0.114);\n' +
      'vec3 bleed = (texture2D(uTexture, uv + vec2(0.004 * uAmount, 0.0)).rgb + texture2D(uTexture, uv + vec2(0.009 * uAmount, 0.0)).rgb) * 0.5;\nfloat l = dot(color.rgb, lw);\nvec3 c = mix(color.rgb, vec3(l) + (bleed - vec3(dot(bleed, lw))), uAmount);\n' +
      'c *= 1.0 - uAmount * 0.16 * mod(line, 2.0);\ncolor.rgb = clamp(c, 0.0, 1.0);\ngl_FragColor = color;\n}',
    applyTo(o) { this._lines = Math.max(60, o.sourceHeight / 3); this.callSuper('applyTo', o); },
    applyTo2d(o) {
      const d = o.imageData.data, w = o.imageData.width, h = o.imageData.height, a = this.amount, src = new Uint8ClampedArray(d), lines = Math.max(60, h / 3);
      const b1 = Math.round(0.004 * a * w), b2 = Math.round(0.009 * a * w);
      for (let y = 0; y < h; y++) {
        const line = Math.floor(y / h * lines), shift = Math.round((Math.sin(line * 0.37) * 0.0006 + Math.sin(line * 0.051) * 0.0014) * a * w), dark = 1 - a * 0.16 * (line % 2);
        for (let x = 0; x < w; x++) {
          const at = xx => (y * w + clamp(xx, 0, w - 1)) * 4, i0 = at(x + shift), i1 = at(x + shift + b1), i2 = at(x + shift + b2), i = (y * w + x) * 4;
          const l = src[i0] * LUMA[0] + src[i0 + 1] * LUMA[1] + src[i0 + 2] * LUMA[2];
          const br = (src[i1] + src[i2]) / 2, bg = (src[i1 + 1] + src[i2 + 1]) / 2, bb = (src[i1 + 2] + src[i2 + 2]) / 2, bl = br * LUMA[0] + bg * LUMA[1] + bb * LUMA[2];
          d[i] = (src[i0] + (l + br - bl - src[i0]) * a) * dark;
          d[i + 1] = (src[i0 + 1] + (l + bg - bl - src[i0 + 1]) * a) * dark;
          d[i + 2] = (src[i0 + 2] + (l + bb - bl - src[i0 + 2]) * a) * dark;
        }
      }
    },
    getUniformLocations(gl, p) { return { uAmount: gl.getUniformLocation(p, 'uAmount'), uLines: gl.getUniformLocation(p, 'uLines') }; },
    sendUniformData(gl, u) { gl.uniform1f(u.uAmount, this.amount); gl.uniform1f(u.uLines, this._lines || 240); }
  });
  F.VHS.fromObject = F.BaseFilter.fromObject;

  /* horizontal motion blur (party-flash shake) */
  F.MotionBlur = fabric.util.createClass(F.BaseFilter, {
    type: 'MotionBlur', amount: 0, mainParameter: 'amount',
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform float uAmount;\nvarying vec2 vTexCoord;\n' +
      'void main() {\nvec4 acc = vec4(0.0);\nfor (int i = -8; i <= 8; i++) { acc += texture2D(uTexture, vTexCoord + vec2(float(i) / 8.0 * uAmount, 0.0)); }\ngl_FragColor = acc / 17.0;\n}',
    applyTo2d(o) {
      const d = o.imageData.data, w = o.imageData.width, h = o.imageData.height, R = Math.max(1, Math.round(this.amount * w)), src = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let s0 = 0, s1 = 0, s2 = 0, n = 0;
        for (let t = -8; t <= 8; t++) { const j = (y * w + clamp(x + Math.round(t / 8 * R), 0, w - 1)) * 4; s0 += src[j]; s1 += src[j + 1]; s2 += src[j + 2]; n++; }
        const i = (y * w + x) * 4; d[i] = s0 / n; d[i + 1] = s1 / n; d[i + 2] = s2 / n;
      }
    },
    getUniformLocations(gl, p) { return { uAmount: gl.getUniformLocation(p, 'uAmount') }; },
    sendUniformData(gl, u) { gl.uniform1f(u.uAmount, this.amount); }
  });
  F.MotionBlur.fromObject = F.BaseFilter.fromObject;

  /* Duotone: maps shadows→dark colour and highlights→light colour */
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  F.Duotone = fabric.util.createClass(F.BaseFilter, {
    type: 'Duotone', dark: [0, 0, 0], light: [1, 1, 1], amount: 0,
    fragmentSource: 'precision highp float;\nuniform sampler2D uTexture;\nuniform vec3 uDark;\nuniform vec3 uLight;\nuniform float uAmount;\nvarying vec2 vTexCoord;\n' +
      'void main() {\nvec4 color = texture2D(uTexture, vTexCoord);\nfloat l = dot(color.rgb, vec3(0.299, 0.587, 0.114));\ncolor.rgb = mix(color.rgb, mix(uDark, uLight, l), uAmount);\ngl_FragColor = color;\n}',
    applyTo2d(o) {
      const d = o.imageData.data, { dark, light, amount } = this;
      for (let i = 0; i < d.length; i += 4) {
        const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
        for (let c = 0; c < 3; c++) d[i + c] += ((dark[c] + (light[c] - dark[c]) * l) * 255 - d[i + c]) * amount;
      }
    },
    isNeutralState() { return !this.amount; },
    toObject() { return { type: this.type, dark: this.dark, light: this.light, amount: this.amount }; },
    getUniformLocations(gl, p) { return { uDark: gl.getUniformLocation(p, 'uDark'), uLight: gl.getUniformLocation(p, 'uLight'), uAmount: gl.getUniformLocation(p, 'uAmount') }; },
    sendUniformData(gl, u) { gl.uniform3fv(u.uDark, this.dark); gl.uniform3fv(u.uLight, this.light); gl.uniform1f(u.uAmount, this.amount); }
  });
  F.Duotone.fromObject = F.BaseFilter.fromObject;

  const IDENT = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  const mixMatrix = (m, k) => new F.ColorMatrix({ matrix: IDENT.map((v, i) => v + (m[i] - v) * k) });
  const GRAY_M = [0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0, 0, 0, 1, 0];
  const SEPIA_M = [0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0];
  const warm = a => new F.ColorMatrix({ matrix: [1 + 0.08 * a, 0, 0, 0, 0.03 * a, 0, 1 + 0.02 * a, 0, 0, 0.01 * a, 0, 0, 1 - 0.1 * a, 0, -0.01 * a, 0, 0, 0, 1, 0] });
  const fade = a => { const s = 1 - 0.2 * a, o = 0.11 * a; return new F.ColorMatrix({ matrix: [s, 0, 0, 0, o, 0, s, 0, 0, o, 0, 0, s, 0, o, 0, 0, 0, 1, 0] }); };
  const greenMagenta = a => new F.ColorMatrix({ matrix: [1 + 0.05 * a, 0, 0, 0, 0, 0, 1 - 0.09 * a, 0, 0, 0, 0, 0, 1 + 0.05 * a, 0, 0, 0, 0, 0, 1, 0] });
  const sharpen = a => new F.Convolute({ matrix: [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0] });
  /* fabric's BlendColor scales the colour itself by alpha (so "multiply 30%" goes almost black and overlay
     darkens). Emulate real layer opacity: multiply → pre-mix the colour with white; overlay → soft alpha wash. */
  const tint = (color, mode, alpha) => {
    if (mode === 'multiply') {
      const n = parseInt(color.slice(1), 16), mix = ch => Math.round(255 - (255 - ch) * alpha);
      color = `rgb(${mix(n >> 16 & 255)},${mix(n >> 8 & 255)},${mix(n & 255)})`;
      alpha = 1;
    } else if (mode === 'overlay') { mode = 'tint'; alpha *= 0.6; }
    return new F.BlendColor({ color, mode, alpha });
  };

  /* Looks are recipes; `k` (0–1) is the look strength, `w` the source width (for resolution-based effects) */
  function recipe(spec, k, w) {
    const out = [];
    if (k <= 0) return out;
    spec.forEach(([t, a, b, c]) => {
      switch (t) {
        case 'bri': out.push(new F.Brightness({ brightness: a * k })); break;
        case 'con': out.push(new F.Contrast({ contrast: a * k })); break;
        case 'sat': out.push(new F.Saturation({ saturation: a * k })); break;
        case 'vib': out.push(new F.Vibrance({ vibrance: a * k })); break;
        case 'warm': out.push(warm(a * k)); break;
        case 'fade': out.push(fade(a * k)); break;
        case 'gm': out.push(greenMagenta(a * k)); break;
        case 'tint': out.push(tint(a, b, c * k)); break;
        case 'blur': out.push(new F.Blur({ blur: a * k })); break;
        case 'noise': out.push(new F.Noise({ noise: a * k * (w < 400 ? 0.4 : 1) })); break; // tiny previews exaggerate grain
        case 'gamma': out.push(new F.Gamma({ gamma: a.map(g => 1 + (g - 1) * k) })); break;
        case 'gray': out.push(mixMatrix(GRAY_M, k)); break;
        case 'sepia': out.push(mixMatrix(SEPIA_M, k)); break;
        case 'sharp': out.push(sharpen(a * k)); break;
        case 'vig': out.push(new F.Vignette({ amount: a * k })); break;
        case 'rgb': out.push(new F.RGBShift({ amount: a * k })); break;
        case 'hue': out.push(new F.HueRotation({ rotation: a * k })); break;
        case 'grade': out.push(new F.Grade({ lift: (a.lift || 0) * k, roll: (a.roll || 0) * k, curve: (a.curve || 0) * k, split: (a.split || 0) * k, sh: a.sh || [0, 0, 0], hi: a.hi || [0, 0, 0] })); break;
        case 'glow': out.push(new F.Glow({ amount: a * k, radius: b, threshold: c })); break;
        case 'vhs': out.push(new F.VHS({ amount: a * k })); break;
        case 'motion': out.push(new F.MotionBlur({ amount: a * k })); break;
        case 'duo': out.push(new F.Duotone({ dark: hexRgb(a), light: hexRgb(b), amount: k })); break;
        case 'pix': { const bs = Math.round(1 + (w / a - 1) * k); if (bs >= 2) out.push(new F.Pixelate({ blocksize: bs })); break; }
      }
    });
    return out;
  }

  const FX0 = { preset: 'none', intensity: 100, exposure: 0, highlights: 0, shadows: 0, glow: 0, motion: 0, vhs: 0, brightness: 0, contrast: 0, saturation: 0, vibrance: 0, warmth: 0, tintc: 0, hue: 0, fade: 0,
    sharpen: 0, blur: 0, grain: 0, vignette: 0, rgb: 0, lowres: 0 };
  const PRESETS = [
    { id: 'none', name: 'Original', cat: 'all', spec: [] },
    /* Retro Cam — recreations of the looks listed for the DigiCamFX app (built by eye, renamed where the
       original name is a camera brand) */
    { id: 'rc-2000s', name: '2000s Digicam', cat: 'retrocam', spec: [['con', 0.15], ['sat', 0.18], ['sharp', 0.35], ['bri', 0.05], ['grade', { curve: 0.2, sh: [0, 0, 0.04], hi: [0, 0.02, 0.06], split: 0.6 }], ['noise', 14], ['vig', 0.15]] },
    { id: 'rc-ccd', name: 'CCD', cat: 'retrocam', spec: [['sat', 0.28], ['con', 0.2], ['sharp', 0.45], ['tint', '#C7D9FF', 'tint', 0.06], ['gm', 0.15], ['noise', 18], ['rgb', 0.0012], ['grade', { roll: 0.3 }]] },
    { id: 'rc-glowy', name: 'Glowy', cat: 'retrocam', spec: [['glow', 0.75, 0.035, 0.42], ['bri', 0.04], ['con', -0.05], ['sat', -0.05], ['grade', { roll: 0.6, lift: 0.03 }], ['tint', '#FFE4EC', 'screen', 0.12]] },
    { id: 'rc-5s', name: '5s', cat: 'retrocam', spec: [['warm', 0.25], ['sat', 0.08], ['grade', { curve: 0.1, lift: 0.02 }], ['sharp', 0.3], ['noise', 10], ['bri', 0.03]] },
    { id: 'rc-cyberpix', name: 'Cyberpix', cat: 'retrocam', spec: [['tint', '#7FB8FF', 'screen', 0.15], ['hue', -0.04], ['con', 0.25], ['sat', 0.15], ['rgb', 0.0025], ['noise', 22], ['sharp', 0.3]] },
    { id: 'rc-cameraphone', name: 'Early Cameraphone', cat: 'retrocam', spec: [['pix', 640], ['blur', 0.004], ['sat', -0.15], ['tint', '#FFE9B8', 'multiply', 0.18], ['noise', 38], ['con', 0.12], ['grade', { lift: 0.04 }]] },
    { id: 'rc-flipphone', name: 'Flip Phone', cat: 'retrocam', spec: [['pix', 400], ['blur', 0.005], ['sat', -0.2], ['noise', 45], ['tint', '#D6E8C8', 'multiply', 0.2], ['con', 0.15], ['rgb', 0.002]] },
    { id: 'rc-cloudy', name: 'Cloudy WB', cat: 'retrocam', spec: [['warm', 0.75], ['tint', '#FFD9B0', 'multiply', 0.1], ['sat', 0.05]] },
    { id: 'rc-flashparty', name: 'Y2K Flash Party', cat: 'retrocam', spec: [['bri', 0.12], ['con', 0.3], ['sat', 0.15], ['vig', 0.6], ['glow', 0.35, 0.02, 0.6], ['noise', 15]] },
    { id: 'rc-motion', name: 'Motion Flash', cat: 'retrocam', spec: [['motion', 0.012], ['bri', 0.06], ['con', 0.2], ['vig', 0.4], ['sharp', 0.2]] },
    { id: 'rc-minidv', name: 'MiniDV', cat: 'retrocam', spec: [['vhs', 0.45], ['sat', 0.1], ['con', 0.1], ['sharp', 0.4], ['tint', '#CFE3FF', 'tint', 0.05], ['noise', 16], ['rgb', 0.002]] },
    { id: 'rc-vhs', name: 'VHS', cat: 'retrocam', spec: [['vhs', 1], ['sat', -0.05], ['blur', 0.006], ['fade', 0.2], ['noise', 30], ['rgb', 0.004], ['tint', '#E8D9FF', 'tint', 0.05]] },
    { id: 'rc-camcorder', name: 'Camcorder', cat: 'retrocam', spec: [['vhs', 0.6], ['warm', 0.2], ['sat', 0.15], ['sharp', 0.3], ['vig', 0.2], ['rgb', 0.002]] },
    { id: 'rc-filmnc', name: 'Film NC', cat: 'retrocam', spec: [['grade', { lift: 0.04, roll: 0.5, curve: -0.05, sh: [-0.01, 0.02, 0], hi: [0.03, 0.015, -0.01], split: 1 }], ['sat', -0.06], ['noise', 20]] },
    { id: 'rc-filmnn', name: 'Film NN', cat: 'retrocam', spec: [['grade', { lift: 0.03, roll: 0.4, sh: [0, 0.01, 0.02], hi: [0, 0.01, 0.02], split: 1 }], ['sat', -0.15], ['con', 0.05], ['noise', 18]] },
    { id: 'rc-filmflash', name: 'Film Flash', cat: 'retrocam', spec: [['bri', 0.08], ['con', 0.22], ['warm', 0.35], ['vig', 0.5], ['noise', 40], ['grade', { roll: 0.4 }]] },
    { id: 'rc-rangefinder', name: 'Rangefinder', cat: 'retrocam', spec: [['grade', { curve: 0.25, roll: 0.5, sh: [0, 0.015, 0.02], hi: [0.025, 0.01, -0.01], split: 1 }], ['sat', -0.18], ['sharp', 0.2], ['noise', 12]] },
    { id: 'rc-fadedchrome', name: 'Faded Chrome', cat: 'retrocam', spec: [['sat', -0.3], ['con', 0.15], ['grade', { curve: 0.15, roll: 0.3, sh: [-0.01, 0.01, 0.02], hi: [0.03, 0.02, 0], split: 1 }], ['hue', 0.015]] },
    { id: 'rc-positive', name: 'Positive Slide', cat: 'retrocam', spec: [['sat', 0.35], ['con', 0.28], ['gm', 0.12], ['grade', { curve: 0.2, roll: 0.2 }], ['vig', 0.25]] },
    { id: 'rc-negative', name: 'Negative Film', cat: 'retrocam', spec: [['fade', 0.3], ['grade', { roll: 0.5, sh: [-0.03, 0.02, 0.04], hi: [0.04, 0.02, -0.02], split: 1 }], ['sat', -0.1], ['noise', 24]] },
    { id: 'rc-cinematic', name: 'Cinematic', cat: 'retrocam', spec: [['grade', { curve: 0.2, roll: 0.5, sh: [-0.03, 0.01, 0.05], hi: [0.06, 0.02, -0.04], split: 1 }], ['sat', -0.08], ['vig', 0.25], ['noise', 10]] },
    { id: 'rc-chrome', name: 'Chrome', cat: 'retrocam', spec: [['sat', 0.1], ['con', 0.25], ['grade', { curve: 0.25, roll: 0.3, sh: [0, 0, 0.03], split: 1 }], ['vib', 0.2], ['sharp', 0.2]] },
    { id: 'rc-noir', name: 'Noir', cat: 'retrocam', spec: [['gray'], ['con', 0.4], ['grade', { curve: 0.3 }], ['vig', 0.55], ['noise', 30], ['bri', -0.05]] },
    { id: 'rc-mono', name: 'Mono', cat: 'retrocam', spec: [['gray'], ['con', 0.12], ['noise', 16]] },
    { id: 'rc-fade', name: 'Fade', cat: 'retrocam', spec: [['fade', 0.55], ['sat', -0.2], ['con', -0.08]] },
    { id: 'rc-process', name: 'Process', cat: 'retrocam', spec: [['grade', { curve: 0.3, sh: [-0.02, 0, 0.08], hi: [0.05, 0.06, -0.08], split: 1 }], ['sat', 0.25], ['con', 0.15]] },
    { id: 'rc-transfer', name: 'Transfer', cat: 'retrocam', spec: [['fade', 0.45], ['warm', 0.4], ['sat', -0.25], ['noise', 45], ['blur', 0.003], ['grade', { roll: 0.6 }]] },
    { id: 'rc-instant', name: 'Instant', cat: 'retrocam', spec: [['fade', 0.3], ['warm', 0.3], ['sat', 0.1], ['tint', '#8FD3C8', 'exclusion', 0.06], ['noise', 18], ['vig', 0.25], ['grade', { roll: 0.5 }]] },
    { id: 'rc-tonal', name: 'Tonal', cat: 'retrocam', spec: [['sat', -0.55], ['grade', { curve: 0.1, sh: [-0.02, 0, 0.05], hi: [0.06, 0.03, -0.02], split: 1 }]] },
    { id: 'rc-cyanotype', name: 'Cyanotype', cat: 'retrocam', spec: [['gray'], ['grade', { lift: 0.05, sh: [-0.18, -0.08, 0.12], hi: [-0.06, -0.01, 0.04], split: 1 }], ['con', 0.1]] },
    /* digicam */
    { id: 'digi05', name: "Digicam '05", cat: 'digicam', spec: [['con', 0.18], ['sat', 0.12], ['bri', 0.04], ['sharp', 0.4], ['tint', '#BFD8FF', 'tint', 0.07], ['noise', 16], ['rgb', 0.0015], ['vig', 0.25]] },
    { id: 'flash', name: 'Direct Flash', cat: 'digicam', spec: [['bri', 0.12], ['con', 0.26], ['sat', 0.06], ['vig', 0.55], ['sharp', 0.3], ['noise', 12], ['tint', '#EAF2FF', 'tint', 0.05]] },
    { id: 'nightflash', name: 'Night Flash', cat: 'digicam', spec: [['bri', 0.05], ['con', 0.42], ['sat', -0.05], ['vig', 0.85], ['tint', '#1A2238', 'multiply', 0.25], ['noise', 30], ['sharp', 0.3]] },
    { id: 'cyber', name: 'Cyber Blue', cat: 'digicam', spec: [['tint', '#9CC9FF', 'screen', 0.2], ['sat', -0.1], ['con', 0.14], ['hue', -0.03], ['sharp', 0.3], ['rgb', 0.002]] },
    { id: 'ccdwarm', name: 'CCD Warm', cat: 'digicam', spec: [['warm', 0.55], ['sat', 0.16], ['con', 0.12], ['sharp', 0.25], ['noise', 18], ['vig', 0.2]] },
    { id: 'pinkdigi', name: 'Pink Digi', cat: 'digicam', spec: [['tint', '#FFC2D6', 'screen', 0.2], ['con', 0.14], ['sat', 0.08], ['sharp', 0.3], ['rgb', 0.0015], ['vig', 0.25]] },
    { id: 'y2kpop', name: 'Y2K Pop', cat: 'digicam', spec: [['sat', 0.32], ['vib', 0.35], ['con', 0.16], ['rgb', 0.003], ['sharp', 0.25]] },
    { id: 'iceflash', name: 'Icy Flash', cat: 'digicam', spec: [['bri', 0.08], ['con', 0.2], ['tint', '#D8ECFF', 'multiply', 0.25], ['sat', -0.2], ['vig', 0.4], ['sharp', 0.3]] },
    { id: 'overexposed', name: 'Overexposed', cat: 'digicam', spec: [['bri', 0.2], ['con', -0.1], ['sat', -0.18], ['tint', '#FFF2E8', 'screen', 0.25], ['blur', 0.004]] },
    { id: 'vga', name: 'VGA 0.3MP', cat: 'digicam', spec: [['pix', 640], ['sat', 0.1], ['con', 0.12], ['noise', 22], ['rgb', 0.002], ['sharp', 0.2]] },
    { id: 'camphone', name: 'Camera Phone', cat: 'digicam', spec: [['pix', 800], ['sat', -0.12], ['tint', '#FFE6B0', 'multiply', 0.15], ['con', 0.1], ['noise', 40], ['blur', 0.003]] },
    { id: 'webcam', name: '2008 Webcam', cat: 'digicam', spec: [['pix', 480], ['sat', -0.25], ['tint', '#C8E0C0', 'multiply', 0.22], ['con', 0.2], ['noise', 34]] },
    /* film */
    { id: 'warmfilm', name: 'Warm Film', cat: 'film', spec: [['warm', 0.6], ['con', 0.06], ['tint', '#FFB46B', 'overlay', 0.16], ['noise', 45]] },
    { id: 'retro35', name: '35mm Retro', cat: 'film', spec: [['fade', 0.5], ['sat', -0.12], ['gamma', [1.04, 1.03, 0.88]], ['tint', '#F4E2C4', 'multiply', 0.14], ['noise', 45]] },
    { id: 'portra', name: 'Portrait Soft', cat: 'film', spec: [['warm', 0.3], ['fade', 0.2], ['sat', -0.05], ['con', -0.04], ['tint', '#FFDCC8', 'tint', 0.05], ['noise', 20]] },
    { id: 'golden', name: 'Golden Hour', cat: 'film', spec: [['warm', 0.9], ['sat', 0.08], ['tint', '#FFC56E', 'overlay', 0.2], ['bri', 0.03]] },
    { id: 'disposable', name: 'Disposable', cat: 'film', spec: [['warm', 0.4], ['fade', 0.3], ['vig', 0.5], ['noise', 50], ['sat', 0.1], ['sharp', 0.1]] },
    { id: 'lomo', name: 'Lomo', cat: 'film', spec: [['con', 0.3], ['sat', 0.3], ['vig', 0.75], ['tint', '#FFD8A8', 'tint', 0.06]] },
    { id: 'tungsten', name: 'Tungsten 800', cat: 'film', spec: [['tint', '#4F7FA8', 'multiply', 0.18], ['con', 0.1], ['noise', 40], ['fade', 0.15], ['hue', 0.02]] },
    { id: 'chrome70', name: 'Retro Chrome', cat: 'film', spec: [['con', 0.22], ['sat', 0.22], ['gamma', [1.0, 0.96, 0.9]], ['vig', 0.2]] },
    { id: 'polaroid', name: 'Instant', cat: 'film', spec: [['fade', 0.3], ['warm', 0.3], ['sat', 0.1], ['tint', '#8FD3C8', 'exclusion', 0.06], ['noise', 18]] },
    { id: 'matte', name: 'Faded Matte', cat: 'film', spec: [['fade', 0.65], ['sat', -0.25], ['con', -0.08], ['tint', '#D9E4E8', 'multiply', 0.1]] },
    /* soft */
    { id: 'dreamy', name: 'Dreamy Glow', cat: 'soft', spec: [['bri', 0.07], ['con', -0.14], ['sat', -0.12], ['tint', '#FFE9EC', 'screen', 0.24], ['blur', 0.012]] },
    { id: 'coquette', name: 'Coquette Pink', cat: 'soft', spec: [['bri', 0.05], ['sat', -0.08], ['tint', '#FFC2D1', 'screen', 0.26], ['tint', '#F7A1B5', 'multiply', 0.08], ['con', -0.06], ['blur', 0.005]] },
    { id: 'peach', name: 'Peachy', cat: 'soft', spec: [['tint', '#FFD3B8', 'screen', 0.18], ['warm', 0.3], ['con', -0.06], ['bri', 0.04]] },
    { id: 'lavender', name: 'Lavender Haze', cat: 'soft', spec: [['tint', '#D9C8F2', 'screen', 0.2], ['sat', -0.1], ['con', -0.08], ['blur', 0.004]] },
    { id: 'milktea', name: 'Milk Tea', cat: 'soft', spec: [['fade', 0.35], ['warm', 0.35], ['sat', -0.22], ['tint', '#E8D3BC', 'multiply', 0.15]] },
    { id: 'cherry', name: 'Cherry Cola', cat: 'soft', spec: [['tint', '#B0304A', 'multiply', 0.12], ['con', 0.18], ['sat', 0.1], ['vig', 0.3], ['warm', 0.2]] },
    /* black & white / toned */
    { id: 'bw', name: 'B&W Soft', cat: 'bw', spec: [['gray'], ['con', 0.1], ['fade', 0.22], ['noise', 20]] },
    { id: 'silver', name: 'Silver Gelatin', cat: 'bw', spec: [['gray'], ['con', 0.18], ['fade', 0.12], ['noise', 26], ['vig', 0.3]] },
    { id: 'flashbw', name: 'B&W Flash', cat: 'bw', spec: [['gray'], ['bri', 0.1], ['con', 0.35], ['vig', 0.5], ['sharp', 0.3]] },
    { id: 'noir', name: 'Noir', cat: 'bw', spec: [['gray'], ['con', 0.35], ['bri', -0.08], ['noise', 40]] },
    { id: 'sepia', name: 'Sepia', cat: 'bw', spec: [['sepia'], ['fade', 0.15], ['noise', 18]] },
    { id: 'rosesepia', name: 'Rose Sepia', cat: 'bw', spec: [['sepia'], ['tint', '#E7A3B0', 'overlay', 0.28], ['fade', 0.2]] },
    { id: 'moody', name: 'Moody Sepia', cat: 'bw', spec: [['sat', -0.5], ['con', 0.14], ['bri', -0.06], ['tint', '#6B4429', 'multiply', 0.3], ['noise', 24]] }
  ];
  PRESETS.push(...(A.MORE_PRESETS || []));
  const PRESET_BY_ID = Object.fromEntries(PRESETS.map(p => [p.id, p]));
  const SLIDER_GROUPS = [
    { title: 'Light & color', items: [
      { k: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { k: 'brightness', label: 'Brightness', min: -100, max: 100 },
      { k: 'highlights', label: 'Highlight roll-off', min: 0, max: 100 },
      { k: 'shadows', label: 'Lift shadows', min: 0, max: 100 },
      { k: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { k: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { k: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
      { k: 'warmth', label: 'Warmth', min: -100, max: 100 },
      { k: 'tintc', label: 'Tint (green ↔ pink)', min: -100, max: 100 },
      { k: 'hue', label: 'Hue shift', min: -100, max: 100 },
      { k: 'fade', label: 'Fade', min: 0, max: 100 }
    ] },
    { title: 'Texture & digicam', items: [
      { k: 'glow', label: 'Glow / bloom', min: 0, max: 100 },
      { k: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
      { k: 'motion', label: 'Motion blur', min: 0, max: 100 },
      { k: 'vhs', label: 'VHS scanlines', min: 0, max: 100 },
      { k: 'blur', label: 'Soft focus', min: 0, max: 100 },
      { k: 'grain', label: 'Grain / noise', min: 0, max: 100 },
      { k: 'vignette', label: 'Flash vignette', min: 0, max: 100 },
      { k: 'rgb', label: 'RGB split', min: 0, max: 100 },
      { k: 'lowres', label: 'Low-res pixels', min: 0, max: 100 }
    ] }
  ];
  const SLIDERS = SLIDER_GROUPS.flatMap(g => g.items);
  function buildFilters(fx, w = 1000) {
    const list = recipe((PRESET_BY_ID[fx.preset] || PRESETS[0]).spec, (fx.intensity ?? 100) / 100, w);
    if (fx.exposure) { const e = Math.pow(2, fx.exposure / 100); list.push(new F.ColorMatrix({ matrix: [e, 0, 0, 0, 0, 0, e, 0, 0, 0, 0, 0, e, 0, 0, 0, 0, 0, 1, 0] })); }
    if (fx.highlights || fx.shadows) list.push(new F.Grade({ roll: fx.highlights / 100, lift: fx.shadows / 100 * 0.15 }));
    if (fx.glow) list.push(new F.Glow({ amount: fx.glow / 100, radius: 0.035, threshold: 0.45 }));
    if (fx.motion) list.push(new F.MotionBlur({ amount: fx.motion / 100 * 0.02 }));
    if (fx.vhs) list.push(new F.VHS({ amount: fx.vhs / 100 }));
    if (fx.brightness) list.push(new F.Brightness({ brightness: fx.brightness / 100 * 0.35 }));
    if (fx.contrast) list.push(new F.Contrast({ contrast: fx.contrast / 100 * 0.45 }));
    if (fx.saturation) list.push(new F.Saturation({ saturation: fx.saturation / 100 }));
    if (fx.vibrance) list.push(new F.Vibrance({ vibrance: fx.vibrance / 100 * 0.8 }));
    if (fx.warmth) list.push(warm(fx.warmth / 100));
    if (fx.tintc) list.push(greenMagenta(fx.tintc / 100));
    if (fx.hue) list.push(new F.HueRotation({ rotation: fx.hue / 100 * 0.3 }));
    if (fx.fade) list.push(fade(fx.fade / 100));
    if (fx.sharpen) list.push(sharpen(fx.sharpen / 100 * 0.8));
    if (fx.blur) list.push(new F.Blur({ blur: fx.blur / 100 * 0.05 }));
    if (fx.grain) list.push(new F.Noise({ noise: fx.grain * 1.6 }));
    if (fx.vignette) list.push(new F.Vignette({ amount: fx.vignette / 100 * 0.9 }));
    if (fx.rgb) list.push(new F.RGBShift({ amount: fx.rgb / 100 * 0.008 }));
    if (fx.lowres) { const target = w - (w - 220) * fx.lowres / 100, bs = Math.round(w / target); if (bs >= 2) list.push(new F.Pixelate({ blocksize: bs })); }
    return list;
  }
  /* run the filter chain; if the GPU (WebGL) path fails on this device, fall back to the CPU backend */
  function applyFx(img) {
    if (!img || !img.canvas) return;
    img.filters = buildFilters({ ...FX0, ...(img.fx || {}) }, img.getOriginalSize().width);
    try {
      img.applyFilters();
    } catch (e) {
      console.warn('GPU filters failed, switching to CPU rendering', e);
      if (!(fabric.filterBackend instanceof fabric.Canvas2dFilterBackend)) {
        fabric.filterBackend = new fabric.Canvas2dFilterBackend();
        try { img.applyFilters(); } catch (e2) { console.error(e2); toast('Sorry, that filter could not run on this device'); }
      }
    }
    img.dirty = true;
    canvas.requestRenderAll();
  }
  /* the photo the Filters panel edits: the selected one, else the last one edited, else the top photo */
  let fxPhotoId = null;
  function fxPhoto() {
    const a = activePhoto();
    if (a) { fxPhotoId = a.id; return a; }
    const last = fxPhotoId && byId(fxPhotoId);
    if (last && last.kind === 'photo') return last;
    const photos = canvas.getObjects().filter(o => o.kind === 'photo');
    return photos.length ? photos[photos.length - 1] : null;
  }
  let fxTimer = 0;
  function setFx(patch) {
    const p = fxPhoto();
    if (!p) return toast('Add a photo first, then pick a filter');
    p.fx = { ...FX0, ...(p.fx || {}), ...patch };
    clearTimeout(fxTimer);
    fxTimer = setTimeout(() => applyFx(p), 16); // throttles slider drags; timers always fire, unlike rAF
    syncFxPanel();
    pushHistory();
  }

  let thumbsFor = null;
  const samplePhoto = A.sampleImage(160);
  function buildPresetThumbs(photo) {
    const key = photo ? photo.id : 'sample';
    if (key === thumbsFor) return;
    thumbsFor = key;
    const src = photo ? (photo._originalElement || photo.getElement()) : samplePhoto;
    const size = 120, cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    const sx = photo ? photo.cropX : 0, sy = photo ? photo.cropY : 0, w = photo ? photo.width : sw, h = photo ? photo.height : sh;
    const m = Math.min(w, h);
    cv.getContext('2d').drawImage(src, sx + (w - m) / 2, sy + (h - m) / 2, m, m, 0, 0, size, size);
    let i = 0;
    const step = () => {
      if (thumbsFor !== key || i >= PRESETS.length) return;
      const p = PRESETS[i++], el = $(`#presetGrid .preset[data-id="${p.id}"] img`);
      try {
        const fi = new fabric.Image(cv);
        fi.filters = recipe(p.spec, 1, size);
        fi.applyFilters();
        if (el) el.src = fi.getElement().toDataURL('image/jpeg', 0.85);
      } catch (e) { if (el) el.src = cv.toDataURL(); }
      setTimeout(step, 0);
    };
    step();
  }

  /* ------------------------------------------------------------------ */
  /* history                                                             */
  /* ------------------------------------------------------------------ */
  const hist = { stack: [], idx: -1, lock: false, timer: 0 };
  const snapshot = () => ({ json: canvas.toObject(PROPS), page: JSON.parse(JSON.stringify(page)) });
  function commitHistory() {
    hist.stack = hist.stack.slice(0, hist.idx + 1);
    hist.stack.push(snapshot());
    if (hist.stack.length > 50) hist.stack.shift();
    hist.idx = hist.stack.length - 1;
    updateUndo();
  }
  function pushHistory() {
    if (hist.lock || crop) return;
    clearTimeout(hist.timer);
    hist.timer = setTimeout(() => { if (!hist.lock && !crop) commitHistory(); }, 250);
  }
  function updateUndo() {
    $('#undoBtn').disabled = hist.idx <= 0;
    $('#redoBtn').disabled = hist.idx >= hist.stack.length - 1;
  }
  function restore(s) {
    hist.lock = true;
    clearTimeout(hist.timer);
    const sizeChanged = s.page.w !== page.w || s.page.h !== page.h;
    Object.assign(page, JSON.parse(JSON.stringify(s.page)));
    canvas.discardActiveObject();
    canvas.loadFromJSON(s.json, () => {
      relinkAll();
      canvas.getObjects().forEach(o => { if (o.type === 'i-text' && o.curve) applyCurve(o); });
      if (sizeChanged) { fit(); buildFinish(); } else updateFinish();
      applyBackground();
      canvas.renderAll();
      hist.lock = false;
      updateUndo(); renderLayers(); syncAll(); syncCanvasPanel();
    });
  }
  function undo() { if (crop) endCrop(false); if (hist.idx > 0) { hist.idx--; restore(hist.stack[hist.idx]); } }
  function redo() { if (crop) endCrop(false); if (hist.idx < hist.stack.length - 1) { hist.idx++; restore(hist.stack[hist.idx]); } }

  /* ------------------------------------------------------------------ */
  /* canvas events                                                       */
  /* ------------------------------------------------------------------ */
  function onTransforming(e) {
    const t = e.target;
    if (crop) { if (t === crop.rect) updateCropMask(); return; }
    const set = new Set(t.type === 'activeSelection' ? t.getObjects() : [t]);
    set.forEach(o => { if (o.kind === 'frame') syncFrame(o, set); syncAttached(o, set); });
  }
  ['object:moving', 'object:scaling', 'object:rotating', 'object:skewing'].forEach(ev => canvas.on(ev, onTransforming));

  canvas.on('object:modified', e => {
    const t = e.target;
    if (!t || crop) return;
    const objs = t.type === 'activeSelection' ? t.getObjects() : [t], set = new Set(objs);
    objs.forEach(o => {
      if (o.kind === 'frame') { syncFrame(o, set); photosIn(o).forEach(p => computeRel(p, o)); }
      else if (o.frameId) { const fr = byId(o.frameId); if (fr) { computeRel(o, fr); o.clipPath = clipFor(fr, o.hole, o.clipPath); } }
      syncAttached(o, set);
      attachedTo(o).forEach(a => computeAttachRel(a, o));
      if (o.kind === 'frame') photosIn(o).forEach(p => attachedTo(p).forEach(a => computeAttachRel(a, p)));
      if (o.attachTo) { const host = byId(o.attachTo); host ? computeAttachRel(o, host) : detach(o); }
    });
    // drop a loose photo onto an empty frame window → it snaps inside
    const action = e.action || (e.transform && e.transform.action);
    if (t.kind === 'photo' && !t.frameId && action === 'drag') {
      const hit = findHole(t.getCenterPoint(), { emptyOnly: true });
      if (hit && canvas.getObjects().indexOf(hit.frame) > -1) {
        linkPhoto(t, hit.frame, hit.hole);
        toast('Placed inside the frame ✿');
      }
    }
    if (t.type === 'i-text' && t.curve) applyCurve(t);
    pushHistory();
    renderLayers();
  });

  canvas.on('object:added', e => { if (e.target && e.target.kind !== 'helper') { pushHistory(); scheduleLayers(); } });
  canvas.on('object:removed', e => { if (e.target && e.target.kind !== 'helper') { pushHistory(); scheduleLayers(); } });

  function onSelection() {
    if (crop) return;
    updateCtx(); syncAll(); scheduleLayers();
    const t = activeText();
    if (t && !hist.lock && !isMobile() && currentTab !== 'layers') switchTab('text');
  }
  canvas.on('selection:created', onSelection);
  canvas.on('selection:updated', onSelection);
  canvas.on('selection:cleared', onSelection);

  canvas.on('mouse:dblclick', opt => {
    if (crop) return;
    const t = opt.target;
    if (t && t.type === 'i-text') return;
    const hit = findHole(canvas.getPointer(opt.e));
    if (!hit) return;
    if (t && t.kind === 'photo' && t !== hit.occupant) return;
    pendingFill = hit;
    $('#photoInput').click();
  });

  canvas.on('text:editing:entered', e => { const t = e.target; if (t && t.curve) { t.set('path', null); t.objectCaching = true; t.initDimensions(); canvas.requestRenderAll(); } });
  canvas.on('text:editing:exited', e => {
    const t = e.target;
    if (!t) return;
    if (!t.text.trim()) { canvas.remove(t); return; }
    if (t.curve) applyCurve(t);
    t.name = 'Text';
    canvas.requestRenderAll(); renderLayers(); pushHistory();
  });
  canvas.on('text:changed', () => pushHistory());

  /* ------------------------------------------------------------------ */
  /* context toolbar                                                     */
  /* ------------------------------------------------------------------ */
  const KIND_LABEL = { photo: 'Photo', frame: 'Frame', sticker: 'Sticker', text: 'Text', multi: 'Selection', group: 'Group' };
  function updateCtx() {
    const bar = $('#ctxbar'), o = canvas.getActiveObject();
    if (!o || crop || o.kind === 'helper') { bar.hidden = true; return; }
    const kind = o.type === 'activeSelection' ? 'multi' : (o.kind || 'sticker');
    const linked = !!o.frameId, attached = !!o.attachTo, sel = activeObjs();
    const hasFrames = canvas.getObjects().some(x => x.kind === 'frame');
    const framable = (kind === 'photo' && !linked && hasFrames) || (kind === 'multi' && sel.some(x => x.kind === 'frame') && sel.some(x => x.kind === 'photo'));
    const groupable = kind === 'multi' && !sel.some(x => x.kind === 'frame' || x.frameId);
    const flags = { framable, groupable };
    $$('[data-show]', bar).forEach(el => {
      const show = el.dataset.show.split(' ');
      el.hidden = !(show.includes('any') || show.includes(kind) || (linked && show.includes('linked')) || (attached && show.includes('attached')) || show.some(f => flags[f]));
    });
    $('#kindTag').textContent = linked ? 'Framed photo' : attached ? 'Pinned to photo' : (KIND_LABEL[kind] || 'Item');
    const locked = activeObjs().every(x => x.isLocked);
    $('#lockBtn').innerHTML = icon(locked ? 'unlock' : 'lock');
    $('#lockBtn').classList.toggle('on', locked);
    $('[data-cmd="shadow"]', bar).classList.toggle('on', !!o.shadow);
    const op = $('#opacity');
    op.value = Math.round((o.opacity ?? 1) * 100);
    paintRange(op);
    bar.hidden = false;
    refreshIcons();
  }

  /* ------------------------------------------------------------------ */
  /* panels                                                              */
  /* ------------------------------------------------------------------ */
  let currentTab = 'photos';
  function switchTab(tab) {
    currentTab = tab;
    $$('.rail-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.tab').forEach(s => s.classList.toggle('active', s.dataset.tab === tab));
    if (isMobile()) $('#panel').classList.add('open');
    if (tab === 'filters') syncFxPanel();
    if (tab === 'layers') renderLayers();
    requestAnimationFrame(fit);
  }
  function closeMobilePanel() {
    $('#panel').classList.remove('open');
    $$('.rail-btn').forEach(b => b.classList.remove('active'));
    requestAnimationFrame(fit);
  }

  function paintRange(el) {
    const p = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty('--p', p + '%');
  }
  function bindRange(id, fn, fmt = v => v) {
    const el = $('#' + id), out = $('#' + id + 'Out');
    const upd = () => { paintRange(el); if (out) out.textContent = fmt(+el.value); };
    el.addEventListener('input', () => { upd(); fn(+el.value, false); });
    el.addEventListener('change', () => fn(+el.value, true));
    upd();
    return { el, set(v) { el.value = v; upd(); } };
  }

  /* --- frames & stickers grids --- */
  let frameCat = 'all';
  function renderFrames() {
    $('#frameGrid').innerHTML = A.FRAMES.filter(f => frameCat === 'all' || f.cat === frameCat).map(f =>
      `<button class="tile frame" draggable="true" data-kind="frame" data-id="${f.id}" title="${esc(f.name)}"><img src="${A.svgUrl(f.svg)}" alt="${esc(f.name)}" loading="lazy"><span class="tile-name">${esc(f.name)}</span></button>`).join('');
  }

  let stickerCat = 'all';
  let customStickers = store.get('pp.stickers', []);
  function renderStickers() {
    const g = $('#stickerGrid');
    let html = '';
    if (stickerCat === 'mine') {
      html += `<button class="tile upload" id="stickerUploadTile">${icon('upload-cloud')}<span>Upload PNG</span></button>`;
      html += customStickers.map((u, i) => `<button class="tile" draggable="true" data-kind="custom" data-id="${i}" title="My sticker"><img src="${u}" alt=""><span class="tile-x" data-remove="${i}" title="Remove">×</span></button>`).join('');
      if (!customStickers.length) html += '<p class="empty">Upload transparent PNGs to build your own sticker set. They\'re saved in this browser.</p>';
    } else {
      if (stickerCat !== 'quotes') {
        html += A.STICKERS.filter(s => stickerCat === 'all' || s.cat === stickerCat).map(s =>
          `<button class="tile" draggable="true" data-kind="sticker" data-id="${s.id}" title="${esc(s.name)}"><img src="${A.svgUrl(s.svg)}" alt="${esc(s.name)}" loading="lazy"></button>`).join('');
      }
      if (stickerCat === 'quotes' || stickerCat === 'all') {
        html += A.QUOTES.map((q, i) =>
          `<button class="tile quote" draggable="true" data-kind="quote" data-id="${i}" style="font-family:'${q.font}';color:${q.fill};${q.italic ? 'font-style:italic;' : ''}${q.bg ? `background:${q.bg};` : ''}${q.charSpacing ? `letter-spacing:${q.charSpacing / 1000}em;font-size:18px;` : ''}">${esc(q.text.trim())}</button>`).join('');
      }
      if (stickerCat === 'all') html += `<button class="tile upload" id="stickerUploadTile">${icon('upload-cloud')}<span>Your PNG</span></button>`;
    }
    g.innerHTML = html;
    refreshIcons();
  }
  async function handleStickerFiles(files) {
    for (const file of Array.from(files)) {
      try {
        const url = await readImageFile(file, 1400);
        customStickers.unshift(url);
        if (!store.set('pp.stickers', customStickers.slice(0, 24))) toast('Sticker added (browser storage is full, so it won\'t be kept after reload)');
        await addImageSticker(url);
      } catch (e) { toast(`Couldn't open ${file.name}`); }
    }
    customStickers = customStickers.slice(0, 24);
    stickerCat = 'mine';
    $$('#stickerCats .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'mine'));
    renderStickers();
    pushHistory();
  }

  /* --- text panel --- */
  const TEXT_COLORS = ['#3A2C2A', '#6E2A3A', '#A94F63', '#C47A88', '#F4C7CF', '#FFFDF8', '#C9A45C', '#6F7F52', '#8B6B57', '#8C78B6', '#4D6A80', '#000000'];
  let textUI = {};
  function buildTextPanel() {
    $('#textPresets').innerHTML = A.TEXT_PRESETS.map((p, i) =>
      `<button class="text-preset" draggable="true" data-kind="preset" data-id="${i}"><small>${esc(p.label)}</small><span style="font-family:'${p.font}';color:${p.fill || '#8A929C'};${p.weight ? 'font-weight:' + p.weight + ';' : ''}${p.bg ? 'background:' + p.bg + ';padding:0 6px;' : ''}${p.hl ? 'background:' + p.hl + ';' : ''}${p.italic ? 'font-style:italic;' : ''}${p.charSpacing ? 'letter-spacing:.2em;font-size:19px;' : ''}">${esc(p.text)}</span></button>`).join('');
    $('#fontSel').innerHTML = A.FONTS.map(g => `<optgroup label="${esc(g.group)}">${g.fonts.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('')}</optgroup>`).join('');

    const swatches = (el, colors, onPick, extra = '') => {
      el.innerHTML = colors.map(c => `<button class="swatch" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('') + `<input type="color" class="color-input" title="Custom color" ${extra}>`;
      el.addEventListener('click', e => { const b = e.target.closest('.swatch'); if (b) onPick(b.dataset.c); });
      el.querySelector('input').addEventListener('input', e => onPick(e.target.value));
    };
    swatches($('#textSwatches'), TEXT_COLORS, c => setTextProps({ fill: c }));
    swatches($('#shadowSwatches'), ['#3A2C2A', '#6E2A3A', '#FFFFFF', '#F4C7CF', '#C9A45C'], c => { textUI.shadowColor = c; updateTextShadow(); });
    swatches($('#strokeSwatches'), ['#FFFFFF', '#FFFDF8', '#3A2C2A', '#F4C7CF', '#C9A45C'], c => { textUI.strokeColor = c; updateTextStroke(); });
    swatches($('#labelSwatches'), ['#F7EEDC', '#FFFFFF', '#F4C7CF', '#3A2C2A', '#E3E8D4', '#E8DCF2'], c => { textUI.bgColor = c; updateTextBg(); });

    $('#fontSel').addEventListener('change', e => { const f = e.target.value; ensureFont(f).then(() => setTextProps({ fontFamily: f })); });
    textUI.size = bindRange('fontSize', v => setTextProps({ fontSize: v }));
    textUI.spacing = bindRange('charSpacing', v => setTextProps({ charSpacing: v }));
    textUI.lh = bindRange('lineHeight', v => setTextProps({ lineHeight: v }), v => v.toFixed(2));
    textUI.curve = bindRange('curve', v => { const t = activeText(); if (!t) return; t.curve = v; applyCurve(t); canvas.requestRenderAll(); pushHistory(); });
    textUI.blur = bindRange('shadowBlur', () => updateTextShadow());
    textUI.off = bindRange('shadowOff', () => updateTextShadow());
    textUI.strokeW = bindRange('strokeW', () => updateTextStroke());
    textUI.shadowColor = '#3A2C2A'; textUI.strokeColor = '#FFFFFF'; textUI.bgColor = '#F7EEDC';

    $('#tBold').addEventListener('click', () => { const t = activeText(); if (t) setTextProps({ fontWeight: t.fontWeight === 'bold' ? 'normal' : 'bold' }); });
    $('#tItalic').addEventListener('click', () => { const t = activeText(); if (t) setTextProps({ fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' }); });
    $('#tUnderline').addEventListener('click', () => { const t = activeText(); if (t) setTextProps({ underline: !t.underline }); });
    $('#tStrike').addEventListener('click', () => { const t = activeText(); if (t) setTextProps({ linethrough: !t.linethrough }); });
    $('#tCase').addEventListener('click', () => {
      const t = activeText();
      if (!t) return;
      const s = t.text, up = s.toUpperCase(), low = s.toLowerCase();
      const title = low.replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
      setTextProps({ text: s === up ? low : s === low ? title : up });
    });
    $('#textFx').addEventListener('click', e => { const c = e.target.closest('[data-fx]'); if (c) textEffect(c.dataset.fx); });
    $('#textGradients').innerHTML = TEXT_GRADIENTS.map((g, i) => `<button class="swatch" data-g="${i}" title="Gradient" style="background:linear-gradient(180deg,${g.join(',')})"></button>`).join('');
    $('#textGradients').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) setTextProps({ fill: mkGradient(TEXT_GRADIENTS[+b.dataset.g]) }); });
    $('#alignSeg').addEventListener('click', e => { const b = e.target.closest('[data-align]'); if (b) setTextProps({ textAlign: b.dataset.align }); });
    $('#shadowOn').addEventListener('change', updateTextShadow);
    $('#strokeOn').addEventListener('change', updateTextStroke);
    $('#bgOn').addEventListener('change', updateTextBg);
  }
  function setTextProps(props) {
    const t = activeText();
    if (!t) return;
    t.set(props);
    if (t.curve) applyCurve(t); else { t.initDimensions(); t.setCoords(); }
    canvas.requestRenderAll();
    syncTextPanel();
    pushHistory();
  }
  const TEXT_GRADIENTS = [['#F7B9C5', '#B9A7D6'], ['#FFD1A1', '#F48FB1'], ['#9AD0EC', '#E0BBE4'], ['#FFF1A8', '#FFB3C7'],
    ['#EAD49C', '#C9A45C', '#9A773A'], ['#FFFFFF', '#C9CED6', '#7E8691', '#EEF0F4', '#9AA1AB'], ['#FF6FB5', '#7B5CFF'], ['#C8174F', '#6E2A3A'],
    ['#FF9A3C', '#FF3B4E'], ['#9ED9C0', '#2F7FC1'], ['#FFE58A', '#F2A93B', '#C2185B'], ['#E0F7FF', '#9CC9F0', '#5F8FCB'], ['#F4A7A7', '#F5E3A0', '#BFE3C0', '#A9CBEF', '#C9B5E8'], ['#2A2326', '#6B4A3A'], ['#FFFFFF', '#F4B6C2'], ['#D4AF5A', '#FFF1C1', '#B8862E']];
  /* one-click text looks; they reset shadow/outline/highlight and keep the text's own colour as the base */
  function textEffect(name) {
    const t = activeText();
    if (!t) return;
    const solid = typeof t.fill === 'string' && t.fill && t.fill !== 'rgba(0,0,0,0)';
    const base = solid ? t.fill : (t._baseFill || '#C47A88');
    t._baseFill = base;
    const fs = t.fontSize, S = o => new fabric.Shadow(o);
    const tone = a => /^#[0-9a-f]{6}$/i.test(base) ? hexA(base, a) : `rgba(196,122,136,${a})`;
    const looks = {
      none: {},
      neon: { fill: '#FFF7FB', stroke: base, strokeWidth: Math.max(1, fs * 0.02), shadow: S({ color: base, blur: Math.round(fs * 0.35), offsetX: 0, offsetY: 0 }) },
      sticker: { stroke: '#FFFFFF', strokeWidth: Math.round(fs * 0.14), shadow: S({ color: 'rgba(60,30,30,.28)', blur: 12, offsetX: 0, offsetY: 5 }) },
      bubble: { fontWeight: 'bold', stroke: '#FFFFFF', strokeWidth: Math.round(fs * 0.1), shadow: S({ color: tone(0.5), blur: 0, offsetX: fs * 0.05, offsetY: fs * 0.06 }) },
      hollow: { fill: 'rgba(0,0,0,0)', stroke: base, strokeWidth: Math.max(1.5, fs * 0.03) },
      retro: { shadow: S({ color: '#F2A9B8', blur: 0, offsetX: fs * 0.06, offsetY: fs * 0.06 }), stroke: '#3A2C2A', strokeWidth: Math.max(1, fs * 0.015) },
      glow: { shadow: S({ color: 'rgba(255,255,255,.95)', blur: Math.round(fs * 0.3), offsetX: 0, offsetY: 0 }) },
      emboss: { shadow: S({ color: 'rgba(255,255,255,.85)', blur: 0, offsetX: -fs * 0.02, offsetY: -fs * 0.02 }), stroke: 'rgba(0,0,0,.18)', strokeWidth: 1 },
      highlight: { textBackgroundColor: '#FFE58A' },
      glitch: { shadow: S({ color: 'rgba(0,229,255,.85)', blur: 0, offsetX: -fs * 0.04, offsetY: 0 }), stroke: '#FF2D7A', strokeWidth: Math.max(1, fs * 0.02) },
      longshadow: { shadow: S({ color: tone(0.35), blur: 2, offsetX: fs * 0.1, offsetY: fs * 0.1 }) },
      comic: { fontWeight: 'bold', stroke: '#2A2326', strokeWidth: Math.max(2, fs * 0.06), shadow: S({ color: '#2A2326', blur: 0, offsetX: fs * 0.05, offsetY: fs * 0.05 }) },
      gold: { fill: mkGradient(['#FFF1C1', '#D4AF5A', '#8A6420', '#E8C877']), stroke: '#6E4E18', strokeWidth: Math.max(1, fs * 0.015), shadow: S({ color: 'rgba(90,60,10,.35)', blur: 6, offsetX: 0, offsetY: 3 }) },
      fire: { fill: mkGradient(['#FFE58A', '#FF9A3C', '#FF3B4E']), shadow: S({ color: 'rgba(255,90,0,.8)', blur: Math.round(fs * 0.25), offsetX: 0, offsetY: 0 }) },
      ice: { fill: mkGradient(['#FFFFFF', '#BFE4FF', '#6FA8DC']), stroke: '#FFFFFF', strokeWidth: Math.max(1, fs * 0.02), shadow: S({ color: 'rgba(120,190,255,.8)', blur: Math.round(fs * 0.2), offsetX: 0, offsetY: 0 }) },
      date: { fontFamily: SEG7, fill: '#FF9A3C', charSpacing: 80, styles: segStyles(t.text), shadow: S({ color: 'rgba(255,80,0,.9)', blur: Math.round(fs * 0.3), offsetX: 0, offsetY: 0 }) }
    };
    const apply = () => setTextProps({ shadow: null, stroke: null, strokeWidth: 0, textBackgroundColor: '', fill: base, ...looks[name] });
    name === 'date' ? Promise.all([ensureFont(SEG7), ensureFont(SEG14)]).then(apply) : apply();
  }
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  function updateTextShadow() {
    const t = activeText();
    $('#shadowProps').hidden = !$('#shadowOn').checked;
    if (!t) return;
    const off = +$('#shadowOff').value;
    t.shadow = $('#shadowOn').checked ? new fabric.Shadow({ color: hexA(textUI.shadowColor, 0.55), blur: +$('#shadowBlur').value, offsetX: off * 0.6, offsetY: off }) : null;
    t.dirty = true; canvas.requestRenderAll(); pushHistory();
  }
  function updateTextStroke() {
    const t = activeText();
    $('#strokeProps').hidden = !$('#strokeOn').checked;
    if (!t) return;
    const on = $('#strokeOn').checked;
    t.set({ stroke: on ? textUI.strokeColor : null, strokeWidth: on ? +$('#strokeW').value : 0, paintFirst: 'stroke' });
    t.dirty = true; canvas.requestRenderAll(); pushHistory();
  }
  function updateTextBg() {
    const t = activeText();
    $('#bgProps').hidden = !$('#bgOn').checked;
    if (!t) return;
    t.set('backgroundColor', $('#bgOn').checked ? textUI.bgColor : '');
    t.dirty = true; canvas.requestRenderAll(); pushHistory();
  }
  function syncTextPanel() {
    const t = activeText();
    $('#textProps').classList.toggle('disabled', !t);
    if (!t) return;
    $('#fontSel').value = t.fontFamily;
    textUI.size.set(Math.round(t.fontSize));
    textUI.spacing.set(t.charSpacing || 0);
    textUI.lh.set(t.lineHeight || 1.1);
    textUI.curve.set(t.curve || 0);
    $('#tBold').classList.toggle('active', t.fontWeight === 'bold');
    $('#tItalic').classList.toggle('active', t.fontStyle === 'italic');
    $('#tUnderline').classList.toggle('active', !!t.underline);
    $('#tStrike').classList.toggle('active', !!t.linethrough);
    $$('#alignSeg button').forEach(b => b.classList.toggle('active', b.dataset.align === t.textAlign));
    $$('#textSwatches .swatch').forEach(b => b.classList.toggle('active', b.dataset.c.toLowerCase() === String(t.fill).toLowerCase()));
    $('#shadowOn').checked = !!t.shadow; $('#shadowProps').hidden = !t.shadow;
    if (t.shadow) { textUI.blur.set(Math.round(t.shadow.blur)); textUI.off.set(Math.round(t.shadow.offsetY)); }
    $('#strokeOn').checked = !!(t.stroke && t.strokeWidth); $('#strokeProps').hidden = !$('#strokeOn').checked;
    if (t.stroke && t.strokeWidth) { textUI.strokeColor = t.stroke; textUI.strokeW.set(t.strokeWidth); }
    $('#bgOn').checked = !!t.backgroundColor; $('#bgProps').hidden = !t.backgroundColor;
    if (t.backgroundColor) textUI.bgColor = t.backgroundColor;
  }

  /* --- filters panel --- */
  const fxUI = {};
  let presetCat = 'retrocam';
  function filterPresetGrid() {
    $$('#presetGrid .preset').forEach(b => { const p = PRESET_BY_ID[b.dataset.id]; b.hidden = !(presetCat === 'all' || p.cat === presetCat || p.id === 'none'); });
  }
  function buildFxPanel() {
    $('#presetGrid').innerHTML = PRESETS.map(p => `<button class="preset" data-id="${p.id}"><span class="thumb"><img alt=""></span>${esc(p.name)}</button>`).join('');
    $('#presetGrid').addEventListener('click', e => {
      const b = e.target.closest('.preset');
      if (b) setFx({ preset: b.dataset.id, intensity: 100 });
    });
    $('#presetCats').addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      presetCat = c.dataset.cat;
      $$('#presetCats .chip').forEach(x => x.classList.toggle('active', x === c));
      filterPresetGrid();
    });
    fxUI.intensity = bindRange('fxIntensity', v => setFx({ intensity: v }));
    $('#fxSliders').innerHTML = SLIDER_GROUPS.map(g => `<h3 class="sub">${esc(g.title)}</h3>` + g.items.map(s =>
      `<div class="field"><label for="fx-${s.k}">${s.label} <output id="fx-${s.k}Out">0</output></label><input type="range" id="fx-${s.k}" min="${s.min}" max="${s.max}" value="0"></div>`).join('')).join('');
    SLIDERS.forEach(s => { fxUI[s.k] = bindRange('fx-' + s.k, v => setFx({ [s.k]: v })); });
    $('#fxReset').addEventListener('click', () => setFx({ ...FX0 }));
    $('#fxAll').addEventListener('click', () => {
      const p = fxPhoto();
      if (!p) return;
      const photos = canvas.getObjects().filter(o => o.kind === 'photo' && o !== p);
      photos.forEach(o => { o.fx = { ...p.fx }; applyFx(o); });
      toast(photos.length ? `Look applied to ${photos.length + 1} photos` : 'This is your only photo so far');
      pushHistory();
    });

    // digicam date stamp
    $('#dateFmt').addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      dateFmt = c.dataset.fmt;
      $$('#dateFmt .chip').forEach(x => x.classList.toggle('active', x === c));
    });
    $$('#dateFmt .chip').forEach(c => { c.textContent = dateText(c.dataset.fmt); });
    $('#dateColors').innerHTML = DATE_COLORS.map(c => `<button class="swatch ${c === dateColor ? 'active' : ''}" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('');
    $('#dateColors').addEventListener('click', e => {
      const b = e.target.closest('.swatch');
      if (!b) return;
      dateColor = b.dataset.c;
      $$('#dateColors .swatch').forEach(x => x.classList.toggle('active', x === b));
    });
    $('#addDate').addEventListener('click', addDateStamp);
    filterPresetGrid();
  }
  function syncFxPanel() {
    const p = fxPhoto();
    $('#fxEmpty').hidden = !!p;
    $('#fxBody').classList.toggle('disabled', !p);
    if (p && !activePhoto()) { $('#fxEmpty').hidden = false; $('#fxEmpty span').textContent = `Editing "${p.name}" — select another photo to switch.`; }
    else $('#fxEmpty span').textContent = 'Add a photo to the canvas to apply a filter.';
    const fx = { ...FX0, ...(p && p.fx || {}) };
    fxUI.intensity.set(fx.intensity);
    SLIDERS.forEach(s => fxUI[s.k].set(fx[s.k]));
    $$('#presetGrid .preset').forEach(b => b.classList.toggle('active', b.dataset.id === fx.preset));
    if (currentTab === 'filters' || !thumbsFor) buildPresetThumbs(p);
  }

  /* digicam-style orange date stamp, placed in the bottom-right corner of the selected photo */
  /* lit-LED colours of real date backs, with a deeper glow colour for the bloom around each segment */
  const DATE_COLORS = ['#FF9A3C', '#FF5A2E', '#FFC23A', '#FFFFFF', '#7CFC9A', '#FF7EB9'];
  const DATE_GLOW = { '#FF9A3C': '#FF5000', '#FF5A2E': '#E01E00', '#FFC23A': '#FF8A00', '#FFFFFF': '#FFB070', '#7CFC9A': '#00C040', '#FF7EB9': '#FF2D7A' };
  let dateFmt = 'yy', dateColor = '#FF9A3C';
  function dateText(fmt) {
    const d = new Date(), p = n => String(n).padStart(2, '0'), Y = d.getFullYear(), M = p(d.getMonth() + 1), D = p(d.getDate());
    if (fmt === 'ymd') return `${Y}.${M}.${D}`;
    if (fmt === 'dmy') return `${D}/${M}/${Y}`;
    if (fmt === 'time') { let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${M}.${D}.${String(Y).slice(2)} ${h}:${p(d.getMinutes())}${ap}`; }
    return `'${String(Y).slice(2)} ${M} ${D}`;
  }
  async function addDateStamp() {
    const p = fxPhoto();
    let corner = new fabric.Point(page.w - 50, page.h - 50), angle = 0, size = 64;
    if (p) {
      const fr = p.frameId && byId(p.frameId);
      if (fr) {
        const { h, k } = holeGeom(fr, p.hole), M = fr.calcTransformMatrix(), m = Math.min(h.w, h.h) * k * 0.06;
        corner = T.transformPoint(new fabric.Point((h.cx + h.w / 2) * k - fr.width / 2 - m, (h.cy + h.h / 2) * k - fr.height / 2 - m), M);
        size = h.h * k * Math.abs(T.qrDecompose(M).scaleY) * 0.08; angle = fr.angle;
      } else {
        const m = Math.min(p.width, p.height) * 0.05;
        corner = T.transformPoint(new fabric.Point(p.width / 2 - m, p.height / 2 - m), p.calcTransformMatrix());
        size = p.height * Math.abs(p.scaleY) * 0.08; angle = p.angle;
      }
    }
    await Promise.all([ensureFont(SEG7), ensureFont(SEG14)]);
    const fsz = Math.max(22, Math.round(size * 0.82));
    const t = addText({ text: dateText(dateFmt), font: SEG7, size: fsz, fill: dateColor, charSpacing: 80,
      shadow: { color: hexA(DATE_GLOW[dateColor] || dateColor, 0.9), blur: Math.round(fsz * 0.32), offsetX: 0, offsetY: 0 } }, corner);
    t.set({ originX: 'right', originY: 'bottom', left: corner.x, top: corner.y, angle, name: 'Date stamp' });
    t.setCoords();
    if (p) attach(t, (p.frameId && byId(p.frameId)) || p);
    updateCtx();
    canvas.requestRenderAll();
    pushHistory();
    toast(p ? 'Date stamp added — it moves with the photo' : 'Date stamp added');
  }

  /* --- canvas panel --- */
  const finishUI = {};
  function buildCanvasPanel() {
    $('#sizeChips').innerHTML = A.SIZES.map(s => `<button class="chip" data-w="${s.w}" data-h="${s.h}">${s.name}</button>`).join('');
    $('#sizeChips').addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (b) setPageSize(+b.dataset.w, +b.dataset.h);
    });
    $('#bgColors').innerHTML = A.BG_COLORS.map(c => `<button class="bg-tile ${c === 'transparent' ? 'transparent' : ''}" data-type="color" data-v="${c}" title="${c === 'transparent' ? 'Transparent' : c}" style="${c === 'transparent' ? '' : `background:${c}`}"></button>`).join('') +
      `<label class="bg-tile" title="Custom color" style="background:conic-gradient(#f4c7cf,#f2d98b,#a9b68e,#bfd3df,#b9a7d6,#f4c7cf);display:block;cursor:pointer"><input type="color" id="bgCustom" style="opacity:0;width:100%;height:100%;cursor:pointer"></label>`;
    $('#bgTextures').innerHTML = A.BG_TEXTURES.map(t => `<button class="bg-tile" data-type="texture" data-v="${t.id}" title="${esc(t.name)}" style="background-image:url(${A.makeBackground(t.id, 108, 135).toDataURL('image/jpeg', 0.8)})"></button>`).join('');
    const pick = e => { const b = e.target.closest('button.bg-tile'); if (b) setBackground({ type: b.dataset.type, value: b.dataset.v }); };
    $('#bgColors').addEventListener('click', pick);
    $('#bgTextures').addEventListener('click', pick);
    $('#bgCustom').addEventListener('input', e => setBackground({ type: 'color', value: e.target.value }));
    ['vignette', 'grain', 'leak', 'dust', 'paper'].forEach(k => { finishUI[k] = bindRange(k, v => { page[k] = v; updateFinish(); pushHistory(); }); });
  }
  function setBackground(bg) {
    page.bg = bg;
    applyBackground();
    syncCanvasPanel();
    pushHistory();
  }
  function setPageSize(w, h) {
    if (w === page.w && h === page.h) return;
    const dx = (w - page.w) / 2, dy = (h - page.h) / 2;
    canvas.discardActiveObject();
    page.w = w; page.h = h;
    canvas.getObjects().forEach(o => { o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords(); });
    canvas.getObjects().forEach(o => { if (o.frameId) { const fr = byId(o.frameId); if (fr) o.clipPath = clipFor(fr, o.hole, o.clipPath); } });
    fit(); applyBackground(); buildFinish(); syncCanvasPanel(); updateExportDims();
    pushHistory();
  }
  function syncCanvasPanel() {
    $$('#sizeChips .chip').forEach(c => c.classList.toggle('active', +c.dataset.w === page.w && +c.dataset.h === page.h));
    $$('.bg-tile[data-v]').forEach(b => b.classList.toggle('active', b.dataset.type === page.bg.type && b.dataset.v === page.bg.value));
    ['vignette', 'grain', 'leak', 'dust', 'paper'].forEach(k => finishUI[k] && finishUI[k].set(page[k] || 0));
  }

  /* --- layers panel --- */
  let layersRaf = 0;
  const scheduleLayers = () => { cancelAnimationFrame(layersRaf); layersRaf = requestAnimationFrame(renderLayers); };
  const KIND_ICON = { photo: 'image', frame: 'frame', sticker: 'sticker', text: 'type', group: 'group' };
  function layerThumb(o) {
    if (o.kind === 'photo') { const t = tray.find(x => x.id === o.assetId); if (t && t.thumb) return `<img class="cover" src="${t.thumb}" alt="">`; }
    if ((o.kind === 'sticker' || o.kind === 'frame') && o.assetId) {
      const def = o.kind === 'frame' ? FRAMES[o.assetId] : STICKERS[o.assetId];
      if (def) return `<img src="${A.svgUrl(def.svg)}" alt="">`;
    }
    return icon(KIND_ICON[o.kind] || 'square');
  }
  function renderLayers() {
    if (currentTab !== 'layers' && !isMobile()) return;
    const list = $('#layerList'), act = new Set(activeObjs());
    const objs = canvas.getObjects().filter(o => !o.excludeFromExport && o.kind !== 'helper').reverse();
    if (!objs.length) { list.innerHTML = '<p class="empty" style="color:var(--ink-3);font-size:12.5px;text-align:center">Nothing on the canvas yet</p>'; return; }
    list.innerHTML = objs.map(o => {
      const name = o.type === 'i-text' && (!o.name || o.name === 'Text') ? (o.text || 'Text').replace(/\s+/g, ' ').trim().slice(0, 28) : (o.name || o.kind);
      return `<li class="layer-item ${act.has(o) ? 'active' : ''} ${o.visible ? '' : 'hidden-obj'}" data-id="${o.id}" draggable="true">
        <span class="layer-thumb">${layerThumb(o)}</span>
        <span class="layer-name" title="Double-click to rename">${esc(name)}${o.frameId ? ' <span style="color:var(--ink-3)">· framed</span>' : ''}</span>
        <button class="icon-btn" data-act="up" title="Move up">${icon('arrow-up')}</button>
        <button class="icon-btn" data-act="down" title="Move down">${icon('arrow-down')}</button>
        <button class="icon-btn" data-act="vis" title="Show / hide">${icon(o.visible ? 'eye' : 'eye-off')}</button>
        <button class="icon-btn" data-act="lock" title="Lock / unlock">${icon(o.isLocked ? 'lock' : 'unlock')}</button>
        <button class="icon-btn" data-act="dup" title="Duplicate">${icon('copy')}</button>
        <button class="icon-btn" data-act="del" title="Delete">${icon('trash-2')}</button>
      </li>`;
    }).join('');
    refreshIcons();
  }
  function onLayerClick(e) {
    const li = e.target.closest('.layer-item');
    if (!li) return;
    const o = byId(li.dataset.id);
    if (!o) return;
    const act = e.target.closest('[data-act]');
    if (!act) {
      if (o.visible) { canvas.setActiveObject(o); canvas.requestRenderAll(); }
      return;
    }
    const a = act.dataset.act;
    if (a === 'vis') { o.visible = !o.visible; if (!o.visible && canvas.getActiveObject() === o) canvas.discardActiveObject(); }
    else if (a === 'lock') setLocked(o, !o.isLocked);
    else if (a === 'dup') { canvas.setActiveObject(o); duplicate(); return; }
    else if (a === 'del') { removeObjects(o); renderLayers(); return; }
    else if (a === 'up' || a === 'down') {
      canvas.setActiveObject(o);
      layer(a === 'up' ? 'forward' : 'backward');
    }
    canvas.requestRenderAll();
    renderLayers(); updateCtx(); pushHistory();
  }

  function syncAll() { syncTextPanel(); syncFxPanel(); }

  /* ------------------------------------------------------------------ */
  /* export                                                              */
  /* ------------------------------------------------------------------ */
  const exp = { fmt: 'png', scale: 2, quality: 92 };
  function updateExportDims() {
    $('#exportDims').textContent = `${page.w * exp.scale} × ${page.h * exp.scale} px`;
  }
  function exportImage() {
    if (crop) endCrop(true);
    const a = canvas.getActiveObject();
    if (a && a.isEditing) a.exitEditing();
    canvas.discardActiveObject();
    canvas.renderAll();
    const mult = exp.scale / viewZoom;
    let el = canvas.toCanvasElement(mult, { left: 0, top: 0, width: page.w * viewZoom, height: page.h * viewZoom });
    if (exp.fmt === 'jpeg') {
      const c2 = document.createElement('canvas');
      c2.width = el.width; c2.height = el.height;
      const x = c2.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, c2.width, c2.height);
      x.drawImage(el, 0, 0);
      el = c2;
    }
    el.toBlob(blob => {
      if (!blob) return toast('Export failed — try a smaller size');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `petal-and-paper-${new Date().toISOString().slice(0, 10)}.${exp.fmt === 'jpeg' ? 'jpg' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      toast('Downloaded ♡ enjoy your creation');
    }, 'image/' + exp.fmt, exp.quality / 100);
    $('#exportPop').hidden = true;
  }

  /* ------------------------------------------------------------------ */
  /* wiring                                                              */
  /* ------------------------------------------------------------------ */
  function wire() {
    $('#rail').addEventListener('click', e => {
      const b = e.target.closest('.rail-btn');
      if (!b) return;
      if (isMobile() && b.classList.contains('active') && $('#panel').classList.contains('open')) return closeMobilePanel();
      switchTab(b.dataset.tab);
    });

    // asset tiles: click to add, drag onto canvas
    const panel = $('#panel');
    panel.addEventListener('click', e => {
      const rm = e.target.closest('[data-remove]');
      if (rm) {
        e.stopPropagation();
        customStickers.splice(+rm.dataset.remove, 1);
        store.set('pp.stickers', customStickers);
        return renderStickers();
      }
      if (e.target.closest('#stickerUploadTile')) return $('#stickerInput').click();
      const t = e.target.closest('[data-kind]');
      if (t) addAsset(t.dataset.kind, t.dataset.id);
    });
    panel.addEventListener('dragstart', e => {
      const t = e.target.closest('[data-kind]');
      if (!t) return;
      e.dataTransfer.setData('application/x-petal', JSON.stringify({ kind: t.dataset.kind, id: t.dataset.id }));
      e.dataTransfer.effectAllowed = 'copy';
    });

    $('#frameCats').addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      frameCat = c.dataset.cat;
      $$('#frameCats .chip').forEach(x => x.classList.toggle('active', x === c));
      renderFrames();
    });
    $('#stickerCats').addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      stickerCat = c.dataset.cat;
      $$('#stickerCats .chip').forEach(x => x.classList.toggle('active', x === c));
      renderStickers();
    });

    // uploads
    const photoInput = $('#photoInput');
    $('#photoDrop').addEventListener('click', e => { e.preventDefault(); pendingFill = null; photoInput.click(); });
    photoInput.addEventListener('change', () => { if (photoInput.files.length) handlePhotoFiles(photoInput.files); else pendingFill = null; photoInput.value = ''; });
    const stickerInput = $('#stickerInput');
    stickerInput.addEventListener('change', () => { if (stickerInput.files.length) handleStickerFiles(stickerInput.files); stickerInput.value = ''; });
    const pd = $('#photoDrop');
    pd.addEventListener('dragover', e => { e.preventDefault(); pd.classList.add('over'); });
    pd.addEventListener('dragleave', () => pd.classList.remove('over'));
    pd.addEventListener('drop', e => { e.preventDefault(); pd.classList.remove('over'); if (e.dataTransfer.files.length) handlePhotoFiles(e.dataTransfer.files); });

    // stage drag & drop
    const stage = $('#stage');
    let depth = 0;
    const pagePoint = e => { const p = canvas.getPointer(e); return { x: clamp(p.x, 0, page.w), y: clamp(p.y, 0, page.h) }; };
    stage.addEventListener('dragenter', e => { e.preventDefault(); depth++; stage.classList.add('dragging'); });
    stage.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; stage.classList.remove('dragging'); } });
    stage.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    stage.addEventListener('drop', e => {
      e.preventDefault(); depth = 0; stage.classList.remove('dragging');
      const pt = pagePoint(e);
      if (e.dataTransfer.files && e.dataTransfer.files.length) return handlePhotoFiles(e.dataTransfer.files, pt);
      const raw = e.dataTransfer.getData('application/x-petal');
      if (raw) { const { kind, id } = JSON.parse(raw); addAsset(kind, id, pt); }
    });
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => e.preventDefault());

    // paste images
    window.addEventListener('paste', e => {
      const a = canvas.getActiveObject();
      if (a && a.isEditing) return;
      if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      const files = Array.from(e.clipboardData ? e.clipboardData.items : []).filter(i => i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean);
      if (files.length) { e.preventDefault(); handlePhotoFiles(files); }
    });

    // context toolbar
    $('#ctxbar').addEventListener('click', e => { const b = e.target.closest('[data-cmd]'); if (b && CMDS[b.dataset.cmd]) CMDS[b.dataset.cmd](); });
    const op = $('#opacity');
    op.addEventListener('input', () => { paintRange(op); activeObjs().forEach(o => o.set('opacity', op.value / 100)); canvas.requestRenderAll(); });
    op.addEventListener('change', () => pushHistory());

    // crop bar
    $('#cropApply').addEventListener('click', () => endCrop(true));
    $('#cropCancel').addEventListener('click', () => endCrop(false));
    $('#aspectSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-aspect]');
      if (!b) return;
      $$('#aspectSeg button').forEach(x => x.classList.toggle('active', x === b));
      setCropAspect(+b.dataset.aspect);
    });

    // layers
    $('#layerList').addEventListener('click', onLayerClick);
    // rename on double-click
    $('#layerList').addEventListener('dblclick', e => {
      const nameEl = e.target.closest('.layer-name'), li = e.target.closest('.layer-item');
      if (!nameEl || !li) return;
      const o = byId(li.dataset.id);
      if (!o) return;
      const input = document.createElement('input');
      input.className = 'input'; input.style.height = '28px'; input.value = nameEl.textContent.replace(' · framed', '').trim();
      nameEl.replaceWith(input); input.focus(); input.select();
      const done = save => { if (save && input.value.trim()) { o.name = input.value.trim().slice(0, 40); pushHistory(); } renderLayers(); };
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); ev.stopPropagation(); });
      input.addEventListener('blur', () => done(true));
    });
    // drag to reorder (the list shows the top layer first)
    let dragId = null;
    $('#layerList').addEventListener('dragstart', e => { const li = e.target.closest('.layer-item'); if (li) { dragId = li.dataset.id; e.dataTransfer.effectAllowed = 'move'; li.style.opacity = '.4'; } });
    $('#layerList').addEventListener('dragend', e => { const li = e.target.closest('.layer-item'); if (li) li.style.opacity = ''; });
    $('#layerList').addEventListener('dragover', e => { if (dragId) e.preventDefault(); });
    $('#layerList').addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation();
      const li = e.target.closest('.layer-item'), o = dragId && byId(dragId), target = li && byId(li.dataset.id);
      dragId = null;
      if (!o || !target || o === target) return renderLayers();
      const objs = canvas.getObjects();
      canvas.moveTo(o, objs.indexOf(target));
      if (o.kind === 'frame') photosIn(o).forEach(p => placeBelow(p, o));
      attachedTo(o).forEach(a2 => placeAbove(a2, o));
      canvas.requestRenderAll(); renderLayers(); pushHistory();
    });

    // top bar
    $('#undoBtn').addEventListener('click', undo);
    $('#redoBtn').addEventListener('click', redo);
    $('#clearBtn').addEventListener('click', () => {
      if (!canvas.getObjects().length) return;
      if (!confirm('Start over with a blank canvas? (You can undo this.)')) return;
      if (crop) endCrop(false);
      canvas.discardActiveObject();
      canvas.remove(...canvas.getObjects());
      canvas.requestRenderAll();
      pushHistory();
    });
    const themeIcon = () => {
      const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      $('#themeBtn').innerHTML = icon(dark ? 'sun' : 'moon');
      refreshIcons();
      return dark;
    };
    $('#themeBtn').addEventListener('click', () => {
      const next = themeIcon() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('pp.theme', next); } catch (e) {}
      themeIcon();
    });
    themeIcon();

    // export popover
    const pop = $('#exportPop');
    $('#exportBtn').addEventListener('click', e => { e.stopPropagation(); pop.hidden = !pop.hidden; updateExportDims(); });
    document.addEventListener('click', e => { if (!pop.hidden && !e.target.closest('.export-wrap')) pop.hidden = true; });
    $('#fmtSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-fmt]');
      if (!b) return;
      exp.fmt = b.dataset.fmt;
      $$('#fmtSeg button').forEach(x => x.classList.toggle('active', x === b));
      $('#qualityField').hidden = exp.fmt !== 'jpeg';
    });
    $('#scaleSeg').addEventListener('click', e => {
      const b = e.target.closest('[data-scale]');
      if (!b) return;
      exp.scale = +b.dataset.scale;
      $$('#scaleSeg button').forEach(x => x.classList.toggle('active', x === b));
      updateExportDims();
    });
    bindRange('quality', v => { exp.quality = v; }, v => v + '%');
    $('#downloadBtn').addEventListener('click', exportImage);

    // zoom
    $('#zoomIn').addEventListener('click', () => { userZoom = clamp(userZoom * 1.2, 0.3, 4); fit(); });
    $('#zoomOut').addEventListener('click', () => { userZoom = clamp(userZoom / 1.2, 0.3, 4); fit(); });
    $('#zoomFit').addEventListener('click', () => { userZoom = 1; fit(); });
    new ResizeObserver(() => fit()).observe($('#canvasWrap'));

    // keyboard
    document.addEventListener('keydown', e => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      const o = canvas.getActiveObject();
      if (o && o.isEditing) return;
      const mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
      if (crop) {
        if (key === 'enter') { e.preventDefault(); endCrop(true); }
        else if (key === 'escape') { e.preventDefault(); endCrop(false); }
        return;
      }
      if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && key === 'y') { e.preventDefault(); redo(); }
      else if (mod && key === 'd') { e.preventDefault(); duplicate(); }
      else if (mod && key === 'g') { e.preventDefault(); e.shiftKey ? ungroupSelection() : groupSelection(); }
      else if ((key === 'delete' || key === 'backspace') && o) { e.preventDefault(); removeObjects(o); }
      else if (key === 'escape') { canvas.discardActiveObject(); canvas.requestRenderAll(); $('#exportPop').hidden = true; }
      else if (o && key.startsWith('arrow') && !o.isLocked) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        o.set({ left: o.left + (key === 'arrowleft' ? -d : key === 'arrowright' ? d : 0), top: o.top + (key === 'arrowup' ? -d : key === 'arrowdown' ? d : 0) });
        o.setCoords();
        onTransforming({ target: o });
        canvas.requestRenderAll();
        clearTimeout(o._nudge);
        o._nudge = setTimeout(() => canvas.fire('object:modified', { target: o }), 300);
      }
    });

    window.addEventListener('beforeunload', e => {
      if (canvas.getObjects().some(o => o.kind === 'photo')) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  /* ------------------------------------------------------------------ */
  /* starter collage                                                     */
  /* ------------------------------------------------------------------ */
  async function starter() {
    hist.lock = true;
    try {
      (await addSticker(STICKERS.sparkles, { x: 870, y: 300 })).scaleToWidth(170, true);
      (await addSticker(STICKERS['rose-bouquet'], { x: 830, y: 960 })).set({ angle: 8 }).scaleToWidth(320, true);
      (await addSticker(STICKERS['sparkle-white'], { x: 214, y: 1010 })).scaleToWidth(110, true);
      const t = addText(A.QUOTES[0], { x: 540, y: 1190 });
      t.set({ fontSize: 84 });
      canvas.getObjects().forEach(o => o.setCoords());
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    } catch (e) { console.error(e); }
    hist.lock = false;
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  async function boot() {
    renderFrames(); renderStickers(); buildTextPanel(); buildFxPanel(); buildCanvasPanel(); renderTray();
    wire();
    refreshIcons();
    if (isMobile()) closeMobilePanel();
    fit(); applyBackground(); buildFinish(); syncCanvasPanel(); updateExportDims(); updateCtx(); syncAll();
    const fonts = A.FONTS.flatMap(g => g.fonts);
    await Promise.race([Promise.all(fonts.map(ensureFont)), new Promise(r => setTimeout(r, 4000))]);
    renderStickers(); // re-render so quote tiles pick up loaded fonts
    await starter();
    commitHistory();
    renderLayers();
    toast('Welcome ✿ Pick a frame in Frames, then drop your photo inside', 4200);
  }
  boot();

  window.petal = { canvas, page, applyFx, presets: PRESETS }; // handy for debugging in the console
})();
