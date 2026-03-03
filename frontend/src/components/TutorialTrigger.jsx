import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import HelpVideoModal from './HelpVideoModal';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const TutorialTrigger = ({ customRoute }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [tutorialData, setTutorialData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const checkTutorial = async () => {
        const routeToSearch = customRoute || location.pathname;
        setIsLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/tutorials${routeToSearch}`);
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setTutorialData(result.data);
            }
        } catch (err) {
            console.error('Erro ao verificar tutorial:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkTutorial();
    }, [location.pathname, customRoute]);

    if (!tutorialData && !isLoading) return null;

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/5 group"
            >
                <div className="relative">
                    <HelpCircle className="h-4 w-4" />
                    <Play className="h-2 w-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Ver Tutorial</span>
            </motion.button>

            <HelpVideoModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                tutorialData={tutorialData}
            />
        </>
    );
};

export default TutorialTrigger;
