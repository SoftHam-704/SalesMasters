import * as XLSX from 'xlsx';

/**
 * Formata data corrigindo o problema de fuso horário (UTC paridade com PDF)
 */
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch {
        return dateString;
    }
};

/**
 * Formata valores numéricos para padrão BRL (Opcional para Excel, melhor manter número puro e formatar a célula)
 * mas para AOAs, números puros são melhores para cálculos posteriores no Excel.
 */
const r2 = (v) => Math.round((parseFloat(v) || 0) * 100) / 100;

/**
 * Constrói texto de descontos compostos do pedido (Header)
 */
const getOrderDiscountText = (order) => {
    const discs = [];
    for (let i = 1; i <= 10; i++) {
        const val = parseFloat(order[`ped_desc${i}`]);
        if (val > 0) discs.push(`${val.toFixed(2)}%`);
    }
    return discs.length > 0 ? discs.join(' + ') : '0.00%';
};

/**
 * Lógica comum para construir o conteúdo da planilha
 */
function buildWsData(order, items) {
    const wsData = [];

    // Título Principal
    wsData.push(['RELATÓRIO DE PEDIDO - SALESMASTERS']);
    wsData.push(['Gerado em:', new Date().toLocaleString('pt-BR')]);
    wsData.push([]);

    // Identificação da Indústria
    wsData.push(['INDUSTRIA / FORNECEDOR']);
    wsData.push(['Nome:', order.for_nome || order.for_nomered || '—']);
    wsData.push([]);

    // Dados Cabeçalho do Pedido
    wsData.push(['DADOS DO PEDIDO']);
    wsData.push(['Nº Pedido:', order.ped_pedido || '—', '', 'Data Emissão:', formatDate(order.ped_data)]);
    wsData.push(['Pedido Cliente:', order.ped_cliind || '—', '', 'Situação:', order.ped_situacao === 'P' ? 'Pendente' : order.ped_situacao]);
    wsData.push(['Vendedor:', order.ven_nome || '—', '', 'Fone Vendedor:', order.ven_fone1 || '—']);
    wsData.push(['Descontos do Pedido:', getOrderDiscountText(order)]);
    wsData.push([]);

    // Dados do Cliente
    wsData.push(['DADOS DO CLIENTE']);
    wsData.push(['Razão Social:', order.cli_nome || '—']);
    wsData.push(['CNPJ/CPF:', order.cli_cnpj || '—', '', 'Insc. Est.:', order.cli_inscricao || '—']);
    wsData.push(['Endereço:', `${order.cli_endereco || ''}, ${order.cli_numero || ''}`]);
    wsData.push(['Bairro:', order.cli_bairro || '—', '', 'Cidade/UF:', `${order.cli_cidade || ''} / ${order.cli_uf || ''}`]);
    wsData.push(['Comprador:', order.ped_comprador || '—', '', 'Telefone:', order.cli_fone1 || '—']);
    wsData.push([]);

    // Condições Comerciais
    wsData.push(['CONDIÇÕES E LOGÍSTICA']);
    wsData.push(['Cond. Pagamento:', order.ped_condpag || '—']);
    wsData.push(['Transportadora:', order.tra_nome || '—', '', 'Frete:', order.ped_tipofrete === 'F' ? 'FOB' : 'CIF']);
    wsData.push([]);

    // Cabeçalho da Tabela de Itens
    wsData.push(['ITENS DO PEDIDO']);
    wsData.push([
        'CÓDIGO',
        'DESCRIÇÃO',
        'UNID',
        'REF. ORIGINAL',
        'QTD',
        'PREÇO BRUTO',
        'PREÇO LÍQUIDO',
        'TOTAL LÍQUIDO',
        'IPI %',
        'VALOR IPI',
        'VALOR ST',
        'TOTAL C/ IMPOSTOS'
    ]);

    items.forEach((item) => {
        const liq = parseFloat(item.ite_totliquido) || 0;
        const ipiVal = parseFloat(item.ite_valipi) || 0;
        const stVal = parseFloat(item.ite_valst) || 0;
        const totalComImp = liq + ipiVal + stVal;

        wsData.push([
            item.ite_produto || '',
            item.ite_nomeprod || '',
            item.ite_embuch || '',
            item.pro_codigooriginal || '',
            parseFloat(item.ite_quant) || 0,
            r2(item.ite_puni),
            r2(item.ite_puniliq),
            r2(liq),
            r2(item.ite_ipi),
            r2(ipiVal),
            r2(stVal),
            r2(totalComImp)
        ]);
    });

    wsData.push([]);

    // Totais Finais
    const sumLiq = items.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const sumQtd = items.reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const sumIpi = items.reduce((acc, it) => acc + (parseFloat(it.ite_valipi) || 0), 0);
    const sumSt = items.reduce((acc, it) => acc + (parseFloat(it.ite_valst) || 0), 0);
    const sumTotal = sumLiq + sumIpi + sumSt;

    wsData.push(['', '', '', 'TOTAIS:', sumQtd, '', '', r2(sumLiq), '', r2(sumIpi), r2(sumSt), r2(sumTotal)]);
    wsData.push([]);
    wsData.push(['OBSERVAÇÕES']);
    wsData.push([order.ped_obs || '—']);

    return wsData;
}

/**
 * Export order data to Excel file for Download
 */
export function exportOrderToExcel(order, items) {
    const wb = XLSX.utils.book_new();
    const wsData = buildWsData(order, items);
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ajuste de colunas
    ws['!cols'] = [
        { wch: 15 }, // Código
        { wch: 45 }, // Descrição
        { wch: 8 },  // Unid
        { wch: 15 }, // Ref
        { wch: 10 }, // Qtd
        { wch: 12 }, // Bruto
        { wch: 12 }, // Líquido
        { wch: 15 }, // Tot Liq
        { wch: 8 },  // IPI %
        { wch: 12 }, // Val IPI
        { wch: 12 }, // Val ST
        { wch: 18 }, // Total Final
    ];

    // Mesclagem de células para o título
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
    const filename = `Pedido_${order.ped_pedido || 'S-N'}_${order.cli_nomred || 'Relatorio'}.xlsx`;
    XLSX.writeFile(wb, filename);
    return filename;
}

/**
 * Generate Excel data (array buffer)
 */
export function generateOrderExcelData(order, items) {
    const wb = XLSX.utils.book_new();
    const wsData = buildWsData(order, items);
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
        { wch: 15 }, { wch: 45 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 12 },
        { wch: 12 }, { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export default exportOrderToExcel;
