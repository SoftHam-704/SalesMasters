
import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RepCrmPlaceholder = ({ title }) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-md"
            >
                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-6">
                    <Construction size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{title}</h2>
                <p className="text-slate-500 font-bold mb-8 leading-relaxed">
                    Estamos construindo esta funcionalidade com inteligência premium.
                    Em breve, você terá o controle total aqui.
                </p>
                <button
                    onClick={() => navigate('/repcrm/dashboard')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all mx-auto shadow-lg shadow-blue-600/20"
                >
                    <ArrowLeft size={18} /> Voltar para o Dashboard
                </button>
            </motion.div>
        </div>
    );
};

export default RepCrmPlaceholder;
