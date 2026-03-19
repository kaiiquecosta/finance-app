<div align="center">

# 💰 Finance App

**Controle financeiro pessoal completo, moderno e gratuito**

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://finance-app-one-weld.vercel.app)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)

[**🚀 Acessar o App**](https://finance-app-one-weld.vercel.app) &nbsp;•&nbsp; [**📖 Como usar**](#-como-usar) &nbsp;•&nbsp; [**🛠️ Deploy**](#%EF%B8%8F-como-fazer-o-deploy)

</div>

---

## ✨ Sobre o projeto

Finance é um app web de controle financeiro pessoal com design moderno, focado em simplicidade e praticidade. Construído com HTML, CSS e JavaScript puro no frontend e Supabase (PostgreSQL) como backend — sem frameworks, sem complexidade.

> Cada usuário tem seus dados **100% isolados e sincronizados** em tempo real na nuvem.

---

## 🚀 Funcionalidades

### 📊 Visão Geral
- Dashboard com resumo completo do mês
- Gráfico de pizza com **gastos por categoria** em tempo real
- Saldo de todas as contas bancárias consolidado
- Insight personalizado com análise de gastos vs mês anterior
- Visão anual interativa com barras por mês
- Potencial de investimento baseado nas sobras mensais

### 💸 Transações
- Lançamento rápido de gastos e receitas
- Categorias com ícones e cores automáticas
- Filtro por mês, categoria e forma de pagamento (PIX, débito, crédito)
- Histórico completo com edição e exclusão

### 💳 Cartões de Crédito
- Múltiplos cartões com limite, data de fechamento e vencimento
- Lançamentos **simples**, **parcelados** e **assinaturas**
- Controle de fatura por mês com navegação temporal
- Ajuste de limite com botões rápidos (+/- R$500, R$1k)

### 📅 Parcelas
- Visualização de todos os parcelamentos ativos com progresso
- ⚡ **Adianto de parcelas** com seleção de conta de débito
- Preview dos meses que somem da fatura e limite liberado
- Cores automáticas por categoria (tech, comida, moda, saúde...)

### 🔁 Assinaturas
- Controle de serviços recorrentes (Netflix, Spotify, etc.)
- Projeção mensal e anual de gastos
- Detecção automática de ícone pelo nome

### 🏠 Contas Fixas
- Cadastro com dia de vencimento e categoria
- Pagamento com confirmação e histórico
- Lembretes automáticos próximo ao vencimento
- Projeção dos próximos 3 meses

### 🎯 Metas Financeiras
- Criação de metas com prazo e valor alvo
- Depósitos e retiradas com registro automático nas transações
- Barra de progresso visual por meta

### 📈 Investimentos
Suporte completo a múltiplos tipos:

| Tipo | IR | Cálculo |
|------|-----|---------|
| 🏦 CDB % CDI | Regressivo 22,5% → 15% | % do CDI atual |
| 🌿 LCI/LCA | **Isento** | % do CDI |
| 📊 Tesouro IPCA+ | Regressivo | IPCA + spread |
| 🏛️ Tesouro Selic | Regressivo | ~100% CDI |
| 📈 Ações BR/EUA | 15% lucro | Rentabilidade estimada |
| 🏢 FIIs | **Isento** (dividendos) | Rentabilidade estimada |
| ₿ Cripto | 15% lucro | Rentabilidade estimada |
| 🐷 Poupança | **Isento** | 70% Selic |

- CDI e IPCA atualizados via **API do Banco Central**
- **Resgate parcial ou total** com seleção de conta destino
- Rendimento atualizado diariamente de forma automática

### 🏦 Contas Bancárias
- Múltiplas contas com saldo calculado em tempo real (saldo inicial + transações)
- Seleção de conta em cada transação
- Suporte a todos os bancos com cores personalizadas

### 💰 Rendas
- Rendas recorrentes mensais, quinzenais e semanais
- Lançamento automático no início de cada período
- Toggle de recebido/não recebido por mês

### 🌐 Mercado Financeiro
- **Índices:** Selic, CDI, IPCA, Ibovespa, S&P 500
- **Câmbio:** Dólar e Euro em tempo real
- **Cripto:** Bitcoin, Ethereum, Solana
- **Ações:** B3 e NASDAQ

---

## 🔐 Autenticação

- ✅ **Email e senha** com verificação por email
- ✅ **Login com Google** (OAuth 2.0)
- ✅ Recuperação de senha por email
- ✅ Escolha de tema **dark/light** na primeira vez
- ✅ Sessão persistente — não precisa logar toda vez
- ✅ Dados de cada usuário **100% isolados** via Row Level Security

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Backend / Banco | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth + Google OAuth |
| Hospedagem | Vercel |
| Email transacional | Resend |
| APIs externas | Banco Central do Brasil, Yahoo Finance |
| Design | Inter + Bricolage Grotesque |

---

## 📁 Estrutura

```
finance-app/
├── index.html              # App completo
├── supabase_schema.sql     # Schema do banco
├── README.md
└── assets/
    ├── css/
    │   ├── variables.css   # Design tokens
    │   ├── base.css        # Layout e componentes
    │   ├── auth.css        # Tela de autenticação
    │   ├── light.css       # Tema claro
    │   └── animations.css  # Animações e responsivo
    └── js/
        ├── core.js
        ├── auth.js
        ├── keydown.js
        ├── services/
        │   ├── db.js       # Camada Supabase
        │   ├── bank.js
        │   ├── income.js
        │   └── reminders.js
        └── views/
            ├── overview.js
            ├── transactions.js
            ├── installments.js
            ├── subscriptions.js
            ├── cards.js
            ├── goals.js
            ├── investments.js
            └── bills.js
```

---

## ⚙️ Como fazer o Deploy

### 1. Supabase (banco de dados)
```
1. Crie um projeto em supabase.com
2. SQL Editor → cole e execute o supabase_schema.sql
3. Settings → API → copie a Project URL e anon key
```

### 2. Configurar credenciais no index.html
```javascript
const SUPABASE_URL  = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'SUA_ANON_PUBLIC_KEY';
```

### 3. Google OAuth (opcional)
```
1. console.cloud.google.com → Credentials → OAuth 2.0 Client ID
2. Redirect URI: https://SEU_PROJECT.supabase.co/auth/v1/callback
3. Supabase → Authentication → Providers → Google → cole Client ID e Secret
```

### 4. Email com Resend
```
1. resend.com → API Keys → criar chave
2. Supabase → Authentication → Email → Enable Custom SMTP
   Host: smtp.resend.com | Port: 465
   User: resend | Password: sua API key
```

### 5. Deploy no Vercel
```
1. Suba o projeto no GitHub
2. Importe em vercel.com → Deploy
3. Supabase → Authentication → URL Configuration
   Site URL: https://seu-app.vercel.app
   Redirect URLs: https://seu-app.vercel.app/**
```

---

## 💡 Como Usar

1. Acesse o app e crie sua conta com email ou Google
2. Na **primeira vez**, escolha o tema dark ou light
3. Adicione suas **contas bancárias** com saldo inicial
4. Cadastre suas **rendas** recorrentes
5. Lance suas **transações** do dia a dia
6. Adicione seus **cartões** e lance na fatura
7. Acompanhe tudo no **Dashboard**

---

## 🔒 Segurança

- Row Level Security (RLS) em todas as tabelas do banco
- Cada usuário acessa **somente** seus próprios dados
- Senhas gerenciadas pelo Supabase Auth — nunca armazenadas em texto plano
- Tokens JWT com expiração automática

---

## 📄 Licença

MIT License — sinta-se livre para usar, modificar e distribuir.

---

<div align="center">

Feito com ❤️ por [**Kaique Costa**](https://github.com/kaiiquecosta)

Se gostou do projeto, deixa uma ⭐ no repositório!

</div>
