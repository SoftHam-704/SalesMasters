# RepCRM - Guia de Inteligência e Onboarding

Este arquivo serve como base para o Assistente Virtual (Help-Bot) do CRM. 
Cada seção corresponde a uma funcionalidade do sistema.

---

## 🧭 Módulo: Dashboard Mestre (Visão Geral)
**Contexto:** Primeira tela após o login (Estratégico).
**Dicas do Assistente:**
1. **Dados Reais e BI:** Agora seus KPIs de Faturamento e Positivação são alimentados em tempo real pelo motor de BI. Não há mais atraso entre o pedido e o painel.
2. **Meta Conectada:** A meta agora busca os valores da tabela `ind_metas`. Se você selecionar uma indústria específica, verá o quanto falta para atingir o objetivo apenas daquela representada.
3. **Funil de Vendas Vivo:** O funil reflete o somatório financeiro exato de todas as suas oportunidades abertas. Se uma proposta esfriar, o impacto no funil é imediato.
4. **Positivação Inteligente:** Saiba quantos clientes únicos compraram no período selecionado e compare com o mês anterior para medir a capilaridade da sua carteira.

---

## 🏢 Módulo: Ficha 360º do Cliente
**Contexto:** Gestão profunda do relacionamento e inteligência de vendas.
**Dicas do Assistente:**
1. **Matriz de Penetração (GAPs):** Esta é a ferramenta mais poderosa para vender mais. O sistema cruza todo o seu catálogo com as compras do cliente e mostra exatamente em quais indústrias ele possui GAPs (oportunidades de abertura).
2. **Check-in Georreferenciado:** Use o botão de Check-in ao visitar o cliente. O sistema captura sua localização exata, permitindo criar um histórico de visitas inegável para prestação de contas com as fábricas.
3. **Timeline Unificada:** Toda a conversa, pedido e visita fica registrada aqui. Antes de entrar em uma reunião, role a timeline para saber exatamente o que foi acordado na última vez.
4. **Ações de Contato:** Clique nos ícones de WhatsApp para abrir a conversa já com o contato certo, ou no Mapa para traçar a rota até a porta do cliente.

---

## 💰 Módulo: Gestão de Comissões
**Contexto:** Tela de fluxo financeiro e conciliação.
**Dicas do Assistente:**
1. **Comissões Previstas:** Este valor é uma estimativa baseada nos seus pedidos enviados. Ele só se torna "Real" quando a indústria fatura o pedido.
2. **Divergências:** Se a indústria pagou um valor diferente do calculado, o sistema marcará em laranja. Verifique o motivo antes de conciliar.
3. **Datas de Pagamento:** Organize seu fluxo de caixa vendo a previsão de recebimento para os próximos 15, 30 e 60 dias.

---

## 📍 Módulo: Visitas e Relatórios de Campo
**Contexto:** Uso do App Mobile durante a rota externa.
**Dicas do Assistente:**
1. **Check-in de Segurança:** Ao chegar no cliente, inicie a visita. Isso organiza sua agenda e prova para a indústria que você está cobrindo a região conforme o contrato.
2. **Use sua Voz:** Não perca tempo digitando em teclados pequenos. Use o ícone de microfone no Checkout para narrar o que foi conversado. Eu vou transformar sua fala em texto e tarefas!
3. **Fotos do Local:** Fotos tiradas aqui dentro ficam salvas na cronologia do cliente. Ótimo para consultar layouts de galpões ou prateleiras em visitas futuras.
4. **Relatório Instantâneo:** Terminou a visita e quer impressionar a fábrica? Clique em 'Gerar PDF de Visita' e envie o sumário completo para seu gerente em segundos.

---

## 👥 Módulo: Gestão de Equipe e Permissões
**Contexto:** Área de Configurações de Usuários e Dashboards de Liderança.
**Dicas do Assistente:**
1. **Hierarquia de Dados:** Fique tranquilo, seus vendedores só veem o que pertence a eles. Já o seu perfil de Admin tem a visão panorâmica de todo o negócio.
2. **Perfil Backoffice:** Ideal para sua equipe interna. Eles ajudam na operação mas não precisam ver quanto você ganha de comissão. Use o nível 'Auxiliar' para isso.
3. **Monitoramento de Campo:** O mapa de calor mostra o esforço da sua equipe. Se uma região está cinza, significa que não há visitas registradas ali há mais de 30 dias.
4. **Metas Coletivas:** Você pode definir uma meta para a representação inteira e acompanhar o progresso individual de cada braço da sua equipe.

---

## 🔧 Módulo: Configuras de Indústrias (Personalidade)
**Contexto:** Cadastro ou edição de Indústria/Representada.
**Dicas do Assistente:**
1. **Escolha do Modelo:** A dica de ouro é: Como você vende para esta fábrica? Se for venda rápida de itens, selecione 'Transacional'. Se for venda técnica que exige desenho ou engenharia, use 'Consultivo'.
2. **Por que isso importa?** O RepCRM vai esconder campos inúteis e mostrar ferramentas específicas. No modo 'Consultivo', por exemplo, você ganha uma área para anexar fotos de galpões e plantas.
3. **Prazos de Entrega:** No modo Transacional, os prazos costumam ser curtos. No Consultivo, o sistema te ajuda a monitorar prazos de fabricação e montagem no cliente.
4. **Impacto no Funil:** Ao mudar o modelo aqui, seu Funil de Vendas lá no Dashboard mudará automaticamente para as etapas que fazem sentido para este negócio.
