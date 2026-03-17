
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const schema = 'rmrep';

async function updateItemProductLinks() {
    console.log(`🚀 Iniciando atualização de ite_idproduto no schema: ${schema}`);

    try {
        const sql = `
            UPDATE ${schema}.itens_ped i
            SET ite_idproduto = p.pro_id
            FROM ${schema}.cad_prod p
            WHERE i.ite_industria = p.pro_industria
              AND i.ite_codigonormalizado = p.pro_codigonormalizado
              AND (i.ite_idproduto = 0 OR i.ite_idproduto IS NULL);
        `;

        console.log('⏳ Executando UPDATE (isso pode levar alguns minutos dependendo do volume)...');
        const res = await pool.query(sql);
        console.log(`✅ Sucesso! ${res.rowCount} itens vinculados aos seus respectivos produtos.`);

    } catch (err) {
        console.error('❌ Erro durante o update:', err.message);
    } finally {
        await pool.end();
    }
}

updateItemProductLinks();
