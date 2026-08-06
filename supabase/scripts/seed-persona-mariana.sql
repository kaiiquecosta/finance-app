-- Persona fictícia "Mariana Costa" — seed para conta real
-- Gerado por scripts/generate-mariana-seed-sql.ts
-- E-mail alvo: contatokaiiquecosta@gmail.com
-- Rode no SQL Editor do Supabase (service role). Ajuste o e-mail se necessário.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com') THEN
    RAISE EXCEPTION 'Usuário não encontrado: contatokaiiquecosta@gmail.com';
  END IF;
END $$;

-- bank_accounts
INSERT INTO public.bank_accounts (id, user_id, name, color, account_type, initial_balance)
VALUES
  (7101, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Nubank — conta corrente', '#8b5cf6', 'corrente', 3842.17),
  (7102, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Itaú — salário', '#f97316', 'corrente', 1250),
  (7103, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Poupança reserva', '#22c55e', 'poupanca', 8500)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- cards
INSERT INTO public.cards (id, user_id, name, color, card_limit, close_day, due_day, card_type)
VALUES
  (7201, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Nubank', '#8b5cf6', 8500, 10, 17, 'Crédito'),
  (7202, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Itaú Click', '#f97316', 12000, 5, 12, 'Crédito')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- card_bills
INSERT INTO public.card_bills (id, user_id, card_id, description, amt, date, is_past_paid, recurring)
VALUES
  (7301, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7201, 'Supermercado Pão de Açúcar', 487.32, '2026-08-02', false, false),
  (7302, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7201, 'Uber / 99', 156.4, '2026-08-04', false, false),
  (7303, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7201, 'Farmácia Drogasil', 89.9, '2026-08-05', false, false),
  (7304, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7201, 'Amazon BR', 234.5, '2026-07-28', false, false),
  (7305, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7201, 'Posto Shell', 320, '2026-07-15', true, false),
  (7311, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7202, 'Restaurante Outback', 198, '2026-08-01', false, false),
  (7312, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 7202, 'Decathlon', 449.99, '2026-07-22', false, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- fixed_bills
INSERT INTO public.fixed_bills (id, user_id, name, amt, due_day, icon, color, category, paid, paid_at, paid_amount)
VALUES
  (7401, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Aluguel', 2200, 5, '🏠', '#3b82f6', 'Moradia', true, '2026-08-05', 2200),
  (7402, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Condomínio', 680, 10, '🏢', '#6366f1', 'Moradia', false, null, null),
  (7403, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Energia (Enel)', 187.44, 12, '⚡', '#eab308', 'Moradia', false, null, null),
  (7404, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Água (Sabesp)', 92.3, 15, '💧', '#06b6d4', 'Moradia', false, null, null),
  (7405, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Internet Vivo Fibra', 129.99, 8, '📶', '#a855f7', 'Moradia', true, '2026-08-07', 129.99),
  (7406, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Gás (Ultragaz)', 110, 20, '🔥', '#f97316', 'Moradia', false, null, null),
  (7407, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Plano de saúde Unimed', 456.8, 3, '🏥', '#ef4444', 'Saúde', true, '2026-08-03', 456.8),
  (7408, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Seguro auto Porto', 289.9, 25, '🚗', '#64748b', 'Transporte', false, null, null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- subscriptions
INSERT INTO public.subscriptions (id, user_id, name, amt, day, icon, color, card_id)
VALUES
  (7501, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Netflix', 55.9, 12, '🎬', '#ef4444', 7201),
  (7502, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Spotify', 27.9, 8, '🎵', '#22c55e', 7201),
  (7503, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Disney+', 46.9, 15, '🏰', '#3b82f6', 7201),
  (7504, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'HBO Max', 34.9, 20, '🎭', '#8b5cf6', 7202),
  (7505, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'iCloud+ 200GB', 19.9, 1, '☁️', '#64748b', 7201),
  (7506, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Smart Fit', 119.9, 5, '💪', '#eab308', null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- installments
INSERT INTO public.installments (id, user_id, name, total, parcels, paid, icon, color, card_id)
VALUES
  (7601, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'iPhone 15 — Apple Store', 6599, 12, 4, '📱', '#64748b', 7201),
  (7602, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Geladeira Brastemp', 2899, 10, 7, '🧊', '#06b6d4', 7202)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- goals
INSERT INTO public.goals (id, user_id, name, target, saved, icon, color, deadline)
VALUES
  (7701, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Viagem Disney', 35000, 8200, '🏰', '#22c55e', '2027-07-01'),
  (7702, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Reserva de emergência', 18000, 11200, '🛡️', '#3b82f6', null),
  (7703, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Entrada do apê', 80000, 24500, '🏠', '#f97316', '2028-12-01')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- incomes
INSERT INTO public.incomes (id, user_id, name, amt, freq, icon, color, account_id, days, received, auto)
VALUES
  (7901, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Salário — Empresa XYZ', 6500, 'mensal', '💼', '#22c55e', 7102, '[5]', '["2026-08-05"]', true),
  (7902, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Freelance design', 1800, 'mensal', '🎨', '#8b5cf6', 7101, '[15]', '["2026-07-15"]', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- investments
INSERT INTO public.investments (id, user_id, name, bank, amount, date, inv_type, pct, spread, yield_pct, ticker, account_id)
VALUES
  (7801, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'CDB Sofisa 110% CDI', 'Sofisa', 15000, '2025-11-10', 'cdb', 110, 0, 0, null, 7103),
  (7802, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Tesouro Selic 2029', 'Tesouro Direto', 5200, '2026-01-20', 'selic', 100, 0, 0, null, null),
  (7803, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Maxi Renda', 'XP', 2400, '2026-03-05', 'fii', 0, 0, 8.2, 'MXRF11', null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

-- transactions
INSERT INTO public.transactions (id, user_id, name, cat, amt, date, account_id, investment_id, bill_id, income_key, is_new)
VALUES
  (8001, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Salário agosto', 'salario', 6500, '2026-08-05', 7102, null, null, null, false),
  (8002, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Aluguel pago', 'moradia', -2200, '2026-08-05', 7101, null, null, null, false),
  (8003, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Condomínio', 'moradia', -680, '2026-08-09', 7101, null, null, null, false),
  (8004, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Supermercado', 'mercado', -312.45, '2026-08-03', 7101, null, null, null, false),
  (8005, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Padaria', 'alimentacao', -28.5, '2026-08-04', 7101, null, null, null, false),
  (8006, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'iFood', 'alimentacao', -67.9, '2026-08-05', 7101, null, null, null, false),
  (8007, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Uber', 'transporte', -24.3, '2026-08-06', 7101, null, null, null, false),
  (8008, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Posto Ipiranga', 'transporte', -280, '2026-08-01', 7101, null, null, null, false),
  (8009, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Farmácia', 'saude', -45.6, '2026-08-02', 7101, null, null, null, false),
  (8010, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Academia (mensalidade)', 'lazer', -119.9, '2026-08-05', 7101, null, null, null, false),
  (8011, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Freelance — logo cliente A', 'freelance', 900, '2026-07-15', 7101, null, null, null, false),
  (8012, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Restaurante', 'lazer', -198, '2026-07-30', 7101, null, null, null, false),
  (8013, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Cinema', 'lazer', -82, '2026-07-26', 7101, null, null, null, false),
  (8014, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Salário julho', 'salario', 6500, '2026-07-05', 7102, null, null, null, false),
  (8015, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Energia julho', 'moradia', -176.2, '2026-07-12', 7101, null, null, null, false),
  (8016, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Água julho', 'moradia', -88.1, '2026-07-14', 7101, null, null, null, false),
  (8017, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Internet', 'moradia', -129.99, '2026-07-08', 7101, null, null, null, false),
  (8018, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Presente aniversário', 'outros', -150, '2026-07-20', 7101, null, null, null, false),
  (8019, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Pix recebido — freelance', 'freelance', 1800, '2026-06-15', 7101, null, null, null, false),
  (8020, (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1), 'Salário junho', 'salario', 6500, '2026-06-05', 7102, null, null, null, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  amt = EXCLUDED.amt;

UPDATE public.profiles SET name = 'Mariana Costa', emoji = '👩‍💻', color = '#8b5cf6'
WHERE id = (SELECT id FROM auth.users WHERE email = 'contatokaiiquecosta@gmail.com' LIMIT 1);
