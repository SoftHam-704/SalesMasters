const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    connectionTimeoutMillis: 10000 // 10 segundos de timeout
});

const SCHEMA = process.env.SCHEMA || 'repsoma';

function parseCurrency(valueStr) {
    if (!valueStr) return 0;
    let clean = valueStr.toString().replace(/\./g, '').replace(',', '.');
    let val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    dateStr = dateStr.replace(/['"]/g, '').trim();
    if (dateStr.includes('1899') || dateStr === '00:00:00' || dateStr.length < 8) return null;
    if (dateStr.includes('RUA') || dateStr.includes('AVENIDA') || dateStr.length > 25) return null;

    if (dateStr.includes('.')) {
        const fullParts = dateStr.split(' ');
        const dateParts = fullParts[0].split('.');
        if (dateParts.length === 3) {
            if (isNaN(dateParts[0]) || isNaN(dateParts[1]) || isNaN(dateParts[2])) return null;
            const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            if (fullParts[1] && fullParts[1].includes(':')) return `${isoDate} ${fullParts[1]}`;
            return isoDate;
        }
    }
    return dateStr.match(/^\d{4}-\d{2}-\d{2}/) ? dateStr : null;
}

const productCache = new Map();

async function loadProductCache() {
    console.log('📦 Carregando cache de produtos...');
    const res = await pool.query(`SELECT pro_id, pro_industria, pro_codprod FROM cad_prod`);
    res.rows.forEach(r => {
        const key = `${r.pro_industria}-${String(r.pro_codprod).trim()}`;
        productCache.set(key, r.pro_id);
    });
    console.log(`✅ Cache carregado: ${productCache.size} produtos.`);
}

async function importItensPedCSV() {
    console.log(`🚀 IMPORTANDO ITENS (Lotes + ON CONFLICT) -> SCHEMA: [${SCHEMA}]\n`);

    const filePath = path.join(__dirname, '../../data/iten_ped.csv');
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ERRO: Arquivo não encontrado`);
        return;
    }

    try {
        await pool.query(`SET search_path TO "${SCHEMA}"`);
        await loadProductCache();

        const BATCH_SIZE = 3000;
        let batch = [];
        let totalProcessed = 0;
        let imported = 0;
        let errors = 0;

        const stream = fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => {
                const cleanRow = {};
                for (const key in row) cleanRow[key.toUpperCase().trim()] = row[key];
                batch.push(cleanRow);
                totalProcessed++;

                if (batch.length >= BATCH_SIZE) {
                    stream.pause();
                    processBatch(batch).then(() => {
                        batch = [];
                        stream.resume();
                    }).catch(e => {
                        console.error('Fatal batch error', e);
                        process.exit(1);
                    });
                }
            })
            .on('end', async () => {
                if (batch.length > 0) await processBatch(batch);
                console.log(`\n\n✅ Concluído! Total: ${totalProcessed} | Sucesso: ${imported} | Erros: ${errors}`);
                await pool.end();
            });

        async function processBatch(currentBatch) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const row of currentBatch) {
                    const industriaId = parseInt(row.ITE_INDUSTRIA) || 0;
                    const codProd = String(row.ITE_PRODUTO || '').trim();
                    let proId = parseInt(row.ITE_IDPRODUTO) || null;

                    if (!proId && industriaId && codProd) {
                        proId = productCache.get(`${industriaId}-${codProd}`) || null;
                    }

                    if (!proId) { errors++; continue; }

                    const query = `
                        INSERT INTO itens_ped (
                            ite_lancto, ite_pedido, ite_industria, ite_idproduto, ite_produto,
                            ite_nomeprod, ite_grupo, ite_data, ite_quant, ite_puni,
                            ite_puniliq, ite_totliquido, ite_totbruto, ite_ipi, ite_st,
                            ite_seq, ite_status, gid
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                        ON CONFLICT (ite_lancto) DO NOTHING
                    `;

                    await client.query(query, [
                        parseInt(row.ITE_LANCTO) || 0, String(row.ITE_PEDIDO || ''), industriaId, proId, codProd,
                        String(row.ITE_NOMEPROD || '').substring(0, 100), parseInt(row.ITE_GRUPO) || null,
                        parseDate(row.ITE_DATA), parseCurrency(row.ITE_QUANT), parseCurrency(row.ITE_PUNI),
                        parseCurrency(row.ITE_PUNILIQ), parseCurrency(row.ITE_TOTLIQUIDO),
                        parseCurrency(row.ITE_TOTBRUTO), parseCurrency(row.ITE_IPI), parseCurrency(row.ITE_ST),
                        parseInt(row.ITE_SEQ) || 1, String(row.ITE_STATUS || 'A').substring(0, 1), String(row.GID || '')
                    ]);
                    imported++;
                }
                await client.query('COMMIT');
                process.stdout.write(`\r🚀 Processando: ${totalProcessed} (Sucesso: ${imported})`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`\n❌ Erro no lote: ${err.message}`);
                errors += currentBatch.length;
            } finally {
                client.release();
            }
        }
    } catch (e) {
        console.error('Initialization error', e);
    }
}

importItensPedCSV();
