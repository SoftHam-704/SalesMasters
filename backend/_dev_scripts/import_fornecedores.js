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

async function importFornecedores() {
    try {
        console.log('📊 Iniciando importação de fornecedores...\n');

        const dataNovaEra = '2025-12-29'; // Data fixa
        const filePath = path.join(__dirname, '../data/fornecedores.xlsx');

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} fornecedores encontrados\n`);

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
                        for_endereco = EXCLUDED.for_endereco,
                        for_bairro = EXCLUDED.for_bairro,
                        for_cidade = EXCLUDED.for_cidade,
                        for_uf = EXCLUDED.for_uf,
                        for_cep = EXCLUDED.for_cep,
                        for_fone = EXCLUDED.for_fone,
                        for_fone2 = EXCLUDED.for_fone2,
                        for_fax = EXCLUDED.for_fax,
                        for_cgc = EXCLUDED.for_cgc,
                        for_inscricao = EXCLUDED.for_inscricao,
                        for_email = EXCLUDED.for_email,
                        for_percom = EXCLUDED.for_percom,
                        for_homepage = EXCLUDED.for_homepage,
                        for_contatorep = EXCLUDED.for_contatorep,
                        observacoes = EXCLUDED.observacoes,
                        for_nomered = EXCLUDED.for_nomered,
                        for_tipo2 = EXCLUDED.for_tipo2,
                        for_locimagem = EXCLUDED.for_locimagem,
                        gid = EXCLUDED.gid,
                        for_tipofrete = EXCLUDED.for_tipofrete
                `;

                const values = [
                    row.FOR_CODIGO || 0,
                    row.FOR_NOME || '',
                    row.FOR_ENDERECO || '',
                    row.FOR_BAIRRO || '',
                    row.FOR_CIDADE || '',
                    row.FOR_UF || '',
                    row.FOR_CEP || '',
                    row.FOR_FONE || '',
                    row.FOR_FONE2 || '',
                    row.FOR_FAX || '',
                    row.FOR_CGC || '',
                    row.FOR_INSCRICAO || '',
                    row.FOR_EMAIL || '',
                    row.FOR_PERCOM || null,
                    row.FOR_HOMEPAGE || '',
                    row.FOR_CONTATOREP || '',
                    row.OBSERVACOES || '',
                    row.FOR_NOMERED || '',
                    row.FOR_TIPO2 || '',
                    row.FOR_LOCIMAGEM || '',
                    row.GID || '',
                    row.FOR_TIPOFRETE || ''
                ];

                await pool.query(query, values);
                imported++;

            } catch (err) {
                errors++;
                console.error(`❌ Erro ao importar fornecedor ${row.FOR_NOME}: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   📊 Total: ${data.length} fornecedores`);
        console.log(`   ✅ Importados: ${imported}`);
        console.log(`   ❌ Erros: ${errors}`);

        const sample = await pool.query('SELECT for_codigo, for_nomered, for_cidade, for_uf FROM fornecedores ORDER BY for_codigo LIMIT 5');
        console.log('\n📋 Amostra dos dados importados:');
        console.table(sample.rows);

        const count = await pool.query('SELECT COUNT(*) as total FROM fornecedores');
        console.log(`\n📊 Total de fornecedores no banco: ${count.rows[0].total}`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importFornecedores();
