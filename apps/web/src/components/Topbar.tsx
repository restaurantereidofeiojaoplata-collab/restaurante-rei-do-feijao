import { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Tv,
  Wifi,
  WifiOff,
  Sliders,
  DollarSign,
  Coffee,
  X,
  Play,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  HelpCircle,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../hooks/useAppState';
import { Notification, CashRegister, Order, Product } from '../types';

interface TopbarProps {
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
  cashRegister: CashRegister;
  orders: Order[];
  products: Product[];
  notifications: Notification[];
  isOffline: boolean;
  isSessionExpired: boolean;
  isAccessDenied: boolean;
  is500Error: boolean;
  isDarkMode: boolean;
  pendingDeviceCount: number;
  onOpenDevicePanel: () => void;
  isAdmin?: boolean;

  onToggleOffline: () => void;
  onToggleSessionExpired: () => void;
  onToggleAccessDenied: () => void;
  onToggle500Error: () => void;
  onToggleTheme: () => void;
  onResetData: () => void;
  onCreateRandomOrder: () => void;
  onMarkNotificationsRead: () => void;
  onClearNotifications: () => void;
}

export function Topbar({
  activeView,
  onChangeView,
  cashRegister,
  orders,
  products,
  notifications,
  isOffline,
  isSessionExpired,
  isAccessDenied,
  is500Error,
  isDarkMode,
  pendingDeviceCount,
  onOpenDevicePanel,
  isAdmin,

  onToggleOffline,
  onToggleSessionExpired,
  onToggleAccessDenied,
  onToggle500Error,
  onToggleTheme,
  onResetData,
  onCreateRandomOrder,
  onMarkNotificationsRead,
  onClearNotifications
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const viewTitles: Record<ViewType, string> = {
    dashboard: 'Painel Geral',
    pdv: 'PDV (Ponto de Venda)',
    tables: 'Controle de Mesas & Comandas',
    orders: 'Monitor da Cozinha & Pedidos',
    products: 'Catálogo de Produtos & Estoque',
    employees: 'Gestão de Colaboradores',
    finance: 'Fluxo de Caixa & Financeiro',
    settings: 'Configurações e Integração'
  };

  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-neutral-200 bg-white sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-2">
      {/* Title */}
      <div className="flex items-center gap-2 overflow-hidden min-w-0">
        <h1 className="text-xs sm:text-sm md:text-xl font-extrabold text-neutral-900 tracking-tight truncate">
          {viewTitles[activeView]}
        </h1>

        {/* Real-time sync status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Sincronizado</span>
        </div>
      </div>

      {/* Quick stats & action widgets */}
      <div id="topbar-actions" className="flex items-center gap-4">
        {/* Cash Status */}
        <button
          onClick={() => onChangeView('finance')}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
            cashRegister.isOpen
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-emerald-500/5'
              : 'bg-rose-100 border-rose-300 text-rose-800 shadow-rose-500/5'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 shrink-0" />
          <span>
            {cashRegister.isOpen
              ? `Caixa Aberto: R$ ${cashRegister.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'Caixa Fechado'}
          </span>
        </button>

        {/* Active orders */}
        <button
          onClick={() => onChangeView('orders')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-100 transition shadow-sm"
        >
          <Coffee className="w-3.5 h-3.5 shrink-0 text-emerald-600 font-extrabold" />
          <span>{activeOrdersCount} Pendentes</span>
        </button>

        {/* Connection status (only visible when offline to keep UI clean) */}
        {isOffline && (
          <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-100 text-amber-900 shadow-sm animate-pulse">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Offline</span>
          </div>
        )}

        {/* Simulator Toggle Panel Button */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sim') === 'true' && (
          <button
            onClick={() => setShowSimulator(true)}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition shadow-sm"
            title="Simulador de falhas e testes"
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
          </button>
        )}

        {/* Iniciar Tour Guiado */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('gourmet_start_tour'));
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-neutral-800 text-xs font-bold hover:bg-neutral-100 transition shadow-sm cursor-pointer"
          title="Iniciar Tour Guiado de Utilização"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tour</span>
        </button>

        {/* Device access requests badge (admin only) */}
        {isAdmin && (
          <button
            onClick={onOpenDevicePanel}
            className={`relative p-2 rounded-xl border transition shadow-sm ${
              pendingDeviceCount > 0
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 animate-pulse'
                : 'border-neutral-200 text-neutral-800 hover:bg-neutral-100'
            }`}
            title={
              pendingDeviceCount > 0
                ? `${pendingDeviceCount} dispositivo(s) aguardando aprovação`
                : 'Gerenciar Dispositivos Autorizados'
            }
          >
            <Laptop className="w-4 h-4" />
            {pendingDeviceCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                {pendingDeviceCount}
              </span>
            )}
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) onMarkNotificationsRead();
            }}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition relative shadow-sm"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* Notifications Menu */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-neutral-250 rounded-2xl shadow-2xl z-40 overflow-hidden"
                >
                  <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                    <h3 className="font-extrabold text-neutral-900 text-sm">Notificações</h3>
                    <button
                      onClick={onClearNotifications}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                    >
                      Limpar tudo
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-neutral-200">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-neutral-500 font-bold">
                        Nenhuma notificação recente
                      </div>
                    ) : (
                      notifications.map(n => {
                        const colors: Record<Notification['type'], string> = {
                          info: 'bg-blue-100/80 text-blue-800 border border-blue-200',
                          success: 'bg-emerald-100/80 text-emerald-800 border border-emerald-200',
                          warning: 'bg-amber-100/80 text-amber-800 border border-amber-200',
                          error: 'bg-rose-100/80 text-rose-800 border border-rose-200'
                        };
                        const colorClass = colors[n.type];
                        return (
                          <div key={n.id} className="p-3.5 hover:bg-emerald-50/40 transition flex gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${colorClass.split(' ')[1]?.replace('text-', 'bg-') || ''}`} />
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-neutral-900">{n.title}</h4>
                              <p className="text-[11px] text-neutral-600 mt-0.5 leading-normal font-medium">{n.message}</p>
                              <span className="text-[9px] text-neutral-500 font-bold mt-1 block">
                                {new Date(n.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-out Simulator Control Center */}
      <AnimatePresence>
        {showSimulator && (
          <>
            <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-40" onClick={() => setShowSimulator(false)}></div>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-neutral-200 text-neutral-800 p-6 shadow-2xl z-50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-neutral-150 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-base tracking-tight text-neutral-800">Central do Simulador</span>
                  </div>
                  <button
                    onClick={() => setShowSimulator(false)}
                    className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-neutral-500 mb-5 leading-normal">
                  Utilize os controles abaixo para forçar cenários reais de erros de infraestrutura e comportamentos do sistema:
                </p>

                {/* Simulated States Toggles */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-150 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-700">Modo Offline</span>
                      <span className="text-[10px] text-neutral-500">Simula perda de conexão Wi-Fi</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isOffline}
                      onChange={onToggleOffline}
                      className="sr-only peer"
                      id="sim-offline"
                    />
                    <label
                      htmlFor="sim-offline"
                      className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative cursor-pointer"
                    ></label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-150 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-700">Sessão Expirada (401)</span>
                      <span className="text-[10px] text-neutral-500">Tempo limite de ociosidade</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSessionExpired}
                      onChange={onToggleSessionExpired}
                      className="sr-only peer"
                      id="sim-session"
                    />
                    <label
                      htmlFor="sim-session"
                      className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative cursor-pointer"
                    ></label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-150 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-700">Acesso Restrito (403)</span>
                      <span className="text-[10px] text-neutral-500">Contas sem permissão</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAccessDenied}
                      onChange={onToggleAccessDenied}
                      className="sr-only peer"
                      id="sim-denied"
                    />
                    <label
                      htmlFor="sim-denied"
                      className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 relative cursor-pointer"
                    ></label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-150 rounded-xl">
                    <div className="flex flex-col text-rose-600">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                        Erro Crítico 500
                      </span>
                      <span className="text-[10px] text-neutral-500">Falha geral do servidor</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={is500Error}
                      onChange={onToggle500Error}
                      className="sr-only peer"
                      id="sim-500"
                    />
                    <label
                      htmlFor="sim-500"
                      className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500 relative cursor-pointer"
                    ></label>
                  </div>
                </div>

                {/* Instant Actions */}
                <div className="space-y-3">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">Ações Rápidas</span>

                  <button
                    onClick={() => {
                      onCreateRandomOrder();
                      setShowSimulator(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Receber Pedido Simulado
                    </span>
                    <Play className="w-3 h-3 fill-current" />
                  </button>

                  <button
                    onClick={() => {
                      onResetData();
                      setShowSimulator(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition border border-neutral-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resetar Todos Dados (Mock)</span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 text-center border-t border-neutral-150 pt-4">
                Desenvolvedor • Sistematize Frontend Premium
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
