(function (root) {
  'use strict';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const integer = (v, hi = 999) => Number.isInteger(v) ? clamp(v, 0, hi) : 0;
  const LANES = [.28, .5, .72];
  function normalizeSave(raw = {}, count = 8) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
    const completed = raw.wordRunnerCompleted === true;
    const index = completed ? count : integer(raw.wordRunnerQuestionIndex, count - 1);
    const stamps = [...new Set(Array.isArray(raw.stampQuestionIds) ? raw.stampQuestionIds.filter(n => Number.isInteger(n) && n >= 0 && n < count) : [])];
    return {
      version: 2, questionOrder:root.RunnerContent.validOrder(raw.questionOrder)?[...raw.questionOrder]:root.RunnerContent.makeOrder(), wordRunnerCompleted: completed, wordRunnerQuestionIndex: index,
      wordRunnerBestCombo: integer(raw.wordRunnerBestCombo, 5), wordRunnerCombo: integer(raw.wordRunnerCombo, 5),
      wordRunnerStamps: stamps.length, stampQuestionIds: stamps,
      slowMode: raw.slowMode === true, retryCount: integer(raw.retryCount),
      tutorialDone: raw.tutorialDone === true,
      lastCorrectLane: Number.isInteger(raw.lastCorrectLane) && raw.lastCorrectLane >= 0 && raw.lastCorrectLane < 3 ? raw.lastCorrectLane : -1,
      attempts: Array.isArray(raw.attempts) ? raw.attempts.slice(-160).filter(x => x && Number.isInteger(x.question) && ['correct', 'wrong', 'miss'].includes(x.result)).map(x => ({question: integer(x.question, 7), result: x.result, word: typeof x.word === 'string' ? x.word.slice(0, 12) : null})) : []
    };
  }
  class RunnerModel {
    constructor(questions, rawSave, emit = () => {}, random = Math.random) {
      this.state = normalizeSave(rawSave, questions.length);this.questions = this.state.questionOrder.map(id=>questions.find(q=>q.id===id)).filter(Boolean);if(this.questions.length!==questions.length)this.questions=questions;
      this.emit = emit; this.random = random; this.phase = 'ready'; this.paused = false;
      this.lane = 1; this.x = LANES[1]; this.motion = null; this.queue = null;
      this.elapsed = 0; this.roadTime = 0; this.waveId = 0; this.wave = null;
      this.tutorialStep = 0; this.feedback = null; this.feedbackAge = 0; this.voiceDone = true;
      this.destroyed = false; this.previousCorrectLane = this.state.lastCorrectLane;
    }
    save() { return JSON.parse(JSON.stringify(this.state)); }
    persist() { this.emit('save', this.save()); }
    start() {
      if (this.destroyed || this.phase !== 'ready') return;
      if (this.state.wordRunnerCompleted) { this.phase = 'result'; this.emit('result'); return; }
      if (!this.state.tutorialDone) { this.phase = 'tutorial'; this.emit('tutorial', 0); }
      else this.beginRound();
    }
    move(direction) {
      if (this.destroyed || this.paused || !['tutorial', 'stamp', 'run', 'feedback'].includes(this.phase)) return false;
      direction = Math.sign(direction);
      if (!direction) return false;
      if (this.motion) { if (this.queue === null) this.queue = direction; return false; }
      const to = clamp(this.lane + direction, 0, 2);
      if (to === this.lane) return false;
      this.motion = { from: this.x, to: LANES[to], lane: to, elapsed: 0 };
      return true;
    }
    updateMotion(dt) {
      if (!this.motion) return;
      const m = this.motion; m.elapsed += dt;
      const t = clamp(m.elapsed / .15, 0, 1); const ease = t * t * (3 - 2 * t);
      this.x = m.from + (m.to - m.from) * ease;
      if (t === 1) {
        this.lane = m.lane; this.motion = null;
        if (this.phase === 'tutorial') {
          if (this.tutorialStep === 0 && this.lane === 0) { this.tutorialStep = 1; this.emit('tutorial', 1); }
          else if (this.tutorialStep === 1 && this.lane > 0) {
            this.state.tutorialDone = true; this.persist(); this.emit('tutorial', 2); this.beginRound();
          }
        }
        const next = this.queue; this.queue = null; if (next !== null) this.move(next);
      }
    }
    beginRound() {
      if (this.state.wordRunnerCompleted) return;
      this.feedback = null; this.elapsed = 0; this.wave = null;
      const index = this.state.wordRunnerQuestionIndex;
      if (!this.state.stampQuestionIds.includes(index) && this.state.retryCount === 0) {
        this.phase = 'stamp'; this.stampLane = Math.floor(this.random() * 3); this.stampResolved = false;
        this.emit('stamp', { lane: this.stampLane });
      } else this.spawnWave();
    }
    spawnWave() {
      const index = this.state.wordRunnerQuestionIndex; const q = this.questions[index];
      if (!q) return;
      let lanes = [0, 1, 2].filter(x => x !== this.previousCorrectLane);
      const correctLane = lanes[Math.floor(this.random() * lanes.length)];
      const distractors = q.options.filter(x => x !== q.answer);
      if (this.random() < .5) distractors.reverse();
      const words = LANES.map((x, lane) => ({ x, lane, word: lane === correctLane ? q.answer : distractors.shift() }));
      this.previousCorrectLane = correctLane; this.state.lastCorrectLane = correctLane;
      const duration = this.state.slowMode || this.state.retryCount >= 2 ? 12 : index < 2 ? 8 : index < 5 ? 7 : 6;
      this.wave = { id: ++this.waveId, words, correctLane, resolved: false, duration, y: .35 };
      this.phase = 'run'; this.elapsed = 0; this.feedback = null;
      this.persist(); this.emit('wave', this.wave);
    }
    tick(dt) {
      if (this.destroyed || this.paused) return;
      dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .05);
      this.roadTime += dt; this.updateMotion(dt); this.elapsed += dt;
      if (this.phase === 'stamp') {
        if (!this.stampResolved && this.elapsed >= 1.12) {
          this.stampResolved = true;
          if (Math.abs(this.x - LANES[this.stampLane]) < .072) {
            const index = this.state.wordRunnerQuestionIndex;
            if (!this.state.stampQuestionIds.includes(index)) {
              this.state.stampQuestionIds.push(index); this.state.wordRunnerStamps = this.state.stampQuestionIds.length;
              this.persist(); this.emit('collectStamp');
            }
          }
        }
        if (this.elapsed >= 1.3) this.spawnWave();
      } else if (this.phase === 'run') {
        const w = this.wave;
        w.y = .35 + .38 * Math.min(1.24, this.elapsed / w.duration);
        // Small foot-level hit region. Test the actual interpolated actor position.
        if (!w.resolved && w.y >= .73 && w.y <= .765) {
          const hit = w.words.find(o => Math.abs(o.x - this.x) < .071);
          if (hit) this.resolve(hit.word === this.questions[this.state.wordRunnerQuestionIndex].answer ? 'correct' : 'wrong', hit.word);
        }
        if (!w.resolved && w.y > .765) this.resolve('miss', null);
      } else if (this.phase === 'feedback') {
        this.feedbackAge += dt;
        const minimum = this.feedback.result === 'correct' ? .9 : 1.2;
        if (this.feedbackAge >= minimum && (this.voiceDone || this.feedbackAge > 12)) {
          if (this.state.wordRunnerCompleted) { this.phase = 'finish'; this.elapsed = 0; this.emit('finish'); }
          else if (this.feedback.result === 'correct') this.beginRound();
          else this.spawnWave();
        }
      } else if (this.phase === 'finish' && this.elapsed > 1.6) { this.phase = 'result'; this.emit('result'); }
    }
    resolve(result, word) {
      if (this.destroyed || this.paused || this.phase !== 'run' || !this.wave || this.wave.resolved) return false;
      this.wave.resolved = true;
      const index = this.state.wordRunnerQuestionIndex;
      this.state.attempts.push({ question: index, result, word });
      this.state.attempts = this.state.attempts.slice(-160);
      if (result === 'correct') {
        this.state.wordRunnerCombo = Math.min(5, this.state.wordRunnerCombo + 1);
        this.state.wordRunnerBestCombo = Math.max(this.state.wordRunnerCombo, this.state.wordRunnerBestCombo);
        this.state.wordRunnerQuestionIndex++;
        this.state.wordRunnerCompleted = this.state.wordRunnerQuestionIndex === this.questions.length;
        this.state.retryCount = 0;
      } else {
        this.state.retryCount++;
        if (result === 'wrong') this.state.wordRunnerCombo = 0;
      }
      this.phase = 'feedback'; this.feedback = { result, word, index }; this.feedbackAge = 0;
      this.voiceDone = result !== 'correct'; this.persist(); this.emit('feedback', this.feedback);
      return true;
    }
    finishVoice() { this.voiceDone = true; }
    setSlow(value) { this.state.slowMode = !!value; this.persist(); }
    pause() { this.paused = true; this.queue = null; }
    resume() { this.paused = false; }
    safeReset() {
      this.motion = null; this.queue = null; this.x = LANES[this.lane];
      if (this.phase === 'run') this.spawnWave();
      else if (this.phase === 'stamp') this.elapsed = 0;
    }
    destroy() { this.destroyed = true; this.queue = null; this.motion = null; this.wave = null; }
  }
  root.WordRunnerCore = { RunnerModel, normalizeSave, LANES };
  if (typeof module !== 'undefined') module.exports = root.WordRunnerCore;
})(typeof window !== 'undefined' ? window : globalThis);
