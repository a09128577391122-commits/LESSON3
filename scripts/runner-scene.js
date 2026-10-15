(function (root) {
  'use strict';
  const icons = {
    home:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
    pause:'<path d="M8 4v16M16 4v16"/>', play:'<path d="m8 4 12 8-12 8Z"/>',
    left:'<path d="m14 5-7 7 7 7M7 12h13"/>',right:'<path d="m10 5 7 7-7 7M17 12H4"/>',
    sound:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8q5 4 0 8M18 4q9 8 0 16"/>',
    mute:'<path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6"/>',
    full:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    book:'<path d="M12 5v16M12 5C8 2 3 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-1-1-6-2-10 1Z"/>',
    replay:'<path d="M4 9a9 9 0 1 1 0 7M3 3v7h7"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',check:'<path d="m4 12 5 5L20 6"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[name]+'</svg>';
  const button = (id, name, label, classes='icon') => `<button id="${id}" class="${classes}" type="button" aria-label="${label}" title="${label}">${icon(name)}</button>`;
  const rotate = '<div class="rotate-hint"><svg viewBox="0 0 80 80"><rect x="15" y="24" width="50" height="30" rx="4"/><path d="M20 15Q50-2 69 21m0-12v13H56M60 65Q30 82 11 59m0 12V58h13"/></svg><strong>把手機橫過來，一起出發。</strong><span style="font-size:15px">遊戲已暫停，橫放後可繼續。</span></div>';
  root.RunnerUI = {icon,button,rotate};
  class WordRunnerScene {
    constructor({element, questions = root.RunnerContent.questions, initialSave = {}, onSave = () => {}, onExit = () => {}, onComplete = () => {}, artBase = 'assets/art/', audioBase = 'assets/audio/', muted = false, onMute = () => {}, onAudio = () => {}}) {
      this.element = element; this.onSave = onSave; this.onExit = onExit; this.onComplete = onComplete;
      this.onAudio=onAudio;this.artBase = artBase; this.onMute = onMute; this.destroyed = false; this.completionSent = false;
      this.abort = new AbortController(); this.pendingPointer = null; this.lastTick = null; this.dimensions = null;
      this.element.innerHTML = `<section class="stage runner-stage" aria-label="三條跑道：左右換線收字">
        <div class="backdrop"></div><canvas class="runner-canvas" aria-hidden="true"></canvas>
        <div class="topbar">${button('runner-home','home','儲存並回首頁')}<div class="top-actions">${button('runner-mute',muted?'mute':'sound',muted?'開啟聲音':'關閉聲音','icon ghost')}${button('runner-pause','pause','暫停與設定')}</div></div>
        <header class="runner-header"><div class="prompt-paper"><div class="sentence"></div><div class="instruction">Choose the correct word. 換線收回正確單字。</div></div><div class="meter"><span class="progress"></span><span class="combo"></span><span class="stamp-count"></span></div></header>
        <div class="word-layer" aria-hidden="true"></div><div class="stamp-object" aria-hidden="true">✦</div>
        <div class="runner-cat" aria-hidden="true"><img src="${artBase}juju-run.webp" alt=""></div>
        ${button('move-left','left','向左換一條跑道','move move-left')}${button('move-right','right','向右換一條跑道','move move-right')}
        <div class="bottom-hint"><div class="hint-paper">先往左，再往右，熟悉一下跑道。</div></div>
        <p class="live" role="status" aria-live="polite"></p>${rotate}</section>`;
      this.stage = element.querySelector('.stage'); this.canvas = this.stage.querySelector('canvas'); this.ctx = this.canvas.getContext('2d');
      this.cat = this.stage.querySelector('.runner-cat'); this.wordLayer = this.stage.querySelector('.word-layer'); this.stamp = this.stage.querySelector('.stamp-object'); this.stamp.hidden = true;
      this.voice = new root.RunnerAudio.RunnerVoice(audioBase, status => this.audioStatus(status)); this.voice.muted = muted;
      this.sound = new root.RunnerAudio.RunnerSound(); this.sound.muted = muted; this.sound.unlock();
      this.model = new root.WordRunnerCore.RunnerModel(questions, initialSave, (type,data) => this.event(type,data));
      this.listen(); this.resize(true); this.model.start(); this.renderStats();
      this.observer = new ResizeObserver(() => this.resize(false)); this.observer.observe(this.stage);
      this.animate = time => {
        if (this.destroyed) return;
        const dt = this.lastTick === null ? 0 : (time - this.lastTick)/1000; this.lastTick = time;
        this.model.tick(dt); this.render(); this.raf = requestAnimationFrame(this.animate);
      };
      this.raf = requestAnimationFrame(this.animate);
    }
    $(selector) { return this.stage.querySelector(selector); }
    bind(target, name, callback, options={}) { target.addEventListener(name, callback, {...options, signal:this.abort.signal}); }
    listen() {
      this.bind(this.$('#runner-home'),'click',() => { this.model.persist(); this.exit(); });
      this.bind(this.$('#runner-pause'),'click',() => this.pause());
      this.bind(this.$('#runner-mute'),'click',() => this.setMuted(!this.voice.muted));
      for (const [id,direction] of [['move-left',-1],['move-right',1]]) {
        const b = this.$('#'+id);
        this.bind(b,'pointerdown',e => {
          e.preventDefault(); if (this.pendingPointer !== null || this.model.paused) return;
          this.pendingPointer = e.pointerId; b.setPointerCapture(e.pointerId); this.model.move(direction);
        });
        this.bind(b,'pointerup',e => { if (e.pointerId === this.pendingPointer) this.pendingPointer = null; });
        this.bind(b,'pointercancel',() => { this.pendingPointer = null; });
        this.bind(b,'lostpointercapture',() => { this.pendingPointer = null; });
        this.bind(b,'click',e => { if (e.detail === 0) this.model.move(direction); });
      }
      this.bind(document,'keydown',e => {
        if (this.destroyed || e.repeat || ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
        if (['ArrowLeft','a','A','ArrowRight','d','D'].includes(e.key)) {
          e.preventDefault(); this.model.move(['ArrowLeft','a','A'].includes(e.key) ? -1 : 1);
        } else if (e.key === 'Escape') { e.preventDefault(); if(this.modal) this.resume(); else this.pause(); }
      });
      this.bind(document,'visibilitychange',() => { if (document.hidden) this.pause('遊戲已暫停。準備好再繼續。'); });
      this.bind(window,'blur',() => this.pause('遊戲已暫停。準備好再繼續。'));
    }
    event(type,data) {
      if (this.destroyed) return;
      if (type === 'save') { this.onSave(data); this.renderStats(); }
      else if (type === 'tutorial') {
        this.$('.sentence').textContent = data === 0 ? '先試著向左移動' : data === 1 ? '很好！再往右走一步' : '出發！';
        this.hint(data === 0 ? '按 ← 或 A，橘橘就會換到左邊。' : '按 → 或 D，橘橘就會換到右邊。');
      } else if (type === 'stamp') {
        this.wordLayer.innerHTML=''; this.cat.className='runner-cat'; this.showQuestion();
        this.stamp.hidden=false; this.stamp.classList.remove('collected'); this.stamp.style.left = root.WordRunnerCore.LANES[data.lane]*100+'%';
        this.hint('小郵票！順路拿到就好。');
      } else if (type === 'collectStamp') {
        this.stamp.classList.add('collected'); this.sound.play('stamp'); this.renderStats();
      } else if (type === 'wave') {
        this.stamp.hidden=true; this.cat.className='runner-cat'; this.showQuestion();
        this.wordLayer.dataset.wave=String(data.id);
        this.wordLayer.innerHTML=data.words.map(o => `<div class="word-object" data-lane="${o.lane}" data-word="${o.word}" style="left:${o.x*100}%;top:35%">${o.word}</div>`).join('');
        const last=this.model.state.attempts.at(-1);
        const retryHint=last?.result==='wrong'&&last.question===this.model.state.wordRunnerQuestionIndex?this.model.questions[last.question].hint:null;
        this.hint(retryHint||(this.model.state.slowMode || this.model.state.retryCount>=2 ? '慢慢看，等橘橘碰到正確單字。' : '←  → 換線，讓橘橘碰到正確單字。'));
      } else if (type === 'feedback') {
        const q = this.model.questions[data.index];
        this.wordLayer.querySelectorAll('.word-object').forEach(el => el.classList.add(el.dataset.word===data.word ? data.result : 'gone'));
        this.cat.className='runner-cat '+(data.result==='correct'?'happy':data.result==='wrong'?'wrong':'');
        if (data.result === 'correct') {
          this.$('.sentence').innerHTML=`${q.subject} <span class="feedback-sentence">${q.answer} ✓</span> ${q.tail}`;
          this.hint('✓ '+q.zh,'success'); this.sound.play('correct');
          const waveId = this.model.wave.id;
          this.voice.play(q.id).then(() => { if (!this.destroyed && this.model.wave?.id===waveId) this.model.finishVoice(); });
        } else if (data.result === 'wrong') { this.hint('✕ '+q.hint,'error'); this.sound.play('wrong'); }
        else this.hint('剛剛沒接到，再來一次。');
      } else if (type === 'finish') {
        this.wordLayer.innerHTML=''; this.cat.style.left='50%'; this.cat.className='runner-cat finished'; this.hint('郵局就在前面！');
      } else if (type === 'result') this.result();
    }
    showQuestion() {
      const q = this.model.questions[this.model.state.wordRunnerQuestionIndex];
      if (q) this.$('.sentence').innerHTML=`${q.subject} <span class="blank">___</span> ${q.tail}`;
      this.renderStats();
    }
    renderStats() {
      if (!this.model || !this.$('.progress')) return;
      const s=this.model.state;
      this.$('.progress').innerHTML=`第一章 · 動詞 ${s.wordRunnerQuestionIndex}/8 <i class="pips">${Array.from({length:8},(_,i)=>`<i class="pip ${i<s.wordRunnerQuestionIndex?'filled':''}"></i>`).join('')}</i>`;
      this.$('.combo').textContent='連續 '+s.wordRunnerCombo;
      this.$('.stamp-count').textContent='✦ '+s.wordRunnerStamps;
    }
    hint(text, kind='') {
      this.$('.hint-paper').className='hint-paper '+kind; this.$('.hint-paper').textContent=text;
      this.$('.live').textContent=text;
    }
    render() {
      if (this.destroyed || this.model.phase==='result') return;
      const m=this.model;
      this.cat.style.left=(m.phase==='finish'?50:m.x*100)+'%';
      this.cat.classList.toggle('tilt-left',!!m.motion && m.motion.to<m.motion.from);
      this.cat.classList.toggle('tilt-right',!!m.motion && m.motion.to>m.motion.from);
      if (m.phase==='run' || m.phase==='feedback') this.wordLayer.querySelectorAll('.word-object').forEach(el => { el.style.top=m.wave.y*100+'%'; });
      if (m.phase==='stamp') this.stamp.style.top=(.35+.38*Math.min(1,m.elapsed/1.12))*100+'%';
      this.drawRoad();
    }
    drawRoad() {
      const c=this.ctx, {w,h}=this.dimensions; c.clearRect(0,0,w,h);
      // Broad, quiet paper strips identify lanes without dashed road marks.
      c.save();
      for(const x of root.WordRunnerCore.LANES){const gradient=c.createLinearGradient(0,h*.32,0,h);gradient.addColorStop(0,'rgba(255,244,216,0)');gradient.addColorStop(1,'rgba(255,244,216,.36)');c.fillStyle=gradient;c.beginPath();c.moveTo(w*(x-.055),h*.32);c.lineTo(w*(x+.055),h*.32);c.lineTo(w*(x+.092),h);c.lineTo(w*(x-.092),h);c.closePath();c.fill();}
      c.restore();
    }
    resize(first) {
      if (this.destroyed) return;
      const r=this.stage.getBoundingClientRect(), w=Math.round(r.width), h=Math.round(r.height);
      if(this.dimensions?.w===w && this.dimensions?.h===h)return;
      this.dimensions={w,h}; const dpr=Math.min(window.devicePixelRatio||1,2);
      this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);
      if(!first && this.model && this.model.phase!=='result') {
        this.model.safeReset();this.pause('畫面已調整，這一波從安全位置重新出發。');
      }
    }
    audioStatus(status) {
      if (this.destroyed || !this.stage) return;
      this.$('.voice-retry')?.remove();
      if(status==='error') {
        const b=document.createElement('button');b.className='voice-retry';b.textContent='語音未播放 · 重試';
        b.onclick=() => { if(!this.voice.last)return; this.pause('重聽語音後，再繼續奔跑。');this.voice.play(this.voice.last); };
        this.stage.append(b);
      }
    }
    setMuted(value) {
      this.voice.setMuted(value); this.sound.muted=value; this.onMute(value);
      const b=this.$('#runner-mute');if(b){b.innerHTML=icon(value?'mute':'sound');b.setAttribute('aria-label',value?'開啟聲音':'關閉聲音');}
      const m=this.modal?.querySelector('#setting-sound');if(m){m.setAttribute('aria-pressed',String(!value));m.textContent=value?'關閉':'開啟';}
    }
    pause(message='休息一下，單字會等你。') {
      if(this.destroyed || this.modal || this.model.phase==='result')return;
      this.model.pause();this.voice.pause();this.stage.classList.add('paused');this.pendingPointer=null;
      this.previousFocus=document.activeElement;
      this.modal=document.createElement('div');this.modal.className='modal-backdrop';
      this.modal.innerHTML=`<section class="paper-panel runner-settings" role="dialog" aria-modal="true" aria-labelledby="pause-title"><h2 id="pause-title">暫停一下</h2><p>${message}</p><div class="setting-row"><span>慢速閱讀模式</span><button id="setting-slow" class="switch" aria-pressed="${this.model.state.slowMode}">${this.model.state.slowMode?'開啟':'關閉'}</button></div>${[['voice','角色語音'],['sfx','操作音效'],['music','背景音樂']].map(([id,label])=>`<label class="setting-row volume-row"><span>${label}</span><input data-volume="${id}" aria-label="${label}音量" type="range" min="0" max="100" value="${Math.round(root.RunnerAudio.mixer.config[id]*100)}"><output>${Math.round(root.RunnerAudio.mixer.config[id]*100)}%</output></label>`).join('')}<div class="panel-actions"><button class="paper-button" id="resume">${icon('play')}繼續奔跑</button>${button('pause-full','full','切換全螢幕')}${button('pause-home','home','儲存並回首頁')}</div><div class="panel-note" style="margin-top:12px">← → 或 A / D 換線 · Esc 暫停</div></section>`;
      this.stage.append(this.modal);
      this.modal.querySelector('#resume').onclick=()=>this.resume();
      this.modal.querySelector('#setting-slow').onclick=e=>{this.model.setSlow(!this.model.state.slowMode);e.target.setAttribute('aria-pressed',String(this.model.state.slowMode));e.target.textContent=this.model.state.slowMode?'開啟':'關閉';this.model.safeReset();};
      this.modal.querySelectorAll('[data-volume]').forEach(el=>el.oninput=()=>{const id=el.dataset.volume,value=Number(el.value)/100;el.nextElementSibling.value=el.value+'%';root.RunnerAudio.mixer.configure({...root.RunnerAudio.mixer.config,[id]:value});this.onAudio(id,value);});
      this.modal.querySelector('#pause-home').onclick=()=>{this.model.persist();this.exit();};
      this.modal.querySelector('#pause-full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await this.element.requestFullscreen();}catch(_){this.modal.querySelector('.panel-note').textContent='此瀏覽器不支援全螢幕，仍可正常遊玩。';}};
      this.trap(this.modal);this.modal.querySelector('#resume').focus();
    }
    trap(modal) {
      modal.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const list=[...modal.querySelectorAll('button,input')].filter(b=>!b.disabled),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
    }
    resume() {
      if (!this.modal || this.destroyed) return;
      this.modal.remove();this.modal=null;this.stage.classList.remove('paused');this.model.resume();this.voice.resume();this.lastTick=null;
      if(this.previousFocus?.isConnected)this.previousFocus.focus();
    }
    result() {
      if(this.destroyed)return;this.voice.stop();this.modal?.remove();this.modal=null;
      const s=this.model.state;
      this.stage.innerHTML=`<div class="backdrop"></div><div class="scene-wash result-bg"></div><div class="topbar">${button('result-home','home','回首頁')}<span class="wordmark">星期八郵局 / 任務完成</span></div><div class="result-copy"><div class="eyebrow">DELIVERY COMPLETE</div><h1>單字收集完成！</h1><p class="subtitle">All the words are safe! 單字都收回來了！</p><div class="score-row"><div class="score"><b>8 <small>/ 8</small></b><span>收回的單字</span></div><div class="score"><b>${s.wordRunnerBestCombo}</b><span>最佳連續</span></div><div class="score"><b>${s.wordRunnerStamps}</b><span>路上的郵票</span></div></div><div class="start-row"><button id="runner-continue" class="paper-button">繼續調查 ${icon('right')}</button><button id="runner-learned" class="subtle-button">回看八句英文</button></div><p class="quiz-note">每一次修改，都讓信離目的地更近。<br>8/8 代表完成收集，並非第一次全答對。</p></div><img class="result-cat" src="${this.artBase}juju-happy.webp" alt="開心的橘白貓橘橘">${rotate}`;
      this.$('#result-home').onclick=()=>this.exit();
      this.$('#runner-continue').onclick=e=>{if(this.completionSent)return;this.completionSent=true;e.currentTarget.disabled=true;this.voice.stop();this.onComplete(this.model.save());};
      this.$('#runner-learned').onclick=()=>this.review();
      this.voice.play('finish');
    }
    review() {
      if(this.modal)return;
      this.voice.stop();this.modal=document.createElement('div');this.modal.className='modal-backdrop';
      this.modal.innerHTML=`<section class="paper-panel" role="dialog" aria-modal="true" aria-labelledby="review-title"><h2 id="review-title">收好的八句英文</h2><div class="learning-note"><p>I、you、we、they 描述日常習慣：<strong>動詞原形</strong>。<br>He、she 或單數人名描述日常習慣：<strong>動詞加 s / es</strong>。</p>${this.model.questions.map(q=>`<p><button class="icon ghost" data-audio="${q.id}" aria-label="朗讀：${q.sentence}">${icon('sound')}</button> ${q.subject} <strong>${q.answer}</strong> ${q.tail}<br><span style="color:#70634c">${q.zh}</span></p>`).join('')}</div><button id="review-close" class="paper-button">收好筆記</button></section>`;
      this.stage.append(this.modal);this.modal.querySelector('#review-close').onclick=()=>{this.voice.stop();this.modal.remove();this.modal=null;this.$('#runner-learned').focus();};
      this.modal.querySelectorAll('[data-audio]').forEach(b=>b.onclick=()=>this.voice.play(b.dataset.audio));this.trap(this.modal);this.modal.querySelector('#review-close').focus();
    }
    exit() { const save=this.model.save();this.destroy();this.onExit(save); }
    destroy() {
      if(this.destroyed)return;this.destroyed=true;cancelAnimationFrame(this.raf);this.observer?.disconnect();this.abort.abort();this.voice.destroy();this.sound.destroy();this.model.destroy();this.modal?.remove();
    }
  }
  root.WordRunnerScene=WordRunnerScene;
})(window);
