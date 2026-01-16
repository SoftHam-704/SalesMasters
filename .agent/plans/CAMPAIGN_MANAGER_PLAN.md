# 🎯 Campaign Booster 2.0: O Acordo de Sucesso Individual

> "Cada CNPJ é uma história. Cada Campanha é um compromisso único de crescimento."

## 1. Conceito Central
Diferente de sistemas de "metas em massa", este módulo foca na **negociação 1-a-1**. O promotor senta com o cliente, define um período base (ex: "Mesmo período do ano passado" ou "Último Trimestre"), e o sistema projeta o futuro com base no % de crescimento acordado.

**Regra de Ouro:** Monitoramento Dual (Valor R$ e Quantidade).

## 2. Estrutura de Dados (A Campanha Individual)

Uma única tabela robusta para armazenar o acordo.

### Tabela: `campanhas_promocionais`
Esta tabela é o "contrato" da ação.

#### 📍 Identificação
- `cmp_codigo`: ID único.
- `cmp_descricao`: Tema (ex: "Campanha Verão 2026").
- `cmp_cliente_id`: **O Cliente (1:1)**.
- `cmp_industria_id`: A Indústria.
- `cmp_promotor_id`: Quem negociou (Vendedor/Usuário).
- `cmp_status`: `SIMULACAO`, `ATIVA`, `CONCLUIDA`, `CANCELADA`.

#### 📅 Os Períodos (O Tempo)
- `cmp_periodo_base_ini`: Início do histórico (ex: 01/01/2025).
- `cmp_periodo_base_fim`: Fim do histórico (ex: 31/03/2025).
- `cmp_campanha_ini`: Início da Ação (ex: 01/02/2026).
- `cmp_campanha_fim`: Fim da Ação (ex: 28/02/2026).

#### 📊 O Passado (Linha de Base / Baseline)
Aqui está a "foto" da performance anterior.
- `cmp_base_dias_uteis`: Quantos dias considerados no passado.
- `cmp_base_valor_total`: R$ Total vendido no período base.
- `cmp_base_qtd_total`: Qtd Total vendida no período base.
- **`cmp_base_media_diaria_val`**: Média R$ / dia.
- **`cmp_base_media_diaria_qtd`**: Média Qtd / dia.

#### 🚀 O Futuro (O Objetivo)
Onde queremos chegar com o `%` de crescimento.
- `cmp_perc_crescimento`: O Desafio (ex: 20%).
- `cmp_meta_valor_total`: Objetivo R$ Total da Campanha.
- `cmp_meta_qtd_total`: Objetivo Qtd Total da Campanha.
- **`cmp_meta_diaria_val`**: Meta R$ que o lojista tem que bater **HOJE**.
- **`cmp_meta_diaria_qtd`**: Meta Qtd que o lojista tem que bater **HOJE**.

#### 💰 O Investimento (ROI)
- `cmp_investimento_previsto`: Quanto essa quantidade/valor representa de "compras" ou custo para a indústria (calculado baseado no mix).

#### 📈 O Resultado (Realizado)
Atualizado conforme as vendas acontecem durante a campanha.
- `cmp_real_valor_total`
- `cmp_real_qtd_total`
- `cmp_percentual_atingido_val`
- `cmp_percentual_atingido_qtd`

## 3. A Tela de Negociação (O "Cockpit" do Promotor)

A interface será dividida em 3 passos verticais:

### Passo 1: Configuração (O Cenário)
- Selecionar Cliente e Indústria.
- Definir **Tema**.
- Definir **Período Base** (O botão "Calcular Histórico" fará a mágica aqui).

### Passo 2: A Proposta (O Cálculo)
- O sistema exibe: *"Nesse período o cliente vendeu R$ 10.000 (Média R$ 333/dia) e 500 Unidades (Média 16/dia)."*
- Campo de Input: **% Crescimento Almejado**.
- Ao digitar "20%", o sistema explode os números:
    - *"Nova Meta Diária: R$ 400,00 e 19 Unidades"*
    - *"Meta Total da Campanha: R$ 12.000,00"*

### Passo 3: Fechamento
- Botão **"Firmar Acordo e Ativar"**.
- Gera um "Termo de Compromisso" (PDF simples) opcional.

## 4. Diferenciais Técnicos

- **Cálculo Híbrido:** O sistema sempre calculará os dois vetores (Qtd e Valor), mesmo que o foco da negociação seja apenas um. Isso garante integridade financeira para a indústria.
- **Detecção de Dias Úteis:** O cálculo de média diária levará em conta dias com venda ativa, para não "diluir" a média com domingos/feriados onde a loja não abre (se aplicável).
