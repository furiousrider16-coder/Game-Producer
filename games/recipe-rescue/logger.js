/**
 * logger.js — Recipe Rescue · Candela AI Telemetry Logger
 *
 * Implements the full Candela AI event schema (EVT-01 → EVT-11) plus
 * Recipe Rescue-specific game events. Computes all 5 behavioral indices
 * and the Decomposition domain score at session end.
 *
 * Schema reference: /schemas/events.json, /schemas/competency_scores.json
 * Works in browser (localStorage) and Node.js (file system).
 */

'use strict';

// ── Environment detection ─────────────────────────────────────────────
const IS_BROWSER = typeof window !== 'undefined';
const IS_NODE    = typeof require !== 'undefined' && !IS_BROWSER;

// ── Levenshtein distance (for Sequencing Quality score) ──────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ── Pearson correlation (for SATI) ────────────────────────────────────
function pearson(xs, ys) {
  if (xs.length < 2) return null;
  const n  = xs.length;
  const mx = xs.reduce((a, v) => a + v, 0) / n;
  const my = ys.reduce((a, v) => a + v, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return den === 0 ? 0 : num / den;
}

// ─────────────────────────────────────────────────────────────────────
class RecipeRescueLogger {

  /**
   * @param {Object} opts
   * @param {string} opts.studentId   - pseudonymous student identifier
   * @param {string} [opts.outputFile] - Node.js only: path for JSON trace file
   */
  constructor({ studentId, outputFile = 'recipe_rescue_traces.json' } = {}) {
    this.studentId   = studentId || this._resolveStudentId();
    this.sessionId   = this._uuid();
    this.gameId      = 'recipe_rescue';
    this.outputFile  = outputFile;
    this.eventSeq    = 0;
    this.sessionStart = Date.now();

    // ── In-session accumulators ───────────────────────────────────────
    this._events        = [];   // ordered event log

    // Per-level tracking objects (keyed by taskId)
    this._levels        = {};   // { [taskId]: LevelTrace }

    // Cross-level behavioral index inputs
    this._attemptLog    = [];   // { taskId, attemptNumber, won, timeMs }
    this._hintLog       = [];   // { taskId, hintLevel, timeMs }
    this._correctionLog = [];   // { taskId, type, resulted_in_correct }
    this._abandonLog    = [];   // taskIds

    if (IS_NODE) {
      this.fs   = require('fs');
      this.path = require('path');
      this._initFile();
    }

    console.log(`[RecipeRescue Logger] Session ${this.sessionId} · Student ${this.studentId}`);
  }

  // ══════════════════════════════════════════════════════════════════
  //  STANDARD SCHEMA EVENTS  (EVT-01 → EVT-11)
  // ══════════════════════════════════════════════════════════════════

  /**
   * EVT-01 · task_started
   * Call at the moment the level loads and becomes interactive.
   */
  taskStarted({ taskId, levelNum, maxSteps, timeLimitSec = 480, promptText = '' }) {
    this._initLevel(taskId, levelNum, maxSteps);
    return this._emit('task_started', {
      task_id:          taskId,
      task_type:        'decomposition',
      difficulty_level: levelNum,                  // 1=recall → 3=apply for Grade 3
      max_steps:        maxSteps,
      time_limit_sec:   timeLimitSec,
      prompt_text:      promptText,
      stimulus_hash:    `rr_lvl${levelNum}_${maxSteps}steps`,
    });
  }

  /**
   * EVT-02 · step_attempted
   * Call for EACH card placement into the sequence slot.
   * Maps card selection → step_type: 'select', placement → 'drag_drop'.
   *
   * @param {string}  taskId
   * @param {number}  stepIndex        - slot position (0-based)
   * @param {string}  cardId           - step identifier e.g. 'get_bread'
   * @param {boolean} isCorrect        - is this card a required step (not decoy)?
   * @param {number}  timeOnStepMs     - ms since card was first picked up
   * @param {number}  attemptsOnStep   - how many times this slot has been filled
   * @param {boolean} helpUsed         - was a hint active before this placement?
   */
  stepAttempted({ taskId, stepIndex, cardId, isCorrect, timeOnStepMs, attemptsOnStep = 1, helpUsed = false }) {
    const lvl = this._level(taskId);
    if (lvl) {
      lvl.stepAttempts.push({ stepIndex, cardId, isCorrect, timeOnStepMs, attemptsOnStep });
      if (isCorrect && attemptsOnStep === 1) lvl.firstTryCorrect++;
    }
    return this._emit('step_attempted', {
      task_id:          taskId,
      step_index:       stepIndex,
      step_type:        'drag_drop',
      response_value:   { card_id: cardId, slot_index: stepIndex },
      is_correct:       isCorrect,
      time_on_step_ms:  timeOnStepMs,
      attempts_on_step: attemptsOnStep,
      help_used:        helpUsed,
      confidence_tap:   null,
    });
  }

  /**
   * EVT-03 · hint_requested
   * Call when child taps the HINT button.
   *
   * @param {string} taskId
   * @param {number} hintLevel          - 1=nudge, 2=scaffold (partial reveal), 3=reveal
   * @param {number} timeSinceStartMs
   * @param {number} priorAttempts      - Run attempts before this hint
   */
  hintRequested({ taskId, hintLevel, timeSinceStartMs, priorAttempts = 0 }) {
    this._hintLog.push({ taskId, hintLevel, timeMs: timeSinceStartMs });
    const lvl = this._level(taskId);
    if (lvl) lvl.hintsUsed++;
    return this._emit('hint_requested', {
      task_id:                  taskId,
      step_index:               lvl ? lvl.currentSequenceLength : 0,
      hint_level:               hintLevel,
      hint_content_id:          `rr_${taskId}_hint_${hintLevel}`,
      time_since_step_start_ms: timeSinceStartMs,
      prior_attempts_on_step:   priorAttempts,
    });
  }

  /**
   * EVT-04 · sequence_constructed
   * Call each time child presses RUN — the full submitted sequence + edit history.
   *
   * @param {string}   taskId
   * @param {string[]} submittedSequence  - ordered array of card ids as submitted
   * @param {string[]} correctSequence    - ground-truth required order
   * @param {Array}    editOperations     - [{op,position,element_id,ts_offset_ms}]
   * @param {number}   totalEditTimeMs    - ms from first card added to Run pressed
   * @param {number}   submissionAttempt  - 1-based attempt count
   */
  sequenceConstructed({ taskId, submittedSequence, correctSequence, editOperations = [], totalEditTimeMs, submissionAttempt }) {
    const lvl = this._level(taskId);
    if (lvl) {
      const dist  = levenshtein(submittedSequence, correctSequence);
      const maxL  = Math.max(submittedSequence.length, correctSequence.length, 1);
      lvl.sequencingQuality = 1 - dist / maxL;
      lvl.submissions.push({ submittedSequence, attempt: submissionAttempt, timeMs: totalEditTimeMs });
    }
    return this._emit('sequence_constructed', {
      task_id:            taskId,
      submitted_sequence: submittedSequence,
      correct_sequence:   correctSequence,
      edit_operations:    editOperations,
      total_edit_time_ms: totalEditTimeMs,
      submission_attempt: submissionAttempt,
    });
  }

  /**
   * EVT-09 · self_correction_made
   * Call when child removes a card from the sequence BEFORE pressing Run.
   * This is the highest-value metacognition signal.
   *
   * @param {string}  taskId
   * @param {number}  stepIndex
   * @param {string}  correctionType   - 'before_submit' | 'after_wrong_feedback' | 'unprompted_review'
   * @param {string}  originalCard     - card id that was in the slot
   * @param {string|null} correctedCard - card id placed after (null if slot left empty)
   * @param {number}  timeToCorrectMs
   * @param {boolean} resultedInCorrect
   */
  selfCorrectionMade({ taskId, stepIndex, correctionType, originalCard, correctedCard = null, timeToCorrectMs, resultedInCorrect }) {
    this._correctionLog.push({ taskId, correctionType, resultedInCorrect });
    const lvl = this._level(taskId);
    if (lvl) lvl.selfCorrections++;
    return this._emit('self_correction_made', {
      task_id:               taskId,
      step_index:            stepIndex,
      correction_type:       correctionType,
      original_response:     { card_id: originalCard },
      corrected_response:    { card_id: correctedCard },
      time_to_correction_ms: timeToCorrectMs,
      resulted_in_correct:   resultedInCorrect,
    });
  }

  /**
   * EVT-10 · task_abandoned
   * Call on page navigation, explicit exit, or 30s idle after a crash.
   *
   * @param {string} taskId
   * @param {number} stepsCompleted    - required steps correctly placed at abandon
   * @param {number} totalSteps        - total required steps in level
   * @param {number} timeInTaskMs
   * @param {number} hintCount
   * @param {string} abandonTrigger    - 'timeout'|'navigation'|'idle_30s'|'explicit_exit'
   */
  taskAbandoned({ taskId, stepsCompleted, totalSteps, timeInTaskMs, hintCount, abandonTrigger }) {
    this._abandonLog.push(taskId);
    const lvl = this._level(taskId);
    if (lvl) lvl.abandoned = true;
    return this._emit('task_abandoned', {
      task_id:         taskId,
      steps_completed: stepsCompleted,
      total_steps:     totalSteps,
      last_step_index: stepsCompleted - 1,
      time_in_task_ms: timeInTaskMs,
      hint_count:      hintCount,
      abandon_trigger: abandonTrigger,
    });
  }

  /**
   * EVT-11 · task_completed
   * Call on WIN. Triggers domain score + behavioral index computation.
   *
   * @param {string}  taskId
   * @param {number}  totalTimeMs
   * @param {number}  stepsCorrectFirstTry   - required steps placed correctly on attempt 1
   * @param {number}  totalSteps             - required steps in level
   * @param {number}  hintsUsed
   * @param {number}  selfCorrections        - unprompted removals before Run
   * @param {number}  finalScoreRaw          - 0–100
   * @param {number}  difficultyLevel        - 1|2|3
   * @param {boolean} wonOnFirstAttempt
   */
  taskCompleted({ taskId, totalTimeMs, stepsCorrectFirstTry, totalSteps, hintsUsed, selfCorrections, finalScoreRaw, difficultyLevel, wonOnFirstAttempt }) {
    this._attemptLog.push({ taskId, won: true, wonOnFirstAttempt, timeMs: totalTimeMs });
    const lvl = this._level(taskId);
    if (lvl) { lvl.completed = true; lvl.totalTimeMs = totalTimeMs; }

    const ev = this._emit('task_completed', {
      task_id:                 taskId,
      total_time_ms:           totalTimeMs,
      steps_correct_first_try: stepsCorrectFirstTry,
      total_steps:             totalSteps,
      total_hints_used:        hintsUsed,
      total_self_corrections:  selfCorrections,
      final_score_raw:         finalScoreRaw,
      difficulty_level:        difficultyLevel,
    });

    this._flush();
    return ev;
  }

  // ══════════════════════════════════════════════════════════════════
  //  RECIPE RESCUE-SPECIFIC EVENTS
  // ══════════════════════════════════════════════════════════════════

  /**
   * GAME-01 · card_pickup
   * Fired the moment a card in the tray is tapped/clicked.
   * Dwell time before placing = card_placed.ts - card_pickup.ts.
   *
   * Cognitive signal: long dwell + correct placement = deliberate evaluation.
   *                   short dwell + wrong placement  = impulsive selection.
   */
  cardPickup({ taskId, cardId, isDecoy, attemptNumber }) {
    const lvl = this._level(taskId);
    if (lvl) lvl.pickupTimestamps[cardId] = Date.now();
    return this._emit('card_pickup', {
      task_id:        taskId,
      card_id:        cardId,
      is_decoy:       isDecoy,
      attempt_number: attemptNumber,
      timestamp:      new Date().toISOString(),
    });
  }

  /**
   * GAME-02 · card_placed
   * Fired when a card lands in a sequence slot.
   * dwell_time_before_place_ms = time between pickup and placement.
   *
   * Cognitive signal: high dwell = child evaluating relevance before committing.
   */
  cardPlaced({ taskId, cardId, slotIndex, isDecoy, dwellTimeBeforePlaceMs }) {
    const lvl = this._level(taskId);
    if (lvl) {
      lvl.currentSequenceLength = Math.max(lvl.currentSequenceLength, slotIndex + 1);
      if (isDecoy) lvl.decoysEverPlaced++;
    }
    return this._emit('card_placed', {
      task_id:                    taskId,
      card_id:                    cardId,
      slot_index:                 slotIndex,
      is_decoy:                   isDecoy,
      dwell_time_before_place_ms: dwellTimeBeforePlaceMs,
      timestamp:                  new Date().toISOString(),
    });
  }

  /**
   * GAME-03 · card_removed
   * Fired when a card is removed from the sequence.
   * trigger: 'self' = child removed it proactively (metacognition signal).
   *          'hint' = hint system prompted removal.
   *          'system' = post-crash automatic reset.
   *
   * Cognitive signal: self-removing a decoy BEFORE Run = self-monitoring.
   *                   self-removing after crash         = post-feedback correction.
   */
  cardRemoved({ taskId, cardId, fromSlot, dwellTimeInSlotMs, trigger, wasDecoy, removedBeforeSubmit }) {
    const lvl = this._level(taskId);
    if (lvl && wasDecoy && trigger === 'self' && removedBeforeSubmit) {
      lvl.decoysRemovedSelf++;
    }
    return this._emit('card_removed', {
      task_id:                taskId,
      card_id:                cardId,
      from_slot:              fromSlot,
      dwell_time_in_slot_ms:  dwellTimeInSlotMs,
      trigger:                trigger,           // 'self' | 'hint' | 'system'
      was_decoy:              wasDecoy,
      removed_before_submit:  removedBeforeSubmit,
      timestamp:              new Date().toISOString(),
    });
  }

  /**
   * GAME-04 · decoy_placed
   * Convenience event — fired when a known-decoy card is placed in the sequence.
   * Also covered by card_placed.is_decoy, but surfaced separately for
   * easy signal extraction in the scoring pipeline.
   *
   * Cognitive signal: high dwell_time_before_place + decoy placed
   *                   = child considered it carefully but still included it
   *                   (over-inclusion bias — believes the step belongs).
   */
  decoyPlaced({ taskId, cardId, slotIndex, dwellTimeBeforePlaceMs }) {
    return this._emit('decoy_placed', {
      task_id:                    taskId,
      card_id:                    cardId,
      slot_index:                 slotIndex,
      dwell_time_before_place_ms: dwellTimeBeforePlaceMs,
      timestamp:                  new Date().toISOString(),
    });
  }

  /**
   * GAME-05 · decoy_removed
   * Fired specifically when a decoy card leaves the sequence.
   *
   * removed_by: 'self'   = child caught it (self-monitoring ✓)
   *             'hint'   = needed prompting
   *             'crash'  = program failure revealed it
   *             'system' = level reset
   */
  decoyRemoved({ taskId, cardId, timeInSlotMs, removedBy }) {
    return this._emit('decoy_removed', {
      task_id:          taskId,
      card_id:          cardId,
      time_in_slot_ms:  timeInSlotMs,
      removed_by:       removedBy,   // 'self' | 'hint' | 'crash' | 'system'
      timestamp:        new Date().toISOString(),
    });
  }

  /**
   * GAME-06 · sequence_reordered
   * Fired when child drags a card to a different position WITHIN the sequence.
   *
   * Cognitive signal: reordering before Run = proactive planning / order awareness.
   *                   reordering only after crash = reactive, low planning depth.
   */
  sequenceReordered({ taskId, cardId, fromSlot, toSlot, afterCrash = false }) {
    const lvl = this._level(taskId);
    if (lvl) lvl.reorderCount++;
    return this._emit('sequence_reordered', {
      task_id:     taskId,
      card_id:     cardId,
      from_slot:   fromSlot,
      to_slot:     toSlot,
      after_crash: afterCrash,
      timestamp:   new Date().toISOString(),
    });
  }

  /**
   * GAME-07 · robot_failure_watched
   * Fired after a crash animation completes.
   * did_watch_full = child did NOT fast-forward or dismiss the animation.
   * replay_count   = how many times child replayed the failure animation.
   *
   * Cognitive signal: watching full animation + replay > 0
   *                   = deep feedback processing (child seeks to understand failure).
   */
  robotFailureWatched({ taskId, crashStepIndex, crashType, didWatchFull, replayCount = 0 }) {
    return this._emit('robot_failure_watched', {
      task_id:          taskId,
      crash_step_index: crashStepIndex,
      crash_type:       crashType,         // 'decoy_included' | 'wrong_order' | 'missing_required'
      did_watch_full:   didWatchFull,
      replay_count:     replayCount,
    });
  }

  /**
   * GAME-08 · order_violation_detected
   * Fired when the execution engine catches an ordering constraint violation.
   * Distinct from decoy detection — child has the RIGHT steps but wrong ORDER.
   *
   * Cognitive signal: repeated same violation = child has a fixed incorrect mental
   *                   model of the step order (not random guessing).
   */
  orderViolationDetected({ taskId, attemptNumber, violatingCardId, mustComeBeforeId, detectedAtSlot }) {
    const lvl = this._level(taskId);
    if (lvl) {
      lvl.orderViolations.push({ violatingCardId, mustComeBeforeId, detectedAtSlot, attempt: attemptNumber });
    }
    return this._emit('order_violation_detected', {
      task_id:             taskId,
      attempt_number:      attemptNumber,
      violating_card_id:   violatingCardId,
      must_come_before_id: mustComeBeforeId,
      detected_at_slot:    detectedAtSlot,
      timestamp:           new Date().toISOString(),
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  SCORING & BEHAVIORAL INDICES
  // ══════════════════════════════════════════════════════════════════

  /**
   * Computes the Decomposition domain score for a single level.
   *
   * Formula (from /docs/grade3_game_pipeline.md):
   *   SA  = steps_correct_first_try / total_steps
   *   SQ  = 1 - levenshtein(submitted, correct) / max(len)
   *   CR  = 1 if completed, 0 if abandoned
   *   Raw = (SA × 0.50) + (SQ × 0.30) + (CR × 0.20)
   *   Difficulty Multiplier = 0.8 + (0.1 × difficulty_level)
   *   Hint Penalty = 0.03 × level_3_hint_count  (max 0.15)
   *   Score = min(100, Raw × Multiplier × 100) − (Penalty × 100)
   *
   * @param {string} taskId
   * @returns {{ raw_score, label, sub_scores }}
   */
  computeDecompositionScore(taskId) {
    const lvl = this._level(taskId);
    if (!lvl) return null;

    const totalSteps = lvl.maxSteps;
    const SA = totalSteps > 0 ? lvl.firstTryCorrect / totalSteps : 0;
    const SQ = lvl.sequencingQuality ?? 0;
    const CR = lvl.completed ? 1 : 0;

    const raw = (SA * 0.50) + (SQ * 0.30) + (CR * 0.20);
    const multiplier = 0.8 + (0.1 * lvl.difficultyLevel);          // 0.9 – 1.1
    const hintPenalty = Math.min(0.15, 0.03 * (lvl.hintsUsed || 0));
    const score = Math.max(0, Math.min(100, raw * multiplier * 100) - hintPenalty * 100);

    return {
      domain:           'decomposition',
      task_id:          taskId,
      raw_score:        Math.round(score * 10) / 10,
      label:            score >= 70 ? 'Proficient' : score >= 40 ? 'Developing' : 'Emerging',
      mastery_achieved: score >= 70,
      sub_scores: {
        step_accuracy:       Math.round(SA * 100) / 100,
        sequencing_quality:  Math.round(SQ * 100) / 100,
        completion_rate:     CR,
        hint_penalty:        Math.round(hintPenalty * 100) / 100,
        decoy_detection_rate: lvl.decoysEverPlaced > 0
          ? Math.round(lvl.decoysRemovedSelf / lvl.decoysEverPlaced * 100) / 100
          : 1.0,
      },
    };
  }

  /**
   * Computes all 5 behavioral indices across the full session.
   *
   * BI-01 Persistence Index (PI)
   *   = (tasks_with_≥2_attempts_eventually_correct / tasks_with_≥2_attempts) × (1 − abandon_rate)
   *
   * BI-02 Self-Correction Rate (SCR)
   *   = unprompted_corrections / (total_submissions − first_submissions)
   *   "unprompted" = correction_type in ['before_submit', 'unprompted_review']
   *
   * BI-03 Hint Dependency Score (HDS)
   *   = (1×L1_hints + 2×L2_hints + 3×L3_hints) / (3 × total_hint_opportunities)
   *
   * BI-04 Speed-Accuracy Tradeoff Index (SATI)
   *   = pearson_correlation(normalised_time_per_level, first_try_accuracy_per_level)
   *
   * BI-05 Decoy Self-Detection Rate (game-specific variant of CTI for Decomposition)
   *   = decoys_removed_by_self_before_submit / total_decoys_ever_placed
   *   Replaces CTI (far/near transfer not measurable within 3 levels of one game).
   *
   * @returns {Object} behavioral_indices
   */
  computeBehavioralIndices() {
    // ── BI-01: Persistence Index ──────────────────────────────────
    const multiAttemptTasks = this._attemptLog.filter(a => {
      const lvl = Object.values(this._levels).find(l => l.taskId === a.taskId);
      return lvl && (lvl.submissions.length >= 2);
    });
    const resolvedTasks = multiAttemptTasks.filter(a => a.won);
    const PI_raw = multiAttemptTasks.length > 0
      ? resolvedTasks.length / multiAttemptTasks.length
      : 1.0;
    const abandonRate = Object.keys(this._levels).length > 0
      ? this._abandonLog.length / Object.keys(this._levels).length
      : 0;
    const PI = PI_raw * (1 - abandonRate);

    // ── BI-02: Self-Correction Rate ────────────────────────────────
    const unprompted = this._correctionLog.filter(c =>
      c.correctionType === 'before_submit' || c.correctionType === 'unprompted_review'
    ).length;
    const totalRetries = Object.values(this._levels).reduce((s, l) =>
      s + Math.max(0, l.submissions.length - 1), 0
    );
    const SCR = totalRetries > 0 ? Math.min(1, unprompted / totalRetries) : 0;

    // ── BI-03: Hint Dependency Score ───────────────────────────────
    const hintWeight = this._hintLog.reduce((s, h) => s + h.hintLevel, 0);
    const maxHintWeight = 3 * Math.max(this._hintLog.length, 1);
    const HDS = hintWeight / maxHintWeight;

    // ── BI-04: Speed-Accuracy Tradeoff Index ──────────────────────
    const levelList = Object.values(this._levels).filter(l => l.completed);
    const medianTime = levelList.length > 0
      ? levelList.reduce((s, l) => s + l.totalTimeMs, 0) / levelList.length
      : 1;
    const times = levelList.map(l => l.totalTimeMs / medianTime);
    const accs  = levelList.map(l => l.maxSteps > 0 ? l.firstTryCorrect / l.maxSteps : 0);
    const SATI  = pearson(times, accs);

    // ── BI-05: Decoy Self-Detection Rate ──────────────────────────
    const totalDecoysPlaced  = Object.values(this._levels).reduce((s, l) => s + l.decoysEverPlaced, 0);
    const totalDecoysSelfRem = Object.values(this._levels).reduce((s, l) => s + l.decoysRemovedSelf, 0);
    const DSDR = totalDecoysPlaced > 0
      ? Math.round(totalDecoysSelfRem / totalDecoysPlaced * 100) / 100
      : 1.0;

    return {
      persistence_index:          Math.round(PI   * 100) / 100,
      self_correction_rate:        Math.round(SCR  * 100) / 100,
      hint_dependency_score:       Math.round(HDS  * 100) / 100,
      speed_accuracy_tradeoff:     SATI !== null ? Math.round(SATI * 100) / 100 : null,
      decoy_self_detection_rate:   DSDR,   // game-specific; replaces CTI for this game

      // Interpretive labels
      labels: {
        persistence:    PI > 0.75 ? 'High' : PI >= 0.40 ? 'Moderate' : 'Low',
        self_correction: SCR > 0.60 ? 'Strong' : SCR >= 0.25 ? 'Moderate' : 'Weak',
        hint_dependency: HDS < 0.15 ? 'Independent' : HDS <= 0.40 ? 'Strategic' : 'Hint-reliant',
        sati:           SATI === null ? 'Insufficient data'
                          : SATI > 0.4  ? 'Reflective'
                          : SATI < -0.4 ? (accs.reduce((a,v)=>a+v,0)/accs.length > 0.70 ? 'Mastery' : 'Impulsive')
                          : 'Consistent',
        decoy_detection: DSDR > 0.80 ? 'Strong filter' : DSDR >= 0.50 ? 'Partial' : 'Weak filter',
      },
    };
  }

  /**
   * Generates the full session profile matching /schemas/competency_scores.json
   * student_session_profile definition.
   */
  generateSessionProfile() {
    const domainScores   = Object.keys(this._levels).map(t => this.computeDecompositionScore(t)).filter(Boolean);
    const behavioralIdx  = this.computeBehavioralIndices();
    const bestScore      = domainScores.reduce((best, s) => s.raw_score > (best?.raw_score ?? -1) ? s : best, null);

    // Teacher dashboard (3 metrics)
    const effort = this._teacherEffortSummary(behavioralIdx);
    const nextStep = this._teacherNextStep(domainScores, behavioralIdx);

    return {
      student_id:         this.studentId,
      session_id:         this.sessionId,
      game_id:            this.gameId,
      date:               new Date().toISOString().slice(0, 10),
      grade:              3,
      domain_scores:      domainScores,
      behavioral_indices: behavioralIdx,
      teacher_dashboard: {
        strongest_domain: 'decomposition',
        weakest_domain:   'decomposition',          // single-domain game
        effort_summary:   effort,
        next_step:        nextStep,
      },
      total_events:       this._events.length,
      session_duration_ms: Date.now() - this.sessionStart,
    };
  }

  /**
   * Returns the student's interaction trace in DKT format:
   * [{concept, correct}] — ready for RNN/LSTM ingestion.
   *
   * Each card placement = one DKT tuple:
   *   concept = 'decomposition_sequence' | 'decomposition_filter' | 'decomposition_order'
   *   correct = 1 (required step placed in valid order) | 0 (decoy or order violation)
   */
  getDKTSequence() {
    return this._events
      .filter(e => e.event_name === 'step_attempted')
      .map(e => ({
        concept: e.payload.is_correct ? 'decomposition_sequence' : 'decomposition_filter',
        correct: e.payload.is_correct ? 1 : 0,
        time_ms: e.payload.time_on_step_ms,
      }));
  }

  /**
   * Exports the full session: events + profile + DKT sequence.
   * Browser: returns JSON string + optionally triggers download.
   * Node.js: writes to outputFile.
   */
  exportSession(triggerDownload = false) {
    const profile = this.generateSessionProfile();
    const payload = {
      session_id:  this.sessionId,
      student_id:  this.studentId,
      exported_at: new Date().toISOString(),
      profile,
      dkt_sequence: this.getDKTSequence(),
      events:      this._events,
    };
    const json = JSON.stringify(payload, null, 2);

    if (IS_BROWSER) {
      try {
        const key = `candela_session_${this.sessionId}`;
        localStorage.setItem(key, json);
      } catch (_) {}
      if (triggerDownload) {
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `candela_${this.studentId}_${Date.now()}.json`;
        a.click();
      }
    }

    if (IS_NODE) {
      try {
        const existing = this.fs.existsSync(this._filePath)
          ? JSON.parse(this.fs.readFileSync(this._filePath, 'utf8'))
          : [];
        existing.push(payload);
        this.fs.writeFileSync(this._filePath, JSON.stringify(existing, null, 2));
      } catch (err) {
        console.error('[RecipeRescue Logger] Export failed:', err.message);
      }
    }

    return json;
  }

  // ══════════════════════════════════════════════════════════════════
  //  PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════

  _emit(name, payload) {
    const ev = {
      session_id:  this.sessionId,
      student_id:  this.studentId,
      game_id:     this.gameId,
      event_name:  name,
      event_seq:   ++this.eventSeq,
      client_ts:   new Date().toISOString(),
      payload,
    };
    this._events.push(ev);
    return ev;
  }

  _flush() {
    if (!IS_BROWSER) return;
    try {
      const arr = JSON.parse(localStorage.getItem('candela_events') || '[]');
      // Only push events not yet persisted
      const newEvents = this._events.slice(arr.length);
      localStorage.setItem('candela_events', JSON.stringify([...arr, ...newEvents]));
    } catch (_) {}
  }

  _initLevel(taskId, difficultyLevel, maxSteps) {
    this._levels[taskId] = {
      taskId,
      difficultyLevel,
      maxSteps,
      firstTryCorrect:    0,
      hintsUsed:          0,
      selfCorrections:    0,
      decoysEverPlaced:   0,
      decoysRemovedSelf:  0,
      reorderCount:       0,
      currentSequenceLength: 0,
      sequencingQuality:  null,
      submissions:        [],
      stepAttempts:       [],
      orderViolations:    [],
      pickupTimestamps:   {},
      completed:          false,
      abandoned:          false,
      totalTimeMs:        0,
    };
  }

  _level(taskId) { return this._levels[taskId] || null; }

  _resolveStudentId() {
    if (IS_BROWSER) {
      let id = localStorage.getItem('candela_student_id');
      if (!id) { id = 'stu_' + Math.random().toString(36).slice(2, 8); localStorage.setItem('candela_student_id', id); }
      return id;
    }
    return 'stu_' + Math.random().toString(36).slice(2, 8);
  }

  _uuid() {
    if (IS_BROWSER && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  _initFile() {
    this._filePath = this.path.join(process.cwd(), this.outputFile);
    if (!this.fs.existsSync(this._filePath)) {
      this.fs.writeFileSync(this._filePath, JSON.stringify([], null, 2));
    }
  }

  _teacherEffortSummary(bi) {
    const highPI = bi.persistence_index > 0.75;
    const lowHDS = bi.hint_dependency_score < 0.15;
    if  (highPI && lowHDS)  return 'Worked independently and kept trying when it got hard';
    if  (highPI && !lowHDS) return 'Kept trying but needed a lot of hints — may need support';
    if  (!highPI && lowHDS) return 'Gave up quickly without asking for help — check engagement';
    return 'Struggled and relied on hints — concept may be too new';
  }

  _teacherNextStep(domainScores, bi) {
    const lowest = domainScores.reduce((l, s) => s.raw_score < (l?.raw_score ?? 101) ? s : l, null);
    if (!lowest) return 'Continue current game sequence — good progress today';
    if (bi.decoy_self_detection_rate < 0.50)
      return 'Try a hands-on "which step belongs?" sorting activity — the child is including unnecessary steps in sequences';
    if (lowest.label === 'Emerging')
      return 'Revisit Level 1 with a physical recipe card activity — child needs more scaffolded decomposition practice';
    if (bi.speed_accuracy_tradeoff !== null && bi.speed_accuracy_tradeoff < -0.4 && lowest.raw_score < 70)
      return 'Child is rushing — try a slower, narrated walkthrough of the recipe steps before the next session';
    return 'Continue to next level — progress is on track';
  }
}

// ── Export ────────────────────────────────────────────────────────────
if (IS_NODE) {
  module.exports = RecipeRescueLogger;
} else {
  window.RecipeRescueLogger = RecipeRescueLogger;
}

// ── Node.js test run ──────────────────────────────────────────────────
if (IS_NODE && require.main === module) {
  console.log('\n=== RecipeRescueLogger self-test ===\n');
  const logger = new RecipeRescueLogger({ studentId: 'stu_test01', outputFile: 'rr_test_traces.json' });

  const TASK = 'lvl1_attempt1';

  logger.taskStarted({ taskId: TASK, levelNum: 1, maxSteps: 4, promptText: 'Make toast!' });
  logger.cardPickup({ taskId: TASK, cardId: 'get_bread', isDecoy: false, attemptNumber: 1 });
  logger.cardPlaced({ taskId: TASK, cardId: 'get_bread', slotIndex: 0, isDecoy: false, dwellTimeBeforePlaceMs: 1200 });
  logger.stepAttempted({ taskId: TASK, stepIndex: 0, cardId: 'get_bread', isCorrect: true, timeOnStepMs: 1200, attemptsOnStep: 1 });

  // Child places a decoy then removes it (self-correction)
  logger.cardPickup({ taskId: TASK, cardId: 'water_plants', isDecoy: true, attemptNumber: 1 });
  logger.cardPlaced({ taskId: TASK, cardId: 'water_plants', slotIndex: 1, isDecoy: true, dwellTimeBeforePlaceMs: 3100 });
  logger.decoyPlaced({ taskId: TASK, cardId: 'water_plants', slotIndex: 1, dwellTimeBeforePlaceMs: 3100 });
  logger.cardRemoved({ taskId: TASK, cardId: 'water_plants', fromSlot: 1, dwellTimeInSlotMs: 1800, trigger: 'self', wasDecoy: true, removedBeforeSubmit: true });
  logger.decoyRemoved({ taskId: TASK, cardId: 'water_plants', timeInSlotMs: 1800, removedBy: 'self' });
  logger.selfCorrectionMade({ taskId: TASK, stepIndex: 1, correctionType: 'before_submit', originalCard: 'water_plants', correctedCard: null, timeToCorrectMs: 1800, resultedInCorrect: false });

  // Complete the sequence correctly
  logger.cardPickup({ taskId: TASK, cardId: 'put_toaster', isDecoy: false, attemptNumber: 1 });
  logger.cardPlaced({ taskId: TASK, cardId: 'put_toaster', slotIndex: 1, isDecoy: false, dwellTimeBeforePlaceMs: 900 });
  logger.stepAttempted({ taskId: TASK, stepIndex: 1, cardId: 'put_toaster', isCorrect: true, timeOnStepMs: 900, attemptsOnStep: 1 });
  logger.stepAttempted({ taskId: TASK, stepIndex: 2, cardId: 'wait_toast',  isCorrect: true, timeOnStepMs: 750, attemptsOnStep: 1 });
  logger.stepAttempted({ taskId: TASK, stepIndex: 3, cardId: 'put_plate',   isCorrect: true, timeOnStepMs: 620, attemptsOnStep: 1 });

  logger.sequenceConstructed({
    taskId: TASK,
    submittedSequence: ['get_bread','put_toaster','wait_toast','put_plate'],
    correctSequence:   ['get_bread','put_toaster','wait_toast','put_plate'],
    editOperations: [
      { op: 'insert', position: 0, element_id: 'get_bread',    ts_offset_ms: 1200 },
      { op: 'insert', position: 1, element_id: 'water_plants', ts_offset_ms: 4300 },
      { op: 'delete', position: 1, element_id: 'water_plants', ts_offset_ms: 6100 },
      { op: 'insert', position: 1, element_id: 'put_toaster',  ts_offset_ms: 7000 },
    ],
    totalEditTimeMs: 9000,
    submissionAttempt: 1,
  });

  logger.taskCompleted({ taskId: TASK, totalTimeMs: 12000, stepsCorrectFirstTry: 3, totalSteps: 4, hintsUsed: 0, selfCorrections: 1, finalScoreRaw: 94, difficultyLevel: 1, wonOnFirstAttempt: true });

  console.log('Domain Score:', logger.computeDecompositionScore(TASK));
  console.log('Behavioral Indices:', logger.computeBehavioralIndices());
  console.log('DKT Sequence:', logger.getDKTSequence());

  logger.exportSession();
  console.log('\nTrace written to rr_test_traces.json');
}
