import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldX,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  Laptop
} from 'lucide-react';
import { api } from '../services/api';

interface DeviceSession {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  location: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  allowedViews: string[];
  requestedAt: string;
  resolvedAt: string | null;
  userName: string;
  userEmail: string;
}

interface DeviceRequestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
  onPendingCountChange: (count: number) => void;
}

const ALL_VIEWS = [
  { code: 'dashboard', label: 'Painel Geral' },
  { code: 'pdv', label: 'PDV (Caixa)' },
  { code: 'tables', label: 'Mesas & Comandas' },
  { code: 'orders', label: 'Cozinha & Pedidos' },
  { code: 'products', label: 'Estoque & Produtos' },
  { code: 'finance', label: 'Financeiro' },
  { code: 'employees', label: 'Colaboradores' },
  { code: 'settings', label: 'Configurações' },
];

function detectDeviceType(ua: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop';
  const lower = ua.toLowerCase();
  if (/tablet|ipad/.test(lower)) return 'tablet';
  if (/mobile|android|iphone/.test(lower)) return 'mobile';
  return 'desktop';
}

function DeviceIcon({ ua }: { ua: string | null }) {
  const type = detectDeviceType(ua);
  const cls = 'w-5 h-5';
  if (type === 'mobile') return <Smartphone className={cls} />;
  if (type === 'tablet') return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(date).toLocaleDateString('pt-BR');
}

interface ApproveFormProps {
  session: DeviceSession;
  onDone: () => void;
}

function ApproveForm({ session, onDone }: ApproveFormProps) {
  const [deviceName, setDeviceName] = useState(session.deviceName || '');
  const [allowedViews, setAllowedViews] = useState<string[]>([]); // empty = full access
  const [fullAccess, setFullAccess] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleView = (code: string) => {
    setAllowedViews(prev =>
      prev.includes(code) ? prev.filter(v => v !== code) : [...prev, code]
    );
  };

  const handleApprove = async () => {
    if (!adminPassword.trim()) {
      setError('Digite a senha de administrador.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/device-sessions/${session.id}/approve`, {
        adminPassword,
        deviceName: deviceName.trim() || null,
        allowedViews: fullAccess ? [] : allowedViews
      });
      onDone();
    } catch (err: any) {
      setError(err.message || 'Erro ao aprovar dispositivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!adminPassword.trim()) {
      setError('Digite a senha de administrador para rejeitar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/device-sessions/${session.id}/reject`, { adminPassword });
      onDone();
    } catch (err: any) {
      setError(err.message || 'Erro ao rejeitar dispositivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Device name */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
          Nome do dispositivo <span className="text-neutral-400 font-medium normal-case">(opcional)</span>
        </label>
        <div className="relative">
          <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={deviceName}
            onChange={e => setDeviceName(e.target.value)}
            placeholder='Ex: "Celular do João", "Tablet da Cozinha"'
            className="w-full pl-9 pr-4 py-2.5 text-xs font-bold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-emerald-500 transition placeholder-neutral-400"
          />
        </div>
      </div>

      {/* Access restrictions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
            Abas permitidas
          </label>
          <button
            type="button"
            onClick={() => setFullAccess(!fullAccess)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition border ${
              fullAccess
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-neutral-100 border-neutral-200 text-neutral-600'
            }`}
          >
            {fullAccess ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {fullAccess ? 'Acesso total' : 'Personalizado'}
          </button>
        </div>

        {!fullAccess && (
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_VIEWS.map(view => (
              <button
                key={view.code}
                type="button"
                onClick={() => toggleView(view.code)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-[10px] font-bold border transition ${
                  allowedViews.includes(view.code)
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                }`}
              >
                <div className={`w-3 h-3 rounded border flex items-center justify-center transition ${
                  allowedViews.includes(view.code)
                    ? 'bg-emerald-500 border-emerald-600'
                    : 'border-neutral-300'
                }`}>
                  {allowedViews.includes(view.code) && (
                    <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                {view.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Admin password */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
          Senha do Administrador
        </label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type={showPass ? 'text' : 'password'}
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            placeholder="Confirme com sua senha"
            className="w-full pl-9 pr-9 py-2.5 text-xs font-bold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-xl">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black text-xs rounded-xl transition"
        >
          <ShieldX className="w-3.5 h-3.5" />
          Rejeitar
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          Aprovar
        </button>
      </div>
    </div>
  );
}

export function DeviceRequestsPanel({ isOpen, onClose, pendingCount, onPendingCountChange }: DeviceRequestsPanelProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/device-sessions/pending' : '/device-sessions';
      const data = await api.get(endpoint);
      setSessions(data);
      const pending = data.filter((s: DeviceSession) => s.status === 'PENDING').length;
      onPendingCountChange(pending);
    } catch (err) {
      console.error('Failed to load device sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadSessions();
  }, [isOpen, activeTab]);

  const handleDone = () => {
    setExpandedId(null);
    loadSessions();
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/device-sessions/${id}`);
      loadSessions();
    } catch (err: any) {
      console.error('Revoke failed:', err);
    }
  };

  const statusBadge = (status: DeviceSession['status']) => {
    const map = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
      APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
      REVOKED: 'bg-neutral-100 text-neutral-600 border-neutral-300',
    };
    const labels = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado', REVOKED: 'Revogado' };
    return (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${map[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-neutral-200 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="h-16 border-b border-neutral-200 px-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center">
                  <Laptop className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-neutral-900">Dispositivos</h2>
                  {pendingCount > 0 && (
                    <p className="text-[10px] font-bold text-amber-600">
                      {pendingCount} aguardando aprovação
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSessions}
                  disabled={loading}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                  title="Atualizar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 shrink-0">
              {(['pending', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition ${
                    activeTab === tab
                      ? 'text-emerald-700 border-b-2 border-emerald-500'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {tab === 'pending' ? `Pendentes${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'Todos'}
                </button>
              ))}
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-bold">Carregando...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
                  <Shield className="w-10 h-10 text-neutral-300" />
                  <span className="text-sm font-bold">
                    {activeTab === 'pending' ? 'Nenhum pedido pendente' : 'Nenhum dispositivo registrado'}
                  </span>
                </div>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.id}
                    className={`rounded-2xl border overflow-hidden transition ${
                      session.status === 'PENDING'
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    {/* Session card header */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          session.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          session.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-neutral-100 text-neutral-500'
                        }`}>
                          <DeviceIcon ua={session.userAgent} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="text-xs font-black text-neutral-900 truncate">
                              {session.deviceName || 'Dispositivo desconhecido'}
                            </h3>
                            {statusBadge(session.status)}
                          </div>
                          <p className="text-[11px] font-bold text-neutral-600 mt-0.5 truncate">
                            {session.userName} · {session.userEmail}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500 font-medium flex-wrap">
                            {session.ipAddress && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-500" />
                                <span>
                                  {session.location ? `${session.location} (${session.ipAddress})` : session.ipAddress}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeAgo(session.requestedAt)}
                            </span>
                          </div>
                          {session.userAgent && (
                            <p className="text-[10px] text-neutral-400 mt-1 truncate font-medium">
                              {session.userAgent}
                            </p>
                          )}
                        </div>

                        {/* Expand/collapse */}
                        <button
                          onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition shrink-0"
                        >
                          {expandedId === session.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                          }
                        </button>
                      </div>

                      {/* Allowed views chips */}
                      {session.status === 'APPROVED' && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {session.allowedViews.length === 0 ? (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Acesso total
                            </span>
                          ) : (
                            session.allowedViews.map(v => {
                              const label = ALL_VIEWS.find(x => x.code === v)?.label || v;
                              return (
                                <span key={v} className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  {label}
                                </span>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded action zone */}
                    <AnimatePresence>
                      {expandedId === session.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-neutral-200"
                        >
                          <div className="p-4 bg-white">
                            {session.status === 'PENDING' ? (
                              <ApproveForm session={session} onDone={handleDone} />
                            ) : session.status === 'APPROVED' ? (
                              <button
                                onClick={() => handleRevoke(session.id)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black text-xs rounded-xl transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Revogar acesso deste dispositivo
                              </button>
                            ) : (
                              <p className="text-center text-xs text-neutral-500 font-bold py-2">
                                Nenhuma ação disponível para este status.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
