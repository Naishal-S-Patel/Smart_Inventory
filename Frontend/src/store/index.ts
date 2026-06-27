import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { clearTokens, getRefreshToken } from '../lib/apiClient';
import { toast } from 'sonner';

// ─── Auth Store ────────────────────────────────────────────────
// All domain data (products, inventory, etc.) is now fetched via
// React Query hooks in each page — not stored here.
// The store only manages auth state and UI preferences.

interface AppStore {
  // Auth
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Derive a display name from email (e.g. "admin@..." → "Admin")
function deriveNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  return local.charAt(0).toUpperCase() + local.slice(1).replace(/[._]/g, ' ');
}

// Map roles array from JWT to single UserRole
function primaryRole(roles: string[]): UserRole {
  if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('ROLE_MANAGER') || roles.includes('MANAGER')) return 'MANAGER';
  if (roles.includes('ROLE_ANALYST') || roles.includes('ANALYST')) return 'ANALYST';
  return 'STAFF';
}

// Re-hydrate user from localStorage on page refresh
function loadPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem('si_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User | null) {
  if (user) {
    localStorage.setItem('si_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('si_user');
  }
}

export const useInventoryStore = create<AppStore>((set) => ({
  currentUser: loadPersistedUser(),

  login: async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const role = primaryRole(response.user.roles);
      const user: User = {
        id: response.user.id,
        name: deriveNameFromEmail(response.user.email),
        email: response.user.email,
        role,
        status: 'active',
      };
      persistUser(user);
      set({ currentUser: user });
      toast.success(`Welcome back, ${user.name}`);
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Invalid credentials';
      toast.error(msg);
      return false;
    }
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // ignore — clear locally regardless
      }
    }
    clearTokens();
    persistUser(null);
    set({ currentUser: null });
    toast.info('Signed out successfully');
  },

  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: next };
    });
  },
}));
