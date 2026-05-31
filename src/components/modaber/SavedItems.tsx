import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { translations } from '../../translations';
import { formatPrice, fn } from '../../utils/formatNumber';
import { translateProductName, translateAdvice } from '../../utils/productTranslations';
import { savedItemsApi } from '../../services/apiClient';
import { ShoppingCart, TrendingUp, TrendingDown, Minus, Trash2, ExternalLink, Sparkles, Package } from 'lucide-react';

interface SavedPriceItem {
  item: string;
  currentPrice: number;
  predictedPrice: number;
  trend: 'up' | 'down' | 'stable';
  advice: string;
  savedAt: string;
}

interface SavedItemsProps {
  lang: Language;
}

const arToEnSearch: Record<string, string> = {
  'السكر': 'sugar',
  'الأرز': 'rice',
  'الزيت': 'cooking oil',
  'اللحوم': 'meat',
  'الخضروات': 'vegetables',
  'الألبان': 'dairy milk',
};

const getSearchTerm = (item: string): string => {
  const enName = translateProductName(item, 'en');
  return arToEnSearch[item] || arToEnSearch[enName] || enName.toLowerCase();
};

const onlineStores = [
  { name: { ar: 'أمازون مصر', en: 'Amazon Egypt' }, url: (q: string) => `https://www.amazon.eg/s?k=${encodeURIComponent(getSearchTerm(q))}&ref=nb_sb_noss`, color: 'bg-amber/10 text-amber border-amber/20' },
  { name: { ar: 'جوميا', en: 'Jumia' }, url: (q: string) => `https://www.jumia.com.eg/catalog/?q=${encodeURIComponent(getSearchTerm(q))}&page=1#catalog-listing`, color: 'bg-primary/10 text-primary border-primary/20' },
  { name: { ar: 'نون', en: 'Noon' }, url: (q: string) => `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(getSearchTerm(q))}`, color: 'bg-sky/10 text-sky border-sky/20' },
  { name: { ar: 'كارفور', en: 'Carrefour' }, url: (q: string) => `https://www.carrefouregypt.com/mafegy/en/v4/search?keyword=${encodeURIComponent(getSearchTerm(q))}&sort=relevance`, color: 'bg-rose/10 text-rose border-rose/20' },
];

const SavedItems: React.FC<SavedItemsProps> = ({ lang }) => {
  const t = translations[lang];
  const [savedItems, setSavedItems] = useState<SavedPriceItem[]>([]);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await savedItemsApi.getAll();
        if (res.ok && res.data) {
          const raw: any[] = Array.isArray(res.data)
            ? res.data
            : (res.data as any).items ?? (res.data as any).data ?? [];
          // Normalize backend field names → frontend shape
          const normalized = raw.map((r: any) => ({
            ...r,
            // backend sends productName, frontend displays item
            item:           r.item        ?? r.productName ?? r.product_name ?? r.name ?? '',
            currentPrice:   r.currentPrice  ?? r.current_price  ?? 0,
            predictedPrice: r.predictedPrice ?? r.predicted_price ?? 0,
            trend:          (r.trend ?? r.trendLabel ?? r.trend_label ?? 'stable').toLowerCase(),
            advice:         r.advice ?? r.tip ?? '',
          }));
          setSavedItems(normalized);
        } else {
          setSavedItems([]);
        }
      } catch (error) {
        console.error('Failed to fetch saved items', error);
        setSavedItems([]);
      }
    };
    fetchSaved();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const removeItem = async (idx: number) => {
    const item = savedItems[idx] as any;

    // .NET returns PascalCase — check all variations
    const itemId: number | undefined =
      item.id ?? item.Id ?? item.savedItemId ?? item.itemId ?? item.SavedItemId;

    if (itemId === undefined || itemId === null) {
      console.warn('No id found on saved item — cannot delete from server:', item);
      return;
    }

    const res = await savedItemsApi.remove(itemId);
    if (!res.ok) {
      console.error('Server delete failed:', res.error);
      return; // don't remove from UI if server failed
    }

    // Remove from UI
    setSavedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const trendColors: Record<string, string> = {
    up: 'text-destructive',
    down: 'text-primary',
    stable: 'text-amber',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl font-bold text-foreground font-cairo">{t.savedPriceItems}</h2>
        <p className="text-muted-foreground">{t.savedPriceItemsDesc}</p>
      </div>

      {savedItems.length === 0 ? (
        <div className="glass p-16 rounded-[2.5rem] text-center border border-dashed border-border animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <Package className="w-10 h-10" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">{t.noSavedItems}</p>
          <p className="text-muted-foreground text-sm mt-2">{t.noSavedItemsHint}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {savedItems.map((item, idx) => {
            const TrendIcon = getTrendIcon(item.trend);
            const displayName = translateProductName(item.item, lang);
            const displayAdvice = translateAdvice(item.advice, item.item, lang);
            return (
              <div key={idx} className="glass rounded-3xl border border-border overflow-hidden group hover:border-primary/30 transition-all hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${0.1 * idx}s`, animationFillMode: 'both' }}>
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{displayName}</h3>
                    </div>
                    <button onClick={() => removeItem(idx)} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.currentPrice}</p>
                      <p className="font-bold text-muted-foreground">{formatPrice(item.currentPrice, lang, t.currency)}</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase">{t.nextMonth}</p>
                      <p className={`text-xl font-black ${trendColors[item.trend]}`}>
                        {formatPrice(item.predictedPrice, lang, t.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <TrendIcon className={`w-4 h-4 ${trendColors[item.trend]}`} />
                    <span className="text-xs text-muted-foreground italic">"{displayAdvice}"</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{t.savedAt}: {formatDate(item.savedAt)}</p>
                </div>
                {/* Online shopping links */}
                <div className="p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t.shopOnline}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {onlineStores.map((store, sIdx) => (
                      <a key={sIdx} href={store.url(item.item)} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold hover:scale-[1.03] active:scale-[0.97] transition-all ${store.color}`}>
                        <ExternalLink className="w-3 h-3" />
                        {store.name[lang]}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedItems;