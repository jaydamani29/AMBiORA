const COL=['#E0577A','#2A2A2E','#C93E66','#F4B3C4','#8C8788'];
const KEY='ambiora_esports_v1';
const blank=()=>({teams:Array.from({length:5},(_,i)=>({name:'',players:Array.from({length:5},()=>({name:'',ign:''}))})),fixtures:null});
let S;
try{S=JSON.parse(localStorage.getItem(KEY))||blank()}catch(e){S=blank()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* routing */
function route(){
  const t=location.hash.startsWith('#/teams');
  document.title=t?'Teams & Fixtures – Ambiora Arena':'Ambiora Arena – Esports Tournament';
  $('home').hidden=t;$('teams').hidden=!t;
  $('n1').classList.toggle('on',!t);$('n2').classList.toggle('on',t);
  if(t)renderTeams();window.scrollTo(0,0);
}
addEventListener('hashchange',route);

/* countdown - change the date below to your event date */
const EVENT=new Date('2026-11-14T10:00:00+05:30');
function tick(){
  let d=Math.max(0,EVENT-Date.now()),s=Math.floor(d/1000);
  const p=n=>String(n).padStart(2,'0');
  $('cd').textContent=Math.floor(s/86400);$('ch').textContent=p(Math.floor(s%86400/3600));
  $('cm').textContent=p(Math.floor(s%3600/60));$('cs').textContent=p(s%60);
}
setInterval(tick,1000);tick();

/* team form */
function renderTeams(){
  $('teamGrid').innerHTML=S.teams.map((t,i)=>`
   <div class="team" style="--c:${COL[i]}" id="t${i}">
    <input class="tn" data-t="${i}" data-f="name" placeholder="Team ${i+1} name" maxlength="20" value="${esc(t.name)}" aria-label="Team ${i+1} name">
    <div class="hd"><span></span><span>Player name</span><span>In-game ID</span></div>
    ${t.players.map((p,j)=>`<div class="pl"><i>${j+1}</i>
      <input data-t="${i}" data-p="${j}" data-f="name" placeholder="Full name" maxlength="30" value="${esc(p.name)}" aria-label="Team ${i+1} player ${j+1} name">
      <input data-t="${i}" data-p="${j}" data-f="ign" placeholder="e.g. Ghost47" maxlength="20" value="${esc(p.ign)}" aria-label="Team ${i+1} player ${j+1} in-game ID"></div>`).join('')}
   </div>`).join('');
  renderOut();
}
$('teamGrid').addEventListener('input',e=>{
  const el=e.target,t=+el.dataset.t;if(isNaN(t))return;
  if(el.dataset.p!==undefined)S.teams[t].players[+el.dataset.p][el.dataset.f]=el.value;
  else S.teams[t].name=el.value;
  el.classList.remove('bad');save();
});

function validate(){
  const errs=[];document.querySelectorAll('input.bad').forEach(x=>x.classList.remove('bad'));
  const seen=new Set(),igns=new Set();
  S.teams.forEach((t,i)=>{
    const n=t.name.trim().toLowerCase(),tn=document.querySelector(`[data-t="${i}"][data-f="name"]:not([data-p])`);
    if(!n){errs.push(`Team ${i+1} needs a name.`);tn.classList.add('bad')}
    else if(seen.has(n)){errs.push(`Team name "${t.name.trim()}" is used twice.`);tn.classList.add('bad')}
    seen.add(n);
    t.players.forEach((p,j)=>['name','ign'].forEach(f=>{
      const el=document.querySelector(`[data-t="${i}"][data-p="${j}"][data-f="${f}"]`);
      if(!p[f].trim()){el.classList.add('bad');errs.push(`Team ${i+1}, player ${j+1}: ${f==='ign'?'in-game ID':'name'} is empty.`)}
    }));
    t.players.forEach((p,j)=>{const k=p.ign.trim().toLowerCase();if(!k)return;
      if(igns.has(k)){errs.push(`In-game ID "${p.ign.trim()}" is used twice.`);document.querySelector(`[data-t="${i}"][data-p="${j}"][data-f="ign"]`).classList.add('bad')}igns.add(k)});
  });
  return [...new Set(errs)];
}
function showMsg(errs){
  const m=$('msg');
  if(!errs.length){m.classList.remove('show');return}
  m.innerHTML=`<b>Fix ${errs.length} issue${errs.length>1?'s':''} before generating:</b><br>`+errs.slice(0,6).map(esc).join('<br>')+(errs.length>6?`<br>…and ${errs.length-6} more.`:'');
  m.classList.add('show');
}

/* fixtures: circle method round robin */
function makeFixtures(){
  let ids=[0,1,2,3,4].sort(()=>Math.random()-.5);ids.push(null);
  const n=ids.length,rounds=[];
  for(let r=0;r<n-1;r++){
    const ms=[];let bye=null;
    for(let i=0;i<n/2;i++){
      const a=ids[i],b=ids[n-1-i];
      if(a===null||b===null)bye=a===null?b:a;else ms.push({a,b,sa:'',sb:''});
    }
    rounds.push({matches:ms,bye});
    ids=[ids[0],ids[n-1],...ids.slice(1,n-1)];
  }
  return rounds;
}
function generate(){
  const errs=validate();showMsg(errs);
  if(errs.length){document.querySelector('.bad')?.scrollIntoView({block:'center',behavior:'smooth'});return}
  S.fixtures=makeFixtures();save();renderOut();$('out').scrollIntoView({behavior:'smooth'});
}
$('gen').onclick=generate;
$('shuf').onclick=generate;

function standings(){
  const T=S.teams.map((t,i)=>({i,n:t.name.trim(),p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
  S.fixtures.forEach(r=>r.matches.forEach(m=>{
    if(m.sa===''||m.sb==='')return;
    const a=T[m.a],b=T[m.b],x=+m.sa,y=+m.sb;
    a.p++;b.p++;a.gf+=x;a.ga+=y;b.gf+=y;b.ga+=x;
    if(x>y){a.w++;b.l++;a.pts+=3}else if(y>x){b.w++;a.l++;b.pts+=3}else{a.d++;b.d++;a.pts++;b.pts++}
  }));
  return T.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf);
}
function renderTable(){
  $('table').innerHTML=`<tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>`+
   standings().map((t,k)=>`<tr><td>${k+1}</td><td><span style="color:${COL[t.i]}">●</span> ${esc(t.n)}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf-t.ga}</td><td><b>${t.pts}</b></td></tr>`).join('');
}
function renderOut(){
  const has=!!S.fixtures;
  $('out').hidden=!has;$('shuf').hidden=!has;$('gen').textContent=has?'Regenerate & clear scores':'Generate fixtures';
  if(!has)return;
  const nm=i=>esc(S.teams[i].name.trim()||'Team '+(i+1));
  $('rounds').innerHTML=S.fixtures.map((r,ri)=>`<div class="round"><h3>Round ${ri+1}</h3>`+
    r.matches.map((m,mi)=>`<div class="match"><span style="color:${COL[m.a]}">${nm(m.a)}</span>
      <input type="number" min="0" data-r="${ri}" data-m="${mi}" data-s="sa" value="${m.sa}" aria-label="${nm(m.a)} score">
      <em>VS</em>
      <input type="number" min="0" data-r="${ri}" data-m="${mi}" data-s="sb" value="${m.sb}" aria-label="${nm(m.b)} score">
      <span style="color:${COL[m.b]};text-align:left">${nm(m.b)}</span></div>`).join('')+
    (r.bye!==null?`<div class="bye">Rest this round: ${nm(r.bye)}</div>`:'')+`</div>`).join('');
  renderTable();
  $('roster').innerHTML=S.teams.map((t,i)=>`<div style="--c:${COL[i]}"><h3>${nm(i)}</h3>${t.players.map(p=>`<p><b>${esc(p.ign)}</b> · ${esc(p.name)}</p>`).join('')}</div>`).join('');
}
$('rounds').addEventListener('input',e=>{
  const d=e.target.dataset;if(!d.s)return;
  S.fixtures[+d.r].matches[+d.m][d.s]=e.target.value;save();renderTable();
});

/* tools */
$('reset').onclick=()=>{if(confirm('Clear all teams, players and fixtures?')){S=blank();save();showMsg([]);renderTeams()}};
$('demo').onclick=()=>{
  const names=['Night Owls','Pixel Storm','Red Phoenix','Cyber Wolves','Iron Titans'];
  const first=['Aarav','Vihaan','Ishaan','Kabir','Rohan','Meera','Anaya','Diya','Sara','Riya'];
  S.teams.forEach((t,i)=>{t.name=names[i];t.players.forEach((p,j)=>{p.name=first[(i*2+j)%10]+' '+'ABCDE'[j]+'.';p.ign=names[i].split(' ')[0]+'_'+(j+1)})});
  S.fixtures=null;save();showMsg([]);renderTeams();
};
route();