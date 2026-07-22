/* installments.view.js — Parcelas e adianto */

// ── INSTALLMENTS ──
function renderInst(){
  // Agrupa parcelamentos a partir dos lançamentos do cartão
  // Chave única: cardId + nome base (sem número da parcela)
  const fromCards = [];
  const seen = new Set();
  cards.forEach(card=>{
    const groups = {};
    (card.bills||[]).forEach(b=>{
      const m = b.desc && b.desc.match(/\((\d+)\/(\d+)\)$/);
      if(!m) return;
      const name = b.desc.replace(/ \(\d+\/\d+\)$/,'').trim();
      const parcN = parseInt(m[2]);
      const key = card.id + '::' + name + '::' + parcN;
      if(!groups[key]) groups[key]={name,parcels:parcN,paid:0,amt:b.amt,clr:'#3b82f6',cardName:card.name,key};
      if(b._pastPaid) groups[key].paid++;
    });
    Object.values(groups).forEach(g=>{
      if(seen.has(g.key)) return; // dedup
      seen.add(g.key);
      fromCards.push({id:'c'+g.key,name:g.name,total:+(g.amt*g.parcels).toFixed(2),parcels:g.parcels,paid:g.paid,parcelAmt:g.amt,clr:'#3b82f6',ico:'💳',cardName:g.cardName});
    });
  });
  const all = [...installments, ...fromCards].filter(i=>i.paid < i.parcels);

  const total=all.reduce((s,i)=>s+(i.total-((i.parcelAmt||(i.total/i.parcels))*i.paid)),0);
  const monthly=all.reduce((s,i)=>s+(i.parcelAmt||(i.total/i.parcels)),0);
  document.getElementById('inst-total').textContent=fmt(Math.max(total,0));
  document.getElementById('inst-monthly').textContent=fmt(monthly)+'/mês';
  const list=document.getElementById('inst-list');list.innerHTML='';
  if(!all.length){
    list.innerHTML='<div style="color:var(--muted);text-align:center;padding:40px;line-height:2">Nenhum parcelamento.<br><span style="font-size:12px">Lance uma compra parcelada pelo cartão de crédito.</span></div>';
    return;
  }
  all.forEach(inst=>{
    const parcel=inst.parcelAmt||(inst.total/inst.parcels);
    const remaining=Math.max(inst.parcels-inst.paid,0);
    const pct=Math.min((inst.paid/inst.parcels)*100,100);

    // Cor dinâmica baseada no nome do item
    function getInstColor(name){
      const n = (name||'').toLowerCase();
      // Comida / alimentação → laranja
      if(/pizza|hamburguer|burger|ifood|rappi|restaurante|comida|lanche|sushi|padaria|mercado|supermercado|açougue|acougue|cacau|chocolate|sorvete|doce|bebida|café|cafe|bar/.test(n)) return '#f97316';
      // Saúde / farmácia → verde
      if(/farmacia|remedio|médico|medico|saúde|saude|academia|gym|plano de saúde|dentist|hospital|exame/.test(n)) return '#22c55e';
      // Eletro / tech / games → cinza frio
      if(/macbook|iphone|ipad|samsung|notebook|computador|pc|monitor|teclado|mouse|headset|fone|tv|televisão|televisao|eletro|playstation|ps5|ps4|xbox|nintendo|switch|play|console|kindle|tablet|celular|smartphone|câmera|camera|impressora|ar.condicionado|geladeira|fogão|fogao|máquina|maquina|ventilador|microondas/.test(n)) return '#94a3b8';
      // Vestuário / moda → rosa
      if(/roupa|camiseta|calça|calca|sapato|tênis|tenis|moda|loja|shopping|zara|renner|c&a|hering|nike|adidas|vestido|jaqueta/.test(n)) return '#ec4899';
      // Viagem / transporte → azul claro
      if(/viagem|passagem|hotel|airbnb|uber|99|taxi|combustivel|gasolina|pedágio|pedagio|carro|moto|ônibus|onibus|avião|aviao/.test(n)) return '#38bdf8';
      // Educação → roxo
      if(/curso|escola|faculdade|universidade|livro|estudo|aula|treinamento|certificado|udemy|alura|dio/.test(n)) return '#a78bfa';
      // Serviços / assinatura → índigo
      if(/netflix|spotify|amazon|prime|disney|youtube|apple|google|microsoft|adobe|canva|streaming/.test(n)) return '#6366f1';
      // Default → azul
      return '#3b82f6';
    }
    const clr = inst.clr && inst.clr !== '#3b82f6' ? inst.clr : getInstColor(inst.name);
    const d=document.createElement('div');d.className='card fadein';d.style.marginBottom='12px';
    d.innerHTML=`
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:40px;height:40px;border-radius:12px;background:${clr}18;border:1px solid ${clr}30;display:flex;align-items:center;justify-content:center;font-size:18px">${inst.ico||'💳'}</div>
        <div style="flex:1">
          <div style="color:#fff;font-size:14px;font-weight:700">${inst.name}</div>
          <div style="color:var(--muted);font-size:12px">${inst.paid}/${inst.parcels} pagas · ${fmt(parcel)}/mês${inst.cardName?' · '+inst.cardName:''}</div>
        </div>
        <div style="text-align:right">
          <div style="color:var(--red);font-family:var(--num);font-weight:700">${fmt(parcel*remaining)}</div>
          <div style="color:var(--muted);font-size:11px">restam ${remaining}x</div>
        </div>
      </div>
      <div class="prog"><div class="prog-fill" style="width:${pct}%;background:linear-gradient(90deg,${clr}88,${clr})"></div></div>
      ${remaining > 1 ? `<div style="margin-top:10px;display:flex;justify-content:flex-end">
        <button onclick="openAdvanceModal('${inst.id}')" style="background:${clr}12;border:1px solid ${clr}30;border-radius:8px;padding:6px 14px;color:${clr};font-size:12px;font-weight:600;cursor:pointer">⚡ Adiantar parcelas</button>
      </div>` : ''}`;
    list.appendChild(d);
  });
}


// ── INSTALLMENTS CRUD ──
function addInst(){
  const name=document.getElementById('i-name').value.trim();
  const total=parseMaskedAmt(document.getElementById('i-total').value);
  const parcels=parseInt(document.getElementById('i-parcels').value)||0;
  const paid=parseInt(document.getElementById('i-paid').value)||0;
  const missing=[];
  if(!name)    missing.push('Descrição');
  if(!total)   missing.push('Valor total');
  if(!parcels) missing.push('Número de parcelas');
  if(missing.length){ showAlert('Por favor preencha: '+missing.join(', ')+'.','Campos obrigatórios','📝'); return; }
  const colors=['#3b82f6','#8b5cf6','#f59e0b','#22c55e','#ec4899'];
  installments.push({id:Date.now(),name,total,parcels,paid,ico:'💳',clr:colors[installments.length%colors.length]});
  renderInst();closeM('m-inst');
  ['i-name','i-total','i-parcels','i-paid'].forEach(id=>document.getElementById(id).value='');
  autosave();
}


// ── ADIANTO DE PARCELAS ──
let _advInstId = null;   // id do inst (string tipo 'cNubank::iPhone::12')
let _advQty = 1;
let _advAccountId = null;

function openAdvanceModal(instId){
  // Reconstruir o inst a partir do renderInst
  const fromCards = [];
  cards.forEach(card=>{
    const groups = {};
    (card.bills||[]).forEach(b=>{
      const m = b.desc && b.desc.match(/\((\d+)\/(\d+)\)$/);
      if(!m) return;
      const name = b.desc.replace(/ \(\d+\/\d+\)$/, '').trim();
      const parcN = parseInt(m[2]);
      const key = card.id + '::' + name + '::' + parcN;
      if(!groups[key]) groups[key]={name,parcels:parcN,paid:0,amt:b.amt,cardId:card.id,cardName:card.name,key};
      if(b._pastPaid) groups[key].paid++;
    });
    Object.values(groups).forEach(g=>{
      fromCards.push({id:'c'+g.key, name:g.name, parcels:g.parcels, paid:g.paid,
        parcelAmt:g.amt, cardId:g.cardId, cardName:g.cardName, rawKey:g.key});
    });
  });

  const inst = [...installments.map(i=>({...i,rawKey:null})), ...fromCards].find(i=>String(i.id)===String(instId));
  if(!inst) return;

  _advInstId = instId;
  _advQty = 1;
  const remaining = inst.parcels - inst.paid;
  const maxAdv = remaining - 1; // deixa ao menos 1 no futuro (a do mês atual)

  if(maxAdv < 1){ showAlert('Não há parcelas futuras para adiantar.','','ℹ️'); return; }

  document.getElementById('advance-name').textContent = inst.name + (inst.cardName ? ' · ' + inst.cardName : '');
  document.getElementById('advance-amt').textContent = fmt(inst.parcelAmt||(inst.total/inst.parcels));
  document.getElementById('advance-remaining').textContent = remaining + 'x';

  // Slider
  const slider = document.getElementById('advance-slider');
  slider.min = 1; slider.max = maxAdv; slider.value = 1;

  // Botões rápidos
  const btns = document.getElementById('advance-qty-btns');
  btns.innerHTML = '';
  const opts = [1,2,3,5,maxAdv].filter((v,i,a)=>v<=maxAdv&&a.indexOf(v)===i).slice(0,5);
  opts.forEach(n=>{
    const b = document.createElement('button');
    b.className = 'freq-btn' + (n===1?' active-freq':'');
    b.id = 'adv-btn-'+n;
    b.style.cssText = 'flex:1;min-width:48px';
    b.textContent = n===maxAdv && !opts.slice(0,-1).includes(n) ? 'Todas ('+n+')' : n+'x';
    b.onclick = ()=>{ slider.value=n; updateAdvancePreview(n); };
    btns.appendChild(b);
  });

  // Popular chips de conta
  _advAccountId = null;
  const advChips = document.getElementById('advance-account-chips');
  advChips.innerHTML = '';
  document.getElementById('advance-account-err').style.display = 'none';
  bankAccounts.forEach(acc => {
    const chip = document.createElement('button');
    chip.className = 'freq-btn';
    chip.style.cssText = 'font-size:12px;padding:6px 12px;display:flex;align-items:center;gap:6px';
    const bal = getAccBalance(acc);
    chip.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:${acc.clr||'#64748b'};display:inline-block"></span>${acc.name} <span style="color:${bal>=0?'var(--muted)':'var(--red)'};font-size:10px">(${fmt(bal)})</span>`;
    chip.onclick = () => {
      _advAccountId = acc.id;
      advChips.querySelectorAll('button').forEach(b=>b.classList.remove('active-freq'));
      chip.classList.add('active-freq');
      document.getElementById('advance-account-err').style.display = 'none';
    };
    advChips.appendChild(chip);
  });

  updateAdvancePreview(1);
  openM('m-advance');
}

function updateAdvancePreview(qty){
  _advQty = qty;
  const slider = document.getElementById('advance-slider');
  if(slider) slider.value = qty;

  // Highlight botão ativo
  document.querySelectorAll('#advance-qty-btns button').forEach(b=>{
    b.classList.toggle('active-freq', b.id==='adv-btn-'+qty);
  });

  // Buscar inst
  const fromCards = _buildFromCards();
  const inst = [...installments.map(i=>({...i,rawKey:null})), ...fromCards].find(i=>String(i.id)===String(_advInstId));
  if(!inst) return;

  const parcel = inst.parcelAmt||(inst.total/inst.parcels);
  const total = parcel * qty;
  const freed = parcel * qty; // mesmo valor — libera o limite das parcelas adiantadas

  const prev = document.getElementById('advance-preview');
  prev.style.display = 'block';
  prev.style.background = 'rgba(34,197,94,0.06)';
  prev.style.border = '1px solid rgba(34,197,94,0.15)';

  document.getElementById('advance-preview-total').textContent = fmt(total);
  document.getElementById('advance-limit-freed').textContent = fmt(freed);

  // Listar os meses que somem da fatura
  const monthsEl = document.getElementById('advance-preview-months');
  monthsEl.innerHTML = '';
  const now = new Date();
  for(let i=1; i<=qty; i++){
    const d = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const lbl = d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
    row.innerHTML = `<span style="color:var(--muted);font-size:12px">✓ ${lbl}</span><span style="font-family:var(--num);font-size:12px;font-weight:600;color:#4ade80">-${fmt(parcel)}</span>`;
    monthsEl.appendChild(row);
  }
}

function _buildFromCards(){
  const fromCards = [];
  cards.forEach(card=>{
    const groups = {};
    (card.bills||[]).forEach(b=>{
      const m = b.desc && b.desc.match(/\((\d+)\/(\d+)\)$/);
      if(!m) return;
      const name = b.desc.replace(/ \(\d+\/\d+\)$/, '').trim();
      const parcN = parseInt(m[2]);
      const key = card.id + '::' + name + '::' + parcN;
      if(!groups[key]) groups[key]={name,parcels:parcN,paid:0,amt:b.amt,cardId:card.id,cardName:card.name,key};
      if(b._pastPaid) groups[key].paid++;
    });
    Object.values(groups).forEach(g=>{
      fromCards.push({id:'c'+g.key, name:g.name, parcels:g.parcels, paid:g.paid,
        parcelAmt:g.amt, cardId:g.cardId, cardName:g.cardName, rawKey:g.key});
    });
  });
  return fromCards;
}

function confirmAdvance(){
  // Validar conta selecionada
  if(!_advAccountId){
    document.getElementById('advance-account-err').style.display = 'block';
    document.getElementById('advance-account-chips').scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  const fromCards = _buildFromCards();
  const inst = [...installments.map(i=>({...i,rawKey:null})), ...fromCards].find(i=>String(i.id)===String(_advInstId));
  if(!inst) return;

  const qty = _advQty;
  const parcel = inst.parcelAmt||(inst.total/inst.parcels);
  const now = new Date();

  if(inst.rawKey){
    // Parcelamento de cartão: marcar próximas qty parcelas futuras como _pastPaid
    // Identifica o nome base e total de parcelas a partir da rawKey
    const parts = inst.rawKey.split('::');
    const cardId = parseInt(parts[0]);
    const baseName = parts[1];
    const totalParcels = parseInt(parts[2]);
    const card = cards.find(c=>c.id===cardId);
    if(!card) return;

    // Pegar todas as parcelas futuras (sem _pastPaid), ordenadas por número
    const futureBills = card.bills
      .filter(b=>{
        if(b._pastPaid) return false;
        const m = b.desc && b.desc.match(/\((\d+)\/(\d+)\)$/);
        if(!m) return false;
        const name = b.desc.replace(/ \(\d+\/\d+\)$/, '').trim();
        return name === baseName && parseInt(m[2]) === totalParcels;
      })
      .sort((a,b)=>{
        const na = parseInt(a.desc.match(/\((\d+)\/\d+\)/)[1]);
        const nb = parseInt(b.desc.match(/\((\d+)\/\d+\)/)[1]);
        return na - nb;
      });

    // Marcar as primeiras qty como pagas (pula a do mês atual = índice 0)
    const toAdvance = futureBills.slice(1, 1 + qty);
    toAdvance.forEach(b=>{
      b._pastPaid = true;
      // Mover data para hoje para sair das faturas futuras
      b.date = now.toISOString().split('T')[0];
    });

  } else {
    // Parcelamento manual (installments array)
    inst.paid = Math.min(inst.paid + qty, inst.parcels);
  }

  // Registrar transação de débito na conta selecionada
  const totalPaid = parcel * qty;
  const advAcc = bankAccounts.find(a=>a.id===_advAccountId);
  if(advAcc) advAcc.balance = (advAcc.balance||0) - totalPaid;
  txs.unshift({
    id: Date.now(),
    name: '⚡ Adianto: ' + inst.name + ' ('+qty+'x)',
    cat: 'outros',
    amt: -totalPaid,
    date: now.toISOString().split('T')[0],
    accountId: _advAccountId,
    isnew: true
  });

  autosave();
  renderInst();
  renderCards();
  try{ renderOverview(); }catch(e){}
  closeM('m-advance');
  showSaveToast(qty+'x adiantada(s) · '+fmt(totalPaid)+' debitado de '+(advAcc?advAcc.name:'conta'), 'var(--green)', '⚡ Adianto confirmado!');
}


