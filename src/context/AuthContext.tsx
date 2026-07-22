import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserSummaryResponse } from '@/types/auth';
import { Role } from '@/types/auth';
import apiClient from '@/api/client';
import { getToken, setToken, clearToken } from '@/utils/storage';
import { LoadingState } from '@/components/shared';

interface BackofficeUserResponse {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface BackofficeLoginResponse {
  token?: string;
  accessToken?: string;
  usuario?: BackofficeUserResponse;
  user?: UserSummaryResponse;
}

interface AuthState {
  user: UserSummaryResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapRole(role: string) {
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === Role.SUPER_ADMIN) return Role.SUPER_ADMIN;
  if (normalizedRole === Role.ADMIN) return Role.ADMIN;
  return Role.OPERATOR;
}

function mapUser(response: BackofficeLoginResponse): UserSummaryResponse | null {
  if (response.user) {
    return response.user;
  }

  if (!response.usuario) {
    return null;
  }

  const { usuario } = response;
  return {
    id: usuario.id,
    username: usuario.email,
    fullName: usuario.nombre,
    initials: usuario.nombre.substring(0, 2).toUpperCase(),
    role: mapRole(usuario.rol),
  };
}

function mapCurrentUser(response: UserSummaryResponse | BackofficeUserResponse): UserSummaryResponse {
  if ('fullName' in response) {
    return {
      ...response,
      role: mapRole(response.role),
    };
  }

  return {
    id: response.id,
    username: response.email,
    fullName: response.nombre,
    initials: response.nombre.substring(0, 2).toUpperCase(),
    role: mapRole(response.rol),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    async function restoreSession() {
      const token = await getToken();

      if (!token) {
        setState((current) => ({ ...current, isLoading: false }));
        return;
      }

      try {
        const response = await apiClient.get<UserSummaryResponse | BackofficeUserResponse>('/auth/me');
        setState({
          user: mapCurrentUser(response.data),
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        await clearToken();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }
    void restoreSession();
  }, []);

  const authenticate = useCallback(async (response: BackofficeLoginResponse) => {
    const token = response.token ?? response.accessToken;
    const user = mapUser(response);

    if (!token || !user) {
      throw new Error('Respuesta de autenticación inválida');
    }

    await setToken(token);
    const currentUser = await apiClient.get<UserSummaryResponse | BackofficeUserResponse>('/auth/me');
    setState({
      user: mapCurrentUser(currentUser.data),
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await apiClient.post<BackofficeLoginResponse>('/auth/login', {
        email: username.trim(),
        password,
        authProvider: 'EMAIL_PASSWORD',
      });
      await authenticate(response.data);
    },
    [authenticate],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await apiClient.post<BackofficeLoginResponse>('/auth/google', { idToken });
      await authenticate(response.data);
    },
    [authenticate],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  if (state.isLoading) {
    return <LoadingState label="Cargando sesión administrativa…" />;
  }

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
