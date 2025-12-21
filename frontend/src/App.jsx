import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FrmIndustria from './pages/frmIndustria';
import FrmClientes from './pages/frmClientes';
import FrmVendedores from './pages/frmVendedores';
import FrmRegioes from './pages/frmRegioes';
import FrmAreaAtuacao from './pages/frmAreaAtuacao';
import FrmProdutos from './pages/frmProdutos';
import FrmGrupoPro from './pages/frmGrupoPro';
import FrmGrupoDesc from './pages/frmGrupoDesc';
import FrmTransportadoras from './pages/frmTransportadoras';
import FrmImportacaoPrecos from './pages/frmImportacaoPrecos';
import FrmCadastroProdutos from './pages/frmCadastroProdutos';
import DatabaseConfig from './pages/DatabaseConfig';
import './styles/global.css';
import './App.css';

import TabControl from './components/TabControl'
// ... imports

function App() {
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
            <Route path="/cadastros/grupos-produtos" element={<FrmGrupoPro />} />
            <Route path="/cadastros/grupos-descontos" element={<FrmGrupoDesc />} />
            <Route path="/cadastros/transportadoras" element={<FrmTransportadoras />} />
            <Route path="/cadastros/regioes" element={<FrmRegioes />} />
            <Route path="/cadastros/area-atuacao" element={<FrmAreaAtuacao />} />
            <Route path="/utilitarios/importacao-precos" element={<FrmImportacaoPrecos />} />
            <Route path="/utilitarios/catalogo-produtos" element={<FrmCadastroProdutos />} />
            <Route path="/utilitarios/configuracoes" element={<DatabaseConfig />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
