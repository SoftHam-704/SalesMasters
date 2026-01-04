// =====================================================
// MÓDULO DE INTEGRAÇÃO OPENAI - VENDEDORES
// =====================================================
// Integra as funções SQL com OpenAI para gerar:
// 1. Recomendações de ação
// 2. Previsão de vendas
// 3. Alertas de risco
// =====================================================

const OpenAI = require('openai');

// Inicializar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Configurar no .env
});

// =====================================================
// 1. RECOMENDAÇÕES DE AÇÃO
// =====================================================

async function gerarRecomendacoesAcao(vendedorData, clientesRisco, interacoes) {
    const prompt = `
Você é um especialista em vendas B2B e gestão comercial.

DADOS DO VENDEDOR:
- Nome: ${vendedorData.vendedor_nome}
- Vendas no mês: R$ ${vendedorData.total_vendas_mes.toLocaleString('pt-BR')}
- Meta: R$ ${vendedorData.meta_mes.toLocaleString('pt-BR')}
- % Atingimento: ${vendedorData.perc_atingimento_meta}%
- Variação MoM: ${vendedorData.variacao_mom_percent}%
- Clientes ativos: ${vendedorData.clientes_ativos}
- Clientes perdidos: ${vendedorData.clientes_perdidos}
- Interações CRM: ${interacoes.total_interacoes}
- Taxa de conversão CRM: ${interacoes.taxa_conversao}%

CLIENTES EM RISCO (top 5):
${clientesRisco.slice(0, 5).map((c, i) =>
        `${i + 1}. ${c.cliente_nome} - ${c.dias_sem_comprar} dias sem comprar - Valor histórico: R$ ${c.valor_total_historico.toLocaleString('pt-BR')}`
    ).join('\n')}

ANALISE e gere exatamente 5 recomendações de ação PRIORITÁRIAS e ESPECÍFICAS para este vendedor.
Cada recomendação deve ser:
- Acionável (com ação clara)
- Específica (mencionar clientes, valores, prazos)
- Priorizável (ordem de importância)

Formato da resposta (JSON):
{
  "recomendacoes": [
    {
      "prioridade": 1,
      "tipo": "cliente_em_risco",
      "titulo": "Título curto",
      "descricao": "Descrição detalhada",
      "acao": "Ação específica a tomar",
      "impacto_estimado": "R$ X.XXX"
    }
  ],
  "resumo": "Análise geral em 2-3 frases"
}
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Você é um consultor de vendas especialista. Responda APENAS em JSON válido, sem markdown."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const resultado = JSON.parse(response.choices[0].message.content);
        return resultado;

    } catch (error) {
        console.error('Erro ao gerar recomendações:', error);
        return {
            recomendacoes: [],
            resumo: "Erro ao gerar análise"
        };
    }
}

// =====================================================
// 2. PREVISÃO DE VENDAS
// =====================================================

async function gerarPrevisaoVendas(historicoMensal, vendedorData) {
    const historico = historicoMensal.map(h => ({
        mes: h.mes_nome,
        vendas: h.total_vendas,
        meta: h.meta_mes,
        atingimento: h.perc_atingimento
    }));

    const prompt = `
Você é um cientista de dados especializado em previsão de vendas.

HISTÓRICO DOS ÚLTIMOS 12 MESES:
${JSON.stringify(historico, null, 2)}

CONTEXTO ATUAL:
- Meta próximo mês: R$ ${vendedorData.meta_mes.toLocaleString('pt-BR')}
- Tendência MoM: ${vendedorData.variacao_mom_percent}%
- Clientes ativos: ${vendedorData.clientes_ativos}
- Performance recente: ${vendedorData.status}

ANALISE o histórico e faça uma previsão estatística para o PRÓXIMO MÊS.

Formato da resposta (JSON):
{
  "previsao": {
    "valor_estimado": 0,
    "intervalo_confianca_min": 0,
    "intervalo_confianca_max": 0,
    "probabilidade_bater_meta": 0,
    "tendencia": "crescente|decrescente|estavel",
    "sazonalidade_detectada": true|false
  },
  "analise": {
    "fatores_positivos": ["fator 1", "fator 2"],
    "fatores_risco": ["risco 1", "risco 2"],
    "recomendacao": "texto"
  }
}
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Você é um cientista de dados. Responda APENAS em JSON válido, sem markdown."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 800
        });

        const resultado = JSON.parse(response.choices[0].message.content);
        return resultado;

    } catch (error) {
        console.error('Erro ao gerar previsão:', error);
        return null;
    }
}

// =====================================================
// 3. ALERTAS DE RISCO
// =====================================================

async function gerarAlertasRisco(vendedorData, interacoes, clientesRisco) {
    const prompt = `
Você é um sistema de alertas de vendas.

DADOS DO VENDEDOR:
- Nome: ${vendedorData.vendedor_nome}
- % Atingimento meta: ${vendedorData.perc_atingimento_meta}%
- Variação MoM: ${vendedorData.variacao_mom_percent}%
- Clientes ativos: ${vendedorData.clientes_ativos}
- Clientes perdidos: ${vendedorData.clientes_perdidos}
- Total interações CRM: ${interacoes.total_interacoes}
- Taxa conversão: ${interacoes.taxa_conversao}%

CLIENTES EM RISCO ALTO:
${clientesRisco.filter(c => c.nivel_risco === '🔴 Alto').length} clientes

Identifique TODOS os alertas de risco críticos.

Formato da resposta (JSON):
{
  "alertas": [
    {
      "severidade": "critico|alto|medio|baixo",
      "categoria": "performance|clientes|crm|tendencia",
      "titulo": "Título curto do alerta",
      "descricao": "Descrição detalhada",
      "acao_imediata": "O que fazer agora"
    }
  ],
  "nivel_risco_geral": "critico|alto|medio|baixo",
  "resumo": "Resumo executivo"
}
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Você é um sistema de alertas. Responda APENAS em JSON válido, sem markdown."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 800
        });

        const resultado = JSON.parse(response.choices[0].message.content);
        return resultado;

    } catch (error) {
        console.error('Erro ao gerar alertas:', error);
        return {
            alertas: [],
            nivel_risco_geral: "desconhecido",
            resumo: "Erro ao analisar riscos"
        };
    }
}

// =====================================================
// 4. ANÁLISE COMPLETA (usa todas as 3 funções acima)
// =====================================================

async function analisarVendedorCompleto(vendedorId, ano, mes, pool) {
    try {
        // 1. Buscar dados do vendedor
        const performanceResult = await pool.query(
            'SELECT * FROM fn_vendedores_performance($1, $2, $3)',
            [ano, mes, vendedorId]
        );
        const vendedorData = performanceResult.rows[0];

        // 2. Buscar clientes em risco
        const clientesRiscoResult = await pool.query(
            'SELECT * FROM fn_vendedores_clientes_risco($1, 60)',
            [vendedorId]
        );
        const clientesRisco = clientesRiscoResult.rows;

        // 3. Buscar histórico mensal
        const historicoResult = await pool.query(
            'SELECT * FROM fn_vendedores_historico_mensal($1, 12)',
            [vendedorId]
        );
        const historico = historicoResult.rows;

        // 4. Buscar interações CRM
        const interacoesResult = await pool.query(
            'SELECT * FROM fn_vendedores_interacoes_crm($1, $2, $3)',
            [ano, mes, vendedorId]
        );
        const interacoes = interacoesResult.rows[0];

        // 5. Gerar análises com IA (em paralelo)
        const [recomendacoes, previsao, alertas] = await Promise.all([
            gerarRecomendacoesAcao(vendedorData, clientesRisco, interacoes),
            gerarPrevisaoVendas(historico, vendedorData),
            gerarAlertasRisco(vendedorData, interacoes, clientesRisco)
        ]);

        // 6. Retornar análise completa
        return {
            vendedor: vendedorData,
            clientes_risco: clientesRisco.slice(0, 10), // Top 10
            historico: historico,
            interacoes: interacoes,
            ia_insights: {
                recomendacoes: recomendacoes,
                previsao: previsao,
                alertas: alertas
            },
            gerado_em: new Date().toISOString()
        };

    } catch (error) {
        console.error('Erro na análise completa:', error);
        throw error;
    }
}

// =====================================================
// 5. ENDPOINT EXPRESS (exemplo)
// =====================================================

// No seu backend Express:
/*
const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const { analisarVendedorCompleto } = require('./openai-vendedores');

// GET /api/vendedores/:id/analise-ia
router.get('/vendedores/:id/analise-ia', async (req, res) => {
  try {
    const vendedorId = parseInt(req.params.id);
    const ano = parseInt(req.query.ano) || new Date().getFullYear();
    const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;

    const analise = await analisarVendedorCompleto(vendedorId, ano, mes, pool);
    
    res.json(analise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar análise' });
  }
});

module.exports = router;
*/

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    gerarRecomendacoesAcao,
    gerarPrevisaoVendas,
    gerarAlertasRisco,
    analisarVendedorCompleto
};

// =====================================================
// EXEMPLO DE USO:
// =====================================================

/*
const { pool } = require('./db');
const { analisarVendedorCompleto } = require('./openai-vendedores');

// Analisar vendedor ID 1 em dezembro/2025
analisarVendedorCompleto(1, 2025, 12, pool)
  .then(analise => {
    console.log('=== RECOMENDAÇÕES ===');
    analise.ia_insights.recomendacoes.recomendacoes.forEach(r => {
      console.log(`${r.prioridade}. [${r.tipo}] ${r.titulo}`);
      console.log(`   ${r.descricao}`);
      console.log(`   Ação: ${r.acao}`);
      console.log('');
    });

    console.log('=== PREVISÃO ===');
    console.log(`Próximo mês: R$ ${analise.ia_insights.previsao.previsao.valor_estimado.toLocaleString()}`);
    console.log(`Chance de bater meta: ${analise.ia_insights.previsao.previsao.probabilidade_bater_meta}%`);
    console.log('');

    console.log('=== ALERTAS ===');
    analise.ia_insights.alertas.alertas.forEach(a => {
      console.log(`[${a.severidade.toUpperCase()}] ${a.titulo}`);
      console.log(`   ${a.descricao}`);
      console.log('');
    });
  })
  .catch(console.error);
*/
