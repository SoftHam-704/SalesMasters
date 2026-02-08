
const { Pool } = require('pg');

const config = {
    host: '10.100.28.17',
    port: 5432,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 5000
};

console.log('Tentando conectar em 10.100.28.17...');

const pool = new Pool(config);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ FALHA AO CONECTAR:', err.message);
    } else {
        console.log('✅ SUCESSO! Conexão estabelecida.');
        console.log('Hora do Servidor:', res.rows[0].now);
    }
    pool.end();
});
