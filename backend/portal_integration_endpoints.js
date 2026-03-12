const fs = require('fs');
const path = require('path');
const { getCurrentPool } = require('./utils/context');

module.exports = function (app, pool) {
    console.log('✅ [PORTAL] portal_integration_endpoints.js INITIALIZED');

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

            let content = `Catálogo STAHL  -  Carrinho\r\n`;
            content += `${formatDate(new Date())}\r\n\r\n\r\n`;
            content += `### Cliente:\r\n------------\r\n`;
            content += `Cod.Cliente: 67563 (59833934000157 )\r\n`;
            content += `Empresa:   SOMA REPRESENTAÇOES\r\n`;
            content += `Nome:      CARLOS\r\n`;
            content += `Telefone:  65 992598800\r\n`;
            content += `E-Mail:    somarepresentacoes021@gmail.com\r\n\r\n\r\n\r\n`;
            content += `### Dados para Faturamento:\r\n---------------------------\r\n\r\n`;
            content += `Transportadora: ${order.tra_nome || ''}\r\n`;
            content += `Prazo:          ${order.ped_condpag || ''}\r\n`;
            content += `Razão Social:   ${order.cli_nome || ''}\r\n`;
            content += `CNPJ:           ${order.cli_cnpj || ''}\r\n`;
            content += `Endereço:       ${order.cli_endereco || ''}\r\n`;
            content += `Bairro:         ${order.cli_bairro || ''}\r\n`;
            content += `CEP:            ${order.cli_cep || ''}\r\n`;
            content += `Cidade:         ${order.cli_cidade || ''}\r\n`;
            content += `Estado:         ${order.cli_estado || ''}\r\n\r\n\r\n\r\n`;
            content += `### Mensagem:\r\n-------------\r\n\r\n\r\n\r\n`;
            content += `### Produtos:\r\n-------------\r\n`;

            items.forEach(item => {
                content += `CÓDIGO:     ${item.ite_produto || ''}\r\n`;
                content += `DESCRICÃO:  ${item.ite_nomeprod || ''}\r\n`;
                content += `QUANTIDADE: ${item.ite_quant}     PREÇO UNITÁRIO: ${formatCurrency(item.ite_puni)}        TOTAL: ${formatCurrency(item.ite_totbruto)}\r\n`;
                content += `----------------------------------------------------------------------------\r\n`;
            });
            content += `### TOTAL DO CARRINHO: ${formatCurrency(order.ped_totliq || order.ped_totbruto)}\r\n`;

            // Força o padrão Windows (CRLF) convertendo qualquer \n solitário em \r\n
            content = content.replace(/\r?\n/g, '\r\n');

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
                SELECT 
                    p.ped_pedido, 
                    p.ped_cliind, 
                    p.ped_condpag, 
                    p.ped_obs,
                    c.cli_cnpj,
                    t.tra_cgc
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

            // Helper para formatar CNPJ/CPF (apenas números)
            const onlyNumbers = (str) => String(str || '').replace(/\D/g, '');
            // Helper para limitar tamanho de string
            const limit = (str, max) => String(str || '').substring(0, max);

            // Construção do XML conforme Manual Técnico Iguaçu
            let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
            xml += `<PED_ONLINE>\n`;
            xml += `  <PEDIDO>\n`;
            xml += `    <CNPJ_CLI>${onlyNumbers(order.cli_cnpj)}</CNPJ_CLI>\n`;
            xml += `    <CNPJ_TRANSP>${onlyNumbers(order.tra_cgc)}</CNPJ_TRANSP>\n`;
            xml += `    <PED_CLI>${limit(order.ped_cliind, 20)}</PED_CLI>\n`;
            xml += `    <PED_REPRS>${limit(order.ped_pedido, 10)}</PED_REPRS>\n`;
            xml += `    <PRAZOS>${limit(order.ped_condpag, 40)}</PRAZOS>\n`;
            xml += `    <T_ENTREGA>1</T_ENTREGA>\n`; // 1 = Imediata (padrão)
            xml += `    <OBS>${limit(order.ped_obs, 500)}</OBS>\n`;
            xml += `  </PEDIDO>\n`;

            xml += `  <PRODUTOS>\n`;
            xml += `    <ITENS_PEDIDO>\n`;

            items.forEach((item, index) => {
                xml += `      <ITENS nItem="${index + 1}">\n`;
                xml += `        <COD_PRODUTO>${limit(item.ite_produto, 20)}</COD_PRODUTO>\n`;
                xml += `        <QDE>${Math.trunc(item.ite_quant || 0)}</QDE>\n`;
                xml += `      </ITENS>\n`;
            });

            xml += `    </ITENS_PEDIDO>\n`;
            xml += `  </PRODUTOS>\n`;
            xml += `</PED_ONLINE>`;

            // --- NOVO: Salvamento Automático no Servidor (Sync) ---
            const exportPath = process.env.IGUACU_EXPORT_PATH;
            if (exportPath) {
                try {
                    // Garante que o diretório existe
                    if (!fs.existsSync(exportPath)) {
                        fs.mkdirSync(exportPath, { recursive: true });
                    }
                    const fullPath = path.join(exportPath, `${pedPedido}.xml`);
                    fs.writeFileSync(fullPath, xml, 'utf8');
                    console.log(`💾 [PORTAL] Iguaçu XML salvo automaticamente em: ${fullPath}`);
                } catch (fsErr) {
                    console.error(`❌ [PORTAL] Erro ao salvar XML localmente: ${fsErr.message}`);
                    // Não bloqueamos o download se o salvamento no disco falhar
                }
            }

            handleFileDownload(res, xml, `${pedPedido}.xml`, 'application/xml', 'utf8');

        } catch (error) {
            console.error('❌ [PORTAL] Erro Iguaçu XML:', error);
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
            console.error('❌ [PORTAL] Erro Viemar:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    // --------------------------------------------------------------------------------
    // 4. SAMPEL (Excel)
    // --------------------------------------------------------------------------------
    app.get('/api/orders/:pedPedido/export/sampel', async (req, res) => {
        console.log(`📡 [PORTAL] SAMPEL export requested for: ${req.params.pedPedido}`);
        exportSampel(req, res);
    });

    const exportSampel = async (req, res) => {
        const { pedPedido } = req.params;
        const currentPool = getCurrentPool();

        if (!currentPool) return res.status(403).json({ success: false, message: 'Falta contexto do tenant.' });

        try {
            // Fetch order and client info
            const orderQuery = `
                SELECT p.ped_pedido, p.ped_tabela, c.cli_cnpj
                FROM pedidos p
                LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE TRIM(p.ped_pedido) = TRIM($1)
            `;
            const orderResult = await currentPool.query(orderQuery, [pedPedido]);

            if (orderResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
            const order = orderResult.rows[0];

            // Fetch items
            const itemsQuery = `SELECT ite_produto, ite_quant FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1) ORDER BY ite_seq`;
            const items = (await currentPool.query(itemsQuery, [pedPedido])).rows;

            if (items.length === 0) return res.status(404).json({ success: false, message: 'Pedido sem itens.' });

            // Preparar dados para o Excel conforme print 2
            // Colunas: CNPJ | PEDIDO REPRES | TABELA PRECO | ITEM | QUANTIDADE
            const header = [["CNPJ", "PEDIDO REPRES", "TABELA PRECO", "ITEM", "QUANTIDADE"]];
            const dataRows = items.map(item => [
                (order.cli_cnpj || '').replace(/\D/g, ''), // CNPJ apenas números
                order.ped_pedido || '',
                order.ped_tabela || '',
                item.ite_produto || '',
                item.ite_quant || 0
            ]);

            const finalData = [...header, ...dataRows];

            // Criar Workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(finalData);

            // Garantir que as colunas tenham uma largura mínima para visibilidade das labels
            const wscols = [
                { wch: 18 }, // CNPJ
                { wch: 15 }, // PEDIDO REPRES
                { wch: 15 }, // TABELA PRECO
                { wch: 15 }, // ITEM
                { wch: 12 }  // QUANTIDADE
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Planilha1");

            // Gerar Buffer
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', `attachment; filename=SAMPEL_${pedPedido}.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            console.log(`✅ [PORTAL] SAMPEL Excel gerado e enviado: SAMPEL_${pedPedido}.xlsx`);
            res.send(buffer);

        } catch (error) {
            console.error('❌ [PORTAL] Erro SAMPEL:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };

    // --------------------------------------------------------------------------------
    // 5. POLO (CSV)
    // --------------------------------------------------------------------------------
    app.post('/api/orders/:pedPedido/export/polo', async (req, res) => {
        exportPolo(req, res);
    });

    const exportPolo = async (req, res) => {
        const { pedPedido } = req.params;
        const currentPool = getCurrentPool();

        if (!currentPool) return res.status(403).json({ success: false, message: 'Falta contexto do tenant.' });

        try {
            // Fetch items following Delphi logic:
            // select ite_produto, ite_quant, ite_puniliq from itens_ped where ite_pedido = :P1 order by ite_lancto
            const itemsQuery = `
                SELECT ite_produto, ite_quant, ite_puniliq 
                FROM itens_ped 
                WHERE TRIM(ite_pedido) = TRIM($1) 
                ORDER BY ite_lancto
            `;
            const items = (await currentPool.query(itemsQuery, [pedPedido])).rows;

            if (items.length === 0) return res.status(404).json({ success: false, message: 'Pedido sem itens.' });

            // Delphi format:
            // vLinha2 := 'codigo;qtde;valor';
            // vLinha2 := dm1.qryAux3.FieldByName('ite_produto').AsString+';'+InttoStr(trunc(dm1.qryAux3.FieldByName('ite_quant').AsFloat))+';'+
            //            FloattoStr(dm1.qryAux3.FieldByName('ite_puniliq').AsFloat);

            let content = 'codigo;qtde;valor\r\n';
            items.forEach(item => {
                const codigo = item.ite_produto || '';
                const qtde = Math.trunc(item.ite_quant || 0);
                
                // Formatação POLO: 2 casas decimais com vírgula como separador (PT-BR)
                const valorRaw = parseFloat(item.ite_puniliq || 0);
                const valorFormatado = valorRaw.toFixed(2).replace('.', ',');
                
                content += `${codigo};${qtde};${valorFormatado}\r\n`;
            });

            handleFileDownload(res, content, `${pedPedido}.csv`, 'text/csv', 'utf8');

        } catch (error) {
            console.error('❌ [PORTAL] Erro Polo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    };
};
