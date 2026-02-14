# Task: Implementação do Módulo RepCRM (Embedded)

**Status:** 🏗️ Em Início
**Schema Alvo:** `public` (Master Template)
**Objetivo:** Criar o módulo de CRM especializado para representantes comerciais integrado ao SalesMasters.

---

## 📅 Cronograma de Execução

### Fase 1: Fundação e Estrutura (CONCLUÍDA ✅)
- [x] Execução do Schema SQL (`20_create_repcrm_schema.sql`) no banco master.
- [x] Criação do arquivo de Help Inteligente (`repcrm_intelligent_help.md`).
- [x] Implementação do componente `RepCrmHelpAssistant` no Frontend.
- [x] Configuração do sistema de Permissões (Roles) para o novo módulo.

### Fase 2: Interface de Impacto (Dashboard & 360º) (ATUAL 🔄)
- [x] Criação do `RepCrmDashboard` (Light Mode).
- [x] Implementação do Funil de Vendas (Visual/Agnóstico).
- [x] Cards de Oportunidades com "IA Suggestion".
- [ ] Desenvolvimento da `Ficha 360º do Cliente` (Mapeamento de Indústrias).
- [ ] Sistema de Check-in/Check-out (Simulação mobile).

### Fase 3: Inteligência Financeira (Comissões)
- [ ] Implementação do Motor de Comissões.
- [ ] Rotina de Auditoria de Divergências.
- [ ] Algoritmo de Gap Analysis (Cross-selling).

### Fase 4: Mobilidade e Comunicação
- [ ] Check-in/Check-out via GPS.
- [ ] Relatórios de Visita com Transcrição de Voz (IA).
- [ ] Gatilhos de WhatsApp e Rastreio de E-mail.

---

## 🛠️ Notas Técnicas
- **Isolamento:** Uso de prefixo `repcrm_` em todas as tabelas.
- **Relacionamentos:** As tabelas do CRM possuem campos como `sm_cli_codigo` e `sm_ped_numero` para referenciar o SalesMasters atual sem duplicar o cadastro mestre.
- **Estética:** Foco absoluto em Light Mode, Premium UI, sem placeholders.
