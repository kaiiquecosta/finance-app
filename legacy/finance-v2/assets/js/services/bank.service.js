/* bank.service.js — Contas bancárias CRUD */

// ── CONTAS BANCÁRIAS ──
// ══════════════════════════════════════
const BANK_PRESETS = [
  {name:'Nubank',          clr:'#8b5cf6'},{name:'Itaú',        clr:'#f59e0b'},
  {name:'Bradesco',        clr:'#ef4444'},{name:'Santander',   clr:'#dc2626'},
  {name:'Caixa',           clr:'#3b82f6'},{name:'Banco do Brasil', clr:'#eab308'},
  {name:'Inter',           clr:'#f97316'},{name:'C6 Bank',     clr:'#6b7280'},
  {name:'Sofisa',          clr:'#22c55e'},{name:'BTG',         clr:'#1d4ed8'},
  {name:'XP',              clr:'#374151'},{name:'Rico',        clr:'#60a5fa'},
  {name:'PicPay',          clr:'#10b981'},{name:'Neon',        clr:'#06b6d4'},
  {name:'Mercado Pago',    clr:'#3b82f6'},{name:'Avenue',      clr:'#0ea5e9'},
];
const BANK_COLORS = ['#8b5cf6','#22c55e','#3b82f6','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316','#64748b','#10b981'];

let selectedBankColor = '#8b5cf6';
let selectedBankType  = 'corrente';
let selectedAccountId = null;

function setBankType(t){
  selectedBankType = t;
  ['corrente','poupança','investimento'].forEach(x=>{
    const b = document.getElementById('bktype-'+x);
    if(b) b.classList.toggle('active-freq', x===t);
  });
}

function initBankModal(){
  selectedBankColor = BANK_COLORS[0];
  selectedBankType  = 'corrente';
  document.getElementById('bank-name').value    = '';
  document.getElementById('bank-balance').value = '';
  setBankType('corrente');

  // Presets de bancos
  const presetsEl = document.getElementById('bank-presets');
  if(presetsEl){
    presetsEl.innerHTML = '';
    BANK_PRESETS.forEach(p => {
      const chip = document.createElement('button');
      chip.style.cssText = `background:${p.clr}18;border:1px solid ${p.clr}35;border-radius:8px;padding:5px 11px;color:${p.clr};font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s`;
      chip.textContent = p.name;
      chip.onclick = () => { document.getElementById('bank-name').value = p.name; selectBankColor(p.clr); };
      presetsEl.appendChild(chip);
    });
  }

  // Paleta de cores
  const colorEl = document.getElementById('bank-color-chips');
  if(colorEl){
    colorEl.innerHTML = '';
    BANK_COLORS.forEach(clr => {
      const dot = document.createElement('div');
      const isActive = clr === selectedBankColor;
      dot.style.cssText = `width:28px;height:28px;border-radius:50%;background:${clr};cursor:pointer;border:3px solid ${isActive?'#fff':'transparent'};transition:all .15s;box-sizing:border-box`;
      dot.onclick = () => selectBankColor(clr);
      colorEl.appendChild(dot);
    });
  }
  renderBankList();
}

function selectBankColor(clr){
  selectedBankColor = clr;
  document.querySelectorAll('#bank-color-chips div').forEach(d=>{
    d.style.border = d.style.background===clr ? '3px solid #fff' : '3px solid transparent';
  });
}

function addBankAccount(){
  const name    = document.getElementById('bank-name').value.trim();
  const balance = parseMaskedAmt(document.getElementById('bank-balance').value)||0;
  if(!name){
    showAlert('Por favor preencha o nome da conta antes de continuar.','Campos obrigatórios','📝');
    return;
  }
  const accId = String(Date.now());
  bankAccounts.push({id:accId, name, clr:selectedBankColor, type:selectedBankType, balance:0, initialBalance:0});

  // Se tem saldo inicial, lançar como transação de receita vinculada à conta
  if(balance > 0){
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    txs.unshift({
      id: Date.now()+1,
      desc: 'Saldo inicial · '+name,
      name: 'Saldo inicial · '+name,
      amt: balance,
      date: dateStr,
      cat: 'receita',
      type: 'receita',
      accountId: accId,
      _initialBalance: true
    });
  }

  autosave();
  renderBankList();
  if(currentPage.v==='overview') renderOverview();
  else renderOverviewBankAccounts();
  document.getElementById('bank-name').value='';
  document.getElementById('bank-balance').value='';
  // Se veio do fluxo de renda, fechar automaticamente (volta para m-receita)
  if(_bankFromRenda) closeM('m-bank');
}

function deleteBankAccount(id){
  DB.deleteBankAccount(id);
  const sid = String(id);
  const acc = bankAccounts.find(a=>String(a.id)===sid);
  if(!acc) return;
  if(!confirm(`Excluir a conta "${acc.name}"?\n\nIsso irá remover:\n• Todas as transações vinculadas\n• O vínculo das rendas com esta conta\n\nEsta ação não pode ser desfeita.`)) return;

  // Remove txs vinculadas
  txs = txs.filter(t=>String(t.accountId)!==sid);
  // Remove txs de renda vinculadas (_incomeKey) desta conta
  incomes.forEach(inc=>{
    if(String(inc.accountId)===sid){
      inc.accountId = null;
      inc.received = []; // limpa recebidos pois as txs foram removidas
    }
  });
  bankAccounts = bankAccounts.filter(a=>String(a.id)!==sid);
  autosave();
  renderBankList();
  renderIncomes();
  try{ renderOverview(); }catch(e){}
  // Atualizar chips nos modais abertos
  try{ initIncomeModal(); }catch(e){}
}

function renderBankList(){
  const el = document.getElementById('bank-list');
  if(!el) return;
  if(!bankAccounts.length){
    el.innerHTML='<div style="color:var(--muted);font-size:13px;padding:4px 0 12px">Nenhuma conta ainda.</div>';
    return;
  }
  el.innerHTML='';
  bankAccounts.forEach(acc=>{
    const aid = String(acc.id);
    const txTotal = txs.filter(t=>String(t.accountId)===aid).reduce((s,t)=>s+t.amt,0);
    const real    = acc.initialBalance + txTotal;
    const row = document.createElement('div');
    row.className='bank-account-row';
    row.style.flexWrap='wrap';
    row.innerHTML=`
      <div class="bank-dot" style="background:${acc.clr}"></div>
      <div style="flex:1;min-width:0">
        <div style="color:#fff;font-size:13px;font-weight:600">${acc.name}</div>
        <div style="color:var(--muted);font-size:11px">${acc.type==='investimento'?'💹 Investimento':acc.type==='poupança'?'🐷 Poupança':'Corrente'}</div>
      </div>
      <div style="text-align:right;margin-right:8px">
        <div style="color:${real>=0?'var(--green)':'var(--red)'};font-family:var(--num);font-weight:700;font-size:14px">${fmt(real)}</div>
        <div style="color:var(--muted);font-size:10px;cursor:pointer;text-decoration:underline dotted" onclick="editBankBalance(${acc.id})">editar saldo</div>
      </div>
      <button onclick="deleteBankAccount(${acc.id})" style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:6px 10px;color:#f87171;font-size:13px;cursor:pointer;flex-shrink:0">🗑</button>
      <div id="edit-bal-${acc.id}" style="display:none;width:100%;margin-top:8px">
        <div style="display:flex;gap:8px;align-items:center">
          <input type="text" inputmode="numeric" placeholder="${fmtForInput(acc.initialBalance)}" oninput="maskMoney(this)" style="flex:1;background:var(--card2);border:1px solid var(--border2);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;font-family:var(--num);outline:none" id="bal-inp-${acc.id}" value=""/>
          <button onclick="saveBankBalance(${acc.id})" style="background:var(--green);border:none;border-radius:8px;padding:8px 14px;color:#000;font-size:13px;font-weight:700;cursor:pointer">✓</button>
        </div>
      </div>`;
    el.appendChild(row);
  });
}

function editBankBalance(id){
  // Fechar todos os outros
  document.querySelectorAll('[id^="edit-bal-"]').forEach(el=>el.style.display='none');
  const el = document.getElementById('edit-bal-'+id);
  if(el){ el.style.display='block'; document.getElementById('bal-inp-'+id).focus(); }
}

function saveBankBalance(id){
  const acc = bankAccounts.find(a=>a.id===id);
  if(!acc) return;
  const raw = document.getElementById('bal-inp-'+id).value;
  if(!raw.trim()) return;
  const desired = parseMaskedAmt(raw);
  if(isNaN(desired)) return;
  const sid = String(acc.id);

  // Calcular saldo atual (txs existentes, excluindo ajustes anteriores)
  const txTotal = txs.filter(t=>String(t.accountId)===sid && !t._balanceAdj).reduce((s,t)=>s+t.amt,0);
  const currentReal = acc.initialBalance + txTotal;
  const diff = desired - currentReal;

  if(Math.abs(diff) < 0.01){ renderBankList(); return; } // sem mudança

  // Remover ajuste anterior se existir
  txs = txs.filter(t=>!(String(t.accountId)===sid && t._balanceAdj));

  // Criar tx de ajuste
  if(diff !== 0){
    const today = new Date().toISOString().split('T')[0];
    txs.unshift({
      id: Date.now(),
      desc: (diff > 0 ? 'Ajuste de saldo · ' : 'Ajuste de saldo · ') + acc.name,
      amt: diff,
      date: today,
      cat: diff > 0 ? 'receita' : 'outros',
      type: diff > 0 ? 'receita' : 'despesa',
      accountId: sid,
      _balanceAdj: true
    });
  }

  autosave();
  renderBankList();
  if(currentPage.v==='overview') renderOverview();
  else renderOverviewBankAccounts();
}

function renderRendaAccountChips(currentId){
  const el = document.getElementById('r-account-chips');
  if(!el) return;
  el.innerHTML='';
  // Chip dinheiro sempre primeiro
  const dinheiro = document.createElement('button');
  const dinhActive = currentId==='__dinheiro__';
  dinheiro.style.cssText=`display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${dinhActive?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)'};border:1px solid ${dinhActive?'rgba(34,197,94,0.4)':'rgba(255,255,255,0.08)'};color:${dinhActive?'var(--green)':'var(--muted)'}`;
  dinheiro.innerHTML='💵 Dinheiro';
  dinheiro.onclick=()=>{ selectedRendaAccountId='__dinheiro__'; renderRendaAccountChips('__dinheiro__'); };
  el.appendChild(dinheiro);
  // Chips dos bancos
  bankAccounts.forEach(acc=>{
    const active = currentId===acc.id;
    const chip=document.createElement('button');
    chip.style.cssText=`display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${active?acc.clr+'22':'rgba(255,255,255,0.05)'};border:1px solid ${active?acc.clr+'60':'rgba(255,255,255,0.08)'};color:${active?acc.clr:'var(--muted)'}`;
    chip.innerHTML=`<span style="width:7px;height:7px;border-radius:50%;background:${acc.clr};display:inline-block"></span>${acc.name}`;
    chip.onclick=()=>{ selectedRendaAccountId=acc.id; renderRendaAccountChips(acc.id); };
    el.appendChild(chip);
  });
}

function renderAccountChips(containerId, currentId){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML='';
  if(!bankAccounts.length){ return; }

  // Se nenhuma conta selecionada, selecionar a primeira
  if(currentId==null && bankAccounts.length){
    currentId = bankAccounts[0].id;
    selectedAccountId = currentId;
  }

  bankAccounts.forEach(acc=>{
    const active = currentId===acc.id;
    const chip=document.createElement('button');
    chip.className='acct-chip'+(active?' active':'');
    chip.style.cssText=`background:${acc.clr}18;color:${acc.clr};border-color:${active?acc.clr:'transparent'}`;
    chip.dataset.accId = acc.id;
    chip.innerHTML=`<span style="width:7px;height:7px;border-radius:50%;background:${acc.clr};flex-shrink:0;display:inline-block"></span>${acc.name}`;
    chip.onclick=()=>{ selectedAccountId=acc.id; refreshAccountChips(containerId,acc.id); };
    el.appendChild(chip);
  });
}

function refreshAccountChips(containerId, activeId){
  const el=document.getElementById(containerId);
  if(!el) return;
  el.querySelectorAll('.acct-chip').forEach(chip=>{
    const accId = chip.dataset.accId ? parseInt(chip.dataset.accId) : null;
    const active = accId===activeId;
    chip.classList.toggle('active', active);
    const acc = accId ? bankAccounts.find(a=>a.id===accId) : null;
    chip.style.borderColor = active ? (acc?acc.clr:'transparent') : 'transparent';
  });
}

function getAccBalance(acc){
  const aid = String(acc.id);
  const txTotal = txs.filter(t=>String(t.accountId)===aid).reduce((s,t)=>s+t.amt,0);
  return (acc.initialBalance||0) + txTotal;
}

function renderOverviewBankAccounts(){
  const balEl  = document.getElementById('ov-balance');
  if(!balEl) return;

  if(!bankAccounts.length){
    balEl.textContent = 'R$ 0,00';
    balEl.style.color = '#fff';
    const mini = document.getElementById('ov-bank-mini');
    if(mini) mini.innerHTML = '<div style="color:var(--muted);font-size:12px">Nenhuma conta cadastrada</div>';
    return;
  }

  // Normaliza ids para string para comparação segura
  const totalBal = bankAccounts.reduce((sum,acc)=>{
    const aid = String(acc.id);
    const txTotal = txs.filter(t=>String(t.accountId)===aid).reduce((s,t)=>s+t.amt,0);
    return sum + acc.initialBalance + txTotal;
  },0);

  balEl.textContent  = fmt(totalBal);
  balEl.style.color  = totalBal>=0 ? '#fff' : 'var(--red)';

  // Mini lista de contas
  let miniEl = document.getElementById('ov-bank-mini');
  if(!miniEl){
    miniEl=document.createElement('div');
    miniEl.id='ov-bank-mini';
    miniEl.style.cssText='margin-top:8px';
    const divider = balEl.closest('.card').querySelector('.divider');
    if(divider) divider.before(miniEl);
  }
  miniEl.innerHTML='';
  bankAccounts.forEach(acc=>{
    const aid = String(acc.id);
    const txTot = txs.filter(t=>String(t.accountId)===aid).reduce((s,t)=>s+t.amt,0);
    const bal   = acc.initialBalance+txTot;
    const row   = document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:7px;padding:3px 0';
    row.innerHTML=`<span style="width:8px;height:8px;border-radius:50%;background:${acc.clr};flex-shrink:0;display:inline-block"></span><span style="color:var(--muted);font-size:12px;flex:1">${acc.name}</span><span style="color:${bal>=0?'#fff':'var(--red)'};font-size:12px;font-family:var(--num);font-weight:600">${fmt(bal)}</span>`;
    miniEl.appendChild(row);
  });
}

function getAllData(){ return {}; }

function applyData(d){ /* dados carregados pelo Supabase */ }

/* autosave redefinida abaixo no db.js */

function exportData(){
  const data=getAllData();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const date=new Date().toISOString().slice(0,10);
  const a=document.createElement('a');
  a.href=url; a.download=`finance-dados-${date}.json`; a.click();
  URL.revokeObjectURL(url);
  showSaveToast('✓ Arquivo salvo!','var(--green)');
}

function importData(event){
  const file=event.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      applyData(data); autosave(); reRenderAll();
      showSaveToast('✓ Dados carregados!','var(--green)');
      updateDataInfo(data);
    }catch(err){showSaveToast('✗ Arquivo inválido','var(--red)');}
  };
  reader.readAsText(file);
  event.target.value='';
}

function reRenderAll(){
  renderIncomes(); // sempre atualizar rendas independente da página
  if(currentPage.v==='overview')    renderOverview();
  if(currentPage.v==='transactions')renderTxPage();
  if(currentPage.v==='installments')renderInst();
  if(currentPage.v==='subscriptions')renderSubs();
  if(currentPage.v==='cards')       renderCards();
  if(currentPage.v==='bills')       renderBills();
  if(currentPage.v==='goals')       renderGoals();
}

function updateDataInfo(data){
  const el=document.getElementById('data-info'); if(!el)return;
  const saved=new Date(data.savedAt).toLocaleString('pt-BR');
  el.innerHTML=`
    <div style="color:#fff;font-weight:600;margin-bottom:6px">📦 Arquivo carregado</div>
    <div>💳 ${data.txs?.length||0} transações</div>
    <div>🏠 ${data.fixedBills?.length||0} contas fixas</div>
    <div>📅 ${data.installments?.length||0} parcelamentos</div>
    <div>🎯 ${data.goals?.length||0} metas</div>
    <div style="margin-top:6px;color:rgba(255,255,255,0.3);font-size:11px">Salvo em: ${saved}</div>`;
}

function showInvestmentToast(name, bank, amount){
  document.getElementById('inv-success-name').textContent = name;
  document.getElementById('inv-success-amount').textContent = fmt(amount);
  document.getElementById('inv-success-bank').textContent = bank ? '🏦 ' + bank : '';
  openM('m-invest-success');
}

function showSaveToast(msg, color, title, ico){
  const el=document.getElementById('toast');
  const icoEl=document.getElementById('t-ico');
  icoEl.textContent = ico||'💾';
  icoEl.style.cssText=`background:${color}18;border:1px solid ${color}30;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0`;
  const titleEl = document.getElementById('t-title');
  titleEl.style.color = 'var(--text)';
  titleEl.innerHTML = title ? `<span style="color:var(--text);font-weight:700">${title}</span>` : `<span style="color:${color};font-weight:600">${msg}</span>`;
  document.getElementById('t-sub').innerHTML = title ? `<span style="color:${color};font-weight:500">${msg}</span>` : '';
  el.style.display='block';clearTimeout(el._t);
  el._t=setTimeout(()=>el.style.display='none',4000);
}

// Autosave: chamado diretamente em cada função que altera dados

// Popular anos no select de prazo de metas
(function(){
  const sel=document.getElementById('g-dl-year');
  const cur=new Date().getFullYear();
  sel.innerHTML='<option value="">Ano</option>';
  for(let y=cur;y<=cur+10;y++){
    const o=document.createElement('option');
    o.value=y; o.textContent=y; sel.appendChild(o);
  }
})();

function initApp(){
  // Limpa dado corrompido — só remove se JSON inválido, não por campos faltando
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if(raw) JSON.parse(raw); // só testa se é JSON válido
  } catch(e) {
    localStorage.removeItem(SAVE_KEY);
  }

    // Dados carregados pelo Supabase em loadUserData() — chamado por showApp()
  document.getElementById('ov-date').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  try { autoNavToCurrentBill(); } catch(e) { console.warn('autoNav:', e); }
  try { renderOverview(); } catch(e) { console.warn('renderOverview:', e); }
  try { renderBills(); } catch(e) { console.warn('renderBills:', e); }
  try { renderIncomes(); } catch(e) { console.warn('renderIncomes:', e); }
  try { renderOverviewBankAccounts(); } catch(e) { console.warn('renderOverviewBankAccounts:', e); }
  // Re-renderizar após frame para garantir DOM atualizado
  setTimeout(()=>{ try{ renderIncomes(); }catch(e){} }, 50);

  // Saudação personalizada usando dados do Supabase
  setTimeout(()=>{
    try{
      const name = _userProfile?.name ||
        _currentUser?.user_metadata?.full_name ||
        _currentUser?.email?.split('@')[0] || 'você';
      const firstName = name.split(' ')[0];
      const hour = new Date().getHours();
      const isDay = hour >= 6 && hour < 18;
      const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
      const ico = isDay ? '☀️' : '🌙';
      const isNew = !_userProfile || !localStorage.getItem('finance_welcomed_' + _currentUser?.id);
      const subMsg = isNew ? 'Seja bem-vindo(a) ao Finance! 🚀' : 'Suas finanças sentiram sua falta 💚';
      if(isNew && _currentUser?.id) localStorage.setItem('finance_welcomed_' + _currentUser.id, '1');
      showSaveToast(subMsg, 'var(--green)', `${greeting}, ${firstName}!`, ico);
    }catch(e){}
  }, 600);

  // Inicia sistema de lembretes após 1.5s
  setTimeout(()=>checkReminders(), 1500);
}

// ══════════════════════════════════════════

