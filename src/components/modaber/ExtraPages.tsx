import React from 'react';
import { BrainCircuit, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../translations';

interface ExtraPagesProps {
  type: 'how' | 'privacy' | 'help';
  lang: Language;
}

const ExtraPages: React.FC<ExtraPagesProps> = ({ type, lang }) => {
  if (type === 'how') {
    const items = lang === 'en' ? [
      { title: "Market Price Prediction", desc: "Our engine analyzes historical datasets and real-time signals.", icon: "01" },
      { title: "Neural Budget Distribution", desc: "Custom optimization model that adjusts to family size.", icon: "02" },
      { title: "Risk-Adaptive Investing", desc: "Filters thousands of assets to show safe products.", icon: "03" },
      { title: "Behavioral Analysis", desc: "Detecting waste patterns through anonymized data.", icon: "04" }
    ] : [
      { title: "توقع أسعار السوق", desc: "يحلل محركنا مجموعات البيانات التاريخية والإشارات الحية.", icon: "٠١" },
      { title: "التوزيع العصبي للميزانية", desc: "نموذج تحسين مخصص يتكيف مع حجم الأسرة.", icon: "٠٢" },
      { title: "استثمار متكيف مع المخاطر", desc: "يصفي آلاف الأصول لعرض المنتجات الآمنة فقط.", icon: "٠٣" },
      { title: "التحليل السلوكي", desc: "كشف أنماط الهدر من خلال مقارنة البيانات مجهولة المصدر.", icon: "٠٤" }
    ];

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-accent text-accent-foreground rounded-3xl flex items-center justify-center mx-auto shadow-lg hover:scale-110 transition-transform duration-300">
            <BrainCircuit className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-foreground font-cairo">
            {lang === 'en' ? 'How mudaber Works' : 'كيف يعمل مُدَبِّر'}
          </h1>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item, i) => (
            <div key={i} className="card-3d glass p-8 rounded-[40px] border border-border space-y-4 hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-primary/30"
              style={{ animationDelay: `${0.15 * i}s`, animationFillMode: 'both' }}>
              <span className="text-5xl font-black text-border block">{item.icon}</span>
              <h3 className="text-xl font-bold text-foreground font-cairo">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'help') {
    const faqs = lang === 'en' ? [
      { q: "How do I update my salary?", a: "Go to the Profile section and click 'Edit Profile' to update your financial details." },
      { q: "Is my data shared with anyone?", a: "No, your data is processed locally and only used to generate your personal financial roadmap." },
      { q: "How often should I recalculate?", a: "We recommend recalculating whenever your income or fixed expenses change significantly." },
      { q: "What is the Financial IQ?", a: "It's a score based on your savings rate, expense management, and adherence to AI suggestions." }
    ] : [
      { q: "كيف يمكنني تحديث راتبي؟", a: "اذهب إلى قسم الملف الشخصي وانقر على 'تعديل الملف' لتحديث بياناتك المالية." },
      { q: "هل تتم مشاركة بياناتي مع أي شخص؟", a: "لا، يتم معالجة بياناتك محلياً وتستخدم فقط لإنشاء خارطة الطريق المالية الخاصة بك." },
      { q: "كم مرة يجب علي إعادة الحساب؟", a: "نوصي بإعادة الحساب كلما تغير دخلك أو مصاريفك الثابتة بشكل كبير." },
      { q: "ما هو معدل الذكاء المالي؟", a: "هو تقييم يعتمد على معدل ادخارك، وإدارة مصاريفك، ومدى التزامك باقتراحات النظام." }
    ];

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-accent text-accent-foreground rounded-3xl flex items-center justify-center mx-auto shadow-lg hover:scale-110 transition-transform duration-300">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-foreground font-cairo">
            {lang === 'en' ? 'Help & Support' : 'المساعدة والدعم'}
          </h1>
        </div>
        <div className="grid gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="glass p-8 rounded-[32px] border border-border space-y-3 hover:shadow-lg hover:border-primary/20 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${0.12 * i}s`, animationFillMode: 'both' }}>
              <h3 className="text-lg font-bold text-foreground font-cairo flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {faq.q}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm ps-5">{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="bg-foreground text-background p-10 rounded-[3rem] text-center space-y-6 animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <h3 className="text-2xl font-black font-cairo">{lang === 'en' ? 'Still need help?' : 'هل ما زلت بحاجة للمساعدة؟'}</h3>
          <p className="opacity-60">
            {lang === 'en' ? 'Contact our support team anytime at:' : 'تواصل مع فريق الدعم في أي وقت على:'}
            <br /><span className="text-primary font-bold">support@mudaber.ai</span>
          </p>
          <a href="mailto:support@mudaber.ai" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 hover:scale-[1.03] active:scale-[0.97] transition-all">
            {lang === 'en' ? 'Contact Support' : 'تواصل معنا'}
          </a>
        </div>
      </div>
    );
  }

  // Privacy Policy
  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="bg-gradient-brand p-12 rounded-[48px] text-primary-foreground animate-in fade-in slide-in-from-bottom-6 duration-700">
        <ShieldCheck className="w-16 h-16 mb-6 opacity-80" />
        <h1 className="text-4xl font-black mb-4 font-cairo">
          {lang === 'en' ? 'Privacy & Data Security' : 'الخصوصية وأمن البيانات'}
        </h1>
        <p className="opacity-80 leading-relaxed max-w-lg">
          {lang === 'en' ? 'Your financial data is private. We use bank-grade encryption.' : 'بياناتك المالية خاصة. نحن نستخدم تشفيراً بمستوى البنوك.'}
        </p>
      </div>
      <div className="space-y-6">
        {(lang === 'en' ? [
          { title: 'Local Data Processing', desc: 'All your financial data is processed locally on your device. We never store or transmit your personal information to external servers.' },
          { title: 'End-to-End Encryption', desc: 'Any data that needs to be synced uses AES-256 encryption, the same standard used by major banks worldwide.' },
          { title: 'No Third-Party Sharing', desc: 'We do not sell, share, or provide your data to any third parties for advertising or any other purpose.' },
          { title: 'You Control Your Data', desc: 'You can export or delete all your data at any time from the settings page. Your data belongs to you.' },
        ] : [
          { title: 'معالجة البيانات محلياً', desc: 'تتم معالجة جميع بياناتك المالية محلياً على جهازك. لا نقوم أبداً بتخزين أو إرسال معلوماتك الشخصية إلى خوادم خارجية.' },
          { title: 'تشفير شامل', desc: 'أي بيانات تحتاج إلى مزامنة تستخدم تشفير AES-256، وهو نفس المعيار المستخدم من قبل البنوك الكبرى حول العالم.' },
          { title: 'لا مشاركة مع أطراف ثالثة', desc: 'لا نبيع أو نشارك أو نقدم بياناتك لأي أطراف ثالثة لأغراض الإعلان أو أي غرض آخر.' },
          { title: 'أنت تتحكم في بياناتك', desc: 'يمكنك تصدير أو حذف جميع بياناتك في أي وقت من صفحة الإعدادات. بياناتك ملك لك.' },
        ]).map((item, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-border space-y-2 hover:shadow-lg hover:border-primary/20 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${0.15 * i}s`, animationFillMode: 'both' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0">
                <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </div>
              <h3 className="font-bold text-foreground font-cairo">{item.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed ps-11">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtraPages;
