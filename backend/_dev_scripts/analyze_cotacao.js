const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function analyzeItensPed() {
    try {
        // Verificar se coluna ite_cotacao existe
        const colCheck = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'itens_ped' 
            AND column_name IN ('ite_cotacao', 'ite_quant')
        `);
        console.log('Colunas encontradas:');
        console.table(colCheck.rows);

        if (colCheck.rows.some(r => r.column_name === 'ite_cotacao')) {
            // Verificar valores distintos de ite_cotacao
            const cotacaoValues = await pool.query(`
                SELECT ite_cotacao, COUNT(*) as total
                FROM itens_ped
                GROUP BY ite_cotacao
                ORDER BY ite_cotacao
            `);
            console.log('\nValores de ite_cotacao:');
            console.table(cotacaoValues.rows);

            // Total com e sem cotação
            const totals = await pool.query(`
                SELECT 
                    SUM(CASE WHEN ite_cotacao = '2' THEN ite_totbruto ELSE 0 END) as total_cotacao,
                    SUM(CASE WHEN ite_cotacao != '2' OR ite_cotacao IS NULL THEN ite_totbruto ELSE 0 END) as total_vendas
                FROM itens_ped i
                JOIN pedidos p ON i.ite_pedido = p.ped_pedido
                WHERE p.ped_situacao IN ('P', 'F')
            `);
            console.log('\nTotais (P+F):');
            console.table(totals.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

analyzeItensPed();
