/* income.service.js — Rendas recorrentes */

// ── RENDAS ──
const INCOME_ICOS = ['💰','💵','💴','💶','💷','🏦','📈','💼','🤝','🖥️','📱','🎨','🎵','🏠','🚗','✍️','📝','🎓','⚡','🌐','🛒','🎮','📸','🔧'];
let incomeFreq = 'mensal';
let incomeDays = [];
let editIncomeId = null;

function toggleIncomeIcoPicker(){
  const p = document.getElementById('income-ico-picker');
  if(p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function initIncomeModal(income=null){
  editIncomeId = income ? income.id : null;
  const titleEl = document.getElementById('income-modal-title');
  if(titleEl) titleEl.textContent = income ? 'Editar renda' : 'Nova fonte de renda';
  document.getElementById('income-name').value   = income ? income.name : '';
  document.getElementById('income-amt').value    = income ? fmtForInput(income.amt) : '';
  const prev = document.getElementById('income-ico-preview2')||document.getElementById('income-ico-preview');
  if(prev) prev.textContent = income ? income.ico : '💰';
  const picker = document.getElementById('income-ico-picker');
  if(picker) picker.style.display = 'none';
  const delBtn = document.getElementById('income-delete-btn');
  if(delBtn) delBtn.style.display = income ? 'block' : 'none';

  incomeFreq = income ? income.freq : 'mensal';
  incomeDays = income ? [...(income.days||[])] : [];
  setTimeout(()=>{ const di=document.getElementById('income-day-input'); if(di) di.value=incomeDays[0]||''; },20);

  // Botões de frequência
  ['mensal','quinzenal','semanal','variavel'].forEach(f => {
    const btn = document.getElementById('ifreq-'+f);
    if(btn){ btn.classList.toggle('active-freq', f===incomeFreq); }
  });


  // Chips de conta de recebimento — recria sempre com dados atuais
  const accChips = document.getElementById('income-account-chips');
  if(accChips){
    accChips.innerHTML='';
    const selId = income ? (income.accountId || '__geral__') : '__geral__';

    const makeIncChip = (id, label, clr, active)=>{
      const chip=document.createElement('button');
      chip.type='button';
      chip.dataset.accid=id;
      chip.dataset.clr=clr;
      if(active) chip.dataset.selected='1';
      chip.style.cssText=`display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${active?clr+'28':chipInactiveBg()};border:1px solid ${active?clr+'70':chipInactiveBorder()};color:${active?clr:chipInactiveColor()}`;
      chip.innerHTML=label;
      chip.onclick=()=>{
        accChips.querySelectorAll('button[data-accid]').forEach(b=>{
          delete b.dataset.selected;
          const bc=b.dataset.clr||'#94a3b8';
          b.style.background='rgba(255,255,255,0.04)';
          b.style.borderColor='rgba(255,255,255,0.08)';
          b.style.color='var(--muted)';
        });
        chip.dataset.selected='1';
        chip.style.background=clr+'28';
        chip.style.borderColor=clr+'70';
        chip.style.color=clr;
      };
      accChips.appendChild(chip);
    };

    if(bankAccounts.length===0){
      const hint=document.createElement('span');
      hint.style.cssText='color:var(--muted);font-size:12px;padding:6px 0;display:block';
      hint.innerHTML='Nenhuma conta. <span style="color:var(--green);cursor:pointer" onclick="openBankFromRenda(null)">Cadastrar →</span>';
      accChips.appendChild(hint);
    } else {
      bankAccounts.forEach(acc=>{
        makeIncChip(acc.id,`<span style="width:7px;height:7px;border-radius:50%;background:${acc.clr};display:inline-block"></span>${acc.name}`, acc.clr, selId===acc.id);
      });
      // Botão para adicionar mais contas
      const addBtn=document.createElement('button');
      addBtn.type='button';
      addBtn.style.cssText='display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);background:rgba(34,197,94,0.08);border:1px dashed rgba(34,197,94,0.3);color:var(--green);margin-top:2px';
      addBtn.innerHTML='＋ Adicionar conta';
      addBtn.onclick=()=> openBankFromRenda(income||null);
      accChips.appendChild(addBtn);

      const manageBtn=document.createElement('button');
      manageBtn.type='button';
      manageBtn.style.cssText='display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);background:rgba(239,68,68,0.07);border:1px dashed rgba(239,68,68,0.25);color:#f87171;margin-top:2px';
      manageBtn.innerHTML='🗑 Gerenciar contas';
      manageBtn.onclick=()=>openManageAccounts();
      accChips.appendChild(manageBtn);
    }
  }

  // Grade de ícones
  const grid = document.getElementById('income-ico-grid');
  grid.innerHTML = '';
  INCOME_ICOS.forEach(ico => {
    const btn = document.createElement('button');
    btn.textContent = ico;
    const previewEl = document.getElementById('income-ico-preview2')||document.getElementById('income-ico-preview');
    const cur = previewEl ? previewEl.textContent : '💰';
    btn.style.cssText = `font-size:20px;background:${ico===cur?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.04)'};border:${ico===cur?'2px solid var(--green)':'1px solid rgba(255,255,255,0.07)'};border-radius:10px;padding:5px;cursor:pointer;aspect-ratio:1;transition:all .15s`;
    btn.onclick = () => {
      const p2 = document.getElementById('income-ico-preview2')||document.getElementById('income-ico-preview');
      if(p2) p2.textContent = ico;
      document.querySelectorAll('#income-ico-grid button').forEach(b=>{
        const a = b.textContent===ico;
        b.style.background=a?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.04)';
        b.style.border=a?'2px solid var(--green)':'1px solid rgba(255,255,255,0.07)';
      });
      document.getElementById('income-ico-picker').style.display='none';
    };
    grid.appendChild(btn);
  });
}

function setIncomeFreq(f){
  incomeFreq = f;
  ['mensal','quinzenal','semanal','variavel'].forEach(x => {
    const btn = document.getElementById('ifreq-'+x);
    if(btn) btn.classList.toggle('active-freq', x===f);
  });
  // Quinzenal → sugere dias 5 e 20 se vazio
  if(f==='variavel'){ const di=document.getElementById('income-day-input'); if(di) di.value=''; }
}


function renderIncomeDayChips(){
  const wrap = document.getElementById('income-day-chips');
  if(!wrap) return;
  wrap.innerHTML = '';
  incomeDays.forEach(d => {
    const chip = document.createElement('span');
    chip.className = 'income-day-chip';
    chip.innerHTML = `dia ${d} <span onclick="removeIncomeDay(${d})" style="cursor:pointer;opacity:.6;font-size:14px;line-height:1">×</span>`;
    wrap.appendChild(chip);
  });
}

function removeIncomeDay(d){
  incomeDays = incomeDays.filter(x=>x!==d);
}

function addIncomeDay(){
  const input = document.getElementById('income-day-input');
  if(!input) return;
  const v = parseInt(input.value);
  if(!v || v<1 || v>31) return;
  if(incomeDays.includes(v)){ input.value=''; return; }
  incomeDays.push(v);
  incomeDays.sort((a,b)=>a-b);
  input.value='';
  renderIncomeDayChips();
  input.focus();
}

function saveIncome(){
  const name = document.getElementById('income-name').value.trim();
  const amt  = parseMaskedAmt(document.getElementById('income-amt').value);
  const icoEl = document.getElementById('income-ico-preview2')||document.getElementById('income-ico-preview');
  const ico  = icoEl ? icoEl.textContent : '💰';
  const auto = true; // sempre lança como transação automaticamente
  if(!name||!amt){
    showAlert('Preencha o nome e o valor da renda para salvar.', 'Campos obrigatórios', '📝');
    return;
  }

  // Pegar conta selecionada via data-selected
  const accChips = document.getElementById('income-account-chips');
  let accountId = null;
  if(accChips){
    const sel = accChips.querySelector('button[data-selected="1"]');
    if(sel && sel.dataset.accid && sel.dataset.accid !== '__geral__') accountId = String(sel.dataset.accid);
  }

  // Validar conta selecionada
  const errEl = document.getElementById('income-account-err');
  if(!accountId){
    if(errEl){ errEl.style.display='block'; setTimeout(()=>errEl.style.display='none', 4000); }
    // Scroll para o campo de conta
    const chipsEl = document.getElementById('income-account-chips');
    if(chipsEl) chipsEl.scrollIntoView({behavior:'smooth', block:'center'});
    return;
  }
  if(errEl) errEl.style.display='none';

  const dayVal = parseInt(document.getElementById('income-day-input').value)||0;
  const days = dayVal>=1&&dayVal<=31 ? [dayVal] : [];

  if(editIncomeId){
    const inc = incomes.find(i=>i.id===editIncomeId);
    if(inc){
      // Remover txs antigas desta renda para recriar com valores atualizados
      const sid = String(editIncomeId);
      txs = txs.filter(t=>{
        if(!t._incomeKey) return true;
        const parts = String(t._incomeKey).split('_');
        return parts[parts.length-1] !== sid;
      });
      // Limpar received para forçar re-auto-marcar com novo valor
      inc.received = [];
      Object.assign(inc, {name,amt,ico,freq:incomeFreq,days,auto,accountId});
    }
  } else {
    incomes.push({id:Date.now(),name,amt,ico,freq:incomeFreq,days,auto,accountId,received:[]});
  }

  // renderIncomes vai auto-marcar e criar txs com valor correto
  renderIncomes();
  // Agora salvar com txs atualizadas
  autosave();
  try{ renderOverview(); }catch(e){}
  closeM('m-receita');
}

function deleteIncome(){
  DB.deleteIncome(editingIncomeId);
  if(!editIncomeId) return;
  const sid = String(editIncomeId);
  // Remove todas as transações geradas por esta renda (chave = "YYYY-MM-DD_incomeId")
  txs = txs.filter(t=>{
    if(!t._incomeKey) return true;
    const parts = String(t._incomeKey).split('_');
    return parts[parts.length-1] !== sid;
  });
  incomes = incomes.filter(i=>String(i.id)!==sid);
  autosave();
  renderIncomes();
  // Atualizar overview independente de qual página está ativa
  try{ renderOverview(); }catch(e){}
  closeM('m-receita');
}

function toggleIncomeReceived(id, day){
  const inc = incomes.find(i=>i.id===id);
  if(!inc) return;
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const idx = inc.received.indexOf(key);
  if(idx>=0){
    // Desfaz: remove transação
    inc.received.splice(idx,1);
    txs = txs.filter(t=>t._incomeKey!==key+'_'+id);
  } else {
    // Marca como recebido
    inc.received.push(key);
    if(inc.auto){
      const tx = {id:Date.now(),_incomeKey:key+'_'+id,name:inc.name,cat:'receita',amt:inc.amt,date:key,isnew:true};
      if(inc.accountId) tx.accountId = String(inc.accountId);
      txs.unshift(tx);
    }
  }
  autosave();
  renderIncomes();
  if(currentPage.v==='overview') renderOverview();
}

function renderIncomes(){
  const el = document.getElementById('ov-incomes-list');
  const totalEl = document.getElementById('ov-incomes-total');
  if(!el){ 
    // Elemento ainda não está no DOM — tentar em 100ms
    setTimeout(renderIncomes, 100);
    return;
  }

  // Botão muda conforme já tem rendas ou não
  const btnFonte = document.getElementById('btn-add-renda');
  if(btnFonte){
    if(incomes.length){
      btnFonte.textContent = '＋ Outra renda';
    } else {
      btnFonte.textContent = '＋ Renda';
    }
    btnFonte.style.background   = 'var(--green)';
    btnFonte.style.color        = '#000';
    btnFonte.style.border       = 'none';
    btnFonte.style.fontWeight   = '700';
  }

  if(!incomes.length){
    el.innerHTML='<div style="color:var(--muted);font-size:13px;padding:10px 0">Nenhuma renda cadastrada. Clique em <b style="color:var(--green);cursor:pointer" onclick="openRendaModal()">＋ Renda</b> para adicionar seu salário.</div>';
    totalEl.style.display='none';
    // Garantir que o botão mostre o texto correto para estado vazio
    if(btnFonte) btnFonte.textContent = '＋ Renda';
    return;
  }

  // Tem rendas — garantir que o card header reflita isso
  if(btnFonte) btnFonte.textContent = '＋ Outra fonte';

  el.innerHTML='';
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let totalMonthly = 0;
  let totalReceived = 0;

  incomes.forEach(inc => {
    const freqLabel = {mensal:'Mensal',quinzenal:'Quinzenal',semanal:'Semanal',variavel:'Variável'}[inc.freq]||inc.freq;
    const daysStr = inc.days.length ? inc.days.map(d=>`dia ${d}`).join(', ') : 'data variável';

    // Auto-marcar como recebido se hoje >= dia de recebimento
    const today = now.getDate();
    let autoChanged = false;
    inc.days.forEach(d => {
      const key = `${monthKey}-${String(d).padStart(2,'0')}`;
      if(today >= d && !inc.received.includes(key)){
        inc.received.push(key);
        autoChanged = true;
        // Lançar transação automática se configurado
        if(inc.auto && !txs.find(t=>t._incomeKey===key+'_'+inc.id)){
          const tx = {id:Date.now()+Math.random(),_incomeKey:key+'_'+inc.id,name:inc.name,cat:'receita',amt:inc.amt,date:key,isnew:false};
          if(inc.accountId) tx.accountId = String(inc.accountId);
          txs.unshift(tx);
        }
      }
    });
    if(autoChanged) autosave();

    // Checar quais dias já foram recebidos este mês
    const receivedThisMonth = inc.days.filter(d => {
      const key = `${monthKey}-${String(d).padStart(2,'0')}`;
      return inc.received.includes(key);
    });
    const allReceived = inc.days.length>0 && receivedThisMonth.length===inc.days.length;
    const partReceived = receivedThisMonth.length>0 && !allReceived;

    totalMonthly += inc.freq==='variavel' ? 0 : inc.amt * (inc.freq==='quinzenal'?2:inc.freq==='semanal'?4:1);
    totalReceived += receivedThisMonth.length * inc.amt;

    const row = document.createElement('div');
    row.className = 'income-row' + (allReceived?' income-received':'');
    row.style.cursor='pointer';
    row.title='Clique para editar';
    row.onclick=(e)=>{ if(!e.target.closest('button')&&!e.target.closest('span')) openEditIncome(inc.id); };

    row.innerHTML = `
      <div style="width:40px;height:40px;border-radius:12px;background:var(--card2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${inc.ico}</div>
      <div style="flex:1;min-width:0">
        <div style="color:${isLightTheme()?'#0f172a':'#ffffff'};font-size:14px;font-weight:600">${inc.name}</div>
        <div style="color:${isLightTheme()?'#475569':'#94a3b8'};font-size:11px;margin-top:1px">${freqLabel} · ${daysStr}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
      <div style="text-align:right;flex-shrink:0">
        <div style="color:var(--green);font-family:var(--num);font-weight:700;font-size:15px">${fmt(inc.amt)}</div>
        ${inc.days.length>0 ? renderIncomeDayBtns(inc, monthKey) : `<div style="color:var(--muted);font-size:11px">${allReceived?'✓ recebido':'a receber'}</div>`}
      </div>`;
    el.appendChild(row);
  });

  // Total
  totalEl.style.display='flex';
  totalEl.innerHTML=`
    <div style="flex:1">
      <div style="color:var(--muted);font-size:11px">Total mensal previsto</div>
      <div style="color:var(--green);font-family:var(--num);font-weight:700;font-size:16px">${fmt(totalMonthly)}</div>
    </div>
    <div style="text-align:right">
      <div style="color:var(--muted);font-size:11px">Recebido este mês</div>
      <div style="color:#fff;font-family:var(--num);font-weight:700;font-size:16px">${fmt(totalReceived)}</div>
    </div>`;
}

function renderIncomeDayBtns(inc, monthKey){
  if(!inc.days.length) return '';
  const today = new Date().getDate();
  return '<div style="display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap;margin-top:4px">' +
    inc.days.map(d => {
      const key = `${monthKey}-${String(d).padStart(2,'0')}`;
      const got = inc.received.includes(key);
      const upcoming = !got && today < d;
      return got
        ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:var(--green)">✓ dia ${d} recebido</span>`
        : `<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:var(--muted)">🕐 dia ${d} a receber</span>`;
    }).join('') + '</div>';
}

function inlineEditIncomeAmt(id, el){
  const inc = incomes.find(i=>i.id===id);
  if(!inc) return;
  const parent = el.parentElement;
  const oldHTML = parent.innerHTML;
  // Substituir valor por input
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.value = fmtForInput(inc.amt);
  inp.style.cssText = `width:110px;background:rgba(34,197,94,0.1);border:1.5px solid rgba(34,197,94,0.5);border-radius:8px;padding:4px 8px;color:var(--green);font-family:var(--num);font-weight:700;font-size:15px;text-align:right;outline:none`;
  el.replaceWith(inp);
  inp.focus();
  inp.select();
  const confirm = ()=>{
    const v = parseFloat(inp.value);
    if(v > 0){ inc.amt = v; autosave(); }
    renderIncomes();
    if(currentPage.v==='overview') renderOverview();
  };
  inp.onkeydown = e=>{ if(e.key==='Enter') confirm(); if(e.key==='Escape'){ renderIncomes(); } };
  inp.onblur = confirm;
}

function openEditIncome(id){
  const inc = incomes.find(i=>i.id===id);
  if(!inc) return;
  editIncomeId = inc.id;
  openM('m-receita');
  setTimeout(()=>{
    setRendaTab('recorrente', true); // skipInit=true para não resetar
    initIncomeModal(inc);            // carrega os dados do income
  }, 30);
}

// ══════════════════════════════════════

// ── TOGGLE PICKER DE ÍCONE CONTA FIXA ──
function toggleBillIcoPicker(){
  const panel = document.getElementById('fb-ico-panel');
  const arrow = document.getElementById('fb-ico-arrow');
  if(!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if(arrow) arrow.style.transform = open ? 'rotate(90deg)' : 'none';
}


