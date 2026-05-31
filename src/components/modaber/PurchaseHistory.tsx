import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { translations } from '../../translations';
import { formatPrice, fn } from '../../utils/formatNumber';
import { translateProductName } from '../../utils/productTranslations';
import { History, ShoppingBag, TrendingDown, Calendar, Package, Trash2 } from 'lucide-react';
import { expenseApi } from '../../services/apiClient';

interface SavedPurchase {
  items: { id?: string; name: string; cost: number }[];
  totalCost: number;
  date: string;
}

interface PurchaseHistoryProps {
  lang: Language;
}

const PurchaseHistory: React.FC<PurchaseHistoryProps> = ({ lang }) => {
  const t = translations[lang];
  const [purchases, setPurchases] = useState<SavedPurchase[]>([]);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await expenseApi.getAll(1, 100);
        if (res.ok && res.data) {
          const rawItems = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
          
          const groups: Record<string, SavedPurchase> = {};
          
          rawItems.forEach((exp: any) => {
            if (exp.category === 'shopping' || exp.category === 'food') {
              const dateStr = exp.date;
              // Group by date/time (ignoring seconds and milliseconds to group same checkout)
              const groupKey = dateStr.slice(0, 16); 
              
              if (!groups[groupKey]) {
                groups[groupKey] = {
                  items: [],
                  totalCost: 0,
                  date: dateStr
                };
              }
              groups[groupKey].items.push({
                id: exp.id?.toString(),
                name: exp.description,
                cost: exp.amount
              });
              groups[groupKey].totalCost += exp.amount;
            }
          });
          
          const sortedPurchases = Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPurchases(sortedPurchases);
        }
      } catch (err) {
        console.error('Failed to fetch purchase history', err);
      }
    };
    fetchPurchases();
  }, []);

  const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const totalItems = purchases.reduce((sum, p) => sum + p.items.length, 0);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const clearHistory = async () => {
    try {
      const deletePromises: Promise<any>[] = [];
      purchases.forEach(p => {
        p.items.forEach(item => {
          if (item.id) {
            deletePromises.push(expenseApi.delete(parseInt(item.id, 10)));
          }
        });
      });
      await Promise.all(deletePromises);
      setPurchases([]);
    } catch (err) {
      console.error('Failed to clear purchase history from backend', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-cairo">{t.purchaseHistoryTitle}</h2>
          <p className="text-muted-foreground">{t.purchaseHistoryDesc}</p>
        </div>
        {purchases.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-xl text-xs font-bold hover:bg-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Trash2 className="w-4 h-4" /> {t.clearHistory}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {purchases.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: ShoppingBag, value: fn(purchases.length, lang), label: t.totalTrips, color: 'text-primary' },
            { icon: Package, value: fn(totalItems, lang), label: t.totalItemsBought, color: 'text-violet' },
            { icon: TrendingDown, value: formatPrice(totalSpent, lang, t.currency), label: t.totalSpent, color: 'text-amber' },
          ].map((card, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-border text-center animate-in fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${0.1 * i}s`, animationFillMode: 'both' }}>
              <card.icon className={`w-6 h-6 ${card.color} mx-auto mb-2`} />
              <p className={`text-2xl font-black ${i === 2 ? 'text-primary' : 'text-foreground'}`}>{card.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="glass p-16 rounded-[2.5rem] text-center border border-dashed border-border animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <History className="w-10 h-10" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">{t.noPurchaseHistory}</p>
          <p className="text-muted-foreground text-sm mt-2">{t.noPurchaseHistoryHint}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase, pIdx) => (
            <div key={pIdx} className="glass rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${0.1 * pIdx}s`, animationFillMode: 'both' }}>
              <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{formatDate(purchase.date)}</p>
                    <p className="text-xs text-muted-foreground">{fn(purchase.items.length, lang)} {t.items}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xl font-black text-primary">{formatPrice(purchase.totalCost, lang, t.currency)}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {purchase.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border animate-in fade-in duration-300"
                      style={{ animationDelay: `${0.05 * iIdx}s`, animationFillMode: 'both' }}>
                      <span className="text-sm font-medium text-foreground">{translateProductName(item.name, lang)}</span>
                      <span className="text-sm font-bold text-primary ms-2">{formatPrice(item.cost, lang, t.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
