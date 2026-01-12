import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/SidebarNew';
import Dashboard from './pages/Dashboard';
import FrmIndustria from './pages/frmIndustria';
import FrmClientes from './pages/frmClientes';
import FrmVendedores from './pages/frmVendedores';
import FrmRegioes from './pages/frmRegioes';
import FrmAreaAtuacao from './pages/frmAreaAtuacao';
import FrmProdutos from './pages/frmProdutos';
import FrmGrupoPro from './pages/frmGrupoPro';
import FrmCategorias from './pages/frmCategorias';
import FrmGrupoDesc from './pages/frmGrupoDesc';
import FrmTransportadoras from './pages/frmTransportadoras';
import FrmImportacaoPrecos from './pages/frmImportacaoPrecos';
import FrmTabPreco from './pages/frmTabPreco';
import FrmCadastroProdutos from './pages/frmCadastroProdutos';
import DatabaseConfig from './pages/DatabaseConfig';
import OrdersPage from './components/orders/OrdersPage';
import DiceGame from './components/utilities/DiceGame';
import TetrisGame from './components/utilities/TetrisGame';
import ParametrosPage from './components/parametros/ParametrosPage';
import BusinessIntelligence from './pages/BusinessIntelligence';
import CRMPage from './pages/CRMPage';
import CRMSettings from './pages/crm/CRMSettings';
import SellOutPage from './pages/SellOutPage';
import PivotReportPage from './pages/estatisticos/PivotReportPage';
import ClientIndustryMapPage from './pages/estatisticos/ClientIndustryMapPage';
import UltimasComprasPage from './pages/estatisticos/UltimasComprasPage';
import MapaQuantidadePage from './pages/estatisticos/MapaQuantidadePage';
import Mapa3AnosPage from './pages/estatisticos/Mapa3AnosPage';
import ItensNuncaCompradosPage from './pages/estatisticos/ItensNuncaCompradosPage';
import ComparativoClientesPage from './pages/estatisticos/ComparativoClientesPage';
import MapaClienteGeralPage from './pages/estatisticos/MapaClienteGeralPage';
import GrupoLojasPage from './pages/estatisticos/GrupoLojasPage';
import ProdutosUnicaCompraPage from './pages/estatisticos/ProdutosUnicaCompraPage';
import ClientesMoMPage from './pages/estatisticos/ClientesMoMPage';
import ContasPagarPage from './pages/financial/ContasPagarPage';
import ContasReceberPage from './pages/financial/ContasReceberPage';
import CashFlowPage from './pages/financial/CashFlowPage';
import AccountsPayableReportPage from './pages/financial/AccountsPayableReportPage';
import AccountsReceivableReportPage from './pages/financial/AccountsReceivableReportPage';
import DREPage from './pages/financial/DREPage';
import ChartOfAccountsPage from './pages/financial/ChartOfAccountsPage';
import CostCentersPage from './pages/financial/CostCentersPage';
import FinancialClientsPage from './pages/financial/FinancialClientsPage';
import FinancialSuppliersPage from './pages/financial/FinancialSuppliersPage';
import UserManagementPage from './pages/utilitarios/UserManagementPage';

import IntelligencePage from './pages/IntelligencePage';
import Login from './components/Login/Login';
import DemoCloud from './pages/DemoCloud';
import './styles/global.css';
import './App.css';

import { TabControl } from './components/settings/TabControl';
import OrderReportEngine from './components/orders/OrderReportEngine';

import useMobile from './hooks/useMobile';
import MobileLayout from './mobile/MobileLayout';
import MobileHome from './mobile/pages/MobileHome';
import MobileClients from './mobile/pages/MobileClients';
import MobileProducts from './mobile/pages/MobileProducts';
import MobileCRM from './mobile/pages/MobileCRM';
import MobileGoals from './mobile/pages/MobileGoals';
import MobileMenu from './mobile/pages/MobileMenu';
import MobileIndustries from './mobile/pages/MobileIndustries';
import MobileSellOut from './mobile/pages/MobileSellOut';
import MobileOrderWizard from './mobile/pages/MobileOrderWizard';
import MobileOrders from './mobile/pages/MobileOrders';

function App() {
  const isMobile = useMobile();
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
          ) : isMobile ? (
            <Routes>
              <Route element={<MobileLayout />}>
                <Route path="/" element={<MobileHome />} />
                <Route path="/clientes" element={<MobileClients />} />
                <Route path="/pedidos" element={<MobileOrderWizard />} />
                <Route path="/pedidos/novo" element={<MobileOrderWizard />} />
                <Route path="/pedidos/historico" element={<MobileOrders />} />
                <Route path="/menu" element={<MobileMenu />} />                <Route path="/industrias" element={<MobileIndustries />} />
                <Route path="/sellout" element={<MobileSellOut />} />
                <Route path="/metas" element={<MobileGoals />} />
                <Route path="/crm" element={<MobileCRM />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          ) : (
            <div className="app">
              <Sidebar />
              <main className="main-content flex flex-col h-screen overflow-hidden">
                <TabControl />
                <div className="flex-1 overflow-auto bg-gray-50">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/industrias" element={<FrmIndustria />} />
                    <Route path="/clientes" element={<FrmClientes />} />
                    <Route path="/vendedores" element={<FrmVendedores />} />
                    <Route path="/produtos" element={<FrmProdutos />} />
                    <Route path="/pedidos" element={<OrdersPage />} />
                    <Route path="/cadastros/grupos-produtos" element={<FrmGrupoPro />} />
                    <Route path="/cadastros/categorias" element={<FrmCategorias />} />
                    <Route path="/cadastros/grupos-descontos" element={<FrmGrupoDesc />} />
                    <Route path="/cadastros/transportadoras" element={<FrmTransportadoras />} />
                    <Route path="/cadastros/regioes" element={<FrmRegioes />} />
                    <Route path="/cadastros/area-atuacao" element={<FrmAreaAtuacao />} />
                    <Route path="/cadastros/tabelas-precos" element={<FrmTabPreco />} />
                    <Route path="/utilitarios/importacao-precos" element={<FrmImportacaoPrecos />} />
                    <Route path="/utilitarios/catalogo-produtos" element={<FrmCadastroProdutos />} />
                    <Route path="/utilitarios/configuracoes" element={<DatabaseConfig />} />
                    <Route path="/utilitarios/parametros" element={<ParametrosPage />} />
                    <Route path="/utilitarios/jogo-dados" element={<DiceGame />} />
                    <Route path="/utilitarios/tetris" element={<TetrisGame />} />
                    <Route path="/utilitarios/usuarios" element={<UserManagementPage />} />
                    <Route path="/intelligence" element={<IntelligencePage />} />
                    <Route path="/bi-intelligence" element={<IntelligencePage />} />
                    <Route path="/crm" element={<CRMPage />} />
                    <Route path="/configuracoes/crm" element={<CRMSettings />} />
                    <Route path="/movimentacoes/sell-out" element={<SellOutPage />} />
                    <Route path="/financeiro/plano-contas" element={<ChartOfAccountsPage />} />
                    <Route path="/financeiro/centro-custo" element={<CostCentersPage />} />
                    <Route path="/financeiro/clientes" element={<FinancialClientsPage />} />
                    <Route path="/financeiro/fornecedores" element={<FinancialSuppliersPage />} />
                    <Route path="/financeiro/receber" element={<ContasReceberPage />} />
                    <Route path="/financeiro/pagar" element={<ContasPagarPage />} />
                    <Route path="/financeiro/contas-pagar" element={<ContasPagarPage />} />
                    <Route path="/financeiro/contas-receber" element={<ContasReceberPage />} />
                    <Route path="/financeiro/relatorios/fluxo-caixa" element={<CashFlowPage />} />
                    <Route path="/financeiro/relatorios/contas-pagar" element={<AccountsPayableReportPage />} />
                    <Route path="/financeiro/relatorios/contas-receber" element={<AccountsReceivableReportPage />} />
                    <Route path="/financeiro/relatorios/dre" element={<DREPage />} />
                    <Route path="/estatisticos/mapa-vendas" element={<PivotReportPage reportType="vendas" />} />
                    <Route path="/estatisticos/mapa-cliente-industria" element={<ClientIndustryMapPage />} />
                    <Route path="/estatisticos/mapa-cliente-mes" element={<PivotReportPage reportType="vendas" title="Mapa Cliente Mês a Mês" />} />
                    <Route path="/estatisticos/mapa-vendedor" element={<PivotReportPage reportType="vendedor" title="Mapa por Vendedor" />} />
                    <Route path="/estatisticos/mapa-produtos" element={<PivotReportPage reportType="produtos" title="Mapa por Produtos" />} />
                    <Route path="/estatisticos/ultimas-compras" element={<UltimasComprasPage />} />
                    <Route path="/estatisticos/mapa-quantidade" element={<MapaQuantidadePage />} />
                    <Route path="/estatisticos/mapa-3-anos" element={<Mapa3AnosPage />} />
                    <Route path="/estatisticos/itens-nunca-comprados" element={<ItensNuncaCompradosPage />} />
                    <Route path="/estatisticos/comparativo-clientes" element={<ComparativoClientesPage />} />
                    <Route path="/estatisticos/mapa-cliente-geral" element={<MapaClienteGeralPage />} />
                    <Route path="/estatisticos/grupo-lojas" element={<GrupoLojasPage />} />
                    <Route path="/estatisticos/prod-unica-compra" element={<ProdutosUnicaCompraPage />} />
                    <Route path="/estatisticos/clientes-atual-ant" element={<ClientesMoMPage />} />
                    <Route path="/estatisticos/*" element={<PivotReportPage reportType="generic" />} />
                  </Routes>
                </div>
              </main>
            </div>
          )
        }
      />
    </Routes>
  );
}

export default App;
