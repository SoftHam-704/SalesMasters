import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const DemoCloud = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connectionTime, setConnectionTime] = useState(null);

    useEffect(() => {
        const fetchEmpresas = async () => {
            const startTime = Date.now();
            try {
                const res = await fetch('https://salesmasters.softham.com.br/api/master/empresas', {
                    headers: { 'x-user-role': 'admin' }
                });
                const data = await res.json();
                setConnectionTime(Date.now() - startTime);

                if (data.success) {
                    setEmpresas(data.data || []);
                } else {
                    setError(data.message || 'Erro ao buscar empresas');
                }
            } catch (e) {
                setConnectionTime(Date.now() - startTime);
                setError('Erro de conexão: ' + e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEmpresas();
    }, []);

    const formatCNPJ = (cnpj) => {
        const clean = (cnpj || '').replace(/\D/g, '');
        if (clean.length !== 14) return cnpj;
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    const getStatusBadge = (status) => {
        const styles = {
            'ATIVO': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: CheckCircle2 },
            'BLOQUEADO': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: XCircle },
            'INADIMPLENTE': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: AlertTriangle },
            'DEGUSTAÇÃO': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: Building2 }
        };
        const style = styles[status] || styles['ATIVO'];
        const Icon = style.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-amber-400" />
                            SalesMasters - Demo Cloud
                        </h1>
                        <p className="text-blue-300 mt-1">
                            Conexão ao banco de dados na nuvem (SaveInCloud)
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Servidor</div>
                        <div className="text-white font-mono text-sm">
                            node254557-salesmaster.sp1.br.saveincloud.net.br
                        </div>
                        {connectionTime && (
                            <div className="text-green-400 text-xs mt-1">
                                ✓ Resposta em {connectionTime}ms
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className="max-w-5xl mx-auto mb-6">
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-white/10 border-white/20">
                        <CardContent className="p-4 text-center">
                            <div className="text-4xl font-bold text-white">{empresas.length}</div>
                            <div className="text-blue-300 text-sm">Total de Empresas</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500/20 border-green-500/30">
                        <CardContent className="p-4 text-center">
                            <div className="text-4xl font-bold text-green-400">
                                {empresas.filter(e => e.status === 'ATIVO').length}
                            </div>
                            <div className="text-green-300 text-sm">Ativas</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-500/20 border-amber-500/30">
                        <CardContent className="p-4 text-center">
                            <div className="text-4xl font-bold text-amber-400">
                                {empresas.filter(e => e.status !== 'ATIVO').length}
                            </div>
                            <div className="text-amber-300 text-sm">Outras</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content */}
            <Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Empresas Cadastradas na Nuvem
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <span className="ml-3 text-gray-600">Conectando ao banco na nuvem...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                            <strong>Erro:</strong> {error}
                        </div>
                    )}

                    {!loading && !error && empresas.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            Nenhuma empresa encontrada no banco.
                        </div>
                    )}

                    {!loading && !error && empresas.length > 0 && (
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CNPJ</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Razão Social</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome Fantasia</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Banco</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {empresas.map((empresa, idx) => (
                                        <tr key={empresa.id || idx} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-sm whitespace-nowrap">
                                                {formatCNPJ(empresa.cnpj)}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {empresa.razao_social}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {empresa.nome_fantasia || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                                                {empresa.db_nome}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(empresa.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="max-w-5xl mx-auto mt-8 text-center text-gray-400 text-sm">
                SalesMasters © 2026 — Conectado à nuvem SaveInCloud
            </div>
        </div>
    );
};

export default DemoCloud;
