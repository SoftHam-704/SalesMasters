const https = require('https');

const data = JSON.stringify({
    cnpj: '05.122.231/0001-91',
    nome: 'joao',
    sobrenome: 'ricardo',
    password: '123'
});

const options = {
    hostname: 'salesmasters.softham.com.br',
    port: 443,
    path: '/api/auth/master-login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('🚀 Testando login em PRODUÇÃO (https://salesmasters.softham.com.br)...');

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let body = '';
    res.on('data', d => body += d);

    res.on('end', () => {
        try {
            if (res.statusCode === 200) {
                console.log('✅ SUCESSO! Login funcionou.');
            } else {
                console.log('❌ FALHA. Status:', res.statusCode);
                console.log('Body:', body);
            }
        } catch (e) {
            console.log(e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
});

req.write(data);
req.end();
