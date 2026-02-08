import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/SidebarNew';
import { TabContentManager } from './components/layout/TabContentManager';

import Login from './components/Login/Login';
import DemoCloud from './pages/DemoCloud';
import './styles/global.css';
import './App.css';

import { TabControl } from './components/settings/TabControl';
import OrderReportEngine from './components/orders/OrderReportEngine';
import ChatWidget from './components/chat/ChatWidget';


function App() {
  const isPrintView = window.location.pathname.startsWith('/print/');
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!sessionStorage.getItem('user'));

  // Sincronizar estado de autenticação e verificar integridade do Multi-tenant
  React.useEffect(() => {
    const user = sessionStorage.getItem('user');
    const tenantConfig = sessionStorage.getItem('tenantConfig');

    console.log('App.jsx: Auth Check', {
      hasUser: !!user,
      hasTenant: !!tenantConfig,
      pathname: window.location.pathname
    });

    // Se houver usuário mas não houver tenantConfig, a sessão é antiga/inválida
    // CORREÇÃO TELA BRANCA: Força limpeza total e reload
    if (user && !tenantConfig) {
      console.log('⚠️ Sessão antiga/corrompida detectada. Realizando auto-limpeza de emergência.');
      localStorage.removeItem('user'); // Por garantia, remove do persistente se existir
      localStorage.removeItem('tenantConfig');
      sessionStorage.clear();
      setIsAuthenticated(false);
      window.location.href = '/login';
      return;
    }

    setIsAuthenticated(!!user);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Se for Enter e não for um Textarea
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const focusableSelectors = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), button:not([disabled]):not([tabindex="-1"])';
        const focusableElements = Array.from(document.querySelectorAll(focusableSelectors));

        const currentIndex = focusableElements.indexOf(e.target);
        if (currentIndex !== -1) {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex].focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Renderização
  return (
    <Routes>
      {/* Rotas Especiais */}
      <Route path="/print/order/:id" element={<OrderReportEngine />} />
      <Route path="/demo-cloud" element={<DemoCloud />} />
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login />
      } />

      {/* Rota Privada - Layout Principal */}
      <Route
        path="*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="app">
              <Sidebar />
              <main className="main-content flex flex-col h-screen overflow-hidden">
                <TabControl />
                {/* 
                    Novo Gerenciador de Conteúdo de Abas 
                    Substitui o <Routes> interno para manter o estado dos componentes
                */}
                <TabContentManager />
              </main>
              <ChatWidget />
            </div>
          )
        }
      />
    </Routes>
  );
}

export default App;
