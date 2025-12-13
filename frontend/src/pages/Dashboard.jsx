import React from 'react';
import { Users, ShoppingCart, FileText, DollarSign, TrendingUp, Plus } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const metrics = [
        {
            title: 'TOTAL DE CLIENTES',
            value: '0',
            subtitle: '0 inativos',
            icon: <Users size={24} />,
            trend: '+12%',
            trendUp: true
        },
        {
            title: 'PEDIDOS HOJE',
            value: '0',
            subtitle: 'Aguardando processamento',
            icon: <ShoppingCart size={24} />,
            trend: '+8%',
            trendUp: true
        },
        {
            title: 'PRODUTOS CADASTRADOS',
            value: '81',
            subtitle: '1 fora de estoque',
            icon: <FileText size={24} />,
            trend: '+3%',
            trendUp: true
        },
        {
            title: 'FATURAMENTO MÊS',
            value: 'R$ 0,00',
            subtitle: 'VS mês anterior',
            icon: <DollarSign size={24} />,
            trend: '+18%',
            trendUp: true
        }
    ];

    const quickActions = [
        { icon: <Users size={20} />, label: 'Novo Cliente', subtitle: 'Cadastrar novo cliente' },
        { icon: <ShoppingCart size={20} />, label: 'Novo Pedido', subtitle: 'Criar novo pedido' },
        { icon: <FileText size={20} />, label: 'Novo Produto', subtitle: 'Cadastrar produto' }
    ];

    const systemStatus = [
        { module: 'Módulo de Clientes', status: 'Ativo', color: 'success' },
        { module: 'Módulo de Pedidos', status: 'Em Desenvolvimento', color: 'warning' },
        { module: 'Módulo de Produtos', status: 'Em Desenvolvimento', color: 'warning' },
        { module: 'Módulo de Relatórios', status: 'Em Desenvolvimento', color: 'warning' }
    ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-muted">Visão geral do sistema de representação comercial</p>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="metrics-grid">
                {metrics.map((metric, idx) => (
                    <div key={idx} className="metric-card card">
                        <div className="metric-header">
                            <div className="metric-icon">{metric.icon}</div>
                            <span className={`metric-trend ${metric.trendUp ? 'trend-up' : 'trend-down'}`}>
                                <TrendingUp size={16} />
                                {metric.trend}
                            </span>
                        </div>
                        <div className="metric-body">
                            <p className="metric-title">{metric.title}</p>
                            <h2 className="metric-value">{metric.value}</h2>
                            <p className="metric-subtitle text-muted">{metric.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content">
                {/* Recent Orders */}
                <div className="recent-orders card">
                    <h3>Pedidos Recentes</h3>
                    <div className="empty-state">
                        <ShoppingCart size={48} className="empty-icon" />
                        <p>Nenhum pedido recente</p>
                        <p className="text-muted">Os pedidos aparecerão aqui</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions card">
                    <h3>Ações Rápidas</h3>
                    <div className="actions-list">
                        {quickActions.map((action, idx) => (
                            <button key={idx} className="action-item">
                                <div className="action-icon">{action.icon}</div>
                                <div className="action-text">
                                    <p className="action-label">{action.label}</p>
                                    <p className="action-subtitle text-muted">{action.subtitle}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="system-status card">
                <h3>Status do Sistema</h3>
                <div className="status-grid">
                    {systemStatus.map((item, idx) => (
                        <div key={idx} className="status-item">
                            <p className="status-module">{item.module}</p>
                            <span className={`status-badge status-${item.color}`}>
                                {item.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
