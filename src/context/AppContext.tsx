import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, UserAccount, UserProfile } from '../types';
import { authApi, profileApi, setAuthToken } from '../services/apiClient';

interface AppContextValue {
  // Auth
  account: UserAccount | null;
  profile: UserProfile | null;
  isInitializing: boolean;
  handleLogin: (acc: UserAccount) => Promise<void>;
  handleLogout: () => void;
  handleOnboardingComplete: (data: Omit<UserProfile, 'account'>) => Promise<void>;
  handleProfileUpdate: (updated: UserProfile) => Promise<void>;
  // i18n
  lang: Language;
  setLang: (lang: Language) => void;
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('modaber_lang') as Language;
    return saved === 'en' || saved === 'ar' ? saved : 'ar';
  });
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('modaber_theme') as 'light' | 'dark';
    return saved === 'light' || saved === 'dark' ? saved : 'light';
  });
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Apply lang to DOM
  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('modaber_lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    document.body.className = l === 'ar' ? 'font-ar' : '';
  }, []);

  // Apply theme to DOM
  const setTheme = useCallback((t: 'light' | 'dark') => {
    setThemeState(t);
    localStorage.setItem('modaber_theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, []);

  // Bootstrap: restore session from stored token.
  // IMPORTANT: only clear the token on an explicit 401 (invalid/expired).
  // A network error or server downtime must NOT log the user out.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('modaber_auth_token');
      if (token) {
        const res = await authApi.validateToken();

        if (res.ok) {
          // Token is valid — load the user's profile
          const profileRes = await profileApi.get();
          if (profileRes.ok && profileRes.data) {
            const data = profileRes.data as UserProfile;
            if (data.monthlySalary && data.monthlySalary > 0) {
              setProfile(data);
            }
            setAccount(
              (data as unknown as { account: UserAccount }).account ??
              { name: 'User', email: '', avatar: '' },
            );
          } else {
            // Profile fetch failed but token is fine — keep the session alive
            setAccount({ name: 'User', email: '', avatar: '' });
          }
        } else if (res.error === 'Session expired. Please log in again.') {
          // The refresh-token flow already ran and failed — clear everything
          setAuthToken(null, null);
        } else if (res.error?.includes('401') || res.error?.toLowerCase().includes('unauthorized')) {
          // Explicit 401 from the server — token is genuinely invalid
          setAuthToken(null, null);
        }
        // Any other error (network timeout, 500, etc.) — keep the token;
        // the user will stay logged in and can retry when connectivity returns.
      }
      setIsInitializing(false);
    };
    initAuth();
  }, []);

  // Apply initial lang/theme on mount
  useEffect(() => {
    setLang(lang);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTheme(theme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = useCallback(async (acc: UserAccount) => {
    const profileRes = await profileApi.get();
    if (profileRes.ok && profileRes.data) {
      const data = profileRes.data as UserProfile;
      if (data.monthlySalary && data.monthlySalary > 0) {
        setProfile(data);
      }
    }
    setAccount(acc);
  }, []);

  const handleLogout = useCallback(() => {
    setAccount(null);
    setProfile(null);
    setAuthToken(null, null); // clears both access + refresh tokens
  }, []);

  const handleOnboardingComplete = useCallback(async (data: Omit<UserProfile, 'account'>) => {
    if (!account) return;
    const fullProfile: UserProfile = { ...data, account };
    setProfile(fullProfile);
  }, [account]);

  const handleProfileUpdate = useCallback(async (updated: UserProfile) => {
    setProfile(updated);
    await profileApi.update(updated);
  }, []);

  return (
    <AppContext.Provider value={{
      account, profile, isInitializing,
      handleLogin, handleLogout, handleOnboardingComplete, handleProfileUpdate,
      lang, setLang,
      theme, setTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
