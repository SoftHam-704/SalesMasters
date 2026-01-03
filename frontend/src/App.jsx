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

import IntelligencePage from './pages/IntelligencePage';
import './styles/global.css';
import './App.css';

import { TabControl } from './components/settings/TabControl';
import OrderReportEngine from './components/orders/OrderReportEngine';

function App() {
  const isPrintView = window.location.pathname.startsWith('/print/');

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

  if (isPrintView) {
    return (
      <Routes>
        <Route path="/print/order/:id" element={<OrderReportEngine />} />
      </Routes>
    );
  }

  return (
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
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/bi-intelligence" element={<IntelligencePage />} />

            <Route path="/crm" element={<CRMPage />} />
            <Route path="/configuracoes/crm" element={<CRMSettings />} />
            <Route path="/movimentacoes/sell-out" element={<SellOutPage />} />

            {/* Financeiro - Cadastros */}
            <Route path="/financeiro/plano-contas" element={<ChartOfAccountsPage />} />
            <Route path="/financeiro/centro-custo" element={<CostCentersPage />} />
            <Route path="/financeiro/clientes" element={<FinancialClientsPage />} />
            <Route path="/financeiro/fornecedores" element={<FinancialSuppliersPage />} />

            {/* Financeiro - Movimentações */}
            <Route path="/financeiro/receber" element={<ContasReceberPage />} />
            <Route path="/financeiro/pagar" element={<ContasPagarPage />} />
            <Route path="/financeiro/contas-pagar" element={<ContasPagarPage />} />
            <Route path="/financeiro/contas-receber" element={<ContasReceberPage />} />

            {/* Financeiro - Relatórios */}
            <Route path="/financeiro/relatorios/fluxo-caixa" element={<CashFlowPage />} />
            <Route path="/financeiro/relatorios/contas-pagar" element={<AccountsPayableReportPage />} />
            <Route path="/financeiro/relatorios/contas-receber" element={<AccountsReceivableReportPage />} />
            <Route path="/financeiro/relatorios/dre" element={<DREPage />} />

            {/* Estatísticos */}
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
  );
}

export default App;
