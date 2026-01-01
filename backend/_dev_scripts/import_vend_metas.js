const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function importVendMetas() {
    try {
        console.log('📊 Preparando importação de METAS DE VENDEDORES (vend_metas)...\n');

        // 1. Criar tabela se não existir
        console.log('🔨 Criando tabela vend_metas (se não existir)...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vend_metas (
                met_id SERIAL PRIMARY KEY,
                met_ano INTEGER NOT NULL,
                met_industria INTEGER NOT NULL,
                met_vendedor INTEGER NOT NULL,
                met_jan NUMERIC(15,2) DEFAULT 0,
                met_fev NUMERIC(15,2) DEFAULT 0,
                met_mar NUMERIC(15,2) DEFAULT 0,
                met_abr NUMERIC(15,2) DEFAULT 0,
                met_mai NUMERIC(15,2) DEFAULT 0,
                met_jun NUMERIC(15,2) DEFAULT 0,
                met_jul NUMERIC(15,2) DEFAULT 0,
                met_ago NUMERIC(15,2) DEFAULT 0,
                met_set NUMERIC(15,2) DEFAULT 0,
                met_out NUMERIC(15,2) DEFAULT 0,
                met_nov NUMERIC(15,2) DEFAULT 0,
                met_dez NUMERIC(15,2) DEFAULT 0,
                gid VARCHAR(255),
                -- Foreign Keys
                CONSTRAINT fk_industria FOREIGN KEY (met_industria) REFERENCES fornecedores(for_codigo),
                CONSTRAINT fk_vendedor FOREIGN KEY (met_vendedor) REFERENCES vendedores(ven_codigo)
            );
        `);
        console.log('✅ Tabela verificada/criada.\n');

        // 2. Ler arquivo e importar
        const filePath = path.join(__dirname, '../data/vend_metas.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} registros encontrados\n`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO vend_metas (
                        met_ano, met_industria, met_vendedor,
                        met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                        met_jul, met_ago, met_set, met_out, met_nov, met_dez, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                `, [
                    row.MET_ANO || 2025,
                    row.MET_INDUSTRIA || 0,
                    row.MET_VENDEDOR || 0,
                    row.MET_JAN || 0,
                    row.MET_FEV || 0,
                    row.MET_MAR || 0,
                    row.MET_ABR || 0,
                    row.MET_MAI || 0,
                    row.MET_JUN || 0,
                    row.MET_JUL || 0,
                    row.MET_AGO || 0,
                    row.MET_SET || 0,
                    row.MET_OUT || 0,
                    row.MET_NOV || 0,
                    row.MET_DEZ || 0,
                    row.GID || null
                ]);
                imported++;
            } catch (err) {
                errors++;
                console.error(`❌ Erro linha ${imported + 1}: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length}`);
        console.log(`   Importados: ${imported}`);
        console.log(`   Erros: ${errors}\n`);

        const result = await pool.query(`
            SELECT vm.met_ano, v.ven_nome as vendedor, f.for_nomered as industria, vm.met_jan, vm.met_dez
            FROM vend_metas vm
            JOIN vendedores v ON v.ven_codigo = vm.met_vendedor
            JOIN fornecedores f ON f.for_codigo = vm.met_industria
            LIMIT 5
        `);
        console.log('📋 Amostra de metas importadas:');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importVendMetas();
