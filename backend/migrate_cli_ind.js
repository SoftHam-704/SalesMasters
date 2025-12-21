require('dotenv').config();
const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrateCliInd() {
    const client = await pool.connect();
    try {
        console.log('📦 Iniciando migração de cli_ind...');

        // 1. Dropar e Criar Tabela
        await client.query('DROP TABLE IF EXISTS cli_ind CASCADE');
        console.log('🗑️ Tabela antiga removida.');

        const createTableQuery = `
            CREATE TABLE cli_ind (
                cli_lancamento INTEGER PRIMARY KEY,
                cli_codigo INTEGER NOT NULL,
                cli_forcodigo INTEGER NOT NULL,
                cli_desc1 DECIMAL(10,2),
                cli_desc2 DECIMAL(10,2),
                cli_desc3 DECIMAL(10,2),
                cli_desc4 DECIMAL(10,2),
                cli_desc5 DECIMAL(10,2),
                cli_desc6 DECIMAL(10,2),
                cli_desc7 DECIMAL(10,2),
                cli_desc8 DECIMAL(10,2),
                cli_desc9 DECIMAL(10,2),
                cli_desc10 DECIMAL(10,2),
                cli_transportadora INTEGER,
                cli_prazopg VARCHAR(100),
                cli_ipi VARCHAR(10),
                cli_tabela VARCHAR(50),
                cli_codcliind VARCHAR(100),
                cli_obsparticular TEXT,
                cli_comprador VARCHAR(100),
                cli_frete VARCHAR(50),
                cli_emailcomprador VARCHAR(200),
                cli_desc11 DECIMAL(10,2)
            );
        `;
        await client.query(createTableQuery);
        console.log('✅ Tabela cli_ind criada.');

        // 2. Ler Arquivo XLSX
        const filePath = path.join(__dirname, '..', 'data', 'cli_ind.xlsx');
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`📂 Lendo ${rows.length} registros do Excel...`);

        // 3. Inserir Dados
        let insertedCount = 0;
        let errorCount = 0;

        for (const row of rows) {
            try {
                const query = `
                    INSERT INTO cli_ind (
                        cli_lancamento, cli_codigo, cli_forcodigo, 
                        cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5, 
                        cli_desc6, cli_desc7, cli_desc8, cli_desc9, cli_desc10, 
                        cli_transportadora, cli_prazopg, cli_ipi, cli_tabela, 
                        cli_codcliind, cli_obsparticular, cli_comprador, 
                        cli_frete, cli_emailcomprador, cli_desc11
                    ) VALUES (
                        $1, $2, $3, 
                        $4, $5, $6, $7, $8, 
                        $9, $10, $11, $12, $13, 
                        $14, $15, $16, $17, 
                        $18, $19, $20, 
                        $21, $22, $23
                    )
                `;

                const values = [
                    parseInt(row.CLI_LANCAMENTO) || 0,
                    parseInt(row.CLI_CODIGO) || 0,
                    parseInt(row.CLI_FORCODIGO) || 0,
                    parseFloat(row.CLI_DESC1) || 0,
                    parseFloat(row.CLI_DESC2) || 0,
                    parseFloat(row.CLI_DESC3) || 0,
                    parseFloat(row.CLI_DESC4) || 0,
                    parseFloat(row.CLI_DESC5) || 0,
                    parseFloat(row.CLI_DESC6) || 0,
                    parseFloat(row.CLI_DESC7) || 0,
                    parseFloat(row.CLI_DESC8) || 0,
                    parseFloat(row.CLI_DESC9) || 0,
                    parseFloat(row.CLI_DESC10) || 0,
                    parseInt(row.CLI_TRANSPORTADORA) || null,
                    row.CLI_PRAZOPG || '',
                    row.CLI_IPI || '',
                    row.CLI_TABELA || '',
                    row.CLI_CODCLIIND || '',
                    row.CLI_OBSPARTICULAR || '',
                    row.CLI_COMPRADOR || '',
                    row.CLI_FRETE || '',
                    row.CLI_EMAILCOMPRADOR || '',
                    parseFloat(row.CLI_DESC11) || 0
                ];

                await client.query(query, values);
                insertedCount++;
                if (insertedCount % 100 === 0) process.stdout.write('.');

            } catch (err) {
                console.error(`❌ Erro no registro ${row.CLI_LANCAMENTO}:`, err.message);
                errorCount++;
            }
        }

        console.log('\n');
        console.log(`✅ Migração concluída!`);
        console.log(`📥 Inseridos: ${insertedCount}`);
        console.log(`❌ Erros: ${errorCount}`);

        // Criar índices para performance
        await client.query('CREATE INDEX idx_cli_ind_cliente ON cli_ind(cli_codigo)');
        await client.query('CREATE INDEX idx_cli_ind_fornecedor ON cli_ind(cli_forcodigo)');
        console.log('✅ Índices criados.');

    } catch (error) {
        console.error('🔥 Erro fatal na migração:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateCliInd();
