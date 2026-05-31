import React from 'react';
import { useApp } from '@/context/AppContext';
import Auth from '@/components/modaber/Auth';
import Onboarding from '@/components/modaber/Onboarding';
import AppShell from '@/components/modaber/AppShell';

const Index: React.FC = () => {
  const {
    account, profile, isInitializing,
    handleLogin, handleOnboardingComplete, handleProfileUpdate, handleLogout,
    lang, setLang, theme, setTheme,
  } = useApp();

  // Show nothing while restoring session from token
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <Auth
        onLogin={handleLogin}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  if (!profile) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <AppShell
      profile={profile}
      lang={lang}
      setLang={setLang}
      theme={theme}
      setTheme={setTheme}
      onLogout={handleLogout}
      onProfileUpdate={handleProfileUpdate}
    />
  );
};

export default Index;
