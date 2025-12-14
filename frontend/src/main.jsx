import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { Toaster } from './components/ui/sonner'
import './index.css'
import './styles/global.css'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<div className="page-placeholder">Página de Clientes em desenvolvimento</div>} />
          <Route path="/cadastros/*" element={<div className="page-placeholder">Cadastros em desenvolvimento</div>} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="/assistente" element={<div className="page-placeholder">Assistente IA em desenvolvimento</div>} />
          <Route path="/sincronizacao" element={<div className="page-placeholder">Sincronização em desenvolvimento</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes >
      </main >
    </div >
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <App />
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
