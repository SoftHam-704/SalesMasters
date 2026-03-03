/**
 * AI Providers Abstraction Layer
 * 
 * Suporte multi-provider com fallback automático:
 * - Gemini (Google) - Gratuito, rápido
 * - OpenAI (GPT) - Muito barato, confiável  
 * - Claude (Anthropic) - Premium, excelente
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

// Cache do provider funcional para evitar testes repetidos
let cachedProvider = null;

/**
 * Prompt padrão para extração de dados de pedidos
 * Evoluído para suportar Modelos de Projeto (Engenharia/Bertollini)
 */
const EXTRACTION_PROMPT = `
Analise os dados de uma planilha, imagem ou texto extraído de PDF de um pedido ou proposta técnica.
Sua missão é extrair tanto os ITENS quanto os DADOS DO CABEÇALHO (se existirem).

1. EXTRAÇÃO DE ITENS (Obrigatório):
   Identifique TODOS os itens listados, extraindo APENAS código e quantidade. IGNORE descrição e preço.
   - CÓDIGO: Se houver múltiplos códigos (ex: "A/B"), retorne a string completa "A/B". Baseie-se no código do produto ou referência.
   - QUANTIDADE: Valor numérico da quantidade solicitada.

2. EXTRAÇÃO DE CABEÇALHO/PROJETO (Se disponível):
   Procure por informações de briefing técnico:
   - CLIENTE: Nome ou CNPJ da empresa.
   - NOME DA OBRA: Título do projeto ou local.
   - ÁREA: Metragem quadrada (m2).
   - PÉ DIREITO: Altura (m).
   - PISO: Tipo de piso ou carga suportada.
   - OBSERVAÇÕES: Notas técnicas gerais.

REGRAS DE RETORNO:
Retorne APENAS um JSON válido no seguinte formato:
{
  "cabecalho": {
    "cliente": "string",
    "cnpj": "string",
    "obra_nome": "string",
    "area_m2": number,
    "pe_direito": number,
    "tipo_piso": "string",
    "obs_tecnicas": "string"
  },
  "itens": [
    { "codigo": "string", "quantidade": number }
  ]
}

Se não encontrar dados de cabeçalho, retorne o objeto "cabecalho" vazio.
JAMAS retorne texto fora do JSON.
`;


/**
 * Base class para AI Providers
 */
class AIProvider {
    constructor(name) {
        this.name = name;
    }

    /**
     * Testa se o provider está disponível
     */
    async test() {
        throw new Error('test() must be implemented');
    }

    /**
     * Processa dados de Excel
     */
    async processExcel(dataString) {
        throw new Error('processExcel() must be implemented');
    }

    /**
     * Processa imagem
     */
    async processImage(imagePath, mimeType) {
        throw new Error('processImage() must be implemented');
    }

    /**
     * Parse da resposta JSON da IA
     */
    parseJSONResponse(text) {
        try {
            // Remove markdown code blocks and handle potentially incomplete JSON
            let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            // Se o texto contém JSON mas cercado por lixo (ex: "Aqui está o JSON: {...}"), tenta extrair
            if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
                const firstBrace = cleanText.indexOf('{');
                const firstBracket = cleanText.indexOf('[');
                let startPos = -1;

                if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                    startPos = firstBrace;
                } else if (firstBracket !== -1) {
                    startPos = firstBracket;
                }

                if (startPos !== -1) {
                    cleanText = cleanText.substring(startPos);
                }
            }

            // Tenta achar o final do JSON se houver lixo depois
            if (cleanText.endsWith('}') || cleanText.endsWith(']')) {
                // Ok
            } else {
                const lastBrace = cleanText.lastIndexOf('}');
                const lastBracket = cleanText.lastIndexOf(']');
                let endPos = -1;

                if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
                    endPos = lastBrace;
                } else if (lastBracket !== -1) {
                    endPos = lastBracket;
                }

                if (endPos !== -1) {
                    cleanText = cleanText.substring(0, endPos + 1);
                }
            }

            return JSON.parse(cleanText);
        } catch (e) {
            console.warn('⚠️ [AI] Falha no parse primário, tentando extração por regex...', e.message);

            // Fallback: busca por blocos [ ... ] ou { ... }
            const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                try { return JSON.parse(arrayMatch[0]); } catch (i) { }
            }

            const objectMatch = text.match(/\{\s*[\s\S]*\s*\}/);
            if (objectMatch) {
                try { return JSON.parse(objectMatch[0]); } catch (i) { }
            }

            throw new Error(`Falha ao parsear JSON da resposta: ${e.message}`);
        }
    }

    /**
     * Normaliza a resposta para o formato { cabecalho, itens }
     */
    normalizeResponse(parsed) {
        if (!parsed) return { cabecalho: {}, itens: [] };

        // Caso 1: Já está no formato ideal
        if (parsed.itens && Array.isArray(parsed.itens)) {
            return {
                cabecalho: parsed.cabecalho || {},
                itens: parsed.itens
            };
        }

        // Caso 2: Retornou direto um array
        if (Array.isArray(parsed)) {
            return { cabecalho: {}, itens: parsed };
        }

        // Caso 3: Objeto com alguma chave de array (ex: { "data": [...] })
        if (typeof parsed === 'object') {
            const arrayKey = Object.keys(parsed).find(key =>
                Array.isArray(parsed[key]) && parsed[key].length > 0
            );

            if (arrayKey) {
                return { cabecalho: {}, itens: parsed[arrayKey] };
            }

            // Se for um objeto que parece um item, envolve em array
            if ((parsed.codigo || parsed.descricao) && !parsed.itens) {
                return { cabecalho: {}, itens: [parsed] };
            }
        }

        return { cabecalho: parsed.cabecalho || {}, itens: parsed.itens || [] };
    }
    async withTimeout(promise, timeoutMs = 120000) {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout na resposta da IA (${timeoutMs / 1000}s)`)), timeoutMs)
        );
        return Promise.race([promise, timeoutPromise]);
    }
}

/**
 * Gemini Provider (Google)
 */
class GeminiProvider extends AIProvider {
    constructor() {
        super('Gemini');
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY não configurada');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Helper robusto para obter o modelo disponível no projeto do Google Cloud.
     * Como vimos nos logs, alguns projetos têm acesso a nomes diferentes (2.0 vs 1.5 vs nomes experimentais).
     */
    async _getModel(config = {}) {
        const modelNames = [
            "gemini-2.0-flash",        // Tentar o mais novo
            "gemini-1.5-flash-latest", // Tentar o estável dinâmico
            "gemini-1.5-flash",        // Tentar o estável fixo
            "gemini-1.5-pro"           // Último recurso
        ];

        let lastError = null;

        for (const modelName of modelNames) {
            try {
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    ...config
                });

                // Fazemos uma chamada leve de teste se necessário, mas aqui apenas retornamos
                // O erro de 404 geralmente acontece no generateContent
                return { model, name: modelName };
            } catch (e) {
                lastError = e;
                continue;
            }
        }
        throw lastError || new Error("Nenhum modelo Gemini disponível no seu projeto.");
    }

    async test() {
        try {
            const { model } = await this._getModel({
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent('Return JSON: {"status":"ok"}');
            const response = await result.response;
            return response.text().includes('ok');
        } catch (e) {
            console.error(`❌ [Gemini Test] Falha final: ${e.message}`);
            return false;
        }
    }

    async processExcel(dataString) {
        const prompt = `${EXTRACTION_PROMPT}\n\nDados da Planilha:\n${dataString}`;

        // Tentativa com retry automático trocando o modelo se der 404 ou 429
        const modelNames = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];

        for (const modelName of modelNames) {
            try {
                console.log(`🤖 [Gemini] Tentando processar com ${modelName}...`);
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await this.withTimeout(model.generateContent(prompt));
                const response = await result.response;
                const text = response.text();
                return this.normalizeResponse(this.parseJSONResponse(text));
            } catch (error) {
                const isRetryable = error.message.includes('404') || error.message.includes('429') || error.message.includes('quota');
                if (isRetryable && modelName !== modelNames[modelNames.length - 1]) {
                    console.warn(`⚠️ [Gemini] Modelo ${modelName} falhou (${error.message}). Tentando próximo...`);
                    continue;
                }
                throw error;
            }
        }
    }

    async processImage(imagePath, mimeType) {
        const fs = require('fs');
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');
        const content = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType
                }
            },
            EXTRACTION_PROMPT
        ];

        const modelNames = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];

        for (const modelName of modelNames) {
            try {
                console.log(`🤖 [Gemini Vision] Tentando com ${modelName}...`);
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await this.withTimeout(model.generateContent(content));
                const response = await result.response;
                const text = response.text();
                return this.normalizeResponse(this.parseJSONResponse(text));
            } catch (error) {
                const isRetryable = error.message.includes('404') || error.message.includes('429') || error.message.includes('quota');
                if (isRetryable && modelName !== modelNames[modelNames.length - 1]) {
                    console.warn(`⚠️ [Gemini Vision] Modelo ${modelName} falhou. Tentando próximo...`);
                    continue;
                }
                throw error;
            }
        }
    }
}

/**
 * OpenAI Provider (GPT)
 */
class OpenAIProvider extends AIProvider {
    constructor() {
        super('OpenAI');
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY não configurada');
        }
        this.openai = new OpenAI({ apiKey });
    }

    async test() {
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: 'Return JSON: {"status":"ok"}' }],
            response_format: { type: "json_object" }
        });
        return completion.choices[0].message.content.includes('ok');
    }

    async processExcel(dataString) {
        const completion = await this.withTimeout(this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `${EXTRACTION_PROMPT}\n\nDados da Planilha:\n${dataString}`
                }
            ],
            response_format: { type: "json_object" }
        }));

        const text = completion.choices[0].message.content;
        console.log('🔍 [OpenAI] Raw response:', text.substring(0, 200) + '...');
        const parsed = this.parseJSONResponse(text);
        return this.normalizeResponse(parsed);
    }

    async processImage(imagePath, mimeType) {
        if (mimeType === 'application/pdf') {
            throw new Error('OpenAI Vision não suporta PDF diretamente via API de Chat. Por favor, use Gemini ou converta para imagem.');
        }
        const fs = require('fs');
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const completion = await this.withTimeout(this.openai.chat.completions.create({
            model: "gpt-4o-mini", // Suporta visão
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: EXTRACTION_PROMPT },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        }));

        const text = completion.choices[0].message.content;
        console.log('🔍 [OpenAI Image] Raw response:', text.substring(0, 200) + '...');
        const parsed = this.parseJSONResponse(text);
        return this.normalizeResponse(parsed);
    }
}

/**
 * Claude Provider (Anthropic)
 */
class ClaudeProvider extends AIProvider {
    constructor() {
        super('Claude');
        const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('CLAUDE_API_KEY não configurada');
        }
        this.anthropic = new Anthropic({ apiKey });
    }

    async test() {
        const message = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 100,
            messages: [{ role: "user", content: 'Return JSON: {"status":"ok"}' }]
        });
        return message.content[0].text.includes('ok');
    }

    async processExcel(dataString) {
        const message = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2000,
            messages: [
                {
                    role: "user",
                    content: `${EXTRACTION_PROMPT}\n\nDados da Planilha:\n${dataString}`
                }
            ]
        });

        const text = message.content[0].text;
        const parsed = this.parseJSONResponse(text);
        return this.normalizeResponse(parsed);
    }

    async processImage(imagePath, mimeType) {
        const fs = require('fs');
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        // Claude requer tipo de mídia específico
        const mediaType = mimeType.includes('png') ? 'image/png' :
            mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'image/jpeg' :
                mimeType.includes('webp') ? 'image/webp' : 'image/png';

        const message = await this.anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: mediaType,
                                data: base64Image
                            }
                        },
                        {
                            type: "text",
                            text: EXTRACTION_PROMPT
                        }
                    ]
                }
            ]
        });

        const text = message.content[0].text;
        const parsed = this.parseJSONResponse(text);
        return this.normalizeResponse(parsed);
    }
}

/**
 * Factory para criar providers baseado na configuração
 */
function createProvider(providerName) {
    switch (providerName.toLowerCase()) {
        case 'gemini':
            return new GeminiProvider();
        case 'openai':
        case 'gpt':
            return new OpenAIProvider();
        case 'claude':
        case 'anthropic':
            return new ClaudeProvider();
        default:
            throw new Error(`Provider desconhecido: ${providerName}`);
    }
}

/**
 * Obtém um provider funcional (com fallback automático)
 */
async function getWorkingProvider() {
    // Retorna cache se já testado
    if (cachedProvider) {
        console.log(`🔄 [AI] Usando provider em cache: ${cachedProvider.name}`);
        return cachedProvider;
    }

    // Ordem de prioridade dos providers (configurável via .env)
    const providerOrder = (process.env.AI_PROVIDER_ORDER || 'gemini,openai,claude')
        .split(',')
        .map(p => p.trim());

    console.log(`🔍 [AI] Testando providers na ordem: ${providerOrder.join(' → ')}`);

    for (const providerName of providerOrder) {
        try {
            console.log(`🧪 [AI] Testando ${providerName}...`);
            const provider = createProvider(providerName);

            // Timeout de 10s para o teste de conectividade
            const testPromise = provider.test();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de conectividade (10s)')), 10000)
            );

            await Promise.race([testPromise, timeoutPromise]);

            console.log(`✅ [AI] ${providerName} está DISPONÍVEL!`);
            cachedProvider = provider; // Cache para próximas requisições

            // Auto-limpa o cache em 1 hora para re-testar saúde
            setTimeout(() => { cachedProvider = null; }, 3600000);

            return provider;

        } catch (error) {
            console.log(`❌ [AI] ${providerName} falhou ou timed out: ${error.message}`);
            continue;
        }
    }

    throw new Error('Nenhum provider de IA disponível. Verifique suas API keys no .env');
}

/**
 * Limpa o cache do provider (útil para testes)
 */
function clearProviderCache() {
    cachedProvider = null;
}

module.exports = {
    getWorkingProvider,
    clearProviderCache,
    GeminiProvider,
    OpenAIProvider,
    ClaudeProvider
};
