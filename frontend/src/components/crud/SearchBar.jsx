import React from 'react';
import { Search, X } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ placeholder = "Pesquisar...", value, onChange, onClear }) => {
    const [localValue, setLocalValue] = React.useState(value || '');

    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleClear = () => {
        setLocalValue('');
        if (onClear) {
            onClear();
        }
        if (onChange) {
            onChange('');
        }
    };

    return (
        <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
                type="text"
                placeholder={placeholder}
                value={localValue}
                onChange={handleChange}
                className="search-input"
            />
            {localValue && (
                <button onClick={handleClear} className="search-clear">
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
