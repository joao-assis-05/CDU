// ===== Catálogo =====
const CATALOGO = [
  { id:1, nome:"Camisa Branca Manga Curta", categoria:"Camisa", preco:85.00, tamanhos:["P","M","G","GG"] },
  { id:2, nome:"Camisa Branca Manga Longa", categoria:"Camisa", preco:110.00, tamanhos:["P","M","G","GG"] },
  { id:3, nome:"Calça Branca Social", categoria:"Calça", preco:145.00, tamanhos:["38","40","42","44","46"] },
  { id:4, nome:"Calça Tropical Cáqui", categoria:"Calça", preco:130.00, tamanhos:["38","40","42","44","46"] },
  { id:5, nome:"Boné de Serviço", categoria:"Cobertura", preco:65.00, tamanhos:["P","M","G"] },
  { id:6, nome:"Quepe Branco", categoria:"Cobertura", preco:220.00, tamanhos:["54","56","58","60"] },
  { id:7, nome:"Cinto Branco", categoria:"Acessório", preco:55.00, tamanhos:["Único"] },
  { id:8, nome:"Gravata Preta", categoria:"Acessório", preco:35.00, tamanhos:["Único"] },
  { id:9, nome:"Meia Branca (par)", categoria:"Acessório", preco:18.00, tamanhos:["Único"] },
  { id:10, nome:"Sapato Social Preto", categoria:"Calçado", preco:280.00, tamanhos:["38","39","40","41","42","43","44"] },
];

// ===== Estado =====
let step = 1;
let militar = { nome:"", nip:"", posto:"", om:"" };
let carrinho = [];
let pagamento = { forma:"", parcelas:1 };
let protocolo = "";

const fmt = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const total = () => carrinho.reduce((s,i)=>s+i.preco*i.quantidade,0);

// ===== Navegação =====
function goStep(n){
  step = n;
  document.querySelectorAll(".step-section").forEach(s=>s.classList.add("hidden"));
  document.getElementById("step"+n).classList.remove("hidden");
  document.querySelectorAll("#stepsNav .step").forEach(el=>{
    const k = +el.dataset.step;
    el.classList.toggle("active", k===n);
    el.classList.toggle("done", k<n);
  });
  if(n===2) renderCatalogo();
  if(n===3) renderCarrinho();
  if(n===4) renderPagamento();
  if(n===5) renderResumo();
  window.scrollTo({top:0,behavior:"smooth"});
}

// ===== Step 1 =====
function validarMilitar(){
  militar = {
    nome: document.getElementById("m_nome").value.trim(),
    nip: document.getElementById("m_nip").value.trim(),
    posto: document.getElementById("m_posto").value,
    om: document.getElementById("m_om").value.trim(),
  };
  if(!militar.nome||!militar.nip||!militar.posto||!militar.om){
    alert("Preencha todos os campos obrigatórios."); return;
  }
  goStep(2);
}

// ===== Step 2 - Catálogo =====
function renderCatalogo(){
  const busca = (document.getElementById("busca").value||"").toLowerCase();
  const lista = CATALOGO.filter(i=>i.nome.toLowerCase().includes(busca)||i.categoria.toLowerCase().includes(busca));
  const html = lista.map(i=>`
    <div class="cat-card">
      <div class="cat">${i.categoria}</div>
      <div class="nome">${i.nome}</div>
      <div class="preco">${fmt(i.preco)}</div>
      <select id="tam_${i.id}">${i.tamanhos.map(t=>`<option>${t}</option>`).join("")}</select>
      <button class="btn btn-primary" onclick="addCart(${i.id})">+ Adicionar</button>
    </div>`).join("");
  document.getElementById("catalogo").innerHTML = html || "<p>Nenhum item.</p>";
  document.getElementById("cartCount").textContent = carrinho.length;
}
function addCart(id){
  const item = CATALOGO.find(i=>i.id===id);
  const tam = document.getElementById("tam_"+id).value;
  const existe = carrinho.find(c=>c.id===id && c.tamanho===tam);
  if(existe) existe.quantidade++;
  else carrinho.push({id, nome:item.nome, tamanho:tam, preco:item.preco, quantidade:1});
  document.getElementById("cartCount").textContent = carrinho.length;
  alert(item.nome+" ("+tam+") adicionado!");
}

// ===== Step 3 - Carrinho =====
function renderCarrinho(){
  const c = document.getElementById("carrinhoContainer");
  if(carrinho.length===0){ c.innerHTML = "<p class='muted'>Carrinho vazio.</p>"; return; }
  c.innerHTML = `
    <table>
      <thead><tr><th>Item</th><th>Tam.</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>
        ${carrinho.map((c,i)=>`
          <tr>
            <td>${c.nome}</td><td>${c.tamanho}</td>
            <td><input type="number" min="1" value="${c.quantidade}" onchange="updateQtd(${i}, this.value)"></td>
            <td>${fmt(c.preco)}</td>
            <td><b>${fmt(c.preco*c.quantidade)}</b></td>
            <td><button class="btn btn-danger" onclick="removeItem(${i})">Remover</button></td>
          </tr>`).join("")}
        <tr class="total-row"><td colspan="4" style="text-align:right">TOTAL:</td><td colspan="2">${fmt(total())}</td></tr>
      </tbody>
    </table>`;
}
function updateQtd(i,v){ const q=+v; if(q<1) return; carrinho[i].quantidade=q; renderCarrinho(); }
function removeItem(i){ carrinho.splice(i,1); renderCarrinho(); }

function irPagamento(){
  if(carrinho.length===0){ alert("Adicione ao menos um item ao carrinho."); return; }
  goStep(4);
}

// ===== Step 4 - Pagamento =====
function renderPagamento(){
  document.getElementById("pagTotal").textContent = fmt(total());
  const opts = [
    {f:"Credifarda", d:"Desconto em folha"},
    {f:"Nota OM", d:"Faturamento via Organização Militar"},
    {f:"Particular", d:"Mínimo R$ 30,00 por parcela · até 10x"},
  ];
  document.getElementById("pagOpcoes").innerHTML = opts.map(o=>`
    <label class="pag-opt ${pagamento.forma===o.f?'selected':''}">
      <input type="radio" name="pag" value="${o.f}" ${pagamento.forma===o.f?'checked':''} onchange="selPag('${o.f}')">
      <b>${o.f}</b><small>${o.d}</small>
    </label>`).join("");
  updateParcelas();
}
function selPag(f){
  pagamento = { forma:f, parcelas:1 };
  renderPagamento();
}
function updateParcelas(){
  const box = document.getElementById("parcelasBox");
  if(pagamento.forma!=="Particular"){ box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  const max = Math.min(10, Math.max(1, Math.floor(total()/30)));
  const sel = document.getElementById("parcelas");
  sel.innerHTML = "";
  for(let n=1;n<=max;n++){
    const o = document.createElement("option");
    o.value = n; o.textContent = `${n}x de ${fmt(total()/n)}`;
    sel.appendChild(o);
  }
  sel.onchange = e => pagamento.parcelas = +e.target.value;
}
function validarPagamento(){
  if(!pagamento.forma){ alert("Escolha uma forma de pagamento."); return; }
  goStep(5);
}

// ===== Step 5 - Resumo =====
function renderResumo(){
  document.getElementById("resumoBox").innerHTML = `
    <div class="resumo-card">
      <h3>Militar</h3>
      <div>${militar.nome} · NIP ${militar.nip}</div>
      <div>${militar.posto} · ${militar.om}</div>
    </div>
    <div class="resumo-card">
      <h3>Itens</h3>
      ${carrinho.map(c=>`<div class="linha"><span>${c.quantidade}x ${c.nome} (${c.tamanho})</span><span>${fmt(c.preco*c.quantidade)}</span></div>`).join("")}
      <div class="total">Total: ${fmt(total())}</div>
    </div>
    <div class="resumo-card">
      <h3>Pagamento</h3>
      <div>${pagamento.forma}${pagamento.forma==="Particular"?` em ${pagamento.parcelas}x de ${fmt(total()/pagamento.parcelas)}`:""}</div>
    </div>`;
}

// ===== Confirmar =====
function confirmar(){
  protocolo = "MB" + Date.now().toString().slice(-8);
  const pedido = { protocolo, militar, itens:carrinho, total:total(), pagamento, data:new Date().toISOString() };
  const lista = JSON.parse(localStorage.getItem("pedidos")||"[]");
  lista.push(pedido);
  localStorage.setItem("pedidos", JSON.stringify(lista));
  gerarPDF();
  document.getElementById("protoLabel").textContent = protocolo;
  goStep(6);
}

// ===== PDF =====
function gerarPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = new Date().toLocaleString("pt-BR");

  doc.setFillColor(0,33,71); doc.rect(0,0,210,28,"F");
  doc.setTextColor(255,255,255); doc.setFontSize(14);
  doc.text("MARINHA DO BRASIL", 105, 12, {align:"center"});
  doc.setFontSize(10);
  doc.text("Sistema de Encomendas de Uniformes", 105, 20, {align:"center"});

  doc.setTextColor(0,0,0); doc.setFontSize(12);
  doc.text(`Protocolo: ${protocolo}`, 14, 40);
  doc.text(`Data: ${data}`, 14, 47);

  doc.setFontSize(11); doc.text("Dados do Militar", 14, 58);
  doc.setFontSize(10);
  doc.text(`Nome: ${militar.nome}`, 14, 65);
  doc.text(`NIP: ${militar.nip}`, 14, 71);
  doc.text(`Posto/Graduação: ${militar.posto}`, 14, 77);
  doc.text(`OM: ${militar.om}`, 14, 83);

  doc.setFontSize(11); doc.text("Itens da Encomenda", 14, 95);
  doc.setFontSize(9);
  doc.setFillColor(230,230,230); doc.rect(14,99,182,7,"F");
  doc.text("Item",16,104); doc.text("Tam.",110,104);
  doc.text("Qtd",130,104); doc.text("Unit.",150,104); doc.text("Subtotal",175,104);

  let y = 112;
  carrinho.forEach(c=>{
    doc.text(c.nome.substring(0,50), 16, y);
    doc.text(c.tamanho, 110, y);
    doc.text(String(c.quantidade), 130, y);
    doc.text(fmt(c.preco), 150, y);
    doc.text(fmt(c.preco*c.quantidade), 175, y);
    y += 7;
  });

  y += 4;
  doc.setFontSize(11);
  doc.text(`TOTAL: ${fmt(total())}`, 196, y, {align:"right"});

  y += 12; doc.setFontSize(10);
  doc.text(`Forma de Pagamento: ${pagamento.forma}${pagamento.forma==="Particular"?` em ${pagamento.parcelas}x`:""}`, 14, y);

  y += 12; doc.setFontSize(9); doc.setTextColor(150,0,0);
  doc.text("IMPORTANTE: Comparecer em até 7 dias para retirada dos itens.", 14, y);

  doc.save(`encomenda_${protocolo}.pdf`);
}

// ===== Reset =====
function resetar(){
  militar = {nome:"",nip:"",posto:"",om:""};
  carrinho = []; pagamento = {forma:"",parcelas:1}; protocolo = "";
  ["m_nome","m_nip","m_posto","m_om"].forEach(id=>document.getElementById(id).value="");
  goStep(1);
}

// init
goStep(1);
