import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Building2, UserCircle, Tag, Layers,
  Package, Settings, Sparkles, RefreshCw,
  ShoppingCart, DollarSign, PieChart, FileText, Wrench,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

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
        { icon: <Users size={18} />, label: 'Clientes', path: '/cadastros/clientes' },
        { icon: <UserCircle size={18} />, label: 'Funcionários', path: '/cadastros/funcionarios' },
        { icon: <Package size={18} />, label: 'Produtos', path: '/cadastros/produtos' },
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
        { icon: <ShoppingCart size={18} />, label: 'Pedidos', path: '/movimentacoes/pedidos' },
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
        { icon: <Sparkles size={18} />, label: 'Assistente IA', path: '/assistente' },
        { icon: <RefreshCw size={18} />, label: 'Sincronização', path: '/sincronizacao' },
        { icon: <Settings size={18} />, label: 'Configurações', path: '/configuracoes' },
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
          <div className="logo-icon">SM</div>
          <div className="logo-text">
            <h3>Sales Masters</h3>
            <p>Sistema para Representantes Comerciais</p>
          </div>
        </div>
        <ThemeToggle />
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

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                      >
                        <span className="menu-icon">{item.icon}</span>
                        <span className="menu-label">{item.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-logo">
          <div className="footer-logo-icon">SH</div>
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
