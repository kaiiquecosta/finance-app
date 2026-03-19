/* overview.view.js — Dashboard principal */

// ── OVERVIEW ──
function renderOverview(){
  const now=new Date();
  document.getElementById('ov-date').textContent=now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const nowD=new Date();
  const curPrefix=nowD.getFullYear()+'-'+String(nowD.getMonth()+1).padStart(2,'0');
  const prevD=new Date(nowD.getFullYear(),nowD.getMonth()-1,1);
  const prevPrefix=prevD.getFullYear()+'-'+String(prevD.getMonth()+1).padStart(2,'0');
  const march=txs.filter(t=>t.date.startsWith(curPrefix));
  const feb=txs.filter(t=>t.date.startsWith(prevPrefix));
  const {inc,spt,bal}=totals(march);
  const {spt:sptPrev}=totals(feb);

  // hero
  document.getElementById('ov-spent-hero').textContent=fmt(spt);
  const diff=sptPrev>0?((spt-sptPrev)/sptPrev)*100:0;
  const vsPrev=document.getElementById('ov-vs-prev');
  vsPrev.textContent=(diff>=0?'↑':'')+Math.round(diff)+'%';
  vsPrev.style.color=diff>0?'var(--red)':'var(--green)';

  // top cat — todas as fontes de gasto: txs (PIX, débito, gasto rápido) + card.bills (fatura cartão)
  const byCat={};

  // Helper: infere categoria pelo nome/descrição quando não há cat definida
  function inferCat(desc, fallback){
    const d=(desc||'').toLowerCase();
    if(/ifood|rappi|uber.?eat|delivery|restaurante|lanche|pizza|sushi|comida|padaria|cafe|café|açaí|acai|sorvete|doce|hamburguer|burger/.test(d)) return 'alimentação';
    if(/mercado|supermercado|hortifruti|feira|sacolão|atacado/.test(d)) return 'mercado';
    if(/uber|99|taxi|combustivel|gasolina|estacionamento|pedágio|pedagio|passagem|ônibus|onibus|metrô|metro/.test(d)) return 'transporte';
    if(/netflix|spotify|disney|hbo|prime|youtube|streaming|deezer|globoplay|paramount|apple tv/.test(d)) return 'streaming';
    if(/farmacia|remedio|médico|medico|saude|saúde|hospital|exame|dentist|plano|unimed|amil/.test(d)) return 'saúde';
    if(/academia|gym|crossfit|smartfit/.test(d)) return 'saúde';
    if(/curso|faculdade|escola|livro|udemy|alura|dio|hotmart|educação|educacao/.test(d)) return 'educação';
    if(/hotel|airbnb|viagem|voo|aviao|avião|booking|decolar/.test(d)) return 'lazer';
    if(/kindle|macbook|iphone|samsung|notebook|celular|tablet|ps5|ps4|xbox|nintendo|switch|play|eletro|geladeira|fogão|fogao|ar.condicionado/.test(d)) return 'compras';
    if(/roupa|camiseta|calça|sapato|tênis|tenis|moda|zara|renner|c&a|hering/.test(d)) return 'compras';
    if(/pet|veterinario|veterinário|ração|racao/.test(d)) return 'outros';
    return fallback || 'outros';
  }

  // 1) Todas as txs de gasto (PIX, débito, gasto rápido, etc.) — exceto as que são pagamento de fatura (cat='cartão' com _billId)
  march.filter(t => t.amt < 0 && !(t.cat === 'cartão' && t._billId)).forEach(t => {
    const cat = (t.cat && t.cat !== 'outros' && t.cat !== 'cartão') ? t.cat : inferCat(t.name, t.cat || 'outros');
    byCat[cat] = (byCat[cat]||0) + Math.abs(t.amt);
  });

  // 2) Lançamentos da fatura do cartão do mês atual
  const _cm=nowD.getMonth(), _cy=nowD.getFullYear();
  cards.forEach(card=>{
    billsForMonth(card,_cm,_cy).forEach(b=>{
      if(b._pastPaid) return;
      const cat = inferCat(b.desc, 'compras');
      byCat[cat] = (byCat[cat]||0) + b.amt;
    });
  });
  const topCat=Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0];
  document.getElementById('ov-top-cat').textContent=topCat?`${CI[topCat[0]]} ${topCat[0]}`:'—';
  document.getElementById('ov-insight').textContent=topCat
    ?`Seu maior gasto este mês foi em ${topCat[0]} (${fmt(topCat[1])}). ${diff>20?'Seus gastos aumentaram '+Math.round(diff)+'% vs. mês passado. Que tal revisar?':'Você está no controle dos gastos este mês 👍'}`
    :'Adicione suas transações para ver insights personalizados.';

  // ov-balance é controlado por renderOverviewBankAccounts (saldo real das contas)
  document.getElementById('ov-inc').textContent=fmt(inc);
  document.getElementById('ov-spt').textContent=fmt(spt);
  const leftEl=document.getElementById('ov-left');
  leftEl.textContent=fmt(inc-spt);
  leftEl.style.color=(inc-spt)>=0?'var(--green)':'var(--red)';

  // rhythm + sparkline (elementos opcionais — só atualiza se existirem no DOM)
  const rhythmEl = document.getElementById('ov-rhythm');
  const rbEl = document.getElementById('ov-rhythm-badge');
  const rhythmSubEl = document.getElementById('ov-rhythm-sub');
  const sparkEl = document.getElementById('ov-sparkline');
  if(rhythmEl) rhythmEl.textContent = fmt(spt);
  if(rbEl) rbEl.innerHTML = `<span class="badge ${diff>0?'badge-red':'badge-green'}">${diff>0?'↑':'↓'}${Math.abs(Math.round(diff))}%</span>`;
  if(rhythmSubEl) rhythmSubEl.textContent = `vs R$ ${fmt(sptPrev)} mês anterior`;
  if(sparkEl){
    const daily={};
    march.filter(t=>t.amt<0).forEach(t=>{const d=t.date.split('-')[2];daily[d]=(daily[d]||0)+Math.abs(t.amt);});
    sparkEl.innerHTML='';
    const maxD=Math.max(...Object.values(daily),1);
    const todayDay=new Date().getDate();
    for(let d=1;d<=todayDay;d++){
      const v=daily[String(d).padStart(2,'0')]||0;
      const pct=Math.max((v/maxD)*100,2);
      const bar=document.createElement('div');
      bar.className='spark-bar';
      bar.style.cssText=`height:${pct}%;background:${v>0?'var(--green)':sparkBarEmpty()};flex:1;border-radius:2px`;
      sparkEl.appendChild(bar);
    }
  }

  // credit
  renderCreditLimit();

  // top cats
  const catsEl=document.getElementById('ov-cats');catsEl.innerHTML='';
  const maxCat=topCat?topCat[1]:1;
  Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([cat,v])=>{
    const pct=(v/maxCat)*100;
    const d=document.createElement('div');d.className='cat-row';
    d.innerHTML=`
      <div class="cat-name"><span>${CI[cat]||'💳'}</span>${cat}</div>
      <div class="cat-bar-wrap"><div class="prog"><div class="prog-fill" style="width:${pct}%;background:${CC[cat]||'#555'}"></div></div></div>
      <div class="cat-amt">${fmt(v)}</div>`;
    catsEl.appendChild(d);
  });

  // donut — gastos por categoria
  (function(){
    const svg = document.getElementById('ov-donut-svg');
    const legend = document.getElementById('ov-donut-legend');
    const totalEl = document.getElementById('ov-donut-total');
    const emptyEl = document.getElementById('ov-donut-empty');
    const wrapEl  = document.getElementById('ov-donut-wrap');
    if(!svg||!legend||!totalEl) return;

    const cats = Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
    const total = cats.reduce((s,[,v])=>s+v,0);

    // Paleta dinâmica — usa CC se existir, senão gera cor por índice
    const fallbackColors = ['#3b82f6','#f97316','#22c55e','#8b5cf6','#f59e0b','#ec4899','#38bdf8','#a78bfa','#fb923c','#34d399'];
    const getColor = (cat, i) => CC[cat] || fallbackColors[i % fallbackColors.length];

    if(!total){
      if(wrapEl)  wrapEl.style.display  = 'none';
      if(emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if(wrapEl)  wrapEl.style.display  = 'flex';
    if(emptyEl) emptyEl.style.display = 'none';

    totalEl.textContent = fmt(total);

    // SVG donut (viewBox 36x36, raio=15.9, cx=18, cy=18)
    const R = 15.9155, cx = 18, cy = 18;
    const circ = 2 * Math.PI * R; // ~100
    svg.innerHTML = '';

    // Track (fundo)
    const track = document.createElementNS('http://www.w3.org/2000/svg','circle');
    track.setAttribute('cx', cx); track.setAttribute('cy', cy);
    track.setAttribute('r', R);
    track.setAttribute('fill','none');
    track.setAttribute('stroke','rgba(255,255,255,0.06)');
    track.setAttribute('stroke-width','3.5');
    svg.appendChild(track);

    // Fatias
    let offset = 0;
    cats.forEach(([cat, val], i) => {
      const pct = val / total;
      const dash = pct * circ;
      const gap  = circ - dash;
      const clr  = getColor(cat, i);

      const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
      circle.setAttribute('r', R);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', clr);
      circle.setAttribute('stroke-width', '3.5');
      circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
      circle.setAttribute('stroke-dashoffset', -offset * circ);
      circle.setAttribute('stroke-linecap', 'round');
      circle.style.transition = 'stroke-dasharray .6s ease';
      svg.appendChild(circle);
      offset += pct;
    });

    // Legenda — linha com ícone, nome, barra de progresso e valor + %
    legend.innerHTML = '';
    const showCats = cats.slice(0, 6);
    if(cats.length > 6){
      const otherVal = cats.slice(6).reduce((s,[,v])=>s+v,0);
      showCats.push(['outros', otherVal]);
    }
    showCats.forEach(([cat, val], i) => {
      const pct = (val/total)*100;
      const pctRound = Math.round(pct);
      const clr = cat === 'outros' ? '#64748b' : getColor(cat, i);
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:20px 1fr auto;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)';
      row.innerHTML = `
        <div style="width:20px;height:20px;border-radius:6px;background:${clr}20;border:1px solid ${clr}40;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0">${CI[cat]||'💳'}</div>
        <div style="min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <span style="color:var(--text);font-size:11px;font-weight:600;text-transform:capitalize">${cat}</span>
            <span style="font-family:var(--num);font-size:10px;font-weight:700;color:${clr}">${pctRound}%</span>
          </div>
          <div style="height:3px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden">
            <div style="height:100%;width:${Math.max(pct,2)}%;background:${clr};border-radius:99px;transition:width .6s ease"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:var(--num);font-size:11px;font-weight:700;color:var(--text)">${fmt(val)}</div>
        </div>`;
      legend.appendChild(row);
    });
  })();

  // recent tx
  const recentEl=document.getElementById('ov-recent-tx');recentEl.innerHTML='';
  const _startOfMonth=new Date();_startOfMonth.setDate(1);const _startStr=_startOfMonth.toISOString().split('T')[0];
  txs.filter(t=>t.date>=_startStr).slice(0,6).forEach(tx=>{
    recentEl.appendChild(makeTxRow(tx,false));
  });

  renderUpcomingBills();
  renderAnnualView();
  renderInvestPotential();
  renderIncomes();
  renderOverviewCCBill();
  renderOverviewBankAccounts();
}

function renderOverviewCCBill(){
  const card = document.getElementById('ov-cc-bill-card');
  const listEl = document.getElementById('ov-cc-bill-list');
  const totalEl = document.getElementById('ov-cc-bill-total');
  if(!card || !listEl || !totalEl) return;

  const {m,y} = getCardMonth(0);
  let grandTotal = 0;
  listEl.innerHTML = '';

  // Assinaturas também aparecem como linha fixa
  const subTotal = subscriptions.reduce((s,sub)=>s+sub.amt, 0);

  cards.forEach(crd=>{
    let fat = 0;
    for(let off=0; off<=2; off++){
      const {m:mm,y:yy}=getCardMonth(off);
      const f=billsForMonth(crd,mm,yy).reduce((s,b)=>s+b.amt,0);
      if(f>0){fat=f;break;}
    }
    if(fat<=0) return;
    grandTotal += fat;
    const isPaid = !!(fixedBills.find(b=>b._ccId===crd.id&&b.paid));
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)';
    row.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:${crd.clr};flex-shrink:0;display:inline-block"></span>
      <span style="flex:1;color:${isPaid?'var(--muted)':'#fff'};font-size:13px;${isPaid?'text-decoration:line-through':''}">${crd.name}</span>
      ${isPaid?'<span style="color:var(--green);font-size:11px;font-weight:600">✓ paga</span>':''}
      <span style="color:${isPaid?'var(--green)':'var(--red)'};font-family:var(--num);font-weight:700;font-size:13px">${fmt(fat)}</span>`;
    listEl.appendChild(row);
  });

  if(subTotal>0){
    grandTotal += subTotal;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0';
    row.innerHTML = `<span style="font-size:14px">🔁</span><span style="flex:1;color:var(--muted);font-size:12px">Assinaturas (${subscriptions.length})</span><span style="color:var(--red);font-family:var(--num);font-weight:600;font-size:13px">${fmt(subTotal)}</span>`;
    listEl.appendChild(row);
  }

  if(grandTotal > 0){
    card.style.display = 'block';
    totalEl.textContent = fmt(grandTotal);
  } else {
    card.style.display = 'none';
  }
}


// ── GASTOS PREVISTOS (contas fixas próximos 3 meses) ──
function renderUpcomingBills(){
  const el = document.getElementById('ov-upcoming-bills');
  if(!el) return;
  el.innerHTML = '';

  if(!fixedBills.length){
    el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px 0">Nenhuma conta fixa cadastrada. <span style="color:var(--green);cursor:pointer" onclick="goPage(\'bills\')">Adicionar →</span></div>';
    return;
  }

  const today = new Date();
  const months = [0,1,2].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}) };
  });

  months.forEach(({year, month, label}, mi) => {
    const isCurrentMonth = mi === 0;
    const wrap = document.createElement('div');
    wrap.className = 'upcoming-month';

    // Total previsto para o mês
    const pendingBills = fixedBills.filter(b => {
      if(isCurrentMonth) return !b.paid; // mês atual: só as não pagas
      return true; // meses futuros: todas
    });
    const total = pendingBills.reduce((s,b) => s + (b.fixed ? b.amt : 0), 0);
    const varCount = pendingBills.filter(b=>!b.fixed).length;

    wrap.innerHTML = `
      <div class="upcoming-month-title">
        <span>${isCurrentMonth ? '📍 ' : ''}${label.charAt(0).toUpperCase()+label.slice(1)}</span>
        <span style="color:${isCurrentMonth?'var(--amber)':'var(--muted)'};font-family:var(--num);font-weight:700;font-size:13px">
          ${fmt(total)}${varCount>0?' + variáveis':''}
        </span>
      </div>`;

    pendingBills.forEach(b => {
      const row = document.createElement('div');
      row.className = 'upcoming-bill-row';
      const isPaid = isCurrentMonth && b.paid;
      row.innerHTML = `
        <div style="width:34px;height:34px;border-radius:10px;background:${isPaid?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.04)'};border:1px solid ${isPaid?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.07)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${b.ico}</div>
        <div style="flex:1">
          <div style="color:${isPaid?'var(--muted)':'#fff'};font-size:13px;font-weight:500;${isPaid?'text-decoration:line-through':''}">${b.name}</div>
          <div style="color:var(--muted);font-size:11px">dia ${b.day} · ${b.fixed?'fixo':'variável'}</div>
        </div>
        <div style="text-align:right">
          <div style="color:${isPaid?'var(--green)':b.fixed?'var(--red)':'var(--muted)'};font-family:var(--num);font-weight:600;font-size:13px">
            ${isPaid ? '✓ pago' : b.fixed ? fmt(b.amt) : '?'}
          </div>
        </div>`;
      wrap.appendChild(row);
    });

    el.appendChild(wrap);

    // Divisor entre meses
    if(mi < 2){
      const div = document.createElement('div');
      div.style.cssText = `height:1px;background:${isLightTheme()?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.06)'};margin:4px 0 16px`;
      el.appendChild(div);
    }
  });
}


// ── VISÃO ANUAL ──
function renderAnnualView(){
  const year = new Date().getFullYear();
  const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const currentMonth = new Date().getMonth();

  // Agregar por mês (transações + faturas de cartão)
  const byMonth = Array(12).fill(0).map(()=>({inc:0,spt:0}));
  txs.forEach(t => {
    const d = new Date(t.date);
    if(d.getFullYear() !== year) return;
    const m = d.getMonth();
    if(t.amt > 0) byMonth[m].inc += t.amt;
    else byMonth[m].spt += Math.abs(t.amt);
  });
  // Incluir faturas de cartão de cada mês
  cards.forEach(card=>{
    for(let mi=0;mi<12;mi++){
      const fat = billsForMonth(card,mi,year).reduce((s,b)=>s+b.amt,0);
      if(fat>0) byMonth[mi].spt += fat;
    }
  });
  // Incluir assinaturas como gasto mensal fixo
  subscriptions.forEach(sub=>{
    for(let mi=0;mi<12;mi++) byMonth[mi].spt += sub.amt;
  });

  const totalInc = byMonth.reduce((s,m)=>s+m.inc, 0);
  const totalSpt = byMonth.reduce((s,m)=>s+m.spt, 0);
  const bal = totalInc - totalSpt;
  const monthsWithData = byMonth.filter(m=>m.inc>0||m.spt>0).length || 1;

  document.getElementById('ov-annual-spent').textContent = fmt(totalSpt);
  const _yrLbl = document.getElementById('ov-annual-year-lbl'); if(_yrLbl) _yrLbl.textContent = 'gastos em '+new Date().getFullYear();
  document.getElementById('ov-annual-inc').textContent   = fmt(totalInc);
  document.getElementById('ov-annual-spt').textContent   = fmt(totalSpt);
  const balEl = document.getElementById('ov-annual-bal');
  balEl.textContent = fmt(bal);
  balEl.style.color = bal >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('ov-annual-avg').textContent = fmt(totalSpt / monthsWithData);

  // Barras
  const barsEl   = document.getElementById('ov-annual-bars');
  const labelsEl = document.getElementById('ov-annual-labels');
  barsEl.innerHTML = ''; labelsEl.innerHTML = '';

  const maxVal = Math.max(...byMonth.map(m=>m.spt), 1);

  // Tooltip flutuante para o mês selecionado
  let annualTooltip = document.getElementById('annual-tooltip');
  if(!annualTooltip){
    annualTooltip = document.createElement('div');
    annualTooltip.id = 'annual-tooltip';
    annualTooltip.style.cssText = 'position:absolute;background:#1e1e2e;border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:8px 12px;font-size:12px;color:#fff;pointer-events:none;display:none;z-index:10;min-width:140px;box-shadow:0 4px 20px rgba(0,0,0,0.4)';
    barsEl.parentElement.style.position='relative';
    barsEl.parentElement.appendChild(annualTooltip);
  }

  // Mês selecionado (começa no mês atual)
  if(typeof window._annualSelectedMonth === 'undefined') window._annualSelectedMonth = currentMonth;

  byMonth.forEach((m, i) => {
    const pct = Math.max((m.spt / maxVal) * 100, m.spt > 0 ? 4 : 0);
    const isActive = i === currentMonth;
    const isSelected = i === window._annualSelectedMonth;
    const hasFuture = i > currentMonth;
    const hasPast = i < currentMonth;

    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;cursor:pointer';

    const bar = document.createElement('div');
    bar.className = 'annual-bar' + (isActive ? ' active-month' : '');
    let bgColor;
    if(isSelected && !isActive) bgColor = '#a78bfa';
    else if(isActive) bgColor = '#60a5fa';
    else if(hasFuture) bgColor = chartBarFuture();
    else bgColor = chartBarPast();
    bar.style.cssText = `height:${Math.max(pct,3)}%;background:${bgColor};outline:${isSelected&&!isActive?'2px solid #a78bfa':'none'};border-radius:3px 3px 0 0;transition:all .2s`;

    // Clique → mostra detalhes do mês
    barWrap.onclick = () => {
      window._annualSelectedMonth = i;
      renderAnnualView(); // re-render para atualizar seleção
      // Mostrar painel de detalhes do mês
      showMonthDetail(i, year, m);
    };

    barWrap.onmouseenter = () => {
      annualTooltip.innerHTML = `<div style="color:var(--muted);font-size:10px;margin-bottom:3px">${monthNames[i]} ${year}</div><div style="color:var(--red);font-weight:700">${fmt(m.spt)} gastos</div><div style="color:var(--green);font-weight:600">${fmt(m.inc)} receitas</div>`;
      annualTooltip.style.display='block';
      const rect = barWrap.getBoundingClientRect();
      const parentRect = barsEl.parentElement.getBoundingClientRect();
      let left = rect.left - parentRect.left + rect.width/2 - 70;
      left = Math.max(0, Math.min(left, parentRect.width - 150));
      annualTooltip.style.left = left+'px';
      annualTooltip.style.top = '-70px';
    };
    barWrap.onmouseleave = () => { annualTooltip.style.display='none'; };

    barWrap.appendChild(bar);
    barsEl.appendChild(barWrap);

    const lbl = document.createElement('div');
    lbl.className = 'annual-lbl' + (isActive ? ' active-month' : '') + (isSelected&&!isActive ? ' selected-month' : '');
    if(isSelected&&!isActive) lbl.style.color='#a78bfa';
    lbl.style.cursor='pointer';
    lbl.textContent = monthNames[i];
    lbl.onclick = () => { window._annualSelectedMonth = i; renderAnnualView(); showMonthDetail(i, year, m); };
    labelsEl.appendChild(lbl);
  });

  // Se há mês selecionado diferente do atual, mostrar painel
  if(window._annualSelectedMonth !== currentMonth){
    showMonthDetail(window._annualSelectedMonth, year, byMonth[window._annualSelectedMonth]);
  }
}

function showMonthDetail(monthIdx, year, data){
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  let panel = document.getElementById('annual-month-detail');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'annual-month-detail';
    // Inserir após o container de barras
    const barsContainer = document.getElementById('ov-annual-bars');
    if(barsContainer) barsContainer.parentElement.insertAdjacentElement('afterend', panel);
  }

  const bal = data.inc - data.spt;
  panel.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:12px 16px;margin-top:12px;animation:fadein .2s ease';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="color:#fff;font-size:13px;font-weight:600">${monthNames[monthIdx]} ${year}</div>
      <button onclick="window._annualSelectedMonth=new Date().getMonth();renderAnnualView();this.closest('#annual-month-detail').style.display='none'" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:0">✕</button>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <div><div style="color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.6px">Gastos</div><div style="color:var(--red);font-family:var(--num);font-weight:700;font-size:15px">${fmt(data.spt)}</div></div>
      <div><div style="color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.6px">Receitas</div><div style="color:var(--green);font-family:var(--num);font-weight:700;font-size:15px">${fmt(data.inc)}</div></div>
      <div><div style="color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.6px">Saldo</div><div style="color:${bal>=0?'var(--green)':'var(--red)'};font-family:var(--num);font-weight:700;font-size:15px">${fmt(bal)}</div></div>
    </div>`;
}


// ── POTENCIAL DE INVESTIMENTO ──
function renderInvestPotential(){
  const year = new Date().getFullYear();
  const byMonth = {};
  txs.forEach(t => {
    const d = new Date(t.date);
    if(d.getFullYear() !== year) return;
    const k = d.getMonth();
    byMonth[k] = byMonth[k] || {inc:0, spt:0};
    if(t.amt > 0) byMonth[k].inc += t.amt;
    else byMonth[k].spt += Math.abs(t.amt);
  });

  const months = Object.values(byMonth);
  const mCount = months.length || 1;
  const avgInc = months.reduce((s,m)=>s+m.inc,0) / mCount;
  const avgSpt = months.reduce((s,m)=>s+m.spt,0) / mCount;
  const fixedTotal = fixedBills.filter(b=>b.fixed).reduce((s,b)=>s+b.amt, 0);
  const potential = Math.max(avgInc - avgSpt - fixedTotal, 0);

  document.getElementById('ov-invest-pot').textContent    = fmt(potential);
  document.getElementById('ov-invest-inc').textContent    = fmt(avgInc);
  document.getElementById('ov-invest-spt').textContent    = fmt(avgSpt);
  document.getElementById('ov-invest-fixed').textContent  = fmt(fixedTotal);
  document.getElementById('ov-invest-result').textContent = fmt(potential);

  // Cenários de projeção
  const scenEl = document.getElementById('ov-invest-scenarios');
  scenEl.innerHTML = '';

  if(potential <= 0){
    scenEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">Reduza seus gastos para liberar potencial de investimento.</div>';
    return;
  }

  const scenarios = [
    { label: '6 meses',   months:6,   rate:0.008  },
    { label: '1 ano',     months:12,  rate:0.008  },
    { label: '3 anos',    months:36,  rate:0.0085 },
    { label: '10 anos',   months:120, rate:0.009  },
  ];

  scenarios.forEach((s, i) => {
    // Juros compostos simples (aportes mensais)
    const fv = potential * ((Math.pow(1+s.rate, s.months) - 1) / s.rate);
    const isHighlight = i === 1;
    const div = document.createElement('div');
    div.className = 'invest-scenario';
    if(isHighlight) div.style.cssText += ';background:rgba(34,197,94,0.06);border-color:rgba(34,197,94,0.2)';
    div.innerHTML = `
      <span class="invest-label">${s.label} <span style="font-size:10px;opacity:.6">~${(s.rate*100).toFixed(1)}%/mês</span></span>
      <span class="invest-value ${isHighlight?'highlight':''}">${fmt(fv)}</span>`;
    scenEl.appendChild(div);
  });
}

function makeTxRow(tx,clickable=false){
  const d=document.createElement('div');d.className='tx-row fadein';
  const acc = tx.accountId ? bankAccounts.find(a=>String(a.id)===String(tx.accountId)) : null;
  const accTag = acc
    ? `<span style="display:inline-flex;align-items:center;gap:3px;background:${acc.clr}20;border:1px solid ${acc.clr}40;border-radius:6px;padding:2px 7px;font-size:10px;font-weight:600;color:${acc.clr}"><span style="width:5px;height:5px;border-radius:50%;background:${acc.clr};display:inline-block"></span>${acc.name}</span>`
    : '';
  const payM = tx.payMethod ? PAY_METHODS.find(p=>p.id===tx.payMethod) : null;
  const payTag = payM ? `<span style="display:inline-flex;align-items:center;gap:2px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:1px 6px;font-size:10px;color:var(--muted)">${payM.ico} ${payM.label}</span>` : '';
  d.innerHTML=`
    <div class="tx-ico" style="background:${CC[tx.cat]||'#333'}18;border:1px solid ${CC[tx.cat]||'#333'}28">${CI[tx.cat]||'💳'}</div>
    <div class="tx-info">
      <div class="tx-name">${tx.name}</div>
      <div class="tx-meta"><span class="badge badge-muted" style="padding:1px 7px">${tx.cat}</span>${payTag}${accTag}<span>${ago(tx.date)}</span></div>
    </div>
    <div class="tx-amt" style="color:${tx.amt>0?'var(--green)':'var(--red)'}">${tx.amt>0?'+':''}${fmt(tx.amt)}</div>`;
  if(clickable)d.style.cursor='pointer';
  if(clickable)d.onclick=()=>openEditTx(tx);
  return d;
}


// ── RECEITA RÁPIDA DO OVERVIEW ──
function openRendaModal(){
  editIncomeId = null;
  openM('m-receita');
  setTimeout(()=>{
    setRendaTab('recorrente');
    try{ document.getElementById('r-name').value=''; }catch(e){}
    try{ document.getElementById('r-amt').value=''; }catch(e){}
    try{ document.getElementById('r-date').value=new Date().toISOString().split('T')[0]; }catch(e){}
    selectedRendaAccountId = null;
    try{
      selectedRendaAccountId = null;
      const noAccts = document.getElementById('r-no-accounts');
      if(bankAccounts.length){
        if(noAccts) noAccts.style.display='none';
        renderRendaAccountChips(null);
      } else {
        if(noAccts) noAccts.style.display='block';
      }
    }catch(e){}
  }, 30);
}

function setRendaTab(tab, skipInit=false){
  const isRec = tab==='recorrente';
  document.getElementById('renda-panel-recorrente').style.display = isRec ? 'block' : 'none';
  document.getElementById('renda-panel-pontual').style.display    = isRec ? 'none'  : 'block';
  const tr = document.getElementById('renda-tab-recorrente');
  const tp = document.getElementById('renda-tab-pontual');
  if(tr){ tr.style.background = isRec ? 'var(--green)' : 'transparent'; tr.style.color = isRec ? '#000' : 'var(--muted)'; }
  if(tp){ tp.style.background = isRec ? 'transparent' : 'var(--green)'; tp.style.color = isRec ? 'var(--muted)' : '#000'; }
  if(isRec && !skipInit){
    initIncomeModal();
  } else if(!isRec) {
    const dateEl = document.getElementById('r-date');
    if(dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    selectedRendaAccountId = null;
    const noAccts = document.getElementById('r-no-accounts');
    if(noAccts) noAccts.style.display = bankAccounts.length ? 'none' : 'block';
    renderRendaAccountChips(null);
  }
}

function openAddReceita(){
  document.getElementById('r-name').value = '';
  document.getElementById('r-amt').value  = '';
  document.getElementById('r-date').value = new Date().toISOString().split('T')[0];
  selectedAccountId = null;
  const chips   = document.getElementById('r-account-chips');
  const noAccts = document.getElementById('r-no-accounts');
  if(bankAccounts.length){
    if(noAccts) noAccts.style.display = 'none';
    renderAccountChips('r-account-chips', null);
  } else {
    if(chips) chips.innerHTML = '';
    if(noAccts) noAccts.style.display = 'block';
  }
  openM('m-receita');
}

function addReceita(){
  const name = document.getElementById('r-name').value.trim();
  const amt  = parseMaskedAmt(document.getElementById('r-amt').value);
  const dateEl = document.getElementById('r-date');
  const date = (dateEl && dateEl.value) ? dateEl.value : new Date().toISOString().split('T')[0];
  if(!name || !amt){
    showAlert('Preencha a descrição e o valor para registrar a entrada.', 'Campos obrigatórios', '📝');
    return;
  }
  const tx = {id:Date.now(), name, cat:'receita', amt:Math.abs(amt), date, isnew:true};
  if(selectedRendaAccountId && selectedRendaAccountId !== '__dinheiro__') tx.accountId = selectedRendaAccountId;
  if(selectedRendaAccountId === '__dinheiro__') tx.payMethod = 'dinheiro';
  txs.unshift(tx);
  showToast(tx);
  closeM('m-receita');
  selectedRendaAccountId = null;
  if(currentPage.v==='overview') renderOverview();
  if(currentPage.v==='transactions') renderTxPage();
  autosave();
}


