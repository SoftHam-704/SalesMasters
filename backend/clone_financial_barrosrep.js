const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function cloneFinancials() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Disabling triggers/constraints for migration...');
        await client.query("SET session_replication_role = 'replica'");

        console.log('Truncating tables in barrosrep...');
        await client.query('TRUNCATE barrosrep.fin_plano_contas CASCADE');
        await client.query('TRUNCATE barrosrep.fin_centro_custo CASCADE');

        console.log('Cloning data from public.fin_plano_contas...');
        await client.query('INSERT INTO barrosrep.fin_plano_contas SELECT * FROM public.fin_plano_contas');

        console.log('Cloning data from public.fin_centro_custo...');
        await client.query('INSERT INTO barrosrep.fin_centro_custo SELECT * FROM public.fin_centro_custo');

        console.log('Enabling triggers/constraints...');
        await client.query("SET session_replication_role = 'origin'");

        console.log('Updating sequences...');
        await client.query("SELECT setval('barrosrep.fin_plano_contas_id_seq', (SELECT MAX(id) FROM barrosrep.fin_plano_contas))");
        await client.query("SELECT setval('barrosrep.fin_centro_custo_id_seq', (SELECT MAX(id) FROM barrosrep.fin_centro_custo))");

        // Optional: Also check for codigo_seq if it exists and needs reset
        // Based on previous check: barrosrep.fin_centro_custo_codigo_seq exists.
        // Let's see if we should reset it. If codigo is not numeric, we just leave it.
        // The public table doesn't seem to use it for 'VENDAS', 'TI', etc.

        await client.query('COMMIT');
        console.log('✅ Migration completed successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error during migration:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

cloneFinancials();
