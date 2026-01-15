import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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

    // All models use the unified PDF Engine
    return (
        <div className="h-screen w-screen overflow-hidden">
            <PDFViewer width="100%" height="100%" showToolbar={true}>
                <OrderPdfReport model={model} order={order} items={items} companyData={companyData} />
            </PDFViewer>
        </div>
    );
};

export default OrderReportEngine;
