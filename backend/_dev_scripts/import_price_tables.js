const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'basesales',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: 5432,
});

const CSV_FILE = path.join(__dirname, '../data/cad_tabelaspre.csv');

async function importPriceTables() {
    const client = await pool.connect();
    try {
        console.log("🚀 Iniciando importação de Tabelas de Preço...");
        console.time("Importação");

        // 1. Create Temp Table
        await client.query('BEGIN');
        await client.query(`
            CREATE TEMP TABLE temp_price_import (
                raw_codprod TEXT,
                id_industria INTEGER,
                tabela TEXT,
                grupo_desc INTEGER,
                desc_add DOUBLE PRECISION,
                ipi DOUBLE PRECISION,
                st DOUBLE PRECISION,
                pre_peso DOUBLE PRECISION,
                preco_bruto DOUBLE PRECISION,
                preco_promo DOUBLE PRECISION,
                preco_especial DOUBLE PRECISION,
                data_tabela DATE,
                data_vencimento DATE,
                status CHAR(1)
            )
        `);
        console.log("✅ Tabela temporária criada.");

        // 2. Read CSV and Prepare Batch Insert
        const fileStream = fs.createReadStream(CSV_FILE);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let isHeader = true;
        let batch = [];
        const BATCH_SIZE = 1000;
        let totalLines = 0;

        for await (const line of rl) {
            if (isHeader) {
                isHeader = false; // Skip header: ITAB_IDPROD;PRO_CODPROD...
                continue;
            }
            if (!line.trim()) continue;

            const cols = line.split(';');

            // Map columns based on CSV structure:
            // 0: ITAB_IDPROD (Ignored)
            // 1: PRO_CODPROD
            // 2: ITAB_IDINDUSTRIA
            // 3: ITAB_TABELA
            // 4: ITAB_GRUPODESCONTO
            // 5: ITAB_DESCONTOADD
            // 6: ITAB_IPI
            // 7: ITAB_ST
            // 8: ITAB_PREPESO
            // 9: ITAB_PRECOBRUTO
            // 10: ITAB_PRECOPROMO
            // 11: ITAB_PRECOESPECIAL
            // 12: ITAB_DATATABELA (dd.mm.yyyy)
            // 13: ITAB_DATAVENCIMENTO (dd.mm.yyyy)
            // 14: ITAB_STATUS

            const parseNum = (val) => val ? parseFloat(val.replace(',', '.').replace(/[^\d.-]/g, '')) || null : null;
            const parseDate = (val) => {
                if (!val) return null;
                const parts = val.split('.'); // 24.02.2025
                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                return null;
            };

            const row = [
                cols[1], // raw_codprod
                parseInt(cols[2]) || null, // id_industria
                cols[3], // tabela
                parseInt(cols[4]) || null, // grupo_desc
                parseNum(cols[5]), // desc_add
                parseNum(cols[6]), // ipi
                parseNum(cols[7]), // st
                parseNum(cols[8]), // pre_peso
                parseNum(cols[9]), // preco_bruto
                parseNum(cols[10]), // preco_promo
                parseNum(cols[11]), // preco_especial
                parseDate(cols[12]), // data_tabela
                parseDate(cols[13]), // data_vencimento
                cols[14] // status
            ];

            batch.push(row);

            if (batch.length >= BATCH_SIZE) {
                await insertBatch(client, batch);
                batch = [];
                process.stdout.write(`\r📥 Processados: ${totalLines} linhas...`);
            }
            totalLines++;
        }

        if (batch.length > 0) {
            await insertBatch(client, batch);
        }

        console.log(`\n✅ ${totalLines} registros carregados na temp table.`);

        // 3. Perform Join and Insert into Final Table
        console.log("🔄 Cruzando dados com Cadastro de Produtos (Normalização)...");

        // This query joins the temp table with cad_prod based on industry and NORMALIZED code
        const insertQuery = `
            INSERT INTO cad_tabelaspre (
                itab_idprod,
                itab_idindustria,
                itab_tabela,
                itab_grupodesconto,
                itab_descontoadd,
                itab_ipi,
                itab_st,
                itab_prepeso,
                itab_precobruto,
                itab_precopromo,
                itab_precoespecial,
                itab_datatabela,
                itab_datavencimento,
                itab_status
            )
            SELECT 
                p.pro_id,
                t.id_industria,
                t.tabela,
                t.grupo_desc,
                t.desc_add,
                t.ipi,
                t.st,
                t.pre_peso,
                t.preco_bruto,
                t.preco_promo,
                t.preco_especial,
                t.data_tabela,
                t.data_vencimento,
                (t.status = 'A') -- Convert 'A' to boolean true
            FROM temp_price_import t
            INNER JOIN cad_prod p ON 
                p.pro_industria = t.id_industria AND 
                p.pro_codigonormalizado = REGEXP_REPLACE(t.raw_codprod, '[^a-zA-Z0-9]', '', 'g')
        `;

        const res = await client.query(insertQuery);
        console.log(`\n🎉 Importação Concluída!`);
        console.log(`✅ ${res.rowCount} registros inseridos com sucesso na cad_tabelaspre.`);

        const skipped = totalLines - res.rowCount;
        if (skipped > 0) {
            console.warn(`⚠️ ${skipped} registros ignorados (Produto não encontrado no cadastro).`);
        }

        await client.query('COMMIT');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Erro fatal durante a importação:", e);
    } finally {
        client.release();
        pool.end();
        console.timeEnd("Importação");
    }
}

async function insertBatch(client, rows) {
    if (rows.length === 0) return;

    // Generate ($1, $2, ...), ($15, $16, ...)
    const placeholders = rows.map((_, i) =>
        `($${i * 14 + 1}, $${i * 14 + 2}, $${i * 14 + 3}, $${i * 14 + 4}, $${i * 14 + 5}, $${i * 14 + 6}, $${i * 14 + 7}, $${i * 14 + 8}, $${i * 14 + 9}, $${i * 14 + 10}, $${i * 14 + 11}, $${i * 14 + 12}, $${i * 14 + 13}, $${i * 14 + 14})`
    ).join(',');

    const flatValues = rows.flat();

    await client.query(
        `INSERT INTO temp_price_import VALUES ${placeholders}`,
        flatValues
    );
}

importPriceTables();
