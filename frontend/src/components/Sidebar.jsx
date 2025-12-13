import React from 'react';
import {
  Home, Users, Building2, UserCircle, Tag, Layers,
  Package, TrendingUp, Settings, Sparkles, RefreshCw
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import './Sidebar.css';

const Sidebar = () => {
  const menuSections = [
    {
      title: 'RECENTES',
      items: [
        { icon: <Users size={18} />, label: 'Clientes', path: '/clientes' },
        { icon: <Package size={18} />, label: 'Pedidos', path: '/pedidos' }
      ]
    },
    {
      title: '',
      items: [
        { icon: <Home size={18} />, label: 'DASHBOARD', path: '/' }
      ]
    },
    {
      title: '',
      items: [
        { icon: <Sparkles size={18} />, label: 'ASSISTENTE IA', path: '/assistente' },
        { icon: <RefreshCw size={18} />, label: 'SINCRONIZAÇÃO', path: '/sincronizacao' },
        { icon: <Settings size={18} />, label: 'CONFIGURAÇÕES', path: '/configuracoes' }
      ]
    },
    {
      title: 'CADASTROS',
      items: [
        { icon: <Building2 size={18} />, label: 'Fornecedores', path: '/fornecedores', active: true },
        { icon: <Users size={18} />, label: 'Clientes', path: '/cadastros/clientes' },
        { icon: <Building2 size={18} />, label: 'Indústrias', path: '/cadastros/industrias' },
        { icon: <UserCircle size={18} />, label: 'Funcionários', path: '/cadastros/funcionarios' },
        { icon: <Tag size={18} />, label: 'Categorias', path: '/cadastros/categorias' },
        { icon: <Layers size={18} />, label: 'Grupos de Descontos', path: '/cadastros/grupos-descontos' },
        { icon: <Layers size={18} />, label: 'Grupo de Produtos', path: '/cadastros/grupos-produtos' },
        { icon: <Building2 size={18} />, label: 'Regiões', path: '/cadastros/regioes' },
        { icon: <Tag size={18} />, label: 'Área de Atuação', path: '/cadastros/area-atuacao' },
        { icon: <Building2 size={18} />, label: 'Transportadoras', path: '/cadastros/transportadoras' },
        { icon: <Package size={18} />, label: 'Produtos', path: '/cadastros/produtos' }
      ]
    },
    {
      title: 'MOVIMENTAÇÕES',
      items: []
    }
  ];

  return (
    <div className="sidebar">
      {/* Logo SalesMasters */}
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

      {/* Search */}
      <div className="sidebar-search">
        <input type="text" placeholder="Pesquisar menu..." />
      </div>

      {/* Menu */}
      <nav className="sidebar-menu">
        {menuSections.map((section, idx) => (
          <div key={idx} className="menu-section">
            {section.title && <div className="menu-section-title">{section.title}</div>}
            {section.items.map((item, itemIdx) => (
              <a
                key={itemIdx}
                href={item.path}
                className={`menu-item ${item.active ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>

      {/* Logo SoftHam */}
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
