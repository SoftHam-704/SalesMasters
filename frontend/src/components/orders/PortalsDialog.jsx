import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Building2, ExternalLink, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const PortalsDialog = ({ open, onOpenChange, orderId }) => {
    const [activeIndustries, setActiveIndustries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchIndustries = async () => {
            if (!open) return;
            setIsLoading(true);
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/aux/industrias'));
                const json = await response.json();
                if (json.success) {
                    const names = json.data.map(i => `${i.for_nomered || ''} ${i.for_nome || ''}`.toUpperCase());
                    setActiveIndustries(names);
                }
            } catch (error) {
                console.error('Erro ao buscar indústrias:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIndustries();
    }, [open]);

    const allPortals = [
        "TSA", "VIEMAR",
        "BORG", "PATRAL",
        "SINALSUL", "ARCA",
        "PHINIA", "STAHL",
        "NINO", "SAMPEL",
        "POLO", "DRIVEWAY",
        "3RHO", "IGUAÇU"
    ];

    // Filtra os portais verificando se o nome do portal está contido na razão social ou nome fantasia das indústrias vinculadas ao cliente/tenant
    const portals = allPortals.filter(portal =>
        activeIndustries.some(ind => {
            const normalize = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            return normalize(ind).includes(normalize(portal));
        })
    );

    const handlePortalClick = async (portal) => {
        if (portal === 'STAHL') {
            try {
                const toastId = toast.loading('Gerando arquivo STAHL...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/stahl`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // Blob handling for download
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo ${orderId}.txt baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'IGUAÇU') {
            try {
                const toastId = toast.loading('Gerando arquivo XML IGUAÇU...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/iguacu`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo ${orderId}.xml baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'VIEMAR') {
            try {
                const toastId = toast.loading('Gerando planilha VIEMAR...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/viemar`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo ${orderId}.xlsx baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'SAMPEL') {
            try {
                const toastId = toast.loading('Gerando planilha SAMPEL...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/sampel`), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `SAMPEL_${orderId}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo SAMPEL_${orderId}.xlsx baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação SAMPEL:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else {
            toast.info(`Integração ${portal} em desenvolvimento.`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[850px] p-0 border-none bg-transparent shadow-none" hideCloseButton>
                {/* Acessibilidade para Screen Readers */}
                <div className="sr-only">
                    <DialogTitle>Portais Industriais de Exportação</DialogTitle>
                    <DialogDescription>
                        Selecione um dos portais industriais disponíveis para exportar os dados do pedido.
                    </DialogDescription>
                </div>

                <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">

                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Portais Industriais</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">Selecione o destino da exportação</p>
                            </div>
                        </div>

                        {/* Botão de Fechar Customizado */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200 group"
                        >
                            <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                        </button>
                    </div>

                    {/* Grid com Design de Cards Interativos */}
                    <div className="p-8 bg-slate-50/30 min-h-[250px] flex flex-col justify-center">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                                <p className="font-bold uppercase tracking-wider text-xs">Carregando portais disponíveis...</p>
                            </div>
                        ) : portals.length === 0 ? (
                            <div className="text-center p-8">
                                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                                <h4 className="text-lg font-bold text-slate-700">Nenhum portal compatível</h4>
                                <p className="text-sm text-slate-500 mt-1">Nenhuma das indústrias ativas possui integração mapeada neste sistema.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                {portals.map((portal, index) => (
                                    <motion.button
                                        key={portal}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePortalClick(portal)}
                                        className="group relative flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg shadow-sm transition-all duration-300 min-h-[100px]"
                                    >
                                        {/* Icon Container */}
                                        <div className="mb-3 p-2.5 rounded-full bg-slate-50 group-hover:bg-blue-50 transition-colors duration-300">
                                            <Building2 className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" />
                                        </div>

                                        {/* Text */}
                                        <span className="text-sm font-black text-slate-700 group-hover:text-blue-700 uppercase tracking-wider transition-colors duration-300">
                                            {portal}
                                        </span>

                                        {/* Hover Indicator */}
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1 group-hover:translate-x-0">
                                            <ExternalLink className="h-3 w-3 text-blue-400" />
                                        </div>

                                        {/* Bottom Border Glow */}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 opacity-0 group-hover:opacity-100 rounded-b-2xl" />
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Clean */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sistema v1.2 • Módulo de Integração
                        </p>
                        <div className="flex gap-2">
                            {/* Espaço para ações futuras */}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PortalsDialog;
