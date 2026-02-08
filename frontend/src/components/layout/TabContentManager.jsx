import React, { useMemo } from 'react';
import { useTabs } from '../../contexts/TabContext';
import { getComponentForPath } from '../../utils/componentMapping';

export const TabContentManager = () => {
    const { tabs, activeTab } = useTabs();

    // Memoiza a lista de componentes montados para evitar re-cálculos desnecessários
    // mas na prática, o React já cuida bem disso se as chaves forem estáveis.
    // O importante é NÃO desmontar o componente quando ele ficar invisível.

    return (
        <div className="flex-1 overflow-auto bg-gray-50 relative h-full">
            {tabs.map((tab) => {
                const isActive = tab.path === activeTab;
                const mapping = getComponentForPath(tab.path);

                // Se não achou componente, pode renderizar um 404 ou null
                if (!mapping) {
                    return isActive ? (
                        <div key={tab.path} className="p-8 text-center text-gray-500">
                            Página não encontrada: {tab.path}
                        </div>
                    ) : null;
                }

                const Component = mapping.component;
                const props = mapping.props || {};

                return (
                    <div
                        key={tab.path}
                        style={{ display: isActive ? 'block' : 'none', height: '100%' }}
                        className="h-full"
                    >
                        <Component {...props} />
                    </div>
                );
            })}
        </div>
    );
};
