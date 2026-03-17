import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export const IndustryRevenueCard = ({ data, loading }) => {
    // Card mantido para não quebrar o layout do grid no Dashboard, mas sem o gráfico
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="activity-card"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '650px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden'
            }}
        >
            <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                        <TrendingUp size={20} color="#3b82f6" />
                    </div>
                    <h3 className="card-title" style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                        Faturamento por Indústria
                    </h3>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                {/* Espaço vazio conforme solicitado */}
            </div>
        </motion.div>
    );
};
