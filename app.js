(() => {
  "use strict";

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeSpeech = { btn: null, utterance: null };
  function speak(text, btnEl) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      if (btnEl && btnEl.classList.contains('speaking') && activeSpeech.btn === btnEl) {
        window.speechSynthesis.cancel();
        btnEl.classList.remove('speaking');
        activeSpeech = { btn: null, utterance: null };
        return;
      }
      if (activeSpeech.btn && activeSpeech.btn !== btnEl) activeSpeech.btn.classList.remove('speaking');
      window.speechSynthesis.cancel();
    } catch { /* speech unavailable or busy — ignore */ }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    activeSpeech = { btn: btnEl || null, utterance };
    utterance.onstart = () => {
      if (activeSpeech.utterance === utterance && btnEl) btnEl.classList.add('speaking');
    };
    utterance.onend = () => {
      if (activeSpeech.utterance === utterance) {
        if (btnEl) btnEl.classList.remove('speaking');
        activeSpeech = { btn: null, utterance: null };
      }
    };
    utterance.onerror = () => {
      if (activeSpeech.utterance === utterance) {
        if (btnEl) btnEl.classList.remove('speaking');
        activeSpeech = { btn: null, utterance: null };
      }
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      if (btnEl) btnEl.classList.remove('speaking');
      activeSpeech = { btn: null, utterance: null };
    }
  }

  /* ===================== Storage (localStorage — this is a real deployed site, not a Claude artifact, so this is safe & appropriate) ===================== */
  const STORE_KEY = 'g3_progress_v1';
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) throw new Error('none');
      return JSON.parse(raw);
    } catch {
      return { xp: 0, badges: [], seenQuestions: [], bestMemoryMoves: null, maxStreak: 0, notes: [], flashStats: { gotIt: 0 } };
    }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch { /* storage unavailable — fail silently, XP just won't persist */ }
  }
  let progress = loadProgress();

  /* ===================== Sound (synthesized — no external audio files, no copyright concerns) ===================== */
  let audioCtx = null;
  let soundOn = true;
  try { soundOn = localStorage.getItem('g3_sound') !== 'off'; } catch {}
  function ensureCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function tone(freq, dur, type = 'sine', vol = 0.08, delay = 0) {
    if (!soundOn) return;
    try {
      const ctx = ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime + delay;
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch { /* audio not available — ignore */ }
  }
  const sfx = {
    click: () => tone(420, 0.06, 'square', 0.05),
    flip: () => tone(300, 0.08, 'triangle', 0.06),
    correct: () => { tone(523, 0.1, 'sine', 0.08); tone(659, 0.12, 'sine', 0.08, 0.08); },
    wrong: () => tone(160, 0.22, 'sawtooth', 0.06),
    match: () => { tone(440, 0.08, 'sine', 0.07); tone(660, 0.1, 'sine', 0.07, 0.07); tone(880, 0.12, 'sine', 0.07, 0.14); },
    levelup: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'sine', 0.08, i * 0.09)); },
    focus: () => tone(740, 0.1, 'sine', 0.06)
  };

  /* ===================== Toasts ===================== */
  const toastContainer = document.getElementById('toastContainer');
  function showToast(icon, text) {
    const el = document.createElement('div');
    el.className = 'toast';
    const ic = document.createElement('span'); ic.className = 'ic'; ic.textContent = icon;
    const tx = document.createElement('span'); tx.textContent = text;
    el.append(ic, tx);
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 350);
    }, 3200);
  }

  /* ===================== Confetti ===================== */
  function burstConfetti() {
    if (reducedMotion) return;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.zIndex = '90';
    canvas.style.pointerEvents = 'none';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const cctx = canvas.getContext('2d');
    const colors = ['#00f0ff', '#ff2bd6', '#39ff88', '#ffd23f', '#b86bff'];
    const pieces = Array.from({ length: 90 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 3,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 3,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI
    }));
    let frame = 0;
    function step() {
      frame++;
      cctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.vy += 0.25;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.2;
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot);
        cctx.fillStyle = p.color;
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        cctx.restore();
      });
      if (frame < 90) requestAnimationFrame(step);
      else canvas.remove();
    }
    step();
  }

  /* ===================== XP / Levels / Badges ===================== */
  function levelFromXp(xp) { return 1 + Math.floor(xp / 100); }
  function xpIntoLevel(xp) { return xp % 100; }

  function unlockBadge(id) {
    if (progress.badges.includes(id)) return;
    progress.badges.push(id);
    saveProgress();
    const b = BADGES.find(x => x.id === id);
    if (b) {
      showToast(b.icon, `Badge unlocked: ${b.label}`);
      sfx.levelup();
      burstConfetti();
    }
  }

  function addXp(amount) {
    const before = levelFromXp(progress.xp);
    progress.xp += amount;
    const after = levelFromXp(progress.xp);
    saveProgress();
    refreshXpUI();
    if (after > before) {
      showToast('⭐', `Level up! You're now Level ${after}`);
      sfx.levelup();
      burstConfetti();
      if (after >= 5) unlockBadge('level_5');
    }
  }

  function markStreak(streak) {
    if (streak > progress.maxStreak) {
      progress.maxStreak = streak;
      saveProgress();
    }
    if (streak >= 10) unlockBadge('streak_10');
  }

  function markSeen(key) {
    if (!progress.seenQuestions.includes(key)) {
      progress.seenQuestions.push(key);
      saveProgress();
      return true; // first time seeing it
    }
    return false;
  }

  function refreshXpUI() {
    const lvl = levelFromXp(progress.xp);
    const pct = xpIntoLevel(progress.xp);
    const xpTrackFill = document.getElementById('xpTrackFill');
    const xpPillLvl = document.querySelector('#xpPill .lvl');
    if (xpTrackFill) xpTrackFill.style.width = pct + '%';
    if (xpPillLvl) xpPillLvl.textContent = `Lv.${lvl}`;

    const statsLevel = document.getElementById('statsLevel');
    const statsXpFill = document.getElementById('statsXpFill');
    const statsXpText = document.getElementById('statsXpText');
    if (statsLevel) statsLevel.textContent = `Level ${lvl}`;
    if (statsXpFill) statsXpFill.style.width = pct + '%';
    if (statsXpText) statsXpText.textContent = `${pct} / 100 XP this level · ${progress.xp} XP total`;

    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
      const seenSet1 = progress.seenQuestions.filter(k => k.startsWith('set1')).length;
      const seenSet2 = progress.seenQuestions.filter(k => k.startsWith('set2')).length;
      statsGrid.innerHTML = '';
      [
        ['Total XP', progress.xp],
        ['Best streak', progress.maxStreak],
        ['Set 1 reviewed', `${seenSet1}/30`],
        ['Set 2 reviewed', `${seenSet2}/30`],
        ['Best memory moves', progress.bestMemoryMoves ?? '—'],
        ['Badges earned', `${progress.badges.length}/${BADGES.length}`]
      ].forEach(([lbl, num]) => {
        const box = document.createElement('div');
        box.className = 'stat-box';
        box.innerHTML = `<div class="num">${num}</div><div class="lbl">${lbl}</div>`;
        statsGrid.appendChild(box);
      });
    }

    const badgeGrid = document.getElementById('badgeGrid');
    if (badgeGrid) {
      badgeGrid.innerHTML = '';
      BADGES.forEach(b => {
        const unlocked = progress.badges.includes(b.id);
        const el = document.createElement('div');
        el.className = 'badge-item' + (unlocked ? ' unlocked' : '');
        el.innerHTML = `<span class="icon">${b.icon}</span><div class="name">${b.label}</div><div class="desc">${b.desc}</div>`;
        badgeGrid.appendChild(el);
      });
    }
  }

  /* ===================== Background: stars + drifting cell glows ===================== */
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  const COLORS = ['#00f0ff', '#ff2bd6', '#39ff88', '#ffd23f', '#b86bff'];
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  const STAR_COUNT = 130;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4,
    delay: Math.random() * 3000, period: 2600 + Math.random() * 1800,
    colorIdx: Math.floor(Math.random() * COLORS.length)
  }));
  const ORB_COUNT = 7;
  const orbs = Array.from({ length: ORB_COUNT }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
    r: 70 + Math.random() * 110, colorIdx: Math.floor(Math.random() * COLORS.length), t: Math.random() * 1000
  }));

  function hexToRgba(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
  }

  let lastTime = performance.now();
  function draw(now) {
    const dt = now - lastTime;
    lastTime = now;
    ctx.clearRect(0, 0, W, H);

    orbs.forEach(o => {
      o.x += o.vx * dt * 0.06; o.y += o.vy * dt * 0.06;
      if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
      o.t += dt;
      if (!reducedMotion && o.t > 9000) { o.t = 0; o.colorIdx = (o.colorIdx + 1) % COLORS.length; }
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      const c = COLORS[o.colorIdx];
      grad.addColorStop(0, hexToRgba(c, 0.16));
      grad.addColorStop(1, hexToRgba(c, 0));
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
    });

    stars.forEach(s => {
      const cycle = reducedMotion ? 0.5 : (((now + s.delay) % s.period) / s.period);
      const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(cycle * Math.PI));
      if (!reducedMotion && cycle < 0.02) s.colorIdx = (s.colorIdx + 1) % COLORS.length;
      ctx.fillStyle = hexToRgba(COLORS[s.colorIdx], twinkle);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* ===================== Cursor trail ===================== */
  if (!reducedMotion && !('ontouchstart' in window)) {
    let trailColorIdx = 0;
    let lastTrail = 0;
    window.addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - lastTrail < 35) return;
      lastTrail = now;
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      dot.style.background = COLORS[trailColorIdx];
      trailColorIdx = (trailColorIdx + 1) % COLORS.length;
      document.body.appendChild(dot);
      dot.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      requestAnimationFrame(() => {
        dot.style.opacity = '0';
        dot.style.transform = 'translate(-50%,-50%) scale(2.4)';
      });
      setTimeout(() => dot.remove(), 650);
    });
  }

  /* ===================== Card tilt ===================== */
  function attachTilt(selector) {
    if (reducedMotion) return;
    document.querySelectorAll(selector).forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ===================== Navigation ===================== */
  const screens = {
    home: document.getElementById('screen-home'),
    picker: document.getElementById('screen-picker'),
    set1: document.getElementById('screen-set1'),
    set2: document.getElementById('screen-set2'),
    games: document.getElementById('screen-games'),
    flashcards: document.getElementById('screen-flashcards'),
    microscope: document.getElementById('screen-microscope'),
    reference: document.getElementById('screen-reference'),
    notes: document.getElementById('screen-notes'),
    stats: document.getElementById('screen-stats')
  };
  const topnav = document.getElementById('topnav');
  const welcomeBtn = document.getElementById('welcomeBtn');
  const welcomeSpeechText = 'Welcome to the Group 3 Science Assignment. Explore two full question sets, games, flashcards, and an AI study buddy. Tap any question to hear it read aloud. Press Next to begin.';
  let welcomeSpeechPlayed = false;
  let welcomeSpeechManuallyPlayed = false;

  function playWelcomeSpeech(btnEl) {
    welcomeSpeechPlayed = true;
    speak(welcomeSpeechText, btnEl);
  }

  if (welcomeBtn) {
    welcomeBtn.addEventListener('click', () => {
      welcomeSpeechManuallyPlayed = true;
      playWelcomeSpeech(welcomeBtn);
    });
  }

  function goTo(name) {
    Object.values(screens).forEach(s => s && s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
    topnav.style.display = name === 'home' ? 'none' : 'flex';
    document.querySelectorAll('.topnav .navbtn').forEach(b => b.classList.toggle('is-active', b.dataset.go === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'stats') refreshXpUI();
    if (name === 'notes') renderNotes();
    sfx.click();
  }
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (!welcomeSpeechPlayed && !welcomeSpeechManuallyPlayed) playWelcomeSpeech(welcomeBtn || undefined);
    goTo('picker');
  });
  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => goTo(el.dataset.go)));
  attachTilt('.set-card');
  attachTilt('.game-panel');

  /* ===================== Render question sets ===================== */
  function renderSet(containerId, setData, setKey) {
    const container = document.getElementById(containerId);
    const frag = document.createDocumentFragment();
    let num = 1;
    const totalQ = setData.mcq.length + setData.saq.length;

    function checkSetBadge() {
      const seenCount = progress.seenQuestions.filter(k => k.startsWith(setKey + '-')).length;
      if (seenCount >= totalQ) unlockBadge(setKey === 'set1' ? 'set1_complete' : 'set2_complete');
    }

    setData.mcq.forEach((item, i) => {
      const key = `${setKey}-mcq-${i}`;
      const card = document.createElement('div');
      card.className = 'qcard';
      const numEl = document.createElement('span'); numEl.className = 'qnum'; numEl.textContent = `Question ${num}`;
      const diffTag = document.createElement('span');
      diffTag.style.cssText = 'float:right; font-family:JetBrains Mono,monospace; font-size:10px; opacity:0.7;';
      diffTag.textContent = item.difficulty || '';
      const qEl = document.createElement('div'); qEl.className = 'qtext'; qEl.textContent = item.q;
      const optsEl = document.createElement('div'); optsEl.className = 'options';
      item.options.forEach((opt, oi) => {
        const o = document.createElement('div'); o.className = 'opt'; o.dataset.idx = oi;
        o.textContent = `${'abcd'[oi]}) ${opt}`;
        optsEl.appendChild(o);
      });
      const ansEl = document.createElement('div'); ansEl.className = 'answer';
      ansEl.innerHTML = '';
      const ansLine = document.createElement('div');
      const answerText = `The answer of this question is (${('abcd'[item.correctIndex])}) ${item.options[item.correctIndex]})`;
      ansLine.textContent = answerText;
      const explainLine = document.createElement('div');
      explainLine.style.marginTop = '8px'; explainLine.style.color = 'var(--ink-dim)'; explainLine.style.fontSize = '13px';
      explainLine.textContent = item.explain || '';
      const toolsEl = document.createElement('div'); toolsEl.className = 'qtools';
      const speakQBtn = document.createElement('button');
      speakQBtn.type = 'button';
      speakQBtn.className = 'speak-btn';
      speakQBtn.innerHTML = '<span class="speak-ic">🔊</span><span>Hear question</span>';
      speakQBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(item.q, speakQBtn);
      });
      const speakABtn = document.createElement('button');
      speakABtn.type = 'button';
      speakABtn.className = 'speak-btn answer-speak';
      speakABtn.innerHTML = '<span class="speak-ic">🔈</span><span>Hear answer</span>';
      speakABtn.addEventListener('click', (e) => {
        e.stopPropagation();
        revealCard(true);
        const spokenAnswer = item.explain ? `${answerText}. Explanation: ${item.explain}` : answerText;
        speak(spokenAnswer, speakABtn);
      });
      toolsEl.append(speakQBtn, speakABtn);
      ansEl.append(ansLine, explainLine);

      function revealCard(force = false) {
        const wasRevealed = card.classList.contains('revealed');
        if (force) {
          if (!wasRevealed) {
            card.classList.add('revealed');
            optsEl.children[item.correctIndex].classList.add('is-correct');
            if (markSeen(key)) { addXp(3); checkSetBadge(); }
          }
          return;
        }
        card.classList.toggle('revealed');
        if (!wasRevealed) {
          optsEl.children[item.correctIndex].classList.add('is-correct');
          if (markSeen(key)) { addXp(3); checkSetBadge(); }
        }
      }

      card.append(numEl, diffTag, qEl, optsEl, ansEl, toolsEl);
      card.addEventListener('click', () => revealCard());
      frag.appendChild(card);
      num++;
    });

    setData.saq.forEach((item, i) => {
      const key = `${setKey}-saq-${i}`;
      const card = document.createElement('div');
      card.className = 'qcard';
      const numEl = document.createElement('span'); numEl.className = 'qnum'; numEl.textContent = `Question ${num}`;
      const qEl = document.createElement('div'); qEl.className = 'qtext'; qEl.textContent = item.q;
      const answerText = `The answer of this question is (${item.a})`;
      const ansEl = document.createElement('div'); ansEl.className = 'answer'; ansEl.textContent = answerText;
      const toolsEl = document.createElement('div'); toolsEl.className = 'qtools';
      const speakQBtn = document.createElement('button');
      speakQBtn.type = 'button';
      speakQBtn.className = 'speak-btn';
      speakQBtn.innerHTML = '<span class="speak-ic">🔊</span><span>Hear question</span>';
      speakQBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(item.q, speakQBtn);
      });
      const speakABtn = document.createElement('button');
      speakABtn.type = 'button';
      speakABtn.className = 'speak-btn answer-speak';
      speakABtn.innerHTML = '<span class="speak-ic">🔈</span><span>Hear answer</span>';
      speakABtn.addEventListener('click', (e) => {
        e.stopPropagation();
        revealCard(true);
        speak(answerText, speakABtn);
      });
      toolsEl.append(speakQBtn, speakABtn);

      function revealCard(force = false) {
        const wasRevealed = card.classList.contains('revealed');
        if (force) {
          if (!wasRevealed) {
            card.classList.add('revealed');
            if (markSeen(key)) { addXp(3); checkSetBadge(); }
          }
          return;
        }
        card.classList.toggle('revealed');
        if (!wasRevealed && markSeen(key)) { addXp(3); checkSetBadge(); }
      }

      card.append(numEl, qEl, ansEl, toolsEl);
      card.addEventListener('click', () => revealCard());
      frag.appendChild(card);
      num++;
    });

    container.appendChild(frag);
  }
  renderSet('set1List', SET1, 'set1');
  renderSet('set2List', SET2, 'set2');

  /* ===================== Memory Match Game ===================== */
  const memGrid = document.getElementById('memoryGrid');
  const memMeta = document.getElementById('memMeta');
  let memState = { cards: [], flippedIdx: [], moves: 0, matched: 0, lock: false };

  function buildMemoryDeck() {
    const deck = [];
    MEMORY_PAIRS.forEach((pair, pairId) => {
      deck.push({ text: pair[0], pairId, side: 'term' });
      deck.push({ text: pair[1], pairId, side: 'def' });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function renderMemory() {
    memGrid.innerHTML = '';
    memState = { cards: buildMemoryDeck(), flippedIdx: [], moves: 0, matched: 0, lock: false };
    memState.cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'mem-card hidden-text';
      el.dataset.idx = idx;
      memGrid.appendChild(el);
      el.addEventListener('click', () => onMemCardClick(idx, el));
    });
    updateMemMeta();
  }
  function updateMemMeta() { memMeta.textContent = `Moves: ${memState.moves} · Matched: ${memState.matched}/${MEMORY_PAIRS.length}`; }
  function onMemCardClick(idx, el) {
    if (memState.lock) return;
    if (el.classList.contains('matched') || el.classList.contains('flipped')) return;
    sfx.flip();
    el.classList.add('flipped'); el.classList.remove('hidden-text');
    el.textContent = memState.cards[idx].text;
    memState.flippedIdx.push(idx);
    if (memState.flippedIdx.length === 2) {
      memState.lock = true; memState.moves++; updateMemMeta();
      const [a, b] = memState.flippedIdx;
      const cardA = memState.cards[a], cardB = memState.cards[b];
      const elA = memGrid.children[a], elB = memGrid.children[b];
      const isMatch = cardA.pairId === cardB.pairId && cardA.side !== cardB.side;
      setTimeout(() => {
        if (isMatch) {
          elA.classList.add('matched'); elB.classList.add('matched');
          memState.matched++; updateMemMeta();
          sfx.match(); addXp(8);
          if (memState.matched === MEMORY_PAIRS.length) {
            addXp(15);
            if (progress.bestMemoryMoves === null || memState.moves < progress.bestMemoryMoves) {
              progress.bestMemoryMoves = memState.moves; saveProgress();
            }
            if (memState.moves <= 10) unlockBadge('memory_master');
            showToast('🧠', `Cleared in ${memState.moves} moves!`);
          }
        } else {
          sfx.wrong();
          [elA, elB].forEach(e => { e.classList.remove('flipped'); e.classList.add('hidden-text'); e.textContent = ''; });
        }
        memState.flippedIdx = []; memState.lock = false;
      }, 700);
    }
  }
  document.getElementById('memReset').addEventListener('click', renderMemory);
  renderMemory();

  /* ===================== Speed Quiz (Quick / Boss, difficulty filter, per-answer explanations) ===================== */
  const quizStage = document.getElementById('quizStage');
  const ALL_MCQ = [
    ...SET1.mcq.map(q => ({ ...q, setTag: 'Set 1' })),
    ...SET2.mcq.map(q => ({ ...q, setTag: 'Set 2' }))
  ];
  let activeDifficulty = 'all';
  let quiz = null;

  document.querySelectorAll('#difficultyRow .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeDifficulty = btn.dataset.diff;
      document.querySelectorAll('#difficultyRow .mode-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      sfx.click();
    });
  });
  document.querySelectorAll('#screen-games .mode-row .mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => startQuiz(btn.dataset.mode));
  });

  function shuffleCopy(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function startQuiz(mode) {
    sfx.click();
    const pool = activeDifficulty === 'all' ? ALL_MCQ : ALL_MCQ.filter(q => q.difficulty === activeDifficulty);
    const usePool = pool.length >= 6 ? pool : ALL_MCQ; // fall back if a filter is too narrow
    const len = mode === 'boss' ? 20 : 10;
    const seconds = mode === 'boss' ? 10 : 15;
    quiz = {
      mode, seconds,
      questions: shuffleCopy(usePool).slice(0, Math.min(len, usePool.length)),
      idx: 0, score: 0, streak: 0, bestStreak: 0, timer: null, remaining: seconds
    };
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    clearInterval(quiz.timer);
    if (quiz.idx >= quiz.questions.length) return renderQuizResults();
    const q = quiz.questions[quiz.idx];
    quiz.remaining = quiz.seconds;
    const xpPerCorrect = quiz.mode === 'boss' ? 20 : 10;

    quizStage.innerHTML = `
      <div class="quiz-meta">
        <span>${quiz.mode === 'boss' ? '👑 Boss' : '⚡ Quick'} · Q${quiz.idx + 1}/${quiz.questions.length}</span>
        <span>Score: ${quiz.score} · Streak: ${quiz.streak}</span>
      </div>
      <div class="timer-bar"><div class="timer-fill" id="timerFill"></div></div>
      <div class="qtext" style="margin-bottom:14px;">${escapeHtml(q.q)} <span style="font-size:10px;color:var(--ink-dim);font-family:'JetBrains Mono',monospace;">(${q.setTag} · ${q.difficulty})</span></div>
      <div id="quizOpts"></div>
      <div id="quizExplain" style="display:none; margin-top:12px; padding-top:12px; border-top:1px dashed var(--border); font-size:13px; color:var(--ink-dim);"></div>
    `;
    const optsWrap = document.getElementById('quizOpts');
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = `${'abcd'[i]}) ${opt}`;
      b.addEventListener('click', () => answerQuiz(i, xpPerCorrect));
      optsWrap.appendChild(b);
    });
    const fill = document.getElementById('timerFill');
    quiz.timer = setInterval(() => {
      quiz.remaining -= 0.1;
      fill.style.width = Math.max(0, (quiz.remaining / quiz.seconds) * 100) + '%';
      if (quiz.remaining <= 0) { clearInterval(quiz.timer); answerQuiz(-1, xpPerCorrect); }
    }, 100);
  }

  function answerQuiz(chosenIdx, xpPerCorrect) {
    clearInterval(quiz.timer);
    const q = quiz.questions[quiz.idx];
    const opts = document.querySelectorAll('#quizOpts .quiz-opt');
    opts.forEach((el, i) => {
      if (i === q.correctIndex) el.classList.add('correct');
      else if (i === chosenIdx) el.classList.add('wrong');
      el.style.pointerEvents = 'none';
    });
    const explainBox = document.getElementById('quizExplain');
    explainBox.style.display = 'block';
    explainBox.textContent = q.explain || '';
    const correct = chosenIdx === q.correctIndex;
    if (correct) {
      sfx.correct();
      quiz.score++; quiz.streak++; quiz.bestStreak = Math.max(quiz.bestStreak, quiz.streak);
      addXp(xpPerCorrect);
      markStreak(quiz.streak);
    } else {
      sfx.wrong();
      quiz.streak = 0;
    }
    setTimeout(() => { quiz.idx++; renderQuizQuestion(); }, 1700);
  }

  function renderQuizResults() {
    const perfect = quiz.score === quiz.questions.length;
    if (perfect) unlockBadge('perfect_quiz');
    if (quiz.mode === 'boss') { addXp(50); unlockBadge('boss_slayer'); }
    quizStage.innerHTML = `
      <div style="text-align:center; padding:20px 0;">
        <div class="neon-text" style="font-family:'Orbitron',sans-serif; font-size:28px;">${quiz.score} / ${quiz.questions.length}</div>
        <p style="color:var(--ink-dim); margin-top:8px;">Best streak: ${quiz.bestStreak}${quiz.mode === 'boss' ? ' · +50 bonus XP for finishing Boss Mode' : ''}</p>
        <div class="mode-row" style="margin-top:14px; justify-content:center;">
          <button class="mode-btn" data-mode="quick">Quick again</button>
          <button class="mode-btn boss" data-mode="boss">Boss again</button>
        </div>
      </div>
    `;
    if (perfect) { burstConfetti(); }
    quizStage.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => startQuiz(b.dataset.mode)));
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ===================== Flashcards ===================== */
  const flashStage = document.getElementById('flashStage');
  let flashDeck = [];
  let flashIdx = 0;
  let flashFlipped = false;
  let flashGotIt = 0;

  function buildFlashDeck(scope) {
    let pool = [];
    if (scope === 'set1' || scope === 'all') pool = pool.concat(SET1.saq.map(c => ({ q: c.q, a: c.a })));
    if (scope === 'set2' || scope === 'all') pool = pool.concat(SET2.saq.map(c => ({ q: c.q, a: c.a })));
    return shuffleCopy(pool);
  }

  document.querySelectorAll('#flashDeckRow .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#flashDeckRow .mode-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      startFlashcards(btn.dataset.deck);
    });
  });

  function startFlashcards(scope) {
    sfx.click();
    flashDeck = buildFlashDeck(scope);
    flashIdx = 0; flashFlipped = false; flashGotIt = 0;
    renderFlashcard();
  }

  function renderFlashcard() {
    if (flashIdx >= flashDeck.length) {
      flashStage.innerHTML = `
        <div class="game-panel">
          <div class="neon-text" style="font-family:'Orbitron',sans-serif; font-size:24px;">Deck complete!</div>
          <p style="color:var(--ink-dim); margin-top:8px;">Marked "Got it" on ${flashGotIt}/${flashDeck.length} cards.</p>
          <button class="btn btn-primary" id="flashRestart" style="margin-top:10px;">Shuffle &amp; restart</button>
        </div>`;
      document.getElementById('flashRestart').addEventListener('click', () => startFlashcards('all'));
      return;
    }
    const card = flashDeck[flashIdx];
    flashStage.innerHTML = `
      <div class="game-panel" id="flashCardEl" style="cursor:pointer; min-height:160px; display:flex; align-items:center; justify-content:center; text-align:center;">
        <div>
          <div style="font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--ink-dim); margin-bottom:10px;">Card ${flashIdx + 1} / ${flashDeck.length} · tap to flip</div>
          <div style="font-size:16px; font-weight:600;">${flashFlipped ? card.a : card.q}</div>
        </div>
      </div>
      <div class="mode-row" style="margin-top:14px;">
        <button class="mode-btn" id="flashAgain">🔁 Review again</button>
        <button class="mode-btn boss" id="flashGotIt">✅ Got it</button>
      </div>
    `;
    document.getElementById('flashCardEl').addEventListener('click', () => { flashFlipped = !flashFlipped; sfx.flip(); renderFlashcard(); });
    document.getElementById('flashAgain').addEventListener('click', () => { flashIdx++; flashFlipped = false; renderFlashcard(); });
    document.getElementById('flashGotIt').addEventListener('click', () => {
      flashGotIt++; addXp(4); flashIdx++; flashFlipped = false; renderFlashcard();
      if (flashGotIt === 15) unlockBadge('flash_streak');
    });
  }
  startFlashcards('all');

  /* ===================== Upload notes → flashcards (AI + offline fallback) ===================== */
  const uploadText = document.getElementById('uploadText');
  const uploadFile = document.getElementById('uploadFile');
  const generateFlashBtn = document.getElementById('generateFlashBtn');

  uploadFile.addEventListener('change', () => {
    const file = uploadFile.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      showToast('⚠️', 'Only .txt files can be read directly — paste the text instead.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => { uploadText.value = e.target.result.slice(0, 8000); };
    reader.readAsText(file);
  });

  // Offline fallback: turns sentences into fill-in-the-blank cards using no AI at all.
  const STOPWORDS = new Set(['the','and','that','this','with','from','have','has','are','was','were','for','their','its','into','also','than','then','which','these','those','about','such','being','can','will','would','could','should','more','most','some','other','only','very','they','them','when','what','where','while','because']);
  function offlineFlashcardsFromText(text) {
    const sentences = text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 220);
    const cards = [];
    for (const sentence of sentences) {
      const words = sentence.match(/[A-Za-z][A-Za-z'-]{4,}/g) || [];
      const candidates = words.filter(w => !STOPWORDS.has(w.toLowerCase()));
      if (candidates.length === 0) continue;
      const target = candidates.reduce((a, b) => (b.length > a.length ? b : a));
      const blanked = sentence.replace(new RegExp(`\\b${target}\\b`), 'ـ'.repeat(1) + '_____');
      cards.push({ q: `Fill in the blank: ${blanked}`, a: target });
      if (cards.length >= 10) break;
    }
    return cards;
  }

  generateFlashBtn.addEventListener('click', async () => {
    const text = uploadText.value.trim();
    if (text.length < 20) { showToast('⚠️', 'Add a bit more text first — at least a few sentences.'); return; }
    sfx.click();
    generateFlashBtn.disabled = true;
    generateFlashBtn.textContent = 'Generating...';
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      if (data && Array.isArray(data.cards) && data.cards.length > 0) {
        flashDeck = data.cards; flashIdx = 0; flashFlipped = false; flashGotIt = 0;
        renderFlashcard();
        showToast('✨', `Generated ${data.cards.length} flashcards via ${data.provider}`);
      } else {
        throw new Error('no cards');
      }
    } catch (err) {
      const offline = offlineFlashcardsFromText(text);
      if (offline.length === 0) {
        showToast('⚠️', 'Could not generate cards from that text — try adding more complete sentences.');
      } else {
        flashDeck = offline; flashIdx = 0; flashFlipped = false; flashGotIt = 0;
        renderFlashcard();
        showToast('🗂️', `Generated ${offline.length} fill-in-the-blank cards offline`);
      }
    } finally {
      generateFlashBtn.disabled = false;
      generateFlashBtn.textContent = 'Generate flashcards';
    }
  });

  /* ===================== Virtual Microscope ===================== */
  const specimenPicker = document.getElementById('specimenPicker');
  const scopeView = document.getElementById('scopeView');
  const scopeName = document.getElementById('scopeName');
  const scopeFact = document.getElementById('scopeFact');
  const scopeFocusReadout = document.getElementById('scopeFocusReadout');
  const coarseFocus = document.getElementById('coarseFocus');
  const fineFocus = document.getElementById('fineFocus');
  let currentSpecimen = null;
  let zoomTier = 0;
  let focusTarget = 0;
  let focusedAwarded = new Set();
  let focusedCount = 0;

  MICROSCOPE_SPECIMENS.forEach(spec => {
    const b = document.createElement('button');
    b.className = 'mode-btn';
    b.style.flex = '0 1 auto';
    b.textContent = spec.name;
    b.addEventListener('click', () => loadSpecimen(spec, b));
    specimenPicker.appendChild(b);
  });

  document.querySelectorAll('#zoomRow .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      zoomTier = parseInt(btn.dataset.tier, 10);
      document.querySelectorAll('#zoomRow .mode-btn').forEach(b => b.classList.toggle('is-active', b === btn));
      sfx.click();
      renderScope();
    });
  });

  function loadSpecimen(spec, btnEl) {
    sfx.click();
    currentSpecimen = spec;
    focusTarget = (Math.random() * 16 - 8); // need coarse+fine to cancel this out
    coarseFocus.value = 0; fineFocus.value = 0;
    zoomTier = 0;
    document.querySelectorAll('#zoomRow .mode-btn').forEach((b, i) => b.classList.toggle('is-active', i === 0));
    document.querySelectorAll('#specimenPicker .mode-btn').forEach(b => b.classList.toggle('is-active', b === btnEl));
    scopeName.textContent = spec.name + ` (${spec.category})`;
    renderScope();
  }

  function svgFor(spec, tier, blurPx) {
    const [c1, c2] = spec.palette;
    let shapeSvg = '';
    const cx = 130, cy = 130;
    switch (spec.shape) {
      case 'round': shapeSvg = `<circle cx="${cx}" cy="${cy}" r="90" fill="${c1}" stroke="${c2}" stroke-width="5"/>`; break;
      case 'oval': shapeSvg = `<ellipse cx="${cx}" cy="${cy}" rx="100" ry="65" fill="${c1}" stroke="${c2}" stroke-width="5"/>`; break;
      case 'rod': shapeSvg = `<rect x="40" y="100" width="180" height="60" rx="30" fill="${c1}" stroke="${c2}" stroke-width="5"/>`; break;
      case 'stripedrod': shapeSvg = `<rect x="20" y="105" width="220" height="50" rx="20" fill="${c1}" stroke="${c2}" stroke-width="5"/>` +
        Array.from({length:8},(_,i)=>`<line x1="${40+i*25}" y1="105" x2="${40+i*25}" y2="155" stroke="${c2}" stroke-width="3"/>`).join(''); break;
      case 'rectangle': shapeSvg = `<rect x="45" y="45" width="170" height="170" fill="${c1}" stroke="${c2}" stroke-width="6"/>`; break;
      case 'irregular': shapeSvg = `<path d="M70,90 Q40,130 70,170 Q110,200 150,180 Q210,190 200,140 Q220,90 170,70 Q120,40 70,90Z" fill="${c1}" stroke="${c2}" stroke-width="5"/>`; break;
      case 'tube': shapeSvg = `<rect x="100" y="20" width="60" height="220" rx="28" fill="${c1}" stroke="${c2}" stroke-width="5"/>`; break;
      case 'star': shapeSvg = `<circle cx="${cx}" cy="${cy}" r="48" fill="${c1}" stroke="${c2}" stroke-width="5"/>` +
        Array.from({length:6},(_,i)=>{const a=i*Math.PI/3; return `<line x1="${cx+Math.cos(a)*48}" y1="${cy+Math.sin(a)*48}" x2="${cx+Math.cos(a)*115}" y2="${cy+Math.sin(a)*115}" stroke="${c1}" stroke-width="8" stroke-linecap="round"/>`;}).join(''); break;
      case 'kidneypair': shapeSvg = `<ellipse cx="95" cy="130" rx="55" ry="32" fill="${c1}" stroke="${c2}" stroke-width="5"/><ellipse cx="165" cy="130" rx="55" ry="32" fill="${c1}" stroke="${c2}" stroke-width="5"/>`; break;
      case 'hexpack': {
        const hex=(x,y,s)=>{let pts=[];for(let i=0;i<6;i++){const a=Math.PI/3*i;pts.push(`${x+s*Math.cos(a)},${y+s*Math.sin(a)}`);}return `<polygon points="${pts.join(' ')}" fill="${c1}" stroke="${c2}" stroke-width="4"/>`;};
        shapeSvg = [[70,80],[150,80],[110,150],[190,150],[70,220],[150,220]].map(([x,y])=>hex(x,y,45)).join(''); break;
      }
      default: shapeSvg = `<circle cx="${cx}" cy="${cy}" r="90" fill="${c1}" stroke="${c2}" stroke-width="5"/>`;
    }

    let wallSvg = '';
    if (spec.hasWall && tier === 0) {
      wallSvg = `<rect x="20" y="20" width="220" height="220" fill="none" stroke="#1a1d33" stroke-width="2" stroke-dasharray="4 3" opacity="0.4"/>`;
    }

    let nucleusSvg = '';
    if (spec.hasNucleus) {
      const r = tier === 0 ? 22 : tier === 1 ? 30 : 38;
      nucleusSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1a1d33" opacity="0.85"/><circle cx="${cx}" cy="${cy}" r="${r * 0.4}" fill="#000" opacity="0.5"/>`;
    }

    let decoSvg = '';
    spec.organelles.forEach((org, i) => {
      if (org.minTier > tier) return;
      const angle = (i / spec.organelles.length) * Math.PI * 2;
      const ox = cx + Math.cos(angle) * 60, oy = cy + Math.sin(angle) * 60;
      if (org.type === 'dot') decoSvg += `<circle cx="${ox}" cy="${oy}" r="6" fill="#fff" opacity="0.6"/>`;
      if (org.type === 'vacuole') decoSvg += `<ellipse cx="${ox}" cy="${oy}" rx="26" ry="20" fill="#ffffff" opacity="0.25" stroke="#fff" stroke-width="1.5"/>`;
      if (org.type === 'chloroplast') decoSvg += `<ellipse cx="${ox}" cy="${oy}" rx="14" ry="9" fill="#2f7a2c" opacity="0.7"/>`;
      if (org.type === 'cilia') decoSvg += Array.from({length:10},(_,j)=>{const a=j/10*Math.PI*2; return `<line x1="${cx+Math.cos(a)*100}" y1="${cy+Math.sin(a)*100}" x2="${cx+Math.cos(a)*118}" y2="${cy+Math.sin(a)*118}" stroke="#fff" stroke-width="2" opacity="0.5"/>`;}).join('');
      if (org.type === 'bud') decoSvg += `<circle cx="${cx+85}" cy="${cy+60}" r="28" fill="${spec.palette[0]}" stroke="${spec.palette[1]}" stroke-width="4"/>`;
      if (org.type === 'ring') decoSvg += `<circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="${spec.palette[1]}" stroke-width="10" opacity="0.5"/>`;
    });

    return `<svg viewBox="0 0 260 260" width="100%" height="100%" style="filter:blur(${blurPx}px); transition:filter 0.15s ease;">
      <rect width="260" height="260" fill="#04060a"/>
      ${wallSvg}${shapeSvg}${nucleusSvg}${decoSvg}
    </svg>`;
  }

  function renderScope() {
    if (!currentSpecimen) return;
    const coarse = parseFloat(coarseFocus.value);
    const fine = parseFloat(fineFocus.value);
    const defocus = focusTarget + coarse + fine; // need to drive this to ~0
    const blur = Math.min(14, Math.abs(defocus) * 1.1);
    scopeView.innerHTML = svgFor(currentSpecimen, zoomTier, blur);
    const inFocus = Math.abs(defocus) < 0.6;
    scopeFocusReadout.textContent = inFocus ? '🟢 In focus' : (Math.abs(defocus) < 3 ? '🟡 Almost there' : '🔴 Out of focus');
    if (inFocus) {
      scopeFact.textContent = currentSpecimen.fact;
      const focusKey = currentSpecimen.id + '-' + zoomTier;
      if (!focusedAwarded.has(focusKey)) {
        focusedAwarded.add(focusKey);
        focusedCount++;
        addXp(6);
        sfx.focus();
        if (focusedCount >= 5) unlockBadge('microscopist');
      }
    } else {
      scopeFact.textContent = 'Turn the coarse and fine adjustment knobs until the image sharpens.';
    }
  }
  [coarseFocus, fineFocus].forEach(el => el.addEventListener('input', renderScope));

  /* ===================== Reference table ===================== */
  const refBody = document.getElementById('refTableBody');
  PROK_EUK_TABLE.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:10px; border-bottom:1px solid var(--border); font-weight:600;">${row.feature}</td>
      <td style="padding:10px; border-bottom:1px solid var(--border); color:var(--ink-dim);">${row.prokaryotic}</td>
      <td style="padding:10px; border-bottom:1px solid var(--border); color:var(--ink-dim);">${row.eukaryotic}</td>
    `;
    refBody.appendChild(tr);
  });

  /* ===================== Notes (local-only "upload" feature) ===================== */
  const noteInput = document.getElementById('noteInput');
  const notesList = document.getElementById('notesList');
  document.getElementById('addNoteBtn').addEventListener('click', () => {
    const text = noteInput.value.trim();
    if (!text) return;
    if (text.length > 1000) { showToast('⚠️', 'Notes are capped at 1000 characters.'); return; }
    progress.notes.unshift({ text, date: new Date().toLocaleDateString() });
    saveProgress();
    noteInput.value = '';
    sfx.click();
    renderNotes();
  });
  function renderNotes() {
    notesList.innerHTML = '';
    if (progress.notes.length === 0) {
      notesList.innerHTML = '<p style="color:var(--ink-dim); font-size:13px;">No notes yet — add one above.</p>';
      return;
    }
    progress.notes.forEach((n, i) => {
      const card = document.createElement('div');
      card.className = 'qcard';
      card.style.cursor = 'default';
      const del = document.createElement('button');
      del.textContent = '✕ Delete';
      del.style.cssText = 'float:right; background:none; border:none; color:var(--magenta); font-family:JetBrains Mono,monospace; font-size:11px; cursor:pointer;';
      del.addEventListener('click', e => { e.stopPropagation(); progress.notes.splice(i, 1); saveProgress(); renderNotes(); });
      const dateTag = document.createElement('span'); dateTag.className = 'qnum'; dateTag.textContent = n.date;
      const txt = document.createElement('div'); txt.className = 'qtext'; txt.style.fontWeight = '400'; txt.textContent = n.text;
      card.append(del, dateTag, txt);
      notesList.appendChild(card);
    });
  }

  /* ===================== Sound toggle ===================== */
  const soundToggle = document.getElementById('soundToggle');
  function syncSoundButton() { soundToggle.textContent = soundOn ? '🔊' : '🔇'; }
  syncSoundButton();
  soundToggle.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem('g3_sound', soundOn ? 'on' : 'off'); } catch {}
    syncSoundButton();
    if (soundOn) sfx.click();
  });

  /* ===================== Chatbot ===================== */
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  let chatHistory = [];
  let chatBusy = false;

  chatFab.addEventListener('click', () => {
    chatPanel.classList.toggle('open');
    sfx.click();
    if (chatPanel.classList.contains('open') && chatBody.children.length === 0) {
      addMsg('bot', "Hi! I'm your study buddy for the cell biology question bank. Ask me about osmosis, the cell wall, membranes, or anything from Set 1 / Set 2.", null);
    }
  });

  function addMsg(role, text, provider) {
    const wrap = document.createElement('div');
    const el = document.createElement('div');
    el.className = `msg ${role}`;
    el.textContent = text;
    wrap.appendChild(el);
    if (role === 'bot' && provider) {
      const tag = document.createElement('span');
      tag.className = `provider-tag ${provider}`;
      tag.textContent = provider === 'local' ? 'offline · question-bank search' : `via ${provider}`;
      wrap.appendChild(tag);
    }
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.id = 'typingIndicator';
    wrap.className = 'msg bot';
    wrap.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    chatBody.appendChild(wrap);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function hideTyping() { document.getElementById('typingIndicator')?.remove(); }

  const OFFLINE_GLOSSARY = [
    {
      term: 'Plasma membrane / cell membrane',
      keywords: ['cell membrane', 'plasma membrane', 'fluid-mosaic model'],
      answer: 'The plasma membrane is the thin boundary around the cell. It is described by the fluid-mosaic model because phospholipids and proteins can move within it, and it is selectively permeable so it controls what enters and leaves the cell.'
    },
    {
      term: 'Phospholipid bilayer',
      keywords: ['bilayer', 'hydrophilic heads', 'hydrophobic tails'],
      answer: 'The membrane is made of two layers of phospholipids. Their hydrophilic heads face water, while the hydrophobic tails point inward away from water, forming a barrier that helps the membrane work properly.'
    },
    {
      term: 'Membrane proteins',
      keywords: ['channel proteins', 'carrier proteins', 'gatekeepers'],
      answer: 'Membrane proteins help move substances across the membrane and allow cell communication. Some act like channels or carriers, while others function as receptors or enzymes.'
    },
    {
      term: 'Selective permeability',
      keywords: ['selectively permeable', 'semipermeable'],
      answer: 'Selective permeability means the membrane allows some substances to pass through more easily than others. Small non-polar molecules move through more freely, while larger or charged substances often need proteins.'
    },
    {
      term: 'Diffusion',
      keywords: ['movement of particles', 'concentration gradient', 'passive transport'],
      answer: 'Diffusion is the net movement of particles from a region of higher concentration to a region of lower concentration. It does not require energy and is one form of passive transport.'
    },
    {
      term: 'Osmosis',
      keywords: ['water movement', 'water moving', 'selectively permeable membrane'],
      answer: 'Osmosis is the movement of water molecules across a selectively permeable membrane from a region of higher water concentration to lower water concentration. It is the specific form of diffusion for water.'
    },
    {
      term: 'Active transport',
      keywords: ['energy', 'ATP', 'against concentration gradient'],
      answer: 'Active transport moves substances from lower concentration to higher concentration, so it goes against the concentration gradient. It requires energy, usually from ATP, and often uses membrane proteins.'
    },
    {
      term: 'Passive transport',
      keywords: ['diffusion', 'osmosis', 'no energy'],
      answer: 'Passive transport is movement across a membrane without using cellular energy. Diffusion and osmosis are examples of passive transport.'
    },
    {
      term: 'Concentration gradient',
      keywords: ['gradient', 'higher concentration', 'lower concentration'],
      answer: 'A concentration gradient is the difference in concentration between two regions. Many transport processes, especially diffusion and active transport, are described in terms of this difference.'
    },
    {
      term: 'Hypotonic solution',
      keywords: ['swell', 'burst', 'turgid'],
      answer: 'A hypotonic solution has a lower solute concentration than the cell, so water tends to move into the cell by osmosis. Animal cells may swell, and plant cells become turgid.'
    },
    {
      term: 'Hypertonic solution',
      keywords: ['shrink', 'shrivel', 'plasmolysis'],
      answer: 'A hypertonic solution has a higher solute concentration than the cell, so water moves out of the cell by osmosis. Plant cells may undergo plasmolysis, and animal cells can shrink.'
    },
    {
      term: 'Isotonic solution',
      keywords: ['same concentration', 'equal concentration'],
      answer: 'An isotonic solution has about the same solute concentration as the cell. Water still moves in both directions, but there is no overall net movement.'
    },
    {
      term: 'Plasmolysis',
      keywords: ['shrink away from wall', 'hypertonic', 'loss of water'],
      answer: 'Plasmolysis is the shrinkage of the cell contents away from the cell wall when a plant cell loses water in a hypertonic solution. The rigid wall remains in place while the membrane pulls away from it.'
    },
    {
      term: 'Turgor / turgidity',
      keywords: ['turgid', 'firm', 'water pressure'],
      answer: 'Turgor, or turgidity, is the pressure of water pushing the cell membrane against the cell wall. It makes plant cells firm and helps support the plant.'
    },
    {
      term: 'Plant cell wall',
      keywords: ['cellulose', 'rigid', 'permeable'],
      answer: 'The plant cell wall is a rigid outer layer outside the plasma membrane. It is made mainly of cellulose, gives the cell shape and support, and is freely permeable to many small substances.'
    },
    {
      term: 'Cellulose',
      keywords: ['plant wall', 'structural polysaccharide'],
      answer: 'Cellulose is the main structural polysaccharide in plant cell walls. Its long fibers give the wall strength and rigidity.'
    },
    {
      term: 'Prokaryote vs eukaryote',
      keywords: ['prokaryotic', 'eukaryotic', 'nucleus', 'bacteria'],
      answer: 'Prokaryotes do not have a nucleus or membrane-bound organelles, while eukaryotes do. Bacteria are prokaryotic; plant and animal cells are eukaryotic.'
    },
    {
      term: 'Nanometre scale',
      keywords: ['nanometre', 'nanometer', '1 nm', '0.000001 mm'],
      answer: '1 nanometre equals 0.000001 mm, which is 1 × 10^-6 millimetres. The plasma membrane is only about 7–10 nm thick, so it needs an electron microscope to be seen clearly.'
    },
    {
      term: 'Endocytosis',
      keywords: ['vesicle', 'bringing materials in'],
      answer: 'Endocytosis is the process by which a cell brings substances into the cell by folding the membrane inward to form a vesicle.'
    },
    {
      term: 'Exocytosis',
      keywords: ['vesicle', 'sending materials out'],
      answer: 'Exocytosis is the process by which a cell releases substances outside the cell when vesicles fuse with the plasma membrane.'
    }
  ];

  const OFFLINE_STOPWORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'give', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on', 'or', 'please', 'the', 'their', 'them', 'these', 'this', 'to', 'what', 'when', 'where', 'which', 'why', 'with', 'you', 'your'
  ]);
  const OFFLINE_SYNONYM_RULES = [
    { pattern: /\bcell membrane\b/, terms: ['plasma membrane', 'selective permeability'] },
    { pattern: /\bplasma membrane\b/, terms: ['cell membrane', 'selective permeability'] },
    { pattern: /\bfluid mosaic\b/, terms: ['fluid-mosaic model', 'membrane proteins', 'phospholipid bilayer'] },
    { pattern: /\bselectively permeable\b/, terms: ['semipermeable', 'selective permeability'] },
    { pattern: /\bsemipermeable\b/, terms: ['selectively permeable', 'selective permeability'] },
    { pattern: /\bwater movement\b/, terms: ['osmosis'] },
    { pattern: /\bwater moving\b/, terms: ['osmosis'] },
    { pattern: /\bwater moves\b/, terms: ['osmosis'] },
    { pattern: /\bwater diffusion\b/, terms: ['osmosis'] },
    { pattern: /\bosmotic\b/, terms: ['osmosis'] },
    { pattern: /\bshrink\b/, terms: ['hypertonic', 'plasmolysis'] },
    { pattern: /\bshrivel\b/, terms: ['hypertonic', 'plasmolysis'] },
    { pattern: /\bplasmoly(?:sis|se)\b/, terms: ['plasmolysis', 'hypertonic'] },
    { pattern: /\bswell\b/, terms: ['hypotonic', 'turgor', 'turgidity'] },
    { pattern: /\bburst\b/, terms: ['hypotonic', 'turgor', 'turgidity'] },
    { pattern: /\bturgid\b/, terms: ['turgor', 'turgidity', 'hypotonic'] },
    { pattern: /\bconcentration gradient\b/, terms: ['gradient', 'diffusion', 'active transport'] },
    { pattern: /\bactive transport\b/, terms: ['energy', 'atp'] },
    { pattern: /\bpassive transport\b/, terms: ['diffusion', 'osmosis', 'no energy'] },
    { pattern: /\bcell wall\b/, terms: ['cellulose', 'plant cell wall'] },
    { pattern: /\bnanomet(?:re|er)\b/, terms: ['nanometre', '1 nm', '0.000001 mm'] },
    { pattern: /\bnm\b/, terms: ['nanometre'] },
    { pattern: /\bendocytosis\b/, terms: ['vesicle', 'bring in'] },
    { pattern: /\bexocytosis\b/, terms: ['vesicle', 'release', 'send out'] },
    { pattern: /\bprokaryot(?:e|ic)\b/, terms: ['prokaryote', 'prokaryotic', 'nucleus'] },
    { pattern: /\beukaryot(?:e|ic)\b/, terms: ['eukaryote', 'eukaryotic', 'nucleus'] }
  ];
  let offlineKb = null;

  function normalizeOfflineText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\bnanometer(?:s)?\b/g, 'nanometre')
      .replace(/\bmicrometre(?:s)?\b/g, 'micrometre')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenizeOfflineText(text) {
    const normalized = normalizeOfflineText(text);
    if (!normalized) return [];
    return normalized.split(' ').filter(tok => tok && tok.length > 1 && !OFFLINE_STOPWORDS.has(tok));
  }

  function expandOfflineQuery(message) {
    const normalized = normalizeOfflineText(message);
    const tokens = new Set(tokenizeOfflineText(normalized));
    for (const rule of OFFLINE_SYNONYM_RULES) {
      if (rule.pattern.test(normalized)) {
        rule.terms.forEach(term => tokenizeOfflineText(term).forEach(tok => tokens.add(tok)));
      }
    }
    return { text: normalized, tokens: [...tokens] };
  }

  function tokenSimilarity(queryToken, entryToken) {
    if (!queryToken || !entryToken) return 0;
    if (queryToken === entryToken) return 1;
    if (queryToken.length >= 3 && entryToken.length >= 3) {
      if (entryToken.startsWith(queryToken) || queryToken.startsWith(entryToken)) return 0.85;
      if (entryToken.includes(queryToken) || queryToken.includes(entryToken)) return 0.55;
      if (entryToken.slice(0, 3) === queryToken.slice(0, 3)) return 0.4;
    }
    return 0;
  }

  function scoreField(queryTokens, fieldTokens, weight) {
    if (!fieldTokens.length || !queryTokens.length) return 0;
    let total = 0;
    for (const queryToken of queryTokens) {
      let best = 0;
      for (const fieldToken of fieldTokens) {
        const match = tokenSimilarity(queryToken, fieldToken);
        if (match > best) best = match;
        if (best === 1) break;
      }
      total += best * weight;
    }
    return total;
  }

  function buildOfflineKb() {
    if (offlineKb) return offlineKb;
    const entries = [];
    const pushEntry = entry => entries.push(entry);

    OFFLINE_GLOSSARY.forEach((item, index) => {
      const termText = normalizeOfflineText(item.term);
      const keywordText = normalizeOfflineText(item.keywords.join(' '));
      const answerText = normalizeOfflineText(item.answer);
      pushEntry({
        id: `glossary-${index}`,
        type: 'glossary',
        title: item.term,
        display: `${item.term}: ${item.answer}`,
        searchText: normalizeOfflineText([item.term, ...item.keywords, item.answer].join(' ')),
        termText,
        keywordTexts: item.keywords.map(normalizeOfflineText),
        questionTokens: tokenizeOfflineText(item.term),
        keywordTokens: tokenizeOfflineText(keywordText),
        answerTokens: tokenizeOfflineText(answerText),
        explainTokens: [],
        sourceLabel: 'Glossary'
      });
    });

    [
      { source: 'Set 1', set: SET1 },
      { source: 'Set 2', set: SET2 }
    ].forEach(({ source, set }) => {
      set.mcq.forEach((item, index) => {
        const correctLetter = 'abcd'[item.correctIndex];
        const correctText = item.options[item.correctIndex];
        const answer = `(${correctLetter}) ${correctText}${item.explain ? ` — ${item.explain}` : ''}`;
        const searchText = normalizeOfflineText([item.q, ...item.options, correctText, item.explain || '', source].join(' '));
        pushEntry({
          id: `${source.toLowerCase().replace(/\s+/g, '-')}-mcq-${index}`,
          type: 'mcq',
          title: item.q,
          display: `From the question bank:\n"${item.q}"\n→ ${answer}`,
          searchText,
          termText: '',
          keywordTexts: item.options.map(normalizeOfflineText),
          questionTokens: tokenizeOfflineText([item.q, ...item.options, source].join(' ')),
          keywordTokens: tokenizeOfflineText(item.options.join(' ')),
          answerTokens: tokenizeOfflineText(answer),
          explainTokens: tokenizeOfflineText(item.explain || ''),
          sourceLabel: source
        });
      });

      set.saq.forEach((item, index) => {
        const answer = item.a;
        const searchText = normalizeOfflineText([item.q, item.a, source].join(' '));
        pushEntry({
          id: `${source.toLowerCase().replace(/\s+/g, '-')}-saq-${index}`,
          type: 'saq',
          title: item.q,
          display: `From the question bank:\n"${item.q}"\n→ ${answer}`,
          searchText,
          termText: '',
          keywordTexts: [],
          questionTokens: tokenizeOfflineText([item.q, source].join(' ')),
          keywordTokens: [],
          answerTokens: tokenizeOfflineText(answer),
          explainTokens: [],
          sourceLabel: source
        });
      });
    });

    offlineKb = entries;
    return entries;
  }

  function scoreOfflineEntry(entry, query) {
    let score = 0;
    const queryText = query.text;
    const queryTokens = query.tokens;

    if (entry.termText && queryText.includes(entry.termText)) {
      score += entry.type === 'glossary' ? 18 : 10;
    }
    for (const keywordText of entry.keywordTexts || []) {
      if (keywordText && queryText.includes(keywordText)) {
        score += entry.type === 'glossary' ? 9 : 5;
      }
    }

    score += scoreField(queryTokens, entry.questionTokens, entry.type === 'glossary' ? 12 : 8);
    score += scoreField(queryTokens, entry.keywordTokens, entry.type === 'glossary' ? 10 : 6);
    score += scoreField(queryTokens, entry.answerTokens, entry.type === 'glossary' ? 7 : 6);
    score += scoreField(queryTokens, entry.explainTokens, entry.type === 'glossary' ? 5 : 5);

    if (query.definitionMode && entry.type === 'glossary') score *= 1.25;
    if (query.definitionMode && entry.type !== 'glossary') score *= 0.92;

    if (entry.type === 'glossary' && score > 0) {
      const termHits = queryTokens.filter(qt => (entry.questionTokens || []).some(et => tokenSimilarity(qt, et) > 0)).length;
      score += Math.min(6, termHits * 1.5);
    }

    return score;
  }

  function formatOfflineEntry(entry) {
    return entry.display || entry.answer || entry.title || 'I found a possible match, but I could not format it cleanly.';
  }

  function localAnswer(message) {
    const query = expandOfflineQuery(message);
    const kb = buildOfflineKb();
    if (query.tokens.length === 0) {
      const examples = OFFLINE_GLOSSARY.slice(0, 5).map(item => item.term.toLowerCase()).join(', ');
      return `Try asking about topics like ${examples}, or ask "What is osmosis?"`;
    }

    query.definitionMode = /\b(define|definition|what is|what's|whats|explain|describe|meaning of)\b/.test(query.text);

    const ranked = kb
      .map(entry => ({ entry, score: scoreOfflineEntry(entry, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
      const examples = OFFLINE_GLOSSARY.slice(0, 5).map(item => item.term.toLowerCase()).join(', ');
      return `I couldn't find a confident offline match, but I can help with ${examples}. Try asking about diffusion, osmosis, the cell wall, or plasmolysis.`;
    }

    const top = ranked[0];
    const second = ranked[1];
    const third = ranked[2];
    const clearWinner = !second || top.score >= Math.max(9, second.score * 1.35) || (top.entry.type === 'glossary' && top.score >= second.score * 1.18 && top.score >= 12);

    if (clearWinner) {
      return formatOfflineEntry(top.entry);
    }

    const near = ranked.filter(item => item.score >= top.score * 0.72).slice(0, 3);
    if (near.length <= 1) return formatOfflineEntry(top.entry);

    const sections = near.map((item, index) => {
      const body = formatOfflineEntry(item.entry);
      return near.length > 1 ? `${index + 1}. ${body}` : body;
    });
    return `Here are the closest matches:\n${sections.join('\n\n')}`;
  }

  async function sendChat() {
    const text = chatInput.value.trim();
    if (!text || chatBusy) return;
    if (text.length > 300) { addMsg('bot', "That message is a bit long — try keeping it under 300 characters.", null); return; }
    addMsg('user', text, null);
    chatInput.value = '';
    chatBusy = true; chatSend.disabled = true;
    chatHistory.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory.slice(-6) })
      });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      hideTyping();
      if (data && data.reply) {
        addMsg('bot', data.reply, data.provider || 'ai');
        chatHistory.push({ role: 'assistant', content: data.reply });
      } else {
        throw new Error('no reply');
      }
    } catch (err) {
      hideTyping();
      addMsg('bot', localAnswer(text), 'local');
    } finally {
      chatBusy = false; chatSend.disabled = false;
    }
  }
  chatSend.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  /* ===================== Init ===================== */
  refreshXpUI();
})();
