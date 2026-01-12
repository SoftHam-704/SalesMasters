import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Plus, Filter, MoreVertical,
    CheckCircle, XCircle, MessageSquare, Phone, User, Users
} from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileCRM = () => {
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form States
    const [clients, setClients] = useState([]);
    const [types, setTypes] = useState([]);
    const [results, setResults] = useState([]);

    const [formData, setFormData] = useState({
        cli_codigo: '',
        tipo_interacao_id: '',
        resultado_id: '',
        descricao: ''
    });

    useEffect(() => {
        loadData();
        loadAuxData(); // Load clients, types, results
    }, []);

    const loadData = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const response = await axios.get(getApiUrl(NODE_API_URL, '/api/crm/interacoes'), {
                headers: { 'x-access-token': user.token },
                params: { ven_codigo: user.codigo } // Filter by current logged in seller
            });
            setInteractions(response.data.data);
        } catch (error) {
            console.error("Erro ao carregar CRM:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadAuxData = async () => {
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            const config = { headers: { 'x-access-token': user.token } };

            // Load Clients (Simplified for Mobile - limiting to first 100 or using a search would be better)
            const clientsRes = await axios.get(getApiUrl(NODE_API_URL, '/api/clientes'), config);
            setClients(clientsRes.data || []);

            const typesRes = await axios.get(getApiUrl(NODE_API_URL, '/api/crm/tipos'), config);
            setTypes(typesRes.data.data || []);

            const resultsRes = await axios.get(getApiUrl(NODE_API_URL, '/api/crm/resultados'), config);
            setResults(resultsRes.data.data || []);

        } catch (error) {
            console.error("Erro ao carregar auxiliares:", error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.cli_codigo || !formData.tipo_interacao_id) {
            alert('Selecione o Cliente e o Tipo!');
            return;
        }

        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            await axios.post(getApiUrl(NODE_API_URL, '/api/crm/interacoes'), {
                ...formData,
                ven_codigo: user.codigo,
                // Defaulting channel to 'Visita' (2) or 'Outros' (6) if not specified, 
                // but usually user should pick. For simplicity let's hardcode 'Visita' or make it dynamic later.
                canal_id: 2
            }, {
                headers: { 'x-access-token': user.token }
            });

            setShowModal(false);
            setFormData({ cli_codigo: '', tipo_interacao_id: '', resultado_id: '', descricao: '' });
            loadData(); // Refresh feed
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar interação.");
        }
    };

    const getIcon = (typeId) => {
        // Simple mapping based on expected IDs or Names
        // 1=Promo, 2=Regional, 3=Comercial...
        return <MessageSquare size={18} className="text-white" />;
    };

    return (
        <div className="relative min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Meu Diário</h1>
                <button className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100">
                    <Filter size={20} />
                </button>
            </div>

            {/* Content Feed */}
            <div className="p-4 space-y-4 pb-24">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Carregando atividades...</div>
                ) : (
                    interactions.map(item => (
                        <div key={item.interacao_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                            {/* Timeline Line Vertical (Visual only) */}
                            <div className="flex flex-col items-center gap-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm 
                                    ${item.resultado === 'Positivo' ? 'bg-green-500' :
                                        item.resultado === 'Negativo' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                    {getIcon(item.tipo_interacao_id)}
                                </div>
                                <div className="w-0.5 h-full bg-gray-100 mt-2"></div>
                            </div>

                            <div className="flex-1 pb-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.cli_nomred}</h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {new Date(item.data_interacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="mt-1 flex items-center gap-2 mb-2">
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium border border-blue-100">
                                        {item.tipo}
                                    </span>
                                    {item.resultado && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium border
                                            ${item.resultado === 'Positivo' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                            {item.resultado}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    {item.descricao || "Sem observações."}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FAB - Floating Action Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center active:scale-95 transition-transform z-20"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            {/* Modal de Nova Interação */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Nova Visita</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1 pb-4">
                            {/* Cliente Select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={formData.cli_codigo}
                                    onChange={e => setFormData({ ...formData, cli_codigo: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {clients.map(c => (
                                        <option key={c.codigo} value={c.codigo}>{c.fantasia || c.raz_social}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo Select */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">O que foi?</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none"
                                        value={formData.tipo_interacao_id}
                                        onChange={e => setFormData({ ...formData, tipo_interacao_id: e.target.value })}
                                    >
                                        <option value="">Tipo...</option>
                                        {types.map(t => (
                                            <option key={t.id} value={t.id}>{t.descricao}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Resultado</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none"
                                        value={formData.resultado_id}
                                        onChange={e => setFormData({ ...formData, resultado_id: e.target.value })}
                                    >
                                        <option value="">Status...</option>
                                        {results.map(r => (
                                            <option key={r.id} value={r.id}>{r.descricao}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Resumo da Conversa</label>
                                <textarea
                                    className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                    placeholder="Ex: Cliente pediu cotação de parafusos. Ficou de retornar amanhã."
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-4 active:scale-95 transition-transform"
                        >
                            Salvar Visita
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileCRM;
