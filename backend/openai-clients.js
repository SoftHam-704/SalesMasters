
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Gera insights estratégicos para um perfil de cliente específico.
 */
async function gerarInsightsCliente(dataContext) {
    const { cliente, historico, produtos, industrias, stats } = dataContext;

    const prompt = `
Você é um consultor comercial sênior e analista de inteligência de dados do SalesMasters.
Analise o perfil e o comportamento de compra do cliente abaixo e gere exatamente 3 insights estratégicos.

DADOS DO CLIENTE:
- Nome: ${cliente.cli_nomred} (ID: ${cliente.cli_codigo})
- LTV (Total Histórico): R$ ${parseFloat(stats.ltv || 0).toLocaleString('pt-BR')}
- Última Compra: ${stats.ultima_compra_geral ? new Date(stats.ultima_compra_geral).toLocaleDateString('pt-BR') : 'Sem registro'}
- Dias em Inatividade: ${stats.dias_inativo || 0} dias
- Frequência Média: Cada ${stats.frequencia_media_dias || 'N/A'} dias

MIX DE COMPRAS (TOP 5 INDÚSTRIAS):
${industrias.map(i => `- ${i.industria}: R$ ${parseFloat(i.total).toLocaleString('pt-BR')}`).join('\n')}

PRODUTOS MAIS COMPRADOS:
${produtos.map(p => `- ${p.produto} (${p.recorrencia} pedidos)`).join('\n')}

OBJETIVO:
Identificar padrões, alertar sobre riscos de churn e sugerir oportunidades reais de cross-sell ou upsell.

Formato da resposta (JSON):
{
  "insights": [
    {
      "type": "opportunity|warning|insight",
      "title": "Título curto",
      "description": "Descrição detalhada com dados"
    }
  ]
}
`;

    try {
        console.log(`[IA NODE] Enviando prompt para OpenAI para o cliente: ${cliente.cli_nomred}`);
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Você é um analista comercial de IA. Responda APENAS em JSON válido conforme o formato solicitado."
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        });

        let content = response.choices[0].message.content;

        // Sanitizar a resposta: Remover blocos de código markdown se existirem
        if (content.includes('```')) {
            console.log("[IA NODE] Removendo formatação markdown da resposta.");
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const result = JSON.parse(content);
        console.log(`[IA NODE] Resposta da IA recebida com sucesso: ${result.insights?.length || 0} insights.`);
        return result;
    } catch (error) {
        console.error('❌ [IA NODE] Erro ao chamar OpenAI para cliente:', error.message);
        return { insights: [] };
    }
}

/**
 * Coleta todos os dados necessários do banco para a análise.
 */
async function analisarClienteIA(clientId, pool) {
    try {
        // 1. Dados básicos
        const clienteRes = await pool.query('SELECT cli_codigo, cli_nomred FROM clientes WHERE cli_codigo = $1', [clientId]);
        if (clienteRes.rows.length === 0) throw new Error('Cliente não encontrado');

        // 2. Estatísticas Gerais
        const statsRes = await pool.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(ped_totliq) as ltv,
                MAX(ped_data) as ultima_compra_geral,
                (CURRENT_DATE - MAX(ped_data)::date) as dias_inativo,
                CASE 
                    WHEN COUNT(*) > 1 THEN 
                        (MAX(ped_data)::date - MIN(ped_data)::date) / (COUNT(*) - 1)
                    ELSE NULL
                END as frequencia_media_dias
            FROM pedidos
            WHERE ped_cliente = $1 AND ped_situacao IN ('P', 'F')
        `, [clientId]);

        // 3. Histórico 12 meses
        const historicoRes = await pool.query(`
            SELECT EXTRACT(MONTH FROM ped_data) as mes, SUM(ped_totliq) as valor
            FROM pedidos
            WHERE ped_cliente = $1 AND ped_data >= CURRENT_DATE - INTERVAL '12 months' AND ped_situacao IN ('P', 'F')
            GROUP BY 1 ORDER BY 1
        `, [clientId]);

        // 4. Mix de Indústrias
        const indRes = await pool.query(`
            SELECT f.for_nomered as industria, SUM(p.ped_totliq) as total
            FROM pedidos p
            JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_cliente = $1 AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1 ORDER BY 2 DESC LIMIT 5
        `, [clientId]);

        // 5. Top Produtos
        const prodRes = await pool.query(`
            SELECT pr.pro_nome as produto, COUNT(*) as recorrencia
            FROM itens_ped i
            JOIN pedidos p ON i.ite_pedido = p.ped_pedido
            JOIN cad_prod pr ON i.ite_idproduto = pr.pro_id
            WHERE p.ped_cliente = $1 AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1 ORDER BY 2 DESC LIMIT 5
        `, [clientId]);

        const dataContext = {
            cliente: clienteRes.rows[0],
            stats: statsRes.rows[0],
            historico: historicoRes.rows,
            industrias: indRes.rows,
            produtos: prodRes.rows
        };

        console.log(`[IA NODE] Dados coletados para o cliente ${clientId}. Histórico: ${dataContext.historico.length} meses, Indústrias: ${dataContext.industrias.length}.`);

        // Chamar IA
        const aiResult = await gerarInsightsCliente(dataContext);
        return {
            success: true,
            insights: aiResult.insights,
            data: dataContext
        };

    } catch (error) {
        console.error('Erro na análise de cliente IA:', error);
        throw error;
    }
}

/**
 * Gera um plano de recuperação focado em reativar um cliente inativo.
 */
async function gerarPlanoRecuperacao(dataContext) {
    const { cliente, stats, industrias } = dataContext;

    const prompt = `
Você é um consultor comercial especialista em retenção de clientes.
Gere um PLANO DE RECUPERAÇÃO e uma SUGESTÃO DE MENSAGEM WHATSAPP para este cliente inativo.

DADOS DO CLIENTE:
- Nome: ${cliente.cli_nomred}
- Última Compra: ${stats.ultima_compra_geral ? new Date(stats.ultima_compra_geral).toLocaleDateString('pt-BR') : 'Tempo indeterminado'}
- Dias Inativo: ${stats.dias_inativo || 999} dias
- Principais Indústrias: ${industrias.map(i => i.industria).join(', ')}

OBJETIVO:
Ser persuasivo, empático e oferecer valor. Não seja apenas "queremos vender". Use o histórico para sugerir algo.

Formato da resposta (JSON):
{
  "plano": "Resumo do que o vendedor deve fazer (estratégia)",
  "whatsapp": "Texto pronto para o vendedor copiar e enviar no WhatsApp"
}
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é um consultor de vendas IA. Responda apenas em JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('Error generating recovery plan:', error);
        return {
            plano: "Entre em contato para entender o motivo do afastamento.",
            whatsapp: "Olá, faz tempo que não nos falamos! Como estão as coisas?"
        };
    }
}

module.exports = { analisarClienteIA, gerarPlanoRecuperacao };
