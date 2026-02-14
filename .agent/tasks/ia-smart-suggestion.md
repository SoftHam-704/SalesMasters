# Task: Implement IA Smart Suggestion System

Implement the "Motor de Sugestão Inteligente de Compras" as described in `plano_sugestao_compras_ia.md`.

## Status
- [ ] Backend: Database schema for IA suggestions cache
- [ ] Backend: Analytical motor (SQL queries for history, gaps, and ABC curve)
- [ ] Backend: OpenAI API Integration (Structured Outputs)
- [ ] Backend: API Endpoint `/api/orders/smart-ia-suggestions`
- [ ] Frontend: `SmartSuggestionDialog.jsx` component
- [ ] Frontend: Integration in `OrderForm.jsx`

## Implementation Details

### Phase 1: Database & Backend Logic
1. Create `sugestoes_ia` table.
2. Implement backend logic to fetch context data (history, gaps, etc.).

### Phase 2: AI Integration
1. Interface with OpenAI.
2. Define input context and output schema.

### Phase 3: Frontend Component
1. Build a premium dialog to show suggestions.
2. Add "Add to Order" functionality.
