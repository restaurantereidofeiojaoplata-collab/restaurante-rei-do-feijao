import { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Grid,
  CookingPot,
  Menu,
  CircleDollarSign,
  Package,
  Users,
  Settings,
  User,
  HelpCircle,
  LogOut,
  X,
  Sparkles,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../hooks/useAppState';
import { Employee } from '../types';

interface BottomNavigationProps {
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
  currentUser: Employee | null;
  onLogout: () => void;
}

export function BottomNavigation({
  activeView,
  onChangeView,
  currentUser,
  onLogout
}: BottomNavigationProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Active items shown directly on the bottom navigation
  const primaryItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'pdv', label: 'PDV', icon: ShoppingCart },
    { id: 'tables', label: 'Mesas', icon: Grid },
    { id: 'orders', label: 'Pedidos', icon: CookingPot },
  ] as const;

  // Items shown inside the Bottom Sheet "Mais"
  const secondaryItems = [
    { id: 'finance', label: 'Financeiro', icon: CircleDollarSign, desc: 'Faturamento, sangrias e conciliação' },
    { id: 'products', label: 'Estoque & Produtos', icon: Package, desc: 'Gestão de catálogo, insumos e estoque' },
    { id: 'employees', label: 'Colaboradores', icon: Users, desc: 'Turnos, escalas e ponto digital' },
    { id: 'settings', label: 'Configurações', icon: Settings, desc: 'Ajustes globais do sistema' },
  ] as const;

  // Filter navigation items by allowedViews from device session if specified
  const allowed = (currentUser as any)?.allowedViews;
  const filteredPrimaryItems = primaryItems.filter(item => {
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(item.id);
  });
  const filteredSecondaryItems = secondaryItems.filter(item => {
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(item.id);
  });

  const handlePrimaryClick = (id: ViewType) => {
    onChangeView(id);
    setShowBottomSheet(false);
  };

  const handleSecondaryClick = (id: ViewType) => {
    onChangeView(id);
    setShowBottomSheet(false);
  };

  const getRoleLabel = (role: Employee['role']) => {
    const roles: Record<Employee['role'], string> = {
      admin: 'Administrador',
      manager: 'Gerente Geral',
      waiter: 'Atendente',
      chef: 'Chef de Cozinha',
      cashier: 'Operador de Caixa'
    };
    return roles[role] || role;
  };

  return (
    <>
      {/* Fixed Bottom Navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-250 dark:border-neutral-850 z-40 px-3 pb-[env(safe-area-inset-bottom,16px)] pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-3xl">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {filteredPrimaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id && !showBottomSheet;

            return (
              <button
                key={item.id}
                onClick={() => handlePrimaryClick(item.id)}
                className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative select-none group focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Active back pill */}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-emerald-500/10 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                {/* Animated Icon wrapper */}
                <motion.div
                  whileTap={{ scale: 0.9, y: 1 }}
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive ? 'text-emerald-600' : 'text-neutral-500 group-hover:text-neutral-800'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.25]" />
                </motion.div>

                {/* Text Label */}
                <span
                  className={`text-[10px] font-black tracking-tight mt-0.5 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-neutral-600'
                  }`}
                >
                  {item.label}
                </span>

                {/* Micro Dot on Active */}
                {isActive && (
                  <motion.span
                    layoutId="activeDot"
                    className="w-1 h-1 rounded-full bg-emerald-600 absolute bottom-0.5"
                  />
                )}
              </button>
            );
          })}

          {/* "Mais" Menu Button */}
          <button
            onClick={() => setShowBottomSheet(!showBottomSheet)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative select-none group focus:outline-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {showBottomSheet && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-emerald-500/15 rounded-2xl -z-10"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <motion.div
              whileTap={{ scale: 0.9, y: 1 }}
              className={`p-1.5 rounded-xl transition-colors ${
                showBottomSheet ? 'text-emerald-600' : 'text-neutral-500 group-hover:text-neutral-800'
              }`}
            >
              <Menu className="w-5 h-5 stroke-[2.25]" />
            </motion.div>

            <span
              className={`text-[10px] font-black tracking-tight mt-0.5 transition-colors ${
                showBottomSheet ? 'text-emerald-700' : 'text-neutral-600'
              }`}
            >
              Mais
            </span>
          </button>
        </div>
      </div>

      {/* Slide-up Bottom Sheet */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            {/* Backdrop layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBottomSheet(false)}
              className="fixed inset-0 bg-neutral-950 z-40 md:hidden"
            />

            {/* Bottom Sheet wrapper */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-neutral-900 border-t border-neutral-250 dark:border-neutral-800 rounded-t-[32px] z-50 md:hidden flex flex-col overflow-hidden shadow-2xl shadow-neutral-950/40"
            >
              {/* Top notch drag handle bar indicator */}
              <div className="w-full py-3 flex justify-center items-center cursor-pointer shrink-0" onClick={() => setShowBottomSheet(false)}>
                <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
              </div>

              {/* Bottom sheet content area */}
              <div className="flex-1 overflow-y-auto px-6 pb-24 pt-1 space-y-6">
                {/* Operator Profile details summary */}
                {currentUser && (
                  <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-11 h-11 rounded-full border-2 border-emerald-500 object-cover shadow"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-black text-neutral-900">
                          {currentUser.name}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3 h-3 text-emerald-800" />
                          <span className="text-[10px] text-emerald-850 font-black uppercase tracking-wider">
                            {getRoleLabel(currentUser.role)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-lg shadow-sm">
                      Online
                    </span>
                  </div>
                )}

                {/* Navigation lists */}
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                    Menu Completo do Sistema
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    {filteredSecondaryItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSecondaryClick(item.id)}
                          className={`w-full flex items-center gap-4 p-3.5 rounded-2xl text-left border transition-all ${
                            isActive
                              ? 'bg-emerald-500 text-neutral-950 border-emerald-600 shadow-md'
                              : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-150 text-neutral-800'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl border ${
                            isActive ? 'bg-emerald-600 text-neutral-950 border-emerald-700' : 'bg-white text-emerald-600 border-neutral-200 shadow-sm'
                          }`}>
                            <Icon className="w-5 h-5 stroke-[2.25]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-xs font-black tracking-tight">
                              {item.label}
                            </span>
                            <span className={`block text-[10px] truncate ${
                              isActive ? 'text-neutral-800 font-bold' : 'text-neutral-600'
                            }`}>
                              {item.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Utilities section */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                    Ajuda e Conta
                  </h3>

                  <div className={`grid ${(!allowed || allowed.length === 0 || allowed.includes('settings')) ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
                    <button
                      onClick={() => {
                        alert('Nossa equipe de suporte técnico está disponível em suporte@sistematize.com.br');
                        setShowBottomSheet(false);
                      }}
                      className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col gap-1.5 items-start text-left text-neutral-800 text-xs font-bold transition hover:bg-neutral-100 w-full"
                    >
                      <HelpCircle className="w-5 h-5 text-neutral-500" />
                      <span>Ajuda & Suporte</span>
                    </button>

                    {(!allowed || allowed.length === 0 || allowed.includes('settings')) && (
                      <button
                        onClick={() => {
                          onChangeView('settings');
                          setShowBottomSheet(false);
                        }}
                        className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex flex-col gap-1.5 items-start text-left text-neutral-800 text-xs font-bold transition hover:bg-neutral-100"
                      >
                        <Settings className="w-5 h-5 text-neutral-500" />
                        <span>Configurações</span>
                      </button>
                    )}
                  </div>
                </div>


                {/* Sign out utility */}
                <div className="pt-4">
                  <button
                    onClick={() => {
                      onLogout();
                      setShowBottomSheet(false);
                    }}
                    className="w-full py-4 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-black rounded-2xl transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.5]" />
                    <span>Sair do Turno / Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
