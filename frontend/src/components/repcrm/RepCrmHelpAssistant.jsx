
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles, ChevronRight, Lightbulb } from 'lucide-react';
import { useTabs } from '../../contexts/TabContext';
import helpContent from '../../docs/repcrm_intelligent_help.md?raw';

/**
 * RepCrmHelpAssistant - O Assistente Inteligente de Onboarding
 * Ele "lê" o arquivo .md e apresenta as dicas contextuais baseadas na aba ativa.
 */
const RepCrmHelpAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { activeTab } = useTabs();
    const [currentDicas, setCurrentDicas] = useState(null);
    const [sectionTitle, setSectionTitle] = useState("");

    // Parser simples para o MD
    useEffect(() => {
        const parseHelpContent = () => {
            const sections = helpContent.split('---');

            // Mapeamento de rotas para palavras-chave no MD
            let keyword = "Dashboard"; // Default
            if (activeTab.includes('clientes')) keyword = "Ficha 360";
            if (activeTab.includes('comissoes')) keyword = "Comissões";
            if (activeTab.includes('visitas')) keyword = "Visitas";
            if (activeTab.includes('equipe')) keyword = "Gestão de Equipe";
            if (activeTab.includes('config')) keyword = "Indústrias";

            const relevantSection = sections.find(s => s.toLowerCase().includes(keyword.toLowerCase()));

            if (relevantSection) {
                const lines = relevantSection.trim().split('\n');
                const title = lines[0].replace('##', '').trim();
                const dicas = lines.filter(l => l.match(/^\d\./)).map(l => {
                    const [numPart, ...textParts] = l.split(' ');
                    const content = textParts.join(' ');
                    const [boldPart, ...rest] = content.split('**');

                    // Tenta extrair o texto em negrito se existir
                    if (content.includes('**')) {
                        const parts = content.split('**');
                        return { title: parts[1], text: parts[2] || "" };
                    }
                    return { title: "", text: content };
                });

                setSectionTitle(title);
                setCurrentDicas(dicas);
            }
        };

        parseHelpContent();
    }, [activeTab]);

    return (
        <>
            {/* Botão Flutuante */}
            <div className="fixed bottom-6 right-24 z-[9999]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center gap-2 p-3 rounded-full shadow-2xl transition-all
                        ${isOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'}
                    `}
                >
                    <Sparkles size={20} className={isOpen ? 'animate-pulse' : ''} />
                    {!isOpen && <span className="text-xs font-black uppercase tracking-widest pr-2">Dica do Assistente</span>}
                    {isOpen && <X size={20} />}
                </button>
            </div>

            {/* Painel de Ajuda */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                        className="fixed bottom-24 right-6 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[9998]"
                    >
                        {/* Header do Assistant */}
                        <div className="bg-blue-600 p-6 text-white overflow-hidden relative">
                            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 opacity-10 rotate-12" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <Lightbulb size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-70">RepCRM Assistant</p>
                                    <h3 className="font-black text-sm tracking-tight">O que posso te ajudar agora?</h3>
                                </div>
                            </div>
                        </div>

                        {/* Conteúdo Dinâmico */}
                        <div className="p-6 max-h-[400px] overflow-y-auto">
                            <div className="mb-4">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{sectionTitle}</span>
                                <h4 className="text-slate-800 font-bold text-lg leading-tight mt-1">Dicas para otimizar seu dia:</h4>
                            </div>

                            <div className="space-y-4">
                                {currentDicas?.map((dica, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex gap-3 items-start group"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600 text-xs font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-slate-700 text-sm leading-relaxed">
                                                {dica.title && <strong className="text-slate-900 block mb-0.5">{dica.title}</strong>}
                                                {dica.text.replace(':', '').trim()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {(!currentDicas || currentDicas.length === 0) && (
                                    <p className="text-slate-400 text-sm italic py-4">
                                        Explique o que você está fazendo para que eu possa te dar as melhores dicas!
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-6">
                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Powered by SalesMasters</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                            >
                                Entendi, obrigado <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RepCrmHelpAssistant;
