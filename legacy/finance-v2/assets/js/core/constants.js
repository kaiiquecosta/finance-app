/* constants.js — Constantes e variáveis globais */


/* ═══ App principal ═══ */



function chipInactiveBg()  { return document.documentElement.getAttribute('data-theme')==='light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'; }
function chipInactiveBorder(){ return document.documentElement.getAttribute('data-theme')==='light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'; }
function chipInactiveColor(){ return document.documentElement.getAttribute('data-theme')==='light' ? '#475569' : 'var(--muted)'; }

function isLightTheme(){ return document.documentElement.getAttribute('data-theme')==='light'; }
function chartBarInactive(){ return isLightTheme() ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'; }
function chartBarFuture(){ return isLightTheme() ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'; }
function chartBarPast(){ return isLightTheme() ? 'rgba(96,165,250,0.5)' : 'rgba(96,165,250,0.35)'; }
function sparkBarEmpty(){ return isLightTheme() ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; }
function toggleTheme(){
  const html = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('finance_theme', next);
  const ico = next === 'light' ? '☀️' : '🌙';
  const btn = document.getElementById('theme-toggle-btn');
  if(btn) btn.textContent = ico;
  const mobIco = document.getElementById('mob-theme-ico');
  if(mobIco) mobIco.textContent = ico;
  // Re-renderizar página atual para atualizar cores de gráficos geradas por JS
  try{
    const p = currentPage?.v || 'overview';
    if(p==='overview') renderOverview();
    else if(p==='cards') renderCards();
    else if(p==='subscriptions') renderSubs();
    else if(p==='bills') renderBills();
  }catch(e){}
}

function applyTheme(){
  const saved = localStorage.getItem('finance_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const ico = saved === 'light' ? '☀️' : '🌙';
  const btn = document.getElementById('theme-toggle-btn');
  if(btn) btn.textContent = ico;
  const mobIco = document.getElementById('mob-theme-ico');
  if(mobIco) mobIco.textContent = ico;
}

// ── DATA ──
const CI={
  'mercado':'🛒','alimentação':'🍔','restaurante':'🍽️','lanche':'🍟','delivery':'🛵','ifood':'🛵','uber eats':'🛵',
  'streaming':'📺','netflix':'🎬','spotify':'🎵','disney':'🏰','amazon prime':'📦',
  'transporte':'🚗','combustível':'⛽','uber':'🚕','99':'🚕','ônibus':'🚌','metrô':'🚇',
  'saúde':'💊','farmácia':'💊','academia':'💪','médico':'🩺',
  'compras':'📦','roupas':'👕','calçados':'👟','eletrônicos':'📱','games':'🎮',
  'educação':'📚','curso':'🎓','livros':'📖',
  'moradia':'🏠','aluguel':'🏠','condomínio':'🏢','energia':'⚡','água':'💧','internet':'📡','gás':'🔥',
  'lazer':'🎉','viagem':'✈️','hotel':'🏨','pet':'🐾','presente':'🎁',
  'investimento':'📈','receita':'💰','salário':'💵','freelance':'💼',
  'outros':'💳','cartão':'💳','banco':'🏦'
};
const CC={
  'mercado':'#22c55e','alimentação':'#f97316','restaurante':'#fb923c','lanche':'#f97316','delivery':'#f97316','ifood':'#ea1d2c','uber eats':'#06c167',
  'streaming':'#8b5cf6','netflix':'#e50914','spotify':'#1db954','disney':'#113ccf','amazon prime':'#00a8e0',
  'transporte':'#3b82f6','combustível':'#f59e0b','uber':'#000000','99':'#ffcc00','ônibus':'#38bdf8','metrô':'#6366f1',
  'saúde':'#ec4899','farmácia':'#f43f5e','academia':'#22c55e','médico':'#06b6d4',
  'compras':'#f59e0b','roupas':'#e879f9','calçados':'#c084fc','eletrônicos':'#94a3b8','games':'#7c3aed',
  'educação':'#a78bfa','curso':'#8b5cf6','livros':'#6366f1',
  'moradia':'#64748b','aluguel':'#475569','condomínio':'#64748b','energia':'#fbbf24','água':'#38bdf8','internet':'#3b82f6','gás':'#f97316',
  'lazer':'#34d399','viagem':'#0ea5e9','hotel':'#38bdf8','pet':'#f472b6','presente':'#fb7185',
  'investimento':'#10b981','receita':'#22c55e','salário':'#22c55e','freelance':'#4ade80',
  'outros':'#64748b','cartão':'#94a3b8','banco':'#60a5fa'
};
const MONTHS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTHS_FULL=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PAY_METHODS=[
  {id:'pix',     label:'Pix',      ico:'⚡'},
  {id:'debito',  label:'Débito',   ico:'💳'},
  {id:'dinheiro',label:'Dinheiro', ico:'💵'},
  {id:'ted',     label:'TED/DOC',  ico:'🏦'},
  {id:'credito', label:'Crédito',  ico:'💜'},
  {id:'boleto',  label:'Boleto',   ico:'📋'},
];
let selectedPayMethod = 'pix';
let selectedEditPayMethod = 'pix';
function renderPayChips(containerId, selectedId, onSelect){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML='';
  PAY_METHODS.forEach(pm=>{
    const btn = document.createElement('button');
    const active = pm.id === selectedId;
    btn.style.cssText = `display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;background:${active?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)'};border:1px solid ${active?'rgba(34,197,94,0.4)':'rgba(255,255,255,0.08)'};color:${active?'var(--green)':'var(--muted)'}`;
    btn.innerHTML=`${pm.ico} ${pm.label}`;
    btn.onclick=()=>{ onSelect(pm.id); renderPayChips(containerId, pm.id, onSelect); };
    el.appendChild(btn);
  });
}

// ══════════════════════════════════════

// ── FORMAT ──
function fmt(v,sign=false){
  const s=Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(sign)return (v>=0?'+':'-')+'R$ '+s;
  return 'R$ '+s;
}
function ago(d){
  const now=new Date(),dt=new Date(d),diff=Math.floor((now-dt)/86400000);
  if(diff===0)return'hoje';if(diff===1)return'ontem';
  return dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
}
function totals(list){
  const inc=list.filter(t=>t.amt>0).reduce((s,t)=>s+t.amt,0);
  const spt=list.filter(t=>t.amt<0).reduce((s,t)=>s+Math.abs(t.amt),0);
  return{inc,spt,bal:inc-spt};
}


// ── APP ──
// ══════════════════════════════════════
// (chamado após login via enterApp → initApp)

// Variáveis de dados — populadas pelo init (DEFAULT ou localStorage)
let txs=[];
let installments=[];
let subscriptions=[];
let cards=[];
let goals=[];
let incomes=[]; // fontes de renda recorrentes
let bankAccounts=[]; // contas bancárias

let editId=null, depId=null, billCardId=null, cardMonthOff=0;
const currentPage={v:'overview'};


