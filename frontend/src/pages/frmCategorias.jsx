import { useState, useEffect } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import CategoryForm from "../components/forms/CategoryForm";
import GridCadPadrao from "../components/GridCadPadrao";

const FrmCategorias = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/v2/product-categories');
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
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
        if (!window.confirm(`Deseja realmente excluir a categoria "${category.cat_descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/v2/product-categories/${category.cat_id}`, {
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
                ? `http://localhost:3005/api/v2/product-categories/${selectedCategory.cat_id}`
                : 'http://localhost:3005/api/v2/product-categories';

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

    // Definição das colunas
    const columns = [
        {
            key: 'cat_id',
            label: 'ID',
            width: '80px',
            isId: true
        },
        {
            key: 'cat_descricao',
            label: 'Descrição',
            cellClass: 'font-semibold text-blue-600'
        }
    ];

    // Filtrar dados localmente
    const filteredCategories = searchTerm
        ? categories.filter(cat =>
            cat.cat_descricao?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : categories;

    return (
        <>
            {isFormOpen && (
                <CategoryForm
                    data={selectedCategory}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            <GridCadPadrao
                title="Categorias de Produtos"
                subtitle="Gerencie as categorias (Leve, Pesada, etc.)"
                icon={Tag}
                data={filteredCategories}
                loading={loading}
                columns={columns}
                searchPlaceholder="Buscar categoria..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                onNew={handleNew}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchCategories}
                newButtonLabel="Nova Categoria"
            />
        </>
    );
};

export default FrmCategorias;
