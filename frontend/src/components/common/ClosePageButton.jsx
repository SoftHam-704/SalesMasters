import React from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTabs } from '../../contexts/TabContext';

const ClosePageButton = () => {
    const { closeTab } = useTabs();
    const location = useLocation();

    const handleClose = (e) => {
        e.stopPropagation();
        closeTab(location.pathname);
    };

    return (
        <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Fechar tela"
        >
            <X size={20} />
        </button>
    );
};

export default ClosePageButton;
