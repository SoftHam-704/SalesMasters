import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import './DbComboBox.css';

const DbComboBox = ({
    value,
    onChange,
    fetchData,
    label,
    initialLabel = '', // Suporte para o texto inicial quando temos apenas o ID
    labelKey = 'label',
    valueKey = 'value',
    placeholder = 'Pesquisar...',
    minChars = 1,
    initialLimit = 20
}) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(initialLabel);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    // Sincroniza quando o valor ou o label inicial mudam (importante para o modo Edição)
    useEffect(() => {
        if (value && typeof value === 'object') {
            setInputValue(value[labelKey] || '');
        } else if (value && initialLabel) {
            setInputValue(initialLabel);
        } else if (!value) {
            setInputValue('');
        }
    }, [value, initialLabel, labelKey]);

    // fecha ao clicar fora
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // busca sempre baseada NO TEXTO DIGITADO
    useEffect(() => {
        if (!open) return;

        const search = String(inputValue || '').trim();

        const timer = setTimeout(async () => {
            setLoading(true);

            // busca inicial
            try {
                const data =
                    search.length < minChars
                        ? await fetchData('', initialLimit)
                        : await fetchData(search);

                setItems(data || []);
            } catch (error) {
                console.error("Erro na busca do DbComboBox:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, open, fetchData, initialLimit, minChars]);

    const handleSelect = (item) => {
        // Passa o valor (ID) e o item completo
        onChange(item[valueKey], item);
        setInputValue(item[labelKey]);
        setOpen(false);
    };

    return (
        <div className="dbcombo" ref={ref}>
            <div
                className="dbcombo-input"
                onClick={() => setOpen(true)}
            >
                {/* Simulated Floating/Fixed Label to match InputField */}
                {label && <label className="dbcombo-label">{label}</label>}
                <Search size={16} />
                <input
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setOpen(true);
                    }}
                    placeholder={placeholder}
                />
                <ChevronDown size={16} />
            </div>

            {open && (
                <div className="dbcombo-dropdown">
                    {loading && <div className="dbcombo-loading">Buscando...</div>}

                    {!loading && items.length === 0 && (
                        <div className="dbcombo-empty">
                            Nenhum resultado
                        </div>
                    )}

                    {items.map((item) => (
                        <div
                            key={item[valueKey]}
                            className="dbcombo-item"
                            onClick={() => handleSelect(item)}
                        >
                            {item[labelKey]}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DbComboBox;
