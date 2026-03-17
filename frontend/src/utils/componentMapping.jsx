import React from 'react';

// Importações de Páginas (Copiadas e adaptadas do App.jsx)
import Dashboard from '../pages/Dashboard';
import FrmIndustria from '../pages/frmIndustria';
import FrmClientes from '../pages/frmClientes';
import FrmVendedores from '../pages/frmVendedores';
import FrmRegioes from '../pages/frmRegioes';
import FrmSetores from '../pages/frmSetores';
import FrmItinerarios from '../pages/frmItinerarios';
import FrmAreaAtuacao from '../pages/frmAreaAtuacao';
import FrmCampanhas from '../pages/frmCampanhas';
import FrmProdutos from '../pages/frmProdutos';
import FrmGrupoPro from '../pages/frmGrupoPro';
import FrmCategorias from '../pages/frmCategorias';
import FrmGrupoDesc from '../pages/frmGrupoDesc';
import FrmTransportadoras from '../pages/frmTransportadoras';
import FrmImportacaoPrecos from '../pages/frmImportacaoPrecos';
import FrmTabPreco from '../pages/frmTabPreco';
import FrmCadastroProdutos from '../pages/frmCadastroProdutos';
import DatabaseConfig from '../pages/DatabaseConfig';
import OrdersPage from '../components/orders/OrdersPage';
import FrmGridPedidos from '../components/frmGridPedidos/frmGridPedidos';
import TetrisGame from '../components/utilities/TetrisGame';
import DiceGame from '../components/utilities/DiceGame';
import ParametrosPage from '../components/parametros/ParametrosPage';
import ProjectConsole from '../pages/projects/ProjectConsole';

import CRMPage from '../pages/CRMPage';
import CRMSettings from '../pages/crm/CRMSettings';
import SellOutPage from '../pages/SellOutPage';

import ContasPagarPage from '../pages/financial/ContasPagarPage';
import ContasReceberPage from '../pages/financial/ContasReceberPage';
import CashFlowPage from '../pages/financial/CashFlowPage';
import AccountsPayableReportPage from '../pages/financial/AccountsPayableReportPage';
import AccountsReceivableReportPage from '../pages/financial/AccountsReceivableReportPage';
import DREPage from '../pages/financial/DREPage';
import ChartOfAccountsPage from '../pages/financial/ChartOfAccountsPage';
import CostCentersPage from '../pages/financial/CostCentersPage';
import FinancialClientsPage from '../pages/financial/FinancialClientsPage';
import FinancialSuppliersPage from '../pages/financial/FinancialSuppliersPage';
import UserManagementPage from '../pages/utilitarios/UserManagementPage';
import AgendaPage from '../pages/AgendaPage';
import IntelligencePage from '../pages/IntelligencePage';
import BiGreenfield from '../pages/BiGreenfield';
import FinancialDashboardPage from '../pages/financial/FinancialDashboardPage';
import ProjectModeToggle from '../components/utilities/ProjectModeToggle';
import EmailCenterPage from '../pages/utilitarios/EmailCenterPage';
import RepCrmDashboard from '../pages/repcrm/RepCrmDashboard';
import RepCrmPlaceholder from '../pages/repcrm/RepCrmPlaceholder';
import RepCrmClient360 from '../pages/repcrm/RepCrmClient360';
import RepCrmMetasConfig from '../pages/repcrm/RepCrmMetasConfig';
import RepCrmFollowups from '../pages/repcrm/RepCrmFollowups';
import RepCrmAtendimentos from '../pages/repcrm/RepCrmAtendimentos';
import RepCrmPipeline from '../pages/repcrm/RepCrmPipeline';
import TutorialsPage from '../pages/utilitarios/TutorialsPage';
import WhatsAppAdminPage from '../pages/utilitarios/WhatsAppAdminPage';
import CustomerSelectablePage from '../pages/repcrm/CustomerSelectablePage';
import SmartImporter from '../pages/SmartImporter';
import AuraDashboard from '../pages/AuraDashboard';
import AuraClientInsight from '../pages/repcrm/AuraClientInsight';

import FrmEstatisticos from '../pages/estatisticos/FrmEstatisticos';

// Mapeamento Centralizado de Rotas para Componentes com Props
// Estatísticos
import Mapa3AnosPage from '../pages/estatisticos/Mapa3AnosPage';
import ItensNuncaCompradosPage from '../pages/estatisticos/ItensNuncaCompradosPage';
import PivotReportPage from '../pages/estatisticos/PivotReportPage';
import ClientIndustryMapPage from '../pages/estatisticos/ClientIndustryMapPage';
import ClientesMoMPage from '../pages/estatisticos/ClientesMoMPage';
import ComparativoClientesPage from '../pages/estatisticos/ComparativoClientesPage';
import GrupoLojasPage from '../pages/estatisticos/GrupoLojasPage';
import MapaClienteGeralPage from '../pages/estatisticos/MapaClienteGeralPage';
import MapaQuantidadePage from '../pages/estatisticos/MapaQuantidadePage';
import ProdutosUnicaCompraPage from '../pages/estatisticos/ProdutosUnicaCompraPage';
import UltimasComprasPage from '../pages/estatisticos/UltimasComprasPage';
import InactiveClientsPage from '../pages/estatisticos/InactiveClientsPage';
import SalesByFamilyPage from '../pages/reports/SalesByFamilyPage';
import SalesByProductPage from '../pages/reports/SalesByProductPage';
import CustomerReducedEngine from '../components/reports/CustomerReducedEngine';


// Mapeamento Centralizado de Rotas para Componentes com Props
export const componentMapping = {
    '/': { component: AuraDashboard },
    '/dashboard': { component: AuraDashboard },
    '/utilitarios/dashboard-legado': { component: Dashboard },

    // Vendas
    '/vendas/pedidos': { component: OrdersPage },
    '/pedidos': { component: OrdersPage },
    '/pedidos-projetos': { component: OrdersPage, props: { forceProjetos: true } },
    '/vendas/campanhas': { component: FrmCampanhas },
    '/industrias': { component: FrmIndustria },
    '/clientes': { component: FrmClientes },
    '/vendedores': { component: FrmVendedores },
    '/produtos': { component: FrmProdutos },

    // Cadastros
    '/cadastros/grupos-produtos': { component: FrmGrupoPro },

    '/cadastros/grupos-descontos': { component: FrmGrupoDesc },
    '/cadastros/transportadoras': { component: FrmTransportadoras },
    '/cadastros/regioes': { component: FrmRegioes },
    '/cadastros/setores': { component: FrmSetores },
    '/cadastros/itinerarios': { component: FrmItinerarios },
    '/cadastros/area-atuacao': { component: FrmAreaAtuacao },
    '/cadastros/tabelas-precos': { component: FrmTabPreco },

    // Estatísticos (HUB CENTRALIZADO)
    '/estatisticos': { component: FrmEstatisticos },

    // Estatísticos (Legado / Direto)
    '/estatisticos/mapa-vendas': { component: PivotReportPage, props: { reportType: 'vendas' } },
    '/estatisticos/mapa-cliente-industria': { component: ClientIndustryMapPage },
    '/estatisticos/clientes-atual-ant': { component: ClientesMoMPage },
    '/estatisticos/comparativo-clientes': { component: ComparativoClientesPage },
    '/estatisticos/grupo-lojas': { component: GrupoLojasPage },
    '/estatisticos/itens-nunca-comprados': { component: ItensNuncaCompradosPage },
    '/estatisticos/mapa-3-anos': { component: Mapa3AnosPage },
    '/estatisticos/mapa-cliente-geral': { component: MapaClienteGeralPage },
    '/estatisticos/mapa-quantidade': { component: MapaQuantidadePage },
    '/estatisticos/prod-unica-compra': { component: ProdutosUnicaCompraPage },
    '/estatisticos/ultimas-compras': { component: UltimasComprasPage },
    '/estatisticos/clientes-inativos': { component: InactiveClientsPage },

    // Relatórios de Movimentação
    '/relatorios/vendas-familia': { component: SalesByFamilyPage },
    '/relatorios/vendas-produto': { component: SalesByProductPage },
    '/print/customers-reduced': { component: CustomerReducedEngine },

    // Relatórios de Cadastros
    '/relatorios/clientes-selecionavel': { component: CustomerSelectablePage },
    '/relatorios/clientes-ficha': { component: RepCrmPlaceholder, props: { title: 'Clientes (ficha)' } },
    '/relatorios/industrias': { component: RepCrmPlaceholder, props: { title: 'Indústrias' } },
    '/relatorios/vendedores': { component: RepCrmPlaceholder, props: { title: 'Vendedores' } },
    '/relatorios/transportadoras': { component: RepCrmPlaceholder, props: { title: 'Transportadoras' } },
    '/relatorios/tabelas-precos-descontos': { component: RepCrmPlaceholder, props: { title: 'Tabela de preços com descontos' } },
    '/relatorios/tabelas-precos-completa': { component: RepCrmPlaceholder, props: { title: 'Tabela de preços completa' } },
    '/relatorios/tabelas-precos-reduzida': { component: RepCrmPlaceholder, props: { title: 'Tabela de preço reduzida' } },
    '/relatorios/tabelas-precos-aplicacao': { component: RepCrmPlaceholder, props: { title: 'Tab. preço com aplicação' } },
    '/relatorios/tabelas-precos-impostos': { component: RepCrmPlaceholder, props: { title: 'Tabela de preço com impostos' } },
    '/relatorios/clientes-por-industria': { component: RepCrmPlaceholder, props: { title: 'Relação de clientes por indústria' } },
    '/relatorios/promocao-produtos': { component: RepCrmPlaceholder, props: { title: 'Promoção de produtos' } },
    '/relatorios/clientes-area-atuacao': { component: RepCrmPlaceholder, props: { title: 'Clientes por área de atuação' } },
    '/relatorios/clientes-sem-compras': { component: RepCrmPlaceholder, props: { title: 'Clientes sem compras' } },
    '/relatorios/clientes-por-cidade': { component: RepCrmPlaceholder, props: { title: 'Possíveis clientes por cidade' } },

    // Relatórios de Movimentação (Placeholders)
    '/relatorios/vendas-vendedor-industria': { component: RepCrmPlaceholder, props: { title: 'Vendas por vendedor/indústria' } },
    '/relatorios/vendas-cliente-industria': { component: RepCrmPlaceholder, props: { title: 'Vendas por cliente/indústria' } },
    '/relatorios/vendas-periodo-totais': { component: RepCrmPlaceholder, props: { title: 'Vendas no período (somente totais)' } },
    '/relatorios/vendas-cidade-estado': { component: RepCrmPlaceholder, props: { title: 'Vendas por cidade/estado' } },
    '/relatorios/cotacoes-pendentes': { component: RepCrmPlaceholder, props: { title: 'Cotações pendentes' } },
    '/relatorios/informativo-vendas': { component: RepCrmPlaceholder, props: { title: 'Informativo de vendas' } },
    '/relatorios/clientes-inativos': { component: RepCrmPlaceholder, props: { title: 'Clientes inativos' } },
    '/relatorios/produtos-grupo-clientes': { component: RepCrmPlaceholder, props: { title: 'Produtos por grupo/clientes' } },
    '/relatorios/vendas-regiao': { component: RepCrmPlaceholder, props: { title: 'Vendas por região' } },

    // Relatórios de Faturamento (Placeholders)
    '/relatorios/comissao-vendedores': { component: RepCrmPlaceholder, props: { title: 'Comissão vendedores' } },
    '/relatorios/faturamento-periodo': { component: RepCrmPlaceholder, props: { title: 'Faturamento no período' } },
    '/relatorios/pedidos-faturados-periodo': { component: RepCrmPlaceholder, props: { title: 'Pedidos faturados no período' } },
    '/relatorios/faturamento-pendente': { component: RepCrmPlaceholder, props: { title: 'Faturamento pendente' } },
    '/relatorios/produtos-nao-faturados': { component: RepCrmPlaceholder, props: { title: 'Produtos não faturados' } },

    // Relatórios Financeiro (Placeholders)
    '/relatorios/financeiro/contas-vencimento': { component: RepCrmPlaceholder, props: { title: 'Contas pagar/receber por vencimento' } },

    // Utilitários
    '/utilitarios/frmGridPedidos': { component: FrmGridPedidos },
    '/utilitarios/catalogo-produtos': { component: FrmCadastroProdutos },
    '/utilitarios/configuracoes': { component: DatabaseConfig },
    '/utilitarios/parametros': { component: ParametrosPage },
    '/utilitarios/jogo-dados': { component: DiceGame },
    '/utilitarios/tetris': { component: TetrisGame },
    '/utilitarios/usuarios': { component: UserManagementPage },
    '/utilitarios/modo-projetos': { component: ProjectModeToggle },
    '/utilitarios/envio-emails': { component: EmailCenterPage },
    '/utilitarios/tutoriais': { component: TutorialsPage },
    '/utilitarios/whatsapp-ia': { component: WhatsAppAdminPage },
    '/utilitarios/aura-dashboard': { component: AuraDashboard },
    '/utilitarios/importacao-precos': { component: FrmImportacaoPrecos },

    // Outros
    '/agenda': { component: AgendaPage },

    '/bi-intelligence': { component: IntelligencePage },
    '/bi-greenfield': { component: BiGreenfield },
    '/crm': { component: RepCrmDashboard },
    // Redirect legacy /crm to unified CRM dashboard

    '/movimentacoes/sell-out': { component: SellOutPage },
    '/movimentacoes/importador': { component: SmartImporter },
    '/configuracoes/crm': { component: CRMSettings },

    // RepCRM Specialist
    '/repcrm/dashboard': { component: RepCrmDashboard },
    '/repcrm/cliente/:id': { component: RepCrmClient360 },
    '/repcrm/atendimentos': { component: RepCrmAtendimentos },
    '/repcrm/followups': { component: RepCrmFollowups },
    '/repcrm/pipeline': { component: RepCrmPipeline },
    '/repcrm/config': { component: RepCrmMetasConfig },
    '/repcrm/metas': { component: RepCrmMetasConfig },

    // Financeiro
    '/financeiro/plano-contas': { component: ChartOfAccountsPage },
    '/financeiro/centro-custo': { component: CostCentersPage },
    '/financeiro/clientes': { component: FinancialClientsPage },
    '/financeiro/fornecedores': { component: FinancialSuppliersPage },
    '/financeiro/receber': { component: ContasReceberPage },
    '/financeiro/pagar': { component: ContasPagarPage },
    '/financeiro/contas-receber': { component: ContasReceberPage },
    '/financeiro/contas-pagar': { component: ContasPagarPage },
    '/financeiro/relatorios/fluxo-caixa': { component: CashFlowPage },
    '/financeiro/relatorios/contas-pagar': { component: AccountsPayableReportPage },
    '/financeiro/relatorios/contas-receber': { component: AccountsReceivableReportPage },
    '/financeiro/relatorios/dre': { component: DREPage },
    '/financeiro/dashboard': { component: FinancialDashboardPage },

    // Projetos Bertolini
    '/projetos/console': { component: ProjectConsole },



};

// Função helper para lidar com rotas wildcard (*)
export const getComponentForPath = (path) => {
    // 1. Match exato
    if (componentMapping[path]) {
        return componentMapping[path];
    }

    // 2. Tratamento para /crm (redirect to unified CRM)
    if (path === '/crm') {
        return { component: RepCrmDashboard };
    }

    // 3. Fallback removed


    // 4. Fallback padrão (404 ou Dashboard)
    // Retornar null significa que não achou, quem chamar decide o que fazer
    return null;
};
