const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', apiKey.substring(0, 10) + '...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    try {
        console.log('Generating content with gemini-2.0-flash...');
        const result = await model.generateContent("Hello, are you there?");
        const response = await result.response;
        console.log('Response:', response.text());
    } catch (error) {
        console.error('Error detail:', error);
    }
}

test();
