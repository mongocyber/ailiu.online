/* ailiu.online preview v2 — shell + per-chapter choreographies.
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
  // r27: the CSS design pixel (--u in styles.css): 1 up to 1440 wide, then min(width / 1440, height / 900)
  const unit = () => innerWidth > 1440 ? Math.max(1, Math.min(innerWidth / 1440, innerHeight / 900)) : 1;
  const byKey = Object.fromEntries(M.projects.map((p) => [p.key, p]));
  const order = M.projects.slice().sort((a, b) => a.order - b.order);
  const pad = (n) => String(n).padStart(2, "0");
  // r12: decorative modules are built through mod(): if one throws while setting up, it is replaced by a no-op stand-in
  const mod = (fn, stub) => { try { return fn(); } catch (e) { return stub; } };
  // r12: storage can throw (private mode / locked-down WebViews) — treat it as empty
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  // chapter total for the "nn / 08" suffixes in CSS (slot index, steam title block)
  document.documentElement.style.setProperty("--of", `" / ${pad(order.length)}"`);

  /* ------------------------------------------------------------------ language */
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || store.get("ailiu.lang") || "en";
  if (lang !== "zh") lang = "en";
  const L = (o) => (o == null ? "" : typeof o === "string" ? o : o[lang] || o.en || "");
  // r7: draft copy (CONTENT-DRAFT.md, unconfirmed) wins over the base field when present
  const V = (p, f) => (p.draft && p.draft[f] != null ? p.draft[f] : p[f]);
  const T = (zh, en) => (lang === "zh" ? zh : en);

  function applyLang() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    // r12: title / description / og follow the language (same words as the hero, no chapter counts)
    const meta = M.meta[lang];
    document.title = meta.title;
    [["name", "description"], ["property", "og:description"]].forEach(([k, v]) => { const m = $(`meta[${k}="${v}"]`); if (m) m.content = meta.description; });
    const ogt = $('meta[property="og:title"]'); if (ogt) ogt.content = meta.title;
    const ogl = $('meta[property="og:locale"]'); if (ogl) ogl.content = lang === "zh" ? "zh_CN" : "en_US";
    $$("[data-en]").forEach((el) => { el.textContent = el.dataset[lang] || el.dataset.en; });
    $$("[data-alt-en]").forEach((el) => { el.alt = lang === "zh" ? el.dataset.altZh : el.dataset.altEn; });
    $$("[data-label-en]").forEach((el) => el.setAttribute("aria-label", lang === "zh" ? el.dataset.labelZh : el.dataset.labelEn));
    $$("[data-lang-opt]").forEach((el) => el.classList.toggle("on", el.dataset.langOpt === lang));
    fillSlots(); renderWork(); buildNav(); renderSound();
    measureAviso(); reelTxt = "";
  }
  $("#langBtn").addEventListener("click", () => {
    lang = lang === "en" ? "zh" : "en";
    store.set("ailiu.lang", lang);
    applyLang();
  });

  /* ------------------------------------------------------------------ manifest → nav, slots */
  function buildNav() {
    $("#chapnav").innerHTML = `<li class="nav-ind" aria-hidden="true" role="presentation"></li>` + order.map((p, i) =>
      `<li><a href="#${p.key}" data-key="${p.key}"><b>${pad(i + 1)}</b><span>${L(V(p, "title"))}</span></a></li>`).join("");
    $("#heroIndex").innerHTML = order.map((p, i) =>
      `<li><a href="#${p.key}"><b>${pad(i + 1)}</b><span>${L(V(p, "title"))}</span>${p.showStatus === false ? "" : `<em>${L(V(p, "statusLabel"))}</em>`}</a></li>`).join("");
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
        else if (s === "title") el.textContent = L(V(p, "title"));
        else if (s === "tagline") el.textContent = L(V(p, "tagline"));
        else if (s === "blurb") el.textContent = L(V(p, "blurb"));
        else if (s === "status") {
          el.textContent = L(V(p, "statusLabel"));
          el.hidden = p.showStatus === false;
          const c = p.draft && p.draft.statusClass;
          if (c && c !== "is-ai") { el.classList.remove("is-dev", "is-pending"); el.classList.add(c); }
        } else if (s === "cta") {
          const ln = V(p, "links").find((x) => x.href && (!x.state || x.state === "ok"));
          el.textContent = ln ? L(ln.label) : "";
          if (ln) el.href = ln.href; else el.removeAttribute("href");
        }
      });
      const h = $(".slot-title", sec);
      if (h) { h.id = "t-" + p.key; sec.setAttribute("aria-labelledby", h.id); }
      renderDraftRow(p, sec);
    });
    $("#heroNote").textContent = L(M.persona.line);
    $("#footTitle").innerHTML = M.footer.title.map(line => `<span>${esc(L(line))}</span>`).join(" ");
    $("#footContact").innerHTML = M.contact.map((c) =>
      `<li><span class="mono">${esc(L(c.label))}</span><a href="${c.href}"${c.id === "x" ? ' target="_blank" rel="noopener"' : ""}>${esc(c.text)}</a></li>`).join("");
  }
  /* ------------------------------------------------------------------ 03 Design Work: case studies from MANIFEST.work (r13) */
  // Head: capabilities + method. Body: a sticky index (01–05) and one article per case in a single grid template.
  // r14B: every case starts folded: tag, title, summary and a cropped lead screen. The title is the toggle
  // (h3 > button, aria-expanded / aria-controls); it opens two regions labelled by the heading: the text
  // (problem, moves, outcome) under the summary, and the screens (caption, smaller screens) under the lead.
  // Folded regions are visibility:hidden, so their images stay lazy until a case opens.
  const smOf = (src) => src.replace(/\.webp$/, "-sm.webp");
  function shot(im, lead) {
    const smW = Math.round(Math.min(im.w, lead || im.h <= im.w ? 720 : 560));
    return `<img src="${im.src}" srcset="${smOf(im.src)} ${smW}w, ${im.src} ${im.w}w"
          sizes="${lead ? "(max-width: 760px) 100vw, 56vw" : "(max-width: 760px) 80vw, 28vw"}"
          width="${im.w}" height="${im.h}" loading="lazy" decoding="async" alt="${esc(L(im.alt))}">`;
  }
  const cap = (c, im, k) => `<b>${pad(c)}.${k + 1}</b>${esc(L(im.caption))}`;
  function figure(c, im, k) {
    return `<figure class="wfig"><div class="wfig-frame">${shot(im, false)}</div><figcaption class="mono">${cap(c, im, k)}</figcaption></figure>`;
  }
  function renderWork() {
    const W = M.work, n = W.cases.length;
    $("#workCaps").innerHTML = W.capabilities.map((c, i) =>
      `<li class="cap cap-${c.id}" style="--i:${i}"><b class="mono">${pad(i + 1)}</b><span><strong>${esc(L(c.title))}</strong><em class="mono">${L(c.tags).map(esc).join(" · ")}</em></span></li>`).join("");
    $("#workMethod").innerHTML =
      `<p class="wk-sec mono">${esc(L(W.methodNote))}</p><ol class="wk-method mono">${L(W.method).map((m, i) => `<li style="--i:${i}"><b>${pad(i + 1)}</b>${esc(m)}</li>`).join("")}</ol>`;
    $("#workIndex").setAttribute("aria-label", T("案例索引", "Cases"));
    $("#workIndex").innerHTML = `<ol>${W.cases.map((c, i) =>
      `<li><a href="#case-${c.id}" class="case-${c.id}" data-i="${i}"><b>${pad(i + 1)}</b><span>${esc(L(c.title))}</span></a></li>`).join("")}</ol>`;
    $("#workCases").innerHTML = W.cases.map((c, i) => {
      const [lead, ...rest] = c.images, id = c.id, open = wkOpen.has(id);
      return `<article class="wcase case-${id}${open ? " is-open" : ""}" id="case-${id}" data-i="${i}" aria-labelledby="case-h-${id}">
        <div class="wcase-text" data-preset="reveal-up">
          <p class="case-tag mono"><span>${pad(i + 1)} / ${pad(n)}</span>${esc(L(c.domain))}</p>
          <h3 class="case-h" id="case-h-${id}"><button class="case-btn" type="button" id="case-b-${id}" aria-expanded="${open}" aria-controls="case-dt-${id} case-dm-${id}">${esc(L(c.title))}<i class="case-pm" aria-hidden="true"></i></button></h3>
          <p class="case-sum">${esc(L(c.summary))}</p>
          <span class="case-more mono" aria-hidden="true"><span class="cm-o">${T("展开：问题、做法、结果", "Open: problem, moves, outcome")}</span><span class="cm-c">${T("收起", "Fold")}</span><i class="case-pm"></i></span>
          <div class="case-fold" id="case-dt-${id}" role="region" aria-labelledby="case-h-${id}"><div class="case-fold-in">
            <dl class="case-pmr">
              <dt class="mono">${T("问题", "The problem")}</dt><dd>${esc(L(c.problem))}</dd>
              <dt class="mono">${T("我的做法", "What I did")}</dt><dd><ol class="case-dec">${c.decisions.map((d) => `<li>${esc(L(d))}</li>`).join("")}</ol></dd>
              <dt class="mono">${T("结果", "Outcome")}</dt><dd>${esc(L(c.result))}</dd>
            </dl>
          </div></div>
        </div>
        <div class="wcase-media" data-preset="reveal-up">
          <div class="wfig wfig-lead"><div class="wfig-frame">${shot(lead, true)}</div></div>
          <div class="case-fold" id="case-dm-${id}" role="region" aria-labelledby="case-h-${id} case-sl-${id}"><div class="case-fold-in">
            <span class="sr-only" id="case-sl-${id}">${T("界面图", "Screens")}</span>
            <p class="wfig-cap mono">${cap(i + 1, lead, 0)}</p>
            <div class="wfig-row${rest.length === 1 ? " is-one" : ""}">${rest.map((im, k) => figure(i + 1, im, k + 1)).join("")}</div>
          </div></div>
        </div>
      </article>`;
    }).join("");
    // re-rendered on every language switch: the new blocks join the reveal observer (the ones in view reveal at once)
    // r14: cases reveal as soon as any part is on screen (the shared -12% margin left the first case blank under the index)
    $$("#workCases [data-preset]").forEach((el) => caseIO.observe(el));
    wkActive = -1;
  }
  let wkActive = -1;
  const wkOpen = new Set();   // open cases survive a language switch
  function setCase(el, open) {
    if (!el || el.classList.contains("is-open") === open) return;
    el.classList.toggle("is-open", open);
    $(".case-btn", el).setAttribute("aria-expanded", String(open));
    if (open) wkOpen.add(el.id.slice(5)); else wkOpen.delete(el.id.slice(5));
    sfx.play(open ? "expand" : "collapse");
  }
  // the title button toggles; the "open" line and the lead screen are larger mouse / touch targets for the same thing
  $("#workCases").addEventListener("click", (e) => {
    const t = e.target.closest(".case-btn, .case-more, .wfig-lead");
    if (!t) return;
    const el = t.closest(".wcase");
    if (t.classList.contains("wfig-lead") && el.classList.contains("is-open")) return;
    setCase(el, !el.classList.contains("is-open"));
  });
  // index: scroll to the case and open it
  $("#workIndex").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-i]"); if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.getAttribute("href").slice(1));
    setCase(el, true);
    const top = el.getBoundingClientRect().top + scrollY - ($(".topbar").offsetHeight + $("#workIndex").offsetHeight) + 1;
    window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  });

  function sizeStages() {
    order.forEach((p) => {
      const st = $(`[data-stage="${p.key}"]`);
      if (st) st.style.height = isMobile() || p.stageHeightVh == null ? "" : p.stageHeightVh + "vh";
    });
  }

  /* ------------------------------------------------------------------ presets (IO → .is-in) */
  const presetIO = new IntersectionObserver((ens) => {
    ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); presetIO.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
  const caseIO = new IntersectionObserver((ens) => {
    ens.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); caseIO.unobserve(en.target); } });
  }, { threshold: 0 });
  $$(".chapter .slots").forEach((sl) => {
    let i = 0;
    $$(":scope > .slot-tagline, :scope > .slot-blurb, :scope > .slot-row", sl).forEach((el) => { el.dataset.preset = "reveal-up"; el.style.setProperty("--i", ++i); });
  });
  $$("[data-preset]").forEach((el, i) => presetIO.observe(el));

  /* ------------------------------------------------------------------ sound (r14C): background music + effects */
  // Files: assets/audio (scripts/audio_prep.sh; .m4a for Safari / iOS, .webm Opus where AAC is missing).
  // On by default and remembered. On load an AudioContext is created; if the browser keeps it suspended (no user
  // activation yet), it waits quietly — no hint (r16) — and the visitor's first interaction of any kind
  // (scroll, wheel, touch, click, key) tries to resume it. Nothing is downloaded until the context runs; the music loop
  // (~0.7–0.9 MB) only then. Music plays far below the effects, fades in / out, and pauses while the tab is hidden.
  let soundOn = store.get("ailiu.sound") !== "off";
  const sfx = mod(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return { play() {}, set() {}, blocked: () => false };
    const probe = document.createElement("audio");
    const ext = probe.canPlayType('audio/mp4; codecs="mp4a.40.2"') === "probably" || !probe.canPlayType('audio/webm; codecs="opus"') ? "m4a" : "webm";
    const VOL = { click: 0.45, whoosh: 0.28, expand: 0.5, collapse: 0.5 }, BG = 0.14;
    let ctx = null, master = null, bgGain = null, bgSrc = null, bgBuf = null, loading = {}, bufs = {}, lastWhoosh = 0;
    const load = (name) => loading[name] || (loading[name] = fetch(`assets/audio/${name}.${ext}`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((a) => new Promise((ok, no) => ctx.decodeAudioData(a, ok, no)))
      .then((b) => (bufs[name] = b)).catch(() => null));
    function init() {
      if (ctx) return;
      ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      bgGain = ctx.createGain(); bgGain.gain.value = 0; bgGain.connect(master);
    }
    const running = () => ctx && ctx.state === "running";
    function startBg() {
      if (!running() || !soundOn || document.hidden) return;
      ["click", "whoosh", "expand", "collapse"].forEach(load);
      load("bg-loop").then((b) => {
        if (!b || !running() || !soundOn || document.hidden) return;
        if (!bgSrc) { bgSrc = ctx.createBufferSource(); bgSrc.buffer = b; bgSrc.loop = true; bgSrc.connect(bgGain); bgSrc.start(); }
        const t = ctx.currentTime; bgGain.gain.cancelScheduledValues(t); bgGain.gain.setValueAtTime(bgGain.gain.value, t); bgGain.gain.linearRampToValueAtTime(BG, t + 2.5);
      });
    }
    function stopBg(then) {
      if (!ctx) return;
      const t = ctx.currentTime; bgGain.gain.cancelScheduledValues(t); bgGain.gain.setValueAtTime(bgGain.gain.value, t); bgGain.gain.linearRampToValueAtTime(0, t + 0.5);
      if (then) setTimeout(then, 520);
    }
    function sync() {
      document.documentElement.dataset.sound = !soundOn ? "off" : running() ? "on" : "blocked";
    }
    function unlock() {
      if (!soundOn) return;
      init();
      const p = ctx.resume(); (p && p.then ? p : Promise.resolve()).then(() => { sync(); startBg(); }, sync);
    }
    // r16: any first interaction tries to resume. Browsers only grant activation on pointer / click / key / touchend,
    // so scroll and wheel are attempts that succeed where the browser allows it; the rest wait for the next gesture.
    // Listeners drop off once the context is running.
    const GEST = ["pointerdown", "pointerup", "click", "keydown", "touchstart", "touchend", "wheel", "scroll"];
    function onGesture() { unlock(); if (running()) GEST.forEach((ev) => removeEventListener(ev, onGesture, true)); }
    GEST.forEach((ev) => addEventListener(ev, onGesture, { capture: true, passive: true }));
    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      if (document.hidden) stopBg(() => { if (document.hidden) ctx.suspend(); });
      else if (soundOn) ctx.resume().then(startBg, () => {});
    });
    if (soundOn) { init(); if (running()) startBg(); else unlock(); } // try to play on load; stay quiet if blocked
    setTimeout(sync, 0); if (ctx && ctx.addEventListener) ctx.addEventListener("statechange", sync);
    return {
      play(name) {
        if (!soundOn || !running()) return;
        if (name === "whoosh") { const now = performance.now(); if (now - lastWhoosh < 1800) return; lastWhoosh = now; }
        const b = bufs[name]; if (!b) { load(name); return; }
        const src = ctx.createBufferSource(), g = ctx.createGain();
        g.gain.value = VOL[name] || 0.4; src.buffer = b; src.connect(g); g.connect(master); src.start();
      },
      set(on) { if (on) { init(); unlock(); } else stopBg(() => { if (!soundOn && ctx) ctx.suspend(); }); sync(); },
      ext
    };
  }, { play() {}, set() {} });
  // Draft row: 草稿 chip, AI tag, note, then every link that isn't the CTA. Only state "ok" becomes an <a>.
  const LINK_TAG = { confirm: ["待确认", "to confirm"], tbd: ["待补", "TBD"] };
  function renderDraftRow(p, sec) {
    let row = $(".draft-row", sec);
    if (!row) {
      row = document.createElement("div");
      row.className = "draft-row mono";
      const anchor = $(".slots .slot-row", sec) || $("[data-slot=blurb]", sec);
      anchor.insertAdjacentElement("afterend", row);
    }
    const d = p.draft || {};
    const links = V(p, "links") || [];
    const cta = links.find((x) => x.href && (!x.state || x.state === "ok"));
    const items = links.filter((x) => x !== cta).map((x) => {
      if (x.state === "ok" && x.href && x.download) return `<a class="dr-link dr-dl" href="${x.href}" download>${esc(L(x.label))}</a>`;
      if (x.state === "ok" && x.href) return `<a class="dr-link" href="${x.href}" target="_blank" rel="noopener">${esc(L(x.label))}</a>`;
      if (x.state === "text") return `<span class="dr-text">${esc(L(x.label))}</span>`;
      const t = LINK_TAG[x.state] || LINK_TAG.tbd;
      return `<span class="dr-ph" aria-disabled="true">${esc(L(x.label))} <em>${T(t[0], t[1])}</em></span>`;
    });
    const ai = p.aiGenerated && p.key !== "wild-louis" ? `<span class="dr-ai">${esc(L(p.disclosure))}</span>` : "";
    const soc = d.socials ? `<ul class="dr-soc" aria-label="${T("社交平台", "Social platforms")}">` + d.socials.map((x) => {
      const icon = `<i class="platform-icon platform-icon--${x.id}" aria-hidden="true"></i>`;
      const label = `${icon}<span>${esc(L(x.label))}</span>`;
      if (x.state === "ok" && x.href) return `<li class="has-link"><a href="${x.href}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
      const tag = x.state === "text" ? "" : `<em>${T(...(LINK_TAG[x.state] || LINK_TAG.tbd))}</em>`;
      return `<li${x.state === "text" ? ' class="is-text"' : ' aria-disabled="true"'}>${label}${tag}</li>`;
    }).join("") + "</ul>" : "";
    row.innerHTML = ai + items.join("") +
      (d.note ? `<p class="dr-note">${esc(L(d.note))}</p>` : "") + soc;
    row.hidden = !row.innerHTML.trim();
  }

  function renderSound() {
    const b = $("#soundBtn");
    b.setAttribute("aria-pressed", String(soundOn));
    $(".sound-label", b).textContent = lang === "zh" ? (soundOn ? "声音 开" : "声音 关") : (soundOn ? "Sound on" : "Sound off");
    b.title = T("背景音乐和音效", "Background music and sound effects");
  }
  $("#soundBtn").addEventListener("click", () => {
    soundOn = !soundOn;
    store.set("ailiu.sound", soundOn ? "on" : "off");
    sfx.set(soundOn);
    renderSound();
  });
  // effects: a click for links and buttons (case toggles have their own expand / collapse sound)
  document.addEventListener("click", (e) => {
    const t = e.target.closest("a, button, summary");
    if (t && !t.closest(".case-btn, .case-more, .wfig-lead, #soundBtn")) sfx.play("click");
  });

  /* ------------------------------------------------------------------ Louis instances */
  // r12: a portrait that can't start leaves its static fallback (CSS) and a no-op stand-in; the page carries on
  // r17: the caption bar (and its mini portrait) is gone. r26: neither portrait rides the field's wave; only the mouse turns them
  const mountLouis = (opts, el) => {
    if (document.documentElement.dataset.portraitReview === "off") return { live: false, setState() {}, dock() {}, destroy() {} };
    try { return new Louis(opts).mount(el); }
    catch (e) { el.classList.add("is-fallback"); return { setState() {}, dock() {}, destroy() {} }; }
  };
  // Real 3D Louis geometry, with directional line lighting and pointer-driven rotation.
  const louisHero = mountLouis({}, $("#louisHero"));
  mountLouis({}, $("#louisWild"));

  /* ------------------------------------------------------------------ active chapter, glitch-cut */
  let active = null;
  const glitched = new Set();
  function setActive(key, silent) {
    active = key;
    $$("#chapnav a").forEach((a) => a.setAttribute("aria-current", String(a.dataset.key === key)));
    placeNavInd();
    document.body.classList.toggle("is-wild", key === "wild-louis");
    if (key && !silent) sfx.play("whoosh");   // throttled inside (≥1.8 s), so a fast scroll doesn't stack them
    if (silent || !key || glitched.has(key) || reduced) return;
    glitched.add(key);
    const sec = document.getElementById(key);
    const cut = $(".cut", sec), title = $("header.slots .slot-title", sec);
    if (!cut) return;
    cut.classList.remove("go"); void cut.offsetWidth; cut.classList.add("go");
    if (title) { title.classList.add("glitching"); setTimeout(() => title.classList.remove("glitching"), 200); }
  }
  // one indicator pill that slides between chapters instead of a background that jumps (r6)
  function placeNavInd() {
    const ind = $("#chapnav .nav-ind"), a = active && $(`#chapnav a[data-key="${active}"]`);
    if (!ind) return;
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.transform = `translateX(${a.parentElement.offsetLeft}px)`;
    ind.style.width = a.offsetWidth + "px";
  }
  function checkChapters() {
    const vh = innerHeight;
    let best = null, bestCov = 0;
    order.forEach((p) => {
      const r = document.getElementById(p.key).getBoundingClientRect();
      const cov = clamp((Math.min(vh, r.bottom) - Math.max(0, r.top)) / vh);
      if (cov > bestCov) { bestCov = cov; best = p.key; }
    });
    const heroR = $("#top").getBoundingClientRect();
    const heroCov = clamp((Math.min(vh, heroR.bottom) - Math.max(0, heroR.top)) / vh);
    const k = heroCov > bestCov || bestCov < 0.3 ? null : best;
    if (k !== active) setActive(k);
    // r17: the hero fills the first screen down to its bottom edge, so the reel band steps aside until it scrolls away
    document.body.classList.toggle("at-hero", heroR.bottom > vh - 40);
  }

  /* ------------------------------------------------------------------ per-stage progress */
  function progressOf(key) {
    const st = $(`[data-stage="${key}"]`);
    const r = st.getBoundingClientRect();
    const span = r.height - st.firstElementChild.offsetHeight; // pin is shorter than the viewport (letterbox, r6)
    return span > 0 ? clamp(-r.top / span) : (r.top < innerHeight ? 1 : 0);
  }
  // reel progress spans the whole chapter (Design Work's body scrolls on past its pinned stage)
  function chapterProgress(key) {
    const st = $(`[data-stage="${key}"]`), r = document.getElementById(key).getBoundingClientRect();
    const span = r.height - st.firstElementChild.offsetHeight;
    return span > 0 ? clamp(-r.top / span) : (r.top < innerHeight ? 1 : 0);
  }

  /* ---- 01 Aviso */
  const avWin = $("#avWin"), avHl = $("#avHl");
  let avLines = [];
  function measureAviso() {
    const mark = $("#avMark");
    const prev = avWin.style.transform;
    avWin.style.transform = "none";
    const wr = avWin.getBoundingClientRect();
    const rects = Array.from(mark.getClientRects());
    avWin.style.transform = prev;
    // multi-line selection: each line box sweeps in turn, the way a drag paints it
    const n = rects.length;
    avLines = rects.map((r) => [r.left - wr.left, r.right - wr.left, r.top - wr.top + r.height * 0.5]);
    avHl.innerHTML = rects.map((r, i) =>
      `<span class="av-hl-box" style="--hl-x:${r.left - wr.left - 2}px;--hl-y:${r.top - wr.top - 1}px;--hl-w:${r.width + 4}px;--hl-h:${r.height + 2}px;--k0:${(i / n).toFixed(3)};--kn:${n}"></span>`).join("") +
      `<span class="av-cursor"></span>`;
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
    const u = unit();
    s.setProperty("--tz", (-140 * u * (1 - rise)).toFixed(1) + "px");
    s.setProperty("--zh", (60 * u * e).toFixed(1) + "px");
    s.setProperty("--zp", (140 * u * e).toFixed(1) + "px");
    s.setProperty("--tag", e.toFixed(3));
    const sel = sstep(0.06, 0.18, p);
    s.setProperty("--sel", sel.toFixed(3));
    // the pointer that paints the selection, line by line, then leaves as the panel arrives
    if (avLines.length) {
      const n = avLines.length, f = Math.min(n - 0.0001, sel * n), i = Math.floor(f), t = f - i, [x0, x1, y] = avLines[i];
      s.setProperty("--cx", (x0 + (x1 - x0) * t).toFixed(1) + "px");
      s.setProperty("--cy", y.toFixed(1) + "px");
    }
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
    const u = unit(), leftLimit = slots.offsetLeft + slots.offsetWidth + 24 * u;
    const spread = Math.max(40 * u, Math.min(sw * 0.8, (cx - leftLimit - sw * 0.62) / 2, (W - 24 * u - cx - sw * 0.62) / 2));
    const drop = H * 0.5 + sw * 0.75;
    let printing = 0;
    sheets.forEach((sh, i) => {
      const pr = sstep(i * 0.05, i * 0.05 + 0.11, p);
      if (pr > 0 && pr < 1) printing = 1;
      const f = sstep(0.3, 0.58, p);
      const pos = fanPos[i];
      const jit = (i % 2 ? 1 : -1) * 1.2;
      sh.style.setProperty("--x", (pos * spread * f).toFixed(1) + "px");
      sh.style.setProperty("--y", ((1 - pr) * -drop + pos * pos * 9 * u * f).toFixed(1) + "px");
      sh.style.setProperty("--r", (pos * 4.6 * f + jit * (1 - f * 0.5)).toFixed(2) + "deg");
    });
    const fold = 18 * (1 - sstep(0.56, 0.76, p));
    const c = $(".sh-cards"); c.style.setProperty("--fold", fold.toFixed(2) + "deg"); c.style.setProperty("--foldk", (fold / 18).toFixed(3));
    desk.style.setProperty("--printing", printing);
  }

  /* ---- 03 Design Work (r13): the sticky index follows the case in view; lead screens drift a few px (parallax) */
  const wkIdx = $("#workIndex");
  // r17B: the index docks at the top bar's measured height (every breakpoint), and marks itself while docked
  let topbarH = $(".topbar").getBoundingClientRect().height;
  const setTopbarH = () => { topbarH = $(".topbar").getBoundingClientRect().height; document.documentElement.style.setProperty("--topbar-h", topbarH + "px"); };
  setTopbarH();
  if ("ResizeObserver" in window) new ResizeObserver(setTopbarH).observe($(".topbar"));
  function workStage() {
    wkIdx.classList.toggle("is-stuck", Math.abs(wkIdx.getBoundingClientRect().top - topbarH) < 1);
    const cases = $$("#workCases .wcase"), mid = innerHeight * 0.42;
    let on = 0;
    cases.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top < mid) on = i;
      if (!reduced && !isMobile()) {
        const img = el.querySelector(".wfig-lead img");
        if (img && r.bottom > 0 && r.top < innerHeight) img.style.setProperty("--py", (clamp((innerHeight / 2 - (r.top + r.height / 2)) / innerHeight, -1, 1) * 14).toFixed(1) + "px");
      }
    });
    if (on !== wkActive) {
      wkActive = on;
      $$("a", wkIdx).forEach((a, k) => { a.classList.toggle("is-on", k === on); a.classList.toggle("is-done", k < on); if (k === on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      // phones: keep the active entry in view inside the horizontally scrolling index
      const a = $$("a", wkIdx)[on], ol = $("ol", wkIdx);
      if (a && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.offsetLeft - 20, behavior: reduced ? "auto" : "smooth" });
    }
  }
  /* ---- 04 Steam */
  const stPin = $("#steam .pin"), stRange = $("#stRange");
  let stTouched = false;
  const needle = { x: 0, v: 0, t: 0 };
  stRange.addEventListener("input", () => { stTouched = true; });
  mod(function ticks() {
    const g = $("#gTicks"); let h = "";
    for (let i = 0; i <= 40; i++) {
      const a = (-135 + (270 * i) / 40) * Math.PI / 180, maj = i % 5 === 0;
      const r1 = maj ? 70 : 74, r2 = 80;
      h += `<line class="${maj ? "maj" : ""}" x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}"/>`;
    }
    g.innerHTML = h;
  });
  function steam(p) {
    const grow = isMobile() || reduced ? 1 : sstep(0, 0.3, p);
    let front = isMobile() || reduced ? 1 : sstep(0.32, 0.8, p);
    if (stTouched) front = stRange.value / 100; else stRange.value = Math.round(front * 100);
    stPin.style.setProperty("--grow", grow.toFixed(3));
    stPin.style.setProperty("--front", front.toFixed(3));
    // gauge needle rides a lightly under-damped spring toward the front, so it has mass (r6)
    const now = performance.now(), dt = Math.min(0.05, (now - needle.t) / 1000 || 0); needle.t = now;
    if (isMobile() || reduced || dt === 0) { needle.x = front; needle.v = 0; }
    else { const k = 90, c = 11; needle.v += (k * (front - needle.x) - c * needle.v) * dt; needle.x += needle.v * dt; }
    stPin.style.setProperty("--needle", clamp(needle.x, -0.02, 1.02).toFixed(4));
    stPin.style.setProperty("--flow", reduced ? 0 : (-(now / 9000) - p * 0.8).toFixed(4));
    const rads = $$(".st-rad", stPin);
    rads[0].style.setProperty("--heat", sstep(0.5, 0.62, front).toFixed(3));
    rads[1].style.setProperty("--heat", sstep(0.8, 0.92, front).toFixed(3));
    const closed = front > 0.985 ? 1 : 0;
    stPin.style.setProperty("--closed", closed);
    const vs = $("#stVentState");
    vs.textContent = closed ? (lang === "zh" ? "蒸汽到达 · 关闭" : "STEAM HERE · CLOSED") : (lang === "zh" ? "排空气中" : "AIR OUT");
  }

  /* ---- 05 Suikou */
  // r21: one phone; the three prototype screens take turns (~4s each, paused on hover / focus, never on its own under
  // reduced motion), arrows / dots / pause button below; the phone itself tilts in and settles as before r20.
  // r22: no flashes, no misplaced frames — all three screens are fetched and decoded as the chapter approaches and a
  // switch waits for the incoming image to be decoded; the incoming screen fades in *over* the outgoing one, which stays
  // opaque underneath until the fade is done (a plain cross-fade dipped to ~50% and let the bezel show through);
  // rotation only starts once the phone is mostly on screen and its rise-in has settled, and the first turn comes a
  // full interval after that (re-armed on every entry).
  const skCar = $("#skCar"), skPhone = $("#skPhone"), skWrap = $("#suikou .sk-phone-wrap"), skShots = $$("#skTrack .sk-shot"), skCaps = $$("#skCaps .sk-cap"), skDots = $$("#skCar .sk-dot"), skPlay = $("#skPlay");
  const skImgs = skShots.map((el) => $("img", el));
  let skI = 0, skTimer = 0, skHold = false, skStopped = reduced, skSeen = false, skSettled = reduced, skPrevT = 0, skWant = -1;
  const SK_MS = 4000, SK_FADE = 280;
  const skReady = skImgs.map(() => null);
  function skLoad(j) {                      // fetch + decode once; resolves even on failure so the carousel never stalls
    if (!skReady[j]) {
      const im = skImgs[j]; im.loading = "eager";
      skReady[j] = (im.complete && im.naturalWidth ? Promise.resolve() : new Promise((r) => { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); }))
        .then(() => (im.decode ? im.decode().catch(() => {}) : 0));
    }
    return skReady[j];
  }
  const skLoadAll = () => skImgs.forEach((_, j) => skLoad(j));
  function skApply(i) {
    const was = skI;
    skI = i;
    clearTimeout(skPrevT);
    skShots.forEach((el, j) => {
      el.classList.toggle("is-on", j === skI);
      el.classList.toggle("is-prev", j === was && j !== skI && !reduced);   // stays opaque under the incoming screen
      el.setAttribute("aria-hidden", j === skI ? "false" : "true");
      el.tabIndex = j === skI ? 0 : -1;
      if (j === skI) el.scrollTop = 0;
    });
    if (!reduced) skPrevT = setTimeout(() => skShots.forEach((el) => el.classList.remove("is-prev")), SK_FADE + 40);
    skCaps.forEach((el, j) => el.classList.toggle("is-on", j === skI));
    skDots.forEach((el, j) => (j === skI ? el.setAttribute("aria-current", "true") : el.removeAttribute("aria-current")));
  }
  function skShow(i) {
    i = (i + skShots.length) % skShots.length;
    if (i === skI) return Promise.resolve();
    skWant = i;
    return skLoad(i).then(() => { if (skWant === i) { skWant = -1; skApply(i); } });   // a later pick wins
  }
  function skArm() {
    clearTimeout(skTimer); skTimer = 0;
    if (!skStopped && !skHold && skSeen && skSettled && !document.hidden)
      skTimer = setTimeout(() => skShow(skI + 1).then(skArm), SK_MS);
  }
  function skSync() {
    skArm();
    $("#skCaps").setAttribute("aria-live", skStopped ? "polite" : "off");
    skPlay.dataset.labelEn = skStopped ? "Start automatic rotation" : "Pause automatic rotation";
    skPlay.dataset.labelZh = skStopped ? "开始自动轮播" : "暂停自动轮播";
    skPlay.setAttribute("aria-label", lang === "zh" ? skPlay.dataset.labelZh : skPlay.dataset.labelEn);
    skPlay.firstElementChild.textContent = skStopped ? "▶" : "❙❙";
  }
  // a click on an arrow or dot is a choice: rotation stops there until the pause button starts it again
  const skPick = (i) => { skStopped = true; skSync(); skShow(i); };
  $("#skPrev").addEventListener("click", () => skPick(skI - 1));
  $("#skNext").addEventListener("click", () => skPick(skI + 1));
  skDots.forEach((d, j) => d.addEventListener("click", () => skPick(j)));
  skPlay.addEventListener("click", () => { skStopped = !skStopped; skSync(); if (!skStopped) skShow(skI + 1).then(skArm); });
  skCar.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); skPick(skI + (e.key === "ArrowLeft" ? -1 : 1)); } });
  skCar.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { skHold = true; skSync(); } });
  skCar.addEventListener("pointerleave", () => { if (!skCar.contains(document.activeElement)) { skHold = false; skSync(); } });
  skCar.addEventListener("focusin", () => { skHold = true; skSync(); });
  skCar.addEventListener("focusout", (e) => { if (!skCar.contains(e.relatedTarget) && !skCar.matches(":hover")) { skHold = false; skSync(); } });
  document.addEventListener("visibilitychange", skSync);
  // fetch + decode a screen ahead of the chapter; count the rise-in (depth-rise preset) as settled once its transform is done
  new IntersectionObserver((es) => { if (es[0].isIntersecting) skLoadAll(); }, { rootMargin: "100% 0px" }).observe(skCar);
  const skSettle = () => { if (!skSettled) { skSettled = true; skSync(); } };
  skWrap.addEventListener("transitionend", (e) => { if (e.target === skWrap && e.propertyName === "transform") skSettle(); });
  new MutationObserver(() => { if (skWrap.classList.contains("is-in")) setTimeout(skSettle, 1200); }).observe(skWrap, { attributes: true, attributeFilter: ["class"] });
  if (!skWrap.hasAttribute("data-preset")) skSettled = true;
  new IntersectionObserver((es) => { skSeen = es[0].intersectionRatio >= 0.55; skSync(); }, { threshold: [0, 0.55, 1] }).observe(skPhone);
  // Reading inside the screen pauses rotation; the existing play control resumes it.
  skShots.forEach((shot) => {
    const stopForReading = () => { if (!skStopped) { skStopped = true; skSync(); } };
    shot.addEventListener("pointerdown", stopForReading);
    shot.addEventListener("scroll", () => { if (shot.scrollTop > 0) stopForReading(); }, { passive: true });
  });
  skSync();
  function suikou(p) {
    const pin = $("#suikou .pin");
    pin.style.setProperty("--ring", p.toFixed(3));
    if (isMobile() || reduced) return;
    const r = sstep(0, 0.2, p);
    skPhone.style.setProperty("--prx", (10 * (1 - r)).toFixed(2) + "deg");
    skPhone.style.setProperty("--pry", (-14 * (1 - r) + 4 * Math.sin(p * Math.PI)).toFixed(2) + "deg");
  }

  /* ---- 07 Xiaoyi */
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
  // One card per completed episode; covers, previews and full videos share one record.
  const ttEscape = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  $("#ttWall").innerHTML = byKey.taotao.episodes.map((e, i) => {
    const ready = !!(e.href && e.preview), tag = ready ? "a" : "div";
    const action = ready ? `href="${ttEscape(e.href)}" target="_blank" rel="noopener noreferrer"` : '';
    const label = ready ? { zh: "在 YouTube 观看完整版（新窗口）", en: "Watch on YouTube (new tab)" } : e.status;
    return `<${tag} class="tt-cell c${i + 1}${ready ? "" : " is-upcoming"}" ${action}
      data-label-zh="${ttEscape(e.title.zh)} · ${ttEscape(label.zh)}" data-label-en="${ttEscape(e.title.en)} · ${ttEscape(label.en)}">
      <div class="tt-media"><img src="${ttEscape(e.poster)}" alt="" width="800" height="450" loading="lazy" decoding="async">
        ${ready ? `<video data-src="${ttEscape(e.preview)}" muted playsinline loop preload="none" aria-hidden="true"></video>` : ''}</div>
      <span class="tt-caption">${ready ? '<b aria-hidden="true">↗</b>' : ''}<span data-zh="${ttEscape(e.title.zh)}" data-en="${ttEscape(e.title.en)}">${ttEscape(e.title.en)}</span>
        ${ready ? `<em>${ttEscape(e.duration)}</em>` : `<em data-zh="${ttEscape(e.status.zh)}" data-en="${ttEscape(e.status.en)}">${ttEscape(e.status.en)}</em>`}</span>
    </${tag}>`;
  }).join("");
  const ttCells = $$("#ttWall .tt-cell");
  function setTTPlaying(playing) {
    ttCells.forEach((c) => {
      const v = $("video", c);
      if (!v) return;
      const on = playing.includes(c) && !document.hidden;
      c.classList.toggle("is-playing", on);
      if (on && !v.dataset.failed) {
        if (!v.getAttribute("src")) v.src = v.dataset.src;
        if (v.paused && !v.dataset.starting) {
          v.dataset.starting = "1";
          v.play().catch(() => { v.dataset.failed = "1"; c.classList.remove("has-preview"); }).finally(() => { delete v.dataset.starting; });
        }
      } else { v.pause(); }
    });
  }
  ttCells.forEach((c) => {
    const v = $("video", c);
    if (!v) return;
    v.addEventListener("playing", () => c.classList.add("has-preview"));
    v.addEventListener("pause", () => c.classList.remove("has-preview"));
    v.addEventListener("error", () => { v.dataset.failed = "1"; c.classList.remove("has-preview"); });
  });
  new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setTTPlaying([]); }).observe($("#ttWall"));
  document.addEventListener("visibilitychange", () => { if (document.hidden) setTTPlaying([]); });
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
    const vis = ttCells.filter((c) => c.offsetParent !== null && $("video", c));
    const mid = innerHeight / 2, midX = innerWidth / 2;
    const ranked = vis.map((c) => { const r = c.getBoundingClientRect(); return [c, Math.hypot(r.left + r.width / 2 - midX, (r.top + r.height / 2 - mid) * 1.6), r]; })
      .filter(([, , r]) => r.bottom > 0 && r.top < innerHeight)
      .sort((a, b) => a[1] - b[1]).map(([c]) => c);
    let playing = (reduced || saveData) ? [] : ranked.slice(0, limit);
    // desktop: the two playing cells walk the wall (snake order) as the stage scrolls, so every clip gets a turn
    if (!isMobile() && !reduced && !saveData && ranked.length) {
      const playable = ttCells.filter((c) => $("video", c));
      const k = Math.max(0, Math.min(playable.length - 2, Math.floor(clamp((p - 0.22) / 0.7) * (playable.length - 1))));
      playing = playable.slice(k, k + limit);
    }
    if (ttHover && ranked.includes(ttHover) && !reduced && !saveData) playing = [ttHover].concat(playing.filter((c) => c !== ttHover)).slice(0, limit);
    setTTPlaying(playing.filter((c) => ranked.includes(c)));
  }

  /* ---- 08 Wild Louis: the portrait grows in as the chapter arrives (r14: source / runtime / log panels removed) */
  const wlPin = $("#wild-louis .pin");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  function wild(p) {
    wlPin.style.setProperty("--grow", isMobile() || reduced ? 1 : sstep(0, 0.36, p).toFixed(3));
    document.documentElement.dataset.portrait = document.documentElement.dataset.portraitReview === "off" ? "pending" : louisHero.live ? "webgl-3d" : "fallback";
  }

  /* Footer: a layered contour ribbon with travelling highlights and local pointer response.
     Visual references: Three.js points/waves and ocean examples; native Canvas, no added library. */
  const voice = mod(() => {
    const c = $("#voiceprint"), ctx = c && c.getContext("2d");
    if (!ctx) return { tick() {} };
    let w = 0, h = 0, on = false, last = 0, phase = 0, activePointer = false;
    let px = .5, py = .5, targetX = .5, targetY = .5, influence = 0;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    new IntersectionObserver(([e]) => { on = e.isIntersecting; last = 0; }).observe(c);
    c.addEventListener('pointermove', e => {
      const r=c.getBoundingClientRect(); targetX=(e.clientX-r.left)/r.width; targetY=(e.clientY-r.top)/r.height; activePointer=true;
    }, { passive:true });
    c.addEventListener('pointerleave',()=>{activePointer=false;});
    function point(u,v) {
      const env = Math.sin(Math.PI*u)**1.2;
      const swell = Math.sin(u*8.2-phase*.58+v*.75)*.17;
      const crossing = Math.sin(u*14.5+phase*.34-v*1.65)*.055;
      const twist = v*Math.cos(u*7.4-phase*.3)*.23;
      const hover = influence*Math.exp(-((u-px)**2)/.013)*(py-.5)*.36;
      return [w*(.035+.93*u), h*(.5+env*(swell+crossing+twist+hover))];
    }
    function draw() {
      ctx.clearRect(0,0,w,h);
      const rows=w<600?15:23, cols=w<600?90:150;
      for(let j=0;j<rows;j++) {
        const v=j/(rows-1)*2-1,alpha=.10+.22*(1-Math.abs(v));
        const grad=ctx.createLinearGradient(0,0,w,0);
        grad.addColorStop(0,'rgba(224,230,235,0)');
        grad.addColorStop(.2,`rgba(224,230,235,${alpha})`);
        grad.addColorStop(.7,`rgba(224,230,235,${alpha*.85})`);
        grad.addColorStop(1,'rgba(224,230,235,0)');
        ctx.strokeStyle=grad;ctx.lineWidth=j%5===0?.85:.55;ctx.beginPath();
        for(let i=0;i<=cols;i++){const [x,y]=point(i/cols,v);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
      }
      // Intermittent transverse threads reveal the ribbon's changing depth.
      ctx.strokeStyle='rgba(210,220,230,.065)';ctx.lineWidth=.5;
      for(let i=1;i<36;i++){ctx.beginPath();for(let j=0;j<=16;j++){const [x,y]=point(i/36,j/8-1);if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
      // Small travelling highlights instead of a broad glowing waveform.
      for(let k=0;k<7;k++){
        const u=(phase*.035+k*.147)%1,v=Math.sin(k*2.4)*.82,[x,y]=point(u,v);
        ctx.fillStyle=`rgba(232,237,240,${(Math.sin(Math.PI*u)**2*.44).toFixed(3)})`;
        ctx.beginPath();ctx.arc(x,y,k%3===0?1.05:.7,0,Math.PI*2);ctx.fill();
      }
    }
    resize();addEventListener('resize',resize);
    motion.addEventListener('change',()=>{last=0;draw();});
    return { tick(now) {
      if(!on||document.hidden||motion.matches){last=0;return;}
      if(last&&now-last<32)return;
      phase+=last?Math.min(.06,(now-last)/1000):0;last=now;
      px+=(targetX-px)*.08;py+=(targetY-py)*.08;influence+=((activePointer?1:0)-influence)*.06;
      draw();
    } };
  }, { tick() {} });

  /* ------------------------------------------------------------------ maze (deterministic) */
  mod(function maze() {
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
  });

  /* ------------------------------------------------------------------ letterbox reel (desktop): one hairline segment per chapter */
  $("#reel").innerHTML = order.map(() => "<li><i></i></li>").join("");
  $("#reel").style.setProperty("--n", order.length);
  const reelLis = $$("#reel li"), reelL = $("#reelL"), reelR = $("#reelR");
  let reelTxt = "", reelPct = -1;
  function reel() {
    if (isMobile()) return;
    order.forEach((p, i) => {
      const v = chapterProgress(p.key);
      reelLis[i].style.setProperty("--p", v.toFixed(3));
      reelLis[i].classList.toggle("on", p.key === active);
    });
    const ap = active && byKey[active];
    const t = ap ? `<b>${pad(order.indexOf(ap) + 1)}</b>&nbsp; ${esc(L(V(ap, "title")))}` : "";
    if (t !== reelTxt) { reelL.innerHTML = t; reelTxt = t; }
    const pct = ap ? Math.round(chapterProgress(active) * 100) : -1;
    if (pct !== reelPct) { reelR.innerHTML = pct < 0 ? "" : `<b>${String(pct).padStart(3, "0")}</b> / 100`; reelPct = pct; }
  }

  /* ------------------------------------------------------------------ main loop + watchdog */
  const updaters = { aviso, printplay, work: workStage, steam, suikou, xiaoyi, taotao, "wild-louis": wild };
  let lastFrame = performance.now(), degraded = false;
  // r12: one failing module must not stop the loop; it is switched off (end state) and the rest keep running
  const broken = {};
  const run = (name, fn) => { if (broken[name]) return; try { fn(); } catch (e) { broken[name] = true; if (updaters[name]) { try { updaters[name](1); } catch (_) {} } } };
  function frame(now) {
    lastFrame = now;
    requestAnimationFrame(frame);
    if (!document.hidden) {
      for (const key in updaters) {
        const sec = document.getElementById(key);
        if (!sec) continue;
        const r = sec.getBoundingClientRect();
        if (r.bottom < -innerHeight * 0.5 || r.top > innerHeight * 1.5) continue; // off-screen: skip
        run(key, () => updaters[key](progressOf(key)));
      }
      run("chapters", checkChapters);
      run("reel", reel);
      run("voice", () => voice.tick(now));
    }
  }
  // rAF watchdog: if frames stop for >2s while visible, snap every stage to its end state
  setInterval(() => {
    if (!document.hidden && !degraded && performance.now() - lastFrame > 2000) {
      degraded = true;
      for (const key in updaters) updaters[key](1);
      $$("[data-preset]").forEach((el) => el.classList.add("is-in"));
    }
  }, 1000);

  // r6: on phones the 1000-unit schematic shrinks to ~0.4×, so labels get a tighter crop, a larger
  // size (CSS, ≈11px on screen) and positions that keep them clear of each other and of the pipes.
  const stSvg = $("#stSvg"), stLbls = $$("#stSvg text");
  const stMob = [[115, 338, "middle"], [420, 348, "middle"], [700, 348, "middle"], [838, 42, "end"], [838, 72, "end"], [480, 104, "middle"], [520, 486, "middle"]];
  stLbls.forEach((t) => { t.dataset.d = [t.getAttribute("x"), t.getAttribute("y"), t.getAttribute("text-anchor") || "start"].join(","); });
  function layoutSteam() {
    const m = isMobile();
    stSvg.setAttribute("viewBox", m ? "28 14 860 482" : "24 22 940 470");
    stLbls.forEach((t, i) => {
      const [x, y, a] = m ? stMob[i] : t.dataset.d.split(",");
      t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", a);
    });
  }
  function layout() { sizeStages(); measureAviso(); measureTT(); layoutSteam(); placeNavInd(); }
  addEventListener("resize", layout);
  if (mqMobile.addEventListener) mqMobile.addEventListener("change", layout); else if (mqMobile.addListener) mqMobile.addListener(layout); // iOS < 14

  run("lang", applyLang);
  run("layout", layout);
  requestAnimationFrame(frame);
  document.documentElement.classList.add("app-ready");
  if (document.fonts) document.fonts.ready.then(() => { measureAviso(); measureTT(); placeNavInd(); });
})();
