const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

const SCHEMA = 'ro_consult';

async function check() {
    try {
        console.log(`\n========== VERIFICAÇÃO DE itens_ped NO SCHEMA ${SCHEMA} ==========\n`);

        // 1. Contagem de registros
        console.log('1️⃣ CONTAGEM DE REGISTROS:');
        const countItens = await pool.query(`SELECT count(*) as total FROM ${SCHEMA}.itens_ped`);
        console.log(`   - itens_ped: ${countItens.rows[0].total} registros`);

        const countPedidos = await pool.query(`SELECT count(*) as total FROM ${SCHEMA}.pedidos`);
        console.log(`   - pedidos: ${countPedidos.rows[0].total} registros`);

        // 2. Estrutura da tabela
        console.log('\n2️⃣ ESTRUTURA DA TABELA itens_ped:');
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = 'itens_ped'
            ORDER BY ordinal_position
        `, [SCHEMA]);
        console.table(structure.rows);

        // 3. Verificar integridade referencial (itens sem pedido correspondente)
        console.log('\n3️⃣ INTEGRIDADE REFERENCIAL:');
        const orphanItems = await pool.query(`
            SELECT COUNT(*) as orphan_count
            FROM ${SCHEMA}.itens_ped i
            LEFT JOIN ${SCHEMA}.pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
            WHERE p.ped_pedido IS NULL
        `);
        console.log(`   - Itens órfãos (sem pedido correspondente): ${orphanItems.rows[0].orphan_count}`);

        // 4. Verificar itens com produto vinculado
        console.log('\n4️⃣ VINCULAÇÃO DE PRODUTOS:');
        const prodLink = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(ite_idproduto) as com_idproduto,
                COUNT(*) - COUNT(ite_idproduto) as sem_idproduto
            FROM ${SCHEMA}.itens_ped
        `);
        console.log(`   - Total de itens: ${prodLink.rows[0].total}`);
        console.log(`   - Com ite_idproduto preenchido: ${prodLink.rows[0].com_idproduto}`);
        console.log(`   - Sem ite_idproduto (NULL): ${prodLink.rows[0].sem_idproduto}`);

        // 5. Amostra de registros
        console.log('\n5️⃣ AMOSTRA DE 10 REGISTROS:');
        const sample = await pool.query(`
            SELECT ite_pedido, ite_industria, ite_idproduto, ite_produto, ite_nomeprod, ite_quant, ite_totliquido
            FROM ${SCHEMA}.itens_ped
            ORDER BY ite_pedido DESC
            LIMIT 10
        `);
        console.table(sample.rows);

        // 6. Estatísticas por indústria
        console.log('\n6️⃣ ITENS POR INDÚSTRIA:');
        const byInd = await pool.query(`
            SELECT ite_industria, COUNT(*) as qtd_itens, SUM(ite_totliquido) as valor_total
            FROM ${SCHEMA}.itens_ped
            GROUP BY ite_industria
            ORDER BY qtd_itens DESC
        `);
        console.table(byInd.rows);

        // 7. Itens por mês (últimos 6 meses)
        console.log('\n7️⃣ ITENS POR MÊS (com base em ite_data):');
        const byMonth = await pool.query(`
            SELECT 
                TO_CHAR(ite_data, 'YYYY-MM') as mes,
                COUNT(*) as qtd_itens,
                SUM(ite_totliquido) as valor_total
            FROM ${SCHEMA}.itens_ped
            WHERE ite_data IS NOT NULL AND ite_data >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(ite_data, 'YYYY-MM')
            ORDER BY mes DESC
        `);
        console.table(byMonth.rows);

        console.log('\n========== FIM DA VERIFICAÇÃO ==========\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

check();
