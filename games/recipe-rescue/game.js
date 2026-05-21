'use strict';

// ── Level definitions ────────────────────────────────────────────────
// Each step: { id, text, emoji, required, order }
// order = position among required steps (1-based). null = decoy.
// orderConstraints: pairs [a, b] meaning step a must appear before step b.

const LEVELS = [
  null,

  /* ── Level 1 ── Make Toast ── 4 required + 2 obvious decoys ── */
  {
    dish: 'Make Toast',
    dishEmoji: '🍞',
    taskDesc: 'Help Chef Bot make toast! Pick the right steps in order.',
    hint: 'Start with getting the bread. Put it in the toaster. Wait. Then serve!',
    showSlotLabels: true,
    slotLabels: ['Step 1: Prepare', 'Step 2: Cook', 'Step 3: Wait', 'Step 4: Serve'],
    steps: [
      { id: 'get_bread',    text: 'Get the bread',    emoji: '🍞', required: true,  order: 1 },
      { id: 'put_toaster',  text: 'Put in toaster',   emoji: '🔌', required: true,  order: 2 },
      { id: 'wait_toast',   text: 'Wait for toast',   emoji: '⏰', required: true,  order: 3 },
      { id: 'put_plate',    text: 'Put on plate',     emoji: '🍽️', required: true,  order: 4 },
      { id: 'water_plants', text: 'Water the plants', emoji: '🌱', required: false, order: null },
      { id: 'fly_moon',     text: 'Fly to the moon',  emoji: '🚀', required: false, order: null },
    ],
    orderConstraints: [
      ['get_bread', 'put_toaster'],
      ['put_toaster', 'wait_toast'],
      ['wait_toast', 'put_plate'],
    ],
    optimalSteps: 4,
    robotSuccess: 'Yummy toast! 😋',
    robotDecoyMsg: { water_plants: 'I\'m cooking, not gardening! 🌱😕', fly_moon: 'The kitchen is on Earth! 🚀😕' },
  },

  /* ── Level 2 ── Make a Salad ── 6 required + 4 plausible decoys ── */
  {
    dish: 'Make a Salad',
    dishEmoji: '🥗',
    taskDesc: 'Make a fresh salad! Watch out for steps that don\'t belong.',
    hint: 'Get a bowl first. Wash and chop the veggies. Add dressing, mix, then serve!',
    showSlotLabels: false,
    slotLabels: [],
    steps: [
      { id: 'get_bowl',       text: 'Get a bowl',          emoji: '🥣', required: true,  order: 1 },
      { id: 'wash_veggies',   text: 'Wash the vegetables', emoji: '🚿', required: true,  order: 2 },
      { id: 'chop_veggies',   text: 'Chop the vegetables', emoji: '🔪', required: true,  order: 3 },
      { id: 'add_veggies',    text: 'Add veggies to bowl', emoji: '🥦', required: true,  order: 4 },
      { id: 'add_dressing',   text: 'Pour the dressing',   emoji: '🫙', required: true,  order: 5 },
      { id: 'mix_salad',      text: 'Mix the salad',       emoji: '🥄', required: true,  order: 6 },
      { id: 'boil_water',     text: 'Boil some water',     emoji: '♨️', required: false, order: null },
      { id: 'add_sugar',      text: 'Add lots of sugar',   emoji: '🍬', required: false, order: null },
      { id: 'wash_hands_mid', text: 'Wash hands (step 4)', emoji: '🙌', required: false, order: null },
      { id: 'get_fork_extra', text: 'Get a fork to eat',   emoji: '🍴', required: false, order: null },
    ],
    orderConstraints: [
      ['get_bowl',     'add_veggies'],
      ['wash_veggies', 'chop_veggies'],
      ['chop_veggies', 'add_veggies'],
      ['add_veggies',  'add_dressing'],
      ['add_dressing', 'mix_salad'],
    ],
    optimalSteps: 6,
    robotSuccess: 'Freshest salad ever! 🥗😄',
    robotDecoyMsg: {
      boil_water:     'You don\'t boil a salad! 😕',
      add_sugar:      'Sugar in salad? Yuck! 🍬😟',
      wash_hands_mid: 'Wash hands BEFORE cooking, not in the middle! 🙌😕',
      get_fork_extra: 'I need to MAKE it first, then eat it! 🍴😕',
    },
  },

  /* ── Level 3 ── Pack School Bag ── 7 required + 5 decoys ── */
  {
    dish: 'Pack School Bag',
    dishEmoji: '🎒',
    taskDesc: 'Pack the school bag correctly — pick only what\'s needed, in the right order!',
    hint: 'Get the bag first. Pack books and pencil case. Then close the bag and wear it!',
    showSlotLabels: false,
    slotLabels: [],
    steps: [
      { id: 'get_bag',      text: 'Get the school bag',  emoji: '🎒', required: true,  order: 1 },
      { id: 'get_books',    text: 'Get the textbooks',   emoji: '📚', required: true,  order: 2 },
      { id: 'pack_books',   text: 'Pack books in bag',   emoji: '📖', required: true,  order: 3 },
      { id: 'get_pencils',  text: 'Get pencil case',     emoji: '✏️', required: true,  order: 4 },
      { id: 'pack_pencils', text: 'Pack pencil case',    emoji: '🖊️', required: true,  order: 5 },
      { id: 'close_bag',    text: 'Close the bag',       emoji: '🤐', required: true,  order: 6 },
      { id: 'wear_bag',     text: 'Wear the bag',        emoji: '🧑‍🎒', required: true,  order: 7 },
      { id: 'eat_breakfast',  text: 'Eat breakfast',       emoji: '🍳', required: false, order: null },
      { id: 'watch_tv',       text: 'Watch TV first',      emoji: '📺', required: false, order: null },
      { id: 'sharpen_mid',    text: 'Sharpen all pencils', emoji: '🔧', required: false, order: null },
      { id: 'pack_toys',      text: 'Pack favourite toys',  emoji: '🧸', required: false, order: null },
      { id: 'water_plants2',  text: 'Water the plants',    emoji: '🌱', required: false, order: null },
    ],
    orderConstraints: [
      ['get_bag',     'pack_books'],
      ['get_books',   'pack_books'],
      ['pack_books',  'get_pencils'],
      ['get_pencils', 'pack_pencils'],
      ['pack_pencils','close_bag'],
      ['close_bag',   'wear_bag'],
    ],
    optimalSteps: 7,
    robotSuccess: 'Ready for school! 🎒🏫✨',
    robotDecoyMsg: {
      eat_breakfast:  'I should eat BEFORE packing, not during! 🍳😕',
      watch_tv:       'No TV time right now! 📺😟',
      sharpen_mid:    'Sharpen pencils before packing, not as a step! 🔧😕',
      pack_toys:      'Toys don\'t go in the school bag! 🧸😕',
      water_plants2:  'That\'s not a school bag step! 🌱😕',
    },
  },
];

// ── Logger ────────────────────────────────────────────────────────────
// RecipeRescueLogger is loaded from logger.js (declared via <script> in index.html)
let rrLogger;

// ── State ────────────────────────────────────────────────────────────
let S = {};

function buildState(n) {
  return {
    levelNum: n,
    taskId: `lvl${n}`,
    lvl: LEVELS[n],
    sequence: [],
    attempts: 0,
    hintsUsed: 0,
    selfCorrections: 0,
    isRunning: false,
    lastRunCrashed: false,
    sessionStart: Date.now(),
    timerInterval: null,
    dragSrcIdx: null,
    cardPickupTimes: {},    // stepId → timestamp when card was tapped
    cardDwellTimes: {},     // stepId → ms between pickup and placement
    cardAttemptCounts: {},  // stepId → total placement count (for firstTry detection)
    editOps: [],            // ordered list of insert/delete ops for sequenceConstructed
    editStartMs: null,      // timestamp of first card added in this build attempt
  };
}

// ── Timer ────────────────────────────────────────────────────────────
function startTimer() {
  if (S.timerInterval) clearInterval(S.timerInterval);
  S.sessionStart = Date.now();
  S.timerInterval = setInterval(() => {
    const sec = Math.floor((Date.now() - S.sessionStart) / 1000);
    document.getElementById('time-display').textContent = `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
  }, 1000);
}
function stopTimer() { clearInterval(S.timerInterval); }

// ── Card management ───────────────────────────────────────────────────
function addCardToSequence(stepId) {
  if (S.isRunning) return;
  if (S.sequence.includes(stepId)) return;

  const step = S.lvl.steps.find(s => s.id === stepId);
  const now = Date.now();
  const dwellMs = S.cardPickupTimes[stepId] ? now - S.cardPickupTimes[stepId] : 0;

  if (!S.editStartMs) S.editStartMs = now;
  S.cardPickupTimes[stepId] = now;
  S.cardDwellTimes[stepId]  = dwellMs;
  S.cardAttemptCounts[stepId] = (S.cardAttemptCounts[stepId] || 0) + 1;

  const slotIndex = S.sequence.length;
  S.sequence.push(stepId);

  S.editOps.push({ op: 'insert', position: slotIndex, element_id: stepId, ts_offset_ms: now - S.editStartMs });

  rrLogger.cardPickup({ taskId: S.taskId, cardId: stepId, isDecoy: !step.required, attemptNumber: S.attempts });
  rrLogger.cardPlaced({ taskId: S.taskId, cardId: stepId, slotIndex, isDecoy: !step.required, dwellTimeBeforePlaceMs: dwellMs });

  renderAll();
}

function removeCardFromSequence(idx) {
  if (S.isRunning) return;
  const stepId = S.sequence[idx];
  const step = S.lvl.steps.find(s => s.id === stepId);
  const wasDecoy = !step.required;
  const dwellMs = S.cardPickupTimes[stepId] ? Date.now() - S.cardPickupTimes[stepId] : 0;
  // 'crash' = removed after a failed run; 'self' = proactive removal before any run or after reviewing
  const trigger = S.lastRunCrashed ? 'crash' : 'self';

  const now = Date.now();
  if (!S.editStartMs) S.editStartMs = now;
  S.editOps.push({ op: 'delete', position: idx, element_id: stepId, ts_offset_ms: now - S.editStartMs });

  S.sequence.splice(idx, 1);

  rrLogger.cardRemoved({
    taskId: S.taskId, cardId: stepId, fromSlot: idx,
    dwellTimeInSlotMs: dwellMs, trigger, wasDecoy, removedBeforeSubmit: true,
  });

  if (wasDecoy) {
    rrLogger.decoyRemoved({ taskId: S.taskId, cardId: stepId, timeInSlotMs: dwellMs, removedBy: trigger });
    // Self-removal of a decoy before submit = metacognition signal
    if (trigger === 'self') {
      S.selfCorrections++;
      rrLogger.selfCorrectionMade({
        taskId: S.taskId, stepIndex: idx, correctionType: 'before_submit',
        originalCard: stepId, correctedCard: null,
        timeToCorrectMs: dwellMs, resultedInCorrect: true,
      });
    }
  }

  renderAll();
}

function clearSequence() {
  if (S.isRunning) return;
  // Log each removal as a system clear
  S.sequence.forEach((stepId, idx) => {
    const step = S.lvl.steps.find(s => s.id === stepId);
    const wasDecoy = !step.required;
    rrLogger.cardRemoved({
      taskId: S.taskId, cardId: stepId, fromSlot: idx,
      dwellTimeInSlotMs: S.cardPickupTimes[stepId] ? Date.now() - S.cardPickupTimes[stepId] : 0,
      trigger: 'system', wasDecoy, removedBeforeSubmit: true,
    });
    if (wasDecoy) rrLogger.decoyRemoved({ taskId: S.taskId, cardId: stepId, timeInSlotMs: 0, removedBy: 'system' });
  });
  S.sequence  = [];
  S.editOps   = [];
  S.editStartMs = null;
  renderAll();
}

function reorderSequence(fromIdx, toIdx) {
  if (fromIdx === null || fromIdx === toIdx) return;
  const cardId = S.sequence[fromIdx];
  S.sequence.splice(fromIdx, 1);
  S.sequence.splice(toIdx, 0, cardId);
  rrLogger.sequenceReordered({ taskId: S.taskId, cardId, fromSlot: fromIdx, toSlot: toIdx, afterCrash: S.lastRunCrashed });
  renderAll();
}

// ── Rendering ─────────────────────────────────────────────────────────
function renderAll() {
  renderCardTray();
  renderSequence();
}

function renderCardTray() {
  const tray = document.getElementById('card-tray');
  tray.innerHTML = '';
  S.shuffledSteps.forEach(step => {
    const card = document.createElement('div');
    card.className = 'tray-card' + (S.sequence.includes(step.id) ? ' used' : '');
    card.innerHTML = `<span class="card-emoji">${step.emoji}</span><span class="card-text">${step.text}</span>`;
    card.onclick = () => addCardToSequence(step.id);
    tray.appendChild(card);
  });
}

function renderSequence() {
  const seq = document.getElementById('sequence');
  seq.innerHTML = '';
  const lvl = S.lvl;

  S.sequence.forEach((stepId, idx) => {
    const step = lvl.steps.find(s => s.id === stepId);

    if (lvl.showSlotLabels && lvl.slotLabels[idx]) {
      const lbl = document.createElement('div');
      lbl.className = 'slot-label';
      lbl.textContent = lvl.slotLabels[idx];
      seq.appendChild(lbl);
    }

    const card = document.createElement('div');
    card.className = 'seq-card' + (!step.required ? ' decoy-card' : '');
    card.draggable = true;
    card.dataset.idx = idx;

    card.innerHTML = `
      <span class="step-num">${idx + 1}</span>
      <span class="card-emoji">${step.emoji}</span>
      <span class="card-text">${step.text}</span>
      <button class="remove-btn" title="Remove">✕</button>
    `;

    card.querySelector('.remove-btn').onclick = (e) => { e.stopPropagation(); removeCardFromSequence(idx); };

    card.addEventListener('dragstart', (e) => { S.dragSrcIdx = idx; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend',   ()  => { card.classList.remove('dragging'); S.dragSrcIdx = null; });
    card.addEventListener('dragover',  (e) => { e.preventDefault(); });
    card.addEventListener('drop',      (e) => { e.preventDefault(); reorderSequence(S.dragSrcIdx, idx); });

    seq.appendChild(card);
  });

  document.getElementById('seq-count').textContent = `${S.sequence.length} step${S.sequence.length !== 1 ? 's' : ''}`;
}

function setRobot(face, bubbleText, bubbleClass) {
  const faceEl = document.getElementById('robot-face');
  const bubble = document.getElementById('robot-bubble');
  faceEl.textContent = face;
  faceEl.className = bubbleClass || '';
  if (bubbleText) {
    bubble.textContent = bubbleText;
    bubble.className = bubbleClass || '';
    bubble.classList.remove('hidden');
  } else {
    bubble.classList.add('hidden');
  }
}

function addLog(text, type = 'info') {
  const log = document.getElementById('exec-log');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = text;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function clearLog() {
  document.getElementById('exec-log').innerHTML = '';
}

function highlightSeqCard(idx, cls) {
  document.querySelectorAll('.seq-card').forEach(c => c.classList.remove('active-step', 'error-step'));
  const cards = document.querySelectorAll('.seq-card');
  if (cards[idx]) cards[idx].classList.add(cls);
}

// ── Execution ─────────────────────────────────────────────────────────
async function runRecipe() {
  if (S.isRunning) return;
  if (S.sequence.length === 0) { toast('Add some steps first! 👆', 'info'); return; }

  S.isRunning = true;
  S.lastRunCrashed = false;
  S.attempts++;
  document.getElementById('attempt-num').textContent = S.attempts;
  setControlsEnabled(false);
  clearLog();
  setRobot('👨‍🍳', 'Let\'s cook!', 'running');

  const submittedSeq = [...S.sequence];
  const correctSeq   = S.lvl.steps.filter(s => s.required).sort((a,b) => a.order - b.order).map(s => s.id);

  rrLogger.sequenceConstructed({
    taskId: S.taskId,
    submittedSequence: submittedSeq,
    correctSequence:   correctSeq,
    editOperations:    S.editOps,
    totalEditTimeMs:   S.editStartMs ? Date.now() - S.editStartMs : 0,
    submissionAttempt: S.attempts,
  });

  // Reset edit tracking for the next build attempt
  S.editOps     = [];
  S.editStartMs = null;

  const lvl = S.lvl;
  let crashed  = false;
  let crashIdx = -1;

  for (let i = 0; i < submittedSeq.length; i++) {
    const stepId = submittedSeq[i];
    const step = lvl.steps.find(s => s.id === stepId);

    highlightSeqCard(i, 'active-step');
    await sleep(500);

    // ── Decoy check ───────────────────────────────────────────────
    if (!step.required) {
      crashed  = true;
      crashIdx = i;
      highlightSeqCard(i, 'error-step');
      const msg = lvl.robotDecoyMsg[stepId] || 'That doesn\'t belong here! 😕';
      setRobot('😵', msg, 'error');
      addLog(`✗ Step ${i+1}: "${step.text}" — not needed!`, 'err');

      rrLogger.stepAttempted({ taskId: S.taskId, stepIndex: i, cardId: stepId, isCorrect: false, timeOnStepMs: S.cardDwellTimes[stepId] || 0, attemptsOnStep: S.cardAttemptCounts[stepId] || 1, helpUsed: S.hintsUsed > 0 });
      rrLogger.decoyPlaced({ taskId: S.taskId, cardId: stepId, slotIndex: i, dwellTimeBeforePlaceMs: S.cardDwellTimes[stepId] || 0 });

      await sleep(900);

      rrLogger.robotFailureWatched({ taskId: S.taskId, crashStepIndex: i, crashType: 'decoy_included', didWatchFull: true, replayCount: 0 });
      break;
    }

    // ── Order constraint check ────────────────────────────────────
    const violation = checkOrderViolation(submittedSeq, stepId, i, lvl);
    if (violation) {
      crashed  = true;
      crashIdx = i;
      highlightSeqCard(i, 'error-step');
      setRobot('🤔', `Hmm, "${violation.before}" should come before "${violation.after}"!`, 'error');
      addLog(`✗ Step ${i+1}: wrong order — "${violation.before}" must come first`, 'err');

      rrLogger.stepAttempted({ taskId: S.taskId, stepIndex: i, cardId: stepId, isCorrect: false, timeOnStepMs: S.cardDwellTimes[stepId] || 0, attemptsOnStep: S.cardAttemptCounts[stepId] || 1, helpUsed: S.hintsUsed > 0 });
      rrLogger.orderViolationDetected({ taskId: S.taskId, attemptNumber: S.attempts, violatingCardId: stepId, mustComeBeforeId: violation.beforeId, detectedAtSlot: i });

      await sleep(900);

      rrLogger.robotFailureWatched({ taskId: S.taskId, crashStepIndex: i, crashType: 'wrong_order', didWatchFull: true, replayCount: 0 });
      break;
    }

    // ── Step OK ───────────────────────────────────────────────────
    rrLogger.stepAttempted({ taskId: S.taskId, stepIndex: i, cardId: stepId, isCorrect: true, timeOnStepMs: S.cardDwellTimes[stepId] || 0, attemptsOnStep: S.cardAttemptCounts[stepId] || 1, helpUsed: S.hintsUsed > 0 });

    setRobot('😊', `${step.emoji} ${step.text}...`, 'success');
    addLog(`✓ ${step.emoji} ${step.text}`, 'ok');
    await sleep(350);
  }

  if (!crashed) {
    const missing = lvl.steps.filter(s => s.required && !submittedSeq.includes(s.id));
    if (missing.length > 0) {
      S.lastRunCrashed = true;
      setRobot('😟', 'I\'m missing some steps!', 'error');
      addLog(`✗ Missing: ${missing.map(s => s.text).join(', ')}`, 'err');
      toast(`Missing steps: ${missing.map(s => s.text).join(', ')}`, 'error');
      rrLogger.robotFailureWatched({ taskId: S.taskId, crashStepIndex: submittedSeq.length, crashType: 'missing_required', didWatchFull: true, replayCount: 0 });
    } else {
      // WIN
      document.querySelectorAll('.seq-card').forEach(c => c.classList.remove('active-step', 'error-step'));
      setRobot('🎉', lvl.robotSuccess, 'success');
      addLog(`🎉 ${lvl.robotSuccess}`, 'ok');
      await sleep(400);
      handleWin();
    }
  } else {
    S.lastRunCrashed = true;
    toast('Chef Bot got confused! Fix the step that caused the problem.', 'error');
  }

  document.querySelectorAll('.seq-card').forEach(c => c.classList.remove('active-step'));
  S.isRunning = false;
  setControlsEnabled(true);
}

function checkOrderViolation(seq, currentId, currentIdx, lvl) {
  for (const [before, after] of lvl.orderConstraints) {
    if (after === currentId && !seq.slice(0, currentIdx).includes(before)) {
      const beforeStep = lvl.steps.find(s => s.id === before);
      const afterStep  = lvl.steps.find(s => s.id === after);
      return { before: beforeStep?.text, after: afterStep?.text, beforeId: before, afterId: after };
    }
  }
  return null;
}

function handleWin() {
  stopTimer();
  const elapsed = Math.floor((Date.now() - S.sessionStart) / 1000);
  const m = Math.floor(elapsed / 60), sec = elapsed % 60;
  const decoysPlaced = S.sequence.filter(id => !S.lvl.steps.find(s => s.id === id)?.required).length;

  // Count required steps placed correctly on first attempt (attempt count = 1)
  const stepsCorrectFirstTry = S.lvl.steps
    .filter(s => s.required && S.cardAttemptCounts[s.id] === 1)
    .length;

  rrLogger.taskCompleted({
    taskId:               S.taskId,
    totalTimeMs:          Date.now() - S.sessionStart,
    stepsCorrectFirstTry,
    totalSteps:           S.lvl.optimalSteps,
    hintsUsed:            S.hintsUsed,
    selfCorrections:      S.selfCorrections,
    finalScoreRaw:        Math.max(0, 100 - (S.attempts - 1) * 15 - S.hintsUsed * 5 - decoysPlaced * 10),
    difficultyLevel:      S.levelNum,
    wonOnFirstAttempt:    S.attempts === 1,
  });

  document.getElementById('win-emoji').textContent = S.attempts === 1 ? '🏆' : '🎉';
  document.getElementById('win-title').textContent = S.attempts === 1 ? 'Perfect Recipe!' : 'Recipe Rescued!';
  document.getElementById('win-stats').innerHTML = `
    ⏱ Time: ${m}:${sec.toString().padStart(2,'0')}<br>
    📋 Steps used: ${S.sequence.length} (needed: ${S.lvl.optimalSteps})<br>
    🔁 Attempts: ${S.attempts}<br>
    💡 Hints used: ${S.hintsUsed}
  `;
  document.getElementById('next-btn').textContent = S.levelNum < 3 ? 'Next Level →' : 'Finish! 🏆';
  document.getElementById('win-modal').classList.remove('hidden');
}

// ── Hint ──────────────────────────────────────────────────────────────
function requestHint() {
  if (S.isRunning) return;
  S.hintsUsed++;
  rrLogger.hintRequested({
    taskId:           S.taskId,
    hintLevel:        Math.min(S.hintsUsed, 3),
    timeSinceStartMs: Date.now() - S.sessionStart,
    priorAttempts:    S.attempts,
  });
  toast('💡 ' + S.lvl.hint, 'info', 5000);
}

// ── Reset ─────────────────────────────────────────────────────────────
function resetRun() {
  if (S.isRunning) return;
  clearLog();
  setRobot('👨‍🍳', null, '');
}

// ── Controls ──────────────────────────────────────────────────────────
function setControlsEnabled(enabled) {
  ['run-btn','reset-btn','clear-btn','hint-btn'].forEach(id => { document.getElementById(id).disabled = !enabled; });
}

let _toastTimer = null;
function toast(msg, type = 'info', duration = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = type;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
}

// ── Level load ────────────────────────────────────────────────────────
function loadLevel(n) {
  if (S.timerInterval) clearInterval(S.timerInterval);

  // Hide modals and re-enable controls BEFORE any payload construction
  document.getElementById('win-modal').classList.add('hidden');
  document.getElementById('done-modal').classList.add('hidden');
  setControlsEnabled(true);

  S = buildState(n);
  S.shuffledSteps = [...LEVELS[n].steps].sort(() => Math.random() - 0.5);

  document.getElementById('level-num').textContent = n;
  document.getElementById('task-desc').textContent = LEVELS[n].taskDesc;
  document.getElementById('attempt-num').textContent = 1;
  document.getElementById('time-display').textContent = '0:00';
  document.getElementById('dish-emoji').textContent = LEVELS[n].dishEmoji;
  document.getElementById('dish-name').textContent = LEVELS[n].dish;

  clearLog();
  setRobot('👨‍🍳', null, '');
  renderAll();
  startTimer();

  rrLogger.taskStarted({
    taskId:       S.taskId,
    levelNum:     n,
    maxSteps:     LEVELS[n].steps.filter(s => s.required).length,
    timeLimitSec: 480,
    promptText:   LEVELS[n].taskDesc,
  });
}

function nextLevel() {
  const next = S.levelNum + 1;
  if (next <= 3) {
    loadLevel(next);
  } else {
    document.getElementById('win-modal').classList.add('hidden');
    document.getElementById('done-modal').classList.remove('hidden');
    // All levels complete — export full session to localStorage
    rrLogger.exportSession();
  }
}

function restartGame() { loadLevel(1); }

// ── Utility ───────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Boot ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  rrLogger = new RecipeRescueLogger();
  loadLevel(1);
});
