/* ui.js — Toast, Alert, helpers visuais */

// ── TOAST ──
function showAlert(msg, title='Atenção', ico='⚠️'){
  document.getElementById('alert-msg').textContent  = msg;
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-ico').textContent   = ico;
  openM('m-alert');
}

function showToast(tx){
  const el=document.getElementById('toast');
  const ico=document.getElementById('t-ico');
  ico.textContent=CI[tx.cat]||'💳';
  ico.style.cssText=`background:${CC[tx.cat]||'#333'}20;border:1px solid ${CC[tx.cat]||'#333'}40;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0`;
  const c=tx.amt<0?'var(--red)':'var(--green)';
  document.getElementById('t-title').style.color=''; document.getElementById('t-title').innerHTML=`Transação registrada <span style="color:var(--muted);font-size:10px">agora</span>`;
  document.getElementById('t-sub').innerHTML=`${tx.name} · <span style="color:${c};font-weight:600">${fmt(tx.amt)}</span>`;
  el.style.display='block';clearTimeout(el._t);
  el._t=setTimeout(()=>el.style.display='none',4000);
}


