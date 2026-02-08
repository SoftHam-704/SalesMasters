
const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

async function linkProducts() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        statement_timeout: 60000 // 1 minute
    });

    try {
        console.log('--- Iniciando Vínculo de IDs via Código Normalizado ---');

        const res = await pool.query(`
            UPDATE repsoma.itens_ped i
            SET ite_idproduto = p.pro_id
            FROM cad_prod p
            WHERE i.ite_codigonormalizado = p.pro_codigonormalizado
              AND i.ite_idproduto IS NULL
        `);

        console.log(`✅ Sucesso! ${res.rowCount} itens foram vinculados ao catálogo.`);

        // Verificar quantos ainda restam sem vínculo
        const check = await pool.query(`SELECT COUNT(*) FROM repsoma.itens_ped WHERE ite_idproduto IS NULL`);
        console.log(`📊 Itens restantes sem vínculo: ${check.rows[0].count}`);

    } catch (err) {
        console.error('❌ Erro na atualização:', err.message);
    } finally {
        await pool.end();
    }
}

linkProducts();
