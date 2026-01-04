import { useState, useEffect } from "react";
import { Map } from "lucide-react";
import { toast } from "sonner";
import ActivityAreaForm from "../components/forms/ActivityAreaForm";
import GridCadPadraoV2 from "../components/GridCadPadraoV2";

const FrmAreaAtuacao = () => {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedArea, setSelectedArea] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/activity-areas');
            const data = await response.json();
            if (data.success) {
                setAreas(data.data);
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
        if (!window.confirm(`Deseja realmente excluir a área "${area.atu_descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/activity-areas/${area.atu_id}`, {
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
                ? `http://localhost:3005/api/v2/activity-areas/${selectedArea.atu_id}`
                : 'http://localhost:3005/api/v2/activity-areas';

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

    // Definição das colunas
    const columns = [
        {
            key: 'atu_id',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'atu_descricao',
            label: 'Descrição',
            cellClass: 'font-semibold text-orange-600'
        }
    ];

    // Filtrar dados localmente
    const filteredAreas = searchTerm
        ? areas.filter(area =>
            area.atu_descricao?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : areas;

    return (
        <>
            {isFormOpen && (
                <ActivityAreaForm
                    data={selectedArea}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            <GridCadPadraoV2
                title="Áreas de Atuação"
                subtitle="Gerencie as áreas de atuação"
                icon={Map}
                data={filteredAreas}
                titleKey="atu_descricao"
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </>
    );
};

export default FrmAreaAtuacao;
