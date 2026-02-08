const axios = require('axios');

async function testTargetLogin() {
    const url = 'https://salesmasters.softham.com.br/api/auth/master-login';
    const payload = {
        cnpj: '33866124000103', // TARGET
        nome: 'TARGET',
        sobrenome: 'REPRESENTACOES',
        password: '123' // Supondo que a senha seja 123 ou algo do tipo para teste se falhar fallback
    };

    console.log(`🚀 Testando login para TARGET em ${url}...`);
    try {
        const res = await axios.post(url, payload);
        console.log('✅ SUCESSO:', res.data.message);
        console.log('📦 Tenant Config:', JSON.stringify(res.data.tenantConfig, null, 2));
    } catch (err) {
        console.log('❌ FALHA:', err.response?.data?.message || err.message);
        if (err.response?.data?.debug) console.log('🔍 DEBUG:', err.response.data.debug);
    }
}

testTargetLogin();
