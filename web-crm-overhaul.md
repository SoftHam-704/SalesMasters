# 📋 Plano de Refatoração: CRM Web Command Center

Transformação da rotina de CRM/Atendimentos Web em um "Centro de Comando Tático" de alto nível, com estética premium discreta (Stealth) e foco em inteligência comercial.

## 🎯 Critérios de Sucesso
- **Estética:** Visual "Direct Intelligence" (bordas vivas, paleta sóbria, tipografia técnica).
- **UX:** Mudança de contextos (Kanban -> Timeline -> Dashboard) com animações fluidas.
- **Inteligência:** Integração de alertas de inatividade e gaps de venda no fluxo principal.

## 🛠️ Tech Stack
- **Frontend:** React + Tailwind CSS.
- **Animações:** Framer Motion (Transições de estado e micro-interações).
- **UI:** Custom components com geometria sharp (0-2px).

## 🗺️ Estrutura de Arquivos
- `frontend/src/pages/CRMPage.jsx` -> Refatoração Estrutural.
- `frontend/src/theme/tactical-web.css` -> Tokens específicos para Desktop.
- `frontend/src/components/crm/TacticalMetric.jsx` -> Novo componente de métricas.

---

## 🚀 Cronograma de Tarefas

### Fase 1: Fundação Estética (Stealth Design)
- [ ] **WEB-1: Design System "Stealth"**
    - **Agente:** `frontend-specialist`
    - **Ação:** Definir paleta Slate-950, bordas Slate-800 de 1px, e acentos "Signal" (Emerald para positivo, Amber para atenção).
    - **VERIFY:** Ausência de roxo e bordas arredondadas suaves.
- [ ] **WEB-2: Refatoração do Layout Principal**
    - **Agente:** `frontend-specialist`
    - **Ação:** Implementar header tático com info de performance em tempo real.

### Fase 2: Módulos de Inteligência
- [ ] **WEB-3: Timeline de "Operações"**
    - **Agente:** `frontend-specialist`
    - **Ação:** Redesenhar o histórico como um log de sistema (estilo log tático) com filtros rápidos e busca poderosa.
- [ ] **WEB-4: Cartões de "Oportunidade de Impacto"**
    - **Agente:** `frontend-specialist`
    - **Ação:** Criar seção de alertas automáticos baseados nos Gaps de Sell-Out integrados do backend.

### Fase 3: Polimento & WOW
- [ ] **WEB-5: Animações de Transição de Visão**
    - **Agente:** `frontend-specialist`
    - **Ação:** Usar Framer Motion para transição suave entre Kanban e Dashboard.
- [ ] **WEB-6: Testes e Auditoria UX**
    - **Ação:** Executar `ux_audit.py` e verificar conformidade com as Leis de Gestalt.

---

## ✅ PHASE X: VERIFICAÇÃO FINAL
- [ ] **Purple Ban:** Validado.
- [ ] **Sharp Geometry:** Validado (max 4px radius).
- [ ] **Loud Colors:** Eliminadas.
