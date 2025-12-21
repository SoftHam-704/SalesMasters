const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});

async function executeSQLFile() {
    try {
        const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', '16_add_preco_liquido_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📝 Executando script SQL...');
        await pool.query(sql);
        console.log('✅ Função fn_listar_produtos_tabela atualizada com sucesso!');
        console.log('✅ Coluna preco_liquido adicionada ao retorno da função');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar SQL:', error.message);
        process.exit(1);
    }
}

executeSQLFile();
