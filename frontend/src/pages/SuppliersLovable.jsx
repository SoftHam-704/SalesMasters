import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Edit, Trash2, RefreshCw, Building2, Phone,
    MoreVertical, Filter, Download, ChevronLeft, ChevronRight,
    Check, X, Eye, EyeOff
} from 'lucide-react';
import SupplierForm from '../components/SupplierForm';
import './SuppliersLovable.css';

const initialSuppliers = [
    { id: '0020', cnpj: '04.293.500/0001-10', shortName: '2M PLASTIC', companyName: '2M PLASTIC IND E COM DE PECAS AUTOMOTIVAS LTDA', phone1: '019-3849-1967', phone2: '19 9 9791-0304', active: true },
    { id: '0061', cnpj: '04.443.640/0001-92', shortName: '3R RUBBER', companyName: '3R - RUBBER MANUFACTURING INDUSTRIA E COMERCIO LTDA.', phone1: '1 - 4748-8700', phone2: '', active: true },
    { id: '0008', cnpj: '72.636.560/0001-20', shortName: 'ARCA RETENTORES', companyName: 'ARCA IND E COM IMP E EXP DE RETENTORES LTDA', phone1: '016-3209-2400', phone2: '08007701024', active: true },
    { id: '0011', cnpj: '00.567.295/0001-82', shortName: 'BCR', companyName: 'BCR INDUSTRIA DE PECAS AUTOMOTIVAS LTDA', phone1: '11 4412-9951', phone2: '', active: true },
    { id: '0054', cnpj: '12.611.670/0001-18', shortName: 'CANAPARTS', companyName: 'AICO FORJADO EXPORTACAO IMPORTACAO INDUSTRIA E COMERCIO LTDA', phone1: '(11-4702-0167', phone2: '(1-1) 4613-4545', active: true },
    { id: '0040', cnpj: '54.083.315/0043-18', shortName: 'CIPLA', companyName: 'CIPLA IND DE MATERIAIS E CONSTRUCAO S.A', phone1: '47-3026-9115', phone2: '', active: true },
    { id: '0063', cnpj: '19.142.590/0001-08', shortName: 'CORTECO', companyName: 'FREUDENBERG-NOX COMPONENTES BRASIL LTDA.', phone1: '1140728047', phone2: '', active: true },
    { id: '0053', cnpj: '12.414.220/0001-92', shortName: 'ECOPADS', companyName: 'ECO DISTRIBUIDORA E LOGISTICA LTDA - EM REC...', phone1: '1142623623', phone2: '11 97546-9935', active: true },
    { id: '0052', cnpj: '77.006.683/0004-33', shortName: 'FANIA', companyName: 'FANIA COMERCIO E INDUSTRIA DE PECAS LTDA.', phone1: '3536295800', phone2: '35 99832-8375', active: true },
    { id: '0002', cnpj: '50.162.770/0001-19', shortName: 'HCS', companyName: 'HAND CRAFT SISTEMAS DE EMBREAGEM LTDA', phone1: '(11-3245-4467 / 4466', phone2: '011-3245-4436', active: true },
];

const SuppliersLovable = () => {
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch =
            supplier.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.cnpj.includes(searchTerm);
        const matchesStatus = showInactive ? true : supplier.active;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNew = () => {
        setSelectedSupplier(null);
        setShowForm(true);
    };

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setShowForm(true);
        setActiveMenu(null);
    };

    const handleDelete = (supplier) => {
        setSelectedSupplier(supplier);
        setShowDeleteDialog(true);
        setActiveMenu(null);
    };

    const confirmDelete = () => {
        if (selectedSupplier) {
            setSuppliers(suppliers.filter(s => s.id !== selectedSupplier.id));
            setShowDeleteDialog(false);
            setSelectedSupplier(null);
        }
    };

    const toggleStatus = (supplier) => {
        setSuppliers(suppliers.map(s =>
            s.id === supplier.id ? { ...s, active: !s.active } : s
        ));
        setActiveMenu(null);
    };

    return (
        <div className="suppliers-lovable">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="page-header-lovable"
            >
                <div className="header-content">
                    <div className="header-icon">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1>Fornecedores</h1>
                        <p>Gerencie seus fornecedores e parceiros comerciais</p>
                    </div>
                </div>
                <button className="btn-primary-lovable" onClick={handleNew}>
                    <Plus size={20} />
                    Novo Fornecedor
                </button>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="filters-card"
            >
                <div className="filters-content">
                    <div className="search-container">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, razão social ou CNPJ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input-lovable"
                        />
                    </div>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                        <span>Mostrar inativos</span>
                    </label>
                </div>
                <div className="filter-buttons">
                    <button className="btn-outline-lovable">
                        <Filter size={16} />
                        Filtros
                    </button>
                    <button className="btn-outline-lovable">
                        <Download size={16} />
                        Exportar
                    </button>
                    <button className="btn-outline-lovable">
                        <RefreshCw size={16} />
                        Atualizar
                    </button>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="table-card"
            >
                <div className="table-container">
                    <table className="suppliers-table-lovable">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>CNPJ</th>
                                <th>Nome Reduzido</th>
                                <th>Razão Social</th>
                                <th>Telefone</th>
                                <th>Telefone 2</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {paginatedSuppliers.map((supplier, index) => (
                                    <motion.tr
                                        key={supplier.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={!supplier.active ? 'inactive' : ''}
                                        onClick={() => handleEdit(supplier)}
                                    >
                                        <td className="id-cell">#{supplier.id}</td>
                                        <td className="cnpj-cell">{supplier.cnpj}</td>
                                        <td className="name-cell">{supplier.shortName}</td>
                                        <td className="company-cell">{supplier.companyName}</td>
                                        <td className="phone-cell">
                                            <Phone size={14} />
                                            {supplier.phone1 || '-'}
                                        </td>
                                        <td className="phone2-cell">{supplier.phone2 || '-'}</td>
                                        <td className="text-center">
                                            <span
                                                className={`status-badge ${supplier.active ? 'active' : 'inactive'}`}
                                                onClick={(e) => { e.stopPropagation(); toggleStatus(supplier); }}
                                            >
                                                {supplier.active ? <><Check size={12} /> Ativo</> : <><X size={12} /> Inativo</>}
                                            </span>
                                        </td>
                                        <td className="text-center actions-cell" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="btn-menu-lovable"
                                                onClick={() => setActiveMenu(activeMenu === supplier.id ? null : supplier.id)}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenu === supplier.id && (
                                                <div className="dropdown-menu">
                                                    <button onClick={() => handleEdit(supplier)}>
                                                        <Edit size={14} />
                                                        Editar
                                                    </button>
                                                    <button onClick={() => toggleStatus(supplier)}>
                                                        {supplier.active ? <><EyeOff size={14} /> Desativar</> : <><Eye size={14} /> Ativar</>}
                                                    </button>
                                                    <div className="menu-separator"></div>
                                                    <button className="delete-btn" onClick={() => handleDelete(supplier)}>
                                                        <Trash2 size={14} />
                                                        Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                    <p className="pagination-info">
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} de {filteredSuppliers.length} registros
                    </p>
                    <div className="pagination-buttons">
                        <button
                            className="btn-page"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`btn-page ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            className="btn-page"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Form Modal */}
            {showForm && (
                <SupplierForm
                    supplier={selectedSupplier}
                    onClose={() => setShowForm(false)}
                    onSave={() => setShowForm(false)}
                />
            )}

            {/* Delete Dialog */}
            {showDeleteDialog && (
                <div className="dialog-overlay" onClick={() => setShowDeleteDialog(false)}>
                    <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <div className="dialog-icon delete">
                                <Trash2 size={20} />
                            </div>
                            <h3>Confirmar Exclusão</h3>
                        </div>
                        <p className="dialog-description">
                            Tem certeza que deseja excluir o fornecedor <strong>{selectedSupplier?.shortName}</strong>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="dialog-footer">
                            <button className="btn-outline-lovable" onClick={() => setShowDeleteDialog(false)}>
                                Cancelar
                            </button>
                            <button className="btn-danger" onClick={confirmDelete}>
                                Excluir Fornecedor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersLovable;
