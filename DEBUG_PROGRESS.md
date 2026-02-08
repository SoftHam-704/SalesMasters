# Status de Depuração - Relatório de Vendas & CRM
Data: 2026-02-02 (Noite)

## ✅ O que foi resolvido hoje:
1.  **Deploy & Cache**: Superamos o problema do PM2 que não atualizava os arquivos. Agora usamos `crm_endpoints_v2.js` e `reports_endpoints_v2.js`.
2.  **Saúde do Backend**: Confirmado que o backend está ouvindo e carregando os módulos novos (visto via `/api/reports/check-alive`).
3.  **Erro do CRM**: O erro `column data_hora does not exist` foi corrigido nos arquivos V2 (alterado para `data_interacao`).

## 🔍 Onde paramos (O Mistério do Mapa de Vendas):
O relatório de vendas está sendo chamado, o backend está ativo, mas o componente no navegador continua sem mostrar dados (ou a requisição não está chegando como deveria).

## 🚀 Próximos Passos (Amanhã):
1.  **Verificar Status do Pedido**: Rodar o script SQL/Python para ver quais são as siglas de `ped_situacao` no banco. Se o banco não usar 'P' ou 'F', o relatório v2 (que usa esse filtro) virá vazio.
2.  **Console do Navegador**: Verificar no F12 se o clique no botão disparou a chamada para `/api/reports/vendas` e se retornou algum JSON.
3.  **Logs de Vendas**: Observar o PM2 para ver se aparece o log `📍 [VENDAS_ROUTE]` no momento do clique. Se não aparecer, o problema é o Frontend chamando a URL errada.
4.  **Ajuste de Filtros**: Se o problema for o status, vamos ajustar o `IN ('P', 'F')` para incluir os status reais dos dados do cliente.

---
*Anotação deixada por Antigravity (IA).*
