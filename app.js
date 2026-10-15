/* Daily Report - app logic (plain JavaScript) */

const F=[
{k:'project',l:'Project',t:'c'},{k:'date',l:'Date',t:'d'},{k:'site',l:'Site',t:'c'},{k:'shift',l:'Shift',t:'c'},{k:'line',l:'Line',t:'s'},
{k:'department',l:'Department',t:'c',o:['MLB','FATP']},{k:'station',l:'Station',t:'s'},{k:'fixtureSN',l:'Fixture SN',t:'s'},
{k:'issue',l:'Issue description',t:'a'},{k:'rootCause',l:'Root cause analysis',t:'a'},{k:'corrective',l:'Corrective actions',t:'a'},{k:'name',l:'Name',t:'s'},
{k:'priority',l:'Priority',t:'c',o:['high','mid','low']},{k:'status',l:'Status',t:'c',o:['OPEN','CLOSE','PENDING']},
{k:'spareUsed',l:'Spare used Y/N',t:'c',o:['N','Y']},{k:'spareName',l:'Spare name',t:'x'},{k:'spareQty',l:'Spare qty',t:'n'}];
const REQ=['project','date','shift','department','issue','name'];
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const el=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k==='class')e.className=a[k];else if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}c.flat().forEach(x=>e.append(x&&x.nodeType?x:document.createTextNode(x==null?'':x)));return e};
const S={me:null,custom:[],lists:{},reports:[],users:[],view:'new',editId:null,v:{},q:'',fs:'',fp:'',armed:false};
const app=document.getElementById('app');
function toast(m){const t=el('div',{class:'toast'},m);document.body.append(t);setTimeout(()=>t.remove(),2200)}
/* ===== Shared online storage (Google Sheet via Apps Script) ===== */
async function initDB(){}
async function api(p,m='GET',b={}){
  if(typeof API_URL==='undefined'||!API_URL||API_URL.indexOf('PASTE')===0)throw new Error('Not connected: set the web app URL in config.js');
  document.body.style.cursor='progress';
  try{
    const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({token:localStorage.getItem('drToken')||'',path:p,method:m,body:b||{}})});
    const j=await r.json();if(j.error)throw new Error(j.error);
    if(p==='login')localStorage.setItem('drToken',j.data.token);
    if(p==='logout')localStorage.removeItem('drToken');
    return j.data
  }finally{document.body.style.cursor=''}}
function reportRows(){return S.reports.map(r=>({Project:r.project,Date:r.date,Site:r.site,Shift:r.shift,Line:r.line,Department:r.department,Station:r.station,'Fixture SN':r.fixtureSN,'Issue Description':r.issue,'Root Cause Analysis':r.rootCause,'Corrective Actions':r.corrective,Name:r.name,Priority:r.priority,Status:r.status,'Spare Used':r.spareUsed,'Spare Name':r.spareName,'Spare Qty':r.spareQty,'Submitted By':r.createdBy,...Object.fromEntries(S.custom.map(c=>[c.label,r[c.key]||'']))}))}
function saveFile(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.append(a);a.click();a.remove()}
function exportXlsx(){const rows=reportRows();if(!rows.length)return toast('Nothing to export');
  if(window.XLSX){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'Reports');XLSX.writeFile(wb,'daily-report-'+today()+'.xlsx')}
  else{const h=Object.keys(rows[0]),q=v=>'"'+String(v).replace(/"/g,'""')+'"';saveFile('daily-report-'+today()+'.csv','\ufeff'+[h.map(q).join(',')].concat(rows.map(r=>h.map(k=>q(r[k])).join(','))).join('\r\n'),'text/csv')}}
function fresh(){S.v={date:today(),spareUsed:'N',spareQty:0,status:'OPEN',name:S.me?S.me.name:''}}
const opts=f=>S.lists[f.k]||f.o||[];
function form(){
  const wrap=el('div',{class:'card'});
  F.forEach(f=>{
    wrap.append(el('label',{class:'l'},f.l+(REQ.includes(f.k)?' *':'')));
    if(f.t==='c'){const g=el('div',{class:'ch'});opts(f).forEach(o=>g.append(el('button',{type:'button',class:S.v[f.k]===o?'on':'',onclick:()=>{S.v[f.k]=o;g.querySelectorAll('button').forEach(b=>b.className=b.textContent===o?'on':'')}},o)));wrap.append(g)}
    else if(f.t==='a'){const ta=el('textarea',{oninput:e=>S.v[f.k]=e.target.value});const ol=S.lists[f.k]||[];
      if(ol.length)wrap.append(el('select',{style:'margin-bottom:6px',onchange:e=>{if(e.target.value){S.v[f.k]=e.target.value;ta.value=e.target.value;e.target.value=''}}},el('option',{value:''},'Pick from list…'),...ol.map(o=>el('option',{value:o},o))));
      ta.value=S.v[f.k]||'';wrap.append(ta)}
    else{const i=el('input',{type:f.t==='d'?'date':f.t==='n'?'number':'text',oninput:e=>S.v[f.k]=f.t==='n'?Number(e.target.value):e.target.value});
      if(f.t==='s'){i.setAttribute('list','dl-'+f.k);const dl=el('datalist',{id:'dl-'+f.k});(S.lists[f.k]||[]).forEach(o=>dl.append(el('option',{value:o})));wrap.append(dl)}
      i.value=S.v[f.k]??'';wrap.append(i)}
  });
  S.custom.forEach(c=>{wrap.append(el('label',{class:'l'},c.label));const s=el('select',{onchange:e=>S.v[c.key]=e.target.value},el('option',{value:''},'Select…'),...c.options.map(o=>el('option',{value:o},o)));s.value=S.v[c.key]||'';wrap.append(s)});
  const bar=el('div',{class:'row',style:'margin-top:16px'});
  bar.append(el('button',{class:'p',onclick:save},S.editId?'Update report':'Submit report'));
  if(S.editId)bar.append(el('button',{onclick:()=>{S.editId=null;fresh();go('adm')}},'Cancel'));
  wrap.append(bar);return wrap}
async function save(){
  const miss=REQ.filter(k=>!S.v[k]);if(miss.length)return toast('Fill: '+miss.map(k=>F.find(f=>f.k===k).l).join(', '));
  try{const was=S.editId;await (was?api('reports/'+was,'PUT',S.v):api('reports','POST',S.v));toast(was?'Updated':'Report submitted');S.editId=null;fresh();if(was){await load();go('adm')}else render()}catch(e){toast(e.message)}}
const filtered=()=>{const q=S.q.toLowerCase();return S.reports.filter(r=>(!S.fs||r.status===S.fs)&&(!S.fp||r.project===S.fp)&&(!q||JSON.stringify(r).toLowerCase().includes(q)))};
async function load(){if(S.me&&S.me.role==='admin'){[S.reports,S.users]=await Promise.all([api('reports'),api('users')])}}
function admin(){
  const w=el('div');if(!S.me||S.me.role!=='admin')return el('div',{class:'msg err'},'Admins only.');
  const R=S.reports,cnt=s=>R.filter(r=>r.status===s).length;
  w.append(el('div',{class:'stats'},...[['Total',R.length],['Open',cnt('OPEN')],['Pending',cnt('PENDING')],['Closed',cnt('CLOSE')],['High priority open',R.filter(r=>r.priority==='high'&&r.status!=='CLOSE').length]].map(([l,n])=>el('div',{class:'stat'},el('b',{},n),el('span',{},l)))));
  const sel=(o,val,ph,fn)=>{const s=el('select',{onchange:e=>fn(e.target.value)},el('option',{value:''},ph),...o.map(x=>el('option',{value:x},x)));s.value=val;return s};
  w.append(el('div',{class:'row'},el('input',{placeholder:'Search…',value:S.q,oninput:e=>{S.q=e.target.value;renderTable()}}),sel(['OPEN','PENDING','CLOSE'],S.fs,'All status',v=>{S.fs=v;renderTable()}),sel(opts({k:'project'}),S.fp,'All projects',v=>{S.fp=v;renderTable()})),
    el('div',{class:'row'},el('button',{class:'p',onclick:()=>{S.editId=null;fresh();go('new')}},'+ Add report'),el('button',{onclick:exportXlsx},'Export Excel'),
    el('button',{class:'d',onclick:async()=>{if(!S.armed){S.armed=true;render();setTimeout(()=>{S.armed=false;if(S.view==='adm')render()},4000);return}S.armed=false;await api('reports','DELETE');await load();toast('All deleted');render()}},S.armed?'Tap again to DELETE ALL':'Delete all')),
    el('div',{class:'tw card',id:'tbl'}));
  const lc=el('details',{class:'card',open:''},el('summary',{},'Dropdown lists (admin only)'),el('p',{class:'msg'},'One item per line.'));const tas={};
  [['project','Project'],['site','Site'],['shift','Shift'],['line','Line'],['station','Station'],['fixtureSN','Fixture SN'],['name','Name'],['issue','Issue description'],['rootCause','Root cause analysis'],['corrective','Corrective actions']].forEach(([k,l])=>{lc.append(el('label',{class:'l'},l));tas[k]=el('textarea');tas[k].value=(S.lists[k]||[]).join('\n');lc.append(tas[k])});
  lc.append(el('button',{class:'p',style:'margin-top:10px',onclick:async()=>{const o={};for(const k in tas)o[k]=tas[k].value.split('\n');try{await api('lists','PUT',o);S.lists=await api('lists');toast('Lists saved')}catch(e){toast(e.message)}}},'Save lists'));
  const ac=el('details',{class:'card'},el('summary',{},'Team accounts (login)'));
  S.users.forEach(a=>ac.append(el('div',{class:'row'},el('span',{},a.u+' - '+a.name+' ('+a.role+')'),el('button',{class:'d',onclick:async e=>{const b=e.target;if(b.dataset.a!=='1'){b.dataset.a='1';b.textContent='Sure?';return}try{await api('users/'+a.u,'DELETE');await load();render()}catch(x){toast(x.message)}}},'Delete'))));
  const nu=el('input',{placeholder:'Username',autocapitalize:'none'}),nn=el('input',{placeholder:'Display name'}),np=el('input',{type:'password',placeholder:'Password (min 6)'}),nr=el('select',{},el('option',{value:'member'},'Team member'),el('option',{value:'admin'},'Admin'));
  const gap=()=>el('div',{style:'height:6px'});
  ac.append(el('label',{class:'l'},'Add / reset account'),nu,gap(),nn,gap(),np,gap(),nr,el('button',{class:'p',style:'margin-top:10px',onclick:async()=>{try{await api('users','POST',{username:nu.value,name:nn.value,password:np.value,role:nr.value});toast('Account saved');await load();render()}catch(e){toast(e.message)}}},'Save account'));
  const cx=el('details',{class:'card',open:''},el('summary',{},'Extra dropdown fields (add your own)'),el('p',{class:'msg'},'Each one appears as a new dropdown in the report form. Options: one per line.'));
  const rowsEl=el('div'),rows=[];
  const addRow=c=>{const r={key:c.key||'',l:el('input',{placeholder:'Field name (e.g. Machine type)',value:c.label||''}),o:el('textarea',{placeholder:'One option per line'})};r.o.value=(c.options||[]).join('\n');
    r.box=el('div',{class:'card'},r.l,el('div',{style:'height:6px'}),r.o,el('button',{class:'d',style:'margin-top:8px',onclick:e=>{const b=e.target;if(b.dataset.a!=='1'){b.dataset.a='1';b.textContent='Sure? Tap again to remove';return}rows.splice(rows.indexOf(r),1);r.box.remove()}},'Remove this dropdown'));rows.push(r);rowsEl.append(r.box)};
  S.custom.forEach(addRow);
  cx.append(rowsEl,el('div',{class:'row'},el('button',{onclick:()=>addRow({})},'+ Add dropdown'),el('button',{class:'p',onclick:async()=>{try{S.custom=await api('custom','PUT',rows.map(r=>({key:r.key,label:r.l.value,options:r.o.value.split('\n')})));toast('Saved');render()}catch(e){toast(e.message)}}},'Save dropdowns')));
  w.append(ac,cx,lc);setTimeout(renderTable);return w}
function renderTable(){
  const box=document.getElementById('tbl');if(!box)return;box.textContent='';const rows=filtered();if(!rows.length){box.append(el('div',{class:'msg'},'No reports yet.'));return}
  const cols=[['date','Date'],['project','Project'],['shift','Shift'],['line','Line'],['department','Dept'],['station','Station'],['fixtureSN','Fixture SN'],['issue','Issue'],['rootCause','Root cause'],['corrective','Corrective'],['name','Name'],['priority','Priority'],['status','Status'],['spare','Spare'],...S.custom.map(c=>[c.key,c.label])];
  const t=el('table',{},el('thead',{},el('tr',{},...cols.map(c=>el('th',{},c[1])),el('th',{},''))));const tb=el('tbody');
  rows.forEach(r=>tb.append(el('tr',{},...cols.map(([k])=>el('td',{},k==='spare'?(r.spareUsed==='Y'?(r.spareName||'')+' ×'+(r.spareQty||0):'—'):(k==='priority'||k==='status')?el('span',{class:'tag'},r[k]||''):r[k]||'')),
    el('td',{style:'white-space:nowrap'},el('button',{onclick:()=>{S.editId=r.id;S.v={...r};go('new')}},'Edit'),' ',el('button',{class:'d',onclick:async e=>{const b=e.target;if(b.dataset.a!=='1'){b.dataset.a='1';b.textContent='Sure?';return}try{await api('reports/'+r.id,'DELETE');await load();renderTable()}catch(x){toast(x.message)}}},'Del')))));
  t.append(tb);box.append(t)}
function loginView(){
  const u=el('input',{placeholder:'Username',autocapitalize:'none'}),p=el('input',{type:'password',placeholder:'Password'});
  const go2=async()=>{try{S.me=await api('login','POST',{username:u.value,password:p.value});S.lists=await api('lists');S.custom=await api('custom');await load();S.view='new';fresh();render()}catch(e){toast(e.message)}};
  p.onkeydown=e=>{if(e.key==='Enter')go2()};
  return el('div',{class:'card'},el('b',{},'Log in'),el('label',{class:'l'},'Username'),u,el('label',{class:'l'},'Password'),p,el('button',{class:'p',style:'margin-top:12px',onclick:go2},'Log in'))}
function go(v){S.view=v;render()}
function render(){
  const m=S.me,ad=m&&m.role==='admin';
  document.getElementById('tNew').className=S.view==='new'?'on':'';document.getElementById('tAdm').className=S.view==='adm'?'on':'';
  document.getElementById('tAdm').style.display=ad?'':'none';document.getElementById('tOut').style.display=m?'':'none';document.getElementById('tNew').style.display=m?'':'none';
  app.textContent='';app.append(!m?loginView():S.view==='new'?form():admin())}
document.getElementById('tNew').onclick=()=>{if(S.view!=='new'){S.editId=null;fresh()}go('new')};
document.getElementById('tAdm').onclick=async()=>{await load();go('adm')};
document.getElementById('tOut').onclick=async()=>{await api('logout','POST');S.me=null;render()};
(async()=>{await initDB();try{S.me=await api('me');S.lists=await api('lists');S.custom=await api('custom');await load();fresh()}catch(e){}render()})();
