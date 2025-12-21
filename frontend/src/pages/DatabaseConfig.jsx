import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, CheckCircle2, AlertCircle, Database } from 'lucide-react';

const DatabaseConfig = () => {
    const [config, setConfig] = useState({
        host: 'localhost',
        port: 5432,
        database: 'basesales',
        user: 'postgres',
        password: '',
        ssl: false
    });

    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);

    // Carregar configuração atual
    useEffect(() => {
        fetch('http://localhost:3005/api/config/database')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConfig(prev => ({ ...prev, ...data.config }));
                }
            })
            .catch(err => console.error('Erro ao carregar configuração:', err));
    }, []);

    const handleTest = async () => {
        setTesting(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost:3005/api/config/database/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            setResult({
                success: data.success,
                message: data.message
            });
        } catch (error) {
            setResult({
                success: false,
                message: `Erro ao testar conexão: ${error.message}`
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost:3005/api/config/database/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            setResult({
                success: data.success,
                message: data.message
            });
        } catch (error) {
            setResult({
                success: false,
                message: `Erro ao salvar configuração: ${error.message}`
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Configurações do Banco de Dados PostgreSQL
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Informação */}
                    <Alert className="border-blue-200 bg-blue-50">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            Configure as credenciais de conexão com o banco de dados PostgreSQL.
                            Funciona tanto para banco local quanto em nuvem.
                        </AlertDescription>
                    </Alert>

                    {/* Formulário */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="host">Host / Servidor *</Label>
                            <Input
                                id="host"
                                value={config.host}
                                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                placeholder="localhost ou IP do servidor"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="port">Porta *</Label>
                            <Input
                                id="port"
                                type="number"
                                value={config.port}
                                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                                placeholder="5432"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="database">Nome do Banco *</Label>
                            <Input
                                id="database"
                                value={config.database}
                                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                                placeholder="basesales"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user">Usuário *</Label>
                            <Input
                                id="user"
                                value={config.user}
                                onChange={(e) => setConfig({ ...config, user: e.target.value })}
                                placeholder="postgres"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="password">Senha *</Label>
                            <Input
                                id="password"
                                type="password"
                                value={config.password}
                                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                placeholder="Digite a senha do banco"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="ssl"
                                    checked={config.ssl}
                                    onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="ssl" className="cursor-pointer">
                                    Usar SSL (recomendado para conexões em nuvem)
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Resultado */}
                    {result && (
                        <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                                <strong>{result.message}</strong>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={handleTest}
                            disabled={testing || !config.host || !config.database || !config.user || !config.password}
                        >
                            {testing ? 'Testando...' : '🔍 Testar Conexão'}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !config.host || !config.database || !config.user || !config.password}
                        >
                            {saving ? 'Salvando...' : '💾 Salvar Configuração'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DatabaseConfig;
