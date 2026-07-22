/* reminders.service.js — Sistema de lembretes */

// ── SISTEMA DE LEMBRETES ──
// ══════════════════════════════════════════
const REMINDER_KEY = 'finance_dismissed_reminders';
let _remQueue = [];   // fila de lembretes
let _remIdx   = 0;    // índice atual
let _remEl    = null; // elemento popup atual

function getDismissed(){
  try{ return JSON.parse(localStorage.getItem(REMINDER_KEY)||'[]'); }catch(e){ return []; }
}
function saveDismissed(arr){
  localStorage.setItem(REMINDER_KEY, JSON.stringify(arr));
}

function checkReminders(){
  const today    = new Date();
  const todayDay = today.getDate();
  const todayStr = today.toISOString().split('T')[0];
  const dismissed = getDismissed();
  const list = [];

  
// ── Contas fixas ──
  fixedBills.forEach(bill => {
    if(bill.paid) return;
    const diff = bill.day - todayDay;
    if(diff < 0 || diff > 5) return;
    const urgency = diff===0?'urgent': diff===1?'warn':'normal';
    const when    = diff===0?'HOJE': diff===1?'amanhã':`em ${diff} dias`;
    const label   = diff===0?'⚠️ Vence hoje': diff===1?'📅 Amanhã':`📅 ${diff} dias`;
    const lColor  = diff===0?'#f87171': diff===1?'#f59e0b':'#94a3b8';
    list.push({
      id:`bill-${bill.id}-${todayStr}`,
      type: urgency, ico: bill.ico, label, lColor,
      title:`${bill.name} vence ${when}`,
      sub:`${bill.fixed ? fmt(bill.amt) : 'Valor variável'} · Dia ${bill.day}`,
      cta:'Ver contas →', ctaColor: diff===0?'#f87171': diff===1?'#f59e0b':'#94a3b8',
      action:'bills'
    });
  });

  
// ── Assinaturas ──
  subscriptions.forEach(sub => {
    const diff = sub.day - todayDay;
    if(diff < 0 || diff > 2) return;
    const when  = diff===0?'HOJE':'amanhã';
    const label = diff===0?'💳 Cobra hoje':'📅 Amanhã';
    list.push({
      id:`sub-${sub.id}-${todayStr}`,
      type: diff===0?'urgent':'warn', ico: sub.ico||'🔁', label,
      lColor: diff===0?'#f87171':'#f59e0b',
      title:`${sub.name} cobra ${when}`,
      sub:`${fmt(sub.amt)}/mês · Dia ${sub.day}`,
      cta:'Ver assinaturas →', ctaColor: diff===0?'#f87171':'#f59e0b',
      action:'subscriptions'
    });
  });

  
// ── Rendas ──
  incomes.forEach(inc => {
    (inc.days||[]).forEach(d => {
      const diff = d - todayDay;
      if(diff < 0 || diff > 2) return;
      const key = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if((inc.received||[]).includes(key)) return;
      const when  = diff===0?'hoje':'amanhã';
      const label = diff===0?'💰 Receber hoje':'💰 Amanhã';
      list.push({
        id:`income-${inc.id}-${d}-${todayStr}`,
        type:'income', ico: inc.ico||'💰', label,
        lColor:'#22c55e',
        title:`${inc.name} — ${diff===0?'dia de receber!':'chega '+when}`,
        sub:`${fmt(inc.amt)} previsto · Dia ${d}`,
        cta:'Marcar como recebido →', ctaColor:'#22c55e',
        action:'overview'
      });
    });
  });

  // Parcelamentos — última parcela chegando
  installments.forEach(inst => {
    const remaining = inst.parcels - inst.paid;
    if(remaining === 1){
      list.push({
        id:`inst-final-${inst.id}-${todayStr.slice(0,7)}`,
        type:'normal', ico:'🏁', label:'🏁 Última parcela',
        lColor:'#a78bfa',
        title:`Última parcela de "${inst.name}"`,
        sub:`${fmt(inst.total/inst.parcels)} · Já pagou ${inst.paid}/${inst.parcels}`,
        cta:'Ver parcelamentos →', ctaColor:'#a78bfa',
        action:'installments'
      });
    }
  });

  // Metas com prazo chegando (≤ 7 dias)
  goals.forEach(goal => {
    if(!goal.deadline || goal.saved >= goal.target) return;
    const daysLeft = Math.ceil((new Date(goal.deadline) - today) / 86400000);
    if(daysLeft >= 0 && daysLeft <= 7){
      list.push({
        id:`goal-deadline-${goal.id}-${todayStr}`,
        type: daysLeft<=1?'urgent':'warn', ico:'⊛', label:`⊛ Meta em ${daysLeft===0?'hoje':daysLeft+' dias'}`,
        lColor: daysLeft<=1?'#f87171':'#f59e0b',
        title:`Meta "${goal.name}" ${daysLeft===0?'vence hoje':'em '+daysLeft+' dias'}`,
        sub:`${fmt(goal.saved)} de ${fmt(goal.target)} · ${Math.round((goal.saved/goal.target)*100)}% concluída`,
        cta:'Ver metas →', ctaColor: daysLeft<=1?'#f87171':'#f59e0b',
        action:'goals'
      });
    }
  });

  const toShow = list.filter(r => !dismissed.includes(r.id));
  if(!toShow.length) return;

  // Pede permissão de notificação nativa (silencioso)
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission();
  }

  _remQueue = toShow;
  _remIdx   = 0;
  showReminderAt(0);
}

function showReminderAt(idx){
  // Remove popup anterior
  if(_remEl){ _remEl.remove(); _remEl = null; }

  const queue = _remQueue;
  if(!queue.length || idx >= queue.length) return;
  _remIdx = idx;
  const r = queue[idx];
  const total = queue.length;

  // Dots de navegação
  const dotsHtml = total > 1
    ? `<div class="rem-dots">${queue.map((_,i)=>`<div class="rem-dot${i===idx?' active':''}" onclick="showReminderAt(${i})"></div>`).join('')}</div>`
    : '';

  const counterHtml = total > 1
    ? `<span class="rem-counter">${idx+1} de ${total}</span>`
    : '';

  const navHtml = total > 1 ? `
    ${idx > 0 ? `<button class="rem-action" style="color:var(--muted)" onclick="showReminderAt(${idx-1})">← Anterior</button>` : '<span></span>'}
    ${dotsHtml}
    ${idx < total-1 ? `<button class="rem-action" style="color:var(--muted)" onclick="showReminderAt(${idx+1})">Próximo →</button>` : `<button class="rem-action" style="color:var(--muted)" onclick="closeReminderPopup()">Fechar</button>`}
  ` : `
    <button class="rem-action" style="color:${r.ctaColor}" onclick="showReminderAt_action('${r.action}','${r.id}')">${r.cta}</button>
    <button class="rem-action" style="color:var(--muted)" onclick="closeReminderPopup()">Fechar</button>
  `;

  const popup = document.createElement('div');
  popup.className = `reminder-popup ${r.type}`;
  popup.id = 'rem-popup';
  popup.innerHTML = `
    <div class="rem-top">
      <div class="rem-ico">${r.ico}</div>
      <div class="rem-body">
        <div class="rem-label" style="color:${r.lColor}">${r.label}</div>
        <div class="rem-title">${r.title}</div>
        <div class="rem-sub">${r.sub}</div>
      </div>
      <button class="rem-close" onclick="dismissCurrentReminder()">&times;</button>
    </div>
    <div class="rem-footer">
      ${navHtml}
    </div>`;

  document.body.appendChild(popup);
  _remEl = popup;

  // Auto-dismiss depois de 10s se for o único
  if(total === 1){
    setTimeout(()=>{ if(_remEl===popup) closeReminderPopup(); }, 10000);
  }
}

function showReminderAt_action(page, id){
  // Marca como dispensado e vai para a página
  const d = getDismissed();
  if(!d.includes(id)){ d.push(id); saveDismissed(d); }
  closeReminderPopup();
  goPage(page);
}

function dismissCurrentReminder(){
  // Dispensa o lembrete atual e vai pro próximo
  const r = _remQueue[_remIdx];
  if(r){
    const d = getDismissed();
    if(!d.includes(r.id)){ d.push(r.id); saveDismissed(d); }
  }
  _remQueue.splice(_remIdx, 1);
  if(_remQueue.length === 0){ closeReminderPopup(); return; }
  const next = Math.min(_remIdx, _remQueue.length-1);
  showReminderAt(next);
}

function closeReminderPopup(){
  if(_remEl){
    _remEl.style.animation = 'remOut .25s ease forwards';
    setTimeout(()=>{ if(_remEl){ _remEl.remove(); _remEl=null; } }, 240);
  }
}


