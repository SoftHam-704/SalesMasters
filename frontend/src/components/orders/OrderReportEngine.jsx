import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Loader2, Printer, ZoomIn, ZoomOut, X, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import OrderPdfReport from './OrderPdfReport';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const OrderReportEngine = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const model = searchParams.get('model') || '1';
    const sortBy = searchParams.get('sortBy') || 'digitacao';
    const industria = searchParams.get('industria');

    const [data, setData] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(94);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!industria) {
                    console.error('Missing industria parameter');
                    setLoading(false);
                    return;
                }

                // Fetch order data and company data in parallel
                const [orderResponse, companyResponse] = await Promise.all([
                    fetch(getApiUrl(NODE_API_URL, `/api/orders/${id}/print-data?sortBy=${sortBy}&industria=${industria}`)),
                    fetch(getApiUrl(NODE_API_URL, '/api/config/company'))
                ]);

                const orderResult = await orderResponse.json();
                const companyResult = await companyResponse.json();

                if (orderResult.success) {
                    setData(orderResult.data);
                }
                if (companyResult.success) {
                    setCompanyData(companyResult.config);
                }
            } catch (error) {
                console.error('Error fetching print data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, sortBy, industria]);

    const handlePrint = () => window.print();
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
    const handleClose = () => window.close();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-200">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div className="p-10 text-center bg-slate-200 h-screen">Pedido não encontrado ou erro ao carregar dados.</div>;
    }

    const { order, items } = data;

    // Helpers
    const fv = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
    const fd = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

    // Build discount string for an item
    const getDiscountString = (item) => {
        const discounts = [
            item.ite_des1, item.ite_des2, item.ite_des3, item.ite_des4, item.ite_des5,
            item.ite_des6, item.ite_des7, item.ite_des8, item.ite_des9, item.ite_des10
        ].filter(d => d && parseFloat(d) !== 0);

        if (item.ite_promocao === 'S' || discounts.length === 0) {
            return 'ITENS EM PROMOÇÃO';
        }
        return discounts.map(d => `${fv(d)}%`).join('+');
    };

    // Group items by discount string
    const groupItemsByDiscount = (items) => {
        const groups = {};
        items.forEach(item => {
            const key = getDiscountString(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    };

    // Delphi-style Print Toolbar
    const PrintToolbar = () => (
        <div className="no-print fixed top-0 left-0 right-0 bg-slate-700 text-white h-12 flex items-center justify-between px-4 shadow-lg z-50">
            <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-slate-600 rounded" title="Primeira página">
                    <ChevronFirst className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-600 rounded" title="Página anterior">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 text-[15px]">Página 1 de 1</span>
                <button className="p-2 hover:bg-slate-600 rounded" title="Próxima página">
                    <ChevronRight className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-600 rounded" title="Última página">
                    <ChevronLast className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={handleZoomOut} className="p-2 hover:bg-slate-600 rounded" title="Diminuir zoom">
                    <ZoomOut className="w-5 h-5" />
                </button>
                <span className="px-2 text-[15px] min-w-[50px] text-center">{zoom}%</span>
                <button onClick={handleZoomIn} className="p-2 hover:bg-slate-600 rounded" title="Aumentar zoom">
                    <ZoomIn className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded font-medium" title="Imprimir">
                    <Printer className="w-4 h-4" />
                    Imprimir
                </button>
                <button onClick={handleClose} className="p-2 hover:bg-slate-600 rounded" title="Fechar">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    // Calculate totals
    const totalBruto = items.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const totalLiquido = items.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const totalIPIVal = items.reduce((acc, it) => acc + (parseFloat(it.ite_ipi) || 0) * (parseInt(it.ite_quant) || 0), 0);
    const totalSTVal = items.reduce((acc, it) => acc + (parseFloat(it.ite_st) || 0) * (parseInt(it.ite_quant) || 0), 0);
    const totalQuantidade = items.reduce((acc, it) => acc + (parseInt(it.ite_quant) || 0), 0);
    const totalComImpostos = totalLiquido + totalIPIVal + totalSTVal;

    // Universal PDF Engine for all models (1-50)
    // This bypasses the old HTML-based renderers which had print margin issues
    if (parseInt(model) >= 1 && parseInt(model) <= 50) {
        return (
            <div className="h-screen w-screen overflow-hidden">
                <PDFViewer width="100%" height="100%" showToolbar={true}>
                    <OrderPdfReport model={model} order={order} items={items} companyData={companyData} />
                </PDFViewer>
            </div>
        );
    }

    // Model 25 - Faithful to Delphi
    if (model === '25') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        {/* Main Content */}
                        <div className="print-container p-3 text-slate-900 font-sans text-[11px] leading-tight" style={{ width: '175mm' }}>
                            {/* Header with 3 columns: Logo Rep | Company Info | Logo Industry */}
                            <div className="border border-slate-400 p-2 mb-1 flex justify-between items-center">
                                <div className="w-20 h-12 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo Representação"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-slate-400">[Logo Rep]</span>
                                    )}
                                </div>
                                <div className="text-center flex-1 px-2">
                                    <div className="font-bold text-[12px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div className="text-[9px]">CNPJ: {companyData?.cnpj || '-'}</div>
                                    <div className="text-[9px]">End: {companyData?.endereco} {companyData?.bairro}</div>
                                    <div className="text-[9px]">Fones: {companyData?.fones || '-'}</div>
                                </div>
                                <div className="w-20 h-12 border border-slate-300 flex items-center justify-center bg-slate-50 text-[10px] text-slate-400">
                                    {order.for_nomered || '[Logo Ind]'}
                                </div>
                            </div>

                            {/* Industry Name Bar */}
                            <div className="bg-blue-800 text-white text-center py-0.5 font-bold text-[12px] mb-1">
                                {order.for_nome || 'INDÚSTRIA'}
                            </div>

                            {/* Order Info Bar */}
                            <div className="border border-slate-400 p-1 mb-1 grid grid-cols-6 gap-1 text-[10px]">
                                <div><span className="text-slate-500">Cotação nº:</span> {order.ped_pedido}</div>
                                <div><span className="text-slate-500">Nº pedido cliente:</span> {order.ped_nffat || '-'}</div>
                                <div className="text-right"><span className="text-slate-500">Lista:</span> <span className="text-blue-700 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                                <div><span className="text-slate-500">Data:</span> {fd(order.ped_data)}</div>
                                <div><span className="text-slate-500">Cond. Pagamento:</span> <span className="text-blue-700 font-bold">{order.ped_condpag || '-'}</span></div>
                                <div className="text-right"><span className="text-slate-500">Frete:</span> <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="mb-1">
                                <div className="bg-slate-200 border border-slate-400 text-center font-bold text-[10px] py-0.5">DADOS DO CLIENTE</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                        <div></div>
                                        <div><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                        <div></div>
                                        <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                        <div className="text-right"><span className="text-slate-500">Cx. postal:</span> <span className="text-blue-600 underline">{order.cli_cxpostal || '-'}</span></div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Cep:</span> {order.cli_cep}</span>
                                            <span><span className="text-slate-500">Estado:</span> {order.cli_uf}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Suframa:</span> <span className="text-blue-600 underline">{order.cli_suframa || '-'}</span></span>
                                        </div>
                                        <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                        <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                        <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                        <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                        <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                        <div><span className="text-slate-500">E-mail:</span> {order.ped_emailcomp || '-'}</div>
                                        <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> <span className="text-blue-600 underline">{order.cli_emailnfe || order.cli_email || '-'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="mb-1">
                                <div className="bg-slate-200 border border-slate-400 text-center font-bold text-[10px] py-0.5">DADOS PARA COBRANÇA</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep}</span>
                                            <span><span className="text-slate-500">UF:</span> {order.cli_ufcob || order.cli_uf}</span>
                                        </div>
                                        <div className="col-span-2"><span className="text-slate-500 text-red-600">E-Mail financeiro:</span> <span className="text-blue-600 underline">{order.cli_emailfinanc || '-'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="mb-1">
                                <div className="bg-slate-200 border border-slate-400 text-center font-bold text-[10px] py-0.5">TRANSPORTADORA</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                        <div></div>
                                        <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'}</span>
                                            <span><span className="text-slate-500">UF:</span> {order.tra_uf || '-'}</span>
                                        </div>
                                        <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                        <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                        <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                        <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* ITEMS - Grouped by Discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-2">
                                    {/* Discount Header (Gray Bar) */}
                                    <div className="bg-slate-200 border border-slate-400 px-1 py-0.5 text-[10px] font-bold">
                                        Descontos: {discountKey}
                                    </div>
                                    {/* Column Headers (Gray Bar) */}
                                    <div className="bg-slate-200 border border-slate-400 border-t-0 grid grid-cols-12 text-[9px] font-bold text-slate-600">
                                        <div className="col-span-1 p-0.5 border-r border-slate-300 text-center">Sq:</div>
                                        <div className="col-span-1 p-0.5 border-r border-slate-300 text-red-600">Produto</div>
                                        <div className="col-span-2 p-0.5 border-r border-slate-300 text-blue-600">Cod. orig/Conv./Comp</div>
                                        <div className="col-span-3 p-0.5 border-r border-slate-300">Descrição do produto</div>
                                        <div className="col-span-1 p-0.5 border-r border-slate-300 text-right text-blue-600">Quant</div>
                                        <div className="col-span-1 p-0.5 border-r border-slate-300 text-right text-blue-600">Un.Bruto</div>
                                        <div className="col-span-1 p-0.5 border-r border-slate-300 text-right text-blue-600">Un.líquido</div>
                                        <div className="col-span-1 p-0.5 border-r border-slate-300 text-right text-blue-600">Total lqdo</div>
                                        <div className="col-span-1 p-0.5 text-right text-blue-600">IPI</div>
                                    </div>
                                    {/* Items */}
                                    {groupItems.map((item, idx) => {
                                        globalSeq++;
                                        return (
                                            <div key={idx} className="border-x border-b border-slate-400 grid grid-cols-12 text-[10px]">
                                                <div className="col-span-1 p-0.5 border-r border-slate-200 text-center text-blue-600">{globalSeq}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-200 text-red-600 font-bold">{item.ite_produto}</div>
                                                <div className="col-span-2 p-0.5 border-r border-slate-200 text-slate-500">{item.ite_embuch || '-'}</div>
                                                <div className="col-span-3 p-0.5 border-r border-slate-200 uppercase">{item.ite_nomeprod}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-200 text-right font-bold">{item.ite_quant}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-200 text-right">{fv(item.ite_puni)}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-200 text-right">{fv(item.ite_puniliq)}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-200 text-right font-bold">{fv(item.ite_totliquido)}</div>
                                                <div className="col-span-1 p-0.5 text-right text-blue-600">{item.ite_ipi || '0,00'}</div>
                                            </div>
                                        );
                                    })}
                                    {/* Group Subtotal Row */}
                                    {(() => {
                                        const groupQtd = groupItems.reduce((a, i) => a + (parseInt(i.ite_quant) || 0), 0);
                                        const groupBruto = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puni) || 0), 0);
                                        const groupLiq = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0);
                                        const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                        return (
                                            <div className="border border-slate-400 border-t-0 bg-slate-100 grid grid-cols-12 text-[10px] font-bold">
                                                <div className="col-span-7 p-0.5"></div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{groupQtd}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(groupBruto)}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(groupLiq)}</div>
                                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(groupTotal)}</div>
                                                <div className="col-span-1 p-0.5 text-right"></div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}

                            {/* Grand Total Row - All Groups Combined */}
                            <div className="border border-slate-400 bg-slate-200 grid grid-cols-12 text-[10px] font-bold mt-1">
                                <div className="col-span-7 p-0.5"></div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{totalQuantidade}</div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(items.reduce((a, i) => a + parseFloat(i.ite_puni || 0), 0))}</div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(items.reduce((a, i) => a + parseFloat(i.ite_puniliq || 0), 0))}</div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(totalLiquido)}</div>
                                <div className="col-span-1 p-0.5 text-right"></div>
                            </div>


                            {/* Footer Section - Totals and Observations */}
                            <div className="mt-2 flex gap-2 overflow-hidden">
                                {/* Totals Box */}
                                <div className="border border-slate-400 p-1 text-[10px] flex-[1.5]">
                                    <div className="flex gap-4">
                                        <table className="flex-1 table-fixed">
                                            <tbody>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-0.5 text-slate-500" style={{ width: '60%' }}>T. Bruto:</td>
                                                    <td className="py-0.5 text-right font-bold">{fv(totalBruto)}</td>
                                                </tr>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-0.5 text-slate-500">T. Líquido:</td>
                                                    <td className="py-0.5 text-right font-bold">{fv(totalLiquido)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-0.5 text-slate-500">T. c/ Imp:</td>
                                                    <td className="py-0.5 text-right font-bold">{fv(totalComImpostos)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table className="flex-1 table-fixed border-l border-slate-200 pl-2">
                                            <tbody>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-0.5 text-slate-500" style={{ width: '60%' }}>Qtd. Itens:</td>
                                                    <td className="py-0.5 text-right font-bold">{items.length}</td>
                                                </tr>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-0.5 text-slate-500">Qtd. Total:</td>
                                                    <td className="py-0.5 text-right font-bold">{totalQuantidade}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-0.5 text-slate-500">Vendedor:</td>
                                                    <td className="py-0.5 text-right font-bold text-red-600 uppercase text-[9px] truncate">{order.ven_nome?.split(' ')[0]}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Observations Box */}
                                <div className="border border-slate-400 p-1 text-[9px] flex-1 min-h-[60px]">
                                    <div className="text-center font-bold text-[8px] text-slate-500 uppercase border-b border-slate-200 mb-1">OBSERVAÇÕES GERAIS</div>
                                    <div className="leading-tight break-words">
                                        {order.ped_obs || order.cli_obspedido || order.cli_obsparticular || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 26 - Like Model 25 but with detailed tax columns
    if (model === '26') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-3 text-slate-900 font-sans text-[11px] leading-tight" style={{ width: '277mm' }}>
                            {/* Header - Same as Model 25 */}
                            <div className="border border-slate-400 p-2 mb-1 flex justify-between items-center">
                                <div className="w-20 h-12 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo Representação"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-slate-400">[Logo Rep]</span>
                                    )}
                                </div>
                                <div className="text-center flex-1 px-2">
                                    <div className="font-bold text-[12px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div className="text-[9px]">CNPJ: {companyData?.cnpj || '-'}</div>
                                    <div className="text-[9px]">End: {companyData?.endereco} {companyData?.bairro}</div>
                                    <div className="text-[9px]">Fones: {companyData?.fones || '-'}</div>
                                </div>
                                <div className="w-20 h-12 border border-slate-300 flex items-center justify-center bg-slate-50 text-[10px] text-slate-400">
                                    {order.for_nomered || '[Logo Ind]'}
                                </div>
                            </div>

                            {/* Industry Name Bar */}
                            <div className="bg-blue-800 text-white text-center py-0.5 font-bold text-[12px] mb-1">
                                {order.for_nome || 'INDÚSTRIA'}
                            </div>

                            {/* Order Info Bar */}
                            <div className="border border-slate-400 p-1 mb-1 grid grid-cols-6 gap-1 text-[10px]">
                                <div><span className="text-slate-500">Cotação nº:</span> {order.ped_pedido}</div>
                                <div><span className="text-slate-500">Nº pedido cliente:</span> {order.ped_nffat || '-'}</div>
                                <div className="text-right"><span className="text-slate-500">Lista:</span> <span className="text-blue-700 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                                <div><span className="text-slate-500">Data:</span> {fd(order.ped_data)}</div>
                                <div><span className="text-slate-500">Cond. Pagamento:</span> <span className="text-blue-700 font-bold">{order.ped_condpag || '-'}</span></div>
                                <div className="text-right"><span className="text-slate-500">Frete:</span> <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                            </div>


                            {/* DADOS DO CLIENTE */}
                            <div className="mb-1">
                                <div className="bg-slate-200 border border-slate-400 text-center font-bold text-[10px] py-0.5">DADOS DO CLIENTE</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                        <div></div>
                                        <div><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                        <div></div>
                                        <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                        <div className="text-right"><span className="text-slate-500">Cx. postal:</span> <span className="text-blue-600 underline">{order.cli_cxpostal || '-'}</span></div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Cep:</span> {order.cli_cep}</span>
                                            <span><span className="text-slate-500">Estado:</span> {order.cli_uf}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Suframa:</span> <span className="text-blue-600 underline">{order.cli_suframa || '-'}</span></span>
                                        </div>
                                        <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                        <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                        <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                        <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                        <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                        <div><span className="text-slate-500">E-mail:</span> {order.ped_emailcomp || '-'}</div>
                                        <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> <span className="text-blue-600 underline">{order.cli_emailnfe || order.cli_email || '-'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="mb-1">
                                <div className="bg-slate-200 border border-slate-400 text-center font-bold text-[10px] py-0.5">DADOS PARA COBRANÇA</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep}</span>
                                            <span><span className="text-slate-500">UF:</span> {order.cli_ufcob || order.cli_uf}</span>
                                        </div>
                                        <div className="col-span-2"><span className="text-slate-500 text-red-600">E-Mail financeiro:</span> <span className="text-blue-600 underline">{order.cli_emailfinanc || '-'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="mb-1">
                                <div className="bg-slate-200 border border-slate-400 text-center font-bold text-[10px] py-0.5">TRANSPORTADORA</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                        <div></div>
                                        <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                        <div className="flex gap-4">
                                            <span><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'}</span>
                                            <span><span className="text-slate-500">UF:</span> {order.tra_uf || '-'}</span>
                                        </div>
                                        <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                        <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                        <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                        <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                    </div>
                                </div>
                            </div>


                            {/* ITEMS - Grouped by Discount with Tax Details */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => {
                                // Get product group from first item
                                const productGroup = groupItems[0]?.ite_grupo || groupItems[0]?.gru_descricao || '';

                                return (
                                    <div key={groupIndex} className="mb-2">
                                        {/* Discount Header with Product Group */}
                                        <div className="bg-slate-200 border border-slate-400 px-1 py-0.5 text-[10px] font-bold flex justify-between">
                                            <span>Descontos: {discountKey}</span>
                                            {productGroup && <span>Grupo: {productGroup}</span>}
                                        </div>
                                        {/* Items Table */}
                                        <table className="w-full border-collapse text-[10px]">
                                            <thead>
                                                <tr className="bg-slate-200 text-[9px] font-bold text-slate-600">
                                                    <th className="border border-slate-400 p-0.5 text-center" style={{ width: '25px' }}>Sq</th>
                                                    <th className="border border-slate-400 p-0.5 text-left text-red-600" style={{ width: '70px' }}>Produto</th>
                                                    <th className="border border-slate-400 p-0.5 text-left">Descrição do produto</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '50px' }}>Quant</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '60px' }}>Un.Bruto</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '60px' }}>Un.líquido</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '75px' }}>Unit c/Imposto</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '80px' }}>Tot c/Imposto</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '45px' }}>IPI</th>
                                                    <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '45px' }}>ST</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupItems.map((item, idx) => {
                                                    globalSeq++;
                                                    const unitImposto = (parseFloat(item.ite_puniliq) || 0) + (parseFloat(item.ite_ipi) || 0) + (parseFloat(item.ite_st) || 0);
                                                    const totImposto = (parseFloat(item.ite_totliquido) || 0) + (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0);
                                                    return (
                                                        <tr key={idx} className="bg-white">
                                                            <td className="border border-slate-300 p-0.5 text-center text-blue-600">{globalSeq}</td>
                                                            <td className="border border-slate-300 p-0.5 text-red-600 font-bold">{item.ite_produto}</td>
                                                            <td className="border border-slate-300 p-0.5 uppercase">{item.ite_nomeprod}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right font-bold">{item.ite_quant}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_puni)}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_puniliq)}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right">{fv(unitImposto)}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right font-bold">{fv(totImposto)}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_ipi || 0)}</td>
                                                            <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_st || 0)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                {(() => {
                                                    const groupQtd = groupItems.reduce((a, i) => a + (parseInt(i.ite_quant) || 0), 0);
                                                    const groupBruto = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puni) || 0), 0);
                                                    const groupLiq = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0);
                                                    const groupIPI = groupItems.reduce((a, i) => a + (parseFloat(i.ite_ipi) || 0) * (parseInt(i.ite_quant) || 0), 0);
                                                    const groupST = groupItems.reduce((a, i) => a + (parseFloat(i.ite_st) || 0) * (parseInt(i.ite_quant) || 0), 0);
                                                    const groupTotLiquido = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                    const groupTotImposto = groupTotLiquido + groupIPI + groupST;
                                                    return (
                                                        <tr className="bg-slate-100 font-bold">
                                                            <td colSpan="3" className="border border-slate-400 p-0.5"></td>
                                                            <td className="border border-slate-400 p-0.5 text-right">{groupQtd}</td>
                                                            <td className="border border-slate-400 p-0.5 text-right">{fv(groupBruto)}</td>
                                                            <td className="border border-slate-400 p-0.5 text-right">{fv(groupLiq)}</td>
                                                            <td className="border border-slate-400 p-0.5 text-right"></td>
                                                            <td className="border border-slate-400 p-0.5 text-right">{fv(groupTotImposto)}</td>
                                                            <td className="border border-slate-400 p-0.5 text-right"></td>
                                                            <td className="border border-slate-400 p-0.5 text-right"></td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tfoot>
                                        </table>
                                    </div>
                                );
                            })}


                            {/* Grand Total */}
                            <table className="w-full border-collapse text-[10px] mt-1">
                                <tfoot>
                                    <tr className="bg-slate-200 font-bold">
                                        <td colSpan="3" className="border border-slate-400 p-0.5 text-right">TOTAL GERAL:</td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '50px' }}>{totalQuantidade}</td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '60px' }}>{fv(items.reduce((a, i) => a + parseFloat(i.ite_puni || 0), 0))}</td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '60px' }}>{fv(items.reduce((a, i) => a + parseFloat(i.ite_puniliq || 0), 0))}</td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '75px' }}></td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '80px' }}>{fv(totalComImpostos)}</td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '45px' }}></td>
                                        <td className="border border-slate-400 p-0.5 text-right" style={{ width: '45px' }}></td>
                                    </tr>
                                </tfoot>
                            </table>


                            {/* Footer - Totals and Observations */}
                            <div className="mt-2 flex gap-2">
                                <div className="border border-slate-400 p-1 text-[10px] flex-1">
                                    <table className="w-full">
                                        <tbody>
                                            <tr className="border-b border-slate-200">
                                                <td className="py-0.5">Total bruto:</td>
                                                <td className="py-0.5 text-right font-bold">{fv(totalBruto)}</td>
                                                <td className="py-0.5 pl-4">Qtd. Itens:</td>
                                                <td className="py-0.5 text-right font-bold">{items.length}</td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <td className="py-0.5">Total líquido:</td>
                                                <td className="py-0.5 text-right font-bold">{fv(totalLiquido)}</td>
                                                <td className="py-0.5 pl-4">Qtd. Total:</td>
                                                <td className="py-0.5 text-right font-bold">{totalQuantidade}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-0.5">Total c/ Impostos:</td>
                                                <td className="py-0.5 text-right font-bold">{fv(totalComImpostos)}</td>
                                                <td className="py-0.5 pl-4">Vendedor:</td>
                                                <td className="py-0.5 text-right font-bold text-red-600 uppercase">{order.ven_nome}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border border-slate-400 p-1 text-[10px] w-1/3 min-h-[60px]">
                                    <div className="text-center font-bold text-[9px] text-slate-500 uppercase border-b border-slate-200 mb-1">OBSERVAÇÕES GERAIS</div>
                                    <div className="leading-tight">
                                        {order.ped_obs || order.cli_obspedido || order.cli_obsparticular || '-'}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right mt-2 text-[10px]">Página: 1</div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 27 - Reduced layout with only client data in header
    if (model === '27') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-3 text-slate-900 font-sans text-[11px] leading-tight" style={{ width: '277mm' }}>
                            {/* Header - Representative Company */}
                            <div className="border border-slate-400 p-2 mb-1 flex items-center gap-4">
                                <div className="w-16 h-12 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo Representação"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="text-center flex-1">
                                    <div className="font-bold text-[11px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div className="text-[9px]">CNPJ: {companyData?.cnpj || '-'}</div>
                                    <div className="text-[9px]">End: {companyData?.endereco} {companyData?.bairro}</div>
                                    <div className="text-[9px]">Fones: {companyData?.fones || '-'}</div>
                                </div>
                            </div>

                            {/* Industry Name */}
                            <div className="border border-slate-400 text-center py-0.5 font-bold text-[11px] mb-1">
                                {order.for_nome || 'INDÚSTRIA'}
                            </div>

                            {/* Order Info Bar with Vendedor */}
                            <div className="border border-slate-400 p-1 mb-1 grid grid-cols-7 gap-1 text-[10px]">
                                <div>Cotação nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Nº pedido cliente: {order.ped_nffat || '-'}</div>
                                <div>Lista: <span className="text-blue-700 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                                <div>Vendedor: <span className="font-bold">{order.ven_nome}</span></div>
                                <div>Data: {fd(order.ped_data)}</div>
                                <div>Cond. Pagamento: <span className="font-bold">{order.ped_condpag || '-'}</span></div>
                                <div className="text-right">Frete: <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE - Only */}
                            <div className="mb-1">
                                <div className="bg-yellow-100 border border-slate-400 text-center font-bold text-[10px] py-0.5">DADOS DO CLIENTE</div>
                                <div className="border border-slate-400 border-t-0 p-1 text-[10px]">
                                    <div className="grid grid-cols-3 gap-x-4">
                                        <div><span className="font-bold">CNPJ: {order.cli_cnpj}</span></div>
                                        <div>Inscrição: {order.cli_inscricao}</div>
                                        <div></div>
                                        <div className="col-span-3"><span className="text-slate-500">Razão social:</span> {order.cli_nome}</div>
                                        <div className="col-span-3"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                        <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                        <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                        <div><span className="text-slate-500">Cx.postal:</span> {order.cli_cxpostal || '-'}</div>
                                        <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                        <div><span className="text-slate-500">Cep:</span> {order.cli_cep} / {order.cli_uf}</div>
                                        <div><span className="text-slate-500">Suframa:</span> <span className="text-blue-600">{order.cli_suframa || '-'}</span></div>
                                        <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                        <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                        <div></div>
                                        <div className="col-span-2"><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'} <span className="text-slate-500">E-mail:</span> {order.ped_emailcomp || '-'}</div>
                                        <div></div>
                                        <div><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || '-'}</div>
                                        <div><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                        <div></div>
                                    </div>
                                </div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-2">
                                    {/* Discount Header */}
                                    <div className="bg-yellow-100 border border-slate-400 px-1 py-0.5 text-[10px] font-bold">
                                        Descontos: {discountKey}
                                    </div>

                                    {/* Items Table */}
                                    <table className="w-full border-collapse text-[10px]">
                                        <thead>
                                            <tr className="bg-yellow-100 text-[9px] font-bold">
                                                <th className="border border-slate-400 p-0.5 text-center" style={{ width: '20px' }}>Sq</th>
                                                <th className="border border-slate-400 p-0.5 text-left text-red-600" style={{ width: '60px' }}>Produto</th>
                                                <th className="border border-slate-400 p-0.5 text-left" style={{ width: '80px' }}>Complemento</th>
                                                <th className="border border-slate-400 p-0.5 text-center" style={{ width: '55px' }}>Nº pedido</th>
                                                <th className="border border-slate-400 p-0.5 text-left">Descrição do produto</th>
                                                <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '45px' }}>Quant</th>
                                                <th className="border border-slate-400 p-0.5 text-right" style={{ width: '55px' }}>Bruto</th>
                                                <th className="border border-slate-400 p-0.5 text-right" style={{ width: '55px' }}>Líquido</th>
                                                <th className="border border-slate-400 p-0.5 text-right" style={{ width: '65px' }}>C/Imposto</th>
                                                <th className="border border-slate-400 p-0.5 text-right font-bold" style={{ width: '70px' }}>Total</th>
                                                <th className="border border-slate-400 p-0.5 text-right" style={{ width: '35px' }}>IPI</th>
                                                <th className="border border-slate-400 p-0.5 text-right" style={{ width: '35px' }}>ST</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                const unitImposto = (parseFloat(item.ite_puniliq) || 0) + (parseFloat(item.ite_ipi) || 0) + (parseFloat(item.ite_st) || 0);
                                                const totImposto = (parseFloat(item.ite_totliquido) || 0) + (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0);
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-0.5 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-0.5 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-0.5">{item.ite_embuch || '-'}</td>
                                                        <td className="border border-slate-300 p-0.5 text-center">{order.ped_nffat || '-'}</td>
                                                        <td className="border border-slate-300 p-0.5 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right font-bold text-blue-600">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_puni)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(unitImposto)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right font-bold">{fv(totImposto)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-100 font-bold">
                                                <td colSpan="5" className="border border-slate-400 p-0.5"></td>
                                                <td className="border border-slate-400 p-0.5 text-right">{groupItems.reduce((a, i) => a + (parseInt(i.ite_quant) || 0), 0)}</td>
                                                <td className="border border-slate-400 p-0.5 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_puni) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-0.5 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-0.5 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0) + (parseFloat(i.ite_ipi) || 0) + (parseFloat(i.ite_st) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-0.5 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-0.5 text-right"></td>
                                                <td className="border border-slate-400 p-0.5 text-right"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Totals and Transportadora side by side */}
                            <div className="flex gap-2 mt-2">
                                {/* Totals Box */}
                                <div className="border border-slate-400">
                                    <table className="text-[10px]">
                                        <thead>
                                            <tr className="bg-slate-200">
                                                <th className="border border-slate-300 p-1">Total bruto</th>
                                                <th className="border border-slate-300 p-1">Total</th>
                                                <th className="border border-slate-300 p-1">Com Impostos</th>
                                                <th className="border border-slate-300 p-1">Nº ítens</th>
                                                <th className="border border-slate-300 p-1">Qtd total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="font-bold">
                                                <td className="border border-slate-300 p-1 text-right">{fv(totalBruto)}</td>
                                                <td className="border border-slate-300 p-1 text-right">{fv(totalLiquido)}</td>
                                                <td className="border border-slate-300 p-1 text-right">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                                <td className="border border-slate-300 p-1 text-center">{items.length}</td>
                                                <td className="border border-slate-300 p-1 text-center">{totalQuantidade}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    {/* Observations */}
                                    <div className="bg-slate-200 text-center font-bold text-[10px] py-0.5 border-t border-slate-400">OBSERVAÇÕES GERAIS</div>
                                    <div className="p-1 text-[10px] min-h-[40px]">{order.ped_obs || '-'}</div>
                                </div>

                                {/* Transportadora Box */}
                                <div className="border border-slate-400 flex-1">
                                    <div className="bg-slate-200 text-center font-bold text-[10px] py-0.5">TRANSPORTADORA</div>
                                    <div className="p-1 text-[10px]">
                                        <div><span className="font-bold">CNPJ:</span> {order.tra_cgc || '-'} <span className="font-bold">Inscrição</span> {order.tra_inscricao || '-'}</div>
                                        <div><span className="font-bold">Nome:</span> {order.tra_nome || '-'}</div>
                                        <div><span className="font-bold">Fone:</span> {order.tra_fone || '-'}</div>
                                        <div><span className="font-bold">E-Mail:</span> {order.tra_email || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right mt-2 text-[10px]">Página: 1</div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 28 - Minimal client data (Razão social + Comprador only)
    if (model === '28') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[15px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Representative Company */}
                            <div className="border border-slate-400 p-2 mb-1 flex items-center gap-4">
                                <div className="w-16 h-12 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo Representação"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[13px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="text-center flex-1">
                                    <div className="font-bold text-base">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div className="text-[13px]">CNPJ: {companyData?.cnpj || '-'}</div>
                                    <div className="text-[13px]">Fones: {companyData?.fones || '-'}</div>
                                    <div className="text-[13px]">E-mail: {companyData?.email || '/'}</div>
                                </div>
                            </div>

                            {/* Industry Name */}
                            <div className="border border-slate-400 text-center py-1 font-bold text-base mb-2">
                                {order.for_nome || 'INDÚSTRIA'}
                            </div>

                            {/* Order Info Bar */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-6 gap-2 text-[15px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Nº pedido cliente: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Lista: <span className="text-blue-700 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                                <div>Data: {fd(order.ped_data)}</div>
                                <div>Cond. Pagamento: <span className="text-blue-700 font-bold">{order.ped_condpag || '-'}</span></div>
                                <div className="text-right">Frete: <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE - MINIMAL (Only Razão social and Comprador) */}
                            <div className="mb-1">
                                <div className="bg-yellow-100 border border-slate-400 text-center font-bold text-[15px] py-1">DADOS DO CLIENTE</div>
                                <div className="border border-slate-400 border-t-0 p-2 text-[15px]">
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <div><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                        <div></div>
                                        <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'} <span className="text-slate-500">E-mail:</span> {order.ped_emailcomp || '-'}</div>
                                        <div></div>
                                    </div>
                                </div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-2">
                                    {/* Discount Header */}
                                    <div className="bg-slate-200 border border-slate-400 px-2 py-1 text-[15px] font-bold">
                                        Descontos: {discountKey}
                                    </div>

                                    {/* Items Table */}
                                    <table className="w-full border-collapse text-[15px]">
                                        <thead>
                                            <tr className="bg-slate-200 text-[13px] font-bold">
                                                <th className="border border-slate-400 p-0.5 text-center" style={{ width: '20px' }}>Sq:</th>
                                                <th className="border border-slate-400 p-0.5 text-left text-red-600" style={{ width: '65px' }}>Produto</th>
                                                <th className="border border-slate-400 p-0.5 text-left text-blue-600" style={{ width: '90px' }}>Cod. orig/Conv./Comp</th>
                                                <th className="border border-slate-400 p-0.5 text-left">Descrição do produto</th>
                                                <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '40px' }}>Quant</th>
                                                <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '55px' }}>Un.Bruto</th>
                                                <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '55px' }}>Un.líquido</th>
                                                <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '65px' }}>Total lqdo</th>
                                                <th className="border border-slate-400 p-0.5 text-right text-blue-600" style={{ width: '35px' }}>IPI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-0.5 text-center text-blue-600">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-0.5 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-0.5 text-slate-500">{item.ite_embuch || '-'}</td>
                                                        <td className="border border-slate-300 p-0.5 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_puni)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-0.5 text-right text-blue-600">{fv(item.ite_ipi || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupQtd = groupItems.reduce((a, i) => a + (parseInt(i.ite_quant) || 0), 0);
                                                const groupBruto = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puni) || 0), 0);
                                                const groupLiq = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0);
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td colSpan="4" className="border border-slate-400 p-0.5"></td>
                                                        <td className="border border-slate-400 p-0.5 text-right">{groupQtd}</td>
                                                        <td className="border border-slate-400 p-0.5 text-right">{fv(groupBruto)}</td>
                                                        <td className="border border-slate-400 p-0.5 text-right">{fv(groupLiq)}</td>
                                                        <td className="border border-slate-400 p-0.5 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-0.5 text-right"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Grand Total Row */}
                            <div className="border border-slate-400 bg-slate-200 grid grid-cols-12 text-[15px] font-bold mt-2">
                                <div className="col-span-7 p-0.5"></div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{totalQuantidade}</div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(items.reduce((a, i) => a + parseFloat(i.ite_puni || 0), 0))}</div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(items.reduce((a, i) => a + parseFloat(i.ite_puniliq || 0), 0))}</div>
                                <div className="col-span-1 p-0.5 border-r border-slate-300 text-right">{fv(totalLiquido)}</div>
                                <div className="col-span-1 p-0.5 text-right"></div>
                            </div>

                            {/* Footer - Totals Box */}
                            <div className="flex gap-2 mt-2">
                                <div className="border border-slate-400">
                                    <table className="text-[15px]">
                                        <thead>
                                            <tr className="bg-slate-200">
                                                <th className="border border-slate-300 p-2">Total bruto</th>
                                                <th className="border border-slate-300 p-2">Total</th>
                                                <th className="border border-slate-300 p-2">Com Impostos</th>
                                                <th className="border border-slate-300 p-2">Nº ítens</th>
                                                <th className="border border-slate-300 p-2">Qtd total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="font-bold">
                                                <td className="border border-slate-300 p-2 text-right">{fv(totalBruto)}</td>
                                                <td className="border border-slate-300 p-2 text-right">{fv(totalLiquido)}</td>
                                                <td className="border border-slate-300 p-2 text-right">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                                <td className="border border-slate-300 p-2 text-center">{items.length}</td>
                                                <td className="border border-slate-300 p-2 text-center">{totalQuantidade}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    {/* Observations */}
                                    <div className="bg-slate-200 text-center font-bold text-[15px] py-1 border-t border-slate-400">OBSERVAÇÕES GERAIS</div>
                                    <div className="p-2 text-[15px] min-h-[50px]">{order.ped_obs || '-'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 1 - Complete Delphi-style layout
    if (model === '1') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '180mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry + List */}
                            <div className="border border-slate-400 p-2 mb-2 flex justify-between text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                                <div>Lista: <span className="text-blue-600 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE - Yellow background */}
                            <div className="bg-yellow-100 border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div><span className="text-slate-500">Frete:</span> <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos: {discountKey}
                                    </div>

                                    {/* Items Table */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.Bruto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puni)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupQtd = groupItems.reduce((a, i) => a + (parseInt(i.ite_quant) || 0), 0);
                                                const groupBruto = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puni) || 0), 0);
                                                const groupLiq = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0);
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="2">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1" colSpan="2"></td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupBruto)}</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupLiq)}</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Totals */}
                            <div className="border border-slate-400 p-1 mt-3 text-[11px]">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-slate-200">
                                            <td className="py-0.5">Total bruto:</td>
                                            <td className="py-0.5 text-right font-bold">{fv(totalBruto)}</td>
                                            <td className="py-0.5 pl-8">Quantidade de itens no pedido:</td>
                                            <td className="py-0.5 text-right font-bold">{items.length}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200">
                                            <td className="py-0.5">Total líquido:</td>
                                            <td className="py-0.5 text-right font-bold">{fv(totalLiquido)}</td>
                                            <td className="py-0.5 pl-8">Qtd total:</td>
                                            <td className="py-0.5 text-right font-bold">{totalQuantidade}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-0.5">Total c/ Impostos:</td>
                                            <td className="py-0.5 text-right font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                            <td className="py-0.5 pl-8">Vendedor:</td>
                                            <td className="py-0.5 text-right font-bold text-red-600 uppercase">{order.ven_nome}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 2 - Like Model 1 but with Unit c/IPI, Total c/IPI, % IPI, % ST columns
    if (model === '2') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry + List */}
                            <div className="border border-slate-400 p-2 mb-2 flex justify-between text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                                <div>Lista: <span className="text-blue-600 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE - Yellow background */}
                            <div className="bg-yellow-100 border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Model 2 specific columns */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '70px' }}>Unit c/IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '75px' }}>Total c/IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '40px' }}>% IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '40px' }}>% ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                const unitComIPI = (parseFloat(item.ite_puniliq) || 0) + (parseFloat(item.ite_ipi) || 0) + (parseFloat(item.ite_st) || 0);
                                                const totalComIPI = (parseFloat(item.ite_totliquido) || 0) + (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0);
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(unitComIPI)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(totalComIPI)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupTotalComIPI = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="4">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotalComIPI)}</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Totals (Model 2 specific layout) */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-slate-500">Observações complementares:</span>
                                    </div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 3 - Like Model 1 but with Complemento (ite_embuch), Conversão columns
    if (model === '3') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry + List */}
                            <div className="border border-slate-400 p-2 mb-2 flex justify-between text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                                <div>Lista: <span className="text-blue-600 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE - Yellow background */}
                            <div className="bg-yellow-100 border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos: {discountKey}
                                    </div>

                                    {/* Items Table - Model 3 specific columns */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '30px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '65px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Complemento:</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Conversão:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1">{item.ite_embuch || '-'}</td>
                                                        <td className="border border-slate-300 p-1">{item.ite_conversao || '-'}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupLiq = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0);
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="4">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupLiq)}</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Totals */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 4 - Like Model 3 with "Descontos praticados nos itens abaixo:" header
    if (model === '4') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry + List */}
                            <div className="border border-slate-400 p-2 mb-2 flex justify-between text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                                <div>Lista: <span className="text-blue-600 font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE - Yellow background */}
                            <div className="bg-yellow-100 border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow - Model 4 specific text */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Model 4 columns */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '30px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '65px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Complemento:</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Conversão:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1">{item.ite_embuch || '-'}</td>
                                                        <td className="border border-slate-300 p-1">{item.ite_conversao || '-'}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupLiq = groupItems.reduce((a, i) => a + (parseFloat(i.ite_puniliq) || 0), 0);
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="4">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupLiq)}</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Totals */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 5 - Simplified without billing/carrier, simple footer
    if (model === '5') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-center text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>CNPJ: {companyData?.cnpj || '-'}</div>
                                    <div>End: {companyData?.endereco} {companyData?.bairro} {companyData?.cidade}/{companyData?.uf}</div>
                                    <div>Fones: {companyData?.fones || '-'}</div>
                                    <div>E-mail: {companyData?.email || '-'}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE ONLY - No billing/carrier */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.Bruto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puni)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="6">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Simple row with totals */}
                            <div className="border border-slate-400 mt-3">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="bg-slate-200">
                                            <th className="border border-slate-300 p-1">Total líquido</th>
                                            <th className="border border-slate-300 p-1">Qtd peças</th>
                                            <th className="border border-slate-300 p-1">Qtd de itens no pedido</th>
                                            <th className="border border-slate-300 p-1">Peso total</th>
                                            <th className="border border-slate-300 p-1">Total c/ Impostos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="font-bold text-center">
                                            <td className="border border-slate-300 p-1">{fv(totalLiquido)}</td>
                                            <td className="border border-slate-300 p-1">{totalQuantidade}</td>
                                            <td className="border border-slate-300 p-1">{items.length}</td>
                                            <td className="border border-slate-300 p-1">0</td>
                                            <td className="border border-slate-300 p-1">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 6 - Like Model 3 with Conversão, client/billing, simplified info section, simple footer
    if (model === '6') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-center text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>CNPJ: {companyData?.cnpj || '-'}</div>
                                    <div>End: {companyData?.endereco} {companyData?.bairro} {companyData?.cidade}/{companyData?.uf}</div>
                                    <div>Fones: {companyData?.fones || '-'}</div>
                                    <div>E-mail: {companyData?.email || '-'}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* INFORMAÇÕES */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">INFORMAÇÕES</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Tipo frete:</span> <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Transportadora:</span> {order.tra_nome || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items grouped by discount */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Model 6 columns with Conversão */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Conversão:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1">{item.ite_conversao || '-'}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="5">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                        <td className="border border-slate-400 p-1"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Simple row with totals */}
                            <div className="border border-slate-400 mt-3">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="bg-slate-200">
                                            <th className="border border-slate-300 p-1">Total líquido</th>
                                            <th className="border border-slate-300 p-1">Qtd peças</th>
                                            <th className="border border-slate-300 p-1">Qtd cxs</th>
                                            <th className="border border-slate-300 p-1">Qtd de itens</th>
                                            <th className="border border-slate-300 p-1">Peso total</th>
                                            <th className="border border-slate-300 p-1">Total c/ Impostos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="font-bold text-center">
                                            <td className="border border-slate-300 p-1">{fv(totalLiquido)}</td>
                                            <td className="border border-slate-300 p-1">{totalQuantidade}</td>
                                            <td className="border border-slate-300 p-1">0</td>
                                            <td className="border border-slate-300 p-1">{items.length}</td>
                                            <td className="border border-slate-300 p-1">0</td>
                                            <td className="border border-slate-300 p-1">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 7 - No discount grouping, single items table with Categoria (ite_embuch), simple footer
    if (model === '7') {
        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* INFORMAÇÕES */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">INFORMAÇÕES</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Tipo frete:</span> <span className="text-red-600 font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : 'FRETE CIF'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Transportadora:</span> {order.tra_nome || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table - NO discount grouping */}
                            <table className="w-full border-collapse text-[12px] mb-3">
                                <thead>
                                    <tr className="bg-yellow-100 font-bold">
                                        <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                        <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Categoria:</th>
                                        <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                                            <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                            <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                            <td className="border border-slate-300 p-1">{item.ite_embuch || '-'}</td>
                                            <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                            <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-bold">
                                        <td className="border border-slate-400 p-1 text-right" colSpan="5">Sub-total:</td>
                                        <td className="border border-slate-400 p-1"></td>
                                        <td className="border border-slate-400 p-1 text-right">{fv(totalLiquido)}</td>
                                        <td className="border border-slate-400 p-1"></td>
                                        <td className="border border-slate-400 p-1"></td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Footer - Simple row with totals */}
                            <div className="border border-slate-400 mt-3">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="bg-slate-200">
                                            <th className="border border-slate-300 p-1">Total líquido</th>
                                            <th className="border border-slate-300 p-1">Qtd peças</th>
                                            <th className="border border-slate-300 p-1">Qtd de itens no pedido</th>
                                            <th className="border border-slate-300 p-1">Peso total</th>
                                            <th className="border border-slate-300 p-1">Total c/ Impostos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="font-bold text-center">
                                            <td className="border border-slate-300 p-1">{fv(totalLiquido)}</td>
                                            <td className="border border-slate-300 p-1">{totalQuantidade}</td>
                                            <td className="border border-slate-300 p-1">{items.length}</td>
                                            <td className="border border-slate-300 p-1">0</td>
                                            <td className="border border-slate-300 p-1">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 10 - No discount grouping, Complemento/Conversão/Un.Bruto, no IPI/ST
    if (model === '10') {
        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table - NO discount grouping, Model 10 specific columns */}
                            <table className="w-full border-collapse text-[12px] mb-3">
                                <thead>
                                    <tr className="bg-yellow-100 font-bold">
                                        <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Complemento:</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Conversão:</th>
                                        <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.Bruto:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '70px' }}>Total lqdo:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                            <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                            <td className="border border-slate-300 p-1">{item.ite_embuch || '-'}</td>
                                            <td className="border border-slate-300 p-1">{item.ite_conversao || '-'}</td>
                                            <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puni)}</td>
                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                            <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-bold">
                                        <td className="border border-slate-400 p-1 text-right" colSpan="6">Sub-total:</td>
                                        <td className="border border-slate-400 p-1"></td>
                                        <td className="border border-slate-400 p-1 text-right">{fv(totalLiquido)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Footer - Simple with Vendedor */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                    <div></div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-slate-500">Observações complementares:</span>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 11 - No discount grouping, Unitário/Un.c/IPI/Total/Total c/IPI columns + ST
    if (model === '11') {
        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ/CPF:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table - NO discount grouping, Model 11 specific columns */}
                            <table className="w-full border-collapse text-[11px] mb-3">
                                <thead>
                                    <tr className="bg-yellow-100 font-bold">
                                        <th className="border border-slate-400 p-1 text-center" style={{ width: '30px' }}>Quant</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '65px' }}>Produto:</th>
                                        <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '55px' }}>Unitário:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '55px' }}>Un.c/IPI:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Total:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Total c/IPI:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '30px' }}>IPI:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '30px' }}>ST:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const unitarioComIpi = (parseFloat(item.ite_puniliq) || 0) + (parseFloat(item.ite_ipi) || 0) + (parseFloat(item.ite_st) || 0);
                                        const totalComIpi = (parseFloat(item.ite_totliquido) || 0) + (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0);
                                        return (
                                            <tr key={idx}>
                                                <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                <td className="border border-slate-300 p-1 text-right">{fv(unitarioComIpi)}</td>
                                                <td className="border border-slate-300 p-1 text-right">{fv(item.ite_totliquido)}</td>
                                                <td className="border border-slate-300 p-1 text-right font-bold">{fv(totalComIpi)}</td>
                                                <td className="border border-slate-300 p-1 text-right">{item.ite_ipi || 0}</td>
                                                <td className="border border-slate-300 p-1 text-right">{item.ite_st || 0}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    {(() => {
                                        const totalSemImp = items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                        const totalComImp = items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0);
                                        return (
                                            <tr className="bg-slate-100 font-bold">
                                                <td className="border border-slate-400 p-1 text-right" colSpan="5">Sub-total:</td>
                                                <td className="border border-slate-400 p-1 text-right">{fv(totalSemImp)}</td>
                                                <td className="border border-slate-400 p-1 text-right">{fv(totalComImp)}</td>
                                                <td className="border border-slate-400 p-1"></td>
                                                <td className="border border-slate-400 p-1"></td>
                                            </tr>
                                        );
                                    })()}
                                </tfoot>
                            </table>

                            {/* Footer - Simple */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }
    // Model 12 - Two-row layout per item with PRO_APLICACAO2 field below each item
    if (model === '12') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || order.cli_cep} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Two rows per item */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.Bruto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <React.Fragment key={idx}>
                                                        {/* Row 1 - Item Data */}
                                                        <tr>
                                                            <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                            <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                            <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                            <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puni)}</td>
                                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                            <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_ipi || 0)}</td>
                                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_st || 0)}</td>
                                                        </tr>
                                                        {/* Row 2 - Application Info (PRO_APLICACAO2) */}
                                                        {item.pro_aplicacao2 && (
                                                            <tr className="bg-slate-50">
                                                                <td className="border-x border-b border-slate-200 p-1" colSpan="9">
                                                                    <span className="text-slate-400 text-[10px] mr-1">Aplicação:</span>
                                                                    <span className="text-[11px] italic text-slate-600">{item.pro_aplicacao2}</span>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                const groupTotalComImp = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0);
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="6">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="2">{fv(groupTotalComImp)}</td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - With Vendedor */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                    <div></div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-slate-500">Observações complementares:</span>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 13 - Black & White layout, no colors, simple footer, with %ST
    if (model === '13') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-black font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-black p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-black flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px]">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-black p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-black p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-black p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2">Razão social: <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2">Endereço: {order.cli_endereco}</div>
                                    <div>Complemento: {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div>Bairro: {order.cli_bairro}</div>
                                    <div>Cidade: {order.cli_cidade}</div>
                                    <div>Cep: {order.cli_cep}</div>
                                    <div>Estado: {order.cli_uf}</div>
                                    <div>CNPJ: {order.cli_cnpj}</div>
                                    <div>Inscrição: {order.cli_inscricao}</div>
                                    <div>Fone: {order.cli_fone1}</div>
                                    <div>Fax: {order.cli_fone2 || '-'}</div>
                                    <div>Comprador: {order.ped_comprador || '-'}</div>
                                    <div>E-Mail: {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2">E-Mail NFe: {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div>Suframa: {order.cli_suframa || '-'}</div>
                                    <div>Cx.Postal: {order.cli_cxpostal || '-'}</div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-black mb-2">
                                <div className="border-b border-black px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div>Endereço: {order.cli_endcob || order.cli_endereco}</div>
                                    <div>Bairro: {order.cli_baicob || order.cli_bairro}</div>
                                    <div>Cidade: {order.cli_cidcob || order.cli_cidade}</div>
                                    <div>Cep: {order.cli_cepcob || order.cli_cep} UF: {order.cli_ufcob || order.cli_uf}</div>
                                    <div className="col-span-2">E-Mail financeiro: {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* INFORMAÇÕES */}
                            <div className="border border-black mb-2">
                                <div className="border-b border-black px-2 py-0.5 text-[12px] font-bold text-center">INFORMAÇÕES</div>
                                <div className="p-2 text-[12px] grid grid-cols-3 gap-x-4 gap-y-0.5">
                                    <div>Condições pgto: <span className="font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div>Tipo frete: <span className="font-bold">{order.ped_tipofrete === 'F' ? 'FRETE FOB' : order.ped_tipofrete === 'S' ? 'FRETE CIF' : '-'}</span></div>
                                    <div></div>
                                    <div>Transportadora: <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div>Fone: {order.tra_fone || '-'}</div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-black mb-2">
                                <div className="border-b border-black px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header */}
                                    <div className="border border-black px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - B&W */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="font-bold">
                                                <th className="border border-black p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-black p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-black p-1 text-left" style={{ width: '65px' }}>Produto:</th>
                                                <th className="border border-black p-1 text-left" style={{ width: '70px' }}>Conversao:</th>
                                                <th className="border border-black p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-black p-1 text-right" style={{ width: '60px' }}>Un.líquido:</th>
                                                <th className="border border-black p-1 text-right" style={{ width: '65px' }}>Total lqdo:</th>
                                                <th className="border border-black p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-black p-1 text-right" style={{ width: '35px' }}>%ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-black p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-black p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-black p-1 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-black p-1">{item.ite_conversao || '-'}</td>
                                                        <td className="border border-black p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-black p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-black p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-black p-1 text-right">{item.ite_ipi || 0}</td>
                                                        <td className="border border-black p-1 text-right">{item.ite_st || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-bold">
                                                <td className="border border-black p-1 text-right" colSpan="6">Sub-total:</td>
                                                <td className="border border-black p-1 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0))}</td>
                                                <td className="border border-black p-1" colSpan="2"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Simple Table */}
                            <div className="mt-3">
                                <table className="w-full border-collapse text-[12px]">
                                    <thead>
                                        <tr className="font-bold">
                                            <th className="border border-black p-1">Total líquido</th>
                                            <th className="border border-black p-1">Qtd peças</th>
                                            <th className="border border-black p-1">Qtd de itens no pedido</th>
                                            <th className="border border-black p-1">Peso total</th>
                                            <th className="border border-black p-1">Total c/ Impostos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="font-bold text-center">
                                            <td className="border border-black p-1">{fv(totalLiquido)}</td>
                                            <td className="border border-black p-1">{totalQuantidade}</td>
                                            <td className="border border-black p-1">{items.length}</td>
                                            <td className="border border-black p-1">0</td>
                                            <td className="border border-black p-1">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-gray-500">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 14 - Shows tax VALUE per item (Impostos vls), not just percentage
    if (model === '14') {
        const groupedItems = groupItemsByDiscount(items);

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ/CPF:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Model 14 specific columns with tax VALUE */}
                                    <table className="w-full border-collapse text-[11px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '30px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '65px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '55px' }}>Unitário:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Total:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '55px' }}>Impostos (vls)</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Total c/imp:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '30px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '30px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                const valorImpostos = (parseFloat(item.ite_valipi) || 0) + (parseFloat(item.ite_valst) || 0);
                                                const totalComImp = (parseFloat(item.ite_totliquido) || 0) + valorImpostos;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(valorImpostos)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(totalComImp)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{item.ite_ipi || 0}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{item.ite_st || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const groupTotal = groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0);
                                                const groupImpostos = groupItems.reduce((a, i) => a + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0);
                                                const groupTotalComImp = groupTotal + groupImpostos;
                                                return (
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="border border-slate-400 p-1 text-right" colSpan="4">Sub-total:</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotal)}</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupImpostos)}</td>
                                                        <td className="border border-slate-400 p-1 text-right">{fv(groupTotalComImp)}</td>
                                                        <td className="border border-slate-400 p-1" colSpan="2"></td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Simple with totals */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 15 - No discount grouping, simple columns: Sq, Quant, Produto, Descrição, Un.líquido, Total lqdo, IPI, %ST
    if (model === '15') {
        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry + Lista */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px] flex justify-between">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                                <div>Lista: <span className="font-bold">{order.ped_tabela || 'LISTA ATUAL'}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA - Simplified */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || '-'}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table - NO discount grouping, simple columns */}
                            <table className="w-full border-collapse text-[12px] mb-3">
                                <thead>
                                    <tr className="bg-yellow-100 font-bold">
                                        <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                        <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                        <th className="border border-slate-400 p-1 text-left" style={{ width: '70px' }}>Produto:</th>
                                        <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '65px' }}>Un.líquido:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '70px' }}>Total lqdo:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                        <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>%ST:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                                            <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                            <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                            <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                            <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                            <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                            <td className="border border-slate-300 p-1 text-right">{item.ite_ipi || 0}</td>
                                            <td className="border border-slate-300 p-1 text-right">{item.ite_st || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 font-bold">
                                        <td className="border border-slate-400 p-1 text-right" colSpan="5">Sub-total:</td>
                                        <td className="border border-slate-400 p-1 text-right">{fv(totalLiquido)}</td>
                                        <td className="border border-slate-400 p-1" colSpan="2"></td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Footer - Simple with Vendedor */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 16 - WITH discount grouping, WITHOUT taxes columns (no IPI/ST)
    if (model === '16') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || '-'}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups - NO TAXES */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - NO IPI/ST columns */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '40px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '75px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '70px' }}>Un.Bruto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '70px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '80px' }}>Total lqdo:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puni)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-100 font-bold">
                                                <td className="border border-slate-400 p-1 text-right" colSpan="6">Sub-total:</td>
                                                <td className="border border-slate-400 p-1 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - With Vendedor and Obs */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-slate-500">Observações complementares:</span>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 17 - WITH discount grouping, Complemento column, Un.Bruto, IPI, ST
    if (model === '17') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;
        const totalBruto = items.reduce((a, i) => a + (parseFloat(i.ite_puni) * parseFloat(i.ite_quant) || 0), 0);

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || '-'}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups - With Compl. and IPI/ST */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - With Compl., Un.Bruto, IPI, ST */}
                                    <table className="w-full border-collapse text-[11px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '20px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '30px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '60px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '50px' }}>Compl.:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '55px' }}>Un.Bruto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '55px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '60px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '28px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '28px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 text-[10px]">{item.ite_embuch || '-'}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puni)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{item.ite_ipi || 0}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{item.ite_st || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-100 font-bold">
                                                <td className="border border-slate-400 p-1 text-right" colSpan="7">Sub-total:</td>
                                                <td className="border border-slate-400 p-1 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-1" colSpan="2"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - With Total Bruto and Vendedor */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total bruto:</span>
                                        <span className="font-bold">{fv(totalBruto)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-slate-500">Observações complementares:</span>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 20 - WITH discount grouping, simple columns (no Un.Bruto), IPI and ST
    if (model === '20') {
        const groupedItems = groupItemsByDiscount(items);
        let globalSeq = 0;

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* DADOS PARA COBRANÇA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">DADOS PARA COBRANÇA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Endereço:</span> {order.cli_endcob || order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_baicob || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidcob || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cepcob || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.cli_ufcob || '-'}</div>
                                    <div className="col-span-2"><span className="text-red-600">E-Mail financeiro:</span> {order.cli_emailfinanc || '-'}</div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups - Simple columns with IPI/ST */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header - Yellow */}
                                    <div className="bg-yellow-100 border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Simple columns, no Un.Bruto */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="bg-yellow-100 font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '25px' }}>Sq</th>
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '75px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '70px' }}>Un.líquido:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '80px' }}>Total lqdo:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => {
                                                globalSeq++;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="border border-slate-300 p-1 text-center">{globalSeq}</td>
                                                        <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                        <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                        <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{fv(item.ite_puniliq)}</td>
                                                        <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{item.ite_ipi || 0}</td>
                                                        <td className="border border-slate-300 p-1 text-right">{item.ite_st || 0}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-100 font-bold">
                                                <td className="border border-slate-400 p-1 text-right" colSpan="5">Sub-total:</td>
                                                <td className="border border-slate-400 p-1 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-1" colSpan="2"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Simple with Vendedor */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total c/ Impostos:</span>
                                        <span className="font-bold">{fv(items.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0) + (parseFloat(i.ite_valipi) || 0) + (parseFloat(i.ite_valst) || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vendedor:</span>
                                        <span className="font-bold text-red-600 uppercase">{order.ven_nome}</span>
                                    </div>
                                    <div></div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-slate-500">Observações complementares:</span>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Model 21 - WITH discount grouping, SUPER SIMPLE columns with Unitário (4 decimals), IPI, ST
    if (model === '21') {
        const groupedItems = groupItemsByDiscount(items);
        // Format value with 4 decimal places
        const fv4 = (v) => parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

        return (
            <>
                <PrintToolbar />
                <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-4 overflow-auto">
                    <div
                        className="bg-white shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <div className="print-container p-4 text-slate-900 font-sans text-[13px] leading-normal" style={{ width: '190mm' }}>
                            {/* Header - Company Logo and Info */}
                            <div className="border border-slate-400 p-2 mb-2 flex items-start gap-4">
                                <div className="w-20 h-16 border border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                    {companyData?.logotipo ? (
                                        <img
                                            src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyData.logotipo)}`)}
                                            alt="Logo"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[12px] text-slate-400">[Logo]</span>
                                    )}
                                </div>
                                <div className="flex-1 text-[12px]">
                                    <div className="font-bold text-[15px]">{companyData?.nome || 'REPRESENTAÇÃO'}</div>
                                    <div>{companyData?.endereco} {companyData?.bairro}</div>
                                    <div>{companyData?.cidade} {companyData?.uf} {companyData?.cep}</div>
                                    <div>{companyData?.fones}</div>
                                </div>
                            </div>

                            {/* Order Info Line */}
                            <div className="border border-slate-400 p-2 mb-2 grid grid-cols-3 gap-2 text-[13px]">
                                <div>Pedido nº: <span className="font-bold">{order.ped_pedido}</span></div>
                                <div>Pedido cliente nº: {order.ped_nffat || '-'}</div>
                                <div className="text-right">Data: <span className="font-bold">{fd(order.ped_data)}</span></div>
                            </div>

                            {/* Industry */}
                            <div className="border border-slate-400 p-2 mb-2 text-[13px]">
                                <div>Indústria: <span className="font-bold">{order.for_nome}</span></div>
                            </div>

                            {/* DADOS DO CLIENTE */}
                            <div className="border border-slate-400 p-2 mb-2 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div className="col-span-2"><span className="text-slate-500">Razão social:</span> <span className="font-bold">{order.cli_nome}</span></div>
                                    <div className="col-span-2"><span className="text-slate-500">Endereço:</span> {order.cli_endereco}</div>
                                    <div><span className="text-slate-500">Complemento:</span> {order.cli_complemento || '-'}</div>
                                    <div></div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.cli_bairro}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.cli_cidade}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.cli_cep}</div>
                                    <div><span className="text-slate-500">Estado:</span> {order.cli_uf}</div>
                                    <div><span className="text-slate-500">CNPJ/CPF:</span> {order.cli_cnpj}</div>
                                    <div><span className="text-slate-500">Inscrição:</span> {order.cli_inscricao}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.cli_fone1}</div>
                                    <div><span className="text-slate-500">Fax:</span> {order.cli_fone2 || '-'}</div>
                                    <div><span className="text-slate-500">Comprador:</span> {order.ped_comprador || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.ped_emailcomp || '-'}</div>
                                    <div className="col-span-2"><span className="text-slate-500">E-Mail NFe:</span> {order.cli_emailnfe || order.cli_email || '-'}</div>
                                    <div><span className="text-slate-500">Suframa:</span> {order.cli_suframa || '-'}</div>
                                    <div><span className="text-slate-500">Cx.Postal:</span> {order.cli_cxpostal || '-'}</div>
                                    <div><span className="text-slate-500">Condições pgto:</span> <span className="text-blue-600 font-bold">{order.ped_condpag || '-'}</span></div>
                                    <div></div>
                                </div>
                            </div>

                            {/* TRANSPORTADORA */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-slate-200 px-2 py-0.5 text-[12px] font-bold text-center">TRANSPORTADORA</div>
                                <div className="p-2 text-[12px] grid grid-cols-2 gap-x-4 gap-y-0.5">
                                    <div><span className="text-slate-500">Nome:</span> <span className="font-bold">{order.tra_nome || '-'}</span></div>
                                    <div></div>
                                    <div><span className="text-slate-500">Endereço:</span> {order.tra_endereco || '-'}</div>
                                    <div><span className="text-slate-500">Bairro:</span> {order.tra_bairro || '-'}</div>
                                    <div><span className="text-slate-500">Cidade:</span> {order.tra_cidade || '-'}</div>
                                    <div><span className="text-slate-500">Cep:</span> {order.tra_cep || '-'} <span className="text-slate-500 ml-2">UF:</span> {order.tra_uf || '-'}</div>
                                    <div><span className="text-slate-500">CNPJ:</span> {order.tra_cgc || '-'}</div>
                                    <div><span className="text-slate-500">I.Est:</span> {order.tra_inscricao || '-'}</div>
                                    <div><span className="text-slate-500">E-Mail:</span> {order.tra_email || '-'}</div>
                                    <div><span className="text-slate-500">Fone:</span> {order.tra_fone || '-'}</div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="border border-slate-400 mb-2">
                                <div className="bg-yellow-100 px-2 py-0.5 text-[12px] font-bold">Observações:</div>
                                <div className="p-2 text-[12px] min-h-[20px]">{order.ped_obs || '-'}</div>
                            </div>

                            {/* Items Table with Discount Groups - Super simple with Unitário 4 decimals */}
                            {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                    {/* Discount Header */}
                                    <div className="border border-slate-400 px-2 py-1 text-[12px] font-bold">
                                        Descontos praticados nos itens abaixo: {discountKey}
                                    </div>

                                    {/* Items Table - Super simple with Unitário 4 decimals */}
                                    <table className="w-full border-collapse text-[12px]">
                                        <thead>
                                            <tr className="font-bold">
                                                <th className="border border-slate-400 p-1 text-center" style={{ width: '35px' }}>Quant</th>
                                                <th className="border border-slate-400 p-1 text-left" style={{ width: '75px' }}>Produto:</th>
                                                <th className="border border-slate-400 p-1 text-left">Descrição do produto:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '85px' }}>Unitário:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '80px' }}>Total:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>IPI:</th>
                                                <th className="border border-slate-400 p-1 text-right" style={{ width: '35px' }}>ST:</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="border border-slate-300 p-1 text-center font-bold">{item.ite_quant}</td>
                                                    <td className="border border-slate-300 p-1 text-red-600 font-bold">{item.ite_produto}</td>
                                                    <td className="border border-slate-300 p-1 uppercase">{item.ite_nomeprod}</td>
                                                    <td className="border border-slate-300 p-1 text-right">{fv4(item.ite_puniliq)}</td>
                                                    <td className="border border-slate-300 p-1 text-right font-bold">{fv(item.ite_totliquido)}</td>
                                                    <td className="border border-slate-300 p-1 text-right">{item.ite_ipi || 0}</td>
                                                    <td className="border border-slate-300 p-1 text-right">{item.ite_st || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-bold">
                                                <td className="border border-slate-400 p-1 text-right" colSpan="4">Sub-total:</td>
                                                <td className="border border-slate-400 p-1 text-right">{fv(groupItems.reduce((a, i) => a + (parseFloat(i.ite_totliquido) || 0), 0))}</td>
                                                <td className="border border-slate-400 p-1" colSpan="2"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ))}

                            {/* Footer - Simple */}
                            <div className="border border-slate-400 p-2 mt-3 text-[12px]">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Total líquido:</span>
                                        <span className="font-bold">{fv(totalLiquido)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-1">
                                        <span>Quantidade de itens no pedido:</span>
                                        <span className="font-bold">{items.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Qtd total:</span>
                                        <span className="font-bold">{totalQuantidade}</span>
                                    </div>
                                    <div></div>
                                </div>
                            </div>

                            {/* Page Footer */}
                            <div className="flex justify-between mt-2 text-[12px]">
                                <span className="text-slate-400">Formato: {model}</span>
                                <span>Página: 1</span>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
                    @media print {
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print-container { transform: scale(1) !important; margin: 0 auto !important; }
                        .no-print { display: none !important; }
                    }
                    @page { size: A4; margin: 15mm; }
                `}</style>
            </>
        );
    }

    // Default fallback (same as Model 1)
    return (
        <>
            <PrintToolbar />
            <div className="pt-14 min-h-screen bg-slate-300 flex justify-center py-6 overflow-auto">
                <div
                    className="print-container p-8 bg-white text-slate-900 font-sans text-[15px] shadow-2xl"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', width: '190mm', minHeight: '297mm' }}
                >
                    <div className="text-center p-8">
                        <p className="text-lg">Modelo {model} em desenvolvimento.</p>
                        <p>Utilize os modelos 1, 25, 26, 27 ou 28.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderReportEngine;
