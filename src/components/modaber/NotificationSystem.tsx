import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, X, AlertTriangle, TrendingUp, TrendingDown, Wallet, ShoppingCart, Target, CheckCircle2 } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../translations';
import { useAlerts, useMarkAlertRead, useDeleteAlert } from '../../hooks/useAlerts';

export interface AppNotification {
  id: string;
  type: 'budget' | 'price' | 'investment' | 'saving' | 'shopping' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationSystemProps {
  lang: Language;
}

const getIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'budget': return <AlertTriangle className="w-5 h-5 text-amber" />;
    case 'price': return <TrendingDown className="w-5 h-5 text-sky" />;
    case 'investment': return <TrendingUp className="w-5 h-5 text-primary" />;
    case 'saving': return <Wallet className="w-5 h-5 text-teal" />;
    case 'shopping': return <ShoppingCart className="w-5 h-5 text-rose" />;
    case 'achievement': return <Target className="w-5 h-5 text-violet" />;
  }
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({ lang }) => {
  const t = translations[lang];
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [], refetch } = useAlerts();
  const markRead = useMarkAlertRead();
  const deleteAlert = useDeleteAlert();
  const [showAll, setShowAll] = useState(false);
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);




  const unreadCount = notifications.filter(n => !n.read).length;
  const visibleNotifications = notifications;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    setShowAll(true);

    // Batch update local React Query cache optimistically to 'read'
    const ALERTS_KEY = ['alerts'] as const;
    const previousAlerts = qc.getQueryData<AppNotification[]>(ALERTS_KEY);
    if (previousAlerts) {
      qc.setQueryData<AppNotification[]>(
        ALERTS_KEY,
        previousAlerts.map(alert => ({ ...alert, read: true }))
      );
    }

    // Call individual API endpoints in parallel
    try {
      await Promise.all(
        unread.map(n => markRead.mutateAsync(n.id as unknown as number))
      );
    } catch (e) {
      console.error("Failed to mark some alerts as read", e);
    }

    refetch();
  };

  const dismissNotification = async (id: string) => {
    await deleteAlert.mutateAsync(id as unknown as number).catch(console.error);
  };

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return lang === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
    if (hours > 0) return lang === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return lang === 'ar' ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setShowAll(false); }}
        className="relative glass p-2.5 rounded-xl hover:scale-105 transition-all border border-border shadow-sm"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/40 sm:hidden" onClick={() => setIsOpen(false)} />
          <div
            className="fixed inset-x-4 top-24 sm:absolute sm:inset-auto sm:end-0 sm:top-12 sm:w-[380px] bg-card rounded-2xl border border-border shadow-2xl z-50 overflow-hidden"
            style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <h3 className="font-bold text-foreground text-sm">
                {lang === 'ar' ? 'الإشعارات' : 'Notifications'} ({notifications.length})
              </h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:underline">
                    {lang === 'ar' ? 'قراءة الكل' : 'Mark all read'}
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-secondary transition-all">
                  <X className="w-4 h-4 text-muted-foreground" />
                  <span className="sr-only">opened</span>
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[60vh] sm:max-h-[340px] overflow-y-auto bg-card overscroll-none touch-pan-y" style={{ scrollbarWidth: 'thin' }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                  </p>
                </div>
              ) : (
                visibleNotifications.map((notif, idx) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) {
                        markRead.mutate(notif.id as unknown as number);
                      }
                    }}
                    className={`p-4 border-b border-border/50 flex gap-3 hover:bg-secondary/50 transition-all group cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                    style={{ animation: `slideUp 0.3s ease-out ${0.05 * idx}s both` }}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.timestamp)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-secondary"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                      <span className="sr-only">propagate</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSystem;
