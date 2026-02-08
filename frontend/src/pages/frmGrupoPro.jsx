import { useState, useEffect, useMemo } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";
import ProductGroupForm from "../components/forms/ProductGroupForm";
import GridCadPadrao from "../components/GridCadPadrao";
import { Badge } from "@/components/ui/badge";
import { NODE_API_URL, getApiUrl } from "../utils/apiConfig";

const FrmGrupoPro = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/product-groups'));
            const data = await response.json();
            if (data.success) {
                const adaptedData = data.data.map(item => ({
                    id: item.gru_codigo,
                    nome: item.gru_nome,
                    comissao: item.gru_percomiss,
                    _original: item
                }));
                setGroups(adaptedData);
            }
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            toast.error('Erro ao carregar grupos de produtos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleNew = () => {
        setSelectedGroup(null);
        setIsFormOpen(true);
    };

    const handleEdit = (group) => {
        setSelectedGroup(group);
        setIsFormOpen(true);
    };

    const handleDelete = async (group) => {
        if (!window.confirm(`Deseja realmente excluir o grupo "${group.nome}"?`)) {
            return;
        }

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/product-groups/${group.id}`), {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Grupo excluído com sucesso!');
                fetchGroups();
            } else {
                toast.error(data.message || 'Erro ao excluir grupo');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir grupo');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedGroup
                ? getApiUrl(NODE_API_URL, `/api/v2/product-groups/${selectedGroup.id}`)
                : getApiUrl(NODE_API_URL, '/api/v2/product-groups');

            const method = selectedGroup ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Grupo salvo com sucesso!');
                setIsFormOpen(false);
                fetchGroups();
            } else {
                toast.error(data.message || 'Erro ao salvar');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar grupo');
        }
    };

    // Filtrar dados localmente
    const filteredGroups = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return groups.filter(g =>
            (g.nome || '').toLowerCase().includes(term) ||
            (g.id?.toString() || '').includes(term)
        );
    }, [groups, searchTerm]);

    // Paginação
    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredGroups.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredGroups, page]);

    const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);

    // Definição das colunas (formato tabela)
    const columns = [
        {
            key: 'id',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'nome',
            label: 'Descrição',
            width: '400px',
            render: (row) => (
                <span className="font-semibold text-slate-800">{row.nome}</span>
            )
        },
        {
            key: 'comissao',
            label: '% Comissão',
            width: '120px',
            align: 'center',
            render: (row) => (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono">
                    {row.comissao ? row.comissao.toFixed(2) : '0.00'}%
                </Badge>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <ProductGroupForm
                open={isFormOpen}
                data={selectedGroup}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
            />

            <GridCadPadrao
                title="Grupos de Produtos"
                subtitle={`Gerencie os grupos de produtos (${filteredGroups.length} exibidos de ${groups.length} carregados)`}
                icon={Package}
                data={paginatedData}
                loading={loading}
                columns={columns}
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchValue={searchTerm}
                onSearchChange={(value) => { setSearchTerm(typeof value === 'string' ? value : value?.target?.value || ''); setPage(1); }}
                pagination={{
                    page,
                    limit: ITEMS_PER_PAGE,
                    total: filteredGroups.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchGroups}
            />
        </div>
    );
};

export default FrmGrupoPro;
