# 📋 Plano de Expansão: CRM Stealth Tactical Mobile

Este plano detalha a refatoração completa da rotina de CRM/Atendimentos para o Mobile, transicionando de uma lista genérica para um sistema de "Centro de Comando Tático" com foco em alta performance, UX sem atrito e estética premium discreta.

## 🎯 Critérios de Sucesso
- **Engajamento:** Redução do tempo de lançamento de visita em 40%.
- **Estética:** Visual "Stealth" (profissional, sem cores gritantes, alto contraste).
- **Funcionalidade:** Adição de entrada por voz e inteligência de dados antes do lançamento.

## 🛠️ Tech Stack
- **Frontend:** React + Tailwind CSS (Custom Geometry).
- **Animações:** Framer Motion (Transições físicas e staggered reveals).
- **Extra:** Web Speech API para transcrição de voz.

## 🗺️ Estrutura de Arquivos (Modificações)
- `frontend/src/mobile/pages/MobileCRM.jsx` -> Refatoração Total.
- `frontend/src/mobile/components/crm/TacticalCard.jsx` -> Novo componente de interação.
- `frontend/src/mobile/components/crm/VoiceInput.jsx` -> Novo componente de voz.
- `frontend/src/theme/tactical-tokens.css` -> Definição de bordas vivas e paleta stealth.

---

## 🚀 Cronograma de Tarefas

### Fase 1: Fundação & Design "Stealth Tactical"
- [ ] **T-1: Definição de Tokens Visuais**
    - **Agente:** `frontend-specialist`
    - **Ação:** Criar base de estilos com `rounded-none` ou `rounded-sm` (0-2px), paleta de Grays (Slate-950 a Slate-100) e acentos cirúrgicos (Emerald/Amber/Cobalt).
    - **VERIFY:** Ausência de cores vibrantes excessivas e bordas arredondadas padrão.
- [ ] **T-2: Estrutura "Vertical Stream"**
    - **Agente:** `frontend-specialist`
    - **Ação:** Substituir o grid de cards por uma linha do tempo assimétrica com profundidade (Z-axis).
    - **VERIFY:** Layout não-convencional que facilita a leitura rápida.

### Fase 2: Componentes Inteligentes
- [ ] **T-3: Componente TacticalCard**
    - **Agente:** `frontend-specialist`
    - **Ação:** Criar card com metadados: Duração, Sentimento (via ícone tático), e Tags de Indústria.
    - **INPUT:** Dados do `backend/crm_endpoints.js`.
    - **VERIFY:** Exibição clara de qual indústria foi foco da visita.
- [ ] **T-4: Implementação de Voice-to-Text**
    - **Agente:** `frontend-specialist`
    - **Ação:** Adicionar botão de microfone no modal de "Nova Visita" para ditar o campo `descricao`.
    - **VERIFY:** Transcrição funcional via Web Speech API.

### Fase 3: UX & Inteligência
- [ ] **T-5: Inteligência Pré-Visita (Nudges)**
    - **Agente:** `backend-specialist` + `frontend-specialist`
    - **Ação:** Ao selecionar um cliente, buscar Gaps de Sell-Out ou Inatividade e mostrar como "Atenção Tática" no topo do formulário.
    - **VERIFY:** O vendedor recebe um motivo real para conversar com o cliente no ato do lançamento.

---

## ✅ PHASE X: VERIFICAÇÃO FINAL
- [ ] **Purple Ban Check:** Nenhuma cor roxa/violeta utilizada. ✅
- [ ] **Loud Color Check:** Paleta stealth respeitada (tons de cinza, preto e acentos discretos). ✅
- [ ] **UX Audit:** Rodar `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] **Performance:** Garantir animações suaves a 60fps no mobile.
