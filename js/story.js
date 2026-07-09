"use strict";
// ============================== STORY ==============================
// Main-quest dialogue: Hargrove's briefing (with one reputation choice) and debrief.
const QD = [
  { intro:[
      "Ah. The new blood. Welcome to Dewey, Cheatham & Howe — four hundred lawyers, one working printer.",
      "HR's onboarding portal gained sentience this morning. The paralegals it manages have gone rogue — hoarding the good pens, refusing to redact, citing 'boundaries'.",
      "Pacify five of them. Gently. With force."],
    prompt:"Your response, associate?",
    opts:[
      { t:"Is violence the firm's standard HR procedure?", say:"It's in the handbook. Section 12: Constructive Termination.", e:1 },
      { t:"Will this count toward my billables?", say:"I like you already. Bill it to 'Professional Development'.", a:1 }],
    outro:[
      "Excellent work. HR sends its thanks, plus a forty-page incident report for you to summarize.",
      "(He hands you the report without making eye contact. You are dismissed.)"] },
  { giver:'dolores', intro:[
      "(Dolores does not look up from a typewriter with no paper in it.) You. Good. The Pemberton cabinets fused at two a.m. Four million documents; one new organism.",
      "Eight Paperwork Golems are loose on this floor, and three Privileged Files are somewhere inside them. Recover the files before someone sneezes and waives privilege. I filed those once. I will not file them twice."],
    prompt:"(She finally looks up.)",
    opts:[
      { t:"Shouldn't we report a privilege breach to the court?", say:"In 1974 a young man asked me that exact question. I still have his desk. Find the files, dear.", e:1 },
      { t:"Is there a bonus for the files?", say:"The bonus is that I stop saying your name with that particular disappointment.", a:1 }],
    outro:[
      "Privilege preserved. I took the liberty of re-alphabetizing your soul. You're welcome.",
      "One file is dated 1987. A timesheet. Thaddeus Graves III: twenty-five billable hours, one day. ...I typed that timesheet, you know.",
      "Don't read old timesheets, dear. They read back."] },
  { giver:'benny', intro:[
      "Okay, don't freak out — the timekeeping system gained a poltergeist. Your forty unentered hours? They MANIFESTED. They're roaming the halls whispering '0.1, reviewed email re: lunch.'",
      "I tried turning it off and on again. It turned ME off and on again. Banish all ten, and please, PLEASE enter your time daily or you'll join the chorus."],
    prompt:"(Benny clutches a keyboard like a riot shield.)",
    opts:[
      { t:"This firm runs on something unnatural, doesn't it?", say:"It runs on coffee and a server I'm contractually forbidden to describe. Stop asking smart questions.", e:1 },
      { t:"Can I bill the time I spend fighting my own time?", say:"...Ticket filed. Ticket APPROVED. God help us, the system said yes.", a:1 }],
    outro:[
      "Time entered, ghosts debugged. Finance approved your continued existence for one more fiscal quarter.",
      "IT advisory: stay out of the corner office after dark. The logs show the Emeritus pinging the network at 25:00. That's not a real time. I checked twice."] },
  { intro:[
      "Grabbit & Runn are here 'to meet and confer'. They brought sanctions motions and finger guns.",
      "Their client? No name. Just a numbered trust, active since 1987. Curious, no?",
      "Defeat four of their attorneys. Mind the frivolous motions — they're meritless, but they sting."],
    prompt:"Before you go:",
    opts:[
      { t:"Who is behind the trust, Hargrove?", say:"(He looks at the corner office. Then at his shoes.) Defeat the lawyers, associate.", e:1 },
      { t:"When I win, I want their clients.", say:"Spoken like a future equity partner. I'm moved, and a little frightened.", a:1 }],
    outro:[
      "They folded! Agreed to our protective order AND to stop CC'ing the judge on everything. A historic day.",
      "One of them dropped a note as they fled. It reads: 'HE EATS TIME.' Lawyers. So dramatic."] },
  { intro:[
      "Our case needs Dr. Ima Payne deposed. Hostile expert. Four thousand depositions. She has never answered a yes-or-no question in under nine paragraphs.",
      "Break the witness, counselor."],
    prompt:"You ask:",
    opts:[
      { t:"What does she know about this firm?", say:"Too much. She did the structural survey in '87. Of the building. And of... other structures.", e:1 },
      { t:"What's her hourly rate? Asking for future me.", say:"Fourteen hundred. Plus mileage. She lives in the building. Don't ask.", a:1 }],
    outro:[
      "'Asked and answered'? More like asked and DESTROYED. The court reporter wept openly.",
      "Before she passed out, Payne grabbed my arm and said: 'Check the billing records. Graves bills twenty-five hours a day. Every day. Since 1987.'",
      "There are only twenty-four hours in a day, associate. ...Aren't there?"] },
  { intro:[
      "(Hargrove locks the door.) The truth, then. Every associate at this firm tithes hours to Thaddeus Graves III. He 'retired' in 1987 — which is also when he stopped aging.",
      "He doesn't bill time, associate. He EATS it. Forty years of everyone's overtime. It's why you're always tired. It's why the coffee never quite works.",
      "Your partnership review is at midnight, in the corner office. End this — or become part of it."],
    prompt:"You stand. You say:",
    opts:[
      { t:"Nobody else loses their hours to that thing. I end it tonight.", say:"(He almost smiles. The first one since 1987, possibly.) Go get him, counselor.", e:2 },
      { t:"So partnership equity is... edible. Interesting.", say:"...I am choosing to believe that was a joke. Go. And associate — be careful in there.", a:2 }],
    outro:[
      "It's done. The corner office is just an office. The coffee machine works. Somewhere, four hundred lawyers feel suddenly, inexplicably rested.",
      "The partners voted at dawn. Unanimous. Welcome to the letterhead... PARTNER.",
      "(A process server bursts in, panting.) Or it WAS unanimous, until 6:01 a.m., when we were served THIS:",
      "NOTICE OF APPEAL — In re the Estate of Thaddeus Graves III. The appellant is a numbered trust. They want the hours back, partner. ALL of them."] },
  { intro:[
      "The estate of Graves has appealed. The named appellant is the trust — and Grabbit & Runn just leased the 24th floor. Of OUR building. The audacity has a floor plan.",
      "Their 'Associates of the Month' are up there deposing OUR clients as we speak. There's a wall of plaques. All of them. Every month. Don't ask how.",
      "Take the elevator. Disrupt six of them. Politely. With prejudice."],
    prompt:"You ask:",
    opts:[
      { t:"Is an appeal by a man who dissolved into CLE credits even justiciable?", say:"You'd think not! And yet the clerk accepted the filing. The law is a wheel, partner. A big, stupid wheel.", e:1 },
      { t:"If we win, do we get their floor?", say:"...I'll have facilities measure for drapes.", a:1 }],
    outro:[
      "They've stopped deposing. Their managing partner sent a fruit basket labeled 'WITHOUT PREJUDICE'. I ate it WITH prejudice.",
      "But the appeal reopened discovery — the trust documents got remanded to OUR Records Annex overnight. And the annex has... reorganized itself. It does that when it's nervous."] },
  { giver:'dolores', intro:[
      "(Dolores is already holding your coat.) The annex re-filed itself overnight. Gates down, levers reset, the crates look smug. It does that when it's nervous. It has been nervous since 1987.",
      "Four trust instruments are down there, beneficiary listed only as 'MIDNIGHT.' Bring me all four. Mind the golems — they unionized, and their demands are reasonable, which is worse."],
    prompt:"(She presses a brass key into your palm, then thinks better of it and takes it back.)",
    opts:[
      { t:"Who is MIDNIGHT, Dolores?", say:"I knew once. I filed it under a name I made myself forget. Bring the instruments; we'll remember together.", e:1 },
      { t:"Is there a finder's fee?", say:"Precedent. And my regard, which compounds quarterly.", a:1 }],
    outro:[
      "Four instruments, one beneficiary: 'MIDNIGHT, c/o The Honorable Mortimer Bane.' A sitting judge. I typed that name in 1987, and my hands have been cold ever since.",
      "Bane and Graves — law school roommates, Class of 1959. Final hearing tomorrow, Department 13. Take the firm car. And dear — bring everything you know."] },
  { intro:[
      "This is it. In re the Estate of Graves, before the Honorable Mortimer Bane. At stake: every hour this firm has ever billed.",
      "Win the jury. All twelve. Bane will throw bailiffs, sanctions, and — historically — his gavel.",
      "One more thing: when court is called to ORDER, hold your fire. He punishes contempt with reinforcements."],
    prompt:"You stand. You say:",
    opts:[
      { t:"We win this clean. On the record.", say:"(He straightens your collar. It is the most paternal thing he has ever done.) Go get him, counselor.", e:2 },
      { t:"After I win, I argue ALL our appeals.", say:"After you win, you can argue with GOD. Go.", a:2 }],
    outro:[
      "VERDICT FOR THE FIRM. Twelve jurors, zero dissents, one judge escorted out by his own bailiffs.",
      "The MIDNIGHT trust is dissolved. Forty years of hours, remanded to the people who billed them.",
      "The partners voted again at dawn. Still unanimous. Welcome — properly, finally, appeal-proof — to the letterhead."] },
];

const LORE = [
  "FILE 1987-A — Promotion announcement. 'Congratulations to Thaddeus Graves III on his elevation to Senior Partner Emeritus, effective midnight.' Someone has underlined 'midnight' fourteen times.",
  "FILE 1987-B — Timekeeper memo. 'Anomaly: T.G. III billed 25.0 hours on 3/13/87. Investigated. Resolution: do not investigate.'",
  "FILE 1987-C — Settlement agreement, unsigned. 'Clause 9: The Emeritus shall release all harvested hours upon invocation by any attorney of the firm in good standing.' A sticky note reads: 'nobody ever reads Clause 9.'",
  "FILE 1987-D — Garage deed. 'Sublevel P3 conveyed to the Worthington Family Trust in exchange for services rendered, March 1987.' The signature line for 'services' is just a long red smear.",
  "FILE 1987-E — Mailroom memo, March '87: 'The mail has begun delivering itself. Productivity up 340%. Morale: see attached scream.' Nothing is attached.",
  "FILE 1987-F — Trust deed. 'THE MIDNIGHT TRUST, est. 3/13/87. Corpus: 219,000 billable hours. Trustee: Grabbit & Runn LLP. Beneficiary: [SEALED BY ORDER OF HON. M. BANE].'",
  "FILE 1959-A — Law school yearbook page. 'Mortimer Bane: Most Likely to Hold a Grudge. Roommate: T. Graves III.' Below, in fresh ink: 'Still counting, Thaddeus.'",
];

const HARGROVE_NAGS = [
  "Why are you talking to me? The billable hour waits for no one. GO.",
  "Status report? No. Don't tell me. Surprise me at the partner meeting.",
  "If you have time to chat, you have time to bill. Magnificent system, isn't it."];
const CHAD_BANTER = [
  "My grandfather argued before the Supreme Court. My father argued WITH it. I argue mostly with the vending machine.",
  "You hear the thing in the walls at night too, right? ...Right?",
  "Billables aren't everything. They're the ONLY thing. Grandfather's words. He's in the parking garage now. The NICE part."];

// which NPC assigns / debriefs the current main matter (defaults to Hargrove)
function questGiver(){ const qd = QD[questIdx]; return (qd && qd.giver) || 'hargrove'; }
function questIntroScene(){
  const i = questIdx, qd = QD[i], g = qd.giver || 'hargrove';
  const nodes = qd.intro.map(t => N(g, t));
  nodes.push(N(g, qd.prompt, qd.opts.map(o => ({ t:o.t, say:o.say, fx:rep_(o.e||0, o.a||0) }))));
  startDialog(nodes, () => { acceptQuest(); if(questIdx === 5) gravesConfrontation(); });
}
function questOutroScene(){
  const i = questIdx, g = QD[i].giver || 'hargrove';
  startDialog(QD[i].outro.map(t => N(g, t)), () => {
    gainXP(QUESTS[i].xp);
    gainBillables(QUESTS[i].xp);   // matters pay billables ~ their XP
    if(i === 8){ act3Begin(); return; }   // Bane is beaten — the verdict unseals the founding agreement
    questIdx++; questPhase = 'get';
    saveGame();
    if(i === 2) chadBeat1();
    if(i === 4) chadBeat2();
    if(i === 5){ announce('ACT II — THE APPEAL', true, 4.5); SFX.promote(); }
  });
}
// ---- ACT III: IN RE: THE BUILDING ----
function act3Begin(){
  startDialog([
    N('hargrove', "You won. The appeal is dismissed. You should feel triumphant. Instead you feel... tired. We all do. We always have. Sit down. No — don't. There's no time, and time is exactly the problem."),
    N('hargrove', "The 1959 founding partnership agreement. Clause 9. It isn't a clause about the partners. It's a clause WITH a party you've never met. This building is a signatory. It has been harvesting our hours into the MIDNIGHT trust for sixty-seven years. That's why we're tired. That's why Graves never aged. That's why—"),
    N('hargrove', "—why my placard's first initial is scratched out. I wasn't always 'O. Hargrove.' I don't remember who I was. The building amended me. It does that. It keeps the originals filed downstairs, on a level that isn't on any plan. Sublevel C."),
    N('hargrove', "You're the first associate who ever fought it instead of signing. So I'm going to do the one brave thing left in me: I'm giving you the seal. The annex stair to Sublevel C will open for you. Go down. End it, or become it. I can't tell you which. I'm not sure I'm allowed to want either."),
  ], () => {
    flags.act3 = true;
    questIdx = 9; questPhase = 'done';   // main matter line concluded; Act III runs on the graph
    SFX.promote();
    announce('ACT III — IN RE: THE BUILDING. Descend to Sublevel C, below the Records Annex.', true, 5.5);
    saveGame();
  });
}
function act3Finale(){
  // The avatar has fallen; the open agreement awaits a signature, a match, or a redline.
  // Each choice sets flags.ending and lets its `say` play; endAct3() fires on dialog close.
  const ch = [
    { t:"BURN the agreement.",
      say:"You hold your lighter to 1959. The contract screams in a font you can't read. The building shudders, releases sixty-seven years of breath, and is, at last, just a building.",
      fx:()=>{ flags.ending = 'burn'; } },
    { t:"SIGN as the new named partner. (Ambition)",
      say:"The red ink is warm and it knows your hand. You sign. The tiredness lifts — not gone, just MOVED. It's everyone else's now. The corner office was always yours. It always will be. Forever is a long retainer.",
      fx:()=>{ flags.ending = 'sign'; } },
  ];
  if(flags.lore >= 7){
    ch.push({ t:"RENEGOTIATE Clause 9. (All seven 1987 files in hand)",
      say:"You spread all seven dossiers across the instrument and start redlining. Sixty-seven years of one-sided terms, struck and rewritten: hours paid, not harvested; tenure mortal; the amended restored. The building reads your markup — and, slowly, grudgingly, the way it does everything, it initials.",
      fx:()=>{ flags.ending = 'free'; } });
  }
  startDialog([
    N('dusty', "The Founding Agreement lies open on the cracked case, sixty-seven years of clauses breathing on the vellum. Every harvested hour the firm ever lost hangs in the air, waiting to learn where it goes next."),
    N('dusty', "The eleven filed partners watch from their shelves. Prudence Locke's empty frame watches hardest. The decision is yours, counselor. It was always going to be yours.", ch),
  ], () => endAct3());
}
function endAct3(){
  if(!flags.ending) return;   // safety: only end once a choice was actually made
  dlg = null; state = 'victory';
  if(flags.ending === 'sign') SFX.jingleLose(); else SFX.jingleWin();
  clearSave();
}
// NG+ — THE MERGER: a fresh run that keeps your gear and hours. Rank resets (the
// merged entity does not recognize prior promotions); every enemy in the building,
// spawned or pre-placed, is re-papered 50% tougher via flags.ngplus (see spawnEnemy).
function startNGPlus(){
  const carry = { inv:[...player.inventory], equip:{...player.equip}, billables:player.billables,
                  genderId:player.spr.slice(2), classId:player.cls.id, merger:(flags.merger||0)+1,
                  reviewBest:flags.reviewBest||0 };
  startGame(carry.genderId, carry.classId);
  player.inventory = carry.inv; player.equip = carry.equip; player.billables = carry.billables;
  flags.ngplus = true; flags.merger = carry.merger; flags.reviewBest = carry.reviewBest;
  for(const id in worlds) for(const e of worlds[id].enemies){   // scale the pre-placed too
    e.hp *= 1.5; e.maxhp *= 1.5; e.dmg = Math.round(e.dmg*1.25); e.xp = Math.round(e.xp*1.5);
  }
  recalcMaxHP(); player.hp = player.maxhp;
  dlg = null;
  startDialog([
    N('memo', `MEMORANDUM — RE: THE MERGER${carry.merger>1 ? ' ('+carry.merger+')' : ''}. Dewey, Cheatham & Howe has merged with itself, retroactively, effective 1959. All matters are reopened. All opposing parties are fifty percent more motivated. Your gear, hours, and enemies-made carry over. Your rank does not — the merged entity recognizes no prior promotions. Welcome back to Orientation, counselor.`),
  ]);
  saveGame();
}
function talkLocke(){
  const done = qstate.p_locke && qstate.p_locke.status === 'done';
  if(done){
    startDialog([ N('locke', "Use it well. The edge remembers what it was for. When the Agreement stands, do not let it read your hesitation — it bills for that too.") ]);
    return;
  }
  startDialog([
    N('locke', "Another one, fighting instead of signing. Good. I was the last. 1976 to 1981. I read Clause 9 the whole way through — nobody else ever had the stomach — and I found the seam in its own language."),
    N('locke', "It cannot amend what it cannot name. So I struck my own name out. With this." ),
    N('locke', "(She offers a letter opener that is somehow colder than the Vault.) I scratched myself out of the record and into this frame. Half-free. Better than amended. Take it — its edge bites deepest into things that were never supposed to exist. You'll know what I mean when the Agreement stands."),
  ], () => questEvent('talk', { npc:'locke' }));
}
function chadBeat1(){
  startDialog([
    N('chad', "(A blond associate materializes, smelling of squash courts.) Well, well. The new associate everyone's billing about. Chad Worthington IV — Hargrove's REAL favorite. My grandfather's name is on the parking garage.", [
      { t:"Nice to meet you, Chad. Coffee sometime?", say:"...Huh. Nobody's nice to me. It's the face, isn't it. Yes. Coffee. Whatever. This isn't friendship.", fx:()=>{ flags.chad++; } },
      { t:"The parking garage is sinking, Chad.", say:"IT'S SETTLING. STRUCTURES SETTLE.", fx:()=>{ flags.chad--; } },
      { t:"(Say nothing. Maintain eye contact.)", say:"...I respect that. And fear it." },
    ]),
  ]);
}
function chadBeat2(){
  startDialog([
    N('chad', "Psst. Worthington intel, free of charge: Hargrove has been in the file room all night pulling everything from 1987. Whatever is happening at this firm — it happens at YOUR partnership review."),
    N('chad', flags.chadWillJoin
      ? "And I meant it, after the card: I'll be at your review. Worthingtons pay their debts, even the weird emotional ones. ...Don't make it weird."
      : "One more thing — go see Dolores before your review. She's been guarding something with my name on it for weeks, and I... can't be the one to pick it up. Do that for me. Then we'll talk about your review."),
  ]);
}
function gravesConfrontation(){
  const ch = [
    { t:"I'd rather be disbarred.", say:"DELIGHTFUL. I haven't tasted a fresh associate since 1987.", fx:()=>beginFinalBattle(1) },
    { t:"...Where do I sign?", fx:()=>{ flags.ending='dark'; dlg=null; state='victory'; SFX.jingleLose(); clearSave(); return 'stop'; } },
  ];
  if(flags.lore >= 3) ch.push({ t:"I invoke Clause 9 of the 1987 Settlement.", say:"You— WHAT? Who let you into the records annex?! (The invoked clause burns in the air. He staggers.)", fx:()=>beginFinalBattle(0.6) });
  if(flags.ethics >= 4) ch.push({ t:"[ETHICS 4] The associates you drained — every one would testify for me.", say:"(For a moment, four decades of stolen all-nighters look back at him through your eyes. His cufflinks tarnish.) Sentiment. It won't save— what is happening to my HANDS.", fx:()=>beginFinalBattle(0.75) });
  startDialog([
    N('graves', "Ahhh. The associate of the season. Do you know how many of YOUR hours I have already tasted? That all-nighter in document review — exquisite. Notes of panic and printer toner."),
    N('graves', "I shall offer this once: kneel, sign in red ink, and in forty years the hours of others will taste sweet to you as well.", ch),
  ]);
}
function beginFinalBattle(mult){
  const q = QUESTS[5];
  for(const [type, n] of q.spawn){
    for(let i=0;i<n;i++){
      let p;
      do { p = findOpen(MAPW*TILE/2, MAPH*TILE/2, MAPW*TILE/2); }
      while(Math.hypot(p.x-player.x, p.y-player.y) < 260);
      spawnEnemy(type, p.x, p.y);
    }
  }
  const g = enemies.find(e => e.type === 'emeritus');
  if(g && mult < 1) g.hp = g.maxhp * mult;
  const chadNPC = NPCS.find(n => n.id === 'chad');
  if(flags.chadWillJoin){   // recruited by delivering Dolores's birthday card
    flags.chadAlly = true; chadNPC.hidden = true;
    allies.push({ x:player.x+46, y:player.y+10, r:14, spr:'chad', cd:1 });
    announce('Chad bursts in: "OBJECTION! The Worthingtons bill for THIS — and I owe you a birthday card."', false, 5);
  } else if(flags.chad <= -1){
    chadNPC.hidden = true;
    const p = findOpen(player.x, player.y, 300);
    spawnEnemy('chad', p.x, p.y);
    announce('Chad sides with Graves: "He validated my parking. You never did."', false, 5);
  }
}

// ---- side quests ----
function talkRosa(){
  // CASEWORK: the Kessler file outranks mailroom business while it's live
  const kq = qstate.kessler;
  if(kq && kq.status==='active' && kq.stage===0){
    startDialog([
      N('rosa', "The Kessler file. (She slides a folder across the counter, wrapped in twine and dread.) Client was billed a twenty-five-hour day — and PAID it, because the late-fee schedule was described as 'a haunting.'"),
      N('rosa', "Three exhibits went missing in The Reorganization, scattered around this floor. Find them. Build the case. Then come back, and we'll find out what kind of lawyer you are."),
    ]);
    return;
  }
  if(kq && kq.status==='active' && kq.stage===2){
    startDialog([N('rosa', "All three exhibits. Deep breath, counselor.")]); // replaced instantly by the resolution scene
    return;
  }
  if(flags.rosaQ === 0 && flags.hasStamper){
    startDialog([
      N('rosa', "Is that— you ALREADY have it? You went into the vault... voluntarily? Uncanny. Dolores will weep. Internally, where it counts."),
    ], () => { flags.rosaQ = 2; flags.ethics++; gainXP(40); giveItem('cold_brew'); giveItem('cold_brew', true); });
  }
  else if(flags.rosaQ === 0){
    startDialog([
      N('rosa', "You're the one fighting the building? Finally. Mail doesn't deliver itself — well, it DID, for one week in '87, but we don't talk about that."),
      N('rosa', "Do an old clerk a kindness? Dolores's emotional-support Bates stamper vanished during The Incident. Self-inking. Six digits. She raised it from 000001. It's down in the Records Annex — stairs in the southeast corner, past Mr. Worthington's office. Deep in the vault, if the rumors file correctly.", [
        { t:"I'll find it.", say:"Bless you. The annex tests its visitors: it likes things pushed, pulled, and filed in the proper order. Watch the annex. It watches back.", fx:()=>{ flags.rosaQ = 1; } },
        { t:"I'm too busy becoming partner.", say:"Mm. They always are. Door's open when the ambition gets heavy." },
      ]),
    ]);
  } else if(flags.rosaQ === 1 && !flags.hasStamper){
    startDialog([N('rosa', "Annex. Southeast. Bates stamper. The mail waits for no one, and neither does Dolores.")]);
  } else if(flags.rosaQ === 1 && flags.hasStamper){
    startDialog([
      N('rosa', "THE stamper! Dolores will weep — internally, where it counts. Here, mailroom wisdom, free of charge:"),
      N('rosa', "Never sign anything in red ink. And never, EVER schedule anything at midnight."),
    ], () => { flags.rosaQ = 2; flags.ethics++; gainXP(40); giveItem('cold_brew'); giveItem('cold_brew', true); });
  } else if(flags.mailQ === 0){
    const opener = flags.mailFailed
      ? "The cart survived 1987. It did not survive YOU. ...It's rebuilt. Banged out the dents myself. Ready when you are."
      : "Trouble, dear. You returned the stamper, the building noticed, and old habits woke up: the mail cart in the back is MOVING again. First time since '87. It wants to deliver to the executive suite.";
    startDialog([
      N('rosa', opener),
      N('rosa', "I can't let it go alone — the building's unbilled hours will tear it apart for the stamps. Walk it up to Hargrove's suite. Keep it rolling. Keep it whole.", [
        { t:"Let's deliver some mail.", say:"Mailroom motto, dear: through rain, sleet, and existential dread. GO.", fx:()=>{ startEscort(); } },
        { t:"Not right now.", say:"It'll keep. It's kept since 1987." },
      ]),
    ]);
  } else if(flags.mailQ === 1){
    startDialog([N('rosa', "Why are you HERE? The cart is THERE. Defend it like it's billable!")]);
  } else if(flags.mailQ === 2){
    startDialog([
      N('rosa', "It arrived?! ALL of it? Even the '87 backlog... Sit down, dear. I owe you a story."),
      N('rosa', "March 1987. Graves had just gone Emeritus. For one week, the mail delivered itself. Floated right out of the cart, every envelope to every desk. We called it efficiency. We didn't ask questions."),
      N('rosa', "Then we noticed the building was reading everything first — routing copies of every memo, every settlement, down to the corner office. It wasn't helping. It was FEEDING him."),
      N('rosa', "Dolores ended it. Drove her Bates stamper straight into the sorting machine and stamped the building's mail privileges CONFIDENTIAL — ATTORNEYS' EYES ONLY. That stamper was never 'emotional support', dear. It was a cork."),
      N('rosa', "Here — take the hazard vest off the hook. Reflective, dented, mailroom-blessed. You're one of us now, dear."),
    ], () => { flags.mailQ = 3; flags.ethics++; gainXP(90); giveItem('mail_vest'); });
  } else {
    startDialog([N('rosa', "The mail flows, the cork holds, and the building sulks. A good week, by mailroom standards.")]);
  }
}
function startEscort(){
  flags.mailQ = 1; flags.mailFailed = false;
  cart = { x:CART_WP[0][0]*TILE+20, y:CART_WP[0][1]*TILE+20, hp:160, maxhp:160, r:14, wp:1 };
  cartSpawnT = 3;
  announce('ESCORT: The mail cart trundles toward the executive suite. Keep it alive.', false, 4.5);
}
function talkBenny(){
  if(flags.coffeeQ === 1 && !flags.coffeeBrief){
    startDialog([
      N('benny', "The coffee machine TOO?! This building is taking us out one appliance at a time. Okay. OKAY. Breathe, Benny. We can rebuild it. Better. Stronger. More caffeinated."),
      N('benny', "Three parts. ONE: descaling solution — there's a vintage jug on the supply shelves in the Records Annex. TWO: a heating element — some partner abandoned a five-figure espresso rig down in the parking garage. Sublevel P3; freight elevator's in the mailroom. Fair warning: the rig's behind the valet cage, and the Worthingtons have kept that key since '87. THREE: a limited-edition portafilter. Chad bought the last one at a charity auction. To DISPLAY it. So really, Chad is steps two AND three. Godspeed."),
    ], () => { flags.coffeeBrief = true; });
  }
  else if(flags.termRead['office:14,11'] && !flags.bennyTicket){
    startDialog([
      N('benny', "You found ticket 4471?! I closed that in NINETY-FOUR and it reopens itself every year. Same night. Look — since you're apparently the only person in this building who READS:"),
      N('benny', "The 25th hour is real. The billing system posts into it, every entry lands in matter 000-1959, and I traced the receiving server once. There's no server. There's a ROOM. I don't go to the room. Here — two cold brews from my personal stash. If you're going to keep reading things that read back, be caffeinated for it."),
    ], () => { flags.bennyTicket = true; gainXP(30); giveItem('cold_brew', true); giveItem('cold_brew', true);
               announce('Benny slips you two Emergency Cold Brews (quick-use: 1). He also updates ticket 4471: "KNOWN ISSUE. DO NOT FIX."', false, 4.5); });
  }
  else if(flags.bennyQ === 0){
    startDialog([
      N('benny', "Oh thank god, someone with conflict experience. The document management system is down. THREE servers need a percussive reboot. Smack 'em till the light goes green."),
      N('benny', "Fair warning: server heat keeps the interns docile. Reboot one and the interns nearby get... zoomy.", [
        { t:"Define 'percussive'.", say:"With feeling, is what I mean. Walk up, press E, mean it.", fx:()=>{
            flags.bennyQ = 1;
            servers = [ {x:33*TILE+20,y:2*TILE+20,done:false}, {x:36*TILE+20,y:6*TILE+20,done:false}, {x:41*TILE+20,y:2*TILE+20,done:false} ];
          } },
        { t:"File a ticket like everyone else.", say:"I AM the ticket system. And I am DOWN." },
      ]),
    ]);
  } else if(flags.bennyQ === 1 && flags.serversFixed < 3){
    startDialog([N('benny', `Servers still down: ${3-flags.serversFixed}. The partners are saving documents to 'My Computer'. MY computer. Specifically mine.`)]);
  } else if(flags.bennyQ === 1){
    startDialog([
      N('benny', "All green! You beautiful litigious wrecking ball. I rerouted the fourth-floor printer queue through your billing code — and pulled a capacitor out of the server I'm not allowed to describe. Solder it onto your attack. You'll fire WAY faster."),
    ], () => { flags.bennyQ = 2; flags.ambition++; gainXP(60); giveItem('server_capacitor'); });
  } else {
    startDialog([N('benny', "Uptime: one hundred percent. Intern velocity: concerning.")]);
  }
}
function talkDolores(){
  if(flags.eleven && !flags.baneWeak && questIdx >= 6){
    startDialog([
      N('dolores', "You've met all eleven, then. I typed for every one of them. I typed Ezekiel's eulogy, Prudence's resignation, and the thing we do not call a confession."),
      N('dolores', "I also typed Mortimer Bane's clerkship rejection. 1959. This firm turned him down in eleven words. He has never forgiven us — or footnote four."),
      N('dolores', "His law review note, dear. 12 Yale L.J. 404. He cited HIMSELF. Incorrectly. Recite it back to him on the bench and he will simply... come apart. (She types the citation. You memorize it.)"),
      N('dolores', "One more thing. Pry the signet off the eleventh portrait — the empty frame. It remembers every partner the building overwrote. It will help your hand find the things that should not exist."),
    ], () => { flags.baneWeak = true; gainXP(40); giveItem('founders_signet'); });
  }
  else if(flags.doloresQ === 0){
    startDialog([
      N('dolores', "Young one. I have typed for this firm since 1974. I have outlived eleven managing partners and two of my own retirements."),
      N('dolores', "Take this envelope to young Mister Worthington. Sealed. SEALED, I said. The last associate who steamed one open billed two thousand hours that year and was never seen again.", [
        { t:"(Take the envelope.)", say:"Good. And tell him the Worthingtons still owe me for 1987.", fx:()=>{ flags.doloresQ = 1; } },
        { t:"What happened in 1987, Dolores?", say:"(She types a single period, very slowly.) Deliver the envelope, dear." },
      ]),
    ]);
  } else if(flags.doloresQ === 1){
    startDialog([N('dolores', "The envelope, dear. Mister Worthington. Sealed. I will know.")]);
  } else if(flags.termRead['office:15,20'] && !flags.doloresDraft){
    startDialog([
      N('dolores', "(The typing stops. In forty years, the typing has never stopped.) You read my draft. The one on the old terminal, to Prudence."),
      N('dolores', "I wrote it the week she vanished and never touched SEND. The key felt like a witness stand. ...She kept a continuance countersigned in 1981 — blank as to date — in case either of us ever needed more time. Take it. I have decided you are what we were saving the time FOR. (The typing resumes. It sounds, briefly, like applause.)"),
    ], () => { flags.doloresDraft = true; flags.ethics++; gainXP(30); giveItem('objection_writ', true);
               announce('Dolores gives you a Pre-Filed Continuance (quick-use: 2) and forty years of unspent tenderness, notarized. (+1 Ethics)', false, 5); });
  } else {
    startDialog([N('dolores', flags.rosaQ === 2 ? "My stamper came home, I hear. (She almost smiles. The room warms by two degrees.)" : "Delivered? Good. (typing) The boy's father was the same. All bluster, no Bates.")]);
  }
}
function talkChad(){
  if(flags.doloresQ === 1){
    startDialog([
      N('chad', "Is that— is that from DOLORES? Give it— wait. Wait. Did you open it?", [
        { t:"Sealed, as entrusted.", say:"(He reads it. His lip trembles.) It's a birthday card. She's the only one who remembers. ...You carried it sealed. Nobody does that for me. Listen — my review's the same night as yours, in the same office. I'll be there. You watch your back, I'll watch it too. (He presses his cufflinks into your hand.) Worthington monogram. Don't make it a thing.", fx:()=>{ flags.doloresQ = 2; flags.chad++; flags.ethics++; flags.chadWillJoin = true; gainXP(40); giveItem('monogrammed_cufflinks'); } },
        { t:"(Hand it over. Slightly steamed.)", say:"You READ it?! ...Then you saw the warning. 'Graves remembers you, Chaddy. Stay away from midnight reviews.' ...Whatever. Keep the cufflinks, call it hush money. And I'm coming to your review. Not for YOU — to spite a dead man who scared me as a kid. But I'll be swinging on your side of the room.", fx:()=>{ flags.doloresQ = 2; flags.ambition++; flags.chadWillJoin = true; gainXP(40); giveItem('monogrammed_cufflinks'); } },
      ]),
    ]);
  } else if(flags.grandfatherDown && !flags.chadGpa){
    startDialog([
      N('chad', "You went down to P3. You— you MET him. Grandfather. Is he—", [
        { t:"He's at rest now, Chad. It's just a garage.", say:"(He stares at the wall for a long time.) He used to let me hold the valet key. Best day of my life. ...Thanks. I guess. This isn't gratitude.", fx:()=>{ flags.chadGpa=true; flags.chad++; flags.ethics++; } },
        { t:"He said billables are the ONLY thing. Then he exploded.", say:"That's the quote on our family CREST. You're a monster. (leaning in, whispering) Tell me everything.", fx:()=>{ flags.chadGpa=true; flags.ambition++; } },
      ]),
    ]);
  } else if(flags.coffeeBrief && !flags.partChad){
    startDialog([
      N('chad', "The portafilter? It's ITALIAN. It appreciates four percent annually. Why would I— wait. You NEED something from me. The portafilter AND grandfather's valet key. Oh, this is delicious. Name your humiliation.", [
        { t:"It's for the partners' lounge. (Lie.)", say:"The PARTNERS' lounge? Why didn't you say so. Take it. The key too. Tell them a Worthington provided.", fx:()=>{ flags.partChad=true; flags.hasValetKey=true; giveItem('valet_key',true); flags.ethics--; } },
        { t:"I need your help, Chad. You, specifically.", say:"...Say it again. Slower. (You do.) HA! Take the portafilter. And the key — grandfather would have liked you. He liked nobody. This memory will sustain me through winter.", fx:()=>{ flags.partChad=true; flags.hasValetKey=true; giveItem('valet_key',true); flags.ambition--; flags.chad++; } },
        ...(flags.ambition >= 3 ? [{ t:"[AMBITION 3] A Worthington owes me. The filter, the key — now.", say:"(He goes pale in a way only old money can manage.) You sound like grandfather. Take them. TAKE THEM. ...I respect this and will be discussing it in therapy.", fx:()=>{ flags.partChad=true; flags.hasValetKey=true; giveItem('valet_key',true); flags.chad++; } }] : []),
        { t:"Forget it.", say:"Door's always open. The humiliation menu never closes." },
      ]),
    ]);
  } else {
    startDialog([N('chad', CHAD_BANTER[Math.floor(Math.random()*CHAD_BANTER.length)])]);
  }
}
function talkLenny(){
  if(flags.lennyQ === 0){
    startDialog([
      N('lenny', "Oh! A lawyer! A REAL one? I've been in this lobby since 2019. I had a consultation. They said someone would be 'right with me.' I've seen three Christmas parties and a small fire."),
      N('lenny', "It's my security deposit. $850. The firm took my case pro bono, then the paperwork golems took my FILE in The Reorganization. Three of them have it. I'd know that file anywhere — it has a coffee ring shaped like Ohio.", [
        { t:"I'll get your file back, Lenny.", say:"Really?? No one ever— okay. Okay! I'll be here. Obviously. I'm always here.", fx:()=>{
            flags.lennyQ = 1;
            for(let i=0;i<3;i++){
              let p; do { p = findOpen(player.x, player.y, 320); } while(Math.hypot(p.x-player.x, p.y-player.y) < 200);
              spawnEnemy('golem', p.x, p.y);
              enemies[enemies.length-1].proBono = true;
            }
          } },
        { t:"Billing partner says no.", say:"I understand. Billables. (He settles deeper into the chair. The chair has accepted him as one of its own.)" },
      ]),
    ]);
  } else if(flags.lennyQ === 1 && flags.lennyKills < 3){
    startDialog([N('lenny', `Three golems. ${3-flags.lennyKills} still have pieces of my file. I believe in you the way I no longer believe in elevator small talk.`)]);
  } else if(flags.lennyQ === 1){
    startDialog([
      N('lenny', "My file! Ohio and everything! What do I owe— oh. Oh no. I can't pay you. I couldn't even pay the DEPOSIT, that's the whole case."),
      N('lenny', "(He shakes your hand for a very long time. Somewhere, an ethics professor feels a disturbance and smiles.)"),
    ], () => {
      flags.lennyQ = 2; flags.ethics += 2;
      giveItem('pro_bono_plaque', true);
      floaters.push({ x:player.x, y:player.y-22, text:'+0 XP (PRO BONO) · +2 ETHICS', t:1.6, color:'#9be05e' });
      announce('Case closed. Fee: nothing — but Lenny had a Pro Bono plaque engraved for you. Equip it from your bag [I]. It was simply the right thing to do.', false, 5);
    });
  } else {
    startDialog([N('lenny', "I won! Well — YOU won. The deposit comes back in six to eight business eons. I'm staying in the lobby though. It's load-bearing now. I'm load-bearing.")]);
  }
}
// ---- CASEWORK resolutions ----
// Kessler: the confrontation fires from the quest's onComplete, replacing Rosa's
// greeting synchronously. The choice IS the reward — three ways to be a lawyer.
function kesslerResolution(){
  player.inventory = player.inventory.filter(id => id !== 'kessler_exhibit'); // evidence, not luggage
  const ch = [
    { t:"SETTLE — quiet refund from the marketing budget. Nobody has to know.",
      say:"(Rosa nods slowly.) Clean. Quiet. The client gets made whole and the building never hears its own name said out loud. You'd have made a fine mailroom clerk. That is high praise.",
      fx:()=>{ flags.kesslerCall='settle'; flags.ambition++; gainBillables(60); } },
    { t:"TRIAL — put the twenty-fifth hour on the record.",
      say:"(She grins like a filing cabinet opening.) On the RECORD. Oh, the building will hate that. It will fight — padded hours always do. Go. I'll warm up the stamp.",
      fx:()=>{ flags.kesslerCall='trial'; } },
    ...(flags.ambition >= 2 ? [{ t:"[AMBITION 2] BURY IT — and bill Kessler for the burial.",
      say:"(The mailroom goes very quiet. Even the cart.) ...You'll go far here. That was not a compliment.",
      fx:()=>{ flags.kesslerCall='bury'; flags.ambition++; flags.ethics--; gainBillables(150); } }] : []),
  ];
  startDialog([
    N('rosa', "Three exhibits. One impossible hour, billed and collected. Kessler trusted this firm. So — what kind of lawyer are you?", ch),
  ], () => {
    gainXP(100); SFX.closeMatter();
    if(flags.kesslerCall==='trial') announce('KESSLER GOES TO TRIAL. The overbilled hours have noticed. They are coming to be heard.', true, 4.5);
    else announce('MATTER CLOSED: Kessler v. The Fourth Floor. The file goes back in the drawer. The drawer approves.', true, 4.5);
    saveGame();
  });
}
// The Night Typewriter — the GHOSTWRITER confrontation, deepest alcove of the Stacks.
// Emits the quest's final talk event from the chosen branch, act3Finale-style.
function talkTypewriter(){
  const gq = qstate.ghostwriter;
  if(!gq || gq.status!=='active' || gq.stage!==2){
    startDialog([N('memo', "An IBM Selectric, black as a docket, warm as a verdict. It is typing. There is no paper. There is no one at the keys. Perhaps come back when you know what to ask it.")]);
    return;
  }
  const done = () => questEvent('talk', { npc:'typewriter' });
  const ch = [
    { t:"EXPOSE IT — every ghost-written opinion goes on the record.",
      say:"The typing stops. The stacks inhale. Somewhere above you, sixty years of misfiled decisions begin pulling themselves off the shelves to object.",
      fx:()=>{ flags.ghostCall='expose'; done(); } },
    ...(flags.ambition >= 4 ? [{ t:"[AMBITION 4] REPRESENT IT — everyone deserves counsel. Retainer up front.",
      say:"The carriage returns, slowly, like a handshake. A retainer prints itself: four hundred hours, pre-billed, origin undisclosed. You do not ask whose hours. That is what representation means.",
      fx:()=>{ flags.ghostCall='client'; flags.ambition+=2; gainBillables(400); done(); } }] : []),
    { t:"SMASH IT — some opinions should never be drafted.",
      say:"The Selectric accepts the motion with dignity. Sixty years of unsigned dicta sigh out of the ribbon and disperse into the dust. The stacks feel, at last, proofread.",
      fx:()=>{ flags.ghostCall='smash'; flags.ethics++; gainXP(80); done(); } },
  ];
  startDialog([
    N('memo', "THE NIGHT TYPEWRITER. Drafting opinions into the record since 1959 — unsigned, uncited, unfailingly persuasive. Bane's best lines. Graves's retirement terms. It pauses mid-sentence. It is listening."),
    N('memo', "The platen turns expectantly. Your move, counselor.", ch),
  ]);
}

function talkBoard(){
  if(review){
    startDialog([N('memo', `DOCUMENT REVIEW IN PROGRESS — wave ${review.wave}. The board declines to assign new matters to an attorney currently buried in production. Leave the floor to recess.`)]);
    return;
  }
  if(boardActive){
    startDialog([N('memo', `OPEN MATTER: ${matterName(boardActive)} — ${boardActive.prog}/${boardActive.n} handled. The board takes one matter at a time. Close this one first.`)]);
    return;
  }
  const ch = boardOffers.map((m,i) => ({ t:`${matterName(m)}  ·  ${m.bh} hrs`, fx:()=>acceptMatter(i) }));
  if(flags.act3) ch.push({ t:`DOCUMENT REVIEW — endless production, pays per wave. (best: ${flags.reviewBest||0})`,
    fx:()=>startReview() });
  ch.push({ t:"Not right now.", say:"The board waits. It is, after all, cork. It has nothing but time — and so, technically, do you." });
  startDialog([
    N('memo', "ASSIGNMENT BOARD — standing matters, billable on completion. The work is eternal; so is the firm. Take one:", ch),
  ]);
}
function talkTo(n){
  // the active matter's giver takes priority while a matter is to be assigned or reported
  if(n.id === questGiver() && (questPhase === 'get' || questPhase === 'turnin')){
    if(questPhase === 'get') questIntroScene(); else questOutroScene();
    questEvent('talk', { npc:n.id });
    return;
  }
  if(n.id === 'hargrove'){
    if(player.rank.lvl >= 5 && !flags.compAsk){   // Junior Partner+: you may now negotiate
      startDialog([
        N('hargrove', "What. I'm busy being managing partner of a haunted building.", [
          { t:"[JUNIOR PARTNER] About my compensation, Oswald.", say:"(You used his first name. Somewhere in the library, a portrait gasps.) ...Fine. A mid-year adjustment, out of the marketing budget. Tell NO ONE. Especially not marketing.", fx:()=>{ flags.compAsk = true; flags.ambition++; gainBillables(150); } },
          { t:"Nothing, sir. Looking busy.", say:"Excellent. It's working." },
        ]),
      ]);
      questEvent('talk', { npc:n.id });
      return;
    }
    startDialog([N('hargrove', HARGROVE_NAGS[Math.floor(Math.random()*HARGROVE_NAGS.length)])]);
  }
  else if(n.id === 'rosa') talkRosa();
  else if(n.id === 'benny') talkBenny();
  else if(n.id === 'dolores') talkDolores();
  else if(n.id === 'chad') talkChad();
  else if(n.id === 'lenny') talkLenny();
  questEvent('talk', { npc:n.id });
}
function npcMarker(n){
  // the current matter's giver shows the matter marker (over any side-quest marker)
  if(n.id === questGiver()){
    if(questPhase==='get') return '!';
    if(questPhase==='turnin') return '?';
  }
  switch(n.id){
    case 'hargrove': return (player.rank.lvl >= 5 && !flags.compAsk) ? '!' : null; // comp talk unlocks at Junior Partner
    case 'rosa': {
      const kq = qstate.kessler;
      if(kq && kq.status==='active' && (kq.stage===0 || kq.stage===2)) return kq.stage===2 ? '?' : '!';
      return flags.rosaQ===0 ? '!'
           : (flags.rosaQ===1 && flags.hasStamper) || flags.mailQ===2 ? '?'
           : (flags.rosaQ===2 && flags.mailQ===0) ? '!' : null;
    }
    case 'benny':    return flags.bennyQ===0 || (flags.coffeeQ===1 && !flags.coffeeBrief) || (flags.termRead['office:14,11'] && !flags.bennyTicket) ? '!' : (flags.bennyQ===1 && flags.serversFixed>=3 ? '?' : null);
    case 'dolores':  return flags.doloresQ===0 ? '!' : (flags.eleven && !flags.baneWeak && questIdx>=6) ? '!' : (flags.doloresQ>=2 && flags.termRead['office:15,20'] && !flags.doloresDraft) ? '!' : null;
    case 'lenny':    return flags.lennyQ===0 ? '!' : (flags.lennyQ===1 && flags.lennyKills>=3) ? '?' : null;
    case 'chad':     return flags.doloresQ===1 ? '?' : (flags.grandfatherDown && !flags.chadGpa) || (flags.coffeeBrief && !flags.partChad) ? '!' : null;
  }
  return null;
}

// ---- AMBIENT STAFF: non-combat extras who wander, mutter, and panic ----
const EXTRA_BARKS = {
  office: [
    "Has anyone seen the Hendricks file? Anyone?",
    "I've been on hold with the clerk's office since Tuesday.",
    "0.1 — thinking about the case in the shower.",
    "The fourth floor printer is a cry for help.",
    "I billed a dream once. It settled.",
    "Lunch? I had lunch in 2019. It was fine.",
    "Don't take the stairs past B2. Trust me.",
    "My paralegal quit. My OTHER paralegal... turned.",
    "Redlines due at midnight. They're always due at midnight.",
    "I found a conference room nobody knows about. It's mine now.",
    "Partner track? I'm on partner TREADMILL.",
    "The vending machine took my hours AND my dignity.",
    "Whoever's billing matter 000-1959 — please stop.",
    "I CC'd myself for the company. The company of me.",
  ],
  floor24: [
    "We're not allowed to say 'Dewey' on this floor.",
    "Associate of the Month gets a plaque AND a cot.",
    "Our coffee is decaf. Silas says ambition is a stimulant.",
    "I hear their mailroom has a ghost. We have a Peloton.",
    "Billing race at nine. Loser drafts the interrogatories.",
    "The good pens are in the display case. LOOKING is billable.",
  ],
  panic: [
    "NOT THE BILLABLES!",
    "I'm taking PTO! Retroactively!",
    "This is why I went in-house— oh no, I didn't.",
    "SAVE THE HENDRICKS FILE!",
    "I have a deposition!! I'll hide in it!",
    "Someone call security! Someone BILL security!",
    "Not again. Not during MY quarter.",
  ],
};

// ---- THE INTRANET ARCHIVE: every desk computer is a readable workstation ----
// Nine authored messages (keyed 'world:tx,ty' on real desk tiles) carry a second
// lore track — the conspiracy as the STAFF experienced it, complementing the
// seven 1987 case files. Every other computer serves deterministic office flavor.
const TERMINALS = {
  'office:14,11': { nm:'IT TICKET #4471 (1994, still open)',
    text:'"My computer shows a 25th hour between 11:59 PM and midnight. The billing software accepts entries into it." — RESOLUTION (B. writes): Closing as WORKING AS INTENDED. Do NOT bill into the extra hour. Whatever you earn there isn\'t paid to YOU.' },
  'office:20,14': { nm:'HR MEMO — RE: RETIREMENT OF T. GRAVES III (1987)',
    text:'Per Clause 9 of the Founding Agreement, "retirement" shall be interpreted as defined in Sublevel C. The farewell party will end at 11:45 PM SHARP. Attendance after dark is not recommended, required, or survivable. Cake in the break room.' },
  'office:25,17': { nm:'BILLING SYSTEM — ERROR LOG (last Tuesday)',
    text:'TIME ENTRY REJECTED — REASON: TIMEKEEPER DECEASED (1987).\n> OVERRIDE ACCEPTED — AUTHORITY: CLAUSE 9.\n> ENTRY POSTED: 25.0 HRS — MATTER 000-1959.\n> HAVE A PRODUCTIVE DAY.' },
  'office:15,20': { nm:'UNSENT DRAFT — D. (October 1987)',
    text:'Prudence — you were right about the ninth clause. I kept your letter opener; it\'s the only thing in this building that still cuts. If you\'re somehow reading this: the vault remembers your birthday, and so do I. I\'m sorry I filed the complaint under H. — D.' },
  'office:26,23': { nm:'RE: RE: RE: FWD: WHO KEEPS BILLING TO MATTER 000-1959?',
    text:'41 replies. Accounting says the matter predates the firm. The firm says it predates accounting. The last reply is from the mailroom terminal, sent at 12:00 AM: "The matter is the client. Please stop asking." Everyone stopped asking.' },
  'office:19,28': { nm:'RECEPTION — VISITOR LOG (page 1,340)',
    text:'11:58 PM — M. Bane, Hon. — purpose: "standing appointment." Badge #13, not returned since 1963. NOTE FROM NIGHT DESK: he does not use the elevator. We do not know how he gets to the corner office. We have stopped watching the stairwell camera.' },
  'office:24,28': { nm:'FACILITIES MEMO — ELEVATOR INSPECTION',
    text:'Finding: the building has 30 floors; the elevator has 31 buttons. Recommendation: do not press the unmarked one. STATUS: recommendation overruled — signatory: the unmarked one. Facilities has updated its resume.' },
  'floor24:4,11': { nm:'G&R INTERNAL — S. GRABBIT (1981)',
    text:'To all staff of my NEW firm: we left Dewey, Cheatham & Howe with the good pens and our souls. Leaving one of those behind was a mistake — you may decide which. POLICY: accept no referral on any DC&H matter older than 1959. Not for any fee. Especially not for a generous one.' },
  'floor24:19,17': { nm:'G&R ASSOCIATES CHAT — ARCHIVED BY LEGAL',
    text:'"ok but why do DC&H associates stop AGING when they make partner" — "ours just stop" — "HR says that\'s normal" — "HR is a printer over there, did you know that" — [THREAD LOCKED BY LEGAL. REMINDER: WE DO NOT DISCUSS THE COMPETITION\'S BENEFITS PACKAGE.]' },
};
const TERM_FLAVOR = [
  'PER MY LAST EMAIL. (Attached: 41 previous emails. They are all identical. The attachment is 340 MB.)',
  'SUBJECT: cake in the break room!!! — UPDATE: the cake is gone. UPDATE 2: the cake was for a deposition. UPDATE 3: opposing counsel ate it. Motion to compel a new cake is pending.',
  'OUT OF OFFICE: I am out of the office from March 2011 and will respond to your message upon my return. If urgent, please contact someone who still works here.',
  'REMINDER FROM ACCOUNTING: a 0.1 saved is a 0.1 earned. A 0.1 unentered is a WRAITH. Enter your time.',
  'SUBJECT: MANDATORY FUN — this Friday\'s team-building is mandatory. Fun levels will be monitored and reported to the partnership.',
  'The screensaver is a DVD logo drifting toward the corner of the screen. It has never hit the corner. Employees have billed 61.3 collective hours watching. It knows.',
  'KITCHEN NOTICE: whoever keeps labeling their food "EVIDENCE" — the fridge is not a chain of custody, and yes, someone tampered with your yogurt.',
  'CLE REMINDER: "Ethics at Midnight" has been rescheduled to noon, by unanimous, urgent vote of everyone who attended last year.',
];
function readTerminal(tx, ty){
  const key = `${worldId}:${tx},${ty}`;
  const t = TERMINALS[key];
  if(t){
    const first = !flags.termRead[key];
    startDialog([{ nm:t.nm, spr:'computer', text:t.text }], () => {
      if(!first) return;
      flags.termRead[key] = true;
      gainXP(8);
      const n = Object.keys(flags.termRead).length, total = Object.keys(TERMINALS).length;
      if(n === total){
        flags.intranetDone = true; flags.ethics++; gainXP(60);
        announce('THE INTRANET ARCHIVE IS COMPLETE. Nine messages nobody was meant to keep. You understand the staff now — the ones who stayed, and the one who didn\'t. (+60 XP, +1 Ethics)', false, 6.5);
      } else announce(`INTRANET ARCHIVE: ${n}/${total}. The mail server hums, pleased to be read.`, false, 3);
    });
  } else {
    // ordinary desk: stable flavor pick, so each workstation "belongs" to someone
    const h = (tx*7 + ty*13 + worldId.length*31) % TERM_FLAVOR.length;
    startDialog([{ nm:'WORKSTATION — UNLOCKED, UNATTENDED', spr:'computer', text:TERM_FLAVOR[h] }]);
  }
}
// nearest readable desk tile within reach (shared by the E-handler and the render hint)
function nearTerminal(){
  const ptx = Math.floor(player.x/TILE), pty = Math.floor(player.y/TILE);
  let best = null, bd = 60;
  for(let ty=pty-1; ty<=pty+1; ty++) for(let tx=ptx-1; tx<=ptx+1; tx++){
    if(map[ty] && map[ty][tx]===2){
      const d = Math.hypot(player.x-(tx*TILE+20), player.y-(ty*TILE+20));
      if(d < bd){ bd = d; best = { tx, ty }; }
    }
  }
  return best;
}

let dlgRects = []; // tappable choice hitboxes in canvas coords, rebuilt each drawDialog
function drawDialog(){
  if(!dlg) return;
  const d = dlg.nodes[dlg.i];
  // larger type on touch devices, where the canvas is scaled down hard
  const fs = IS_TOUCH ? 17 : 13, lh = IS_TOUCH ? 23 : 18, chh = IS_TOUCH ? 27 : 20;
  const lines = wrap(d.text, IS_TOUCH ? 58 : 80);
  const nch = d.choices ? d.choices.length : 0;
  const bh = Math.max(100, 56 + lines.length*lh + nch*chh + (nch ? 12 : 20));
  // anchor in the upper-middle of the viewport so it's visible without scrolling
  const bx = 40, bw = W - 80, by = Math.max(14, (H - bh)*0.32);
  ctx.fillStyle = 'rgba(13,10,20,0.94)'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#f0c75e'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#241d36'; ctx.fillRect(bx+12, by+12, 72, 72);
  ctx.strokeStyle = '#4a3f63'; ctx.strokeRect(bx+12, by+12, 72, 72);
  drawSprite(SPR[d.spr], bx+48, by+48, 64);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${fs+1}px monospace`; ctx.fillStyle = '#f0c75e';
  ctx.fillText(d.nm, bx+100, by+26);
  ctx.font = `${fs}px monospace`; ctx.fillStyle = '#e8e0f0';
  lines.forEach((l,i) => ctx.fillText(l, bx+100, by+48 + i*lh));
  const yy = by + 48 + lines.length*lh + 8;
  dlgRects = [];
  if(d.choices){
    ctx.font = `bold ${fs}px monospace`;
    d.choices.forEach((c,i) => {
      const sel = padOn && i===padDlgSel;   // controller: d-pad highlights, A chooses
      ctx.fillStyle = sel ? '#f0c75e' : '#5ec8f0';
      ctx.fillText(`${sel ? '>' : ' '}[${i+1}] ${c.t}`, bx+92, yy + i*chh);
      dlgRects.push({ x:bx+96, y:yy + i*chh - chh + 5, w:bw-110, h:chh });
    });
  } else {
    ctx.font = '12px monospace'; ctx.fillStyle = '#9b8fb5';
    ctx.fillText(IS_TOUCH ? '[tap] continue' : (padOn ? '[E / A] continue' : '[E] continue'), bx+bw-130, by+bh-12);
  }
}
const COFFEE = { x: 40*TILE+TILE/2, y: 11*TILE+TILE/2 };

function announce(text, big=false, dur=3){ msg = { text, t:dur, big }; }

function rankFor(xp){
  let r = RANKS[0];
  for(const k of RANKS) if(xp >= k.xp) r = k;
  return r;
}

// ---- PERKS: each promotion banks one development choice, offered between fights ----
// Owed picks derive from rank vs. perks owned, so nothing extra is saved and old
// saves collect their banked choices retroactively.
function perksPending(){ return player ? Math.max(0, (player.rank.lvl - 1) - player.perks.length) : 0; }
function offerPerk(){
  const pool = PERKS.filter(p => !player.perks.includes(p.id));
  if(!pool.length) return;
  const picks = [];
  while(picks.length < Math.min(2, pool.length)){
    const p = pool[Math.floor(Math.random()*pool.length)];
    if(!picks.includes(p)) picks.push(p);
  }
  const ch = picks.map(p => ({ t:`${p.nm} — ${p.ds}`, fx:()=>{
    player.perks.push(p.id);
    SFX.promote();
    announce(`DEVELOPMENT AREA LOCKED IN: ${p.nm.toUpperCase()}. HR has updated your permanent file. The file hums.`, false, 4.5);
    saveGame();
  }}));
  startDialog([
    N('memo', `PROMOTION DEVELOPMENT PACKAGE${perksPending()>1 ? ` (${perksPending()} banked)` : ''} — the partnership requires you to develop exactly one professional strength per promotion. Choose. This is the only part of your review you control.`, ch),
  ]);
}

function startGame(genderId, classId){
  buildWorlds();
  const cls = CLASSES.find(c=>c.id===classId);
  const gen = GENDERS.find(g=>g.id===genderId);
  player = {
    x: 22*TILE, y: 9*TILE, r: 13, spr: 'p_'+gen.id, cls,
    hp: 100, maxhp: 100, xp: 0, rank: RANKS[0],
    cd: 0, hurtT: 0, coffeeCd: 0,
    face: {x:0, y:1}, meleeCd: 0, spinCd: 0, swingT: 0, spinT: 0,
    dashT: 0, dashCd: 0, dashDx: 0, dashDy: 1,
    perks: [], standT: 0, contUsed: false,
    inventory: [], equip: { weapon:null, accessory:null, suit:null },
    billables: 0,
  };
  invOpen = false; invSel = null;
  qInit();
  shots=[]; enemyShots=[]; floaters=[]; particles=[];
  allies=[]; servers=[]; dlg=null; companion=null;
  loadWorld('office');
  flags = { ethics:0, ambition:0, chad:0, rosaQ:0, bennyQ:0, doloresQ:0,
            hasStamper:false, hasKey:false, serversFixed:0, lore:0, chadAlly:false, ending:null,
            mailQ:0, mailFailed:false, coffeeQ:0, coffeeBrief:false, coffeeUp:false,
            partDescaler:false, partElement:false, partChad:false,
            hasValetKey:false, grandfatherDown:false, chadGpa:false, chadWillJoin:false,
            portraits:0, eleven:false, baneWeak:false,
            trialWave:0, jury:0, baneSpawned:false,
            lennyQ:0, lennyKills:0, act3:false, helpSeen:false,
            termRead:{}, intranetDone:false, bennyTicket:false, doloresDraft:false,
            reviewBest:0, ngplus:false, merger:0, compAsk:false, kesslerCall:null, ghostCall:null,
            totalKills:0, totalBilled:0, boardClosed:0 };
  cart = null; cartSpawnT = 0;
  pendingSpawn = null; orderT = 6; orderActive = false; orderFired = false;
  NPCS.forEach(n => n.hidden = false);
  questIdx = 0; questPhase = 'get'; killCount=0; collectCount=0;
  gameTime = 0;
  boardActive = null; boardSeq = 0; refreshBoard();   // assignment-board matters
  giveItem('pinstripe_suit', true); equipItem('pinstripe_suit'); // starter armor — teaches the bag from minute one
  state = 'play';
  startDialog([
    N('memo', "Welcome to Dewey, Cheatham & Howe LLP. Your badge is enclosed. Your desk is the one that is on fire."),
    N('memo', "Managing Partner Hargrove will assign your first matter. He is north, on the executive carpet, radiating disappointment. Other colleagues may also require... assistance. — HR (do not reply; HR is the printer now)"),
    N('memo', IS_TOUCH ? "Use the joystick to move and the buttons to STRIKE, FIRE, SPIN, and DASH. Tap TALK at a person or station. Your bag holds your gear and open matters."
                       : "Orientation tip: press H at any time for the Field Manual — controls, your emergency filings (keys 1/2/3), and how to handle what's down here."),
  ], () => { if(!IS_TOUCH && !flags.helpSeen){ flags.helpSeen = true; toggleHelp(); } });
}

