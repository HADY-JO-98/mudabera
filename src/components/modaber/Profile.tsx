import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile, MaritalStatus, LivingCostLevel, IncomeStability, SavingPreference, RiskTolerance, Debt, AnnualExpense } from '../../types';
import { Language } from '../../types';
import { translations } from '../../translations';
import { User, Wallet, Home, Shield, Edit2, Save, X, CheckCircle2, Coffee, ChevronUp, ChevronDown, Plus, Minus, Trash2, CreditCard, Calendar, Download, Loader2, AlertTriangle } from 'lucide-react';
import { generateFullReport } from '../../utils/pdfGenerator';
import { fn } from '../../utils/formatNumber';
import CustomSelect from '../ui/custom-select';
import { profileApi } from '../../services/apiClient';

interface ProfileProps {
  profile: UserProfile;
  lang: Language;
  onUpdate: (updatedProfile: UserProfile) => void;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, lang, onUpdate, onLogout }) => {
  const t = translations[lang];
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...profile });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try { await generateFullReport('full-report-template', `mudaber_Report_${new Date().getTime()}`); } catch (error) { console.error('Failed to generate report:', error); } finally { setIsGenerating(false); }
  };

  const [showDebtForm, setShowDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({ description: '', monthlyAmount: 0, priority: 'Medium' });
  const [showAnnualForm, setShowAnnualForm] = useState(false);
  const [newAnnual, setNewAnnual] = useState<Partial<AnnualExpense>>({ description: '', totalAmount: 0, priority: 'Medium' });

  const handleSave = () => {
    if (!editedProfile.monthlySalary || !editedProfile.familyMembers) {
      alert(t.salaryRequired);
      return;
    }
    const members = Number(editedProfile.familyMembers);
    const status = editedProfile.maritalStatus;
    if (status === 'married' && members === 1) { alert(t.invalidMaritalStatus); return; }
    if (status === 'single' && members > 1) { alert(t.invalidMaritalStatus); return; }
    onUpdate(editedProfile);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'Delete') return;
    setDeleting(true);
    setDeleteError(null);
    const res = await profileApi.delete();
    if (res.ok) {
      if (onLogout) {
        onLogout();
      } else {
        localStorage.removeItem('modaber_auth_token');
        localStorage.removeItem('modaber_refresh_token');
        window.location.reload();
      }
    } else {
      setDeleteError(res.error || (lang === 'ar' ? 'فشل حذف الحساب' : 'Failed to delete account'));
      setDeleting(false);
    }
  };

  const updateRootField = (field: keyof UserProfile, value: UserProfile[keyof UserProfile]) => setEditedProfile(prev => ({ ...prev, [field]: value }));
  const updateFixedExpense = (field: keyof typeof editedProfile.fixedExpenses, value: number) => setEditedProfile(prev => ({ ...prev, fixedExpenses: { ...prev.fixedExpenses, [field]: value } }));
  const updateOptionalExpense = (field: keyof typeof editedProfile.optionalExpenses, value: number) => setEditedProfile(prev => ({ ...prev, optionalExpenses: { ...prev.optionalExpenses, [field]: value } }));
  const updatePreference = (field: keyof typeof editedProfile.preferences, value: string | number | string[]) => setEditedProfile(prev => ({ ...prev, preferences: { ...prev.preferences, [field]: value } }));

  const addDebt = () => {
    if (!newDebt.description || !newDebt.monthlyAmount) return;
    const debt: Debt = { id: Math.random().toString(36).substring(7), description: newDebt.description!, monthlyAmount: newDebt.monthlyAmount!, priority: newDebt.priority as 'High' | 'Medium' | 'Low', dueDate: newDebt.dueDate };
    updateRootField('debts', [...editedProfile.debts, debt]);
    setNewDebt({ description: '', monthlyAmount: 0, priority: 'Medium' });
    setShowDebtForm(false);
  };

  const addAnnual = () => {
    if (!newAnnual.description || !newAnnual.totalAmount) return;
    const annual: AnnualExpense = { id: Math.random().toString(36).substring(7), description: newAnnual.description!, totalAmount: newAnnual.totalAmount!, priority: newAnnual.priority as 'High' | 'Medium' | 'Low', expectedMonth: newAnnual.expectedMonth };
    updateRootField('annualExpenses', [...editedProfile.annualExpenses, annual]);
    setNewAnnual({ description: '', totalAmount: 0, priority: 'Medium' });
    setShowAnnualForm(false);
  };

  const removeDebt = (id: string) => updateRootField('debts', editedProfile.debts.filter(d => d.id !== id));
  const removeAnnual = (id: string) => updateRootField('annualExpenses', editedProfile.annualExpenses.filter(e => e.id !== id));
  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newPriorities = [...editedProfile.preferences.monthlyPriorities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newPriorities.length) {
      [newPriorities[index], newPriorities[targetIndex]] = [newPriorities[targetIndex], newPriorities[index]];
      updatePreference('monthlyPriorities', newPriorities);
    }
  };

  const fixedFields = [
    { id: 'rent', required: true }, { id: 'electricity', required: true }, { id: 'water', required: true },
    { id: 'gas', required: true }, { id: 'transportation', required: true }, { id: 'internet', required: true }, { id: 'mobile', required: true },
  ];
  const optionalFields = [{ id: 'streaming', required: false }, { id: 'education', required: false }, { id: 'medical', required: false }];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ animation: 'slideUp 0.5s ease-out' }}>
        <div>
          <h2 className="text-3xl font-black text-foreground font-cairo">{t.profile}</h2>
          <p className="text-muted-foreground">{t.manageParams}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isEditing ? (
            <>
              <button onClick={handleDownloadReport} disabled={isGenerating} className="flex items-center gap-2 px-6 py-3 glass border border-border text-muted-foreground rounded-2xl font-bold hover:bg-secondary hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {t.downloadPdf}
              </button>
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
                <Edit2 className="w-4 h-4" /> {t.editProfile}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError(null); }} style={{ backgroundColor: 'hsl(var(--destructive))', color: '#fff' }} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all hover:opacity-90 shadow-lg">
                <Trash2 className="w-4 h-4" /> {lang === 'ar' ? 'حذف الحساب' : 'Delete Account'}
              </button>
              <button onClick={() => { setIsEditing(false); setEditedProfile({ ...profile }); }} className="flex items-center gap-2 px-6 py-3 glass border border-border text-muted-foreground rounded-2xl font-bold hover:bg-secondary hover:scale-105 active:scale-95 transition-all">
                <X className="w-4 h-4" /> {t.cancel}
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
                <Save className="w-4 h-4" /> {t.saveChanges}
              </button>
            </>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="bg-accent border border-accent p-4 rounded-2xl flex items-center gap-3 text-accent-foreground font-bold" style={{ animation: 'slideDown 0.3s ease-out' }}>
          <CheckCircle2 className="w-5 h-5" /> {t.profileUpdated}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border border-border space-y-6" style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
          <div className="flex items-center gap-3 mb-2">
            <User className="text-primary w-6 h-6" />
            <h3 className="text-xl font-bold text-foreground font-cairo">{t.basicInfo}</h3>
          </div>
          <div className="flex items-center gap-4 p-4 bg-secondary rounded-2xl border border-border">
            {profile.account.avatar ? (
              <img
                src={profile.account.avatar}
                alt={profile.account.name}
                className="w-12 h-12 rounded-full object-cover border border-border/60 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-border">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-lg font-black text-foreground leading-tight">{profile.account.name}</p>
              <p className="text-sm text-muted-foreground">{profile.account.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: t.age, field: 'age', isOptional: true, value: profile.age ? fn(profile.age, lang) : t.not_specified },
              { label: t.monthlySalary, field: 'monthlySalary', isOptional: false, value: `${fn(profile.monthlySalary, lang)} ${t.currency}` },
              { label: t.familyMembers, field: 'familyMembers', isOptional: false, value: fn(profile.familyMembers, lang) },
              { label: t.maritalStatus, field: 'maritalStatus', isOptional: false, value: t[profile.maritalStatus as keyof typeof t] || profile.maritalStatus, options: [{value: 'not_specified', label: t.not_specified}, {value: 'single', label: t.single}, {value: 'married', label: t.married}] },
              { label: t.incomeStability, field: 'incomeStability', isOptional: false, value: t[(profile.incomeStability || '').toLowerCase().replace('-', '_') as keyof typeof t] || profile.incomeStability, options: [{value: 'Full-time', label: t.full_time}, {value: 'Freelance', label: t.freelance}, {value: 'Seasonal', label: t.seasonal}, {value: 'Mixed', label: t.mixed}] },
              { label: t.livingCostLevel, field: 'livingCostLevel', isOptional: false, value: t[(profile.livingCostLevel || '').toLowerCase() as keyof typeof t] || profile.livingCostLevel, options: [{value: 'Low', label: t.low}, {value: 'Medium', label: t.medium}, {value: 'High', label: t.high}] },
            ].map((item, i) => (
              <div key={i}>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                  {item.label} {item.isOptional && `(${t.optional})`} {!item.isOptional && <span className="text-destructive">*</span>}
                </label>
                {isEditing ? (
                  item.options ? (
                    <CustomSelect value={editedProfile[item.field as keyof UserProfile] as string} onChange={(v) => updateRootField(item.field as keyof UserProfile, v as any)}
                      options={item.options} />
                  ) : (
                    <input type="number" value={editedProfile[item.field as keyof UserProfile] as string | number || ''} onChange={(e) => updateRootField(item.field as keyof UserProfile, item.field === 'age' && !e.target.value ? undefined : Number(e.target.value) as never)}
                      className="w-full px-4 py-2 bg-secondary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary text-foreground transition-all" />
                  )
                ) : (
                  <p className="text-xl font-black text-foreground">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-border space-y-6" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-primary w-6 h-6" />
            <h3 className="text-xl font-bold text-foreground font-cairo">{t.aiLogic}</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{t.savingPriority} <span className="text-destructive">*</span></label>
                {isEditing ? (
                  <CustomSelect value={editedProfile.preferences.savingPriority} onChange={(v) => updatePreference('savingPriority', v as SavingPreference)}
                    options={[
                      { value: 'not_specified', label: t.not_specified },
                      { value: 'Low', label: t.low },
                      { value: 'Medium', label: t.medium },
                      { value: 'High', label: t.high },
                    ]} />
                ) : (
                  <div className="px-4 py-2 bg-accent text-accent-foreground rounded-xl font-bold inline-block border border-accent text-xs">
                    {t[profile.preferences.savingPriority.toLowerCase() as keyof typeof t] || profile.preferences.savingPriority}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{t.riskTolerance} <span className="text-destructive">*</span></label>
                {isEditing ? (
                  <CustomSelect value={editedProfile.preferences.riskTolerance} onChange={(v) => updatePreference('riskTolerance', v as RiskTolerance)}
                    options={[
                      { value: 'not_specified', label: t.not_specified },
                      { value: 'Low', label: t.low },
                      { value: 'Medium', label: t.medium },
                      { value: 'High', label: t.high },
                    ]} />
                ) : (
                  <div className="px-4 py-2 bg-secondary text-foreground rounded-xl font-bold inline-block border border-border text-xs">
                    {t[profile.preferences.riskTolerance.toLowerCase() as keyof typeof t] || profile.preferences.riskTolerance}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">{t.emergencyTarget}</label>
              {isEditing ? (
                <div className="space-y-2">
                  <input type="range" min="0" max="50" step="5" value={editedProfile.preferences.emergencyFundPercentage}
                    onChange={(e) => updatePreference('emergencyFundPercentage', Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>{fn(0, lang)}%</span><span className="text-primary">{fn(editedProfile.preferences.emergencyFundPercentage, lang)}%</span><span>{fn(50, lang)}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-black text-foreground">{fn(profile.preferences.emergencyFundPercentage, lang)}%</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{t.monthlyPriorities}</label>
              <div className="space-y-2">
                {(isEditing ? editedProfile : profile).preferences.monthlyPriorities.map((p, idx) => (
                  <div key={p} className="flex items-center justify-between p-2.5 bg-secondary rounded-xl border border-border hover:shadow-sm transition-all">
                    <span className="text-[11px] font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted text-[9px] flex items-center justify-center text-muted-foreground">{fn(idx + 1, lang)}</span>
                      {t[p as keyof typeof t] || p}
                    </span>
                    {isEditing && (
                      <div className="flex gap-1">
                        <button disabled={idx === 0} onClick={() => movePriority(idx, 'up')} className="p-1 hover:bg-card rounded-lg text-muted-foreground disabled:opacity-20 transition-colors"><ChevronUp className="w-3 h-3" /></button>
                        <button disabled={idx === (isEditing ? editedProfile : profile).preferences.monthlyPriorities.length - 1} onClick={() => movePriority(idx, 'down')} className="p-1 hover:bg-card rounded-lg text-muted-foreground disabled:opacity-20 transition-colors"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass p-8 rounded-[2.5rem] border border-border" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Home className="text-primary w-6 h-6" />
              <h3 className="text-xl font-bold text-foreground font-cairo">{t.fixedExpenses}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8">
            {fixedFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-tighter truncate">
                  {t[field.id as keyof typeof t] || field.id}
                  {field.required ? <span className="text-destructive ms-1">*</span> : <span className="text-[8px] text-muted-foreground ms-1">({t.optional})</span>}
                </label>
                {isEditing ? (
                  <input type="number" required={field.required} value={editedProfile.fixedExpenses[field.id as keyof typeof editedProfile.fixedExpenses] || 0}
                    onChange={(e) => updateFixedExpense(field.id as keyof typeof editedProfile.fixedExpenses, Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg outline-none text-sm focus:ring-1 focus:ring-primary text-foreground transition-all" />
                ) : (
                  <p className="font-bold text-foreground">{fn(profile.fixedExpenses[field.id as keyof typeof profile.fixedExpenses] || 0, lang)} {t.currency}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> {t.debts}
                </h4>
                {isEditing && (
                  <button onClick={() => setShowDebtForm(!showDebtForm)} className="flex items-center gap-1 text-[10px] font-black text-primary uppercase hover:opacity-80 transition-colors">
                    {showDebtForm ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {t.addDebt}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(isEditing ? editedProfile : profile).debts.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border hover:shadow-sm transition-all">
                    <div>
                      <p className="text-sm font-bold text-foreground">{d.description}</p>
                      <p className="text-xs text-muted-foreground">{fn(d.monthlyAmount, lang)} {t.currency}/{t.monthlyPer}</p>
                    </div>
                    {isEditing && (
                      <button onClick={() => removeDebt(d.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
                {(isEditing ? editedProfile : profile).debts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">{t.noDebts}</p>
                )}
              </div>
              {showDebtForm && isEditing && (
                <div className="p-4 bg-card rounded-xl border border-border space-y-3" style={{ animation: 'slideDown 0.3s ease-out' }}>
                  <input type="text" placeholder={t.debtDesc} value={newDebt.description} onChange={e => setNewDebt({ ...newDebt, description: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none transition-all" />
                  <input type="number" placeholder={t.monthlyAmountPlaceholder} value={newDebt.monthlyAmount || ''} onChange={e => setNewDebt({ ...newDebt, monthlyAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none transition-all" />
                  <button onClick={addDebt} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all">{t.addDebt}</button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> {t.annualExpenses}
                </h4>
                {isEditing && (
                  <button onClick={() => setShowAnnualForm(!showAnnualForm)} className="flex items-center gap-1 text-[10px] font-black text-primary uppercase hover:opacity-80 transition-colors">
                    {showAnnualForm ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {t.addAnnual}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(isEditing ? editedProfile : profile).annualExpenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border hover:shadow-sm transition-all">
                    <div>
                      <p className="text-sm font-bold text-foreground">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{fn(e.totalAmount, lang)} {t.currency}/{t.yearlyPer}</p>
                    </div>
                    {isEditing && (
                      <button onClick={() => removeAnnual(e.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
                {(isEditing ? editedProfile : profile).annualExpenses.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">{t.noAnnual}</p>
                )}
              </div>
              {showAnnualForm && isEditing && (
                <div className="p-4 bg-card rounded-xl border border-border space-y-3" style={{ animation: 'slideDown 0.3s ease-out' }}>
                  <input type="text" placeholder={t.expenseDesc} value={newAnnual.description} onChange={e => setNewAnnual({ ...newAnnual, description: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none transition-all" />
                  <input type="number" placeholder={t.totalAmount} value={newAnnual.totalAmount || ''} onChange={e => setNewAnnual({ ...newAnnual, totalAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground outline-none transition-all" />
                  <button onClick={addAnnual} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all">{t.addAnnual}</button>
                </div>
              )}
            </div>
          </div>

          {/* Optional expenses */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <Coffee className="text-primary w-5 h-5" />
              <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">{t.optionalExpenses} ({t.optional})</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {optionalFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                    {t[field.id as keyof typeof t] || field.id}
                  </label>
                  {isEditing ? (
                    <input type="number" value={editedProfile.optionalExpenses[field.id as keyof typeof editedProfile.optionalExpenses] || 0}
                      onChange={(e) => updateOptionalExpense(field.id as keyof typeof editedProfile.optionalExpenses, Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-secondary border border-border rounded-lg outline-none text-sm focus:ring-1 focus:ring-primary text-foreground transition-all" />
                  ) : (
                    <p className="font-bold text-foreground">{fn(profile.optionalExpenses[field.id as keyof typeof profile.optionalExpenses] || 0, lang)} {t.currency}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6" style={{ animation: 'scaleUp 0.3s ease-out' }}>
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-2xl text-destructive">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-black dark:text-white font-cairo">
                  {lang === 'ar' ? 'حذف الحساب' : 'Delete Account'}
                </h3>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lang === 'ar' 
                  ? 'هل أنت متأكد من رغبتك في حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء. للتأكيد، يرجى كتابة "Delete" في الحقل أدناه.' 
                  : 'Are you sure you want to delete your account? This action cannot be undone. To confirm, please type "Delete" in the field below.'}
              </p>
              
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={lang === 'ar' ? 'اكتب "Delete" هنا' : 'Type "Delete" here'}
                className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground placeholder-muted-foreground text-sm border border-border focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all"
              />

              {deleteError && (
                <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {deleteError}
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(null); }}
                disabled={deleting}
                className="px-5 py-2.5 bg-secondary text-foreground hover:bg-accent rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'Delete' || deleting}
                style={{
                  backgroundColor: 'hsl(var(--destructive))',
                  color: '#fff',
                  opacity: deleteConfirm === 'Delete' ? 1 : 0.4
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:opacity-90 disabled:cursor-not-allowed"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {lang === 'ar' ? 'حذف الحساب' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
