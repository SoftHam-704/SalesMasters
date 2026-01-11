import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const ClientPurchasedIndustriesTab = ({ clientId }) => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clientId) {
            fetchPurchases();
        }
    }, [clientId]);

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`https://salesmasters.softham.com.br/api/clients/${clientId}/purchased-industries`);
            setPurchases(response.data);
        } catch (error) {
            console.error('Error fetching purchased industries:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Carregando indústrias...</p>
            </div>
        );
    }

    if (!clientId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Salve o cliente primeiro para visualizar as indústrias.</p>
            </div>
        );
    }

    if (purchases.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Nenhuma compra realizada ainda.</p>
            </div>
        );
    }

    const totalGeral = purchases.reduce((sum, p) => sum + (parseFloat(p.ped_totliq) || 0), 0);

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    Indústrias compradas ({purchases.length} pedidos)
                </h3>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                    Total: {formatCurrency(totalGeral)}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', width: '100px' }}>Pedido</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', width: '120px' }}>Data</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Indústria</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '150px' }}>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map((purchase, index) => (
                            <tr
                                key={`${purchase.ped_pedido}-${index}`}
                                style={{
                                    borderBottom: '1px solid #e5e7eb',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <td style={{ padding: '12px', color: '#1f2937' }}>{purchase.ped_pedido}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{formatDate(purchase.ped_data)}</td>
                                <td style={{ padding: '12px', color: '#1f2937' }}>{purchase.for_nomered || '-'}</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>{formatCurrency(purchase.ped_totliq)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
