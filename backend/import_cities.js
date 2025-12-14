const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function importCities() {
    try {
        console.log('🏙️  Iniciando importação de cidades...\n');

        // Drop and recreate table
        console.log('🗑️  Removendo tabela antiga...');
        await pool.query('DROP TABLE IF EXISTS cidades CASCADE');
        console.log('✅ Tabela removida\n');

        console.log('📋 Criando tabela CIDADES...');
        await pool.query(`
            CREATE TABLE cidades (
                cid_codigo SERIAL PRIMARY KEY,
                cid_nome VARCHAR(100) NOT NULL,
                cid_uf CHAR(2) NOT NULL,
                cid_ibge VARCHAR(7),
                cid_ativo BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('✅ Tabela criada\n');

        // Create indexes
        console.log('🔍 Criando índices...');
        await pool.query('CREATE INDEX idx_cidades_nome ON cidades(cid_nome)');
        await pool.query('CREATE INDEX idx_cidades_uf ON cidades(cid_uf)');
        await pool.query('CREATE INDEX idx_cidades_nome_uf ON cidades(cid_nome, cid_uf)');
        console.log('✅ Índices criados\n');

        // Read XLSX
        const filePath = path.join(__dirname, '../data/cidades.xlsx');
        console.log(`📂 Lendo arquivo: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} cidades encontradas\n`);

        let imported = 0;
        let errors = 0;

        console.log('📥 Importando cidades...');
        for (const row of data) {
            try {
                await pool.query(
                    `INSERT INTO cidades (cid_nome, cid_uf, cid_ibge, cid_ativo)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        row.CID_NOME || row.NOME || '',
                        row.CID_UF || row.UF || '',
                        row.CID_IBGE || row.IBGE || null,
                        true
                    ]
                );
                imported++;

                if (imported % 500 === 0) {
                    process.stdout.write(`\r   Importadas: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                if (errors <= 5) {
                    console.error(`\n❌ Erro ao importar: ${row.CID_NOME || row.NOME} - ${err.message}`);
                }
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   📊 Total: ${data.length} registros`);
        console.log(`   ✅ Importados: ${imported}`);
        console.log(`   ❌ Erros: ${errors}`);

        // Show statistics
        const stats = await pool.query(`
            SELECT cid_uf, COUNT(*) as total
            FROM cidades
            GROUP BY cid_uf
            ORDER BY cid_uf
        `);

        console.log('\n📊 Cidades por estado:');
        console.table(stats.rows);

        // Show sample
        const sample = await pool.query(`
            SELECT * FROM cidades 
            WHERE cid_uf = 'MS'
            ORDER BY cid_nome 
            LIMIT 5
        `);

        console.log('\n📋 Amostra (MS):');
        console.table(sample.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

importCities();
