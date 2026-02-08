const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

const SCHEMA = 'ro_consult';

async function verify() {
    try {
        console.log('🔍 Carregando dados...\n');

        // 1. Carregar JSON
        const jsonData = JSON.parse(fs.readFileSync('../data/itens_ped.json', 'utf8'));
        const itensJson = jsonData.RecordSet || [];
        console.log(`📄 Registros no JSON: ${itensJson.length}`);

        // 2. Contar registros no banco
        const dbCount = await pool.query(`SELECT COUNT(*) FROM ${SCHEMA}.itens_ped`);
        console.log(`🗄️  Registros no banco (${SCHEMA}.itens_ped): ${dbCount.rows[0].count}`);

        // 3. Buscar itens existentes no banco
        console.log('\n🔄 Verificando quais itens do JSON já estão no banco...');
        const existingItens = await pool.query(`
            SELECT ite_pedido, ite_industria, ite_idproduto, ite_seq 
            FROM ${SCHEMA}.itens_ped
        `);
        const iteSet = new Set(existingItens.rows.map(r =>
            `${r.ite_pedido}_${r.ite_industria}_${r.ite_idproduto}_${r.ite_seq}`
        ));

        // 4. Verificar quais itens do JSON ainda não estão no banco
        const missingItens = itensJson.filter(ite => {
            const key = `${ite.ITE_PEDIDO}_${ite.ITE_INDUSTRIA}_${ite.ITE_IDPRODUTO}_${ite.ITE_SEQ}`;
            return !iteSet.has(key);
        });

        console.log(`\n📊 RESULTADO:`);
        console.log(`   - Total no JSON: ${itensJson.length}`);
        console.log(`   - Já no banco: ${itensJson.length - missingItens.length}`);
        console.log(`   - Faltando importar: ${missingItens.length}`);

        if (missingItens.length > 0) {
            console.log(`\n⚠️  ${missingItens.length} itens ainda precisam ser importados!`);

            // Mostrar amostra dos itens faltando
            console.log('\n📋 Amostra dos primeiros 5 itens faltando:');
            missingItens.slice(0, 5).forEach((ite, i) => {
                console.log(`   ${i + 1}. Pedido: ${ite.ITE_PEDIDO}, Ind: ${ite.ITE_INDUSTRIA}, Prod: ${ite.ITE_PRODUTO}`);
            });
        } else {
            console.log(`\n✅ Todos os ${itensJson.length} itens do JSON já estão no banco!`);
        }

        // 5. Verificar estrutura do JSON
        const sample = itensJson[0];
        console.log('\n📋 Campos no JSON (primeiros 10):');
        console.log(Object.keys(sample).slice(0, 10).join(', '));

    } catch (err) {
        console.error('❌ Erro:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

verify();
