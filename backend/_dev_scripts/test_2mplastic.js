const axios = require('axios');

async function testWithIndustry() {
    try {
        console.log('🧪 Testing with 2M PLASTIC (industry 12)...\n');

        // Primeiro, vamos descobrir o código da indústria 2M PLASTIC
        console.log('📋 Fetching industries...');
        const industriesResponse = await axios.get('http://localhost:3005/api/suppliers');
        const industries = industriesResponse.data.fornecedores || industriesResponse.data;
        const plastic2m = industries.find(i => i.for_nomered && i.for_nomered.includes('2M'));

        if (plastic2m) {
            console.log(`Found: ${plastic2m.for_nomered} (ID: ${plastic2m.for_codigo})\n`);

            // Agora testar com os dados da imagem
            const url = `http://localhost:3005/api/orders/stats?dataInicio=2024-12-01&dataFim=2024-12-22&industria=${plastic2m.for_codigo}`;
            console.log('URL:', url);

            const response = await axios.get(url);
            console.log('\n📊 Results:');
            console.log('Status:', response.status);
            console.log('\nData:', JSON.stringify(response.data, null, 2));

            // Comparar com os valores da imagem
            const { data } = response.data;
            console.log('\n🔍 Comparison:');
            console.log(`Total Vendido: R$ ${data.total_vendido.toFixed(2)} (Expected: R$ 57.666,87)`);
            console.log(`Quantidade: ${data.total_quantidade} (Expected: 2284)`);
            console.log(`Clientes: ${data.total_clientes} (Expected: 4)`);
            console.log(`Ticket Médio: R$ ${data.ticket_medio.toFixed(2)} (Expected: R$ 14.416,72)`);

        } else {
            console.log('❌ Industry 2M PLASTIC not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testWithIndustry();
