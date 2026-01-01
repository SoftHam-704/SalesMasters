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
 */
const EXTRACTION_PROMPT = `
Analise os dados de uma planilha ou imagem de pedido.
Identifique inteligentemente quais campos representam o CÓDIGO do produto e a QUANTIDADE.

Regras:
- O Código é geralmente alfanumérico (ex: HBT107, 789, PROD-01)
- A Quantidade é numérica
- Ignore linhas de cabeçalho (como "CODIGO", "QTD", "DESCRICAO")
- Ignore linhas de rodapé ou totais

Retorne APENAS um JSON array no formato:
[{ "codigo": "string", "quantidade": number }]
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
            // Remove markdown code blocks se existirem
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            // Tenta parsejar direto se começar com [
            if (text.trim().startsWith('[')) {
                return JSON.parse(text);
            }
            throw new Error(`Falha ao parsear JSON da resposta: ${e.message}`);
        }
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

    async test() {
        const model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent('Return JSON: {"status":"ok"}');
        const response = await result.response;
        return response.text().includes('ok');
    }

    async processExcel(dataString) {
        const model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${EXTRACTION_PROMPT}\n\nDados da Planilha:\n${dataString}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return this.parseJSONResponse(text);
    }

    async processImage(imagePath, mimeType) {
        const fs = require('fs');
        const model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            EXTRACTION_PROMPT
        ]);

        const response = await result.response;
        const text = response.text();
        return this.parseJSONResponse(text);
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
        const completion = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `${EXTRACTION_PROMPT}\n\nDados da Planilha:\n${dataString}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const text = completion.choices[0].message.content;
        console.log('🔍 [OpenAI] Raw response:', text.substring(0, 200) + '...');

        const parsed = this.parseJSONResponse(text);

        // OpenAI with json_object returns an object, not array directly
        // Extract the array from the object
        if (Array.isArray(parsed)) {
            return parsed;
        } else if (parsed && typeof parsed === 'object') {
            // Find the array in the object (could be under 'items', 'products', 'data', etc.)
            const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayKey) {
                console.log(`🔍 [OpenAI] Extracted array from key: ${arrayKey}`);
                return parsed[arrayKey];
            }
        }

        throw new Error('OpenAI response is not an array and does not contain an array field');
    }

    async processImage(imagePath, mimeType) {
        const fs = require('fs');
        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const completion = await this.openai.chat.completions.create({
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
        });

        const text = completion.choices[0].message.content;
        console.log('🔍 [OpenAI Image] Raw response:', text.substring(0, 200) + '...');

        const parsed = this.parseJSONResponse(text);

        // Extract array from JSON object
        if (Array.isArray(parsed)) {
            return parsed;
        } else if (parsed && typeof parsed === 'object') {
            const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayKey) {
                return parsed[arrayKey];
            }
        }

        throw new Error('OpenAI response is not an array and does not contain an array field');
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
        return this.parseJSONResponse(text);
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
        return this.parseJSONResponse(text);
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
            await provider.test();

            console.log(`✅ [AI] ${providerName} está DISPONÍVEL!`);
            cachedProvider = provider; // Cache para próximas requisições
            return provider;

        } catch (error) {
            console.log(`❌ [AI] ${providerName} falhou: ${error.message}`);
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
