
import React from 'react';
import { X, Home } from 'lucide-react';
import { useTabs } from '../contexts/TabContext';
import { cn } from "@/lib/utils"; // Assuming you have utility for class merging, or I will use template literals

const TabBar = () => {
    const { tabs, activeTab, closeTab, selectTab } = useTabs();



    return (
        <div className="flex items-center w-full bg-slate-100 border-b border-gray-200 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = tab.path === activeTab;
                return (
                    <div
                        key={tab.path}
                        onClick={() => selectTab(tab.path)}
                        className={`
              relative flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer rounded-t-lg transition-colors min-w-fit
              ${isActive
                                ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 border-x border-gray-200 shadow-sm z-10'
                                : 'bg-slate-50 text-gray-500 hover:bg-slate-100 hover:text-gray-700 border border-transparent'
                            }
            `}
                    >
                        <span className="flex items-center">
                            {tab.icon && <span className="mr-2 opacity-70">{tab.icon}</span>}
                            {tab.label}
                        </span>

                        {/* Close button - Dashboard tab is permanent and cannot be closed */}
                        {tab.path !== '/' && (
                            <button
                                onClick={(e) => closeTab(tab.path, e)}
                                className="ml-2 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-gray-200 transition-all"
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

export default TabBar;
