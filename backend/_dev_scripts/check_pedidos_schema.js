const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkPedidosSchema() {
    try {
        console.log('🔍 Analisando tabela pedidos e dependências...\n');

        // 1. Ver colunas de pedidos
        const columns = await pool.query(`
            SELECT column_name, data_type, is_identity
            FROM information_schema.columns
            WHERE table_name = 'pedidos'
            ORDER BY ordinal_position
        `);
        console.log('📋 Colunas em pedidos:');
        columns.rows.forEach(r => console.log(`   ${r.column_name} (${r.data_type})`));

        // 2. Ver chaves primárias e sequências
        const pk = await pool.query(`
            SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
            AND    a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = 'pedidos'::regclass
            AND    i.indisprimary;
        `);
        console.log('\n🔑 Tabela tem PK?', pk.rows.length > 0 ? `Sim: ${pk.rows[0].attname}` : 'Não');

        // 3. Ver se existem tabelas referenciando pedidos (Foreign Keys)
        const fks = await pool.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='pedidos';
        `);

        console.log('\n🔗 Tabelas dependentes (FKs apontando para pedidos):');
        if (fks.rows.length === 0) {
            console.log('   Nenhuma dependência encontrada.');
        } else {
            fks.rows.forEach(r => console.log(`   ${r.table_name}.${r.column_name} -> pedidos.${r.foreign_column_name}`));
        }

        // 4. Ver dados atuais (ordem)
        const sample = await pool.query(`
            SELECT ped_numero, ped_emissao::text 
            FROM pedidos 
            ORDER BY ped_numero
            LIMIT 5
        `);
        console.log('\n📊 Amostra atual (ordenado por ped_numero):');
        console.table(sample.rows);

        const sampleDate = await pool.query(`
            SELECT ped_numero, ped_emissao::text 
            FROM pedidos 
            ORDER BY ped_emissao, ped_numero
            LIMIT 5
        `);
        console.log('\n📅 Amostra ordenada por Data (como ficará):');
        console.table(sampleDate.rows);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkPedidosSchema();
