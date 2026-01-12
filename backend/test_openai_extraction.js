require('dotenv').config();
const { OpenAIProvider } = require('./utils/ai_providers');
const path = require('path');

async function test() {
    const provider = new OpenAIProvider();
    const imagePath = path.join(__dirname, 'uploads/smart/1768258281449-ItensFania.PNG');
    const mimeType = 'image/png';

    console.log('Testing OpenAI with image:', imagePath);
    try {
        const items = await provider.processImage(imagePath, mimeType);
        console.log('Successfully extracted items:', JSON.stringify(items, null, 2));
    } catch (error) {
        console.error('Failed to extract items:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

test();
