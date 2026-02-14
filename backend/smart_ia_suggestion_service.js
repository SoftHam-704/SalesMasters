const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class SmartIASuggestionService {
  async generatePlan(context) {
    const systemPrompt = `
Você é um consultor comercial sênior especializado em representação comercial B2B.
Sua missão é analisar os dados de um cliente e gerar um plano de sugestão de compras personalizado, persuasivo e baseado em dados.

Você deve:
1. Analisar o perfil do cliente e seu histórico com a indústria selecionada.
2. Identificar as melhores oportunidades de novos produtos.
3. Gerar argumentos de venda específicos e persuasivos para cada sugestão.
4. Detectar padrões de comportamento e riscos (queda nas compras, churn de produto).
5. Sugerir uma estratégia de abordagem para o representante.

Regras:
- Seja direto e objetivo — o representante vai usar isso em campo.
- Use dados concretos nos argumentos (números, percentuais, comparações).
- Priorize as TOP 5-8 sugestões.
- Responda SEMPRE em português brasileiro.
- Formate a saída em JSON estruturado conforme o schema fornecido.
`;

    const userPrompt = `
## CONTEXTO DA ANÁLISE
Cliente: ${(context.cliente?.cli_nomred || context.cliente?.cli_nome) || 'Cliente não identificado'}
Cidade/UF: ${context.cliente?.cli_cidade || 'N/A'}/${context.cliente?.cli_uf || 'N/A'}
Indústria analisada ID: ${context.industria_analisada}

## HISTÓRICO DO CLIENTE
${JSON.stringify(context.historico_compras, null, 2)}

## GAP ANALYSIS (PRODUTOS NÃO COMPRADOS)
${JSON.stringify(context.gap_analysis, null, 2)}

## ALERTAS DE RECOMPRA
${JSON.stringify(context.alertas_recompra, null, 2)}

## CURVA ABC DA INDÚSTRIA
${JSON.stringify(context.curva_abc_produtos, null, 2)}

---
Com base nesses dados, gere o plano de sugestão de compras seguindo este formato JSON:
{
  "analise_geral": {
    "resumo": "String",
    "pontos_fortes": ["String"],
    "pontos_atencao": ["String"],
    "estrategia_abordagem": "String"
  },
  "alertas_recompra": [
    {
      "produto": "String",
      "urgencia": "critica|alta|media",
      "argumento_venda": "String",
      "quantidade_sugerida": Number
    }
  ],
  "sugestoes_novos_produtos": [
    {
      "produto": "String",
      "motivo_principal": "String",
      "argumento_venda": "String",
      "potencial_faturamento": Number,
      "quantidade_sugerida_inicial": Number
    }
  ],
  "insights_ia": ["String"],
  "frase_abertura": "String"
}
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use gpt-4o-mini for speed and cost as a start
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('❌ [IA_SERVICE] Error generating plan:', error);
      throw error;
    }
  }
}

module.exports = SmartIASuggestionService;
