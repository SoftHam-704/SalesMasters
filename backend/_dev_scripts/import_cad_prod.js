// Script para importar cad_prod.xlsx em LOTES para a tabela TAB STAHL 25
const XLSX = require('xlsx');
const path = require('path');

const BATCH_SIZE = 50; // Importar 50 produtos por vez

async function importarLote(produtos, loteNum, totalLotes) {
    console.log(`\n📦 Importando lote ${loteNum}/${totalLotes} (${produtos.length} produtos)...`);

    const response = await fetch('http://localhost:3005/api/price-tables/import', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            industria: 12, // STAHL
            nomeTabela: 'TAB STAHL 25',
            dataTabela: new Date().toISOString().split('T')[0],
            dataVencimento: '2025-12-31',
            produtos: produtos
        })
    });

    const result = await response.json();

    if (result.success) {
        console.log(`✅ Lote ${loteNum} concluído:`);
        console.log(`   Produtos novos: ${result.resumo.produtosNovos}`);
        console.log(`   Produtos atualizados: ${result.resumo.produtosAtualizados}`);
        console.log(`   Preços inseridos: ${result.resumo.precosInseridos}`);
        if (result.resumo.erros > 0) {
            console.log(`   ⚠️  Erros: ${result.resumo.erros}`);
        }
        return result.resumo;
    } else {
        throw new Error(result.message || 'Erro desconhecido');
    }
}

async function importarTabelaPreco() {
    try {
        console.log('📂 Lendo arquivo cad_prod.xlsx...');

        const filePath = process.env.EXCEL_FILE || path.join(__dirname, '../data/cad_prod.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`✅ ${data.length} registros encontrados`);

        // Mapear dados para o formato esperado pela API
        const todosProdutos = data.map(row => ({
            codigo: row.PRO_CODPROD || row.codigo || '',
            descricao: row.PRO_NOME || row.nome || row.descricao || '',
            precobruto: parseFloat(row.ITAB_PRECOBRUTO || row.preco || row.precobruto || 0),
            precopromo: parseFloat(row.ITAB_PRECOPROMO || row.precopromo || 0) || null,
            precoespecial: parseFloat(row.ITAB_PRECOESPECIAL || row.precoespecial || 0) || null,
            ipi: parseFloat(row.ITAB_IPI || row.ipi || 0),
            st: parseFloat(row.ITAB_ST || row.st || 0),
            peso: parseFloat(row.PRO_PESO || row.peso || 0) || null,
            embalagem: parseInt(row.PRO_EMBALAGEM || row.embalagem || 0) || null,
            grupo: parseInt(row.PRO_GRUPO || row.grupo || 0) || null,
            ncm: row.PRO_NCM || row.ncm || null,
            codbarras: row.PRO_CODBARRAS || row.codbarras || null,
            aplicacao: row.PRO_APLICACAO || row.aplicacao || null,
            descontoadd: parseFloat(row.ITAB_DESCONTOADD || row.descontoadd || 0)
        }));

        // Dividir em lotes
        const totalLotes = Math.ceil(todosProdutos.length / BATCH_SIZE);
        console.log(`\n📊 Dividindo em ${totalLotes} lotes de até ${BATCH_SIZE} produtos`);

        let totalNovos = 0;
        let totalAtualizados = 0;
        let totalPrecos = 0;
        let totalErros = 0;

        for (let i = 0; i < totalLotes; i++) {
            const inicio = i * BATCH_SIZE;
            const fim = Math.min((i + 1) * BATCH_SIZE, todosProdutos.length);
            const lote = todosProdutos.slice(inicio, fim);

            try {
                const resumo = await importarLote(lote, i + 1, totalLotes);
                totalNovos += resumo.produtosNovos;
                totalAtualizados += resumo.produtosAtualizados;
                totalPrecos += resumo.precosInseridos;
                totalErros += resumo.erros;

                // Aguardar 500ms entre lotes para não sobrecarregar o servidor
                if (i < totalLotes - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`❌ Erro no lote ${i + 1}:`, error.message);
                totalErros++;
            }
        }

        console.log('\n\n🎉 ========================================');
        console.log('✅ IMPORTAÇÃO COMPLETA CONCLUÍDA!');
        console.log('==========================================');
        console.log(`📊 RESUMO GERAL:`);
        console.log(`   Total de produtos processados: ${todosProdutos.length}`);
        console.log(`   Produtos novos: ${totalNovos}`);
        console.log(`   Produtos atualizados: ${totalAtualizados}`);
        console.log(`   Preços inseridos: ${totalPrecos}`);
        console.log(`   Erros: ${totalErros}`);
        console.log('==========================================\n');

    } catch (error) {
        console.error('❌ Erro ao importar:', error.message);
        console.error(error.stack);
    }
}

// Executar importação
importarTabelaPreco();
