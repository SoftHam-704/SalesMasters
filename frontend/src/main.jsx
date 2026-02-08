import './utils/fetchInterceptor';
import './utils/axiosInterceptor';
import { StrictMode } from 'react';
import '@fontsource/inter';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { TabProvider } from './contexts/TabContext';
import { Toaster } from './components/ui/sonner';
import './index.css';
import './styles/global.css';
import './App.css';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <TabProvider>
          <App />
          <Toaster />
        </TabProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);

