// Query simples para buscar TOP 6 indústrias
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/reports/top-industries?ano=2025&metrica=Valor',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);

            if (response.success) {
                console.log('\n=== 🏆 TOP 6 INDÚSTRIAS POR FATURAMENTO LÍQUIDO ===\n');

                response.data.forEach((row, idx) => {
                    console.log(`${idx + 1}. ${row.nome} (Código: ${row.codigo})`);
                    console.log(`   💰 Total Vendas: R$ ${Number(row.total_vendas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                    console.log(`   📊 Percentual: ${row.percentual}%`);
                    console.log(`   📦 Total Pedidos: ${row.total_pedidos}`);
                    if (row.imagem_url) {
                        console.log(`   🖼️  Imagem: ${row.imagem_url}`);
                    }
                    console.log('');
                });
            } else {
                console.log('❌ Erro:', response.error);
            }
        } catch (err) {
            console.log('❌ Erro ao processar resposta:', err.message);
            console.log('Resposta raw:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
});

req.end();
