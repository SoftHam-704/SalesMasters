const fetch = require('node-fetch');

async function testEndpoint() {
    try {
        console.log('🧪 Testando endpoint set-discount-group...\n');

        const response = await fetch(
            'http://localhost:3005/api/products/set-discount-group/20/2M%20JAN%2F2026',
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itab_grupodesconto: 1 })
            }
        );

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const text = await response.text();
        console.log('\nResposta:', text);

        try {
            const json = JSON.parse(text);
            console.log('\nJSON:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('\nNão é JSON válido');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testEndpoint();
