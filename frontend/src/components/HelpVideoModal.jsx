import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Play, ExternalLink, Info } from 'lucide-react';

const HelpVideoModal = ({ isOpen, onClose, tutorialData }) => {
    if (!isOpen || !tutorialData) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#1e293b] border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <Play className="h-5 w-5 text-blue-400" fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">{tutorialData.tut_titulo}</h3>
                                <p className="text-xs text-blue-300 font-medium uppercase tracking-widest flex items-center gap-2">
                                    <Info className="h-3 w-3" /> Tutorial Oficial SalesMasters
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content (YouTube Embed) */}
                    <div className="aspect-video w-full bg-black">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${tutorialData.tut_youtube_id}?autoplay=1`}
                            title={tutorialData.tut_titulo}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    {/* Footer / Description */}
                    <div className="p-6 bg-slate-800/50">
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            {tutorialData.tut_descricao || 'Este tutorial mostra o passo a passo completo desta rotina.'}
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <Youtube className="h-4 w-4" /> v.2026.1
                            </div>
                            <a
                                href={`https://www.youtube.com/watch?v=${tutorialData.tut_youtube_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                VER NO YOUTUBE <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default HelpVideoModal;
