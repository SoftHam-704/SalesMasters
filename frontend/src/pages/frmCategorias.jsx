import { useState, useEffect, useMemo } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import CategoryForm from "../components/forms/CategoryForm";
import GridCadPadrao from "../components/GridCadPadrao";
import { NODE_API_URL, getApiUrl } from "../utils/apiConfig";

const FrmCategorias = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/product-categories'));
            const data = await response.json();
            if (data.success) {
                const adaptedData = data.data.map(item => ({
                    id: item.cat_id,
                    descricao: item.cat_descricao,
                    _original: item
                }));
                setCategories(adaptedData);
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleNew = () => {
        setSelectedCategory(null);
        setIsFormOpen(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setIsFormOpen(true);
    };

    const handleDelete = async (category) => {
        if (!window.confirm(`Deseja realmente excluir a categoria "${category.descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/product-categories/${category.id}`), {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Categoria excluída com sucesso!');
                fetchCategories();
            } else {
                toast.error(data.message || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao excluir categoria');
        }
    };

    const handleSave = async (formData) => {
        try {
            const url = selectedCategory
                ? getApiUrl(NODE_API_URL, `/api/v2/product-categories/${selectedCategory.id}`)
                : getApiUrl(NODE_API_URL, '/api/v2/product-categories');

            const method = selectedCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message || 'Categoria salva com sucesso!');
                setIsFormOpen(false);
                fetchCategories();
            } else {
                toast.error(data.message || 'Erro ao salvar');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao salvar categoria');
        }
    };

    // Filtrar dados localmente
    const filteredCategories = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return categories.filter(cat =>
            (cat.descricao || '').toLowerCase().includes(term) ||
            (cat.id?.toString() || '').includes(term)
        );
    }, [categories, searchTerm]);

    // Paginação
    const paginatedData = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCategories, page]);

    const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);

    // Definição das colunas
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
                <span className="font-semibold text-blue-600">{row.descricao}</span>
            )
        }
    ];

    return (
        <div className="h-full bg-slate-50 p-6">
            <CategoryForm
                open={isFormOpen}
                data={selectedCategory}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
            />

            <GridCadPadrao
                title="Categorias de Produtos"
                subtitle={`Gerencie as categorias de produtos (${filteredCategories.length} exibidos de ${categories.length} carregados)`}
                icon={Tag}
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
                    total: filteredCategories.length,
                    totalPages
                }}
                onPageChange={setPage}
                onRefresh={fetchCategories}
            />
        </div>
    );
};

export default FrmCategorias;
