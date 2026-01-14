const XLSX = require('xlsx');
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

async function importCidades() {
    try {
        console.log(`🚀 IMPORTANDO CIDADES -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/cidades.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        // Set search path to target schema
        await pool.query(`SET search_path TO "${SCHEMA}"`);

        // Limpar tabela (opcional, mas como o script original tinha, vou manter se necessário ou usar UPSERT)
        // console.log('🗑️ Limpando tabela cidades...');
        // await pool.query('DELETE FROM cidades');

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const cid_codigo = row.CODIGO || row.cid_codigo || row.cid_cod_origem;
                const cid_nome = row.NOME || row.cid_nome || row.NOMMUN;
                const cid_uf = row.UF || row.cid_uf || row.ESTADO;
                const cid_ibge = row.CODMUN || row.cid_ibge || row.IBGE;
                const cid_ativo = true;
                const cid_cod_origem = cid_codigo;

                if (!cid_codigo || !cid_nome) {
                    continue;
                }

                await pool.query(
                    `INSERT INTO cidades (cid_codigo, cid_nome, cid_uf, cid_ibge, cid_ativo, cid_cod_origem) 
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (cid_codigo) DO UPDATE SET 
                        cid_nome = EXCLUDED.cid_nome,
                        cid_uf = EXCLUDED.cid_uf,
                        cid_ibge = EXCLUDED.cid_ibge`,
                    [cid_codigo, cid_nome, cid_uf, cid_ibge, cid_ativo, cid_cod_origem]
                );
                imported++;

                if (imported % 500 === 0) {
                    process.stdout.write(`\r🚀 Processando: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`\n❌ Erro na cidade [${row.NOME || row.CODIGO}]: ${err.message}`);
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

        const result = await pool.query('SELECT * FROM cidades ORDER BY cid_nome LIMIT 5');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importCidades();
