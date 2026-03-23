import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { catalogApi } from './lib/api';

// Pages - Serão criadas a seguir
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import VoiceSessionPage from './pages/VoiceSessionPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';

// Proteção de Rota
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, lojista, isInitialized } = useAuthStore();
    
    if (!isInitialized) return <div className="min-h-screen bg-[#06112a] flex items-center justify-center text-white">Carregando...</div>;
    if (!token || !lojista) return <Navigate to="/login-error" />;
    
    return <>{children}</>;
};

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
    const [searchParams] = useSearchParams();
    const { setToken, setAuth, isInitialized, clearAuth } = useAuthStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const tokenFromUrl = searchParams.get('t');
            const currentToken = tokenFromUrl || localStorage.getItem('iris_token');

            if (currentToken) {
                if (tokenFromUrl) setToken(tokenFromUrl);
                
                try {
                    // Reforço: Limpar caracteres inválidos e normalizar Base64 antes de validar
                    // O browser converte '+' em ' ' na URL, precisamos reverter
                    const cleanToken = currentToken.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
                    const res = await catalogApi.validateToken(cleanToken);
                    
                    if (res.data.success) {
                        setAuth(res.data.lojista, res.data.industrias);
                    } else {
                        console.error('Token inválido pelo servidor');
                        clearAuth();
                    }
                } catch (e) {
                    console.error('Falha na autenticação inicial:', e);
                    clearAuth();
                }
            } else {
                setAuth(null as any, []); // Mark as initialized but no user
            }
            setLoading(false);
        };
        init();
    }, [searchParams]);

    if (loading) return null;
    return <>{children}</>;
};

const App = () => {
    return (
        <BrowserRouter basename="/iris">
            <AuthInitializer>
                <div className="min-h-screen bg-[#06112a] text-white font-outfit">
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
                        <Route path="/voice" element={<ProtectedRoute><VoiceSessionPage /></ProtectedRoute>} />
                        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                        <Route path="/login-error" element={<div className="p-10 text-center">Acesso inválido ou expirado.</div>} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </AuthInitializer>
        </BrowserRouter>
    );
};

export default App;
