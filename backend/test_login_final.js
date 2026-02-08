const http = require('http');

/*
    Teste FINAL de login simulando o Frontend
*/

const data = JSON.stringify({
    cnpj: '05.122.231/0001-91',
    nome: 'joao',
    sobrenome: 'ricardo',
    password: '123'
});

console.log('🚀 Enviando request de login para: http://localhost:8080/api/auth/master-login');

const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/master-login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    console.log(`📡 STATUS: ${res.statusCode}`);
    let body = '';

    res.on('data', d => body += d);

    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            console.log('\n✅ RESPOSTA DO SERVIDOR:');
            console.dir(parsed, { depth: null, colors: true });
        } catch (e) {
            console.log('Body:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Erro na request: ${e.message}`);
});

req.write(data);
req.end();
