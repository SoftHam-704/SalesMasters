const http = require('http');

const data = JSON.stringify({
    cnpj: '05.122.231/0001-91', // RIMEF
    nome: 'joao',
    sobrenome: 'ricardo',
    password: '123'
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/master-login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let body = '';

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('BODY: ' + body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
