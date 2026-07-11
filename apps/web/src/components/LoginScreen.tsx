import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Lock, User, RefreshCw, Sparkles, Building2, ChevronLeft, ArrowRight, ShieldCheck, FileText, MapPin, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { Employee } from '../types';

import { TermsModal } from './TermsModal';

/** Generate a stable device fingerprint from browser environment */
async function generateDeviceFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join('|');

  try {
    const msgBuffer = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback if crypto.subtle is unavailable
    return btoa(raw).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
  }
}

const formatSlug = (val: string): string => {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // remove everything except lowercase letters and numbers (no dashes!)
};


/** Fetch public IP and location directly from client side */
async function fetchClientGeo(): Promise<{ ip: string; location: string } | null> {
  try {
    // Timeout-safe client geo fetch
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      return {
        ip: data.ip || 'unknown',
        location: data.city && data.region ? `${data.city}, ${data.region} - ${data.country_name}` : 'unknown'
      };
    }
  } catch (e) {
    // Ignore geolocation failure
  }
  return null;
}

interface LoginScreenProps {
  employees: Employee[];
  onLogin: (emp: Employee & { accessToken: string; permissions: string[]; restaurantId: string; branchId: string | null }) => void;
  onDeviceApprovalRequired: (info: { sessionId: string; restaurantId: string; restaurantSlug: string }) => void;
}

export function LoginScreen({ onLogin, onDeviceApprovalRequired }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'mfa'>('login');

  // Login form states
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // 2FA state
  const [tempToken, setTempToken] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('');

  // Register form states and steps
  const [regStep, setRegStep] = useState<number>(1);
  const [regRestName, setRegRestName] = useState<string>('');
  const [regRestSlug, setRegRestSlug] = useState<string>('');
  const [regCnpj, setRegCnpj] = useState<string>('');
  const [regNiche, setRegNiche] = useState<string>('Restaurante');
  const [regCep, setRegCep] = useState<string>('');
  const [regStreet, setRegStreet] = useState<string>('');
  const [regNumber, setRegNumber] = useState<string>('');
  const [regComplement, setRegComplement] = useState<string>('');
  const [regNeighborhood, setRegNeighborhood] = useState<string>('');
  const [regCity, setRegCity] = useState<string>('');
  const [regState, setRegState] = useState<string>('');
  const [regAdminName, setRegAdminName] = useState<string>('');
  const [regAdminEmail, setRegAdminEmail] = useState<string>('');
  const [regAdminPassword, setRegAdminPassword] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'privacy'>('terms');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  const handleOpenTerms = (tab: 'terms' | 'privacy') => {
    setTermsTab(tab);
    setIsTermsOpen(true);
  };

  // Real-time password strength validation rules
  const getPasswordStrength = (pass: string) => {
    const checks = {
      minLength: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };

    let score = 0;
    if (checks.minLength) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    return { score, checks };
  };

  const { score: regPassScore, checks: regPassChecks } = getPasswordStrength(regAdminPassword);

  const handleRestNameChange = (val: string) => {
    setRegRestName(val);
    setRegRestSlug(formatSlug(val));
  };


  const handleCnpjChange = (val: string) => {
    const cleanCnpj = val.replace(/\D/g, '').substring(0, 14);
    let masked = cleanCnpj;
    if (cleanCnpj.length > 12) {
      masked = `${cleanCnpj.substring(0, 2)}.${cleanCnpj.substring(2, 5)}.${cleanCnpj.substring(5, 8)}/${cleanCnpj.substring(8, 12)}-${cleanCnpj.substring(12)}`;
    } else if (cleanCnpj.length > 8) {
      masked = `${cleanCnpj.substring(0, 2)}.${cleanCnpj.substring(2, 5)}.${cleanCnpj.substring(5, 8)}/${cleanCnpj.substring(8)}`;
    } else if (cleanCnpj.length > 5) {
      masked = `${cleanCnpj.substring(0, 2)}.${cleanCnpj.substring(2, 5)}.${cleanCnpj.substring(5)}`;
    } else if (cleanCnpj.length > 2) {
      masked = `${cleanCnpj.substring(0, 2)}.${cleanCnpj.substring(2)}`;
    }
    setRegCnpj(masked);
  };

  const handleCepChange = async (val: string) => {
    const cleanCep = val.replace(/\D/g, '').substring(0, 8);
    let masked = cleanCep;
    if (cleanCep.length > 5) {
      masked = `${cleanCep.substring(0, 5)}-${cleanCep.substring(5)}`;
    }
    setRegCep(masked);

    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRegStreet(data.logradouro || '');
          setRegNeighborhood(data.bairro || '');
          setRegCity(data.localidade || '');
          setRegState(data.uf || '');
          setErrorMsg(null);
        } else {
          setErrorMsg('CEP não encontrado. Preencha o endereço manualmente.');
        }
      } catch (e) {
        console.error('ViaCEP error:', e);
      }
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCnpj = regCnpj.replace(/\D/g, '');
    const cleanCep = regCep.replace(/\D/g, '');

    // Validate password score first
    if (regPassScore < 5) {
      setErrorMsg('Para a sua segurança, a senha de acesso precisa ser mais forte. Por favor, inclua pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial (como @ ou #).');
      setIsLoading(false);
      return;
    }

    // Validate inputs
    if (
      !regRestName.trim() ||
      !regRestSlug.trim() ||
      cleanCnpj.length < 14 ||
      !regNiche ||
      cleanCep.length < 8 ||
      !regStreet.trim() ||
      !regNumber.trim() ||
      !regNeighborhood.trim() ||
      !regCity.trim() ||
      regState.length < 2 ||
      !regAdminName.trim() ||
      !regAdminEmail.trim()
    ) {
      setErrorMsg('Por favor, complete todas as etapas e campos obrigatórios corretamente.');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', {
        restaurantName: regRestName.trim(),
        restaurantSlug: regRestSlug.replace(/(^-|-$)/g, '').trim(),
        cnpj: cleanCnpj,
        niche: regNiche,
        addressCep: cleanCep,
        addressStreet: regStreet.trim(),
        addressNumber: regNumber.trim(),
        addressComplement: regComplement.trim(),
        addressNeighborhood: regNeighborhood.trim(),
        addressCity: regCity.trim(),
        addressState: regState.trim(),
        branchName: 'Matriz',
        adminName: regAdminName.trim(),
        adminEmail: regAdminEmail.trim(),
        adminPassword: regAdminPassword
      });

      setSuccessMsg(`Restaurante "${regRestName}" cadastrado com sucesso! Faça seu login.`);
      
      // Auto-fill login screen
      setRestaurantSlug(regRestSlug.replace(/(^-|-$)/g, '').trim());

      setEmail(regAdminEmail.trim());
      setPassword(regAdminPassword);
      
      // Reset registration form
      setRegStep(1);
      setRegRestName('');
      setRegRestSlug('');
      setRegCnpj('');
      setRegNiche('Restaurante');
      setRegCep('');
      setRegStreet('');
      setRegNumber('');
      setRegComplement('');
      setRegNeighborhood('');
      setRegCity('');
      setRegState('');
      setRegAdminName('');
      setRegAdminEmail('');
      setRegAdminPassword('');
      
      setMode('login');
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Erro ao cadastrar o restaurante. Verifique as informações fornecidas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!restaurantSlug.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      // Generate device fingerprint before sending login request
      const fingerprint = await generateDeviceFingerprint();
      const cleanedSlug = restaurantSlug.replace(/(^-|-$)/g, '').trim();
      const clientGeo = await fetchClientGeo();


      const data = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
        restaurantSlug: cleanedSlug,
        deviceFingerprint: fingerprint,
        clientIp: clientGeo?.ip,
        clientLocation: clientGeo?.location
      });

      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setMode('mfa');
        setMfaCode('');
        setIsLoading(false);
        return;
      }

      // New device needs admin approval
      if (data.requiresDeviceApproval) {
        onDeviceApprovalRequired({
          sessionId: data.deviceSessionId,
          restaurantId: data.restaurantId || '',
          restaurantSlug: cleanedSlug
        });
        setIsLoading(false);
        return;
      }


      api.token = data.accessToken;
      
      const role = data.user.permissions.includes('system:admin') ? 'admin' :
                   data.user.permissions.includes('finance:manage') ? 'manager' :
                   data.user.permissions.includes('pdv:operate') ? 'cashier' : 'waiter';

      const employee: Employee & { accessToken: string; permissions: string[]; restaurantId: string; branchId: string | null; allowedViews?: string[] } = {
        id: data.user.id,
        name: data.user.name,
        role: role,
        email: data.user.email,
        phone: '',
        status: 'active',
        shift: 'morning',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
        accessToken: data.accessToken,
        permissions: data.user.permissions,
        restaurantId: data.user.restaurantId,
        branchId: data.user.branchId,
        termsAccepted: data.user.termsAccepted,
        allowedViews: data.user.allowedViews
      };

      onLogin(employee);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Credenciais inválidas ou erro no servidor.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    if (mfaCode.trim().length !== 6 || !/^\d+$/.test(mfaCode.trim())) {
      setErrorMsg('Digite um código de 6 dígitos numéricos válido.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.post('/auth/verify-2fa', {
        tempToken,
        code: mfaCode.trim()
      });

      api.token = data.accessToken;
      
      // Determine user role from permissions
      let role: Employee['role'] = 'waiter';
      if (data.user.permissions.includes('system:admin')) {
        role = 'admin';
      } else if (data.user.permissions.includes('cash-register:manage')) {
        role = 'cashier';
      } else if (data.user.permissions.includes('menu:manage')) {
        role = 'manager';
      }

      const employee: Employee & { accessToken: string; permissions: string[]; restaurantId: string; branchId: string | null } = {
        id: data.user.id,
        name: data.user.name,
        role: role,
        email: data.user.email,
        phone: '',
        status: 'active',
        shift: 'morning',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80',
        accessToken: data.accessToken,
        permissions: data.user.permissions,
        restaurantId: data.user.restaurantId,
        branchId: data.user.branchId,
        termsAccepted: data.user.termsAccepted
      };

      localStorage.setItem('gourmet_token', data.accessToken);
      localStorage.setItem('gourmet_user', JSON.stringify(employee));

      onLogin(employee);
    } catch (err: any) {
      console.error('MFA validation error:', err);
      setErrorMsg(err.message || 'Código incorreto ou expirado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex text-neutral-800 font-sans relative overflow-hidden">
      {/* 1. Left Visual Pane (Gourmet Video/Image Background) - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 relative items-end p-16 select-none overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-y-0 -left-[10px] w-[calc(100%+20px)] h-full object-cover z-0 translate-x-[10px]"
        >
          <source src="/videos/gourmet_login_video.mp4" type="video/mp4" />
        </video>

        {/* Cinematic overlays to match the light theme page */}
        {/* Vertical fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f3f4f6]/95 via-[#f3f4f6]/30 to-[#f3f4f6]/5 z-10"></div>
        {/* Horizontal fade to blend seamlessly with the right form pane */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f3f4f6]/40 to-[#f3f4f6] z-10"></div>
        
        {/* Floating background neon spot */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-10 animate-pulse"></div>

        <div className="relative z-20 space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-8 bg-emerald-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Plataforma GourmetOS</span>
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-neutral-900 drop-shadow-sm">
            Inteligência operacional para alta gastronomia
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed font-bold">
            Gerencie comandas, mesas, estoque e fluxo de caixa em tempo real com o PDV de alta performance integrado.
          </p>
        </div>
      </div>

      {/* 2. Right Pane (Authentication Forms) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-neutral-100 relative z-10">
        {/* Mobile floating background blur */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none lg:hidden"></div>

        <motion.div
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-white border border-neutral-200 rounded-[32px] p-8 shadow-xl space-y-6 relative overflow-hidden"
        >
          {/* Header branding */}
          <div className="text-center space-y-3">
            <svg viewBox="0 0 100 100" className="w-12 h-12 mx-auto filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.15)]">
              <defs>
                <linearGradient id="logo-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <path
                d="M75,25 L35,25 C23,25 23,43 35,43 L65,43 C77,43 77,61 65,61 L25,61"
                fill="none"
                stroke="url(#logo-grad-login)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="75" cy="25" r="3.5" fill="#ffffff" />
              <circle cx="25" cy="61" r="3.5" fill="#ffffff" />
              <circle cx="35" cy="43" r="3.5" fill="#ffffff" />
            </svg>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
                Gourmet<span className="text-emerald-600 font-extrabold">OS</span>
              </h1>
              <p className="text-xs text-neutral-500 font-bold">
                {mode === 'login' ? 'Acesse o sistema integrado de comanda e PDV' : 'Registre seu estabelecimento comercial'}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-bold rounded-2xl animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold rounded-2xl animate-fadeIn">
              {successMsg}
            </div>
          )}

          {mode === 'login' ? (
            <>
              {/* Login form */}
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-neutral-600">
                {/* Restaurant Slug */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Slug do Restaurante</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      required
                      value={restaurantSlug}
                      onChange={(e) => setRestaurantSlug(formatSlug(e.target.value))}

                      autoComplete="organization"
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                      placeholder="Ex: rei-do-feijao"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">E-mail de Operador</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                      placeholder="operador@dominio.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-11 text-xs font-bold text-neutral-900 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>



                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <span>Entrar na Conta</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                >
                  Cadastrar Novo Restaurante
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : mode === 'register' ? (
            <>
              {/* Registration Form Stepper */}
              <div className="flex items-center justify-between pb-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition ${
                      regStep === step
                        ? 'bg-emerald-500 border-emerald-600 text-neutral-950 shadow-md'
                        : regStep > step
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`h-0.5 w-10 sm:w-16 rounded transition ${
                        regStep > step ? 'bg-emerald-500' : 'bg-neutral-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-xs font-semibold text-neutral-600">
                {regStep === 1 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    {/* Restaurant Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Nome Fantasia do Estabelecimento</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          required
                          value={regRestName}
                          onChange={(e) => handleRestNameChange(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Ex: Pizzaria Dom Henrique"
                        />
                      </div>
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Link de Acesso (Slug Único)</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          required
                          value={regRestSlug}
                          onChange={(e) => setRegRestSlug(formatSlug(e.target.value))}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Ex: dom-henrique"
                        />
                      </div>
                      <span className="text-[9px] text-neutral-400 block font-bold">
                        Seu link será: <strong className="text-neutral-500">http://localhost:3000/{regRestSlug || 'link'}</strong>
                      </span>
                    </div>

                    {/* CNPJ */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">CNPJ</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          required
                          maxLength={18}
                          value={regCnpj}
                          onChange={(e) => handleCnpjChange(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="00.000.000/0000-00"
                        />
                      </div>
                    </div>

                    {/* Niche */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Nicho / Categoria</label>
                      <div className="relative">
                        <UtensilsCrossed className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <select
                          value={regNiche}
                          onChange={(e) => setRegNiche(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all"
                        >
                          <option value="Restaurante">Restaurante</option>
                          <option value="Pizzaria">Pizzaria</option>
                          <option value="Hambúrgueria">Hambúrgueria</option>
                          <option value="Bar / Choperia">Bar / Choperia</option>
                          <option value="Cafeteria / Doceria">Cafeteria / Doceria</option>
                          <option value="Padaria">Padaria</option>
                          <option value="Sushi Bar">Sushi Bar</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!regRestName.trim() || !regRestSlug.trim() || regCnpj.replace(/\D/g, '').length < 14}
                      onClick={() => setRegStep(2)}
                      className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      <span>Continuar Cadastro</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {regStep === 2 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    {/* CEP */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">CEP</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          required
                          maxLength={9}
                          value={regCep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="00000-000"
                        />
                      </div>
                    </div>

                    {/* Street & Number */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Logradouro / Rua</label>
                        <input
                          type="text"
                          required
                          value={regStreet}
                          onChange={(e) => setRegStreet(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 px-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Número</label>
                        <input
                          type="text"
                          required
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 px-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    {/* Complement & Neighborhood */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Complemento</label>
                        <input
                          type="text"
                          value={regComplement}
                          onChange={(e) => setRegComplement(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 px-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Sala, Andar (opcional)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Bairro</label>
                        <input
                          type="text"
                          required
                          value={regNeighborhood}
                          onChange={(e) => setRegNeighborhood(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 px-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Bairro"
                        />
                      </div>
                    </div>

                    {/* City & State */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Cidade</label>
                        <input
                          type="text"
                          required
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 px-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="São Paulo"
                        />
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">UF</label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={regState}
                          onChange={(e) => setRegState(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 px-4 text-xs text-center font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="SP"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="w-1/3 py-3.5 px-3 border border-neutral-200 text-neutral-600 font-bold text-xs rounded-xl hover:bg-neutral-50 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        Voltar
                      </button>
                      <button
                        type="button"
                        disabled={regCep.replace(/\D/g, '').length < 8 || !regStreet.trim() || !regNumber.trim() || !regNeighborhood.trim() || !regCity.trim() || regState.length < 2}
                        onClick={() => setRegStep(3)}
                        className="w-2/3 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Avançar para Acesso</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {regStep === 3 && (
                  <div className="space-y-3.5 animate-fadeIn">
                    {/* Admin Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Nome do Administrador</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="text"
                          required
                          value={regAdminName}
                          onChange={(e) => setRegAdminName(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Nome Completo"
                        />
                      </div>
                    </div>

                    {/* Admin Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">E-mail de Cadastro</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="email"
                          required
                          value={regAdminEmail}
                          onChange={(e) => setRegAdminEmail(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="admin@restaurante.com"
                        />
                      </div>
                    </div>

                    {/* Admin Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Senha de Acesso (Senha Forte)</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-4.5 h-4.5" />
                        <input
                          type="password"
                          required
                          value={regAdminPassword}
                          onChange={(e) => setRegAdminPassword(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none transition-all placeholder-neutral-400"
                          placeholder="Sua senha forte"
                        />
                      </div>
                    </div>

                    {/* Password Strength Meter & Checklist */}
                    <div className="space-y-2.5 p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl animate-fadeIn">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                        <span className="text-neutral-500">Requisitos de Segurança</span>
                        <span className={`font-black uppercase px-2 py-0.5 rounded-full text-[8px] border ${
                          regPassScore <= 2 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                          regPassScore === 3 || regPassScore === 4 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {regAdminPassword.length === 0 ? 'Requerido' :
                           regPassScore <= 2 ? 'Muito Fraca' :
                           regPassScore === 3 ? 'Regular' :
                           regPassScore === 4 ? 'Média' : 'Forte / Segura'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9px] font-bold text-neutral-500">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${regPassChecks.minLength ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                          <span>8+ Caracteres</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${regPassChecks.uppercase ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                          <span>Letra Maiúscula</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${regPassChecks.lowercase ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                          <span>Letra Minúscula</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${regPassChecks.number ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                          <span>Número (0-9)</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${regPassChecks.special ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                          <span>Símbolo Especial (!@#$...)</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2.5 p-1">
                      <input
                        type="checkbox"
                        id="termsAccepted"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-emerald-500 focus:ring-emerald-500/20 border-neutral-300 rounded"
                      />
                      <label htmlFor="termsAccepted" className="text-[10px] text-neutral-500 leading-normal font-bold">
                        Declaro que li e concordo com os{' '}
                        <button type="button" onClick={() => handleOpenTerms('terms')} className="text-emerald-600 hover:text-emerald-700 underline font-black">Termos de Uso</button>
                        {' '}e com a{' '}
                        <button type="button" onClick={() => handleOpenTerms('privacy')} className="text-emerald-600 hover:text-emerald-700 underline font-black">Política de Privacidade</button>
                        {' '}operacional da plataforma.
                      </label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="w-1/3 py-3.5 px-3 border border-neutral-200 text-neutral-600 font-bold text-xs rounded-xl hover:bg-neutral-50 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        Voltar
                      </button>
                      <button
                        type="button"
                        disabled={isLoading || regPassScore < 5 || !termsAccepted}
                        onClick={handleRegisterSubmit}
                        className="w-2/3 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                            <span>Ativando Estabelecimento...</span>
                          </>
                        ) : (
                          <span>Criar Estabelecimento</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] font-black text-neutral-500 hover:text-neutral-800 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Voltar para o Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* MFA Verification Form */}
              <form onSubmit={handleMfaSubmit} className="space-y-4 text-xs font-semibold text-neutral-600">
                <div className="space-y-2 text-center pb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-neutral-900">Código de 2 Fatores</h3>
                  <p className="text-[10px] text-neutral-500 leading-normal font-bold">
                    Insira o código temporário de 6 dígitos gerado pelo seu aplicativo Google Authenticator.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Código de Autenticação</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl py-4 text-center text-xl font-black tracking-[0.4em] text-neutral-900 focus:outline-none transition-all placeholder-neutral-300"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      <span className="text-neutral-950">Validando código...</span>
                    </>
                  ) : (
                    <span className="text-neutral-950 font-black">Confirmar e Entrar</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setMode('login');
                    setTempToken('');
                    setMfaCode('');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] font-black text-neutral-500 hover:text-neutral-800 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Voltar para o Login
                </button>
              </div>
            </>
          )}

          {/* Footer info banner */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-start gap-2.5 text-[10px] text-neutral-500 font-bold leading-relaxed shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              {mode === 'register'
                ? 'Cadastre seu restaurante gratuitamente. Cada conta é isolada com criptografia e Row Level Security (RLS) no Supabase.'
                : mode === 'mfa'
                ? 'Verificação em duas etapas ativa. Esse código expira a cada 30 segundos no seu celular.'
                : 'Acesso seguro com JWT e Row Level Security (RLS). Certifique-se de usar o slug e e-mail cadastrados no seu restaurante.'}
            </p>
          </div>
        </motion.div>
      </div>

      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        initialTab={termsTab}
      />
    </div>
  );
}
