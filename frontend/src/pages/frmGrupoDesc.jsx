import { useState, useEffect } from "react";
import { Tags } from "lucide-react";
import { toast } from "sonner";
import DiscountGroupForm from "../components/forms/DiscountGroupForm";
import GridCadPadraoV2 from "../components/GridCadPadraoV2";

const FrmGrupoDesc = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/discount-groups');
            const data = await response.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            toast.error('Erro ao carregar grupos de desconto');
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
        if (!window.confirm(`Deseja realmente excluir o grupo "${group.gid}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/discount-groups/${group.gde_id}`, {
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
                ? `http://localhost:3005/api/v2/discount-groups/${selectedGroup.gde_id}`
                : 'http://localhost:3005/api/v2/discount-groups';

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

    // Helper para formatar porcentagem
    const fmtPct = (val) => {
        const num = parseFloat(val) || 0;
        return `${num.toFixed(2)}%`;
    };

    // Definição das colunas seguindo o modelo Delphi (Grid de descontos)
    const columns = [
        {
            key: 'gid',
            label: 'ID',
            width: '60px',
            align: 'center',
            isId: true,
            render: (row) => row.gid?.toString().padStart(3, '0')
        },
        // Mapeando colunas de 1 a 9
        ...Array.from({ length: 9 }, (_, i) => ({
            key: `gde_desc${i + 1}`,
            label: `${i + 1}º`,
            render: (row) => fmtPct(row[`gde_desc${i + 1}`]),
            align: 'center',
            width: '80px'
        }))
    ];

    // Filtrar dados localmente
    const filteredGroups = searchTerm
        ? groups.filter(g =>
            g.gid?.toString().includes(searchTerm) ||
            // Se o usuário buscar por porcentagem "10.00"
            Object.values(g).some(val => val?.toString().includes(searchTerm))
        )
        : groups;

    return (
        <>
            {isFormOpen && (
                <DiscountGroupForm
                    data={selectedGroup}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            <GridCadPadraoV2
                title="Grupos de Desconto"
                subtitle="Matriz de descontos por grupo"
                icon={Tags}
                data={filteredGroups}
                columns={columns}
                titleKey="displayName"
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </>
    );
};

export default FrmGrupoDesc;
