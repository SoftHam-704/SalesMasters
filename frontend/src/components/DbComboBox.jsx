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
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

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
            if (containerRef.current && !containerRef.current.contains(e.target)) {
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
                setHighlightedIndex(-1); // Reseta highlight na nova busca
            } catch (error) {
                console.error("Erro na busca do DbComboBox:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, open, fetchData, initialLimit, minChars]);

    // Auto-scroll para o item destacado
    useEffect(() => {
        if (open && highlightedIndex >= 0 && dropdownRef.current) {
            const itemElement = dropdownRef.current.children[highlightedIndex];
            if (itemElement) {
                itemElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, open]);

    // Focus input when opened to ensure keyboard works
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleSelect = (item) => {
        // Passa o valor (ID) e o item completo
        onChange(item[valueKey], item);
        setInputValue(item[labelKey]);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!open) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < items.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : items.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && items[highlightedIndex]) {
                    handleSelect(items[highlightedIndex]);
                    inputRef.current?.blur(); // Opcional: tirar foco
                }
                break;
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                break;
            case 'Tab':
                setOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="dbcombo" ref={containerRef}>
            <div
                className="dbcombo-input"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                    setOpen(true);
                }}
            >
                {/* Floating/Fixed Label to match InputField */}
                {label && <label className="field-label">{label}</label>}
                <Search size={16} onClick={() => setOpen(true)} />
                <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setOpen(true);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    onFocus={(e) => {
                        e.target.select();
                        setOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                <ChevronDown size={16} onClick={() => setOpen(true)} className="text-slate-400 hover:text-blue-500" />
            </div>

            {open && (
                <div className="dbcombo-dropdown" ref={dropdownRef}>
                    {loading && <div className="dbcombo-loading">Buscando...</div>}

                    {!loading && items.length === 0 && (
                        <div className="dbcombo-empty">
                            Nenhum resultado
                        </div>
                    )}

                    {items.map((item, index) => (
                        <div
                            key={item[valueKey]}
                            className={`dbcombo-item ${index === highlightedIndex ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                            style={{
                                scrollMarginBlock: '40px',
                                backgroundColor: index === highlightedIndex ? '#dbeafe' : undefined
                            }}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setHighlightedIndex(index)}
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
