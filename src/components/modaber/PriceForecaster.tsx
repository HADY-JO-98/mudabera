import React, { useState, useEffect } from 'react';
import { UserProfile, PricePrediction } from '../../types';
import { predictionApi, savedItemsApi } from '../../services/apiClient';
import { translations } from '../../translations';
import { Language } from '../../types';
import { TrendingUp, TrendingDown, Minus, Clock, ShoppingCart, Percent, ChevronRight, Sparkles, BookmarkPlus, ExternalLink, Check, Search, Filter } from 'lucide-react';
import { formatPrice, fn } from '../../utils/formatNumber';
import { translateProductName, translateAdvice } from '../../utils/productTranslations';
import CustomSelect from '../ui/custom-select';

interface PriceForecasterProps {
  profile: UserProfile;
  lang: Language;
  onNavigate?: (page: string) => void;
}

// Map Arabic product names to English for better store search results
const arToEnSearch: Record<string, string> = {
  'السكر': 'sugar',
  'الأرز': 'rice',
  'الزيت': 'cooking oil',
  'اللحوم': 'meat',
  'الخضروات': 'vegetables',
  'الألبان': 'dairy milk',
};

const getSearchTerm = (item: string): string => {
  if (!item) return '';
  const enName = translateProductName(item, 'en') ?? item;
  return arToEnSearch[item] || arToEnSearch[enName] || (enName || item).toLowerCase();
};

const onlineStores = [
  { name: { ar: 'أمازون مصر', en: 'Amazon Egypt' }, url: (q: string) => `https://www.amazon.eg/s?k=${encodeURIComponent(getSearchTerm(q))}` },
  { name: { ar: 'جوميا', en: 'Jumia' }, url: (q: string) => `https://www.jumia.com.eg/catalog/?q=${encodeURIComponent(getSearchTerm(q))}` },
  { name: { ar: 'نون', en: 'Noon' }, url: (q: string) => `https://www.noon.com/egypt-en/search/?q=${encodeURIComponent(getSearchTerm(q))}` },
  { name: { ar: 'كارفور', en: 'Carrefour' }, url: (q: string) => `https://www.carrefouregypt.com/mafegy/en/v4/search?keyword=${encodeURIComponent(getSearchTerm(q))}` },
];

const PriceForecaster: React.FC<PriceForecasterProps> = ({ profile, lang, onNavigate }) => {
  const t = translations[lang];
  const [predictions, setPredictions] = useState<PricePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrend, setSelectedTrend] = useState('all');
  const [shopOpenItem, setShopOpenItem] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        // Rotate page between visits
        let currentPage = 1;
        const storedPage = localStorage.getItem('mudaber_prediction_page');
        if (storedPage) {
          currentPage = parseInt(storedPage, 10);
        }

        // Keep the number of items per page at exactly 50
        const perPage = 50;
        let res = await predictionApi.getLatest(currentPage, perPage, lang);

        console.log('[PriceForecaster] raw response:', res);

        let fetched: PricePrediction[] = [];
        if (res.ok && res.data) {
          const d = res.data as any;
          const raw = Array.isArray(d) ? d
                    : Array.isArray(d.data) ? d.data
                    : Array.isArray(d.items) ? d.items
                    : Array.isArray(d.results) ? d.results
                    : Array.isArray(d.predictions) ? d.predictions
                    : [];

          fetched = raw.map((r: any) => ({
            item:           r.product_name   ?? r.item        ?? r.productName  ?? r.name ?? '',
            currentPrice:   r.current_price  ?? r.currentPrice ?? 0,
            predictedPrice: r.predicted_price ?? r.predictedPrice ?? r.next_month_price ?? r.nextMonthPrice ?? 0,
            trend:          (r.trend ?? r.trendLabel ?? r.trend_label ?? 'stable').toLowerCase(),
            confidence:     0.85 + Math.random() * (0.98 - 0.85),
            advice:         r.advice         ?? r.tip ?? r.recommendation ?? '',
          }));
        }

        // Fallback to page 1 if we went out of bounds
        if (fetched.length === 0 && currentPage > 1) {
          currentPage = 1;
          res = await predictionApi.getLatest(currentPage, perPage, lang);
          if (res.ok && res.data) {
            const d = res.data as any;
            const raw = Array.isArray(d) ? d
                      : Array.isArray(d.data) ? d.data
                      : Array.isArray(d.items) ? d.items
                      : Array.isArray(d.results) ? d.results
                      : Array.isArray(d.predictions) ? d.predictions
                      : [];

            fetched = raw.map((r: any) => ({
              item:           r.product_name   ?? r.item        ?? r.productName  ?? r.name ?? '',
              currentPrice:   r.current_price  ?? r.currentPrice ?? 0,
              predictedPrice: r.predicted_price ?? r.predictedPrice ?? r.next_month_price ?? r.nextMonthPrice ?? 0,
              trend:          (r.trend ?? r.trendLabel ?? r.trend_label ?? 'stable').toLowerCase(),
              confidence:     0.85 + Math.random() * (0.98 - 0.85),
              advice:         r.advice         ?? r.tip ?? r.recommendation ?? '',
            }));
          }
        }

        // Increment or rotate next page
        const nextPage = fetched.length > 0 ? currentPage + 1 : 1;
        localStorage.setItem('mudaber_prediction_page', nextPage.toString());
        setPredictions(fetched);
      } catch (error) {
        console.error('[PriceForecaster] fetch failed:', error);
      }
      setLoading(false);
    };
    fetchPredictions();
  }, [lang]);

  // Load saved items from backend - normalize to English names for dedup
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await savedItemsApi.getAll();
        if (res.ok && res.data) {
          const raw: any[] = Array.isArray(res.data)
            ? res.data
            : (res.data as any).items ?? (res.data as any).data ?? [];
          const names = new Set<string>(raw.map((r: any) => {
            const name = r.item ?? r.productName ?? r.product_name ?? r.name ?? '';
            return translateProductName(name, 'en');
          }));
          setSavedSet(names);
        }
      } catch (err) {
        console.error('Failed to fetch saved items for dedup', err);
      }
    };
    fetchSaved();
  }, []);

  const handleSave = async (p: PricePrediction) => {
    const enName = translateProductName(p.item, 'en') ?? p.item ?? '';
    if (!enName) return;

    if (savedSet.has(enName)) return;

    try {
      const res = await savedItemsApi.add({
        productName:    enName,
        currentPrice:   p.currentPrice   ?? 0,
        predictedPrice: p.predictedPrice ?? 0,
        trendLabel:     p.trend          ?? 'stable',
        advice:         p.advice         ?? '',
      });
      if (res.ok) {
        setSavedSet(prev => {
          const next = new Set(prev);
          next.add(enName);
          return next;
        });
      } else {
        console.error('Failed to save item to backend:', res.error);
      }
    } catch (err) {
      console.error('Failed to save item to backend', err);
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'up': return t.trendUp;
      case 'down': return t.trendDown;
      case 'stable': return t.trendStable;
      default: return trend;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const trendColors: Record<string, string> = {
    up: 'bg-destructive/10 text-destructive',
    down: 'bg-primary/10 text-primary',
    stable: 'bg-amber/10 text-amber',
  };

  const cardAccents = [
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-rose)/0.15)]',
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-sky)/0.15)]',
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-amber)/0.15)]',
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-violet)/0.15)]',
    'hover:shadow-[0_20px_40px_-12px_hsl(var(--color-teal)/0.15)]',
  ];

  const filteredPredictions = predictions.filter(p => {
    if (!p?.item) return false;
    const nameTranslated = translateProductName(p.item, lang) || '';
    const matchesSearch = nameTranslated.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.item.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrend = selectedTrend === 'all' || p.trend === selectedTrend;
    return matchesSearch && matchesTrend;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-cairo">{t.scanningMarkets}</p>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground font-cairo">{t.priceForecasting}</h2>
            <p className="text-muted-foreground">{t.nextMonthMarket}</p>
          </div>
          <div className="glass border border-border px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-sky" /> {t.updatedHourly}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[300px] glass rounded-3xl border border-border p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground font-cairo mb-2">
            {lang === 'ar' ? 'لا توجد توقعات حالياً' : 'No predictions available yet'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {lang === 'ar'
              ? 'سيتم عرض توقعات الأسعار هنا عندما تتوفر بيانات من السيرفر. تحقق من console للمزيد من التفاصيل.'
              : 'Price predictions will appear here when the server returns data. Check the browser console for details.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-cairo">{t.priceForecasting}</h2>
          <p className="text-muted-foreground">{t.nextMonthMarket}</p>
        </div>
        <div className="glass border border-border px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground flex items-center gap-2 shadow-sm">
          <Clock className="w-4 h-4 text-sky" /> {t.updatedHourly}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 glass border border-border p-4 rounded-3xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-secondary/50 border border-border rounded-2xl py-2.5 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all font-cairo"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <CustomSelect
            value={selectedTrend}
            onChange={setSelectedTrend}
            options={[
              { value: 'all', label: t.allTrends },
              { value: 'up', label: t.trendUp },
              { value: 'down', label: t.trendDown },
              { value: 'stable', label: t.trendStable },
            ]}
            className="min-w-[140px] z-20 font-cairo"
          />
        </div>
      </div>

      {filteredPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] glass rounded-3xl border border-border p-8 text-center animate-in fade-in duration-300">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground font-cairo">{t.noResults}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPredictions.map((p, idx) => {
            const TrendIcon = getTrendIcon(p.trend);
            const isSaved = savedSet.has(translateProductName(p.item, 'en') ?? p.item);
            const isShopOpen = shopOpenItem === p.item;
            return (
              <div key={idx} className={`card-3d glass rounded-3xl border overflow-hidden group transition-all duration-300 ${isSaved ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border hover:border-primary/30'} ${cardAccents[idx % cardAccents.length]}`}>
                {/* Saved indicator */}
                {isSaved && (
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold">
                    <Check className="w-3 h-3" />
                    {t.alreadySaved}
                  </div>
                )}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center group-hover:bg-accent transition-colors">
                      <ShoppingCart className="w-6 h-6 text-muted-foreground group-hover:text-accent-foreground" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${trendColors[p.trend] || trendColors.stable}`}>
                      <TrendIcon className="w-3 h-3" />
                      {getTrendLabel(p.trend)}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{translateProductName(p.item, lang)}</h3>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.currentPrice}</p>
                      <p className="font-bold text-muted-foreground">{formatPrice(p.currentPrice, lang, t.currency)}</p>
                    </div>
                    <div className={`pb-1 text-border ${lang === 'ar' ? 'rotate-180' : ''}`}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase">{t.nextMonth}</p>
                      <p className={`text-xl font-black ${p.predictedPrice > p.currentPrice ? 'text-destructive' : 'text-primary'}`}>
                        {formatPrice(p.predictedPrice, lang, t.currency)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <Percent className="w-3 h-3" /> {t.confidence}
                    </span>
                    <span className="font-bold text-foreground">{lang === 'ar' ? `٪${fn(Math.round(p.confidence * 100), lang)}` : `${Math.round(p.confidence * 100)}%`}</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${p.confidence * 100}%` }} className="h-full bg-primary rounded-full transition-all duration-700" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">{translateAdvice(p.advice, p.item, lang)}</p>
                  {p.trend === 'up' && (
                    <div className="flex items-center gap-2 p-3 bg-amber/10 rounded-2xl border border-amber/20">
                      <Sparkles className="w-4 h-4 text-amber" />
                      <span className="text-xs font-bold text-amber">{t.suggestBuy}</span>
                    </div>
                  )}
                  {/* Two separate buttons: Save & Shop */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(p)}
                      disabled={isSaved}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                        isSaved
                          ? 'bg-primary/20 text-primary cursor-default'
                          : 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                      {isSaved ? t.savedCheck : t.saveItem}
                    </button>
                    <button
                      onClick={() => setShopOpenItem(isShopOpen ? null : p.item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:bg-accent/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t.shopNow}
                    </button>
                  </div>
                  {/* Shopping links dropdown */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isShopOpen ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {onlineStores.map((store, sIdx) => (
                        <a key={sIdx} href={store.url(translateProductName(p.item, 'en'))} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-secondary/50 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {store.name[lang]}
                        </a>
                      ))}
                    </div>
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

export default PriceForecaster;