const XLSX = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function importCidades() {
    try {
        console.log('📂 Lendo arquivo cidades.xlsx...');
        const workbook = XLSX.readFile('../data/cidades.xlsx', {
            cellDates: true,
            sheetRows: 0  // 0 = read all rows
        });
        const sheetName = workbook.SheetNames[0];
        console.log(`📄 Lendo aba: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];

        // Get the range to see how many rows we have
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        console.log(`📊 Range detectado: ${range.s.r} a ${range.e.r} (${range.e.r + 1} linhas)`);

        const data = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,
            raw: false,
            range: 0  // Start from first row
        });

        console.log(`📊 Encontrados ${data.length} registros`);

        // Limpar tabela
        console.log('🗑️  Limpando tabela cidades...');
        await pool.query('DELETE FROM cidades');
        console.log('✅ Tabela limpa');

        // Inserir dados
        console.log('📥 Importando dados...');
        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Mapear colunas da planilha para campos do banco
                const cid_codigo = row.CODIGO || row.cid_codigo;
                const cid_nome = row.NOME || row.cid_nome;
                const cid_uf = row.UF || row.cid_uf;
                const cid_ibge = row.CODMUN || row.cid_ibge;
                const cid_ativo = true; // Sempre ativo por padrão
                const cid_cod_origem = row.CODIGO || row.cid_cod_origem || null;

                if (!cid_codigo || !cid_nome) {
                    console.log(`⚠️  Linha ignorada (dados incompletos):`, row);
                    errors++;
                    continue;
                }

                await pool.query(
                    'INSERT INTO cidades (cid_codigo, cid_nome, cid_uf, cid_ibge, cid_ativo, cid_cod_origem) VALUES ($1, $2, $3, $4, $5, $6)',
                    [cid_codigo, cid_nome, cid_uf, cid_ibge, cid_ativo, cid_cod_origem]
                );
                imported++;

                if (imported % 100 === 0) {
                    console.log(`   Importados: ${imported}...`);
                }
            } catch (error) {
                console.error(`❌ Erro ao importar linha:`, row, error.message);
                errors++;
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   - Registros importados: ${imported}`);
        console.log(`   - Erros: ${errors}`);

    } catch (error) {
        console.error('❌ Erro na importação:', error);
    } finally {
        await pool.end();
    }
}

importCidades();
