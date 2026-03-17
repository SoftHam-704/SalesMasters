const { Pool } = require('pg');

// Config do Master para achar o Tenant
const masterPool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 5432,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 5000
});

async function limparDados() {
    try {
        console.log('🔍 Buscando credenciais do tenant 18987717000134...');

        const res = await masterPool.query(`
            SELECT db_host, db_nome, db_schema, db_usuario, db_senha, db_porta 
            FROM empresas 
            WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = '18987717000134'
        `);

        if (res.rows.length === 0) { console.error('Tenant não encontrado'); return; }
        const emp = res.rows[0];

        const tenantPool = new Pool({
            host: emp.db_host,
            port: emp.db_porta || 5432,
            database: emp.db_nome,
            user: emp.db_usuario,
            password: emp.db_senha
        });

        const schema = emp.db_schema;
        console.log(`🔌 Conectado em ${schema}`);

        // 1. Ver dados atuais
        const atuais = await tenantPool.query(`SELECT id, nome_marca FROM ${schema}.ia_conhecimento`);
        console.log('📋 Marcas Atuais no DB:', atuais.rows);

        // 2. Deletar Bertolini (Exemplo)
        // OBS: Se deletarmos, precisamos garantir que nenhuma conversa está lincada a ela com FK, ou setar NULL.
        // Vamos setar NULL nas conversas primeiro.
        await tenantPool.query(`UPDATE ${schema}.wpp_conversa SET contexto_industria_id = NULL WHERE contexto_industria_id IN (SELECT id FROM ${schema}.ia_conhecimento WHERE nome_marca ILIKE '%Bertolini%')`);

        const deleteRes = await tenantPool.query(`DELETE FROM ${schema}.ia_conhecimento WHERE nome_marca ILIKE '%Bertolini%'`);
        console.log(`🗑️ Dados 'Bertolini' removidos: ${deleteRes.rowCount} registros.`);

        // 3. Inserir um dado genérico (Opcional) se ficar vazio
        if (atuais.rows.length <= deleteRes.rowCount) {
            console.log('✨ Inserindo marca genérica "Geral"...');
            await tenantPool.query(`INSERT INTO ${schema}.ia_conhecimento (nome_marca, palavras_chave, resumo_negocio, persona_ia) VALUES ('Portfólio Geral', 'produtos, vendas, catalogo', 'Empresa de representação com diversos produtos.', 'Consultor de Vendas')`);
        }

        await tenantPool.end();

    } catch (e) {
        console.error(e);
    } finally {
        await masterPool.end();
    }
}

limparDados();
