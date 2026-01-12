const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

const EXTRACTION_PROMPT = `
Analise os dados de uma planilha ou imagem de pedido.
Identifique inteligentemente quais campos representam o CÓDIGO do produto, a DESCRIÇÃO, a QUANTIDADE e o PREÇO UNITÁRIO (se houver).
Retorne APENAS um JSON array válido, sem markdown, neste formato:
[{ "codigo": "string", "descricao": "string", "quantidade": number, "preco": number }]
`;

async function test() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const imagePath = 'e:\\Sistemas_ia\\SalesMasters\\backend\\uploads\\smart\\1768256279985-ItensFania.PNG';

    try {
        if (!fs.existsSync(imagePath)) {
            console.error('Image not found at:', imagePath);
            return;
        }

        const imageData = fs.readFileSync(imagePath);
        const base64Image = imageData.toString('base64');

        console.log('Testing OpenAI Vision with local image...');
        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: EXTRACTION_PROMPT },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        });
        const duration = Date.now() - startTime;
        console.log(`Response in ${duration}ms:`, completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
