import { useState, useEffect, useMemo } from "react";
import { Building2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import GridCadPadrao from "@/components/GridCadPadrao";
import { SupplierDialog } from "@/components/forms/SupplierDialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { NODE_API_URL, getApiUrl } from "@/utils/apiConfig";
import SupplierHelpModal from "@/components/crm/SupplierHelpModal";

const FrmIndustria = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [showInactive, setShowInactive] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const ITEMS_PER_PAGE = 10;

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const formatCNPJ = (value) => {
        if (!value) return "";
        const raw = value.replace(/\D/g, '');
        if (raw.length === 14) {
            return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        }
        return value;
    };

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/suppliers');
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const data = await response.json();
            const rawList = Array.isArray(data) ? data : (data.data || []);

            const adaptedData = rawList.map(item => ({
                id: item.for_codigo || item.id,
                cnpj: item.for_cgc || item.cnpj || '',
                razaoSocial: item.for_nome || item.razaoSocial || '',
                nomeReduzido: item.for_nomered || item.nomeReduzido || '',
                inscricao: item.for_inscricao || item.inscricao || '',
                endereco: item.for_endereco || item.endereco || '',
                bairro: item.for_bairro || item.bairro || '',
                cidade: item.for_cidade || item.cidade || '',
                uf: item.for_uf || item.uf || '',
                cep: item.for_cep || item.cep || '',
                telefone: item.for_fone || item.telefone || '',
                email: item.for_email || item.email || '',
                fax: item.for_fax || '',
                obs2: item.for_obs2 || '',
                homepage: item.for_homepage || '',
                for_locimagem: item.for_locimagem || '',
                for_logotipo: item.for_logotipo || '',
                situacao: (item.for_tipo2 === 'A' || item.situacao === 'A' || item.situacao === 'Ativo') ? "Ativo" : "Inativo",
                _original: item
            }));

            adaptedData.sort((a, b) => (a.nomeReduzido || '').localeCompare(b.nomeReduzido || ''));
            setSuppliers(adaptedData);
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar dados: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSave = async (data) => {
        try {
            const isNew = !data.id;
            const url = isNew
                ? getApiUrl(NODE_API_URL, '/api/suppliers')
                : getApiUrl(NODE_API_URL, `/api/suppliers/${data.id}`);

            const method = isNew ? 'POST' : 'PUT';

            const payload = {
                for_nome: data.razaoSocial,
                for_nomered: data.nomeReduzido,
                for_endereco: data.endereco,
                for_bairro: data.bairro,
                for_cidade: data.cidade,
                for_uf: data.uf,
                for_cep: data.cep,
                for_fone: data.telefone,
                for_email: data.email,
                for_tipo2: data.situacao === "Ativo" ? 'A' : 'I',
                for_cgc: data.cnpj?.replace(/\D/g, ''),
                for_inscricao: data.inscricao,
                for_fax: data.fax,
                for_obs2: data.for_obs2 || data.obs2 || '',
                for_homepage: data.for_homepage || data.homepage || '',
                for_locimagem: data.for_locimagem || '',
                for_logotipo: data.for_logotipo || ''
            };

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Erro ao salvar dados");

            toast.success(isNew ? "Indústria criada!" : "Indústria atualizada!");
            setDialogOpen(false);
            fetchSuppliers();
        } catch (error) {
            toast.error(error.message || "Erro ao salvar");
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Tem certeza que deseja excluir ${row.nomeReduzido}?`)) return;
        try {
            const url = getApiUrl(NODE_API_URL, `/api/suppliers/${row.id}`);
            const response = await fetch(url, { method: 'DELETE' });
            if (!response.ok) throw new Error("Erro ao excluir");
            toast.success("Excluído com sucesso");
            fetchSuppliers();
        } catch (e) {
            toast.error("Erro ao excluir: " + e.message);
        }
    };

    const filteredData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return suppliers.filter(s => {
            const matchesSearch =
                (s.nomeReduzido || '').toLowerCase().includes(term) ||
                (s.razaoSocial || '').toLowerCase().includes(term) ||
                (s.cnpj || '').includes(term);

            const matchesStatus = showInactive ? true : s.situacao === "Ativo";

            return matchesSearch && matchesStatus;
        });
    }, [suppliers, searchTerm, showInactive]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, page]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    const columns = [
        { key: 'id', label: 'ID', isId: true, width: '80px' },
        { key: 'cnpj', label: 'CNPJ', width: '150px', render: (row) => <span className="font-mono text-sm text-black font-medium">{formatCNPJ(row.cnpj)}</span> },
        {
            key: 'nomeReduzido',
            label: 'NOME REDUZIDO',
            width: '180px',
            render: (row) => (
                <Badge variant="outline" className="w-full justify-center font-bold text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 uppercase text-sm py-1">
                    {row.nomeReduzido}
                </Badge>
            )
        },
        { key: 'razaoSocial', label: 'Razão Social', width: '400px', render: (row) => <span className="text-xs text-black font-medium block">{row.razaoSocial}</span> },
        { key: 'cidade', label: 'Cidade/UF', width: '150px', render: (row) => <span className="text-xs">{row.cidade}/{row.uf}</span> },
        {
            key: 'situacao', label: 'Situação', width: '100px', align: 'center', render: (row) => (
                <Badge variant={row.situacao === "Ativo" ? "default" : "secondary"} className={row.situacao === "Ativo" ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" : "bg-slate-100 text-slate-500"}>
                    {row.situacao}
                </Badge>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <SupplierDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                supplier={selectedSupplier}
                onSave={handleSave}
            />

            <SupplierHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />

            <GridCadPadrao
                title="Indústrias"
                subtitle={`Gerencie suas indústrias (${filteredData.length} exibidos de ${suppliers.length} carregados)`}
                icon={Building2}
                data={paginatedData}
                loading={loading}
                columns={columns}
                onNew={() => { setSelectedSupplier(null); setDialogOpen(true); }}
                onEdit={(row) => { setSelectedSupplier(row); setDialogOpen(true); }}
                onDelete={handleDelete}
                searchValue={searchTerm}
                onSearchChange={(value) => { setSearchTerm(typeof value === 'string' ? value : value?.target?.value || ''); setPage(1); }}
                pagination={{
                    page,
                    limit: ITEMS_PER_PAGE,
                    total: filteredData.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchSuppliers}
                extraControls={
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                            <Checkbox
                                id="showInactive"
                                checked={showInactive}
                                onCheckedChange={setShowInactive}
                            />
                            <label
                                htmlFor="showInactive"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-600"
                            >
                                Mostrar inativos
                            </label>
                        </div>
                        <Button
                            onClick={() => setHelpOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 rounded-lg shadow-md flex items-center gap-2"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span>Ajuda</span>
                        </Button>
                    </div>
                }
            />
        </div>
    );
};

export default FrmIndustria;
