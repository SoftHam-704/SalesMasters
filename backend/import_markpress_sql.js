
const { Pool } = require('pg');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 30000
};

const pool = new Pool(config);

async function runImport() {
    const filePath = '../importante_dados_markpress.sql';
    console.log(`Iniciando importação do arquivo: ${filePath}`);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const client = await pool.connect();
    try {
        let currentBatch = "";
        let lineCount = 0;
        let batchCount = 0;
        const BATCH_SIZE = 100; // linhas por batch

        console.log('Executando script SQL...');

        for await (const line of rl) {
            currentBatch += line + "\n";
            lineCount++;

            if (lineCount % BATCH_SIZE === 0) {
                await client.query(currentBatch);
                currentBatch = "";
                batchCount++;
                if (batchCount % 10 === 0) {
                    process.stdout.write(`\rProcessadas ${lineCount} linhas...  `);
                }
            }
        }

        if (currentBatch.trim()) {
            await client.query(currentBatch);
        }

        console.log(`\n✅ Importação concluída! Total de ${lineCount} linhas processadas.`);
    } catch (err) {
        console.error('\n❌ ERRO DURANTE A IMPORTAÇÃO:', err.message);
        // Se der erro, o log vai ajudar a identificar qual linha quebrou
    } finally {
        client.release();
        await pool.end();
    }
}

runImport();
