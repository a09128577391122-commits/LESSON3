(function(root){
  'use strict';
  const people={you:{name:'你',en:'YOU',color:'#2b4962',voice:'af_heart'},leo:{name:'Leo',en:'LEO',color:'#466b96',voice:'am_echo'},mia:{name:'Mia',en:'MIA',color:'#64795a',voice:'af_bella'},juju:{name:'橘橘',en:'JUJU',color:'#b96536',voice:'am_puck'}};
  const line=(speaker,en,zh,pose='ask',note='')=>({speaker,en,zh,pose,note});
  const chapters=["三個寄錯的包裹", "紙城尋信記", "信裡的真相"];
  const story={
  "c1_intro": {
    "chapter": 1,
    "title": "三個寄錯的包裹",
    "background": "post-office",
    "next": "memory-tutorial",
    "lines": [
      {
        "speaker": "juju",
        "en": "Ready for your first delivery?",
        "zh": "準備好第一次送包裹了嗎？",
        "pose": "happy",
        "note": "摺光節即將開始。你戴上郵差徽章，三個包裹從郵筒滑出來。",
        "voiceId": "story_c1_intro_0"
      },
      {
        "speaker": "you",
        "en": "The mailbox sends packages. It sends packages to everyone in town.",
        "zh": "這個郵筒會寄送包裹。它會把包裹寄給鎮上的每個人。",
        "pose": "point",
        "note": "It（它）指的是前一句的郵筒。",
        "voiceId": "story_mailbox_it"
      },
      {
        "speaker": "leo",
        "en": "Crayons? I asked for a ball!",
        "zh": "蠟筆？我要的是一顆球！",
        "pose": "surprise",
        "note": "",
        "voiceId": "story_c1_intro_1"
      },
      {
        "speaker": "mia",
        "en": "And I got a basketball. I need a storybook.",
        "zh": "我收到的是籃球，可是我需要一本故事書。",
        "pose": "surprise",
        "note": "",
        "voiceId": "story_c1_intro_2"
      },
      {
        "speaker": "juju",
        "en": "A remote? I need orange paper for our name cards.",
        "zh": "遙控器？我需要橘色紙來做大家的名牌。",
        "pose": "think",
        "note": "",
        "voiceId": "story_c1_intro_3"
      },
      {
        "speaker": "you",
        "en": "The names are right. Why are the packages wrong?",
        "zh": "收件人的名字都對，怎麼包裹裡的東西不對？",
        "pose": "think",
        "note": "你拿起郵筒的紀錄。紙條只寫了幾個單字，沒有完整的信。",
        "voiceId": "story_c1_intro_4"
      },
      {
        "speaker": "leo",
        "en": "I play basketball after school.",
        "zh": "我放學後會打籃球。",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c1_intro_5"
      },
      {
        "speaker": "leo",
        "en": "I watch TV at home, too.",
        "zh": "我也會在家看電視。",
        "pose": "ask",
        "note": "",
        "voiceId": "story_c1_intro_6"
      },
      {
        "speaker": "mia",
        "en": "I read books after school.",
        "zh": "我放學後會看書。",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c1_intro_7"
      },
      {
        "speaker": "juju",
        "en": "I make name cards. Mine always have a little cat on them!",
        "zh": "我會做名牌。我做的名牌上總有一隻小貓！",
        "pose": "point",
        "note": "",
        "voiceId": "story_c1_intro_8"
      },
      {
        "speaker": "you",
        "en": "Let's match these pictures with the sentences.",
        "zh": "先把人物圖片和句子配在一起吧。",
        "pose": "point",
        "note": "四組人物習慣是我們的第一批線索。",
        "voiceId": "story_c1_intro_9"
      }
    ]
  },
  "c1_filed": {
    "chapter": 1,
    "title": "一陣風，把單字吹走了",
    "background": "post-office",
    "next": "runner-intro",
    "lines": [
      {
        "speaker": "mia",
        "en": "I kept a copy of my letter at my book stall.",
        "zh": "我在書攤留了一份那封信的副本。",
        "pose": "point",
        "note": "",
        "voiceId": "story_c1_filed_0"
      },
      {
        "speaker": "you",
        "en": "Good! We can check what everyone wrote.",
        "zh": "太好了！我們可以確認大家寫了什麼。",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c1_filed_1"
      },
      {
        "speaker": "juju",
        "en": "Oh no! The word labels are blowing away!",
        "zh": "糟了！單字標籤被風吹走了！",
        "pose": "surprise",
        "note": "一陣風穿過郵局，桌上的標籤飛向街道。",
        "voiceId": "story_c1_filed_2"
      }
    ]
  },
  "runner-intro": {
    "chapter": 1,
    "title": "郵差快跑",
    "background": "postal-street",
    "next": "runner",
    "lines": [
      {
        "speaker": "juju",
        "en": "I'll catch them. Help me pick the right words!",
        "zh": "我去追！幫我收回正確的單字！",
        "pose": "point",
        "note": "",
        "voiceId": "story_runner-intro_0"
      },
      {
        "speaker": "you",
        "en": "Read the whole sentence. Who or what is it about?",
        "zh": "讀完整句子，看看句子在說誰，或是在說什麼。",
        "pose": "ask",
        "note": "I／you／we／they：play、read；he／she／it／單數人名：plays、reads。It sends packages. 的 it 指郵筒。",
        "voiceId": "story_runner-intro_1"
      }
    ]
  },
  "c1_afterrun": {
    "chapter": 1,
    "title": "帶著地圖出發",
    "background": "post-office",
    "next": "quiz1",
    "lines": [
      {
        "speaker": "juju",
        "en": "Got them! Now, where is that map?",
        "zh": "收回來了！地圖在哪裡？",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c1_afterrun_0"
      },
      {
        "speaker": "mia",
        "en": "Here. I'll meet you at the book stall.",
        "zh": "在這裡。我們在書攤見。",
        "pose": "point",
        "note": "先收好兩張英文確認卡，再出發找信。",
        "voiceId": "story_c1_afterrun_1"
      }
    ]
  },
  "c2_intro": {
    "chapter": 2,
    "title": "紙城尋信記",
    "background": "postal-street",
    "next": "maze",
    "lines": [
      {
        "speaker": "juju",
        "en": "This way! I know a shortcut.",
        "zh": "這邊！我知道一條捷徑。",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c2_intro_0"
      },
      {
        "speaker": "juju",
        "en": "Oh. A wall. Maybe we should use the map.",
        "zh": "啊，前面是牆壁。還是看地圖吧。",
        "pose": "think",
        "note": "橘橘在紙牆前停下，把地圖攤開。",
        "voiceId": "story_c2_intro_1"
      },
      {
        "speaker": "you",
        "en": "Let's find Mia first. She reads books.",
        "zh": "先去找 Mia 吧。她平常會看書。",
        "pose": "point",
        "note": "",
        "voiceId": "story_c2_intro_2"
      }
    ]
  },
  "c2_found": {
    "chapter": 2,
    "title": "信袋裝滿了",
    "background": "postal-street",
    "next": "quiz3",
    "lines": [
      {
        "speaker": "you",
        "en": "All three letters! We can check the records now.",
        "zh": "三封信都找到了！現在可以核對寄送紀錄了。",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c2_found_0"
      },
      {
        "speaker": "juju",
        "en": "Let's go back. The festival starts soon!",
        "zh": "回去吧，摺光節快開始了！",
        "pose": "point",
        "note": "",
        "voiceId": "story_c2_found_1"
      }
    ]
  },
  "c3_intro": {
    "chapter": 3,
    "title": "信裡的真相",
    "background": "post-office",
    "next": "evidence",
    "lines": [
      {
        "speaker": "leo",
        "en": "The record says I draw after school. But I don't.",
        "zh": "紀錄上說我放學後會畫畫，但我放學後不畫畫。",
        "pose": "think",
        "note": "",
        "voiceId": "story_c3_intro_0"
      },
      {
        "speaker": "mia",
        "en": "Open the letters. The answers are inside.",
        "zh": "把信打開，答案就在裡面。",
        "pose": "point",
        "note": "",
        "voiceId": "story_c3_intro_1"
      },
      {
        "speaker": "you",
        "en": "Let's check one person at a time.",
        "zh": "我們一次核對一個人。",
        "pose": "ask",
        "note": "先打開信件，選出與紀錄矛盾的原句，再提交證據。",
        "voiceId": "story_c3_intro_2"
      }
    ]
  },
  "c3_truth": {
    "chapter": 3,
    "title": "漏讀的一個字",
    "background": "post-office",
    "next": "delivery",
    "lines": [
      {
        "speaker": "you",
        "en": "Look! The mailbox skipped the word don't.",
        "zh": "看！郵筒漏讀了 don’t。",
        "pose": "point",
        "note": "紀錄只圈住 draw、basketball 和 TV，卻跳過了表示「不」的字。",
        "voiceId": "story_c3_truth_0"
      },
      {
        "speaker": "juju",
        "en": "That changes everything! It needs to read the whole letter.",
        "zh": "意思完全不同了！它得把整封信讀完。",
        "pose": "surprise",
        "note": "",
        "voiceId": "story_c3_truth_1"
      },
      {
        "speaker": "mia",
        "en": "And check what we asked for.",
        "zh": "還要確認我們在信裡要了什麼。",
        "pose": "point",
        "note": "",
        "voiceId": "story_c3_truth_2"
      },
      {
        "speaker": "you",
        "en": "Let's get the right packages ready.",
        "zh": "來準備正確的包裹吧。",
        "pose": "happy",
        "note": "每個收件人下方都有請求句。拿起物件、選收件人，再確認寄送。",
        "voiceId": "story_c3_truth_3"
      }
    ]
  },
  "c3_delivered": {
    "chapter": 3,
    "title": "一起參加摺光節",
    "background": "festival-bright",
    "next": "quiz5",
    "lines": [
      {
        "speaker": "leo",
        "en": "My ball! Who wants to play?",
        "zh": "我的球！誰要一起玩？",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c3_delivered_0"
      },
      {
        "speaker": "mia",
        "en": "Our story corner is ready, too. Come and read!",
        "zh": "我們的故事角也準備好了。來看書吧！",
        "pose": "happy",
        "note": "",
        "voiceId": "story_c3_delivered_1"
      },
      {
        "speaker": "juju",
        "en": "And here's your name card. You're one of us now!",
        "zh": "這是你的名牌。你也是我們的一員了！",
        "pose": "happy",
        "note": "橘橘把橘色名牌別在你的郵差袋上。郵筒這次核對完整的信，才蓋下送達章。",
        "voiceId": "story_c3_delivered_2"
      },
      {
        "speaker": "you",
        "en": "Now everyone has what they need.",
        "zh": "這下大家都收到需要的東西了。",
        "pose": "happy",
        "note": "最後收好一張英文確認卡，一起參加摺光節。",
        "voiceId": "story_c3_delivered_3"
      }
    ]
  }
};
  const pairs=[
    {id:'ball',person:'leo',en:'He plays basketball.',zh:'Leo 抱著籃球',self:'I play basketball after school.',selfZh:'我放學後會打籃球。',image:0},
    {id:'tv',person:'leo',en:'He watches TV.',zh:'Leo 看電視',self:'I watch TV at home.',selfZh:'我在家會看電視。',image:1},
    {id:'books',person:'mia',en:'She reads books.',zh:'Mia 看書',self:'I read books after school.',selfZh:'我放學後會看書。',image:2},
    {id:'cards',person:'juju',en:'He makes name cards.',zh:'橘橘製作紙名牌',self:'I make name cards.',selfZh:'我會做名牌。',image:3}
  ];
  const maze={rows:['#########','#S..#..L#','#.#.#.#.#','#.#...#.#','#.###.#.#','#M....J.#','#########'],start:[1,1],order:['mia','leo','juju'],destinations:{mia:[1,5],leo:[7,1],juju:[6,5]},tasks:{mia:{en:'Find the person who reads books.',zh:'找到平常會看書的人。',place:'Mia 的書攤'},leo:{en:'Find the person who plays basketball.',zh:'找到平常會打籃球的人。',place:'Leo 的球場'},juju:{en:'Find the place where Juju makes name cards.',zh:'找到橘橘製作名牌的地方。',place:'紙工坊'}},visits:{
    mia:[line('you','Do you read books after school?','你放學後會看書嗎？'),line('mia','Yes, I do. Here is my letter.','是的，我會。這是我的信。','happy'),line('juju','Does she read books after school?','她放學後會看書嗎？','think'),line('you','Yes, she does.','是的，她會。')],
    leo:[line('leo','You found me! Here is my letter.','你找到我了！這是我的信。','happy'),line('you','Thanks. One more letter to find!','謝謝，還差最後一封信！'),line('leo','See you at the festival!','摺光節見！','point')],
    juju:[line('juju','My letter is under the orange paper.','我的信就在橘色紙下面。','point','工作桌底下留著一小片舊紙，但做名牌還需要更多橘色紙。'),line('you','Here it is. We have all three letters.','在這裡。我們集齊三封信了。'),line('juju','Back to the post office!','回郵局！','happy')]
  }};
  const letters=[
    {id:'leo',claim:'Leo draws after school.',claimZh:'Leo 放學後會畫畫。',lines:[['I don’t draw after school.','我放學後不畫畫。'],['I play basketball.','我會打籃球。'],['Please send me a ball.','請寄給我一顆球。']],restate:'He doesn’t draw after school.',restateZh:'他放學後不畫畫。',item:'ball'},
    {id:'mia',claim:'Mia plays basketball.',claimZh:'Mia 會打籃球。',lines:[['I don’t play basketball.','我不打籃球。'],['I read books.','我平常會看書。'],['Please send me a storybook.','請寄給我一本故事書。']],restate:'She doesn’t play basketball.',restateZh:'她不打籃球。',item:'book'},
    {id:'juju',claim:'Juju watches TV.',claimZh:'橘橘會看電視。',lines:[['I don’t watch TV.','我不看電視。'],['I make name cards.','我會做名牌。'],['Please send me orange paper.','請寄給我橘色紙。']],restate:'He doesn’t watch TV.',restateZh:'他不看電視。',item:'paper'}
  ];
  const quizzes=[
    {id:'quiz1',chapter:1,en:'He ___ basketball after school.',zh:'他放學後會打籃球。',options:['play','plays','playing'],answer:1,hint:'主詞是 He 時，play 要加 s，變成 plays。',model:'He plays basketball after school.',next:'quiz2'},
    {id:'quiz2',chapter:1,en:'He ___ TV at home.',zh:'他會在家看電視。',options:['watches','watch','watching'],answer:0,hint:'主詞是 He 時，watch 結尾的 ch 後面加 es，變成 watches。',model:'He watches TV at home.',next:'chapter1'},
    {id:'quiz3',chapter:2,en:'___ you read books after school?',zh:'你放學後會看書嗎？',options:['Does','Is','Do'],answer:2,hint:'直接問 you，用 Do you…? 想一想你剛剛怎麼問 Mia。',model:'Do you read books after school?',next:'quiz4'},
    {id:'quiz4',chapter:2,en:'___ she read books after school?',zh:'她放學後會看書嗎？',options:['Do','Does','Is'],answer:1,hint:'詢問 she 的日常習慣，用 Does she…? 後面的 read 保持原形。',model:'Does she read books after school?',next:'chapter2'},
    {id:'quiz5',chapter:3,en:'She ___ basketball.',zh:'Mia 說「I don’t play basketball.」。現在向別人介紹她。',options:['don’t play','doesn’t plays','doesn’t play'],answer:2,hint:'主詞是 she 時，否定句用 doesn’t，後面接動詞原形。',model:'She doesn’t play basketball.',next:'ending'}
  ];
  const feedback={
    memoryWrong:'這兩張還不是一組。核對人物和動作，再翻兩張。',
    wrongPerson:name=>`目前要核對的是 ${name}，請打開對應的信。`,
    requestEvidence:'這句說的是需要什麼。請找出與郵筒判斷相反的那一句。',
    habitEvidence:'這句說的是另一個習慣，還不能反駁紀錄。再看看否定句。',
    wall:'這裡是紙牆。換個方向試試，不會扣分。'
  };
  const voices={...root.RunnerContent.voices};
  function voice(id,speaker,text){voices[id]={text,voice:people[speaker].voice,speaker,speed:speaker==='juju'?1:.94,file:id+'.wav'};return id;}
  for(const [id,scene]of Object.entries(story))scene.lines.forEach((l,i)=>{l.audio=voice(l.voiceId,l.speaker,l.en);});
  pairs.forEach(p=>{p.audio=voice('pair_'+p.id,'you',p.en);p.selfAudio=voice('self_'+p.id,p.person,p.self);});
  Object.entries(maze.tasks).forEach(([id,t])=>t.audio=voice('task_'+id,'juju',t.en));
  Object.entries(maze.visits).forEach(([id,ls])=>ls.forEach((l,i)=>l.audio=voice('visit_'+id+'_'+i,l.speaker,l.en)));
  letters.forEach(l=>{l.claimAudio=voice('claim_'+l.id,'you',l.claim);l.audio=l.lines.map((text,i)=>voice('letter_'+l.id+'_'+i,l.id,text[0]));l.restateAudio=voice('restate_'+l.id,'you',l.restate);});
  quizzes.forEach(q=>{q.audio=voice(q.id+'_prompt','you',q.en.replace('___','blank'));q.modelAudio=voice(q.id+'_model','you',q.model);q.optionAudio=q.options.map((text,i)=>voice(q.id+'_option_'+i,'you',text));});
  voice('note_it','you','It sends packages.');
  voice('note_does_it','you','Does it send packages? Yes, it does.');
  voice('note_it_negative','you',"It doesn't watch TV.");
  voice('ending_thanks','mia','You helped us understand each other.');
  root.PostContent={chapters,people,story,pairs,maze,letters,quizzes,feedback,voices};
  if(typeof module!=='undefined')module.exports=root.PostContent;
})(typeof window!=='undefined'?window:globalThis);
