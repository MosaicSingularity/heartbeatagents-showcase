/* ══════════════════════════════════════════════════════════════
   app.js — the map, the clock, the three deep dives
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const GB = window.GB;
  const DAYS = GB.SAMPLE.days;
  const PEAKS = GB.SAMPLE.peaks;

  /* ── state ───────────────────────────────────────────────── */
  const state = {
    day: 11,          // zero-based index
    playing: false,
    on: { vagal: true, circ: true, immune: true },
    region: null,
    chapter: null
  };

  /* ── pathway config: real latencies, compressed display ──── */
  const PW = {
    vagal: { sel: '#p-vagal', n: 7, real: 0.2, color: '#E7B44C', r: 1.9 },
    circ: { sel: '#p-circ', n: 9, real: 2700, color: '#5FC6B6', r: 2.1 },
    immune: { sel: '#p-immune', n: 8, real: 129600, color: '#E2798E', r: 2.2 }
  };
  // shared logarithmic compression: monotonic in real time
  const dispDur = real => 1.3 + 3.4 * Math.log10(real / 0.2 + 1);
  Object.keys(PW).forEach(k => { PW[k].dur = dispDur(PW[k].real); });

  const CENTERS = {
    brain: { x: 210, y: 80 }, vagus: { x: 204, y: 248 }, gut: { x: 216, y: 374 },
    liver: { x: 240, y: 268 }, blood: { x: 219, y: 205 }, immune: { x: 166, y: 404 }
  };

  /* ══════════════ particles ══════════════ */
  const layer = $('#particles');
  const sys = {};

  function buildParticles() {
    Object.keys(PW).forEach(key => {
      const p = PW[key];
      const path = $(p.sel);
      const len = path.getTotalLength();
      const items = [];
      for (let i = 0; i < p.n; i++) {
        const halo = document.createElementNS(NS, 'circle');
        halo.setAttribute('r', p.r * 3.2);
        halo.setAttribute('fill', p.color);
        halo.setAttribute('opacity', '0');
        halo.setAttribute('class', 'ptcl');
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('r', p.r);
        dot.setAttribute('fill', p.color);
        dot.setAttribute('opacity', '0');
        dot.setAttribute('class', 'ptcl');
        layer.appendChild(halo);
        layer.appendChild(dot);
        items.push({ halo, dot, off: i / p.n, len, path });
      }
      sys[key] = items;
    });
  }

  function updateParticles(clock) {
    Object.keys(PW).forEach(key => {
      const p = PW[key];
      const I = state.on[key] ? intensity(key) : 0;
      sys[key].forEach(pt => {
        let u = ((clock / p.dur) + pt.off) % 1;
        const q = pt.path.getPointAtLength(u * pt.len);
        const edge = Math.min(1, Math.sin(Math.PI * u) * 2.2);
        const a = I * edge;
        pt.dot.setAttribute('cx', q.x.toFixed(2));
        pt.dot.setAttribute('cy', q.y.toFixed(2));
        pt.dot.setAttribute('opacity', (a * 0.92).toFixed(3));
        pt.dot.setAttribute('r', (p.r * (0.7 + 0.5 * I)).toFixed(2));
        pt.halo.setAttribute('cx', q.x.toFixed(2));
        pt.halo.setAttribute('cy', q.y.toFixed(2));
        pt.halo.setAttribute('opacity', (a * 0.14).toFixed(3));
      });
      const route = $(PW[key].sel);
      if (route) route.style.strokeOpacity = (0.22 + 0.62 * I).toFixed(3);
    });
  }

  function intensity(key) {
    const d = DAYS[state.day];
    const base = key === 'vagal' ? d.vagal : key === 'circ' ? d.circ : d.immune;
    return clamp(0.18 + 0.82 * base, 0, 1);
  }

  /* ══════════════ chart ══════════════ */
  const CH = { x0: 8, x1: 332, y0: 16, y1: 88 };
  const cx = d => CH.x0 + (d / 29) * (CH.x1 - CH.x0);
  const cy = v => CH.y1 - v * (CH.y1 - CH.y0);
  let playEls = null;

  function seriesPath(key, withArea) {
    const pts = DAYS.map((d, i) => [cx(i), cy(d[key])]);
    let d = 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
    if (withArea) d += ' L' + cx(29).toFixed(1) + ',' + CH.y1 + ' L' + cx(0).toFixed(1) + ',' + CH.y1 + ' Z';
    return d;
  }

  function buildChart() {
    const svg = $('#chart');
    const bands = [
      { a: 6, b: 13, cls: 'chart-band' },
      { a: 14, b: 19, cls: 'chart-band alt' },
      { a: 20, b: 26, cls: 'chart-band' }
    ];
    let html = '';

    // grid
    for (let i = 0; i <= 2; i++) {
      const y = CH.y0 + (i / 2) * (CH.y1 - CH.y0);
      html += `<line class="chart-grid" x1="${CH.x0}" y1="${y.toFixed(1)}" x2="${CH.x1}" y2="${y.toFixed(1)}"/>`;
    }
    bands.forEach(b => {
      const x = cx(b.a), w = cx(b.b) - cx(b.a);
      html += `<rect class="${b.cls}" x="${x.toFixed(1)}" y="${CH.y0}" width="${w.toFixed(1)}" height="${(CH.y1 - CH.y0).toFixed(1)}" rx="2"/>`;
    });

    ['circ', 'immune', 'vagal'].forEach(k => {
      const col = k === 'vagal' ? 'var(--vagal)' : k === 'circ' ? 'var(--circ)' : 'var(--immune)';
      html += `<path class="chart-area" d="${seriesPath(k, true)}" fill="${col}"/>`;
      html += `<path class="chart-line" d="${seriesPath(k, false)}" stroke="${col}"/>`;
    });

    // peak ticks
    ['vagal', 'circ', 'immune'].forEach(k => {
      const px = cx(PEAKS[k]);
      const col = k === 'vagal' ? 'var(--vagal)' : k === 'circ' ? 'var(--circ)' : 'var(--immune)';
      html += `<line class="peak-tick" x1="${px.toFixed(1)}" y1="${CH.y0}" x2="${px.toFixed(1)}" y2="${CH.y1}" stroke="${col}"/>`;
      html += `<circle cx="${px.toFixed(1)}" cy="${cy(DAYS[PEAKS[k]][k]).toFixed(1)}" r="2.2" fill="${col}" opacity=".9"/>`;
    });

    // axis
    [0, 9, 19, 29].forEach(i => {
      html += `<text class="axis" x="${cx(i).toFixed(1)}" y="104" text-anchor="${i === 0 ? 'start' : i === 29 ? 'end' : 'middle'}">D${i + 1}</text>`;
    });
    html += `<text class="axis" x="${cx(0)}" y="114" fill="var(--muted-2)" opacity=".8">fiber push</text>`;
    html += `<text class="axis" x="${cx(14)}" y="114" fill="var(--muted-2)" opacity=".8">travel</text>`;
    html += `<text class="axis" x="${cx(20)}" y="114" fill="var(--muted-2)" opacity=".8">recovery</text>`;

    // playhead
    html += `<line id="phLine" class="chart-playhead" x1="0" y1="${CH.y0}" x2="0" y2="${CH.y1}"/>`;
    ['vagal', 'circ', 'immune'].forEach(k => {
      const col = k === 'vagal' ? 'var(--vagal)' : k === 'circ' ? 'var(--circ)' : 'var(--immune)';
      html += `<circle id="ph-${k}" class="chart-dot" r="3" fill="${col}" cx="0" cy="0"/>`;
    });

    svg.innerHTML = html;
    playEls = {
      line: $('#phLine', svg),
      dots: { vagal: $('#ph-vagal', svg), circ: $('#ph-circ', svg), immune: $('#ph-immune', svg) }
    };
    movePlayhead();
  }

  function movePlayhead() {
    if (!playEls) return;
    const x = cx(state.day);
    playEls.line.setAttribute('x1', x.toFixed(1));
    playEls.line.setAttribute('x2', x.toFixed(1));
    ['vagal', 'circ', 'immune'].forEach(k => {
      playEls.dots[k].setAttribute('cx', x.toFixed(1));
      playEls.dots[k].setAttribute('cy', cy(DAYS[state.day][k]).toFixed(1));
    });
  }

  /* ══════════════ day / readout ══════════════ */
  function setDay(i, fromScrub) {
    state.day = clamp(Math.round(i), 0, 29);
    const d = DAYS[state.day];
    $('#dayNum').textContent = state.day + 1;
    $('#daySub').textContent = d.label;
    $('#stFiber').textContent = d.fiber;
    $('#stStress').textContent = d.stress.toFixed(1);
    $('#stSleep').textContent = d.sleep.toFixed(1);
    $('#stMood').textContent = d.mood.toFixed(1);

    if (!fromScrub) $('#scrub').value = state.day + 1;
    movePlayhead();

    Object.keys(PW).forEach(k => {
      const card = $('.pcard[data-pw="' + k + '"]');
      const bar = $('.meter i', card);
      if (bar) bar.style.width = (intensity(k) * 100).toFixed(0) + '%';
    });
    $('#tintImm').setAttribute('opacity', (0.05 + 0.42 * intensity('immune')).toFixed(3));
    updateBodyTint();
  }

  function updateBodyTint() {
    const i = intensity('immune');
    const t = $('#tintImm');
    if (t) t.setAttribute('r', (120 + 30 * i).toFixed(0));
  }

  function lagNote() {
    const v = PEAKS.vagal, c = PEAKS.circ, m = PEAKS.immune;
    return `peak day ${v + 1} · blood +${c - v} d · immune +${m - v} d`;
  }

  /* ══════════════ regions ══════════════ */
  const world = $('#world');
  const panel = $('#regionPanel');

  function openRegion(id) {
    const r = GB.REGIONS[id];
    if (!r) return;
    state.region = id;

    const c = CENTERS[id];
    const s = 2.05;
    const tx = 210 - s * c.x;
    const ty = 400 - s * c.y;
    world.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s})`;

    $$('.hotspot').forEach(h => h.classList.toggle('active', h.dataset.region === id));

    $('#rpKicker').textContent = r.kicker;
    $('#rpTitle').textContent = r.title;
    $('#rpSub').textContent = r.sub;
    $('#rpLat').lastElementChild.textContent = r.latency;
    $('#rpLat').style.color = id === 'vagal' || id === 'gut' ? 'var(--vagal)'
      : id === 'immune' ? 'var(--immune)' : 'var(--paper)';
    $('#rpBody').innerHTML = r.body.split('\n\n').map(p => '<span>' + p + '</span>').join('<br><br>');

    $('#rpRefs').innerHTML = r.refs.map(rid => {
      const c2 = GB.byId[rid];
      if (!c2) return '';
      return `<a class="ref" href="${c2.url}" target="_blank" rel="noopener">
        <span class="tier ${c2.tier === 1 ? 't1' : ''}">T${c2.tier}</span>
        <span>${c2.ref}</span></a>`;
    }).join('');

    $('#rpDeep').textContent = 'Watch: ' + GB.CHAPTERS[r.deep].title;
    panel.classList.add('open');
    $('#hint').style.opacity = '0';
  }

  function closeRegion() {
    state.region = null;
    world.style.transform = 'none';
    panel.classList.remove('open');
    $$('.hotspot').forEach(h => h.classList.remove('active'));
  }

  $$('.hotspot').forEach(h => {
    h.addEventListener('click', () => openRegion(h.dataset.region));
    h.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRegion(h.dataset.region); }
    });
  });
  $('#rpClose').addEventListener('click', closeRegion);
  $('#rpReset').addEventListener('click', closeRegion);
  $('#rpDeep').addEventListener('click', () => {
    if (!state.region) return;
    openChapter(GB.REGIONS[state.region].deep);
  });

  /* ══════════════ pathway toggles ══════════════ */
  function togglePw(k, force) {
    state.on[k] = typeof force === 'boolean' ? force : !state.on[k];
    const card = $('.pcard[data-pw="' + k + '"]');
    card.classList.toggle('off', !state.on[k]);
    card.setAttribute('aria-checked', String(state.on[k]));
    $('#figure').classList.toggle('pw-off-' + k, !state.on[k]);
    document.body.classList.toggle('off-' + k, !state.on[k]);
    // hide routes for this pathway
    const route = $(PW[k].sel);
    const washes = $$('.wash');
    if (route) route.style.opacity = state.on[k] ? '' : '0';
    washes.forEach(w => { if (w.classList.contains(k)) w.style.opacity = state.on[k] ? '' : '0'; });
    sys[k].forEach(p => {
      p.dot.style.opacity = state.on[k] ? '' : '0';
      p.halo.style.opacity = state.on[k] ? '' : '0';
    });
    if (state.on[k]) setDay(state.day);
  }

  $$('.pcard').forEach(card => {
    const k = card.dataset.pw;
    card.addEventListener('click', () => togglePw(k));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePw(k); }
    });
  });

  /* ══════════════ play / scrub ══════════════ */
  let playAcc = 0;
  const PLAY_STEP = 0.42;

  function setPlaying(v) {
    state.playing = v;
    const btn = $('#playBtn');
    btn.classList.toggle('playing', v);
    $('#playIcon').innerHTML = v
      ? '<rect x="2.5" y="1.5" width="2.6" height="9"/><rect x="7" y="1.5" width="2.6" height="9"/>'
      : '<path d="M3 1.5 10 6l-7 4.5z"/>';
    btn.setAttribute('aria-label', v ? 'Pause' : 'Play 30-day time-lapse');
    if (v && state.day >= 29) setDay(0);
  }

  $('#playBtn').addEventListener('click', () => setPlaying(!state.playing));
  $('#prevBtn').addEventListener('click', () => { setPlaying(false); setDay(state.day - 1); });
  $('#nextBtn').addEventListener('click', () => { setPlaying(false); setDay(state.day + 1); });
  $('#scrub').addEventListener('input', e => { setPlaying(false); setDay(+e.target.value - 1, true); });

  // drag on the chart itself
  (function chartDrag() {
    const wrap = $('#chartWrap');
    const svg = $('#chart');
    let dragging = false;
    const pick = e => {
      const r = svg.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const rel = clamp((x / r.width) * 340, CH.x0, CH.x1);
      setDay(Math.round(((rel - CH.x0) / (CH.x1 - CH.x0)) * 29), true);
      $('#scrub').value = state.day + 1;
    };
    wrap.addEventListener('pointerdown', e => { dragging = true; setPlaying(false); pick(e); wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', e => { if (dragging) pick(e); });
    wrap.addEventListener('pointerup', () => { dragging = false; });
    wrap.addEventListener('pointercancel', () => { dragging = false; });
  })();

  /* ══════════════ the animation loop ══════════════ */
  let clock = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.06, (now - last) / 1000);
    last = now;
    clock += dt;

    updateParticles(clock);

    if (state.playing) {
      playAcc += dt;
      if (playAcc > PLAY_STEP) {
        playAcc = 0;
        if (state.day >= 29) setPlaying(false);
        else setDay(state.day + 1);
      }
    }
    if (state.chapter) chapterFrame(dt);
    requestAnimationFrame(frame);
  }

  /* ══════════════ toggle panels ══════════════ */
  function openOverlay(el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeOverlay(el) { el.classList.remove('open'); document.body.style.overflow = ''; }

  $$('[data-close]').forEach(b => b.addEventListener('click', () => {
    const el = $('#' + b.dataset.close);
    closeOverlay(el);
    if (b.dataset.close === 'chapter') { state.chapter = null; }
  }));
  $$('.overlay').forEach(o => o.addEventListener('click', e => {
    if (e.target === o) { closeOverlay(o); if (o.id === 'chapter') state.chapter = null; }
  }));

  /* ══════════════ evidence ══════════════ */
  function buildEvidence() {
    $('#evList').innerHTML = GB.CITATIONS.map((c, i) => `
      <div class="ev-item">
        <div class="ev-num">${String(i + 1).padStart(2, '0')}</div>
        <div>
          <div class="ev-ref"><a href="${c.url}" target="_blank" rel="noopener">${c.ref}</a></div>
          <div class="ev-note">${c.note}</div>
          <div class="ev-tags">
            <span class="tag ${c.tier === 1 ? 't1' : ''}">Tier ${c.tier}</span>
            <span class="tag human">${c.model}</span>
          </div>
        </div>
      </div>`).join('');
  }

  /* ══════════════ CHAPTERS ══════════════ */
  const canvas = $('#chCanvas');
  const ctx = canvas.getContext('2d');
  const ch = { id: null, t: 0, playing: true, lastStage: -1 };
  const CH_DUR = { A: 15, B: 17, C: 19 };

  let cw = 900, chh = 450;

  function sizeCanvas() {
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth || 900;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = w; chh = Math.round(w * 0.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(chh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function openChapter(id) {
    const c = GB.CHAPTERS[id];
    if (!c) return;
    state.chapter = id;
    ch.id = id; ch.t = 0; ch.playing = true; ch.lastStage = -1;
    $('#chKicker').textContent = c.kicker;
    $('#chTitle').textContent = c.title;
    $('#chSub').textContent = c.sub;
    $('#chMeta').innerHTML = c.tags.map((t, i) =>
      `<span class="tag ${i === 0 ? 't1' : ''}">${t}</span>`).join('') +
      c.refs.slice(0, 2).map(r => {
        const cc = GB.byId[r];
        return `<a class="tag" style="text-decoration:none" href="${cc.url}" target="_blank" rel="noopener">${cc.ref.replace(/<[^>]+>/g, '').slice(0, 54)}…</a>`;
      }).join('');
    $('#chScrub').value = 0;
    setChPlay(true);
    openOverlay($('#chapter'));
    requestAnimationFrame(sizeCanvas);
    closeRegion();
  }

  function setChPlay(v) {
    ch.playing = v;
    $('#chPlayIcon').innerHTML = v
      ? '<rect x="2.5" y="1.5" width="2.6" height="9"/><rect x="7" y="1.5" width="2.6" height="9"/>'
      : '<path d="M3 1.5 10 6l-7 4.5z"/>';
  }

  $('#chPlay').addEventListener('click', () => {
    if (ch.t >= 0.999) { ch.t = 0; }
    setChPlay(!ch.playing);
  });
  $('#chScrub').addEventListener('input', e => {
    ch.t = +e.target.value / 1000;
    setChPlay(false);
    drawChapter(true);
  });

  function chapterFrame(dt) {
    if (!ch.id) return;
    if (ch.playing) {
      ch.t += dt / (CH_DUR[ch.id] || 15);
      if (ch.t >= 1) { ch.t = 1; setChPlay(false); }
      $('#chScrub').value = Math.round(ch.t * 1000);
    }
    drawChapter(false);
  }

  function drawChapter(force) {
    if (!ch.id) return;
    const c = GB.CHAPTERS[ch.id];
    const t = ch.t;

    // clock + caption + percentage
    const clockVal = t * c.clockMax;
    const lbl = c.clockLabel === 'ms' ? Math.round(clockVal) + ' ms'
      : c.clockLabel === 'min' ? Math.round(clockVal) + ' min'
        : Math.round(clockVal) + ' h';
    $('#chClock').textContent = lbl;
    $('#chPct').textContent = Math.round(t * 100) + '%';

    let si = 0;
    for (let i = 0; i < c.stages.length; i++) if (t >= c.stages[i].t0) si = i;
    if (si !== ch.lastStage || force) {
      ch.lastStage = si;
      const cap = $('#chCaption');
      cap.style.opacity = '0';
      setTimeout(() => { cap.innerHTML = c.stages[si].text; cap.style.opacity = '1'; }, 90);
    }

    ctx.clearRect(0, 0, cw, chh);
    if (ch.id === 'A') drawA(t, cw, chh);
    if (ch.id === 'B') drawB(t, cw, chh);
    if (ch.id === 'C') drawC(t, cw, chh);
  }

  /* ── canvas helpers ─────────────────────────────────────── */
  const INK = '#0A0910';
  const PAPER = '#EDE7DD';
  const MUTED = 'rgba(237,231,221,.42)';
  const FAINT = 'rgba(237,231,221,.10)';
  const GOLD = '#E7B44C';
  const TEAL = '#5FC6B6';
  const ROSE = '#E2798E';

  function glowDot(x, y, r, color, a, blur) {
    ctx.save();
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.shadowColor = color;
    ctx.shadowBlur = blur == null ? 14 : blur;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  function ln(x1, y1, x2, y2, color, w, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = w || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    const rad = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
  function label(s, x, y, size, color, align) {
    ctx.save();
    ctx.fillStyle = color || MUTED;
    ctx.font = '600 ' + (size || 9) + 'px ui-sans-serif, -apple-system, "Helvetica Neue", Arial';
    ctx.textAlign = align || 'left';
    ctx.letterSpacing = '1.4px';
    ctx.fillText(s.toUpperCase(), x, y);
    ctx.restore();
  }
  function polyPoint(pts, u) {
    let total = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push(d); total += d;
    }
    let target = clamp(u, 0, 1) * total;
    for (let i = 0; i < seg.length; i++) {
      if (target <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? target / seg[i] : 0;
        return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
      }
      target -= seg[i];
    }
    return pts[pts.length - 1];
  }

  /* ── chapter A: the instant wire ────────────────────────── */
  function drawA(t, w, h) {
    const midY = h * 0.52;
    const lumX = w * 0.055;
    const cellX = w * 0.235, cellW = w * 0.075, cellH = h * 0.44;
    const cleftX = cellX + cellW + w * 0.012;
    const axonEnd = w * 0.70;

    const fill = smooth(0.12, 0.36, t);
    const release = smooth(0.34, 0.56, t);
    const cross = smooth(0.50, 0.78, t);
    const fire = smooth(0.72, 1, t);

    // lumen
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,.028)';
    rr(lumX - w * 0.03, h * 0.12, w * 0.09, h * 0.76, 10); ctx.fill();
    ctx.restore();
    label('gut lumen', lumX - w * 0.026, h * 0.10, 8.5);
    for (let i = 0; i < 9; i++) {
      const y = h * 0.18 + i * h * 0.075;
      const x = lumX + Math.sin(i * 2.1 + t * 2) * w * 0.012;
      ctx.save(); ctx.globalAlpha = 0.16 + 0.2 * smooth(0, 0.2, t);
      ctx.strokeStyle = TEAL; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x, y - 5, x + 7, y); ctx.stroke();
      ctx.restore();
    }

    // apical microvilli
    for (let i = 0; i < 7; i++) {
      const y = midY - cellH / 2 + 6 + i * (cellH - 12) / 6;
      ln(cellX - 9, y, cellX, y, 'rgba(237,231,221,.22)', 1);
    }

    // EC cell body
    ctx.save();
    const grd = ctx.createLinearGradient(cellX, midY - cellH / 2, cellX + cellW, midY + cellH / 2);
    grd.addColorStop(0, 'rgba(231,180,76,' + (0.10 + 0.28 * fill) + ')');
    grd.addColorStop(1, 'rgba(231,180,76,.05)');
    ctx.fillStyle = grd;
    ctx.strokeStyle = 'rgba(231,180,76,' + (0.35 + 0.5 * fill) + ')';
    ctx.lineWidth = 1.2;
    rr(cellX, midY - cellH / 2, cellW, cellH, cellW / 2 + 6);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // nucleus
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,.09)';
    ctx.beginPath();
    ctx.ellipse(cellX + cellW * 0.5, midY + cellH * 0.12, cellW * 0.30, cellH * 0.16, 0, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    // TPH1 enzyme ticks
    if (fill > 0.02) {
      for (let i = 0; i < 6; i++) {
        const y = midY - cellH * 0.34 + i * cellH * 0.085;
        const x = cellX + 8 + ((i % 2) ? 10 : 3);
        ctx.save(); ctx.globalAlpha = 0.25 + 0.5 * fill;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y); ctx.stroke(); ctx.restore();
      }
      label('TPH1', cellX + 2, midY - cellH / 2 - 8, 8, 'rgba(231,180,76,' + (0.3 + 0.6 * fill) + ')');
    }

    // vesicles
    const nV = 8;
    for (let i = 0; i < nV; i++) {
      const phase = i / nV;
      const born = smooth(0.10 + phase * 0.16, 0.22 + phase * 0.16, t);
      const moved = smooth(0.30, 0.52, t);
      const vx = lerp(cellX + cellW * 0.35, cellX + cellW - 3, moved) + Math.sin(i * 1.7) * 3;
      const vy = midY - cellH * 0.30 + (i / nV) * cellH * 0.58;
      const alive = born * (1 - smooth(0.5, 0.62, t));
      if (alive > 0.02) {
        glowDot(vx, vy, 1.9, '#FFD98A', alive * 0.85, 8);
      }
    }

    // cleft
    ln(cleftX, midY - h * 0.16, cleftX, midY + h * 0.16, 'rgba(237,231,221,.22)', 1);
    ln(cleftX + w * 0.016, midY - h * 0.16, cleftX + w * 0.016, midY + h * 0.16, 'rgba(237,231,221,.22)', 1);
    label('synapse', cleftX - 2, midY - h * 0.19, 8);

    // transmitter in the cleft
    for (let i = 0; i < 7; i++) {
      const p = clamp((t - 0.42 - i * 0.022) / 0.26, 0, 1);
      if (p > 0 && p < 1) {
        const x = lerp(cleftX + 2, cleftX + w * 0.014, p);
        const y = midY + Math.sin((i * 1.9) + p * 4) * h * 0.045;
        glowDot(x, y, 1.5, '#FFD98A', 0.85 * Math.sin(Math.PI * p), 7);
      }
    }

    // vagal afferent
    const termX = cleftX + w * 0.016;
    ln(termX, midY, axonEnd, midY, 'rgba(237,231,221,.30)', 3);
    // myelin
    for (let x = termX + 16; x < axonEnd - 12; x += 26) {
      ln(x, midY - 4.5, x, midY + 4.5, 'rgba(237,231,221,.16)', 7);
    }
    // terminal glow on depolarisation
    if (cross > 0.05) glowDot(termX + 3, midY, 5 + 4 * cross, GOLD, 0.16 + 0.42 * cross, 22);
    label('vagal afferent', axonEnd - 6, midY - h * 0.09, 8.5, MUTED, 'right');

    // action potentials
    if (fire > 0.01) {
      for (let i = 0; i < 3; i++) {
        const u = ((t - 0.74) * 2.2 - i * 0.16);
        if (u > 0 && u < 1) {
          const x = lerp(termX, axonEnd, u);
          glowDot(x, midY, 2.6, GOLD, 0.95, 16);
        }
      }
    }

    // nodose ganglion
    const ngX = axonEnd + w * 0.055;
    if (t > 0.82) {
      glowDot(ngX, midY, 9, GOLD, 0.10 + 0.22 * smooth(0.82, 0.92, t), 24);
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(237,231,221,.30)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(ngX, midY, 11, 0, 6.2832); ctx.stroke();
    ctx.restore();
    label('nodose', ngX, midY + h * 0.10, 7.5, MUTED, 'center');

    // NTS
    const bx = w * 0.855, bw = w * 0.115, bh = h * 0.26;
    const act = smooth(0.86, 1, t);
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,' + (0.03 + 0.09 * act) + ')';
    ctx.strokeStyle = 'rgba(237,231,221,' + (0.22 + 0.4 * act) + ')';
    ctx.lineWidth = 1.1;
    rr(bx, midY - bh / 2, bw, bh, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const y = midY - bh / 2 + 10 + i * (bh - 20) / 3;
      ln(bx + 8, y, bx + bw - 8, y, 'rgba(237,231,221,' + (0.08 + 0.3 * act) + ')', 1);
    }
    label('brainstem', bx + bw / 2, midY - bh / 2 - 9, 8, MUTED, 'center');
    if (act > 0.05) glowDot(bx + bw / 2, midY, 16, GOLD, 0.10 * act, 30);

    // time ruler
    ln(w * 0.05, h * 0.90, w * 0.95, h * 0.90, FAINT, 1);
    for (let i = 0; i <= 6; i++) {
      const x = w * 0.05 + i * (w * 0.9) / 6;
      ln(x, h * 0.90, x, h * 0.90 + (i % 3 === 0 ? 6 : 3), FAINT, 1);
      if (i % 3 === 0) label((i * 50) + ' ms', x, h * 0.90 + 18, 7.5, 'rgba(237,231,221,.32)', 'center');
    }
    ln(w * 0.05, h * 0.90, lerp(w * 0.05, w * 0.95, t), h * 0.90, GOLD, 1.4);
  }

  /* ── chapter B: the slow tide ───────────────────────────── */
  function drawB(t, w, h) {
    const ferment = smooth(0, 0.18, t);
    const absorb = smooth(0.16, 0.34, t);
    const firstPass = smooth(0.32, 0.5, t);
    const circulate = smooth(0.48, 0.66, t);
    const bbb = smooth(0.64, 0.86, t);
    const brainTake = smooth(0.84, 1, t);

    // ── colon
    const cX = w * 0.045, cY = h * 0.28, cW = w * 0.10, cH = h * 0.46;
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,.03)';
    ctx.strokeStyle = 'rgba(237,231,221,.20)'; ctx.lineWidth = 1.1;
    rr(cX, cY, cW, cH, 14); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('colon', cX + cW / 2, cY - 10, 8.5, MUTED, 'center');

    // bacteria + fiber
    for (let i = 0; i < 11; i++) {
      const x = cX + 10 + ((i * 37) % (cW - 20));
      const y = cY + 14 + ((i * 53) % (cH - 28));
      ctx.save(); ctx.globalAlpha = 0.35;
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.ellipse(x, y, 2.6, 1.4, i, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < 5; i++) {
      const y = cY + 24 + i * (cH - 40) / 4;
      ctx.save(); ctx.globalAlpha = 0.10 + 0.30 * ferment;
      ctx.strokeStyle = TEAL; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(cX + 12, y);
      ctx.quadraticCurveTo(cX + cW / 2, y - 7, cX + cW - 12, y + 3);
      ctx.stroke(); ctx.restore();
    }
    label('fermentation', cX + cW + 8, cY + cH + 16, 7.5, 'rgba(95,198,182,' + (0.3 + 0.6 * ferment) + ')');

    // ── route waypoints (colon → portal → liver → heart → BBB)
    const portal = [
      [cX + cW, cY + cH * 0.5],
      [w * 0.19, cY + cH * 0.32],
      [w * 0.245, h * 0.46],
      [w * 0.285, h * 0.44]
    ];
    // portal vein
    ctx.save();
    ctx.strokeStyle = 'rgba(95,198,182,.30)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(portal[0][0], portal[0][1]);
    ctx.bezierCurveTo(portal[1][0], portal[1][1], portal[2][0] - 20, portal[2][1], portal[3][0], portal[3][1]);
    ctx.stroke(); ctx.restore();
    label('portal vein', w * 0.16, h * 0.30, 8);

    // liver
    const lX = w * 0.315, lY = h * 0.40;
    ctx.save();
    const lg = ctx.createRadialGradient(lX - 10, lY - 8, 4, lX, lY, 58);
    lg.addColorStop(0, 'rgba(95,198,182,' + (0.16 + 0.22 * firstPass) + ')');
    lg.addColorStop(1, 'rgba(95,198,182,.04)');
    ctx.fillStyle = lg;
    ctx.strokeStyle = 'rgba(95,198,182,' + (0.30 + 0.3 * firstPass) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(lX, lY, w * 0.055, h * 0.15, -0.18, 0, 6.2832);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    label('liver · first pass', lX, lY - h * 0.19, 8, MUTED, 'center');

    // circulation loop to the barrier
    const loop = [
      [lX + w * 0.045, lY - h * 0.04],
      [w * 0.46, h * 0.26],
      [w * 0.54, h * 0.30],
      [w * 0.60, h * 0.26]
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(95,198,182,.22)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(loop[0][0], loop[0][1]);
    ctx.bezierCurveTo(loop[1][0], loop[1][1], loop[2][0], loop[2][1], loop[3][0], loop[3][1]);
    ctx.stroke(); ctx.restore();

    // heart
    const hX = w * 0.50, hY = h * 0.33;
    ctx.save();
    ctx.strokeStyle = 'rgba(95,198,182,' + (0.3 + 0.35 * circulate) + ')';
    ctx.fillStyle = 'rgba(95,198,182,' + (0.06 + 0.14 * circulate) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(hX, hY, 13, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('heart', hX, hY + 30, 8, MUTED, 'center');

    // ── BBB module
    const bX0 = w * 0.615, bX1 = w * 0.965;
    const capY = h * 0.22, capH = h * 0.11;
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,.03)';
    ctx.strokeStyle = 'rgba(237,231,221,.16)'; ctx.lineWidth = 1;
    rr(bX0, capY, bX1 - bX0, capH, 7); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('capillary', bX0 + 6, capY - 6, 7.5);

    // endothelial cell
    const enY = capY + capH, enH = h * 0.115;
    ctx.save();
    ctx.fillStyle = 'rgba(95,198,182,' + (0.05 + 0.10 * bbb) + ')';
    ctx.strokeStyle = 'rgba(95,198,182,' + (0.28 + 0.32 * bbb) + ')';
    rr(bX0, enY, bX1 - bX0, enH, 5); ctx.fill(); ctx.stroke();
    // tight junctions
    for (let x = bX0 + 12; x < bX1 - 12; x += 22) {
      ln(x, enY, x, enY + 7, 'rgba(95,198,182,.45)', 1.6);
    }
    ctx.restore();
    label('endothelial cell', bX0 + 6, enY + enH + 11, 7.5);

    // MCT1 transporter
    const mX = w * 0.775;
    const act = bbb;
    ctx.save();
    ctx.fillStyle = 'rgba(95,198,182,' + (0.12 + 0.5 * act) + ')';
    ctx.strokeStyle = 'rgba(95,198,182,' + (0.4 + 0.5 * act) + ')';
    ctx.lineWidth = 1.2;
    rr(mX - 7, enY - 4, 14, enH + 8, 5); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('MCT1', mX, enY - 10, 8, 'rgba(95,198,182,' + (0.35 + 0.55 * act) + ')', 'center');

    // astrocyte
    const aY = enY + enH + h * 0.10;
    ctx.save();
    ctx.strokeStyle = 'rgba(237,231,221,' + (0.16 + 0.22 * brainTake) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(mX, aY, 15, Math.PI, 0); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const ang = Math.PI + i * Math.PI / 4;
      ln(mX + Math.cos(ang) * 15, aY + Math.sin(ang) * 15,
        mX + Math.cos(ang) * 24, aY + Math.sin(ang) * 24,
        'rgba(237,231,221,' + (0.14 + 0.2 * brainTake) + ')', 1);
    }
    ctx.restore();
    label('astrocyte', mX, aY + 34, 7.5, MUTED, 'center');

    // neuron
    const nY = aY + h * 0.155;
    ctx.save();
    ctx.strokeStyle = 'rgba(237,231,221,' + (0.14 + 0.3 * brainTake) + ')'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(mX, nY, 8, 0, 6.2832); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const ang = i * Math.PI / 2 + 0.4;
      ln(mX + Math.cos(ang) * 8, nY + Math.sin(ang) * 8,
        mX + Math.cos(ang) * 22, nY + Math.sin(ang) * 22,
        'rgba(237,231,221,' + (0.10 + 0.2 * brainTake) + ')', 1);
    }
    ctx.restore();
    label('neuron', mX + 30, nY + 3, 7.5, MUTED);

    // ── travelling SCFAs
    const route = [
      [cX + cW * 0.5, cY + cH * 0.6],
      [cX + cW + 6, cY + cH * 0.5],
      [w * 0.22, h * 0.38],
      [lX, lY],
      [w * 0.40, h * 0.28],
      [hX, hY],
      [w * 0.57, h * 0.21],
      [mX, capY + capH * 0.5],
      [mX, enY + enH / 2],
      [mX, aY],
      [mX, nY]
    ];
    const nP = 10;
    for (let i = 0; i < nP; i++) {
      const u = clamp((t * 1.05 - i * 0.075), 0, 1);
      if (u <= 0 || u >= 1) continue;
      const p = polyPoint(route, u);
      const wob = Math.sin(u * 22 + i) * 3;
      glowDot(p[0] + wob, p[1], 2.2, TEAL, 0.85 * Math.min(1, Math.sin(Math.PI * u) * 1.8), 12);
    }

    // first-pass "consumed" indicator
    if (firstPass > 0.2) {
      ctx.save(); ctx.globalAlpha = 0.5 * firstPass;
      ctx.font = '500 9px ui-monospace, Menlo, monospace';
      ctx.fillStyle = 'rgba(237,231,221,.5)';
      ctx.fillText('butyrate mostly retained', lX - 62, lY + h * 0.20);
      ctx.restore();
    }

    // clock ruler
    ln(w * 0.045, h * 0.93, w * 0.955, h * 0.93, FAINT, 1);
    ln(w * 0.045, h * 0.93, lerp(w * 0.045, w * 0.955, t), h * 0.93, TEAL, 1.4);
    for (let i = 0; i <= 6; i++) {
      const x = w * 0.045 + i * (w * 0.91) / 6;
      ln(x, h * 0.93, x, h * 0.93 + (i % 3 === 0 ? 5 : 3), FAINT, 1);
      if (i % 3 === 0) label((i * 10) + ' min', x, h * 0.93 + 17, 7.5, 'rgba(237,231,221,.32)', 'center');
    }
  }

  /* ── chapter C: the long echo ───────────────────────────── */
  function drawC(t, w, h) {
    const stress = smooth(0, 0.14, t);
    const leak = smooth(0.13, 0.32, t);
    const cyto = smooth(0.28, 0.5, t);
    const travel = smooth(0.44, 0.66, t);
    const micro = smooth(0.60, 0.84, t);
    const behav = smooth(0.80, 1, t);

    // ── gut lumen
    const lX = w * 0.035, lW = w * 0.085;
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,.03)';
    ctx.strokeStyle = 'rgba(237,231,221,.16)'; ctx.lineWidth = 1;
    rr(lX, h * 0.18, lW, h * 0.62, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('lumen', lX + lW / 2, h * 0.15, 8, MUTED, 'center');
    for (let i = 0; i < 8; i++) {
      const x = lX + 9 + ((i * 29) % (lW - 18));
      const y = h * 0.24 + ((i * 41) % (h * 0.48));
      ctx.save(); ctx.globalAlpha = 0.3;
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.ellipse(x, y, 2.4, 1.3, i, 0, 6.2832); ctx.fill(); ctx.restore();
    }

    // ── epithelium with junctions
    const epX = w * 0.135, epW = w * 0.075;
    const nCells = 6, cellH = h * 0.56 / nCells;
    for (let i = 0; i < nCells; i++) {
      const y = h * 0.20 + i * cellH;
      const open = leak * 5.5;
      ctx.save();
      ctx.strokeStyle = 'rgba(237,231,221,' + (0.20 + 0.10 * leak) + ')';
      ctx.fillStyle = 'rgba(237,231,221,.025)';
      ctx.lineWidth = 1;
      rr(epX, y + 1 + open / 2, epW, cellH - 2 - open, 4);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      // junction
      if (i < nCells - 1) {
        ln(epX + 3, y + cellH, epX + epW - 3, y + cellH,
          'rgba(237,231,221,' + (0.25 - 0.2 * leak) + ')', 1.8);
      }
    }
    label('epithelium', epX + epW / 2, h * 0.79, 7.5, MUTED, 'center');
    if (leak > 0.15) {
      label('junctions loosening', epX + epW / 2, h * 0.845, 7.5, 'rgba(226,121,142,' + (0.3 + 0.5 * leak) + ')', 'center');
    }

    // ── lamina propria
    const lpX = epX + epW + w * 0.03;
    const mastX = lpX + w * 0.045, mastY = h * 0.62;
    const macX = lpX + w * 0.10, macY = h * 0.34;

    // mast cell
    ctx.save();
    ctx.strokeStyle = 'rgba(226,121,142,' + (0.22 + 0.45 * cyto) + ')';
    ctx.fillStyle = 'rgba(226,121,142,' + (0.04 + 0.12 * cyto) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(mastX, mastY, 15, 0, 6.2832); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = i * 0.7, r = 5 + (i % 3) * 3;
      ctx.fillStyle = 'rgba(226,121,142,' + (0.3 + 0.5 * cyto) + ')';
      ctx.beginPath(); ctx.arc(mastX + Math.cos(a) * r, mastY + Math.sin(a) * r, 1.4, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
    label('mast cell', mastX, mastY + 30, 7.5, MUTED, 'center');

    // macrophage
    ctx.save();
    ctx.strokeStyle = 'rgba(226,121,142,' + (0.18 + 0.35 * cyto) + ')';
    ctx.fillStyle = 'rgba(226,121,142,' + (0.03 + 0.10 * cyto) + ')';
    ctx.beginPath(); ctx.arc(macX, macY, 11, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('immune cell', macX, macY - 18, 7.5, MUTED, 'center');

    // microbial products leaking through
    for (let i = 0; i < 6; i++) {
      const u = clamp((t - 0.16 - i * 0.03) / 0.3, 0, 1);
      if (u <= 0 || u >= 1) continue;
      const x = lerp(epX + epW * 0.5, mastX - 8, u);
      const y = lerp(h * 0.30 + i * h * 0.06, mastY + (i - 3) * 3, u);
      glowDot(x, y, 1.9, ROSE, 0.8 * Math.sin(Math.PI * u), 10);
    }

    // cytokines spreading
    if (cyto > 0.05) {
      for (let i = 0; i < 12; i++) {
        const a = i * 0.55 + t * 1.4;
        const r = 18 + ((i * 13) % 60) * cyto;
        const x = mastX + Math.cos(a) * r;
        const y = mastY + Math.sin(a) * r * 0.8;
        glowDot(x, y, 1.5, ROSE, 0.42 * cyto * (1 - r / 90), 8);
      }
      label('IL-6 · TNF-α', mastX, mastY - 22, 8, 'rgba(226,121,142,' + (0.35 + 0.5 * cyto) + ')', 'center');
    }

    // ── two transmission routes to the brain
    const brainX = w * 0.70, brainY = h * 0.22, brainW = w * 0.27, brainH = h * 0.40;

    // neural route (vagal)
    const vag = [[mastX + 6, mastY - 10], [w * 0.58, h * 0.52], [w * 0.64, h * 0.38], [brainX, brainY + brainH * 0.6]];
    ctx.save();
    ctx.strokeStyle = 'rgba(237,231,221,.10)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(vag[0][0], vag[0][1]);
    ctx.bezierCurveTo(vag[1][0], vag[1][1], vag[2][0], vag[2][1], vag[3][0], vag[3][1]);
    ctx.stroke(); ctx.restore();
    label('vagal', w * 0.585, h * 0.55, 7.5, MUTED);

    // humoral route
    const hum = [[mastX, mastY + 14], [w * 0.52, h * 0.80], [w * 0.66, h * 0.72], [brainX + 10, brainY + brainH]];
    ctx.save();
    ctx.strokeStyle = 'rgba(237,231,221,.10)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hum[0][0], hum[0][1]);
    ctx.bezierCurveTo(hum[1][0], hum[1][1], hum[2][0], hum[2][1], hum[3][0], hum[3][1]);
    ctx.stroke(); ctx.restore();
    label('humoral', w * 0.53, h * 0.855, 7.5, MUTED);

    // travelling cytokine pulses
    if (travel > 0.01) {
      for (let i = 0; i < 8; i++) {
        const u = clamp(travel - i * 0.06, 0, 1);
        if (u <= 0 || u >= 1) continue;
        const p1 = polyPoint([vag[0], vag[1], vag[2], vag[3]], u);
        glowDot(p1[0], p1[1], 2, ROSE, 0.75 * Math.sin(Math.PI * u), 12);
        const p2 = polyPoint([hum[0], hum[1], hum[2], hum[3]], u);
        glowDot(p2[0], p2[1], 1.8, ROSE, 0.55 * Math.sin(Math.PI * u), 10);
      }
    }

    // ── brain container
    ctx.save();
    ctx.fillStyle = 'rgba(237,231,221,.024)';
    ctx.strokeStyle = 'rgba(237,231,221,.16)'; ctx.lineWidth = 1.1;
    rr(brainX, brainY, brainW, brainH, 16); ctx.fill(); ctx.stroke();
    ctx.restore();
    label('brain', brainX + brainW / 2, brainY - 9, 8, MUTED, 'center');

    // microglia
    const mgX = brainX + brainW * 0.36, mgY = brainY + brainH * 0.42;
    const br = lerp(1, 0.35, micro);       // branch retraction
    const bodyR = lerp(5, 8.5, micro);
    ctx.save();
    ctx.strokeStyle = 'rgba(226,121,142,' + (0.30 + 0.5 * micro) + ')';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      const a = i * 0.698 + 0.2;
      const r1 = bodyR, r2 = bodyR + 13 * br;
      ctx.beginPath();
      ctx.moveTo(mgX + Math.cos(a) * r1, mgY + Math.sin(a) * r1);
      ctx.lineTo(mgX + Math.cos(a) * r2, mgY + Math.sin(a) * r2);
      ctx.stroke();
      if (br > 0.55) {
        const bx2 = mgX + Math.cos(a) * r2, by2 = mgY + Math.sin(a) * r2;
        ctx.beginPath();
        ctx.moveTo(bx2, by2);
        ctx.lineTo(bx2 + Math.cos(a + 0.6) * 5 * br, by2 + Math.sin(a + 0.6) * 5 * br);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(226,121,142,' + (0.18 + 0.35 * micro) + ')';
    ctx.beginPath(); ctx.arc(mgX, mgY, bodyR, 0, 6.2832); ctx.fill();
    ctx.restore();
    label('microglia', mgX, mgY + 32, 7.5, 'rgba(226,121,142,' + (0.3 + 0.5 * micro) + ')', 'center');

    // behaviour bars
    const bY0 = brainY + brainH + 16;
    const bars = [
      { l: 'mood', v: 1 - behav * 0.55 },
      { l: 'energy', v: 1 - behav * 0.62 },
      { l: 'social pull', v: 1 - behav * 0.48 }
    ];
    bars.forEach((b, i) => {
      const y = bY0 + i * 13;
      const x0 = brainX + 54, x1 = brainX + brainW - 8;
      ln(x0, y, x1, y, 'rgba(237,231,221,.09)', 3);
      ln(x0, y, lerp(x0, x1, b.v), y, 'rgba(226,121,142,.55)', 3);
      label(b.l, brainX + 2, y + 3, 7, MUTED);
    });
    if (behav > 0.1) label('sickness behaviour', brainX + brainW / 2, bY0 + 52, 7.5, 'rgba(226,121,142,' + (0.25 + 0.4 * behav) + ')', 'center');

    // stress marker
    if (stress > 0.05) {
      ctx.save();
      ctx.strokeStyle = 'rgba(237,231,221,' + (0.10 + 0.25 * stress) + ')';
      ctx.setLineDash([2, 4]);
      ln(w * 0.02, h * 0.09, w * 0.20, h * 0.09, 'rgba(237,231,221,' + (0.10 + 0.25 * stress) + ')', 1, [2, 4]);
      ctx.restore();
      label('stress load', w * 0.022, h * 0.07, 8, MUTED);
    }

    // clock ruler
    ln(w * 0.035, h * 0.945, w * 0.965, h * 0.945, FAINT, 1);
    ln(w * 0.035, h * 0.945, lerp(w * 0.035, w * 0.965, t), h * 0.945, ROSE, 1.4);
    for (let i = 0; i <= 6; i++) {
      const x = w * 0.035 + i * (w * 0.93) / 6;
      ln(x, h * 0.945, x, h * 0.945 + (i % 3 === 0 ? 5 : 3), FAINT, 1);
      if (i % 3 === 0) label((i * 12) + ' h', x, h * 0.945 + 17, 7.5, 'rgba(237,231,221,.32)', 'center');
    }
  }

  /* ══════════════ make it yours ══════════════ */
  const yours = $('#yours');
  let timerHandle = null;

  function yGo(n) {
    $$('.y-step').forEach(s => s.classList.remove('on'));
    $('#yStep' + n).classList.add('on');
    $$('#ySteps .s').forEach((s, i) => {
      s.classList.toggle('done', i < n - 1);
      s.classList.toggle('now', i === n - 1);
    });
    if (n === 2) startTimer(30);
    if (n === 3) drawPersonal();
  }

  function startTimer(sec) {
    clearInterval(timerHandle);
    let left = sec;
    const arc = $('#timerArc');
    const num = $('#timerNum');
    const C = 2 * Math.PI * 16;
    const step = () => {
      num.textContent = left;
      arc.setAttribute('stroke-dashoffset', String(C * (1 - left / 30)));
      if (left <= 0) { clearInterval(timerHandle); num.textContent = '✓'; return; }
      left--;
    };
    arc.setAttribute('stroke-dasharray', String(C));
    step();
    timerHandle = setInterval(step, 1000);
  }

  $$('.connect').forEach(c => c.addEventListener('click', () => {
    c.classList.toggle('on');
    const n = $$('.connect.on').length;
    if (n) toast(n + (n === 1 ? ' source connected' : ' sources connected') + ' — demo only');
  }));

  $$('.seg').forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', seg).forEach(x => x.classList.remove('on'));
    b.classList.add('on');
  }));

  $$('[data-ynext]').forEach(b => b.addEventListener('click', () => yGo(+b.dataset.ynext)));

  $('#pmClose').addEventListener('click', () => {
    closeOverlay(yours);
    closeRegion();
    toast('Your model is now the default view');
  });

  function drawPersonal() {
    const svg = $('#pmChart');
    const W = 300, H = 130;
    const x0 = 14, x1 = 288, y0 = 12, y1 = 100;
    const ga = [], mine = [];
    for (let i = 0; i < 30; i++) {
      const base = DAYS[i].moodN;
      ga.push(base);
      const src = DAYS[Math.max(0, i - 2)];
      mine.push(clamp(0.55 * src.moodN + 0.30 * src.vagal + 0.15 * (1 - src.immune) + 0.05 * Math.sin(i * 1.7), 0, 1));
    }
    const px = i => x0 + (i / 29) * (x1 - x0);
    const py = v => y1 - v * (y1 - y0);
    const mk = arr => 'M' + arr.map((v, i) => px(i).toFixed(1) + ',' + py(v).toFixed(1)).join(' L');

    let html = '';
    for (let i = 0; i <= 2; i++) {
      const y = y0 + i * (y1 - y0) / 2;
      html += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="rgba(237,231,221,.07)" stroke-width="1"/>`;
    }
    // lag band between the two peaks
    const pkA = ga.indexOf(Math.max(...ga)), pkB = mine.indexOf(Math.max(...mine));
    html += `<rect x="${px(Math.min(pkA, pkB)).toFixed(1)}" y="${y0}" width="${Math.abs(px(pkA) - px(pkB)).toFixed(1)}" height="${y1 - y0}" fill="rgba(95,198,182,.07)" rx="2"/>`;
    html += `<path d="${mk(ga)}" fill="none" stroke="rgba(237,231,221,.28)" stroke-width="1.3" stroke-dasharray="3 4"/>`;
    html += `<path d="${mk(mine)}" fill="none" stroke="#5FC6B6" stroke-width="1.8" stroke-linejoin="round"/>`;
    html += `<circle cx="${px(pkB)}" cy="${py(mine[pkB])}" r="3" fill="#5FC6B6"/>`;
    html += `<text x="${x0}" y="${H - 8}" fill="rgba(237,231,221,.35)" font-size="8" letter-spacing="1">POPULATION AVERAGE</text>`;
    html += `<text x="${x1}" y="${H - 8}" fill="rgba(95,198,182,.75)" font-size="8" text-anchor="end" letter-spacing="1">YOURS</text>`;
    svg.innerHTML = html;

    // count up
    const conf = $('#pmConf');
    conf.style.width = '12%';
    setTimeout(() => { conf.style.width = '41%'; }, 120);
  }

  /* ══════════════ toast ══════════════ */
  let toastT = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('on'), 2400);
  }

  /* ══════════════ top bar actions ══════════════ */
  $$('[data-act]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'evidence') openOverlay($('#evidence'));
    if (a === 'yours') { openOverlay(yours); yGo(1); }
    if (a === 'chapter') openChapter(b.dataset.chapter);
  }));

  /* ══════════════ keyboard ══════════════ */
  document.addEventListener('keydown', e => {
    const openOv = $$('.overlay.open');
    if (e.key === 'Escape') {
      if (openOv.length) { openOv.forEach(o => closeOverlay(o)); state.chapter = null; }
      else if (state.region) closeRegion();
      return;
    }
    if (openOv.length) return;
    if (e.key === 'ArrowRight') { setPlaying(false); setDay(state.day + 1); }
    if (e.key === 'ArrowLeft') { setPlaying(false); setDay(state.day - 1); }
    if (e.key === ' ') { e.preventDefault(); setPlaying(!state.playing); }
    if (e.key === '1') togglePw('vagal');
    if (e.key === '2') togglePw('circ');
    if (e.key === '3') togglePw('immune');
    if (e.key === 'a' || e.key === 'A') openChapter('A');
    if (e.key === 'b' || e.key === 'B') openChapter('B');
    if (e.key === 'c' || e.key === 'C') openChapter('C');
  });

  window.addEventListener('resize', () => { if (state.chapter) sizeCanvas(); });

  /* ══════════════ boot ══════════════ */
  buildParticles();
  buildChart();
  buildEvidence();
  setDay(state.day);
  $('#lagNote').textContent = lagNote();

  if (REDUCED) {
    setPlaying(false);
  } else {
    // a gentle opening: the vagal route animates immediately, nothing auto-plays the timeline
    setTimeout(() => { $('#hint').style.opacity = '0.85'; }, 100);
  }

  requestAnimationFrame(t => { last = t; frame(t); });
})();
