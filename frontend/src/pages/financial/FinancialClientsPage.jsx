import React, { useState, useEffect, useMemo } from 'react';
import {
    PersonStanding,
    Search as SearchIcon,
    User,
    Phone,
    Mail,
    MapPin,
    Info,
    Save,
    X
} from 'lucide-react';
import axios from 'axios';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import GridCadPadrao from '@/components/GridCadPadrao';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';

const FinancialClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        nome_razao: '',
        nome_fantasia: '',
        cpf_cnpj: '',
        tipo_pessoa: 'F',
        email: '',
        telefone: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        ativo: true
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/financeiro/clientes');
            const response = await axios.get(url);
            setClients(response.data.data || []);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (client = null) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                nome_razao: client.nome_razao || '',
                nome_fantasia: client.nome_fantasia || '',
                cpf_cnpj: client.cpf_cnpj || '',
                tipo_pessoa: client.tipo_pessoa || 'F',
                email: client.email || '',
                telefone: client.telefone || '',
                endereco: client.endereco || '',
                numero: client.numero || '',
                complemento: client.complemento || '',
                bairro: client.bairro || '',
                cidade: client.cidade || '',
                uf: client.uf || '',
                cep: client.cep || '',
                ativo: client.ativo
            });
        } else {
            setEditingClient(null);
            setFormData({
                nome_razao: '',
                nome_fantasia: '',
                cpf_cnpj: '',
                tipo_pessoa: 'F',
                email: '',
                telefone: '',
                endereco: '',
                numero: '',
                complemento: '',
                bairro: '',
                cidade: '',
                uf: '',
                cep: '',
                ativo: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingClient(null);
    };

    const handleSave = async () => {
        if (!formData.nome_razao) {
            toast.error('Nome/Razão Social é obrigatório');
            return;
        }

        try {
            if (editingClient) {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/clientes/${editingClient.id}`);
                await axios.put(url, formData);
                toast.success('Cliente atualizado com sucesso!');
            } else {
                const url = getApiUrl(NODE_API_URL, '/api/financeiro/clientes');
                await axios.post(url, formData);
                toast.success('Cliente cadastrado com sucesso!');
            }
            handleCloseDialog();
            fetchClients();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar cliente');
        }
    };

    const handleDelete = async (client) => {
        if (window.confirm(`Deseja realmente excluir o cliente ${client.nome_razao}?`)) {
            try {
                const url = getApiUrl(NODE_API_URL, `/api/financeiro/clientes/${client.id}`);
                await axios.delete(url);
                toast.success('Cliente excluído com sucesso!');
                fetchClients();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erro ao excluir cliente');
            }
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter(client =>
            client.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.cpf_cnpj?.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredClients.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredClients, page]);

    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

    const columns = [
        { key: 'id', label: 'ID', isId: true, width: '80px' },
        {
            key: 'nome_razao',
            label: 'Nome / Razão Social',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{row.nome_razao}</span>
                    <span className="text-[10px] text-slate-400 font-mono italic">{row.nome_fantasia || 'Sem Nome Fantasia'}</span>
                </div>
            )
        },
        {
            key: 'cpf_cnpj',
            label: 'CPF/CNPJ',
            width: '160px',
            render: (row) => <span className="font-mono text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100">{row.cpf_cnpj}</span>
        },
        {
            key: 'tipo_pessoa',
            label: 'Tipo',
            width: '80px',
            align: 'center',
            render: (row) => (
                <Badge variant="outline" className={row.tipo_pessoa === 'F' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}>
                    {row.tipo_pessoa === 'F' ? 'PF' : 'PJ'}
                </Badge>
            )
        },
        {
            key: 'telefone',
            label: 'Contato',
            width: '180px',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone size={10} className="text-emerald-500" /> {row.telefone || '—'}
                    </div>
                    {row.email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[150px]">
                            <Mail size={10} /> {row.email}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'ativo',
            label: 'Status',
            width: '100px',
            align: 'center',
            render: (row) => (
                <Badge variant={row.ativo ? 'default' : 'secondary'} className={row.ativo ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25' : ''}>
                    {row.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <GridCadPadrao
                title="Clientes Financeiros"
                subtitle="Gerencie os clientes para contas a receber"
                icon={PersonStanding}
                data={paginatedData}
                loading={loading}
                columns={columns}
                onNew={() => handleOpenDialog()}
                onEdit={(row) => handleOpenDialog(row)}
                onDelete={handleDelete}
                searchValue={searchTerm}
                onSearchChange={(val) => { setSearchTerm(val); setPage(1); }}
                pagination={{
                    page,
                    limit: ITEMS_PER_PAGE,
                    total: filteredClients.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchClients}
            />

            {/* Dialog Modernizado */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="bg-emerald-600 px-8 py-6 text-white relative h-32 flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <DialogTitle className="text-2xl font-black flex items-center gap-3 relative z-10 uppercase tracking-tight">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <User size={24} />
                            </div>
                            {editingClient ? 'Editar Ficha' : 'Novo Cliente'}
                        </DialogTitle>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest relative z-10 mt-1 opacity-80">
                            Financeiro & Contas a Receber
                        </p>
                    </DialogHeader>

                    <div className="p-8">
                        <Tabs defaultValue="basico" className="w-full">
                            <div className="flex justify-center mb-8">
                                <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                                    <TabsTrigger value="basico" className="px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                                        <Info size={14} className="mr-2" /> Dados Básicos
                                    </TabsTrigger>
                                    <TabsTrigger value="endereco" className="px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm transition-all">
                                        <MapPin size={14} className="mr-2" /> Localização
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="basico" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Pessoa</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                variant={formData.tipo_pessoa === 'F' ? 'default' : 'outline'}
                                                className={`rounded-xl h-11 font-bold ${formData.tipo_pessoa === 'F' ? 'bg-emerald-600 text-white' : 'text-slate-500 border-slate-200'}`}
                                                onClick={() => setFormData({ ...formData, tipo_pessoa: 'F' })}
                                            >
                                                Pessoa Física
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={formData.tipo_pessoa === 'J' ? 'default' : 'outline'}
                                                className={`rounded-xl h-11 font-bold ${formData.tipo_pessoa === 'J' ? 'bg-emerald-600 text-white' : 'text-slate-500 border-slate-200'}`}
                                                onClick={() => setFormData({ ...formData, tipo_pessoa: 'J' })}
                                            >
                                                Pessoa Jurídica
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            {formData.tipo_pessoa === 'F' ? 'CPF' : 'CNPJ'}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                value={formData.cpf_cnpj}
                                                onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                                                className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all font-mono"
                                                placeholder={formData.tipo_pessoa === 'F' ? '000.000.000-00' : '00.000.000/0000-00'}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            {formData.tipo_pessoa === 'F' ? 'Nome Completo' : 'Razão Social'}
                                        </label>
                                        <Input
                                            value={formData.nome_razao}
                                            onChange={(e) => setFormData({ ...formData, nome_razao: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all font-bold text-slate-700"
                                            placeholder="Digite o nome completo ou razão social..."
                                        />
                                    </div>
                                    {formData.tipo_pessoa === 'J' && (
                                        <div className="col-span-full space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Fantasia</label>
                                            <Input
                                                value={formData.nome_fantasia}
                                                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                                                className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all"
                                                placeholder="Digite o nome fantasia..."
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Mail size={12} /> E-mail</label>
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all"
                                            placeholder="exemplo@email.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12} /> Telefone</label>
                                        <Input
                                            value={formData.telefone}
                                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all font-mono"
                                            placeholder="(00) 0000-0000"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="endereco" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                                        <Input
                                            value={formData.cep}
                                            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all font-mono"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro / Endereço</label>
                                        <Input
                                            value={formData.endereco}
                                            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                        <Input
                                            value={formData.numero}
                                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                                        <Input
                                            value={formData.bairro}
                                            onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                                        <Input
                                            value={formData.cidade}
                                            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UF</label>
                                        <Input
                                            value={formData.uf}
                                            onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                                            maxLength={2}
                                            className="rounded-xl h-11 border-slate-200 focus:border-emerald-500 transition-all text-center uppercase font-black"
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="bg-slate-50 px-8 py-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                            <Badge
                                variant="outline"
                                className={`cursor-pointer h-7 px-4 rounded-lg font-bold border-2 transition-all ${formData.ativo ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                                onClick={() => setFormData({ ...formData, ativo: !formData.ativo })}
                            >
                                {formData.ativo ? 'CLIENTE ATIVO' : 'CLIENTE INATIVO'}
                            </Badge>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={handleCloseDialog} className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                                <X size={16} className="mr-2" /> Cancelar
                            </Button>
                            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]">
                                <Save size={16} className="mr-2" /> Salvar Ficha
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinancialClientsPage;
