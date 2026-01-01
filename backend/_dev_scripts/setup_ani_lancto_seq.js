const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function setupAniLanctoSequence() {
    try {
        console.log('🔧 Configurando sequence para ani_lancto...\n');

        // 1. Descobrir maior valor atual
        const maxResult = await pool.query('SELECT MAX(ani_lancto) as max_val FROM cli_aniv');
        const maxVal = maxResult.rows[0].max_val || 0;
        console.log(`   Maior valor atual: ${maxVal}`);

        // 2. Criar sequence começando do próximo valor
        const nextVal = maxVal + 1;
        await pool.query(`
            CREATE SEQUENCE IF NOT EXISTS cli_aniv_ani_lancto_seq
            START WITH ${nextVal}
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        `);
        console.log(`   ✅ Sequence criada começando em ${nextVal}`);

        // 3. Configurar como default da coluna
        await pool.query(`
            ALTER TABLE cli_aniv 
            ALTER COLUMN ani_lancto 
            SET DEFAULT nextval('cli_aniv_ani_lancto_seq'::regclass)
        `);
        console.log('   ✅ Default configurado');

        // 4. Associar a sequence à coluna
        await pool.query(`
            ALTER SEQUENCE cli_aniv_ani_lancto_seq OWNED BY cli_aniv.ani_lancto
        `);
        console.log('   ✅ Sequence associada à coluna');

        console.log('\n🎉 Configuração concluída!');
        console.log(`   Próximo registro terá ani_lancto = ${nextVal}`);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

setupAniLanctoSequence();
