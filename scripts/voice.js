(function (root) {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
  const wait = (promise, ms) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Audio timeout')), ms);
    Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });

  // One shared context, one music element and one foreground voice for the whole game.
  class AudioMixer {
    constructor() {
      this.config = { voice: 1, sfx: .65, music: .32, muted: false };
      this.players = new Set(); this.voices = new Set(); this.effects = new Set();
      this.context = null; this.active = false; this.hidden = false; this.owner = null;
      this.resumeTask = null; this.current = null; this.musicSource = null; this.musicGain = null;
      this.music = new Audio(); this.music.loop = true; this.music.preload = 'metadata';
      this.music.setAttribute('playsinline', ''); this.music.volume = 0; this.music.muted = true;
      this.musicAttempt = 0; this.musicBusy = false; this.failed = false;
    }
    configure(config) {
      for (const key of ['voice', 'sfx', 'music']) if (config[key] !== undefined) this.config[key] = clamp(config[key]);
      if (config.muted !== undefined) this.config.muted = !!config.muted;
      for (const player of this.players) {
        player.volume();
        if (this.config.muted || this.config.voice === 0) player.stop();
      }
      if (this.config.muted || this.config.sfx === 0) this.stopEffects();
      this.refresh(); this.start();
    }
    ensureContext() {
      if (this.context) return this.context;
      const AudioContext = root.AudioContext || root.webkitAudioContext;
      if (!AudioContext) return null;
      try {
        const context = new AudioContext(); this.context = context;
        context.addEventListener('statechange', () => {
          if (context.state === 'interrupted' || (context.state === 'suspended' && this.voices.size)) this.suspend();
        });
        if (location.protocol !== 'file:') {
          // iOS may ignore HTMLMediaElement.volume. GainNode remains effective.
          const gain = context.createGain(); gain.gain.value = 0;
          this.musicSource = context.createMediaElementSource(this.music); this.musicGain = gain;
          this.musicSource.connect(gain); gain.connect(context.destination);
        }
      } catch (_) { /* Text and controls remain usable without Web Audio. */ }
      return this.context;
    }
    ready() {
      const context = this.context;
      if (!context) return Promise.resolve(false);
      if (context.state === 'running') return Promise.resolve(true);
      if (context.state === 'closed') return Promise.resolve(false);
      if (!this.resumeTask) {
        // Call resume synchronously in the initiating gesture, but wait before starting a voice.
        try { this.resumeTask = wait(context.resume(), 2500).then(() => context.state === 'running', () => false).finally(() => { this.resumeTask = null; }); }
        catch (_) { return Promise.resolve(false); }
      }
      return this.resumeTask;
    }
    unlock() {
      if (document.hidden || document.documentElement.classList.contains('portrait')) return Promise.resolve(false);
      this.active = true; this.hidden = false; this.ensureContext();
      const ready = this.ready();
      this.refresh(); this.start();
      return ready;
    }
    recover() {
      const ready = this.unlock();
      // Capture only interrupted speech. A newer click/play cancels this recovery via its token.
      for (const player of this.players) if (player.pauseReason === 'system') player.resume();
      return ready;
    }
    claim(player) {
      for (const other of this.players) if (other !== player && other.pending) other.stop();
      this.owner = player;
    }
    speaking(player, yes) { yes ? this.voices.add(player) : this.voices.delete(player); this.refresh(); }
    theme(name) {
      const file = ['explore', 'mystery'].includes(name) ? 'monkeys-spinning-monkeys.mp3' : 'carefree.mp3';
      this.level = name === 'mystery' ? .6 : 1;
      if (this.current !== file) {
        this.musicAttempt++; this.musicBusy = false; this.music.pause();
        this.current = file; this.music.src = 'assets/music/' + file;
      }
      this.refresh(); this.start();
    }
    refresh() {
      const value = !this.active || this.hidden || this.config.muted ? 0 : this.config.music * (this.level || 1) * (this.voices.size ? .18 : 1);
      if (this.musicGain) {
        const param = this.musicGain.gain, time = this.context.currentTime;
        param.cancelScheduledValues(time); param.setTargetAtTime(value, time, .075);
        this.music.volume = 1;
      } else this.music.volume = value;
      // muted is reliable on iOS even if element volume is read-only.
      this.music.muted = value === 0;
      if (!value) this.music.pause();
    }
    start() {
      if (!this.active || this.hidden || document.hidden || this.config.muted || !this.config.music || !this.current || this.musicBusy || !this.music.paused) return;
      const attempt = ++this.musicAttempt; this.musicBusy = true;
      try {
        Promise.resolve(this.music.play()).then(() => {
          if (attempt !== this.musicAttempt) return;
          this.failed = false;
          if (this.hidden || document.hidden || this.config.muted || !this.config.music) this.music.pause();
        }, () => { if (attempt === this.musicAttempt) this.failed = true; })
          .finally(() => { if (attempt === this.musicAttempt) this.musicBusy = false; });
      } catch (_) { this.musicBusy = false; this.failed = true; }
    }
    stopEffects() {
      for (const node of this.effects) { try { node.stop(); } catch (_) {} }
      this.effects.clear();
    }
    suspend() {
      this.hidden = true; this.musicAttempt++; this.musicBusy = false;
      this.music.pause(); this.stopEffects();
      for (const player of this.players) player.pause('system');
      this.refresh();
    }
    resume() { return this.recover(); }
  }
  const mixer = new AudioMixer(), buffers = new Map();
  function bufferFor(url) {
    if (buffers.has(url)) return buffers.get(url);
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000);
    const task = fetch(url, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Audio unavailable');
      return response.arrayBuffer();
    }).then(data => wait(mixer.context.decodeAudioData(data), 10000))
      .catch(error => { buffers.delete(url); throw error; }).finally(() => clearTimeout(timer));
    buffers.set(url, task); while (buffers.size > 24) buffers.delete(buffers.keys().next().value);
    return task;
  }
  class RunnerVoice {
    constructor(base = 'assets/audio/', onStatus = () => {}) {
      this.base = base; this.onStatus = onStatus; this.audio = new Audio(); this.audio.preload = 'auto';
      this.audio.setAttribute('playsinline', ''); this.token = 0; this.launch = 0;
      this.pending = null; this.last = null; this.source = null; this.gain = null; this.buffer = null;
      this.offset = 0; this.userPaused = false; this.pauseReason = null; this.muted = false; this.destroyed = false;
      this.watchdog = null; mixer.players.add(this);
    }
    volume() {
      const value = this.muted || mixer.config.muted ? 0 : mixer.config.voice;
      this.audio.volume = value; this.audio.muted = value === 0;
      if (this.gain) this.gain.gain.value = value;
    }
    disconnect() {
      const source = this.source; this.source = null;
      if (source) { source.onended = null; try { source.stop(); } catch (_) {} source.disconnect(); }
      if (this.gain) { this.gain.disconnect(); this.gain = null; }
    }
    stop() {
      this.token++; this.launch++; this.disconnect(); this.audio.pause();
      this.audio.onended = this.audio.onerror = this.audio.onplaying = null;
      clearTimeout(this.watchdog); this.watchdog = null;
      const resolve = this.pending; this.pending = null;
      this.buffer = null; this.offset = 0; this.userPaused = false; this.pauseReason = null;
      if (mixer.owner === this) mixer.owner = null;
      mixer.speaking(this, false); this.onStatus('stopped'); if (resolve) resolve(false);
    }
    complete(ok, token) {
      if (token !== this.token || !this.pending) return;
      this.disconnect(); this.audio.pause(); this.audio.onended = this.audio.onerror = this.audio.onplaying = null;
      clearTimeout(this.watchdog); this.watchdog = null;
      const resolve = this.pending; this.pending = null; this.buffer = null;
      this.pauseReason = null; if (mixer.owner === this) mixer.owner = null;
      mixer.speaking(this, false); this.onStatus(ok ? 'ended' : 'error'); resolve(ok);
    }
    play(id) {
      this.stop(); this.last = id;
      if (this.destroyed) return Promise.resolve(false);
      if (this.muted || mixer.config.muted || !mixer.config.voice) return Promise.resolve(true);
      if (document.hidden || mixer.hidden) { this.onStatus('error'); return Promise.resolve(false); }
      mixer.claim(this); const token = this.token, url = this.base + encodeURIComponent(id) + '.wav';
      return new Promise(resolve => {
        this.pending = resolve; this.onStatus('loading');
        if (mixer.context && location.protocol !== 'file:') {
          bufferFor(url).then(buffer => {
            if (token !== this.token || !this.pending) return;
            this.buffer = buffer; if (!this.userPaused) this.startBuffer(token);
          }, () => this.complete(false, token));
        } else {
          this.audio.src = url; this.volume(); this.audio.currentTime = 0;
          this.audio.onended = () => this.complete(true, token);
          this.audio.onerror = () => this.complete(false, token); this.startElement(token);
        }
      });
    }
    async startBuffer(token) {
      if (this.source || !this.buffer || !this.pending || this.userPaused) return;
      const launch = ++this.launch, running = await mixer.ready();
      if (launch !== this.launch || token !== this.token || !this.pending || this.userPaused) return;
      if (!running || mixer.hidden || document.hidden) { this.complete(false, token); return; }
      const context = mixer.context, source = context.createBufferSource();
      this.source = source; this.gain = context.createGain(); source.buffer = this.buffer;
      this.volume(); source.connect(this.gain); this.gain.connect(context.destination);
      this.started = context.currentTime;
      source.onended = () => { if (this.source === source) this.complete(true, token); };
      try {
        source.start(0, Math.min(this.offset, this.buffer.duration));
        mixer.speaking(this, true); this.onStatus('playing');
        this.watchdog = setTimeout(() => this.complete(false, token), (this.buffer.duration - this.offset + 5) * 1000);
      } catch (_) { this.complete(false, token); }
    }
    startElement(token) {
      if (this.userPaused || !this.pending) return;
      const launch = ++this.launch;
      this.audio.onplaying = () => {
        if (token !== this.token || launch !== this.launch || this.userPaused) return;
        mixer.speaking(this, true); this.onStatus('playing'); clearTimeout(this.watchdog);
        this.watchdog = setTimeout(() => this.complete(false, token), (Number.isFinite(this.audio.duration) ? this.audio.duration + 5 : 25) * 1000);
      };
      this.watchdog = setTimeout(() => this.complete(false, token), 12000);
      try { Promise.resolve(this.audio.play()).catch(() => { if (launch === this.launch) this.complete(false, token); }); }
      catch (_) { this.complete(false, token); }
    }
    pause(reason = 'user') {
      if (!this.pending || this.userPaused) return;
      this.userPaused = true; this.pauseReason = reason; this.launch++;
      if (this.source) { this.offset += Math.max(0, mixer.context.currentTime - this.started); this.disconnect(); }
      this.audio.pause(); clearTimeout(this.watchdog); this.watchdog = null;
      mixer.speaking(this, false); this.onStatus('paused');
    }
    resume() {
      if (!this.pending || !this.userPaused || this.destroyed || this.muted || mixer.config.muted || mixer.hidden || document.hidden) return;
      this.userPaused = false; this.pauseReason = null;
      if (this.buffer) this.startBuffer(this.token);
      else if (!mixer.context || location.protocol === 'file:') this.startElement(this.token);
      // A still-loading buffer starts once, in the existing fetch completion handler.
    }
    setMuted(value) { this.muted = !!value; this.volume(); if (value) this.stop(); }
    destroy() { this.stop(); this.destroyed = true; this.audio.removeAttribute('src'); mixer.players.delete(this); }
  }
  class RunnerSound {
    constructor() { this.muted = false; }
    unlock() { return mixer.unlock(); }
    play(kind) {
      const context = mixer.context;
      if (this.muted || mixer.config.muted || !mixer.config.sfx || mixer.hidden || document.hidden || context?.state !== 'running') return;
      mixer.stopEffects();
      const patterns = { correct: [784, 1047, 1319], wrong: [392, 294], flip: [840], stamp: [659, 988], send: [523, 659, 784, 1047], finish: [523, 659, 784, 1047, 1319] };
      (patterns[kind] || patterns.flip).forEach((hz, i) => {
        const source = context.createOscillator(), gain = context.createGain();
        const time = context.currentTime + i * (kind === 'wrong' ? .11 : .075), duration = kind === 'finish' ? .35 : .22;
        source.type = kind === 'wrong' ? 'triangle' : 'sine'; source.frequency.setValueAtTime(hz, time);
        source.frequency.exponentialRampToValueAtTime(hz * (kind === 'wrong' ? .93 : 1), time + duration);
        gain.gain.setValueAtTime(.0001, time); gain.gain.exponentialRampToValueAtTime((kind === 'wrong' ? .24 : .14) * mixer.config.sfx, time + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
        source.connect(gain); gain.connect(context.destination); mixer.effects.add(source);
        source.onended = () => { mixer.effects.delete(source); source.disconnect(); gain.disconnect(); };
        source.start(time); source.stop(time + duration + .03);
      });
    }
    destroy() { mixer.stopEffects(); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) mixer.suspend(); });
  root.addEventListener('pagehide', () => mixer.suspend());
  root.RunnerAudio = { RunnerVoice, RunnerSound, mixer };
})(window);
