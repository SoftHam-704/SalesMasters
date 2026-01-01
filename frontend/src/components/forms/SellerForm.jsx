import React, { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import IndustryDialog from './IndustryDialog';
import RegionDialog from './RegionDialog';

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

    // Fetch industries/commissions for this seller
    const fetchIndustries = async () => {
        if (!data?.ven_codigo) return;
        setLoadingIndustries(true);
        try {
            const res = await fetch(`http://localhost:3005/api/sellers/${data.ven_codigo}/industries`);
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
            const res = await fetch('http://localhost:3005/api/suppliers');
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
            const res = await fetch(`http://localhost:3005/api/sellers/${data.ven_codigo}/regions`);
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
            const res = await fetch('http://localhost:3005/api/regions');
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
            const res = await fetch('http://localhost:3005/api/users');
            if (res.ok) {
                const json = await res.json();
                setUsers(json.data || []);
            }
        } catch (error) {
            console.error("Erro ao carregar usuários", error);
        }
    };

    useEffect(() => {
        if (data?.ven_codigo) {
            fetchIndustries();
            fetchSellerRegions();
        } else {
            setIndustries([]);
            setSellerRegions([]);
        }
        loadSuppliers();
        loadAllRegions();
        loadUsers();
    }, [data?.ven_codigo]);

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
                <div className="space-y-2 p-2">
                    {/* Nome */}
                    <div>
                        <Label className="text-xs font-semibold">Nome</Label>
                        <Input
                            value={formData.ven_nome || ''}
                            onChange={(e) => handleChange('ven_nome', e.target.value)}
                            className="h-8 text-sm font-bold border-red-300 bg-blue-50"
                        />
                    </div>

                    {/* Endereço */}
                    <div>
                        <Label className="text-xs">Endereço</Label>
                        <Input
                            value={formData.ven_endereco || ''}
                            onChange={(e) => handleChange('ven_endereco', e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>

                    {/* Bairro | Cidade | CEP | UF */}
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                            <Label className="text-xs">Bairro</Label>
                            <Input
                                value={formData.ven_bairro || ''}
                                onChange={(e) => handleChange('ven_bairro', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="col-span-4">
                            <Label className="text-xs">Cidade</Label>
                            <Input
                                value={formData.ven_cidade || ''}
                                onChange={(e) => handleChange('ven_cidade', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs">Cep</Label>
                            <Input
                                value={formData.ven_cep || ''}
                                onChange={(e) => handleChange('ven_cep', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs">UF</Label>
                            <Input
                                value={formData.ven_uf || ''}
                                onChange={(e) => handleChange('ven_uf', e.target.value)}
                                maxLength={2}
                                className="h-8 text-sm text-center"
                            />
                        </div>
                    </div>

                    {/* Telefone | Celular | Aniversário */}
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                            <Label className="text-xs">Telefone</Label>
                            <Input
                                value={formData.ven_fone1 || ''}
                                onChange={(e) => handleChange('ven_fone1', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="col-span-4">
                            <Label className="text-xs">Celular</Label>
                            <Input
                                value={formData.ven_fone2 || ''}
                                onChange={(e) => handleChange('ven_fone2', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="col-span-4">
                            <Label className="text-xs">Aniversário</Label>
                            <Input
                                value={formData.ven_aniversario || ''}
                                onChange={(e) => handleChange('ven_aniversario', e.target.value)}
                                placeholder="DD/MM"
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* CPF | RG | CTPS */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <Label className="text-xs">CPF</Label>
                            <Input
                                value={formData.ven_cpf || ''}
                                onChange={(e) => handleChange('ven_cpf', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">RG</Label>
                            <Input
                                value={formData.ven_rg || ''}
                                onChange={(e) => handleChange('ven_rg', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">CTPS</Label>
                            <Input
                                value={formData.ven_ctps || ''}
                                onChange={(e) => handleChange('ven_ctps', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* E-mail | Usuário */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs">E-mail</Label>
                            <Input
                                value={formData.ven_email || ''}
                                onChange={(e) => handleChange('ven_email', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Usuário (para controle de acesso)</Label>
                            <Select
                                value={formData.ven_nomeusu || ''}
                                onValueChange={(value) => handleChange('ven_nomeusu', value)}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecione um usuário" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.codigo} value={user.usuario}>
                                            {user.nome} {user.sobrenome} ({user.usuario})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Filiação */}
                    <div>
                        <Label className="text-xs">Filiação</Label>
                        <Input
                            value={formData.ven_filiacao || ''}
                            onChange={(e) => handleChange('ven_filiacao', e.target.value)}
                            className="h-8 text-sm"
                        />
                    </div>

                    {/* Observações */}
                    <div>
                        <Label className="text-xs">Observações</Label>
                        <Textarea
                            value={formData.ven_obs || ''}
                            onChange={(e) => handleChange('ven_obs', e.target.value)}
                            className="text-sm min-h-[80px]"
                        />
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
                `http://localhost:3005/api/sellers/${data.ven_codigo}/industries/${ind.vin_industria}`,
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
                ? `http://localhost:3005/api/sellers/${data.ven_codigo}/industries/${selectedIndustry.vin_industria}`
                : `http://localhost:3005/api/sellers/${data.ven_codigo}/industries`;

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
                `http://localhost:3005/api/sellers/${data.ven_codigo}/regions/${region.vin_regiao}`,
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
            const res = await fetch(`http://localhost:3005/api/sellers/${data.ven_codigo}/regions`, {
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
            return (
                <div className="p-4 text-center">
                    <div className="text-gray-500 text-sm py-8">
                        <p className="font-semibold mb-2">🚧 Em Desenvolvimento</p>
                        <p>Esta funcionalidade estará disponível em breve.</p>
                    </div>
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
        <FormCadPadrao
            title={data ? `Vendedor: ${data.ven_nome || ''}` : "Novo Vendedor"}
            tabs={mainTabs}
            relatedTabs={data?.ven_codigo ? relatedTabs : []}
            renderTabContent={renderTabContent}
            renderRelatedContent={renderRelatedContent}
            onSave={handleSave}
            onClose={onClose}
        />
    );
};

export default SellerForm;
