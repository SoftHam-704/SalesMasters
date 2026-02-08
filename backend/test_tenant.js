const { Pool } = require('pg');

const p = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 5432,
    database: 'basesales',
    user: 'sistemas',
    password: 'hamilton123',
    options: '-c search_path=rimef,public'
});

async function test() {
    try {
        console.log('Connecting to basesales (schema rimef)...');
        const res = await p.query('SELECT codigo as id, nome, sobrenome, usuario, master as e_admin, gerencia FROM user_nomes WHERE nome ILIKE $1 AND sobrenome ILIKE $2', ['joao', 'ricardo']);
        console.log('User found in tenant:', res.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await p.end();
    }
}

test();
