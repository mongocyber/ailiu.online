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
  let lang = params.get("lang") || store.get("ailiu.lang") || ((navigator.language || "").startsWith("zh") ? "zh" : "en");
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
    $$("[data-lang-opt]").forEach((el) => el.classList.toggle("on", el.dataset.langOpt === lang));
    fillSlots(); renderWork(); buildNav(); renderSound(); buildTranscript(); renderWildSource(true); renderLog();
    measureAviso(); reelTxt = "";
    narrator.onLang();
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
      `<li><a href="#${p.key}"><b>${pad(i + 1)}</b><span>${L(V(p, "title"))}</span><em>${L(V(p, "statusLabel"))}</em></a></li>`).join("");
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
    $("#footContact").innerHTML = M.contact.map((c) =>
      `<li><span class="mono">${esc(L(c.label))}</span><a href="${c.href}"${c.id === "x" ? ' target="_blank" rel="noopener"' : ""}>${esc(c.text)}</a></li>`).join("");
    const d = byKey["wild-louis"].disclosure;
    $("#wlDisc").textContent = L(d);
  }
  /* ------------------------------------------------------------------ 03 Design Work: case studies from MANIFEST.work (r13) */
  // Head: capabilities + method. Body: a sticky index (01–05) and one article per case in a single grid template —
  // text (summary, problem, decisions, result) beside a lead screen and smaller screens with captions.
  // Images are plain <img> files (desktop + "-sm" phone size), lazy and async, with width / height set against layout shift.
  const smOf = (src) => src.replace(/\.webp$/, "-sm.webp");
  function figure(c, im, k, lead) {
    const smW = Math.round(Math.min(im.w, k === 0 || im.h <= im.w ? 720 : 560));
    return `<figure class="wfig${lead ? " wfig-lead" : ""}">
        <div class="wfig-frame"><img src="${im.src}" srcset="${smOf(im.src)} ${smW}w, ${im.src} ${im.w}w"
          sizes="${lead ? "(max-width: 760px) 100vw, 56vw" : "(max-width: 760px) 80vw, 28vw"}"
          width="${im.w}" height="${im.h}" loading="lazy" decoding="async" alt="${esc(L(im.alt))}"></div>
        <figcaption class="mono"><b>${pad(c)}.${k + 1}</b>${esc(L(im.caption))}</figcaption>
      </figure>`;
  }
  function renderWork() {
    const W = M.work, n = W.cases.length;
    $("#workCaps").innerHTML = W.capabilities.map((c, i) =>
      `<li class="cap cap-${c.id}" style="--i:${i}"><b class="mono">${pad(i + 1)}</b><span><strong>${esc(L(c.title))}</strong><em class="mono">${L(c.tags).map(esc).join(" · ")}</em></span></li>`).join("");
    $("#workMethod").innerHTML =
      `<p class="wk-sec mono">${esc(L(W.methodNote))}</p><ol class="wk-method mono">${L(W.method).map((m, i) => `<li style="--i:${i}"><b>${pad(i + 1)}</b>${esc(m)}</li>`).join("")}</ol>`;
    $("#workIndex").setAttribute("aria-label", T("案例索引", "Cases"));
    $("#workIndex").innerHTML = `<ol>${W.cases.map((c, i) =>
      `<li><a href="#case-${c.id}" class="case-${c.id}" data-i="${i}"><b>${pad(i + 1)}</b><span>${esc(c.title)}</span></a></li>`).join("")}</ol>`;
    $("#workCases").innerHTML = W.cases.map((c, i) => {
      const [lead, ...rest] = c.images;
      return `<article class="wcase case-${c.id}" id="case-${c.id}" data-i="${i}" aria-labelledby="case-h-${c.id}">
        <div class="wcase-text" data-preset="reveal-up">
          <p class="case-tag mono"><span>${pad(i + 1)} / ${pad(n)}</span>${esc(L(c.domain))}</p>
          <h3 class="case-h" id="case-h-${c.id}">${esc(c.title)}</h3>
          <p class="case-sum">${esc(L(c.summary))}</p>
          <dl class="case-pmr">
            <dt class="mono">${T("问题", "The problem")}</dt><dd>${esc(L(c.problem))}</dd>
            <dt class="mono">${T("我的做法", "What I did")}</dt><dd><ol class="case-dec">${c.decisions.map((d) => `<li>${esc(L(d))}</li>`).join("")}</ol></dd>
            <dt class="mono">${T("结果", "Outcome")}</dt><dd>${esc(L(c.result))}</dd>
          </dl>
        </div>
        <div class="wcase-media" data-preset="reveal-up">
          ${figure(i + 1, lead, 0, true)}
          <div class="wfig-row${rest.length === 1 ? " is-one" : ""}">${rest.map((im, k) => figure(i + 1, im, k + 1, false)).join("")}</div>
        </div>
      </article>`;
    }).join("");
    // re-rendered on every language switch: the new blocks join the reveal observer (the ones in view reveal at once)
    $$("#workCases [data-preset]").forEach((el) => presetIO.observe(el));
    wkActive = -1;
  }
  let wkActive = -1;
  $("#workIndex").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-i]"); if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.getAttribute("href").slice(1));
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
  $$(".chapter .slots").forEach((sl) => {
    let i = 0;
    $$(":scope > .slot-tagline, :scope > .slot-blurb, :scope > .slot-row", sl).forEach((el) => { el.dataset.preset = "reveal-up"; el.style.setProperty("--i", ++i); });
  });
  $$("[data-preset]").forEach((el, i) => presetIO.observe(el));

  /* ------------------------------------------------------------------ sound (muted placeholder) */
  // Real flow (§5.1): on load create AudioContext → resume() and audio.play() the opening line;
  // one-shot unlock listeners on keydown/pointerdown/touchend/click (scroll/mousemove are NOT
  // user activation per HTML spec, so most first visits will be blocked until a click/key).
  // This preview has no recorded voice, so nothing is played and no "tap for sound" chip is shown.
  let soundOn = store.get("ailiu.sound") !== "off";
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
      if (x.state === "ok" && x.href) return `<a class="dr-link" href="${x.href}" target="_blank" rel="noopener">${esc(L(x.label))}</a>`;
      if (x.state === "text") return `<span class="dr-text">${esc(L(x.label))}</span>`;
      const t = LINK_TAG[x.state] || LINK_TAG.tbd;
      return `<span class="dr-ph" aria-disabled="true">${esc(L(x.label))} <em>${T(t[0], t[1])}</em></span>`;
    });
    const ai = p.aiGenerated && p.key !== "wild-louis" ? `<span class="dr-ai">${esc(L(p.disclosure))}</span>` : "";
    const soc = d.socials ? `<ul class="dr-soc" aria-label="${T("社交平台（待补）", "Social platforms (TBD)")}">` + d.socials.map((x) =>
      `<li aria-disabled="true"><i aria-hidden="true">${x.glyph}</i><span>${esc(L(x.label))}</span><em>${T("待补", "TBD")}</em></li>`).join("") + "</ul>" : "";
    row.innerHTML = (p.draft ? `<span class="dr-chip" title="${T("内容草稿，尚未定稿", "Draft copy, not final yet")}">${esc(L(d.label))}</span>` : "") + ai + items.join("") +
      (d.note ? `<p class="dr-note">${esc(L(d.note))}</p>` : "") + soc;
  }

  function renderSound() {
    const b = $("#soundBtn");
    b.setAttribute("aria-pressed", String(soundOn));
    $(".sound-label", b).textContent = lang === "zh" ? (soundOn ? "声音 开" : "声音 关") : (soundOn ? "Sound on" : "Sound off");
    b.title = lang === "zh" ? "声音为静音占位：Louis 的声音尚未录制" : "Muted placeholder: Louis's voice is not recorded yet";
  }
  $("#soundBtn").addEventListener("click", () => {
    soundOn = !soundOn;
    store.set("ailiu.sound", soundOn ? "on" : "off");
    renderSound();
  });

  /* ------------------------------------------------------------------ Louis instances */
  // r12: a portrait that can't start leaves its static fallback (CSS) and a no-op stand-in; the page carries on
  const mountLouis = (opts, el) => {
    try { return new Louis(opts).mount(el); }
    catch (e) { el.classList.add("is-fallback"); return { lvl: 0, setState() {}, setLevel() {}, dock() {}, destroy() {} }; }
  };
  const louisHero = mountLouis({ lines: 96, samples: 200 }, $("#louisHero"));
  const louisMini = mountLouis({ lines: 30, samples: 64, relief: 0.8, interactive: false, glitch: false, mini: true, fps: 30, bg: "#060607" }, $("#narFace"));
  const louisWild = mountLouis({ lines: 100, samples: 200, bg: "#050507", colorA: [185, 166, 255], colorB: [150, 232, 255], sweater: [122, 166, 150] }, $("#louisWild"));
  const louises = [louisHero, louisMini, louisWild];

  /* ------------------------------------------------------------------ narrator (captions; §4.5 rules) */
  // r6: the queue is keyed to where the reader *is*, not where they have been.
  //  · a chapter only counts as "said" once its line actually starts (skipped chapters stay eligible);
  //  · a queued line is dropped the moment its chapter stops being the current one (§4.5-3);
  //  · a playing line whose chapter is ≥2 chapters behind fades out (200ms) and hands over at once;
  //  · otherwise one line at a time with a ≥1.2s gap (§4.5-1).
  const narrator = (() => {
    const sub = $("#narSub"), box = $("#narrator"), idxEl = $("#narIdx"), nextEl = $("#narNext");
    let nextTxt = "";
    const said = new Set();
    const FADE = 200, GAP = 1200;
    let cur = null, queued = null, coolUntil = 0, startT = 0, dur = 0, words = [], fadeUntil = 0, shown = null, here = "hero", lastN = -1;
    const estimate = (txt) => Math.max(1800, lang === "zh" ? (txt.length / 4.5) * 1000 : (txt.length / 15) * 1000);
    const idxOf = (id) => (id === "hero" ? 0 : id ? order.indexOf(byKey[id]) + 1 : order.length + 1);
    function lineFor(id) {
      if (id === "hero") return { id, idx: 0, text: L(M.hero.narration[0].subtitle) };
      const p = byKey[id]; return { id, idx: idxOf(id), text: L(p.narration[0].subtitle) };
    }
    function render(text) {
      const parts = lang === "zh" ? Array.from(text) : text.split(/(\s+)/);
      sub.innerHTML = parts.map((w) => (/^\s+$/.test(w) ? w : `<span class="w">${w.replace(/</g, "&lt;")}</span>`)).join("");
      words = $$(".w", sub); lastN = -1;
    }
    function setIdx(n) { idxEl.textContent = `${pad(n)} / ${pad(order.length)}`; }
    function play(line) {
      said.add(line.id);
      cur = line; shown = line.id; startT = performance.now(); dur = estimate(line.text);
      render(line.text);
      box.classList.remove("is-idle", "is-stale", "is-out");
      setIdx(line.idx);
      louises.forEach((l) => l.setState("talk"));
    }
    function finish(now) {
      cur = null; coolUntil = now + GAP; box.classList.add("is-idle");
      words.forEach((w) => w.classList.add("on")); sub.querySelectorAll(".now").forEach((w) => w.classList.remove("now"));
      louises.forEach((l) => l.setState("idle"));
    }
    // called by the dwell detector: ≥55% of the viewport for ≥450ms (§4.5-2)
    function request(id, force) {
      if (!force && said.has(id)) return;
      if (!force && id !== here) return;
      if (!cur && !fadeUntil && performance.now() >= coolUntil) return play(lineFor(id));
      queued = id;
    }
    // where the reader is right now ("hero", a chapter key, or null below the chapters)
    function setHere(id) {
      if (id === here) return;
      here = id;
      if (queued && queued !== here) queued = null;        // stale: drop, do not mark as said
      if (!cur) idleView();
    }
    // when nothing is speaking, the bar shows the current chapter: its line if already heard (dim), else a quiet placeholder
    function idleView() {
      const n = idxOf(here);
      if (!here || n > order.length) return;
      setIdx(n);
      if (shown === here) { box.classList.remove("is-stale"); return; }
      if (said.has(here)) { shown = here; render(lineFor(here).text); words.forEach((w) => w.classList.add("on")); box.classList.remove("is-stale"); }
      else { box.classList.add("is-stale"); render(""); shown = null; }
    }
    function tick(now) {
      let level = 0;
      if (fadeUntil) {
        if (now >= fadeUntil) { fadeUntil = 0; box.classList.remove("is-out"); if (queued) { const q = queued; queued = null; play(lineFor(q)); } else idleView(); }
      } else if (cur) {
        // fast scroll: the reader is already 2+ chapters past this line → fade out 200ms, cut to the current chapter
        if (here !== cur.id && Math.abs(idxOf(here) - cur.idx) >= 2) {
          cur = null; fadeUntil = now + FADE; box.classList.add("is-out");
          louises.forEach((l) => l.setState("idle"));
        } else {
          const t = (now - startT) / dur;
          const n = reduced ? words.length : Math.ceil(clamp(t) * words.length); // §5.4: static captions under reduced motion
          if (n !== lastN) {
            for (let i = 0; i < words.length; i++) { words[i].classList.toggle("on", i < n); words[i].classList.toggle("now", i === n - 1); }
            lastN = n;
          }
          // synthetic speech envelope (stand-in for AnalyserNode RMS until audio exists)
          if (soundOn && t < 1) level = 0.28 + 0.42 * Math.abs(Math.sin(now / 90)) * (0.5 + 0.5 * Math.sin(now / 370));
          if (t >= 1) { finish(now); if (here !== shown) idleView(); }
        }
      } else if (queued && now >= coolUntil) {
        const q = queued; queued = null;
        if (q === here) play(lineFor(q));
      } else if (!queued && here !== shown && here) idleView();
      // "→ 03": the next chapter's line is waiting for this one to finish (no overlap, §4.5-1)
      const nx = (cur || fadeUntil) && here && (!cur || here !== cur.id) && !said.has(here) && idxOf(here) <= order.length ? `→ ${pad(idxOf(here))}` : "";
      if (nx !== nextTxt) { nextEl.textContent = nx; nextTxt = nx; }
      louises.forEach((l) => l.setLevel(level));
      box.style.setProperty("--nar-t", cur ? clamp((now - startT) / dur).toFixed(3) : 1);
      const r = $("#lvRead"); if (r) r.textContent = level.toFixed(2);
    }
    function onLang() {
      // §4.5-7: stop the current line, no replay; the bar re-renders in the new language
      if (cur) finish(performance.now());
      queued = null;
      if (shown) { render(lineFor(shown).text); words.forEach((w) => w.classList.add("on")); }
    }
    // §4.5-6: tab hidden → fade out and clear the queue
    function stop() {
      if (cur) { cur = null; fadeUntil = performance.now() + FADE; box.classList.add("is-out"); louises.forEach((l) => l.setState("idle")); }
      queued = null;
    }
    function replay() {
      const id = here || "hero";
      if (cur) { cur = null; }
      fadeUntil = 0; box.classList.remove("is-out"); coolUntil = 0;
      play(lineFor(id));
    }
    return { request, tick, onLang, replay, setHere, stop };
  })();
  document.addEventListener("visibilitychange", () => { if (document.hidden) narrator.stop(); });
  $("#narFace").addEventListener("click", () => { louisMini.setState("react"); narrator.replay(); });

  /* ------------------------------------------------------------------ active chapter, glitch-cut, narration cue */
  let active = null;
  const glitched = new Set();
  function setActive(key, silent) {
    active = key;
    $$("#chapnav a").forEach((a) => a.setAttribute("aria-current", String(a.dataset.key === key)));
    placeNavInd();
    document.body.classList.toggle("is-wild", key === "wild-louis");
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
    narrator.setHere(k || (heroCov >= 0.3 ? "hero" : null));
    if (heroCov >= 0.55) { if (!dwell.hero) dwell.hero = performance.now(); else if (performance.now() - dwell.hero > 700) narrator.request("hero"); }
    else dwell.hero = 0;
  }

  /* ------------------------------------------------------------------ per-stage progress */
  function progressOf(key) {
    const st = $(`[data-stage="${key}"]`);
    const r = st.getBoundingClientRect();
    const span = r.height - st.firstElementChild.offsetHeight; // pin is shorter than the viewport (letterbox, r6)
    return span > 0 ? clamp(-r.top / span) : (r.top < innerHeight ? 1 : 0);
  }
  // reel / caption progress spans the whole chapter (Design Work's body scrolls on past its pinned stage)
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
    s.setProperty("--tz", (-140 * (1 - rise)).toFixed(1) + "px");
    s.setProperty("--zh", (60 * e).toFixed(1) + "px");
    s.setProperty("--zp", (140 * e).toFixed(1) + "px");
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

  /* ---- 03 Design Work (r13): the sticky index follows the case in view; lead screens drift a few px (parallax) */
  const wkIdx = $("#workIndex");
  function workStage() {
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

  /* ---- 08 Xiaoyi */
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
    // desktop: the two playing cells walk the wall (snake order) as the stage scrolls, so every clip gets a turn
    if (!isMobile() && !reduced && !saveData && ranked.length) {
      const snake = [0, 1, 2, 5, 4, 3], k = Math.min(4, Math.floor(clamp((p - 0.22) / 0.7) * 5));
      playing = [ttCells[snake[k]], ttCells[snake[k + 1]]];
    }
    if (ttHover && !reduced) playing = [ttHover].concat(playing.filter((c) => c !== ttHover)).slice(0, limit);
    ttCells.forEach((c) => c.classList.toggle("is-playing", playing.includes(c)));
  }

  /* ---- 07 Wild Louis */
  const wlSrc = $("#wlSrc"), wlPin = $("#wild-louis .pin");
  let srcLines = [], shownLines = -1;
  function renderWildSource(force) {
    const p = byKey["wild-louis"];
    const view = { key: p.key, order: p.order, type: p.type, status: p.status, title: L(V(p, "title")), tagline: L(V(p, "tagline")), draft: !!p.draft,
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
      ["portrait", louisHero.live ? "canvas" : "static fallback"],
      ["fx", document.documentElement.dataset.fx || "2d"],   // r13: hero 3D tier (webgl-high / webgl-low / 2d)   // r12: which render path the hero portrait is on
    ];
    $("#wlRuntime").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  }

  /* ------------------------------------------------------------------ hero glyph rain (hero only, §4.7) */
  // r13: while the WebGL field (fx3d.js) runs, the rain stays hidden and idle
  const fx3d = () => /^webgl/.test(document.documentElement.dataset.fx || "");
  const rain = mod(() => {
    const c = $("#rain"); if (!c || reduced) return { tick() {} };
    const ctx = c.getContext("2d"); if (!ctx) return { tick() {} };
    const glyphs = "01アイウエオカキクケコサシスセソ<>/{}[]#=+*ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ".split("");
    let cols = [], w = 0, h = 0, last = 0, on = true;
    const fs = 14, monoFont = 'ui-monospace, Menlo, Consolas, "JetBrains Mono", "DejaVu Sans Mono", monospace';
    function resize() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Array.from({ length: Math.ceil(w / (fs * 1.6)) }, () => ({ y: Math.random() * h, v: 0.6 + Math.random() * 1.6, a: Math.random() }));
    }
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(c);
    addEventListener("resize", resize); resize();
    addEventListener("fx:2d", resize);   // r13: the WebGL field dropped out (context lost) → the rain takes over
    return {
      tick(now) {
        if (!on || fx3d() || now - last < 42) return; last = now;
        ctx.fillStyle = "rgba(6,6,7,0.18)"; ctx.fillRect(0, 0, w, h);
        ctx.font = `${fs}px ${monoFont}`;
        cols.forEach((col, i) => {
          const ch = glyphs[(Math.random() * glyphs.length) | 0];
          ctx.fillStyle = `rgba(150,232,255,${0.12 + col.a * 0.25})`;
          ctx.fillText(ch, i * fs * 1.6, col.y);
          col.y += fs * col.v * 0.5; if (col.y > h + 20) { col.y = -20; col.a = Math.random(); }
        });
      }
    };
  }, { tick() {} });

  /* ------------------------------------------------------------------ footer voiceprint (Louis's signal, Atomic nod) */
  const voice = mod(() => {
    const c = $("#voiceprint"), ctx = c && c.getContext("2d");
    if (!ctx) return { tick() {} };
    let w = 0, h = 0, on = false;
    function resize() { const dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw(0); }
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(c);
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
    resize(); addEventListener("resize", resize);   // r12: listen only once a first draw has worked
    return { tick(now) { if (on && !reduced) draw(now); } };
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

  /* ------------------------------------------------------------------ transcript (readable alternative to audio, §5.5) */
  function buildTranscript() {
    const items = [`<li><b>Louis:</b> ${esc(L(M.hero.narration[0].subtitle))}</li>`]
      .concat(order.map((p, i) => `<li><b>${pad(i + 1)} ${esc(L(V(p, "title")))}:</b> ${esc(L(p.narration[0].subtitle))}</li>`));
    $("#transcript").innerHTML = items.join("");
  }

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
      run("narrator", () => narrator.tick(now));
      run("rain", () => rain.tick(now));
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

  run("wild-source", () => renderWildSource(true));
  run("lang", applyLang);
  run("layout", layout);
  requestAnimationFrame(frame);
  document.documentElement.classList.add("app-ready");
  if (document.fonts) document.fonts.ready.then(() => { measureAviso(); measureTT(); placeNavInd(); });
})();
