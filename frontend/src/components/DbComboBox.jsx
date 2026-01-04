import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import './DbComboBox.css';

const DbComboBox = ({
    value,
    onChange,
    fetchData,
    labelKey = 'label',
    valueKey = 'value',
    placeholder = 'Selecione...',
    minChars = 2,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    // Fecha ao clicar fora
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Busca remota com debounce
    useEffect(() => {
        if (search.length < minChars) {
            setItems([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            const result = await fetchData(search);
            setItems(result || []);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, fetchData, minChars]);

    const handleSelect = (item) => {
        onChange(item);
        setSearch(item[labelKey]);
        setOpen(false);
    };

    return (
        <div className="dbcombo" ref={ref}>
            <div className="dbcombo-input" onClick={() => setOpen(true)}>
                <Search size={16} />
                <input
                    value={search || (value ? value[labelKey] : '')}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    placeholder={placeholder}
                />
                <ChevronDown size={16} />
            </div>

            {open && (
                <div className="dbcombo-dropdown">
                    {loading && <div className="dbcombo-loading">Buscando...</div>}

                    {!loading && items.length === 0 && search.length >= minChars && (
                        <div className="dbcombo-empty">
                            Nenhum resultado encontrado
                        </div>
                    )}

                    {!loading && items.length === 0 && search.length < minChars && (
                        <div className="dbcombo-empty">
                            Digite para pesquisar
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
