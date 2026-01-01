const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Testing GET http://localhost:3001/api/aux/vendedores ...');
        const response = await axios.get('http://localhost:3001/api/aux/vendedores');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testEndpoint();
