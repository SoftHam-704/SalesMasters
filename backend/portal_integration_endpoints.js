const fs = require('fs');
const path = require('path');
const { getCurrentPool } = require('./utils/context');

module.exports = function (app, pool) {

    // Helper para formatar moeda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR') + '  ' + d.toLocaleTimeString('pt-BR');
    };

    // Helper genérico para geração de arquivo e download
    const handleFileDownload = (res, content, filename, contentType = 'text/plain', encoding = 'latin1') => {
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-Type', `${contentType}; charset=${encoding === 'latin1' ? 'ISO-8859-1' : 'UTF-8'}`);
        console.log(`✅ [PORTAL] Arquivo gerado em memória e enviado para download: ${filename}`);
        const buffer = Buffer.from(content, encoding);
        res.send(buffer);
    };

    // --------------------------------------------------------------------------------
    // 1. STAHL
    // --------------------------------------------------------------------------------
    app.post('/api/orders/:pedPedido/export/stahl', async (req, res) => {
        exportStahl(req, res);
    });

    const exportStahl = async (req, res) => {
        const { pedPedido } = req.params;
        const currentPool = getCurrentPool();

        if (!currentPool) return res.status(403).json({ success: false, message: 'Falta contexto do tenant.' });

        try {
            const orderQuery = `
                SELECT p.*, c.cli_nome, c.cli_nomred, c.cli_cnpj, c.cli_endereco, c.cli_bairro, c.cli_cep, c.cli_cidade, c.cli_uf as cli_estado,
                       t.tra_nome
                FROM pedidos p
                LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
                LEFT JOIN transportadora t ON p.ped_transp = t.tra_codigo
                WHERE TRIM(p.ped_pedido) = TRIM($1)
            `;
            const orderResult = await currentPool.query(orderQuery, [pedPedido]);
            if (orderResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
            const order = orderResult.rows[0];

            const itemsQuery = `SELECT * FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1) ORDER BY ite_seq`;
            const items = (await currentPool.query(itemsQuery, [pedPedido])).rows;

            let content = `Catálogo STAHL  -  Carrinho\n`;
            content += `${formatDate(new Date())}\n\n\n`;
            content += `### Cliente:\n------------\n`;
            content += `Cod.Cliente: 67563 (59833934000157 )\n`;
            content += `Empresa:   SOMA REPRESENTAÇOES\n`;
            content += `Nome:      CARLOS\n`;
            content += `Telefone:  65 992598800\n`;
            content += `E-Mail:    somarepresentacoes021@gmail.com\n\n\n\n`;
            content += `### Dados para Faturamento:\n---------------------------\n\n`;
            content += `Transportadora: ${order.tra_nome || ''}\n`;
            content += `Prazo:          ${order.ped_condpag || ''}\n`;
            content += `Razão Social:   ${order.cli_nome || ''}\n`;
            content += `CNPJ:           ${order.cli_cnpj || ''}\n`;
            content += `Endereço:       ${order.cli_endereco || ''}\n`;
            content += `Bairro:         ${order.cli_bairro || ''}\n`;
            content += `CEP:            ${order.cli_cep || ''}\n`;
            content += `Cidade:         ${order.cli_cidade || ''}\n`;
            content += `Estado:         ${order.cli_estado || ''}\n\n\n\n`;
            content += `### Mensagem:\n-------------\n\n\n\n`;
            content += `### Produtos:\n-------------\n`;

            items.forEach(item => {
                content += `CÓDIGO:     ${item.ite_produto || ''}\n`;
                content += `DESCRICÃO:  ${item.ite_nomeprod || ''}\n`;
                content += `QUANTIDADE: ${item.ite_quant}     PREÇO UNITÁRIO: ${formatCurrency(item.ite_puni)}        TOTAL: ${formatCurrency(item.ite_totbruto)}\n`;
                content += `----------------------------------------------------------------------------\n`;
            });
            content += `### TOTAL DO CARRINHO: ${formatCurrency(order.ped_totliq || order.ped_totbruto)}\n`;

            handleFileDownload(res, content, `${pedPedido}.txt`);
        } catch (error) {
            console.error('❌ [PORTAL] Erro:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };


    // --------------------------------------------------------------------------------
    // 2. IGUACU
    // --------------------------------------------------------------------------------
    app.post('/api/orders/:pedPedido/export/iguacu', async (req, res) => {
        exportIguacu(req, res);
    });

    const exportIguacu = async (req, res) => {
        const { pedPedido } = req.params;
        const currentPool = getCurrentPool();

        if (!currentPool) return res.status(403).json({ success: false, message: 'Falta contexto do tenant.' });

        try {
            const orderQuery = `
                SELECT p.*, c.cli_cnpj, c.ped_repres
                FROM pedidos p
                LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE TRIM(p.ped_pedido) = TRIM($1)
            `;
            // Nota: Se 'ped_repres' não existir na tabela clientes, ajustaremos depois. Assumindo que o pedido tem o ID

            const orderResult = await currentPool.query(`
                SELECT p.*, c.cli_cnpj 
                FROM pedidos p
                LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE TRIM(p.ped_pedido) = TRIM($1)
            `, [pedPedido]);

            if (orderResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
            const order = orderResult.rows[0];

            const itemsQuery = `SELECT * FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1) ORDER BY ite_seq`;
            const items = (await currentPool.query(itemsQuery, [pedPedido])).rows;

            // Construção do XML
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
            xml += `<PED_ONLINE>\n`;
            xml += `  <PEDIDO>\n`;
            xml += `    <CNPJ_CLI>${(order.cli_cnpj || '').replace(/\D/g, '')}</CNPJ_CLI>\n`; // Remove pontuação
            xml += `    <CNPJ_TRANSP></CNPJ_TRANSP>\n`;
            xml += `    <PED_CLI></PED_CLI>\n`;
            xml += `    <PED_REPRS>${pedPedido}</PED_REPRS>\n`;
            xml += `    <PRAZOS></PRAZOS>\n`;
            xml += `    <T_ENTREGA>1</T_ENTREGA>\n`;
            xml += `    <OBS></OBS>\n`;
            xml += `  </PEDIDO>\n`;

            items.forEach((item, index) => {
                xml += `  <PRODUTOS>\n`;
                xml += `    <ITENS_PEDIDO>\n`;
                xml += `      <ITENS nItem="${index + 1}">\n`;
                xml += `        <COD_PRODUTO>${item.ite_produto || ''}</COD_PRODUTO>\n`;
                xml += `        <QDE>${item.ite_quant}</QDE>\n`;
                xml += `      </ITENS>\n`;
                xml += `    </ITENS_PEDIDO>\n`;
                xml += `  </PRODUTOS>\n`;
            });

            xml += `</PED_ONLINE>`;

            handleFileDownload(res, xml, `${pedPedido}.xml`, 'application/xml', 'utf8');

        } catch (error) {
            console.error('❌ [PORTAL] Erro:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    // --------------------------------------------------------------------------------
    // 3. VIEMAR (Excel)
    // --------------------------------------------------------------------------------
    const XLSX = require('xlsx');

    app.post('/api/orders/:pedPedido/export/viemar', async (req, res) => {
        exportViemar(req, res);
    });

    const exportViemar = async (req, res) => {
        const { pedPedido } = req.params;
        const currentPool = getCurrentPool();

        if (!currentPool) return res.status(403).json({ success: false, message: 'Falta contexto do tenant.' });

        try {
            const itemsQuery = `SELECT * FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1) ORDER BY ite_seq`;
            const items = (await currentPool.query(itemsQuery, [pedPedido])).rows;

            if (items.length === 0) return res.status(404).json({ success: false, message: 'Pedido sem itens.' });

            // Preparar dados para o Excel (Array de Arrays)
            // Header oculto ou inexistente conforme print? O print não mostra header, começa na linha 1.
            // Colunas: Código, Quantidade, Preço Unitário Liquido
            const data = items.map(item => [
                item.ite_produto || '',
                item.ite_quant || 0,
                Number(item.ite_puni || 0)
            ]);

            // Criar Workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, "Planilha1");

            // Gerar Buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            // Atenção: handleFileDownload espera genericamente, para binário (buffer) passamos 'null' no encoding pois buffer já é raw
            // Ajustamos handleFileDownload para aceitar buffer diretamente

            res.setHeader('Content-Disposition', `attachment; filename=${pedPedido}.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            console.log(`✅ [PORTAL] Excel gerado e enviado: ${pedPedido}.xlsx`);
            res.send(buffer);

        } catch (error) {
            console.error('❌ [PORTAL] Erro:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

};
