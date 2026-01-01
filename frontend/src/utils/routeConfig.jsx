
import React from 'react';
import {
    Home, Users, Building2, UserCircle, Tag, Layers,
    Package, Settings, Sparkles, RefreshCw,
    ShoppingCart, DollarSign, PieChart, FileText, Wrench, Upload, Gamepad, Calendar,
    BarChart2
} from 'lucide-react';

export const routeConfig = {
    '/': { label: 'Dashboard', icon: <Home size={16} /> },
    '/bi-python': { label: 'BI', icon: <BarChart2 size={16} /> },
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
    '/utilitarios/configuracoes': { label: 'Configurações', icon: <Settings size={16} /> },
    '/utilitarios/parametros': { label: 'Parâmetros', icon: <Settings size={16} /> },
    '/assistente': { label: 'Assistente IA', icon: <Sparkles size={16} /> },
    '/sincronizacao': { label: 'Sincronização', icon: <RefreshCw size={16} /> },
    '/utilitarios/ferramentas': { label: 'Ferramentas', icon: <Wrench size={16} /> },
    '/utilitarios/jogo-dados': { label: 'Jogo de Dados', icon: <Gamepad size={16} /> },
    '/pedidos': { label: 'Pedidos', icon: <ShoppingCart size={16} /> },
    '/relatorios/geral': { label: 'Relatórios Gerais', icon: <FileText size={16} /> },
    '/estatisticos/mapa-vendas': { label: 'Mapa de Vendas', icon: <PieChart size={16} /> },
    '/estatisticos/mapa-cliente-industria': { label: 'Mapa Cli/Indústria', icon: <PieChart size={16} /> },
    '/estatisticos/mapa-cliente-mes': { label: 'Mapa Cli/Mês', icon: <PieChart size={16} /> },
    '/estatisticos/mapa-vendedor': { label: 'Mapa por Vendedor', icon: <UserCircle size={16} /> },
    '/estatisticos/mapa-produtos': { label: 'Mapa por Produtos', icon: <Package size={16} /> },
    '/estatisticos/ultimas-compras': { label: 'Últimas Compras', icon: <PieChart size={16} /> },
    '/estatisticos/mapa-quantidade': { label: 'Mapa em Qtd', icon: <PieChart size={16} /> },
    '/estatisticos/mapa-3-anos': { label: 'Mapa 3 Anos', icon: <Calendar size={16} /> },
    '/estatisticos/itens-nunca-comprados': { label: 'Itens Nunca Comprados', icon: <FileText size={16} /> },
    '/estatisticos/comparativo-clientes': { label: 'Comparativo entre clientes', icon: <Users size={16} /> },
    '/estatisticos/mapa-cliente-geral': { label: 'Mapa Cli/Geral', icon: <BarChart2 size={16} /> },
    '/estatisticos/grupo-lojas': { label: 'Grupo de Lojas', icon: <Building2 size={16} /> },
    '/estatisticos/prod-unica-compra': { label: 'Prod Única Compra', icon: <Package size={16} /> },
    '/estatisticos/clientes-atual-ant': { label: 'Clientes MoM', icon: <BarChart2 size={16} /> }
};

export const getRouteInfo = (path) => {
    // Exact match
    if (routeConfig[path]) return routeConfig[path];

    // Attempt to handle paths with trailing slashes
    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (routeConfig[cleanPath]) return routeConfig[cleanPath];

    // Generic fallback for unknown routes to avoid "Pedidos" everywhere
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'Página';
    const autoLabel = lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');

    return { label: autoLabel, icon: <FileText size={16} /> };
};
