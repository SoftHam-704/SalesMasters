const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432
});

async function seed() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('📊 Populando Plano de Contas...\n');

        // ============================================
        // RECEITAS
        // ============================================
        const [receitas] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('1', 'RECEITAS', 'R', 1, NULL)
            RETURNING id
        `)).rows;

        const [vendasRec] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('1.1', 'Vendas', 'R', 2, $1)
            RETURNING id
        `, [receitas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('1.1.01', 'Vendas de Produtos', 'R', 3, $1),
            ('1.1.02', 'Vendas de Serviços', 'R', 3, $1),
            ('1.1.03', 'Revenda de Mercadorias', 'R', 3, $1)
        `, [vendasRec.id]);

        const [recFinanceiras] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('1.2', 'Receitas Financeiras', 'R', 2, $1)
            RETURNING id
        `, [receitas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('1.2.01', 'Juros Recebidos', 'R', 3, $1),
            ('1.2.02', 'Descontos Obtidos', 'R', 3, $1),
            ('1.2.03', 'Rendimentos de Aplicações', 'R', 3, $1)
        `, [recFinanceiras.id]);

        const [outrasRec] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('1.3', 'Outras Receitas', 'R', 2, $1)
            RETURNING id
        `, [receitas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('1.3.01', 'Recuperação de Despesas', 'R', 3, $1),
            ('1.3.02', 'Venda de Ativos', 'R', 3, $1)
        `, [outrasRec.id]);

        // ============================================
        // DESPESAS
        // ============================================
        const [despesas] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('2', 'DESPESAS', 'D', 1, NULL)
            RETURNING id
        `)).rows;

        const [despPessoal] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('2.1', 'Despesas com Pessoal', 'D', 2, $1)
            RETURNING id
        `, [despesas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('2.1.01', 'Salários', 'D', 3, $1),
            ('2.1.02', 'Encargos Sociais', 'D', 3, $1),
            ('2.1.03', 'Férias', 'D', 3, $1),
            ('2.1.04', '13º Salário', 'D', 3, $1),
            ('2.1.05', 'Vale Transporte', 'D', 3, $1),
            ('2.1.06', 'Vale Refeição', 'D', 3, $1),
            ('2.1.07', 'Plano de Saúde', 'D', 3, $1)
        `, [despPessoal.id]);

        const [despAdmin] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('2.2', 'Despesas Administrativas', 'D', 2, $1)
            RETURNING id
        `, [despesas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('2.2.01', 'Aluguel', 'D', 3, $1),
            ('2.2.02', 'Energia Elétrica', 'D', 3, $1),
            ('2.2.03', 'Água e Esgoto', 'D', 3, $1),
            ('2.2.04', 'Telefone e Internet', 'D', 3, $1),
            ('2.2.05', 'Material de Escritório', 'D', 3, $1),
            ('2.2.06', 'Material de Limpeza', 'D', 3, $1),
            ('2.2.07', 'Correios e Sedex', 'D', 3, $1)
        `, [despAdmin.id]);

        const [despVendas] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('2.3', 'Despesas com Vendas', 'D', 2, $1)
            RETURNING id
        `, [despesas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('2.3.01', 'Comissões', 'D', 3, $1),
            ('2.3.02', 'Propaganda e Marketing', 'D', 3, $1),
            ('2.3.03', 'Brindes e Amostras', 'D', 3, $1),
            ('2.3.04', 'Viagens', 'D', 3, $1)
        `, [despVendas.id]);

        const [despTributarias] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('2.4', 'Despesas Tributárias', 'D', 2, $1)
            RETURNING id
        `, [despesas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('2.4.01', 'IRPJ', 'D', 3, $1),
            ('2.4.02', 'CSLL', 'D', 3, $1),
            ('2.4.03', 'PIS', 'D', 3, $1),
            ('2.4.04', 'COFINS', 'D', 3, $1),
            ('2.4.05', 'ISS', 'D', 3, $1),
            ('2.4.06', 'ICMS', 'D', 3, $1)
        `, [despTributarias.id]);

        const [despFinanceiras] = (await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai)
            VALUES ('2.5', 'Despesas Financeiras', 'D', 2, $1)
            RETURNING id
        `, [despesas.id])).rows;

        await client.query(`
            INSERT INTO fin_plano_contas (codigo, descricao, tipo, nivel, id_pai) VALUES
            ('2.5.01', 'Juros Pagos', 'D', 3, $1),
            ('2.5.02', 'Tarifas Bancárias', 'D', 3, $1),
            ('2.5.03', 'IOF', 'D', 3, $1),
            ('2.5.04', 'Descontos Concedidos', 'D', 3, $1)
        `, [despFinanceiras.id]);

        console.log('✅ Plano de Contas populado!\n');

        // ============================================
        // CENTROS DE CUSTO
        // ============================================
        console.log('📊 Populando Centros de Custo...\n');

        await client.query(`
            INSERT INTO fin_centro_custo (codigo, descricao) VALUES
            ('VENDAS', 'Departamento de Vendas'),
            ('ADMIN', 'Administrativo'),
            ('FINANC', 'Financeiro'),
            ('MARKETING', 'Marketing'),
            ('TI', 'Tecnologia da Informação'),
            ('RH', 'Recursos Humanos'),
            ('LOGISTICA', 'Logística')
        `);

        console.log('✅ Centros de Custo populados!\n');

        await client.query('COMMIT');

        // Verificar contagens
        const planoCount = await client.query('SELECT COUNT(*) FROM fin_plano_contas');
        const centroCount = await client.query('SELECT COUNT(*) FROM fin_centro_custo');

        console.log('📋 Resumo:');
        console.log(`   - Plano de Contas: ${planoCount.rows[0].count} registros`);
        console.log(`   - Centro de Custo: ${centroCount.rows[0].count} registros\n`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
