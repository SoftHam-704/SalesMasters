import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/ThemeProvider'
import './index.css'
import './styles/global.css'
import Sidebar from './components/Sidebar'
import SuppliersLovable from './pages/SuppliersLovable'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <SuppliersLovable />
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
