
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

async function insertRemap() {
    try {
        console.log("Inserindo REMAP na tabela public.empresas (Versão Corrigida)...");

        const query = `
      INSERT INTO empresas (
        cnpj, 
        razao_social, 
        nome_fantasia, 
        email_contato,
        telefone,
        status, 
        db_host, 
        db_nome, 
        db_usuario, 
        db_senha, 
        db_porta, 
        db_schema, 
        limite_usuarios, 
        limite_sessoes, 
        bloqueio_ativo, 
        valor_mensalidade,
        created_at,
        data_vencimento
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, 
        NOW(), 
        NOW() + interval '1 year'
      )
      ON CONFLICT (cnpj) DO UPDATE SET
        razao_social = EXCLUDED.razao_social,
        nome_fantasia = EXCLUDED.nome_fantasia,
        db_schema = EXCLUDED.db_schema,
        status = EXCLUDED.status,
        db_host = EXCLUDED.db_host,
        db_nome = EXCLUDED.db_nome,
        db_usuario = EXCLUDED.db_usuario,
        db_senha = EXCLUDED.db_senha,
        db_porta = EXCLUDED.db_porta,
        bloqueio_ativo = EXCLUDED.bloqueio_ativo,
        limite_usuarios = EXCLUDED.limite_usuarios;
    `;

        const values = [
            '22443147000199', // 1
            'REMAP-REPRESENTACOES MINEIRA DE AUTO PECAS LTDA', // 2
            'REMAP', // 3
            'comercial@remap.com.br', // 4
            '(31) 3295-1054', // 5
            'ATIVO', // 6
            process.env.DB_HOST, // 7
            process.env.DB_NAME, // 8
            process.env.DB_USER, // 9
            process.env.DB_PASSWORD, // 10
            process.env.DB_PORT, // 11
            'remap', // 12
            10, // 13
            999, // 14
            'N', // 15
            0.00 // 16
        ];

        const res = await pool.query(query, values);
        console.log(`✅ Sucesso! REMAP cadastrada/atualizada. Rows affected: ${res.rowCount}`);
        await pool.end();

    } catch (err) {
        console.error('❌ Erro ao inserir REMAP:', err);
        process.exit(1);
    }
}

insertRemap();
