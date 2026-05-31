// Bidirectional product name translation map
const enToAr: Record<string, string> = {
  // Basic staples
  'Sugar': 'سكر',
  'Sugar ': 'السكر',
  'Rice': 'الأرز',
  'Cooking Oil': 'الزيت',
  'Meat': 'اللحوم',
  'Vegetables': 'الخضروات',
  'Dairy': 'الألبان',
  'Basmati Rice': 'أرز بسمتي',
  'Sunflower Oil': 'زيت عباد الشمس',
  'Chicken': 'دجاج',
  'Mixed Vegetables': 'خضروات متنوعة',
  'Seasonal Fruits': 'فاكهة موسمية',
  'Dairy & Cheese': 'ألبان وجبن',
  'Bread & Pastries': 'خبز ومعجنات',
  'Legumes (Lentils/Beans)': 'بقوليات (عدس/فول)',
  'Beverages': 'مشروبات',
  // Fruits
  'Apples': 'تفاح',
  'Bananas': 'موز',
  'Oranges': 'برتقال',
  'Grapes': 'عنب',
  'Strawberries': 'فراولة',
  'Mango': 'مانجو',
  'Watermelon': 'بطيخ',
  'Guava': 'جوافة',
  'Pomegranate': 'رمان',
  'Lemon': 'ليمون',
  'Peach': 'خوخ',
  'Pear': 'كمثرى',
  'Figs': 'تين',
  'Dates': 'بلح',
  // Vegetables
  'Tomatoes': 'طماطم',
  'Potatoes': 'بطاطس',
  'Onions': 'بصل',
  'Garlic': 'ثوم',
  'Cucumber': 'خيار',
  'Pepper': 'فلفل',
  'Carrots': 'جزر',
  'Zucchini': 'كوسة',
  'Eggplant': 'باذنجان',
  'Okra': 'بامية',
  'Molokhia': 'ملوخية',
  'Spinach': 'سبانخ',
  'Lettuce': 'خس',
  'Parsley': 'بقدونس',
  'Cabbage': 'كرنب',
  'Cauliflower': 'قرنبيط',
  'Broccoli': 'بروكلي',
  'Green Beans': 'فاصوليا خضراء',
  'Peas': 'بسلة',
  // Meats
  'Beef': 'لحم بقري',
  'Lamb': 'لحم ضاني',
  'Chicken Breast': 'صدور دجاج',
  'Minced Meat': 'لحم مفروم',
  'Liver': 'كبدة',
  'Kofta': 'كفتة',
  'Sausage': 'سجق',
  // Fish
  'Fish': 'سمك',
  'Shrimp': 'جمبري',
  'Tuna': 'تونة',
  'Sardines': 'سردين',
  'Tilapia': 'بلطي',
  'Salmon': 'سلمون',
  // Dairy
  'Milk': 'لبن',
  'Cheese': 'جبنة',
  'Yogurt': 'زبادي',
  'Butter': 'زبدة',
  'Eggs': 'بيض',
  'Cream': 'قشطة',
  // Grains
  'Pasta': 'مكرونة',
  'Bread': 'خبز',
  'Flour': 'دقيق',
  'Lentils': 'عدس',
  'Beans': 'فول',
  'Chickpeas': 'حمص',
  'Oats': 'شوفان',
  'Cornflakes': 'كورن فليكس',
  // Beverages
  'Tea': 'شاي',
  'Coffee': 'قهوة',
  'Juice': 'عصير',
  'Water': 'مياه',
  'Nescafe': 'نسكافيه',
  'Soft Drinks': 'مشروبات غازية',
  // Snacks
  'Chips': 'شيبسي',
  'Chocolate': 'شوكولاتة',
  'Biscuits': 'بسكويت',
  'Cake': 'كيك',
  'Ice Cream': 'آيس كريم',
  'Nuts': 'مكسرات',
  // Cleaning
  'Soap': 'صابون',
  'Detergent': 'منظف',
  'Shampoo': 'شامبو',
  'Toothpaste': 'معجون أسنان',
  'Tissues': 'مناديل',
  'Bleach': 'كلور',
  'Air Freshener': 'معطر جو',
  // Other
  'Salt': 'ملح',
  'Pepper Spice': 'فلفل أسود',
  'Cumin': 'كمون',
  'Coriander': 'كزبرة',
  'Oil': 'زيت',
  'Vinegar': 'خل',
  'Tomato Paste': 'صلصة طماطم',
  'Ketchup': 'كاتشب',
  'Honey': 'عسل',
  'Jam': 'مربى',
};

const arToEn: Record<string, string> = {};
Object.entries(enToAr).forEach(([en, ar]) => { arToEn[ar] = en; });

// Case-insensitive lookup maps
const enToArLower: Record<string, string> = {};
Object.entries(enToAr).forEach(([en, ar]) => { enToArLower[en.toLowerCase().trim()] = ar; });
const arToEnNormalized: Record<string, string> = {};
Object.entries(arToEn).forEach(([ar, en]) => { arToEnNormalized[ar.trim()] = en; });

const isArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

export const translateProductName = (name: string, targetLang: 'ar' | 'en'): string => {
  if (!name) return name;
  const trimmed = name.trim();

  if (targetLang === 'ar') {
    // Already Arabic — keep as is
    if (isArabic(trimmed)) return trimmed;
    // Exact then case-insensitive
    return enToAr[trimmed] || enToArLower[trimmed.toLowerCase()] || trimmed;
  }
  // targetLang === 'en'
  // Already English (no Arabic chars) — keep as is
  if (!isArabic(trimmed)) return trimmed;
  return arToEn[trimmed] || arToEnNormalized[trimmed] || trimmed;
};

// Translate quantity strings
const quantityEnToAr: Record<string, string> = {
  'As needed': 'حسب الحاجة',
  'Less quantity': 'كمية أقل',
  'More quantity': 'كمية أكثر',
  '1 kg': '١ كيلو',
  '2 kg': '٢ كيلو',
  '3 kg': '٣ كيلو',
  '5 kg': '٥ كيلو',
  '500g': '٥٠٠ جرام',
  '1 pack': 'عبوة واحدة',
  '2 packs': 'عبوتين',
  '3 packs': '٣ عبوات',
  '1 bottle': 'زجاجة واحدة',
  '2 bottles': 'زجاجتين',
  '1 piece': 'قطعة واحدة',
  '2 pieces': 'قطعتين',
  '1 dozen': 'درزن',
  '1 bag': 'كيس واحد',
  '1 box': 'علبة واحدة',
  '1 liter': '١ لتر',
  '2 liters': '٢ لتر',
  '1 can': 'علبة واحدة',
  'Daily': 'يومي',
};

const quantityArToEn: Record<string, string> = {};
Object.entries(quantityEnToAr).forEach(([en, ar]) => { quantityArToEn[ar] = en; });

export const translateQuantity = (quantity: string, targetLang: 'ar' | 'en'): string => {
  if (!quantity) return quantity;
  const trimmed = quantity.trim();
  if (targetLang === 'ar') {
    if (isArabic(trimmed)) return trimmed;
    return quantityEnToAr[trimmed] || trimmed;
  }
  if (!isArabic(trimmed)) return trimmed;
  return quantityArToEn[trimmed] || trimmed;
};

export const translateAdvice = (advice: string, item: string, targetLang: 'ar' | 'en'): string => {
  const adviceMap: Record<string, Record<string, string>> = {
    'السكر': { ar: 'الأسعار في ارتفاع - ننصح بالشراء الآن.', en: 'Prices are rising - we recommend buying now.' },
    'سكر': { ar: 'الأسعار في ارتفاع - ننصح بالشراء الآن.', en: 'Prices are rising - we recommend buying now.' },
    'Sugar': { ar: 'الأسعار في ارتفاع - ننصح بالشراء الآن.', en: 'Prices are rising - we recommend buying now.' },
    'الأرز': { ar: 'من المتوقع انخفاض طفيف الشهر القادم.', en: 'A slight decrease is expected next month.' },
    'Rice': { ar: 'من المتوقع انخفاض طفيف الشهر القادم.', en: 'A slight decrease is expected next month.' },
    'الزيت': { ar: 'اشترِ الآن - ارتفاع متوقع بنسبة ٨٪.', en: 'Buy now - an 8% increase is expected.' },
    'Cooking Oil': { ar: 'اشترِ الآن - ارتفاع متوقع بنسبة ٨٪.', en: 'Buy now - an 8% increase is expected.' },
    'اللحوم': { ar: 'استقرار نسبي مع انخفاض طفيف.', en: 'Relatively stable with a slight decrease.' },
    'Meat': { ar: 'استقرار نسبي مع انخفاض طفيف.', en: 'Relatively stable with a slight decrease.' },
    'الخضروات': { ar: 'موسمية - الأسعار ترتفع في الصيف.', en: 'Seasonal - prices rise in summer.' },
    'Vegetables': { ar: 'موسمية - الأسعار ترتفع في الصيف.', en: 'Seasonal - prices rise in summer.' },
    'الألبان': { ar: 'أسعار مستقرة - لا تغيير متوقع.', en: 'Prices are stable - no change expected.' },
    'Dairy': { ar: 'أسعار مستقرة - لا تغيير متوقع.', en: 'Prices are stable - no change expected.' },
  };

  const mapped = adviceMap[item];
  if (mapped) return mapped[targetLang];
  return advice;
};
