const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('--- TEST 1: Default (Limit 10) ---');
        let res = await axios.get('http://localhost:3001/api/aux/cidades');
        console.log('Count:', res.data.length);

        console.log('\n--- TEST 2: Search "Ponta" ---');
        res = await axios.get('http://localhost:3001/api/aux/cidades?search=Ponta');
        console.log('Count:', res.data.length);
        console.log('First:', res.data[0]);

        console.log('\n--- TEST 3: ID 1 (Ponta Pora) ---');
        res = await axios.get('http://localhost:3001/api/aux/cidades?id=1');
        console.log('Count:', res.data.length);
        console.log('Data:', res.data[0]);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEndpoint();
