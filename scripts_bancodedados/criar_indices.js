const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'salesmasters',
    password: 'postgres',
    port: 5432,
});

async function analisarIndicesExistentes() {
    console.log('\n=== ANALISANDO ÍNDICES EXISTENTES ===\n');

    try {
        const result = await pool.query(`
            SELECT
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname;
        `);

        console.log(`Total de índices encontrados: ${result.rows.length}\n`);

        // Agrupar por tabela
        const porTabela = {};
        result.rows.forEach(row => {
            if (!porTabela[row.tablename]) {
                porTabela[row.tablename] = [];
            }
            porTabela[row.tablename].push(row.indexname);
        });

        console.log('Índices por tabela:');
        Object.keys(porTabela).sort().forEach(tabela => {
            console.log(`  ${tabela}: ${porTabela[tabela].length} índices`);
        });

        return result.rows;
    } catch (error) {
        console.error('Erro ao analisar índices:', error.message);
        throw error;
    }
}

async function criarIndices() {
    console.log('\n=== CRIANDO NOVOS ÍNDICES ===\n');

    const indices = [
        // TABELAS DE PREÇO (PRIORIDADE ALTA)
        {
            nome: 'idx_tabelaspre_industria_tabela',
            sql: 'CREATE INDEX IF NOT EXISTS idx_tabelaspre_industria_tabela ON cad_tabelaspre(itab_idindustria, itab_tabela);',
            descricao: 'Busca por indústria + tabela'
        },
        {
            nome: 'idx_tabelaspre_produto',
            sql: 'CREATE INDEX IF NOT EXISTS idx_tabelaspre_produto ON cad_tabelaspre(itab_idprod);',
            descricao: 'Busca por produto'
        },
        {
            nome: 'idx_tabelaspre_grupodesc',
            sql: 'CREATE INDEX IF NOT EXISTS idx_tabelaspre_grupodesc ON cad_tabelaspre(itab_grupodesconto) WHERE itab_grupodesconto IS NOT NULL;',
            descricao: 'Busca por grupo de desconto'
        },
        {
            nome: 'idx_tabelaspre_status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_tabelaspre_status ON cad_tabelaspre(itab_status);',
            descricao: 'Busca por status'
        },

        // PRODUTOS (PRIORIDADE ALTA)
        {
            nome: 'idx_prod_industria_codigo',
            sql: 'CREATE INDEX IF NOT EXISTS idx_prod_industria_codigo ON cad_prod(pro_industria, pro_codprod);',
            descricao: 'Busca por indústria + código'
        },
        {
            nome: 'idx_prod_codigo_normalizado',
            sql: 'CREATE INDEX IF NOT EXISTS idx_prod_codigo_normalizado ON cad_prod(pro_codigonormalizado);',
            descricao: 'Busca por código normalizado'
        },
        {
            nome: 'idx_prod_status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_prod_status ON cad_prod(pro_status);',
            descricao: 'Busca por status'
        },

        // CLIENTES (PRIORIDADE MÉDIA)
        {
            nome: 'idx_clientes_cnpj',
            sql: 'CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cli_cnpj);',
            descricao: 'Busca por CNPJ/CPF'
        },
        {
            nome: 'idx_clientes_status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(cli_status);',
            descricao: 'Busca por status'
        },

        // FORNECEDORES (PRIORIDADE MÉDIA)
        {
            nome: 'idx_fornecedores_codigo',
            sql: 'CREATE INDEX IF NOT EXISTS idx_fornecedores_codigo ON fornecedores(for_codigo);',
            descricao: 'Busca por código'
        },
        {
            nome: 'idx_fornecedores_status',
            sql: 'CREATE INDEX IF NOT EXISTS idx_fornecedores_status ON fornecedores(for_status);',
            descricao: 'Busca por status'
        },

        // PEDIDOS (PRIORIDADE MÉDIA)
        {
            nome: 'idx_pedidos_industria',
            sql: 'CREATE INDEX IF NOT EXISTS idx_pedidos_industria ON pedidos(ped_industria);',
            descricao: 'Busca por indústria'
        },
        {
            nome: 'idx_pedidos_data',
            sql: 'CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(ped_data);',
            descricao: 'Busca por data'
        },
        {
            nome: 'idx_pedidos_situacao',
            sql: 'CREATE INDEX IF NOT EXISTS idx_pedidos_situacao ON pedidos(ped_situacao);',
            descricao: 'Busca por situação'
        },
        {
            nome: 'idx_pedidos_industria_situacao_data',
            sql: 'CREATE INDEX IF NOT EXISTS idx_pedidos_industria_situacao_data ON pedidos(ped_industria, ped_situacao, ped_data DESC);',
            descricao: 'Busca composta (query principal da tela de pedidos)'
        },
        {
            nome: 'idx_pedidos_cliente',
            sql: 'CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(ped_cliente);',
            descricao: 'Busca por cliente'
        },

        // RELACIONAMENTOS (PRIORIDADE BAIXA)
        {
            nome: 'idx_cli_ind_cliente',
            sql: 'CREATE INDEX IF NOT EXISTS idx_cli_ind_cliente ON cli_ind(cli_codigo);',
            descricao: 'Relacionamento cliente-indústria'
        },
        {
            nome: 'idx_cli_ind_fornecedor',
            sql: 'CREATE INDEX IF NOT EXISTS idx_cli_ind_fornecedor ON cli_ind(for_codigo);',
            descricao: 'Relacionamento cliente-fornecedor'
        },
        {
            nome: 'idx_vendedores_codigo',
            sql: 'CREATE INDEX IF NOT EXISTS idx_vendedores_codigo ON vendedores(ven_codigo);',
            descricao: 'Busca por código de vendedor'
        }
    ];

    let criados = 0;
    let erros = 0;

    for (const indice of indices) {
        try {
            console.log(`Criando: ${indice.nome} - ${indice.descricao}`);
            await pool.query(indice.sql);
            criados++;
            console.log(`  ✓ Criado com sucesso`);
        } catch (error) {
            erros++;
            console.error(`  ✗ Erro: ${error.message}`);
        }
    }

    console.log(`\nResumo: ${criados} índices criados, ${erros} erros`);
}

async function analisarTamanhoIndices() {
    console.log('\n=== TAMANHO DOS ÍNDICES ===\n');

    try {
        const result = await pool.query(`
            SELECT
                schemaname,
                tablename,
                indexname,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                pg_relation_size(indexrelid) as size_bytes
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY pg_relation_size(indexrelid) DESC
            LIMIT 20;
        `);

        console.log('Top 20 maiores índices:');
        result.rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.tablename}.${row.indexname}: ${row.index_size}`);
        });
    } catch (error) {
        console.error('Erro ao analisar tamanho:', error.message);
    }
}

async function analisarUsoIndices() {
    console.log('\n=== USO DOS ÍNDICES ===\n');

    try {
        const result = await pool.query(`
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_scan as index_scans,
                idx_tup_read as tuples_read,
                idx_tup_fetch as tuples_fetched
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public'
            ORDER BY idx_scan DESC
            LIMIT 20;
        `);

        console.log('Top 20 índices mais usados:');
        result.rows.forEach((row, i) => {
            console.log(`${i + 1}. ${row.tablename}.${row.indexname}: ${row.index_scans} scans`);
        });
    } catch (error) {
        console.error('Erro ao analisar uso:', error.message);
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  SalesMasters - Criação de Índices        ║');
    console.log('║  Data: 21/12/2024                          ║');
    console.log('╚════════════════════════════════════════════╝');

    try {
        // 1. Analisar índices existentes
        await analisarIndicesExistentes();

        // 2. Criar novos índices
        await criarIndices();

        // 3. Analisar tamanho dos índices
        await analisarTamanhoIndices();

        // 4. Analisar uso dos índices
        await analisarUsoIndices();

        console.log('\n✓ Processo concluído com sucesso!');
    } catch (error) {
        console.error('\n✗ Erro no processo:', error);
    } finally {
        await pool.end();
    }
}

main();
