'use strict';

// ── Direction constants ───────────────────────────────────────────────
const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
const DR  = [-1, 0, 1, 0];   // row delta per direction
const DC  = [ 0, 1, 0,-1];   // col delta per direction
const DIR_ARROWS = ['⬆️', '➡️', '⬇️', '⬅️'];

// ── Level definitions ────────────────────────────────────────────────
//   Grid: row 0 = top, col 0 = left
const LEVELS = [
  null, // 1-indexed

  /* ── Level 1 ── 5×5, go right to the flag ── */
  {
    size: 5,
    start: { r: 4, c: 0, dir: DIR.RIGHT },
    goal:  { r: 4, c: 4 },
    objects: [],
    obstacles: [],
    requiredObjects: [],
    showGhost: true,
    optimalMoves: 4,
    hasRepeat: false,
    taskDesc: 'Get Botley to the flag! 🏁',
    hint: 'Botley faces RIGHT. Add 4 MOVE blocks and press RUN!',
  },

  /* ── Level 2 ── 6×6, collect the star ── */
  {
    size: 6,
    start: { r: 5, c: 0, dir: DIR.UP },
    goal:  { r: 0, c: 5 },
    objects: [{ id: 'star', r: 0, c: 5, emoji: '⭐' }],
    obstacles: [],
    requiredObjects: ['star'],
    showGhost: false,
    optimalMoves: 12,
    hasRepeat: false,
    taskDesc: 'Go up, then right — collect the star! ⭐',
    hint: 'Go UP 5 times, TURN RIGHT, go right 5 times, then PICK UP.',
  },

  /* ── Level 3 ── 7×7, collect two gems, use REPEAT ── */
  {
    size: 7,
    start: { r: 6, c: 0, dir: DIR.RIGHT },
    goal:  { r: 0, c: 6 },
    objects: [
      { id: 'gem1', r: 6, c: 6, emoji: '💎' },
      { id: 'gem2', r: 0, c: 6, emoji: '💎' },
    ],
    obstacles: [],
    requiredObjects: ['gem1', 'gem2'],
    showGhost: false,
    optimalMoves: 7,
    hasRepeat: true,
    taskDesc: 'Collect both gems — use REPEAT to save blocks! 💎💎',
    hint: 'REPEAT(6)+MOVE goes right 6. PICK UP gem1. TURN LEFT. REPEAT(6)+MOVE goes up 6. PICK UP gem2!',
  },
];

// ── Telemetry ────────────────────────────────────────────────────────
const _sessionId  = (crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
let   _eventSeq   = 0;

function _studentId() {
  let id = localStorage.getItem('candela_student_id');
  if (!id) { id = 'stu_' + Math.random().toString(36).slice(2, 8); localStorage.setItem('candela_student_id', id); }
  return id;
}

function emit(name, payload) {
  const ev = {
    session_id:  _sessionId,
    student_id:  _studentId(),
    game_id:     'botleys_big_day',
    event_name:  name,
    event_seq:   ++_eventSeq,
    client_ts:   new Date().toISOString(),
    payload,
  };
  try {
    const arr = JSON.parse(localStorage.getItem('candela_events') || '[]');
    arr.push(ev);
    localStorage.setItem('candela_events', JSON.stringify(arr));
  } catch (_) {}
  console.debug('[Candela]', name, payload);
}

// ── Game state ───────────────────────────────────────────────────────
let S = {};   // current game state (rebuilt on each level load)

function buildState(levelNum) {
  const lvl = LEVELS[levelNum];
  return {
    levelNum,
    lvl,
    botley: { ...lvl.start },
    objects: lvl.objects.map(o => ({ ...o, collected: false })),
    program: [],          // [{uid, type, count?}]  count only for REPEAT
    isRunning: false,
    attempts: 0,
    hintsUsed: 0,
    editOps: [],          // for sequence_constructed event
    sessionStart: Date.now(),
    timerInterval: null,
    dragSrcIdx: null,
  };
}

// ── Timer ────────────────────────────────────────────────────────────
function startTimer() {
  if (S.timerInterval) clearInterval(S.timerInterval);
  S.sessionStart = Date.now();
  S.timerInterval = setInterval(() => {
    const sec = Math.floor((Date.now() - S.sessionStart) / 1000);
    const m = Math.floor(sec / 60), s = sec % 60;
    document.getElementById('time-display').textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function stopTimer() { clearInterval(S.timerInterval); }

// ── Block UID generator ───────────────────────────────────────────────
let _uid = 0;
const uid = () => ++_uid;

// ── Program management ───────────────────────────────────────────────
function addBlock(type) {
  if (S.isRunning) return;
  const block = { uid: uid(), type };
  if (type === 'REPEAT') block.count = 3;
  const pos = S.program.length;
  S.program.push(block);
  S.editOps.push({ op: 'insert', position: pos, element_id: type, ts_offset_ms: Date.now() - S.sessionStart });
  emit('block_added', { block_type: type, position_in_stack: pos, timestamp: new Date().toISOString() });
  renderProgram();
}

function removeBlock(idx) {
  if (S.isRunning) return;
  const block = S.program[idx];
  S.editOps.push({ op: 'delete', position: idx, element_id: block.type, ts_offset_ms: Date.now() - S.sessionStart });
  emit('block_removed', { block_type: block.type, position_in_stack: idx, timestamp: new Date().toISOString() });
  S.program.splice(idx, 1);
  renderProgram();
}

function clearProgram() {
  if (S.isRunning) return;
  S.program = [];
  S.editOps = [];
  renderProgram();
  resetBotley();
}

function adjustRepeat(idx, delta) {
  if (S.isRunning) return;
  const block = S.program[idx];
  if (block.type !== 'REPEAT') return;
  block.count = Math.max(1, Math.min(9, block.count + delta));
  renderProgram();
}

// ── Rendering ────────────────────────────────────────────────────────
function renderGrid() {
  const lvl = S.lvl;
  const gridEl = document.getElementById('grid');
  gridEl.style.gridTemplateColumns = `repeat(${lvl.size}, 1fr)`;
  gridEl.innerHTML = '';

  for (let r = 0; r < lvl.size; r++) {
    for (let c = 0; c < lvl.size; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      // Ghost path (L1 only — row 4 cells after start)
      if (lvl.showGhost && r === 4 && c > 0) cell.classList.add('ghost');

      // Obstacle
      const isObstacle = lvl.obstacles.some(o => o.r === r && o.c === c);
      if (isObstacle) { cell.classList.add('obstacle'); cell.textContent = '🧱'; }

      // Goal
      if (r === lvl.goal.r && c === lvl.goal.c) {
        cell.classList.add('goal');
        if (!isObstacle) cell.textContent = '🏁';
      }

      // Objects still on grid
      const obj = S.objects.find(o => o.r === r && o.c === c && !o.collected);
      if (obj) { cell.classList.add('object-cell'); cell.textContent = obj.emoji; }

      // Botley (rendered last so it overlays)
      if (S.botley.r === r && S.botley.c === c) {
        cell.classList.add('botley');
        const sprite = document.createElement('span');
        sprite.className = 'botley-sprite';
        sprite.textContent = '🤖';
        sprite.style.transform = `rotate(${S.botley.dir * 90}deg)`;
        cell.innerHTML = '';
        cell.appendChild(sprite);
      }

      gridEl.appendChild(cell);
    }
  }
}

function renderProgram() {
  const stack = document.getElementById('instruction-stack');
  stack.innerHTML = '';

  S.program.forEach((block, idx) => {
    const el = document.createElement('div');
    el.className = `stack-block type-${block.type}`;
    el.draggable = true;
    el.dataset.idx = idx;

    // Step number
    const num = document.createElement('span');
    num.className = 'step-num';
    num.textContent = idx + 1;

    // Icon + label
    const icon = document.createElement('span');
    icon.className = 'b-icon';
    icon.textContent = blockIcon(block.type);

    const lbl = document.createElement('span');
    lbl.textContent = blockLabel(block);

    // Repeat controls
    if (block.type === 'REPEAT') {
      const ctrl = document.createElement('div');
      ctrl.className = 'repeat-controls';
      const minus = document.createElement('button');
      minus.textContent = '−';
      minus.onclick = (e) => { e.stopPropagation(); adjustRepeat(idx, -1); };
      const count = document.createElement('span');
      count.className = 'repeat-count';
      count.textContent = block.count;
      const plus = document.createElement('button');
      plus.textContent = '+';
      plus.onclick = (e) => { e.stopPropagation(); adjustRepeat(idx, 1); };
      ctrl.append(minus, count, plus);
      lbl.textContent = 'REPEAT ×';
      el.append(num, icon, lbl, ctrl);
    } else {
      el.append(num, icon, lbl);
    }

    // Remove button
    const rm = document.createElement('button');
    rm.className = 'remove-btn';
    rm.textContent = '✕';
    rm.title = 'Remove';
    rm.onclick = (e) => { e.stopPropagation(); removeBlock(idx); };
    el.appendChild(rm);

    // Drag events for reorder
    el.addEventListener('dragstart', (e) => { S.dragSrcIdx = idx; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend',   ()  => { el.classList.remove('dragging'); S.dragSrcIdx = null; });
    el.addEventListener('dragover',  (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    el.addEventListener('drop',      (e) => { e.preventDefault(); reorderBlock(S.dragSrcIdx, idx); });

    stack.appendChild(el);
  });

  document.getElementById('block-count').textContent = `${S.program.length} block${S.program.length !== 1 ? 's' : ''}`;
}

function blockIcon(type) {
  return { MOVE: '🚶', TURN_LEFT: '↩️', TURN_RIGHT: '↪️', PICK_UP: '✋', PUT_DOWN: '📥', REPEAT: '🔄' }[type] || '?';
}

function blockLabel(block) {
  return { MOVE: 'MOVE FORWARD', TURN_LEFT: 'TURN LEFT', TURN_RIGHT: 'TURN RIGHT', PICK_UP: 'PICK UP', PUT_DOWN: 'PUT DOWN', REPEAT: 'REPEAT ×' + block.count }[block.type] || block.type;
}

function reorderBlock(fromIdx, toIdx) {
  if (fromIdx === null || fromIdx === toIdx) return;
  const block = S.program.splice(fromIdx, 1)[0];
  S.program.splice(toIdx, 0, block);
  S.editOps.push({ op: 'move', position: toIdx, element_id: block.type, ts_offset_ms: Date.now() - S.sessionStart });
  emit('block_reordered', { block_type: block.type, old_position: fromIdx, new_position: toIdx });
  renderProgram();
}

// ── Execution ────────────────────────────────────────────────────────
async function runProgram() {
  if (S.isRunning || S.program.length === 0) {
    if (S.program.length === 0) toast('Add some instructions first! 👆', 'info');
    return;
  }

  S.isRunning = true;
  S.attempts++;
  document.getElementById('attempt-num').textContent = S.attempts;
  setControlsEnabled(false);

  // Emit sequence_constructed
  const submittedSeq = S.program.map(b => b.type + (b.count ? `(${b.count})` : ''));
  emit('sequence_constructed', {
    task_id: `lvl${S.levelNum}_attempt${S.attempts}`,
    submitted_sequence: submittedSeq,
    edit_operations: [...S.editOps],
    total_edit_time_ms: Date.now() - S.sessionStart,
    submission_attempt: S.attempts,
  });
  emit('program_run', { full_instruction_array: submittedSeq, attempt_number: S.attempts, timestamp: new Date().toISOString() });

  // Check if REPEAT used in L3
  if (S.lvl.hasRepeat) {
    const repeatBlock = S.program.find(b => b.type === 'REPEAT');
    if (repeatBlock) {
      emit('loop_block_used', { loop_count_set: repeatBlock.count, loop_body_array: submittedSeq });
    }
  }

  resetBotley(false); // reset position but keep program

  // Build expanded instruction list (expand REPEAT blocks)
  const instructions = expandProgram(S.program);

  let crashed = false;
  let crashStepIdx = -1;

  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    // Highlight current block in stack
    highlightStep(inst.stackIdx);
    await sleep(450);

    const result = executeInstruction(inst.type);
    renderGrid();

    if (!result.ok) {
      crashed = true;
      crashStepIdx = i;
      markCrashCell();
      highlightError(inst.stackIdx);
      emit('botley_crash', {
        crash_step_index: i,
        crash_type: result.reason,
        attempt_number: S.attempts,
      });
      await sleep(700);
      break;
    }

    await sleep(100);
  }

  clearStepHighlights();

  if (!crashed) {
    const won = checkWin();
    if (won) {
      handleWin();
    } else {
      // Reached end of program without crash but didn't win
      toast('Program finished — but Botley didn\'t reach the goal. Try again!', 'error');
      checkOptimal();
    }
  } else {
    toast('Botley crashed! Fix the instruction that caused the problem.', 'error');
    emit('debug_edit', { edit_type: 'pending', target_step: crashStepIdx, post_crash: true });
  }

  S.isRunning = false;
  setControlsEnabled(true);
}

function expandProgram(program) {
  const instructions = [];
  for (let i = 0; i < program.length; i++) {
    const block = program[i];
    if (block.type === 'REPEAT') {
      // Repeat the next block count times
      const nextBlock = program[i + 1];
      if (nextBlock) {
        for (let k = 0; k < block.count; k++) {
          instructions.push({ type: nextBlock.type, stackIdx: i + 1 });
        }
        i++; // skip the next block since we consumed it
      }
    } else {
      instructions.push({ type: block.type, stackIdx: i });
    }
  }
  return instructions;
}

function executeInstruction(type) {
  const b = S.botley;
  switch (type) {
    case 'MOVE': {
      const nr = b.r + DR[b.dir];
      const nc = b.c + DC[b.dir];
      if (!inBounds(nr, nc))       return { ok: false, reason: 'out_of_bounds' };
      if (isObstacle(nr, nc))      return { ok: false, reason: 'wall_collision' };
      b.r = nr; b.c = nc;
      return { ok: true };
    }
    case 'TURN_LEFT':  { b.dir = (b.dir + 3) % 4; return { ok: true }; }
    case 'TURN_RIGHT': { b.dir = (b.dir + 1) % 4; return { ok: true }; }
    case 'PICK_UP': {
      const obj = S.objects.find(o => o.r === b.r && o.c === b.c && !o.collected);
      if (!obj) return { ok: false, reason: 'nothing_to_pick_up' };
      obj.collected = true;
      return { ok: true };
    }
    case 'PUT_DOWN': return { ok: true }; // no-op for now
    default: return { ok: true };
  }
}

function checkWin() {
  const b = S.botley;
  const lvl = S.lvl;
  if (b.r !== lvl.goal.r || b.c !== lvl.goal.c) return false;
  const allCollected = lvl.requiredObjects.every(id => S.objects.find(o => o.id === id)?.collected);
  return allCollected;
}

function checkOptimal() {
  const delta = S.program.length - S.lvl.optimalMoves;
  if (delta > 2) {
    emit('optimal_exceeded', { instruction_count: S.program.length, optimal_count: S.lvl.optimalMoves, delta });
  }
}

function handleWin() {
  stopTimer();
  const elapsed = Math.floor((Date.now() - S.sessionStart) / 1000);
  const m = Math.floor(elapsed / 60), sec = elapsed % 60;

  emit('task_completed', {
    task_id: `lvl${S.levelNum}`,
    total_time_ms: Date.now() - S.sessionStart,
    steps_correct_first_try: S.attempts === 1 ? S.program.length : 0,
    total_steps: S.program.length,
    total_hints_used: S.hintsUsed,
    total_self_corrections: 0,
    final_score_raw: Math.max(0, 100 - (S.attempts - 1) * 15 - S.hintsUsed * 5),
    difficulty_level: S.levelNum,
  });

  checkOptimal();

  const modal = document.getElementById('win-modal');
  document.getElementById('win-emoji').textContent = S.attempts === 1 ? '🏆' : '🎉';
  document.getElementById('win-title').textContent = S.attempts === 1 ? 'Perfect Run!' : 'Level Complete!';
  document.getElementById('win-stats').innerHTML = `
    ⏱ Time: ${m}:${sec.toString().padStart(2,'0')}<br>
    🔢 Blocks used: ${S.program.length} (optimal: ${S.lvl.optimalMoves})<br>
    🔁 Attempts: ${S.attempts}<br>
    💡 Hints used: ${S.hintsUsed}
  `;
  const nextBtn = document.getElementById('next-btn');
  nextBtn.textContent = S.levelNum < 3 ? 'Next Level →' : 'Finish! 🏆';
  modal.classList.remove('hidden');
}

// ── Hint system ───────────────────────────────────────────────────────
function requestHint() {
  if (S.isRunning) return;
  S.hintsUsed++;
  emit('hint_requested', {
    task_id: `lvl${S.levelNum}`,
    step_index: S.program.length,
    hint_level: S.hintsUsed <= 1 ? 1 : S.hintsUsed <= 2 ? 2 : 3,
    hint_content_id: `lvl${S.levelNum}_hint_${S.hintsUsed}`,
    time_since_step_start_ms: Date.now() - S.sessionStart,
    prior_attempts_on_step: S.attempts,
  });
  toast('💡 ' + S.lvl.hint, 'info', 5000);
}

// ── Botley helpers ───────────────────────────────────────────────────
function resetBotley(rerenderProgram = true) {
  const lvl = S.lvl;
  S.botley = { ...lvl.start };
  S.objects = lvl.objects.map(o => ({ ...o, collected: false }));
  renderGrid();
  if (rerenderProgram) renderProgram();
}

function resetRun() {
  if (S.isRunning) return;
  resetBotley();
}

function inBounds(r, c) {
  return r >= 0 && r < S.lvl.size && c >= 0 && c < S.lvl.size;
}

function isObstacle(r, c) {
  return S.lvl.obstacles.some(o => o.r === r && o.c === c);
}

// ── Step highlight helpers ────────────────────────────────────────────
function highlightStep(stackIdx) {
  clearStepHighlights();
  const blocks = document.querySelectorAll('.stack-block');
  if (blocks[stackIdx]) blocks[stackIdx].classList.add('active-step');
}

function highlightError(stackIdx) {
  clearStepHighlights();
  const blocks = document.querySelectorAll('.stack-block');
  if (blocks[stackIdx]) blocks[stackIdx].classList.add('error-step');
}

function clearStepHighlights() {
  document.querySelectorAll('.stack-block').forEach(el => {
    el.classList.remove('active-step', 'error-step');
  });
}

function markCrashCell() {
  const cells = document.querySelectorAll('.cell.botley');
  cells.forEach(c => c.classList.add('crash'));
}

// ── UI helpers ────────────────────────────────────────────────────────
function setControlsEnabled(enabled) {
  ['run-btn', 'reset-btn', 'clear-btn', 'hint-btn'].forEach(id => {
    document.getElementById(id).disabled = !enabled;
  });
  document.querySelectorAll('.pal-btn').forEach(b => b.disabled = !enabled);
}

let _toastTimer = null;
function toast(msg, type = 'info', duration = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = type;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
}

// ── Level navigation ─────────────────────────────────────────────────
function loadLevel(n) {
  if (S.timerInterval) clearInterval(S.timerInterval);

  S = buildState(n);
  document.getElementById('level-num').textContent = n;
  document.getElementById('task-desc').textContent = LEVELS[n].taskDesc;
  document.getElementById('attempt-num').textContent = 1;
  document.getElementById('time-display').textContent = '0:00';

  // Show/hide REPEAT block in palette
  document.getElementById('repeat-pal-btn').style.display = LEVELS[n].hasRepeat ? '' : 'none';

  renderGrid();
  renderProgram();
  startTimer();

  // Hide modals and re-enable controls BEFORE emit so a payload error can't leave the UI broken
  document.getElementById('win-modal').classList.add('hidden');
  document.getElementById('done-modal').classList.add('hidden');
  setControlsEnabled(true);

  emit('task_started', {
    task_id: `lvl${n}`,
    task_type: 'algorithmic',
    difficulty_level: n,
    max_steps: LEVELS[n].optimalMoves + 5,
    time_limit_sec: 480,
    prompt_text: LEVELS[n].taskDesc,
    stimulus_hash: `lvl${n}_${LEVELS[n].size}x${LEVELS[n].size}`,
  });
}

function nextLevel() {
  const next = S.levelNum + 1;
  if (next <= 3) {
    loadLevel(next);
  } else {
    document.getElementById('win-modal').classList.add('hidden');
    document.getElementById('done-modal').classList.remove('hidden');
  }
}

function restartGame() {
  loadLevel(1);
}

// ── Utility ───────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Boot ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => loadLevel(1));
