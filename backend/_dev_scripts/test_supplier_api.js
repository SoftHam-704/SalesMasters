const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/suppliers/34',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log('\n✅ BACKEND RESPONSE:');
        console.log('for_homepage:', json.for_homepage);
        console.log('for_locimagem:', json.for_locimagem);
        console.log('\nFull data:');
        console.log(JSON.stringify(json, null, 2));
    });
});

req.on('error', (e) => {
    console.error('❌ Error:', e.message);
});

req.end();
