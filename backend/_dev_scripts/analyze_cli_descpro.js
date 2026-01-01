const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function analyzeCliDescPro() {
    try {
        console.log('📂 Analisando cli_descpro.xlsx e tabela banco...\n');

        const filePath = path.join(__dirname, '../data/cli_descpro.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Total na planilha: ${data.length} registros\n`);
        console.log('📋 Colunas da planilha:');
        if (data.length > 0) {
            Object.keys(data[0]).forEach((k, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${k}`));
            console.log('\n📊 Amostra:');
            console.log(data[0]);
        }

        console.log('\n🔍 Schema da tabela cli_descpro:');
        const schema = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'cli_descpro'
            ORDER BY ordinal_position
        `);
        schema.rows.forEach(r => console.log(`   ${r.column_name.padEnd(20)} ${r.data_type}`));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeCliDescPro();
