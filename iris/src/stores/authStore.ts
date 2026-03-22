import { create } from 'zustand';

interface Lojista {
    cli_codigo: number;
    cli_nome: string;
    cli_nomred: string;
}

interface Industria {
    id: number;
    nome: string;
    nome_resumido: string;
}

interface AuthState {
    token: string | null;
    lojista: Lojista | null;
    industrias: Industria[];
    isInitialized: boolean;
    setToken: (token: string) => void;
    setAuth: (lojista: Lojista, industrias: Industria[]) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('iris_token'),
    lojista: null,
    industrias: [],
    isInitialized: false,
    setToken: (token) => {
        localStorage.setItem('iris_token', token);
        set({ token });
    },
    setAuth: (lojista, industrias) => set({ lojista, industrias, isInitialized: true }),
    clearAuth: () => {
        localStorage.removeItem('iris_token');
        set({ token: null, lojista: null, industrias: [], isInitialized: true });
    },
}));
