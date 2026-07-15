import { useState, useEffect } from 'react';
import {
  Settings,
  Printer,
  Shield,
  Key,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  QrCode,
  ShieldCheck,
  User,
  Laptop,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  ChevronLeft,
  Upload
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';


interface SettingsViewProps {
  currentUser: any;
  onUpdateProfile: (updated: any) => void;
  onResetData: () => void;
  onOpenDevicePanel?: () => void;
}

export function SettingsView({ currentUser, onUpdateProfile, onResetData, onOpenDevicePanel }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'user' | 'printers' | 'security' | 'integrations' | 'devices'>('user');

  // User Profile States
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Sync profile fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Card processing fees states
  const [creditCardFee, setCreditCardFee] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gourmet_settings_credit_fee');
      return saved ? parseFloat(saved) : 2.5;
    } catch {
      return 2.5;
    }
  });
  
  const [debitCardFee, setDebitCardFee] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gourmet_settings_debit_fee');
      return saved ? parseFloat(saved) : 1.5;
    } catch {
      return 1.5;
    }
  });

  const [pixFee, setPixFee] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gourmet_settings_pix_fee');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem('gourmet_settings_credit_fee', creditCardFee.toString());
  }, [creditCardFee]);

  useEffect(() => {
    localStorage.setItem('gourmet_settings_debit_fee', debitCardFee.toString());
  }, [debitCardFee]);

  useEffect(() => {
    localStorage.setItem('gourmet_settings_pix_fee', pixFee.toString());
  }, [pixFee]);



  // Device management dashboard states
  const [deviceSessions, setDeviceSessions] = useState<any[]>([]);
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any | null>(null);
  const [viewingHistory, setViewingHistory] = useState<any | null>(null); // holds { session, logs, durationMinutes }
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editViews, setEditViews] = useState<string[]>([]);
  const [editFullAccess, setEditFullAccess] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [deviceSuccess, setDeviceSuccess] = useState<string | null>(null);

  const loadDeviceSessions = async () => {
    setDeviceLoading(true);
    setDeviceError(null);
    try {
      const data = await api.get('/device-sessions');
      setDeviceSessions(data);
    } catch (err: any) {
      setDeviceError(err.message || 'Erro ao carregar dispositivos.');
    } finally {
      setDeviceLoading(false);
    }
  };

  const loadDeviceHistory = async (device: any) => {
    setHistoryLoading(true);
    setDeviceError(null);
    try {
      const data = await api.get(`/device-sessions/${device.id}/history`);
      setViewingHistory(data);
    } catch (err: any) {
      setDeviceError(err.message || 'Erro ao carregar histórico de atividades.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveDeviceEdit = async () => {
    if (!editingDevice) return;
    setDeviceLoading(true);
    setDeviceError(null);
    setDeviceSuccess(null);
    try {
      await api.patch(`/device-sessions/${editingDevice.id}`, {
        deviceName: editName.trim() || null,
        allowedViews: editFullAccess ? [] : editViews
      });
      setDeviceSuccess('Dispositivo atualizado com sucesso!');
      setEditingDevice(null);
      loadDeviceSessions();
    } catch (err: any) {
      setDeviceError(err.message || 'Erro ao atualizar dispositivo.');
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleRevokeDevice = async (id: string) => {
    if (!confirm('Deseja realmente revogar o acesso deste dispositivo? Ele será deslogado imediatamente.')) {
      return;
    }
    setDeviceLoading(true);
    setDeviceError(null);
    try {
      await api.delete(`/device-sessions/${id}`);
      setDeviceSuccess('Acesso revogado com sucesso.');
      loadDeviceSessions();
    } catch (err: any) {
      setDeviceError(err.message || 'Erro ao revogar acesso.');
    } finally {
      setDeviceLoading(false);
    }
  };

  // Reload devices when tab is selected or changed
  useEffect(() => {
    setViewingHistory(null);
    setEditingDevice(null);
    if (activeTab === 'devices') {
      loadDeviceSessions();
    }
  }, [activeTab]);

  // Real-time profile password validation
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

  const { score: profPassScore, checks: profPassChecks } = getPasswordStrength(profilePassword);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    if (profilePassword.length > 0 && profPassScore < 5) {
      setProfileError('A nova senha informada não cumpre todos os requisitos fortes de segurança.');
      setProfileLoading(false);
      return;
    }

    try {
      const payload: any = {
        name: profileName.trim(),
        email: profileEmail.trim()
      };
      if (profilePassword.length > 0) {
        payload.password = profilePassword;
      }

      const response = await api.patch('/auth/profile', payload);

      if (response.success) {
        onUpdateProfile({
          name: response.user.name,
          email: response.user.email,
          avatar: profileAvatar
        });
        setProfilePassword('');
        setProfileSuccess('Informações de perfil atualizadas com sucesso!');
      }

    } catch (err: any) {
      console.error('Profile update error:', err);
      setProfileError(err.message || 'Erro ao atualizar informações do perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  // 2FA Configuration States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => {
    const userStr = localStorage.getItem('gourmet_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return !!user.twoFactorEnabled;
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUri: string } | null>(null);
  const [activationCode, setActivationCode] = useState<string>('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);
  const [isMfaLoading, setIsMfaLoading] = useState<boolean>(false);

  const handleStartMfaSetup = async () => {
    setIsMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(null);
    try {
      const response = await api.post('/auth/2fa/setup', {});
      setMfaSetupData(response);
    } catch (err: any) {
      console.error('2FA setup error:', err);
      setMfaError(err.message || 'Erro ao iniciar configuração do 2FA.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleConfirmMfaActivation = async () => {
    if (activationCode.trim().length !== 6 || !/^\d+$/.test(activationCode.trim())) {
      setMfaError('Digite o código de 6 dígitos numéricos gerado no celular.');
      return;
    }

    setIsMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(null);
    try {
      await api.post('/auth/2fa/activate', {
        code: activationCode.trim()
      });

      // Update user in localStorage
      const userStr = localStorage.getItem('gourmet_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.twoFactorEnabled = true;
        localStorage.setItem('gourmet_user', JSON.stringify(user));
      }

      setTwoFactorEnabled(true);
      setMfaSetupData(null);
      setActivationCode('');
      setMfaSuccess('Autenticação de Dois Fatores (2FA) ATIVADA com sucesso!');
    } catch (err: any) {
      console.error('2FA activation error:', err);
      setMfaError(err.message || 'Código incorreto ou expirado. Tente novamente.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!confirm('Deseja realmente desativar a verificação de dois fatores? Sua conta ficará menos protegida.')) {
      return;
    }

    setIsMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(null);
    try {
      await api.post('/auth/2fa/disable', {});

      // Update user in localStorage
      const userStr = localStorage.getItem('gourmet_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.twoFactorEnabled = false;
        localStorage.setItem('gourmet_user', JSON.stringify(user));
      }

      setTwoFactorEnabled(false);
      setMfaSuccess('Autenticação de Dois Fatores desativada.');
    } catch (err: any) {
      console.error('2FA disable error:', err);
      setMfaError(err.message || 'Erro ao desativar o 2FA. Tente novamente.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  // Thermal printer simulation states
  const [printerStatus, setPrinterStatus] = useState<'online' | 'offline'>('online');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printedReceipt, setPrintedReceipt] = useState<string | null>(null);

  // Form mock values
  const [storeName, setStoreName] = useState('Gourmet Pizza & Burger Lounge');
  const [storeAddress, setStoreAddress] = useState('Av. Paulista, 1000 - Bela Vista, São Paulo - SP');
  const [taxId, setTaxId] = useState('12.345.678/0001-90');
  const [apiKeyVisible, setApiKeyVisible] = useState<boolean>(false);
  const [mockApiKey, setMockApiKey] = useState('gourmet_pk_live_89sja192jhasda9u12j');

  const [terminalSerial, setTerminalSerial] = useState(() => localStorage.getItem('gourmet_terminal_serial') || '');
  const [terminalIdent, setTerminalIdent] = useState(() => localStorage.getItem('gourmet_terminal_ident') || '');
  const [terminalStatus, setTerminalStatus] = useState(() => localStorage.getItem('gourmet_terminal_serial') ? 'connected' : 'disconnected');

  const handleSaveTerminal = () => {
    if (!terminalSerial.trim() || !terminalIdent.trim()) {
      alert('Preencha o Número de Série e o Código de Identificação.');
      return;
    }
    localStorage.setItem('gourmet_terminal_serial', terminalSerial.trim());
    localStorage.setItem('gourmet_terminal_ident', terminalIdent.trim());
    setTerminalStatus('connected');
    alert('Terminal PagBank configurado com sucesso!');
  };

  const handleDisconnectTerminal = () => {
    localStorage.removeItem('gourmet_terminal_serial');
    localStorage.removeItem('gourmet_terminal_ident');
    setTerminalSerial('');
    setTerminalIdent('');
    setTerminalStatus('disconnected');
    alert('Terminal desconectado.');
  };


  // Mock simulate thermal receipt content
  const handleSimulatePrint = () => {
    setIsPrinting(true);
    setPrintedReceipt(null);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintedReceipt(`
        ================================
         GOURMET PIZZA & BURGER LOUNGE  
            CNPJ: ${taxId}       
          ${storeAddress.substring(0, 30)}...
        ================================
        COD    DESC     QTD   UNIT   TOTAL
        --------------------------------
        p1     HAMB.TRUF 2   48.90   97.80
        p5     BAT.RUSTI 1   24.90   24.90
        --------------------------------
        SUBTOTAL:             R$ 122.70
        DESCONTO (0%):         R$ 0.00
        --------------------------------
        TOTAL FATURADO:       R$ 122.70
        --------------------------------
        PAGO VIA: PIX COMPENSADO
        ================================
         Obrigado pela sua preferencia! 
             Volte sempre com saude.    
           SISTEMA GOURMETGEST V1.0.0   
        ================================
      `);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs List */}
        <div id="settings-tabs" className="bg-white border border-neutral-250 p-3 rounded-2xl shadow-sm flex flex-col gap-1 md:col-span-1 h-fit">
          {[
            { id: 'user', label: 'Minha Conta / Usuário', icon: User },
            { id: 'general', label: 'Dados do Estabelecimento', icon: Sliders },
            { id: 'printers', label: 'Impressora Térmica', icon: Printer },
            { id: 'security', label: 'Nível de Permissão', icon: Shield },
            { id: 'integrations', label: 'Integrações e APIs', icon: Key },
            ...(currentUser?.permissions?.includes('system:admin')
              ? [{ id: 'devices' as const, label: 'Dispositivos Autorizados', icon: Laptop }]
              : [])
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                  isSelected
                    ? 'bg-emerald-500 text-neutral-950 font-black border border-emerald-550 shadow-md shadow-emerald-500/10'
                    : 'text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate text-left">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-neutral-250 rounded-3xl p-6 shadow-sm md:col-span-3 min-h-[450px]">
          {/* TAB 0: User Profile Settings */}
          {activeTab === 'user' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs font-semibold">
              <div>
                <h3 className="font-black text-neutral-900 text-sm">Minha Conta / Perfil</h3>
                <p className="text-[11px] text-neutral-600 font-bold">Gerencie suas informações de acesso e atualize sua senha para manter a conta segura.</p>
              </div>

              {profileError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-2xl animate-fadeIn">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] font-bold rounded-2xl animate-fadeIn">
                  {profileSuccess}
                </div>
              )}

              <div className="space-y-4 pt-3 border-t border-neutral-200">
                {/* Photo Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl">
                  <img
                    src={profileAvatar}
                    alt={profileName}
                    className="w-16 h-16 rounded-full border-2 border-emerald-500 object-cover shrink-0"
                  />
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h4 className="text-xs font-black text-neutral-900">Foto de Perfil</h4>
                    <p className="text-[10px] text-neutral-500 font-bold">Faça upload de uma foto personalizada do seu computador (Máx 2MB).</p>
                    <button
                      type="button"
                      onClick={() => document.getElementById('settings-avatar-upload')?.click()}
                      className="mx-auto sm:mx-0 px-3.5 py-1.5 border border-neutral-250 text-neutral-700 bg-white rounded-lg font-black text-[9px] uppercase hover:bg-neutral-50 transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Fazer Upload
                    </button>
                    <input
                      type="file"
                      id="settings-avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          alert('A imagem é muito grande. Escolha uma foto com no máximo 2MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setProfileAvatar(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>

                {/* Meta details (Read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500">ID de Usuário</label>

                    <input
                      type="text"
                      disabled
                      value={currentUser?.id || ''}
                      className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-neutral-700 font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-500">Nível de Acesso (Cargo)</label>
                    <input
                      type="text"
                      disabled
                      value={
                        currentUser?.role === 'admin' ? 'Administrador' :
                        currentUser?.role === 'manager' ? 'Gerente' :
                        currentUser?.role === 'cashier' ? 'Operador de Caixa' : 'Garçom'
                      }
                      className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-neutral-700 font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Editable profile fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-700">Nome de Operador</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-700">E-mail de Cadastro</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-700">Alterar Senha (Deixe em branco para manter a atual)</label>
                  <div className="relative">
                    <input
                      type={showProfilePassword ? 'text' : 'password'}
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Nova senha forte"
                      className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 pr-11 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showProfilePassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Password strength details */}
                {profilePassword.length > 0 && (
                  <div className="space-y-2.5 p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl animate-fadeIn">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-neutral-500 tracking-wider">
                      <span>Requisitos de Segurança</span>
                      <span className={`font-black uppercase px-2 py-0.5 rounded-full text-[8px] ${
                        profPassScore <= 2 ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                        profPassScore <= 4 ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-150'
                      }`}>
                        {profPassScore <= 2 ? 'Muito Fraca' :
                         profPassScore === 3 ? 'Regular' :
                         profPassScore === 4 ? 'Média / Quase Lá' : 'Forte / Segura'}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 rounded-full transition-all duration-350 ${
                            level <= profPassScore
                              ? profPassScore <= 2
                                ? 'bg-rose-500 shadow-sm shadow-rose-500/20'
                                : profPassScore <= 4
                                ? 'bg-amber-500 shadow-sm shadow-amber-500/20'
                                : 'bg-emerald-500 shadow-sm shadow-emerald-500/20'
                              : 'bg-neutral-200'
                          }`}
                        />
                      ))}
                    </div>

                    <ul className="text-[10px] text-neutral-500 font-bold space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${profPassChecks.minLength ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className={profPassChecks.minLength ? 'text-emerald-700 font-extrabold line-through decoration-emerald-500/50' : ''}>Pelo menos 8 caracteres</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${profPassChecks.uppercase ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className={profPassChecks.uppercase ? 'text-emerald-700 font-extrabold line-through decoration-emerald-500/50' : ''}>Uma letra maiúscula (A-Z)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${profPassChecks.lowercase ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className={profPassChecks.lowercase ? 'text-emerald-700 font-extrabold line-through decoration-emerald-500/50' : ''}>Uma letra minúscula (a-z)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${profPassChecks.number ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className={profPassChecks.number ? 'text-emerald-700 font-extrabold line-through decoration-emerald-500/50' : ''}>Pelo menos um número (0-9)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${profPassChecks.special ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                        <span className={profPassChecks.special ? 'text-emerald-700 font-extrabold line-through decoration-emerald-500/50' : ''}>Um caractere especial (ex: @, #, $, %)</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={profileLoading || (profilePassword.length > 0 && profPassScore < 5)}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-500 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center gap-2 border border-emerald-650"
                >
                  {profileLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: General Store Settings */}
          {activeTab === 'general' && (
            <div className="space-y-5 text-xs font-semibold">
              <div>
                <h3 className="font-black text-neutral-900 text-sm">Dados da Unidade</h3>
                <p className="text-[11px] text-neutral-600 font-bold">Configure as informações que serão impressas no cupom fiscal das comandas.</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-neutral-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-700">Nome Fantasia do Restaurante</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-700">CNPJ / Documento Fiscal</label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-700">Cidade e Estado</label>
                    <input
                      type="text"
                      value="São Paulo - SP"
                      disabled
                      className="w-full bg-neutral-100 border border-neutral-250 rounded-xl p-3 focus:outline-none text-neutral-700 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-700">Endereço Comercial Completo</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200">
                <span className="text-[10px] font-black uppercase text-rose-800 block mb-2">Ação Destrutiva</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja apagar todo o histórico de faturamento e produtos adicionados?')) {
                      onResetData();
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 border border-rose-250 hover:bg-rose-200 text-rose-900 rounded-xl font-black transition shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Redefinir Banco de Dados de Teste</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Thermal Printer Simulation */}
          {activeTab === 'printers' && (
            <div className="space-y-6 text-xs font-semibold">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-neutral-900 text-sm">Impressão de Comprovante Térmico</h3>
                  <p className="text-[11px] text-neutral-600 font-bold">Verifique a fila física de cupons fiscais e simule impressões de fechamentos.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPrinterStatus(printerStatus === 'online' ? 'offline' : 'online')}
                    className={`px-3 py-1 border rounded-lg text-[10px] font-black transition ${
                      printerStatus === 'online'
                        ? 'border-emerald-250 bg-emerald-100 text-emerald-850'
                        : 'border-rose-250 bg-rose-100 text-rose-900'
                    }`}
                  >
                    Status: {printerStatus.toUpperCase()}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-200">
                {/* Print action box */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-neutral-700 block">Diagnósticos de Equipamento</span>

                  <div className="p-4 bg-neutral-100 border border-neutral-250 rounded-2xl space-y-2 text-neutral-800 font-bold leading-normal">
                    <p>• Impressora: <strong className="text-neutral-900 font-black">Bematech MP-4200 TH (Simulado)</strong></p>
                    <p>• Interface de comunicação: <strong className="text-neutral-900 font-black">USB / Ethernet Local TCP/IP</strong></p>
                    <p>• Velocidade de corte de bobina: <strong className="text-neutral-900 font-black">250 mm/seg (Automático)</strong></p>
                  </div>

                  <button
                    onClick={handleSimulatePrint}
                    disabled={isPrinting || printerStatus === 'offline'}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 border border-emerald-550"
                  >
                    {isPrinting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950 font-black" />
                        <span>Imprimindo bobina térmica...</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 text-neutral-950 font-black" />
                        <span>Simular Impressão Térmica de Cupom</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Thermal Receipt Visual simulation */}
                <div className="flex justify-center">
                  <div className="bg-neutral-200 p-4 rounded-3xl border border-neutral-300 max-w-sm w-full font-mono text-neutral-900 shadow-sm">
                    <span className="text-[9px] font-sans font-black uppercase text-neutral-700 block mb-2 text-center">Bobina de Saída</span>
                    <div className="bg-white text-neutral-950 border border-neutral-300 rounded-xl p-4 font-mono text-[10px] shadow-sm leading-relaxed overflow-x-auto min-h-[300px]">
                      {isPrinting ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center text-neutral-400 space-y-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                          <p className="text-[9px]">Aguardando bobina...</p>
                        </div>
                      ) : printedReceipt ? (
                        <pre className="whitespace-pre-wrap">{printedReceipt}</pre>
                      ) : (
                        <div className="h-44 flex flex-col items-center justify-center text-center text-neutral-500 space-y-2 font-sans">
                          <FileText className="w-8 h-8 text-neutral-400" />
                          <p className="text-[10px] font-black text-neutral-800">Bobina Térmica Vazia</p>
                          <p className="text-[9px] max-w-[150px] leading-normal mx-auto text-neutral-600 font-bold">Clique no botão de teste para gerar um comprovante físico simulado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Access Level */}
          {activeTab === 'security' && (
            <div className="space-y-6 text-xs font-semibold">
              <div>
                <h3 className="font-black text-neutral-900 text-sm">Controle de Segurança e Acesso</h3>
                <p className="text-[11px] text-neutral-600 font-bold">Gerencie a segurança da sua conta de administrador e visualize níveis de acesso.</p>
              </div>

              {/* Two-Factor Authentication Section */}
              <div className="p-5 border border-neutral-250 rounded-2xl bg-emerald-50/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-neutral-900 text-sm flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${twoFactorEnabled ? 'text-emerald-600' : 'text-neutral-400'}`} />
                      Autenticação de Dois Fatores (2FA)
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-bold max-w-md leading-normal">
                      Exige o aplicativo Google Authenticator para digitar um código temporário de 6 dígitos em todo login, blindando sua conta contra invasões.
                    </p>
                  </div>
                  <div>
                    {twoFactorEnabled ? (
                      <button
                        onClick={handleDisableMfa}
                        disabled={isMfaLoading}
                        className="px-4 py-2 bg-rose-100 hover:bg-rose-200 border border-rose-250 text-rose-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition disabled:opacity-50"
                      >
                        Desativar 2FA
                      </button>
                    ) : (
                      !mfaSetupData && (
                        <button
                          onClick={handleStartMfaSetup}
                          disabled={isMfaLoading}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-550 text-neutral-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition shadow-md shadow-emerald-500/10 disabled:opacity-50"
                        >
                          Ativar 2FA
                        </button>
                      )
                    )}
                  </div>
                </div>

                {mfaError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold text-[10px]">
                    {mfaError}
                  </div>
                )}

                {mfaSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-250 text-emerald-850 rounded-xl font-bold text-[10px]">
                    {mfaSuccess}
                  </div>
                )}

                {/* MFA Setup QR Code flow */}
                {mfaSetupData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="pt-4 border-t border-neutral-200 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                      <div className="flex justify-center bg-white p-3 border border-neutral-200 rounded-2xl shadow-sm">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mfaSetupData.qrCodeUri)}`}
                          alt="QR Code Google Authenticator"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-3 leading-relaxed text-neutral-700">
                        <span className="text-[10px] font-black uppercase text-emerald-700 block">Passo a Passo</span>
                        <p className="text-[10px]">
                          1. Abra o aplicativo <strong>Google Authenticator</strong> ou <strong>Authy</strong> no seu celular.
                        </p>
                        <p className="text-[10px]">
                          2. Toque no botão de adicionar (+) e selecione <strong>"Ler código QR"</strong>.
                        </p>
                        <p className="text-[10px]">
                          3. Se preferir inserir manualmente, use a chave abaixo:<br />
                          <code className="bg-neutral-100 px-2 py-1 rounded font-mono text-[11px] font-black text-neutral-900 select-all tracking-wider block mt-1 w-fit">
                            {mfaSetupData.secret}
                          </code>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center gap-3">
                      <div className="space-y-1 w-full sm:w-auto">
                        <label className="text-[10px] font-black uppercase text-neutral-500 block">Código Gerado no Celular</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={activationCode}
                          onChange={(e) => setActivationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="bg-white border border-neutral-250 rounded-xl px-4 py-2.5 text-center font-black tracking-widest text-sm focus:outline-none focus:border-emerald-500 w-full sm:w-44"
                        />
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto sm:self-end">
                        <button
                          onClick={handleConfirmMfaActivation}
                          disabled={isMfaLoading}
                          className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 border border-emerald-550 text-neutral-950 font-black rounded-xl text-[10px] uppercase tracking-wider transition w-full sm:w-auto"
                        >
                          Confirmar e Ativar
                        </button>
                        <button
                          onClick={() => setMfaSetupData(null)}
                          className="px-4 py-3 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-black rounded-xl text-[10px] uppercase tracking-wider transition w-full sm:w-auto"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider block mb-3">Hierarquia de Permissões (Roles)</span>
                <div className="space-y-3">
                  {[
                    { role: 'Administrador', access: 'Acesso total irrestrito (Relatórios, Financeiro, Produtos, Escala de Funcionários, Configurações de API)' },
                    { role: 'Gerente Geral', access: 'Acesso total, exceto redefinição destrutiva de banco de dados principal' },
                    { role: 'Operador de Caixa', access: 'Acesso exclusivo ao PDV, Sangrias e Suprimentos locais de seu turno de caixa' },
                    { role: 'Garçom / Atendente', access: 'Acesso exclusivo ao mapa de mesas e abertura de comandas locais' },
                    { role: 'Chef de Cozinha (KDS)', access: 'Acesso exclusivo ao painel da cozinha para atualização de tickets ativos' }
                  ].map((rule, idx) => (
                    <div key={idx} className="p-3 border border-neutral-250 rounded-2xl flex items-start gap-3 bg-neutral-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-850 bg-emerald-100 border border-emerald-250 p-0.5 rounded-full shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-neutral-900">{rule.role}</h4>
                        <p className="text-[10px] text-neutral-600 font-bold mt-0.5 leading-normal">{rule.access}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: API Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 text-xs font-semibold">
              <div>
                <h3 className="font-black text-neutral-900 text-sm">Integrações de Pagamentos & Maquininha PagBank</h3>
                <p className="text-[11px] text-neutral-600 font-bold">Conecte e gerencie a comunicação remota (TEF/PlugPag Cloud) com o seu terminal PagBank.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-neutral-200">
                {/* 1. Terminal PagBank Setup */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Terminal PagBank (PlugPag Cloud)</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                      terminalStatus === 'connected'
                        ? 'bg-emerald-100 border-emerald-250 text-emerald-800'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-500'
                    }`}>
                      {terminalStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Número de Série (S/N)</label>
                      <input
                        type="text"
                        value={terminalSerial}
                        onChange={(e) => setTerminalSerial(e.target.value)}
                        placeholder="Ex: 6P201153"
                        disabled={terminalStatus === 'connected'}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold disabled:opacity-75 disabled:bg-neutral-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Código de Identificação</label>
                      <input
                        type="text"
                        value={terminalIdent}
                        onChange={(e) => setTerminalIdent(e.target.value)}
                        placeholder="Ex: 57BC8E78"
                        disabled={terminalStatus === 'connected'}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold disabled:opacity-75 disabled:bg-neutral-100"
                      />
                    </div>
                  </div>

                  {terminalStatus === 'connected' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDisconnectTerminal}
                        className="w-full sm:w-auto px-4 py-2.5 bg-rose-100 border border-rose-250 hover:bg-rose-200 text-rose-900 rounded-xl font-black transition text-center"
                      >
                        Desconectar Terminal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveTerminal}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-xl font-black border border-emerald-550 transition text-center shadow-lg shadow-emerald-500/10"
                      >
                        Salvar e Conectar Terminal
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Global API Key */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-700">Chave secreta PagBank (Sandbox)</label>
                  <div className="relative">
                    <input
                      type={apiKeyVisible ? 'text' : 'password'}
                      value={mockApiKey}
                      onChange={(e) => setMockApiKey(e.target.value)}
                      className="w-full bg-emerald-50/20 border border-neutral-250 rounded-xl p-3 pr-11 font-mono focus:outline-none focus:border-emerald-500 text-neutral-900 font-black text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800"
                    >
                      {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-250 rounded-2xl flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-850 bg-emerald-100 border border-emerald-250 p-1 rounded-full shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-neutral-900 font-bold">
                    {terminalStatus === 'connected'
                      ? `Maquininha registrada (S/N: ${terminalSerial}). As transações de teste disparadas pelo PDV ou Comandas solicitarão a simulação de cartão nesse terminal físico por meio da ponte de comunicação Cloud POS.`
                      : 'Ao conectar as APIs reais e a maquininha PagBank, a comunicação ocorrerá por meio desta chave privada. Cadastre o S/N do terminal acima para iniciar os testes.'
                    }
                  </p>
                </div>

                {/* 3. Card Processing Fees Card */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4 mt-6">
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider text-emerald-800">Taxas da Máquina de Cartão & Pagamentos</h4>
                    <p className="text-[10px] text-neutral-500 font-bold">Configure as taxas cobradas pelas adquirentes para descontar dos relatórios de faturamento líquido.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Cartão de Crédito (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={creditCardFee}
                        onChange={(e) => setCreditCardFee(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                        placeholder="2.50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Cartão de Débito (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={debitCardFee}
                        onChange={(e) => setDebitCardFee(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                        placeholder="1.50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Taxa PIX (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={pixFee}
                        onChange={(e) => setPixFee(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          )}

          {/* TAB 5: Authorized Devices (Admin only) */}
          {activeTab === 'devices' && (
            <div className="space-y-6 text-xs font-semibold text-neutral-800 animate-fadeIn">
              <div>
                <h3 className="font-black text-neutral-900 text-sm">Dispositivos Autorizados</h3>
                <p className="text-[11px] text-neutral-600 font-bold">
                  Gerencie o acesso à plataforma por aparelho, controle abas liberadas e visualize histórico de atividades em tempo real.
                </p>
              </div>

              {deviceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-850 rounded-2xl animate-fadeIn">
                  {deviceError}
                </div>
              )}

              {deviceSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-2xl animate-fadeIn">
                  {deviceSuccess}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* 1. VIEW DEVICE HISTORY */}
                {viewingHistory ? (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-5"
                  >
                    {/* Back header */}
                    <div className="flex items-center justify-between border-b border-neutral-150 pb-3">
                      <button
                        type="button"
                        onClick={() => setViewingHistory(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-[11px] font-black text-neutral-700 transition cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Voltar para a Lista
                      </button>
                      <span className="text-xs text-neutral-500 font-bold">
                        Aparelho: <strong>{viewingHistory.session.device_name || 'Sem nome definido'}</strong>
                      </span>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] uppercase text-neutral-500 tracking-wider block mb-1">Operador</span>
                        <h4 className="text-xs font-black text-neutral-900 truncate">
                          {viewingHistory.session.user_name}
                        </h4>
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5 font-bold">
                          {viewingHistory.session.user_email}
                        </p>
                      </div>

                      <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] uppercase text-neutral-500 tracking-wider block mb-1">Tempo Total Ativo</span>
                        <h4 className="text-xs font-black text-emerald-700">
                          {viewingHistory.durationMinutes === 0
                            ? 'Menos de 1 minuto'
                            : viewingHistory.durationMinutes >= 60
                            ? `${Math.floor(viewingHistory.durationMinutes / 60)}h e ${viewingHistory.durationMinutes % 60}min`
                            : `${viewingHistory.durationMinutes} minutos`
                          }
                        </h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-bold">
                          De acordo com histórico de ações
                        </p>
                      </div>

                      <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-[10px] uppercase text-neutral-500 tracking-wider block mb-1">Dispositivo e IP</span>
                        <h4 className="text-xs font-black text-neutral-900 truncate">
                          {viewingHistory.session.ip_address || 'IP desconhecido'}
                        </h4>
                        <p className="text-[10px] text-neutral-500 truncate mt-0.5 font-bold">
                          📍 {viewingHistory.session.location || 'Localização desconhecida'}
                        </p>
                      </div>
                    </div>

                    {/* History logs trail */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-neutral-900 tracking-tight flex items-center gap-1.5 uppercase">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Histórico de Ações e Cliques
                      </h4>

                      <div className="bg-white border border-neutral-205 rounded-2xl overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
                        {viewingHistory.logs.length === 0 ? (
                          <div className="p-8 text-center text-neutral-500 font-bold">
                            Nenhum log operacional gravado para este dispositivo ainda.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-[10px] min-w-[600px]">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[8px] font-black">
                                <th className="p-3">Ação</th>
                                <th className="p-3">Descrição da Atividade</th>
                                <th className="p-3">IP do Evento</th>
                                <th className="p-3 text-right">Data/Hora</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-150">
                              {viewingHistory.logs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-neutral-50/55 transition font-bold">
                                  <td className="p-3 text-neutral-900 font-black">
                                    <span className="bg-neutral-105 border border-neutral-200 px-2 py-0.5 rounded text-[8px] uppercase">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="p-3 text-neutral-700 font-medium">
                                    {log.description}
                                  </td>
                                  <td className="p-3 text-neutral-500">
                                    {log.ip_address}
                                  </td>
                                  <td className="p-3 text-right text-neutral-500">
                                    {new Date(log.created_at).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : editingDevice ? (
                  /* 2. EDITING DEVICE VIEWS & NAME */
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-4 max-w-lg border border-neutral-200 p-5 rounded-2xl bg-neutral-50"
                  >
                    <h4 className="font-black text-neutral-900 text-sm">Editar Dispositivo</h4>
                    <p className="text-[10px] text-neutral-500">Altere o nome identificador ou limite quais abas do menu principal estão liberadas.</p>

                    <div className="space-y-3 pt-3 border-t border-neutral-200 text-xs">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-neutral-600">Identificador do Aparelho</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder='Ex: "Tablet Cozinha", "Celular do Atendente"'
                          className="w-full bg-white border border-neutral-250 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                        />
                      </div>

                      {/* Checkbox list */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-neutral-600">Restrição de Telas</label>
                          <button
                            type="button"
                            onClick={() => setEditFullAccess(!editFullAccess)}
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border transition cursor-pointer ${
                              editFullAccess
                                ? 'bg-emerald-100 border-emerald-350 text-emerald-800'
                                : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                            }`}
                          >
                            {editFullAccess ? 'Acesso Livre' : 'Restrito'}
                          </button>
                        </div>

                        {!editFullAccess && (
                          <div className="grid grid-cols-2 gap-2 bg-white border border-neutral-200 p-3 rounded-2xl">
                            {[
                              { code: 'dashboard', label: 'Painel Geral' },
                              { code: 'pdv', label: 'PDV (Caixa)' },
                              { code: 'tables', label: 'Mesas & Comandas' },
                              { code: 'orders', label: 'Cozinha & Pedidos' },
                              { code: 'products', label: 'Estoque & Produtos' },
                              { code: 'finance', label: 'Financeiro' },
                              { code: 'employees', label: 'Colaboradores' },
                              { code: 'settings', label: 'Configurações' },
                            ].map(v => (
                              <label key={v.code} className="flex items-center gap-2 p-1.5 cursor-pointer hover:bg-neutral-50 rounded transition font-bold text-neutral-800">
                                <input
                                  type="checkbox"
                                  checked={editViews.includes(v.code)}
                                  onChange={() => {
                                    setEditViews(prev =>
                                      prev.includes(v.code)
                                        ? prev.filter(x => x !== v.code)
                                        : [...prev, v.code]
                                    );
                                  }}
                                  className="w-4 h-4 text-emerald-500 border-neutral-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-[10px]">{v.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2.5 pt-3 border-t border-neutral-200">
                        <button
                          type="button"
                          onClick={() => setEditingDevice(null)}
                          className="flex-1 py-3 px-4 bg-white border border-neutral-250 text-neutral-700 hover:bg-neutral-50 rounded-xl transition text-center font-bold text-[11px] cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDeviceEdit}
                          className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl transition text-center text-[11px] cursor-pointer"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* 3. PRIMARY DEVICES LIST TABLE */
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {deviceLoading && deviceSessions.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                        <span className="text-[11px] font-bold">Carregando lista de aparelhos...</span>
                      </div>
                    ) : deviceSessions.length === 0 ? (
                      <div className="py-12 text-center text-neutral-500 border border-dashed border-neutral-200 rounded-3xl p-6">
                        Nenhum dispositivo cadastrado no banco ainda.
                      </div>
                    ) : (
                      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] min-w-[700px]">
                          <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[8px] font-black">
                              <th className="p-3.5">Dispositivo / Nome</th>
                              <th className="p-3.5">Operador</th>
                              <th className="p-3.5">IP e Geolocalização</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-150">
                            {deviceSessions.map((session) => (
                              <tr key={session.id} className="hover:bg-neutral-50/40 transition font-bold">
                                  <td className="p-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`p-2 rounded-xl border ${
                                        session.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                        session.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        'bg-neutral-100 text-neutral-550 border-neutral-200'
                                      }`}>
                                        {session.userAgent?.toLowerCase().includes('mobile') ? (
                                          <Smartphone className="w-4 h-4" />
                                        ) : session.userAgent?.toLowerCase().includes('tablet') ? (
                                          <Tablet className="w-4 h-4" />
                                        ) : (
                                          <Monitor className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div className="max-w-[140px] truncate">
                                        <span className="block text-neutral-900 font-black text-[11px] truncate">
                                          {session.deviceName || 'Sem nome atribuído'}
                                        </span>
                                        <span className="block text-[9px] text-neutral-400 font-medium truncate">
                                          {session.userAgent || 'unknown-agent'}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="block text-neutral-850 font-black">{session.userName}</span>
                                    <span className="block text-[9px] text-neutral-500 font-medium">{session.userEmail}</span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className="block text-neutral-800">{session.ipAddress}</span>
                                    <span className="block text-[9px] text-neutral-500 font-medium flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                                      {session.location || 'Localização não identificada'}
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-wider ${
                                      session.status === 'PENDING' ? 'bg-amber-50 text-amber-750 border-amber-200' :
                                      session.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-750 border-emerald-200' :
                                      session.status === 'REJECTED' ? 'bg-rose-50 text-rose-750 border-rose-200' :
                                      'bg-neutral-50 text-neutral-500 border-neutral-200'
                                    }`}>
                                      {session.status === 'PENDING' ? 'Pendente' :
                                       session.status === 'APPROVED' ? 'Aprovado' :
                                       session.status === 'REJECTED' ? 'Rejeitado' : 'Revogado'}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                                    <button
                                      type="button"
                                      disabled={historyLoading}
                                      onClick={() => loadDeviceHistory(session)}
                                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-lg text-[9px] font-black transition cursor-pointer"
                                      title="Ver logs e histórico"
                                    >
                                      Histórico
                                    </button>

                                    {session.status === 'APPROVED' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingDevice(session);
                                            setEditName(session.deviceName || '');
                                            setEditViews(session.allowedViews || []);
                                            setEditFullAccess((session.allowedViews || []).length === 0);
                                          }}
                                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 rounded-lg text-[9px] font-black transition cursor-pointer"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRevokeDevice(session.id)}
                                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[9px] font-black transition cursor-pointer"
                                        >
                                          Revogar
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
