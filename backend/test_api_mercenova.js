const fetch = require('node-fetch');

async function testApi() {
    try {
        const res = await fetch('http://localhost:3001/api/clients/2/industries');
        console.log(`Status: ${res.status}`);
        const json = await res.json();
        console.log('Response Length:', json.data ? json.data.length : 'No data field');
        if (json.data && json.data.length > 0) {
            console.log('Sample item:', json.data[0]);
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testApi();
