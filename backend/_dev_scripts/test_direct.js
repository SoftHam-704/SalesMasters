const axios = require('axios');

async function testDirect() {
    try {
        console.log('🧪 Testing 2M PLASTIC (ID: 20) - Period: 01/11/2024 to 22/12/2024\n');

        const url = 'http://localhost:3005/api/orders/stats?dataInicio=2024-11-01&dataFim=2024-12-22&industria=20';
        console.log('URL:', url, '\n');

        const response = await axios.get(url);
        const { data } = response.data;

        console.log('📊 API Results:');
        console.log('   Total Vendido: R$', data.total_vendido.toFixed(2));
        console.log('   Quantidade:', data.total_quantidade);
        console.log('   Clientes:', data.total_clientes);
        console.log('   Ticket Médio: R$', data.ticket_medio.toFixed(2));

        console.log('\n📸 Expected (from screenshot):');
        console.log('   Total Vendido: R$ 57.666,87');
        console.log('   Quantidade: 2284');
        console.log('   Clientes: 4');
        console.log('   Ticket Médio: R$ 14.416,72');

        console.log('\n✅ Match Check:');
        const totalMatch = Math.abs(data.total_vendido - 57666.87) < 0.01;
        const qtdMatch = data.total_quantidade === 2284;
        const clientesMatch = data.total_clientes === 4;
        const ticketMatch = Math.abs(data.ticket_medio - 14416.72) < 0.01;

        console.log('   Total Vendido:', totalMatch ? '✅ MATCH' : '❌ DIFF');
        console.log('   Quantidade:', qtdMatch ? '✅ MATCH' : '❌ DIFF');
        console.log('   Clientes:', clientesMatch ? '✅ MATCH' : '❌ DIFF');
        console.log('   Ticket Médio:', ticketMatch ? '✅ MATCH' : '❌ DIFF');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDirect();
