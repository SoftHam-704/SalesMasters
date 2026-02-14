const { masterPool } = require('./utils/db');

async function forceFix() {
    const cnpj = '99999999000199';
    try {
        const emp = await masterPool.query("SELECT id FROM empresas WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = $1", [cnpj]);
        const id = emp.rows[0].id;

        // Limpar qualquer duplicata se existir
        await masterPool.query("DELETE FROM usuarios WHERE email = 'teste@bertolini.com.br'");

        // Inserir limpo
        await masterPool.query(`
            INSERT INTO usuarios (empresa_id, nome, sobrenome, email, senha, e_admin, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id, 'hamilton', 'sistemas', 'teste@bertolini.com.br', 'hamilton123', true, true]);

        console.log('✅ Usuário recreado com sucesso: hamilton sistemas / hamilton123');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
forceFix();
