import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MetricCard = ({ title, value, change, icon: Icon, delay = 0 }) => {
    const isPositive = change >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="metric-card-lovable"
        >
            <div className="metric-card-header">
                <div className="metric-icon-wrapper">
                    <Icon className="metric-icon" />
                </div>
                <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{Math.abs(change)}%</span>
                </div>
            </div>
            <div className="metric-card-body">
                <p className="metric-title">{title}</p>
                <h2 className="metric-value">{value}</h2>
                <p className="metric-subtitle">vs mês anterior</p>
            </div>
        </motion.div>
    );
};
