const { Pool } = require('pg');
require('dotenv').config();

const poolMaster = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'salesmasters_master',
    password: process.env.DB_PASSWORD || '@12Pilabo',
    port: process.env.DB_PORT || 5432,
});

async function insertTargetCompany() {
    try {
        console.log('🚀 [PRODUÇÃO] Cadastrando TARGET REPRESENTACOES no Master...');

        // 1. Inserir Empresa baseada no print do Delphi
        const insEmpresa = `
            INSERT INTO empresas (
                cnpj, 
                razao_social, 
                nome_fantasia, 
                status, 
                db_host, 
                db_nome, 
                db_usuario, 
                db_senha, 
                db_porta,
                data_vencimento
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (cnpj) DO UPDATE SET 
                razao_social = EXCLUDED.razao_social,
                status = EXCLUDED.status,
                db_host = EXCLUDED.db_host,
                db_nome = EXCLUDED.db_nome
            RETURNING id;
        `;

        const valuesEmp = [
            '33.866.124/0001-03',                   // CNPJ do Print
            'TARGET REPRESENTACOES',               // Nome do Print
            'Target Representações',
            'ATIVO',                                // Status Liberado
            'node254557-salesmaster.sp1.br.saveincloud.net.br', // URL Cloud atual
            'basesales',                            // Nome da base
            'postgres',
            '@12Pilabo',
            13062,                                  // Porta da nuvem (visto nos logs anteriores)
            '2026-12-31'                            // Vencimento longo para teste
        ];

        const resEmp = await poolMaster.query(insEmpresa, valuesEmp);
        const empresaId = resEmp.rows[0].id;
        console.log(`✅ Empresa cadastrada com ID: ${empresaId}`);

        // 2. Criar Usuário Inicial para a Target
        const insUsuario = `
            INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin)
            VALUES ($1, 'Admin', 'Target', 'contato@targetrep.com.br', 'target123', TRUE)
            ON CONFLICT (email) DO NOTHING;
        `;
        await poolMaster.query(insUsuario, [empresaId]);

        console.log('--- DADOS DE ACESSO PARA AMANHÃ ---');
        console.log('🏢 Empresa: TARGET REPRESENTACOES');
        console.log('📧 Login: contato@targetrep.com.br');
        console.log('🔑 Senha: target123');
        console.log('------------------------------------');

        await poolMaster.end();

    } catch (err) {
        console.error('❌ ERRO AO CADASTRAR:', err.message);
    }
}

insertTargetCompany();
