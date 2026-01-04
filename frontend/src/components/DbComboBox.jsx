import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import './DbComboBox.css';

const DbComboBox = ({
    value,
    onChange,
    fetchData,
    labelKey = 'label',
    valueKey = 'value',
    placeholder = 'Pesquisar...',
    minChars = 1,
    initialLimit = 20
}) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    // sincroniza quando value externo muda
    useEffect(() => {
        if (value) {
            setInputValue(value[labelKey]);
        }
    }, [value]);

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

        const search = inputValue.trim();

        const timer = setTimeout(async () => {
            setLoading(true);

            // busca inicial
            const data =
                search.length < minChars
                    ? await fetchData('', initialLimit)
                    : await fetchData(search);

            setItems(data || []);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, open]);

    const handleSelect = (item) => {
        onChange(item);
        setInputValue(item[labelKey]);
        setOpen(false);
    };

    return (
        <div className="dbcombo" ref={ref}>
            <div
                className="dbcombo-input"
                onClick={() => setOpen(true)}
            >
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
