import React, { useState, useEffect } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import CustomerReducedPdf from './CustomerReducedPdf';
import { getApiUrl, NODE_API_URL } from '../../utils/apiConfig';
import { Loader2, AlertCircle, FileText, Download, X } from 'lucide-react';
import { useTabs } from '../../contexts/TabContext';
import { Button } from "@/components/ui/button";

const CustomerReducedEngine = () => {
    const { closeTab, activeTab } = useTabs();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [companyData, setCompanyData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const configRes = await fetch(getApiUrl(NODE_API_URL, '/api/config/company'));
            const configJson = await configRes.json();
            if (configJson.success) setCompanyData(configJson.config);

            const customersRes = await fetch(getApiUrl(NODE_API_URL, '/api/v2/reports/customers/reduced'));
            const customersJson = await customersRes.json();
            if (customersJson.success) {
                setData(customersJson.data);
            } else {
                setError(customersJson.message || 'Erro ao carregar dados');
            }
        } catch (err) {
            setError('Falha na comunicação');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Carregando...</div>;
    if (error) return <div className="p-10 text-center text-red-500"><AlertCircle className="inline-block mr-2" /> {error}</div>;

    return (
        <div className="w-full h-[calc(100vh-130px)] bg-slate-100 flex flex-col p-4 gap-4 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center border border-slate-200">
                <div className="flex items-center gap-4 text-slate-800">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <FileText size={28} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">Clientes Reduzido</h2>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {data.length} registros encontrados
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <BlobProvider document={<CustomerReducedPdf data={data} companyData={companyData} />}>
                        {({ url, loading: pdfLoading }) => {
                            if (pdfLoading) return (
                                <Button disabled className="bg-slate-100 text-slate-400">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando...
                                </Button>
                            );
                            return (
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                    <a
                                        href={url}
                                        download={`clientes_reduzido.pdf`}
                                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all uppercase flex items-center gap-2"
                                    >
                                        <Download size={16} /> BAIXAR PDF
                                    </a>
                                    <button
                                        onClick={() => window.print()}
                                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all uppercase"
                                    >
                                        IMPRIMIR
                                    </button>
                                    <div className="w-px h-6 bg-slate-300 mx-1"></div>
                                    <button
                                        onClick={() => closeTab(activeTab)}
                                        className="bg-white text-rose-500 border border-rose-100 px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm hover:bg-rose-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all uppercase flex items-center gap-2"
                                    >
                                        <X size={16} /> FECHAR
                                    </button>
                                </div>
                            );
                        }}
                    </BlobProvider>
                </div>
            </div>

            {/* PDF Preview Area */}
            <div className="flex-1 bg-slate-200 rounded-xl shadow-2xl overflow-hidden border-4 border-white">
                <BlobProvider document={<CustomerReducedPdf data={data} companyData={companyData} />}>
                    {({ url, loading: pdfLoading }) => (
                        pdfLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 bg-white/50 backdrop-blur-sm">
                                <Loader2 className="animate-spin text-blue-600" size={48} />
                                <p className="font-bold text-slate-600 animate-pulse">RENDERIZANDO DOCUMENTO...</p>
                            </div>
                        ) : (
                            <iframe
                                title="Preview"
                                src={`${url}#view=FitH`}
                                className="w-full h-full border-none"
                            />
                        )
                    )}
                </BlobProvider>
            </div>
        </div>
    );
};

export default CustomerReducedEngine;
