import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const SupplierCustomersTab = ({ supplierId }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (supplierId) {
            fetchCustomers();
        }
    }, [supplierId]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:3005/api/suppliers/${supplierId}/customers`);
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching supplier customers:', error);
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
                <p>Carregando clientes...</p>
            </div>
        );
    }

    if (!supplierId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Salve o fornecedor primeiro para visualizar os clientes.</p>
            </div>
        );
    }

    if (customers.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Nenhum cliente realizou compras desta indústria ainda.</p>
            </div>
        );
    }

    const totalGeral = customers.reduce((sum, c) => sum + (parseFloat(c.total_compras) || 0), 0);

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    Clientes que já compraram ({customers.length})
                </h3>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                    Total: {formatCurrency(totalGeral)}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cliente</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', width: '150px' }}>Última Compra</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', width: '120px' }}>Qtd. Pedidos</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '150px' }}>Total Compras</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr
                                key={customer.cli_codigo}
                                style={{
                                    borderBottom: '1px solid #e5e7eb',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <td style={{ padding: '12px', color: '#1f2937' }}>{customer.cli_nomred}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{formatDate(customer.ultima_compra)}</td>
                                <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>{customer.qtd_pedidos}</td>
                                <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: '600' }}>{formatCurrency(customer.total_compras)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
