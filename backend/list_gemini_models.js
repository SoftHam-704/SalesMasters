const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Using API Key:', apiKey.substring(0, 10) + '...');

    try {
        // We'll use a raw fetch since the SDK might hide details
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('Available models:');
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log('No models found in response:', data);
        }
    } catch (error) {
        console.error('Error detail:', error);
    }
}

test();
