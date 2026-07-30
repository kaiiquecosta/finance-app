/* subscriptions.view.js — Assinaturas */

// ── SUBSCRIPTIONS ──
function renderSubs(){
  const total = subscriptions.reduce((s,sub)=>s+sub.amt, 0);
  const annual = total * 12;
  const avg = subscriptions.length ? total/subscriptions.length : 0;

  document.getElementById('sub-total').textContent = fmt(total)+'/mês';
  document.getElementById('sub-count').textContent = subscriptions.length;
  document.getElementById('sub-annual').textContent = fmt(annual);
  document.getElementById('sub-avg').textContent = fmt(avg);

  // Projeção mensal — barras
  const barsEl = document.getElementById('sub-projection-bars');
  if(barsEl){
    barsEl.innerHTML='';
    if(!subscriptions.length){
      barsEl.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:24px 0">Adicione assinaturas pelo cartão de crédito.</div>';
    } else {
      const now = new Date();
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const curMonth = now.getMonth();
      const curYear  = now.getFullYear();

      // Calcular quanto cada assinatura custa em cada mês (igual por enquanto)
      // Linha de barra para cada mês
      for(let i=0; i<12; i++){
        const mIdx = (curMonth + i) % 12;
        const yr   = curYear + Math.floor((curMonth + i) / 12);
        const label = months[mIdx] + (yr !== curYear ? ' '+yr : '');
        const isPast = i === 0;

        // Cada serviço contribui com seu valor mensal
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px';

        // Label mês
        const lbl = document.createElement('div');
        lbl.style.cssText = `width:36px;font-size:11px;font-weight:600;color:${i===0?'var(--green)':'var(--muted)'};flex-shrink:0`;
        lbl.textContent = label;

        // Barra composta (cada assinatura tem sua cor)
        const barWrap = document.createElement('div');
        barWrap.style.cssText = `flex:1;display:flex;height:22px;border-radius:6px;overflow:hidden;background:${isLightTheme()?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.04)'}`;

        subscriptions.forEach(sub=>{
          const clr = sub.clr||'#8b5cf6';
          const pct = total>0 ? (sub.amt/total)*100 : 0;
          const seg = document.createElement('div');
          seg.style.cssText = `width:${pct}%;background:${clr}${i===0?'':'80'};transition:width .3s;position:relative`;
          seg.title = `${sub.name}: ${fmt(sub.amt)}/mês`;
          barWrap.appendChild(seg);
        });

        // Valor à direita
        const val = document.createElement('div');
        val.style.cssText = `width:80px;text-align:right;font-size:12px;font-weight:700;font-family:var(--num);color:${i===0?'var(--red)':'var(--muted)'}`;
        val.textContent = fmt(total);

        row.appendChild(lbl);
        row.appendChild(barWrap);
        row.appendChild(val);
        barsEl.appendChild(row);
      }

      // Legenda das assinaturas
      const legend = document.createElement('div');
      legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)';
      subscriptions.forEach(sub=>{
        const clr = sub.clr||'#8b5cf6';
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;color:var(--muted)';
        item.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${clr};flex-shrink:0;display:inline-block"></span>${sub.ico||'📱'} ${sub.name} <span style="color:#fff;font-family:var(--num);font-weight:600">${fmt(sub.amt)}</span>`;
        legend.appendChild(item);
      });
      barsEl.appendChild(legend);
    }
  }

  // Lista de cards
  const list = document.getElementById('sub-list');
  list.innerHTML='';
  if(!subscriptions.length){
    list.innerHTML='<div style="color:var(--muted);text-align:center;padding:32px;line-height:2">Nenhuma assinatura.<br><span style="font-size:12px">Lance uma assinatura pelo cartão de crédito.</span></div>';
    return;
  }
  subscriptions.forEach(sub=>{
    const clr = sub.clr||'#8b5cf6';
    const card = sub.cardId ? cards.find(c=>c.id===sub.cardId) : null;
    const annualAmt = sub.amt * 12;
    const d = document.createElement('div');
    d.className='card fadein sub-row';
    d.style.cssText='display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:8px';
    d.innerHTML=`
      <div style="width:42px;height:42px;border-radius:12px;background:${clr}20;border:1px solid ${clr}40;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${sub.ico||'📱'}</div>
      <div style="flex:1;min-width:0">
        <div style="color:#fff;font-size:14px;font-weight:600">${sub.name}</div>
        <div style="color:var(--muted);font-size:11px;margin-top:1px">Cobra dia ${sub.day}${card?' · '+card.name:''}</div>
        <div style="margin-top:5px;height:3px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden">
          <div style="height:100%;width:${total>0?(sub.amt/total)*100:0}%;background:${clr};border-radius:3px"></div>
        </div>
      </div>
      <div style="text-align:right;margin-right:6px;flex-shrink:0">
        <div style="color:var(--red);font-family:var(--num);font-weight:700;font-size:15px">${fmt(sub.amt)}</div>
        <div style="color:var(--muted);font-size:10px">${fmt(annualAmt)}/ano</div>
      </div>
      <button onclick="removeSub(${sub.id})" title="Cancelar assinatura"
        style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:7px 10px;color:#f87171;font-size:13px;cursor:pointer;flex-shrink:0;transition:all .15s"
        onmouseenter="this.style.background='rgba(239,68,68,0.14)'" onmouseleave="this.style.background='rgba(239,68,68,0.07)'">🗑</button>`;
    list.appendChild(d);
  });
}


// ── SUBS CRUD ──
function removeSub(id){
  const sub = subscriptions.find(s=>s.id===id);
  if(!sub) return;
  if(!confirm('Cancelar "'+sub.name+'"? Ela será removida da próxima fatura.')) return;
  // Remove do cartão vinculado: lançamentos futuros com esse desc
  if(sub.cardId){
    const card = cards.find(c=>c.id===sub.cardId);
    if(card){
      const today = new Date().toISOString().split('T')[0];
      card.bills = card.bills.filter(b=> !(b.desc===sub.name && b.date>=today && b.recurring));
    }
  }
  DB.deleteSubscription(id);
  subscriptions = subscriptions.filter(s=>s.id!==id);
  renderSubs(); renderCards(); autosave();
  renderCreditLimit();
  try{ renderOverview(); }catch(e){}
  showToast({name:sub.name+' cancelada',cat:'outros',amt:0});
}

function addSub(){
  const name=document.getElementById('s-name').value.trim();
  const amt=parseMaskedAmt(document.getElementById('s-amt').value);
  const day=parseInt(document.getElementById('s-day').value)||0;
  const missing=[];
  if(!name) missing.push('Nome da assinatura');
  if(!amt)  missing.push('Valor');
  if(!day)  missing.push('Dia de cobrança');
  if(missing.length){ showAlert('Por favor preencha: '+missing.join(', ')+'.','Campos obrigatórios','📝'); return; }
  subscriptions.push({id:Date.now(),name,amt,day,ico:'📱',clr:'#8b5cf6'});
  renderSubs();closeM('m-sub');
  ['s-name','s-amt','s-day'].forEach(id=>document.getElementById(id).value='');
  autosave();
}


