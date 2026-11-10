/* ============ EC — engine of the English for Game Dev platform ============
   Every lesson includes this file and calls functions from EC.*             */
(function () {
  'use strict';
  const EC = {};
  const LS = window.localStorage;

  /* ---------- storage ---------- */
  const data = () => {
    try { return JSON.parse(LS.getItem('ec_progress_v1') || '{}'); }
    catch (e) { return {}; }
  };
  const save = (d) => {
    LS.setItem('ec_progress_v1', JSON.stringify(d));
    if (window.PG) window.PG.push(d);
  };
  const lesson = (key, make) => {
    const d = data();
    d.lessons = d.lessons || {};
    if (make) {
      if (!d.lessons[key]) d.lessons[key] = { sections: {}, scores: {}, hw: {}, writing: '' };
      const L = d.lessons[key];
      L.sections = L.sections || {}; L.scores = L.scores || {}; L.hw = L.hw || {};
      if (typeof L.writing !== 'string') L.writing = '';
    }
    return { d, L: d.lessons[key] };
  };
  EC.getProgress = () => data();

  /* ---------- lesson init: progress bar + section toggles ---------- */
  EC.initLesson = function (key, sections) {
    const { L } = lesson(key, true);
    const wrap = document.querySelector('#lessonProgress');
    if (!wrap) return;
    const countDone = () => sections.filter(s => L.sections[s.id]).length;
    let done = countDone();
    const bar = wrap.querySelector('.bar i');
    const label = wrap.querySelector('.p-label');
    const render = () => {
      bar.style.width = (done / sections.length * 100) + '%';
      label.textContent = `Lesson progress: ${done}/${sections.length}`;
    };
    render();
    sections.forEach(s => {
      const head = document.querySelector('#' + s.id + ' .sec-head');
      if (!head) return;
      const wrapBtn = document.createElement('button');
      wrapBtn.className = 'btn small' + (L.sections[s.id] ? ' primary' : '');
      const paint = (on) => {
        wrapBtn.textContent = on ? '✓ Section done' : 'Mark as done';
        wrapBtn.classList.toggle('primary', !!on);
      };
      paint(!!L.sections[s.id]);
      wrapBtn.addEventListener('click', () => {
        const { d, L: L2 } = lesson(key, true);
        L2.sections[s.id] = !L2.sections[s.id];
        if (!L2.sections[s.id]) delete L2.sections[s.id];
        done = sections.filter(x => L2.sections[x.id]).length;
        save(d); paint(!!L2.sections[s.id]); render();
      });
      head.appendChild(wrapBtn);
    });
    EC._lessonCtx = { key, total: sections.length };
    render();
  };
  EC.recountDone = function () {
    const ctx = EC._lessonCtx; if (!ctx) return;
    const { L } = lesson(ctx.key, true);
    const done = Object.values(L.sections).filter(Boolean).length;
    const wrap = document.querySelector('#lessonProgress');
    if (wrap) {
      wrap.querySelector('.bar i').style.width = (done / ctx.total * 100) + '%';
      wrap.querySelector('.p-label').textContent = `Lesson progress: ${done}/${ctx.total}`;
    }
  };

  /* ---------- scores ---------- */
  function reportScore(exKey, got, total) {
    const { d, L } = lesson(EC._lessonCtx.key, true);
    const prev = L.scores[exKey];
    const best = prev ? Math.max(prev[0], got) : got;
    L.scores[exKey] = [best, total];
    save(d);
    const chip = document.querySelector(`[data-score="${exKey}"]`);
    if (chip) chip.textContent = `Score: ${best}/${total}`;
  }
  function showScoreChip(container, exKey) {
    const { L } = lesson(EC._lessonCtx.key, true);
    const s = L.scores[exKey];
    const chip = document.createElement('span');
    chip.className = 'score-chip'; chip.dataset.score = exKey;
    chip.textContent = s ? `Score: ${s[0]}/${s[1]}` : '';
    container.querySelector('.ex-head').appendChild(chip);
  }
  const norm = s => (s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[.!?…]+$/g, '').replace(/\s+/g, ' ').trim();
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  /* ---------- audio speed buttons ---------- */
  EC.enhanceAudio = function () {
    document.querySelectorAll('audio[data-speeds]').forEach(a => {
      const row = el('div', 'speeds', '<span>Speed:</span>');
      ['1', '1.25', '1.5'].forEach(v => {
        const b = el('button', 'spd' + (v === '1' ? ' active' : ''), v + '×');
        b.addEventListener('click', () => {
          a.playbackRate = parseFloat(v);
          row.querySelectorAll('.spd').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        });
        row.appendChild(b);
      });
      a.insertAdjacentElement('afterend', row);
    });
  };

  /* ---------- flip cards (warm-up, speed drill, vocab) ---------- */
  EC.flipGrid = function (sel, items) {
    const root = document.querySelector(sel); if (!root) return;
    const grid = el('div', 'flipgrid');
    items.forEach(it => {
      const c = el('div', 'flip');
      c.innerHTML = `<div class="front">${it.front}</div><div class="corner hint-corner">▼</div><div class="back">${it.back}</div>`;
      c.addEventListener('click', () => c.classList.toggle('open'));
      grid.appendChild(c);
    });
    root.appendChild(grid);
  };

  /* ---------- vocab chips + definitions ---------- */
  EC.vocab = function (sel, words) {
    const root = document.querySelector(sel); if (!root) return;
    const row = el('div', 'vrow');
    const def = el('div', 'vdef');
    words.forEach(w => {
      const c = el('button', 'vchip', w.w);
      c.addEventListener('click', () => {
        const open = c.classList.contains('open');
        row.querySelectorAll('.vchip').forEach(x => x.classList.remove('open'));
        if (open) { def.classList.remove('show'); return; }
        c.classList.add('open');
        def.innerHTML = `<b>${w.w}</b> — ${w.d}` + (w.e ? `<br><i>${w.e}</i>` : '');
        def.classList.add('show');
      });
      row.appendChild(c);
    });
    root.appendChild(row); root.appendChild(def);
  };

  /* ---------- MCQ ---------- */
  EC.mcq = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    root.classList.add('ex');
    root.innerHTML = `<div class="ex-head"><h3>${cfg.title}</h3></div>`;
    showScoreChip(root, cfg.exKey);
    let firstTry = [];
    cfg.items.forEach((it, qi) => {
      const q = el('div', 'q');
      q.appendChild(el('div', 'qtext', `${qi + 1}. ${it.q}`));
      const opts = el('div', 'opts');
      const why = el('div', 'why');
      let answered = false;
      firstTry[qi] = null;
      it.opts.forEach((o, oi) => {
        const b = el('button', 'opt', o);
        b.addEventListener('click', () => {
          if (answered) return;
          if (oi === it.a) {
            b.classList.add('correct');
            opts.querySelectorAll('.opt').forEach(x => { if (x !== b) x.classList.add('dim'); });
            why.innerHTML = '✅ Correct! ' + (it.why || '');
            why.classList.add('show'); why.style.borderColor = 'var(--ok)';
            if (firstTry[qi] === null) firstTry[qi] = true;
            answered = true;
            const got = firstTry.filter(v => v === true).length;
            reportScore(cfg.exKey, got, cfg.items.length);
            const chip = root.querySelector('.score-chip');
            chip.textContent = `Score: ${got}/${cfg.items.length}`;
          } else {
            b.classList.add('wrong');
            if (firstTry[qi] === null) firstTry[qi] = false;
            const got = firstTry.filter(v => v === true).length;
            reportScore(cfg.exKey, got, cfg.items.length);
            root.querySelector('.score-chip').textContent = `Score: ${got}/${cfg.items.length}`;
          }
        });
        opts.appendChild(b);
      });
      q.appendChild(opts); q.appendChild(why);
      root.appendChild(q);
    });
    const actions = el('div', 'ex-actions');
    const reset = el('button', 'btn small ghost', '↺ Reset');
    reset.addEventListener('click', () => EC.mcq(sel, cfg));
    actions.appendChild(reset);
    root.appendChild(actions);
  };

  /* ---------- True / False ---------- */
  EC.tf = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    root.classList.add('ex');
    root.innerHTML = `<div class="ex-head"><h3>${cfg.title}</h3></div>`;
    showScoreChip(root, cfg.exKey);
    let firstTry = [];
    cfg.items.forEach((it, qi) => {
      const q = el('div', 'q');
      q.appendChild(el('div', 'qtext', `${qi + 1}. ${it.s}`));
      const btns = el('div', 'tfbtns');
      const bt = el('button', 'opt', '✔ True');
      const bf = el('button', 'opt', '✘ False');
      const why = el('div', 'why');
      let answered = false;
      firstTry[qi] = null;
      const pick = (choice, btn) => {
        if (answered) return;
        if (choice === it.a) {
          btn.classList.add('correct');
          why.innerHTML = '✅ ' + (it.why || '');
          why.style.borderColor = 'var(--ok)';
          if (firstTry[qi] === null) firstTry[qi] = true;
          answered = true;
        } else {
          btn.classList.add('wrong');
          why.innerHTML = '❌ Try again. ' + (it.hint || '');
          why.style.borderColor = 'var(--bad)';
          if (firstTry[qi] === null) firstTry[qi] = false;
        }
        why.classList.add('show');
        const got = firstTry.filter(v => v === true).length;
        reportScore(cfg.exKey, got, cfg.items.length);
        root.querySelector('.score-chip').textContent = `Score: ${got}/${cfg.items.length}`;
      };
      bt.addEventListener('click', () => pick(true, bt));
      bf.addEventListener('click', () => pick(false, bf));
      btns.appendChild(bt); btns.appendChild(bf);
      q.appendChild(btns); q.appendChild(why);
      root.appendChild(q);
    });
    const actions = el('div', 'ex-actions');
    const reset = el('button', 'btn small ghost', '↺ Reset');
    reset.addEventListener('click', () => EC.tf(sel, cfg));
    actions.appendChild(reset);
    root.appendChild(actions);
  };

  /* ---------- gap-fill (type the form) ---------- */
  EC.gap = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    root.classList.add('ex');
    root.innerHTML = `<div class="ex-head"><h3>${cfg.title}</h3></div>`;
    showScoreChip(root, cfg.exKey);
    const inputs = [];
    let total = 0;
    cfg.items.forEach((it, qi) => {
      const div = el('div', 'gap-item');
      const parts = it.t.split('___');
      const nBlanks = parts.length - 1;
      div.appendChild(el('span', '', `${qi + 1}. ` + parts[0]));
      for (let bi = 0; bi < nBlanks; bi++) {
        let ansList;
        if (Array.isArray(it.a)) {
          const v = it.a[bi];
          ansList = Array.isArray(v) ? v : [v];
        } else {
          ansList = [String(it.a)];
        }
        const inp = document.createElement('input');
        inp.className = 'gap-in'; inp.setAttribute('aria-label', 'blank');
        inp.placeholder = (it.verbs && it.verbs[bi]) || '…';
        div.appendChild(inp); inputs.push({ inp, ans: ansList, qi });
        total++;
        if (parts[bi + 1] !== undefined) div.appendChild(el('span', '', parts[bi + 1]));
      }
      root.appendChild(div);
    });
    const actions = el('div', 'ex-actions');
    const check = el('button', 'btn primary', 'Check');
    const show = el('button', 'btn small ghost', 'Show answers');
    const sol = el('div', 'solution');
    sol.innerHTML = cfg.items.map((it, i) => `${i + 1}. ${it.t.replace(/___/g, '<b>' + (Array.isArray(it.a) ? it.a.join(' / ') : it.a) + '</b>')}`).join('<br>');
    const fb = el('div', 'fb');
    check.addEventListener('click', () => {
      let got = 0;
      inputs.forEach(({ inp, ans }) => {
        const ok = ans.some(a => norm(a) === norm(inp.value));
        inp.classList.remove('ok', 'bad');
        inp.classList.add(ok ? 'ok' : 'bad');
        if (ok) got++;
      });
      fb.className = 'fb show ' + (got === total ? 'good' : got >= total / 2 ? 'part' : 'err');
      fb.textContent = `Correct: ${got} of ${total}. ${got === total ? 'Excellent! 🎉' : 'Fix the red fields and check again.'}`;
      reportScore(cfg.exKey, got, total);
    });
    show.addEventListener('click', () => sol.classList.toggle('show'));
    actions.appendChild(check); actions.appendChild(show);
    root.appendChild(actions); root.appendChild(fb); root.appendChild(sol);
  };

  /* ---------- sentence builder (click the words) ---------- */
  EC.order = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    root.classList.add('ex');
    root.innerHTML = `<div class="ex-head"><h3>${cfg.title}</h3></div>`;
    showScoreChip(root, cfg.exKey);
    const strip = s => s.toLowerCase().replace(/[.!?,]+/g, '').replace(/\s+/g, ' ').trim();
    let qi = 0;
    const zone = el('div');
    const fb = el('div', 'fb');
    const scoreState = [];
    const build = () => {
      zone.innerHTML = '';
      fb.className = 'fb';
      const it = cfg.items[qi];
      zone.appendChild(el('div', 'qtext', `${qi + 1}. ${it.ru}`));
      const line = el('div', 'ansline', '<span class="ph">Click the words in the correct order…</span>');
      const chips = el('div', 'chips');
      const words = it.words.slice();
      for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
      const chosen = [];
      const refreshLine = () => {
        line.innerHTML = '';
        if (!chosen.length) line.innerHTML = '<span class="ph">Click the words in the correct order…</span>';
        chosen.forEach((c, ci) => {
          const back = el('button', 'wchip', c);
          back.addEventListener('click', () => { chosen.splice(ci, 1); c.classList.remove('used'); refreshLine(); });
          line.appendChild(back);
        });
      };
      words.forEach(w => {
        const chip = el('button', 'wchip', w);
        chip.addEventListener('click', () => { chosen.push(w); chip.classList.add('used'); refreshLine(); });
        chips.appendChild(chip);
      });
      const actions = el('div', 'ex-actions');
      const check = el('button', 'btn primary', 'Check');
      const next = el('button', 'btn', 'Next →'); next.disabled = true;
      check.addEventListener('click', () => {
        const built = chosen.join(' ');
        const ok = strip(built) === strip(it.answer);
        if (ok) {
          scoreState[qi] = true;
          fb.className = 'fb show good'; fb.textContent = '✅ Correct! ' + (it.why || '');
          next.disabled = false;
        } else {
          scoreState[qi] = false;
          fb.className = 'fb show err';
          fb.innerHTML = `Almost! Your version: <b>${built}</b><br>Correct: <b>${it.answer}</b>`;
          next.disabled = false;
        }
        const got = scoreState.filter(Boolean).length;
        reportScore(cfg.exKey, got, cfg.items.length);
        root.querySelector('.score-chip').textContent = `Score: ${got}/${cfg.items.length}`;
      });
      next.addEventListener('click', () => {
        qi++;
        if (qi >= cfg.items.length) {
          const got = scoreState.filter(Boolean).length;
          fb.className = 'fb show good';
          fb.textContent = `Exercise complete: ${got}/${cfg.items.length}. 🎉 Now say all the sentences out loud!`;
          check.disabled = next.disabled = true;
          return;
        }
        build();
      });
      actions.appendChild(check); actions.appendChild(next);
      zone.appendChild(line); zone.appendChild(chips); zone.appendChild(actions); zone.appendChild(fb);
    };
    build();
    root.appendChild(zone);
  };

  /* ---------- sort2: word → Simple or Continuous ---------- */
  EC.sort2 = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    root.classList.add('ex');
    root.innerHTML = `<div class="ex-head"><h3>${cfg.title}</h3></div>
      <div class="note">Click <b>Simple</b> if the marker belongs to the Present Simple, and <b>Continuous</b> if it belongs to the Present Continuous.</div>`;
    showScoreChip(root, cfg.exKey);
    const fb = el('div', 'fb');
    cfg.items.forEach((it, i) => {
      const row = el('div', 'sort-row');
      row.appendChild(el('span', 'word', `${i + 1}. ${it.w}`));
      const bs = el('button', 'sbtn', 'Simple');
      const bc = el('button', 'sbtn', 'Continuous');
      bs.addEventListener('click', () => { bs.classList.add('sel-ps'); bc.classList.remove('sel-pc'); row.dataset.pick = 'ps'; });
      bc.addEventListener('click', () => { bc.classList.add('sel-pc'); bs.classList.remove('sel-ps'); row.dataset.pick = 'pc'; });
      row.appendChild(bs); row.appendChild(bc);
      root.appendChild(row);
    });
    const actions = el('div', 'ex-actions');
    const check = el('button', 'btn primary', 'Check');
    const show = el('button', 'btn small ghost', 'Show analysis');
    const sol = el('div', 'solution');
    sol.innerHTML = cfg.items.map(it => `<span class="${it.a === 'ps' ? 'tag ps' : 'tag pc'}">${it.w}</span>`).join(' ');
    check.addEventListener('click', () => {
      let got = 0, empty = 0;
      const rows = root.querySelectorAll('.sort-row');
      rows.forEach((row, i) => {
        const pick = row.dataset.pick;
        const word = row.querySelector('.word');
        word.classList.remove('ps', 'pc');
        if (!pick) { empty++; return; }
        if (pick === cfg.items[i].a) { got++; word.classList.add(cfg.items[i].a); }
        else word.classList.add(cfg.items[i].a === 'ps' ? 'pc' : 'ps');
      });
      fb.className = 'fb show ' + (got === cfg.items.length ? 'good' : 'part');
      fb.textContent = empty ? 'Choose an option for every word.' : `Correct: ${got} of ${cfg.items.length}. ${got === cfg.items.length ? '🎉' : 'Orange = Simple, blue = Continuous.'}`;
      reportScore(cfg.exKey, got, cfg.items.length);
    });
    show.addEventListener('click', () => sol.classList.toggle('show'));
    actions.appendChild(check); actions.appendChild(show);
    root.appendChild(actions); root.appendChild(fb); root.appendChild(sol);
  };

  /* ---------- writer ---------- */
  EC.writer = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    root.classList.add('writer');
    const { d, L } = lesson(EC._lessonCtx.key, true);
    root.innerHTML = `
      <div class="qtext">${cfg.task}</div>
      <textarea placeholder="${cfg.placeholder || 'Write here…'}"></textarea>
      <div class="writer-meta">
        <span>Words: <span class="wc">0</span> (target: ${cfg.min}–${cfg.max})</span>
        <button class="btn small save">💾 Save</button>
        <button class="btn small copy">📋 Copy</button>
        <span class="saved-info" style="color:var(--ok)"></span>
      </div>`;
    const ta = root.querySelector('textarea');
    const wc = root.querySelector('.wc');
    if (L.writing) ta.value = L.writing;
    const count = () => {
      const n = (ta.value.trim().match(/\S+/g) || []).length;
      wc.textContent = n;
      wc.className = 'wc' + (n >= cfg.min && n <= cfg.max ? ' okw' : n ? ' lolow' : '');
    };
    ta.addEventListener('input', count); count();
    root.querySelector('.save').addEventListener('click', () => {
      const { d, L } = lesson(EC._lessonCtx.key, true);
      L.writing = ta.value; save(d);
      root.querySelector('.saved-info').textContent = 'saved ✓';
      setTimeout(() => root.querySelector('.saved-info').textContent = '', 2500);
    });
    root.querySelector('.copy').addEventListener('click', () => {
      navigator.clipboard.writeText(ta.value).then(() => {
        root.querySelector('.saved-info').textContent = 'copied ✓';
        setTimeout(() => root.querySelector('.saved-info').textContent = '', 2500);
      });
    });
  };

  /* ---------- recorder ---------- */
  EC.recorder = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    const box = el('div', 'recorder');
    box.innerHTML = `
      <div class="rec-row">
        <button class="btn primary rec-start">🎤 Start recording</button>
        <button class="btn rec-stop" disabled>■ Stop</button>
        <span class="rec-timer">00:00</span>
        <span class="rec-state">${cfg.hint || 'The recording stays in this browser only'}</span>
      </div>
      <audio controls style="display:none"></audio>
      <div class="rec-note">Speak for ${cfg.maxSec || 90} seconds. If you pause to choose the tense, say the time marker out loud: <i>usually / right now / this week</i>.</div>`;
    root.appendChild(box);
    const start = box.querySelector('.rec-start'), stop = box.querySelector('.rec-stop');
    const timer = box.querySelector('.rec-timer'), state = box.querySelector('.rec-state');
    const audio = box.querySelector('audio');
    let media = null, chunks = [], t0 = null, tid = null;
    stop.addEventListener('click', () => { if (media && media.state === 'recording') media.stop(); });
    start.addEventListener('click', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        media = new MediaRecorder(stream);
        chunks = [];
        media.ondataavailable = e => chunks.push(e.data);
        media.onstop = () => {
          clearInterval(tid);
          const blob = new Blob(chunks, { type: media.mimeType || 'audio/webm' });
          audio.src = URL.createObjectURL(blob);
          audio.style.display = 'block';
          state.textContent = 'Done — listen to yourself ▶';
          start.disabled = false; stop.disabled = true;
          stream.getTracks().forEach(t => t.stop());
        };
        media.start();
        start.disabled = true; stop.disabled = false;
        state.textContent = 'Recording… keep talking, do not stop!';
        t0 = Date.now();
        timer.textContent = '00:00';
        tid = setInterval(() => {
          const s = Math.floor((Date.now() - t0) / 1000);
          timer.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
          if (s >= (cfg.maxSec || 90) && media.state === 'recording') media.stop();
        }, 500);
      } catch (e) {
        state.textContent = '🎤 Microphone is unavailable in this browser — record a voice note on your phone instead.';
      }
    });
  };

  /* ---------- homework checklist ---------- */
  EC.checklist = function (sel, cfg) {
    const root = document.querySelector(sel); if (!root) return;
    const { d, L } = lesson(EC._lessonCtx.key, true);
    const card = el('div', 'card');
    cfg.items.forEach((it, i) => {
      const row = el('label', 'check');
      const cb = document.createElement('input'); cb.type = 'checkbox';
      cb.checked = !!L.hw[i];
      if (cb.checked) row.classList.add('done');
      const t = el('span', 't', it.t + (it.m ? `<div class="m">${it.m}</div>` : ''));
      cb.addEventListener('change', () => {
        const { d, L } = lesson(EC._lessonCtx.key, true);
        L.hw[i] = cb.checked; save(d);
        row.classList.toggle('done', cb.checked);
      });
      row.appendChild(cb); row.appendChild(t);
      card.appendChild(row);
    });
    root.appendChild(card);
  };

  window.EC = EC;
})();
