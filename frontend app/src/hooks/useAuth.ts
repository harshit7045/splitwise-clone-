import { create } from 'zustand';
import { storage } from '../utils/storage';

interface User {
    id: number;
    username: string;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
    restoreSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (user, token) => {
        await storage.setItem('user_token', token);
        await storage.setItem('user_info', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isLoading: false });
    },

    logout: async () => {
        await storage.deleteItem('user_token');
        await storage.deleteItem('user_info');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },

    restoreSession: async () => {
        try {
            const token = await storage.getItem('user_token');
            const userInfo = await storage.getItem('user_info');
            if (token && userInfo) {
                set({ user: JSON.parse(userInfo), token, isAuthenticated: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            set({ isLoading: false });
        }
    },
}));
