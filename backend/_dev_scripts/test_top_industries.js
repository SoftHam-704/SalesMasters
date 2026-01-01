const http = require('http');

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/reports/top-industries?ano=2025&metrica=Valor',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('\n✅ TOP INDUSTRIES ENDPOINT RESPONSE:');
            console.log('Success:', json.success);
            console.log('Data count:', json.data?.length || 0);
            if (json.data && json.data.length > 0) {
                console.log('\nFirst industry:');
                console.log(JSON.stringify(json.data[0], null, 2));
            } else if (json.error) {
                console.log('❌ ERROR:', json.message);
                console.log('Detail:', json.detail);
            }
        } catch (e) {
            console.log('❌ Parse error:', e.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.end();
