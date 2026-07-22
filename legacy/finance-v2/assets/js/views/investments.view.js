/* investments.view.js — Investimentos, resgate, mercado */

// ── INVESTIMENTOS ──
let investments = [];
let _cdiAnual = null;
let _ipca = null;
let _invType = 'cdb';
let _invAccountId = null;

function renderInvAccountChips(){
  const el = document.getElementById('inv-account-chips');
  if(!el) return;
  el.innerHTML='';
  if(!bankAccounts.length){
    el.innerHTML='<span style="color:var(--muted);font-size:12px">Nenhuma conta cadastrada.</span>';
    return;
  }
  bankAccounts.forEach(acc=>{
    const sid = String(acc.id);
    const active = _invAccountId === sid;
    const chip = document.createElement('button');
    chip.type='button';
    chip.dataset.accid = sid;
    chip.style.cssText=`display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${active?acc.clr+'28':chipInactiveBg()};border:1px solid ${active?acc.clr+'70':chipInactiveBorder()};color:${active?acc.clr:chipInactiveColor()}`;
    chip.innerHTML=`<span style="width:7px;height:7px;border-radius:50%;background:${acc.clr};display:inline-block"></span>${acc.name}`;
    chip.onclick=()=>{
      _invAccountId = sid;
      renderInvAccountChips();
      document.getElementById('inv-account-err').style.display='none';
    };
    el.appendChild(chip);
  });
}

const INV_BANKS = [
  {name:'Nubank',clr:'#8b5cf6'},{name:'Itaú',clr:'#f97316'},{name:'Bradesco',clr:'#ef4444'},
  {name:'Santander',clr:'#dc2626'},{name:'Caixa',clr:'#3b82f6'},{name:'Banco do Brasil',clr:'#eab308'},
  {name:'Inter',clr:'#f97316'},{name:'C6 Bank',clr:'#6b7280'},{name:'BTG',clr:'#1d4ed8'},
  {name:'XP',clr:'#111827'},{name:'Rico',clr:'#60a5fa'},{name:'Sofisa',clr:'#22c55e'},
  {name:'PicPay',clr:'#10b981'},{name:'Neon',clr:'#06b6d4'},{name:'Sicredi',clr:'#16a34a'},
  {name:'Sicoob',clr:'#15803d'},{name:'Mercado Pago',clr:'#3b82f6'},{name:'Tesouro Direto',clr:'#22c55e'},
  {name:'Renda Fixa',clr:'#8b5cf6'},{name:'Outro',clr:'#64748b'},
];

function toggleInvBankPicker(){
  const picker = document.getElementById('inv-bank-picker');
  if(picker.style.display==='none'){
    picker.style.display='block';
    renderInvBankList('');
    setTimeout(()=>{
      const searchEl = document.getElementById('inv-bank-search');
      searchEl.focus();

      // Navegação por teclado
      searchEl.onkeydown = (e)=>{
        const list = document.getElementById('inv-bank-list');
        if(!list || !list._filtered) return;
        const total = list._filtered.length;
        if(total===0) return;

        if(e.key==='ArrowDown'){
          e.preventDefault();
          const next = list._highlighted < total-1 ? list._highlighted+1 : 0;
          highlightInvBank(next);
        } else if(e.key==='ArrowUp'){
          e.preventDefault();
          const prev = list._highlighted > 0 ? list._highlighted-1 : total-1;
          highlightInvBank(prev);
        } else if(e.key==='Enter'){
          e.preventDefault();
          e.stopPropagation();
          if(list._highlighted >= 0 && list._filtered[list._highlighted]){
            selectInvBank(list._filtered[list._highlighted]);
          }
        } else if(e.key==='Escape'){
          picker.style.display='none';
        }
      };

      document.addEventListener('click', _closeInvBankPicker, {once:true});
    },10);
  } else {
    picker.style.display='none';
  }
}

function _closeInvBankPicker(e){
  const wrap = document.getElementById('inv-bank-wrap');
  if(wrap && !wrap.contains(e.target)){
    const picker = document.getElementById('inv-bank-picker');
    if(picker) picker.style.display='none';
  } else {
    document.addEventListener('click', _closeInvBankPicker, {once:true});
  }
}

function filterInvBanks(q){
  renderInvBankList(q);
}

function renderInvBankList(q){
  const list = document.getElementById('inv-bank-list');
  if(!list) return;
  const filtered = INV_BANKS.filter(b=>b.name.toLowerCase().includes(q.toLowerCase()));
  list.innerHTML='';
  filtered.forEach((b, idx)=>{
    const item = document.createElement('button');
    item.type='button';
    item.dataset.idx = idx;
    item.style.cssText=`width:100%;background:none;border:none;padding:8px 10px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:10px;font-family:var(--font);transition:background .1s`;
    item.innerHTML=`<span style="width:10px;height:10px;border-radius:50%;background:${b.clr};flex-shrink:0;display:inline-block"></span><span style="color:var(--text);font-size:13px;font-weight:500">${b.name}</span>`;
    item.onmouseenter=()=>{ highlightInvBank(idx); };
    item.onmouseleave=()=>item.style.background='none';
    item.onclick=()=>selectInvBank(b);
    list.appendChild(item);
  });
  if(!filtered.length) list.innerHTML='<div style="color:var(--muted);font-size:12px;padding:8px 10px">Nenhum banco encontrado.</div>';
  list._filtered = filtered;
  list._highlighted = -1;
}

function highlightInvBank(idx){
  const list = document.getElementById('inv-bank-list');
  if(!list) return;
  list._highlighted = idx;
  list.querySelectorAll('button').forEach((btn, i)=>{
    btn.style.background = i===idx ? 'rgba(255,255,255,0.1)' : 'none';
  });
  // Scroll para o item visível
  const btn = list.querySelectorAll('button')[idx];
  if(btn) btn.scrollIntoView({block:'nearest'});
}

function selectInvBank(b){
  document.getElementById('inv-bank').value = b.name;
  const lbl = document.getElementById('inv-bank-label');
  lbl.innerHTML=`<span style="width:10px;height:10px;border-radius:50%;background:${b.clr};display:inline-block"></span><span style="color:var(--text)">${b.name}</span>`;
  document.getElementById('inv-bank-btn').style.color='var(--text)';
  document.getElementById('inv-bank-picker').style.display='none';
}

function setInvType(t){
  _invType = t;
  const allTypes = ['cdb','lci','ipca','selic','acoes','acoeseua','fii','cripto','poupanca','outro'];
  allTypes.forEach(x=>{
    const b = document.getElementById('invt-'+x);
    if(b) b.classList.toggle('active-freq', x===t);
  });

  const usePct    = ['cdb','lci','selic'].includes(t);
  const useSpread = t==='ipca';
  const useYield  = ['acoes','acoeseua','fii','cripto','outro'].includes(t);
  const useTicker = ['acoes','acoeseua','fii'].includes(t);

  document.getElementById('inv-pct-wrap').style.display    = usePct    ? 'block' : 'none';
  document.getElementById('inv-spread-wrap').style.display = useSpread ? 'block' : 'none';
  document.getElementById('inv-yield-wrap').style.display  = useYield  ? 'block' : 'none';
  document.getElementById('inv-ticker-wrap').style.display = useTicker ? 'block' : 'none';

  const descs = {
    cdb:      '🏦 Rende % do CDI. IR regressivo (22,5% → 15%). Garantido pelo FGC até R$ 250k.',
    lci:      '🌿 LCI/LCA: isento de IR para pessoa física. Rende % do CDI.',
    ipca:     '📊 Tesouro IPCA+: protege da inflação + taxa real. IR regressivo.',
    selic:    '🏛️ Tesouro Selic: rende próximo 100% CDI. Liquidez diária. IR regressivo.',
    acoes:    '📈 Ações brasileiras (B3). Rentabilidade estimada — ganhos reais podem variar. IR 15% sobre lucro.',
    acoeseua: '🇺🇸 Ações americanas. Rentabilidade estimada em USD. IR 15% sobre lucro + câmbio.',
    fii:      '🏢 Fundos Imobiliários. Dividendos mensais isentos de IR para PF. Rentabilidade estimada.',
    cripto:   '₿ Criptomoedas. Alta volatilidade. IR 15% sobre lucro acima de R$ 35k/mês.',
    poupanca: '🐷 Poupança: rende 70% da Selic quando Selic > 8,5% a.a. Isento de IR.',
    outro:    '📁 Outro investimento. Informe a rentabilidade estimada anual.',
  };
  const descEl = document.getElementById('inv-type-desc');
  if(descEl){ descEl.style.display='block'; descEl.textContent=descs[t]||''; }

  // Atualizar placeholder do % CDI para Selic
  const pctInp = document.getElementById('inv-pct');
  if(pctInp){
    if(t==='selic') pctInp.placeholder = '% do CDI (Tesouro Selic ≈ 100%)';
    else            pctInp.placeholder = '% do CDI (ex: 105)';
  }
}

async function fetchCDI(){
  const el = document.getElementById('inv-cdi-label');
  const dt = document.getElementById('inv-cdi-date');
  try {
    // API BACEN série 4391 = CDI acumulado no mês (% a.a.)
    // Série 4389 = CDI % a.a. (taxa anual) — mais confiável
    const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json');
    if(!res.ok) throw new Error();
    const data = await res.json();
    const val = parseFloat(data[0].valor.replace(',','.'));
    _cdiAnual = val / 100;
    if(el) el.textContent = val.toFixed(2).replace('.',',') + '% a.a.';
    // O BACEN publica com 1 dia útil de defasagem — isso é normal
    const refDate = data[0].data;
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const label = refDate === todayStr ? 'atualizado hoje' : 'última divulgação: ' + refDate + ' (BACEN)';
    if(dt) dt.textContent = label;
    localStorage.setItem('finance_cdi_cache', JSON.stringify({val, date: data[0].data}));
  } catch(e){
    // Tentar cache salvo
    try {
      const cache = JSON.parse(localStorage.getItem('finance_cdi_cache')||'null');
      if(cache){ _cdiAnual = cache.val/100; if(el) el.textContent=cache.val.toFixed(2).replace('.',',')+'% a.a. (cache)'; if(dt) dt.textContent='última atualização '+cache.date; return; }
    } catch(e2){}
    // Fallback: CDI vigente ~10,65% a.a. (Selic março/2026)
    _cdiAnual = _cdiAnual || 0.1365;
    if(el) el.textContent = (_cdiAnual*100).toFixed(2).replace('.',',') + '% a.a. (offline)';
    if(dt) dt.textContent = 'sem conexão com o Banco Central';
  }
}

async function fetchIPCA(){
  try {
    const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json');
    if(!res.ok) throw new Error();
    const data = await res.json();
    _ipca = parseFloat(data[0].valor.replace(',','.')) / 100;
  } catch(e){
    _ipca = _ipca || 0.0450;
  }
}

function calcInvestment(inv){
  const today = new Date();
  const start = new Date(inv.date);
  const days  = Math.max(0, Math.floor((today - start) / 86400000));
  const years = days / 365;
  const cdi   = _cdiAnual || 0.1365;
  const ipca  = _ipca     || 0.0450;

  let grossRate = 0;
  let irAliquot = 0; // IR sobre o rendimento bruto

  switch(inv.type){
    case 'cdb':
    case 'lci':
    case 'selic':
      grossRate = Math.pow(1 + cdi * ((inv.pct||100) / 100), years) - 1;
      break;
    case 'ipca':
      grossRate = Math.pow(1 + ipca + ((inv.spread||0) / 100), years) - 1;
      break;
    case 'poupanca':
      // 70% da Selic quando Selic > 8,5% a.a.
      const selicRef = cdi;
      const poupRate = selicRef > 0.085 ? 0.70 * selicRef : 0.005 + ipca;
      grossRate = Math.pow(1 + poupRate, years) - 1;
      break;
    case 'acoes':
    case 'acoeseua':
    case 'fii':
    case 'cripto':
    case 'outro':
      // Usa rentabilidade estimada informada pelo usuário
      const yieldRate = (inv.yield || 10) / 100;
      grossRate = Math.pow(1 + yieldRate, years) - 1;
      break;
    default:
      grossRate = 0;
  }

  const grossAmt = inv.amount * grossRate;

  // Tabela de IR por tipo e prazo
  let ir = 0;
  if(inv.type === 'lci' || inv.type === 'poupanca'){
    ir = 0; // isento
  } else if(inv.type === 'fii'){
    ir = 0; // dividendos isentos para PF (simplificado)
  } else if(inv.type === 'acoes' || inv.type === 'acoeseua' || inv.type === 'cripto'){
    ir = grossAmt > 0 ? 0.15 : 0; // 15% sobre lucro (simplificado)
  } else {
    // Renda fixa: tabela regressiva
    if(days <= 180)      ir = 0.225;
    else if(days <= 360) ir = 0.20;
    else if(days <= 720) ir = 0.175;
    else                 ir = 0.15;
  }

  const netAmt = grossAmt * (1 - ir);
  return {days, grossAmt, netAmt, grossRate, ir};
}

function addInvestment(){
  const name   = document.getElementById('inv-name').value.trim();
  const bank   = document.getElementById('inv-bank').value.trim();
  const amount = parseMaskedAmt(document.getElementById('inv-amount').value);
  const date   = document.getElementById('inv-date').value;
  const pct    = parseFloat(document.getElementById('inv-pct').value)||0;
  const spread = parseFloat(document.getElementById('inv-spread').value)||0;
  const yieldEl = document.getElementById('inv-yield');
  const tickerEl = document.getElementById('inv-ticker');
  const yieldPct = yieldEl ? parseFloat(yieldEl.value)||0 : 0;
  const ticker   = tickerEl ? tickerEl.value.trim().toUpperCase() : '';

  const missing=[];
  if(!name)   missing.push('Nome');
  if(!amount) missing.push('Valor');
  if(!date)   missing.push('Data de aplicação');
  if(['cdb','lci','selic'].includes(_invType) && !pct) missing.push('% do CDI');
  if(_invType==='ipca' && !spread) missing.push('Taxa adicional ao IPCA');
  if(['acoes','acoeseua','fii','cripto','outro'].includes(_invType) && !yieldPct) missing.push('Rentabilidade estimada % a.a.');
  if(missing.length){ showAlert('Por favor preencha: '+missing.join(', ')+'.','Campos obrigatórios','📝'); return; }

  // Validar conta de origem
  if(!_invAccountId){
    document.getElementById('inv-account-err').style.display='block';
    document.getElementById('inv-account-chips').scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }

  const invId = Date.now();
  investments.push({id:invId, name, bank, amount, date, type:_invType, pct:['cdb','lci','selic'].includes(_invType)?pct:0, spread:_invType==='ipca'?spread:0, yield:['acoes','acoeseua','fii','cripto','outro'].includes(_invType)?yieldPct:0, ticker, accountId:_invAccountId});

  // Criar transação de débito na conta de origem
  txs.unshift({
    id: invId+1,
    name: '📈 Investimento: '+name+(bank?' · '+bank:''),
    cat: 'outros',
    amt: -amount,
    date,
    accountId: _invAccountId,
    _investmentId: invId,
    isnew: true
  });

  autosave();
  renderInvestments();
  try{ renderOverview(); }catch(e){}
  if(currentPage.v==='transactions') renderTxPage();
  closeM('m-invest');
  ['inv-name','inv-amount','inv-pct','inv-spread','inv-yield','inv-ticker'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('inv-bank').value='';
  document.getElementById('inv-date').value='';
  // Toast especial de investimento
  showInvestmentToast(name, bank, amount);
  _invAccountId = null;
}


// ── RESGATE DE INVESTIMENTO ──
let _rescueInvId = null;
let _rescueType = 'total';
let _rescueAccountId = null;
let _rescueNetAmt = 0;
let _rescueTotalWithYield = 0;

function openRescueModal(id){
  const inv = investments.find(i=>i.id===id);
  if(!inv) return;
  _rescueInvId = id;
  _rescueType = 'total';
  _rescueAccountId = null;

  const {grossAmt, netAmt, ir} = calcInvestment(inv);
  const totalWithYield = inv.amount + netAmt; // aplicado + rendimento líquido (já descontado IR)

  document.getElementById('rescue-inv-name').textContent = inv.name + (inv.bank ? ' · ' + inv.bank : '');
  document.getElementById('rescue-applied').textContent = fmt(inv.amount);
  document.getElementById('rescue-total').textContent = fmt(totalWithYield);
  // Guardar para não recalcular
  _rescueNetAmt = netAmt;
  _rescueTotalWithYield = totalWithYield;

  // Resetar UI
  setRescueType('total');
  document.getElementById('rescue-amt').value = '';
  document.getElementById('rescue-account-err').style.display = 'none';
  document.getElementById('rescue-preview').style.display = 'none';

  // Montar chips de conta
  const chips = document.getElementById('rescue-account-chips');
  chips.innerHTML = '';
  bankAccounts.forEach(acc => {
    const chip = document.createElement('button');
    chip.className = 'freq-btn';
    chip.style.cssText = 'font-size:12px;padding:6px 12px;display:flex;align-items:center;gap:6px';
    const accBal = getAccBalance(acc);
    chip.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${acc.clr||'#64748b'};display:inline-block"></span>${acc.name} <span style="color:${accBal>=0?'var(--muted)':'var(--red)'};font-size:10px">(${fmt(accBal)})</span>`;
    chip.onclick = () => {
      _rescueAccountId = acc.id;
      chips.querySelectorAll('button').forEach(b=>b.classList.remove('active-freq'));
      chip.classList.add('active-freq');
      document.getElementById('rescue-account-err').style.display = 'none';
      updateRescuePreview();
    };
    chips.appendChild(chip);
  });

  updateRescuePreview();
  openM('m-rescue');
}

function setRescueType(type){
  _rescueType = type;
  ['total','parcial'].forEach(t => {
    const btn = document.getElementById('rescue-type-'+t);
    if(btn) btn.classList.toggle('active-freq', t===type);
  });
  const wrap = document.getElementById('rescue-parcial-wrap');
  if(wrap) wrap.style.display = type==='parcial' ? 'block' : 'none';
  updateRescuePreview();
}

function updateRescuePreview(){
  const inv = investments.find(i=>i.id===_rescueInvId);
  if(!inv) return;
  const totalWithYield = _rescueTotalWithYield || (inv.amount + calcInvestment(inv).netAmt);

  let rescueAmt;
  if(_rescueType === 'total'){
    rescueAmt = totalWithYield;
  } else {
    rescueAmt = parseMaskedAmt(document.getElementById('rescue-amt').value) || 0;
  }

  const prev = document.getElementById('rescue-preview');
  if(!prev) return;
  if(!rescueAmt){ prev.style.display='none'; return; }

  prev.style.display = 'block';
  prev.innerHTML = `💰 Você receberá <strong>${fmt(rescueAmt)}</strong> na conta selecionada`;
}

function confirmRescue(){
  const inv = investments.find(i=>i.id===_rescueInvId);
  if(!inv) return;

  if(!_rescueAccountId){
    document.getElementById('rescue-account-err').style.display = 'block';
    return;
  }

  const totalWithYield = _rescueTotalWithYield || (inv.amount + calcInvestment(inv).netAmt);

  let rescueAmt;
  if(_rescueType === 'total'){
    rescueAmt = totalWithYield;
  } else {
    rescueAmt = parseMaskedAmt(document.getElementById('rescue-amt').value) || 0;
    if(!rescueAmt){ showAlert('Digite o valor a resgatar.','Campo obrigatório','📝'); return; }
    if(rescueAmt > totalWithYield){ showAlert('Valor maior que o total disponível ('+fmt(totalWithYield)+').','Valor inválido','⚠️'); return; }
  }

  const today = new Date().toISOString().split('T')[0];
  const acc = bankAccounts.find(a=>a.id===_rescueAccountId);

  // Lançar crédito na conta destino
  txs.unshift({
    id: Date.now(),
    name: '💰 Resgate: ' + inv.name,
    cat: 'receita',
    amt: rescueAmt,
    date: today,
    accountId: _rescueAccountId,
    isnew: true
  });

  // Atualizar saldo da conta destino
  if(acc) acc.balance = (acc.balance||0) + rescueAmt;

  // Resgate total: remove investimento; parcial: reduz o valor aplicado
  if(_rescueType === 'total'){
    investments = investments.filter(i=>i.id !== _rescueInvId);
  } else {
    // Reduz o valor aplicado proporcionalmente
    const ratio = rescueAmt / totalWithYield;
    inv.amount = Math.max(0, inv.amount - inv.amount * ratio);
    if(inv.amount < 1) investments = investments.filter(i=>i.id !== _rescueInvId);
  }

  autosave();
  renderInvestments();
  try{ renderOverview(); renderOverviewBankAccounts(); }catch(e){}
  if(currentPage.v==='transactions') renderTxPage();
  closeM('m-rescue');
  showSaveToast('Resgate de ' + fmt(rescueAmt) + ' para ' + (acc?acc.name:'conta'), 'var(--green)', '💰 Resgate realizado!');
}


// ── ATUALIZAÇÃO DIÁRIA DO RENDIMENTO ──
// Agenda re-render dos investimentos todo dia à meia-noite
(function scheduleDaily(){
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 1, 0);
  const msUntilMidnight = tomorrow - now;
  setTimeout(()=>{
    if(currentPage.v==='investments') renderInvestments();
    scheduleDaily(); // re-agenda para o dia seguinte
  }, msUntilMidnight);
})();

function deleteInvestment(id){
  if(!confirm('Remover este investimento?')) return;
  DB.deleteInvestment(id);
  investments=investments.filter(i=>i.id!==id);
  autosave();
  renderInvestments();
}

function renderInvestments(){
  const list=document.getElementById('inv-list');
  if(!list) return;
  list.innerHTML='';

  const distCard = document.getElementById('inv-dist-card');
  const distList = document.getElementById('inv-dist-list');

  if(!investments.length){
    list.innerHTML='<div style="color:var(--muted);text-align:center;padding:40px;line-height:2">Nenhum investimento cadastrado.<br><span style="font-size:12px">Clique em ＋ Adicionar para começar.</span></div>';
    document.getElementById('inv-total-applied').textContent=fmt(0);
    document.getElementById('inv-total-gross').textContent=fmt(0);
    document.getElementById('inv-total-net').textContent=fmt(0);
    if(distCard) distCard.style.display='none';
    return;
  }

  let totalApplied=0,totalGross=0,totalNet=0;
  const typeLabels={cdb:'CDB % CDI',lci:'LCI/LCA',ipca:'Tesouro IPCA+',selic:'Tesouro Selic',acoes:'Ações BR',acoeseua:'Ações EUA',fii:'FII',cripto:'Cripto',poupanca:'Poupança',outro:'Outro'};
  const typeIcons ={cdb:'🏦',lci:'🌿',ipca:'📊',selic:'🏛️',acoes:'📈',acoeseua:'🇺🇸',fii:'🏢',cripto:'₿',poupanca:'🐷',outro:'📁'};
  const typeColors={cdb:'#3b82f6',lci:'#22c55e',ipca:'#f59e0b',selic:'#60a5fa',acoes:'#22c55e',acoeseua:'#818cf8',fii:'#f97316',cripto:'#f59e0b',poupanca:'#34d399',outro:'#94a3b8'};
  const byType={};

  investments.forEach(inv=>{
    const {days,grossAmt,netAmt,ir}=calcInvestment(inv);
    totalApplied+=inv.amount; totalGross+=grossAmt; totalNet+=netAmt;
    if(!byType[inv.type]) byType[inv.type]=0;
    byType[inv.type]+=inv.amount;
    const clr=typeColors[inv.type]||'#8b5cf6';
    let rateLabel='';
    if(inv.type==='ipca') rateLabel=`IPCA + ${inv.spread}%`;
    else if(['cdb','lci','selic'].includes(inv.type)) rateLabel=`${inv.pct}% CDI`;
    else if(['acoes','acoeseua','fii','cripto','outro'].includes(inv.type)) rateLabel=`~${inv.yield||0}% a.a. estimado`;
    else rateLabel='';
    const isIsentoIR = ['lci','poupanca','fii'].includes(inv.type);
    const irLabel = isIsentoIR ? 'Isento IR' : `IR ${(ir*100).toFixed(1)}%`;
    const card=document.createElement('div');
    card.className='card fadein';
    card.style.marginBottom='12px';
    card.innerHTML=`
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:42px;height:42px;border-radius:12px;background:${clr}20;border:1px solid ${clr}40;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${typeIcons[inv.type]||'📈'}${inv.ticker?'<span style="font-size:9px;position:absolute;margin-top:22px;margin-left:-8px;color:'+clr+';font-weight:700">'+inv.ticker+'</span>':''}</div>
          <div>
            <div style="color:#fff;font-size:14px;font-weight:700">${inv.name}</div>
            <div style="color:var(--muted);font-size:11px;margin-top:2px">${inv.bank?inv.bank+' · ':''}${typeLabels[inv.type]||''} · ${rateLabel}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="openRescueModal(${inv.id})" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:5px 12px;color:#4ade80;font-size:12px;font-weight:600;cursor:pointer">💰 Resgatar</button>
          <button onclick="deleteInvestment(${inv.id})" style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:5px 9px;color:#f87171;font-size:12px;cursor:pointer">🗑</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
        <div style="background:var(--card2);border-radius:8px;padding:8px 10px;text-align:center">
          <div style="color:var(--muted);font-size:10px;margin-bottom:3px">Aplicado</div>
          <div style="color:${clr};font-family:var(--num);font-weight:700;font-size:13px">${fmt(inv.amount)}</div>
        </div>
        <div style="background:var(--card2);border-radius:8px;padding:8px 10px;text-align:center">
          <div style="color:var(--muted);font-size:10px;margin-bottom:3px">Rendimento bruto</div>
          <div style="color:var(--green);font-family:var(--num);font-weight:700;font-size:13px">+${fmt(grossAmt)}</div>
        </div>
        <div style="background:var(--card2);border-radius:8px;padding:8px 10px;text-align:center">
          <div style="color:var(--muted);font-size:10px;margin-bottom:3px">Líquido</div>
          <div style="color:#a78bfa;font-family:var(--num);font-weight:700;font-size:13px">+${fmt(netAmt)}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:var(--muted);font-size:11px">📅 ${days} dias · ${irLabel}</span>
        <span style="color:rgba(34,197,94,0.5);font-size:10px;font-weight:600" title="Rendimento atualizado diariamente">● hoje</span>
        <span style="color:var(--muted);font-size:11px">desde ${new Date(inv.date).toLocaleDateString('pt-BR')}</span>
      </div>`;
    list.appendChild(card);
  });

  document.getElementById('inv-total-applied').textContent=fmt(totalApplied);
  document.getElementById('inv-total-gross').textContent='+'+fmt(totalGross);
  document.getElementById('inv-total-net').textContent='+'+fmt(totalNet);

  // Distribuição por tipo
  if(distCard && distList){
    distCard.style.display='block';
    distList.innerHTML='';
    Object.entries(byType).sort((a,b)=>b[1]-a[1]).forEach(([type,val])=>{
      const pct = totalApplied>0 ? ((val/totalApplied)*100).toFixed(0) : 0;
      const clr = typeColors[type]||'#8b5cf6';
      const lbl = typeLabels[type]||type;
      const row = document.createElement('div');
      row.style.cssText='margin-bottom:10px';
      row.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <div style="display:flex;align-items:center;gap:7px">
            <span style="width:9px;height:9px;border-radius:50%;background:${clr};display:inline-block"></span>
            <span style="color:var(--text);font-size:13px;font-weight:600">${lbl}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:var(--muted);font-size:12px">${pct}%</span>
            <span style="color:${clr};font-family:var(--num);font-weight:700;font-size:13px">${fmt(val)}</span>
          </div>
        </div>
        <div style="height:6px;border-radius:6px;background:var(--border2);overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${clr};border-radius:6px;transition:width .4s"></div>
        </div>`;
      distList.appendChild(row);
    });
  }
}


// ── MERCADO FINANCEIRO ──
let _mktTab = 'indices';
let _mktData = null;
let _mktLoading = false;

function setMktTab(tab){
  _mktTab = tab;
  ['indices','crypto','stocks'].forEach(t=>{
    const b = document.getElementById('mkt-tab-'+t);
    if(b) b.classList.toggle('active-freq', t===tab);
  });
  renderMktContent();
}

const STOCKS_DATA = {
  us: [
    {symbol:'AAPL', shortName:'Apple Inc.',     regularMarketPrice:213.49, regularMarketChangePercent:-1.24, currency:'USD'},
    {symbol:'MSFT', shortName:'Microsoft',      regularMarketPrice:388.47, regularMarketChangePercent:-0.89, currency:'USD'},
    {symbol:'NVDA', shortName:'NVIDIA',         regularMarketPrice:114.58, regularMarketChangePercent:-2.15, currency:'USD'},
    {symbol:'GOOGL',shortName:'Alphabet',       regularMarketPrice:168.97, regularMarketChangePercent:-0.62, currency:'USD'},
    {symbol:'META', shortName:'Meta Platforms', regularMarketPrice:594.52, regularMarketChangePercent:-1.44, currency:'USD'},
    {symbol:'TSLA', shortName:'Tesla',          regularMarketPrice:238.01, regularMarketChangePercent:-4.66, currency:'USD'},
    {symbol:'AMZN', shortName:'Amazon',         regularMarketPrice:198.90, regularMarketChangePercent:-1.07, currency:'USD'},
  ],
  br: [
    {symbol:'PETR4',shortName:'Petrobras PN',  regularMarketPrice:37.89, regularMarketChangePercent:-1.12, currency:'BRL'},
    {symbol:'VALE3',shortName:'Vale ON',        regularMarketPrice:56.43, regularMarketChangePercent:-0.95, currency:'BRL'},
    {symbol:'ITUB4',shortName:'Itaú PN',        regularMarketPrice:36.12, regularMarketChangePercent:+0.28, currency:'BRL'},
    {symbol:'BBDC4',shortName:'Bradesco PN',    regularMarketPrice:14.85, regularMarketChangePercent:-1.06, currency:'BRL'},
    {symbol:'ABEV3',shortName:'Ambev ON',       regularMarketPrice:11.73, regularMarketChangePercent:+0.43, currency:'BRL'},
    {symbol:'WEGE3',shortName:'WEG ON',         regularMarketPrice:50.12, regularMarketChangePercent:+0.85, currency:'BRL'},
    {symbol:'MGLU3',shortName:'Magazine Luiza', regularMarketPrice:7.23,  regularMarketChangePercent:-2.43, currency:'BRL'},
    {symbol:'B3SA3',shortName:'B3 SA',          regularMarketPrice:11.95, regularMarketChangePercent:-0.54, currency:'BRL'},
  ],
  _dateRef: '14/03/2026'
};

async function loadMarketData(manual=false){
  if(_mktLoading) return;

  const updEl = document.getElementById('mkt-updated');
  const btn = document.querySelector('button[onclick="loadMarketData(true)"]');

  if(!manual){
    try {
      const cache = JSON.parse(localStorage.getItem('finance_mkt_cache')||'null');
      // Cache de 1 hora (3600000ms)
      if(cache && Date.now()-cache.ts < 3600000){
        _mktData = cache.data;
        if(!_mktData.stocks?.list?.length){
          _mktData.stocks = { us: STOCKS_DATA.us, br: STOCKS_DATA.br, list: [...STOCKS_DATA.us, ...STOCKS_DATA.br], _dateRef: STOCKS_DATA._dateRef };
        }
        _mktLoading = false;
        renderMktContent();
        // Sempre mostra "agora" ao entrar
        if(updEl) updEl.textContent = 'agora';
        setMktStatus();
        // Agenda atualização automática quando o cache de 1h expirar
        clearInterval(window._mktTimeInterval);
        clearTimeout(window._mktAutoRefresh);
        const remaining = 3600000 - (Date.now() - cache.ts);
        window._mktAutoRefresh = setTimeout(()=> loadMarketData(false), remaining);
        return;
      }
    } catch(e){}
  }

  if(manual && btn){
    btn.textContent = '⏳ Atualizando...';
    btn.disabled = true;
    btn.style.opacity = '0.6';
  }
  if(updEl) updEl.textContent = 'atualizando...';

  _mktLoading = true;
  const content = document.getElementById('mkt-content');
  if(content && !_mktData) content.innerHTML='<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">⏳ Buscando dados...</div>';

  const data = { indices:{}, crypto:{}, rates:{},
    stocks: { us: STOCKS_DATA.us, br: STOCKS_DATA.br, list: [...STOCKS_DATA.us, ...STOCKS_DATA.br], _dateRef: STOCKS_DATA._dateRef }
  };

  data.indices.selic = { val: _cdiAnual ? (_cdiAnual*100).toFixed(2) : '13.65', change: 0 };
  data.indices.cdi   = { val: _cdiAnual ? ((_cdiAnual/252)*100).toFixed(4) : '0.0527', change: 0 };

  try {
    const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
    const j = await r.json();
    if(j.USDBRL) data.rates.usd = { val: parseFloat(j.USDBRL.bid).toFixed(2), change: parseFloat(j.USDBRL.pctChange||0).toFixed(2) };
    if(j.EURBRL) data.rates.eur = { val: parseFloat(j.EURBRL.bid).toFixed(2), change: parseFloat(j.EURBRL.pctChange||0).toFixed(2) };
  } catch(e){}

  try {
    const r = await fetch('https://economia.awesomeapi.com.br/json/last/IBOVESPA-BRL');
    const j = await r.json();
    if(j.IBOVESPABRL) data.indices.ibov = { val: parseFloat(j.IBOVESPABRL.bid||0).toLocaleString('pt-BR',{maximumFractionDigits:0}), change: parseFloat(j.IBOVESPABRL.pctChange||0).toFixed(2) };
  } catch(e){}

  try {
    const r = await fetch('https://economia.awesomeapi.com.br/json/last/SP500-USD');
    const j = await r.json();
    if(j.SP500USD) data.indices.sp500 = { val: parseFloat(j.SP500USD.bid||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), change: parseFloat(j.SP500USD.pctChange||0).toFixed(2) };
  } catch(e){}

  try {
    const r = await fetch('https://economia.awesomeapi.com.br/json/last/BTC-USD,ETH-USD,SOL-USD');
    const j = await r.json();
    if(j.BTCUSD) data.crypto.btc = { val: parseFloat(j.BTCUSD.bid||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), change: parseFloat(j.BTCUSD.pctChange||0).toFixed(2) };
    if(j.ETHUSD) data.crypto.eth = { val: parseFloat(j.ETHUSD.bid||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), change: parseFloat(j.ETHUSD.pctChange||0).toFixed(2) };
    if(j.SOLUSD) data.crypto.sol = { val: parseFloat(j.SOLUSD.bid||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}), change: parseFloat(j.SOLUSD.pctChange||0).toFixed(2) };
  } catch(e){}

  _mktData = data;
  const now = Date.now();
  localStorage.setItem('finance_mkt_cache', JSON.stringify({data, ts: now}));
  _mktLoading = false;

  if(manual && btn){
    btn.textContent = '✓ Atualizado!';
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.background = 'rgba(34,197,94,0.15)';
    btn.style.borderColor = 'rgba(34,197,94,0.3)';
    btn.style.color = 'var(--green)';
    setTimeout(()=>{
      btn.textContent = '↻ Atualizar';
      btn.style.background = 'rgba(59,130,246,0.1)';
      btn.style.borderColor = 'rgba(59,130,246,0.2)';
      btn.style.color = 'var(--blue)';
    }, 2500);
  }

  if(updEl) updEl.textContent = 'agora';

  // Agenda próxima atualização automática em 1 hora
  clearInterval(window._mktTimeInterval);
  clearTimeout(window._mktAutoRefresh);
  window._mktAutoRefresh = setTimeout(()=> loadMarketData(false), 3600000);

  setMktStatus();
  renderMktContent();
}

function setMktStatus(){
  const now = new Date();
  const statusEl = document.getElementById('mkt-status');
  if(!statusEl) return;
  const h = now.getHours(), wd = now.getDay();
  const isOpen = h>=10 && h<18 && wd>=1 && wd<=5;
  statusEl.textContent = isOpen ? 'Aberto' : 'Fechado';
  statusEl.style.cssText = `font-size:11px;padding:3px 8px;border-radius:6px;font-weight:600;background:${isOpen?'rgba(34,197,94,0.12)':'rgba(255,255,255,0.06)'};color:${isOpen?'var(--green)':'var(--muted)'}`;
}

function getTimeAgo(t){
  const s = Math.floor((Date.now()-t)/1000);
  if(s<60) return s+'s';
  if(s<3600) return Math.floor(s/60)+'min';
  return Math.floor(s/3600)+'h';
}

function mktRow(icon, name, sub, val, change, prefix=''){
  const up = parseFloat(change)>=0;
  const chg = parseFloat(change);
  const arrow = chg===0?'':'<span style="font-size:10px">'+( up?'↗':'↘')+'</span>';
  const chgColor = chg===0?'var(--muted)': up?'var(--green)':'var(--red)';
  return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
    <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${icon}</div>
    <div style="flex:1;min-width:0">
      <div style="color:var(--text);font-size:13px;font-weight:600">${name}</div>
      <div style="color:var(--muted);font-size:11px">${sub}</div>
    </div>
    <div style="text-align:right">
      <div style="color:var(--text);font-family:var(--num);font-weight:700;font-size:13px">${prefix}${val||'–'}</div>
      <div style="color:${chgColor};font-size:11px;font-weight:600">${arrow} ${chg===0?'–':Math.abs(chg)+'%'}</div>
    </div>
  </div>`;
}

function renderMktContent(){
  const el = document.getElementById('mkt-content');
  if(!el) return;
  if(!_mktData){ el.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">Sem dados. Clique em ↻ Atualizar.</div>'; return; }
  const d = _mktData;
  let html = '';

  if(_mktTab==='indices'){
    if(d.indices.selic) html += mktRow('🏦','Selic','Taxa básica de juros',d.indices.selic.val+'%',0);
    if(d.indices.cdi)   html += mktRow('💰','CDI','% ao dia',d.indices.cdi.val+'%',0);
    if(d.indices.ibov)  html += mktRow('📊','Ibovespa','B3',d.indices.ibov.val+' pts',d.indices.ibov.change);
    if(d.indices.sp500) html += mktRow('🇺🇸','S&P 500','NYSE/NASDAQ',d.indices.sp500.val+' pts',d.indices.sp500.change);
    if(d.rates.usd)     html += mktRow('💵','Dólar','USD/BRL','R$ '+d.rates.usd.val,d.rates.usd.change);
    if(d.rates.eur)     html += mktRow('💶','Euro','EUR/BRL','R$ '+d.rates.eur.val,d.rates.eur.change);
  } else if(_mktTab==='crypto'){
    if(d.crypto.btc) html += mktRow('₿','Bitcoin','BTC/USD','US$ '+d.crypto.btc.val, d.crypto.btc.change);
    if(d.crypto.eth) html += mktRow('⬡','Ethereum','ETH/USD','US$ '+d.crypto.eth.val, d.crypto.eth.change);
    if(d.crypto.sol) html += mktRow('◎','Solana','SOL/USD','US$ '+d.crypto.sol.val, d.crypto.sol.change);
    if(!d.crypto.btc && !d.crypto.eth) html='<div style="color:var(--muted);text-align:center;padding:20px;font-size:13px">Sem dados. Clique em ↻ Atualizar.</div>';
  } else if(_mktTab==='stocks'){
    if(d.stocks.list?.length){
      const dateRef = d.stocks._dateRef||'';
      // Só mostra aviso se a data de referência for diferente de hoje
      const todayStr = new Date().toLocaleDateString('pt-BR');
      if(dateRef && dateRef !== todayStr){
        const isYesterday = (()=>{ const y=new Date(); y.setDate(y.getDate()-1); return y.toLocaleDateString('pt-BR')===dateRef; })();
        const label = isYesterday ? 'Dados de ontem (fechamento)' : `Fechamento de ${dateRef}`;
        html += `<div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:8px;padding:6px 12px;margin-bottom:10px;color:var(--amber);font-size:11px">⏱ ${label}</div>`;
      }
      const icons = {'AAPL':'🍎','MSFT':'🪟','NVDA':'💚','GOOGL':'🔍','META':'👤','TSLA':'⚡','AMZN':'📦','BRK-B':'🏛️','PETR4':'🛢️','VALE3':'⛏️','ITUB4':'🏦','BBDC4':'🏦','ABEV3':'🍺','WEGE3':'⚙️','MGLU3':'🛍️','B3SA3':'📊'};
      const exchanges = {'AAPL':'NASDAQ','MSFT':'NASDAQ','NVDA':'NASDAQ','GOOGL':'NASDAQ','META':'NASDAQ','TSLA':'NASDAQ','AMZN':'NASDAQ','BRK-B':'NYSE','PETR4':'B3','VALE3':'B3','ITUB4':'B3','BBDC4':'B3','ABEV3':'B3','WEGE3':'B3','MGLU3':'B3','B3SA3':'B3'};
      d.stocks.list.forEach(s=>{
        const isBR = s.currency==='BRL';
        const prefix = isBR ? 'R$ ' : 'US$ ';
        const priceStr = s.regularMarketPrice?.toLocaleString(isBR?'pt-BR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2})||'–';
        html += mktRow(icons[s.symbol]||'📈', s.shortName||s.symbol, s.symbol+' · '+(exchanges[s.symbol]||''), prefix+priceStr, (s.regularMarketChangePercent||0).toFixed(2));
      });
    } else {
      html='<div style="color:var(--muted);text-align:center;padding:20px;font-size:13px">Sem dados disponíveis.</div>';
    }
  }

  // Remove último border
  el.innerHTML = `<div style="margin-bottom:-10px">${html}</div>`;
}

// Enter para confirmar em qualquer modal aberto
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter') return;
  // Ignorar se o foco estiver em textarea
  if(document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;

  // Telas de auth (não são modais .open, são .auth-step.active)
  const authScreen = document.getElementById('auth-screen');
  if(authScreen && authScreen.style.display !== 'none'){
    const regName = document.getElementById('auth-register-name');
    const welcome = document.getElementById('auth-welcome');
    if(regName && regName.classList.contains('active')){ e.preventDefault(); registerStep1(); return; }
    if(welcome && welcome.classList.contains('active')){ e.preventDefault(); enterApp(); return; }
    return; // outras telas de auth (PIN) já têm listener próprio
  }

  // Mapeamento modal → função de confirmação
  const map = [
    { id: 'm-invest',     fn: ()=>addInvestment() },
    { id: 'm-edit',       fn: ()=>saveTx() },
    { id: 'm-receita',    fn: ()=>saveIncome() },
    { id: 'm-bill-new',   fn: ()=>addFixedBill() },
    { id: 'm-bill-edit',  fn: ()=>saveFixedBill() },
    { id: 'm-pay-bill',   fn: ()=>payBill() },
    { id: 'm-bank',       fn: ()=>addBankAccount() },
    { id: 'm-bill',       fn: ()=>addBill() },
    { id: 'm-card',       fn: ()=>addCard() },
    { id: 'm-goal',       fn: ()=>addGoal() },
    { id: 'm-dep',        fn: ()=>doDeposit() },
    { id: 'm-inst',       fn: ()=>addInst() },
    { id: 'm-sub',        fn: ()=>addSub() },
  ];

  for(const {id, fn} of map){
    const el = document.getElementById(id);
    if(el && el.classList.contains('open')){
      e.preventDefault();
      try{ fn(); }catch(err){ console.warn('Enter handler:', err); }
      return;
    }
  }
});
document.addEventListener('keydown', function(e){
  const authScreen = document.getElementById('auth-screen');
  if(!authScreen || authScreen.style.display==='none') return;

  const loginStep = document.getElementById('auth-pin-login');
  const regStep   = document.getElementById('auth-register-pin');
  const loginActive = loginStep && loginStep.classList.contains('active');
  const regActive   = regStep   && regStep.classList.contains('active');
  if(!loginActive && !regActive) return;

  if(e.key >= '0' && e.key <= '9'){
    e.preventDefault();
    if(loginActive) loginPinKey(e.key);
    else            regPinKey(e.key);
  } else if(e.key === 'Backspace'){
    e.preventDefault();
    if(loginActive) loginPinKey('del');
    else            regPinKey('del');
  } else if(e.key === 'Enter'){
    e.preventDefault();
    if(loginActive && loginPinBuf.length===4) checkLoginPin();
    else if(regActive && regPinBuf.length===4) handleRegPin();
  }
});



