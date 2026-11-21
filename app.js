/* ---------- LOGIC ---------- */
const KEY='shubham_expense_breakdown_v2',DKEY='shubham_expense_custom_domains_v2',TKEY='shubham_expense_theme_v2';
const store={mem:{},get(k){try{return localStorage.getItem(k)}catch(e){return this.mem[k]??null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){this.mem[k]=v}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const pad=n=>String(n).padStart(2,'0');
const dim=(y,m)=>new Date(y,m,0).getDate();
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const BASE=['Transport','Personal & Friends','Food','Utilities & Study','Health & Grooming','Accessories'];
const PAL=['#6366f1','#f472b6','#f59e0b','#22d3ee','#34d399','#a78bfa','#fb7185','#84cc16','#38bdf8','#e879f9'];
const RULES=[
 ['Transport',['cng','petrol','diesel','bus','rapido','uber','ola','metro','car wash','bla bla','blabla','auto','fuel']],
 ['Accessories',['mobile cover','cover','charger','cable']],
 ['Health & Grooming',['medicine','haircut','biotin','doctor','salon']],
 ['Utilities & Study',['a4','photocopy','recharge','sheet','print','book','pen','notebook']],
 ['Personal & Friends',['russian night','happy','mukul','parshad','gift','party']],
 ['Food',['ladu','manchuriyan','momos','ghee','cold-drink','cold drink','bhal puri','chai','food','lunch','dinner','burger','pizza']]
];
function guess(n){n=String(n).toLowerCase();for(const[d,ks]of RULES)if(ks.some(k=>n.includes(k)))return d;return 'Other'}
function clean(n){return String(n).replace(/\s+/g,' ').replace(/^[\s\-–]+|[\s\-–]+$/g,'').replace(/\s-\s/g,' – ')}
function mk(ym,day,amt,name){const c=clean(name||'')||'Expense';return{id:uid(),date:ym+'-'+pad(day),amt:amt,name:c,domain:guess(c)}}
function parseNote(text,ym){
 const[y,m]=ym.split('-').map(Number),D=dim(y,m);let pool=null,day=null,items=[];
 for(const raw of String(text).split(/\r?\n/)){
  const l=raw.trim();if(!l)continue;
  const h=l.match(/^(\d{1,2})\s*\/\s*(\d{1,2})$/);
  if(h){day=(+h[2]===m&&+h[1]>=1&&+h[1]<=D)?+h[1]:null;continue}
  const it=l.match(/^(\d+)(?:\s+(.*))?$/);
  if(it&&day){items.push(mk(ym,day,+it[1],it[2]));continue}
  if(/^[-–]/.test(l)&&pool===null&&items.length===0&&day===null){const ns=l.match(/\d+/g);if(ns)pool=ns.reduce((a,b)=>a+ +b,0)}
 }
 return{pool,items};
}
const SEED=`- 12000 + 500 mummy
7/11
500 russian night
200 basan ladu 1 kg
8/11
250 car wash
9/11
100 cng
270 manchuriyan
40 A4 sheet
10/11
70 photocopy
500 cng
40 parshad
150 momos
1000 happy
370 Mukul
11/11
350 recharge
260 medicine 💊 ( biotin, vitamin c, vitamin d3 )
12/11
15 bus ticket
250 bla bla
20 bus ticket
13/11
500 cng
14/11
15 bus ticket
45 rapido
500 bla bla
10 bus
15/11
120 haircut
16/11
15 bus ticket
250 bla bla
10 bus ticket
17/11
50 top-up bus
250 bla bla - advance
38 rapido
10 bus ticket
25 - ghee -
18/11
10 bus ticket
100 parshad
25 bus ticket
125 bla bla
200 petrol
90 momos
200 mobile cover
20 cold-drink
30 bhal puri
19/11
250 bla bla
50 rapido
10 bus ticket
20/11
300 cng`;
function seed(){const p=parseNote(SEED,'2026-11');return{active:'2026-11',months:{'2026-11':{pool:p.pool,items:p.items}}}}
let S,custom=[],sel=null,selDom=null,q='',filt='all',lastDel=null,toastT;
function norm(){if(!Array.isArray(S.recurring))S.recurring=[]}
function load(){
 try{S=JSON.parse(store.get(KEY))}catch(e){S=null}
 if(!S||!S.months||!Object.keys(S.months).length)S=seed();
 if(!S.months[S.active])S.active=Object.keys(S.months).sort()[0];
 norm();
 try{custom=JSON.parse(store.get(DKEY)||'[]')}catch(e){custom=[]}
 if(!Array.isArray(custom))custom=[];
}
function allDomains(){const s=new Set([...BASE,...custom]);Object.values(S.months).forEach(M=>M.items.forEach(i=>i.domain&&s.add(i.domain)));return[...s]}
function dcolor(d){const b=BASE.indexOf(d);if(b>=0)return PAL[b];let h=0;for(const c of d)h=(h*31+c.charCodeAt(0))>>>0;return PAL[6+h%4]}
function M(){return S.months[S.active]}
function stats(){
 const[y,m]=S.active.split('-').map(Number),D=dim(y,m),by={},dom={};let spent=0;
 M().items.forEach(i=>{spent+=i.amt;(by[i.date]=by[i.date]||[]).push(i);dom[i.domain]=(dom[i.domain]||0)+i.amt});
 const now=new Date(),cur=now.getFullYear()===y&&now.getMonth()+1===m,today=now.getDate();
 let left=0;
 if(cur)left=D-today+(by[S.active+'-'+pad(today)]?0:1);else if(new Date(y,m-1,1)>now)left=D;
 left=Math.max(left,0);
 const pool=M().pool,rem=pool-spent;
 return{y,m,D,by,dom,spent,pool,rem,left,pace:left?Math.max(0,rem)/left:0,active:Object.keys(by).length,cur,today,
  dayTot:d=>(by[d]||[]).reduce((a,i)=>a+i.amt,0)};
}
function save(){store.set(KEY,JSON.stringify(S));store.set(DKEY,JSON.stringify(custom));const e=document.getElementById('saved');if(e)e.textContent='● Saved '+new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
function noteText(){const st=stats(),L=['- '+M().pool];Object.keys(st.by).sort().forEach(d=>{L.push('',(+d.slice(8))+'/'+(+d.slice(5,7)));st.by[d].forEach(i=>L.push(i.amt+' '+i.name))});return L.join('\n')}
function fmtDate(d){const dt=new Date(d+'T00:00:00');return WD[dt.getDay()]+', '+dt.getDate()+' '+MN[dt.getMonth()].slice(0,3)+' '+dt.getFullYear()}
/*--UI--*/
/* ---------- UI ---------- */
const $=s=>document.querySelector(s);
function arc(cx,cy,r0,r1,a0,a1){const p=(r,a)=>[(cx+r*Math.cos(a)).toFixed(2),(cy+r*Math.sin(a)).toFixed(2)],P0=p(r1,a0),P1=p(r1,a1),P2=p(r0,a1),P3=p(r0,a0),lg=a1-a0>Math.PI?1:0;return`M${P0}A${r1} ${r1} 0 ${lg} 1 ${P1}L${P2}A${r0} ${r0} 0 ${lg} 0 ${P3}Z`}
function donut(st){
 const ents=Object.entries(st.dom).sort((a,b)=>b[1]-a[1]);
 if(!ents.length)return'<div class="k"><div class="s">No expenses yet</div></div>';
 let a=-Math.PI/2,paths='';
 ents.forEach(([d,v])=>{
  const span=Math.min(v/st.spent*2*Math.PI,2*Math.PI-0.001),b=a+span,mid=(a+b)/2,on=selDom===d;
  const tf=on?`translate(${(Math.cos(mid)*8).toFixed(1)}px,${(Math.sin(mid)*8).toFixed(1)}px)`:'none';
  paths+=`<path class="wedge" d="${arc(110,110,58,92,a,b)}" fill="${dcolor(d)}" data-a="domain" data-d="${esc(d)}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${esc(d)} ${inr(v)}" style="transform:${tf};opacity:${selDom&&!on?.3:1};${on?`filter:drop-shadow(0 0 8px ${dcolor(d)});`:''}"/>`;
  a=b;
 });
 let c;
 if(selDom&&st.dom[selDom]){const nm=selDom.length>14?selDom.slice(0,13)+'…':selDom;
  c=`<text x="110" y="92" text-anchor="middle" font-size="9" fill="var(--mut)">SELECTED</text><text x="110" y="108" text-anchor="middle" font-size="11" font-weight="700" fill="var(--tx)">${esc(nm)}</text><text x="110" y="126" text-anchor="middle" font-size="14" font-weight="800" fill="var(--tx)">${inr(st.dom[selDom])}</text><text x="110" y="140" text-anchor="middle" font-size="9" fill="var(--mut)">${(st.dom[selDom]/st.spent*100).toFixed(1)}%</text>`}
 else c=`<text x="110" y="104" text-anchor="middle" font-size="9" fill="var(--mut)">TOTAL SPENT</text><text x="110" y="126" text-anchor="middle" font-size="17" font-weight="800" fill="var(--tx)">${inr(st.spent)}</text>`;
 const leg=ents.map(([d,v])=>`<button class="lr ${selDom===d?'on':selDom?'dim':''}" data-a="domain" data-d="${esc(d)}"><span class="dot" style="background:${dcolor(d)}"></span><span class="n">${esc(d)}</span><span class="num">${inr(v)} · ${(v/st.spent*100).toFixed(1)}%</span></button>`).join('');
 return`<div class="donutbox"><svg viewBox="0 0 220 220" width="210" height="210" style="overflow:visible;flex:none">${paths}${c}</svg><div class="leg">${leg}${selDom?'<button class="chip" data-a="cleardom" style="margin-top:6px">Clear selection</button>':''}</div></div>`;
}
function bars(st){
 const W=640,H=160,bw=W/st.D;let mx=1,peak=0;
 for(let d=1;d<=st.D;d++){const t=st.dayTot(S.active+'-'+pad(d));if(t>mx){mx=t;peak=d}}
 let s='';
 for(let d=1;d<=st.D;d++){const k=S.active+'-'+pad(d),t=st.dayTot(k),h=t?Math.max(4,t/mx*(H-18)):2;
  s+=`<rect data-a="pickday" data-d="${k}" x="${(d-1)*bw+1}" y="${H-h}" width="${bw-2}" height="${h}" rx="2" fill="${t?(sel===k?'#fbbf24':'var(--ac)'):'var(--bd)'}" style="cursor:pointer"/>`;
  if(d===1||d%5===0||d===st.D)s+=`<text x="${(d-1)*bw+bw/2}" y="${H+14}" text-anchor="middle" font-size="9" fill="var(--mut)">${d}</text>`}
 const pk=peak?`<div class="s" style="font-size:.75rem;color:var(--mut);margin-top:4px">Peak: ${peak} ${MN[st.m-1].slice(0,3)} — <b class="num">${inr(mx)}</b></div>`:'';
 return`<svg viewBox="0 0 ${W} ${H+18}" width="100%" role="img" aria-label="Daily spending">${s}</svg>${pk}`;
}
function calendar(st){
 const off=new Date(st.y,st.m-1,1).getDay();let c=WD.map(w=>`<div class="h">${w}</div>`).join('');
 for(let i=0;i<off;i++)c+='<div class="cd e"></div>';
 for(let d=1;d<=st.D;d++){
  const k=S.active+'-'+pad(d),t=st.dayTot(k);
  const dimmed=(filt==='spent'&&!t)||(filt==='zero'&&t);
  c+=`<button class="cd ${t?'has':''} ${sel===k?'sel':''} ${st.cur&&d===st.today?'today':''} ${dimmed?'dimmed':''}" data-a="pickday" data-d="${k}"><span class="d">${d}</span><span class="a num">${t?(t>=1000?'₹'+(t/1000).toFixed(1)+'k':'₹'+t):'&nbsp;'}</span></button>`}
 const z=st.D-st.active;
 return`<div class="chips"><button class="chip pill ${filt==='all'?'on':''}" data-a="filt" data-f="all">All Days</button><button class="chip pill ${filt==='spent'?'on':''}" data-a="filt" data-f="spent">Spent (${st.active})</button><button class="chip pill ${filt==='zero'?'on':''}" data-a="filt" data-f="zero">No-Spend (${z})</button></div><div class="cal">${c}</div>`;
}
function ledger(st){
 if(!sel){const days=Object.keys(st.by).sort();
  return`<p style="color:var(--mut);margin:0 0 8px">Select a day on the calendar to see its expenses.</p><div class="chips">${days.map(d=>`<button class="chip" data-a="pickday" data-d="${d}">${+d.slice(8)} ${MN[st.m-1].slice(0,3)} · ${inr(st.dayTot(d))}</button>`).join('')||'<span style="color:var(--mut)">No expenses logged this month.</span>'}</div>`}
 const its=st.by[sel]||[];
 return`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><div class="big num">${inr(st.dayTot(sel))}</div><div style="color:var(--mut);font-size:.8rem">${fmtDate(sel)}</div></div><div style="display:flex;gap:6px"><button class="sm" data-a="add" data-d="${sel}">+ Add</button><button class="sm" data-a="clearday">Clear day</button></div></div>`+
 (its.length?its.map(i=>`<div class="item"><span class="dot" style="background:${dcolor(i.domain)}"></span><div class="t"><b>${esc(i.name)}</b><span>${esc(i.domain)}</span></div><b class="num">${inr(i.amt)}</b><button class="sm" data-a="edit" data-id="${i.id}">Edit</button><button class="sm" data-a="del" data-id="${i.id}">Del</button></div>`).join(''):'<p style="color:var(--mut)">No expenses on this day.</p>');
}
function nameKey(n){return n.toLowerCase().split(' – ')[0].replace(/\s+/g,' ')}
function ddHTML(st){
 const ql=q.trim().toLowerCase();let its=M().items;
 if(selDom)its=its.filter(i=>i.domain===selDom);
 if(ql)its=its.filter(i=>i.name.toLowerCase().includes(ql)||i.domain.toLowerCase().includes(ql));
 if(!ql&&!selDom)return'<p style="color:var(--mut);margin:4px 0">Type an item (e.g. bla bla, cng, momos) or tap a chip/domain to see total spent and day-by-day split.</p>';
 if(!its.length)return'<p style="color:var(--mut)">No match.</p>';
 const tot=its.reduce((a,i)=>a+i.amt,0),byD={};its.forEach(i=>(byD[i.date]=byD[i.date]||[]).push(i));
 const label=(selDom?selDom:'')+(selDom&&ql?' + ':'')+(ql?'“'+esc(q.trim())+'”':'');
 return`<div class="big num">${inr(tot)}</div><div style="color:var(--mut);font-size:.8rem;margin-bottom:6px">${esc(label)} · ${Object.keys(byD).length} days · ${(tot/Math.max(st.spent,1)*100).toFixed(1)}% of spent</div>`+
 Object.keys(byD).sort().map(d=>`<div class="dd"><span>${+d.slice(8)} ${MN[st.m-1].slice(0,3)} · ${byD[d].map(i=>esc(i.name)).join(', ')}</span><b class="num">${inr(byD[d].reduce((a,i)=>a+i.amt,0))}</b></div>`).join('');
}
function qDate(st){return sel||(st.cur?S.active+'-'+pad(st.today):null)}
function freqItems(){const m={};M().items.slice().sort((a,b)=>a.date<b.date?-1:1).forEach(i=>{const k=nameKey(i.name),o=m[k]||(m[k]={c:0});o.c++;o.amt=i.amt;o.name=i.name.split(' – ')[0]});return Object.values(m).sort((a,b)=>b.c-a.c).slice(0,6)}
function weekStats(st){
 const end=st.cur?st.today:st.D,ym=S.active;
 const sum=(a,b)=>{let t=0;const dm={};for(let x=Math.max(1,a);x<=b;x++)(st.by[ym+'-'+pad(x)]||[]).forEach(i=>{t+=i.amt;dm[i.domain]=(dm[i.domain]||0)+i.amt});return{t,dm}};
 const w=sum(end-6,end),p=sum(end-13,end-7),top=Object.entries(w.dm).sort((a,b)=>b[1]-a[1])[0];
 return{end,first:Math.max(1,end-6),w:w.t,p:p.t,top,avg:w.t/Math.max(1,Math.min(7,end))}
}
function weekHTML(st){
 const k=weekStats(st),dl=k.p>0?((k.w-k.p)/k.p*100):null,mn=MN[st.m-1].slice(0,3);
 return`<div class="big num">${inr(k.w)}</div><div style="color:var(--mut);font-size:.8rem">${k.first}–${k.end} ${mn} · avg ${inr(k.avg)}/day</div>
 <div style="margin-top:8px;font-size:.85rem">${dl===null?'<span style="color:var(--mut)">No previous 7 days to compare</span>':`<b class="${dl>0?'bad':'ok'}">${dl>0?'▲':'▼'} ${Math.abs(dl).toFixed(0)}%</b> <span style="color:var(--mut)">vs previous 7 days (${inr(k.p)})</span>`}</div>
 <div style="margin-top:6px;font-size:.85rem">${k.top?'Top: <b>'+esc(k.top[0])+'</b> <span class="num">'+inr(k.top[1])+'</span>':'<span style="color:var(--mut)">No spend in this window</span>'}</div>`
}
function budgetsHTML(st){
 const B=M().budgets||{},ds=Object.keys(B).filter(x=>B[x]>0);
 if(!ds.length)return'<p style="color:var(--mut);margin:0 0 8px;font-size:.85rem">No budgets yet. Set a monthly limit per domain to get warnings before you overspend.</p>';
 return ds.sort((a,b)=>(st.dom[b]||0)/B[b]-(st.dom[a]||0)/B[a]).map(x=>{const sp=st.dom[x]||0,pc=sp/B[x]*100,c=pc>=100?'var(--bad)':pc>=80?'var(--warn)':'var(--ok)';
  return`<div class="bud"><div class="bh"><span>${esc(x)}</span><span class="num">${inr(sp)} / ${inr(B[x])}${pc>=100?' · over by '+inr(sp-B[x]):pc>=80?' · '+Math.round(pc)+'%':''}</span></div><div class="bt"><i style="width:${Math.min(100,pc)}%;background:${c}"></i></div></div>`}).join('')
}
function budModal(){
 const B=M().budgets||{};
 modal(`<h2>Budgets · ${MN[stats().m-1]}</h2><p style="color:var(--mut);font-size:.8rem;margin:4px 0">Monthly limit per domain. Leave blank for no limit. New months copy these.</p><form id="fbud">${allDomains().map(x=>`<label>${esc(x)} (₹)</label><input type="number" min="0" inputmode="numeric" data-d="${esc(x)}" value="${B[x]||''}">`).join('')}<div class="row"><button type="button" class="btn g" data-a="close">Cancel</button><button class="btn">Save</button></div></form>`)
}
function recurModal(){
 const L=S.recurring.map(r=>`<div class="item"><span class="dot" style="background:${dcolor(r.domain)}"></span><div class="t"><b>${esc(r.name)}</b><span>${esc(r.domain)} · day ${r.day}</span></div><b class="num">${inr(r.amt)}</b><button class="sm" data-a="rec-del" data-id="${r.id}">Del</button></div>`).join('')||'<p style="color:var(--mut);margin:4px 0;font-size:.85rem">None yet. Add things that repeat monthly (recharge, gym, subscriptions).</p>';
 modal(`<h2>Recurring expenses</h2>${L}<form id="frec"><label>Item</label><input name="name" required maxlength="60"><label>Amount (₹)</label><input type="number" name="amt" required min="1" inputmode="numeric"><label>Day of month (1-28)</label><input type="number" name="day" min="1" max="28" value="1" inputmode="numeric"><label>Domain</label><select name="domain">${allDomains().map(x=>`<option>${esc(x)}</option>`).join('')}</select><div class="row"><button type="button" class="btn g" data-a="close">Close</button><button class="btn">+ Add</button></div></form><div class="row"><button class="btn g" data-a="rec-apply">Apply to ${MN[stats().m-1]}</button></div>`)
}
function applyRecurring(){
 const st=stats();if(!st.cur&&new Date(st.y,st.m-1,1)>new Date())return 0;
 const have=new Set(M().items.map(i=>i.date+'|'+i.amt+'|'+i.name.toLowerCase()));let n=0;
 S.recurring.forEach(r=>{const day=Math.min(r.day,st.D);if(st.cur&&day>st.today)return;const k=S.active+'-'+pad(day),key=k+'|'+r.amt+'|'+r.name.toLowerCase();
  if(have.has(key))return;have.add(key);M().items.push({id:uid(),date:k,amt:r.amt,name:r.name,domain:r.domain});n++});
 return n
}
function render(){
 const st=stats();
 $('#mlabel').textContent=MN[st.m-1].slice(0,3)+' '+st.y;
 const rc=st.rem<0?'bad':'ok';
 const names={};M().items.forEach(i=>{const k=nameKey(i.name);names[k]=(names[k]||0)+i.amt});
 const top=Object.entries(names).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const qd=qDate(st),fr=freqItems(),tk=S.active+'-'+pad(st.today),tt=st.cur?st.dayTot(tk):0;
 $('#app').innerHTML=`
 <div class="card qa" id="sec-qa"><form id="fq" autocomplete="off"><input id="qa" name="qa" placeholder="Quick add: 250 bla bla" enterkeyhint="done" aria-label="Quick add expense"><button class="btn">Add</button></form>
  <div class="hint">${qd?'Adds to '+fmtDate(qd)+' · type amount then item':'Pick a day on the calendar to add'}</div>
  <div class="chips">${fr.map(o=>`<button class="chip fq" data-a="qfill" data-v="${esc(o.amt+' '+o.name)}">${esc(o.name)}<b class="num">${inr(o.amt)}</b></button>`).join('')}</div></div>
 <div class="grid kpis" id="sec-sum">
  <div class="card k"><div class="l">Total Pool</div><div class="v num">${inr(st.pool)}</div><div class="s"><button class="sm" data-a="pool">Edit pool</button></div></div>
  <div class="card k"><div class="l">Total Spent</div><div class="v num">${inr(st.spent)}</div><div class="s">${M().items.length} entries</div></div>
  <div class="card k"><div class="l">Remaining</div><div class="v num ${rc}">${inr(st.rem)}</div><div class="s">${st.left?'~'+inr(st.pace)+'/day · '+st.left+' days left':'—'}${st.cur?'<br>Today '+inr(tt)+(st.pace&&tt>st.pace?' <span class="warn">over pace</span>':''):''}</div></div>
  <div class="card k"><div class="l">Active Days</div><div class="v num">${st.active} / ${st.D}</div><div class="s">${st.D-st.active} no-spend</div></div>
 </div>
 <div class="grid two" id="sec-ch">
  <div class="card"><h3>Domain split</h3>${donut(st)}</div>
  <div class="card"><h3>Day by day</h3>${bars(st)}</div>
 </div>
 <div class="grid two" id="sec-wk">
  <div class="card"><h3>Last 7 days</h3>${weekHTML(st)}</div>
  <div class="card"><h3>Budgets <button class="sm" data-a="budgets" style="float:right;text-transform:none;letter-spacing:0">Set budgets</button></h3>${budgetsHTML(st)}</div>
 </div>
 <div class="grid two" id="sec-cal">
  <div class="card"><h3>Calendar · ${MN[st.m-1]} ${st.y}</h3>${calendar(st)}</div>
  <div class="card" id="sec-led"><h3>Day ledger</h3>${ledger(st)}</div>
 </div>
 <div class="grid"><div class="card"><h3>Item deep-dive</h3>
  <input id="q" type="search" placeholder="Search item or domain…" value="${esc(q)}" autocomplete="off">
  <div class="chips">${top.map(([k,v])=>`<button class="chip" data-a="qchip" data-k="${esc(k)}">${esc(k)} · ${inr(v)}</button>`).join('')}</div>
  <div id="ddres">${ddHTML(st)}</div></div></div>
 <div style="height:16px"></div>`;
}
function toast(msg,undo){const t=$('#toast');t.innerHTML=esc(msg)+(undo?'<button data-a="undo">Undo</button>':'');t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),undo?6000:2200)}
function modal(h){$('#sheet').innerHTML=h;$('#modal').classList.add('on')}
function closeModal(){$('#modal').classList.remove('on')}
function expForm(it,date){
 const st=stats(),doms=allDomains(),v=it||{date:date||(sel||S.active+'-'+pad(st.cur?st.today:1)),amt:'',name:'',domain:'Transport'};
 modal(`<h2>${it?'Edit':'Add'} expense</h2><form id="fexp" data-id="${it?it.id:''}">
 <label>Date</label><input type="date" name="date" required min="${S.active}-01" max="${S.active}-${pad(st.D)}" value="${v.date}">
 <label>Amount (₹)</label><input type="number" name="amt" required min="1" inputmode="numeric" value="${v.amt}">
 <label>Item</label><input name="name" required maxlength="80" value="${esc(v.name)}">
 <label>Domain</label><select name="domain" id="dsel">${doms.map(d=>`<option ${d===v.domain?'selected':''}>${esc(d)}</option>`).join('')}<option value="__c">+ Other / Custom…</option></select>
 <input name="cdom" id="cdom" placeholder="New domain name" maxlength="30" style="display:none;margin-top:8px">
 <div class="row"><button type="button" class="btn g" data-a="close">Cancel</button><button class="btn">Save</button></div></form>`);
}
function addMonthForm(){
 const ks=Object.keys(S.months).sort(),last=ks[ks.length-1].split('-').map(Number);let y=last[0],m=last[1]+1;if(m>12){m=1;y++}
 modal(`<h2>New month</h2><form id="fmon"><label>Month</label><input type="month" name="ym" required value="${y}-${pad(m)}"><label>Starting pool (₹)</label><input type="number" name="pool" min="0" inputmode="numeric" value="${M().pool}"><div class="row"><button type="button" class="btn g" data-a="close">Cancel</button><button class="btn">Create</button></div></form>`);
}
function allMonths(){
 const rows=Object.keys(S.months).sort().map(k=>{const[y,m]=k.split('-').map(Number),I=S.months[k].items,sp=I.reduce((a,i)=>a+i.amt,0),ad=new Set(I.map(i=>i.date)).size;
  return`<tr data-a="gomonth" data-k="${k}" style="cursor:pointer"><td>${MN[m-1].slice(0,3)} ${y}</td><td class="r num">${inr(S.months[k].pool)}</td><td class="r num">${inr(sp)}</td><td class="r num ${S.months[k].pool-sp<0?'bad':'ok'}">${inr(S.months[k].pool-sp)}</td><td class="r num">${ad}</td></tr>`}).join('');
 modal(`<h2>All months</h2><table><tr><th>Month</th><th class="r">Pool</th><th class="r">Spent</th><th class="r">Left</th><th class="r">Days</th></tr>${rows}</table><div class="row"><button class="btn g" data-a="close">Close</button></div>`);
}
function syncModal(){
 modal(`<h2>Keep Sync · ${MN[stats().m-1]}</h2><p style="color:var(--mut);font-size:.8rem;margin:4px 0">Paste your Keep note (pool line like <b>- 12000 + 500</b>, date headers like <b>18/11</b>, items like <b>250 bla bla</b>). The app can't read Keep by itself.</p>
 <textarea id="ta" placeholder="Paste note here…"></textarea>
 <div class="row"><button class="btn" data-a="imp-rep">Replace month</button><button class="btn g" data-a="imp-app">Append only</button></div>
 <div class="row"><button class="btn g" data-a="exp-note">Show note text</button><button class="btn g" data-a="copy-note">Copy note</button></div>
 <div class="row"><button class="btn g" data-a="exp-csv">Export CSV</button><button class="btn g" data-a="exp-json">Backup JSON</button></div>
 <label>Restore JSON backup</label><input type="file" id="jf" accept=".json,application/json">
 <div class="row"><button class="btn g" data-a="close">Close</button></div>`);
}
function buildPrint(){
 const st=stats(),doms=Object.entries(st.dom).sort((a,b)=>b[1]-a[1]);let rows='';
 for(let d=1;d<=st.D;d++){const k=S.active+'-'+pad(d),its=st.by[k]||[],dt=new Date(st.y,st.m-1,d);
  rows+=`<tr><td>${d} ${MN[st.m-1].slice(0,3)}</td><td>${WD[dt.getDay()]}</td><td>${its.length?its.map(i=>esc(i.name)+' ('+inr(i.amt)+')').join(', '):'<i>No spend</i>'}</td><td style="text-align:right">${its.length?inr(st.dayTot(k)):'—'}</td></tr>`}
 $('#print').innerHTML=`<h1>Expense Statement — ${MN[st.m-1]} ${st.y}</h1><div>Generated ${new Date().toLocaleDateString('en-IN')}</div>
 <h2>Summary</h2><table><tr><td>Starting pool</td><td>${inr(st.pool)}</td><td>Total spent</td><td>${inr(st.spent)}</td></tr><tr><td>Remaining</td><td>${inr(st.rem)}</td><td>Active / no-spend days</td><td>${st.active} / ${st.D-st.active}</td></tr></table>
 <h2>By domain</h2><table><tr><th>Domain</th><th>Amount</th><th>Share</th></tr>${doms.map(([d,v])=>`<tr><td>${esc(d)}</td><td>${inr(v)}</td><td>${(v/st.spent*100).toFixed(1)}%</td></tr>`).join('')}</table>
 <h2>Date by date</h2><table><tr><th>Date</th><th>Day</th><th>Expenses</th><th>Total</th></tr>${rows}</table>`;
}
function pdfSafe(s){return String(s).replace(/₹/g,'Rs.').replace(/[–—]/g,'-').replace(/[^\x20-\x7E]/g,'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
function wrapTxt(s,max){const w=String(s).split(' '),L=[];let c='';w.forEach(x=>{if((c+' '+x).trim().length>max&&c){L.push(c);c=x}else c=(c+' '+x).trim()});if(c)L.push(c);return L.length?L:['']}
function makePdf(st){
 const P=[];let ops='',y=800;
 const np=()=>{P.push(ops);ops='';y=800};
 const ln=h=>{if(y-h<45)np();y-=h};
 const T=(s,x,sz,b)=>{ops+='BT /F'+(b?2:1)+' '+sz+' Tf '+x+' '+y+' Td ('+pdfSafe(s)+') Tj ET\n'};
 const R=(s,xr,sz,b)=>{const t=pdfSafe(s).replace(/\\/g,'');T(s,Math.max(40,xr-t.length*sz*0.53),sz,b)};
 ln(22);T('Expense Statement - '+MN[st.m-1]+' '+st.y,40,18,1);
 ln(14);T('Generated '+new Date().toLocaleDateString('en-IN'),40,9);
 ln(26);T('Summary',40,12,1);
 [['Starting pool',inr(st.pool)],['Total spent',inr(st.spent)],['Remaining',inr(st.rem)],['Active / no-spend days',st.active+' / '+(st.D-st.active)]].forEach(r=>{ln(15);T(r[0],40,10);T(r[1],220,10,1)});
 ln(26);T('By domain',40,12,1);
 Object.entries(st.dom).sort((a,b)=>b[1]-a[1]).forEach(([d,v])=>{ln(15);T(d,40,10);R(inr(v),380,10);R((v/Math.max(st.spent,1)*100).toFixed(1)+'%',470,10)});
 ln(26);T('Date by date',40,12,1);
 ln(16);T('Date',40,9,1);T('Day',90,9,1);T('Expenses',130,9,1);R('Total',555,9,1);
 for(let d=1;d<=st.D;d++){
  const k=S.active+'-'+pad(d),its=st.by[k]||[],dt=new Date(st.y,st.m-1,d);
  const txt=its.length?its.map(i=>i.name+' ('+inr(i.amt)+')').join(', '):'No spend';
  const L=wrapTxt(pdfSafe(txt).replace(/\\\(/g,'(').replace(/\\\)/g,')'),72);
  L.forEach((l,j)=>{ln(j?11:15);if(j===0){T(d+' '+MN[st.m-1].slice(0,3),40,9);T(WD[dt.getDay()],90,9);if(its.length)R(inr(st.dayTot(k)),555,9,1)}T(l,130,9)});
 }
 np();
 let out='%PDF-1.4\n';const offs=[],n=P.length,kids=[];
 const obj=(i,b)=>{offs[i]=out.length;out+=i+' 0 obj\n'+b+'\nendobj\n'};
 for(let i=0;i<n;i++)kids.push((5+i*2)+' 0 R');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+n+' >>');
 obj(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 obj(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 P.forEach((c,i)=>{obj(5+i*2,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+(6+i*2)+' 0 R >>');obj(6+i*2,'<< /Length '+c.length+' >>\nstream\n'+c+'endstream')});
 const xr=out.length,N=5+n*2;
 out+='xref\n0 '+N+'\n0000000000 65535 f \n';for(let i=1;i<N;i++)out+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
 out+='trailer\n<< /Size '+N+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF';
 const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;
 return new Blob([u],{type:'application/pdf'});
}
function dl(name,txt,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function nav(dir){const ks=Object.keys(S.months).sort(),i=ks.indexOf(S.active)+dir;if(i>=0&&i<ks.length){S.active=ks[i];sel=null;selDom=null;q='';save();render()}}
let dip=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;$('#installBtn').style.display=''});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-a]');if(!t){if(e.target.id==='modal')closeModal();return}
 const a=t.dataset.a,st=stats();
 switch(a){
  case'prev':nav(-1);break;case'next':nav(1);break;
  case'newmonth':addMonthForm();break;case'all':allMonths();break;case'sync':syncModal();break;
  case'close':closeModal();break;
  case'theme':{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;store.set(TKEY,n);break}
  case'refresh':load();render();toast('Refreshed '+new Date().toLocaleTimeString('en-IN'));break;
  case'pdf':{try{dl('Expense_'+MN[st.m-1]+'_'+st.y+'.pdf',makePdf(st),'application/pdf');toast('PDF downloaded')}catch(x){buildPrint();window.print()}break}
  case'install':if(dip){dip.prompt();dip=null;t.style.display='none'}else toast('Chrome menu ⋮ → Add to Home screen');break;
  case'go':{const el=document.getElementById(t.dataset.t);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});break}
  case'add':expForm(null,t.dataset.d);break;
  case'edit':{const it=M().items.find(i=>i.id===t.dataset.id);if(it)expForm(it);break}
  case'del':{const i=M().items.findIndex(x=>x.id===t.dataset.id);if(i>=0){lastDel={ym:S.active,it:M().items[i]};M().items.splice(i,1);save();render();toast('Deleted',true)}break}
  case'undo':if(lastDel&&S.months[lastDel.ym]){S.months[lastDel.ym].items.push(lastDel.it);lastDel=null;save();render();$('#toast').classList.remove('on')}break;
  case'pickday':sel=sel===t.dataset.d?null:t.dataset.d;render();if(sel&&innerWidth<1024)document.getElementById('sec-led').scrollIntoView({behavior:'smooth',block:'nearest'});break;
  case'clearday':sel=null;render();break;
  case'filt':filt=t.dataset.f;render();break;
  case'domain':selDom=selDom===t.dataset.d?null:t.dataset.d;q='';render();break;
  case'cleardom':selDom=null;render();break;
  case'qchip':q=t.dataset.k;selDom=null;render();break;
  case'pool':{const v=prompt('Starting pool (₹) for this month',M().pool);if(v!==null&&!isNaN(+v)){M().pool=Math.max(0,Math.round(+v));save();render()}break}
  case'gomonth':S.active=t.dataset.k;sel=null;selDom=null;q='';save();closeModal();render();break;
  case'imp-rep':case'imp-app':{
   const p=parseNote($('#ta').value,S.active);if(!p.items.length&&p.pool===null){toast('Nothing recognised');break}
   if(a==='imp-rep'){M().items=p.items;if(p.pool!==null)M().pool=p.pool}
   else{const have=new Set(M().items.map(i=>i.date+'|'+i.amt+'|'+i.name.toLowerCase()));p.items.forEach(i=>{if(!have.has(i.date+'|'+i.amt+'|'+i.name.toLowerCase()))M().items.push(i)})}
   save();closeModal();render();toast('Imported '+p.items.length+' entries');break}
  case'exp-note':$('#ta').value=noteText();break;
  case'qfill':{const i=$('#qa');if(i){i.value=t.dataset.v;i.focus()}break}
  case'copy-note':{const tx=noteText();(navigator.clipboard?navigator.clipboard.writeText(tx):Promise.reject()).then(()=>toast('Note copied')).catch(()=>{const ta=$('#ta');ta.value=tx;ta.select();toast('Select and copy the text')});break}
  case'exp-csv':{const q=v=>{v=String(v);if(/^[=+\-@]/.test(v))v="'"+v;return'"'+v.replace(/"/g,'""')+'"'};const rows=['Date,Amount,Item,Domain',...M().items.slice().sort((a,b)=>a.date<b.date?-1:1).map(i=>[i.date,i.amt,q(i.name),q(i.domain)].join(','))];dl('Expense_'+S.active+'.csv','﻿'+rows.join('\n'),'text/csv');break}
  case'budgets':budModal();break;
  case'recur':recurModal();break;
  case'rec-del':S.recurring=S.recurring.filter(r=>r.id!==t.dataset.id);save();recurModal();break;
  case'rec-apply':{const n=applyRecurring();save();closeModal();render();toast(n?'Added '+n+' recurring':'Nothing new to add');break}
  case'exp-json':dl('expense-backup.json',JSON.stringify({S,custom}),'application/json');break;
 }
});
document.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('wedge')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}
 if(e.key==='Escape')closeModal();
});
document.addEventListener('input',e=>{
 if(e.target.id==='q'){q=e.target.value;selDom=null;$('#ddres').innerHTML=ddHTML(stats())}
});
document.addEventListener('change',e=>{
 if(e.target.id==='dsel'){$('#cdom').style.display=e.target.value==='__c'?'':'none'}
 if(e.target.id==='jf'&&e.target.files[0]){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o.S||!o.S.months)throw 0;S=o.S;norm();custom=o.custom||[];save();closeModal();render();toast('Backup restored')}catch(x){toast('Invalid backup file')}};r.readAsText(e.target.files[0])}
});
document.addEventListener('submit',e=>{
 e.preventDefault();const f=e.target,d=new FormData(f);
 if(f.id==='fq'){
  const st=stats(),dt=qDate(st),raw=String(d.get('qa')||'').trim(),m=raw.match(/^(\d+)(?:\s+(.+))?$/);
  if(!dt){toast('Pick a day on the calendar first');return}
  if(!m||+m[1]<1){toast('Type like: 250 bla bla');return}
  const name=clean(m[2]||'')||'Expense',prev=M().items.find(i=>nameKey(i.name)===nameKey(name));
  M().items.push({id:uid(),date:dt,amt:+m[1],name:name,domain:prev?prev.domain:guess(name)});
  save();render();toast('Added '+inr(+m[1])+' · '+name);const qi=$('#qa');if(qi)qi.focus();return;
 }
 if(f.id==='fbud'){const B={};f.querySelectorAll('input[data-d]').forEach(i=>{const v=Math.round(+i.value);if(v>0)B[i.dataset.d]=v});M().budgets=B;save();closeModal();render();toast('Budgets saved');return}
 if(f.id==='frec'){const nm=clean(d.get('name')||''),amt=Math.round(+d.get('amt')),day=Math.min(28,Math.max(1,Math.round(+d.get('day'))||1));if(!nm||!(amt>0))return;S.recurring.push({id:uid(),name:nm,amt:amt,day:day,domain:d.get('domain')});save();recurModal();return}
 if(f.id==='fexp'){
  let dom=d.get('domain');if(dom==='__c'){dom=clean(d.get('cdom')||'')||'Other';if(!allDomains().some(x=>x.toLowerCase()===dom.toLowerCase())){custom.push(dom)}else dom=allDomains().find(x=>x.toLowerCase()===dom.toLowerCase())}
  const rec={date:d.get('date'),amt:Math.max(1,Math.round(+d.get('amt'))),name:clean(d.get('name'))||'Expense',domain:dom};
  if(!rec.date.startsWith(S.active)){toast('Date must be in '+S.active);return}
  const id=f.dataset.id;
  if(id){Object.assign(M().items.find(i=>i.id===id),rec)}else M().items.push({id:uid(),...rec});
  sel=rec.date;save();closeModal();render();toast('Saved');
 }
 if(f.id==='fmon'){
  const ym=d.get('ym');if(!/^\d{4}-\d{2}$/.test(ym))return;
  if(!S.months[ym])S.months[ym]={pool:Math.max(0,Math.round(+d.get('pool')||0)),items:[],budgets:Object.assign({},M().budgets||{})};
  S.active=ym;sel=null;selDom=null;q='';save();closeModal();render();
 }
});
window.addEventListener('storage',e=>{if(e.key===KEY){load();render()}});
(function init(){
 const th=store.get(TKEY);if(th)document.documentElement.dataset.theme=th;
 load();save();render();
 if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
