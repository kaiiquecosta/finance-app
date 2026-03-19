/* cards.view.js — Cartões, faturas, limite */

// ── CARDS ──
function getCardMonth(off){
  const _n=new Date();
  let m=_n.getMonth()+off,y=_n.getFullYear();
  while(m<0){m+=12;y--;}while(m>11){m-=12;y++;}
  return{m,y};
}
function billsForMonth(card,m,y){
  return card.bills.filter(b=>{
    const d=new Date(b.date);
    let fm=d.getMonth(),fy=d.getFullYear();
    if(d.getDate()>card.closeDay){fm++;if(fm>11){fm=0;fy++;}}
    return fm===m&&fy===y;
  });
}
function renderCreditLimit(){
  const el = document.getElementById('ov-credit-avail');
  if(!el) return;
  // Fatura aberta = mês onde os novos gastos estão caindo agora
  const today = new Date();
  const totalBills = cards.reduce((s,c)=>{
    let cm = today.getMonth(), cy = today.getFullYear();
    if(today.getDate() > c.closeDay){ cm++; if(cm>11){cm=0;cy++;} }
    return s + billsForMonth(c,cm,cy).reduce((ss,b)=>ss+b.amt,0);
  },0);
  const totalLimit = cards.reduce((s,c)=>s+c.limit,0);
  const avail = totalLimit - totalBills;
  el.textContent = fmt(avail);
  const sub = document.getElementById('ov-credit-sub');
  if(sub) sub.textContent = `de ${fmt(totalLimit)} de limite total`;
  const cMini = document.getElementById('ov-cards-mini');
  if(cMini){
    cMini.innerHTML='';
    cards.forEach(c=>{
      let cm = today.getMonth(), cy = today.getFullYear();
      if(today.getDate() > c.closeDay){ cm++; if(cm>11){cm=0;cy++;} }
      const bill = billsForMonth(c,cm,cy).reduce((s,b)=>s+b.amt,0);
      const av = c.limit - bill;
      const d = document.createElement('div');
      d.className='stat-row';
      d.innerHTML=`<span class="stat-label" style="display:flex;align-items:center;gap:6px"><span style="background:${c.clr}20;border:1px solid ${c.clr}40;border-radius:6px;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:10px">💳</span>${c.name}</span><span style="text-align:right"><div class="num-sm num-green">${fmt(av)}</div><div style="color:var(--muted);font-size:10px">disponível</div></span>`;
      cMini.appendChild(d);
    });
  }
}
function chCardMonth(dir){cardMonthOff+=dir;renderCards();}


// ── PICKER DE MÊS/ANO ──
let _pickerYear = new Date().getFullYear();

function toggleCardMonthPicker(){
  const picker = document.getElementById('card-month-picker');
  if(picker.style.display==='none'){
    _pickerYear = getCardMonth(cardMonthOff).y;
    renderMonthPicker();
    picker.style.display='block';
    // Fechar ao clicar fora
    setTimeout(()=>document.addEventListener('click', _closePicker, {once:true}), 10);
  } else {
    picker.style.display='none';
  }
}
function _closePicker(e){
  const p = document.getElementById('card-month-picker');
  const lbl = document.getElementById('card-month-lbl');
  if(p && !p.contains(e.target) && !lbl.contains(e.target)) p.style.display='none';
}
function shiftPickerYear(dir){
  _pickerYear += dir;
  renderMonthPicker();
}
function goPickerToday(){
  document.getElementById('card-month-picker').style.display='none';
  autoNavToCurrentBill();
  renderCards();
}
function renderMonthPicker(){
  document.getElementById('picker-year-lbl').textContent = _pickerYear;
  const realNow = new Date();
  // Mostrar botão "voltar" se o ano exibido não é o ano atual
  const todayBtn = document.getElementById('picker-today-btn');
  if(todayBtn) todayBtn.style.display = (_pickerYear !== realNow.getFullYear()) ? 'block' : 'none';
  const grid = document.getElementById('picker-months-grid');
  grid.innerHTML='';
  const {m:curM, y:curY} = getCardMonth(cardMonthOff);
  MONTHS.forEach((mn,mi)=>{
    const isActive = mi===curM && _pickerYear===curY;
    const btn = document.createElement('button');
    btn.textContent = mn;
    btn.style.cssText = `
      padding:7px 4px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
      font-family:var(--font);transition:all .15s;
      background:${isActive?'var(--green)':'rgba(255,255,255,0.05)'};
      border:1px solid ${isActive?'var(--green)':'rgba(255,255,255,0.07)'};
      color:${isActive?'#000':'var(--muted)'};
    `;
    btn.onmouseenter=()=>{if(!isActive){btn.style.background='rgba(255,255,255,0.1)';btn.style.color='#fff';}};
    btn.onmouseleave=()=>{if(!isActive){btn.style.background='rgba(255,255,255,0.05)';btn.style.color='var(--muted)';}};
    btn.onclick=(e)=>{
      e.stopPropagation();
      // Calcular offset relativo
      const now = new Date();
      const diff = (_pickerYear - now.getFullYear())*12 + (mi - now.getMonth());
      cardMonthOff = diff;
      document.getElementById('card-month-picker').style.display='none';
      renderCards();
    };
    grid.appendChild(btn);
  });
}

// Navegar automaticamente para o mês da fatura vigente
function autoNavToCurrentBill(){
  if(!cards.length) return;
  const now = new Date();
  // Descobrir qual é a fatura aberta agora (considerando closeDay do primeiro cartão)
  // Se hoje > closeDay, a fatura aberta é o próximo mês
  const refCard = cards[0];
  let cm = now.getMonth(), cy = now.getFullYear();
  if(now.getDate() > refCard.closeDay){ cm++; if(cm>11){cm=0;cy++;} }
  // Calcular o offset relativo ao mês calendário atual
  const baseM = now.getMonth(), baseY = now.getFullYear();
  const diffM = (cy - baseY) * 12 + (cm - baseM);
  cardMonthOff = diffM;
}

function renderCards(){
  const{m,y}=getCardMonth(cardMonthOff);
  // Atualizar label com só texto (span ▾ está no HTML)
  const lbl = document.getElementById('card-month-lbl');
  if(lbl) lbl.childNodes[0].textContent = MONTHS_FULL[m]+' de '+y+' ';
  const total=cards.reduce((s,c)=>s+billsForMonth(c,m,y).reduce((ss,b)=>ss+b.amt,0),0);
  document.getElementById('card-total').textContent=fmt(total);

  // chart
  const chartEl=document.getElementById('card-chart'),lblEl=document.getElementById('card-chart-lbl');
  chartEl.innerHTML='';lblEl.innerHTML='';
  const months6=[];for(let i=-4;i<=1;i++){const{m:mm,y:yy}=getCardMonth(cardMonthOff+i);months6.push({m:mm,y:yy,isCur:i===0});}
  const vals=months6.map(({m:mm,y:yy})=>cards.reduce((s,c)=>s+billsForMonth(c,mm,yy).reduce((ss,b)=>ss+b.amt,0),0));
  const maxV=Math.max(...vals,1);
  months6.forEach(({m:mm,isCur},i)=>{
    const v=vals[i],pct=Math.max((v/maxV)*100,v>0?3:0);
    const off=i-4; // offset relativo ao cardMonthOff atual
    const bw=document.createElement('div');bw.className='chart-bar-wrap';
    bw.style.cursor='pointer';
    bw.title=`${MONTHS[mm]}: ${fmt(v)}`;
    bw.innerHTML=`<div class="chart-bar" style="height:${Math.max(pct,3)}%;background:${isCur?'var(--green)':chartBarInactive()};transition:background .2s"></div>`;
    bw.onmouseenter=()=>bw.querySelector('.chart-bar').style.background=isCur?'var(--green)':'rgba(100,116,139,0.5)';
    bw.onmouseleave=()=>bw.querySelector('.chart-bar').style.background=isCur?'var(--green)':chartBarInactive();
    bw.onclick=()=>{cardMonthOff+=off;renderCards();};
    chartEl.appendChild(bw);

    const lbl=document.createElement('div');lbl.className='chart-lbl';
    lbl.textContent=MONTHS[mm];
    lbl.style.cssText=`color:${isCur?'var(--green)':'var(--muted)'};font-weight:${isCur?'700':'400'};cursor:pointer;transition:color .15s`;
    lbl.onmouseenter=()=>{if(!isCur)lbl.style.color='var(--text)';};
    lbl.onmouseleave=()=>{if(!isCur)lbl.style.color='var(--muted)';};
    lbl.onclick=()=>{cardMonthOff+=off;renderCards();};
    lblEl.appendChild(lbl);
  });

  const list=document.getElementById('cards-list');list.innerHTML='';
  cards.forEach(card=>{
    const bills=billsForMonth(card,m,y);
    const fatTotal=bills.reduce((s,b)=>s+b.amt,0);
    const avail=card.limit-fatTotal;
    const usedPct=Math.min((fatTotal/card.limit)*100,100);
    const div=document.createElement('div');
    div.innerHTML=`
      <div class="cc-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;border-radius:12px;background:${card.clr}20;border:1px solid ${card.clr}40;display:flex;align-items:center;justify-content:center;font-size:18px">💳</div>
            <div>
              <div style="color:var(--text);font-size:15px;font-weight:700;font-family:var(--num)">${card.name}</div>
              <div style="color:var(--muted);font-size:12px">${card.type||'Crédito'}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;position:relative;z-index:1">
            <button onclick="openLimitModal(${card.id})" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:7px 10px;color:var(--muted);font-size:13px;font-weight:600" title="Ajustar limite">✏️</button>
            <button onclick="openBill(${card.id})" style="background:${card.clr}20;border:1px solid ${card.clr}40;border-radius:8px;padding:7px 14px;color:${card.clr};font-size:12px;font-weight:600">+ Lançar</button>
          </div>
        </div>
        <div style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Fatura estimada</div>
        <div class="num-xl" style="margin-bottom:10px">${fmt(fatTotal)}</div>
        <div style="display:flex;gap:20px;margin-bottom:16px">
          <span style="color:var(--muted);font-size:12px">Fecha <b style="color:var(--text)">dia ${card.closeDay}</b></span>
          <span style="color:var(--muted);font-size:12px">Vence <b style="color:var(--text)">${card.dueDay} de ${MONTHS[m]}.</b></span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px">
          <span style="color:var(--muted);font-size:12px">Limite total</span>
          <span style="color:var(--text);font-size:12px;font-weight:600;font-family:var(--num)">R$ ${(card.limit/1000).toFixed(1)}k</span>
        </div>
        <div class="prog" style="height:7px;margin-bottom:8px">
          <div class="prog-fill" style="width:${usedPct}%;background:linear-gradient(90deg,#3b82f6,#8b5cf6)"></div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--blue);font-size:12px;font-weight:600">● Usado <span style="color:var(--text);font-family:var(--num)">${fmt(fatTotal)}</span></span>
          <span style="color:var(--green);font-size:12px;font-weight:600">● Disponível <span style="color:var(--text);font-family:var(--num)">${fmt(avail)}</span></span>
        </div>
        ${bills.length?`
        <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:12px">
          <div style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px">Lançamentos (${bills.length})</div>
          ${bills.slice(0,5).map(b=>`<div class="stat-row"><span class="stat-label">${b.desc}</span><span class="stat-val" style="color:var(--red)">-${fmt(b.amt)}</span></div>`).join('')}
          ${bills.length>5?`<div style="color:var(--muted);font-size:12px;text-align:center;padding-top:6px">+${bills.length-5} mais</div>`:''}
        </div>`:`<div style="color:var(--muted);font-size:12px;text-align:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">Sem lançamentos neste mês</div>`}
      </div>`;
    list.appendChild(div);
  });
}


// ── CARDS CRUD ──
function addCard(){
  const name=document.getElementById('c-name').value.trim();
  const limit=parseMaskedAmt(document.getElementById('c-limit').value)||0;
  const closeDay=parseInt(document.getElementById('c-close').value)||0;
  const dueDay=parseInt(document.getElementById('c-due').value)||0;
  const missing=[];
  if(!name)     missing.push('Nome do cartão');
  if(!limit)    missing.push('Limite');
  if(!closeDay) missing.push('Dia de fechamento');
  if(!dueDay)   missing.push('Dia de vencimento');
  if(missing.length){ showAlert('Por favor preencha: '+missing.join(', ')+'.','Campos obrigatórios','📝'); return; }
  cards.push({id:Date.now(),name,limit,closeDay,dueDay,clr:selectedCardColor||'#8b5cf6',bills:[]});
  renderCards();closeM('m-card');renderCreditLimit();
  ['c-name','c-limit','c-close','c-due'].forEach(id=>document.getElementById(id).value='');
  autosave();
}

// ── AJUSTE DE LIMITE ──
let _limitCardId = null;
let _limitPending = null; // valor pendente (ajustado pelos botões ou digitado)

function openLimitModal(cardId){
  const card = cards.find(c=>c.id===cardId);
  if(!card) return;
  _limitCardId = cardId;
  _limitPending = card.limit; // parte do limite atual

  const nameEl = document.querySelector('#m-limit-card-name span:last-child');
  if(nameEl) nameEl.textContent = card.name;
  document.getElementById('limit-new-val').value = '';
  _updateLimitUI();
  openM('m-limit');
}

function _updateLimitUI(){
  const card = cards.find(c=>c.id===_limitCardId);
  if(!card) return;
  const orig = card.limit;
  const pending = _limitPending;
  const diff = pending - orig;
  const sign = diff >= 0 ? '+' : '';

  document.getElementById('m-limit-current').textContent = fmt(orig);

  const prev = document.getElementById('limit-preview');
  if(!prev) return;
  if(pending === orig){
    prev.style.display = 'none';
    return;
  }
  prev.style.display = 'block';
  prev.style.background = diff >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
  prev.style.borderColor = diff >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)';
  prev.style.color = diff >= 0 ? '#4ade80' : '#f87171';
  prev.textContent = `Novo limite: ${fmt(pending)} (${sign}${fmt(Math.abs(diff))})`;
}

function quickLimit(delta){
  _limitPending = Math.max(1, (_limitPending || 0) + delta);
  // Limpa o campo de texto para não conflitar
  document.getElementById('limit-new-val').value = '';
  _updateLimitUI();
}

function previewLimit(input){
  const val = parseMaskedAmt(input.value);
  const card = cards.find(c=>c.id===_limitCardId);
  if(!card) return;
  // Se o campo estiver vazio, volta para o limite original
  _limitPending = val > 0 ? val : card.limit;
  _updateLimitUI();
}

function saveLimit(){
  const card = cards.find(c=>c.id===_limitCardId);
  if(!card) return;
  if(_limitPending === card.limit){ closeM('m-limit'); return; }
  if(_limitPending < 1){ showAlert('O limite deve ser maior que zero.','Valor inválido','⚠️'); return; }
  card.limit = _limitPending;
  renderCards(); renderCreditLimit(); autosave();
  closeM('m-limit');
  showSaveToast('Limite atualizado para ' + fmt(card.limit), 'var(--green)');
}

let currentBillType = 'simples';
let selectedCardColor = '#8b5cf6';

const CARD_BANKS = [
  {name:'Nubank',          clr:'#8b5cf6'},
  {name:'Itaú',            clr:'#f97316'},
  {name:'Bradesco',        clr:'#ef4444'},
  {name:'Santander',       clr:'#dc2626'},
  {name:'Caixa',           clr:'#3b82f6'},
  {name:'Banco do Brasil', clr:'#eab308'},
  {name:'Inter',           clr:'#f97316'},
  {name:'C6 Bank',         clr:'#6b7280'},
  {name:'BTG',             clr:'#1d4ed8'},
  {name:'XP',              clr:'#111827'},
  {name:'Rico',            clr:'#60a5fa'},
  {name:'Sofisa',          clr:'#22c55e'},
  {name:'PicPay',          clr:'#10b981'},
  {name:'Neon',            clr:'#06b6d4'},
  {name:'Sicredi',         clr:'#16a34a'},
  {name:'Sicoob',          clr:'#15803d'},
  {name:'Mercado Pago',    clr:'#3b82f6'},
  {name:'Outro',           clr:'#64748b'},
];
const CARD_COLORS = ['#8b5cf6','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#06b6d4','#ec4899','#6b7280','#1d4ed8'];

function initCardModal(){
  selectedCardColor = CARD_COLORS[0];
  document.getElementById('c-name').value  = '';
  document.getElementById('c-limit').value = '';
  document.getElementById('c-close').value = '';
  document.getElementById('c-due').value   = '';

  // Presets de bancos
  const presetsEl = document.getElementById('card-bank-presets');
  if(presetsEl){
    presetsEl.innerHTML = '';
    CARD_BANKS.forEach(b => {
      const chip = document.createElement('button');
      chip.style.cssText = `background:${b.clr}18;border:1px solid ${b.clr}35;border-radius:8px;padding:6px 12px;color:${b.clr};font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s`;
      chip.textContent = b.name;
      chip.onmouseenter = ()=>chip.style.background=b.clr+'30';
      chip.onmouseleave = ()=>chip.style.background=b.clr+'18';
      chip.onclick = () => {
        document.getElementById('c-name').value = b.name;
        selectCardColor(b.clr);
        // Destaca chip selecionado
        presetsEl.querySelectorAll('button').forEach(x=>x.style.outline='none');
        chip.style.outline = `2px solid ${b.clr}`;
      };
      presetsEl.appendChild(chip);
    });
  }

  // Paleta de cores
  const dotsEl = document.getElementById('card-color-dots');
  if(dotsEl){
    dotsEl.innerHTML = '';
    CARD_COLORS.forEach(clr => {
      const dot = document.createElement('div');
      dot.style.cssText = `width:28px;height:28px;border-radius:50%;background:${clr};cursor:pointer;border:3px solid ${clr===selectedCardColor?'#fff':'transparent'};transition:all .15s;box-sizing:border-box`;
      dot.onclick = () => selectCardColor(clr);
      dotsEl.appendChild(dot);
    });
  }
}

function selectCardColor(clr){
  selectedCardColor = clr;
  document.querySelectorAll('#card-color-dots div').forEach(d=>{
    d.style.border = d.style.background===clr ? '3px solid #fff' : '3px solid transparent';
  });
}

function setBillType(t){
  currentBillType = t;
  ['simples','parcelado','assinatura'].forEach(x=>{
    const b=document.getElementById('btype-'+x);
    if(b) b.classList.toggle('active-freq', x===t);
  });
  document.getElementById('b-parcels-wrap').style.display = t==='parcelado'?'block':'none';
  document.getElementById('b-sub-wrap').style.display    = t==='assinatura'?'block':'none';
  const descEl = document.getElementById('b-desc');
  if(descEl){
    if(t==='assinatura') descEl.placeholder = 'Descrição (ex: Netflix, Spotify...)';
    else if(t==='parcelado') descEl.placeholder = 'Descrição (ex: iPhone, PS5...)';
    else descEl.placeholder = 'Descrição (ex: Mercado, Farmácia...)';
  }
}

function openBill(cardId){
  billCardId = cardId;
  const card = cards.find(c=>c.id===cardId);
  document.getElementById('bill-ttl').textContent = 'Lançar em ' + card.name;
  document.getElementById('b-desc').value    = '';
  document.getElementById('b-amt').value     = '';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  // Máximo: último dia do mês atual
  const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().split('T')[0];
  const dateEl = document.getElementById('b-date');
  dateEl.value = todayStr;
  dateEl.max   = lastDay;
  document.getElementById('b-parcels').value = '';
  document.getElementById('b-paid').value    = '';
  document.getElementById('b-sub-day').value = '';
  setBillType('simples');
  openM('m-bill');
}

function checkCardLimit(inp){
  const card = cards.find(c=>c.id===billCardId);
  if(!card) return;
  const warn = document.getElementById('bill-limit-warn');
  if(!warn) return;
  const amt = parseMaskedAmt(inp.value)||0;
  const today = new Date();
  let cm = today.getMonth(), cy = today.getFullYear();
  if(today.getDate() > card.closeDay){ cm++; if(cm>11){cm=0;cy++;} }
  const used = billsForMonth(card,cm,cy).reduce((s,b)=>s+b.amt,0);
  const avail = card.limit - used;
  if(amt <= 0){ warn.style.display='none'; return; }
  if(amt > avail){
    warn.style.display='block';
    warn.style.background='rgba(239,68,68,0.1)';
    warn.style.border='1px solid rgba(239,68,68,0.3)';
    warn.style.color='#f87171';
    warn.innerHTML=`🚫 Limite insuficiente. Disponível: <b>${fmt(avail)}</b>`;
  } else if(avail - amt <= 200){
    warn.style.display='block';
    warn.style.background='rgba(245,158,11,0.08)';
    warn.style.border='1px solid rgba(245,158,11,0.25)';
    warn.style.color='#fbbf24';
    warn.innerHTML=`⚠️ Atenção: restará apenas <b>${fmt(avail-amt)}</b> de limite após esse lançamento.`;
  } else {
    warn.style.display='none';
  }
}

function addBill(){
  const desc = document.getElementById('b-desc').value.trim();
  const amt  = parseMaskedAmt(document.getElementById('b-amt').value);
  const date = document.getElementById('b-date').value;
  const type = currentBillType;

  // Validação por campo e por tipo
  const missing=[];
  if(!desc) missing.push('Descrição');
  if(!amt)  missing.push('Valor');
  if(!date) missing.push('Data');
  if(type==='parcelado' && !parseInt(document.getElementById('b-parcels').value)) missing.push('Número de parcelas');
  if(type==='assinatura' && !parseInt(document.getElementById('b-sub-day').value)) missing.push('Dia de cobrança');
  if(missing.length){ showAlert('Por favor preencha: '+missing.join(', ')+'.','Campos obrigatórios','📝'); return; }

  const card = cards.find(c=>c.id===billCardId);
  if(!card) return;

  // Bloquear data fora do mês atual
  const _now = new Date();
  const _maxDate = new Date(_now.getFullYear(), _now.getMonth()+1, 0).toISOString().split('T')[0];
  const _minDate = new Date(_now.getFullYear(), _now.getMonth(), 1).toISOString().split('T')[0];
  if(date > _maxDate || date < _minDate){
    showSaveToast('Data inválida','#f87171','⚠️ Atenção','Lançamentos devem ser no mês atual.');
    return;
  }
  const _today = new Date();
  let _cm = _today.getMonth(), _cy = _today.getFullYear();
  if(_today.getDate() > card.closeDay){ _cm++; if(_cm>11){_cm=0;_cy++;} }
  const _used = billsForMonth(card,_cm,_cy).reduce((s,b)=>s+b.amt,0);
  const _avail = card.limit - _used;
  const _chkAmt = (type==='parcelado') ? +(amt/(parseInt(document.getElementById('b-parcels').value)||2)).toFixed(2) : amt;
  if(_chkAmt > _avail){
    const warn = document.getElementById('bill-limit-warn');
    if(warn){ warn.style.display='block'; warn.style.background='rgba(239,68,68,0.1)'; warn.style.border='1px solid rgba(239,68,68,0.3)'; warn.style.color='#f87171'; warn.innerHTML=`🚫 Limite insuficiente. Disponível: <b>${fmt(_avail)}</b>`; }
    return;
  }

  if(type === 'simples'){
    card.bills.push({id:Date.now(), desc, amt, date});

  } else if(type === 'parcelado'){
    const parcels   = parseInt(document.getElementById('b-parcels').value) || 2;
    const alreadyPaid = Math.max(0, Math.min(parseInt(document.getElementById('b-paid').value)||0, parcels-1));
    const parcelAmt = +(amt/parcels).toFixed(2);
    const colors    = ['#3b82f6','#8b5cf6','#f59e0b','#22c55e','#ec4899'];

    // Parcelas já pagas ficam no passado (não aparecem na fatura atual)
    for(let i=1; i<=alreadyPaid; i++){
      const d = new Date(date);
      d.setMonth(d.getMonth() - (alreadyPaid - i + 1));
      card.bills.push({id:Date.now()+i, desc:`${desc} (${i}/${parcels})`, amt:parcelAmt, date:d.toISOString().split('T')[0], _pastPaid:true});
    }

    // Parcelas restantes a partir da data informada
    const remaining = parcels - alreadyPaid;
    for(let i=0; i<remaining; i++){
      const d = new Date(date);
      d.setMonth(d.getMonth()+i);
      const num = alreadyPaid + 1 + i;
      card.bills.push({id:Date.now()+100+i, desc:`${desc} (${num}/${parcels})`, amt:parcelAmt, date:d.toISOString().split('T')[0]});
    }

    // Parcelamentos gerados automaticamente a partir de card.bills em renderInst()

  } else if(type === 'assinatura'){
    const day = parseInt(document.getElementById('b-sub-day').value) || new Date(date).getDate();
    card.bills.push({id:Date.now(), desc, amt, date, recurring:true});
    const subIcos = {netflix:'🎬',spotify:'🎵',disney:'🏰',youtube:'▶️',amazon:'📦',hbo:'🎭',apple:'🍎',canva:'🎨',adobe:'📐'};
    const ico = Object.entries(subIcos).find(([k])=>desc.toLowerCase().includes(k))?.[1] || '📱';
    subscriptions.push({id:Date.now()+1, name:desc, amt, day, ico, clr:'#8b5cf6', cardId:billCardId});
    renderSubs();
  }

  renderCards(); closeM('m-bill'); autosave();
  renderCreditLimit();
  try{ renderOverview(); }catch(e){}
}


