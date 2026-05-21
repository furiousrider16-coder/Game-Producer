# Adaptmind Candela AI — Grade 3 CT+AI Game Pipeline
**CBSE CT+AI | Grade 3 | LO → Mechanic → Telemetry → Score**
*"The game is not the product. The telemetry is."*

---

## Pipeline Overview

```
CBSE Grade 3 CT+AI LOs
        ↓
6 Competency Domains
        ↓
26 Learning Outcomes → Game Mechanic Archetypes
        ↓
6 Mini-Games (≤8 min each, 45-min class fit)
        ↓
11 Event Types → Raw Telemetry Stream
        ↓
6 Domain Scores + 5 Behavioral Indices
        ↓
Teacher Dashboard (3 metrics per student per session)
```

---

## Part 1 — CBSE Grade 3 LO → Game Mechanic Map

### Domain 1: Decomposition

| LO | Official Language | Mechanic Archetype | Cog. Load | Mode |
|----|-------------------|--------------------|-----------|------|
| 1.1 | Identifies a complex task and breaks it into smaller steps | Step-Unlock Sequence Builder | Low | Solo |
| 1.2 | Decomposes a familiar daily routine; identifies independent parts | Parallel Track Sorter | Medium | Solo/Co-op |
| 1.3 | Explains why breaking a big problem into parts makes it easier | Reflection Card Match | Low | Solo |

### Domain 2: Pattern Recognition

| LO | Official Language | Mechanic Archetype | Cog. Load | Mode |
|----|-------------------|--------------------|-----------|------|
| 2.1 | Identifies and continues a repeating pattern | Pattern Completion Tap | Low | Solo/Race |
| 2.2 | Recognises same pattern in two different representations | Cross-Modal Pattern Match | Medium | Solo |
| 2.3 | Identifies the anomaly in a pattern and corrects it | Bug-Finder Tap | Medium | Solo/Duel |
| 2.4 | Creates their own repeating pattern using two attributes | Pattern Studio Builder | Medium | Solo + Gallery |

### Domain 3: Abstraction

| LO | Official Language | Mechanic Archetype | Cog. Load | Mode |
|----|-------------------|--------------------|-----------|------|
| 3.1 | Identifies key information; ignores unnecessary details | Info Filter Drag-and-Drop | Medium | Solo |
| 3.2 | Groups objects by essential property, ignoring surface differences | Property Spotlight Sorter | Medium | Solo/Co-op |
| 3.3 | Describes what makes something a member of a group | Rule Writing Scaffold | Low–Med | Solo |

### Domain 4: Algorithmic Thinking

| LO | Official Language | Mechanic Archetype | Cog. Load | Mode |
|----|-------------------|--------------------|-----------|------|
| 4.1 | Writes a sequence of clear, unambiguous instructions | Instruction Card Sequencer | Low | Solo |
| 4.2 | Follows a given algorithm; identifies where an error occurs | Broken Algorithm Debug | Medium | Solo/Duel |
| 4.3 | Uses conditional logic: IF this happens, do that | IF-THEN Rule Tile Placer | High | Solo/Co-op Pair |
| 4.4 | Identifies situations where a step needs to repeat; uses loop | Loop Stamp Builder | High | Solo |
| 4.5 | Compares two algorithms; explains which is more efficient | Side-by-Side Race | High | Solo/Pair |

### Domain 5: Basic Data Representation

| LO | Official Language | Mechanic Archetype | Cog. Load | Mode |
|----|-------------------|--------------------|-----------|------|
| 5.1 | Collects information; records using tally marks or pictographs | Survey + Pictograph Builder | Low | Multiplayer |
| 5.2 | Reads a pictograph or bar chart; answers most/least/how many more | Chart Detective | Low–Med | Solo/Quiz Show |
| 5.3 | Organises objects into categories; represents count in a table | Drag-to-Table Sorter | Low | Solo/Relay |
| 5.4 | Understands that wrong data leads to wrong conclusions | Corrupted Data Scenario | Medium | Solo |

### Domain 6: Basic AI Concepts

| LO | Official Language | Mechanic Archetype | Cog. Load | Mode |
|----|-------------------|--------------------|-----------|------|
| 6.1 | Computer can be taught to sort/group if given clear rules | Teach-the-Robot Classifier | Medium | Solo/Class |
| 6.2 | AI systems learn from examples; more/better examples improve accuracy | More Examples = Better Robot | Medium | Solo |
| 6.3 | Makes a simple prediction based on data pattern; checks against outcome | Predict & Reveal | Medium | Solo/Betting |
| 6.4 | Identifies examples of AI in everyday life | AI Spotter World Map | Low | Solo + Leaderboard |
| 6.5 | AI can make mistakes; humans need to check AI outputs | AI Mistake Catcher | Medium | Solo/Pair |
| 6.6 | AI needs human-defined goals; goal determines what AI learns | Goal-Setting Designer | High | Solo/Group |

---

## Part 2 — Six Mini-Game Specifications

---

### GAME 1 — Recipe Rescue *(Decomposition)*

**LO:** CT3.D.1 — Break a complex task into smaller, ordered sub-tasks; identify necessary vs. optional steps.

**Core Mechanic:** A broken robot chef needs to make a dish. Player is given 10–14 step-cards (correct steps + decoys like "dance a jig"). Drag cards into a sequence tray and press Run. Robot animates the result — failure is localized, not binary.

**Win Condition:** All necessary steps placed, zero decoys, valid logical order, within attempt limit.

| Level | Description |
|-------|-------------|
| L1 — Scaffolded | 6 cards, 2 absurd decoys, numbered labeled slots, 1 hint token |
| L2 — Independent | 10 cards, 4 plausible-but-wrong decoys, no slot labels, no hints |
| L3 — Transfer | 12 cards for unfamiliar task, 5 decoys (some valid but unnecessary), must mark steps as optional/required |

**Telemetry Hooks:**

| Event | Cognitive Signal |
|-------|-----------------|
| `card_pickup` with high dwell before place | Deliberate evaluation vs. impulsive placement |
| `decoy_placed` → self-removed | Self-monitoring without prompting |
| `decoy_placed` + no removal until flagged | Over-inclusion bias |
| Multiple submits with same decoy retained | Fixed misconception |
| `hint_requested` on attempt 1 | Low frustration tolerance |
| `robot_failure_watched` replay > 1 | Deep feedback processing |

**Failure Modes:**

| Pattern | Misconception |
|---------|---------------|
| Decoys removed, order wrong | Understands selection but not sequencing |
| Correct order, decoys retained | Cannot filter irrelevant information |
| Steps placed end-to-start | Backward chaining from goal |
| Random shuffling, no convergence | No mental model; guessing |

**Session Fit:** 5–7 min. Soft time cap at 7:30 with in-game nudge.

---

### GAME 2 — The Copycat Tiles *(Pattern Recognition)*

**LO:** CT3.P.1 — Identify, extend, and describe repeating and growing patterns across visual, numeric, and mixed representations.

**Core Mechanic:** A tile conveyor belt displays a pattern with 2–4 "?" gaps. Player selects tiles from a palette to fill gaps. At L3, player must also tag the rule ("It repeats every 2", "It grows by 1 each time") before placing tiles.

**Win Condition:** All gaps correctly filled + correct rule selected (mandatory at L3).

| Level | Description |
|-------|-------------|
| L1 — Scaffolded | AB pattern, 1 gap, 2-option palette, idle hint at 20s |
| L2 — Independent | ABB/ABBC, 2–3 gaps (start/middle/end), 5–6 options, no hint |
| L3 — Transfer | Growing numeric + shape mixed, 4 gaps, 8 options with partial-rule distractors, mandatory rule labeling |

**Key Telemetry Signals:**
- Short `palette_scan_time` + correct → rapid pattern abstraction
- `tile_replaced` after viewing more of pattern → using extended context to self-correct
- Correct tile, wrong rule label → procedural without conceptual understanding
- High `pattern_preview_replayed` → working memory limitation

**Session Fit:** 4–6 min. Three patterns per session (~90s each).

---

### GAME 3 — Shadow Sort *(Abstraction)*

**LO:** CT3.A.1 — Identify essential properties; ignore irrelevant attributes; group by defining characteristics.

**Core Mechanic:** Objects appear with multiple visible attributes. Below is a "Shadow World" — a silhouette view that strips one or more attributes. Player sorts objects into bins using only the properties visible in shadow form. An object that looks "different" in real world may look "same" in Shadow World.

**Win Condition:** All objects correctly sorted by the Shadow World rule, within attempt limit, ≤1 misplace.

| Level | Description |
|-------|-------------|
| L1 — Scaffolded | 4 objects, 2 bins, color stripped, rule stated explicitly |
| L2 — Independent | 6 objects, 3 bins, color + texture stripped, rule stated as riddle |
| L3 — Transfer | 8 objects, 3 bins, player must first identify WHICH attribute was stripped from 2 worked examples, then sort remaining 6 |

**Key Telemetry Signals:**
- `shadow_preview_toggled` frequently → actively comparing real vs. abstract
- `shadow_preview_toggled` zero times → sorting from real-world view, ignoring abstraction layer
- `misplaced` error_dimension = surface attribute → concrete-bound thinking
- `abstraction_rule_selected` after 1 example (L3) → rapid rule induction

**Session Fit:** 6–8 min. One sorting scenario per session.

---

### GAME 4 — Botley's Big Day *(Algorithmic Thinking)*

**LO:** CT3.AL.1 — Construct a precise sequence of instructions to move an agent from start to goal; debug when it fails.

**Core Mechanic:** Botley is a robot on a grid who follows instructions exactly. Player builds an instruction stack (MOVE FORWARD, TURN LEFT, TURN RIGHT, PICK UP, PUT DOWN) via drag-and-drop. Pressing Run animates Botley step-by-step. On failure, player must identify and fix only the wrong instruction — not rebuild the whole program.

**Win Condition:** Botley reaches goal, collects object, returns to start — using minimum instruction count (within +2 of optimal at L2+).

| Level | Description |
|-------|-------------|
| L1 — Scaffolded | 5×5 grid, straight path, ghost-path preview, unlimited attempts |
| L2 — Independent | 6×6 grid, one obstacle, minimum count enforced, 3 attempts before hint |
| L3 — Transfer | 7×7 grid, 2 objects in specific order, introduces LOOP block; player must compress redundant sequence |

**Key Telemetry Signals:**
- `debug_edit` localized to crash step only → precise debugging
- `debug_edit` rebuilds entire program after 1 crash → no failure isolation
- `block_reordered` without prior crash → proactive planning revision
- `loop_block_used` correctly on first attempt (L3) → strong abstraction-into-algorithm
- `step_execution_watched` = false (always fast-forwarded) → outcome-focused, may miss feedback

**Session Fit:** 7–8 min. Step animation is skippable (skip = telemetry event).

---

### GAME 5 — Dino Tally Dash *(Basic Data Representation)*

**LO:** CT3.DR.1 — Collect, organize, and represent data in tally marks, pictographs, and bar charts; read back meaning.

**Core Mechanic:** Dinosaurs run past a checkpoint for 30 seconds. Player tally-taps each type as it appears. After the scene, player drags dino-icons into a pictograph. Finally, 2 comprehension questions: "Which appeared most?" and "How many more [A] than [B]?"

**Win Condition:** Tally matches scene (tolerance: 0 errors L1, max 1 error L2–L3), pictograph reflects tally, both comprehension questions correct.

| Level | Description |
|-------|-------------|
| L1 — Scaffolded | 2 dino types, 8 total, slow pace, auto-stamp tally, 1:1 pictograph grid |
| L2 — Independent | 3 types, 12 total, medium pace, player taps correct counter, player builds pictograph |
| L3 — Transfer | 4 types, 16 total, fast pace with overlaps, 1:2 scale (each icon = 2 dinos), subtraction comparison questions |

**Key Telemetry Signals:**
- `tally_missed` clustered on one type → attentional bias toward familiar types
- Pictograph count matches tally (even if tally wrong) → data integrity: faithful representation
- Pictograph count ≠ tally → child confabulating during representation
- `chart_consulted_before_answer` = true → evidence-based reasoning
- `scale_error` placed_count = tally_count → misses 1:2 concept, not representation concept

**Session Fit:** 6–7 min. Scene (30s) + tally (60s) + pictograph (2–3 min) + comprehension (60s).

---

### GAME 6 — Zara Learns *(Basic AI Concepts)*

**LO:** CT3.AI.1 — Understand that a machine can be trained on examples to sort/group/predict; quality of training examples affects output.

**Core Mechanic:** Zara is a baby AI who knows nothing. Player teaches Zara by dragging labeled example cards into training slots ("This is a FRUIT / NOT a FRUIT"). After 4–6 examples, Zara makes predictions on unseen items. If Zara errs, player must swap a bad training card for a better one — not add more. Models data quality over quantity.

**Win Condition:** Zara correctly classifies 4 consecutive unseen items using high-quality, representative training examples.

| Level | Description |
|-------|-------------|
| L1 — Scaffolded | Binary (fruit/not fruit), 4 slots, 8 unambiguous cards, confidence meter visible |
| L2 — Independent | Binary (flies/doesn't fly), 5 slots, 12 cards including edge cases (penguin, bat), no confidence meter |
| L3 — Transfer | Three-way (rolls / slides / does both), 6 slots, must include a "does both" example or Zara never predicts that category; diagnose which training card causes confusion |

**Key Telemetry Signals:**
- All training cards from one surface type (all red fruits) → prototype bias, narrow training set
- `training_card_swapped` after Zara error, correct swap → causal reasoning
- `edge_case_included` proactively (before any error) → anticipatory thinking, highest AI aptitude signal
- Provides only positive examples (all fruits, no non-fruits) → doesn't understand contrastive training
- High `training_submitted` attempts with small incremental changes → systematic experimentation

**Session Fit:** 7–8 min. Teaching (2–3 min) + prediction observation (90s) + diagnosis + retraining (2 min) + win (30s).

---

## Part 3 — Telemetry Event Schema

### Standard Event Envelope (all events)

```json
{
  "session_id":   "UUID",
  "student_id":   "UUID (pseudonymous)",
  "game_id":      "recipe_rescue | copycat_tiles | shadow_sort | botleys_big_day | dino_tally_dash | zara_learns",
  "event_name":   "snake_case",
  "event_seq":    "integer (monotonic within session)",
  "client_ts":    "ISO8601 ms",
  "server_ts":    "ISO8601 ms",
  "app_version":  "semver",
  "device_type":  "tablet | chromebook | desktop"
}
```

### Event Type Catalogue

| # | Event | Domain | Key Payload Fields |
|---|-------|--------|--------------------|
| EVT-01 | `task_started` | All | task_type, difficulty_level, max_steps, time_limit_sec |
| EVT-02 | `step_attempted` | Algorithmic, Decomposition | step_index, step_type, response_value, is_correct, time_on_step_ms, attempts_on_step, confidence_tap |
| EVT-03 | `hint_requested` | All | step_index, hint_level (1=nudge/2=scaffold/3=reveal), time_since_step_start_ms, prior_attempts |
| EVT-04 | `sequence_constructed` | Algorithmic | submitted_sequence[], correct_sequence[], edit_operations[], total_edit_time_ms |
| EVT-05 | `pattern_identified` | Pattern Recognition | pattern_type, identified_unit, is_correct, response_time_ms, abstraction_level (1–3) |
| EVT-06 | `classification_made` | Abstraction, Data Repr | item_id, category_assigned, correct_category, rule_stated, item_index |
| EVT-07 | `ai_concept_responded` | AI Concepts | concept_tested, question_format, response_value, is_correct, distractor_chosen |
| EVT-08 | `data_representation_submitted` | Data Repr | representation_type, accuracy_score (0–1), completeness_score (0–1), label_accuracy |
| EVT-09 | `self_correction_made` | All | correction_type (before_submit/after_feedback/unprompted_review), original_response, corrected_response, resulted_in_correct |
| EVT-10 | `task_abandoned` | All | steps_completed, total_steps, time_in_task_ms, hint_count, abandon_trigger |
| EVT-11 | `task_completed` | All | total_time_ms, steps_correct_first_try, total_steps, total_hints_used, total_self_corrections |

### Sample JSON Payloads

**EVT-02 `step_attempted`:**
```json
{
  "envelope": { "session_id": "7f3a1c2e...", "student_id": "stu_0429af", "game_id": "recipe_rescue", "event_name": "step_attempted", "event_seq": 14 },
  "payload": {
    "task_id": "task_8801b3", "step_index": 2, "step_type": "drag_drop",
    "response_value": { "dragged_item": "action_wash_hands", "dropped_zone": "step_3_slot" },
    "is_correct": true, "time_on_step_ms": 4320, "attempts_on_step": 1,
    "help_used": false, "confidence_tap": "sure"
  }
}
```

**EVT-05 `pattern_identified`:**
```json
{
  "envelope": { "game_id": "copycat_tiles", "event_name": "pattern_identified", "event_seq": 31 },
  "payload": {
    "task_id": "task_9942cc", "pattern_type": "growing",
    "identified_unit": { "rule_type": "add_constant", "constant_value": 3, "sequence_shown": [2,5,8,11], "child_predicted_next": 14 },
    "is_correct": true, "confidence_tap": "sure", "response_time_ms": 7841, "abstraction_level": 2
  }
}
```

**EVT-07 `ai_concept_responded`:**
```json
{
  "envelope": { "game_id": "zara_learns", "event_name": "ai_concept_responded", "event_seq": 7 },
  "payload": {
    "task_id": "task_5531de", "concept_tested": "error_correction", "question_format": "scenario_rate",
    "response_value": { "child_selected": "the_robot_is_broken_forever" },
    "is_correct": false, "distractor_chosen": "the_robot_is_broken_forever",
    "response_time_ms": 3210
  }
}
```
*Triggers Misconception M04: "AI rules are permanent." If same distractor chosen in ≥2 tasks → flag to teacher dashboard.*

---

## Part 4 — Competency Score Model

**Score Scale:** 0–100 → binned as:

| Range | Label | Meaning |
|-------|-------|---------|
| 0–39 | Emerging | Inconsistent; needs scaffolded re-engagement |
| 40–69 | Developing | Partial; succeeds with support or low difficulty |
| 70–100 | Proficient | Consistent, independent; generalizes across contexts |

**Mastery Threshold:** Score ≥ 70 across ≥ 2 sessions (prevents lucky-run inflation).

---

### Domain Scoring Formulas

**Decomposition:**
```
SA  = steps_correct_first_try / total_steps
SQ  = 1 - levenshtein(submitted, correct) / max(len(s), len(c))
CR  = tasks_completed / tasks_assigned
Raw = (SA × 0.50) + (SQ × 0.30) + (CR × 0.20)
Difficulty Multiplier = 0.8 + (0.1 × difficulty_level)
Hint Penalty = 0.03 × level_3_hints (max 0.15)
Score = min(100, Raw × Multiplier × 100) - (Penalty × 100)
```

**Pattern Recognition:**
```
Score = (L1_accuracy × 0.20) + (L2_accuracy × 0.35) + (L3_accuracy × 0.45) × 100
Speed Bonus: +3 pts if response_time < 40% of time_limit AND correct (max 1/session)
```

**Abstraction:**
```
CA  = correct_classifications / total_items
RAR = items_with_correct_rule_stated / correct_classifications
TS  = correct_on_novel_items / total_novel_items
Score = (CA × 0.40 + RAR × 0.35 + TS × 0.25) × 100
```
*RAR (Rule Articulation Rate) is the differentiating signal: correct classification without rule = possible perceptual shortcut, not true abstraction.*

**Algorithmic Thinking:**
```
PQ  = levenshtein-based sequence accuracy × edit_efficiency
      edit_efficiency = 1 - (total_edits / (2 × sequence_length))
EA  = algorithmic_steps_correct / total
CQ  = self_corrections_before_submit / total_corrections
Score = (PQ × 0.35 + EA × 0.45 + CQ × 0.20) × 100
```

**Basic Data Representation:**
```
ENC  = mean(accuracy_score)
COMP = mean(completeness_score)
LBL  = proportion with label_accuracy = true
RR   = unique representation_types used / 5
Score = (ENC × 0.40 + COMP × 0.30 + LBL × 0.20 + RR × 0.10) × 100
```

**Basic AI Concepts:**
```
Score = mean(sub-domain scores) × 100
Sub-domains (equal weight 0.20 each): training_data, prediction, error_correction, decision_rule, fairness
Misconception Penalty: -5 pts per confirmed misconception (same distractor in ≥2 tasks)
```

**AI Misconception Registry:**
| ID | Misconception |
|----|---------------|
| M01 | AI is always right (over-trust) |
| M02 | AI thinks/feels like humans (anthropomorphization) |
| M03 | More data is always better (data quality blindspot) |
| M04 | AI rules are permanent / cannot be changed |
| M05 | Only computers can do AI tasks |

---

## Part 5 — Behavioral Indices

### BI-01 — Persistence Index (PI)

```
PI = (tasks_with_≥2_attempts_eventually_correct / tasks_with_≥2_attempts) × (1 - abandon_rate)
abandon_rate = tasks_abandoned / tasks_assigned
```

| PI | Profile |
|----|---------|
| > 0.75 | High persistence — resolves difficulty |
| 0.40–0.75 | Moderate — disengages under sustained difficulty |
| < 0.40 | Low — needs motivational scaffolding |

*At ages 8–9, persistence predicts long-term learning velocity more reliably than single-session accuracy.*

---

### BI-02 — Self-Correction Rate (SCR)

```
SCR = unprompted_corrections / (total_submissions - first_submissions)
unprompted = correction_type IN ('before_submit', 'unprompted_review')
```

| SCR | Profile |
|-----|---------|
| > 0.60 | Strong metacognitive monitoring |
| 0.25–0.60 | Moderate — self-checks when prompted |
| < 0.25 | Weak — accepts first-pass responses without evaluation |

*Strongest single metacognition signal in the system.*

---

### BI-03 — Hint Dependency Score (HDS)

```
hint_weight = (1 × L1_hints) + (2 × L2_hints) + (3 × L3_hints)
HDS = hint_weight / (3 × total_hint_opportunities)
```

| HDS | Profile |
|-----|---------|
| < 0.15 | Independent learner |
| 0.15–0.40 | Strategic help-seeker |
| > 0.40 | Hint-reliant |

*High HDS on session 1 of a new domain = healthy. High HDS after 3+ sessions on same domain = difficulty calibration mismatch.*

---

### BI-04 — Speed-Accuracy Tradeoff Index (SATI)

```
SATI = pearson_correlation(normalized_time, accuracy) across session tasks
normalized_time = time_on_task_ms / median_time_for_difficulty_level
```

| SATI | Profile |
|------|---------|
| near +1.0 | Reflective — more time = better accuracy |
| near 0 | Consistent — automatized skills |
| near -1.0 + high accuracy | Mastery signal — fast AND right |
| near -1.0 + low accuracy | Danger zone — impulsive responding |

---

### BI-05 — Conceptual Transfer Index (CTI)

```
CTI = far_transfer_accuracy / near_transfer_accuracy
```

| CTI | Profile |
|-----|---------|
| > 0.80 | Strong transfer — concept abstracted beyond surface features |
| 0.50–0.80 | Partial transfer — needs more varied examples |
| < 0.50 | Surface learning — memorized formats, not concepts |

*The ultimate validity check. Domain scores = what a child can do in known format. CTI = whether they actually learned the concept.*

---

## Part 6 — Teacher Dashboard

**Design Principle:** Every metric must pass the parent-teacher conference test — explainable in under 30 seconds, no jargon, actionable.

### Metric 1 — Strongest Skill + Skill Needing Practice

> "**Ramya is strongest in Pattern Recognition (Proficient) and needs more practice with Algorithmic Thinking (Emerging).**"

Derived from: top and bottom domain scores of the session. Suppressed if < 3 domain tasks completed.

---

### Metric 2 — How Did They Work?

| Persistence + HDS | Dashboard Display |
|-------------------|-------------------|
| High PI + Low HDS | "Worked independently and kept trying when it got hard" |
| High PI + High HDS | "Kept trying but needed a lot of hints — may need support" |
| Low PI + Low HDS | "Gave up quickly without asking for help — check engagement" |
| Low PI + High HDS | "Struggled and relied on hints — concept may be too new" |

---

### Metric 3 — One Thing to Try Next

Priority order:
1. **Confirmed misconception** → misconception-specific classroom recommendation
2. **Lowest domain = Emerging** → domain-specific offline activity
3. **SATI < -0.5 AND accuracy > 70** → enrichment/challenge recommendation
4. Default → "Continue current game sequence — good progress today"

*Example outputs:*
> "Priya picked answers suggesting she thinks AI is always correct. A class discussion about AI mistakes could help."
> "Dev worked very fast today — consider Level 4 Sequence Puzzles for enrichment."
> "Try a hands-on sorting activity with physical objects — Arjun had difficulty organising data into categories."

---

## Part 7 — System Architecture Notes

### Data Flow

```
Game Client
  → Event stream (Kinesis / Pub-Sub)
  → Event store (immutable raw JSON, partitioned by date/game)
  → Scoring engine (Python, stateless, runs on session_end trigger)
  → Competency profile store (Postgres, 1 row per student × domain × date)
  → Behavioral index store (derived table, updated post-session)
  → Dashboard API (read-only, teacher-facing)
```

### Scoring Engine Rules
- Stateless per session — all inputs come from events within that session
- Cross-session mastery (≥ 2 session rule) handled by separate nightly mastery promotion job
- Never use `final_score_raw` from game engine for competency scoring — derive from component events only

### Privacy
- `student_id` is a pseudonymous UUID — real identity mapping held only in school's identity service, never enters telemetry pipeline
- `response_value` in `step_attempted` must be reviewed for free-text tasks to prevent PII capture

### High-Signal LOs for Candela AI (prioritize for first build)
| LO | Why High-Signal |
|----|-----------------|
| 4.3 IF-THEN | Edit latency between tile placements is a rich planning signal |
| 4.4 Loops | Whether child discovers REPEAT independently vs. with hint |
| 6.1 Teach-the-Robot | Training label consistency across sessions reveals cognitive coherence |
| 6.2 More Examples | Quality-vs-quantity choice behavior directly tests AI literacy intuition |
| 3.3 Rule Writing | Rule articulation separates procedural from conceptual abstraction |

---

*Generated by Adaptmind Candela AI multi-agent pipeline. Grade 3 baseline. Ready to scale to Grades 4–5 once pipeline is validated.*
