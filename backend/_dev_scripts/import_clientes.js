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

const SCHEMA = process.env.SCHEMA || 'soma';

async function importClientes() {
    try {
        console.log(`🚀 IMPORTANDO CLIENTES -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../../data/clientes.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        const dataNovaEra = new Date().toISOString().split('T')[0];

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        const BATCH_SIZE = 500; // 500 * 45 colunas = 22.500 parâmetros (limite PG é 65k)
        let batch = [];
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            batch.push([
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
                dataNovaEra,
                row.CLI_USUARIO || 'IMPORT',
                dataNovaEra,
                row.CLI_IDCIDADE || null,
                row.CLI_SUFRAMA || '',
                row.CLI_OBS || '',
                dataNovaEra,
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
            ]);

            if (batch.length >= BATCH_SIZE || i === data.length - 1) {
                try {
                    const values = [];
                    const placeholders = [];
                    let counter = 1;

                    batch.forEach(rowValues => {
                        const rowPlaceholders = rowValues.map(() => `$${counter++}`);
                        placeholders.push(`(${rowPlaceholders.join(',')})`);
                        values.push(...rowValues);
                    });

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
                        ) VALUES ${placeholders.join(',')}
                        ON CONFLICT (cli_codigo) DO UPDATE SET
                            cli_cnpj = EXCLUDED.cli_cnpj,
                            cli_nome = EXCLUDED.cli_nome,
                            cli_nomred = EXCLUDED.cli_nomred,
                            cli_cidade = EXCLUDED.cli_cidade,
                            cli_uf = EXCLUDED.cli_uf,
                            cli_vendedor = EXCLUDED.cli_vendedor,
                            gid = EXCLUDED.gid
                    `;

                    await pool.query(query, values);
                    imported += batch.length;
                    batch = [];
                    process.stdout.write(`\r🚀 Importado: ${imported}/${data.length}`);
                } catch (err) {
                    console.error(`\n❌ Erro no lote: ${err.message}`);
                    errors += batch.length;
                    batch = [];
                }
            }
        }

        console.log(`\n\n✅ Importação Finalizada!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importClientes();
