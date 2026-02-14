const { masterPool } = require('./utils/db');

async function setup() {
    try {
        console.log('--- Configurando Empresa de Teste (Projetos) ---');

        // 1. Criar Empresa
        const cnpjFicticio = '99999999000199';
        const empresaQuery = `
            INSERT INTO empresas (
                cnpj, razao_social, nome_fantasia, status, 
                db_host, db_nome, db_schema, db_usuario, db_senha, db_porta, 
                limite_sessoes, bloqueio_ativo, ramoatv
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            ) ON CONFLICT (cnpj) DO UPDATE SET 
                ramoatv = EXCLUDED.ramoatv,
                db_schema = EXCLUDED.db_schema,
                status = EXCLUDED.status
            RETURNING id;
        `;

        const empresaValues = [
            cnpjFicticio, 'BERTOLINI TESTE PROJETOS', 'Bertolini Projetos', 'ATIVO',
            'localhost', 'basesales', 'public', 'postgres', '@12Pilabo', 5432,
            999, 'N', 'Projetos'
        ];

        const empresaRes = await masterPool.query(empresaQuery, empresaValues);
        const empresaId = empresaRes.rows[0].id;
        console.log(`✅ Empresa criada/atualizada com ID: ${empresaId}`);

        // 2. Criar Usuário no Master
        const userQuery = `
            INSERT INTO usuarios (
                empresa_id, nome, sobrenome, email, senha, e_admin, ativo
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7
            ) ON CONFLICT (email) DO UPDATE SET 
                empresa_id = EXCLUDED.empresa_id,
                senha = EXCLUDED.senha
            RETURNING id;
        `;
        const userValues = [
            empresaId, 'Hamilton', 'Projetos', 'teste@bertolini.com.br', '123456', true, true
        ];

        const userRes = await masterPool.query(userQuery, userValues);
        console.log(`✅ Usuário criado/atualizado com ID: ${userRes.rows[0].id}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Erro no setup:', err);
        process.exit(1);
    }
}

setup();
