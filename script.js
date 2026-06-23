// ============================================================
// ⚠️  CONFIGURAÇÃO DO SUPABASE
// Substitua os valores abaixo pelos do seu projeto:
//   - SUPABASE_URL  → Project Settings > API > Project URL
//   - SUPABASE_ANON → Project Settings > API > anon public
// ============================================================
const SUPABASE_URL  = "https://gxapixqmexpybbwrqnxt.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4YXBpeHFtZXhweWJid3Jxbnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDk5NjksImV4cCI6MjA5MTY4NTk2OX0.d-_ViDZxZ2EkqfVCU3pMkkjT6HtiSeFr4ibQrRu10sU";

// ===== Helper REST Supabase =====
async function sbGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
  });
  if (!res.ok) throw new Error(`[${table}] ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`[${table}] ${res.status}: ${await res.text()}`);
  return res.json();
}

// Busca o próximo ID disponível (MAX + 1) para tabelas com PK INTEGER sem auto-incremento
async function nextId(table, pkCol) {
  const rows = await sbGet(table, `?select=${pkCol}&order=${pkCol}.desc&limit=1`);
  return rows.length > 0 ? rows[0][pkCol] + 1 : 1;
}

// ===== Catálogo (carregado do Supabase) =====
let CATALOGO = [];

async function carregarCatalogo() {
  try {
    CATALOGO = await sbGet("item_uniforme", "?order=nome");
  } catch (e) {
    console.error("Erro ao carregar catálogo:", e);
    alert("Não foi possível carregar o catálogo.\n\nDetalhe: " + e.message);
  }
}

// ===== Estado =====
let step = 1;
let militar = { nome: "", nip: "", posto: "", om: "" };
let carrinho = [];
let pagamento = { forma: "", parcelas: 1 };
let protocolo = "";

const fmt = v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const total = () => carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);

// ===== Navegação =====
function goStep(n) {
  step = n;
  document.querySelectorAll(".step-section").forEach(s => s.classList.add("hidden"));
  document.getElementById("step" + n).classList.remove("hidden");
  document.querySelectorAll("#stepsNav .step").forEach(el => {
    const k = +el.dataset.step;
    el.classList.toggle("active", k === n);
    el.classList.toggle("done", k < n);
  });
  if (n === 2) renderCatalogo();
  if (n === 3) renderCarrinho();
  if (n === 4) renderPagamento();
  if (n === 5) renderResumo();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== Step 1 =====
function validarMilitar() {
  militar = {
    nome:  document.getElementById("m_nome").value.trim(),
    nip:   document.getElementById("m_nip").value.trim(),
    posto: document.getElementById("m_posto").value,
    om:    document.getElementById("m_om").value.trim(),
  };
  if (!militar.nome || !militar.nip || !militar.posto || !militar.om) {
    alert("Preencha todos os campos obrigatórios."); return;
  }
  goStep(2);
}

// ===== Step 2 - Catálogo =====
function renderCatalogo() {
  if (CATALOGO.length === 0) {
    document.getElementById("catalogo").innerHTML = "<p>Carregando catálogo...</p>";
    return;
  }
  const busca = (document.getElementById("busca").value || "").toLowerCase();
  const lista = CATALOGO.filter(i => i.nome.toLowerCase().includes(busca));

  // item_uniforme não tem coluna de tamanhos — campo livre para o usuário digitar
  const html = lista.map(i => `
    <div class="cat-card">
      <div class="nome">${i.nome}</div>
      ${i.descricao ? `<div class="cat">${i.descricao}</div>` : ""}
      <div class="preco">${fmt(i.preco_unitario)}</div>
      <input type="text" id="tam_${i.id_item}" placeholder="Tamanho (ex: M, 42...)" style="margin-bottom:6px" />
      <button class="btn btn-primary" onclick="addCart(${i.id_item})">+ Adicionar</button>
    </div>`).join("");
  document.getElementById("catalogo").innerHTML = html || "<p>Nenhum item encontrado.</p>";
  document.getElementById("cartCount").textContent = carrinho.length;
}

function addCart(id) {
  const item = CATALOGO.find(i => i.id_item === id);
  const tamInput = document.getElementById("tam_" + id);
  const tam = tamInput.value.trim();
  if (!tam) { alert("Informe o tamanho antes de adicionar."); tamInput.focus(); return; }
  const existe = carrinho.find(c => c.id === id && c.tamanho === tam);
  if (existe) existe.quantidade++;
  else carrinho.push({ id, nome: item.nome, tamanho: tam, preco: Number(item.preco_unitario), quantidade: 1 });
  document.getElementById("cartCount").textContent = carrinho.length;
  alert(item.nome + " (" + tam + ") adicionado!");
}

// ===== Step 3 - Carrinho =====
function renderCarrinho() {
  const c = document.getElementById("carrinhoContainer");
  if (carrinho.length === 0) { c.innerHTML = "<p class='muted'>Carrinho vazio.</p>"; return; }
  c.innerHTML = `
    <table>
      <thead><tr><th>Item</th><th>Tam.</th><th>Qtd</th><th>Unit.</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>
        ${carrinho.map((c, i) => `
          <tr>
            <td>${c.nome}</td><td>${c.tamanho}</td>
            <td><input type="number" min="1" value="${c.quantidade}" onchange="updateQtd(${i}, this.value)"></td>
            <td>${fmt(c.preco)}</td>
            <td><b>${fmt(c.preco * c.quantidade)}</b></td>
            <td><button class="btn btn-danger" onclick="removeItem(${i})">Remover</button></td>
          </tr>`).join("")}
        <tr class="total-row"><td colspan="4" style="text-align:right">TOTAL:</td><td colspan="2">${fmt(total())}</td></tr>
      </tbody>
    </table>`;
}
function updateQtd(i, v) { const q = +v; if (q < 1) return; carrinho[i].quantidade = q; renderCarrinho(); }
function removeItem(i) { carrinho.splice(i, 1); renderCarrinho(); }

function irPagamento() {
  if (carrinho.length === 0) { alert("Adicione ao menos um item ao carrinho."); return; }
  goStep(4);
}

// ===== Step 4 - Pagamento =====
function renderPagamento() {
  document.getElementById("pagTotal").textContent = fmt(total());
  const opts = [
    { f: "Credifarda",  d: "Desconto em folha" },
    { f: "Nota OM",     d: "Faturamento via Organização Militar" },
    { f: "Particular",  d: "Mínimo R$ 30,00 por parcela · até 10x" },
  ];
  document.getElementById("pagOpcoes").innerHTML = opts.map(o => `
    <label class="pag-opt ${pagamento.forma === o.f ? "selected" : ""}">
      <input type="radio" name="pag" value="${o.f}" ${pagamento.forma === o.f ? "checked" : ""} onchange="selPag('${o.f}')">
      <b>${o.f}</b><small>${o.d}</small>
    </label>`).join("");
  updateParcelas();
}
function selPag(f) { pagamento = { forma: f, parcelas: 1 }; renderPagamento(); }
function updateParcelas() {
  const box = document.getElementById("parcelasBox");
  if (pagamento.forma !== "Particular") { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  const max = Math.min(10, Math.max(1, Math.floor(total() / 30)));
  const sel = document.getElementById("parcelas");
  sel.innerHTML = "";
  for (let n = 1; n <= max; n++) {
    const o = document.createElement("option");
    o.value = n; o.textContent = `${n}x de ${fmt(total() / n)}`;
    sel.appendChild(o);
  }
  sel.onchange = e => pagamento.parcelas = +e.target.value;
}
function validarPagamento() {
  if (!pagamento.forma) { alert("Escolha uma forma de pagamento."); return; }
  goStep(5);
}

// ===== Step 5 - Resumo =====
function renderResumo() {
  document.getElementById("resumoBox").innerHTML = `
    <div class="resumo-card">
      <h3>Militar</h3>
      <div>${militar.nome} · NIP ${militar.nip}</div>
      <div>${militar.posto} · ${militar.om}</div>
    </div>
    <div class="resumo-card">
      <h3>Itens</h3>
      ${carrinho.map(c => `<div class="linha"><span>${c.quantidade}x ${c.nome} (${c.tamanho})</span><span>${fmt(c.preco * c.quantidade)}</span></div>`).join("")}
      <div class="total">Total: ${fmt(total())}</div>
    </div>
    <div class="resumo-card">
      <h3>Pagamento</h3>
      <div>${pagamento.forma}${pagamento.forma === "Particular" ? ` em ${pagamento.parcelas}x de ${fmt(total() / pagamento.parcelas)}` : ""}</div>
    </div>`;
}

// ===== Confirmar e salvar no Supabase =====
async function confirmar() {
  const btn = document.querySelector("#step5 .btn-success");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    protocolo = "MB" + Date.now().toString().slice(-8);
    const agora = new Date().toISOString();
    const prazo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // 1. Inserir ou ignorar militar (PK = nip)
    const militaresExistentes = await sbGet("militar", `?nip=eq.${encodeURIComponent(militar.nip)}&select=nip`);
    if (militaresExistentes.length === 0) {
      await sbPost("militar", {
        nip:                militar.nip,
        nome_completo:      militar.nome,
        posto_graduacao:    militar.posto,
        organizacao_militar: militar.om,
      });
    }

    // 2. Criar encomenda
    const idEncomenda = await nextId("encomenda", "id_encomenda");
    await sbPost("encomenda", {
      id_encomenda:     idEncomenda,
      nip:              militar.nip,
      status:           "Confirmada",
      data_criacao:     agora,
      data_confirmacao: agora,
      prazo_retirada:   prazo,
      valor_total:      total(),
    });

    // 3. Criar itens da encomenda
    let idItemEncomenda = await nextId("item_encomenda", "id_item_encomenda");
    const itensSalvar = carrinho.map(c => ({
      id_item_encomenda: idItemEncomenda++,
      id_encomenda:      idEncomenda,
      id_item:           c.id,
      tamanho:           c.tamanho,
      quantidade:        c.quantidade,
      valor_unitario:    c.preco,
      valor_parcial:     c.preco * c.quantidade,
    }));
    await sbPost("item_encomenda", itensSalvar);

    // 4. Criar pagamento
    const idPagamento = await nextId("pagamento", "id_pagamento");
    await sbPost("pagamento", {
      id_pagamento:    idPagamento,
      id_encomenda:    idEncomenda,
      forma_pagamento: pagamento.forma,
      num_parcelas:    pagamento.parcelas,
      valor_parcela:   pagamento.forma === "Particular" ? total() / pagamento.parcelas : null,
    });

    // 5. Avançar
    gerarPDF();
    document.getElementById("protoLabel").textContent = protocolo;
    goStep(6);

  } catch (err) {
    console.error("Erro ao salvar pedido:", err);
    alert("Erro ao salvar o pedido no banco de dados.\n\nDetalhe: " + err.message);
    btn.disabled = false;
    btn.textContent = "✓ Confirmar e gerar PDF";
  }
}

// ===== PDF =====
function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = new Date().toLocaleString("pt-BR");

  doc.setFillColor(0, 33, 71); doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(14);
  doc.text("MARINHA DO BRASIL", 105, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text("Sistema de Encomendas de Uniformes", 105, 20, { align: "center" });

  doc.setTextColor(0, 0, 0); doc.setFontSize(12);
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
  doc.setFillColor(230, 230, 230); doc.rect(14, 99, 182, 7, "F");
  doc.text("Item", 16, 104); doc.text("Tam.", 110, 104);
  doc.text("Qtd", 130, 104); doc.text("Unit.", 150, 104); doc.text("Subtotal", 175, 104);

  let y = 112;
  carrinho.forEach(c => {
    doc.text(c.nome.substring(0, 50), 16, y);
    doc.text(c.tamanho, 110, y);
    doc.text(String(c.quantidade), 130, y);
    doc.text(fmt(c.preco), 150, y);
    doc.text(fmt(c.preco * c.quantidade), 175, y);
    y += 7;
  });

  y += 4; doc.setFontSize(11);
  doc.text(`TOTAL: ${fmt(total())}`, 196, y, { align: "right" });
  y += 12; doc.setFontSize(10);
  doc.text(`Forma de Pagamento: ${pagamento.forma}${pagamento.forma === "Particular" ? ` em ${pagamento.parcelas}x` : ""}`, 14, y);
  y += 12; doc.setFontSize(9); doc.setTextColor(150, 0, 0);
  doc.text("IMPORTANTE: Comparecer em até 7 dias para retirada dos itens.", 14, y);

  doc.save(`encomenda_${protocolo}.pdf`);
}

// ===== Reset =====
function resetar() {
  militar = { nome: "", nip: "", posto: "", om: "" };
  carrinho = []; pagamento = { forma: "", parcelas: 1 }; protocolo = "";
  ["m_nome", "m_nip", "m_posto", "m_om"].forEach(id => document.getElementById(id).value = "");
  goStep(1);
}

// ===== Init =====
(async () => {
  await carregarCatalogo();
  goStep(1);
})();
