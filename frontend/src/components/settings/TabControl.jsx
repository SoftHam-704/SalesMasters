import React from 'react';
import { useTabs } from '../../contexts/TabContext';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TabControl = () => {
    const { tabs, activeTab, selectTab, closeTab } = useTabs();
    const navigate = useNavigate();

    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="flex w-full bg-white border-b border-gray-200 pt-2 px-2 gap-1 overflow-x-auto shrink-0">
            {tabs.map((tab, index) => {
                const isActive = tab.path === activeTab;
                return (
                    <div
                        key={tab.path}
                        className={`
                            group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors border-t border-l border-r
                            ${isActive
                                ? 'bg-gray-50 text-blue-600 border-gray-200'
                                : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                            }
                        `}
                        onClick={() => selectTab(tab.path)}
                    >
                        {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                        <span className="whitespace-nowrap">{tab.label || 'Sem Título'}</span>

                        {tab.path !== '/' && (
                            <button
                                onClick={(e) => closeTab(tab.path, e)}
                                className={`
                                    ml-1 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                                    ${isActive ? 'hover:bg-blue-100' : 'hover:bg-gray-200'}
                                `}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
