
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRouteInfo } from '../utils/routeConfig';

const TabContext = createContext();

export const useTabs = () => useContext(TabContext);

export const TabProvider = ({ children }) => {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState('/');
    const navigate = useNavigate();
    const location = useLocation();

    // Sync tabs with URL location
    useEffect(() => {
        const currentPath = location.pathname;
        setActiveTab(currentPath);

        // Use functional update to prevent duplicates
        setTabs(prev => {
            // Ensure Dashboard is always first
            if (!prev.some(tab => tab.path === '/')) {
                const homeInfo = getRouteInfo('/');
                prev = [{ path: '/', label: homeInfo.label, icon: homeInfo.icon }, ...prev];
            }

            // Check if tab already exists
            const exists = prev.some(tab => tab.path === currentPath);

            if (!exists && currentPath !== '/') {
                const routeInfo = getRouteInfo(currentPath);
                return [...prev, {
                    path: currentPath,
                    label: routeInfo.label,
                    icon: routeInfo.icon
                }];
            }

            return prev; // No change if tab already exists
        });
    }, [location.pathname]);

    const closeTab = (path, e) => {
        if (e) e.stopPropagation();

        // Never allow closing the Dashboard tab
        if (path === '/') return;

        // Don't close the only tab
        if (tabs.length === 1) return;

        const newTabs = tabs.filter(tab => tab.path !== path);
        setTabs(newTabs);

        // If closing active tab, navigate to the last available tab
        if (path === activeTab) {
            const lastTab = newTabs[newTabs.length - 1];
            navigate(lastTab.path);
        }
    };

    const selectTab = (path, options = {}) => {
        navigate(path, options);
    };

    return (
        <TabContext.Provider value={{ tabs, activeTab, closeTab, selectTab }}>
            {children}
        </TabContext.Provider>
    );
};
