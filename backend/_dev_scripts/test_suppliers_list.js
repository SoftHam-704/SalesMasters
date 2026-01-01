const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/suppliers',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        console.log('\n✅ GET /api/suppliers - First item:');
        const first = json.data[0];
        console.log('ID:', first.for_codigo || first.id);
        console.log('Nome:', first.for_nomered);
        console.log('for_homepage:', first.for_homepage);
        console.log('for_locimagem:', first.for_locimagem);
        console.log('\nHENGST (ID 34):');
        const hengst = json.data.find(s => s.for_codigo === 34);
        if (hengst) {
            console.log('for_homepage:', hengst.for_homepage);
            console.log('for_locimagem:', hengst.for_locimagem);
        } else {
            console.log('❌ HENGST not found in list');
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Error:', e.message);
});

req.end();
