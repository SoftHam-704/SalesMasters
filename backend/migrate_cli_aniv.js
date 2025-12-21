const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function migrate() {
    try {
        console.log('🏁 Iniciando migração de cli_aniv.xlsx...');

        // 1. Create Table if not exists
        // 1. Re-Create Table
        await pool.query('DROP TABLE IF EXISTS cli_aniv CASCADE');
        await pool.query(`
            CREATE TABLE cli_aniv (
                ani_lancto INTEGER,
                ani_cliente INTEGER,
                ani_nome VARCHAR(55),
                ani_funcao VARCHAR(35),
                ani_fone VARCHAR(15),
                ani_email VARCHAR(60),
                ani_diaaniv SMALLINT,
                ani_mes SMALLINT,
                ani_niver DATE,
                ani_obs VARCHAR(600),
                ani_sel VARCHAR(1) DEFAULT ' ',
                gid VARCHAR(38),
                CONSTRAINT pk_cli_aniv PRIMARY KEY (ani_cliente, ani_nome, ani_funcao),
                CONSTRAINT fk_cliente FOREIGN KEY (ani_cliente) REFERENCES clientes(cli_codigo)
            );
        `);
        console.log('✅ Tabela cli_aniv recriada com PK composta.');

        // 2. Read File
        const filePath = path.join(__dirname, '../data/cli_aniv.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`📊 Encontrados ${data.length} registros no Excel.`);

        let inserted = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Ensure ani_cliente exists
                if (!row.ANI_CLIENTE) {
                    // console.log('Skipping row without client ID');
                    continue;
                }

                // Check dependencies (optional, but good for foreign keys)
                // const clientCheck = await pool.query('SELECT 1 FROM clientes WHERE cli_codigo = $1', [row.ANI_CLIENTE]);
                // if (clientCheck.rowCount === 0) {
                //    errors++;
                //    console.log(`❌ Cliente ${row.ANI_CLIENTE} não encontrado. Pulo.`);
                //    continue;
                // }

                const query = `
                    INSERT INTO cli_aniv (
                        ani_cliente, ani_nome, ani_funcao, ani_fone, 
                        ani_email, ani_diaaniv, ani_mes, ani_niver, 
                        ani_obs, gid, ani_lancto
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (ani_cliente, ani_nome, ani_funcao) DO UPDATE SET
                        ani_fone = EXCLUDED.ani_fone,
                        ani_email = EXCLUDED.ani_email,
                        ani_diaaniv = EXCLUDED.ani_diaaniv,
                        ani_mes = EXCLUDED.ani_mes,
                        ani_niver = EXCLUDED.ani_niver,
                        ani_obs = EXCLUDED.ani_obs,
                        gid = EXCLUDED.gid,
                        ani_lancto = EXCLUDED.ani_lancto
                `;


                // Handle Date (Excel dates can be tricky)
                let niver = null;
                // Try parse ANI_NIVER if it exists, otherwise construct from day/month?
                // Usually logic is simplest first.

                const values = [
                    row.ANI_CLIENTE,
                    row.ANI_NOME || '',
                    row.ANI_FUNCAO || '',
                    row.ANI_FONE || '',
                    row.ANI_EMAIL || '',
                    row.ANI_DIAANIV || null,
                    row.ANI_MES || null,
                    row.ANI_NIVER || null, // Might need formatting
                    row.ANI_OBS || '',
                    row.GID || '',
                    row.ANI_LANCTO || null // If null, serial handles? No, if we pass it, we must ensure it's not null or let DB handle if omitted. 
                    // Since ON CONFLICT needs a constraint, we should probably set ani_lancto as PK. 
                    // If source has ani_lancto, we use it.
                ];

                // If row.ANI_LANCTO is undefined, we shouldn't insert it into the explicit ani_lancto column IF it's serial.
                // But ON CONFLICT requires specific target. 
                // Let's assume for migration we want to keep IDs.

                if (!row.ANI_LANCTO) {
                    // If no ID in excel, we insert without ID and let serial work (but no update on conflict possible easily without another unique key)
                    // We'll skip conflict check for those or match on something else?
                    // Simplest: just insert.

                    await pool.query(`
                        INSERT INTO cli_aniv(
                    ani_cliente, ani_nome, ani_funcao, ani_fone,
                    ani_email, ani_diaaniv, ani_mes, ani_niver,
                    ani_obs, gid
                ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     `, values.slice(0, 10));

                } else {
                    await pool.query(query, values);

                    // Fix serial sequence after manual ID inserts
                    // await pool.query(`SELECT setval('cli_aniv_ani_lancto_seq', (SELECT MAX(ani_lancto) FROM cli_aniv))`);
                }

                inserted++;
            } catch (err) {
                console.error(`Erro no registro ${row.ANI_NOME}: `, err.message);
                errors++;
            }
        }

        // Sequence fix not needed for non-serial PK
        // await pool.query(`SELECT setval('cli_aniv_ani_lancto_seq', (SELECT MAX(ani_lancto) FROM cli_aniv))`);

        console.log(`✅ Migração concluída: ${inserted} importados, ${errors} erros.`);

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        pool.end();
    }
}

migrate();
