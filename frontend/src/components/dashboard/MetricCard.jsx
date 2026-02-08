import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MetricCard = ({ title, value, change, icon: Icon, delay = 0, onClick, showTrend = true, subtitle = "vs mês anterior", variant = "default" }) => {
    const isPositive = change >= 0;
    const isBirthday = variant === "birthday";
    const isRevenue = variant === "revenue";
    const isExpense = variant === "expense";
    const isFinancial = variant === "financial";

    const getVariantStyles = () => {
        if (isBirthday) return {
            background: 'linear-gradient(135deg, #fff5f7 0%, #fef1f4 50%, #fce8ed 100%)',
            border: '1px solid #fecdd3',
            iconBg: 'linear-gradient(135deg, #fb7185 0%, #f472b6 100%)',
            iconColor: 'white',
            titleColor: '#9f1239',
            valueColor: '#881337',
            subtitleColor: '#be123c'
        };
        if (isRevenue) return {
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            iconColor: 'white',
            titleColor: '#065f46',
            valueColor: '#064e3b',
            subtitleColor: '#059669'
        };
        if (isExpense) return {
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            iconBg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            iconColor: 'white',
            titleColor: '#991b1b',
            valueColor: '#7f1d1d',
            subtitleColor: '#b91c1c'
        };
        if (isFinancial) return {
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            iconColor: 'white',
            titleColor: '#1e40af',
            valueColor: '#1e3a8a',
            subtitleColor: '#2563eb'
        };
        return {};
    };

    const styles = getVariantStyles();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`metric-card-lovable ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all' : ''} ${variant !== 'default' ? 'special-variant' : ''}`}
            onClick={onClick}
            style={{
                background: styles.background,
                border: styles.border,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Shimmer effect for special variants */}
            {variant !== 'default' && (
                <div className="birthday-shimmer" style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    animation: 'shimmer 3s infinite',
                    pointerEvents: 'none'
                }} />
            )}
            <div className="metric-card-header">
                <div className="metric-icon-wrapper" style={{
                    background: styles.iconBg,
                    boxShadow: styles.iconBg ? '0 3px 10px rgba(0,0,0,0.1)' : ''
                }}>
                    <Icon className="metric-icon" style={{ color: styles.iconColor }} />
                </div>
                {showTrend && change !== undefined && (
                    <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>{Math.abs(change).toFixed(1)}%</span>
                    </div>
                )}
            </div>
            <div className="metric-card-body">
                <p className="metric-title" style={{ color: styles.titleColor, fontWeight: styles.titleColor ? '700' : '' }}>{title}</p>
                <h2 className="metric-value" style={{ color: styles.valueColor }}>{value}</h2>
                <p className="metric-subtitle" style={{ color: styles.subtitleColor }}>{subtitle}</p>
            </div>
        </motion.div>
    );
};
