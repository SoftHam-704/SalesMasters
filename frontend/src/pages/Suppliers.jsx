import React, { useState, useEffect } from 'react';
import { Building2, Plus, Eye, Edit, Trash2, CheckCircle } from 'lucide-react';
import PageHeader from '../components/crud/PageHeader';
import DataGrid from '../components/crud/DataGrid';
import StatusBadge from '../components/crud/StatusBadge';
import SearchBar from '../components/crud/SearchBar';
import SupplierForm from '../components/SupplierForm';
import './Suppliers.css';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showInactive, setShowInactive] = useState(false);

    // Dados mockados para demonstração
    const mockSuppliers = [
        { id: 635, cnpj: '04.293.500/0001-10', reduzido: '2M PLASTIC', razao: '2M PLASTIC IND E COM DE PECAS AUTOMOTIVA...', telefone: '019-3849-1967', telefone2: '19 9 9791-0304', status: 'active' },
        { id: 1001, cnpj: '04.443.640/0001-92', reduzido: '3R RUBBER', razao: '3R - RUBBER MANUFACTURING INDUSTRIA E CO...', telefone: '1 - 4748-8700', telefone2: '', status: 'active' },
        { id: 1004, cnpj: '72.636.560/0001-20', reduzido: 'ARCA RETENTORES', razao: 'ARCA IND E COM IMP E EXP DE RETENTORES LTDA', telefone: '016-3209-2400', telefone2: '08007701024', status: 'active' },
        { id: 1005, cnpj: '01.599.101/0001-71', reduzido: 'BCR', razao: 'BCR INDUSTRIA DE PECAS AUTOMOTIVAS LTDA', telefone: '1 - 4412-9351', telefone2: '', status: 'active' },
        { id: 1014, cnpj: '12.611.670/0001-18', reduzido: 'CANAPARTS', razao: 'AICO FORJADO EXPORTACAO IMPORTACAO IND...', telefone: '(11-4702-0167', telefone2: '(1-1) 4613-4545', status: 'active' },
        { id: 1040, cnpj: '54.083.315/0043-18', reduzido: 'CIPLA', razao: 'CIPLA IND DE MATERIAIS E CONSTRUCAO S.A', telefone: '47-3026-9115', telefone2: '', status: 'active' },
        { id: 1041, cnpj: '19.142.590/0001-08', reduzido: 'CORTECO', razao: 'FREUDENBERG-NOX COMPONENTES BRASIL LTDA.', telefone: '1140728047', telefone2: '', status: 'active' },
        { id: 1053, cnpj: '12.414.220/0001-92', reduzido: 'ECOPADS', razao: 'ECO DISTRIBUIDORA E LOGISTICA LTDA - EM REC...', telefone: '1142623623', telefone2: '11 97546-9935', status: 'active' },
        { id: 1054, cnpj: '77.006.683/0004-33', reduzido: 'FANIA', razao: 'FANIA COMERCIO E INDUSTRIA DE PECAS LTDA.', telefone: '3536295800', telefone2: '35 99832-8375', status: 'active' },
        { id: 1062, cnpj: '50.162.770/0001-19', reduzido: 'HCS', razao: 'HAND CRAFT SISTEMAS DE EMBREAGEM LTDA', telefone: '(11-3245-4467 / 4466', telefone2: '011-3245-4436', status: 'active' }
    ];

    useEffect(() => {
        setSuppliers(mockSuppliers);
    }, []);

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = supplier.razao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.reduzido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.cnpj.includes(searchTerm);

        const matchesStatus = showInactive || supplier.status === 'active';

        return matchesSearch && matchesStatus;
    });

    const handleNew = () => {
        setSelectedSupplier(null);
        setShowForm(true);
    };

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setShowForm(true);
    };

    const handleDelete = (supplier) => {
        if (confirm(`Deseja realmente excluir ${supplier.reduzido}?`)) {
            console.log('Excluir:', supplier);
        }
    };

    const handleView = (supplier) => {
        setSelectedSupplier(supplier);
        setShowForm(true);
    };

    const handleSave = (formData) => {
        console.log('Salvar:', formData);
        setShowForm(false);
    };

    const handleClose = () => {
        setShowForm(false);
        setSelectedSupplier(null);
    };

    // Definição das colunas
    const columns = [
        {
            field: 'id',
            header: 'ID',
            width: '80px'
        },
        {
            field: 'cnpj',
            header: 'CNPJ',
            width: '160px'
        },
        {
            field: 'reduzido',
            header: 'Nome Reduzido',
            width: '180px',
            render: (value) => <strong>{value}</strong>
        },
        {
            field: 'razao',
            header: 'Razão Social',
            width: 'auto'
        },
        {
            field: 'telefone',
            header: 'Telefone',
            width: '140px'
        },
        {
            field: 'telefone2',
            header: 'Telefone 2',
            width: '140px'
        },
        {
            field: 'status',
            header: 'Status',
            width: '100px',
            render: (value) => (
                <StatusBadge
                    status={value}
                    label={value === 'active' ? 'Ativo' : 'Inativo'}
                    icon={value === 'active' ? <CheckCircle size={14} /> : null}
                />
            )
        }
    ];

    // Ações do menu
    const rowActions = [
        {
            label: 'Visualizar',
            icon: <Eye size={16} />,
            onClick: handleView
        },
        {
            label: 'Editar',
            icon: <Edit size={16} />,
            onClick: handleEdit
        },
        {
            label: 'Excluir',
            icon: <Trash2 size={16} />,
            onClick: handleDelete,
            variant: 'danger'
        }
    ];

    return (
        <div className="suppliers-page-premium">
            <PageHeader
                icon={<Building2 size={28} />}
                title="Fornecedores"
                subtitle="Gerencie seus fornecedores e parceiros comerciais"
                actions={
                    <button className="btn-primary-premium" onClick={handleNew}>
                        <Plus size={18} />
                        Novo Fornecedor
                    </button>
                }
            />

            <div className="suppliers-content">
                <div className="suppliers-toolbar-premium">
                    <SearchBar
                        placeholder="Buscar por nome, razão social ou CNPJ..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />

                    <div className="toolbar-filters">
                        <label className="checkbox-filter">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                            />
                            <span>Mostrar inativos</span>
                        </label>
                    </div>
                </div>

                <DataGrid
                    columns={columns}
                    data={filteredSuppliers}
                    actions={rowActions}
                    emptyMessage="Nenhum fornecedor encontrado"
                />

                <div className="suppliers-footer-premium">
                    <p className="record-count">
                        {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'registro' : 'registros'}
                    </p>
                </div>
            </div>

            {showForm && (
                <SupplierForm
                    supplier={selectedSupplier}
                    onClose={handleClose}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default Suppliers;
