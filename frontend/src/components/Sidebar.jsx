import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Building2, UserCircle, Tag, Layers,
  Package, Settings, Sparkles, RefreshCw,
  ShoppingCart, DollarSign, PieChart, FileText, Wrench,
  ChevronDown, ChevronRight
} from 'lucide-react';

import './Sidebar.css';
import { useTabs } from '../contexts/TabContext';

import salesMastersLogo from '../assets/salesmasters_logo.png';
import softHamLogo from '../assets/softham_logo.png';

const Sidebar = () => {
  const location = useLocation();
  const { selectTab } = useTabs();
  // Force recompile - regioes and area_atuacao added

  const [expandedSections, setExpandedSections] = useState({
    'CADASTROS': true,
    'MOVIMENTAÇÕES': false,
    'FINANCEIRO': false,
    'ESTATÍSTICOS': false,
    'UTILITÁRIOS': false,
    'RELATÓRIOS': false
  });

  const toggleSection = (title) => {
    if (!title) return;
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const menuSections = [
    {
      title: '',
      items: [
        { icon: <Home size={18} />, label: 'DASHBOARD', path: '/' }
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
        { icon: <Building2 size={18} />, label: 'Transportadoras', path: '/cadastros/transportadoras' }
      ]
    },
    {
      title: 'MOVIMENTAÇÕES',
      items: [
        { icon: <DollarSign size={18} />, label: 'Vendas', path: '/movimentacoes/vendas' }
      ]
    },
    {
      title: 'FINANCEIRO',
      items: [
        { icon: <DollarSign size={18} />, label: 'Contas a Receber', path: '/financeiro/receber' },
        { icon: <DollarSign size={18} />, label: 'Contas a Pagar', path: '/financeiro/pagar' }
      ]
    },
    {
      title: 'ESTATÍSTICOS',
      items: [
        { icon: <PieChart size={18} />, label: 'Desempenho', path: '/estatisticos/desempenho' }
      ]
    },
    {
      title: 'UTILITÁRIOS',
      items: [
        { icon: <Package size={18} />, label: 'Catálogo de Produtos', path: '/utilitarios/catalogo-produtos' },
        { icon: <Sparkles size={18} />, label: 'Assistente IA', path: '/assistente' },
        { icon: <RefreshCw size={18} />, label: 'Sincronização', path: '/sincronizacao' },
        { icon: <Settings size={18} />, label: 'Configurações', path: '/utilitarios/configuracoes' },
        { icon: <Wrench size={18} />, label: 'Ferramentas', path: '/utilitarios/ferramentas' }
      ]
    },
    {
      title: 'RELATÓRIOS',
      items: [
        { icon: <FileText size={18} />, label: 'Geral', path: '/relatorios/geral' }
      ]
    }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={salesMastersLogo} alt="Sales Masters" className="logo-img" />
          <div className="logo-text">
            <h3>Sales Masters</h3>
            <p>Sistema para Representantes Comerciais</p>
          </div>
        </div>
      </div>

      <div className="sidebar-search">
        <input type="text" placeholder="Pesquisar menu..." />
      </div>

      <nav className="sidebar-menu">
        {menuSections.map((section, idx) => {
          const isExpanded = !section.title || expandedSections[section.title];

          return (
            <div key={idx} className="menu-section">
              {section.title && (
                <div
                  className="menu-section-title flex items-center justify-between cursor-pointer hover:text-white/80 transition-colors"
                  onClick={() => toggleSection(section.title)}
                  style={{ paddingRight: '1rem' }}
                >
                  <span>{section.title}</span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}

              {isExpanded && (
                <div>
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      onClick={() => selectTab(item.path)}
                      className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      <span className="menu-icon">{item.icon}</span>
                      <span className="menu-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-logo">
          <img src={softHamLogo} alt="SoftHam Sistemas" className="footer-logo-img" />
          <div className="footer-logo-text">
            <p>SoftHam Sistemas</p>
            <small>(37) 9 9207-3885</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
