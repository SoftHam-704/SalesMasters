import * as XLSX from 'xlsx';

/**
 * Export order data to Excel file
 * @param {Object} order - Order header data
 * @param {Array} items - Order items
 */
export function exportOrderToExcel(order, items) {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Build the data array for the worksheet
    const wsData = [];

    // Row 1: Empty
    wsData.push([]);

    // Row 2: Pedido Nr (label)
    wsData.push(['Pedido Nr:']);

    // Row 3: Pedido Nº, value, Ped.Cliente:, value, Data:, date
    wsData.push([
        'Pedido Nº:', order.ped_pedido || '',
        '', '',
        'Ped.Cliente:', order.ped_nffat || '',
        '', '',
        'Data:', formatDate(order.ped_data)
    ]);

    // Row 4: Cliente
    wsData.push([
        'Cliente:', order.cli_nome || ''
    ]);

    // Row 5: Endereço
    wsData.push([
        'Endereço:', `${order.cli_endereco || ''} Bairro.: ${order.cli_bairro || ''}`,
        '', '', '', '',
        'Cidade/UF:', `${order.cli_cidade || ''} / ${order.cli_uf || ''}`,
        '', '',
        'CEP:', order.cli_cep || ''
    ]);

    // Row 6: CNPJ
    wsData.push([
        'CNPJ:', order.cli_cnpj || '',
        '', '',
        'INSCRIÇÃO:', order.cli_inscricao || '',
        '', '',
        'Telefone:', order.cli_fone1 || ''
    ]);

    // Row 7: Nº Itens
    wsData.push([
        'Nº Itens:', items.length
    ]);

    // Row 8: Condições
    wsData.push([
        'Condições:', order.ped_condpag || ''
    ]);

    // Row 9: Transportadora
    wsData.push([
        'Transportadora:', order.tra_nome || '',
        '', '',
        'Telefone:', order.tra_fone || '',
        '', '',
        'FRETE:', order.ped_tipofrete === 'F' ? 'FOB' : 'CIF'
    ]);

    // Row 10: Desconto aplicado
    const discountText = buildDiscountText(items[0]);
    wsData.push([
        `Desconto aplicado itens abaixo: ${discountText}`
    ]);

    // Row 11: Headers
    wsData.push([
        'CÓDIGO', 'DESCRIÇÃO', 'ITEM', 'COMPLEMENTO',
        'QTD.', 'PREÇO BRUTO', 'PREÇO LÍQUIDO', 'TOTAL LÍQUIDO',
        'IPI %', 'UNIT. COM IPI', 'TOTAL COM IPI',
        'ST %', 'UNIT COM IPIST', 'TOTAL COM IMPOSTOS'
    ]);

    // Helper to round to 2 decimal places
    const r2 = (v) => Math.round((parseFloat(v) || 0) * 100) / 100;

    // Data rows
    items.forEach((item, index) => {
        const ipiPercent = r2(item.ite_ipi);
        const stPercent = r2(item.ite_st);
        const precoLiquido = r2(item.ite_puniliq);
        const precoBruto = r2(item.ite_puni);
        const totalLiquido = r2(item.ite_totliquido);
        const unitComIpi = r2(precoLiquido * (1 + ipiPercent / 100));
        const totalComIpi = r2(totalLiquido * (1 + ipiPercent / 100));
        const unitComIpiSt = r2(precoLiquido * (1 + (ipiPercent + stPercent) / 100));
        const totalComImpostos = r2(totalLiquido + (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0));

        wsData.push([
            item.ite_produto || '',
            item.ite_nomeprod || '',
            item.ite_embuch || '',
            item.ite_embuch || '',
            parseInt(item.ite_quant) || 0,
            precoBruto,
            precoLiquido,
            totalLiquido,
            ipiPercent,
            unitComIpi,
            totalComIpi,
            stPercent,
            unitComIpiSt,
            totalComImpostos
        ]);
    });

    // Empty row
    wsData.push([]);

    // Footer row with totals
    const totalBruto = r2(items.reduce((acc, item) => acc + (parseFloat(item.ite_totbruto) || 0), 0));
    const totalLiquido = r2(items.reduce((acc, item) => acc + (parseFloat(item.ite_totliquido) || 0), 0));
    const totalQtd = items.reduce((acc, item) => acc + (parseInt(item.ite_quant) || 0), 0);
    const totalComImpostos = r2(items.reduce((acc, item) =>
        acc + (parseFloat(item.ite_totliquido) || 0) + (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0), 0));

    wsData.push([
        '', '', '', '',
        totalQtd, '', '',
        'Total líquido:', totalLiquido, '', '', '', '', totalComImpostos
    ]);

    // Observations row
    wsData.push(['Observações:', order.ped_obs || '']);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 },  // A - CÓDIGO
        { wch: 35 },  // B - DESCRIÇÃO
        { wch: 15 },  // C - ITEM
        { wch: 15 },  // D - COMPLEMENTO
        { wch: 8 },   // E - QTD
        { wch: 12 },  // F - PREÇO BRUTO
        { wch: 12 },  // G - PREÇO LÍQUIDO
        { wch: 14 },  // H - TOTAL LÍQUIDO
        { wch: 8 },   // I - IPI %
        { wch: 14 },  // J - UNIT COM IPI
        { wch: 14 },  // K - TOTAL COM IPI
        { wch: 8 },   // L - ST %
        { wch: 14 },  // M - UNIT COM IPIST
        { wch: 16 },  // N - TOTAL COM IMPOSTOS
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');

    // Generate filename
    const filename = `Pedido_${order.ped_pedido}_${order.cli_nomred || 'Cliente'}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    return filename;
}

/**
 * Format date to DD.MM.YYYY
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Build discount text from item
 */
function buildDiscountText(item) {
    if (!item) return '';

    const discounts = [];
    for (let i = 1; i <= 10; i++) {
        const val = parseFloat(item[`ite_des${i}`]) || 0;
        if (val > 0) {
            discounts.push(`${val.toFixed(2)}%`);
        }
    }

    return discounts.length > 0 ? discounts.join('+') : 'ITENS EM PROMOÇÃO';
}

export default exportOrderToExcel;
