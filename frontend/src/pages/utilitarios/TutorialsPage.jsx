import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Play,
    BookOpen,
    Search,
    Filter,
    Clock,
    ShieldCheck,
    ExternalLink,
    AlertCircle,
    Layout
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import HelpVideoModal from '@/components/HelpVideoModal';

const TutorialsPage = () => {
    const [tutorials, setTutorials] = useState([]);
    const [filteredTutorials, setFilteredTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTutorial, setSelectedTutorial] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchTutorials = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/tutorials/');
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setTutorials(result.data);
                setFilteredTutorials(result.data);
            }
        } catch (error) {
            console.error('Erro ao carregar tutoriais:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTutorials();
    }, []);

    useEffect(() => {
        const filtered = tutorials.filter(t =>
            t.tut_titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.tut_descricao?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTutorials(filtered);
    }, [searchTerm, tutorials]);

    const handlePlay = (tutorial) => {
        setSelectedTutorial(tutorial);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
            {/* Header Area */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-600">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Conteúdo Protegido</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Central de <span className="text-blue-600">Treinamento</span>
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
                            Domine todas as rotas do SalesMasters com nossos guias oficiais. Disponível exclusivamente para usuários autorizados.
                        </p>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar tutorial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : filteredTutorials.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTutorials.map((t) => (
                            <motion.div
                                key={t.tut_id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5 }}
                                className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 flex flex-col group"
                            >
                                {/* Thumbnail Placeholder/Play */}
                                <div className="aspect-video relative overflow-hidden bg-slate-900">
                                    <img
                                        src={`https://img.youtube.com/vi/${t.tut_youtube_id}/maxresdefault.jpg`}
                                        alt={t.tut_titulo}
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handlePlay(t)}
                                            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 relative z-10"
                                        >
                                            <Play className="h-6 w-6" fill="currentColor" />
                                        </motion.button>
                                    </div>
                                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                                        <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-white/20">
                                            {t.tut_rota}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-7 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-slate-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                                        {t.tut_titulo}
                                    </h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                                        {t.tut_descricao}
                                    </p>
                                    <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Tutorial 2026.1</span>
                                        </div>
                                        <button
                                            onClick={() => handlePlay(t)}
                                            className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-2"
                                        >
                                            ASSISTIR AGORA <ExternalLink className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="p-4 bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Nenhum tutorial encontrado</h3>
                        <p className="text-slate-500 mt-2 font-medium">Tente buscar por termos diferentes.</p>
                    </div>
                )}
            </div>

            {/* Floating Stats or Info Widget */}
            <div className="fixed bottom-8 right-8 hidden lg:block">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                        <Layout className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">Sessão Segura</p>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">{tutorials.length} Vídeos Disponíveis</p>
                    </div>
                </div>
            </div>

            <HelpVideoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tutorialData={selectedTutorial}
            />
        </div>
    );
};

export default TutorialsPage;
