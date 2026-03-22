import React, { useState, useEffect } from 'react';
import axios from '../../lib/axios';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

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
            const response = await axios.get(`https://salesmasters.softham.com.br/api/suppliers/${supplierId}/customers`);
            setCustomers(response.data);
        } catch (error) {
            console.error('Error fetching supplier customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!customers || customers.length === 0) return;

        const data = customers.map(c => ({
            'Código': c.cli_codigo,
            'Razão Social/Fantasia': c.cli_nomred,
            'CNPJ': c.cli_cnpj || '-',
            'Última Compra': c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-BR') : '-',
            'Qtd. Pedidos': c.qtd_pedidos,
            'Total Compras': parseFloat(c.total_compras || 0)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

        // Column widths
        const wscols = [
            { wch: 10 }, // Codigo
            { wch: 40 }, // Nome
            { wch: 20 }, // CNPJ
            { wch: 15 }, // Ultima Compra
            { wch: 12 }, // Qtd
            { wch: 15 }, // Total
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, `clientes_industria_${supplierId}.xlsx`);
    };

    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatCNPJ = (val) => {
        if (!val) return '-';
        const clean = val.replace(/\D/g, '');
        if (clean.length !== 14) return val;
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        Clientes que já compraram ({customers.length})
                    </h3>
                    <button
                        onClick={handleExportExcel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                    >
                        <Download size={14} />
                        EXPORTAR EXCEL
                    </button>
                </div>
                <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                    Total: {formatCurrency(totalGeral)}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cliente</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151', width: '140px' }}>CNPJ</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', width: '120px' }}>Última Compra</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151', width: '100px' }}>Qtd. Pedidos</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151', width: '130px' }}>Total Compras</th>
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
                                <td style={{ padding: '12px', color: '#1f2937' }}>
                                    <div style={{ fontWeight: '500' }}>{customer.cli_nomred}</div>
                                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Cód: {customer.cli_codigo}</div>
                                </td>
                                <td style={{ padding: '12px', color: '#6b7280' }}>{formatCNPJ(customer.cli_cnpj)}</td>
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
