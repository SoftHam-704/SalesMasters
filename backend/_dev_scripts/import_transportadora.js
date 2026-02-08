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

async function importTransportadora() {
    try {
        console.log(`🚀 IMPORTANDO TRANSPORTADORAS -> SCHEMA: [${SCHEMA}]\n`);

        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../../data/transportadora.xlsx');
        if (!require('fs').existsSync(filePath)) {
            console.error(`❌ ERRO: Arquivo não encontrado em ${filePath}`);
            return;
        }

        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        console.log(`📊 ${data.length} registros encontrados no Excel\n`);

        await pool.query(`SET search_path TO "${SCHEMA}"`);

        let imported = 0;
        for (const row of data) {
            try {
                // Mapeamento flexível (com e sem prefixo tra_)
                const val = (pre, fallback) => row[pre] || row[fallback] || '';

                await pool.query(`
                    INSERT INTO transportadora (
                        tra_codigo, tra_nome, tra_endereco, tra_bairro, tra_cidade,
                        tra_uf, tra_cep, tra_fone, tra_cgc, tra_inscricao,
                        tra_email, tra_contato, tra_obs
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (tra_codigo) DO UPDATE SET
                        tra_nome = EXCLUDED.tra_nome,
                        tra_cidade = EXCLUDED.tra_cidade,
                        tra_uf = EXCLUDED.tra_uf,
                        tra_cgc = EXCLUDED.tra_cgc
                `, [
                    row.tra_codigo || row.CODIGO || 0,
                    val('tra_nome', 'NOME'),
                    val('tra_endereco', 'ENDERECO'),
                    val('tra_bairro', 'BAIRRO'),
                    val('tra_cidade', 'CIDADE'),
                    val('tra_uf', 'UF'),
                    val('tra_cep', 'CEP'),
                    val('tra_fone', 'TELEFONE') || row.FONE || row.TELEFONE1 || '',
                    val('tra_cgc', 'CNPJ') || row.CGC || '',
                    val('tra_inscricao', 'IEST') || row.INSCRICAO || '',
                    val('tra_email', 'EMAIL'),
                    val('tra_contato', 'CONTATO'),
                    val('tra_obs', 'OBS')
                ]);
                imported++;
            } catch (err) {
                console.error(`❌ Erro na transportadora [${row.NOME || row.tra_nome}]: ${err.message}`);
            }
        }

        console.log(`\n✅ Carga concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importTransportadora();
