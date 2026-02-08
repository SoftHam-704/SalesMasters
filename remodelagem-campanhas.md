---
task: remodelagem-campanhas
title: Remodelagem da Rotina de Campanhas SalesMasters
status: em-progresso
priority: alta
---

# Remodelagem da Rotina de Campanhas

O usuário solicitou uma reformulação completa da rotina de campanhas para um modelo mais consultivo e focado em metas de Sell-Out com verbas negociadas.

## 🛠 Revisão Técnica

- **Passo 1 (Identificação):** Capturar Cliente, Setor, Região e Equipe.
- **Passo 2 (Baseline):** Calcular faturamento histórico (Sell-Out) em períodos Bimestral, Trimestral, Semestral ou Anual.
- **Passo 3 (Objetivo):** Definir percentual de crescimento.
- **Passo 4 (Verba):** Informar valor da verba solicitada (Input manual do usuário).
- **Passo 5/6 (Ação):** Tema e Período de vigência.
- **Passo 7-10 (Fechamento):** Resultados reais, crescimento vs objetivo, justificativa e premiações.

## 📋 Lista de Tarefas

### Fase 1: Banco de Dados 🗄️
- [ ] Criar migration para adicionar campos:
    - `cmp_setor` (VARCHAR 100)
    - `cmp_regiao` (VARCHAR 100)
    - `cmp_equipe_vendas` (INTEGER)
    - `cmp_verba_solicitada` (NUMERIC 15,2)
    - `cmp_tema` (VARCHAR 200)
    - `cmp_justificativa` (TEXT)
    - `cmp_premiacoes` (TEXT)

### Fase 2: Backend 🧠
- [ ] Atualizar `server.js` (ou endpoint específico):
    - Refatorar `/api/v2/campaigns/simulate` para aceitar seleção de período histórico.
    - Implementar cálculo de dias úteis (Seg-Sáb).
    - Salvar novos campos no `POST` e `PUT`.

### Fase 3: Frontend 🎨
- [ ] Criar novo componente `CampaignWizardForm.jsx` (ou refatorar o atual).
- [ ] Etapa 1: Dados do Cliente + Setor/Região/Equipe.
- [ ] Etapa 2: Seleção de Período Histórico + Meta + Verba.
- [ ] Etapa 3: Tema + Datas da Campanha.
- [ ] Etapa 4: Auditoria e Encerramento (Exibir apenas se em status de conclusão ou finalizada).

## 📅 Cronograma de Execução

1. **DB Updates** -> Imediato
2. **Backend Logic** -> Seguinte
3. **Frontend Refactor** -> Final
