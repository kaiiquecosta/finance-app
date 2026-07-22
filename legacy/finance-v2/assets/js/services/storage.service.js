/* storage.service.js — Export/import de dados, autosave wrapper */

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
