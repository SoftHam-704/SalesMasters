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

async function importTransportadora() {
    try {
        console.log('📊 Importando transportadoras...\n');

        const filePath = path.join(__dirname, '../data/transportadora.xlsx');
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} transportadoras encontradas\n`);

        let imported = 0;
        for (const row of data) {
            try {
                await pool.query(`
                    INSERT INTO transportadora (
                        tra_codigo, tra_nome, tra_endereco, tra_bairro, tra_cidade,
                        tra_uf, tra_cep, tra_fone, tra_cgc, tra_inscricao,
                        tra_email, tra_contato, tra_obs
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (tra_codigo) DO UPDATE SET
                        tra_nome = EXCLUDED.tra_nome,
                        tra_endereco = EXCLUDED.tra_endereco,
                        tra_bairro = EXCLUDED.tra_bairro,
                        tra_cidade = EXCLUDED.tra_cidade,
                        tra_uf = EXCLUDED.tra_uf,
                        tra_cep = EXCLUDED.tra_cep,
                        tra_fone = EXCLUDED.tra_fone,
                        tra_cgc = EXCLUDED.tra_cgc,
                        tra_inscricao = EXCLUDED.tra_inscricao,
                        tra_email = EXCLUDED.tra_email,
                        tra_contato = EXCLUDED.tra_contato,
                        tra_obs = EXCLUDED.tra_obs
                `, [
                    row.CODIGO || 0,
                    row.NOME || '',
                    row.ENDERECO || '',
                    row.BAIRRO || '',
                    row.CIDADE || '',
                    row.UF || '',
                    row.CEP || '',
                    row.TELEFONE1 || '',
                    row.CNPJ || '',
                    row.IEST || '',
                    row.EMAIL || '',
                    row.CONTATO || '',
                    '' // OBS
                ]);
                imported++;
            } catch (err) {
                console.error(`❌ Erro: ${err.message}`);
            }
        }

        console.log(`\n✅ Importação concluída!`);
        console.log(`   Total: ${data.length} | Importados: ${imported}\n`);

        const count = await pool.query('SELECT COUNT(*) FROM transportadora');
        console.log(`📊 Total no banco: ${count.rows[0].count}`);

    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await pool.end();
    }
}

importTransportadora();
