/* boot.js — Inicialização do app */


/* ═══ Boot ═══ */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initAuth();
  } catch(e) {
    console.error('initAuth falhou:', e);
    // Fallback: mostrar tela de login mesmo se o Supabase falhar
    const auth = document.getElementById('auth-screen');
    if(auth) auth.style.display = 'flex';
    const step = document.getElementById('auth-step-login');
    if(step) step.style.display = 'block';
  }
});
