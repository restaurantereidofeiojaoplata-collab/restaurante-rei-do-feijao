import {
  LayoutDashboard,
  ShoppingCart,
  Grid,
  CookingPot,
  Package,
  CircleDollarSign,
  Users,
  Settings,
  LogOut,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../hooks/useAppState';
import { Employee } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onChangeView: (view: ViewType) => void;
  currentUser: Employee | null;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
}

export function Sidebar({
  activeView,
  onChangeView,
  currentUser,
  onLogout,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'pdv', label: 'PDV (Caixa)', icon: ShoppingCart },
    { id: 'tables', label: 'Mesas & Comandas', icon: Grid },
    { id: 'orders', label: 'Cozinha & Pedidos', icon: CookingPot },
    { id: 'products', label: 'Estoque & Produtos', icon: Package },
    { id: 'finance', label: 'Financeiro', icon: CircleDollarSign },
    { id: 'employees', label: 'Colaboradores', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ] as const;

  // Filter menu items by allowedViews from device session if specified
  const allowed = (currentUser as any)?.allowedViews;
  const filteredMenuItems = menuItems.filter(item => {
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(item.id);
  });

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
    <aside
      id="sidebar-navigation"
      className={`hidden md:flex bg-white border-r border-neutral-200 flex-col h-screen sticky top-0 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 border-b border-neutral-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-8 h-8 shrink-0">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00BFFF" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#A44690" />
              </linearGradient>
            </defs>
            <path
              d="M75,25 L35,25 C23,25 23,43 35,43 L65,43 C77,43 77,61 65,61 L25,61"
              fill="none"
              stroke="url(#logo-grad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="75" cy="25" r="3.5" fill="#ffffff" />
            <circle cx="25" cy="61" r="3.5" fill="#ffffff" />
            <circle cx="35" cy="43" r="3.5" fill="#ffffff" />
          </svg>
          {!isCollapsed && (
            <span className="text-neutral-900 font-black text-lg tracking-tight whitespace-nowrap">
              Sistem<span className="text-emerald-600 font-extrabold">atize</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-emerald-50/60 border border-emerald-150 text-neutral-700 hover:bg-emerald-100 transition"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold transition-all group relative border ${
                isActive
                  ? 'bg-emerald-500 text-neutral-950 border-emerald-600 shadow-md shadow-emerald-500/10'
                  : 'text-neutral-600 border-transparent hover:bg-emerald-50/50 hover:text-neutral-900'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform ${!isActive && 'group-hover:scale-105'}`} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}

              {/* Tooltip on collapse */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl whitespace-nowrap border border-neutral-800">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Current Operator Footer */}
      {currentUser && (
        <div className="border-t border-neutral-200 p-4 shrink-0 bg-neutral-50/30">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-bold text-neutral-900 truncate">
                  {currentUser.name}
                </h4>
                <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider truncate">
                  {getRoleLabel(currentUser.role)}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={onLogout}
              className="w-full mt-3 p-2 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition flex justify-center"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
