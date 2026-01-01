const fetch = require('node-fetch');

async function checkDiscountGroups() {
    try {
        const response = await fetch('http://localhost:3005/api/v2/discount-groups');
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            console.log('✅ Dados recebidos. Estrutura do primeiro registro:');
            console.log(data.data[0]);
            console.log('\nChaves encontradas:', Object.keys(data.data[0]));
        } else {
            console.log('⚠️ Nenhum dado encontrado ou erro na request.');
            console.log(data);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkDiscountGroups();
