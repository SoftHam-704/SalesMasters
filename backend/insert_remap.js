
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
        console.log("Inserindo REMAP na tabela public.empresas...");

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
        alerta_percentual, 
        bloqueio_ativo, 
        valor_mensalidade,
        data_adesao,
        data_vencimento
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
        $11, $12, $13, $14, $15, $16, $17, 
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
            '22443147000199', // 1. CNPJ
            'REMAP-REPRESENTACOES MINEIRA DE AUTO PECAS LTDA', // 2. Razão Social
            'REMAP', // 3. Nome Fantasia
            'comercial@remap.com.br', // 4. Email (Placeholder)
            '(31) 3295-1054', // 5. Telefone
            'ATIVO', // 6. Status
            process.env.DB_HOST, // 7. Host
            process.env.DB_NAME, // 8. DB Name
            process.env.DB_USER, // 9. User
            process.env.DB_PASSWORD, // 10. Pass
            process.env.DB_PORT, // 11. Port
            'remap', // 12. Schema (CRÍTICO: O user pediu "direcioná-lo para o schema correto")
            10, // 13. Limite Usuários
            999, // 14. Limite Sessões
            90, // 15. Alerta %
            'N', // 16. Bloqueio Ativo (N = Não)
            0.00 // 17. Valor Mensalidade
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
