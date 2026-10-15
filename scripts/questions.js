(function(root){'use strict';
const questions=[
  {
    "id": "r-i-play",
    "subject": "I",
    "tail": "basketball after school.",
    "answer": "play",
    "options": [
      "play",
      "plays",
      "playing"
    ],
    "zh": "我放學後會打籃球。",
    "form": "base",
    "sentence": "I play basketball after school.",
    "hint": "主詞是 I 時，用動詞原形 play。"
  },
  {
    "id": "r-she-read",
    "subject": "She",
    "tail": "books after school.",
    "answer": "reads",
    "options": [
      "reads",
      "read",
      "reading"
    ],
    "zh": "她放學後會看書。",
    "form": "third",
    "sentence": "She reads books after school.",
    "hint": "主詞是 She 時，read 要加 s，變成 reads。"
  },
  {
    "id": "r-they-make",
    "subject": "They",
    "tail": "name cards.",
    "answer": "make",
    "options": [
      "make",
      "makes",
      "making"
    ],
    "zh": "他們會做名牌。",
    "form": "base",
    "sentence": "They make name cards.",
    "hint": "主詞是 They 時，用動詞原形 make。"
  },
  {
    "id": "r-he-watch",
    "subject": "He",
    "tail": "TV at home.",
    "answer": "watches",
    "options": [
      "watches",
      "watch",
      "watching"
    ],
    "zh": "他會在家看電視。",
    "form": "third",
    "sentence": "He watches TV at home.",
    "hint": "主詞是 He 時，動詞用 watches。"
  },
  {
    "id": "r-we-read",
    "subject": "We",
    "tail": "books after school.",
    "answer": "read",
    "options": [
      "read",
      "reads",
      "reading"
    ],
    "zh": "我們放學後會看書。",
    "form": "base",
    "sentence": "We read books after school.",
    "hint": "主詞是 We 時，用動詞原形 read。"
  },
  {
    "id": "r-juju-make",
    "subject": "Juju",
    "tail": "name cards.",
    "answer": "makes",
    "options": [
      "makes",
      "make",
      "making"
    ],
    "zh": "橘橘會做名牌。",
    "form": "third",
    "sentence": "Juju makes name cards.",
    "hint": "主詞是 Juju 時，動詞用 makes。"
  },
  {
    "id": "r-you-play",
    "subject": "You",
    "tail": "basketball after school.",
    "answer": "play",
    "options": [
      "play",
      "plays",
      "playing"
    ],
    "zh": "你放學後會打籃球。",
    "form": "base",
    "sentence": "You play basketball after school.",
    "hint": "主詞是 You 時，用動詞原形 play。"
  },
  {
    "id": "r-it-send",
    "subject": "It",
    "tail": "packages.",
    "answer": "sends",
    "options": [
      "send",
      "sends",
      "sending"
    ],
    "zh": "它會寄送包裹。",
    "form": "third",
    "sentence": "It sends packages.",
    "hint": "It 指郵筒；主詞是 It 時，send 要加 s，變成 sends。"
  }
];
function makeOrder(random=Math.random){
  const pools={base:questions.filter(q=>q.form==='base'),third:questions.filter(q=>q.form==='third')};
  for(const a of Object.values(pools))for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  function build(out,last='',run=0){if(out.length===questions.length)return out;let choices=['base','third'];if(random()<.5)choices.reverse();for(const f of choices){if(!pools[f].length||(f===last&&run===2))continue;const q=pools[f].pop();const result=build([...out,q.id],f,f===last?run+1:1);if(result)return result;pools[f].push(q);}return null;}
  return build([]);
}
function validOrder(ids){return Array.isArray(ids)&&ids.length===questions.length&&new Set(ids).size===questions.length&&ids.every(id=>questions.some(q=>q.id===id));}
const voices={finish:{text:'All the words are safe. Back to the post office!',speaker:'juju',voice:'am_puck',speed:1}};
questions.forEach(q=>voices[q.id]={text:q.sentence,speaker:'you',voice:'af_heart',speed:.96});
Object.entries(voices).forEach(([id,v])=>v.file=id+'.wav');
root.RunnerContent={questions,voices,makeOrder,validOrder};
if(typeof module!=='undefined')module.exports=root.RunnerContent;
})(typeof window!=='undefined'?window:globalThis);

