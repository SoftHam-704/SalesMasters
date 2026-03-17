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

export const YearMonthFilter = ({
    selectedYear,
    selectedMonth,
    selectedIndustry,
    industries,
    onYearChange,
    onMonthChange,
    onIndustryChange
}) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed

    // Filter months based on selected year
    const getFilteredMonths = () => {
        if (selectedYear === currentYear) {
            return MONTHS.filter(month => month.value <= currentMonth);
        }
        // For past or future years, show all months
        return MONTHS;
    };

    const filteredMonths = getFilteredMonths();

    // Handler for year change, includes logic to clear invalid month selection
    const handleYearChange = (year) => {
        onYearChange(year);
        // If the new year is the current year and the selected month is beyond the current month,
        // or if the selected month is not available in the filtered months for the new year,
        // clear the month selection.
        if (selectedMonth && year === currentYear && selectedMonth > currentMonth) {
            onMonthChange(null);
        } else if (selectedMonth && !filteredMonths.some(m => m.value === selectedMonth)) {
            onMonthChange(null);
        }
    };

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
                            onClick={() => handleYearChange(year)}
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
                    {filteredMonths.map((month) => (
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

            {/* Industry Filter */}
            <div className="filter-section">
                <label className="filter-label">Indústria</label>
                <div className="segmented-control">
                    <select
                        value={selectedIndustry}
                        onChange={(e) => onIndustryChange(e.target.value)}
                        className="industry-select-dashboard"
                    >
                        <option value="">TODAS AS INDÚSTRIAS</option>
                        {industries.map(ind => (
                            <option key={ind.for_codigo} value={ind.for_codigo}>
                                {ind.for_nomered}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
