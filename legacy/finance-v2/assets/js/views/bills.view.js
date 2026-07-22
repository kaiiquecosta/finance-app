/* bills.view.js — Contas fixas */

// ── CONTAS FIXAS ──
let fixedBills = []; // populado pelo init
let editingBillId = null;
let payingBillId  = null;

function toggleFixedHint(){
  const isFixed = document.getElementById('fb-fixed').checked;
  document.getElementById('fb-variable-hint').style.display = isFixed ? 'none' : 'block';
  document.getElementById('fb-amt').style.opacity = isFixed ? '1' : '0.5';
}


// ── BILL ICO PICKER ──
const BILL_ICOS = [
  '🏠','🏢','🏡','🏘️','🛖','🏗️',
  '💡','🔌','🔋','☀️','🌡️','❄️',
  '💧','🚿','🛁','🚰','💦','🌊',
  '🌐','📶','📡','🖥️','💻','📺',
  '📱','☎️','📞','🎙️','🔊','📻',
  '🔥','♨️','🫙','🧯','🪵','💨',
  '🚗','🚕','🛵','🚌','✈️','⛽',
  '🎓','📚','✏️','🏫','🎒','📝',
  '💊','🏥','🩺','🧬','💉','🩹',
  '🔒','🛡️','📋','💰','🏦','💳',
  '🐾','🐕','🐈','🌱','🌿','🪴',
  '🍽️','🛒','🧺','🧹','🪣','🔧',
];
const BILL_CATS = ['Moradia','Energia','Água','Internet','Celular','Gás','Transporte','Educação','Saúde','Seguro','Pet','Outros'];
let selectedBillIco = '🏠';
let selectedBillCat = 'Moradia';

function initBillIcoPicker(){
  selectedBillIco = '🏠'; selectedBillCat = 'Moradia';
  const preview = document.getElementById('fb-ico-preview');
  if(preview) preview.textContent = '🏠';
  const custom = document.getElementById('fb-ico-custom');
  if(custom) custom.value = '';
  const grid = document.getElementById('fb-ico-grid');
  if(!grid) return;
  grid.innerHTML = '';
  BILL_ICOS.forEach(ico => {
    const btn = document.createElement('button');
    btn.textContent = ico;
    const isActive = ico === selectedBillIco;
    btn.style.cssText = `font-size:20px;background:${isActive?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.04)'};border:${isActive?'2px solid var(--green)':'1px solid rgba(255,255,255,0.07)'};border-radius:10px;padding:6px 2px;cursor:pointer;transition:all .15s;aspect-ratio:1`;
    btn.onclick = () => selectBillIco(ico);
    grid.appendChild(btn);
  });
  const catGrid = document.getElementById('fb-cat-grid');
  if(!catGrid) return;
  catGrid.innerHTML = '';
  BILL_CATS.forEach(cat => {
    const chip = document.createElement('button');
    chip.textContent = cat;
    const isActive = cat === selectedBillCat;
    chip.style.cssText = `font-size:12px;font-weight:500;padding:5px 12px;border-radius:20px;cursor:pointer;transition:all .15s;font-family:var(--font);background:${isActive?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)'};border:${isActive?'1px solid rgba(34,197,94,0.4)':'1px solid rgba(255,255,255,0.08)'};color:${isActive?'var(--green)':'var(--muted)'}`;
    chip.onclick = () => selectBillCat(cat);
    catGrid.appendChild(chip);
  });
}
function selectBillIco(ico){
  if(!ico) return;
  selectedBillIco = ico;
  const preview = document.getElementById('fb-ico-preview');
  if(preview) preview.textContent = ico;
  document.querySelectorAll('#fb-ico-grid button').forEach(b => {
    const active = b.textContent === ico;
    b.style.background = active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)';
    b.style.border = active ? '2px solid var(--green)' : '1px solid rgba(255,255,255,0.07)';
  });
}
function selectBillCat(cat){
  selectedBillCat = cat;
  const customEl = document.getElementById('fb-cat-custom');
  if(customEl) customEl.value = '';
  document.querySelectorAll('#fb-cat-grid button').forEach(c => {
    const active = c.textContent === cat;
    c.style.background = active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)';
    c.style.border     = active ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.08)';
    c.style.color      = active ? 'var(--green)' : 'var(--muted)';
  });
}

function openCCBillPreview(cardId){
  const card = cards.find(c=>c.id===parseInt(cardId));
  if(!card) return;
  let fat=0, fatM=new Date().getMonth(), fatY=new Date().getFullYear();
  for(let off=0;off<=2;off++){
    const{m:mm,y:yy}=getCardMonth(off);
    const f=billsForMonth(card,mm,yy).reduce((s,b)=>s+b.amt,0);
    if(f>0){fat=f;fatM=mm;fatY=yy;break;}
  }
  const bills=billsForMonth(card,fatM,fatY);
  const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const el=document.getElementById('cc-preview-content');
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
      <div style="width:42px;height:42px;border-radius:12px;background:${card.clr}25;border:1px solid ${card.clr}50;display:flex;align-items:center;justify-content:center;font-size:20px">💳</div>
      <div>
        <div style="color:#fff;font-size:15px;font-weight:700">${card.name}</div>
        <div style="color:var(--muted);font-size:12px">Fatura de ${MONTHS[fatM]}</div>
      </div>
    </div>
    <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:var(--muted);font-size:12px">Total da fatura</span>
      <span style="color:var(--red);font-family:var(--num);font-weight:800;font-size:20px">${fmt(fat)}</span>
    </div>
    <div style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Lançamentos (${bills.length})</div>
    <div id="cc-preview-list"></div>`;
  const listEl=document.getElementById('cc-preview-list');
  bills.forEach(b=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)';
    row.innerHTML=`<span style="color:#fff;font-size:13px;flex:1">${b.desc||b.name||'Lançamento'}</span><span style="color:var(--red);font-family:var(--num);font-weight:600;font-size:13px">${fmt(b.amt)}</span>`;
    listEl.appendChild(row);
  });
  if(!bills.length) listEl.innerHTML='<div style="color:var(--muted);text-align:center;padding:20px 0;font-size:13px">Nenhum lançamento neste mês</div>';
  openM('m-cc-bill-preview');
}

function renderBills(){
  // Gerar entradas virtuais de fatura de cartão
  // Usa o mês mais próximo que tenha fatura (atual ou próximo)
  const today = new Date();
  const ccVirtual = cards.map(card=>{
    // Tenta mês atual, depois os 2 próximos
    let fat = 0, fatM = today.getMonth(), fatY = today.getFullYear();
    for(let off=0; off<=2; off++){
      const {m:mm, y:yy} = getCardMonth(off);
      const f = billsForMonth(card,mm,yy).reduce((s,b)=>s+b.amt,0);
      if(f>0){ fat=f; fatM=mm; fatY=yy; break; }
    }
    if(fat<=0) return null;
    const vId = 'cc_'+card.id;
    const alreadyPaid = fixedBills.find(b=>b._ccId===card.id);
    const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return {
      id: vId, _ccId: card.id,
      name: card.name+' · fatura '+MONTHS_SHORT[fatM],
      ico: '💳', fixed: true, amt: fat,
      day: card.dueDay||10, cat: 'cartão',
      paid: !!(alreadyPaid&&alreadyPaid.paid),
      paidAmt: alreadyPaid ? alreadyPaid.paidAmt : null,
      _virtual: true, clr: card.clr,
      _fatM: fatM, _fatY: fatY
    };
  }).filter(Boolean);

  // Combinar reais + virtuais — excluir entradas _ccId do fixedBills (gerenciadas pelos virtuais)
  const realBills = fixedBills.filter(b => !b._ccId);
  const allBills = [...realBills, ...ccVirtual];
  const fixedTotal   = allBills.filter(b=>b.fixed).reduce((s,b)=>s+b.amt,0);
  const paidTotal    = allBills.filter(b=>b.paid).reduce((s,b)=>s+(b.paidAmt||b.amt||0),0);
  const paidCount    = allBills.filter(b=>b.paid).length;
  const pendingCount = allBills.filter(b=>!b.paid).length;

  document.getElementById('fb-fixed-total').textContent   = fmt(fixedTotal)+'/mês';
  document.getElementById('fb-paid-count').textContent    = paidCount+' conta'+(paidCount!==1?'s':'');
  document.getElementById('fb-pending-count').textContent = pendingCount+' conta'+(pendingCount!==1?'s':'');

  const list = document.getElementById('fb-list');
  list.innerHTML = '';

  if(!allBills.length){
    list.innerHTML='<div style="color:var(--muted);text-align:center;padding:40px 0">Nenhuma conta cadastrada ainda.<br><span style="font-size:12px">As faturas dos seus cartões aparecerão aqui automaticamente.</span></div>';
    return;
  }

  // barra de progresso geral no topo
  const allPct = allBills.length ? Math.round((paidCount/allBills.length)*100) : 0;
  const topBar = document.createElement('div');
  topBar.style.cssText = 'margin-bottom:18px';
  topBar.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="color:var(--muted);font-size:12px">${paidCount} de ${allBills.length} pagas</span>
      <span style="color:var(--green);font-family:var(--num);font-size:13px;font-weight:700">${fmt(paidTotal)} debitados</span>
    </div>
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:999px;height:6px">
      <div style="width:${allPct}%;height:100%;border-radius:999px;background:linear-gradient(90deg,#16a34a,#22c55e);transition:width .6s ease"></div>
    </div>`;
  list.appendChild(topBar);

  const sorted = [...allBills].sort((a,b)=>a.paid-b.paid);

  sorted.forEach(bill=>{
    const amtDisplay = bill.paid && bill.paidAmt!=null
      ? fmt(bill.paidAmt)
      : bill.fixed && bill.amt>0 ? fmt(bill.amt) : '—';

    const wrap = document.createElement('div');
    wrap.dataset.id = bill.id;
    wrap.style.cssText = `
      display:flex;align-items:center;gap:10px;
      padding:11px 12px;
      border-radius:14px;
      margin-bottom:8px;
      background:${bill.paid ? 'rgba(34,197,94,0.06)' : bill._virtual ? 'rgba(239,68,68,0.04)' : 'var(--card2)'};
      border:1px solid ${bill.paid ? 'rgba(34,197,94,0.2)' : bill._virtual ? 'rgba(239,68,68,0.2)' : 'var(--border2)'};
      transition:all .25s ease;
      cursor:default;
      min-width:0;
    `;

    wrap.innerHTML = `
      <!-- Bolinha checkbox -->
      <button
        onclick="toggleBillPaid(${bill._virtual ? "'"+bill.id+"'" : bill.id})"
        title="${bill.paid?'Marcar como não paga':'Marcar como paga'}"
        style="
          width:28px;height:28px;border-radius:50%;flex-shrink:0;cursor:pointer;
          border:2px solid ${bill.paid ? 'var(--green)' : bill._virtual ? 'rgba(239,68,68,0.4)' : 'var(--muted2)'};
          background:${bill.paid ? 'var(--green)' : 'transparent'};
          display:flex;align-items:center;justify-content:center;
          transition:all .2s ease;
          font-size:13px;
          color:#000;
        "
      >${bill.paid ? '✓' : ''}</button>

      <!-- Ícone -->
      <div style="
        width:34px;height:34px;border-radius:10px;flex-shrink:0;
        background:${bill._virtual ? bill.clr+'20' : 'rgba(255,255,255,0.05)'};
        border:1px solid ${bill._virtual ? bill.clr+'40' : 'rgba(255,255,255,0.08)'};
        display:flex;align-items:center;justify-content:center;font-size:16px;
        filter:${bill.paid?'grayscale(0.5)':'none'};
        transition:filter .3s;
      ">${bill.ico}</div>

      <!-- Info -->
      <div style="flex:1;min-width:0;overflow:hidden">
        <div style="
          display:flex;align-items:center;gap:6px;
          text-decoration:${bill.paid?'line-through':'none'};
          text-decoration-color:rgba(255,255,255,0.25);
          flex-wrap:nowrap;overflow:hidden;min-width:0;
        ">
          <span style="color:${bill.paid?'var(--muted)':'var(--text)'};font-size:13px;font-weight:600;transition:color .2s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1">${bill.name}</span>
          ${bill.fixed
            ? '<span style="background:var(--card2);border:1px solid var(--border2);color:var(--muted);font-size:10px;padding:2px 6px;border-radius:5px;font-weight:500">fixo</span>'
            : '<span style="background:rgba(245,158,11,0.12);color:var(--amber);font-size:10px;padding:2px 6px;border-radius:5px;font-weight:500">variável</span>'}
        </div>
        <div style="font-size:11px;margin-top:2px;color:${bill.paid?'var(--green)':'var(--muted)'};font-weight:500">
          ${bill.paid ? '✓ Paga este mês' : 'Vence dia '+bill.day}
        </div>
      </div>

      <!-- Valor -->
      <div style="text-align:right;flex-shrink:0;margin-right:4px">
        <div style="font-family:var(--num);font-size:15px;font-weight:700;color:${bill.paid?'var(--green)':bill.fixed&&bill.amt>0?'var(--text)':'var(--muted)'}">
          ${amtDisplay}
        </div>
        ${!bill.fixed&&!bill.paid?'<div style="color:var(--muted);font-size:10px;margin-top:1px">a informar</div>':''}
      </div>

      <!-- Editar / ir ao cartão -->
      ${bill._virtual
        ? `<button onclick="openCCBillPreview('${bill._ccId}')" style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:5px 9px;color:#f87171;font-size:11px;font-weight:600;flex-shrink:0;cursor:pointer">ver →</button>`
        : `<button onclick="openEditBill(${bill.id})" style="background:var(--card2);border:1px solid var(--border2);border-radius:8px;width:30px;height:30px;color:var(--muted);font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s">✎</button>`
      }
    `;
    list.appendChild(wrap);
  });
}

function toggleBillPaid(id){
  // Verificar se é virtual (fatura de cartão)
  if(typeof id === 'string' && id.startsWith('cc_')){
    const cardId = parseInt(id.replace('cc_',''));
    const card   = cards.find(c=>c.id===cardId);
    if(!card) return;
    // Achar o mês correto da fatura (igual ao renderBills)
    let fat = 0, fatM = new Date().getMonth(), fatY = new Date().getFullYear();
    for(let off=0; off<=2; off++){
      const {m:mm, y:yy} = getCardMonth(off);
      const f = billsForMonth(card,mm,yy).reduce((s,b)=>s+b.amt,0);
      if(f>0){ fat=f; fatM=mm; fatY=yy; break; }
    }
    if(fat<=0) return;
    let entry = fixedBills.find(b=>b._ccId===cardId);
    if(entry && entry.paid){
      // Desmarcar
      const idx = txs.findIndex(t=>t._billId===entry.id);
      if(idx!==-1) txs.splice(idx,1);
      entry.paid=false; entry.paidAmt=null;
    } else {
      if(!entry){
        const MONTHS_SHORT=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        entry = {id:Date.now(), _ccId:cardId, name:card.name+' · fatura '+MONTHS_SHORT[fatM], ico:'💳', fixed:true, amt:fat, day:card.dueDay||10, paid:false};
        fixedBills.push(entry);
      } else {
        entry.amt = fat; // atualiza valor caso tenha mudado
      }
      entry.paid=true; entry.paidAmt=fat;
      const tx={id:Date.now()+1,_billId:entry.id,name:entry.name,cat:'cartão',amt:-fat,date:new Date().toISOString().split('T')[0],isnew:true};
      txs.unshift(tx);
      showToast({name:entry.name,cat:'outros',amt:-fat});
    }
    renderBills(); renderOverview(); autosave();
    return;
  }

  const bill = fixedBills.find(b=>b.id===id);
  if(!bill) return;
  if(bill.paid){
    const idx = txs.findIndex(t=>t._billId===id);
    if(idx!==-1) txs.splice(idx,1);
    bill.paid=false; bill.paidAmt=null;
    renderBills(); try{ renderOverview(); }catch(e){} autosave();
  } else {
    // Sempre abre modal para selecionar conta de onde sai o dinheiro
    openPayBill(id);
  }
}

let _payBillAccountId = null;

function renderPayBillAccountChips(){
  const el = document.getElementById('pay-bill-account-chips');
  if(!el) return;
  el.innerHTML = '';
  // Apenas contas que têm pelo menos uma renda vinculada
  const accountsWithIncome = bankAccounts.filter(acc =>
    incomes.some(inc => String(inc.accountId) === String(acc.id))
  );
  if(!accountsWithIncome.length){
    // Se não há contas vinculadas a renda, mostrar todas
    bankAccounts.forEach(acc => makePayChip(acc));
  } else {
    accountsWithIncome.forEach(acc => makePayChip(acc));
  }
  function makePayChip(acc){
    const sid = String(acc.id);
    const active = String(_payBillAccountId) === sid;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.accid = sid;
    chip.dataset.clr = acc.clr;
    if(active) chip.dataset.selected = '1';
    chip.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${active?acc.clr+'28':chipInactiveBg()};border:1px solid ${active?acc.clr+'70':chipInactiveBorder()};color:${active?acc.clr:chipInactiveColor()}`;
    chip.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${acc.clr};display:inline-block"></span>${acc.name}`;
    chip.onclick = () => {
      el.querySelectorAll('button').forEach(b => {
        delete b.dataset.selected;
        b.style.background = 'rgba(255,255,255,0.04)';
        b.style.borderColor = 'rgba(255,255,255,0.08)';
        b.style.color = 'var(--muted)';
      });
      chip.dataset.selected = '1';
      chip.style.background = acc.clr+'28';
      chip.style.borderColor = acc.clr+'70';
      chip.style.color = acc.clr;
      _payBillAccountId = sid;
    };
    el.appendChild(chip);
    // Auto-selecionar o primeiro
    if(!_payBillAccountId && el.querySelectorAll('button').length === 1) chip.click();
  }
}

function openPayBill(id){
  payingBillId = id;
  _payBillAccountId = null;
  const bill = fixedBills.find(b => b.id === id);
  document.getElementById('pay-bill-ttl').textContent = 'Pagar — ' + bill.name;
  if(bill.fixed && bill.amt > 0){
    document.getElementById('pay-bill-hint').innerHTML = `Valor fixo: <b style="color:#fff">${fmt(bill.amt)}</b>. Confirme ou altere se vier diferente.`;
    document.getElementById('pay-bill-amt').value = fmtForInput(bill.amt);
  } else {
    document.getElementById('pay-bill-hint').textContent = 'Informe o valor desta fatura:';
    document.getElementById('pay-bill-amt').value = '';
  }
  renderPayBillAccountChips();
  openM('m-pay-bill');
}

function payBill(){
  const amt = parseMaskedAmt(document.getElementById('pay-bill-amt').value);
  if(!amt) return;
  const bill = fixedBills.find(b=>b.id===payingBillId);
  bill.paid=true; bill.paidAmt=amt;
  const tx={id:Date.now(),_billId:bill.id,name:bill.name,cat:'outros',amt:-amt,date:new Date().toISOString().split('T')[0],isnew:true};
  if(_payBillAccountId) tx.accountId = _payBillAccountId;
  txs.unshift(tx);
  showToast({name:bill.name,cat:'outros',amt:-amt});
  try{ renderOverview(); }catch(e){}
  renderBills(); autosave();
  closeM('m-pay-bill');
}

function openEditBill(id){
  editingBillId = id;
  const bill = fixedBills.find(b => b.id === id);
  document.getElementById('eb-name').value  = bill.name;
  document.getElementById('eb-amt').value   = bill.amt ? fmtForInput(bill.amt) : '';
  document.getElementById('eb-day').value   = bill.day;
  document.getElementById('eb-fixed').checked = bill.fixed;
  // Ícone
  const prev = document.getElementById('eb-ico-preview');
  if(prev) prev.textContent = bill.ico || '📋';
  document.getElementById('eb-ico-picker').style.display='none';
  // Popular grid de ícones
  const grid = document.getElementById('eb-ico-grid');
  if(grid){
    grid.innerHTML='';
    BILL_ICOS.forEach(ico=>{
      const btn=document.createElement('button');
      btn.style.cssText='background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:6px;font-size:18px;cursor:pointer;transition:all .12s;aspect-ratio:1';
      btn.textContent=ico;
      btn.onclick=()=>{
        document.getElementById('eb-ico-preview').textContent=ico;
        document.getElementById('eb-ico-picker').style.display='none';
        grid.querySelectorAll('button').forEach(b=>b.style.background='rgba(255,255,255,0.04)');
        btn.style.background='rgba(34,197,94,0.2)';
      };
      grid.appendChild(btn);
    });
  }
  openM('m-edit-bill');
}
function toggleEbIcoPicker(){
  const p=document.getElementById('eb-ico-picker');
  p.style.display=p.style.display==='none'?'block':'none';
}

function saveFixedBill(){
  const bill = fixedBills.find(b => b.id === editingBillId);
  bill.ico   = document.getElementById('eb-ico-preview').textContent || bill.ico;
  bill.name  = document.getElementById('eb-name').value.trim() || bill.name;
  bill.amt   = parseMaskedAmt(document.getElementById('eb-amt').value) || 0;
  bill.day   = parseInt(document.getElementById('eb-day').value) || bill.day;
  bill.fixed = document.getElementById('eb-fixed').checked;
  renderBills(); autosave();
  closeM('m-edit-bill');
}

function deleteFixedBill(){
  DB.deleteFixedBill(editingBillId);
  fixedBills = fixedBills.filter(b => b.id !== editingBillId);
  renderBills(); autosave();
  closeM('m-edit-bill');
}

function addFixedBill(){
  const name  = document.getElementById('fb-name').value.trim();
  const amt   = parseMaskedAmt(document.getElementById('fb-amt').value) || 0;
  const ico   = selectedBillIco || '📋';
  const cat   = document.getElementById('fb-cat-custom').value.trim() || selectedBillCat || 'Outros';
  const day   = parseInt(document.getElementById('fb-day').value) || 0;
  const fixed = document.getElementById('fb-fixed').checked;

  // Validação por campo
  const missing = [];
  if(!name) missing.push('Nome da conta');
  if(!amt)  missing.push('Valor');
  if(!day)  missing.push('Dia de vencimento');
  if(missing.length){
    showAlert(
      'Por favor preencha: ' + missing.join(', ') + '.',
      'Campos obrigatórios',
      '📝'
    );
    return;
  }

  fixedBills.push({id:Date.now(), name, ico, cat, amt, day, fixed, paid:false, paidAmt:null});
  renderBills(); autosave();
  closeM('m-bill-new');
  ['fb-name','fb-amt','fb-day'].forEach(id => document.getElementById(id).value='');
  document.getElementById('fb-fixed').checked = true;
  document.getElementById('fb-variable-hint').style.display = 'none';
}


