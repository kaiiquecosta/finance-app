/* goals.view.js — Metas financeiras */

// ── GOALS ──
function renderGoals(){
  const list=document.getElementById('goals-list');list.innerHTML='';
  if(!goals.length){list.innerHTML='<div style="color:var(--muted);text-align:center;padding:40px">Nenhuma meta ainda. Crie sua primeira!</div>';return;}
  goals.forEach(g=>{
    const pct=Math.min((g.saved/g.target)*100,100);
    const rem=g.target-g.saved;
    const d=document.createElement('div');d.className='card fadein';d.style.marginBottom='12px';
    d.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:13px;background:${g.clr}18;border:1px solid ${g.clr}30;display:flex;align-items:center;justify-content:center;font-size:20px">${g.ico}</div>
          <div>
            <div style="color:#fff;font-size:15px;font-weight:700;font-family:var(--num)">${g.name}</div>
            <div style="color:var(--muted);font-size:12px">até ${g.dl}</div>
          </div>
        </div>
        <div style="color:${g.clr};font-size:24px;font-weight:800;font-family:var(--num)">${Math.round(pct)}%</div>
      </div>
      <div class="prog" style="height:8px;margin-bottom:10px">
        <div class="prog-fill" style="width:${pct}%;background:linear-gradient(90deg,${g.clr}88,${g.clr})"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="color:${g.clr};font-family:var(--num);font-weight:700">${fmt(g.saved)}</span>
          <span style="color:var(--muted);font-size:13px"> de ${fmt(g.target)}</span>
          ${rem>0?`<div style="color:var(--muted);font-size:12px;margin-top:2px">Faltam ${fmt(rem)}</div>`:''}
        </div>
        ${pct<100
          ?`<div style="display:flex;gap:8px">
              <button onclick="openDep(${g.id},'add')" style="background:${g.clr}18;border:1px solid ${g.clr}40;border-radius:8px;padding:8px 16px;color:${g.clr};font-size:12px;font-weight:600;cursor:pointer">⬆ Depositar</button>
              ${g.saved>0?`<button onclick="openDep(${g.id},'rem')" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:8px 14px;color:#f87171;font-size:12px;font-weight:600;cursor:pointer">⬇ Retirar</button>`:''}
            </div>`
          :`<span class="badge badge-green">✓ Concluída!</span>`}
      </div>`;
    list.appendChild(d);
  });
}


// ── GOALS CRUD ──
function addGoal(){
  const name=document.getElementById('g-name').value.trim();
  const tgt=parseMaskedAmt(document.getElementById('g-tgt').value);
  if(!name||!tgt)return;
  const month=document.getElementById('g-dl-month').value;
  const year=document.getElementById('g-dl-year').value;
  const monthNames=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const dl=month&&year ? monthNames[parseInt(month)-1]+' '+year : '';
  goals.push({id:Date.now(),name,target:tgt,saved:0,ico:document.getElementById('g-ico').value||'🎯',clr:'#22c55e',dl});
  renderGoals();closeM('m-goal');
  ['g-name','g-tgt'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('g-ico').value='🎯';
  document.getElementById('g-dl-month').value='';
  document.getElementById('g-dl-year').value='';
  autosave();
}
let _depMode = 'add';
let _depAccountId = null;

function fmtForInput(val){
  if(!val && val!==0) return '';
  const n = parseFloat(val);
  if(!n && n!==0) return '';
  // Formata como "3.000,00"
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return intFmt+','+dec;
}

function maskMoneyBR(inp){
  // Estilo bancário: últimos 2 dígitos = centavos
  // 1 → 0,01 | 19 → 0,19 | 199 → 1,99 | 1990 → 19,90 | 19900 → 199,00
  const digits = inp.value.replace(/\D/g,'');
  if(!digits){ inp.value=''; return; }
  const num = parseInt(digits, 10);
  const reais = Math.floor(num / 100);
  const cents = num % 100;
  const reaisFmt = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  inp.value = reaisFmt + ',' + String(cents).padStart(2,'0');
}

function maskMoney(inp){
  const pos = inp.selectionStart;
  const oldVal = inp.value;
  const raw = oldVal.replace(/[^\d,]/g,'');

  let intPart, decPart;
  const commaIdx = raw.indexOf(',');
  if(commaIdx >= 0){
    intPart = raw.slice(0, commaIdx).replace(/\D/g,'');
    decPart = raw.slice(commaIdx+1).replace(/\D/g,'').slice(0,2);
  } else {
    intPart = raw.replace(/\D/g,'');
    decPart = null;
  }

  intPart = intPart.replace(/^0+(\d)/, '$1') || (intPart.length ? '0' : '');
  if(!intPart && decPart === null){ inp.value = ''; return; }

  const intFmt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g,'.') : '0';
  const newVal = decPart !== null ? intFmt+','+decPart : intFmt;

  if(newVal === oldVal) return;
  inp.value = newVal;
  const diff = newVal.length - oldVal.length;
  inp.setSelectionRange(Math.max(0, pos+diff), Math.max(0, pos+diff));
}

function maskDepAmt(inp){ maskMoney(inp); }

function parseMaskedAmt(val){
  if(!val) return 0;
  const s = String(val).trim();
  // Com vírgula: formato BR "3.000,50" ou "3000,50"
  if(s.includes(','))
    return parseFloat(s.replace(/\./g,'').replace(',','.')) || 0;
  // Sem vírgula: ponto é separador de milhar "3.000" → 3000
  if(s.includes('.') && s.indexOf('.')===s.lastIndexOf('.') && s.length-s.indexOf('.')===4)
    return parseFloat(s.replace(/\./g,'')) || 0;
  return parseFloat(s.replace(/\./g,'')) || 0;
}

function renderDepAccountChips(){
  const el = document.getElementById('dep-account-chips');
  if(!el) return;
  el.innerHTML='';
  if(!bankAccounts.length){
    el.innerHTML='<div style="color:var(--muted);font-size:12px">Nenhuma conta cadastrada.</div>';
    return;
  }
  bankAccounts.forEach(acc=>{
    const sid = String(acc.id);
    const active = String(_depAccountId)===sid;
    const chip=document.createElement('button');
    chip.style.cssText=`display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${active?acc.clr+'28':chipInactiveBg()};border:1px solid ${active?acc.clr+'70':chipInactiveBorder()};color:${active?acc.clr:chipInactiveColor()}`;
    chip.innerHTML=`<span style="width:7px;height:7px;border-radius:50%;background:${acc.clr};display:inline-block"></span>${acc.name}`;
    chip.onclick=()=>{ _depAccountId=sid; renderDepAccountChips(); };
    el.appendChild(chip);
  });
}

function setDepTab(mode){
  _depMode = mode;
  const isAdd = mode==='add';
  const ta = document.getElementById('dep-tab-add');
  const tr = document.getElementById('dep-tab-rem');
  if(ta){ ta.style.background=isAdd?'var(--green)':'transparent'; ta.style.color=isAdd?'#000':'var(--muted)'; ta.style.border='none'; }
  if(tr){ tr.style.background=isAdd?'transparent':'rgba(239,68,68,0.15)'; tr.style.color=isAdd?'var(--muted)':'#f87171'; tr.style.border=isAdd?'none':'1px solid rgba(239,68,68,0.3)'; tr.style.borderRadius='7px'; }
  const g = goals.find(g=>g.id===depId);
  const lbl = document.getElementById('dep-account-label');
  if(!g) return;
  const btn = document.getElementById('dep-confirm-btn');
  if(isAdd){
    document.getElementById('dep-msg').innerHTML='Faltam <b style="color:#fff">'+fmt(g.target-g.saved)+'</b> para completar';
    if(btn){ btn.textContent='Depositar'; btn.style.background='var(--green)'; btn.style.color='#000'; }
    if(lbl) lbl.textContent='De qual conta sai o dinheiro?';
  } else {
    document.getElementById('dep-msg').innerHTML='Saldo guardado: <b style="color:#fff">'+fmt(g.saved)+'</b>';
    if(btn){ btn.textContent='Retirar'; btn.style.background='rgba(239,68,68,0.15)'; btn.style.color='#f87171'; }
    if(lbl) lbl.textContent='Para qual conta vai o dinheiro?';
  }
  document.getElementById('dep-amt').value='';
  _depAccountId = bankAccounts.length ? String(bankAccounts[0].id) : '__geral__';
  renderDepAccountChips();
}
function openDep(id, mode='add'){
  depId=id;
  const g=goals.find(g=>g.id===id);if(!g)return;
  document.getElementById('dep-ttl').textContent='"'+g.name+'"';
  document.getElementById('dep-amt').value='';
  _depAccountId = bankAccounts.length ? String(bankAccounts[0].id) : '__geral__';
  openM('m-dep');
  setDepTab(mode);
}
function doDeposit(){
  const amt=parseMaskedAmt(document.getElementById('dep-amt').value);
  if(!amt||amt<=0)return;
  const g=goals.find(g=>g.id===depId);if(!g)return;
  const date = new Date().toISOString().split('T')[0];
  const accId = _depAccountId && _depAccountId!=='__geral__' ? String(_depAccountId) : null;
  if(_depMode==='add'){
    g.saved=Math.min(g.saved+amt,g.target);
    const tx = {id:Date.now(), name:'🎯 Meta: '+g.name, cat:'outros', amt:-amt, date, isnew:true};
    if(accId) tx.accountId = accId;
    txs.unshift(tx);
  } else {
    g.saved=Math.max(0, g.saved-amt);
    const tx = {id:Date.now(), name:'🎯 Retirada meta: '+g.name, cat:'receita', amt:amt, date, isnew:true};
    if(accId) tx.accountId = accId;
    txs.unshift(tx);
  }
  autosave();
  renderGoals();
  try{ renderOverview(); }catch(e){}
  if(currentPage.v==='transactions') renderTxPage();
  closeM('m-dep');
}


