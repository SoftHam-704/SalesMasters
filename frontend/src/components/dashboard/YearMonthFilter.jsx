import React from 'react';
import { motion } from 'framer-motion';
import './YearMonthFilter.css';

const YEARS = [2022, 2023, 2024, 2025, 2026];
const MONTHS = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Fev' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Ago' },
    { value: 9, label: 'Set' },
    { value: 10, label: 'Out' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dez' },
];

export const YearMonthFilter = ({ selectedYear, selectedMonth, onYearChange, onMonthChange }) => {
    return (
        <div className="year-month-filter">
            {/* Year Filter */}
            <div className="filter-section">
                <label className="filter-label">Ano</label>
                <div className="segmented-control">
                    {YEARS.map((year) => (
                        <motion.button
                            key={year}
                            className={`segment-button ${selectedYear === year ? 'active' : ''}`}
                            onClick={() => onYearChange(year)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {year}
                            {selectedYear === year && (
                                <motion.div
                                    className="active-indicator"
                                    layoutId="yearIndicator"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Month Filter */}
            <div className="filter-section">
                <label className="filter-label">Mês (opcional - clique para desmarcar)</label>
                <div className="segmented-control months">
                    {MONTHS.map((month) => (
                        <motion.button
                            key={month.value}
                            className={`segment-button month ${selectedMonth === month.value ? 'active' : ''}`}
                            onClick={() => onMonthChange(selectedMonth === month.value ? null : month.value)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {month.label}
                            {selectedMonth === month.value && (
                                <motion.div
                                    className="active-indicator"
                                    layoutId="monthIndicator"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};
