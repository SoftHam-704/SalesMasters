const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    max: 20
});

const SCHEMA = 'ro_consult';

async function importData() {
    const client = await pool.connect();
    try {
        console.log('--- Iniciando Importação de Janeiro/2026 para ro_consult ---\n');

        // Carregar dados do JSON
        console.log('📄 Carregando dados do JSON...');
        const pedidosData = JSON.parse(fs.readFileSync('e:/Sistemas_ia/SalesMasters/data/pedidos.json', 'utf8')).RecordSet;
        const itensData = JSON.parse(fs.readFileSync('e:/Sistemas_ia/SalesMasters/data/itens_ped.json', 'utf8')).RecordSet;

        console.log(`   - Pedidos no JSON: ${pedidosData.length}`);
        console.log(`   - Itens no JSON: ${itensData.length}`);

        // Cachear dados existentes
        console.log('\n🔄 Cacheando dados existentes do banco...');
        const existingPeds = await client.query(`SELECT ped_pedido, ped_industria FROM ${SCHEMA}.pedidos`);
        const pedSet = new Set(existingPeds.rows.map(r => `${r.ped_pedido}_${r.ped_industria}`));
        console.log(`   - Pedidos existentes: ${existingPeds.rows.length}`);

        const existingItens = await client.query(`SELECT ite_pedido, ite_industria, ite_idproduto, ite_seq FROM ${SCHEMA}.itens_ped`);
        const iteSet = new Set(existingItens.rows.map(r => `${r.ite_pedido}_${r.ite_industria}_${r.ite_idproduto}_${r.ite_seq}`));
        console.log(`   - Itens existentes: ${existingItens.rows.length}`);

        const prods = await client.query(`SELECT pro_id, pro_codprod, pro_industria FROM ${SCHEMA}.cad_prod`);
        const prodMap = new Map(prods.rows.map(r => [`${r.pro_codprod}_${r.pro_industria}`, r.pro_id]));
        console.log(`   - Produtos cadastrados: ${prods.rows.length}`);

        await client.query('BEGIN');

        // ============ PEDIDOS ============
        const newPeds = pedidosData.filter(p => !pedSet.has(`${p.PED_PEDIDO}_${p.PED_INDUSTRIA}`));
        console.log(`\n📦 PEDIDOS: ${newPeds.length} novos a inserir`);

        if (newPeds.length > 0) {
            const chunkSize = 100;
            for (let i = 0; i < newPeds.length; i += chunkSize) {
                const chunk = newPeds.slice(i, i + chunkSize);
                const values = [];
                const params = [];
                let pIdx = 1;
                for (const p of chunk) {
                    values.push(`($${pIdx++}, $${pIdx++}, TO_DATE($${pIdx++}, 'DD.MM.YYYY'), $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, CASE WHEN $${pIdx} = '30.12.1899 00:00' THEN NULL ELSE TO_TIMESTAMP($${pIdx++}, 'DD.MM.YYYY HH24:MI') END)`);
                    params.push(p.PED_PEDIDO, p.PED_TABELA, p.PED_DATA, p.PED_INDUSTRIA, p.PED_CLIENTE, p.PED_TRANSP, p.PED_VENDEDOR, p.PED_CLIIND || '', p.PED_SITUACAO, p.PED_CONDPAG || '', p.PED_TIPOFRETE || 'C', p.PED_TOTLIQ || 0, p.PED_TOTBRUTO || 0, p.PED_TOTALIPI || 0, p.PED_COMPRADOR || '', p.PED_NFFAT || '', p.PED_OBS || '', p.PED_DATAENVIO);
                }
                await client.query(`INSERT INTO ${SCHEMA}.pedidos (ped_pedido, ped_tabela, ped_data, ped_industria, ped_cliente, ped_transp, ped_vendedor, ped_cliind, ped_situacao, ped_condpag, ped_tipofrete, ped_totliq, ped_totbruto, ped_totalipi, ped_comprador, ped_nffat, ped_obs, ped_dataenvio) VALUES ${values.join(',')}`, params);
            }
            console.log(`   ✅ ${newPeds.length} pedidos inseridos`);
        }

        // ============ ITENS ============
        console.log(`\n📋 ITENS: Preparando...`);

        // Preparar itens - usar ITE_IDPRODUTO do JSON se existir, senão buscar no prodMap
        let semProduto = 0;
        let jaExistem = 0;

        const preparedItens = itensData.map(ite => {
            // Usar diretamente o ITE_IDPRODUTO do JSON se existir
            let proId = ite.ITE_IDPRODUTO;

            // Se não existir, tentar encontrar no cad_prod
            if (!proId) {
                proId = prodMap.get(`${ite.ITE_PRODUTO}_${ite.ITE_INDUSTRIA}`);
            }

            return { ...ite, proId };
        }).filter(ite => {
            if (!ite.proId) {
                semProduto++;
                return false;
            }
            // Chave de unicidade: pedido + industria + idproduto + seq
            const key = `${ite.ITE_PEDIDO}_${ite.ITE_INDUSTRIA}_${ite.proId}_${ite.ITE_SEQ}`;
            if (iteSet.has(key)) {
                jaExistem++;
                return false;
            }
            return true;
        });

        console.log(`   - Total no JSON: ${itensData.length}`);
        console.log(`   - Sem produto cadastrado (ignorados): ${semProduto}`);
        console.log(`   - Já existem no banco (duplicados): ${jaExistem}`);
        console.log(`   - Novos a inserir: ${preparedItens.length}`);

        if (preparedItens.length > 0) {
            console.log(`\n🚀 Inserindo ${preparedItens.length} itens...`);
            const chunkSize = 3000;
            for (let i = 0; i < preparedItens.length; i += chunkSize) {
                const chunk = preparedItens.slice(i, i + chunkSize);
                const values = [
                    chunk.map(it => it.ITE_PEDIDO),
                    chunk.map(it => it.ITE_INDUSTRIA),
                    chunk.map(it => it.proId),
                    chunk.map(it => it.ITE_PRODUTO),
                    chunk.map(it => it.ITE_NOMEPROD),
                    chunk.map(it => (it.ITE_DATA === '30.12.1899 00:00' || !it.ITE_DATA) ? null : it.ITE_DATA),
                    chunk.map(it => it.ITE_QUANT || 0),
                    chunk.map(it => it.ITE_PUNI || 0),
                    chunk.map(it => it.ITE_PUNILIQ || 0),
                    chunk.map(it => it.ITE_TOTLIQUIDO || 0),
                    chunk.map(it => it.ITE_TOTBRUTO || 0),
                    chunk.map(it => it.ITE_IPI || 0),
                    chunk.map(it => it.ITE_ST || 0),
                    chunk.map(it => it.ITE_SEQ || 0),
                    chunk.map(it => it.ITE_NUMPEDCLI || '')
                ];

                await client.query(`
                    INSERT INTO ${SCHEMA}.itens_ped (
                        ite_pedido, ite_industria, ite_idproduto, ite_produto, ite_nomeprod,
                        ite_data, ite_quant, ite_puni, ite_puniliq, ite_totliquido,
                        ite_totbruto, ite_ipi, ite_st, ite_seq, ite_numpedcli
                    )
                    SELECT 
                        t.ped, t.ind, t.idp, t.prod, t.nome, 
                        CASE WHEN t.dt IS NULL THEN NULL ELSE TO_TIMESTAMP(t.dt, 'DD.MM.YYYY HH24:MI') END,
                        t.q, t.p, t.pl, t.tl, t.tb, t.ipi, t.st, t.sq, t.np
                    FROM UNNEST($1::text[], $2::int[], $3::int[], $4::text[], $5::text[], $6::text[], $7::float8[], $8::float8[], $9::float8[], $10::float8[], $11::float8[], $12::float8[], $13::float8[], $14::int[], $15::text[]) 
                    AS t(ped, ind, idp, prod, nome, dt, q, p, pl, tl, tb, ipi, st, sq, np)
                `, values);
                console.log(`   Progresso: ${Math.min(i + chunkSize, preparedItens.length)}/${preparedItens.length}...`);
            }
            console.log(`   ✅ ${preparedItens.length} itens inseridos`);
        } else {
            console.log(`\n⚠️  Nenhum item novo para inserir!`);
        }

        await client.query('COMMIT');
        console.log('\n✅✅✅ IMPORTAÇÃO FINALIZADA COM SUCESSO! ✅✅✅');

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('\n❌ ERRO:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

importData();

