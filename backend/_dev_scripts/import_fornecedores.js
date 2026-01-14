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

async function importFornecedores() {
    try {
        console.log(`🚀 IMPORTANDO FORNECEDORES -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/fornecedores.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const query = `
                    INSERT INTO fornecedores (
                        for_codigo, for_nome, for_endereco, for_bairro, for_cidade,
                        for_uf, for_cep, for_fone, for_fone2, for_fax,
                        for_cgc, for_inscricao, for_email, for_percom, for_homepage,
                        for_contatorep, observacoes, for_nomered, for_tipo2, for_locimagem,
                        gid, for_tipofrete
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                    ON CONFLICT (for_codigo) DO UPDATE SET
                        for_nome = EXCLUDED.for_nome,
                        for_nomered = EXCLUDED.for_nomered,
                        for_cgc = EXCLUDED.for_cgc,
                        for_cidade = EXCLUDED.for_cidade,
                        for_uf = EXCLUDED.for_uf,
                        gid = EXCLUDED.gid
                `;

                const values = [
                    row.FOR_CODIGO || row.for_codigo || 0,
                    row.FOR_NOME || row.for_nome || '',
                    row.FOR_ENDERECO || row.for_endereco || '',
                    row.FOR_BAIRRO || row.for_bairro || '',
                    row.FOR_CIDADE || row.for_cidade || '',
                    row.FOR_UF || row.for_uf || '',
                    row.FOR_CEP || row.for_cep || '',
                    row.FOR_FONE || row.for_fone || '',
                    row.FOR_FONE2 || row.for_fone2 || '',
                    row.FOR_FAX || row.for_fax || '',
                    row.FOR_CGC || row.for_cgc || '',
                    row.FOR_INSCRICAO || row.for_inscricao || '',
                    row.FOR_EMAIL || row.for_email || '',
                    row.FOR_PERCOM || row.for_percom || null,
                    row.FOR_HOMEPAGE || row.for_homepage || '',
                    row.FOR_CONTATOREP || row.for_contatorep || '',
                    row.OBSERVACOES || row.observacoes || '',
                    row.FOR_NOMERED || row.for_nomered || '',
                    row.FOR_TIPO2 || row.for_tipo2 || '',
                    row.FOR_LOCIMAGEM || row.for_locimagem || '',
                    row.GID || row.gid || '',
                    row.FOR_TIPOFRETE || row.for_tipofrete || ''
                ];

                await pool.query(query, values);
                imported++;

            } catch (err) {
                errors++;
                console.error(`❌ Erro no fornecedor [${row.FOR_NOME || row.for_nome}]: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

        const result = await pool.query('SELECT for_codigo, for_nomered, for_cidade FROM fornecedores ORDER BY for_codigo LIMIT 5');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importFornecedores();
