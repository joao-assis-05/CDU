# ⚓ Sistema de Encomendas de Uniformes — Marinha do Brasil

Sistema web para registro de encomendas de uniformes militares, com catálogo dinâmico, carrinho de compras, seleção de forma de pagamento e geração de comprovante em PDF. Os dados são persistidos em banco de dados via [Supabase](https://supabase.com).

> Projeto desenvolvido para a disciplina de Utilização de Banco de Dados — FAETERJ-Rio.

---

## 📋 Funcionalidades

- Identificação do militar por NIP (criação automática de novo registro caso não exista)
- Catálogo de itens carregado dinamicamente do banco de dados
- Carrinho com controle de quantidade e remoção de itens
- Formas de pagamento: Credifarda, Nota OM e Particular (com parcelamento)
- Resumo do pedido antes da confirmação
- Geração de comprovante em PDF ao confirmar
- Armazenamento completo do pedido no Supabase (militar, encomenda, itens e pagamento)

---

## 🗄️ Modelo de Banco de Dados

```
MILITAR (nip PK, nome_completo, posto_graduacao, organizacao_militar)
ENCOMENDA (id_encomenda PK, nip FK, status, data_criacao, data_confirmacao, prazo_retirada, valor_total)
ITEM_ENCOMENDA (id_item_encomenda PK, id_encomenda FK, id_item FK, tamanho, quantidade, valor_unitario, valor_parcial)
PAGAMENTO (id_pagamento PK, id_encomenda FK, forma_pagamento, num_parcelas, valor_parcela)
ITEM_UNIFORME (id_item PK, nome, descricao, preco_unitario)
```

---

## 🚀 Como rodar localmente

**Pré-requisitos:** Git e um navegador moderno.

```bash
git clone https://github.com/joao-assis-05/CDU.git
cd CDU
```

Abra o `index.html` diretamente no navegador ou use uma extensão como Live Server no VS Code.

---

## ⚙️ Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, crie as tabelas conforme o modelo acima e aplique as políticas de RLS
3. No arquivo `script.js`, preencha as variáveis no topo do arquivo:

```js
const SUPABASE_URL  = "https://xxxx.supabase.co";
const SUPABASE_ANON = "sua-chave-anon-aqui";
```

---

## 🔐 Políticas de acesso (RLS)

O Supabase bloqueia todos os acessos por padrão. É necessário habilitar RLS e criar políticas de leitura/escrita pública para as tabelas `item_uniforme`, `militar`, `encomenda`, `item_encomenda` e `pagamento`. Um script SQL com todas as políticas está disponível no arquivo `rls_policies.sql`.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML / CSS / JavaScript | Interface do sistema |
| [Supabase](https://supabase.com) | Banco de dados PostgreSQL + API REST |
| [jsPDF](https://github.com/parallax/jsPDF) | Geração de comprovante em PDF |

---

## 📁 Estrutura do projeto

```
CDU/
├── index.html       # Estrutura da interface (6 etapas)
├── script.js        # Lógica do sistema e integração com Supabase
└── style.css        # Estilos visuais
```

---

## 👥 Autores

Desenvolvido pelos alunos do curso de Tecnologia em Análise e Desenvolvimento de Sistemas — FAETERJ-Rio:
João Manoel Assis de Oliveira
Isabela Vieira dos Santos Carneiro
