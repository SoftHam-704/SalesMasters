const { Pool } = require('pg');

const masterPool = new Pool({
    user: 'webadmin',
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    database: 'salesmasters_master',
    password: 'ytAyO0u043',
    port: 13062,
});

async function run() {
    try {
        console.log('Registering Trust Representações in salesmasters_master.empresas...');

        const cnpj = '21145796000140';
        const razao_social = 'MARCELO CLAUDINO ROELA';
        const nome_fantasia = 'TRUST REPRESENTAÇÃO COMERCIAL';
        const telefone = '(11) 9 8492-7315';
        const ramoatv = 'Autopeças';
        const db_schema = 'trustrep';
        const db_host = 'node254557-salesmaster.sp1.br.saveincloud.net.br';
        const db_nome = 'basesales';
        const db_usuario = 'webadmin';
        const db_senha = 'ytAyO0u043';
        const db_porta = 5432;

        const query = `
            INSERT INTO empresas (
                cnpj, razao_social, nome_fantasia, telefone, status,
                data_adesao, data_vencimento, valor_mensalidade, limite_usuarios,
                db_host, db_nome, db_usuario, db_senha, db_porta,
                db_schema, ramoatv, modulo_bi_ativo, modulo_whatsapp_ativo, modulo_crmrep_ativo,
                bloqueio_ativo, ios_enabled
            ) VALUES (
                $1, $2, $3, $4, 'Ativo',
                CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '1 year', 0, 10,
                $5, $6, $7, $8, $9,
                $10, $11, true, true, true,
                'N', 'S'
            ) 
            ON CONFLICT (cnpj) DO UPDATE SET 
                razao_social = EXCLUDED.razao_social,
                nome_fantasia = EXCLUDED.nome_fantasia,
                telefone = EXCLUDED.telefone,
                db_schema = EXCLUDED.db_schema,
                ramoatv = EXCLUDED.ramoatv,
                db_porta = EXCLUDED.db_porta,
                status = EXCLUDED.status
            RETURNING id
        `;

        const values = [
            cnpj, razao_social, nome_fantasia, telefone,
            db_host, db_nome, db_usuario, db_senha, db_porta,
            db_schema, ramoatv
        ];

        const result = await masterPool.query(query, values);
        console.log(`✅ Success! Trust Representações registered with Master ID: ${result.rows[0].id}`);

    } catch (err) {
        console.error('❌ Error registering company:', err.message);
    } finally {
        await masterPool.end();
    }
}

run();
