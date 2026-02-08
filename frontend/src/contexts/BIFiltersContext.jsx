import React, { createContext, useContext, useState } from 'react';

const BIFiltersContext = createContext();

export const useBIFilters = () => {
    const context = useContext(BIFiltersContext);
    if (!context) {
        throw new Error('useBIFilters must be used within BIFiltersProvider');
    }
    return context;
};

export const BIFiltersProvider = ({ children }) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

    const [filters, setFilters] = useState({
        ano: currentYear,
        mes: currentMonth,
        startDate: '',
        endDate: ''
    });

    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    return (
        <BIFiltersContext.Provider value={{ filters, setFilters, updateFilters }}>
            {children}
        </BIFiltersContext.Provider>
    );
};
