import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

export function ProtectedRoute({ menuIndex, children, fallback = '/sem-acesso' }) {
    const { canAccess, loading } = usePermissions();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!canAccess(menuIndex)) {
        return <Navigate to={fallback} replace />;
    }

    return children;
}

// Exemplo de uso:
// <Route path="/alunos" element={
//     <ProtectedRoute menuIndex={101}>
//         <AlunosPage />
//     </ProtectedRoute>
// } />
