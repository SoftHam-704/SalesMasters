import React, { useState, useEffect } from 'react';
import {
    Factory, Users, Calendar, BarChart3,
    Save, ChevronRight, CheckCircle2, Package
} from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileSellOut = () => {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [industries, setIndustries] = useState([]);

    const [formData, setFormData] = useState({
        cli_codigo: '',
        for_codigo: '',
        periodo: new Date().toISOString().substring(0, 7) + '-01',
        valor: '',
        quantidade: ''
    });

    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const config = { headers: { 'x-access-token': user.token } };
            const [cRes, iRes] = await Promise.all([
                axios.get(getApiUrl(NODE_API_URL, '/api/clientes'), config),
                axios.get(getApiUrl(NODE_API_URL, '/api/industrias'), config)
            ]);
            setClients(cRes.data || []);
            setIndustries(iRes.data || []);
        } catch (error) {
            console.error("Erro ao carregar dados sell-out:", error);
        }
    };

    const handleSave = async () => {
        if (!formData.cli_codigo || !formData.for_codigo || !formData.valor) {
            alert("Preencha os campos obrigatórios!");
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            await axios.post(getApiUrl(NODE_API_URL, '/api/crm/sellout'), formData, {
                headers: { 'x-access-token': user.token }
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({ ...formData, valor: '', quantidade: '' });
            }, 3000);
        } catch (error) {
            console.error("Erro ao salvar sell-out:", error);
            alert("Erro ao salvar dados.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-xl font-bold text-gray-800 px-1">Coleta de Sell-Out</h1>

            {success ? (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center space-y-4 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-emerald-800">Dados Enviados!</h2>
                        <p className="text-sm text-emerald-600">Giro de estoque registrado com sucesso.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">

                    {/* Cliente */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Users size={14} /> Cliente Visitado
                        </label>
                        <select
                            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.cli_codigo}
                            onChange={e => setFormData({ ...formData, cli_codigo: e.target.value })}
                        >
                            <option value="">Selecione o Cliente...</option>
                            {clients.map(c => <option key={c.cli_codigo} value={c.cli_codigo}>{c.fantasia || c.raz_social}</option>)}
                        </select>
                    </div>

                    {/* Indústria */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Factory size={14} /> Indústria/Fábrica
                        </label>
                        <select
                            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={formData.for_codigo}
                            onChange={e => setFormData({ ...formData, for_codigo: e.target.value })}
                        >
                            <option value="">Selecione a Indústria...</option>
                            {industries.map(i => <option key={i.for_codigo} value={i.for_codigo}>{i.for_nomered}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Valor Sell-Out */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <BarChart3 size={14} /> Valor Total
                            </label>
                            <input
                                type="number"
                                placeholder="R$ 0,00"
                                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white outline-none"
                                value={formData.valor}
                                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                            />
                        </div>
                        {/* Quantidade Sell-Out */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Package size={14} /> Qtd. Itens
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 focus:bg-white outline-none"
                                value={formData.quantidade}
                                onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Período */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar size={14} /> Mês de Referência
                        </label>
                        <input
                            type="month"
                            className="w-full p-4 rounded-xl bg-gray-50 border border-gray-100 outline-none"
                            value={formData.periodo.substring(0, 7)}
                            onChange={e => setFormData({ ...formData, periodo: e.target.value + '-01' })}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        {loading ? 'ENVIANDO...' : <><Save size={20} /> REGISTRAR GIRO</>}
                    </button>

                    <p className="text-[10px] text-gray-400 text-center italic">
                        Ao salvar, esses dados alimentarão os relatórios de análise de sell-out no portal BI.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MobileSellOut;
