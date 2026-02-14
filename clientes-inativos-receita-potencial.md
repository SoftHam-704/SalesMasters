# Clientes Inativos — Receita Potencial de Reativação

## Contexto

A tela de **Clientes Inativos** hoje lista os clientes sem compras no período selecionado, mas não mostra o **impacto financeiro** dessa inatividade. A evolução solicitada é transformar essa lista em uma ferramenta de inteligência comercial, respondendo à pergunta:

> **"Quanto cada cliente inativo representaria em receita se tivesse continuado comprando?"**

---

## Premissas

- Considerar **apenas clientes que já realizaram ao menos uma compra** (data da última compra preenchida).
- Clientes com status "Nunca Compraram" ficam de fora desse cálculo — são leads, não clientes inativos.
- A base de cálculo é o **histórico real de pedidos** de cada cliente (valores e datas).
- A data de referência para o cálculo de inatividade é sempre a **data atual**.

---

## Dados necessários do banco

Para cada cliente inativo que já comprou, é necessário consultar o histórico de pedidos com os seguintes campos:

| Campo | Descrição |
|---|---|
| `cliente_id` | Identificador do cliente |
| `data_pedido` | Data em que o pedido foi realizado |
| `valor_total` | Valor total do pedido |

Com esses três campos, toda a lógica abaixo pode ser calculada.

---

## Lógica de cálculo — Passo a passo

### Passo 1 — Ticket Médio do Cliente

Soma o valor de todos os pedidos do cliente e divide pela quantidade de pedidos.

```
ticket_medio = soma_valor_pedidos / qtd_pedidos
```

**Exemplo:**
- Cliente fez 10 pedidos que somam R$ 5.000
- Ticket médio = R$ 5.000 ÷ 10 = **R$ 500,00**

---

### Passo 2 — Frequência de Compra (em dias)

Calcula o intervalo médio entre os pedidos do cliente. Pega a diferença em dias entre o primeiro e o último pedido e divide pelo número de intervalos (quantidade de pedidos menos 1).

```
frequencia_dias = (data_ultimo_pedido - data_primeiro_pedido) / (qtd_pedidos - 1)
```

**Exemplo:**
- Cliente fez 5 pedidos entre 01/01/2025 e 01/07/2025
- Diferença = 181 dias
- Intervalos = 5 - 1 = 4
- Frequência = 181 ÷ 4 = **~45 dias entre cada compra**

#### Caso especial — Cliente com apenas 1 pedido

Se o cliente fez **somente 1 pedido**, não é possível calcular a frequência por intervalo. Existem duas abordagens possíveis:

| Abordagem | Descrição | Quando usar |
|---|---|---|
| **Frequência padrão do segmento** | Usa a média de frequência de todos os outros clientes ativos como referência | Quando se quer incluir esses clientes no cálculo geral |
| **Tratar como compra única** | Assume que o potencial desse cliente é de apenas 1 ticket médio (o próprio valor do pedido que ele fez) | Quando se quer ser mais conservador |

**Recomendação:** usar a abordagem da **frequência padrão do segmento** para não excluir esses clientes da análise, mas sinalizar na interface que o cálculo é baseado em estimativa (ex: um ícone ou tooltip).

---

### Passo 3 — Tempo de Inatividade (em dias)

Calcula quantos dias se passaram desde o último pedido do cliente até a data atual.

```
dias_inativo = data_hoje - data_ultimo_pedido
```

**Exemplo:**
- Última compra foi em 01/10/2025
- Data atual é 12/02/2026
- Dias de inatividade = **134 dias**

---

### Passo 4 — Pedidos Perdidos

Divide o tempo de inatividade pela frequência de compra. O resultado representa **quantos pedidos o cliente deveria ter feito** nesse período e não fez.

```
pedidos_perdidos = dias_inativo / frequencia_dias
```

**Exemplo:**
- Dias de inatividade = 134 dias
- Frequência de compra = 45 dias
- Pedidos perdidos = 134 ÷ 45 = **~2,97 → 2 pedidos perdidos** (arredondar para baixo para ser conservador)

> **Nota sobre arredondamento:** recomenda-se arredondar para baixo (`FLOOR`) para manter a projeção conservadora. Arredondar para cima pode inflar o potencial e gerar expectativas irreais para a equipe comercial.

---

### Passo 5 — Receita Potencial do Cliente

Multiplica os pedidos perdidos pelo ticket médio. Este é o valor estimado que o cliente **deixou de gerar** no período de inatividade.

```
receita_potencial = pedidos_perdidos * ticket_medio
```

**Exemplo:**
- Pedidos perdidos = 2
- Ticket médio = R$ 500,00
- Receita potencial = 2 × R$ 500,00 = **R$ 1.000,00**

---

### Passo 6 — Consolidação nos Cards Superiores

Os cards que já existem na tela devem ser alimentados com os dados agregados:

| Card | Cálculo |
|---|---|
| **Receita a Recuperar** | Soma da `receita_potencial` de todos os clientes inativos que já compraram |
| **Ticket Médio Recup.** | Média dos `ticket_medio` de todos os clientes inativos que já compraram |
| **Maior Potencial** | Valor do cliente com a maior `receita_potencial` individual |
| **Clientes no Limbo** | Quantidade de clientes inativos no período (esse já funciona) |

---

## Fórmula completa resumida

```
ticket_medio        = soma_valor_pedidos / qtd_pedidos
frequencia_dias     = (data_ultimo_pedido - data_primeiro_pedido) / (qtd_pedidos - 1)
dias_inativo        = data_hoje - data_ultimo_pedido
pedidos_perdidos    = FLOOR(dias_inativo / frequencia_dias)
receita_potencial   = pedidos_perdidos * ticket_medio
```

---

## Exemplo completo aplicado

Considere o cliente **7 Freios Truck Center (Cód. 721)**:

| Dado | Valor |
|---|---|
| Total de pedidos | 8 |
| Soma dos valores | R$ 12.400,00 |
| Data do primeiro pedido | 15/03/2024 |
| Data do último pedido | 01/12/2025 |
| Data atual | 12/02/2026 |

**Cálculos:**

```
ticket_medio      = 12.400 / 8 = R$ 1.550,00
frequencia_dias   = (01/12/2025 - 15/03/2024) / (8 - 1) = 627 / 7 = ~89 dias
dias_inativo      = 12/02/2026 - 01/12/2025 = 73 dias
pedidos_perdidos  = FLOOR(73 / 89) = 0
receita_potencial = 0 * 1.550 = R$ 0,00
```

Nesse caso, o cliente ainda está **dentro do ciclo esperado** (73 dias de inatividade, frequência de 89 dias). Ele apareceria na lista de inativos pelo filtro de período, mas o potencial financeiro perdido ainda é zero — ou seja, ainda há tempo de reativá-lo antes que se torne uma perda real.

---

## Alterações na interface

### Colunas da tabela

| Coluna | Status | Ação |
|---|---|---|
| **Último Ticket** | Já existe (zerada) | Alimentar com o valor do último pedido do cliente |
| **Potencial Médio** | Já existe (zerada) | Alimentar com o `ticket_medio` calculado |
| **Receita Potencial** | Não existe | Criar nova coluna com o valor de `receita_potencial` |
| **Frequência (dias)** | Não existe (opcional) | Criar coluna mostrando a `frequencia_dias` do cliente |
| **Pedidos Perdidos** | Não existe (opcional) | Criar coluna mostrando a quantidade de `pedidos_perdidos` |

### Ordenação

Permitir ordenação da tabela pela coluna **Receita Potencial** (decrescente) para que a equipe comercial possa priorizar a reativação dos clientes com maior impacto financeiro.

### Cards superiores

Alimentar os cards conforme descrito no Passo 6. O card **"Receita a Recuperar"** passa a mostrar o somatório real, e o **"Maior Potencial"** mostra o nome e valor do cliente mais relevante.

---

## Comportamento por filtro de período

Os filtros de período (**Último Trimestre**, **Último Semestre**, **Último Ano**, **Nunca Compraram**) controlam **quais clientes aparecem na lista**. O cálculo de receita potencial não muda — sempre usa a data atual como referência.

| Filtro | Quem aparece | Cálculo |
|---|---|---|
| Último Trimestre | Clientes sem compra nos últimos 90 dias | Receita potencial baseada no período real de inatividade |
| Último Semestre | Clientes sem compra nos últimos 180 dias | Mesmo cálculo, inatividade maior |
| Último Ano | Clientes sem compra nos últimos 365 dias | Mesmo cálculo, inatividade maior ainda |
| Todos Ativos | Todos os clientes sem compra no período | Mesmo cálculo |
| Nunca Compraram | Clientes sem nenhum pedido | **Não entra no cálculo de receita potencial** |

---

## Considerações finais

- **Dados necessários:** apenas `cliente_id`, `data_pedido` e `valor_total` da tabela de pedidos. Não é preciso criar novas tabelas ou campos no banco.
- **Performance:** os cálculos podem ser feitos via query agregada no momento da consulta ou pré-calculados em uma rotina periódica (recomendado se a base de clientes for grande).
- **Precisão:** a projeção é uma estimativa baseada no comportamento passado. Não é uma previsão exata, mas dá à equipe comercial um critério objetivo para priorizar reativações.
- **Evolução futura:** com essa base, é possível avançar para segmentação por faixa de potencial, alertas automáticos quando um cliente de alto valor entra em inatividade, e metas de recuperação de receita.
