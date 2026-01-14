# SoftHam - Master Financial Blueprint 💹

Este documento contém a especificação completa da rotina financeira da SoftHam, incluindo a estrutura de dados, regras de negócio e fluxos operacionais para implementação no novo sistema.

---

## 1. Estrutura de Tabelas (Banco de Dados)

As tabelas seguem uma arquitetura de **Contas vs Parcelas**, permitindo controle flexível de pagamentos e recebimentos parciais.

### 1.1 Cadastros Base
*   **fin_plano_contas**: Árvore hierárquica de categorias (Receitas, Despesas Fixas, Despesas Variáveis, etc).
    *   `id`, `codigo`, `descricao`, `tipo` (D/C), `nivel`, `id_pai`, `ativo`.
*   **fin_centro_custo**: Departamentos ou projetos.
    *   `id`, `codigo`, `descricao`, `ativo`.
*   **fin_clientes / fin_fornecedores**: Entidades financeiras.
    *   `id`, `tipo_pessoa`, `cpf_cnpj`, `nome_razao`, `nome_fantasia`, `endereco_completo`, `ativo`.

### 1.2 Contas a Pagar (Payable)
*   **fin_contas_pagar** (Cabeçalho):
    *   `id`, `descricao`, `id_fornecedor`, `numero_documento`, `valor_total`, `valor_pago`, `data_emissao`, `data_vencimento`, `data_pagamento`, `status` (ABERTO, PAGO, CANCELADO), `id_plano_contas`, `id_centro_custo`.
*   **fin_parcelas_pagar** (Itens):
    *   `id`, `id_conta_pagar`, `numero_parcela`, `valor`, `valor_pago`, `juros`, `desconto`, `data_vencimento`, `data_pagamento`, `status`, `observacoes`.

### 1.3 Contas a Receber (Receivable)
*   **fin_contas_receber** (Cabeçalho):
    *   `id`, `descricao`, `id_cliente`, `numero_documento`, `valor_total`, `valor_recebido`, `data_emissao`, `data_vencimento`, `data_recebimento`, `status`.
*   **fin_parcelas_receber** (Itens):
    *   `id`, `id_conta_receber`, `numero_parcela`, `valor`, `valor_recebido`, `juros`, `desconto`, `data_vencimento`, `data_recebimento`, `status`.

---

## 2. Rotinas e Regras de Negócio ⚙️

### 2.1 Geração de Parcelas Automática
Ao criar uma nova conta (Pagar ou Receber), o sistema deve permitir:
*   Informar o `numero_parcelas`.
*   Informar o `intervalo_dias` (ex: 30 dias para mensal).
*   **Cálculo**: O sistema divide o `valor_total` pelo número de parcelas. Eventuais diferenças de centavos na divisão devem ser somadas à **última parcela** para garantir que a soma das parcelas seja exatamente igual ao total da conta.

### 2.2 Rotina de Baixa (Pagamento/Recebimento)
A baixa é realizada no nível da **parcela**.
1.  **Baixa Total**: O valor pago é igual ao valor da parcela (+ juros - descontos). A parcela muda para status 'PAGO'/'RECEBIDO'.
2.  **Baixa Parcial (Regra do Resíduo)**: 
    *   Se o usuário pagar um valor menor que o devido, o sistema pergunta: "Deseja gerar resíduo?".
    *   Se sim, o sistema marca a parcela atual como 'PAGO' (com o valor parcial) e **cria uma nova parcela** vinculada à mesma conta com o saldo remanescente.
    *   A nova parcela herda a data de vencimento original ou pode ser postergada.

### 2.3 Atualização de Status da Conta
*   Após cada baixa de parcela, o sistema verifica se **todas** as parcelas vinculadas àquele cabeçalho estã pagas.
*   Se todas pagas: Status da conta -> 'PAGO'.
*   Se alguma pendente: Status da conta -> 'ABERTO'.

---

## 3. Relatórios Estratégicos 📊

### 3.1 Fluxo de Caixa (Realizado vs Previsto)
*   **Previsto**: Baseado na `data_vencimento` das parcelas em aberto.
*   **Realizado**: Baseado na `data_pagamento/recebimento` de parcelas baixadas.
*   **Agrupamento**: Deve permitir visão Diária, Semanal ou Mensal.

### 3.2 DRE (Demonstrativo de Resultados)
*   Visao por regime de competência ou caixa.
*   Total de Receitas (-) Total de Despesas (por Plano de Contas) = Resultado Líquido.

---

## 4. Integrações Futuras (Roadmap SoftHam) 🚀
*   **Boleto Bancário (Santander)**: Geração de boletos via API e processamento de arquivos de retorno (CNAB400/240).
*   **Conciliação Bancária**: Upload de arquivo OFX para bater o extrato bancário com as baixas do sistema.

---

## 5. Prompt para IA (Copiar e Usar) 🤖

> "Atue como um Arquiteto de Software Sênior. Preciso criar um sistema financeiro completo para a SoftHam. 
> 
> **Requisitos Principais:**
> 1. Estrutura de dados robusta com separação entre Cabeçalho de Conta e Parcelas (1:N).
> 2. Suporte a Clientes e Fornecedores financeiros.
> 3. Plano de Contas e Centros de Custo hierárquicos.
> 4. Motor de geração de parcelas automático (com ajuste de centavos na última parcela).
> 5. Sistema de 'Baixa com Resíduo': Se o pagamento for parcial, deve permitir criar automaticamente uma nova parcela residual.
> 6. Dashboards de Fluxo de Caixa e DRE Simples.
> 
> **Tecnologia Sugerida:** Node.js (Backend) com Postgre SQL e React (Frontend) com ShadcnUI.
> 
> Gere a estrutura SQL inicial e o esqueleto dos endpoints de criação de conta e realização de baixa parcial."
