# 📅 Plano de Trabalho - 06/02/2026

## 🎯 Objetivo Principal
Revisar e consolidar as regras de descontos no sistema, integrando a lógica de **descontos por cliente e grupo de produtos**.

---

## 📝 Tarefas para Amanhã Cedo:

1.  **Revisão de Regras de Descontos**:
    *   Analisar a implementação realizada hoje nos endpoints de descontos.
    *   Validar a persistência e aplicação correta dos descontos por cliente e grupo de produtos.
    *   Garantir que a regra de precedência (cliente + grupo) esteja operando conforme o esperado no cálculo do pedido.

2.  **Sincronização com o Frontend**:
    *   Verificar se o `OrderForm` está exibindo e aplicando esses descontos automáticos corretamente ao selecionar itens.
    *   Validar as mensagens de feedback visual para o vendedor quando um desconto de grupo/cliente for aplicado.

3.  **Check de Banco de Dados**:
    *   Confirmar se as tabelas de descontos (ex: `cli_descpro`) estão sincronizadas em todos os tenants (schemas).

---

## 💡 Contexto da Sessão Anterior (05/02):
*   Finalizamos a padronização visual dos status dos pedidos (Pedidos, Faturados, Cotações, etc.).
*   Ajustamos a aba "02 - Arq. texto" no wizard de pedidos.
*   Iniciamos a estruturação dos endpoints de descontos táticos.

---

> *"Amanhã cedo focamos na inteligência comercial dos descontos. Bom descanso!"* 🚀
