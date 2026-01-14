const fs = require('fs');
const readline = require('readline');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

const SCHEMA = 'ro_consult';
const CSV_PATH = path.join(__dirname, '../../data/itens_ped.csv');
const BATCH_SIZE = 500;

function parseBrFloat(val) {
    if (!val) return 0;
    return parseFloat(String(val).replace(',', '.'));
}

async function importItensPed() {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`🚀 IMPORTANDO ITENS -> SCHEMA: [${SCHEMA}]`);

            if (!fs.existsSync(CSV_PATH)) {
                return reject(new Error('CSV não existe'));
            }

            await pool.query(`SET search_path TO "${SCHEMA}"`);
            console.log('✅ Search path set');

            const fileStream = fs.createReadStream(CSV_PATH);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            let count = 0;
            let batch = [];
            let totalImported = 0;
            let headers = [];

            rl.on('line', async (line) => {
                try {
                    if (count === 0) {
                        headers = line.split(';');
                        console.log(`✅ Headers detectados: ${headers.length} colunas`);
                        count++;
                        return;
                    }

                    const rowArr = line.split(';');
                    if (rowArr.length >= headers.length) {
                        const row = {};
                        headers.forEach((h, i) => row[h] = rowArr[i]);

                        batch.push([
                            parseInt(row.ITE_LANCTO || 0),
                            String(row.ITE_PEDIDO || ''),
                            parseInt(row.ITE_INDUSTRIA || 0),
                            parseInt(row.ITE_IDPRODUTO || 0),
                            String(row.ITE_PRODUTO || ''),
                            String(row.ITE_NOMEPROD || ''),
                            parseBrFloat(row.ITE_QUANT),
                            parseBrFloat(row.ITE_PUNI),
                            parseBrFloat(row.ITE_PUNILIQ),
                            parseBrFloat(row.ITE_TOTLIQUIDO),
                            parseBrFloat(row.ITE_IPI),
                            parseBrFloat(row.ITE_ST)
                        ]);
                    }

                    count++;

                    if (batch.length >= BATCH_SIZE) {
                        const currentBatch = [...batch];
                        batch = [];
                        rl.pause();
                        await insertBatch(currentBatch);
                        totalImported += currentBatch.length;
                        process.stdout.write(`\r🚀 Processados: ${totalImported}`);
                        rl.resume();
                    }
                } catch (err) {
                    console.error('\n❌ Erro na linha:', err.message);
                }
            });

            rl.on('close', async () => {
                if (batch.length > 0) {
                    await insertBatch(batch);
                    totalImported += batch.length;
                    process.stdout.write(`\r🚀 Processados: ${totalImported}`);
                }
                console.log(`\n\n🏁 FIM! Total importado: ${totalImported}`);
                await pool.end();
                resolve();
            });

            rl.on('error', (err) => {
                console.error('❌ Erro no stream:', err);
                reject(err);
            });

        } catch (err) {
            console.error('❌ Erro fatal:', err.message);
            reject(err);
        }
    });
}

async function insertBatch(rows) {
    try {
        const query = `
            INSERT INTO itens_ped (
                ite_lancto, ite_pedido, ite_industria, ite_idproduto, 
                ite_produto, ite_nomeprod, ite_quant, ite_puni, 
                ite_puniliq, ite_totliquido, ite_ipi, ite_st
            ) VALUES ${rows.map((_, i) => `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, $${i * 12 + 5}, $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8}, $${i * 12 + 9}, $${i * 12 + 10}, $${i * 12 + 11}, $${i * 12 + 12})`).join(',')}
            ON CONFLICT (ite_lancto, ite_pedido, ite_idproduto, ite_industria) DO NOTHING
        `;
        await pool.query(query, rows.flat());
    } catch (err) {
        console.error(`\n❌ Erro no banco: ${err.message}`);
    }
}

importItensPed().then(() => process.exit(0)).catch(() => process.exit(1));
