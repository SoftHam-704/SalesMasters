# 📅 Plano de Trabalho - Próximos Passos (12/01/2026)

Este documento descreve as tarefas pendentes e os próximos objetivos para consolidar a estética **Emerald Dark** e a funcionalidade do **SalesMasters**.

---

## 🚀 1. Finalização do Dashboard (Home)
- [ ] **Destaque de Aniversariantes**: Corrigir a especificidade do CSS para garantir que a `box-shadow` esmeralda seja aplicada ao clicar no card de métrica.
- [ ] **Métricas Reais no Goal Gauge**: Substituir o valor estático de 84% no `ProgressRing` por dados dinâmicos vindos do endpoint `/api/crm/sellout/summary`.
- [ ] **Ação "Ver Objetivos"**: Implementar a lógica do botão central do Gauge para abrir um modal de detalhes das metas por indústria.

## 👥 2. Refinação da Página de Clientes (`frmClientes.jsx`)
- [ ] **Card de Cliente Tático**: Aplicar o mesmo padrão visual do `OrderCard` (IDs em badge, bordas esmeralda glass) à lista de clientes.
- [ ] **Filtros de Segmentação**: Integrar filtros rápidos de "Status" (Ativo/Inativo/Positivar) com estética de vidro.
- [ ] **Mini-Mapa/Geolocalização**: (Opcional/Futuro) Adicionar um indicador visual de região no card do cliente.

## ⚡ 3. Masters Engine (Wizard de Pedidos)
- [ ] **Lógica do FAB "Executar"**: Garantir que o botão flutuante na página de pedidos dispare o `OrderDialog` com animação de entrada premium.
- [ ] **Magic Load (F2)**: Revisar a integração do processamento rápido de itens para garantir que a performance seja instantânea.

## 🛠️ 4. Infraestrutura & Sincronização
- [ ] **Monitor de Status (Footer)**: Implementar a lógica real para o indicador "Sync: NORMAL" no rodapé das páginas, consultando o último log de sincronização do banco.
- [ ] **Validação SaveInCloud**: Realizar um teste de stress na API rodando no ambiente de produção para validar latência.

---

## 🎨 Lembrete Estético (Design Tokens)
- **Background**: `#050505` (Obsidian)
- **Accent**: `#10B981` (Emerald)
- **Glass**: `rgba(16, 185, 129, 0.03)` com `backdrop-blur-md`
- **Typography**: Itálicos para títulos de status e interspaced tracking para labels técnicos.

---

> *"The future of sales management is here. Let's build the engine."* 🚀
