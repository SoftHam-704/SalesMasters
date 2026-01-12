const OpenAI = require('openai');
require('dotenv').config();

async function test() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        console.log('Testing OpenAI Vision...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "What is in this image? Return JSON: {\"result\": \"text\"}" },
                        {
                            type: "image_url",
                            image_url: {
                                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Statue_of_Liberty%2C_NY.jpg/320px-Statue_of_Liberty%2C_NY.jpg"
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" }
        });
        console.log('Response:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
