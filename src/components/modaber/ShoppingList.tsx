import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, ShoppingItem, ShoppingCategory } from '../../types';
import { translations } from '../../translations';
import { shoppingApi, expenseApi, budgetApi } from '../../services/apiClient';
import { Language } from '../../types';
import { CheckCircle2, Circle, AlertCircle, Loader2, Sparkles, PartyPopper, ShoppingCart, Tag, ShieldCheck, Download, MessageSquare, Save, Apple, Carrot, Beef, Fish, Milk, Wheat, Coffee, Cookie, SprayCan, Package, ChevronDown, RotateCw } from 'lucide-react';
import { formatPrice, formatNumber, fn } from '../../utils/formatNumber';
import { translateProductName, translateQuantity } from '../../utils/productTranslations';
import { generateFullReport } from '../../utils/pdfGenerator';

interface SavedPurchase {
  items: { name: string; cost: number }[];
  totalCost: number;
  date: string;
}

interface ShoppingListProps {
  profile: UserProfile;
  lang: Language;
  onNavigate?: (page: string) => void;
}

const getStorageKey = (email: string) => `modaber_shopping_items_${email}`;
const getNotesKey = (email: string) => `modaber_shopping_notes_${email}`;

// Category config
const CATEGORIES: { id: ShoppingCategory; labelAr: string; labelEn: string; icon: React.ElementType; color: string }[] = [
  { id: 'fruits', labelAr: 'فواكه', labelEn: 'Fruits', icon: Apple, color: 'text-rose' },
  { id: 'vegetables', labelAr: 'خضروات', labelEn: 'Vegetables', icon: Carrot, color: 'text-amber' },
  { id: 'meats', labelAr: 'لحوم', labelEn: 'Meats', icon: Beef, color: 'text-destructive' },
  { id: 'fish', labelAr: 'أسماك', labelEn: 'Fish & Seafood', icon: Fish, color: 'text-sky' },
  { id: 'dairy', labelAr: 'ألبان', labelEn: 'Dairy', icon: Milk, color: 'text-blue-400' },
  { id: 'grains', labelAr: 'حبوب ومعجنات', labelEn: 'Grains & Bakery', icon: Wheat, color: 'text-amber' },
  { id: 'beverages', labelAr: 'مشروبات', labelEn: 'Beverages', icon: Coffee, color: 'text-teal' },
  { id: 'snacks', labelAr: 'سناكس وحلويات', labelEn: 'Snacks & Sweets', icon: Cookie, color: 'text-violet' },
  { id: 'cleaning', labelAr: 'تنظيف ومنظفات', labelEn: 'Cleaning', icon: SprayCan, color: 'text-sky' },
  { id: 'other', labelAr: 'أخرى', labelEn: 'Other', icon: Package, color: 'text-muted-foreground' },
];

const getCategoryLabel = (catId: ShoppingCategory, lang: Language) => {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? (lang === 'ar' ? cat.labelAr : cat.labelEn) : (lang === 'ar' ? 'أخرى' : 'Other');
};

// Auto-detect category from product name
const detectCategory = (name: string): ShoppingCategory => {
  const n = name.toLowerCase();
  const fruitWords = ['تفاح', 'موز', 'برتقال', 'عنب', 'فراولة', 'مانجو', 'بطيخ', 'كمثرى', 'خوخ', 'مشمش', 'تين', 'رمان', 'ليمون', 'جوافة', 'apple', 'banana', 'orange', 'grape', 'strawberry', 'mango', 'watermelon', 'fruit', 'فاكهة', 'فواكه'];
  const vegWords = ['طماطم', 'بطاطس', 'بصل', 'ثوم', 'خيار', 'فلفل', 'جزر', 'كوسة', 'باذنجان', 'بامية', 'ملوخية', 'سبانخ', 'خس', 'جرجير', 'بقدونس', 'كرنب', 'قرنبيط', 'بروكلي', 'tomato', 'potato', 'onion', 'garlic', 'cucumber', 'pepper', 'carrot', 'vegetable', 'خضار', 'خضروات'];
  const meatWords = ['لحم', 'دجاج', 'فراخ', 'لحمة', 'كبدة', 'كفتة', 'سجق', 'بانيه', 'ستيك', 'meat', 'chicken', 'beef', 'lamb', 'poultry'];
  const fishWords = ['سمك', 'جمبري', 'كابوريا', 'تونة', 'سردين', 'بلطي', 'fish', 'shrimp', 'tuna', 'salmon', 'seafood'];
  const dairyWords = ['لبن', 'حليب', 'جبنة', 'زبادي', 'قشطة', 'زبدة', 'بيض', 'milk', 'cheese', 'yogurt', 'butter', 'egg', 'cream', 'dairy'];
  const grainWords = ['أرز', 'مكرونة', 'خبز', 'عيش', 'دقيق', 'فول', 'عدس', 'حمص', 'شعرية', 'rice', 'pasta', 'bread', 'flour', 'beans', 'lentils', 'grain', 'wheat'];
  const bevWords = ['عصير', 'شاي', 'قهوة', 'مياه', 'ماء', 'كولا', 'بيبسي', 'نسكافيه', 'juice', 'tea', 'coffee', 'water', 'soda', 'drink', 'beverage'];
  const snackWords = ['شيبسي', 'شوكولاتة', 'بسكويت', 'حلاوة', 'كيك', 'آيس كريم', 'chips', 'chocolate', 'biscuit', 'cake', 'candy', 'snack', 'sweet'];
  const cleanWords = ['صابون', 'منظف', 'كلور', 'معطر', 'مناديل', 'شامبو', 'معجون', 'فرشة', 'soap', 'detergent', 'cleaner', 'shampoo', 'tissue', 'toothpaste'];

  if (fruitWords.some(w => n.includes(w))) return 'fruits';
  if (vegWords.some(w => n.includes(w))) return 'vegetables';
  if (meatWords.some(w => n.includes(w))) return 'meats';
  if (fishWords.some(w => n.includes(w))) return 'fish';
  if (dairyWords.some(w => n.includes(w))) return 'dairy';
  if (grainWords.some(w => n.includes(w))) return 'grains';
  if (bevWords.some(w => n.includes(w))) return 'beverages';
  if (snackWords.some(w => n.includes(w))) return 'snacks';
  if (cleanWords.some(w => n.includes(w))) return 'cleaning';
  return 'other';
};

const mapApiItem = (item: any, lang: Language): ShoppingItem => {
  let cat: ShoppingCategory = 'other';
  const apiCat = (item.category_en || item.category || '').toLowerCase();
  if (apiCat.includes('beverage')) cat = 'beverages';
  else if (apiCat.includes('dairy')) cat = 'dairy';
  else if (apiCat.includes('grain') || apiCat.includes('bakery')) cat = 'grains';
  else if (apiCat.includes('protein') || apiCat.includes('meat')) cat = 'meats';
  else if (apiCat.includes('fish') || apiCat.includes('seafood')) cat = 'fish';
  else if (apiCat.includes('snack') || apiCat.includes('sweet')) cat = 'snacks';
  else if (apiCat.includes('clean') || apiCat.includes('personal')) cat = 'cleaning';
  else if (apiCat.includes('fruit')) cat = 'fruits';
  else if (apiCat.includes('vegetable')) cat = 'vegetables';
  else cat = detectCategory(item.product_name || item.name || '');

  const displayName = lang === 'ar'
    ? (item.product_name_ar || item.product_name || item.name || '')
    : (item.product_name_en || item.product_name || item.name || '');

  return {
    name: displayName,
    quantity: String(item.quantity || '1'),
    estimatedCost: Number(item.total_price || item.estimatedCost || 0),
    isPriority: !!item.isPriority || !!item.is_priority || item.slot === 'mandatory' || item.slot_en === 'mandatory',
    category: cat,
    product_name_ar: item.product_name_ar || item.product_name || item.name || '',
    product_name_en: item.product_name_en || item.product_name || item.name || '',
    category_ar: item.category_ar || item.category || '',
    category_en: item.category_en || item.category || '',
    slot: item.slot,
    slot_ar: item.slot_ar,
    slot_en: item.slot_en,
    source: item.source,
    source_ar: item.source_ar,
    source_en: item.source_en,
    unit_price: item.unit_price,
    discount_pct: item.discount_pct,
    isCompleted: item.isCompleted || item.is_completed
  };
};

const extractApiItems = (d: any, lang: Language): ShoppingItem[] => {
  if (!d) return [];
  let raw: any[] = [];
  if (Array.isArray(d)) {
    raw = d;
  } else if (Array.isArray(d.shopping_list)) {
    raw = d.shopping_list;
  } else if (Array.isArray(d.items)) {
    raw = d.items;
  } else if (Array.isArray(d.data)) {
    raw = d.data;
  }
  return raw.map(item => mapApiItem(item, lang));
};

const ShoppingList: React.FC<ShoppingListProps> = ({ profile, lang, onNavigate }) => {
  const t = translations[lang];
  const userEmail = profile.account.email;
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [prevLang, setPrevLang] = useState(lang);
  const [notesFeedback, setNotesFeedback] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const [foodBudget, setFoodBudget] = useState(profile.monthlySalary * 0.2);
  const [shoppingSpent, setShoppingSpent] = useState(0);

  const toggleCategory = (catId: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  useEffect(() => {
    const fetchBudgetAndExpenses = async () => {
      // 1. Fetch budget plan
      try {
        const res = await budgetApi.getPlan();
        if (res.ok && res.data) {
          const allocations = (res.data as any).allocations || [];
          const foodCat = allocations.find((b: any) => b.category === 'food' || b.category === 'الطعام والبقالة' || b.category === 'Food & Groceries');
          if (foodCat) {
            setFoodBudget(foodCat.amount);
          }
        }
      } catch (err) {
        console.error('Failed to fetch budget plan in ShoppingList', err);
      }

      // 2. Fetch expenses to compute spending
      try {
        const res = await expenseApi.getAll(1, 500);
        if (res.ok && res.data) {
          const rawItems = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
          const today = new Date();
          const thisMonthExpenses = rawItems.filter((e: any) => {
            const d = new Date(e.date);
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && 
              (e.category === 'shopping' || e.category === 'food');
          });
          const totalSpent = thisMonthExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
          setShoppingSpent(totalSpent);
        }
      } catch (err) {
        console.error('Failed to fetch expenses in ShoppingList', err);
      }
    };

    fetchBudgetAndExpenses();
  }, [profile]);

  useEffect(() => {
    const fetchList = async () => {
      const res = await shoppingApi.getSmartList();
      const d = res.data as any;
      if (res.ok && d) {
        const parsed = extractApiItems(d, lang);
        if (parsed.length > 0) {
          setItems(parsed);
          setLoading(false);
          return;
        }
      }

      // If empty, generate from backend
      try {
        const genRes = await shoppingApi.generate();
        const gd = genRes.data as any;
        if (genRes.ok && gd) {
          const parsed = extractApiItems(gd, lang);
          setItems(parsed);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Failed to generate shopping list', error);
      }
      setLoading(false);
    };
    fetchList();
  }, [profile]);

  // Translate product names when language changes
  useEffect(() => {
    if (lang === prevLang) return;
    setItems(prev => {
      if (prev.length === 0) return prev;
      const updated = prev.map(item => ({
        ...item,
        name: lang === 'ar'
          ? (item.product_name_ar || translateProductName(item.name, 'ar'))
          : (item.product_name_en || translateProductName(item.name, 'en')),
        quantity: translateQuantity(item.quantity, lang),
        category: item.category || detectCategory(item.name),
      }));
      return updated;
    });
    setPrevLang(lang);
  }, [lang, prevLang]);

  const saveItems = useCallback((newItems: ShoppingItem[]) => {
    setItems(newItems);
  }, []);

  const toggleComplete = (idx: number) => {
    if (isCheckingOut) return;
    const next = new Set(completed);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCompleted(next);
  };

  const handleGenerateFromNotes = async () => {
    if (!aiNotes.trim()) return;
    setIsRegenerating(true);
    setNotesFeedback('');

    try {
      const res = await shoppingApi.modify({ instruction: aiNotes });
      if (res.ok && res.data) {
        const parsed = extractApiItems(res.data, lang);
        setItems(parsed);
        setNotesFeedback(lang === 'ar' ? '✅ تم تحديث القائمة بنجاح' : '✅ List updated successfully');
      } else {
        setNotesFeedback(lang === 'ar' ? '⚠️ حدث خطأ أثناء التحديث' : '⚠️ Failed to update list');
      }
    } catch (error) {
      console.error(error);
      setNotesFeedback(lang === 'ar' ? '⚠️ حدث خطأ في الاتصال بالسيرفر' : '⚠️ Connection error');
    }

    setAiNotes('');
    setIsRegenerating(false);
    setTimeout(() => setNotesFeedback(''), 4000);
  };

  const handleRegenerateList = async () => {
    setIsGeneratingList(true);
    try {
      const genRes = await shoppingApi.generate();
      const gd = genRes.data as any;
      if (genRes.ok && gd) {
        const parsed = extractApiItems(gd, lang);
        setItems(parsed);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl';
        toast.style.animation = 'slideUp 0.3s ease-out';
        toast.textContent = lang === 'ar' ? '✅ تم إعادة توليد القائمة بنجاح' : '✅ List regenerated successfully';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
      }
    } catch (error) {
      console.error('Failed to regenerate shopping list', error);
    }
    setIsGeneratingList(false);
  };

  const completedCost = items.reduce((sum, item, idx) => completed.has(idx) ? sum + item.estimatedCost : sum, 0);

  const getFoodBudget = (): number => {
    return foodBudget;
  };

  const handleCheckout = async () => {
    if (completed.size === 0) return;
    setIsCheckingOut(true);
    
    const purchasedItems = items.filter((_, idx) => completed.has(idx)).map(i => ({ name: i.name, cost: i.estimatedCost }));
    
    // Log to backend
    await shoppingApi.logPurchases({ items: purchasedItems });

    // Update local spending state dynamically so it updates on checkout
    setShoppingSpent(prev => prev + completedCost);
    
    setIsCheckingOut(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      const newItems = items.filter((_, idx) => !completed.has(idx));
      saveItems(newItems);
      setCompleted(new Set());
    }, 3000);
  };



  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateFullReport('shopping-list-report', `Shopping_List_${Date.now()}`);
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Group items by category
  const groupByCategory = (list: ShoppingItem[]) => {
    const groups: Record<string, ShoppingItem[]> = {};
    list.forEach(item => {
      const cat = item.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // Sort by CATEGORIES order
    const sorted: Record<string, ShoppingItem[]> = {};
    CATEGORIES.forEach(c => {
      if (groups[c.id]) sorted[c.id] = groups[c.id];
    });
    return sorted;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-muted-foreground font-medium font-cairo text-lg">{t.loadingShopping}</p>
      </div>
    );
  }

  const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const monthlyBudget = getFoodBudget();
  const remainingBudget = monthlyBudget - shoppingSpent;
  const isOverBudget = totalCost > remainingBudget;
  const completionPercent = items.length > 0 ? Math.round((completed.size / items.length) * 100) : 0;

  const grouped = groupByCategory(items);

  const renderItem = (item: ShoppingItem, displayIdx: number) => {
    const globalIdx = items.indexOf(item);
    return (
      <div key={globalIdx} onClick={() => toggleComplete(globalIdx)}
        className={`glass p-5 rounded-2xl border cursor-pointer flex items-center gap-4 group hover:scale-[1.01] active:scale-[0.99] ${
          completed.has(globalIdx) ? 'border-primary/30 bg-accent/10 shadow-sm' : 'border-border hover:border-primary/20 hover:shadow-lg'
        }`}
        style={{ animation: `slideUp 0.4s ease-out ${0.06 * displayIdx}s both`, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <button className="flex-shrink-0 no-print">
          {completed.has(globalIdx) ? (
            <CheckCircle2 className="w-7 h-7 text-primary" style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
          ) : (
            <Circle className="w-7 h-7 text-border group-hover:text-muted-foreground transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-lg transition-all duration-300 ${completed.has(globalIdx) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{translateProductName(item.name, lang)}</span>
            {item.isPriority && (
              <span className="px-2.5 py-0.5 bg-destructive/10 text-destructive text-[10px] font-black rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" /> {t.highPriority}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{translateQuantity(item.quantity, lang)}</p>
        </div>
        <div className="text-end">
          <p className={`font-black text-lg tabular-nums transition-all duration-300 ${completed.has(globalIdx) ? 'text-muted-foreground' : 'text-foreground'}`}>
            {formatPrice(item.estimatedCost, lang, t.currency)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
    {/* Hidden report template for PDF */}
    <div className="fixed" style={{ insetInlineStart: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
      <div
        id="shopping-list-report"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        lang={lang === 'ar' ? 'ar' : 'en'}
        style={{
          width: 900,
          padding: 48,
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: lang === 'ar'
            ? "'Cairo', 'Tajawal', 'Segoe UI', sans-serif"
            : "'Poppins', 'Segoe UI', sans-serif",
          direction: lang === 'ar' ? 'rtl' : 'ltr',
          textAlign: lang === 'ar' ? 'right' : 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, background: '#059669', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 24 }}>🛒</span>
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#059669', margin: 0 }}>mudaber</h1>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{lang === 'ar' ? 'قائمة التسوق الذكية' : 'Smart Shopping List'}</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ borderTop: '2px solid #e2e8f0', marginBottom: 24 }} />
        {Object.entries(grouped).map(([catId, catItems]) => {
          const catConfig = CATEGORIES.find(c => c.id === catId);
          if (!catConfig) return null;
          const catLabel = lang === 'ar' ? catConfig.labelAr : catConfig.labelEn;
          const catTotal = catItems.reduce((s, i) => s + i.estimatedCost, 0);
          return (
            <div key={catId} style={{ marginBottom: 24, border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>{catLabel}</h3>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, marginTop: 2 }}>{fn(catItems.length, lang)} {lang === 'ar' ? 'صنف' : 'items'}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#059669', whiteSpace: 'nowrap' }}>{formatPrice(catTotal, lang, t.currency)}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '45%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '25%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'start', color: '#64748b', fontSize: 11, fontWeight: 700 }}>{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'start', color: '#64748b', fontSize: 11, fontWeight: 700 }}>{lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
                    <th style={{ padding: '10px 14px', textAlign: 'end', color: '#64748b', fontSize: 11, fontWeight: 700 }}>{lang === 'ar' ? 'التكلفة' : 'Cost'}</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{translateProductName(item.name, lang)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{translateQuantity(item.quantity, lang)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'end', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>{formatPrice(item.estimatedCost, lang, t.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        <div style={{ background: '#059669', color: '#fff', padding: 20, borderRadius: 16, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 900 }}>{lang === 'ar' ? 'الإجمالي' : 'Total'}: {formatPrice(totalCost, lang, t.currency)}</span>
          <span style={{ fontSize: 14 }}>{lang === 'ar' ? 'عدد الأصناف' : 'Items'}: {fn(items.length, lang)}</span>
        </div>
      </div>
    </div>
    <div id="print-area" className="space-y-8 relative">
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/60 p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-card p-12 rounded-[3rem] shadow-2xl text-center border border-border space-y-4 max-w-sm mx-4" style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto text-accent-foreground" style={{ animation: 'bounceIn 0.6s ease-out' }}>
              <PartyPopper className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-foreground font-cairo">{t.loggedSuccess}</h3>
            <p className="text-muted-foreground font-medium">{t.expenseAdded} {formatPrice(completedCost, lang, t.currency)} {t.toMonthlyLog}</p>
            <button onClick={() => setShowSuccess(false)}
              className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass p-6 md:p-8 rounded-[2rem] border border-border shadow-lg no-print" style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-brand rounded-2xl shadow-lg" style={{ animation: 'float3d 6s ease-in-out infinite' }}>
              <ShoppingCart className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground font-cairo">{t.shoppingAssistant}</h2>
              <p className="text-muted-foreground text-sm">{t.optimizedFor.replace('{count}', fn(profile.familyMembers, lang))}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} disabled={isGeneratingPdf} className="p-3 glass border border-border rounded-xl text-muted-foreground hover:bg-secondary hover:scale-105 active:scale-95 transition-all disabled:opacity-50" title={t.downloadPdf}>
              {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            <button
              onClick={handleRegenerateList}
              disabled={isGeneratingList}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              {isGeneratingList ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
              {t.regenerateList}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t.items, value: fn(items.length, lang), color: 'text-primary' },
            { label: t.completed, value: fn(completed.size, lang), color: 'text-accent-foreground' },
            { label: lang === 'ar' ? 'إجمالي المحدد' : 'Checked Total', value: formatPrice(completedCost, lang, t.currency), color: 'text-primary' },
            { label: t.totalEst, value: formatPrice(totalCost, lang, t.currency), color: isOverBudget ? 'text-destructive' : 'text-foreground' },
          ].map((stat, i) => (
            <div key={i} className="p-3 bg-secondary rounded-xl border border-border text-center flex flex-col items-center justify-center gap-1" style={{ animation: `slideUp 0.4s ease-out ${0.1 * i}s both` }}>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-tight">{stat.label}</p>
              <p className={`text-lg font-black ${stat.color} leading-tight`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-brand rounded-full transition-all duration-700 ease-out" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-bold">{fn(completionPercent, lang)}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Notes input */}
          <div className="no-print" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
            <div className="glass p-5 rounded-[2rem] border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MessageSquare className="w-4 h-4 text-primary" />
                {lang === 'ar' ? 'اكتب ملاحظتك وسيتم إضافتها تلقائياً' : 'Write a note and items will be added automatically'}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiNotes}
                  onChange={e => setAiNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: زود فراولة ١ كيلو، شيل المشروبات...' : 'e.g. Add 1kg strawberries, remove beverages...'}
                  className="flex-1 px-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleGenerateFromNotes()}
                />
                <button
                  onClick={handleGenerateFromNotes}
                  disabled={isRegenerating || !aiNotes.trim()}
                  className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                >
                  {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {lang === 'ar' ? 'أضف' : 'Add'}
                </button>
              </div>
              {notesFeedback && (
                <div className="px-4 py-2 bg-secondary rounded-xl text-sm font-bold text-foreground animate-in fade-in">
                  {notesFeedback}
                </div>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-secondary p-16 rounded-[2.5rem] text-center border border-dashed border-border no-print" style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <p className="text-muted-foreground font-medium text-lg">{t.allItemsLogged}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([catId, catItems]) => {
                const catConfig = CATEGORIES.find(c => c.id === catId);
                if (!catConfig) return null;
                const CatIcon = catConfig.icon;
                const catLabel = lang === 'ar' ? catConfig.labelAr : catConfig.labelEn;
                const catTotal = catItems.reduce((s, i) => s + i.estimatedCost, 0);

                return (
                  <div key={catId} className="glass hover-lift rounded-2xl border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCategory(catId)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors"
                      aria-expanded={!collapsedCats.has(catId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-secondary ${catConfig.color}`}>
                          <CatIcon className="w-5 h-5" />
                        </div>
                        <div className="text-start">
                          <h3 className="font-black text-sm text-foreground">{catLabel}</h3>
                          <p className="text-[11px] text-muted-foreground font-medium">
                            {fn(catItems.length, lang)} {lang === 'ar' ? 'صنف' : 'items'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black tabular-nums text-foreground">
                          {formatPrice(catTotal, lang, t.currency)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                            collapsedCats.has(catId) ? '' : 'rotate-180'
                          }`}
                        />
                      </div>
                    </button>

                    {!collapsedCats.has(catId) && (
                      <div className="border-t border-border overflow-x-auto" style={{ animation: 'fadeIn 0.25s ease-out' }}>
                        <table className="w-full text-sm table-fixed min-w-[480px]">
                          <colgroup>
                            <col style={{ width: '48px' }} />
                            <col style={{ width: '40%' }} />
                            <col style={{ width: '30%' }} />
                            <col style={{ width: '30%' }} />
                          </colgroup>
                          <thead>
                            <tr className="bg-secondary/40 text-muted-foreground text-[10px] uppercase tracking-wider">
                              <th className="px-4 py-2 text-start font-bold"></th>
                              <th className="px-4 py-2 text-start font-bold whitespace-nowrap">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                              <th className="px-4 py-2 text-start font-bold whitespace-nowrap">{lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
                              <th className="px-4 py-2 text-end font-bold whitespace-nowrap">{lang === 'ar' ? 'التكلفة' : 'Cost'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {catItems.map((item) => {
                              const globalIdx = items.indexOf(item);
                              const done = completed.has(globalIdx);
                              return (
                                <tr
                                  key={globalIdx}
                                  onClick={() => toggleComplete(globalIdx)}
                                  className={`border-t border-border/60 cursor-pointer transition-colors hover:bg-secondary/30 ${done ? 'bg-accent/10' : ''}`}
                                >
                                  <td className="px-4 py-3">
                                    {done ? (
                                      <CheckCircle2 className="w-5 h-5 text-primary" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-border" />
                                    )}
                                  </td>
                                  <td className={`px-4 py-3 font-bold ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span>{translateProductName(item.name, lang)}</span>
                                      {item.isPriority && (
                                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-[9px] font-black rounded-full flex items-center gap-1 whitespace-nowrap">
                                          <Tag className="w-2.5 h-2.5" /> {t.highPriority}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground text-xs">{translateQuantity(item.quantity, lang)}</td>
                                  <td className={`px-4 py-3 text-end font-black tabular-nums whitespace-nowrap ${done ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    <span className="inline-block">{formatPrice(item.estimatedCost, lang, t.currency)}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6 no-print">
          <div className="space-y-6">
            <div className="bg-foreground text-background p-8 rounded-[2rem] space-y-6 shadow-2xl overflow-hidden group relative" style={{ animation: 'slideUp 0.6s ease-out 0.4s both' }}>
              <div className="absolute top-0 end-0 w-40 h-40 bg-primary/10 rounded-full -me-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
              <div className="absolute bottom-0 start-0 w-32 h-32 bg-accent/10 rounded-full -ms-16 -mb-16 blur-3xl group-hover:scale-110 transition-transform duration-1000 delay-200" />
              <h3 className="font-bold text-lg font-cairo relative z-10 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> {t.listSummary}
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-sm opacity-70">
                  <span>{t.items}</span>
                  <span className="font-bold opacity-100">{fn(items.length, lang)}</span>
                </div>
                <div className="flex justify-between text-sm opacity-70">
                  <span>{t.completed}</span>
                  <span className="text-primary font-bold">{fn(completed.size, lang)}</span>
                </div>
                <hr className="border-background/20" />
                {/* Category breakdown */}
                {Object.entries(grouped).map(([catId, catItems]) => {
                  const catConfig = CATEGORIES.find(c => c.id === catId);
                  if (!catConfig) return null;
                  const catTotal = catItems.reduce((s, i) => s + i.estimatedCost, 0);
                  return (
                    <div key={catId} className="flex justify-between text-xs opacity-60">
                      <span>{lang === 'ar' ? catConfig.labelAr : catConfig.labelEn}</span>
                      <span className="font-bold">{formatPrice(catTotal, lang, t.currency)}</span>
                    </div>
                  );
                })}
                <hr className="border-background/20" />
                <div className="flex justify-between items-end">
                  <span className="text-sm opacity-60">{t.totalEst}</span>
                  <span className="text-3xl font-black text-primary">{formatNumber(totalCost, lang, 2)} <span className="text-base">{t.currency}</span></span>
                </div>
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${isOverBudget ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                  <AlertCircle className="w-4 h-4" />
                  {isOverBudget ? t.overBudget : t.withinBudget}
                </div>
              </div>
              <button onClick={handleCheckout} disabled={completed.size === 0 || isCheckingOut}
                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isCheckingOut ? 'bg-primary/80 cursor-wait' : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}>
                {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> {t.checkoutLog}</>}
              </button>
            </div>

            <div className="bg-destructive/5 p-6 rounded-[2rem] border border-destructive/10" style={{ animation: 'slideUp 0.6s ease-out 0.5s both' }}>
              <div className="flex items-center gap-2 text-destructive font-bold mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{t.budgetWarning}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.budgetTip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ShoppingList;