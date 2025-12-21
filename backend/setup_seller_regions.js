const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function setupSellerRegions() {
    const client = await pool.connect();

    try {
        console.log('🚀 Configurando tabela vendedor_reg...\n');

        // Check if table exists
        const checkTable = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'vendedor_reg'
            );
        `);

        if (!checkTable.rows[0].exists) {
            console.log('📋 Criando tabela vendedor_reg...');
            await client.query(`
                CREATE TABLE vendedor_reg (
                    vre_codigo INTEGER NOT NULL,
                    vre_regiao SMALLINT NOT NULL,
                    gid VARCHAR(38),
                    PRIMARY KEY (vre_codigo, vre_regiao),
                    FOREIGN KEY (vre_codigo) REFERENCES vendedores(ven_codigo) ON DELETE CASCADE,
                    FOREIGN KEY (vre_regiao) REFERENCES regioes(reg_codigo) ON DELETE CASCADE
                );
            `);
            console.log('✅ Tabela vendedor_reg criada!\n');
        } else {
            console.log('✅ Tabela vendedor_reg já existe!\n');
        }

        // Populate with sample data
        console.log('📊 Populando dados de exemplo...\n');

        // Get sellers
        const sellers = await client.query('SELECT ven_codigo, ven_nome FROM vendedores LIMIT 3');

        // Get regions
        const regions = await client.query('SELECT reg_codigo, reg_descricao FROM regioes LIMIT 10');

        if (sellers.rows.length === 0 || regions.rows.length === 0) {
            console.log('⚠️  Não há vendedores ou regiões cadastrados. Pulando população de dados.');
            return;
        }

        let inserted = 0;
        let skipped = 0;

        // Assign random regions to each seller
        for (const seller of sellers.rows) {
            // Each seller gets 2-4 random regions
            const numRegions = Math.floor(Math.random() * 3) + 2; // 2 to 4
            const shuffled = [...regions.rows].sort(() => 0.5 - Math.random());
            const selectedRegions = shuffled.slice(0, numRegions);

            for (const region of selectedRegions) {
                try {
                    await client.query(`
                        INSERT INTO vendedor_reg (vre_codigo, vre_regiao, gid)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (vre_codigo, vre_regiao) DO NOTHING
                    `, [seller.ven_codigo, region.reg_codigo, null]);

                    inserted++;
                    console.log(`  ✓ ${seller.ven_nome} → ${region.reg_descricao}`);
                } catch (error) {
                    skipped++;
                    console.log(`  ⊘ ${seller.ven_nome} → ${region.reg_descricao} (já existe)`);
                }
            }
        }

        console.log(`\n📈 Estatísticas:`);
        console.log(`   - Inseridos: ${inserted}`);
        console.log(`   - Ignorados (duplicados): ${skipped}`);

        // Show summary
        console.log('\n📋 Resumo das regiões por vendedor:');
        const summary = await client.query(`
            SELECT 
                v.ven_codigo,
                v.ven_nome,
                COUNT(vr.vre_regiao) as total_regioes,
                STRING_AGG(r.reg_descricao, ', ' ORDER BY r.reg_descricao) as regioes
            FROM vendedores v
            LEFT JOIN vendedor_reg vr ON v.ven_codigo = vr.vre_codigo
            LEFT JOIN regioes r ON vr.vre_regiao = r.reg_codigo
            GROUP BY v.ven_codigo, v.ven_nome
            HAVING COUNT(vr.vre_regiao) > 0
            ORDER BY v.ven_nome
        `);

        console.table(summary.rows);

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

setupSellerRegions()
    .then(() => {
        console.log('\n✨ Processo finalizado com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Erro fatal:', error);
        process.exit(1);
    });
