/* ailiu.online preview v2 — shell + seven treatment choreographies.
   Implementation route per §6.4: IntersectionObserver + rAF (with watchdog).
   No CSS scroll-timeline, no libraries, nothing loaded from other origins. */
(function () {
  "use strict";
  const M = window.MANIFEST;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mqMobile = window.matchMedia("(max-width: 760px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const isMobile = () => mqMobile.matches;
  const byKey = Object.fromEntries(M.projects.map((p) => [p.key, p]));
  const order = M.projects.slice().sort((a, b) => a.order - b.order);
  const pad = (n) => String(n).padStart(2, "0");

  /* ------------------------------------------------------------------ language */
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || localStorage.getItem("ailiu.lang") || ((navigator.language || "").startsWith("zh") ? "zh" : "en");
  if (lang !== "zh") lang = "en";
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang] || o.en || "");

  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    $$("[data-en]").forEach((el) => { el.textContent = el.dataset[lang] || el.dataset.en; });
    $$("[data-lang-opt]").forEach((el) => el.classList.toggle("on", el.dataset.langOpt === lang));
    fillSlots(); buildNav(); renderSound(); buildTranscript(); renderWildSource(true); renderLog();
    measureAviso();
    narrator.onLang();
  }
  $("#langBtn").addEventListener("click", () => {
    lang = lang === "en" ? "zh" : "en";
    localStorage.setItem("ailiu.lang", lang);
    applyLang();
  });

  /* ------------------------------------------------------------------ manifest → nav, slots */
  function buildNav() {
    $("#chapnav").innerHTML = order.map((p, i) =>
      `<li><a href="#${p.key}" data-key="${p.key}"><b>${pad(i + 1)}</b><span>${L(p.title)}</span></a></li>`).join("");
    $("#heroIndex").innerHTML = order.map((p, i) =>
      `<li><a href="#${p.key}"><b>${pad(i + 1)}</b><span>${L(p.title)}</span><em>${L(p.statusLabel)}</em></a></li>`).join("");
    if (active) setActive(active, true);
  }
  function fillSlots() {
    order.forEach((p, i) => {
      const sec = document.getElementById(p.key);
      if (!sec) return;
      sec.dataset.index = i + 1;
      $$("[data-slot]", sec).forEach((el) => {
        const s = el.dataset.slot;
        if (s === "index") el.textContent = pad(i + 1);
        else if (s === "title") el.textContent = L(p.title);
        else if (s === "tagline") el.textContent = L(p.tagline);
        else if (s === "blurb") el.textContent = L(p.blurb);
        else if (s === "status") el.textContent = L(p.statusLabel);
        else if (s === "cta") {
          const ln = p.links && p.links[0];
          el.textContent = ln ? L(ln.label) : "";
          if (ln) el.href = ln.href; else el.removeAttribute("href");
        }
      });
      const h = $(".slot-title", sec);
      if (h) { h.id = "t-" + p.key; sec.setAttribute("aria-labelledby", h.id); }
    });
    const d = byKey["wild-louis"].disclosure;
    $("#wlDisc").textContent = L(d);
  }
  function sizeStages() {
    order.forEach((p) => {
      const st = $(`[data-stage="${p.key}"]`);
      if (st) st.style.height = isMobile() ? "" : p.stageHeightVh + "vh";
    });
  }

  /* ------------------------------------------------------------------ presets (IO → .is-in) */
  const presetIO = new IntersectionObserver((ens) => {
    ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); presetIO.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
  $$("[data-preset]").forEach((el, i) => presetIO.observe(el));

  /* ------------------------------------------------------------------ sound (muted placeholder) */
  // Real flow (§5.1): on load create AudioContext → resume() and audio.play() the opening line;
  // one-shot unlock listeners on keydown/pointerdown/touchend/click (scroll/mousemove are NOT
  // user activation per HTML spec, so most first visits will be blocked until a click/key).
  // This preview has no recorded voice, so nothing is played and no "tap for sound" chip is shown.
  let soundOn = localStorage.getItem("ailiu.sound") !== "off";
  function renderSound() {
    const b = $("#soundBtn");
    b.setAttribute("aria-pressed", String(soundOn));
    $(".sound-label", b).textContent = lang === "zh" ? (soundOn ? "声音 开" : "声音 关") : (soundOn ? "Sound on" : "Sound off");
    b.title = lang === "zh" ? "声音为静音占位：Louis 的声音尚未录制" : "Muted placeholder: Louis's voice is not recorded yet";
  }
  $("#soundBtn").addEventListener("click", () => {
    soundOn = !soundOn;
    localStorage.setItem("ailiu.sound", soundOn ? "on" : "off");
    renderSound();
  });

  /* ------------------------------------------------------------------ Louis instances */
  const louisHero = new Louis({ lines: 56, samples: 160 }).mount($("#louisHero"));
  const louisMini = new Louis({ lines: 20, samples: 60, amp: 0.36, interactive: false, glitch: false, mini: true, fps: 30, bg: "#060607" }).mount($("#narFace"));
  const louisWild = new Louis({ lines: 60, samples: 160, bg: "#050507", colorA: [185, 166, 255], colorB: [150, 232, 255] }).mount($("#louisWild"));
  const louises = [louisHero, louisMini, louisWild];

  /* ------------------------------------------------------------------ narrator (captions; §4.5 rules) */
  const narrator = (() => {
    const sub = $("#narSub"), box = $("#narrator");
    const said = new Set();
    let cur = null, queued = null, coolUntil = 0, startT = 0, dur = 0, words = [];
    const estimate = (txt) => Math.max(1800, lang === "zh" ? (txt.length / 4.5) * 1000 : (txt.length / 15) * 1000);
    function lineFor(id) {
      if (id === "hero") return { id, idx: 0, text: L(M.hero.narration[0].subtitle) };
      const p = byKey[id]; return { id, idx: order.indexOf(p) + 1, text: L(p.narration[0].subtitle) };
    }
    function render(text) {
      const parts = lang === "zh" ? Array.from(text) : text.split(/(\s+)/);
      sub.innerHTML = parts.map((w) => (/^\s+$/.test(w) ? w : `<span class="w">${w.replace(/</g, "&lt;")}</span>`)).join("");
      words = $$(".w", sub);
    }
    function play(line) {
      cur = line; startT = performance.now(); dur = estimate(line.text);
      render(line.text); box.classList.remove("is-idle");
      $("#narIdx").textContent = `${pad(line.idx)} / 07`;
      louises.forEach((l) => l.setState("talk"));
    }
    function request(id, force) {
      if (!force && said.has(id)) return;
      said.add(id);
      const line = lineFor(id);
      if (!cur) {
        if (performance.now() < coolUntil) { queued = line; return; }
        return play(line);
      }
      // fast scrolling: keep only the newest; if we've moved 2+ chapters away, cut over now
      if (Math.abs(line.idx - cur.idx) >= 2) { cur = null; play(line); } else queued = line;
    }
    function tick(now) {
      let level = 0;
      if (cur) {
        const t = (now - startT) / dur;
        const n = Math.ceil(clamp(t) * words.length);
        for (let i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
        // synthetic speech envelope (stand-in for AnalyserNode RMS until audio exists)
        if (soundOn && t < 1) level = 0.28 + 0.42 * Math.abs(Math.sin(now / 90)) * (0.5 + 0.5 * Math.sin(now / 370));
        if (t >= 1) {
          cur = null; coolUntil = now + 1200; box.classList.add("is-idle");
          words.forEach((w) => w.classList.add("on"));
          louises.forEach((l) => l.setState("idle"));
        }
      } else if (queued && now >= coolUntil) { const q = queued; queued = null; play(q); }
      louises.forEach((l) => l.setLevel(level));
      const r = $("#lvRead"); if (r) r.textContent = level.toFixed(2);
    }
    function onLang() { if (cur) { const id = cur.id; cur = null; render(lineFor(id).text); words.forEach((w) => w.classList.add("on")); box.classList.add("is-idle"); } }
    function replay() { const id = active || "hero"; said.delete(id); cur = null; request(id, true); }
    return { request, tick, onLang, replay };
  })();
  $("#narFace").addEventListener("click", () => { louisMini.setState("react"); narrator.replay(); });

  /* ------------------------------------------------------------------ active chapter, glitch-cut, narration cue */
  let active = null;
  const glitched = new Set();
  function setActive(key, silent) {
    active = key;
    $$("#chapnav a").forEach((a) => a.setAttribute("aria-current", String(a.dataset.key === key)));
    document.body.classList.toggle("is-wild", key === "wild-louis");
    if (!key) $("#narIdx").textContent = "00 / 07";
    if (silent || !key || glitched.has(key) || reduced) return;
    glitched.add(key);
    const sec = document.getElementById(key);
    const cut = $(".cut", sec), title = $("header.slots .slot-title", sec);
    cut.classList.remove("go"); void cut.offsetWidth; cut.classList.add("go");
    if (title) { title.classList.add("glitching"); setTimeout(() => title.classList.remove("glitching"), 200); }
  }
  const dwell = {};
  function checkChapters() {
    const vh = innerHeight;
    let best = null, bestCov = 0;
    order.forEach((p) => {
      const r = document.getElementById(p.key).getBoundingClientRect();
      const cov = clamp((Math.min(vh, r.bottom) - Math.max(0, r.top)) / vh);
      if (cov > bestCov) { bestCov = cov; best = p.key; }
      // ≥55% of the viewport for ≥450ms → one line, once per session (§4.5-2)
      if (cov >= 0.55) {
        if (!dwell[p.key]) dwell[p.key] = performance.now();
        else if (performance.now() - dwell[p.key] > 450) narrator.request(p.key);
      } else dwell[p.key] = 0;
    });
    const heroR = $("#top").getBoundingClientRect();
    const heroCov = clamp((Math.min(vh, heroR.bottom) - Math.max(0, heroR.top)) / vh);
    const k = heroCov > bestCov || bestCov < 0.3 ? null : best;
    if (k !== active) setActive(k);
  }

  /* ------------------------------------------------------------------ per-stage progress */
  function progressOf(key) {
    const st = $(`[data-stage="${key}"]`);
    const r = st.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span) : (r.top < innerHeight ? 1 : 0);
  }

  /* ---- 01 Aviso */
  const avWin = $("#avWin"), avHl = $("#avHl");
  function measureAviso() {
    const mark = $("#avMark");
    const prev = avWin.style.transform;
    avWin.style.transform = "none";
    const wr = avWin.getBoundingClientRect();
    const rects = Array.from(mark.getClientRects());
    avWin.style.transform = prev;
    avHl.innerHTML = rects.map((r) =>
      `<span class="av-hl-box" style="--hl-x:${r.left - wr.left - 2}px;--hl-y:${r.top - wr.top - 1}px;--hl-w:${r.width + 4}px;--hl-h:${r.height + 2}px"></span>`).join("");
    if (rects[0]) {
      avWin.style.setProperty("--hl-x", (rects[0].left - wr.left) + "px");
      avWin.style.setProperty("--hl-y", (rects[0].top - wr.top) + "px");
    }
  }
  function aviso(p) {
    const s = avWin.style;
    if (isMobile() || reduced) {
      ["--rx", "--ry", "--tz", "--zh", "--zp"].forEach((k) => s.removeProperty(k));
      s.setProperty("--po", 1); s.setProperty("--sel", 1); s.setProperty("--ans", 1); s.setProperty("--tag", 0);
      return;
    }
    const rise = sstep(0, 0.22, p);
    const e = sstep(0.26, 0.42, p) * (1 - sstep(0.6, 0.78, p));
    s.setProperty("--rx", (16 * (1 - rise) + 6 * e).toFixed(2) + "deg");
    s.setProperty("--ry", (-12 * (1 - rise) - 14 * e).toFixed(2) + "deg");
    s.setProperty("--tz", (-140 * (1 - rise)).toFixed(1) + "px");
    s.setProperty("--zh", (60 * e).toFixed(1) + "px");
    s.setProperty("--zp", (140 * e).toFixed(1) + "px");
    s.setProperty("--tag", e.toFixed(3));
    s.setProperty("--sel", sstep(0.06, 0.18, p).toFixed(3));
    s.setProperty("--po", sstep(0.16, 0.26, p).toFixed(3));
    const ans = sstep(0.62, 0.9, p);
    s.setProperty("--ans", ans.toFixed(3));
    s.setProperty("--caret", p > 0.6 && ans < 1 ? 1 : 0);
  }

  /* ---- 02 PrintPlay */
  const sheets = $$("#ppStack .sheet");
  const fanPos = [-2, 2, -1, 1, 0]; // DOM back→front; word cards (front) lands centre
  function printplay(p) {
    const desk = $(".pp-desk");
    if (reduced) p = 1; // reduced motion: static end state (fanned), no scrub
    if (isMobile()) { sheets.forEach((sh) => { sh.style.cssText = sh.style.cssText.replace(/--[xyr]:[^;]+;?/g, ""); }); $(".sh-cards").style.setProperty("--fold", "0deg"); return; }
    const W = desk.clientWidth, H = desk.clientHeight;
    const sw = sheets[0].offsetWidth;
    // keep the fan clear of the title block on the left and the desk edge on the right
    const slots = $(".pp-slots"), cx = W * 0.63;
    const leftLimit = slots.offsetLeft + slots.offsetWidth + 24;
    const spread = Math.max(40, Math.min(sw * 0.8, (cx - leftLimit - sw * 0.62) / 2, (W - 24 - cx - sw * 0.62) / 2));
    const drop = H * 0.5 + sw * 0.75;
    let printing = 0;
    sheets.forEach((sh, i) => {
      const pr = sstep(i * 0.05, i * 0.05 + 0.11, p);
      if (pr > 0 && pr < 1) printing = 1;
      const f = sstep(0.3, 0.58, p);
      const pos = fanPos[i];
      const jit = (i % 2 ? 1 : -1) * 1.2;
      sh.style.setProperty("--x", (pos * spread * f).toFixed(1) + "px");
      sh.style.setProperty("--y", ((1 - pr) * -drop + pos * pos * 9 * f).toFixed(1) + "px");
      sh.style.setProperty("--r", (pos * 4.6 * f + jit * (1 - f * 0.5)).toFixed(2) + "deg");
    });
    const fold = 18 * (1 - sstep(0.56, 0.76, p));
    const c = $(".sh-cards"); c.style.setProperty("--fold", fold.toFixed(2) + "deg"); c.style.setProperty("--foldk", (fold / 18).toFixed(3));
    desk.style.setProperty("--printing", printing);
  }

  /* ---- 03 Steam */
  const stPin = $("#steam .pin"), stRange = $("#stRange");
  let stTouched = false;
  stRange.addEventListener("input", () => { stTouched = true; });
  (function ticks() {
    const g = $("#gTicks"); let h = "";
    for (let i = 0; i <= 40; i++) {
      const a = (-135 + (270 * i) / 40) * Math.PI / 180, maj = i % 5 === 0;
      const r1 = maj ? 70 : 74, r2 = 80;
      h += `<line class="${maj ? "maj" : ""}" x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}"/>`;
    }
    g.innerHTML = h;
  })();
  function steam(p) {
    const grow = isMobile() || reduced ? 1 : sstep(0, 0.3, p);
    let front = isMobile() || reduced ? 1 : sstep(0.32, 0.8, p);
    if (stTouched) front = stRange.value / 100; else stRange.value = Math.round(front * 100);
    stPin.style.setProperty("--grow", grow.toFixed(3));
    stPin.style.setProperty("--front", front.toFixed(3));
    const rads = $$(".st-rad", stPin);
    rads[0].style.setProperty("--heat", sstep(0.5, 0.62, front).toFixed(3));
    rads[1].style.setProperty("--heat", sstep(0.8, 0.92, front).toFixed(3));
    const closed = front > 0.985 ? 1 : 0;
    stPin.style.setProperty("--closed", closed);
    const vs = $("#stVentState");
    vs.textContent = closed ? (lang === "zh" ? "蒸汽到达 · 关闭" : "STEAM HERE · CLOSED") : (lang === "zh" ? "排空气中" : "AIR OUT");
  }

  /* ---- 04 Suikou */
  const skTrack = $("#skTrack"), skCard = $("#skCard"), skDots = $$(".sk-dots i"), skPhone = $("#skPhone");
  function suikou(p) {
    const pin = $("#suikou .pin");
    pin.style.setProperty("--ring", p.toFixed(3));
    if (isMobile() || reduced) { skCard.style.setProperty("--cardr", "0deg"); return; }
    const r = sstep(0, 0.2, p);
    skPhone.style.setProperty("--prx", (10 * (1 - r)).toFixed(2) + "deg");
    skPhone.style.setProperty("--pry", (-14 * (1 - r) + 4 * Math.sin(p * Math.PI)).toFixed(2) + "deg");
    const raw = clamp((p - 0.22) / 0.62) * 2;
    const i = Math.min(1, Math.floor(raw)), frac = raw - i;
    const slide = Math.min(2, i + sstep(0.55, 0.9, frac));
    skTrack.style.setProperty("--slide", slide.toFixed(3));
    // pseudo-flip: tilt ≤18°, swap faces, settle (2.5D, never a 180° spin)
    const k = clamp((raw - 1.05) / 0.35);
    const ang = k < 0.5 ? 18 * k * 2 : -18 * (1 - k) * 2;
    skCard.style.setProperty("--cardr", ang.toFixed(2) + "deg");
    skCard.style.setProperty("--back", k < 0.5 ? 0 : 1);
    const on = Math.round(slide);
    skDots.forEach((d, j) => d.classList.toggle("on", j === on));
  }
  skCard.addEventListener("click", () => { if (isMobile() || reduced) skCard.style.setProperty("--back", skCard.style.getPropertyValue("--back") === "1" ? 0 : 1); });

  /* ---- 05 Xiaoyi */
  const xySpreads = $$(".xy-spread"), xyLeaf = $("#xyLeaf"), xyTabs = $$("#xyTabs li");
  function xiaoyi(p) {
    if (isMobile() || reduced) { xySpreads.forEach((s) => s.style.setProperty("--rv", 1)); return; }
    const s = clamp((p - 0.12) / 0.7) * 3;
    xySpreads.forEach((el, j) => { if (j) el.style.setProperty("--rv", sstep(j - 0.65, j - 0.1, s).toFixed(3)); });
    let bell = 0;
    for (let j = 1; j <= 3; j++) { const t = clamp((s - (j - 0.85)) / 0.8); if (t > 0 && t < 1) bell = Math.max(bell, Math.sin(Math.PI * t)); }
    xyLeaf.style.setProperty("--leaf", (-18 * bell).toFixed(2) + "deg");
    xyLeaf.style.setProperty("--leafo", (bell * 0.9).toFixed(3));
    const cur = Math.min(3, Math.floor(s + 0.25));
    xyTabs.forEach((li, j) => li.classList.toggle("on", j === cur));
  }

  /* ---- 06 TaoTao */
  const ttCells = $$("#ttWall .tt-cell");
  let ttHover = null, ttHome = [];
  ttCells.forEach((c) => {
    c.addEventListener("pointerenter", () => { ttHover = c; });
    c.addEventListener("pointerleave", () => { if (ttHover === c) ttHover = null; });
    c.addEventListener("click", () => { ttHover = c; });
  });
  function measureTT() { ttHome = ttCells.map((c) => [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + c.offsetHeight / 2]); }
  function taotao(p) {
    const wall = $("#ttWall");
    if (!isMobile() && !reduced) {
      const cx = wall.offsetWidth / 2, cy = wall.offsetHeight / 2;
      ttCells.forEach((c, i) => {
        const f = sstep(i * 0.035, 0.22 + i * 0.035, p);
        const [hx, hy] = ttHome[i] || [cx, cy];
        c.style.setProperty("--fx", ((cx - hx) * (1 - f)).toFixed(1) + "px");
        c.style.setProperty("--fy", ((cy - hy) * (1 - f)).toFixed(1) + "px");
        c.style.setProperty("--fr", (((i % 3) - 1) * 7 * (1 - f) + (i - 2.5) * 2 * (1 - f)).toFixed(2) + "deg");
      });
    }
    // at most 2 playing (1 on mobile): hovered first, then nearest to viewport centre
    const limit = isMobile() ? 1 : 2;
    const vis = ttCells.filter((c) => c.offsetParent !== null);
    const mid = innerHeight / 2, midX = innerWidth / 2;
    const ranked = vis.map((c) => { const r = c.getBoundingClientRect(); return [c, Math.hypot(r.left + r.width / 2 - midX, (r.top + r.height / 2 - mid) * 1.6), r]; })
      .filter(([, , r]) => r.bottom > 0 && r.top < innerHeight)
      .sort((a, b) => a[1] - b[1]).map(([c]) => c);
    let playing = (reduced || saveData) ? [] : ranked.slice(0, limit);
    if (ttHover && !reduced) playing = [ttHover].concat(playing.filter((c) => c !== ttHover)).slice(0, limit);
    ttCells.forEach((c) => c.classList.toggle("is-playing", playing.includes(c)));
  }

  /* ---- 07 Wild Louis */
  const wlSrc = $("#wlSrc"), wlPin = $("#wild-louis .pin");
  let srcLines = [], shownLines = -1;
  function renderWildSource(force) {
    const p = byKey["wild-louis"];
    const view = { key: p.key, order: p.order, type: p.type, status: p.status, title: p.title[lang], tagline: p.tagline[lang],
      treatment: p.treatment.id, choreography: p.treatment.choreographyId, enter: p.transition.enter, exit: p.transition.exit,
      stageHeightVh: p.stageHeightVh, aiGenerated: p.aiGenerated, narration: p.narration[0].subtitle[lang], logEntries: p.log.length };
    srcLines = JSON.stringify(view, null, 2).split("\n");
    if (force) shownLines = -1;
  }
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function paintSrc(n) {
    if (n === shownLines) return; shownLines = n;
    const html = srcLines.slice(0, n).map((ln) => esc(ln)
      .replace(/^(\s*)"([^"]+)":/, '$1<span class="k">"$2"</span>:')
      .replace(/: "(.*)"(,?)$/, ': <span class="s">"$1"</span>$2')).join("\n");
    wlSrc.innerHTML = html + (n < srcLines.length ? '<span class="cur"></span>' : "");
  }
  function renderLog() {
    const log = byKey["wild-louis"].log;
    $("#wlLog").innerHTML = log.slice().reverse().map((e) =>
      `<li><time>${e.date}</time><span>${esc(e[lang])}<small>model: ${e.model || "none"} · cost: $${e.costUsd.toFixed(2)}</small></span></li>`).join("");
    $("#wlLogCount").textContent = log.length + (lang === "zh" ? " 条" : " entries");
  }
  const cssTok = getComputedStyle(document.documentElement);
  function wild(p) {
    const m = isMobile() || reduced;
    wlPin.style.setProperty("--xr", m ? 1 : sstep(0, 0.2, p).toFixed(3));
    wlPin.style.setProperty("--grow", m ? 1 : sstep(0.08, 0.42, p).toFixed(3));
    paintSrc(m ? Math.min(12, srcLines.length) : Math.round(sstep(0.08, 0.62, p) * srcLines.length));
    const lvl = getComputedStyle(document.documentElement).getPropertyValue("--louis-level").trim() || "0";
    const rows = [
      ["--louis-level", (+lvl).toFixed(3)],
      ["progress", p.toFixed(3)],
      ["viewport", innerWidth + "×" + innerHeight],
      ["lang", lang],
      ["narrationScope", M.narrationScope],
      ["--dur-base", cssTok.getPropertyValue("--dur-base").trim()],
      ["--ease-out", cssTok.getPropertyValue("--ease-out").trim()],
      ["reduced-motion", String(reduced)],
      ["chapters", String(order.length)],
    ];
    $("#wlRuntime").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  }

  /* ------------------------------------------------------------------ hero glyph rain (hero only, §4.7) */
  const rain = (() => {
    const c = $("#rain"); if (!c || reduced) return { tick() {} };
    const ctx = c.getContext("2d");
    const glyphs = "01アイウエオカキクケコサシスセソ<>/{}[]#=+*ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ".split("");
    let cols = [], w = 0, h = 0, last = 0, on = true;
    const fs = 14;
    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Array.from({ length: Math.ceil(w / (fs * 1.6)) }, () => ({ y: Math.random() * h, v: 0.6 + Math.random() * 1.6, a: Math.random() }));
    }
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(c);
    addEventListener("resize", resize); resize();
    return {
      tick(now) {
        if (!on || now - last < 42) return; last = now;
        ctx.fillStyle = "rgba(6,6,7,0.18)"; ctx.fillRect(0, 0, w, h);
        ctx.font = `${fs}px "JetBrains Mono", monospace`;
        cols.forEach((col, i) => {
          const ch = glyphs[(Math.random() * glyphs.length) | 0];
          ctx.fillStyle = `rgba(150,232,255,${0.12 + col.a * 0.25})`;
          ctx.fillText(ch, i * fs * 1.6, col.y);
          col.y += fs * col.v * 0.5; if (col.y > h + 20) { col.y = -20; col.a = Math.random(); }
        });
      }
    };
  })();

  /* ------------------------------------------------------------------ footer voiceprint (Louis's signal, Atomic nod) */
  const voice = (() => {
    const c = $("#voiceprint"), ctx = c.getContext("2d");
    let w = 0, h = 0, on = false;
    function resize() { const dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(0); }
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(c);
    addEventListener("resize", resize);
    function draw(now) {
      const t = now / 1000, lvl = louisHero.lvl || 0;
      ctx.clearRect(0, 0, w, h);
      const x0 = w * 0.22, x1 = w * 0.78, mid = h / 2;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      for (let k = 0; k < 7; k++) {
        const g = ctx.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, "rgba(150,232,255,0)"); g.addColorStop(0.3, "rgba(150,232,255,.75)"); g.addColorStop(0.7, "rgba(185,166,255,.75)"); g.addColorStop(1, "rgba(185,166,255,0)");
        ctx.strokeStyle = g; ctx.beginPath();
        for (let x = x0; x <= x1; x += 4) {
          const u = (x - x0) / (x1 - x0);
          const env = Math.sin(Math.PI * u) ** 1.6;
          const y = mid + env * h * (0.18 + lvl * 0.15) * Math.sin(u * (3 + k * 0.7) * Math.PI + t * (0.6 + k * 0.13) + k);
          x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    resize();
    return { tick(now) { if (on && !reduced) draw(now); } };
  })();

  /* ------------------------------------------------------------------ maze (deterministic) */
  (function maze() {
    const N = 7, cell = 84 / N, o = 8; const seen = new Set(); const walls = new Set();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { walls.add(`h${x},${y}`); walls.add(`v${x},${y}`); }
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const stack = [[0, 0]]; seen.add("0,0");
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < N && b < N && !seen.has(`${a},${b}`));
      if (!nb.length) { stack.pop(); continue; }
      const [a, b, dx, dy] = nb[(rnd() * nb.length) | 0];
      if (dx === 1) walls.delete(`v${x + 1},${y}`); if (dx === -1) walls.delete(`v${x},${y}`);
      if (dy === 1) walls.delete(`h${x},${y + 1}`); if (dy === -1) walls.delete(`h${x},${y}`);
      seen.add(`${a},${b}`); stack.push([a, b]);
    }
    let d = `M${o} ${o}H${o + N * cell}V${o + N * cell - cell}M${o + N * cell} ${o + N * cell}H${o}V${o + cell}`;
    walls.forEach((k) => {
      const [x, y] = k.slice(1).split(",").map(Number);
      if (k[0] === "h" && y > 0) d += `M${o + x * cell} ${o + y * cell}h${cell}`;
      if (k[0] === "v" && x > 0) d += `M${o + x * cell} ${o + y * cell}v${cell}`;
    });
    $("#maze").innerHTML = `<path d="${d}"/><circle class="m-s" cx="${o - 3}" cy="${o + cell / 2}" r="2.4"/><circle class="m-e" cx="${o + N * cell + 3}" cy="${o + N * cell - cell / 2}" r="2.4"/>`;
  })();

  /* ------------------------------------------------------------------ transcript (readable alternative to audio, §5.5) */
  function buildTranscript() {
    const items = [`<li><b>Louis:</b> ${esc(L(M.hero.narration[0].subtitle))}</li>`]
      .concat(order.map((p, i) => `<li><b>${pad(i + 1)} ${esc(L(p.title))}:</b> ${esc(L(p.narration[0].subtitle))}</li>`));
    $("#transcript").innerHTML = items.join("");
  }

  /* ------------------------------------------------------------------ main loop + watchdog */
  const updaters = { aviso, printplay, steam, suikou, xiaoyi, taotao, "wild-louis": wild };
  let lastFrame = performance.now(), degraded = false;
  function frame(now) {
    lastFrame = now;
    if (!document.hidden) {
      for (const key in updaters) {
        const sec = document.getElementById(key);
        const r = sec.getBoundingClientRect();
        if (r.bottom < -innerHeight * 0.5 || r.top > innerHeight * 1.5) continue; // off-screen: skip
        updaters[key](progressOf(key));
      }
      checkChapters();
      narrator.tick(now);
      rain.tick(now);
      voice.tick(now);
    }
    requestAnimationFrame(frame);
  }
  // rAF watchdog: if frames stop for >2s while visible, snap every stage to its end state
  setInterval(() => {
    if (!document.hidden && !degraded && performance.now() - lastFrame > 2000) {
      degraded = true;
      for (const key in updaters) updaters[key](1);
      $$("[data-preset]").forEach((el) => el.classList.add("is-in"));
    }
  }, 1000);

  function layout() { sizeStages(); measureAviso(); measureTT(); }
  addEventListener("resize", layout);
  mqMobile.addEventListener("change", layout);

  renderWildSource(true);
  applyLang();
  layout();
  requestAnimationFrame(frame);
  setTimeout(() => narrator.request("hero"), 700);
  if (document.fonts) document.fonts.ready.then(() => { measureAviso(); measureTT(); });
})();
