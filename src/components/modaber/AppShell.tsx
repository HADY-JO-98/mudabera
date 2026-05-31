import React, { useState } from 'react';
import { UserProfile, Language } from '../../types';
import { translations } from '../../translations';
import { 
  LayoutDashboard, PieChart, TrendingUp, ShoppingCart, ListOrdered, User, BrainCircuit, 
  ShieldCheck, HelpCircle, LogOut, Sun, Moon, Globe, Wallet, X, BarChart3, Receipt, Menu
} from 'lucide-react';
import Dashboard from './Dashboard';
import BudgetPlanner from './BudgetPlanner';
import Investments from './Investments';
import PriceForecaster from './PriceForecaster';
import ShoppingList from './ShoppingList';
import Profile from './Profile';
import ExtraPages from './ExtraPages';
import Analytics from './Analytics';
import HiddenReport from './HiddenReport';
import SavedItems from './SavedItems';
import PurchaseHistory from './PurchaseHistory';
import ExpenseTracker from './ExpenseTracker';
import NotificationSystem from './NotificationSystem';

interface AppShellProps {
  profile: UserProfile;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onLogout: () => void;
  onProfileUpdate: (p: UserProfile) => void;
}

type Page = 'dashboard' | 'expenses' | 'budget' | 'investments' | 'prices' | 'shopping' | 'analytics' | 'profile' | 'saved' | 'how' | 'privacy' | 'help';


interface SidebarContentProps {
  isMobile?: boolean;
}

const AppShell: React.FC<AppShellProps> = ({ profile, lang, setLang, theme, setTheme, onLogout, onProfileUpdate }) => {
  const t = translations[lang];
  const [page, setPage] = useState<Page>('expenses');
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse to icons-only

  const navItems: { id: Page; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, color: 'text-primary' },
    { id: 'expenses', label: t.expenseTracker, icon: Receipt, color: 'text-amber' },
    { id: 'budget', label: t.budgetPlanner, icon: PieChart, color: 'text-violet' },
    { id: 'investments', label: t.investments, icon: TrendingUp, color: 'text-amber' },
    { id: 'prices', label: t.priceForecaster, icon: ShoppingCart, color: 'text-sky' },
    { id: 'shopping', label: t.shoppingList, icon: ListOrdered, color: 'text-rose' },
    { id: 'saved', label: t.savedPriceItems, icon: Wallet, color: 'text-teal' },
    { id: 'analytics', label: t.analytics, icon: BarChart3, color: 'text-teal' },
    { id: 'profile', label: t.profile, icon: User, color: 'text-indigo' },
  ];

  const extraItems: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: 'how', label: t.howItWorks, icon: BrainCircuit },
    { id: 'privacy', label: t.privacyPolicy, icon: ShieldCheck },
    { id: 'help', label: t.helpSupport, icon: HelpCircle },
  ];

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard profile={profile} lang={lang} theme={theme} />;
      case 'expenses': return <ExpenseTracker profile={profile} lang={lang} onNavigate={(p) => setPage(p as Page)} />;
      case 'budget': return <BudgetPlanner profile={profile} lang={lang} />;
      case 'investments': return <Investments profile={profile} lang={lang} />;
      case 'prices': return <PriceForecaster profile={profile} lang={lang} onNavigate={(p) => setPage(p as Page)} />;
      case 'shopping': return <ShoppingList profile={profile} lang={lang} onNavigate={(p) => setPage(p as Page)} />;
      case 'saved': return <SavedItems lang={lang} />;
      case 'analytics': return <Analytics profile={profile} lang={lang} />;
      case 'profile': return <Profile profile={profile} lang={lang} onUpdate={onProfileUpdate} />;
      case 'how': return <ExtraPages type="how" lang={lang} />;
      case 'privacy': return <ExtraPages type="privacy" lang={lang} />;
      case 'help': return <ExtraPages type="help" lang={lang} />;
    }
  };

  const sidebarWidth = sidebarCollapsed ? 'w-[76px]' : 'w-[280px]';
  const mainMargin = sidebarCollapsed ? 'lg:ms-[76px]' : 'lg:ms-[280px]';

  const SidebarContent = React.memo(({ isMobile = false }: SidebarContentProps) => {
    const isExpanded = isMobile || !sidebarCollapsed;
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`p-4 flex items-center ${isExpanded ? 'gap-3 px-6' : 'justify-center'} transition-all duration-300`}>
          <div className="bg-gradient-brand p-2.5 rounded-2xl shadow-lg float-3d flex-shrink-0">
            <Wallet className="w-6 h-6 text-primary-foreground" />
          </div>
          {isExpanded && (
            <div className="flex flex-col -space-y-1 animate-in fade-in duration-200">
              <span className="text-2xl font-bold text-foreground font-cairo">
                {lang === 'ar' ? 'مُدَبِّر' : 'mudaber'}
              </span>
              <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
                {lang === 'ar' ? 'تطبيقك المالي' : 'Your finance app'}
              </span>
            </div>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-2 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              title={!isExpanded ? item.label : undefined}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                page === item.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              <item.icon className={`w-5 h-5 flex-shrink-0 ${page === item.id ? '' : item.color}`} />
              {isExpanded && <span className="truncate">{item.label}</span>}
            </button>
          ))}
          <hr className="border-border my-4" />
          {extraItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              title={!isExpanded ? item.label : undefined}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center px-0'} py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                page === item.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary'
              }`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {isExpanded && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-2">
          {isExpanded ? (
            <>
              <button onClick={() => { setPage('profile'); setSidebarOpen(false); }} className="glass p-3 rounded-2xl flex items-center gap-3 shadow-sm w-full hover:bg-secondary/50 transition-all cursor-pointer group">
                
                <div className="flex-1 min-w-0 text-start">
                  <p className="text-sm font-bold text-foreground truncate">{profile.account.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile.account.email}</p>
                </div>
              </button>
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-destructive bg-destructive/10 rounded-xl text-xs font-bold hover:bg-destructive/20 transition-all">
                <LogOut className="w-4 h-4" />{t.logout}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setPage('profile'); setSidebarOpen(false); }} title={t.profile} className="w-full flex justify-center p-2 rounded-xl hover:bg-secondary/50 transition-all">
               
              </button>
              <button onClick={onLogout} title={t.logout} className="w-full flex justify-center p-2 text-destructive bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  })

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar — sticky, collapses to icons-only */}
      <aside
        className={`hidden lg:flex ${sidebarWidth} flex-col border-e border-border bg-card fixed inset-y-0 start-0 z-30 shadow-lg transition-all duration-300`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay (slide-over drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[280px] bg-card border-e border-border shadow-2xl animate-in slide-in-from-start duration-300">
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
                <span className="sr-only">side bar</span>
              </button>
            </div>
            <SidebarContent isMobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${mainMargin} transition-all duration-300`}>
        {/* Top header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Hamburger — toggles drawer on mobile, hides/shows sidebar on desktop */}
            <button
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) {
                  setSidebarCollapsed(prev => !prev);
                } else {
                  setSidebarOpen(true);
                }
              }}
              aria-label={lang === 'ar' ? 'فتح القائمة' : 'Toggle navigation'}
              className="p-2 rounded-xl hover:bg-secondary transition-all"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground font-cairo">{navItems.find(i => i.id === page)?.label || ''}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationSystem lang={lang} />
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="glass p-2.5 rounded-xl hover:scale-105 transition-all border border-border shadow-sm">
              {theme === 'light' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-amber" />}
            </button>
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="glass p-2.5 rounded-xl hover:scale-105 transition-all text-muted-foreground text-xs font-black border border-border flex items-center gap-1 shadow-sm">
              <Globe className="w-4 h-4" /> {lang === 'en' ? 'AR' : 'EN'}
            </button>
            <button onClick={() => { setPage('profile'); setSidebarOpen(false); }} className="rounded-xl hover:scale-105 transition-all lg:hidden">
              <span className="sr-only">profile</span>
            </button>
          </div>
        </div>

        <div key={page} className="p-4 md:p-6 min-h-[calc(100vh-65px)] page-transition">
          {renderPage()}
        </div>

        {/* Hidden Report for PDF */}
        <div className="fixed -start-[9999px] top-0 opacity-0 pointer-events-none">
          <HiddenReport profile={profile} lang={lang} />
        </div>
      </main>
    </div>
  );
};

export default AppShell;
