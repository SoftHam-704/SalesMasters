import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MetricCard = ({ title, value, change, icon: Icon, delay = 0, onClick, showTrend = true, subtitle = "vs mês anterior", variant = "default" }) => {
    const isPositive = change >= 0;
    const isBirthday = variant === "birthday";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`metric-card-lovable ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all' : ''} ${isBirthday ? 'metric-card-birthday' : ''}`}
            onClick={onClick}
            style={isBirthday ? {
                background: 'linear-gradient(135deg, #fff5f7 0%, #fef1f4 50%, #fce8ed 100%)',
                border: '1px solid #fecdd3',
                position: 'relative',
                overflow: 'hidden'
            } : {}}
        >
            {/* Shimmer effect for birthday variant */}
            {isBirthday && (
                <div className="birthday-shimmer" style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                    animation: 'shimmer 2.5s infinite',
                    pointerEvents: 'none'
                }} />
            )}
            <div className="metric-card-header">
                <div className="metric-icon-wrapper" style={isBirthday ? {
                    background: 'linear-gradient(135deg, #fb7185 0%, #f472b6 100%)',
                    boxShadow: '0 3px 10px rgba(251, 113, 133, 0.3)'
                } : {}}>
                    <Icon className="metric-icon" style={isBirthday ? { color: 'white' } : {}} />
                </div>
                {showTrend && (
                    <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        <span>{Math.abs(change).toFixed(2)}%</span>
                    </div>
                )}
            </div>
            <div className="metric-card-body">
                <p className="metric-title" style={isBirthday ? { color: '#9f1239', fontWeight: '600' } : {}}>{title}</p>
                <h2 className="metric-value" style={isBirthday ? { color: '#881337' } : {}}>{value}</h2>
                <p className="metric-subtitle" style={isBirthday ? { color: '#be123c' } : {}}>{subtitle}</p>
            </div>
        </motion.div>
    );
};
