
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Building2, UserCircle, Tag, Layers,
  Package, Settings, Sparkles, RefreshCw,
  ShoppingCart, DollarSign, PieChart, FileText, Wrench, Gamepad,
  ChevronDown, ChevronRight, BarChart2, TrendingUp, Table, Zap
} from 'lucide-react';

import './Sidebar.css';
import { useTabs } from '../contexts/TabContext';

import salesMastersLogo from '../assets/salesmasters_logo.png';
import softHamLogo from '../assets/softham_logo.png';

const Sidebar = () => {
  const location = useLocation();
  const { selectTab } = useTabs();

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    'CADASTROS': false,
    'MOVIMENTAÇÕES': true,
    'FINANCEIRO': false,
    'ESTATÍSTICOS': false
  });

  const toggleSection = (title) => {
    if (!title) return;
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const menuSections = [
    {
      title: '',
      items: [
        { icon: <Home size={20} />, label: 'Dashboard', path: '/' },
        {
          icon: <Zap size={20} className="text-yellow-400 fill-yellow-400/20 animate-pulse" />,
          label: 'Intelligence',
          path: '/bi-python',
        },
        {
          icon: <BarChart2 size={18} />,
          label: 'Business Intelligence',
          path: '/bi-intelligence',
          badge: 'NEW',
          badgeClassName: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20 animate-pulse'
        }
      ]
    },
    {
      title: 'CADASTROS',
      items: [
        { icon: <Building2 size={18} />, label: 'Indústrias', path: '/industrias' },
        { icon: <Users size={18} />, label: 'Clientes', path: '/clientes' },
        { icon: <UserCircle size={18} />, label: 'Vendedores', path: '/vendedores' },
        { icon: <Package size={18} />, label: 'Produtos', path: '/produtos' },
        { icon: <Tag size={18} />, label: 'Categorias', path: '/cadastros/categorias' },
        { icon: <Layers size={18} />, label: 'Grupo de Produtos', path: '/cadastros/grupos-produtos' },
        { icon: <Layers size={18} />, label: 'Grupos de Descontos', path: '/cadastros/grupos-descontos' },
        { icon: <Building2 size={18} />, label: 'Regiões', path: '/cadastros/regioes' },
        { icon: <Tag size={18} />, label: 'Área de Atuação', path: '/cadastros/area-atuacao' },
        { icon: <Building2 size={18} />, label: 'Transportadoras', path: '/cadastros/transportadoras' },
        { icon: <Table size={18} />, label: 'Tabelas de Preço', path: '/cadastros/tabelas-precos' }
      ]
    },
    {
      title: 'MOVIMENTAÇÕES',
      items: [
        { icon: <ShoppingCart size={18} />, label: 'Pedidos de Venda', path: '/pedidos' },
        { icon: <FileText size={18} />, label: 'Baixa via XML', path: '/movimentacoes/baixa-xml' },
        { icon: <PieChart size={18} />, label: 'SELL-OUT', path: '/movimentacoes/sell-out' },
        { icon: <Users size={18} />, label: 'CRM / Atendimentos', path: '/crm' }
      ]
    },
    {
      title: 'FINANCEIRO',
      items: [
        { icon: <DollarSign size={18} />, label: 'Contas a Receber', path: '/financeiro/receber' },
        { icon: <DollarSign size={18} />, label: 'Contas a Pagar', path: '/financeiro/pagar' },
        { icon: <TrendingUp size={18} />, label: 'Fluxo de Caixa', path: '/financeiro/relatorios/fluxo-caixa' },
        { icon: <PieChart size={18} />, label: 'DRE Gerencial', path: '/financeiro/relatorios/dre' },
        { icon: <Layers size={18} />, label: 'Plano de Contas', path: '/financeiro/plano-contas' },
        { icon: <Building2 size={18} />, label: 'Centro de Custos', path: '/financeiro/centro-custo' }
      ]
    },
    {
      title: 'ESTATÍSTICOS & MAPAS',
      items: [
        { icon: <BarChart2 size={18} />, label: 'Mapa de Vendas', path: '/estatisticos/mapa-vendas' },
        { icon: <PieChart size={18} />, label: 'Mapa Cli/Indústria', path: '/estatisticos/mapa-cliente-industria' },
        { icon: <BarChart2 size={18} />, label: 'Mapa Cli Mês a Mês', path: '/estatisticos/mapa-cliente-mes' },
        { icon: <UserCircle size={18} />, label: 'Mapa por Vendedor', path: '/estatisticos/mapa-vendedor' },
        { icon: <Package size={18} />, label: 'Mapa Produtos', path: '/estatisticos/mapa-produtos' },
        { icon: <ShoppingCart size={18} />, label: 'Últimas Compras', path: '/estatisticos/ultimas-compras' },
        { icon: <BarChart2 size={18} />, label: 'Mapa em Qtd', path: '/estatisticos/mapa-quantidade' },
        { icon: <Users size={18} />, label: 'Comparativo Clientes', path: '/estatisticos/comparativo-clientes' },
        { icon: <Building2 size={18} />, label: 'Grupo de Lojas', path: '/estatisticos/grupo-lojas' }
      ]
    },
    {
      title: 'UTILITÁRIOS',
      items: [
        { icon: <Package size={18} />, label: 'Catálogo Digital', path: '/utilitarios/catalogo-produtos' },
        { icon: <Sparkles size={18} />, label: 'Assistente IA', path: '/assistente' },
        { icon: <Settings size={18} />, label: 'Configurações', path: '/utilitarios/configuracoes' }
      ]
    }
  ];

  return (
    <div className="sidebar w-72 flex flex-col h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-300 shadow-2xl border-r border-slate-700/50 font-['Inter'] relative z-50 shrink-0">

      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 p-[2px] shadow-lg shadow-blue-500/30">
          <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center">
            <img src={salesMastersLogo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white leading-tight tracking-tight">Sales Masters</h1>
          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-widest mt-0.5">Professional v2.5</p>
        </div>
      </div>

      {/* Menu Area */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar mt-4">
        {menuSections.map((section, idx) => {
          const isExpanded = !section.title || expandedSections[section.title];

          return (
            <div key={idx}>
              {section.title && (
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hover:text-white transition-colors group mb-1"
                  onClick={() => toggleSection(section.title)}
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">{section.title}</span>
                  {isExpanded ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
                </div>
              )}

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    {section.items.map((item, itemIdx) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <div
                          key={itemIdx}
                          onClick={() => selectTab(item.path)}
                          className={`
                                flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 group relative border border-transparent
                                ${isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 border-blue-500/30'
                              : 'hover:bg-white/5 hover:text-white text-slate-400 hover:border-white/5'
                            }
                            `}
                        >
                          {/* Icon Container with subtle glow */}
                          <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                            {item.icon}
                          </span>

                          <span className={`text-sm font-medium flex-1 ${isActive ? 'font-semibold tracking-wide' : 'tracking-normal'}`}>{item.label}</span>

                          {/* Badges */}
                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${item.badgeClassName ? item.badgeClassName : isActive ? 'bg-white/20 text-white border-white/20' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer Specification Check:
         1. SoftHam Sistemas
         2. Phone Number below
         3. Green Dot + Conectado text below phone
      */}
      <div className="p-5 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-start gap-4 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
          <img src={softHamLogo} alt="SoftHam" className="w-12 h-12 rounded-full border-2 border-slate-500/50 p-0.5 bg-slate-800 shrink-0" />
          <div className="flex flex-col">
            <p className="text-sm font-bold text-white tracking-wide">SoftHam Sistemas</p>

            {/* Phone below Name */}
            <p className="text-[11px] text-slate-300 font-mono mt-1">(67) 9 9607-8885</p>

            {/* Status below Phone */}
            <div className="flex items-center gap-1.5 mt-1.5 align-middle">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse mb-0.5"></span>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Conectado..</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
