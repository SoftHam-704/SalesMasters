const axios = require('axios');

async function testMarianaLogin() {
    const url = 'https://salesmasters.softham.com.br/api/auth/master-login';
    const payload = {
        cnpj: '40.778.122/0001-28',
        nome: 'mariana',
        sobrenome: 'freitas',
        password: '123'
    };

    console.log(`🚀 Simulando login para Mariana Freitas (R.O Consultoria) em ${url}...`);
    try {
        const res = await axios.post(url, payload);
        console.log('✅ SUCESSO:', res.data.message);
        console.log('📦 User:', JSON.stringify(res.data.user, null, 2));
    } catch (err) {
        console.log('❌ FALHA:', err.response?.data?.message || err.message);
        if (err.response?.data?.debug) {
            console.log('🔍 DEBUG ERROR:', err.response.data.debug);
        }
    }
}

testMarianaLogin();
