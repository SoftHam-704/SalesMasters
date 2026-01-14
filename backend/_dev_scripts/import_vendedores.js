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

async function importVendedores() {
    try {
        console.log(`🚀 IMPORTANDO VENDEDORES -> SCHEMA: [${SCHEMA}] (SaveInCloud)\n`);

        const filePath = path.join(__dirname, '../../data/vendedores.xlsx');
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
                        ven_cidade = EXCLUDED.ven_cidade,
                        ven_email = EXCLUDED.ven_email,
                        gid = EXCLUDED.gid
                `;

                const values = [
                    row.VEN_CODIGO || row.ven_codigo || 0,
                    row.VEN_NOME || row.ven_nome || '',
                    row.VEN_ENDERECO || row.ven_endereco || '',
                    row.VEN_BAIRRO || row.ven_bairro || '',
                    row.VEN_CIDADE || row.ven_cidade || '',
                    row.VEN_CEP || row.ven_cep || '',
                    row.VEN_UF || row.ven_uf || '',
                    row.VEN_FONE1 || row.ven_fone1 || '',
                    row.VEN_FONE2 || row.ven_fone2 || '',
                    row.VEN_OBS || row.ven_obs || '',
                    row.VEN_CPF || row.ven_cpf || '',
                    row.VEN_COMISSAO || row.ven_comissao || null,
                    row.VEN_EMAIL || row.ven_email || '',
                    row.VEN_NOMEUSU || row.ven_nomeusu || '',
                    row.VEN_ANIVERSARIO || row.ven_aniversario || '',
                    row.VEN_RG || row.ven_rg || '',
                    row.VEN_CTPS || row.ven_ctps || '',
                    row.VEN_FILIACAO || row.ven_filiacao || '',
                    row.VEN_PIS || row.ven_pis || '',
                    row.VEN_FILHOS || row.ven_filhos || null,
                    row.VEN_CODUSU || row.ven_codusu || null,
                    row.VEN_IMAGEM || row.ven_imagem || '',
                    row.GID || row.gid || ''
                ];

                await pool.query(query, values);
                imported++;

            } catch (err) {
                errors++;
                console.error(`❌ Erro no vendedor [${row.VEN_NOME}]: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Sucesso: ${imported} | Erros: ${errors}\n`);

        const result = await pool.query('SELECT ven_codigo, ven_nome FROM vendedores ORDER BY ven_codigo LIMIT 5');
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importVendedores();
