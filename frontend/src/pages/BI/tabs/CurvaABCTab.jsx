import React from 'react';
import ABCIntelligence from './ABCIntelligence';

const CurvaABCTab = ({ filters = {}, refreshTrigger }) => {
    // Mapeia os filtros recebidos via props para o formato esperado pelo ABCIntelligence
    const filtros = {
        ano: filters.ano || new Date().getFullYear(),
        meses: filters.mes === 'Todos' ? 'todos' : filters.mes || 'todos',
        industria: filters.industria && filters.industria !== 'Todos' ? filters.industria : 'todos',
        clientes: filters.cliente && filters.cliente !== 'Todos' ? filters.cliente : 'todos',
        metrica: filters.metrica || 'valor',
        considerarAnoTodo: filters.considerarAnoTodo || false,
        redeDeLojas: filters.redeDeLojas || false
    };

    return (
        <div className="curva-abc-tab p-4 h-full overflow-auto">
            <ABCIntelligence filtros={filtros} originalFilters={filters} refreshTrigger={refreshTrigger} />
        </div>
    );
};

export default CurvaABCTab;
