// Static mock data — replace with real AI/API calls when ready
import { BudgetAllocation, PricePrediction, ShoppingItem, UserProfile, Language } from '../types';

export const getBudgetOptimization = async (profile: UserProfile, lang: Language = 'ar'): Promise<BudgetAllocation[]> => {
  await new Promise(r => setTimeout(r, 1500));
  const totalFixed = (Object.values(profile.fixedExpenses) as number[]).reduce((a, b) => a + b, 0);
  const available = profile.monthlySalary - totalFixed;

  if (lang === 'en') {
    return [
      { category: 'Emergency Fund', amount: available * 0.2, percentage: 20, advice: 'Keep 3-6 months of expenses as a reserve.' },
      { category: 'Savings', amount: available * 0.25, percentage: 25, advice: 'Invest in high-yield savings certificates.' },
      { category: 'Food & Groceries', amount: available * 0.2, percentage: 20, advice: 'Buy in bulk to save 15-20%.' },
      { category: 'Entertainment', amount: available * 0.1, percentage: 10, advice: 'Set a fixed entertainment budget to avoid random spending.' },
      { category: 'Personal Development', amount: available * 0.15, percentage: 15, advice: 'Invest in learning new skills to increase income.' },
      { category: 'Miscellaneous', amount: available * 0.1, percentage: 10, advice: 'Keep a buffer for unexpected expenses.' },
    ];
  }

  return [
    { category: 'صندوق الطوارئ', amount: available * 0.2, percentage: 20, advice: 'احتفظ بـ ٣-٦ أشهر من المصاريف كاحتياطي.' },
    { category: 'الادخار', amount: available * 0.25, percentage: 25, advice: 'استثمر في شهادات الادخار عالية العائد.' },
    { category: 'الطعام والبقالة', amount: available * 0.2, percentage: 20, advice: 'اشترِ بالجملة لتوفير ١٥-٢٠٪.' },
    { category: 'الترفيه', amount: available * 0.1, percentage: 10, advice: 'خصص ميزانية ثابتة للترفيه لتجنب الإنفاق العشوائي.' },
    { category: 'التطوير الشخصي', amount: available * 0.15, percentage: 15, advice: 'استثمر في تعلم مهارات جديدة لزيادة الدخل.' },
    { category: 'متنوع', amount: available * 0.1, percentage: 10, advice: 'احتفظ بمبلغ للمصاريف غير المتوقعة.' },
  ];
};

export const getPricePredictions = async (lang: Language = 'ar'): Promise<PricePrediction[]> => {
  await new Promise(r => setTimeout(r, 1200));

  if (lang === 'en') {
    return [
      { item: 'Sugar', currentPrice: 27, predictedPrice: 30, trend: 'up', confidence: 0.85, advice: 'Prices are rising - we recommend buying now.' },
      { item: 'Rice', currentPrice: 35, predictedPrice: 33, trend: 'down', confidence: 0.72, advice: 'A slight decrease is expected next month.' },
      { item: 'Cooking Oil', currentPrice: 65, predictedPrice: 70, trend: 'up', confidence: 0.91, advice: 'Buy now - an 8% increase is expected.' },
      { item: 'Meat', currentPrice: 320, predictedPrice: 315, trend: 'down', confidence: 0.68, advice: 'Relatively stable with a slight decrease.' },
      { item: 'Vegetables', currentPrice: 15, predictedPrice: 18, trend: 'up', confidence: 0.78, advice: 'Seasonal - prices rise in summer.' },
      { item: 'Dairy', currentPrice: 45, predictedPrice: 45, trend: 'stable', confidence: 0.88, advice: 'Prices are stable - no change expected.' },
    ];
  }

  return [
    { item: 'السكر', currentPrice: 27, predictedPrice: 30, trend: 'up', confidence: 0.85, advice: 'الأسعار في ارتفاع - ننصح بالشراء الآن.' },
    { item: 'الأرز', currentPrice: 35, predictedPrice: 33, trend: 'down', confidence: 0.72, advice: 'من المتوقع انخفاض طفيف الشهر القادم.' },
    { item: 'الزيت', currentPrice: 65, predictedPrice: 70, trend: 'up', confidence: 0.91, advice: 'اشترِ الآن - ارتفاع متوقع بنسبة ٨٪.' },
    { item: 'اللحوم', currentPrice: 320, predictedPrice: 315, trend: 'down', confidence: 0.68, advice: 'استقرار نسبي مع انخفاض طفيف.' },
    { item: 'الخضروات', currentPrice: 15, predictedPrice: 18, trend: 'up', confidence: 0.78, advice: 'موسمية - الأسعار ترتفع في الصيف.' },
    { item: 'الألبان', currentPrice: 45, predictedPrice: 45, trend: 'stable', confidence: 0.88, advice: 'أسعار مستقرة - لا تغيير متوقع.' },
  ];
};

export const generateShoppingList = async (profile: UserProfile, budget: number, lang: Language = 'ar'): Promise<ShoppingItem[]> => {
  await new Promise(r => setTimeout(r, 1800));

  if (lang === 'en') {
    return [
      { name: 'Basmati Rice', quantity: '2 kg', estimatedCost: 70, isPriority: true },
      { name: 'Sunflower Oil', quantity: '2 liters', estimatedCost: 130, isPriority: true },
      { name: 'Sugar', quantity: '2 kg', estimatedCost: 54, isPriority: true },
      { name: 'Chicken', quantity: '2 kg', estimatedCost: 180, isPriority: true },
      { name: 'Mixed Vegetables', quantity: 'As needed', estimatedCost: 100, isPriority: false },
      { name: 'Seasonal Fruits', quantity: '2 kg', estimatedCost: 80, isPriority: false },
      { name: 'Dairy & Cheese', quantity: 'As needed', estimatedCost: 120, isPriority: true },
      { name: 'Bread & Pastries', quantity: 'Daily', estimatedCost: 45, isPriority: true },
      { name: 'Legumes (Lentils/Beans)', quantity: '1 kg', estimatedCost: 40, isPriority: false },
      { name: 'Beverages', quantity: 'As needed', estimatedCost: 60, isPriority: false },
    ];
  }

  return [
    { name: 'أرز بسمتي', quantity: '٢ كيلو', estimatedCost: 70, isPriority: true },
    { name: 'زيت عباد الشمس', quantity: '٢ لتر', estimatedCost: 130, isPriority: true },
    { name: 'سكر', quantity: '٢ كيلو', estimatedCost: 54, isPriority: true },
    { name: 'دجاج', quantity: '٢ كيلو', estimatedCost: 180, isPriority: true },
    { name: 'خضروات متنوعة', quantity: 'حسب الحاجة', estimatedCost: 100, isPriority: false },
    { name: 'فاكهة موسمية', quantity: '٢ كيلو', estimatedCost: 80, isPriority: false },
    { name: 'ألبان وجبن', quantity: 'حسب الحاجة', estimatedCost: 120, isPriority: true },
    { name: 'خبز ومعجنات', quantity: 'يومي', estimatedCost: 45, isPriority: true },
    { name: 'بقوليات (عدس/فول)', quantity: '١ كيلو', estimatedCost: 40, isPriority: false },
    { name: 'مشروبات', quantity: 'حسب الحاجة', estimatedCost: 60, isPriority: false },
  ];
};
