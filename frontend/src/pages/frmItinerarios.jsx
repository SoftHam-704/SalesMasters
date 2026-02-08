import React, { useState, useEffect } from 'react';
import { Route, Map, User, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GridCadPadraoV2 from '../components/GridCadPadraoV2';
import ItineraryForm from '../components/forms/ItineraryForm';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { HelpCircle, Sparkles } from 'lucide-react';
import ItineraryHelpModal from '@/components/crm/ItineraryHelpModal';

const FrmItinerarios = () => {
    const [itineraries, setItineraries] = useState([]);
    const [filteredItineraries, setFilteredItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedItinerary, setSelectedItinerary] = useState(null);
    const [helpOpen, setHelpOpen] = useState(false);

    const fetchItineraries = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/v2/itineraries');
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setItineraries(data.data);
                setFilteredItineraries(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar itinerários:', error);
            toast.error('Erro ao carregar itinerários');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItineraries();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredItineraries(itineraries);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = itineraries.filter(item =>
                item.iti_descricao?.toLowerCase().includes(lower) ||
                item.ven_nome?.toLowerCase().includes(lower)
            );
            setFilteredItineraries(filtered);
        }
    }, [searchTerm, itineraries]);

    const handleNew = () => {
        setSelectedItinerary(null);
        setShowForm(true);
    };

    const handleEdit = (itinerary) => {
        setSelectedItinerary(itinerary);
        setShowForm(true);
    };

    const handleDelete = async (itinerary) => {
        if (!window.confirm(`Deseja realmente excluir o itinerário "${itinerary.iti_descricao}"?`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/v2/itineraries/${itinerary.iti_codigo}`);
            const response = await fetch(url, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                toast.success('Itinerário excluído com sucesso!');
                fetchItineraries();
            } else {
                toast.error(data.message || 'Erro ao excluir itinerário');
            }
        } catch (error) {
            toast.error('Erro ao excluir itinerário');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedItinerary
                ? getApiUrl(NODE_API_URL, `/api/v2/itineraries/${selectedItinerary.iti_codigo}`)
                : getApiUrl(NODE_API_URL, '/api/v2/itineraries');

            const method = selectedItinerary ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Itinerário salvo com sucesso!');
                setShowForm(false);
                fetchItineraries();
            } else {
                toast.error(data.message || 'Erro ao salvar itinerário');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar itinerário');
        }
    };

    if (showForm) {
        return (
            <ItineraryForm
                data={selectedItinerary}
                onClose={() => setShowForm(false)}
                onSave={handleSave}
            />
        );
    }

    const renderCard = (item) => (
        <div className="flex flex-col gap-1">
            <div className="font-medium text-gray-900 flex items-center gap-2">
                {item.iti_descricao}
                {!item.iti_ativo && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Inativo</span>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                {item.ven_nome && (
                    <div className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        <User size={12} />
                        {item.ven_nome}
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {item.iti_frequencia || 'Semanal'}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between gap-3 shadow-sm z-10">
                <div className="flex-1 max-w-md">
                    <Label className="text-xs mb-1 font-semibold text-gray-600">Buscar Itinerários</Label>
                    <Input
                        placeholder="Pesquisar por nome ou vendedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 text-sm"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                <GridCadPadraoV2
                    title="Itinerários de Visita"
                    subtitle="Gerencie rotas de vendas por cidades ou setores"
                    icon={Route}
                    data={filteredItineraries}
                    titleKey="iti_descricao"
                    onNew={handleNew}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    renderItem={renderCard}
                    headerActions={
                        <Button
                            onClick={() => setHelpOpen(true)}
                            className="relative bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none group h-8"
                            title="Como funcionam os itinerários?"
                        >
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                            <span className="relative flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" />
                                <span className="text-sm">Como usar...</span>
                                <Sparkles className="w-3 h-3 text-yellow-200" />
                            </span>
                        </Button>
                    }
                    emptyMessage="Nenhum itinerário cadastrado. Clique em + para criar sua primeira rota."
                />
            </div>

            <ItineraryHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />
        </div>
    );
};

export default FrmItinerarios;
