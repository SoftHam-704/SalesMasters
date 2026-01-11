import React, { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DbComboBox from '../DbComboBox';
import IndustryDialog from './IndustryDialog';
import RegionDialog from './RegionDialog';
import MetaDialog from './MetaDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SellerForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({});
    const [industries, setIndustries] = useState([]);
    const [loadingIndustries, setLoadingIndustries] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [users, setUsers] = useState([]);
    const [regions, setRegions] = useState([]);
    const [sellerRegions, setSellerRegions] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [allRegions, setAllRegions] = useState([]);

    // Estados para metas
    const [metas, setMetas] = useState([]);
    const [loadingMetas, setLoadingMetas] = useState(false);
    const [metaDialogOpen, setMetaDialogOpen] = useState(false);
    const [selectedMeta, setSelectedMeta] = useState(null);
    const [selectedMetaYear, setSelectedMetaYear] = useState(new Date().getFullYear());
    const [selectedMetaIndustry, setSelectedMetaIndustry] = useState('');
    const [editingMeta, setEditingMeta] = useState(null);

    // Fetch industries/commissions for this seller
    const fetchIndustries = async () => {
        if (!data?.ven_codigo) return;
        setLoadingIndustries(true);
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/industries`);
            if (res.ok) {
                const json = await res.json();
                setIndustries(json.data);
            }
        } catch (error) {
            console.error("Erro ao buscar indústrias", error);
        } finally {
            setLoadingIndustries(false);
        }
    };

    // Load suppliers for the industry dropdown
    const loadSuppliers = async () => {
        try {
            const res = await fetch('https://salesmasters.softham.com.br/api/suppliers');
            if (res.ok) {
                const json = await res.json();
                setSuppliers(json.data || []);
            }
        } catch (error) {
            console.error("Erro ao carregar fornecedores", error);
        }
    };

    // Fetch regions for this seller
    const fetchSellerRegions = async () => {
        if (!data?.ven_codigo) return;
        setLoadingRegions(true);
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/regions`);
            if (res.ok) {
                const json = await res.json();
                setSellerRegions(json.data);
            }
        } catch (error) {
            console.error("Erro ao buscar regiões", error);
        } finally {
            setLoadingRegions(false);
        }
    };

    // Load all regions for the dropdown
    const loadAllRegions = async () => {
        try {
            const res = await fetch('https://salesmasters.softham.com.br/api/regions');
            if (res.ok) {
                const json = await res.json();
                setAllRegions(json.data || []);
            }
        } catch (error) {
            console.error("Erro ao carregar regiões", error);
        }
    };

    // Load users for the dropdown
    const loadUsers = async () => {
        try {
            const res = await fetch('https://salesmasters.softham.com.br/api/users');
            if (res.ok) {
                const json = await res.json();
                setUsers(json.data || []);
            }
        } catch (error) {
            console.error("Erro ao carregar usuários", error);
        }
    };

    // Fetch metas for this seller
    const fetchMetas = async () => {
        if (!data?.ven_codigo) return;
        setLoadingMetas(true);
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/metas`);
            if (res.ok) {
                const json = await res.json();
                setMetas(json.data || []);
            }
        } catch (error) {
            console.error("Erro ao buscar metas", error);
        } finally {
            setLoadingMetas(false);
        }
    };

    useEffect(() => {
        if (data?.ven_codigo) {
            fetchIndustries();
            fetchSellerRegions();
            fetchMetas();
        } else {
            setIndustries([]);
            setSellerRegions([]);
            setMetas([]);
        }
        loadSuppliers();
        loadAllRegions();
        loadUsers();
    }, [data?.ven_codigo]);

    // Reset editingMeta when year or industry changes
    useEffect(() => {
        setEditingMeta(null);
    }, [selectedMetaYear, selectedMetaIndustry]);

    useEffect(() => {
        if (data) {
            const formattedData = { ...data };
            // Format birthday from DDMM to DD/MM for display
            if (formattedData.ven_aniversario && formattedData.ven_aniversario.length === 4) {
                const day = formattedData.ven_aniversario.substring(0, 2);
                const month = formattedData.ven_aniversario.substring(2, 4);
                formattedData.ven_aniversario = `${day}/${month}`;
            }
            setFormData(formattedData);
        } else {
            setFormData({});
        }
    }, [data]);

    const handleChange = (field, value) => {
        // Format birthday as DD/MM
        if (field === 'ven_aniversario') {
            // Remove non-digits
            let cleaned = value.replace(/\D/g, '');
            // Limit to 4 digits (DDMM)
            cleaned = cleaned.substring(0, 4);
            // Format as DD/MM
            if (cleaned.length >= 3) {
                value = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
            } else {
                value = cleaned;
            }
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.ven_nome || formData.ven_nome.trim() === '') {
            toast.error("O nome do vendedor é obrigatório!");
            return;
        }

        // Convert birthday DD/MM to full date with year 2001
        const dataToSave = { ...formData };
        if (dataToSave.ven_aniversario && dataToSave.ven_aniversario.includes('/')) {
            const [day, month] = dataToSave.ven_aniversario.split('/');
            if (day && month) {
                // Store as DDMM format (4 digits) as per Delphi system
                dataToSave.ven_aniversario = day.padStart(2, '0') + month.padStart(2, '0');
            }
        }

        onSave(dataToSave);
    };

    const mainTabs = [
        { id: 'dados', label: 'Dados', icon: <FileText size={16} /> },
    ];

    const relatedTabs = [
        { id: 'industrias', label: 'Indústrias que atende' },
        { id: 'vendas', label: 'Vendas realizadas' },
        { id: 'regioes', label: 'Regiões atendidas' },
        { id: 'lanc_metas', label: 'Lanç. metas' },
        { id: 'metas_realizadas', label: 'Metas realizadas' },
    ];

    const renderTabContent = (activeTab) => {
        if (activeTab === 'dados') {
            return (
                <div className="p-4 space-y-4">
                    <div className="form-grid">
                        {/* Nome */}
                        <div className="col-12">
                            <InputField
                                label="Nome"
                                value={formData.ven_nome || ''}
                                onChange={(e) => handleChange('ven_nome', e.target.value)}
                                className="font-bold bg-blue-50"
                                autoFocus
                                large
                            />
                        </div>

                        {/* Endereço */}
                        <div className="col-12">
                            <InputField
                                label="Endereço"
                                value={formData.ven_endereco || ''}
                                onChange={(e) => handleChange('ven_endereco', e.target.value)}
                            />
                        </div>

                        {/* Bairro | Cidade | CEP | UF */}
                        <div className="col-4">
                            <InputField
                                label="Bairro"
                                value={formData.ven_bairro || ''}
                                onChange={(e) => handleChange('ven_bairro', e.target.value)}
                            />
                        </div>
                        <div className="col-4">
                            <InputField
                                label="Cidade"
                                value={formData.ven_cidade || ''}
                                onChange={(e) => handleChange('ven_cidade', e.target.value)}
                            />
                        </div>
                        <div className="col-2">
                            <InputField
                                label="CEP"
                                value={formData.ven_cep || ''}
                                onChange={(e) => handleChange('ven_cep', e.target.value)}
                            />
                        </div>
                        <div className="col-2">
                            <InputField
                                label="UF"
                                value={formData.ven_uf || ''}
                                onChange={(e) => handleChange('ven_uf', e.target.value)}
                                maxLength={2}
                                className="text-center bg-gray-50 font-bold text-blue-600"
                            />
                        </div>

                        {/* Telefone | Celular | Aniversário */}
                        <div className="col-4">
                            <InputField
                                label="Telefone"
                                value={formData.ven_fone1 || ''}
                                onChange={(e) => handleChange('ven_fone1', e.target.value)}
                            />
                        </div>
                        <div className="col-4">
                            <InputField
                                label="Celular"
                                value={formData.ven_fone2 || ''}
                                onChange={(e) => handleChange('ven_fone2', e.target.value)}
                            />
                        </div>
                        <div className="col-4">
                            <InputField
                                label="Aniversário"
                                value={formData.ven_aniversario || ''}
                                onChange={(e) => handleChange('ven_aniversario', e.target.value)}
                                placeholder="DD/MM"
                                className="text-center"
                            />
                        </div>

                        {/* CPF | RG | CTPS */}
                        <div className="col-4">
                            <InputField
                                label="CPF"
                                value={formData.ven_cpf || ''}
                                onChange={(e) => handleChange('ven_cpf', e.target.value)}
                            />
                        </div>
                        <div className="col-4">
                            <InputField
                                label="RG"
                                value={formData.ven_rg || ''}
                                onChange={(e) => handleChange('ven_rg', e.target.value)}
                            />
                        </div>
                        <div className="col-4">
                            <InputField
                                label="CTPS"
                                value={formData.ven_ctps || ''}
                                onChange={(e) => handleChange('ven_ctps', e.target.value)}
                            />
                        </div>

                        {/* E-mail | Usuário */}
                        <div className="col-6">
                            <InputField
                                label="E-mail"
                                value={formData.ven_email || ''}
                                onChange={(e) => handleChange('ven_email', e.target.value)}
                            />
                        </div>
                        <div className="col-6">
                            <DbComboBox
                                label="Usuário (Acesso)"
                                value={formData.ven_nomeusu ? { label: formData.ven_nomeusu, value: formData.ven_nomeusu } : null}
                                onChange={(item) => handleChange('ven_nomeusu', item?.value || '')}
                                fetchData={async (search) => {
                                    try {
                                        const res = await fetch(`https://salesmasters.softham.com.br/api/users?search=${search}`);
                                        const json = await res.json();
                                        // Filter/Map if necessary. Assuming API returns {data: [{usuario, nome...}]}
                                        // We need to map to { label, value }
                                        const list = json.data || json;
                                        return list.map(u => ({
                                            label: `${u.nome} (${u.usuario})`,
                                            value: u.usuario
                                        }));
                                    } catch (e) {
                                        console.error(e);
                                        return [];
                                    }
                                }}
                                placeholder="Selecione um usuário..."
                            />
                        </div>

                        {/* Data Admissão | Data Demissão | Status | Cumpre Metas */}
                        <div className="col-3">
                            <InputField
                                label="Data Admissão"
                                type="date"
                                value={formData.ven_dtadmissao || ''}
                                onChange={(e) => handleChange('ven_dtadmissao', e.target.value)}
                            />
                        </div>
                        <div className="col-3">
                            <InputField
                                label="Data Demissão"
                                type="date"
                                value={formData.ven_dtdemissao || ''}
                                onChange={(e) => handleChange('ven_dtdemissao', e.target.value)}
                            />
                        </div>
                        <div className="col-3">
                            <DbComboBox
                                label="Status"
                                value={formData.ven_status === 'I' ? { label: 'Inativo', value: 'I' } : { label: 'Ativo', value: 'A' }}
                                onChange={(item) => handleChange('ven_status', item?.value || 'A')}
                                fetchData={async (search) => {
                                    const options = [
                                        { label: 'Ativo', value: 'A' },
                                        { label: 'Inativo', value: 'I' }
                                    ];
                                    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
                                }}
                                placeholder="Selecione..."
                            />
                        </div>
                        <div className="col-3">
                            <DbComboBox
                                label="Cumpre Metas"
                                value={formData.ven_cumpremetas === 'N' ? { label: 'NÃO', value: 'N' } : { label: 'SIM', value: 'S' }}
                                onChange={(item) => handleChange('ven_cumpremetas', item?.value || 'S')}
                                fetchData={async (search) => {
                                    const options = [
                                        { label: 'SIM', value: 'S' },
                                        { label: 'NÃO', value: 'N' }
                                    ];
                                    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
                                }}
                                placeholder="Selecione..."
                            />
                        </div>

                        {/* Filiação */}
                        <div className="col-12">
                            <InputField
                                label="Filiação"
                                value={formData.ven_filiacao || ''}
                                onChange={(e) => handleChange('ven_filiacao', e.target.value)}
                            />
                        </div>

                        {/* Observações */}
                        <div className="col-12">
                            <Label className="text-xs font-semibold text-gray-500 ml-1 mb-1 block">Observações</Label>
                            <textarea
                                className="modern-textarea h-32"
                                placeholder="Observações..."
                                value={formData.ven_obs || ''}
                                onChange={(e) => handleChange('ven_obs', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const [industryDialogOpen, setIndustryDialogOpen] = useState(false);
    const [selectedIndustry, setSelectedIndustry] = useState(null);

    const handleAddIndustry = () => {
        setSelectedIndustry(null);
        setIndustryDialogOpen(true);
    };

    const handleEditIndustry = (ind) => {
        setSelectedIndustry(ind);
        setIndustryDialogOpen(true);
    };

    const handleDeleteIndustry = async (ind) => {
        if (!window.confirm(`Deseja remover a indústria ${ind.for_nomered}?`)) return;

        try {
            const res = await fetch(
                `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/industries/${ind.vin_industria}`,
                { method: 'DELETE' }
            );
            if (res.ok) {
                toast.success("Indústria removida!");
                fetchIndustries();
            } else {
                toast.error("Erro ao remover indústria");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover indústria");
        }
    };

    const handleIndustrySaved = async (industryData) => {
        try {
            const url = selectedIndustry
                ? `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/industries/${selectedIndustry.vin_industria}`
                : `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/industries`;

            const method = selectedIndustry ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(industryData)
            });

            if (res.ok) {
                toast.success(selectedIndustry ? "Comissão atualizada!" : "Indústria adicionada!");
                setIndustryDialogOpen(false);
                fetchIndustries();
            } else {
                const json = await res.json();
                toast.error(json.message || "Erro ao salvar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        }
    };

    // Region handlers
    const [regionDialogOpen, setRegionDialogOpen] = useState(false);

    const handleAddRegion = () => {
        setRegionDialogOpen(true);
    };

    const handleDeleteRegion = async (region) => {
        if (!window.confirm(`Deseja remover a região ${region.reg_descricao}?`)) return;

        try {
            const res = await fetch(
                `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/regions/${region.vin_regiao}`,
                { method: 'DELETE' }
            );
            if (res.ok) {
                toast.success("Região removida!");
                fetchSellerRegions();
            } else {
                toast.error("Erro ao remover região");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover região");
        }
    };

    const handleRegionSaved = async (regionData) => {
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/regions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regionData)
            });

            if (res.ok) {
                toast.success("Região adicionada!");
                setRegionDialogOpen(false);
                fetchSellerRegions();
            } else {
                const json = await res.json();
                toast.error(json.message || "Erro ao salvar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        }
    };

    // Meta handlers
    const handleAddMeta = () => {
        setSelectedMeta(null);
        setMetaDialogOpen(true);
    };

    const handleEditMeta = (meta) => {
        setSelectedMeta(meta);
        setMetaDialogOpen(true);
    };

    const handleDeleteMeta = async (meta) => {
        if (!window.confirm(`Deseja excluir a meta de ${meta.industria_nome || 'Geral'} para ${meta.met_ano}?`)) return;

        try {
            const res = await fetch(
                `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/metas/${meta.met_id}`,
                { method: 'DELETE' }
            );
            if (res.ok) {
                toast.success("Meta excluída!");
                fetchMetas();
            } else {
                toast.error("Erro ao excluir meta");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir meta");
        }
    };

    const handleMetaSaved = async (metaData) => {
        try {
            const url = selectedMeta
                ? `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/metas/${selectedMeta.met_id}`
                : `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/metas`;

            const method = selectedMeta ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metaData)
            });

            if (res.ok) {
                toast.success(selectedMeta ? "Meta atualizada!" : "Meta adicionada!");
                setMetaDialogOpen(false);
                fetchMetas();
            } else {
                const json = await res.json();
                toast.error(json.message || "Erro ao salvar");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        }
    };

    // Save metas directly from the grid
    const handleSaveMetas = async () => {
        if (!selectedMetaIndustry || !editingMeta) {
            toast.error("Selecione uma indústria e preencha os valores");
            return;
        }

        try {
            // Check if meta exists
            const existingMeta = metas.find(m =>
                m.met_ano === selectedMetaYear &&
                m.met_industria?.toString() === selectedMetaIndustry
            );

            const metaData = {
                met_ano: selectedMetaYear,
                met_industria: parseInt(selectedMetaIndustry),
                ...editingMeta
            };

            const url = existingMeta
                ? `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/metas/${existingMeta.met_id}`
                : `https://salesmasters.softham.com.br/api/sellers/${data.ven_codigo}/metas`;

            const method = existingMeta ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metaData)
            });

            if (res.ok) {
                toast.success("Metas salvas com sucesso!");
                setEditingMeta(null);
                fetchMetas();
            } else {
                const json = await res.json();
                toast.error(json.message || "Erro ao salvar metas");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar metas");
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(parseFloat(value) || 0);
    };

    const renderRelatedContent = (activeTab) => {
        if (activeTab === 'industrias') {
            return (
                <div className="p-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold">Indústrias que o vendedor atende</h3>
                        <Button
                            size="sm"
                            onClick={handleAddIndustry}
                            className="h-7 text-xs"
                        >
                            <Plus size={14} className="mr-1" />
                            Adicionar
                        </Button>
                    </div>

                    {loadingIndustries ? (
                        <div className="text-center text-sm text-gray-500 py-4">Carregando...</div>
                    ) : industries.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-4">
                            Nenhuma indústria cadastrada
                        </div>
                    ) : (
                        <div className="border rounded">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left p-2 border-b">Indústria</th>
                                        <th className="text-right p-2 border-b w-32">Comissão (%)</th>
                                        <th className="text-center p-2 border-b w-24">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {industries.map((ind) => (
                                        <tr key={ind.vin_industria} className="hover:bg-gray-50">
                                            <td className="p-2 border-b">{ind.for_nomered}</td>
                                            <td className="p-2 border-b text-right">
                                                {ind.vin_percom ? ind.vin_percom.toFixed(2) : '0.00'}
                                            </td>
                                            <td className="p-2 border-b text-center">
                                                <div className="flex gap-1 justify-center">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => handleEditIndustry(ind)}
                                                        title="Editar"
                                                    >
                                                        <Pencil size={12} className="text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => handleDeleteIndustry(ind)}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={12} className="text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Industry Dialog */}
                    {industryDialogOpen && (
                        <IndustryDialog
                            open={industryDialogOpen}
                            onClose={() => setIndustryDialogOpen(false)}
                            industry={selectedIndustry}
                            suppliers={suppliers}
                            onSave={handleIndustrySaved}
                        />
                    )}
                </div>
            );
        }

        if (activeTab === 'regioes') {
            return (
                <div className="p-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold">Regiões que o vendedor atende</h3>
                        <Button
                            size="sm"
                            onClick={handleAddRegion}
                            className="h-7 text-xs"
                        >
                            <Plus size={14} className="mr-1" />
                            Adicionar
                        </Button>
                    </div>

                    {loadingRegions ? (
                        <div className="text-center text-sm text-gray-500 py-4">Carregando...</div>
                    ) : sellerRegions.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 py-4">
                            Nenhuma região cadastrada
                        </div>
                    ) : (
                        <div className="border rounded">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-left p-2 border-b">ID</th>
                                        <th className="text-left p-2 border-b">Descrição</th>
                                        <th className="text-center p-2 border-b w-24">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sellerRegions.map((region) => (
                                        <tr key={region.vin_regiao} className="hover:bg-gray-50">
                                            <td className="p-2 border-b">{region.reg_codigo}</td>
                                            <td className="p-2 border-b">{region.reg_descricao}</td>
                                            <td className="p-2 border-b text-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDeleteRegion(region)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={12} className="text-red-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Region Dialog */}
                    {regionDialogOpen && (
                        <RegionDialog
                            open={regionDialogOpen}
                            onClose={() => setRegionDialogOpen(false)}
                            regions={allRegions}
                            onSave={handleRegionSaved}
                        />
                    )}
                </div>
            );
        }

        // Vendas realizadas tab
        if (activeTab === 'vendas') {
            return (
                <div className="p-4 text-center">
                    <div className="text-gray-500 text-sm py-8">
                        <p className="font-semibold mb-2">🚧 Em Desenvolvimento</p>
                        <p>Esta funcionalidade estará disponível em breve.</p>
                    </div>
                </div>
            );
        }

        // Lanç. metas tab
        if (activeTab === 'lanc_metas') {
            // Filter metas for selected year/industry
            const currentMeta = metas.find(m =>
                m.met_ano === selectedMetaYear &&
                m.met_industria?.toString() === selectedMetaIndustry
            );

            const handleMetaFieldChange = (field, value) => {
                setEditingMeta(prev => ({
                    ...prev,
                    [field]: parseFloat(value) || 0
                }));
            };

            return (
                <div className="p-3 space-y-4">
                    {/* Header with selectors */}
                    <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold">Metas Anuais (em Reais)</Label>
                        <div className="flex gap-2 items-center">
                            <Select
                                value={selectedMetaIndustry}
                                onValueChange={setSelectedMetaIndustry}
                            >
                                <SelectTrigger className="h-8 w-48 text-xs">
                                    <SelectValue placeholder="Selecione indústria" />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    {suppliers.map(s => (
                                        <SelectItem key={s.for_codigo} value={s.for_codigo.toString()}>
                                            {s.for_nomered || s.for_nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedMetaYear.toString()}
                                onValueChange={(val) => setSelectedMetaYear(parseInt(val))}
                            >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    <SelectItem value="2023">2023</SelectItem>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loadingMetas ? (
                        <div className="text-center text-sm text-gray-500 py-4">Carregando...</div>
                    ) : !selectedMetaIndustry ? (
                        <div className="text-center text-sm text-gray-500 py-4">
                            Selecione uma indústria para visualizar/editar metas
                        </div>
                    ) : (
                        <>
                            {/* Monthly Goals Grid */}
                            <div className="grid grid-cols-4 gap-3">
                                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month) => {
                                    const fieldName = `met_${month.toLowerCase()}`;
                                    const value = editingMeta?.[fieldName] ?? (currentMeta ? parseFloat(currentMeta[fieldName]) || 0 : 0);
                                    return (
                                        <div key={month}>
                                            <InputField
                                                label={month}
                                                value={formatCurrency(value)}
                                                onChange={(e) => {
                                                    const numericValue = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                                                    handleMetaFieldChange(fieldName, numericValue);
                                                }}
                                                selectAllOnFocus={true}
                                                className="text-right font-mono"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveMetas}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-4"
                                    disabled={!selectedMetaIndustry}
                                >
                                    <FileText size={14} className="mr-2" />
                                    Salvar Metas
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            );
        }

        // Metas realizadas tab
        if (activeTab === 'metas_realizadas') {
            return (
                <div className="p-4 text-center">
                    <div className="text-gray-500 text-sm py-8">
                        <p className="font-semibold mb-2">🚧 Em Desenvolvimento</p>
                        <p>Esta funcionalidade estará disponível em breve.</p>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <FormCadPadraoV2
            title={data ? `Vendedor: ${data.ven_nome || ''} ` : "Novo Vendedor"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <Tabs defaultValue="dados" className="h-full flex flex-col">
                <TabsList className="bg-transparent border-b w-full justify-start p-0 h-auto rounded-none mb-4">
                    {mainTabs.map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 bg-transparent shadow-none px-4 py-2"
                        >
                            <span className="flex items-center gap-2">
                                {tab.icon && tab.icon} {tab.label}
                            </span>
                        </TabsTrigger>
                    ))}
                    {data?.ven_codigo && relatedTabs.map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 bg-transparent shadow-none px-4 py-2"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1">
                    {mainTabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-0">
                            {renderTabContent(tab.id)}
                        </TabsContent>
                    ))}
                    {data?.ven_codigo && relatedTabs.map(tab => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-0">
                            {renderRelatedContent(tab.id)}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </FormCadPadraoV2>
    );
};

export default SellerForm;
