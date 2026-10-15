(function(root){
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(Number(v))?Number(v):0));
  class AudioMixer{
    constructor(){this.config={voice:1,sfx:.65,music:.32,muted:false};this.voices=new Set();this.players=new Set();this.active=false;this.hidden=false;this.current=null;this.tracks=[];this.failed=false;this.tick=null;}
    configure(config){for(const k of ['voice','sfx','music'])if(config[k]!==undefined)this.config[k]=clamp(config[k]);this.config.muted=!!config.muted;this.players.forEach(p=>p.audio.volume=this.config.muted?0:this.config.voice);this.refresh();}
    speaking(player,yes){yes?this.voices.add(player):this.voices.delete(player);this.refresh();}
    unlock(){this.active=true;this.hidden=false;this.start();}
    theme(name){const file=['explore','mystery'].includes(name)?'monkeys-spinning-monkeys.mp3':'carefree.mp3';this.level=name==='mystery'?.6:1;if(this.current?.file===file){this.refresh();return;}const audio=new Audio('assets/music/'+file);audio.loop=true;audio.preload='auto';audio.volume=0;const next={audio,file,retired:false};if(this.current)this.current.retired=true;this.current=next;this.tracks.push(next);this.start();}
    start(){if(!this.active||this.hidden||!this.current)return;const track=this.current;track.audio.play().then(()=>{this.failed=false;}).catch(()=>{if(this.current===track)this.failed=true;});this.refresh();}
    refresh(){if(this.tick)return;this.tick=setInterval(()=>{let settling=false;for(const t of [...this.tracks]){const target=t.retired||!this.active||this.hidden||this.config.muted?0:this.config.music*(this.level||1)*(this.voices.size?.22:1);const delta=target-t.audio.volume;t.audio.volume=clamp(Math.abs(delta)<.003?target:t.audio.volume+delta*.24);if(Math.abs(delta)>=.003)settling=true;if(t.retired&&t.audio.volume<.003){t.audio.pause();t.audio.removeAttribute('src');this.tracks.splice(this.tracks.indexOf(t),1);}}if(!settling){clearInterval(this.tick);this.tick=null;}},40);}
    suspend(){this.hidden=true;this.tracks.forEach(t=>t.audio.pause());this.refresh();}
    resume(){if(!this.active||document.hidden)return;this.hidden=false;this.start();}
  }
  const mixer=new AudioMixer();
  class RunnerVoice{
    constructor(base='assets/audio/',onStatus=()=>{}){this.base=base;this.onStatus=onStatus;this.audio=new Audio();this.token=0;this.muted=false;this.pending=null;this.last=null;this.watchdog=null;this.userPaused=false;mixer.players.add(this);}
    stop(){this.token++;this.audio.pause();this.audio.onended=null;this.audio.onerror=null;clearInterval(this.watchdog);this.watchdog=null;if(this.pending){this.pending(false);this.pending=null;}mixer.speaking(this,false);this.onStatus('stopped');}
    play(id){this.stop();this.last=id;this.userPaused=false;if(this.muted||mixer.config.muted||mixer.config.voice===0)return Promise.resolve(true);const token=this.token;this.audio.src=this.base+encodeURIComponent(id)+'.wav';this.audio.volume=mixer.config.voice;this.audio.currentTime=0;
      return new Promise(resolve=>{this.pending=resolve;let waited=0;let finished=false;const done=success=>{if(token!==this.token||finished)return;finished=true;clearInterval(this.watchdog);this.watchdog=null;this.audio.onended=null;this.audio.onerror=null;this.pending=null;if(!success)this.audio.pause();mixer.speaking(this,false);this.onStatus(success?'ended':'error');resolve(success);};
        this.audio.onended=()=>done(true);this.audio.onerror=()=>done(false);mixer.speaking(this,true);this.onStatus('playing');this.audio.play().catch(()=>done(false));
        this.watchdog=setInterval(()=>{if(!this.userPaused)waited+=.5;if(waited>18)done(false);},500);
      });
    }
    pause(){this.userPaused=true;this.audio.pause();mixer.speaking(this,false);this.onStatus('paused');}
    resume(){if(this.pending&&!this.muted&&!mixer.config.muted){this.userPaused=false;mixer.speaking(this,true);this.onStatus('playing');this.audio.play().catch(()=>{this.stop();this.onStatus('error');});}}
    setMuted(value){this.muted=!!value;if(this.muted)this.stop();}
    destroy(){this.stop();this.audio.removeAttribute('src');this.audio.load();mixer.players.delete(this);}
  }
  class RunnerSound{
    constructor(){this.context=null;this.muted=false;}
    unlock(){try{this.context||=new (window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch(_){}}
    play(kind){if(this.muted||mixer.config.muted||mixer.config.sfx===0)return;this.unlock();if(!this.context)return;const c=this.context,volume=mixer.config.sfx;
      const patterns={correct:[784,1047,1319],wrong:[392,294],flip:[840],stamp:[659,988],send:[523,659,784,1047],finish:[523,659,784,1047,1319]};const tones=patterns[kind]||patterns.flip;
      tones.forEach((hz,i)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*(kind==='wrong'?.11:.075),duration=kind==='finish'?.35:.22;o.type=kind==='wrong'?'triangle':'sine';o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*(kind==='wrong'?.93:1),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime((kind==='wrong'?.24:.14)*volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.03);});
      // A soft paper/wood transient gives each action a tactile attack.
      const size=Math.floor(c.sampleRate*.055),buffer=c.createBuffer(1,size,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size)**3;const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=kind==='wrong'?650:1800;gain.gain.value=.08*volume;src.connect(filter);filter.connect(gain);gain.connect(c.destination);src.start();
    }
    destroy(){if(this.context)this.context.close().catch(()=>{});}
  }
  document.addEventListener('visibilitychange',()=>document.hidden?mixer.suspend():mixer.resume());
  root.RunnerAudio={RunnerVoice,RunnerSound,mixer};
})(window);
