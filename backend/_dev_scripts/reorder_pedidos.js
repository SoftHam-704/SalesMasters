const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function reorderPedidos() {
    try {
        console.log('🔄 Reordenando ped_numero em pedidos...\n');

        // 1. Atualizar ped_numero usando ROW_NUMBER()
        console.log('1️⃣ Recalculando números sequenciais (ordem: ped_data)...');
        await pool.query(`
            UPDATE pedidos
            SET ped_numero = subquery.new_num
            FROM (
                SELECT ped_pedido, ROW_NUMBER() OVER (ORDER BY ped_data ASC, gid ASC) as new_num
                FROM pedidos
            ) AS subquery
            WHERE pedidos.ped_pedido = subquery.ped_pedido
        `);
        console.log('   ✅ Números atualizados\n');

        // 2. Descobrir maior número
        const maxResult = await pool.query('SELECT MAX(ped_numero) as max_val FROM pedidos');
        const maxVal = maxResult.rows[0].max_val || 0;
        console.log(`   Maior ped_numero atual: ${maxVal}`);

        // 3. Criar e configurar sequence
        console.log('2️⃣ Configurando sequence...');

        // Criar sequence se não existir
        await pool.query(`
            CREATE SEQUENCE IF NOT EXISTS pedidos_ped_numero_seq
        `);

        // Ajustar valor da sequence
        const nextVal = maxVal + 1;
        await pool.query(`ALTER SEQUENCE pedidos_ped_numero_seq RESTART WITH ${nextVal}`);

        // Associar como default (se a coluna permitir)
        try {
            await pool.query(`
                ALTER TABLE pedidos 
                ALTER COLUMN ped_numero 
                SET DEFAULT nextval('pedidos_ped_numero_seq'::regclass)
            `);
            await pool.query(`ALTER SEQUENCE pedidos_ped_numero_seq OWNED BY pedidos.ped_numero`);
            console.log(`   ✅ Sequence ajustada para começar em ${nextVal} e definida como DEFAULT`);
        } catch (e) {
            console.log(`   ⚠️ Nota: Não foi possível definir DEFAULT (talvez coluna não seja null), mas sequence foi criada/ajustada.`);
        }

        console.log('\n🎉 Reordenação concluída!');

        // 4. Mostrar amostra
        const result = await pool.query(`
            SELECT ped_numero, ped_data, ped_pedido 
            FROM pedidos 
            ORDER BY ped_numero 
            LIMIT 10
        `);
        console.log('\n📋 Primeiros 10 pedidos reordenados:');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

reorderPedidos();
