/* auth.service.js — Autenticação Supabase (email + Google) */


/* =============================================================
   assets/js/services/auth.js
   Autenticação via Supabase: email/senha + Google OAuth
   Substitui o sistema de PIN local
   ============================================================= */

// ── Estado de auth ────────────────────────────────────────────
let _currentUser  = null;   // objeto do Supabase Auth
let _userProfile  = null;   // linha da tabela profiles

// ── Inicialização ─────────────────────────────────────────────
async function initAuth() {
  // Listener de mudança de sessão
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      _currentUser = session.user;
      await loadUserProfile();
      showApp();
    } else if (event === 'SIGNED_OUT') {
      _currentUser = null;
      _userProfile = null;
      showAuthScreen('login');
      _updateLoginTitle(false);
    } else if (event === 'PASSWORD_RECOVERY') {
      showAuthScreen('reset');
    }
  });

  // Verificar sessão ativa ao carregar a página
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    // Já tem sessão → loga direto sem mostrar tela de login
    _currentUser = session.user;
    await loadUserProfile();
    showApp();
  } else {
    // Verificar se já usou o app antes (returning user)
    const hasUsedBefore = !!localStorage.getItem('finance_has_session');
    _updateLoginTitle(hasUsedBefore);
    showAuthScreen('login');
  }
}

function _updateLoginTitle(returning) {
  const title = document.getElementById('auth-login-title');
  const sub   = document.getElementById('auth-login-sub');
  if (title) title.textContent = returning ? 'Bem-vindo de volta 👋' : 'Olá! 👋';
  if (sub)   sub.textContent   = returning ? 'Entre na sua conta para continuar' : 'Entre na sua conta ou crie uma nova';
}

// ── Carregar perfil do usuário ─────────────────────────────────
async function loadUserProfile() {
  if (!_currentUser) return;
  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', _currentUser.id)
    .single();
  _userProfile = data;
}

// ── Login com email/senha ──────────────────────────────────────
async function loginWithEmail() {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-err');
  const btn   = document.getElementById('auth-login-btn');

  if (!email || !pass) {
    showAuthErr('Preencha email e senha.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });

  btn.disabled = false;
  btn.textContent = 'Entrar';

  if (error) {
    const msgs = {
      'Invalid login credentials': 'Email ou senha incorretos.',
      'Email not confirmed': 'Confirme seu email antes de entrar.',
      'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
    };
    showAuthErr(msgs[error.message] || 'Erro ao entrar. Tente novamente.');
  }
}

// ── Cadastro com email/senha ───────────────────────────────────
async function registerWithEmail() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-password').value;
  const pass2 = document.getElementById('reg-password2').value;
  const btn   = document.getElementById('auth-register-btn');

  if (!name)               return showAuthErr('Preencha seu nome.');
  if (!email)              return showAuthErr('Preencha seu email.');
  if (pass.length < 6)    return showAuthErr('A senha deve ter ao menos 6 caracteres.');
  if (pass !== pass2)      return showAuthErr('As senhas não coincidem.');

  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  const { error } = await sb.auth.signUp({
    email,
    password: pass,
    options: {
      data: { full_name: name }
    }
  });

  btn.disabled = false;
  btn.textContent = 'Criar conta';

  if (error) {
    const msgs = {
      'User already registered': 'Este email já está cadastrado.',
      'Password should be at least 6 characters': 'Senha muito curta (mínimo 6 caracteres).',
    };
    showAuthErr(msgs[error.message] || error.message);
    return;
  }

  // Sucesso — mostrar tela de confirmação de email
  showAuthScreen('verify');
}

// ── Login com Google ──────────────────────────────────────────
async function loginWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) showAuthErr('Erro ao conectar com Google.');
}

// ── Recuperação de senha ──────────────────────────────────────
async function sendPasswordReset() {
  const email = document.getElementById('reset-email').value.trim();
  const btn   = document.getElementById('reset-btn');

  if (!email) return showAuthErr('Digite seu email.');

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '?reset=true'
  });

  btn.disabled = false;
  btn.textContent = 'Enviar link';

  if (error) {
    showAuthErr('Erro ao enviar email. Tente novamente.');
  } else {
    showAuthScreen('reset-sent');
  }
}

// ── Logout ────────────────────────────────────────────────────
async function logout() {
  await sb.auth.signOut();
  // onAuthStateChange cuida de exibir a tela de login
}

// ── Helpers de UI ─────────────────────────────────────────────
function showAuthScreen(step = 'login') {
  document.getElementById('auth-screen').style.display = 'flex';
  const mainApp = document.getElementById('main-app');
  if (mainApp) { mainApp.style.display = 'none'; }

  // Esconder todos os steps
  ['auth-step-login','auth-step-register','auth-step-verify',
   'auth-step-reset','auth-step-reset-sent'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Mostrar o step correto
  const map = {
    login:       'auth-step-login',
    register:    'auth-step-register',
    verify:      'auth-step-verify',
    reset:       'auth-step-reset',
    'reset-sent':'auth-step-reset-sent',
  };
  const el = document.getElementById(map[step] || 'auth-step-login');
  if (el) el.style.display = 'block';

  // Limpar erros
  const errEl = document.getElementById('auth-err');
  if (errEl) errEl.style.display = 'none';
}

function showAuthErr(msg) {
  const el = document.getElementById('auth-err');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  // Shake animation
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake .4s ease';
}

// ── Tema escolhido pendente ───────────────────────────────────
let _pendingTheme = 'dark';

function selectThemeOpt(theme) {
  _pendingTheme = theme;

  // Visual — dark
  const darkOpt   = document.getElementById('theme-opt-dark');
  const darkCheck = document.getElementById('theme-check-dark');
  if(darkOpt) darkOpt.style.borderColor   = theme==='dark' ? 'rgba(34,197,94,0.6)'  : 'rgba(255,255,255,0.1)';
  if(darkCheck) darkCheck.style.background = theme==='dark' ? '#22c55e' : 'rgba(255,255,255,0.06)';
  if(darkCheck) darkCheck.style.color      = theme==='dark' ? '#000' : '#64748b';

  // Visual — light
  const lightOpt   = document.getElementById('theme-opt-light');
  const lightCheck = document.getElementById('theme-check-light');
  if(lightOpt) lightOpt.style.borderColor   = theme==='light' ? 'rgba(22,163,74,0.6)'  : 'rgba(0,0,0,0.1)';
  if(lightCheck) lightCheck.style.background = theme==='light' ? '#16a34a' : 'rgba(0,0,0,0.1)';
  if(lightCheck) lightCheck.style.color      = theme==='light' ? '#fff' : '#64748b';

  // Preview do tema em tempo real
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('finance_theme', theme);
}

function confirmThemeChoice() {
  const chooser = document.getElementById('theme-chooser');
  if(chooser) chooser.style.display = 'none';
  // Marcar que já escolheu o tema
  localStorage.setItem('finance_theme_chosen_' + (_currentUser?.id || 'guest'), '1');
  // Iniciar o app
  _launchApp();
}

async function _launchApp() {
  const mainApp = document.getElementById('main-app');
  if (mainApp) {
    mainApp.style.display = 'flex';
    mainApp.style.flexDirection = 'column';
    mainApp.style.minHeight = '100vh';
  }
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) loadingEl.style.display = 'flex';
  try { await loadUserData(); } catch(e) { console.warn('Erro ao carregar dados:', e); }
  if (loadingEl) loadingEl.style.display = 'none';
  updateNavBadge();
  initApp();
}

async function showApp() {
  localStorage.setItem('finance_has_session', '1');
  document.getElementById('auth-screen').style.display = 'none';

  // Verificar se é a primeira vez (nunca escolheu tema)
  const themeChosen = localStorage.getItem('finance_theme_chosen_' + (_currentUser?.id || 'guest'));

  if (!themeChosen) {
    // Primeira vez — mostrar tela de escolha de tema
    const chooser = document.getElementById('theme-chooser');
    if (chooser) {
      chooser.style.display = 'flex';
      // Aplicar tema dark por padrão no chooser
      selectThemeOpt('dark');
    }
  } else {
    // Já escolheu antes — ir direto pro app
    await _launchApp();
  }
}

// ── Atualizar badge de usuário na navbar ──────────────────────
function updateNavBadge() {
  if (!_currentUser) return;

  const name = _userProfile?.name ||
    _currentUser.user_metadata?.full_name ||
    _currentUser.email?.split('@')[0] || 'Você';

  const firstName = name.split(' ')[0];
  const navUser = document.getElementById('nav-username');
  const navAv   = document.getElementById('nav-avatar');
  const mobAv   = document.getElementById('mob-avatar');

  if (navUser) navUser.textContent = firstName;

  const photo = _userProfile?.avatar_url ||
    _currentUser.user_metadata?.avatar_url;

  const color = _userProfile?.color || '#22c55e';
  const emoji = _userProfile?.emoji || '😊';

  if (photo) {
    const img = `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    if (navAv) { navAv.innerHTML = img; navAv.style.background = 'transparent'; }
    if (mobAv) { mobAv.innerHTML = img; mobAv.style.fontSize = '0'; }
  } else {
    const initials = firstName[0].toUpperCase();
    if (navAv) {
      navAv.textContent = initials;
      navAv.style.background = color;
    }
    if (mobAv) mobAv.textContent = emoji;
  }
}

// ── Enter nos campos de auth ──────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const authScreen = document.getElementById('auth-screen');
  if (!authScreen || authScreen.style.display === 'none') return;

  const loginVisible   = document.getElementById('auth-step-login')?.style.display !== 'none';
  const regVisible     = document.getElementById('auth-step-register')?.style.display !== 'none';
  const resetVisible   = document.getElementById('auth-step-reset')?.style.display !== 'none';

  if (loginVisible)  loginWithEmail();
  else if (regVisible)   registerWithEmail();
  else if (resetVisible) sendPasswordReset();
});

