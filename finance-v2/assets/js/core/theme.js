/* theme.js — Aplica tema antes do render */



// Aplicar tema salvo ANTES de renderizar — evita flash de tema errado na auth screen
(function(){
  const t = localStorage.getItem('finance_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

  