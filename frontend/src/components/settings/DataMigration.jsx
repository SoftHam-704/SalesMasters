import React, { useState } from 'react';
import { RefreshCw, Database, ArrowRight, Play, CheckCircle } from 'lucide-react';
import './DataMigration.css';

// Mock data - tabelas do Firebird
const mockTables = [
    { name: 'CLIENTES', records: 1250, hasMapping: false },
    { name: 'PRODUTOS', records: 850, hasMapping: false },
    { name: 'PEDIDOS', records: 3420, hasMapping: false },
    { name: 'ITENS_PEDIDO', records: 12580, hasMapping: false },
    { name: 'FORNECEDORES', records: 180, hasMapping: false },
    { name: 'CATEGORIAS', records: 45, hasMapping: false },
];

export const DataMigration = () => {
    const [selectedTables, setSelectedTables] = useState([]);
    const [migrating, setMigrating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);

    const toggleTable = (tableName) => {
        setSelectedTables(prev =>
            prev.includes(tableName)
                ? prev.filter(t => t !== tableName)
                : [...prev, tableName]
        );
    };

    const selectAll = () => {
        if (selectedTables.length === mockTables.length) {
            setSelectedTables([]);
        } else {
            setSelectedTables(mockTables.map(t => t.name));
        }
    };

    const startMigration = () => {
        if (selectedTables.length === 0) {
            alert('Selecione pelo menos uma tabela para migrar');
            return;
        }

        setMigrating(true);
        setProgress(0);
        setLogs([]);

        // Simular migração
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 10;
            setProgress(currentProgress);

            if (currentProgress === 30) {
                setLogs(prev => [...prev, { type: 'info', message: 'Conectando ao Firebird...' }]);
            } else if (currentProgress === 50) {
                setLogs(prev => [...prev, { type: 'success', message: 'Lendo estrutura das tabelas...' }]);
            } else if (currentProgress === 70) {
                setLogs(prev => [...prev, { type: 'info', message: 'Migrando dados...' }]);
            } else if (currentProgress === 100) {
                setLogs(prev => [...prev, { type: 'success', message: 'Migração concluída com sucesso!' }]);
                setMigrating(false);
                clearInterval(interval);
            }
        }, 500);
    };

    const importSuppliers = async () => {
        setMigrating(true);
        setProgress(0);
        setLogs([{ type: 'info', message: 'Iniciando importação de fornecedores...' }]);

        try {
            const response = await fetch('http://localhost:3001/api/import/suppliers', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                setProgress(100);
                setLogs(prev => [
                    ...prev,
                    { type: 'success', message: `✓ Importação concluída!` },
                    { type: 'info', message: `Total: ${data.stats.total} | Inseridos: ${data.stats.inserted} | Erros: ${data.stats.errors}` }
                ]);
            } else {
                setLogs(prev => [...prev, { type: 'error', message: `✗ Erro: ${data.message}` }]);
            }
        } catch (error) {
            setLogs(prev => [...prev, { type: 'error', message: `✗ Erro ao conectar: ${error.message}` }]);
        } finally {
            setMigrating(false);
        }
    };

    const importSuppliersXLSX = async () => {
        setMigrating(true);
        setProgress(0);
        setLogs([{ type: 'info', message: 'Iniciando importação de fornecedores (XLSX)...' }]);

        try {
            const response = await fetch('http://localhost:3001/api/import/suppliers-xlsx', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                setProgress(100);
                setLogs(prev => [
                    ...prev,
                    { type: 'success', message: `✓ Importação concluída!` },
                    { type: 'info', message: `Total: ${data.stats.total} | Inseridos: ${data.stats.inserted} | Erros: ${data.stats.errors}` }
                ]);
            } else {
                setLogs(prev => [...prev, { type: 'error', message: `✗ Erro: ${data.message}` }]);
            }
        } catch (error) {
            setLogs(prev => [...prev, { type: 'error', message: `✗ Erro ao conectar: ${error.message}` }]);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="data-migration">
            <div className="migration-header">
                <RefreshCw size={24} className="header-icon" />
                <div>
                    <h2>Migração de Dados</h2>
                    <p>Migre dados do Firebird para PostgreSQL</p>
                </div>
                <button
                    className="btn-quick-import"
                    onClick={importSuppliers}
                    disabled={migrating}
                    style={{
                        marginLeft: 'auto',
                        padding: '0.75rem 1.5rem',
                        background: 'var(--gradient-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: migrating ? 'not-allowed' : 'pointer',
                        opacity: migrating ? 0.5 : 1,
                        marginRight: '0.5rem'
                    }}
                >
                    {migrating ? 'Importando...' : '📄 CSV'}
                </button>
                <button
                    className="btn-quick-import"
                    onClick={importSuppliersXLSX}
                    disabled={migrating}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: migrating ? 'not-allowed' : 'pointer',
                        opacity: migrating ? 0.5 : 1
                    }}
                >
                    {migrating ? 'Importando...' : '📊 XLSX (Recomendado)'}
                </button>
            </div>

            <div className="migration-content">
                {/* Tables Selection */}
                <div className="tables-panel">
                    <div className="panel-header">
                        <h3>Tabelas Firebird</h3>
                        <button className="btn-select-all" onClick={selectAll}>
                            {selectedTables.length === mockTables.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                        </button>
                    </div>

                    <div className="tables-list">
                        {mockTables.map(table => (
                            <label key={table.name} className="table-item">
                                <input
                                    type="checkbox"
                                    checked={selectedTables.includes(table.name)}
                                    onChange={() => toggleTable(table.name)}
                                />
                                <div className="table-info">
                                    <span className="table-name">{table.name}</span>
                                    <span className="table-records">{table.records.toLocaleString()} registros</span>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="selection-summary">
                        <Database size={16} />
                        <span>{selectedTables.length} tabela(s) selecionada(s)</span>
                    </div>
                </div>

                {/* Migration Settings */}
                <div className="settings-panel">
                    <div className="panel-header">
                        <h3>Configurações</h3>
                    </div>

                    <div className="form-group">
                        <label>Modo de Migração</label>
                        <select className="form-select">
                            <option value="insert">Inserir novos registros</option>
                            <option value="replace">Substituir existentes</option>
                            <option value="merge">Mesclar (atualizar se existe)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tamanho do Lote</label>
                        <input
                            type="number"
                            className="form-input"
                            defaultValue={1000}
                            min={100}
                            max={10000}
                            step={100}
                        />
                        <small>Registros processados por vez</small>
                    </div>

                    <div className="form-group">
                        <label>Tratamento de Erros</label>
                        <select className="form-select">
                            <option value="stop">Parar na primeira falha</option>
                            <option value="continue">Continuar e registrar</option>
                            <option value="skip">Pular registro com erro</option>
                        </select>
                    </div>

                    <button
                        className="btn-migrate"
                        onClick={startMigration}
                        disabled={migrating || selectedTables.length === 0}
                    >
                        <Play size={16} />
                        {migrating ? 'Migrando...' : 'Iniciar Migração'}
                    </button>
                </div>

                {/* Progress and Logs */}
                <div className="progress-panel">
                    <div className="panel-header">
                        <h3>Progresso</h3>
                    </div>

                    {migrating || progress > 0 ? (
                        <>
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${progress}%` }}>
                                    <span className="progress-text">{progress}%</span>
                                </div>
                            </div>

                            <div className="logs-container">
                                <h4>Log de Migração</h4>
                                <div className="logs-list">
                                    {logs.map((log, index) => (
                                        <div key={index} className={`log-item log-${log.type}`}>
                                            <CheckCircle size={14} />
                                            <span>{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <RefreshCw size={48} className="empty-icon" />
                            <p>Selecione as tabelas e clique em "Iniciar Migração"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
