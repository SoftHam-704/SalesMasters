const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('🧪 Testing /api/orders/stats endpoint...\n');

        const url = 'http://localhost:3005/api/orders/stats?dataInicio=2024-11-01&dataFim=2024-12-22';
        console.log('URL:', url);

        const response = await axios.get(url);
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        console.log('\nResponse:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testEndpoint();
