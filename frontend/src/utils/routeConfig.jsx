
import React from 'react';
import {
    Home, Users, Building2, UserCircle, Tag, Layers,
    Package, Settings, Sparkles, RefreshCw,
    ShoppingCart, DollarSign, PieChart, FileText, Wrench, Upload
} from 'lucide-react';

export const routeConfig = {
    '/': { label: 'Dashboard', icon: <Home size={16} /> },
    '/industrias': { label: 'Indústrias', icon: <Building2 size={16} /> },
    '/clientes': { label: 'Clientes', icon: <Users size={16} /> },
    '/vendedores': { label: 'Vendedores', icon: <UserCircle size={16} /> },
    '/produtos': { label: 'Produtos', icon: <Package size={16} /> },
    '/cadastros/categorias': { label: 'Categorias', icon: <Tag size={16} /> },
    '/cadastros/grupos-produtos': { label: 'Grupos de Produtos', icon: <Layers size={16} /> },
    '/cadastros/grupos-descontos': { label: 'Grupos de Descontos', icon: <Layers size={16} /> },
    '/cadastros/regioes': { label: 'Regiões', icon: <Building2 size={16} /> },
    '/cadastros/area-atuacao': { label: 'Área de Atuação', icon: <Tag size={16} /> },
    '/cadastros/transportadoras': { label: 'Transportadoras', icon: <Building2 size={16} /> },
    '/movimentacoes/vendas': { label: 'Vendas', icon: <DollarSign size={16} /> },
    '/financeiro/receber': { label: 'Contas a Receber', icon: <DollarSign size={16} /> },
    '/financeiro/pagar': { label: 'Contas a Pagar', icon: <DollarSign size={16} /> },
    '/estatisticos/desempenho': { label: 'Desempenho', icon: <PieChart size={16} /> },
    '/utilitarios/catalogo-produtos': { label: 'Catálogo de Produtos', icon: <Package size={16} /> },
    '/utilitarios/importacao-precos': { label: 'Importação de Preços', icon: <Upload size={16} /> },
    '/assistente': { label: 'Assistente IA', icon: <Sparkles size={16} /> },
    '/sincronizacao': { label: 'Sincronização', icon: <RefreshCw size={16} /> },
    '/configuracoes': { label: 'Configurações', icon: <Settings size={16} /> },
    '/utilitarios/ferramentas': { label: 'Ferramentas', icon: <Wrench size={16} /> },
    '/relatorios/geral': { label: 'Relatórios Gerais', icon: <FileText size={16} /> }
};

export const getRouteInfo = (path) => {
    // Exact match
    if (routeConfig[path]) return routeConfig[path];

    // Potential dynamic routes or fallbacks could be handled here
    return { label: 'Página', icon: <FileText size={16} /> };
};
