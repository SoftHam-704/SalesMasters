// Script para consultar TOP 6 indústrias por faturamento líquido
const Firebird = require('node-firebird');
require('dotenv').config();

const options = {
    host: process.env.FB_HOST || 'localhost',
    port: parseInt(process.env.FB_PORT) || 3050,
    database: process.env.FB_DATABASE,
    user: process.env.FB_USER || 'SYSDBA',
    password: process.env.FB_PASSWORD,
    lowercase_keys: false,
    role: null,
    pageSize: 4096
};

Firebird.attach(options, function (err, db) {
    if (err) {
        console.error('❌ Erro ao conectar:', err);
        process.exit(1);
    }

    const query = `
        SELECT FIRST 6
            i.IND_CODIGO,
            i.IND_DESCRICAO,
            f.FOR_HOMEPAGE,
            SUM(ip.ITE_TOTLIQUIDO) as TOTAL_LIQUIDO,
            COUNT(DISTINCT ip.ITE_PEDIDO) as QTD_PEDIDOS,
            COUNT(ip.ITE_CODIGO) as QTD_ITENS
        FROM INDUSTRIAS i
        LEFT JOIN FORNECEDORES f ON f.FOR_CODIGO = i.IND_FORNECEDOR
        LEFT JOIN PRODUTOS pr ON pr.PRO_INDUSTRIA = i.IND_CODIGO
        LEFT JOIN ITENS_PED ip ON ip.ITE_PRODUTO = pr.PRO_CODIGO
        WHERE ip.ITE_TOTLIQUIDO IS NOT NULL
        GROUP BY i.IND_CODIGO, i.IND_DESCRICAO, f.FOR_HOMEPAGE
        ORDER BY TOTAL_LIQUIDO DESC
    `;

    db.query(query, [], function (err, result) {
        if (err) {
            console.error('❌ Erro na query:', err);
            db.detach();
            process.exit(1);
        }

        console.log('\n=== 🏆 TOP 6 INDÚSTRIAS POR FATURAMENTO LÍQUIDO ===\n');

        result.forEach((row, idx) => {
            console.log(`${idx + 1}. ${row.IND_DESCRICAO} (Código: ${row.IND_CODIGO})`);
            console.log(`   💰 Faturamento Líquido: R$ ${row.TOTAL_LIQUIDO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
            console.log(`   📦 Pedidos: ${row.QTD_PEDIDOS} | Itens: ${row.QTD_ITENS}`);
            if (row.FOR_HOMEPAGE) {
                console.log(`   🖼️  Imagem: ${row.FOR_HOMEPAGE}`);
            }
            console.log('');
        });

        db.detach();
        process.exit(0);
    });
});
