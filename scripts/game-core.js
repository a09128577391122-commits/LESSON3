(function(root){
  'use strict';const C=root.PostContent;const clone=v=>JSON.parse(JSON.stringify(v));
  const cards=C.pairs.flatMap(p=>[p.id+'-text',p.id+'-picture']);
  const nodes=[...Object.keys(C.story),'memory-tutorial','memory','runner','maze','evidence','delivery','chapter1','chapter2','ending',...C.quizzes.map(q=>q.id)];
  function shuffle(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function newState(){return {version:8,node:'c1_intro',line:0,unlocked:1,completed:false,history:[],journalReads:0,
    memory:{tutorialDone:false,tutorialOpen:[],deck:shuffle(cards),matched:[],open:[],feedback:null,attempts:[]},
    runner:root.WordRunnerCore.normalizeSave({}),
    maze:{x:1,y:1,letters:[],visit:null,hint:false,steps:0,bumps:0},
    evidence:{caseIndex:0,opened:null,unfolded:[],selected:null,feedback:null,solved:[],attempts:[]},
    delivery:{selected:null,recipient:null,assigned:{},feedback:null,attempts:[]},quizzes:{}};}
  function normalize(raw){
    const s=newState();if(!raw||raw.version!==8)return s;
    const validNode=nodes.includes(raw.node);s.node=validNode?raw.node:s.node;
    s.line=Number.isInteger(raw.line)&&raw.line>=0?Math.min(raw.line,(C.story[s.node]?.lines.length||1)-1):0;
    s.unlocked=[1,2,3].includes(raw.unlocked)?raw.unlocked:1;s.completed=raw.completed===true;s.journalReads=Number.isInteger(raw.journalReads)?Math.max(0,raw.journalReads):0;
    s.history=Array.isArray(raw.history)?raw.history.filter(id=>C.story[id.split(':')[0]]).slice(-120):[];
    if(raw.memory){const m=raw.memory;if(Array.isArray(m.deck)&&m.deck.length===8&&new Set(m.deck).size===8&&m.deck.every(c=>cards.includes(c)))s.memory.deck=m.deck;
      s.memory.matched=[...new Set((Array.isArray(m.matched)?m.matched:[]).filter(id=>C.pairs.some(p=>p.id===id)))];
      s.memory.open=[...new Set((Array.isArray(m.open)?m.open:[]).filter(id=>cards.includes(id)))].slice(0,2);
      s.memory.tutorialDone=!!m.tutorialDone;s.memory.tutorialOpen=(Array.isArray(m.tutorialOpen)?m.tutorialOpen:[]).filter(id=>['ball-text','ball-picture'].includes(id)).slice(0,2);
      s.memory.feedback=s.memory.open.length===2?{type:cardPair(s.memory.open[0])===cardPair(s.memory.open[1])?'match':'mismatch'}:null;
      s.memory.attempts=Array.isArray(m.attempts)?m.attempts.slice(-100):[];
    }
    s.runner=root.WordRunnerCore.normalizeSave(raw.runner);
    if(raw.maze){const m=raw.maze;if(passable(m.x,m.y)){s.maze.x=m.x;s.maze.y=m.y;}const letters=Array.isArray(m.letters)?m.letters:[];for(const id of C.maze.order){if(letters.includes(id))s.maze.letters.push(id);else break;}
      const target=C.maze.order[s.maze.letters.length];if(target&&m.visit&&m.visit.id===target&&Number.isInteger(m.visit.line))s.maze.visit={id:target,line:Math.max(0,Math.min(m.visit.line,C.maze.visits[target].length-1))};
      s.maze.hint=!!m.hint;s.maze.steps=Number.isInteger(m.steps)?Math.max(0,m.steps):0;s.maze.bumps=Number.isInteger(m.bumps)?Math.max(0,m.bumps):0;}
    if(raw.evidence){const e=raw.evidence;const ids=C.letters.map(l=>l.id);s.evidence.caseIndex=Number.isInteger(e.caseIndex)?Math.max(0,Math.min(e.caseIndex,2)):0;s.evidence.opened=ids.includes(e.opened)?e.opened:null;s.evidence.unfolded=[...new Set((Array.isArray(e.unfolded)?e.unfolded:[]).filter(id=>ids.includes(id)))];s.evidence.selected=[0,1,2].includes(e.selected)?e.selected:null;s.evidence.solved=[...new Set((Array.isArray(e.solved)?e.solved:[]).filter(id=>ids.includes(id)))];s.evidence.feedback=e.feedback&&['wrong-person','request','habit','correct'].includes(e.feedback.type)?e.feedback:null;s.evidence.attempts=Array.isArray(e.attempts)?e.attempts.slice(-100):[];}
    if(raw.delivery){const d=raw.delivery;s.delivery.recipient=C.letters.some(l=>l.id===d.recipient)?d.recipient:null;s.delivery.selected=['ball','book','paper'].includes(d.selected)?d.selected:null;for(const l of C.letters)if(d.assigned?.[l.id]===l.item)s.delivery.assigned[l.id]=l.item;s.delivery.feedback=d.feedback&&['correct','wrong'].includes(d.feedback.type)?d.feedback:null;s.delivery.attempts=Array.isArray(d.attempts)?d.attempts.slice(-100):[];}
    for(const q of C.quizzes){const r=raw.quizzes?.[q.id];if(!r)continue;s.quizzes[q.id]={draft:[0,1,2].includes(r.draft)?r.draft:null,locked:!!r.locked,hint:!!r.hint,demo:!!r.demo,attempts:Array.isArray(r.attempts)?r.attempts.filter(a=>[0,1,2].includes(a.answer)).map(a=>({answer:a.answer,correct:a.answer===q.answer,hint:!!a.hint,journalReads:Number.isInteger(a.journalReads)?a.journalReads:0})).slice(-100):[]};if(!s.quizzes[q.id].attempts.length&&!r.demo)s.quizzes[q.id].locked=false;}
    return s;
  }
  function chapter(s){const n=s.node;if(C.story[n])return C.story[n].chapter;if(['maze','quiz3','quiz4','chapter2'].includes(n))return 2;if(['evidence','delivery','quiz5','ending'].includes(n))return 3;return 1;}
  function goto(s,node){if(!nodes.includes(node))throw Error('Unknown node: '+node);s.node=node;s.line=0;s.unlocked=Math.max(s.unlocked,chapter(s));if(node==='ending')s.completed=true;}
  const cardPair=id=>id.split('-')[0];
  function flip(s,id){const m=s.memory;if(!m.deck.includes(id)||m.matched.includes(cardPair(id)))return {changed:false};if(m.feedback){m.open=[];m.feedback=null;}if(m.open.includes(id))return {changed:false};m.open.push(id);if(m.open.length<2)return {changed:true,type:'first'};
    const match=cardPair(m.open[0])===cardPair(m.open[1]);m.feedback={type:match?'match':'mismatch'};if(match)m.matched.push(cardPair(id));m.attempts.push({cards:[...m.open],match});return {changed:true,type:m.feedback.type,pair:cardPair(id)};}
  function resetPair(s){s.memory.open=[];s.memory.feedback=null;}
  function passable(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&C.maze.rows[y]?.[x]!==undefined&&C.maze.rows[y][x]!=='#';}
  function move(s,dx,dy){const m=s.maze;if(m.visit||Math.abs(dx)+Math.abs(dy)!==1)return {type:'ignored'};if(!passable(m.x+dx,m.y+dy)){m.bumps++;return {type:'wall'};}m.x+=dx;m.y+=dy;m.steps++;
    const destination=Object.keys(C.maze.destinations).find(id=>C.maze.destinations[id][0]===m.x&&C.maze.destinations[id][1]===m.y);
    if(destination){if(destination===C.maze.order[m.letters.length]){m.visit={id:destination,line:0};m.hint=false;return {type:'visit',id:destination};}return {type:'other',id:destination};}return {type:'step'};}
  function finishVisit(s){const m=s.maze;if(!m.visit)return false;const id=m.visit.id;if(id!==C.maze.order[m.letters.length])return false;m.letters.push(id);m.visit=null;return true;}
  function pathTo(start,target){const queue=[[start]],seen=new Set([start.join(',')]);while(queue.length){const p=queue.shift(),[x,y]=p.at(-1);if(x===target[0]&&y===target[1])return p;for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const n=[x+dx,y+dy],key=n.join(',');if(passable(...n)&&!seen.has(key)){seen.add(key);queue.push([...p,n]);}}}return [];}
  function evidence(s){const e=s.evidence,l=C.letters[e.caseIndex];if(e.feedback||e.solved.includes(l.id)||e.selected===null||!e.opened||!e.unfolded.includes(e.opened))return {type:'ignored'};
    const type=e.opened!==l.id?'wrong-person':e.selected===2?'request':e.selected===1?'habit':'correct';e.feedback={type};e.attempts.push({case:l.id,letter:e.opened,line:e.selected,type});if(type==='correct')e.solved.push(l.id);return {type};}
  function nextCase(s){const e=s.evidence,l=C.letters[e.caseIndex];if(!e.solved.includes(l.id))return false;if(e.caseIndex===2){goto(s,'c3_truth');return true;}e.caseIndex++;e.opened=null;e.selected=null;e.feedback=null;return true;}
  function assign(s,recipient){const d=s.delivery,l=C.letters.find(l=>l.id===recipient);if(!l||!d.selected||d.assigned[recipient]||Object.values(d.assigned).includes(d.selected))return {type:'ignored'};const type=l.item===d.selected?'correct':'wrong';d.attempts.push({recipient,item:d.selected,type});d.feedback={type,recipient,item:d.selected};if(type==='correct'){d.assigned[recipient]=d.selected;d.selected=null;d.recipient=null;}return {type};}
  function quizState(s,id){return s.quizzes[id]||=( {draft:null,locked:false,hint:false,demo:false,attempts:[]} );}
  function submit(s,id){const q=C.quizzes.find(q=>q.id===id),r=quizState(s,id);if(!q||r.locked||r.draft===null)return false;r.attempts.push({answer:r.draft,correct:r.draft===q.answer,hint:r.hint,journalReads:s.journalReads});r.locked=true;return true;}
  function canContinueQuiz(s,id){const r=quizState(s,id);return r.locked&&(r.demo||r.attempts.at(-1)?.correct);}
  root.PostCore={newState,normalize,chapter,goto,flip,resetPair,cardPair,passable,move,finishVisit,pathTo,evidence,nextCase,assign,quizState,submit,canContinueQuiz,clone,nodes};
  if(typeof module!=='undefined')module.exports=root.PostCore;
})(typeof window!=='undefined'?window:globalThis);
