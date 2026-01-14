import { createContext, useContext, useState, useEffect } from 'react';

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPermissions() {
            const userId = localStorage.getItem('userId');
            if (!userId) { setLoading(false); return; }

            try {
                const response = await fetch(`/api/v2/system/my-permissions?userId=${userId}`);
                const data = await response.json();
                if (data.success) setPermissions(data);
            } catch (error) {
                console.error('Erro ao carregar permissões:', error);
            } finally {
                setLoading(false);
            }
        }
        loadPermissions();
    }, []);

    const canAccess = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        const perm = permissions.permissions?.find(p => p.indice === menuIndex);
        return perm && !perm.invisivel;
    };

    const canInsert = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        return permissions.permissions?.find(p => p.indice === menuIndex)?.incluir === true;
    };

    const canEdit = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        return permissions.permissions?.find(p => p.indice === menuIndex)?.modificar === true;
    };

    const canDelete = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        return permissions.permissions?.find(p => p.indice === menuIndex)?.excluir === true;
    };

    return (
        <PermissionsContext.Provider value={{
            permissions, loading, canAccess, canInsert, canEdit, canDelete,
            isMaster: permissions?.master || false,
            isGerencia: permissions?.isGerencia || false
        }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export const usePermissions = () => useContext(PermissionsContext);
