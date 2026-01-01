require('dotenv').config();
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function migrateVendedores() {
    const client = await pool.connect();
    try {
        console.log('Iniciando migração de Vendedores...');

        // 1. Create Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS vendedores (
                ven_codigo INTEGER PRIMARY KEY,
                ven_nome VARCHAR(100),
                ven_endereco VARCHAR(255),
                ven_bairro VARCHAR(100),
                ven_cidade VARCHAR(100),
                ven_uf VARCHAR(2),
                ven_cep VARCHAR(20),
                ven_fone1 VARCHAR(50),
                ven_fone2 VARCHAR(50),
                ven_email VARCHAR(255),
                ven_comissao DECIMAL(10,2),
                ven_nomeusu VARCHAR(100),
                ven_cpf VARCHAR(20),
                ven_rg VARCHAR(20),
                ven_codusu INTEGER,
                ven_obs TEXT,
                gid VARCHAR(50)
            );
        `);
        console.log('✓ Tabela vendedores verificada/criada.');

        // 2. Read XLSX
        const xlsxPath = path.join('e:\\Sistemas_ia\\SalesMasters\\data', 'vendedores.xlsx');
        if (!fs.existsSync(xlsxPath)) {
            throw new Error(`Arquivo não encontrado: ${xlsxPath}`);
        }

        const workbook = XLSX.readFile(xlsxPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet); // Uses first row as keys

        console.log(`Lendo ${data.length} registros...`);

        // 3. Insert Data
        for (const row of data) {
            const query = `
                INSERT INTO vendedores (
                    ven_codigo, ven_nome, ven_endereco, ven_bairro, ven_cidade, 
                    ven_uf, ven_cep, ven_fone1, ven_fone2, ven_email, 
                    ven_comissao, ven_nomeusu, ven_cpf, ven_rg, ven_codusu, 
                    ven_obs, gid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                ON CONFLICT (ven_codigo) DO UPDATE SET
                    ven_nome = EXCLUDED.ven_nome,
                    ven_email = EXCLUDED.ven_email,
                    ven_comissao = EXCLUDED.ven_comissao;
            `;

            const values = [
                parseInt(row.VEN_CODIGO) || 0,
                row.VEN_NOME?.toString().substring(0, 100) || null,
                row.VEN_ENDERECO?.toString().substring(0, 255) || null,
                row.VEN_BAIRRO?.toString().substring(0, 100) || null,
                row.VEN_CIDADE?.toString().substring(0, 100) || null,
                row.VEN_UF?.toString().substring(0, 2) || null,
                row.VEN_CEP?.toString().substring(0, 20) || null,
                row.VEN_FONE1?.toString().substring(0, 50) || null,
                row.VEN_FONE2?.toString().substring(0, 50) || null,
                row.VEN_EMAIL?.toString().substring(0, 255) || null,
                parseFloat(row.VEN_COMISSAO) || 0,
                row.VEN_NOMEUSU?.toString().substring(0, 100) || null,
                row.VEN_CPF?.toString().substring(0, 20) || null,
                row.VEN_RG?.toString().substring(0, 20) || null,
                parseInt(row.VEN_CODUSU) || null,
                row.VEN_OBS?.toString() || null,
                row.GID?.toString().substring(0, 50) || null
            ];

            await client.query(query, values);
        }

        console.log(`✓ ${data.length} vendedores processados com sucesso.`);

    } catch (error) {
        console.error('Erro na migração:', error);
    } finally {
        client.release();
        process.exit();
    }
}

migrateVendedores();
