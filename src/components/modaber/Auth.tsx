import React, { useState, useCallback } from 'react';
import { Wallet, Mail, Lock, User, ArrowRight, Eye, EyeOff, Sun, Moon, Globe, Loader2, ChevronLeft, AlertCircle, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { UserAccount, Language } from '../../types';
import { translations } from '../../translations';
import { authApi, setAuthToken } from '../../services/apiClient';
import { toArabicDigits as _toArabicDigits } from '../../utils/formatNumber';

interface AuthProps {
  onLogin: (account: UserAccount) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const toArabicDigitsLang = (input: string | number, lang: string): string =>
  lang === 'ar' ? _toArabicDigits(input) : String(input);

const Auth: React.FC<AuthProps> = ({ onLogin, lang, setLang, theme, setTheme }) => {
  const t = translations[lang];
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState(''); // ← NEW
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [submitted, setSubmitted] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showVerify, setShowVerify] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [isResetOtpVerified, setIsResetOtpVerified] = useState(false);

  const requiredText = lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
  const emailInvalidText = lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address';

  const calcPasswordStrength = useCallback((pwd: string): number => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }, []);

  const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const sanitizeInput = (input: string): string => input.replace(/<[^>]*>/g, '').trim();

  const handlePasswordChange = (pwd: string) => {
    setFormData(prev => ({ ...prev, password: pwd }));
    setPasswordStrength(calcPasswordStrength(pwd));
    setError(null);
    setSubmitted(false);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 1) return { text: lang === 'ar' ? 'ضعيفة' : 'Weak', color: 'bg-destructive' };
    if (passwordStrength <= 2) return { text: lang === 'ar' ? 'مقبولة' : 'Fair', color: 'bg-amber' };
    if (passwordStrength <= 3) return { text: lang === 'ar' ? 'جيدة' : 'Good', color: 'bg-sky' };
    return { text: lang === 'ar' ? 'قوية' : 'Strong', color: 'bg-primary' };
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setSubmitted(false);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setPasswordStrength(0);
    setShowForgot(false);
    setIsResetSent(false);
    setIsResetOtpVerified(false);
    setNewPassword('');
    setConfirmNewPassword(''); // ← NEW
  };

  const switchToRegister = () => {
    resetForm();
    setIsLoginActive(false);
  };

  const switchToLogin = () => {
    resetForm();
    setIsLoginActive(true);
    setShowVerify(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    setIsLoading(true);

    try {
      if (showForgot) {
        if (!formData.email || !isValidEmail(formData.email)) {
          setError(t.enterEmail);
          setIsLoading(false);
          return;
        }
        const res = await authApi.forgotPassword({ email: formData.email });
        if (!res.ok) {
          setError(res.error || t.unexpectedError);
          setIsLoading(false);
          return;
        }
        setIsResetSent(true);
        setSuccess(t.codeSentSuccess);
        setIsLoading(false);
        return;
      }

      if (!formData.email || !formData.password) {
        setError(t.fillAllFields);
        setIsLoading(false);
        return;
      }

      const res = await authApi.login({ email: formData.email, password: formData.password });
      if (!res.ok) {
        setError(res.error || t.errorWrongPassword);
        setIsLoading(false);
        return;
      }

      const token = (res.data as any)?.token ?? (res.data as any)?.accessToken ?? null;
      const refresh = (res.data as any)?.refreshToken ?? null;
      if (token) setAuthToken(token, refresh);

    setSuccess(t.loginSuccess);
      onLogin({
        name: (res.data as any)?.user?.name || formData.email.split('@')[0],
        email: formData.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.email.split('@')[0])}&background=10b981&color=fff`,
      });
    } catch {
      setError(t.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        setError(t.fillAllFields);
        setIsLoading(false);
        return;
      }
      if (!isValidEmail(formData.email)) {
        setError(emailInvalidText);
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' : 'Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      if (formData.name.trim().length < 2) {
        setError(lang === 'ar' ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters');
        setIsLoading(false);
        return;
      }

      const res = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        // confirmPassword omitted: backend RegisterDto uses additionalProperties:false and rejects unknown fields
      });

      if (!res.ok) {
        setError(res.error || t.errorEmailExists);
        setIsLoading(false);
        return;
      }

      setPendingEmail(formData.email);
      setSuccess(lang === 'ar' ? 'تم إنشاء الحساب بنجاح. يرجى تأكيد البريد!' : 'Account created. Please verify your email!');
      setTimeout(() => {
        setShowVerify(true);
        setSuccess(null);
      }, 1500);
    } catch {
      setError(t.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verificationCode.length === 6) {
      setError(null);
      setIsLoading(true);
      const res = await authApi.verifyEmail({ email: pendingEmail, otp: verificationCode });

      if (!res.ok) {
        setError(res.error || (lang === 'ar' ? 'رمز التأكيد غير صحيح' : 'Invalid verification code'));
        setIsLoading(false);
        return;
      }

      setSuccess(lang === 'ar' ? 'تم تأكيد البريد الإلكتروني بنجاح!' : 'Email verified successfully!');
      setTimeout(() => {
        const savedEmail = formData.email;
        const savedPassword = formData.password;

        setIsLoginActive(true);
        setShowVerify(false);
        setShowForgot(false);
        setSubmitted(false);
        setError(null);
        setSuccess(null);
        setShowPassword(false);
        setVerificationCode('');

        setFormData({ name: '', email: savedEmail, password: savedPassword });
      }, 1500);
      setIsLoading(false);
    } else {
      setError(t.enterDigitCode);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (verificationCode.length === 6) {
      setError(null);
      setIsLoading(true);
      const res = await authApi.verifyResetOtp({ email: formData.email, otp: verificationCode });
      if (!res.ok) {
        setError(res.error || (lang === 'ar' ? 'رمز التأكيد غير صحيح' : 'Invalid verification code'));
        setIsLoading(false);
        return;
      }
      setSuccess(lang === 'ar' ? 'تم التحقق من الرمز بنجاح. أدخل كلمة المرور الجديدة.' : 'Code verified. Enter new password.');
      setIsResetOtpVerified(true);
      setIsLoading(false);
    } else {
      setError(t.enterDigitCode);
    }
  };

  const handleResetPassword = async () => {
    // ── Validation ──────────────────────────────────────────────────────────
    if (newPassword.length < 6) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    // ────────────────────────────────────────────────────────────────────────
    setError(null);
    setIsLoading(true);
    const res = await authApi.resetPassword({ email: formData.email, token: verificationCode, newPassword });
    if (!res.ok) {
      setError(res.error || t.unexpectedError);
      setIsLoading(false);
      return;
    }
    setSuccess(lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password reset successfully!');
    setTimeout(() => {
      setShowVerify(false);
      setShowForgot(false);
      setIsResetSent(false);
      setIsResetOtpVerified(false);
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword(''); // ← NEW
      setPendingEmail('');
      setSuccess(null);
      setFormData({ ...formData, password: newPassword });
    }, 2000);
    setIsLoading(false);
  };

  const strengthInfo = getPasswordStrengthLabel();

  const inputClass = (invalid: boolean) =>
    `w-full bg-secondary/50 border rounded-xl py-3 ps-12 pe-4 focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/50 ${invalid ? 'border-destructive' : 'border-border'}`;

  // Shared social buttons
  const SocialButtons = () => (
    <>
      <div className="flex items-center gap-3 my-5 text-muted-foreground/40">
        <hr className="flex-1 border-border" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{t.orContinueWith}</span>
        <hr className="flex-1 border-border" />
      </div>
      <div className="flex gap-4 justify-center">
        <button title="" type="button" onClick={() => {
          setIsLoading(true);
          setTimeout(() => { onLogin({ name: 'Google User', email: 'user@gmail.com', avatar: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff' }); setIsLoading(false); }, 1000);
        }} className="w-11 h-11 flex items-center justify-center bg-secondary border border-border rounded-xl hover:bg-accent hover:scale-105 active:scale-95 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        </button>
        <button title="" type="button" onClick={() => {
          setIsLoading(true);
          setTimeout(() => { onLogin({ name: 'Apple User', email: 'user@icloud.com', avatar: 'https://ui-avatars.com/api/?name=Apple+User&background=000000&color=fff' }); setIsLoading(false); }, 1000);
        }} className="w-11 h-11 flex items-center justify-center bg-secondary border border-border rounded-xl hover:bg-accent hover:scale-105 active:scale-95 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </button>
      </div>
    </>
  );

  // Verification overlay
  if (showVerify) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -end-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -start-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="glass w-full max-w-md rounded-3xl p-8 space-y-6 text-center relative z-10" style={{ animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground mb-2 font-cairo">{lang === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Your Email'}</h2>
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? `تم إرسال رمز مكون من ٦ أرقام إلى ${pendingEmail}` : `A 6-digit code was sent to ${pendingEmail}`}</p>
          </div>
          {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm font-bold"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          {success && <div className="p-3 bg-accent border border-primary/20 rounded-xl flex items-center gap-2 text-primary text-sm font-bold"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}</div>}
          <input type="text" inputMode="numeric" maxLength={6} placeholder={lang === 'ar' ? '٠٠٠٠٠٠' : '000000'} value={toArabicDigitsLang(verificationCode, lang)}
            onChange={(e) => {
              const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
              const normalized = e.target.value
                .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
                .replace(/\D/g, '')
                .slice(0, 6);
              setVerificationCode(normalized);
              setError(null);
            }}
            className="w-full bg-secondary border border-border rounded-xl py-4 px-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary text-foreground transition-all" />
          <button  onClick={handleVerifyEmail}
            className="w-full bg-gradient-brand text-primary-foreground rounded-xl py-3.5 font-black hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg">{t.verifyCode}</button>
          <button onClick={switchToLogin} className="text-muted-foreground font-bold flex items-center justify-center gap-2 mx-auto hover:underline text-sm">
            <ChevronLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.backToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0 sm:p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -end-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -start-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Top controls */}
      <div className={`absolute top-4 sm:top-6 ${lang === 'ar' ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} flex items-center gap-2 sm:gap-3 z-50`}>
        <div className="glass flex items-center p-1 rounded-2xl shadow-sm">
          <button type="button" onClick={() => setTheme('light')} className={`p-2 rounded-xl transition-all flex items-center justify-center ${theme === 'light' ? 'bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Sun className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition-all flex items-center justify-center ${theme === 'dark' ? 'bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Moon className="w-5 h-5" />
          </button>
        </div>
        <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="glass px-4 rounded-2xl text-muted-foreground hover:text-foreground hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-sm h-[48px]">
          <span className="text-xs font-black uppercase mt-0.5">{lang === 'en' ? 'AR' : 'EN'}</span>
          <Globe className="w-5 h-5" />
        </button>
      </div>

      {/* Main container */}
      <div className="w-full max-w-[1000px] min-h-[100dvh] sm:min-h-0 sm:h-[600px] relative z-10 rounded-none sm:rounded-[2rem] overflow-hidden shadow-none sm:shadow-2xl bg-card" style={{ animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

        {/* Login Form */}
        <div className={`absolute top-0 bottom-0 w-full md:w-1/2 bg-card overflow-y-auto custom-scrollbar transition-all duration-600 ${lang === 'ar' ? 'md:right-0' : 'md:left-0'} ${isLoginActive ? 'opacity-100 z-20 delay-300' : 'opacity-0 z-10 pointer-events-none'}`}>
          <div className="min-h-full flex flex-col justify-center px-6 pt-20 pb-8 sm:px-12 sm:py-6">
          {showForgot ? (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h2 className="text-3xl font-black text-foreground mb-2">{t.forgotPassword}</h2>
              <p className="text-base text-muted-foreground mb-8">{t.resetInstructions}</p>
              {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm font-bold"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              {success && <div className="mb-4 p-3 bg-accent border border-primary/20 rounded-xl flex items-center gap-2 text-primary text-sm font-bold"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}</div>}

              {isResetSent ? (
                isResetOtpVerified ? (

                  /* ── Step 3: New password + Confirm password ── */
                  <div className="space-y-5">
                    <p className="text-sm font-bold text-foreground">
                      {lang === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
                    </p>

                    {/* New password */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                        {lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                          className={`w-full bg-secondary border rounded-xl py-3 ps-12 pe-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-foreground transition-all ${
                            confirmNewPassword && newPassword !== confirmNewPassword
                              ? 'border-destructive'
                              : 'border-border'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                        {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmNewPassword}
                          onChange={(e) => { setConfirmNewPassword(e.target.value); setError(null); }}
                          className={`w-full bg-secondary border rounded-xl py-3 ps-12 pe-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary text-foreground transition-all ${
                            confirmNewPassword && newPassword !== confirmNewPassword
                              ? 'border-destructive'
                              : 'border-border'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Live feedback */}
                      {confirmNewPassword && newPassword !== confirmNewPassword && (
                        <p className="text-xs text-destructive font-medium mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                        </p>
                      )}
                      {confirmNewPassword && newPassword === confirmNewPassword && (
                        <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          {lang === 'ar' ? 'كلمتا المرور متطابقتان ✓' : 'Passwords match ✓'}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleResetPassword}
                      disabled={isLoading}
                      className="w-full bg-gradient-brand text-primary-foreground rounded-xl py-3.5 font-black hover:opacity-90 transition-all text-base"
                    >
                      {isLoading
                        ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        : (lang === 'ar' ? 'تغيير كلمة المرور' : 'Reset Password')}
                    </button>
                  </div>

                ) : (

                  /* ── Step 2: OTP verification ── */
                  <div className="space-y-5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder={lang === 'ar' ? '٠٠٠٠٠٠' : '000000'}
                      value={toArabicDigitsLang(verificationCode, lang)}
                      onChange={(e) => {
                        const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
                        const normalized = e.target.value
                          .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
                          .replace(/\D/g, '')
                          .slice(0, 6);
                        setVerificationCode(normalized);
                        setError(null);
                      }}
                      className="w-full bg-secondary border border-border rounded-xl py-4 px-4 text-center text-2xl font-black tracking-[0.4em] outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                    <button
                      onClick={handleVerifyResetOtp}
                      disabled={isLoading}
                      className="w-full bg-gradient-brand text-primary-foreground rounded-xl py-3.5 font-black hover:opacity-90 transition-all text-base"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t.verifyCode}
                    </button>
                  </div>

                )
              ) : (

                /* ── Step 1: Email input ── */
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(null); }}
                      className={inputClass(false)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-brand text-primary-foreground rounded-xl py-3.5 font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all text-base"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.sendResetLink}
                  </button>
                </form>

              )}

              <button
                onClick={() => {
                  setShowForgot(false);
                  setError(null);
                  setSuccess(null);
                  setIsResetSent(false);
                  setIsResetOtpVerified(false);
                  setVerificationCode('');
                  setNewPassword('');
                  setConfirmNewPassword(''); // ← NEW
                }}
                className="mt-5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
              >
                <ChevronLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />{t.backToLogin}
              </button>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h2 className="text-3xl font-black text-foreground mb-3">{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</h2>
              <p className="text-sm text-muted-foreground mb-8">{t.authLoginDesc}</p>
              {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm font-bold"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              {success && <div className="mb-4 p-3 bg-accent border border-primary/20 rounded-xl flex items-center gap-2 text-primary text-sm font-bold"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}</div>}
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t.emailAddress}</label>
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <input type="email" placeholder="name@company.com" value={formData.email}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(null); setSubmitted(false); }}
                      className={inputClass(submitted && !formData.email.trim())} />
                  </div>
                  {submitted && !formData.email.trim() && <p className="text-xs text-destructive font-medium mt-1">{requiredText}</p>}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.password}</label>
                    <button type="button" onClick={() => { setShowForgot(true); setError(null); setSuccess(null); setSubmitted(false); }} className="text-xs font-bold text-primary hover:underline">{t.forgot}</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                    <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password}
                      onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(null); setSubmitted(false); }}
                      className={`${inputClass(submitted && !formData.password)} pe-12`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {submitted && !formData.password && <p className="text-xs text-destructive font-medium mt-1">{requiredText}</p>}
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full bg-gradient-brand text-primary-foreground rounded-xl py-3.5 font-black flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg group text-base">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}<ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} /></>
                  )}
                </button>
              </form>
              <SocialButtons />
              <div className="md:hidden mt-6 pb-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {lang === 'ar' ? 'ليس لديك حساب؟' : "Don't have an Account?"}
                </p>
                <button type="button" onClick={switchToRegister} className="text-primary font-bold hover:underline">
                  {lang === 'ar' ? 'إنشاء حساب' : 'Register'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Register Form */}
        <div className={`absolute top-0 bottom-0 w-full md:w-1/2 bg-card overflow-y-auto custom-scrollbar transition-all duration-600 ${lang === 'ar' ? 'md:left-0' : 'md:right-0'} ${!isLoginActive ? 'opacity-100 z-20 delay-300' : 'opacity-0 z-10 pointer-events-none'}`}>
          <div className="min-h-full flex flex-col justify-center px-6 pt-20 pb-8 sm:px-12 sm:py-6">
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h2 className="text-3xl font-black text-foreground mb-3">{lang === 'ar' ? 'إنشاء حساب' : 'Registration'}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t.authRegisterDesc}</p>
            {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive text-sm font-bold"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t.fullName}</label>
                <div className="relative">
                  <User className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                  <input type="text" placeholder={lang === 'ar' ? 'محمد أحمد' : 'John Doe'} value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(null); setSubmitted(false); }}
                    className={inputClass(submitted && !formData.name.trim())} />
                </div>
                {submitted && !formData.name.trim() && <p className="text-xs text-destructive font-medium mt-1">{requiredText}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t.emailAddress}</label>
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                  <input type="email" placeholder="name@company.com" value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(null); setSubmitted(false); }}
                    className={inputClass(submitted && (!formData.email.trim() || !isValidEmail(formData.email)))} />
                </div>
                {submitted && !formData.email.trim() && <p className="text-xs text-destructive font-medium mt-1">{requiredText}</p>}
                {submitted && formData.email.trim() && !isValidEmail(formData.email) && <p className="text-xs text-destructive font-medium mt-1">{emailInvalidText}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`${inputClass(submitted && !formData.password)} pe-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {submitted && !formData.password && <p className="text-xs text-destructive font-medium mt-1">{requiredText}</p>}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthInfo.color : 'bg-secondary'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-bold ${passwordStrength <= 1 ? 'text-destructive' : passwordStrength <= 2 ? 'text-amber' : 'text-primary'}`}>{strengthInfo.text}</p>
                  </div>
                )}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full bg-gradient-brand text-primary-foreground rounded-xl py-3.5 font-black flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg group text-base">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>{lang === 'ar' ? 'إنشاء حساب' : 'Register'}<ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} /></>
                )}
              </button>
            </form>
              <SocialButtons />
              <div className="md:hidden mt-6 pb-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an Account?'}
                </p>
                <button type="button" onClick={switchToLogin} className="text-primary font-bold hover:underline">
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sliding overlay panel */}
        <div
          className="hidden md:flex absolute top-0 w-1/2 h-full z-30 flex-col"
          style={{
            [lang === 'ar' ? 'right' : 'left']: isLoginActive ? '50%' : '0%',
            transition: 'all 0.6s ease-in-out',
          }}
        >
          <div className="w-full h-full bg-gradient-brand relative overflow-hidden flex flex-col items-center justify-center text-primary-foreground p-12 text-center">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full border-[3px] border-primary-foreground/30" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full border-[3px] border-primary-foreground/20" />
              <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0 30 C 30 0 70 0 100 30 Z" fill="currentColor" opacity="0.15" />
              </svg>
            </div>

            <div className="relative z-10" key={isLoginActive ? 'login-overlay' : 'register-overlay'} style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
              <div className="flex items-center gap-4 justify-center mb-8">
                <div className="bg-primary-foreground p-3 rounded-xl shadow-lg float-3d">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                <span className="text-4xl font-black font-cairo">mudaber</span>
              </div>

              <h2 className="text-3xl font-black mb-4 leading-tight">
                {isLoginActive
                  ? (lang === 'ar' ? 'مرحباً!' : 'Hello, Welcome')
                  : (lang === 'ar' ? 'مرحباً بعودتك!' : 'Welcome Back!')}
              </h2>
              <p className="text-base opacity-90 mb-10 max-w-[320px] mx-auto leading-relaxed">
                {isLoginActive
                  ? (lang === 'ar' ? 'ليس لديك حساب؟ سجّل الآن وابدأ رحلتك المالية' : "Don't have an Account? Register now and start your financial journey")
                  : (lang === 'ar' ? 'لديك حساب بالفعل؟ سجّل دخولك الآن' : 'Already have an Account? Login now')}
              </p>

              <button
                onClick={isLoginActive ? switchToRegister : switchToLogin}
                className="px-12 py-4 rounded-xl border-2 border-primary-foreground/80 text-primary-foreground font-black text-lg hover:bg-primary-foreground/10 hover:scale-105 active:scale-95 transition-all mb-8"
              >
                {isLoginActive ? (lang === 'ar' ? 'إنشاء حساب' : 'Register') : (lang === 'ar' ? 'تسجيل الدخول' : 'Login')}
              </button>

              <div className="mt-6 flex gap-5 justify-center">
                <div className="bg-primary-foreground/10 backdrop-blur-md px-5 py-3 rounded-xl border border-primary-foreground/10 text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-lg font-black">{lang === 'ar' ? '٢,٤ ألف' : '2.4K'}</span>
                  </div>
                  <span className="text-[10px] opacity-80">{lang === 'ar' ? 'متوسط التوفير (ج.م)' : 'Avg. Savings (EGP)'}</span>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur-md px-5 py-3 rounded-xl border border-primary-foreground/10 text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-lg font-black">{lang === 'ar' ? '٪٩٨' : '98%'}</span>
                  </div>
                  <span className="text-[10px] opacity-80">{lang === 'ar' ? 'دقة التحليل' : 'Analysis Accuracy'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;