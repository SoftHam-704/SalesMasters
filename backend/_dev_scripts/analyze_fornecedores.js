// Script para analisar fornecedores.xlsx e tabela fornecedores
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

async function analyzeFornecedores() {
    try {
        console.log('📂 Analisando fornecedores.xlsx...\n');

        const filePath = path.join(__dirname, '../data/fornecedores.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Total: ${data.length} fornecedores\n`);
        console.log('📋 Colunas na planilha:');
        if (data.length > 0) {
            Object.keys(data[0]).forEach((k, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${k}`));
        }

        console.log('\n🔍 Schema da tabela:');
        const schema = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns
            WHERE table_name = 'fornecedores'
            ORDER BY ordinal_position
        `);
        schema.rows.forEach((c, i) => console.log(`   ${(i + 1).toString().padStart(2)}. ${c.column_name.padEnd(25)} ${c.data_type}`));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

analyzeFornecedores();
