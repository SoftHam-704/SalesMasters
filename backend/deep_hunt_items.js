const { Pool } = require('pg');
require('dotenv').config();

async function deepHunt() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false
    };

    const pool = new Pool(config);

    try {
        const schema = 'ro_consult';
        console.log(`\n--- CAÇA AOS ITENS PERDIDOS: ${schema} ---`);

        // 1. Pegar um pedido órfão de exemplo
        const samplePedidoQuery = `
            SELECT ped_pedido, ped_totliq, ped_data, ped_industria
            FROM ${schema}.pedidos
            WHERE ped_data BETWEEN '2026-02-01' AND '2026-02-25'
            AND ped_situacao IN ('P', 'F')
            AND NOT EXISTS (SELECT 1 FROM ${schema}.itens_ped WHERE ite_pedido = ped_pedido)
            LIMIT 5
        `;
        const sampleRes = await pool.query(samplePedidoQuery);

        if (sampleRes.rows.length === 0) {
            console.log("Não encontrei pedidos órfãos nesta execução. Verifique os critérios.");
            return;
        }

        for (const orphan of sampleRes.rows) {
            const rawId = orphan.ped_pedido;
            const strippedId = rawId.replace(/[^0-9]/g, '');
            console.log(`\nInvestigando Pedido: "${rawId}" (Stripped: "${strippedId}") | Valor: ${orphan.ped_totliq}`);

            // Busca por similaridade no ite_pedido
            const huntQuery = `
                SELECT ite_pedido, ite_produto, ite_nomeprod, ite_totliquido, ite_industria
                FROM ${schema}.itens_ped
                WHERE ite_pedido ILIKE $1 
                   OR ite_pedido ILIKE $2
                   OR ite_pedido ~ $3
                LIMIT 5
            `;
            // Tentativas: com prefixo, sem prefixo, ou contendo o número
            const huntRes = await pool.query(huntQuery, [`%${rawId}%`, `%${strippedId}%`, strippedId]);

            if (huntRes.rows.length > 0) {
                console.log(`🎯 ENCONTRADOS POSSÍVEIS ITENS PARA ${rawId}:`);
                huntRes.rows.forEach(r => {
                    console.log(`   -> ite_pedido: "${r.ite_pedido}", Produto: ${r.ite_nomeprod}, Valor: ${r.ite_totliquido}, Ind: ${r.ite_industria}`);
                });
            } else {
                console.log(`❌ Nada encontrado em itens_ped para o ID "${rawId}" ou "${strippedId}"`);
            }
        }

        // 2. Verificar se há itens "soltos" (sem pedido pai) no mês de fevereiro
        console.log(`\n--- BUSCANDO ITENS "SOLTOS" (SEM PAI) ---`);
        const looseItemsQuery = `
            SELECT i.ite_pedido, SUM(i.ite_totliquido) as total, COUNT(*) as qtd
            FROM ${schema}.itens_ped i
            LEFT JOIN ${schema}.pedidos p ON p.ped_pedido = i.ite_pedido
            WHERE p.ped_pedido IS NULL
            GROUP BY i.ite_pedido
            LIMIT 10
        `;
        const looseRes = await pool.query(looseItemsQuery);
        if (looseRes.rows.length > 0) {
            console.log("Encontrados itens que não batem com nenhum pedido:");
            looseRes.rows.forEach(r => {
                console.log(`   -> ite_pedido: "${r.ite_pedido}", Total Itens: R$ ${parseFloat(r.total).toFixed(2)}, Qtd: ${r.qtd}`);
            });
        } else {
            console.log("Não há itens órfãos (sem pai) na tabela itens_ped.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

deepHunt();
