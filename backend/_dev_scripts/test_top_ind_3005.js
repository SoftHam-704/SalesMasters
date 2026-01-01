const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/reports/top-industries?ano=2025&metrica=Valor',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('\n✅ TOP INDUSTRIES ENDPOINT (port 3005):');
            console.log('Success:', json.success);
            if (json.success && json.data) {
                console.log('Data count:', json.data.length);
                console.log('\nTop 3 industries:');
                json.data.slice(0, 3).forEach((ind, i) => {
                    console.log(`\n${i + 1}. ${ind.nome} (${ind.codigo})`);
                    console.log(`   imagem_url: ${ind.imagem_url}`);
                    console.log(`   total_vendas: ${ind.total_vendas}`);
                });
            } else {
                console.log('❌ ERROR:', json.message || json.detail);
            }
        } catch (e) {
            console.log('❌ Parse error:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
});

req.end();
