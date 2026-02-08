import { useState, useEffect, useMemo } from "react";
import { Map } from "lucide-react";
import { toast } from "sonner";
import ActivityAreaForm from "../components/forms/ActivityAreaForm";
import GridCadPadrao from "../components/GridCadPadrao";
import { NODE_API_URL, getApiUrl } from "../utils/apiConfig";

const FrmAreaAtuacao = () => {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedArea, setSelectedArea] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/activity-areas'));
            const data = await response.json();
            if (data.success) {
                const adaptedData = data.data.map(item => ({
                    id: item.atu_id,
                    descricao: item.atu_descricao,
                    _original: item
                }));
                setAreas(adaptedData);
            }
        } catch (error) {
            console.error('Erro ao carregar áreas de atuação:', error);
            toast.error('Erro ao carregar áreas de atuação');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const handleNew = () => {
        setSelectedArea(null);
        setIsFormOpen(true);
    };

    const handleEdit = (area) => {
        setSelectedArea(area);
        setIsFormOpen(true);
    };

    const handleDelete = async (area) => {
        if (!window.confirm(`Deseja realmente excluir a área "${area.descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/activity-areas/${area.id}`), {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Área de atuação excluída com sucesso!');
                fetchAreas();
            } else {
                toast.error(data.message || 'Erro ao excluir área');
            }
        } catch (error) {
            console.error('Erro ao excluir área:', error);
            toast.error('Erro ao excluir área');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedArea
                ? getApiUrl(NODE_API_URL, `/api/v2/activity-areas/${selectedArea.id}`)
                : getApiUrl(NODE_API_URL, '/api/v2/activity-areas');

            const method = selectedArea ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Área de atuação salva com sucesso!');
                setIsFormOpen(false);
                fetchAreas();
            } else {
                toast.error(data.message || 'Erro ao salvar área');
            }
        } catch (error) {
            console.error('Erro ao salvar área:', error);
            toast.error('Erro ao salvar área');
        }
    };

    // Filtrar dados localmente
    const filteredAreas = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return areas.filter(area =>
            (area.descricao || '').toLowerCase().includes(term) ||
            (area.id?.toString() || '').includes(term)
        );
    }, [areas, searchTerm]);

    // Paginação
    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredAreas.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAreas, page]);

    const totalPages = Math.ceil(filteredAreas.length / ITEMS_PER_PAGE);

    // Definição das colunas (formato tabela)
    const columns = [
        {
            key: 'id',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'descricao',
            label: 'Descrição',
            width: '400px',
            render: (row) => (
                <span className="font-semibold text-slate-800">{row.descricao}</span>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <ActivityAreaForm
                open={isFormOpen}
                data={selectedArea}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
            />

            <GridCadPadrao
                title="Áreas de Atuação"
                subtitle={`Gerencie as áreas de atuação (${filteredAreas.length} exibidos de ${areas.length} carregados)`}
                icon={Map}
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
                    total: filteredAreas.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchAreas}
            />
        </div>
    );
};

export default FrmAreaAtuacao;
