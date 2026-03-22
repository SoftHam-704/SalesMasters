import { create } from 'zustand';

export interface CartItem {
    pro_id: number;
    pro_codprod: string;
    pro_nome: string;
    pro_conversao?: string;
    pro_embalagem?: string;
    quantidade: number;
    preco_unitario: number;
    itab_ipi?: number;
    itab_st?: number;
}

interface CartState {
    industria_id: number | null;
    tabela: string | null;
    items: CartItem[];
    observacao: string;
    addItem: (item: CartItem) => void;
    removeItem: (pro_id: number) => void;
    updateQuantity: (pro_id: number, quantity: number) => void;
    setIndustria: (id: number, tabela: string) => void;
    setObservacao: (obs: string) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    industria_id: null,
    tabela: null,
    items: [],
    observacao: '',
    
    setIndustria: (id, tabela) => set({ industria_id: id, tabela }),
    
    addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.pro_id === item.pro_id);
        
        if (existing) {
            set({
                items: items.map((i) =>
                    i.pro_id === item.pro_id
                        ? { ...i, quantidade: i.quantidade + item.quantidade }
                        : i
                ),
            });
        } else {
            set({ items: [...items, item] });
        }
    },
    
    removeItem: (pro_id) =>
        set((state) => ({
            items: state.items.filter((i) => i.pro_id !== pro_id),
        })),
        
    updateQuantity: (pro_id, quantity) =>
        set((state) => ({
            items: state.items.map((i) =>
                i.pro_id === pro_id ? { ...i, quantidade: Math.max(0, quantity) } : i
            ).filter(i => i.quantidade > 0),
        })),
        
    setObservacao: (obs) => set({ observacao: obs }),
    
    clearCart: () => set({ items: [], observacao: '' }),
    
    getTotal: () => {
        return get().items.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0);
    },
}));
