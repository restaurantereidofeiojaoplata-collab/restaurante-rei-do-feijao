import { useState, FormEvent } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Calendar,
  Lock,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee } from '../types';
import { AdminPasswordModal } from './AdminPasswordModal';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (emp: any) => void;
  onUpdateEmployee: (id: string, updated: any) => void;
  onDeleteEmployee: (id: string) => void;
  verifyAdminPassword: (password: string, action: string, description: string) => Promise<void>;
}

export function EmployeesView({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  verifyAdminPassword
}: EmployeesViewProps) {
  // Sub-tabs: 'list' | 'ponto'
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'ponto'>('list');

  // Delete authorization state (Enriched)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteAuth, setShowDeleteAuth] = useState(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'waiter' | 'chef' | 'cashier'>('waiter');
  const [shift, setShift] = useState<'morning' | 'evening' | 'night' | 'off'>('morning');

  // Punch card (ponto) simulation states
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [clockLogs, setClockLogs] = useState([
    { id: 'l1', employeeName: 'Lúcia Helena (Chef)', timestamp: '2026-07-05 07:02:15', type: 'Entrada', ip: '192.168.1.100 (Terminal Principal)', status: 'Verificado - GPS Ativo' },
    { id: 'l2', employeeName: 'Matheus Guimarães (Atendente)', timestamp: '2026-07-05 07:15:30', type: 'Entrada', ip: '192.168.1.102 (Tablet Salão)', status: 'Verificado - GPS Ativo' },
    { id: 'l3', employeeName: 'Lúcia Helena (Chef)', timestamp: '2026-07-05 15:05:12', type: 'Saída', ip: '192.168.1.100 (Terminal Principal)', status: 'Verificado - GPS Ativo' }
  ]);

  const getRoleLabel = (r: Employee['role']) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente Geral',
      waiter: 'Atendente / Garçom',
      chef: 'Chef de Cozinha',
      cashier: 'Operador de Caixa'
    };
    return labels[r] || r;
  };
  const getShiftBadge = (s: Employee['shift']) => {
    const badges = {
      morning: { bg: 'bg-amber-100 text-amber-900 border-amber-250', label: 'Matutino (07h-15h)' },
      evening: { bg: 'bg-indigo-100 text-indigo-900 border-indigo-250', label: 'Vespertino (15h-23h)' },
      night: { bg: 'bg-violet-100 text-violet-900 border-violet-250', label: 'Noturno (23h-07h)' },
      off: { bg: 'bg-neutral-150 text-neutral-800 border-neutral-300', label: 'Folga Escalar' }
    };
    return badges[s] || badges.off;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onAddEmployee({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '(11) 99999-0000',
      role,
      status: 'active',
      shift,
      avatar: `https://images.unsplash.com/photo-${[
        '1534528741775-53994a69daeb',
        '1539571696357-5a69c17a67c6',
        '1506794778202-cad84cf45f1d',
        '1492562080023-ab3db95bfbce'
      ][Math.floor(Math.random() * 4)]}?w=120&q=80` // Pick nice avatar randomly
    });

    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setShowAddModal(false);
  };

  const handleRegisterPunch = (type: 'Entrada' | 'Saída') => {
    if (!selectedEmpId) return;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const newLog = {
      id: `l_${Date.now()}`,
      employeeName: `${emp.name} (${getRoleLabel(emp.role)})`,
      timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
      type,
      ip: '192.168.1.100 (Terminal Principal IP Local)',
      status: 'Verificado - Biometria / Token FaceID'
    };

    setClockLogs([newLog, ...clockLogs]);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs header */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'list'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Equipe & Escalas
        </button>
        <button
          onClick={() => setActiveSubTab('ponto')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'ponto'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Registro de Ponto Eletrônico
        </button>
      </div>

      {activeSubTab === 'list' ? (
        <div className="space-y-6">
          {/* KPI header */}
          <div className="bg-white border border-neutral-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-850 flex items-center justify-center border border-emerald-250">
                <Users className="w-5 h-5 font-bold" />
              </div>
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Escala de Colaboradores</h3>
                <p className="text-[10px] text-neutral-600 font-bold">Controle de turnos, cargos e permissões administrativas</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-1.5 border border-emerald-550"
            >
              <Plus className="w-4 h-4 font-black" />
              <span>Cadastrar Colaborador</span>
            </button>
          </div>

          {/* Grid of Employees */}
          <div id="employees-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employees.map((emp) => {
              const shiftConfig = getShiftBadge(emp.shift);
              return (
                <motion.div
                  whileHover={{ y: -2 }}
                  key={emp.id}
                  className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-neutral-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 overflow-hidden">
                      <h4 className="font-extrabold text-sm text-neutral-900 truncate">{emp.name}</h4>
                      <div className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        <Briefcase className="w-3 h-3 text-emerald-850" />
                        <span>{getRoleLabel(emp.role)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 text-[11px] font-bold text-neutral-700 border-t border-b border-neutral-200 py-3.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{emp.phone}</span>
                    </div>
                  </div>

                  {/* Shift status */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block">Turno do Dia</span>
                      <span className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-bold ${shiftConfig.bg}`}>
                        {shiftConfig.label}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newStatus = emp.status === 'active' ? 'inactive' : 'active';
                          onUpdateEmployee(emp.id, { status: newStatus });
                        }}
                        className={`p-1.5 rounded-lg border transition ${
                          emp.status === 'active'
                            ? 'bg-emerald-100 border-emerald-250 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 border-rose-250 text-rose-800 hover:bg-rose-200'
                        }`}
                        title={emp.status === 'active' ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
                      >
                        {emp.status === 'active' ? <UserCheck className="w-4 h-4 font-bold" /> : <UserX className="w-4 h-4 font-bold" />}
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTargetId(emp.id);
                          setShowDeleteAuth(true);
                        }}
                        className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 border border-neutral-250 text-rose-600 hover:text-rose-700 hover:border-rose-300 transition"
                        title="Remover Registro"
                      >
                        <UserX className="w-4 h-4 text-rose-700 font-bold" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ponto digital interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4 lg:col-span-1">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Registrar Ponto</h3>
                <p className="text-[10px] text-neutral-600 font-bold">Punch digital com geolocalização e IP corporativo de segurança</p>
              </div>

              {/* Dynamic Live Time */}
              <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl text-center space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-850">Relógio Oficial de Ponto</span>
                <h4 className="text-3xl font-black text-neutral-900 tracking-wider">
                  {new Date().toLocaleTimeString('pt-BR')}
                </h4>
                <span className="text-[9px] text-emerald-700 block font-bold">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Selecione o Colaborador</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    <option value="">-- Escolha um Colaborador --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({getRoleLabel(e.role)})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!selectedEmpId}
                    onClick={() => handleRegisterPunch('Entrada')}
                    className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-neutral-950 font-black text-xs rounded-xl shadow transition"
                  >
                    Registrar Entrada
                  </button>
                  <button
                    disabled={!selectedEmpId}
                    onClick={() => handleRegisterPunch('Saída')}
                    className="py-3 px-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow transition"
                  >
                    Registrar Saída
                  </button>
                </div>
              </div>
            </div>

            {/* Logs List Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden lg:col-span-2">
              <div className="p-4 border-b border-neutral-150">
                <h3 className="font-extrabold text-neutral-900 text-sm">Espelho de Ponto Eletrônico</h3>
                <p className="text-[10px] text-neutral-600 font-bold">Histórico consolidado do dia de hoje para auditoria fiscal</p>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-50/50 text-neutral-750 uppercase text-[9px] font-black border-b border-neutral-200">
                      <th className="py-3.5 px-4">Colaborador</th>
                      <th className="py-3.5 px-4">Horário de Batida</th>
                      <th className="py-3.5 px-4">Ação</th>
                      <th className="py-3.5 px-4">Localizador IP</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800 font-semibold">
                    {clockLogs.map(log => (
                      <tr key={log.id} className="hover:bg-neutral-50/50 border-b border-neutral-100">
                        <td className="py-3.5 px-4 font-bold text-neutral-900">{log.employeeName}</td>
                        <td className="py-3.5 px-4 text-neutral-500 font-bold">{log.timestamp}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                            log.type === 'Entrada'
                              ? 'bg-emerald-100 border-emerald-250 text-emerald-850'
                              : 'bg-rose-100 border-rose-250 text-rose-800'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-neutral-600 font-bold">{log.ip}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-[10px] font-black text-emerald-800">{log.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List Layout */}
              <div className="block md:hidden divide-y divide-neutral-100">
                {clockLogs.map(log => (
                  <div key={log.id} className="p-4 space-y-3 hover:bg-neutral-50/50 transition">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-neutral-900 text-xs">{log.employeeName}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        log.type === 'Entrada'
                          ? 'bg-emerald-100 border-emerald-250 text-emerald-850'
                          : 'bg-rose-100 border-rose-250 text-rose-800'
                      }`}>
                        {log.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                      <div>
                        <span className="text-[9px] uppercase font-black text-neutral-400 block mb-0.5">Horário</span>
                        <span className="text-neutral-600">{log.timestamp}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-black text-neutral-400 block mb-0.5">Localizador IP</span>
                        <span className="text-neutral-600 truncate block">{log.ip}</span>
                      </div>
                    </div>

                    <div className="border-t border-neutral-50 pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-[9px] uppercase font-black text-neutral-400">Status do Registro</span>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM DIALOG */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-neutral-950/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-250 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition border border-transparent hover:border-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-extrabold text-neutral-900 text-base mb-1">Cadastrar Novo Colaborador</h3>
              <p className="text-xs text-neutral-600 font-bold mb-5">Adicione os dados profissionais do novo membro da equipe</p>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Matheus Guimarães"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Email institucional</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: matheus@gourmet.com"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Telefone celular</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: (11) 98888-7777"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Role */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Cargo</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                    >
                      <option value="waiter">Atendente / Garçom</option>
                      <option value="chef">Chef de Cozinha</option>
                      <option value="cashier">Operador de Caixa</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {/* Shift */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Escala de Turno</label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value as any)}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                    >
                      <option value="morning">Matutino (07h-15h)</option>
                      <option value="evening">Vespertino (15h-23h)</option>
                      <option value="night">Noturno (23h-07h)</option>
                      <option value="off">Folga</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl shadow-lg shadow-emerald-500/10 transition mt-2 border border-emerald-550"
                >
                  Registrar Colaborador
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AdminPasswordModal
        isOpen={showDeleteAuth}
        onClose={() => {
          setShowDeleteAuth(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async (password: string) => {
          const targetEmp = employees.find(e => e.id === deleteTargetId);
          const empName = targetEmp ? targetEmp.name : 'Colaborador';
          await verifyAdminPassword(
            password,
            'delete_employee',
            `Excluiu o colaborador "${empName}" (ID: ${deleteTargetId})`
          );
          if (deleteTargetId) {
            onDeleteEmployee(deleteTargetId);
          }
        }}
        description="Digite a senha do administrador para autorizar a exclusão definitiva deste colaborador do cadastro do estabelecimento."
      />
    </div>
  );
}
