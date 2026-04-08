import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from "react";
import { apiRequest, setAuthToken, getAuthToken, setRefreshToken, getRefreshToken, setLogoutCallback, queryClient } from "@/lib/query-client";
import { API } from "@/lib/api-endpoints";
import { addSSEListener } from "@/hooks/useUserSSE";
import { clearBiometrics, setBiometricSessionSkipped } from "@/lib/biometrics";
import type { SafeUser } from "@shared/schema";

export type AuthUser = SafeUser;

interface VerifyCodeResult {
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  requiresIdentityConfirmation?: boolean;
  challengeToken?: string;
  maskedName?: string;
  maskedEmail?: string;
  isNewUser?: boolean;
}

interface AuthStateValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActionsValue {
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; email?: string; phone?: string; name?: string }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  phoneLogin: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; city?: string; about?: string; avatarUrl?: string | null; companyName?: string | null; companyDescription?: string | null; companyLogoUrl?: string | null; companyCoverUrl?: string | null; dealerSpecialization?: string | null; workingHours?: string | null; showroomAddress?: string | null; website?: string | null; creditProgramEnabled?: boolean; creditInterestRate?: number | null; creditMaxTerm?: number | null; creditMinDownPayment?: number | null; tradeInEnabled?: boolean; warrantyEnabled?: boolean }) => Promise<void>;
  refreshUser: () => Promise<void>;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<VerifyCodeResult>;
  confirmIdentity: (phone: string, challengeToken: string) => Promise<void>;
  disownAccount: (phone: string, challengeToken: string) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
}

interface AuthContextValue extends AuthStateValue, AuthActionsValue {}

const AuthStateContext = createContext<AuthStateValue | null>(null);
const AuthActionsContext = createContext<AuthActionsValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const performLogout = useCallback(async () => {
    setUser(null);
    await setAuthToken(null);
    await setRefreshToken(null);
    try { await clearBiometrics(); } catch (e) { console.warn("clearBiometrics during logout:", e); }
    queryClient.clear();
  }, []);

  useEffect(() => {
    setLogoutCallback(() => {
      performLogout();
    });
  }, [performLogout]);

  useEffect(() => {
    checkAuth();
  }, []);

  const tryRefreshToken = async (): Promise<boolean> => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await apiRequest("POST", API.auth.tokenRefresh, { refreshToken });
      const data = await res.json();
      if (data.accessToken) {
        await setAuthToken(data.accessToken);
        const meRes = await apiRequest("GET", API.auth.me);
        const userData = await meRes.json();
        setUser(userData);
        return true;
      }
    } catch {
      await clearBiometrics();
      await setRefreshToken(null);
    }
    return false;
  };

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        const refreshed = await tryRefreshToken();
        if (!refreshed) {
          setIsLoading(false);
        }
        return;
      }

      const res = await apiRequest("GET", API.auth.me);
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      await setAuthToken(null);
      await setRefreshToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    try {
      setBiometricSessionSkipped(false);
      const res = await apiRequest("POST", API.auth.login, { username, password });
      const data = await res.json();
      await setAuthToken(data.token || data.accessToken);
      if (data.refreshToken) await setRefreshToken(data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries();
    } catch (error: any) {
      const err: any = new Error(error instanceof Error ? error.message : "Неверный логин или пароль");
      if (error?.status) err.status = error.status;
      if (error?.code) err.code = error.code;
      throw err;
    }
  }, []);

  const register = useCallback(async (registerData: { username: string; password: string; email?: string; phone?: string; name?: string }) => {
    try {
      setBiometricSessionSkipped(false);
      const res = await apiRequest("POST", API.auth.register, registerData);
      const data = await res.json();
      await setAuthToken(data.token || data.accessToken);
      if (data.refreshToken) await setRefreshToken(data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries();
    } catch (error: any) {
      const err: any = new Error(error instanceof Error ? error.message : "Не удалось создать аккаунт");
      if (error?.status) err.status = error.status;
      if (error?.code) err.code = error.code;
      throw err;
    }
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    try {
      setBiometricSessionSkipped(false);
      const res = await apiRequest("POST", API.auth.google, { idToken });
      const data = await res.json();
      await setAuthToken(data.token || data.accessToken);
      if (data.refreshToken) await setRefreshToken(data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось войти через Google";
      throw new Error(errorMessage);
    }
  }, []);

  const phoneLogin = useCallback(async (userData: AuthUser, accessToken: string, refreshToken: string) => {
    setBiometricSessionSkipped(false);
    await setAuthToken(accessToken);
    await setRefreshToken(refreshToken);
    setUser(userData);
    queryClient.invalidateQueries();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("POST", API.auth.logout);
    } catch (error) {
      console.error("Logout API call failed:", error);
    }
    await performLogout();
  }, [performLogout]);

  const updateProfile = useCallback(async (data: { name?: string; phone?: string; city?: string; about?: string; avatarUrl?: string | null; companyName?: string | null; companyDescription?: string | null; companyLogoUrl?: string | null; companyCoverUrl?: string | null; dealerSpecialization?: string | null; workingHours?: string | null; showroomAddress?: string | null; website?: string | null; creditProgramEnabled?: boolean; creditInterestRate?: number | null; creditMaxTerm?: number | null; creditMinDownPayment?: number | null; tradeInEnabled?: boolean; warrantyEnabled?: boolean }) => {
    try {
      const res = await apiRequest("PUT", API.auth.profile, data);
      const updated = await res.json();
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: [API.dealer.myFeatures] });
      queryClient.invalidateQueries({ queryKey: [API.auth.listingLimits] });
      queryClient.invalidateQueries({ queryKey: [API.listings.my] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Не удалось обновить профиль";
      throw new Error(errorMessage);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiRequest("GET", API.auth.me);
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const sendCode = useCallback(async (phone: string) => {
    const res = await apiRequest("POST", API.auth.phone.sendCode, { phone });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to send code");
    }
  }, []);

  const verifyCode = useCallback(async (phone: string, code: string): Promise<VerifyCodeResult> => {
    setBiometricSessionSkipped(false);
    const res = await apiRequest("POST", API.auth.phone.verifyCode, { phone, code });
    const data = await res.json();

    if (data.requiresIdentityConfirmation) {
      return {
        requiresIdentityConfirmation: true,
        challengeToken: data.challengeToken,
        maskedName: data.maskedHints?.name,
        maskedEmail: data.maskedHints?.email,
      };
    }

    await setAuthToken(data.accessToken || data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    setUser(data.user);
    queryClient.invalidateQueries();

    return {
      user: data.user,
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
      requiresIdentityConfirmation: false,
      isNewUser: !data.user?.name,
    };
  }, []);

  const confirmIdentity = useCallback(async (phone: string, challengeToken: string) => {
    setBiometricSessionSkipped(false);
    const res = await apiRequest("POST", API.auth.phone.confirmIdentity, { phone, challengeToken });
    const data = await res.json();
    await setAuthToken(data.accessToken || data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    setUser(data.user);
    queryClient.invalidateQueries();
  }, []);

  const disownAccount = useCallback(async (phone: string, challengeToken: string) => {
    setBiometricSessionSkipped(false);
    const res = await apiRequest("POST", API.auth.phone.disownAccount, { phone, challengeToken });
    const data = await res.json();
    await setAuthToken(data.accessToken || data.token);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    setUser(data.user);
    queryClient.invalidateQueries();
  }, []);

  const setUserName = useCallback(async (name: string) => {
    const res = await apiRequest("PUT", API.auth.profile, { name });
    const updated = await res.json();
    setUser(updated);
  }, []);

  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  useEffect(() => {
    if (!user) return;
    return addSSEListener((event) => {
      if (
        event.event === "account_update" ||
        event.event === "wallet_update" ||
        event.event === "new_review"
      ) {
        refreshUserRef.current();
      }
    });
  }, [!!user]);

  const stateValue = useMemo<AuthStateValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
  }), [user, isLoading]);

  const actionsValue = useMemo<AuthActionsValue>(() => ({
    login,
    register,
    googleLogin,
    phoneLogin,
    logout,
    updateProfile,
    refreshUser,
    sendCode,
    verifyCode,
    confirmIdentity,
    disownAccount,
    setUserName,
  }), [login, register, googleLogin, phoneLogin, logout, updateProfile, refreshUser, sendCode, verifyCode, confirmIdentity, disownAccount, setUserName]);

  return (
    <AuthStateContext.Provider value={stateValue}>
      <AuthActionsContext.Provider value={actionsValue}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const state = useContext(AuthStateContext);
  const actions = useContext(AuthActionsContext);
  if (!state || !actions) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

export function useAuthState(): AuthStateValue {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error("useAuthState must be used within an AuthProvider");
  }
  return context;
}

export function useAuthActions(): AuthActionsValue {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
}
