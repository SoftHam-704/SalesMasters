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

async function importVendedores() {
    try {
        console.log('📊 Iniciando importação de vendedores...\n');

        // Read XLSX file
        const filePath = path.join(__dirname, '../data/vendedores.xlsx');
        console.log(`Lendo arquivo: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} vendedores encontrados\n`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const query = `
                    INSERT INTO vendedores (
                        ven_codigo, ven_nome, ven_endereco, ven_bairro,
                        ven_cidade, ven_cep, ven_uf, ven_fone1, ven_fone2,
                        ven_obs, ven_cpf, ven_comissao, ven_email,
                        ven_nomeusu, ven_aniversario, ven_rg, ven_ctps,
                        ven_filiacao, ven_pis, ven_filhos, ven_codusu,
                        ven_imagem, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                    ON CONFLICT (ven_codigo) DO UPDATE SET
                        ven_nome = EXCLUDED.ven_nome,
                        ven_endereco = EXCLUDED.ven_endereco,
                        ven_bairro = EXCLUDED.ven_bairro,
                        ven_cidade = EXCLUDED.ven_cidade,
                        ven_cep = EXCLUDED.ven_cep,
                        ven_uf = EXCLUDED.ven_uf,
                        ven_fone1 = EXCLUDED.ven_fone1,
                        ven_fone2 = EXCLUDED.ven_fone2,
                        ven_obs = EXCLUDED.ven_obs,
                        ven_cpf = EXCLUDED.ven_cpf,
                        ven_comissao = EXCLUDED.ven_comissao,
                        ven_email = EXCLUDED.ven_email,
                        ven_nomeusu = EXCLUDED.ven_nomeusu,
                        ven_aniversario = EXCLUDED.ven_aniversario,
                        ven_rg = EXCLUDED.ven_rg,
                        ven_ctps = EXCLUDED.ven_ctps,
                        ven_filiacao = EXCLUDED.ven_filiacao,
                        ven_pis = EXCLUDED.ven_pis,
                        ven_filhos = EXCLUDED.ven_filhos,
                        ven_codusu = EXCLUDED.ven_codusu,
                        ven_imagem = EXCLUDED.ven_imagem,
                        gid = EXCLUDED.gid
                `;

                const values = [
                    row.VEN_CODIGO || 0,
                    row.VEN_NOME || '',
                    row.VEN_ENDERECO || '',
                    row.VEN_BAIRRO || '',
                    row.VEN_CIDADE || '',
                    row.VEN_CEP || '',
                    row.VEN_UF || '',
                    row.VEN_FONE1 || '',
                    row.VEN_FONE2 || '',
                    row.VEN_OBS || '',
                    row.VEN_CPF || '',
                    row.VEN_COMISSAO || null,
                    row.VEN_EMAIL || '',
                    row.VEN_NOMEUSU || '',
                    row.VEN_ANIVERSARIO || '',
                    row.VEN_RG || '',
                    row.VEN_CTPS || '',
                    row.VEN_FILIACAO || '',
                    row.VEN_PIS || '',
                    row.VEN_FILHOS || null,
                    row.VEN_CODUSU || null,
                    row.VEN_IMAGEM || '',
                    row.GID || ''
                ];

                await pool.query(query, values);
                imported++;

                if (imported % 10 === 0) {
                    process.stdout.write(`\rImportados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`\n❌ Erro ao importar vendedor ${row.VEN_NOME}: ${err.message}`);
            }
        }

        console.log(`\n\n✅ Importação concluída!`);
        console.log(`   📊 Total: ${data.length} vendedores`);
        console.log(`   ✅ Importados: ${imported}`);
        console.log(`   ❌ Erros: ${errors}`);

        // Show sample data
        const sample = await pool.query('SELECT ven_codigo, ven_nome, ven_fone1, ven_email FROM vendedores ORDER BY ven_codigo LIMIT 5');
        console.log('\n📋 Amostra dos dados importados:');
        console.table(sample.rows);

        // Count total
        const count = await pool.query('SELECT COUNT(*) as total FROM vendedores');
        console.log(`\n📊 Total de vendedores no banco: ${count.rows[0].total}`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

importVendedores();
