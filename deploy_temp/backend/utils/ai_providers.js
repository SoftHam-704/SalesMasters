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
Analise os dados de uma planilha, imagem ou texto extraído de PDF de um pedido.
Identifique TODOS os itens listados, extraindo CÓDIGO, DESCRIÇÃO, QUANTIDADE e PREÇO UNITÁRIO.

Regras de Extração:
1. CÓDIGO: 
   - Se a linha tiver UM código, retorne-o normalmente.
   - Se a linha tiver MÚLTIPLOS códigos separados por barra (/) ou outro separador (ex: "ABC-7829 / XPR-451 / 34-069 / WXY-7162"), 
     retorne TODOS eles exatamente como aparecem, mantendo as barras: "ABC-7829 / XPR-451 / 34-069 / WXY-7162".
     NÃO escolha apenas um código. Retorne a string completa com todos.
2. DESCRIÇÃO: Nome do produto. Se não houver descrição, deixe em branco.
3. QUANTIDADE: Valor numérico. Se não especificado, assuma 1.
4. PREÇO: Valor unitário sem símbolo de moeda.

Regras de Limpeza:
- Ignore linhas de cabeçalho, rodapé, totais ou dados da empresa.
- Ignore linhas vazias.

Retorne APENAS um JSON array válido, sem markdown:
[{ "codigo": "string", "descricao": "string", "quantidade": number, "preco": number }]
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
     * Executa com timeout
     */
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

    async test() {
        const model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent('Return JSON: {"status":"ok"}');
        const response = await result.response;
        return response.text().includes('ok');
    }

    async processExcel(dataString) {
        const model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `${EXTRACTION_PROMPT}\n\nDados da Planilha:\n${dataString}`;
        const result = await this.withTimeout(model.generateContent(prompt));
        const response = await result.response;
        const text = response.text();

        return this.parseJSONResponse(text);
    }

    async processImage(imagePath, mimeType) {
        const fs = require('fs');
        const model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        const result = await this.withTimeout(model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            EXTRACTION_PROMPT
        ]));

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

        // OpenAI with json_object returns an object, not array directly
        // Extração robusta do array de itens
        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (parsed && typeof parsed === 'object') {
            // 1. Procura por FIELD que seja um array (ordem de probabilidade)
            const arrayKey = Object.keys(parsed).find(key =>
                Array.isArray(parsed[key]) && parsed[key].length > 0
            ) || Object.keys(parsed).find(key => Array.isArray(parsed[key]));

            if (arrayKey) {
                console.log(`🔍 [OpenAI] Array extraído da chave: ${arrayKey}`);
                return parsed[arrayKey];
            }

            // 2. Se o objeto em si parece ser UM item (tem código e descrição), retorna como array de 1
            if ((parsed.codigo || parsed.id) && (parsed.descricao || parsed.nome)) {
                console.log('🔍 [OpenAI] Objeto único detectado como item.');
                return [parsed];
            }

            // 3. Verifica se há mensagem de erro explicativa da IA
            if (parsed.erro || parsed.mensagem || parsed.reason) {
                throw new Error(parsed.erro || parsed.mensagem || parsed.reason);
            }
        }

        console.error('❌ [OpenAI] Estrutura inválida retornada:', JSON.stringify(parsed));
        throw new Error('A IA retornou um formato inesperado. Tente novamente ou verifique se a imagem está legível.');
    }

    async processImage(imagePath, mimeType) {
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

        // Extração robusta do array de itens do objeto retornado
        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (parsed && typeof parsed === 'object') {
            const arrayKey = Object.keys(parsed).find(key =>
                Array.isArray(parsed[key]) && parsed[key].length > 0
            ) || Object.keys(parsed).find(key => Array.isArray(parsed[key]));

            if (arrayKey) {
                console.log(`🔍 [OpenAI Image] Array extraído da chave: ${arrayKey}`);
                return parsed[arrayKey];
            }

            if ((parsed.codigo || parsed.id) && (parsed.descricao || parsed.nome)) {
                console.log('🔍 [OpenAI Image] Objeto único detectado como item.');
                return [parsed];
            }

            if (parsed.erro || parsed.mensagem || parsed.reason) {
                throw new Error(parsed.erro || parsed.mensagem || parsed.reason);
            }
        }

        console.error('❌ [OpenAI Image] Estrutura inválida retornada:', JSON.stringify(parsed));
        throw new Error('A IA não conseguiu identificar itens nesta imagem. Tente uma foto mais nítida.');
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
