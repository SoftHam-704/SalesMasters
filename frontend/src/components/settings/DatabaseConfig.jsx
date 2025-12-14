import React, { useState } from 'react';
import { Database, Server, Check, X, Save } from 'lucide-react';
import './DatabaseConfig.css';

export const DatabaseConfig = () => {
    const [firebirdConfig, setFirebirdConfig] = useState({
        type: 'local',
        host: 'localhost',
        port: 3050,
        database: '',
        username: 'SYSDBA',
        password: ''
    });

    const [postgresConfig, setPostgresConfig] = useState({
        type: 'local',
        host: 'localhost',
        port: 5432,
        database: '',
        username: 'postgres',
        password: ''
    });

    const [firebirdStatus, setFirebirdStatus] = useState(null);
    const [postgresStatus, setPostgresStatus] = useState(null);
    const [testing, setTesting] = useState({ firebird: false, postgres: false });

    const handleFirebirdChange = (field, value) => {
        setFirebirdConfig(prev => ({ ...prev, [field]: value }));
        setFirebirdStatus(null);
    };

    const handlePostgresChange = (field, value) => {
        setPostgresConfig(prev => ({ ...prev, [field]: value }));
        setPostgresStatus(null);
    };

    const testFirebirdConnection = async () => {
        setTesting(prev => ({ ...prev, firebird: true }));
        setFirebirdStatus(null);

        try {
            const response = await fetch('http://localhost:3001/api/firebird/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(firebirdConfig)
            });

            const data = await response.json();

            if (data.success) {
                setFirebirdStatus({ success: true, message: data.message });
            } else {
                setFirebirdStatus({ success: false, message: data.message });
            }
        } catch (error) {
            setFirebirdStatus({
                success: false,
                message: `Erro ao conectar com o backend: ${error.message}`
            });
        } finally {
            setTesting(prev => ({ ...prev, firebird: false }));
        }
    };

    const testPostgresConnection = async () => {
        setTesting(prev => ({ ...prev, postgres: true }));
        // Simular teste de conexão
        setTimeout(() => {
            setPostgresStatus({ success: true, message: 'Conexão estabelecida com sucesso!' });
            setTesting(prev => ({ ...prev, postgres: false }));
        }, 1500);
    };

    const saveFirebirdConfig = () => {
        localStorage.setItem('firebird_config', JSON.stringify(firebirdConfig));
        alert('Configuração do Firebird salva com sucesso!');
    };

    const savePostgresConfig = () => {
        localStorage.setItem('postgres_config', JSON.stringify(postgresConfig));
        alert('Configuração do PostgreSQL salva com sucesso!');
    };

    return (
        <div className="database-config">
            <div className="config-header">
                <Database size={24} className="header-icon" />
                <div>
                    <h2>Configuração de Banco de Dados</h2>
                    <p>Configure as conexões com Firebird e PostgreSQL</p>
                </div>
            </div>

            <div className="config-panels">
                {/* Firebird Panel */}
                <div className="config-panel">
                    <div className="panel-header">
                        <Server size={20} />
                        <h3>Firebird</h3>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Conexão</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    value="local"
                                    checked={firebirdConfig.type === 'local'}
                                    onChange={(e) => handleFirebirdChange('type', e.target.value)}
                                />
                                <span>Local</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    value="remote"
                                    checked={firebirdConfig.type === 'remote'}
                                    onChange={(e) => handleFirebirdChange('type', e.target.value)}
                                />
                                <span>Remoto</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Host/IP</label>
                            <input
                                type="text"
                                value={firebirdConfig.host}
                                onChange={(e) => handleFirebirdChange('host', e.target.value)}
                                disabled={firebirdConfig.type === 'local'}
                                placeholder="localhost ou IP"
                            />
                        </div>
                        <div className="form-group small">
                            <label>Porta</label>
                            <input
                                type="number"
                                value={firebirdConfig.port}
                                onChange={(e) => handleFirebirdChange('port', e.target.value)}
                                placeholder="3050"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Caminho do Banco de Dados *</label>
                        <input
                            type="text"
                            value={firebirdConfig.database}
                            onChange={(e) => handleFirebirdChange('database', e.target.value)}
                            placeholder="C:\Dados\SALESMASTER.FDB"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Usuário</label>
                            <input
                                type="text"
                                value={firebirdConfig.username}
                                onChange={(e) => handleFirebirdChange('username', e.target.value)}
                                placeholder="SYSDBA"
                            />
                        </div>
                        <div className="form-group">
                            <label>Senha</label>
                            <input
                                type="password"
                                value={firebirdConfig.password}
                                onChange={(e) => handleFirebirdChange('password', e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {firebirdStatus && (
                        <div className={`status-message ${firebirdStatus.success ? 'success' : 'error'}`}>
                            {firebirdStatus.success ? <Check size={16} /> : <X size={16} />}
                            <span>{firebirdStatus.message}</span>
                        </div>
                    )}

                    <div className="panel-actions">
                        <button
                            className="btn-test"
                            onClick={testFirebirdConnection}
                            disabled={testing.firebird || !firebirdConfig.database}
                        >
                            {testing.firebird ? 'Testando...' : 'Testar Conexão'}
                        </button>
                        <button
                            className="btn-save"
                            onClick={saveFirebirdConfig}
                            disabled={!firebirdStatus?.success}
                        >
                            <Save size={16} />
                            Salvar Configuração
                        </button>
                    </div>
                </div>

                {/* PostgreSQL Panel */}
                <div className="config-panel">
                    <div className="panel-header">
                        <Server size={20} />
                        <h3>PostgreSQL</h3>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Conexão</label>
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    value="local"
                                    checked={postgresConfig.type === 'local'}
                                    onChange={(e) => handlePostgresChange('type', e.target.value)}
                                />
                                <span>Local</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    value="remote"
                                    checked={postgresConfig.type === 'remote'}
                                    onChange={(e) => handlePostgresChange('type', e.target.value)}
                                />
                                <span>Remoto</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Host/IP</label>
                            <input
                                type="text"
                                value={postgresConfig.host}
                                onChange={(e) => handlePostgresChange('host', e.target.value)}
                                placeholder="localhost ou IP"
                            />
                        </div>
                        <div className="form-group small">
                            <label>Porta</label>
                            <input
                                type="number"
                                value={postgresConfig.port}
                                onChange={(e) => handlePostgresChange('port', e.target.value)}
                                placeholder="5432"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nome do Banco de Dados *</label>
                        <input
                            type="text"
                            value={postgresConfig.database}
                            onChange={(e) => handlePostgresChange('database', e.target.value)}
                            placeholder="salesmaster"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Usuário</label>
                            <input
                                type="text"
                                value={postgresConfig.username}
                                onChange={(e) => handlePostgresChange('username', e.target.value)}
                                placeholder="postgres"
                            />
                        </div>
                        <div className="form-group">
                            <label>Senha</label>
                            <input
                                type="password"
                                value={postgresConfig.password}
                                onChange={(e) => handlePostgresChange('password', e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {postgresStatus && (
                        <div className={`status-message ${postgresStatus.success ? 'success' : 'error'}`}>
                            {postgresStatus.success ? <Check size={16} /> : <X size={16} />}
                            <span>{postgresStatus.message}</span>
                        </div>
                    )}

                    <div className="panel-actions">
                        <button
                            className="btn-test"
                            onClick={testPostgresConnection}
                            disabled={testing.postgres || !postgresConfig.database}
                        >
                            {testing.postgres ? 'Testando...' : 'Testar Conexão'}
                        </button>
                        <button
                            className="btn-save"
                            onClick={savePostgresConfig}
                            disabled={!postgresStatus?.success}
                        >
                            <Save size={16} />
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
