
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function checkPriceAndSchema() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        statement_timeout: 5000
    });

    console.log('--- Diagnóstico de Preço e Schema (V2) ---');

    try {
        console.log('1. Conectando...');
        const client = await pool.connect();
        console.log('   Conectado com sucesso.');
        client.release();

        // 1. Verificar conteúdo
        try {
            console.log('\n2. Pedido CP907298 em repsoma (itens_ped):');
            const orderRes = await pool.query(`
                SELECT ite_produto, ite_quant, ite_puni, ite_totbruto, ite_codigonormalizado, ite_idproduto
                FROM repsoma.itens_ped
                WHERE ite_pedido = 'CP907298'
                LIMIT 5
            `);
            console.log('   Linhas encontradas:', orderRes.rowCount);
            if (orderRes.rowCount > 0) {
                console.log(JSON.stringify(orderRes.rows, null, 2));
            } else {
                console.log('   Nenhum item encontrado para este pedido.');
            }
        } catch (e) {
            console.error('   ❌ Falha na etapa 2:', e.message);
        }

        // 2. Verificar Preço
        try {
            console.log('\n3. Preço de RCD130 na Indústria 6:');
            const prodRes = await pool.query(`
                SELECT p.pro_codprod, p.pro_codigonormalizado, t.itab_precobruto, t.itab_tabela 
                FROM cad_prod p 
                JOIN cad_tabelaspre t ON p.pro_id = t.itab_idprod 
                WHERE p.pro_codprod = 'RCD130' 
                AND p.pro_industria = 6
                LIMIT 5
            `);
            console.log('   Linhas encontradas:', prodRes.rowCount);
            if (prodRes.rowCount > 0) {
                console.log(JSON.stringify(prodRes.rows, null, 2));
            } else {
                console.log('   Produto/Preço não encontrado.');
            }
        } catch (e) {
            console.error('   ❌ Falha na etapa 3:', e.message);
        }

        // 3. Normalização
        try {
            console.log('\n4. Teste de Normalização:');
            const normRes = await pool.query(`SELECT public.fn_normalizar_codigo('RCD130') as norm`);
            console.log('   Normalizado:', normRes.rows[0].norm);
        } catch (e) {
            console.error('   ❌ Falha na etapa 4:', e.message);
        }

    } catch (err) {
        console.error('❌ Erro Geral:', err);
    } finally {
        await pool.end();
    }
}

checkPriceAndSchema();
