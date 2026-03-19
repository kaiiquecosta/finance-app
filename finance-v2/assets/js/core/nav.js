/* nav.js — Navegação entre páginas */

// ── NAV ──
function goPage(p){
  document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.m-nav-btn').forEach(e=>e.classList.remove('active'));

  const pg = document.getElementById('page-'+p);
  if(pg) pg.classList.add('active');
  const nt = document.getElementById('nt-'+p);
  if(nt) nt.classList.add('active');
  const mn = document.getElementById('mn-'+p);
  if(mn) mn.classList.add('active');

  currentPage.v = p;

  // Botão "＋ Gasto rápido" — visível só em overview e transactions
  const btnGasto = document.querySelector('.topnav div[style*="margin-left:auto"] button[onclick*="m-add"]');
  if(btnGasto) btnGasto.style.display = (p==='overview'||p==='transactions') ? 'flex' : 'none';

  if(p==='overview')      renderOverview();
  if(p==='transactions')  renderTxPage();
  if(p==='installments')  renderInst();
  if(p==='subscriptions') renderSubs();
  if(p==='cards')         { renderCards(); initCardMonthPicker(); }
  if(p==='bills')         renderBills();
  if(p==='goals')         renderGoals();
  if(p==='investments')   { renderInvestments(); fetchCDI(); fetchIPCA(); loadMarketData(); }
}

// Navegação entre abas com seta esquerda/direita
(function(){
  const PAGES = ['overview','transactions','installments','subscriptions','cards','bills','goals','investments'];

  document.addEventListener('keydown', function(e){
    const tag = document.activeElement?.tagName;
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if(document.querySelector('.modal.open, .drawer.open')) return;

    if(e.key === 'ArrowRight'){
      e.preventDefault();
      const idx = PAGES.indexOf(currentPage.v);
      goPage(PAGES[(idx + 1) % PAGES.length]);
    } else if(e.key === 'ArrowLeft'){
      e.preventDefault();
      const idx = PAGES.indexOf(currentPage.v);
      goPage(PAGES[(idx - 1 + PAGES.length) % PAGES.length]);
    }
  });
})();


