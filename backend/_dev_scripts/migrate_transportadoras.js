require('dotenv').config();
const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Drop existing table to ensure schema consistency
        console.log('Dropping and recreating transportadora table...');
        await client.query('DROP TABLE IF EXISTS transportadora CASCADE');
        await client.query(`
            CREATE TABLE transportadora (
                tra_codigo INTEGER PRIMARY KEY,
                tra_nome VARCHAR(255),
                tra_endereco VARCHAR(255),
                tra_bairro VARCHAR(100),
                tra_cidade VARCHAR(100),
                tra_uf VARCHAR(2),
                tra_cep VARCHAR(20),
                tra_fone VARCHAR(50),
                tra_contato VARCHAR(100),
                tra_email VARCHAR(255),
                tra_cgc VARCHAR(50),      -- CNPJ
                tra_inscricao VARCHAR(50), -- IE
                tra_obs TEXT
            )
        `);

        // Add Indices
        await client.query('CREATE INDEX idx_trans_nome ON transportadora(tra_nome)');

        const filePath = path.join('e:\\Sistemas_ia\\SalesMasters\\data', 'transportadoras.xlsx');
        console.log(`Reading file: ${filePath}`);
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} records.`);

        for (const row of data) {
            const query = `
                INSERT INTO transportadora (
                    tra_codigo, tra_nome, tra_endereco, tra_bairro, tra_cidade, 
                    tra_uf, tra_cep, tra_fone, tra_contato, tra_email, 
                    tra_cgc, tra_inscricao, tra_obs
                ) VALUES (
                    $1, $2, $3, $4, $5, 
                    $6, $7, $8, $9, $10, 
                    $11, $12, $13
                )
            `;

            const values = [
                row.CODIGO,
                row.NOME,
                row.ENDERECO,
                row.BAIRRO || '',
                row.CIDADE || '',
                row.UF || '',
                String(row.CEP || ''),
                String(row.TELEFONE1 || row.TELEFONE2 || ''),
                row.CONTATO || '',
                row.EMAIL || '',
                String(row.CNPJ || ''),
                String(row.IEST || ''),
                ''
            ];

            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
