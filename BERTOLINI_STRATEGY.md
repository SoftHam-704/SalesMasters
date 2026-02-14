# Estratégia Bertolini - SalesMasters (Nicho Projetos)

## 🎯 Objetivo
Adaptar o SalesMasters para o nicho de Engenharia/Projetos (Venda Consultiva de Galpões e Armazéns) sem interferir no funcionamento da produção do sistema tradicional.

## 🚀 Descobertas da Validação
1. **Ciclo de Venda:** Longo, técnico, baseado em fases (Leads -> Visita -> Projeto -> Obra).
2. **Atendimento:** O WhatsApp é o maior gargalo. Necessidade urgente de automação/triagem de leads vindos das redes sociais.
3. **Base de Clientes:** 1.000+ nomes sem gestão. Oportunidade gigante para CRM e mimos/aniversários.

## 🛠️ Decisões Técnicas (Arquitetura)
- **Isolamento Total:** As telas de inserção (como `OrderFormProjetos.jsx`) serão independentes.
- **Válvula de Escape:** Uso do campo `ite_nomeprod` na tabela `itens_ped` para sobrescrever descrições genéricas com detalhes técnicos da obra.
- **Campos Técnicos Já Identificados:**
  - `ite_dimensoes` (Área, Pé-direito)
  - `ite_acabamento`
  - `ite_carga_kg`
  - `ite_ambiente`

## 📅 Pendências para Próxima Sessão (Amanhã)
1. **Modelo de Proposta:** Analisar o PDF/Documento do cliente.
2. **Definição de Hierarquia:** Decidir se os dados técnicos ficam nos itens ou se migram para as observações do pedido (`ped_obs` / `ped_obs_tecnicas`).
3. **Plano de Automação Leads:** Desenhar o fluxo de entrada do WhatsApp para o Dashboard.

## ✅ Concluído (Sessão Atual)
1. **Console de Projetos MASTER:** Criada via `ProjectConsole.jsx` com interface premium, pipeline de status dinâmico e Radar de Viabilidade.
2. **Independência Total:** Mapeamento de rotas e menus isolados para não impactar o sistema tradicional.
3. **Design System Bertollini:** Implementação de identidade visual vibrante (Azul Royal + Esmeralda) com foco em alta legibilidade.

---
*Anotado em: 14/02/2026*
