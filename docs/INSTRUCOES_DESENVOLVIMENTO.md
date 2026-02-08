# 🚨 INSTRUÇÕES CRÍTICAS DE DESENVOLVIMENTO - SALESMASTERS

Este documento serve como um guia obrigatório para evitar erros básicos que derrubaram o sistema recentemente. Leia com atenção antes de realizar qualquer commit ou deploy.

---

## 1. 🛑 SINTAXE É SAGRADA (ERRO 502)
O sistema ficou fora do ar com erro **502 Gateway Timeout** porque o arquivo `backend/orders_endpoints.js` foi enviado com um erro de sintaxe (falta de um `};` no final do arquivo).

*   **A consequência:** O Node.js não inicia. O Nginx tenta conectar na porta 8080, não encontra nada e retorna 502.
*   **A regra:** NUNCA faça deploy sem rodar `node server.js` localmente para garantir que o servidor sobe sem erros de interpretação.

## 2. 📦 FLUXO DE PEDIDOS (ERRO "INDUSTRY NOT INFORMED")
O erro "Industry not informed" ao salvar pedidos ocorre porque o App Mobile está tentando sincronizar itens antes de garantir que o cabeçalho do pedido existe ou está preenchido corretamente.

*   **O erro:** O middleware de banco de dados e as constraints do Postgres exigem `ped_industria` para vincular o pedido à empresa correta.
*   **O fluxo correto:** 
    1.  Gerar o número do pedido (`/api/orders/next-number`).
    2.  Criar o cabeçalho via `POST /api/orders` enviando os campos básicos (`ped_cliente`, `ped_industria`, `ped_tabela`).
    3.  Somente após o sucesso, sincronizar os itens via `/api/mobile/orders/:id/items/sync`.
*   **Atenção:** O arquivo `src/api/orders.ts` no mobile estava tentando "atalhar" esse processo. **Respeite o esquema do banco de dados.**

## 3. 🔐 SEGURANÇA E GIT (PUSH REJECTED)
O GitHub bloqueou o deploy porque foram detectadas "Secrets" (chaves de API ou placeholders de chaves) no histórico de commits (especificamente no arquivo `fix_env_v3.js`).

*   **A regra:** Use arquivos `.env` para chaves. Nunca suba chaves "hardcoded" ou scripts que exponham padrões de chaves sk-....
*   **Solução:** Se o push for negado por regras de repositório, não tente forçar. Limpe o histórico ou use o link de bypass do GitHub se tiver certeza de que é um falso positivo.

## 4. 🏢 REGRAS DE MULTI-TENANCY
*   **O Contexto:** O sistema é multi-empresa (multi-tenant).
*   **A Falha:** Rotas de dados (pedidos, clientes, produtos) **NUNCA** devem usar o `masterPool`. Elas devem sempre usar o pool injetado pelo middleware (`getCurrentPool()`).
*   **A Regra:** Se `getCurrentPool()` for nulo, a requisição deve retornar 403 (Acesso Negado) e pedir novo login. Não tente "quebrar o galho" usando o banco master para dados de vendas.

## 5. 🎨 FRONTEND E BUILD
*   **Botão de Nova Tabela:** No componente `PriceTableImport.jsx`, o input para "Novo Nome" deve ser visível e funcional. Teste a lógica de estado `showNewTableInput` exaustivamente.
*   **Deploy:** Sempre execute `npm run build` e suba a pasta `dist` completa. Não suba arquivos individuais da pasta `src` esperando que o navegador os interprete.

---

** Hamilton, siga este checklist. Erros de sintaxe em ambiente de produção são inaceitáveis.**
