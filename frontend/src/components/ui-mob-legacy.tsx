// ========================================
// REUSABLE UI COMPONENTS (LEGENDARY EDITION)
// ========================================
import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ========================================
// BUTTON
// ========================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'success' | 'ghost' | 'danger' | 'luxury' | 'warning' | 'info' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    style,
    ...props
}) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600",
        success: "bg-emerald-600 text-white shadow-xl shadow-emerald-500/30",
        warning: "bg-amber-500 text-white shadow-xl shadow-amber-500/30",
        info: "bg-blue-500 text-white shadow-xl shadow-blue-500/30",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
        danger: "bg-rose-500 text-white shadow-xl shadow-rose-500/30",
        luxury: "bg-slate-900 text-white shadow-2xl shadow-slate-900/40",
        outline: "bg-transparent border-2 border-slate-200 text-slate-600 hover:border-slate-300"
    };

    const sizes = {
        sm: "h-10 px-4 text-[10px] rounded-xl",
        md: "h-14 px-8 text-xs rounded-2xl",
        lg: "h-16 px-10 text-sm rounded-[20px]"
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
            disabled={disabled || loading}
            style={style}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2.5} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : 20} strokeWidth={2.5} />}
                </>
            )}
        </button>
    );
};

// ========================================
// ICON BUTTON
// ========================================
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    variant?: 'primary' | 'success' | 'ghost' | 'danger' | 'luxury';
    size?: number;
    label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon: Icon,
    variant = 'ghost',
    size = 24,
    label,
    className = '',
    style,
    ...props
}) => {
    const variants = {
        primary: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
        success: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        ghost: "bg-transparent text-slate-400 hover:bg-slate-100/5 hover:text-emerald-500",
        danger: "bg-rose-500 text-white shadow-lg shadow-rose-500/20",
        luxury: "bg-slate-900 text-white shadow-lg shadow-slate-900/40"
    };

    return (
        <button
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${variants[variant]} ${className}`}
            aria-label={label}
            style={style}
            {...props}
        >
            <Icon size={size} strokeWidth={2.5} />
        </button>
    );
};

// ========================================
// INPUT
// ========================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    icon: Icon,
    error,
    hint,
    className = '',
    style,
    ...props
}, ref) => (
    <div className={`flex flex-col gap-2 ${className}`} style={style}>
        {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>}
        <div className="relative group">
            {Icon && (
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            )}
            <input
                ref={ref}
                className={`w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 ${Icon ? 'pl-14' : ''} text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm`}
                {...props}
            />
        </div>
        {(error || hint) && (
            <div className="flex justify-between items-center px-2">
                {error ? <span className="text-[10px] font-bold text-rose-500">{error}</span> : <span></span>}
                {hint && !error && <span className="text-[10px] font-bold text-slate-400">{hint}</span>}
            </div>
        )}
    </div>
));

Input.displayName = 'Input';

// ========================================
// SELECT
// ========================================
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label,
    icon: Icon,
    error,
    className = '',
    children,
    style,
    ...props
}, ref) => (
    <div className={`flex flex-col gap-2 ${className}`} style={style}>
        {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>}
        <div className="relative group">
            {Icon && (
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors z-10">
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            )}
            <select
                ref={ref}
                className={`w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 ${Icon ? 'pl-14' : ''} text-slate-900 font-bold appearance-none focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm`}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1.25rem center',
                    backgroundSize: '1rem'
                }}
                {...props}
            >
                {children}
            </select>
        </div>
        {error && <span className="text-[10px] font-bold text-rose-500 px-2">{error}</span>}
    </div>
));

Select.displayName = 'Select';

// ========================================
// CARD
// ========================================
interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    hoverable = false,
    style,
}) => (
    <div
        className={`card-hero p-8 ${onClick || hoverable ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
        onClick={onClick}
        style={style}
    >
        {children}
    </div>
);

// ========================================
// BADGE
// ========================================
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'luxury' | 'outline';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'info',
    className = ''
}) => {
    const variants = {
        success: "bg-emerald-50 text-emerald-600 border border-emerald-100",
        warning: "bg-amber-50 text-amber-600 border border-amber-100",
        danger: "bg-rose-50 text-rose-600 border border-rose-100",
        info: "bg-blue-50 text-blue-600 border border-blue-100",
        luxury: "bg-slate-900 text-white shadow-lg",
        outline: "bg-transparent border border-slate-200 text-slate-500"
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${variants[variant] || variants.info} ${className}`}>
            {children}
        </span>
    );
};

// ========================================
// LIST ITEM
// ========================================
interface ListItemProps {
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    onClick?: () => void;
    className?: string;
    rightContent?: React.ReactNode;
    style?: React.CSSProperties;
}

export const ListItem: React.FC<ListItemProps> = ({
    icon: Icon,
    title,
    subtitle,
    badge,
    onClick,
    className = '',
    rightContent,
    style
}) => (
    <div
        className={`flex items-center gap-5 p-6 bg-white rounded-[24px] shadow-sm border border-slate-50 active:scale-[0.98] transition-all cursor-pointer ${className}`}
        onClick={onClick}
        style={style}
    >
        {Icon && (
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <Icon size={24} strokeWidth={2.5} />
            </div>
        )}
        <div className="flex-1 min-w-0">
            <div className="text-base font-black text-slate-900 tracking-tight truncate">{title}</div>
            {subtitle && <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{subtitle}</div>}
        </div>
        {badge}
        {rightContent}
    </div>
);

// ========================================
// SEARCH BAR
// ========================================
interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
    onSearch?: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({
    onSearch,
    className = '',
    ...props
}, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearch?.(e.target.value);
        props.onChange?.(e);
    };

    return (
        <div className={`relative group ${className}`}>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} strokeWidth={2.5} />
            <input
                ref={ref}
                type="search"
                className="w-full h-14 bg-white border border-slate-100 rounded-[22px] pl-16 pr-6 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-md"
                placeholder="Buscar..."
                {...props}
                onChange={handleChange}
            />
        </div>
    );
});

SearchBar.displayName = 'SearchBar';

// ========================================
// EMPTY STATE
// ========================================
interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action
}) => (
    <div className="flex flex-col items-center justify-center text-center p-12">
        {Icon && (
            <div className="w-24 h-24 rounded-[40px] bg-slate-50 flex items-center justify-center text-slate-200 mb-8 animate-float">
                <Icon size={48} strokeWidth={1.5} />
            </div>
        )}
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">{title}</h3>
        {description && <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8 max-w-[240px]">{description}</p>}
        {action}
    </div>
);

// ========================================
// PAGE HEADER
// ========================================
interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backButton?: boolean;
    onBack?: () => void;
    rightContent?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    backButton = false,
    onBack,
    rightContent
}) => (
    <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[480px] mx-auto px-8 h-24 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {backButton && (
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-slate-900 active:scale-90 transition-transform"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <div className="min-w-0">
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter leading-none truncate">{title}</h1>
                    {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate">{subtitle}</p>}
                </div>
            </div>
            {rightContent}
        </div>
    </header>
);

// ========================================
// PERCENTAGE INPUT
// ========================================
interface PercentageInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
    value,
    onChange,
    placeholder,
    label,
    className = ''
}) => {
    const formatValue = (val: number) => {
        return val.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <div className={`flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-6 h-14 shadow-sm ${className}`}>
            <input
                type="text"
                inputMode="numeric"
                className="flex-1 bg-transparent text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none"
                placeholder={placeholder || '0,00'}
                value={value > 0 ? formatValue(value) : ''}
                onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const numericValue = raw ? parseInt(raw, 10) / 100 : 0;
                    onChange(numericValue);
                }}
                onFocus={e => (e.target as HTMLInputElement).select()}
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label || '%'}</span>
        </div>
    );
};
