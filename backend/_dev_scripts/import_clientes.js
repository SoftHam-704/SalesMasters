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

async function importClientes() {
    try {
        console.log('📊 Iniciando importação de clientes - NOVA ERA! 🎉\n');

        // Data fixa: início da nova era
        const dataNovaEra = '2025-12-29';

        const filePath = path.join(__dirname, '../data/clientes.xlsx');
        console.log(`Lendo arquivo: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ Arquivo lido: ${data.length} clientes encontrados`);
        console.log(`📅 Todos os campos de data serão: ${dataNovaEra}\n`);

        let imported = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const query = `
                    INSERT INTO clientes (
                        cli_codigo, cli_cnpj, cli_inscricao, cli_tipopes, cli_nome,
                        cli_nomred, cli_fantasia, cli_endereco, cli_endnum, cli_bairro,
                        cli_cidade, cli_uf, cli_cep, cli_ptoref, cli_fone1,
                        cli_fone2, cli_fone3, cli_email, cli_emailnfe, cli_vencsuf,
                        cli_emailfinanc, cli_vendedor, cli_regimeemp, cli_regiao2, cli_atuacao,
                        cli_redeloja, cli_datacad, cli_usuario, cli_dataalt, cli_idcidade,
                        cli_suframa, cli_obs, cli_dtabertura, cli_cxpostal, cli_obspedido,
                        cli_refcom, cli_complemento, cli_atuacaoprincipal, cli_endcob, cli_baicob,
                        cli_cidcob, cli_cepcob, cli_ufcob, cli_skype, gid
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45)
                    ON CONFLICT (cli_codigo) DO UPDATE SET
                        cli_cnpj = EXCLUDED.cli_cnpj,
                        cli_inscricao = EXCLUDED.cli_inscricao,
                        cli_tipopes = EXCLUDED.cli_tipopes,
                        cli_nome = EXCLUDED.cli_nome,
                        cli_nomred = EXCLUDED.cli_nomred,
                        cli_fantasia = EXCLUDED.cli_fantasia,
                        cli_endereco = EXCLUDED.cli_endereco,
                        cli_endnum = EXCLUDED.cli_endnum,
                        cli_bairro = EXCLUDED.cli_bairro,
                        cli_cidade = EXCLUDED.cli_cidade,
                        cli_uf = EXCLUDED.cli_uf,
                        cli_cep = EXCLUDED.cli_cep,
                        cli_ptoref = EXCLUDED.cli_ptoref,
                        cli_fone1 = EXCLUDED.cli_fone1,
                        cli_fone2 = EXCLUDED.cli_fone2,
                        cli_fone3 = EXCLUDED.cli_fone3,
                        cli_email = EXCLUDED.cli_email,
                        cli_emailnfe = EXCLUDED.cli_emailnfe,
                        cli_vencsuf = EXCLUDED.cli_vencsuf,
                        cli_emailfinanc = EXCLUDED.cli_emailfinanc,
                        cli_vendedor = EXCLUDED.cli_vendedor,
                        cli_regimeemp = EXCLUDED.cli_regimeemp,
                        cli_regiao2 = EXCLUDED.cli_regiao2,
                        cli_atuacao = EXCLUDED.cli_atuacao,
                        cli_redeloja = EXCLUDED.cli_redeloja,
                        cli_datacad = EXCLUDED.cli_datacad,
                        cli_usuario = EXCLUDED.cli_usuario,
                        cli_dataalt = EXCLUDED.cli_dataalt,
                        cli_idcidade = EXCLUDED.cli_idcidade,
                        cli_suframa = EXCLUDED.cli_suframa,
                        cli_obs = EXCLUDED.cli_obs,
                        cli_dtabertura = EXCLUDED.cli_dtabertura,
                        cli_cxpostal = EXCLUDED.cli_cxpostal,
                        cli_obspedido = EXCLUDED.cli_obspedido,
                        cli_refcom = EXCLUDED.cli_refcom,
                        cli_complemento = EXCLUDED.cli_complemento,
                        cli_atuacaoprincipal = EXCLUDED.cli_atuacaoprincipal,
                        cli_endcob = EXCLUDED.cli_endcob,
                        cli_baicob = EXCLUDED.cli_baicob,
                        cli_cidcob = EXCLUDED.cli_cidcob,
                        cli_cepcob = EXCLUDED.cli_cepcob,
                        cli_ufcob = EXCLUDED.cli_ufcob,
                        cli_skype = EXCLUDED.cli_skype,
                        gid = EXCLUDED.gid
                `;

                const values = [
                    row.CLI_CODIGO || 0,
                    row.CLI_CNPJ || row.CLI_CPFCNPJ || '',
                    row.CLI_INSCRICAO || '',
                    row.CLI_TIPOPES || '',
                    row.CLI_NOME || '',
                    row.CLI_NOMRED || '',
                    row.CLI_FANTASIA || '',
                    row.CLI_ENDERECO || '',
                    row.CLI_ENDNUM || '',
                    row.CLI_BAIRRO || '',
                    row.CLI_CIDADE || '',
                    row.CLI_UF || '',
                    row.CLI_CEP || '',
                    row.CLI_PTOREF || '',
                    row.CLI_FONE1 || '',
                    row.CLI_FONE2 || '',
                    row.CLI_FONE3 || '',
                    row.CLI_EMAIL || '',
                    row.CLI_EMAILNFE || '',
                    row.CLI_VENCSUF || null,
                    row.CLI_EMAILFINANC || '',
                    row.CLI_VENDEDOR || null,
                    row.CLI_REGIMEEMP || '',
                    row.CLI_REGIAO2 || null,
                    row.CLI_ATUACAO || '',
                    row.CLI_REDELOJA || '',
                    dataNovaEra,  // cli_datacad - DATA FIXA
                    row.CLI_USUARIO || '',
                    dataNovaEra,  // cli_dataalt - DATA FIXA
                    row.CLI_IDCIDADE || null,
                    row.CLI_SUFRAMA || '',
                    row.CLI_OBS || '',
                    dataNovaEra,  // cli_dtabertura - DATA FIXA
                    row.CLI_CXPOSTAL || '',
                    row.CLI_OBSPEDIDO || '',
                    row.CLI_REFCOM || '',
                    row.CLI_COMPLEMENTO || '',
                    row.CLI_ATUACAOPRINCIPAL || null,
                    row.CLI_ENDCOB || '',
                    row.CLI_BAICOB || '',
                    row.CLI_CIDCOB || '',
                    row.CLI_CEPCOB || '',
                    row.CLI_UFCOB || '',
                    row.CLI_SKYPE || '',
                    row.GID || ''
                ];

                await pool.query(query, values);
                imported++;

                if (imported % 100 === 0) {
                    process.stdout.write(`\rImportados: ${imported}/${data.length}`);
                }
            } catch (err) {
                errors++;
                console.error(`\n❌ Erro ao importar cliente ${row.CLI_NOME || row.CLI_CODIGO}: ${err.message}`);
            }
        }

        console.log(`\n\n🎉 ========================================`);
        console.log('✅ IMPORTAÇÃO CONCLUÍDA - NOVA ERA INICIADA!');
        console.log('========================================');
        console.log(`   📊 Total: ${data.length} clientes`);
        console.log(`   ✅ Importados: ${imported}`);
        console.log(`   ❌ Erros: ${errors}`);
        console.log(`   📅 Data padrão: ${dataNovaEra}`);
        console.log('========================================\n');

        // Show sample data
        const sample = await pool.query('SELECT cli_codigo, cli_nomred, cli_cidade, cli_uf, cli_datacad FROM clientes ORDER BY cli_codigo LIMIT 5');
        console.log('📋 Amostra dos dados importados:');
        console.table(sample.rows);

        // Count total
        const count = await pool.query('SELECT COUNT(*) as total FROM clientes');
        console.log(`\n📊 Total de clientes no banco: ${count.rows[0].total}`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

importClientes();
