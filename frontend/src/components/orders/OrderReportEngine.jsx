import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BlobProvider } from '@react-pdf/renderer';
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

                console.log(`📦 [OrderReportEngine] Fetch result:`, orderResult);

                if (orderResult.success && orderResult.data) {
                    setData(orderResult.data);

                    // Set document title for better PDF download naming
                    const orderNum = orderResult.data.order.ped_pedido;
                    const cliName = orderResult.data.order.cli_nomred || orderResult.data.order.cli_nome;
                    const sanitizedCliName = cliName.replace(/[/\\?%*:|"<>]/g, '-').trim();
                    document.title = `${orderNum}-${sanitizedCliName}`;
                } else {
                    console.warn(`⚠️ Order not found or error from API: ${orderResult.message || 'Unknown error'}`);
                }

                if (companyResult.success) {
                    setCompanyData(companyResult.config);
                }

            } catch (error) {
                console.error('❌ Error fetching order data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, sortBy, industria, model]);

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

    // Usamos BlobProvider para obter a URL e forçar o zoom via parâmetro de URL (#zoom=100)
    return (
        <div className="h-screen w-screen overflow-hidden relative group">
            <BlobProvider document={<OrderPdfReport model={model} order={order} items={items} companyData={companyData} />}>
                {({ url, loading: pdfLoading }) => {
                    if (pdfLoading) {
                        return (
                            <div className="h-screen w-screen flex items-center justify-center bg-slate-200">
                                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                            </div>
                        );
                    }

                    const fileName = `${order.ped_pedido}-${(order.cli_nomred || order.cli_nome).replace(/[/\\?%*:|"<>]/g, '-').trim()}.pdf`;

                    return (
                        <>
                            <iframe
                                src={`${url}#zoom=100`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title={fileName}
                            />
                            {/* Floating Download Button */}
                            <a
                                href={url}
                                download={fileName}
                                className="absolute top-4 right-4 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-105 opacity-0 group-hover:opacity-100 flex items-center gap-2 font-bold text-sm"
                                title="Baixar PDF"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                Baixar Arquivo
                            </a>
                        </>
                    );
                }}
            </BlobProvider>
        </div>
    );
};

export default OrderReportEngine;
