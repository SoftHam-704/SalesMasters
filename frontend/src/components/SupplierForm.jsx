import React, { useState } from 'react';
import { X, Save, Search, Plus, Trash2, Edit } from 'lucide-react';
import './SupplierForm.css';
import { SupplierCustomersTab } from './tabs/SupplierCustomersTab';

const SupplierForm = ({ supplier, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState('principal');
    const [activeRelatedTab, setActiveRelatedTab] = useState('contatos');

    const [formData, setFormData] = useState({
        // Dados principais
        cnpj: supplier?.cnpj || '',
        inscricao: supplier?.inscricao || '',
        razao: supplier?.razao || '',
        situacao: supplier?.situacao || 'Ativo',
        endereco: supplier?.endereco || '',
        bairro: supplier?.bairro || '',
        cidade: supplier?.cidade || '',
        uf: supplier?.uf || 'SP',
        cep: supplier?.cep || '',
        telefone: supplier?.telefone || '',
        telefone2: supplier?.telefone2 || '',
        fax: supplier?.fax || '',
        email: supplier?.email || '',
        nomeReduzido: supplier?.nomeReduzido || '',

        // Dados completos
        imagemApp: supplier?.imagemApp || '',
        codRepresentante: supplier?.codRepresentante || '',
        comissao: supplier?.comissao || '5,00',
        observacoes: supplier?.observacoes || '',
        logotipo: supplier?.logotipo || '',

        // Descontos padrão (10 níveis)
        descontos: supplier?.descontos || {
            desc1: '10,00', desc2: '0,00', desc3: '0,00', desc4: '0,00', desc5: '0,00',
            desc6: '0,00', desc7: '0,00', desc8: '0,00', desc9: '0,00', desc10: '0,00'
        },

        // Política comercial
        politicaComercial: supplier?.politicaComercial || ''
    });

    const [contatos, setContatos] = useState([
        { id: 1, nome: 'MARCELO', cargo: 'DEPARTAMENTO DE VENDAS', telefone: '019-3849-1967', celular: '919-3829-2049', email: 'marcelo@2mplastic.com.br', dataNas: '03/04' },
        { id: 2, nome: 'FERNANDA', cargo: 'COMERCIAL', telefone: '(19) 3849-1967', celular: '19 99719-5849', email: 'fernanda@2mplastic.com.br', dataNas: '16/02' }
    ]);

    const [politicasDesconto, setPoliticasDesconto] = useState([
        { id: 1, descricao: 'Política Padrão', desc1: '10,00', desc2: '5,00', desc3: '3,00', ativo: true }
    ]);

    const [metas, setMetas] = useState([
        { ano: 2024, mes: 'Janeiro', valor: 'R$ 50.000,00' },
        { ano: 2024, mes: 'Fevereiro', valor: 'R$ 55.000,00' },
        { ano: 2024, mes: 'Março', valor: 'R$ 60.000,00' }
    ]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDescontoChange = (nivel, value) => {
        setFormData(prev => ({
            ...prev,
            descontos: { ...prev.descontos, [nivel]: value }
        }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <div className="supplier-form-overlay">
            <div className="supplier-form-container">
                {/* Header */}
                <div className="form-header">
                    <h2>Cadastro de Indústria</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Main Tabs */}
                <div className="form-tabs">
                    <button
                        className={`tab ${activeTab === 'principal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('principal')}
                    >
                        📋 Principal
                    </button>
                    <button
                        className={`tab ${activeTab === 'complemento' ? 'active' : ''}`}
                        onClick={() => setActiveTab('complemento')}
                    >
                        📝 Complemento
                    </button>
                </div>

                {/* Tab Content */}
                <div className="form-content">
                    {activeTab === 'principal' && (
                        <div className="tab-panel">
                            <div className="form-row">
                                <div className="form-group" style={{ flex: '0 0 200px' }}>
                                    <label>CNPJ <small>(Somente números)</small></label>
                                    <input
                                        type="text"
                                        value={formData.cnpj}
                                        onChange={(e) => handleChange('cnpj', e.target.value)}
                                        className="highlight"
                                        maxLength="14"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: '0 0 180px' }}>
                                    <label>Inscrição</label>
                                    <input
                                        type="text"
                                        value={formData.inscricao}
                                        onChange={(e) => handleChange('inscricao', e.target.value)}
                                        maxLength="12"
                                    />
                                </div>
                                <div className="form-group flex-3">
                                    <label>Razão social</label>
                                    <input
                                        type="text"
                                        value={formData.razao}
                                        onChange={(e) => handleChange('razao', e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: '0 0 150px' }}>
                                    <label>Situação</label>
                                    <select
                                        value={formData.situacao}
                                        onChange={(e) => handleChange('situacao', e.target.value)}
                                    >
                                        <option>Ativo</option>
                                        <option>Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label>Endereço</label>
                                    <input
                                        type="text"
                                        value={formData.endereco}
                                        onChange={(e) => handleChange('endereco', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bairro</label>
                                    <input
                                        type="text"
                                        value={formData.bairro}
                                        onChange={(e) => handleChange('bairro', e.target.value)}
                                    />
                                </div>
                                <div className="form-group flex-2">
                                    <label>Cidade</label>
                                    <input
                                        type="text"
                                        value={formData.cidade}
                                        onChange={(e) => handleChange('cidade', e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: '0 0 80px' }}>
                                    <label>UF</label>
                                    <input
                                        type="text"
                                        value={formData.uf}
                                        onChange={(e) => handleChange('uf', e.target.value)}
                                        maxLength="2"
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: '0 0 150px' }}>
                                    <label>CEP</label>
                                    <input
                                        type="text"
                                        value={formData.cep}
                                        onChange={(e) => handleChange('cep', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input
                                        type="text"
                                        value={formData.telefone}
                                        onChange={(e) => handleChange('telefone', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone 2</label>
                                    <input
                                        type="text"
                                        value={formData.telefone2}
                                        onChange={(e) => handleChange('telefone2', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fax</label>
                                    <input
                                        type="text"
                                        value={formData.fax}
                                        onChange={(e) => handleChange('fax', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-3">
                                    <label>E-mail</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nome reduzido</label>
                                    <input
                                        type="text"
                                        value={formData.nomeReduzido}
                                        onChange={(e) => handleChange('nomeReduzido', e.target.value)}
                                        className="highlight-red"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'complemento' && (
                        <div className="tab-panel">
                            <div className="form-row">
                                <div className="form-group flex-3">
                                    <label>Imagem para aplicativos</label>
                                    <input
                                        type="text"
                                        value={formData.imagemApp}
                                        onChange={(e) => handleChange('imagemApp', e.target.value)}
                                        className="highlight"
                                    />
                                </div>
                                <div className="form-group small">
                                    <label>Cód. representante</label>
                                    <input
                                        type="text"
                                        value={formData.codRepresentante}
                                        onChange={(e) => handleChange('codRepresentante', e.target.value)}
                                    />
                                </div>
                                <div className="form-group small">
                                    <label>Comissão (%)</label>
                                    <input
                                        type="text"
                                        value={formData.comissao}
                                        onChange={(e) => handleChange('comissao', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label>Observações</label>
                                    <textarea
                                        rows="4"
                                        value={formData.observacoes}
                                        onChange={(e) => handleChange('observacoes', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Desconto padrão da indústria</label>
                                    <div className="discount-grid">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <div key={num} className="discount-item">
                                                <label>{num}º</label>
                                                <input
                                                    type="text"
                                                    value={formData.descontos[`desc${num}`]}
                                                    onChange={(e) => handleDescontoChange(`desc${num}`, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                        {[6, 7, 8, 9, 10].map(num => (
                                            <div key={num} className="discount-item">
                                                <label>{num}º</label>
                                                <input
                                                    type="text"
                                                    value={formData.descontos[`desc${num}`]}
                                                    onChange={(e) => handleDescontoChange(`desc${num}`, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group flex-2">
                                    <label>Logotipo</label>
                                    <div className="file-input-group">
                                        <input
                                            type="text"
                                            value={formData.logotipo}
                                            onChange={(e) => handleChange('logotipo', e.target.value)}
                                        />
                                        <button className="btn-search">
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Related Data Tabs */}
                <div className="related-tabs">
                    <button
                        className={`tab ${activeRelatedTab === 'contatos' ? 'active' : ''}`}
                        onClick={() => setActiveRelatedTab('contatos')}
                    >
                        Contatos
                    </button>
                    <button
                        className={`tab ${activeRelatedTab === 'politica-descontos' ? 'active' : ''}`}
                        onClick={() => setActiveRelatedTab('politica-descontos')}
                    >
                        Política de descontos
                    </button>
                    <button
                        className={`tab ${activeRelatedTab === 'politica-comercial' ? 'active' : ''}`}
                        onClick={() => setActiveRelatedTab('politica-comercial')}
                    >
                        Política comercial
                    </button>
                    <button
                        className={`tab ${activeRelatedTab === 'meta-anual' ? 'active' : ''}`}
                        onClick={() => setActiveRelatedTab('meta-anual')}
                    >
                        Meta anual
                    </button>
                    <button
                        className={`tab ${activeRelatedTab === 'clientes-compraram' ? 'active' : ''}`}
                        onClick={() => setActiveRelatedTab('clientes-compraram')}
                    >
                        Clientes que já compraram
                    </button>
                </div>

                {/* Related Content */}
                <div className="related-content">
                    {activeRelatedTab === 'contatos' && (
                        <div className="grid-container">
                            <table className="data-grid">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Cargo</th>
                                        <th>Telefone</th>
                                        <th>Celular</th>
                                        <th>E-mail</th>
                                        <th>Data nas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contatos.map(contato => (
                                        <tr key={contato.id}>
                                            <td>{contato.nome}</td>
                                            <td>{contato.cargo}</td>
                                            <td>{contato.telefone}</td>
                                            <td>{contato.celular}</td>
                                            <td>{contato.email}</td>
                                            <td>{contato.dataNas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeRelatedTab === 'politica-descontos' && (
                        <div className="grid-container">
                            <p className="info-text">Políticas de desconto configuradas para esta indústria</p>
                        </div>
                    )}

                    {activeRelatedTab === 'politica-comercial' && (
                        <div className="form-group">
                            <textarea
                                rows="8"
                                value={formData.politicaComercial}
                                onChange={(e) => handleChange('politicaComercial', e.target.value)}
                                placeholder="Digite a política comercial..."
                            />
                        </div>
                    )}

                    {activeRelatedTab === 'meta-anual' && (
                        <div className="grid-container">
                            <p className="info-text">Metas anuais por mês</p>
                        </div>
                    )}

                    {activeRelatedTab === 'clientes-compraram' && (
                        <SupplierCustomersTab supplierId={supplier?.for_codigo} />
                    )}
                </div>

                {/* Footer */}
                <div className="form-footer">
                    <button className="btn-save" onClick={handleSave}>
                        <Save size={18} />
                        Salvar
                    </button>
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierForm;
