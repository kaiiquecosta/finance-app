/* transactions.view.js — Transações: listagem e CRUD */

// ── TRANSACTIONS PAGE ──
function renderTxPage(){
  const {inc,spt,bal}=totals(txs);
  document.getElementById('tx-inc-sum').textContent=fmt(inc);
  document.getElementById('tx-spt-sum').textContent=fmt(spt);
  const bs=document.getElementById('tx-bal-sum');
  bs.textContent=fmt(bal);bs.style.color=bal>=0?'var(--green)':'var(--red)';
  document.getElementById('tx-count-lbl').textContent=txs.length+' registros · débitos são editáveis';
  const list=document.getElementById('tx-full-list');list.innerHTML='';
  // group by date
  const groups={};
  txs.forEach(t=>{(groups[t.date]=groups[t.date]||[]).push(t);});
  Object.keys(groups).sort((a,b)=>b.localeCompare(a)).forEach(date=>{
    const hdr=document.createElement('div');
    hdr.style.cssText='color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px;padding:10px 0 4px;font-weight:600';
    hdr.textContent=new Date(date).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'short'});
    list.appendChild(hdr);
    groups[date].forEach(tx=>{
      const isReadonly = tx._incomeKey || tx._initialBalance || tx._balanceAdj || tx.cat==='receita' || tx.type==='receita';
      list.appendChild(makeTxRow(tx, !isReadonly));
    });
  });
}


// ── TX CRUD ──
let editTxObj=null;
function addTx(){
  const name=document.getElementById('n-name').value.trim();
  const amt=parseMaskedAmt(document.getElementById('n-amt').value);
  const cat=document.getElementById('n-cat').value;
  const date=document.getElementById('n-date').value;
  const missing=[];
  if(!name) missing.push('Descrição');
  if(!amt)  missing.push('Valor');
  if(!date) missing.push('Data');
  if(missing.length){ showAlert('Por favor preencha: '+missing.join(', ')+'.','Campos obrigatórios','📝'); return; }
  const tx={id:Date.now(),name,cat,amt:cat==='receita'?Math.abs(amt):-Math.abs(amt),date,isnew:true};
  if(selectedAccountId) tx.accountId=selectedAccountId;
  txs.unshift(tx);showToast(tx);closeM('m-add');
  document.getElementById('n-name').value='';document.getElementById('n-amt').value='';
  selectedAccountId=null;
  if(currentPage.v==='overview')renderOverview();
  if(currentPage.v==='transactions')renderTxPage();
  autosave();
}
function openEditTx(tx){
  editId=tx.id;
  document.getElementById('e-name').value=tx.name;
  document.getElementById('e-amt').value=fmtForInput(Math.abs(tx.amt));
  document.getElementById('e-cat').value=tx.cat;
  selectedEditPayMethod = tx.payMethod||'pix';
  setTimeout(()=>renderPayChips('e-pay-chips', selectedEditPayMethod, (id)=>{ selectedEditPayMethod=id; }), 0);
  document.getElementById('e-date').value=tx.date;
  selectedAccountId=tx.accountId||null;
  // Chips de conta no modal de editar
  const eLabel=document.getElementById('e-account-label');
  if(eLabel) eLabel.style.display=bankAccounts.length?'block':'none';
  renderAccountChips('e-account-chips', tx.accountId||null);
  openM('m-edit');
}
function saveTx(){
  const tx=txs.find(t=>t.id===editId);if(!tx)return;
  tx.name=document.getElementById('e-name').value;
  const amt=parseMaskedAmt(document.getElementById('e-amt').value);
  tx.cat=document.getElementById('e-cat').value;
  tx.date=document.getElementById('e-date').value;
  tx.amt=-Math.abs(amt);
  tx.payMethod=selectedEditPayMethod||'pix';
  if(selectedAccountId) tx.accountId=selectedAccountId;
  else delete tx.accountId;
  closeM('m-edit');
  if(currentPage.v==='overview')renderOverview();
  if(currentPage.v==='transactions')renderTxPage();
  autosave();
}
function askDel(){const tx=txs.find(t=>t.id===editId);if(!tx)return;document.getElementById('del-name').textContent=tx.name;closeM('m-edit');openM('m-del');}
function delTx(){
  const _delId = editId;
  txs=txs.filter(t=>t.id!==_delId);closeM('m-del');
  if(currentPage.v==='overview')renderOverview();
  if(currentPage.v==='transactions')renderTxPage();
  DB.deleteTransaction(_delId);
  autosave();
}


