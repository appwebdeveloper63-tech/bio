(() => {
  "use strict";

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeSpeech = { btn: null, utterance: null, session: 0 };
  let speechVoices = [];
  const speechPrefs = { rate: 1, voiceURI: '' };

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function refreshSpeechPrefsFromProgress() {
    speechPrefs.rate = clamp(Number(progress.speechRate ?? 1) || 1, 0.5, 1.5);
    speechPrefs.voiceURI = progress.voiceURI || '';
  }

  function getSpeechVoice() {
    return speechVoices.find(v => v.voiceURI === speechPrefs.voiceURI) || null;
  }

  function createSpeechUtterance(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = speechPrefs.rate;
    utterance.pitch = 1;
    const voice = getSpeechVoice();
    if (voice) utterance.voice = voice;
    return utterance;
  }

  function stopSpeech() {
    activeSpeech.session++;
    try { window.speechSynthesis.cancel(); } catch {}
    if (activeSpeech.btn) {
      activeSpeech.btn.classList.remove('speaking');
      activeSpeech.btn.classList.remove('active');
    }
    activeSpeech = { btn: null, utterance: null, session: activeSpeech.session };
  }

  function speak(text, btnEl) {
    if (!('speechSynthesis' in window) || !text) return;
    if (btnEl && btnEl.classList.contains('speaking') && activeSpeech.btn === btnEl) {
      stopSpeech();
      return;
    }
    stopSpeech();

    const session = activeSpeech.session;
    const utterance = createSpeechUtterance(text);
    activeSpeech = { btn: btnEl || null, utterance, session };
    utterance.onstart = () => {
      if (activeSpeech.session === session && btnEl) btnEl.classList.add('speaking');
    };
    utterance.onend = () => {
      if (activeSpeech.session === session) {
        if (btnEl) btnEl.classList.remove('speaking');
        activeSpeech = { btn: null, utterance: null, session };
      }
    };
    utterance.onerror = () => {
      if (activeSpeech.session === session) {
        if (btnEl) btnEl.classList.remove('speaking');
        activeSpeech = { btn: null, utterance: null, session };
      }
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      if (btnEl) btnEl.classList.remove('speaking');
      activeSpeech = { btn: null, utterance: null, session };
    }
  }

  function speakQueue(lines, btnEl, onDone) {
    if (!('speechSynthesis' in window) || !lines.length) return;
    stopSpeech();
    const session = activeSpeech.session;
    let idx = 0;
    const step = () => {
      if (activeSpeech.session !== session) return;
      if (idx >= lines.length) {
        if (btnEl) {
          btnEl.classList.remove('speaking');
          btnEl.classList.remove('active');
        }
        if (typeof onDone === 'function') onDone();
        activeSpeech = { btn: null, utterance: null, session };
        return;
      }
      const utterance = createSpeechUtterance(lines[idx]);
      activeSpeech = { btn: btnEl || null, utterance, session };
      utterance.onstart = () => {
        if (activeSpeech.session === session && btnEl) btnEl.classList.add('speaking');
      };
      utterance.onend = () => {
        if (activeSpeech.session !== session) return;
        idx += 1;
        step();
      };
      utterance.onerror = () => {
        if (activeSpeech.session !== session) return;
        idx += 1;
        step();
      };
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        idx += 1;
        step();
      }
    };
    step();
  }

  /* ===================== Storage (localStorage — this is a real deployed site, not a Claude artifact, so this is safe & appropriate) ===================== */
  const STORE_KEY = 'g3_progress_v1';
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) throw new Error('none');
      const parsed = JSON.parse(raw) || {};
      return {
        xp: 0,
        badges: [],
        seenQuestions: [],
        bestMemoryMoves: null,
        maxStreak: 0,
        notes: [],
        flashStats: { gotIt: 0 },
        favorites: [],
        theme: 'dark',
        speechRate: 1,
        voiceURI: '',
        quizBest: {},
        gameBest: {},
        gamesPlayed: 0,
        dailyStreak: 0,
        lastVisit: '',
        setDone: {},
        ...parsed,
        badges: Array.isArray(parsed.badges) ? parsed.badges : [],
        seenQuestions: Array.isArray(parsed.seenQuestions) ? parsed.seenQuestions : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        flashStats: parsed.flashStats && typeof parsed.flashStats === 'object' ? parsed.flashStats : { gotIt: 0 },
        quizBest: parsed.quizBest && typeof parsed.quizBest === 'object' ? parsed.quizBest : {},
        gameBest: parsed.gameBest && typeof parsed.gameBest === 'object' ? parsed.gameBest : {},
        gamesPlayed: Number.isFinite(parsed.gamesPlayed) ? parsed.gamesPlayed : 0,
        setDone: parsed.setDone && typeof parsed.setDone === 'object' ? parsed.setDone : {}
      };
    } catch {
      return { xp: 0, badges: [], seenQuestions: [], bestMemoryMoves: null, maxStreak: 0, notes: [], flashStats: { gotIt: 0 }, favorites: [], theme: 'dark', speechRate: 1, voiceURI: '', quizBest: {}, gameBest: {}, gamesPlayed: 0, dailyStreak: 0, lastVisit: '', setDone: {} };
    }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch { /* storage unavailable — fail silently, XP just won't persist */ }
  }
  let progress = loadProgress();
  refreshSpeechPrefsFromProgress();

  function normalizeThemeName(theme) {
    return theme === 'light' || theme === 'aurora' ? theme : 'dark';
  }

  function applyTheme(theme, persist = false) {
    const next = normalizeThemeName(theme);
    if (next === 'dark') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    progress.theme = next;
    if (persist) saveProgress();
    updateThemeButtons();
  }

  applyTheme(progress.theme || 'dark', false);

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

  function updateStats() {
    refreshXpUI();
  }

  function recordGameResult(gameId, score, higherIsBetter = true) {
    progress.gameBest = progress.gameBest && typeof progress.gameBest === 'object' ? progress.gameBest : {};
    progress.gamesPlayed = Number(progress.gamesPlayed || 0) + 1;
    const current = Number(progress.gameBest[gameId]);
    const next = Number(score) || 0;
    const isNewBest = !Number.isFinite(current) || (higherIsBetter ? next > current : next < current);
    if (isNewBest) {
      progress.gameBest[gameId] = next;
      saveProgress();
      updateStats();
      showToast('🏅', `New best in ${gameId.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ')}!`);
      burstConfetti();
    } else {
      saveProgress();
      updateStats();
    }
    return isNewBest;
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
      const bestQuiz = Math.max(Number(progress.quizBest?.quick || 0), Number(progress.quizBest?.boss || 0));
      statsGrid.innerHTML = '';
      [
        ['Total XP', progress.xp],
        ['Best streak', progress.maxStreak],
        ['Daily streak', `${progress.dailyStreak || 0} day${(progress.dailyStreak || 0) === 1 ? '' : 's'}`],
        ['Best quiz score', bestQuiz],
        ['Set 1 reviewed', `${seenSet1}/30`],
        ['Set 2 reviewed', `${seenSet2}/30`],
        ['Best memory moves', progress.bestMemoryMoves ?? '—'],
        ['Favorites', progress.favorites?.length || 0],
        ['Games played', progress.gamesPlayed || 0],
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
    favorites: document.getElementById('screen-favorites'),
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
    if (name === 'stats') {
      refreshSpeechPrefsFromProgress();
      syncSpeechSettingsUI();
      renderVoiceList();
    }
    if (name === 'notes') renderNotes();
    if (name === 'favorites') renderFavorites();
    if (name === 'set1') renderSetList('set1');
    if (name === 'set2') renderSetList('set2');
    sfx.click();
  }
  document.getElementById('nextBtn').addEventListener('click', () => {
    if (!welcomeSpeechPlayed && !welcomeSpeechManuallyPlayed) playWelcomeSpeech(welcomeBtn || undefined);
    goTo('picker');
  });
  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => goTo(el.dataset.go)));
  attachTilt('.set-card');
  attachTilt('.game-panel');

  const questionBank = { set1: [], set2: [] };
  const questionMap = new Map();
  const questionUIState = { revealed: new Set() };
  const favoriteKeys = new Set(progress.favorites || []);
  const setUI = {
    set1: { query: '', difficulty: 'all', listEl: null, emptyEl: null, progressFill: null, progressText: null, revealBtn: null, readBtn: null, stopBtn: null },
    set2: { query: '', difficulty: 'all', listEl: null, emptyEl: null, progressFill: null, progressText: null, revealBtn: null, readBtn: null, stopBtn: null }
  };
  let favoriteScreenDirty = true;

  function normalizeSearchText(text) {
    return String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function tokenizeSearchText(text) {
    const tokens = normalizeSearchText(text).split(' ').filter(Boolean);
    return [...new Set(tokens)];
  }

  function saveFavorites() {
    progress.favorites = [...favoriteKeys];
    saveProgress();
  }

  function getQuestionBank(setKey, setData) {
    if (questionBank[setKey].length) return questionBank[setKey];
    const entries = [];
    setData.mcq.forEach((item, index) => {
      const key = `${setKey}-mcq-${index}`;
      const answerLetter = 'abcd'[item.correctIndex];
      const answerText = `${answerLetter}) ${item.options[item.correctIndex]}`;
      const explanation = item.explain || '';
      const speechAnswer = `The answer of this question is (${answerLetter}) ${item.options[item.correctIndex]}${explanation ? `. Explanation: ${explanation}` : ''}`;
      const entry = {
        key,
        setKey,
        type: 'mcq',
        index,
        q: item.q,
        options: item.options,
        correctIndex: item.correctIndex,
        explain: explanation,
        difficulty: item.difficulty || '',
        answerText: `The answer of this question is (${answerLetter}) ${item.options[item.correctIndex]}`,
        speechAnswer,
        searchText: normalizeSearchText([item.q, ...item.options, answerText, explanation].join(' '))
      };
      questionMap.set(key, entry);
      entries.push(entry);
    });
    setData.saq.forEach((item, index) => {
      const key = `${setKey}-saq-${index}`;
      const speechAnswer = `The answer of this question is (${item.a})`;
      const entry = {
        key,
        setKey,
        type: 'saq',
        index,
        q: item.q,
        a: item.a,
        difficulty: item.difficulty || '',
        answerText: speechAnswer,
        speechAnswer,
        searchText: normalizeSearchText([item.q, item.a].join(' '))
      };
      questionMap.set(key, entry);
      entries.push(entry);
    });
    questionBank[setKey] = entries;
    return entries;
  }

  function updateSetProgress(setKey) {
    const state = setUI[setKey];
    const total = questionBank[setKey].length || 0;
    const seen = questionBank[setKey].filter(entry => progress.seenQuestions.includes(entry.key)).length;
    if (state.progressFill) state.progressFill.style.width = total ? `${Math.round((seen / total) * 100)}%` : '0%';
    if (state.progressText) state.progressText.textContent = total ? `${seen} / ${total} seen · ${Math.round((seen / total) * 100)}%` : '0 / 0 seen';
    if (state.revealBtn) {
      const allRevealed = total > 0 && questionBank[setKey].every(entry => questionUIState.revealed.has(entry.key));
      state.revealBtn.textContent = allRevealed ? 'Collapse all' : 'Reveal all';
      state.revealBtn.classList.toggle('active', allRevealed);
    }
    if (total > 0 && seen === total && !progress.setDone[setKey]) {
      progress.setDone[setKey] = true;
      saveProgress();
      burstConfetti();
      showToast('🎉', `Set ${setKey.slice(-1)} complete — every question reviewed!`);
    }
  }

  function syncThemeButtons() {
    document.querySelectorAll('[data-theme-choice]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.themeChoice === normalizeThemeName(progress.theme || 'dark'));
    });
  }

  function updateThemeButtons() {
    syncThemeButtons();
  }

  function syncSpeechSettingsUI() {
    const rateRange = document.getElementById('speechRateRange');
    const rateValue = document.getElementById('speechRateValue');
    const voiceSelect = document.getElementById('speechVoiceSelect');
    if (rateRange) rateRange.value = String(speechPrefs.rate);
    if (rateValue) rateValue.textContent = `${Number(speechPrefs.rate).toFixed(2)}×`;
    if (voiceSelect) voiceSelect.value = speechPrefs.voiceURI || '';
    syncThemeButtons();
  }

  function renderVoiceList() {
    const voiceSelect = document.getElementById('speechVoiceSelect');
    const voiceNote = document.getElementById('speechVoiceNote');
    if (!voiceSelect) return;
    const voices = ('speechSynthesis' in window) ? window.speechSynthesis.getVoices() : [];
    speechVoices = Array.isArray(voices) ? voices.slice() : [];
    voiceSelect.innerHTML = '';
    if (!speechVoices.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Default voice';
      voiceSelect.appendChild(opt);
      voiceSelect.disabled = true;
      if (voiceNote) voiceNote.textContent = 'No speech voices are currently available in this browser.';
      return;
    }
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Default voice';
    voiceSelect.appendChild(defaultOpt);
    speechVoices.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name}${v.lang ? ` · ${v.lang}` : ''}${v.default ? ' · default' : ''}`;
      voiceSelect.appendChild(opt);
    });
    voiceSelect.disabled = false;
    const chosen = speechVoices.some(v => v.voiceURI === speechPrefs.voiceURI) ? speechPrefs.voiceURI : '';
    speechPrefs.voiceURI = chosen;
    voiceSelect.value = chosen;
    if (voiceNote) voiceNote.textContent = 'Choose a voice for question reading and the welcome message.';
  }

  function persistSpeechPrefs() {
    progress.speechRate = clamp(speechPrefs.rate, 0.5, 1.5);
    progress.voiceURI = speechPrefs.voiceURI || '';
    saveProgress();
  }

  function renderFavorites() {
    const list = document.getElementById('favoritesList');
    const empty = document.getElementById('favoritesEmptyNote');
    if (!list || !empty) return;
    list.innerHTML = '';
    const items = [...favoriteKeys].map(key => questionMap.get(key)).filter(Boolean);
    empty.hidden = items.length > 0;
    if (!items.length) return;
    items.forEach(entry => list.appendChild(createQuestionCard(entry, { fromFavorites: true })));
  }

  function toggleFavorite(key) {
    if (favoriteKeys.has(key)) favoriteKeys.delete(key);
    else favoriteKeys.add(key);
    favoriteScreenDirty = true;
    saveFavorites();
    if (document.getElementById('screen-favorites')?.classList.contains('active')) renderFavorites();
    showToast('⭐', favoriteKeys.has(key) ? 'Added to favorites' : 'Removed from favorites');
    return favoriteKeys.has(key);
  }

  function matchesQuestionSearch(entry, query) {
    if (!query) return true;
    const search = entry.searchText;
    if (search.includes(query)) return true;
    const queryTokens = tokenizeSearchText(query);
    if (!queryTokens.length) return true;
    const entryTokens = tokenizeSearchText(search);
    return queryTokens.every(qtok => entryTokens.some(etok => {
      if (etok === qtok) return true;
      if (qtok.length >= 4 && etok.startsWith(qtok)) return true;
      if (etok.length >= 4 && qtok.startsWith(etok)) return true;
      return false;
    }));
  }

  function setRevealState(entry, next, forceSeen = false) {
    const wasRevealed = questionUIState.revealed.has(entry.key);
    if (next) {
      questionUIState.revealed.add(entry.key);
      if (!wasRevealed || forceSeen) {
        if (markSeen(entry.key)) { addXp(3); updateSetProgress(entry.setKey); }
        else updateSetProgress(entry.setKey);
      }
      return !wasRevealed;
    }
    questionUIState.revealed.delete(entry.key);
    updateSetProgress(entry.setKey);
    return false;
  }

  function createQuestionCard(entry, options = {}) {
    const card = document.createElement('div');
    card.className = 'qcard';
    card.dataset.key = entry.key;

    const numEl = document.createElement('span');
    numEl.className = 'qnum';
    numEl.textContent = `Question ${entry.index + 1}`;

    const diffTag = document.createElement('span');
    diffTag.style.cssText = 'float:right; font-family:JetBrains Mono,monospace; font-size:10px; opacity:0.7;';
    diffTag.textContent = entry.difficulty || '';

    const qEl = document.createElement('div');
    qEl.className = 'qtext';
    qEl.textContent = entry.q;

    const toolsEl = document.createElement('div');
    toolsEl.className = 'qtools';

    const revealIfNeeded = () => {
      const next = !card.classList.contains('revealed');
      if (next) {
        const firstTime = setRevealState(entry, true, true);
        card.classList.add('revealed');
        if (entry.type === 'mcq') {
          optsEl.children[entry.correctIndex]?.classList.add('is-correct');
        }
        if (firstTime) updateSetProgress(entry.setKey);
      } else {
        questionUIState.revealed.delete(entry.key);
        card.classList.remove('revealed');
        updateSetProgress(entry.setKey);
      }
    };

    const speakQBtn = document.createElement('button');
    speakQBtn.type = 'button';
    speakQBtn.className = 'speak-btn';
    speakQBtn.innerHTML = '<span class="speak-ic">🔊</span><span>Hear question</span>';
    speakQBtn.addEventListener('click', e => {
      e.stopPropagation();
      speak(entry.q, speakQBtn);
    });

    const speakABtn = document.createElement('button');
    speakABtn.type = 'button';
    speakABtn.className = 'speak-btn answer-speak';
    speakABtn.innerHTML = '<span class="speak-ic">🔈</span><span>Hear answer</span>';
    speakABtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!card.classList.contains('revealed')) {
        setRevealState(entry, true, true);
        card.classList.add('revealed');
        if (entry.type === 'mcq') optsEl.children[entry.correctIndex]?.classList.add('is-correct');
      }
      speak(entry.speechAnswer, speakABtn);
    });

    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'speak-btn star-btn';
    favBtn.innerHTML = '<span class="speak-ic">⭐</span><span>Favorite</span>';
    const syncFavBtn = () => {
      const fav = favoriteKeys.has(entry.key);
      favBtn.classList.toggle('is-favorited', fav);
      favBtn.setAttribute('aria-pressed', String(fav));
      favBtn.querySelector('span:last-child').textContent = fav ? 'Saved' : 'Favorite';
    };
    favBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(entry.key);
      syncFavBtn();
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'speak-btn';
    copyBtn.innerHTML = '<span class="speak-ic">📋</span><span>Copy</span>';
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      copyQuestion(entry);
    });

    const optsEl = document.createElement('div');
    optsEl.className = 'options';

    const ansEl = document.createElement('div');
    ansEl.className = 'answer';

    if (entry.type === 'mcq') {
      entry.options.forEach((opt, oi) => {
        const o = document.createElement('div');
        o.className = 'opt';
        o.dataset.idx = oi;
        o.textContent = `${'abcd'[oi]}) ${opt}`;
        optsEl.appendChild(o);
      });
      const ansLine = document.createElement('div');
      ansLine.textContent = entry.answerText;
      const explainLine = document.createElement('div');
      explainLine.style.marginTop = '8px';
      explainLine.style.color = 'var(--ink-dim)';
      explainLine.style.fontSize = '13px';
      explainLine.textContent = entry.explain || '';
      ansEl.append(ansLine, explainLine);
    } else {
      ansEl.textContent = entry.answerText;
    }

    const banner = document.createElement('div');
    banner.className = 'favorite-card-banner';
    banner.textContent = options.fromFavorites ? `${entry.setKey.toUpperCase()} · ${entry.type.toUpperCase()}` : '';

    card.addEventListener('click', () => revealIfNeeded());
    toolsEl.append(speakQBtn, speakABtn, favBtn, copyBtn);
    if (banner.textContent) card.append(numEl, diffTag, qEl, optsEl, ansEl, toolsEl, banner);
    else card.append(numEl, diffTag, qEl, optsEl, ansEl, toolsEl);

    if (favoriteKeys.has(entry.key)) syncFavBtn();
    if (questionUIState.revealed.has(entry.key)) {
      card.classList.add('revealed');
      if (entry.type === 'mcq') optsEl.children[entry.correctIndex]?.classList.add('is-correct');
    }
    return card;
  }

  function renderSetList(setKey) {
    const state = setUI[setKey];
    if (!state.listEl) return;
    const entries = questionBank[setKey] || [];
    const query = normalizeSearchText(state.query);
    const diff = state.difficulty || 'all';
    const filtered = entries.filter(entry => matchesQuestionSearch(entry, query) && (diff === 'all' || (entry.difficulty || '') === diff));
    state.listEl.innerHTML = '';
    if (!filtered.length) {
      state.emptyEl.hidden = false;
      state.emptyEl.textContent = (query || diff !== 'all') ? 'No matches. Try a different keyword or difficulty.' : 'No questions in this set yet.';
    } else {
      state.emptyEl.hidden = true;
      filtered.forEach(entry => state.listEl.appendChild(createQuestionCard(entry)));
    }
    updateSetProgress(setKey);
  }

  function toggleRevealAll(setKey) {
    const entries = questionBank[setKey] || [];
    const allRevealed = entries.length > 0 && entries.every(entry => questionUIState.revealed.has(entry.key));
    if (allRevealed) {
      entries.forEach(entry => questionUIState.revealed.delete(entry.key));
    } else {
      entries.forEach(entry => {
        const firstTime = !progress.seenQuestions.includes(entry.key);
        questionUIState.revealed.add(entry.key);
        if (firstTime) {
          if (markSeen(entry.key)) addXp(3);
        }
      });
      saveProgress();
    }
    renderSetList(setKey);
  }

  function readSetAloud(setKey) {
    const entries = questionBank[setKey] || [];
    const lines = [];
    entries.forEach(entry => {
      lines.push(`Question ${entry.index + 1}. ${entry.q}`);
      lines.push(entry.speechAnswer);
    });
    const state = setUI[setKey];
    if (state.readBtn) state.readBtn.classList.add('active');
    if (state.stopBtn) state.stopBtn.disabled = false;
    speakQueue(lines, state.readBtn, () => {
      if (state.readBtn) state.readBtn.classList.remove('active');
      if (state.stopBtn) state.stopBtn.disabled = false;
    });
  }

  function buildShareText(entry) {
    const lines = [`Q${entry.index + 1}: ${entry.q}`];
    if (entry.type === 'mcq') {
      entry.options.forEach((opt, oi) => lines.push(`${'abcd'[oi]}) ${opt}`));
      lines.push(entry.answerText);
      if (entry.explain) lines.push(`Explanation: ${entry.explain}`);
    } else {
      lines.push(entry.answerText);
    }
    return lines.join('\n');
  }

  function copyQuestion(entry) {
    const text = buildShareText(entry);
    const done = () => showToast('📋', 'Copied question & answer');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch {
      showToast('⚠️', 'Copy not supported in this browser');
    }
  }

  function surpriseMe(setKey) {
    const pools = setKey ? [setKey] : ['set1', 'set2'];
    const all = pools.flatMap(sk => questionBank[sk] || []);
    if (!all.length) return;
    const entry = all[Math.floor(Math.random() * all.length)];
    const targetSet = entry.setKey;
    setUI[targetSet].query = '';
    setUI[targetSet].difficulty = 'all';
    const searchInput = document.getElementById(`${targetSet}Search`);
    if (searchInput) searchInput.value = '';
    syncDifficultyButtons(targetSet);
    questionUIState.revealed.add(entry.key);
    if (markSeen(entry.key)) addXp(3);
    goTo(targetSet);
    renderSetList(targetSet);
    requestAnimationFrame(() => {
      const card = setUI[targetSet].listEl?.querySelector(`[data-key="${entry.key}"]`);
      if (card) {
        card.classList.add('revealed', 'surprise-flash');
        const opts = card.querySelector('.options');
        if (entry.type === 'mcq' && opts) opts.children[entry.correctIndex]?.classList.add('is-correct');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => card.classList.remove('surprise-flash'), 1600);
      }
    });
    showToast('🎲', `Jumped to a random ${targetSet.toUpperCase()} question`);
  }

  function syncDifficultyButtons(setKey) {
    document.querySelectorAll(`#${setKey}Filters .chip`).forEach(btn => {
      btn.classList.toggle('is-active', (btn.dataset.diff || 'all') === (setUI[setKey].difficulty || 'all'));
    });
  }

  function initSetUI(setKey, containerId) {
    const state = setUI[setKey];
    state.listEl = document.getElementById(containerId);
    state.emptyEl = document.getElementById(`${setKey}EmptyNote`);
    state.progressFill = document.getElementById(`${setKey}ProgressFill`);
    state.progressText = document.getElementById(`${setKey}ProgressText`);
    state.revealBtn = document.getElementById(`${setKey}RevealAll`);
    state.readBtn = document.getElementById(`${setKey}ReadAll`);
    state.stopBtn = document.getElementById(`${setKey}StopRead`);
    const search = document.getElementById(`${setKey}Search`);
    if (search && !search.dataset.bound) {
      search.dataset.bound = '1';
      search.addEventListener('input', () => {
        state.query = search.value;
        renderSetList(setKey);
      });
    }
    if (state.revealBtn && !state.revealBtn.dataset.bound) {
      state.revealBtn.dataset.bound = '1';
      state.revealBtn.addEventListener('click', () => toggleRevealAll(setKey));
    }
    if (state.readBtn && !state.readBtn.dataset.bound) {
      state.readBtn.dataset.bound = '1';
      state.readBtn.addEventListener('click', () => readSetAloud(setKey));
    }
    if (state.stopBtn && !state.stopBtn.dataset.bound) {
      state.stopBtn.dataset.bound = '1';
      state.stopBtn.addEventListener('click', () => {
        stopSpeech();
        if (state.readBtn) state.readBtn.classList.remove('active');
      });
    }
    const surpriseBtn = document.getElementById(`${setKey}Surprise`);
    if (surpriseBtn && !surpriseBtn.dataset.bound) {
      surpriseBtn.dataset.bound = '1';
      surpriseBtn.addEventListener('click', () => surpriseMe(setKey));
    }
    const filters = document.getElementById(`${setKey}Filters`);
    if (filters && !filters.dataset.bound) {
      filters.dataset.bound = '1';
      filters.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
          state.difficulty = btn.dataset.diff || 'all';
          syncDifficultyButtons(setKey);
          renderSetList(setKey);
        });
      });
      syncDifficultyButtons(setKey);
    }
    updateSetProgress(setKey);
  }

  /* ===================== Render question sets ===================== */
  function renderSet(containerId, setData, setKey) {
    getQuestionBank(setKey, setData);
    initSetUI(setKey, containerId);
    renderSetList(setKey);
  }
  renderSet('set1List', SET1, 'set1');
  renderSet('set2List', SET2, 'set2');
  renderFavorites();
  renderVoiceList();

  document.querySelectorAll('[data-theme-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeChoice, true);
    });
  });

  const speechRateRange = document.getElementById('speechRateRange');
  const speechRateValue = document.getElementById('speechRateValue');
  const speechVoiceSelect = document.getElementById('speechVoiceSelect');
  if (speechRateRange && !speechRateRange.dataset.bound) {
    speechRateRange.dataset.bound = '1';
    speechRateRange.value = String(speechPrefs.rate);
    speechRateRange.addEventListener('input', () => {
      speechPrefs.rate = clamp(Number(speechRateRange.value) || 1, 0.5, 1.5);
      if (speechRateValue) speechRateValue.textContent = `${speechPrefs.rate.toFixed(2)}×`;
      persistSpeechPrefs();
    });
  }
  if (speechVoiceSelect && !speechVoiceSelect.dataset.bound) {
    speechVoiceSelect.dataset.bound = '1';
    speechVoiceSelect.addEventListener('change', () => {
      speechPrefs.voiceURI = speechVoiceSelect.value || '';
      persistSpeechPrefs();
    });
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = renderVoiceList;
    window.speechSynthesis.addEventListener?.('voiceschanged', renderVoiceList);
  }

  const chatMic = document.getElementById('chatMic');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (chatMic) {
    if (!SpeechRecognition) {
      chatMic.hidden = true;
    } else {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      let lastTranscript = '';
      recognition.onstart = () => {
        chatMic.classList.add('recording');
        chatMic.setAttribute('aria-pressed', 'true');
      };
      recognition.onresult = event => {
        lastTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal && res[0] && res[0].transcript) lastTranscript += res[0].transcript;
        }
        const transcript = lastTranscript.trim();
        if (transcript) {
          chatInput.value = transcript;
          sendChat();
        }
      };
      recognition.onerror = () => {
        chatMic.classList.remove('recording');
        chatMic.setAttribute('aria-pressed', 'false');
      };
      recognition.onend = () => {
        chatMic.classList.remove('recording');
        chatMic.setAttribute('aria-pressed', 'false');
      };
      chatMic.addEventListener('click', () => {
        if (chatMic.classList.contains('recording')) {
          recognition.stop();
          return;
        }
        try {
          recognition.start();
        } catch {}
      });
    }
  }

  /* ===================== Daily streak ===================== */
  (function initDailyStreak() {
    const today = new Date();
    const dayKey = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const todayKey = dayKey(today);
    const last = progress.lastVisit || '';
    if (last !== todayKey) {
      const yKey = dayKey(new Date(today.getTime() - 86400000));
      progress.dailyStreak = (last === yKey) ? (progress.dailyStreak || 0) + 1 : 1;
      progress.lastVisit = todayKey;
      saveProgress();
      const n = progress.dailyStreak;
      setTimeout(() => showToast('🔥', n > 1 ? `${n}-day study streak — keep it up!` : 'Day 1 of your study streak!'), 900);
    }
  })();

  /* ===================== Keyboard shortcuts + help overlay ===================== */
  function currentSetKey() {
    if (screens.set1?.classList.contains('active')) return 'set1';
    if (screens.set2?.classList.contains('active')) return 'set2';
    return null;
  }
  const helpOverlay = document.getElementById('helpOverlay');
  function toggleHelp(force) {
    if (!helpOverlay) return;
    const show = typeof force === 'boolean' ? force : helpOverlay.hidden;
    helpOverlay.hidden = !show;
  }
  document.getElementById('helpFab')?.addEventListener('click', () => toggleHelp());
  document.getElementById('helpClose')?.addEventListener('click', () => toggleHelp(false));
  helpOverlay?.addEventListener('click', e => { if (e.target === helpOverlay) toggleHelp(false); });
  document.addEventListener('keydown', e => {
    const tag = (e.target && e.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
    if (e.key === 'Escape') {
      if (helpOverlay && !helpOverlay.hidden) { toggleHelp(false); return; }
      stopSpeech();
      return;
    }
    if (typing || e.ctrlKey || e.altKey || e.metaKey) return;
    const sk = currentSetKey();
    switch (e.key) {
      case '/': e.preventDefault(); if (sk) document.getElementById(`${sk}Search`)?.focus(); break;
      case 'r': case 'R': if (sk) { e.preventDefault(); toggleRevealAll(sk); } break;
      case 's': case 'S': e.preventDefault(); surpriseMe(sk || null); break;
      case 'f': case 'F': e.preventDefault(); goTo('favorites'); break;
      case 'g': case 'G': e.preventDefault(); goTo('games'); break;
      case 'h': case 'H': e.preventDefault(); goTo('home'); break;
      case '1': e.preventDefault(); goTo('set1'); break;
      case '2': e.preventDefault(); goTo('set2'); break;
      case '3': e.preventDefault(); goTo('games'); break;
      case '4': e.preventDefault(); goTo('flashcards'); break;
      case '5': e.preventDefault(); goTo('stats'); break;
      case '?': e.preventDefault(); toggleHelp(); break;
      default: break;
    }
  });

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
    progress.quizBest = progress.quizBest || {};
    progress.quizBest[quiz.mode] = Math.max(Number(progress.quizBest[quiz.mode] || 0), quiz.score);
    saveProgress();
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

  /* ===================== Extra Games ===================== */
  const GAME_BANK_MCQ = [
    ...SET1.mcq.map((q, i) => ({ ...q, setKey: 'set1', bankIdx: i })),
    ...SET2.mcq.map((q, i) => ({ ...q, setKey: 'set2', bankIdx: i }))
  ];
  const GAME_TERMS_POOL = GAME_TERMS.terms;
  const GAME_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function bindGameRestart(btnId, handler) {
    const btn = document.getElementById(btnId);
    if (!btn || btn.dataset.bound) return btn;
    btn.dataset.bound = '1';
    btn.addEventListener('click', handler);
    return btn;
  }

  function pickMany(arr, count) {
    return shuffleCopy([...arr]).slice(0, Math.min(count, arr.length));
  }

  function createSummaryBox(title, body) {
    return `<div class="game-summary"><strong>${title}</strong><div>${body}</div></div>`;
  }

  /* ---------- 1. True/False Blitz ---------- */
  let tfBlitzState = null;
  function initTrueFalseBlitz() {
    const root = document.getElementById('tfBlitzRoot');
    if (!root) return;
    const restart = () => {
      clearInterval(tfBlitzState?.timer);
      tfBlitzState = {
        deck: shuffleCopy([...GAME_TERMS.tfStatements]),
        idx: 0,
        score: 0,
        remaining: 60,
        locked: false,
        timer: null,
        finished: false
      };
      renderTfBlitz();
      tfBlitzState.timer = setInterval(() => {
        tfBlitzState.remaining -= 1;
        const timer = document.getElementById('tfBlitzTimer');
        if (timer) timer.textContent = `${tfBlitzState.remaining}s`;
        if (tfBlitzState.remaining <= 0) finishTfBlitz();
      }, 1000);
    };
    function renderTfBlitz(message = '') {
      const q = tfBlitzState.deck[tfBlitzState.idx % tfBlitzState.deck.length];
      root.innerHTML = `
        <div class="mini-status"><span id="tfBlitzTimer">${tfBlitzState.remaining}s</span> · Score <span id="tfBlitzScore">${tfBlitzState.score}</span></div>
        <div class="game-qa" id="tfBlitzQuestion">${escapeHtml(q.text)}</div>
        <div class="mode-row" style="margin-top:12px;">
          <button type="button" class="mode-btn" id="tfTrueBtn">True</button>
          <button type="button" class="mode-btn" id="tfFalseBtn">False</button>
        </div>
        <div class="game-feedback" id="tfBlitzFeedback">${message}</div>
      `;
      document.getElementById('tfTrueBtn')?.addEventListener('click', () => answer(true));
      document.getElementById('tfFalseBtn')?.addEventListener('click', () => answer(false));
    }
    function answer(choice) {
      if (tfBlitzState.locked || tfBlitzState.finished) return;
      tfBlitzState.locked = true;
      const q = tfBlitzState.deck[tfBlitzState.idx % tfBlitzState.deck.length];
      const correct = choice === q.answer;
      if (correct) {
        tfBlitzState.score += 1;
        addXp(2);
        if (tfBlitzState.score >= 20) unlockBadge('blitz_20');
        tone(660, 0.09, 'sine', 0.07);
      } else {
        tone(180, 0.14, 'sawtooth', 0.06);
      }
      const fb = document.getElementById('tfBlitzFeedback');
      if (fb) fb.textContent = `${correct ? 'Correct.' : 'Not quite.'} ${q.why}`;
      const scoreEl = document.getElementById('tfBlitzScore');
      if (scoreEl) scoreEl.textContent = tfBlitzState.score;
      tfBlitzState.idx += 1;
      setTimeout(() => { if (!tfBlitzState.finished) { tfBlitzState.locked = false; renderTfBlitz(); } }, 950);
    }
    function finishTfBlitz() {
      if (tfBlitzState.finished) return;
      tfBlitzState.finished = true;
      clearInterval(tfBlitzState.timer);
      recordGameResult('tfBlitz', tfBlitzState.score, true);
      if (tfBlitzState.score >= 20) unlockBadge('blitz_20');
      root.innerHTML = `${createSummaryBox('Final score', `${tfBlitzState.score} correct in 60 seconds.`)}<button type="button" class="btn btn-primary" id="tfBlitzAgain">Play again</button>`;
      document.getElementById('tfBlitzAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('tfBlitzRestart', restart);
    restart();
  }

  /* ---------- 2. Word Scramble ---------- */
  let scrambleState = null;
  function initWordScramble() {
    const root = document.getElementById('scrambleRoot');
    if (!root) return;
    const restart = () => {
      scrambleState = { solved: 0, round: 0, total: 10, current: null };
      nextScramble();
    };
    function nextScramble() {
      if (scrambleState.round >= scrambleState.total) return finishScramble();
      scrambleState.current = GAME_TERMS_POOL[Math.floor(Math.random() * GAME_TERMS_POOL.length)];
      scrambleState.scrambled = shuffleCopy(scrambleState.current.term.replace(/[^A-Za-z]/g, '').split('')).join('');
      scrambleState.round += 1;
      renderScramble('');
    }
    function renderScramble(message) {
      root.innerHTML = `
        <div class="mini-status">Round ${scrambleState.round}/${scrambleState.total} · Solved ${scrambleState.solved}</div>
        <div class="game-hint">${escapeHtml(scrambleState.current.def)}</div>
        <div class="game-qa scramble-word">${escapeHtml(scrambleState.scrambled)}</div>
        <input id="scrambleInput" class="settings-select" type="text" placeholder="Type the term...">
        <div class="mode-row" style="margin-top:10px;">
          <button type="button" class="mode-btn" id="scrambleCheck">Check</button>
          <button type="button" class="mode-btn" id="scrambleSkip">Skip</button>
        </div>
        <div class="game-feedback">${message}</div>
      `;
      const input = document.getElementById('scrambleInput');
      input?.focus();
      document.getElementById('scrambleCheck')?.addEventListener('click', () => {
        const guess = normalizeSearchText(input.value);
        const target = normalizeSearchText(scrambleState.current.term);
        if (guess === target) {
          scrambleState.solved += 1;
          addXp(4);
          tone(620, 0.08, 'triangle', 0.07);
          renderScramble(`Correct — ${scrambleState.current.term}`);
          setTimeout(nextScramble, 700);
        } else {
          tone(220, 0.12, 'square', 0.05);
          renderScramble(`Try again. Hint: ${scrambleState.current.category}`);
        }
      });
      document.getElementById('scrambleSkip')?.addEventListener('click', () => nextScramble());
    }
    function finishScramble() {
      recordGameResult('scramble', scrambleState.solved, true);
      root.innerHTML = `${createSummaryBox('Word Scramble complete', `${scrambleState.solved} of ${scrambleState.total} solved.`)}<button type="button" class="btn btn-primary" id="scrambleAgain">New round</button>`;
      document.getElementById('scrambleAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('scrambleRestart', restart);
    restart();
  }

  /* ---------- 3. Hangman ---------- */
  let hangmanState = null;
  function initHangman() {
    const root = document.getElementById('hangmanRoot');
    if (!root) return;
    const restart = () => {
      const pool = GAME_TERMS_POOL.filter(t => /^[A-Za-z ]+$/.test(t.term));
      const term = pool[Math.floor(Math.random() * pool.length)] || GAME_TERMS_POOL[0];
      hangmanState = { term, guessed: new Set(), wrong: 0, solved: false };
      renderHangman('');
    };
    function maskedTerm() {
      return hangmanState.term.term.split('').map(ch => /[A-Za-z]/.test(ch) && !hangmanState.guessed.has(ch.toUpperCase()) ? '•' : ch).join(' ');
    }
    function renderHangman(message) {
      root.innerHTML = `
        <div class="mini-status">Wrong left: ${6 - hangmanState.wrong}</div>
        <div class="game-hint">${escapeHtml(hangmanState.term.def)}</div>
        <div class="game-qa hangman-word">${escapeHtml(maskedTerm())}</div>
        <div class="hangman-letters" id="hangmanLetters"></div>
        <div class="game-feedback">${message}</div>
      `;
      const letters = document.getElementById('hangmanLetters');
      GAME_LETTERS.forEach(letter => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mini-btn';
        b.textContent = letter;
        b.disabled = hangmanState.guessed.has(letter) || hangmanState.solved;
        b.addEventListener('click', () => pickLetter(letter));
        letters.appendChild(b);
      });
    }
    function finish(win) {
      hangmanState.solved = true;
      const score = win ? (6 - hangmanState.wrong) : 0;
      recordGameResult('hangman', score, true);
      if (win) addXp(10);
      root.innerHTML = `${createSummaryBox(win ? 'You solved it!' : 'Hangman over', `${hangmanState.term.term}. ${hangmanState.term.def}`)}<button type="button" class="btn btn-primary" id="hangmanAgain">New word</button>`;
      document.getElementById('hangmanAgain')?.addEventListener('click', restart);
    }
    function pickLetter(letter) {
      if (hangmanState.solved) return;
      hangmanState.guessed.add(letter);
      if (hangmanState.term.term.toUpperCase().includes(letter)) {
        tone(680, 0.06, 'sine', 0.07);
      } else {
        hangmanState.wrong += 1;
        tone(160, 0.1, 'sawtooth', 0.05);
      }
      const solved = hangmanState.term.term.split('').every(ch => !/[A-Za-z]/.test(ch) || hangmanState.guessed.has(ch.toUpperCase()));
      if (solved) {
        finish(true);
      } else if (hangmanState.wrong >= 6) {
        finish(false);
      } else {
        renderHangman(correct ? 'Nice guess.' : 'Wrong guess.');
      }
    }
    bindGameRestart('hangmanRestart', restart);
    restart();
  }

  /* ---------- 4. Odd One Out ---------- */
  let oddState = null;
  function initOddOneOut() {
    const root = document.getElementById('oddOneRoot');
    if (!root) return;
    const restart = () => {
      oddState = { rounds: shuffleCopy([...GAME_TERMS.oddGroups]).slice(0, 10), idx: 0, score: 0 };
      renderOddOneOut('');
    };
    function renderOddOneOut(message) {
      if (oddState.idx >= oddState.rounds.length) return finishOdd();
      const item = oddState.rounds[oddState.idx];
      root.innerHTML = `
        <div class="mini-status">Round ${oddState.idx + 1}/${oddState.rounds.length} · Score ${oddState.score}</div>
        <div class="game-qa">Which one is the odd one out?</div>
        <div class="odd-grid" id="oddGrid"></div>
        <div class="game-feedback">${message}</div>
      `;
      const grid = document.getElementById('oddGrid');
      item.items.forEach((label, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt odd-btn';
        b.textContent = label;
        b.addEventListener('click', () => choose(idx));
        grid.appendChild(b);
      });
      function choose(idx) {
        const ok = idx === item.odd;
        if (ok) {
          oddState.score += 1;
          addXp(2);
          tone(650, 0.08, 'triangle', 0.07);
        } else tone(180, 0.08, 'square', 0.05);
        root.querySelector('.game-feedback').textContent = item.why;
        setTimeout(() => { oddState.idx += 1; renderOddOneOut(''); }, 900);
      }
    }
    function finishOdd() {
      recordGameResult('oddOneOut', oddState.score, true);
      root.innerHTML = `${createSummaryBox('Odd One Out complete', `${oddState.score}/${oddState.rounds.length} correct.`)}<button type="button" class="btn btn-primary" id="oddAgain">New round</button>`;
      document.getElementById('oddAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('oddOneRestart', restart);
    restart();
  }

  /* ---------- 5. Fill-in-the-Blank ---------- */
  let clozeState = null;
  function initClozeGame() {
    const root = document.getElementById('clozeRoot');
    if (!root) return;
    const restart = () => {
      clozeState = { rounds: shuffleCopy([...GAME_TERMS.cloze]).slice(0, 10), idx: 0, score: 0 };
      renderCloze('');
    };
    function renderCloze(message) {
      if (clozeState.idx >= clozeState.rounds.length) return finishCloze();
      const item = clozeState.rounds[clozeState.idx];
      root.innerHTML = `
        <div class="mini-status">Round ${clozeState.idx + 1}/${clozeState.rounds.length} · Score ${clozeState.score}</div>
        <div class="game-qa">${escapeHtml(item.sentence)}</div>
        <div class="mode-row" id="clozeOpts"></div>
        <div class="game-feedback">${message}</div>
      `;
      const opts = document.getElementById('clozeOpts');
      shuffleCopy([...item.options]).forEach(opt => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mode-btn';
        b.textContent = opt;
        b.addEventListener('click', () => pick(opt));
        opts.appendChild(b);
      });
      function pick(opt) {
        const ok = normalizeSearchText(opt) === normalizeSearchText(item.answer);
        if (ok) {
          clozeState.score += 1;
          addXp(2);
          tone(660, 0.07, 'sine', 0.06);
        } else tone(170, 0.08, 'sawtooth', 0.05);
        root.querySelector('.game-feedback').textContent = `${ok ? 'Correct.' : 'Nope.'} ${item.answer}.`;
        setTimeout(() => { clozeState.idx += 1; renderCloze(''); }, 850);
      }
    }
    function finishCloze() {
      recordGameResult('clozeGame', clozeState.score, true);
      root.innerHTML = `${createSummaryBox('Fill-in-the-Blank complete', `${clozeState.score}/${clozeState.rounds.length} correct.`)}<button type="button" class="btn btn-primary" id="clozeAgain">New round</button>`;
      document.getElementById('clozeAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('clozeRestart', restart);
    restart();
  }

  /* ---------- 6. Millionaire Ladder ---------- */
  let millionaireState = null;
  function initMillionaireLadder() {
    const root = document.getElementById('millionaireRoot');
    if (!root) return;
    const bank = shuffleCopy([...GAME_BANK_MCQ]).sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2 };
      return order[a.difficulty] - order[b.difficulty];
    }).slice(0, 15);
    const restart = () => {
      millionaireState = { qIdx: 0, rung: 0, lifeline: true, bank: shuffleCopy([...bank]), used50: false, removed: new Set(), finished: false };
      renderMillionaire();
    };
    function renderMillionaire(message = '') {
      if (millionaireState.finished) return;
      const q = millionaireState.bank[millionaireState.qIdx];
      const opts = q.options.map((opt, idx) => ({ opt, idx }));
      const visible = opts.filter(o => !millionaireState.removed.has(o.idx));
      root.innerHTML = `
        <div class="mini-status">Rung ${millionaireState.rung}/15 · Lifeline ${millionaireState.used50 ? 'used' : 'ready'}</div>
        <div class="game-qa">${escapeHtml(q.q)}</div>
        <div class="mode-row" style="margin-bottom:8px;">
          <button class="mode-btn" id="millionaire5050" ${millionaireState.used50 ? 'disabled' : ''}>50:50</button>
        </div>
        <div class="mode-row" id="millionaireOpts"></div>
        <div class="game-feedback">${message}</div>
      `;
      const optsWrap = document.getElementById('millionaireOpts');
      visible.forEach(({ opt, idx }) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mode-btn';
        b.textContent = `${'ABCD'[idx]}) ${opt}`;
        if (millionaireState.removed.has(idx)) b.disabled = true;
        b.addEventListener('click', () => pick(idx));
        optsWrap.appendChild(b);
      });
      document.getElementById('millionaire5050')?.addEventListener('click', () => {
        if (millionaireState.used50) return;
        millionaireState.used50 = true;
        const wrong = [0,1,2,3].filter(i => i !== q.correctIndex);
        shuffleCopy(wrong).slice(0,2).forEach(i => millionaireState.removed.add(i));
        renderMillionaire('50:50 used — two wrong answers removed.');
      });
      function pick(idx) {
        if (idx !== q.correctIndex) return endMillionaire(false, `Wrong answer. The correct one was ${'ABCD'[q.correctIndex]}.`);
        millionaireState.rung += 1;
        millionaireState.qIdx += 1;
        addXp(4);
        if (millionaireState.rung >= 15) return endMillionaire(true, 'You reached the top!');
        millionaireState.removed.clear();
        renderMillionaire('Correct! Climb higher.');
      }
    }
    function endMillionaire(win, message) {
      millionaireState.finished = true;
      recordGameResult('millionaire', millionaireState.rung, true);
      if (win) {
        unlockBadge('millionaire_win');
        burstConfetti();
      }
      root.innerHTML = `${createSummaryBox(win ? 'Millionaire complete' : 'Run over', `${message}<br>Highest rung: ${millionaireState.rung}/15`)}<button type="button" class="btn btn-primary" id="millionaireAgain">Play again</button>`;
      document.getElementById('millionaireAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('millionaireRestart', restart);
    restart();
  }

  /* ---------- 7. Cell Osmosis Lab ---------- */
  let osmosisState = null;
  function initOsmosisLab() {
    const root = document.getElementById('osmosisRoot');
    if (!root) return;
    const cases = [
      { cell: 'Animal', sol: 'Hypotonic', outcome: 'bursts/lyses', why: 'Water enters an animal cell and it can burst.' },
      { cell: 'Animal', sol: 'Isotonic', outcome: 'no change', why: 'Water moves equally in both directions.' },
      { cell: 'Animal', sol: 'Hypertonic', outcome: 'shrinks', why: 'Water leaves the cell and it shrivels.' },
      { cell: 'Plant', sol: 'Hypotonic', outcome: 'turgid', why: 'The vacuole fills and turgor pressure rises.' },
      { cell: 'Plant', sol: 'Isotonic', outcome: 'no change', why: 'There is no net water movement.' },
      { cell: 'Plant', sol: 'Hypertonic', outcome: 'plasmolysis', why: 'Water leaves and the membrane pulls from the wall.' }
    ];
    const restart = () => {
      osmosisState = { score: 0, round: 0, total: 10, current: null };
      newOsmosisCase();
    };
    function newOsmosisCase() {
      if (osmosisState.round >= osmosisState.total) return finishOsmosis();
      osmosisState.current = cases[Math.floor(Math.random() * cases.length)];
      osmosisState.round += 1;
      renderOsmosis('');
    }
    function lookupOutcome(cell, sol) {
      return (cases.find(c => c.cell === cell && c.sol === sol) || cases[0]).outcome;
    }

    function renderOsmosis(message) {
      const current = osmosisState.current || cases[0];
      root.innerHTML = `
        <div class="mini-status">Case ${osmosisState.round}/${osmosisState.total} · Score ${osmosisState.score}</div>
        <div class="mode-row">
          <select id="osmosisCell" class="settings-select"><option>Animal</option><option>Plant</option></select>
          <select id="osmosisSol" class="settings-select"><option>Hypotonic</option><option>Isotonic</option><option>Hypertonic</option></select>
        </div>
        <div class="game-qa">Scenario: ${current.cell} cell in a ${current.sol.toLowerCase()} solution. Predict the outcome.</div>
        <div class="mode-row" id="osmosisChoices"></div>
        <div class="game-feedback">${message}</div>
      `;
      const cellSelect = document.getElementById('osmosisCell');
      const solSelect = document.getElementById('osmosisSol');
      cellSelect.value = current.cell;
      solSelect.value = current.sol;
      const selectedCell = cellSelect.value;
      const selectedSol = solSelect.value;
      cellSelect?.addEventListener('change', () => renderOsmosis(''));
      solSelect?.addEventListener('change', () => renderOsmosis(''));
      const optionPool = ['bursts/lyses', 'shrinks', 'turgid', 'plasmolysis', 'no change'];
      const correct = lookupOutcome(selectedCell, selectedSol);
      const options = shuffleCopy([correct, ...shuffleCopy(optionPool.filter(opt => opt !== correct)).slice(0, 3)]);
      options.forEach(opt => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mode-btn';
        b.textContent = opt;
        b.addEventListener('click', () => check(opt));
        document.getElementById('osmosisChoices').appendChild(b);
      });
      function check(opt) {
        const cell = cellSelect.value;
        const sol = solSelect.value;
        const lookup = cases.find(c => c.cell === cell && c.sol === sol);
        const ok = lookup && lookup.outcome === opt;
        if (ok) {
          osmosisState.score += 1;
          addXp(2);
          tone(650, 0.08, 'triangle', 0.06);
        } else tone(190, 0.08, 'sawtooth', 0.05);
        root.querySelector('.game-feedback').textContent = `${ok ? 'Correct.' : 'Not quite.'} ${lookup.why}`;
        setTimeout(newOsmosisCase, 900);
      }
    }
    function finishOsmosis() {
      recordGameResult('osmosisLab', osmosisState.score, true);
      if (osmosisState.score >= osmosisState.total) unlockBadge('osmosis_ace');
      root.innerHTML = `${createSummaryBox('Osmosis Lab complete', `${osmosisState.score}/${osmosisState.total} correct.`)}<button type="button" class="btn btn-primary" id="osmosisAgain">New lab</button>`;
      document.getElementById('osmosisAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('osmosisRestart', restart);
    restart();
  }

  /* ---------- 8. Term-Definition Match ---------- */
  let termMatchState = null;
  function initTermMatch() {
    const root = document.getElementById('termMatchRoot');
    if (!root) return;
    const poolMap = new Map();
    [...MEMORY_PAIRS.map(([term, def]) => ({ term, def })), ...GAME_TERMS_POOL.map(item => ({ term: item.term, def: item.def }))].forEach(item => poolMap.set(normalizeSearchText(item.term), item));
    const pool = [...poolMap.values()];
    const restart = () => {
      termMatchState = {
        pairs: pickMany(pool, 6),
        pickedTerm: null,
        matched: new Set(),
        start: performance.now(),
        timer: null,
        bestTime: null
      };
      renderTermMatch();
      termMatchState.timer = setInterval(updateTermClock, 250);
    };
    function elapsed() { return (performance.now() - termMatchState.start) / 1000; }
    function updateTermClock() {
      const el = document.getElementById('termMatchClock');
      if (el) el.textContent = `${elapsed().toFixed(1)}s`;
    }
    function renderTermMatch(message = '') {
      const defs = shuffleCopy(termMatchState.pairs.map(p => p.def));
      root.innerHTML = `
        <div class="mini-status">Time <span id="termMatchClock">0.0s</span></div>
        <div class="term-match-board">
          <div class="term-match-col" id="termCol"></div>
          <div class="term-match-col" id="defCol"></div>
        </div>
        <div class="game-feedback">${message}</div>
      `;
      const termCol = document.getElementById('termCol');
      const defCol = document.getElementById('defCol');
      termMatchState.pairs.forEach(pair => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mode-btn term-pill';
        b.textContent = pair.term;
        b.disabled = termMatchState.matched.has(pair.term);
        b.addEventListener('click', () => termPick(pair));
        termCol.appendChild(b);
      });
      defs.forEach(def => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mode-btn term-pill def-pill';
        b.textContent = def;
        b.disabled = [...termMatchState.matched].some(term => termMatchState.pairs.find(p => p.term === term)?.def === def);
        b.addEventListener('click', () => defPick(def));
        defCol.appendChild(b);
      });
      updateTermClock();
    }
    function flashTermFeedback(text, good) {
      root.querySelector('.game-feedback').textContent = text;
      tone(good ? 620 : 180, 0.08, good ? 'sine' : 'sawtooth', 0.06);
    }
    function termPick(pair) { termMatchState.pickedTerm = pair; flashTermFeedback(`Picked: ${pair.term}. Now choose the matching definition.`, true); }
    function defPick(def) {
      if (!termMatchState.pickedTerm) return;
      const picked = termMatchState.pickedTerm;
      const ok = picked.def === def;
      if (ok) {
        termMatchState.matched.add(picked.term);
        addXp(2);
        flashTermFeedback(`Matched ${picked.term}.`, true);
      } else {
        flashTermFeedback('Wrong pair. Try again.', false);
      }
      termMatchState.pickedTerm = null;
      if (termMatchState.matched.size >= termMatchState.pairs.length) return finishTermMatch();
      setTimeout(() => renderTermMatch(''), 450);
    }
    function finishTermMatch() {
      clearInterval(termMatchState.timer);
      const time = elapsed();
      recordGameResult('termMatch', time, false);
      root.innerHTML = `${createSummaryBox('Match complete', `Finished in ${time.toFixed(1)} seconds.`)}<button type="button" class="btn btn-primary" id="termMatchAgain">New round</button>`;
      document.getElementById('termMatchAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('termMatchRestart', restart);
    restart();
  }

  /* ---------- 9. Flash Recall Sprint ---------- */
  let sprintState = null;
  function initFlashSprint() {
    const root = document.getElementById('flashSprintRoot');
    if (!root) return;
    const restart = () => {
      sprintState = { score: 0, combo: 1, remaining: 60, deck: shuffleCopy([...GAME_BANK_MCQ]), idx: 0, timer: null, active: true };
      renderSprint();
      sprintState.timer = setInterval(() => {
        sprintState.remaining -= 1;
        const timer = document.getElementById('flashSprintTimer');
        if (timer) timer.textContent = `${sprintState.remaining}s`;
        if (sprintState.remaining <= 0) finishSprint();
      }, 1000);
    };
    function nextQuestion() {
      sprintState.idx = (sprintState.idx + 1) % sprintState.deck.length;
      renderSprint();
    }
    function renderSprint(message = '') {
      const q = sprintState.deck[sprintState.idx];
      root.innerHTML = `
        <div class="mini-status">Time <span id="flashSprintTimer">${sprintState.remaining}s</span> · Score ${sprintState.score} · Combo ×${sprintState.combo}</div>
        <div class="game-qa">${escapeHtml(q.q)}</div>
        <div class="mode-row" id="sprintOpts"></div>
        <div class="game-feedback">${message}</div>
      `;
      const wrap = document.getElementById('sprintOpts');
      q.options.forEach((opt, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mode-btn';
        b.textContent = `${'ABCD'[idx]}) ${opt}`;
        b.addEventListener('click', () => pick(idx));
        wrap.appendChild(b);
      });
      function pick(idx) {
        const ok = idx === q.correctIndex;
        if (ok) {
          sprintState.score += sprintState.combo;
          sprintState.combo += 1;
          addXp(2);
          tone(640, 0.06, 'triangle', 0.06);
        } else {
          sprintState.combo = 1;
          tone(160, 0.08, 'sawtooth', 0.05);
        }
        root.querySelector('.game-feedback').textContent = q.explain || '';
        setTimeout(nextQuestion, 650);
      }
    }
    function finishSprint() {
      sprintState.active = false;
      clearInterval(sprintState.timer);
      recordGameResult('flashSprint', sprintState.score, true);
      root.innerHTML = `${createSummaryBox('Sprint finished', `Final score: ${sprintState.score}.`)}<button type="button" class="btn btn-primary" id="sprintAgain">Sprint again</button>`;
      document.getElementById('sprintAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('flashSprintRestart', restart);
    restart();
  }

  /* ---------- 10. Word Search ---------- */
  let wordSearchState = null;
  function initWordSearch() {
    const root = document.getElementById('wordSearchRoot');
    if (!root) return;
    const size = 12;
    const words = pickMany(GAME_TERMS.searchWords, 8);
    const restart = () => {
      wordSearchState = {
        grid: Array.from({ length: size }, () => Array(size).fill('')),
        placed: [],
        found: new Set(),
        start: performance.now(),
        selecting: null,
        cells: []
      };
      placeWords();
      fillGrid();
      renderWordSearch();
    };
    function placeWords() {
      const dirs = [[1,0],[0,1]];
      words.forEach(word => {
        const w = word.toUpperCase();
        for (let attempt = 0; attempt < 120; attempt++) {
          const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
          const x = Math.floor(Math.random() * size);
          const y = Math.floor(Math.random() * size);
          const endX = x + dx * (w.length - 1);
          const endY = y + dy * (w.length - 1);
          if (endX >= size || endY >= size) continue;
          let ok = true;
          for (let i = 0; i < w.length; i++) {
            const cx = x + dx * i, cy = y + dy * i;
            const cur = wordSearchState.grid[cy][cx];
            if (cur && cur !== w[i]) { ok = false; break; }
          }
          if (!ok) continue;
          for (let i = 0; i < w.length; i++) wordSearchState.grid[y + dy * i][x + dx * i] = w[i];
          wordSearchState.placed.push({ word: w, x, y, dx, dy });
          return;
        }
      });
    }
    function fillGrid() {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) if (!wordSearchState.grid[y][x]) wordSearchState.grid[y][x] = GAME_LETTERS[Math.floor(Math.random() * GAME_LETTERS.length)];
      }
    }
    function elapsed() { return (performance.now() - wordSearchState.start) / 1000; }
    function renderWordSearch(message = '') {
      const list = words.map(w => `<span class="word-item${wordSearchState.found.has(w) ? ' found' : ''}">${w}</span>`).join('');
      root.innerHTML = `
        <div class="mini-status">Found ${wordSearchState.found.size}/${words.length} · Time ${elapsed().toFixed(1)}s</div>
        <div class="wordsearch-board" id="wordsearchBoard"></div>
        <div class="wordsearch-list">${list}</div>
        <div class="game-feedback">${message}</div>
      `;
      const board = document.getElementById('wordsearchBoard');
      wordSearchState.cells = [];
      for (let y = 0; y < size; y++) {
        const row = document.createElement('div');
        row.className = 'wordsearch-row';
        for (let x = 0; x < size; x++) {
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'wordsearch-cell';
          cell.textContent = wordSearchState.grid[y][x];
          cell.dataset.x = x;
          cell.dataset.y = y;
          cell.addEventListener('click', () => selectCell(x, y));
          row.appendChild(cell);
          wordSearchState.cells.push(cell);
        }
        board.appendChild(row);
      }
    }
    function highlightPath(path) {
      wordSearchState.cells.forEach(c => c.classList.remove('path'));
      path.forEach(([x, y]) => wordSearchState.cells[y * size + x].classList.add('path'));
    }
    function selectCell(x, y) {
      if (!wordSearchState.selecting) {
        wordSearchState.selecting = { x, y };
        highlightPath([[x, y]]);
        return;
      }
      const start = wordSearchState.selecting;
      const dx = Math.sign(x - start.x);
      const dy = Math.sign(y - start.y);
      const horiz = start.y === y && x !== start.x;
      const vert = start.x === x && y !== start.y;
      if (!horiz && !vert) {
        wordSearchState.selecting = null;
        renderWordSearch('Pick a straight horizontal or vertical word.');
        return;
      }
      const len = Math.max(Math.abs(x - start.x), Math.abs(y - start.y)) + 1;
      const path = [];
      let word = '';
      for (let i = 0; i < len; i++) {
        const cx = start.x + dx * i;
        const cy = start.y + dy * i;
        word += wordSearchState.grid[cy][cx];
        path.push([cx, cy]);
      }
      highlightPath(path);
      const found = wordSearchState.placed.find(p => {
        const coords = Array.from({ length: p.word.length }, (_, i) => `${p.x + p.dx * i},${p.y + p.dy * i}`);
        const test = path.map(([px, py]) => `${px},${py}`);
        return coords.length === test.length && coords.every(c => test.includes(c));
      });
      if (found && !wordSearchState.found.has(found.word)) {
        wordSearchState.found.add(found.word);
        addXp(3);
        tone(660, 0.08, 'triangle', 0.06);
        if (wordSearchState.found.size === words.length) finishWordSearch();
        else renderWordSearch(`Found ${found.word}!`);
      } else {
        tone(180, 0.08, 'sawtooth', 0.05);
        renderWordSearch('Not a placed word. Try another line.');
      }
      wordSearchState.selecting = null;
    }
    function finishWordSearch() {
      recordGameResult('wordSearch', elapsed(), false);
      unlockBadge('wordsearch_clear');
      burstConfetti();
      root.innerHTML = `${createSummaryBox('Word Search cleared', `You found every word in ${elapsed().toFixed(1)} seconds.`)}<button type="button" class="btn btn-primary" id="wordSearchAgain">New puzzle</button>`;
      document.getElementById('wordSearchAgain')?.addEventListener('click', restart);
    }
    bindGameRestart('wordSearchRestart', restart);
    restart();
  }

  function initNewGames() {
    initTrueFalseBlitz();
    initWordScramble();
    initHangman();
    initOddOneOut();
    initClozeGame();
    initMillionaireLadder();
    initOsmosisLab();
    initTermMatch();
    initFlashSprint();
    initWordSearch();
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
  initNewGames();
  refreshXpUI();
})();
