/* db.service.js — Camada de dados (substitui localStorage) */


/* =============================================================
   assets/js/services/db.js
   Camada de dados: substitui localStorage pelo Supabase
   Todas as funções retornam Promise
   ============================================================= */

// ── Helper: user_id atual ─────────────────────────────────────
function uid() {
  return _currentUser?.id;
}

// ── Autosave (substitui localStorage.setItem) ─────────────────
// Debounce para não salvar a cada keystroke
let _saveTimer = null;
function autosave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => _syncToSupabase(), 800);
}

async function _syncToSupabase() {
  if (!uid()) return;
  try {
    await Promise.all([
      _upsertTransactions(),
      _upsertCards(),
      _upsertInstallments(),
      _upsertSubscriptions(),
      _upsertGoals(),
      _upsertBankAccounts(),
      _upsertIncomes(),
      _upsertFixedBills(),
      _upsertInvestments(),
    ]);
  } catch(e) {
    console.warn('Sync error:', e);
  }
}

// ── Carregar todos os dados do usuário (substitui applyData) ──
async function loadUserData() {
  if (!uid()) return;

  const [
    { data: txData },
    { data: cardsData },
    { data: cardBillsData },
    { data: instData },
    { data: subsData },
    { data: goalsData },
    { data: bankData },
    { data: incomeData },
    { data: billsData },
    { data: invData },
  ] = await Promise.all([
    sb.from('transactions').select('*').eq('user_id', uid()).order('date', { ascending: false }),
    sb.from('cards').select('*').eq('user_id', uid()),
    sb.from('card_bills').select('*').eq('user_id', uid()),
    sb.from('installments').select('*').eq('user_id', uid()),
    sb.from('subscriptions').select('*').eq('user_id', uid()),
    sb.from('goals').select('*').eq('user_id', uid()),
    sb.from('bank_accounts').select('*').eq('user_id', uid()),
    sb.from('incomes').select('*').eq('user_id', uid()),
    sb.from('fixed_bills').select('*').eq('user_id', uid()),
    sb.from('investments').select('*').eq('user_id', uid()),
  ]);

  // Mapear de volta para o formato do app
  txs = (txData || []).map(r => ({
    id: r.id, name: r.name, cat: r.cat, amt: Number(r.amt),
    date: r.date, accountId: r.account_id,
    _investmentId: r.investment_id, _billId: r.bill_id,
    _incomeKey: r.income_key, isnew: false
  }));

  // Reconstruir cards com bills aninhados
  cards = (cardsData || []).map(c => ({
    id: c.id, name: c.name, clr: c.color,
    limit: Number(c.card_limit), closeDay: c.close_day,
    dueDay: c.due_day, type: c.card_type,
    bills: (cardBillsData || [])
      .filter(b => b.card_id === c.id)
      .map(b => ({
        id: b.id, desc: b.description, amt: Number(b.amt),
        date: b.date, _pastPaid: b.is_past_paid, recurring: b.recurring
      }))
  }));

  installments = (instData || []).map(r => ({
    id: r.id, name: r.name, total: Number(r.total),
    parcels: r.parcels, paid: r.paid, ico: r.icon,
    clr: r.color, cardId: r.card_id
  }));

  subscriptions = (subsData || []).map(r => ({
    id: r.id, name: r.name, amt: Number(r.amt),
    day: r.day, ico: r.icon, clr: r.color, cardId: r.card_id
  }));

  goals = (goalsData || []).map(r => ({
    id: r.id, name: r.name, target: Number(r.target),
    saved: Number(r.saved), ico: r.icon, clr: r.color, dl: r.deadline
  }));

  bankAccounts = (bankData || []).map(r => ({
    id: r.id, name: r.name, clr: r.color,
    type: r.account_type, initialBalance: Number(r.initial_balance)
  }));

  incomes = (incomeData || []).map(r => ({
    id: r.id, name: r.name, amt: Number(r.amt),
    freq: r.freq, ico: r.icon, clr: r.color,
    accountId: r.account_id, days: r.days || []
  }));

  fixedBills = (billsData || []).map(r => ({
    id: r.id, name: r.name, amt: Number(r.amt),
    dueDay: r.due_day, ico: r.icon, clr: r.color,
    cat: r.category, paid: r.paid, paidAt: r.paid_at
  }));

  investments = (invData || []).map(r => ({
    id: r.id, name: r.name, bank: r.bank,
    amount: Number(r.amount), date: r.date,
    type: r.inv_type, pct: Number(r.pct),
    spread: Number(r.spread), yield: Number(r.yield_pct),
    ticker: r.ticker, accountId: r.account_id
  }));
}

// ── Upserts individuais por tabela ────────────────────────────

async function _upsertTransactions() {
  if (!uid() || !txs.length) return;
  const rows = txs.map(t => ({
    id: t.id, user_id: uid(), name: t.name, cat: t.cat,
    amt: t.amt, date: t.date, account_id: t.accountId || null,
    investment_id: t._investmentId || null,
    bill_id: t._billId || null, income_key: t._incomeKey || null
  }));
  await sb.from('transactions').upsert(rows, { onConflict: 'id' });
}

async function _upsertCards() {
  if (!uid()) return;
  // Upsert cards
  if (cards.length) {
    const cardRows = cards.map(c => ({
      id: c.id, user_id: uid(), name: c.name, color: c.clr,
      card_limit: c.limit, close_day: c.closeDay,
      due_day: c.dueDay, card_type: c.type || 'Crédito'
    }));
    await sb.from('cards').upsert(cardRows, { onConflict: 'id' });
  }
  // Upsert card_bills
  const allBills = cards.flatMap(c =>
    (c.bills || []).map(b => ({
      id: b.id, user_id: uid(), card_id: c.id,
      description: b.desc, amt: b.amt, date: b.date,
      is_past_paid: b._pastPaid || false, recurring: b.recurring || false
    }))
  );
  if (allBills.length) {
    await sb.from('card_bills').upsert(allBills, { onConflict: 'id' });
  }
}

async function _upsertInstallments() {
  if (!uid() || !installments.length) return;
  const rows = installments.map(i => ({
    id: i.id, user_id: uid(), name: i.name, total: i.total,
    parcels: i.parcels, paid: i.paid, icon: i.ico || '💳',
    color: i.clr || '#3b82f6', card_id: i.cardId || null
  }));
  await sb.from('installments').upsert(rows, { onConflict: 'id' });
}

async function _upsertSubscriptions() {
  if (!uid() || !subscriptions.length) return;
  const rows = subscriptions.map(s => ({
    id: s.id, user_id: uid(), name: s.name, amt: s.amt,
    day: s.day, icon: s.ico || '📱', color: s.clr || '#8b5cf6',
    card_id: s.cardId || null
  }));
  await sb.from('subscriptions').upsert(rows, { onConflict: 'id' });
}

async function _upsertGoals() {
  if (!uid() || !goals.length) return;
  const rows = goals.map(g => ({
    id: g.id, user_id: uid(), name: g.name, target: g.target,
    saved: g.saved, icon: g.ico || '🎯', color: g.clr || '#22c55e',
    deadline: g.dl || null
  }));
  await sb.from('goals').upsert(rows, { onConflict: 'id' });
}

async function _upsertBankAccounts() {
  if (!uid() || !bankAccounts.length) return;
  const rows = bankAccounts.map(a => ({
    id: a.id, user_id: uid(), name: a.name, color: a.clr || '#64748b',
    account_type: a.type || 'corrente', initial_balance: a.initialBalance || 0
  }));
  await sb.from('bank_accounts').upsert(rows, { onConflict: 'id' });
}

async function _upsertIncomes() {
  if (!uid() || !incomes.length) return;
  const rows = incomes.map(i => ({
    id: i.id, user_id: uid(), name: i.name, amt: i.amt,
    freq: i.freq || 'mensal', icon: i.ico || '💰',
    color: i.clr || '#22c55e', account_id: i.accountId || null,
    days: JSON.stringify(i.days || [])
  }));
  await sb.from('incomes').upsert(rows, { onConflict: 'id' });
}

async function _upsertFixedBills() {
  if (!uid() || !fixedBills.length) return;
  const rows = fixedBills.map(b => ({
    id: b.id, user_id: uid(), name: b.name, amt: b.amt,
    due_day: b.dueDay || 10, icon: b.ico || '📄',
    color: b.clr || '#3b82f6', category: b.cat || 'Outros',
    paid: b.paid || false, paid_at: b.paidAt || null
  }));
  await sb.from('fixed_bills').upsert(rows, { onConflict: 'id' });
}

async function _upsertInvestments() {
  if (!uid() || !investments.length) return;
  const rows = investments.map(i => ({
    id: i.id, user_id: uid(), name: i.name, bank: i.bank || null,
    amount: i.amount, date: i.date, inv_type: i.type || 'cdb',
    pct: i.pct || 0, spread: i.spread || 0,
    yield_pct: i.yield || 0, ticker: i.ticker || null,
    account_id: i.accountId || null
  }));
  await sb.from('investments').upsert(rows, { onConflict: 'id' });
}

// ── Deletar registros removidos ────────────────────────────────
async function deleteFromDB(table, id) {
  if (!uid()) return;
  await sb.from(table).delete().eq('id', id).eq('user_id', uid());
}

// Wrappers semânticos para cada entidade
const DB = {
  deleteTransaction:  id => deleteFromDB('transactions', id),
  deleteCard:         id => deleteFromDB('cards', id),
  deleteCardBill:     id => deleteFromDB('card_bills', id),
  deleteInstallment:  id => deleteFromDB('installments', id),
  deleteSubscription: id => deleteFromDB('subscriptions', id),
  deleteGoal:         id => deleteFromDB('goals', id),
  deleteBankAccount:  id => deleteFromDB('bank_accounts', id),
  deleteIncome:       id => deleteFromDB('incomes', id),
  deleteFixedBill:    id => deleteFromDB('fixed_bills', id),
  deleteInvestment:   id => deleteFromDB('investments', id),
};

