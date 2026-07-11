import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Mail, Shield, LogOut, Settings, Sparkles, Upload, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee } from '../types';
import { ViewType } from '../hooks/useAppState';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee | null;
  onUpdateProfile: (updated: Partial<Employee>) => void;
  onLogout: () => void;
  onChangeView: (view: ViewType) => void;
}

const PRESET_AVATARS = [
  { id: 'avatar1', label: 'Chef Masculino', url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&q=80' },
  { id: 'avatar2', label: 'Chef Feminina', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&q=80' },
  { id: 'avatar3', label: 'Gerente Feminina', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80' },
  { id: 'avatar4', label: 'Gerente Masculino', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' },
  { id: 'avatar5', label: 'Atendente Feminina', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80' },
  { id: 'avatar6', label: 'Atendente Masculino', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80' },
];

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onLogout,
  onChangeView
}: ProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields when modal opens
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setSelectedAvatar(currentUser.avatar || '');
    }
  }, [currentUser, isOpen]);

  if (!currentUser) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto com tamanho máximo de 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      alert('O nome e o e-mail não podem ficar em branco.');
      return;
    }

    onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      avatar: selectedAvatar
    });

    onClose();
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white border border-neutral-200 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/20">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 text-sm">Meu Perfil do Colaborador</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    {getRoleLabel(currentUser.role)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-semibold text-neutral-700">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center gap-4 bg-neutral-50/50 p-6 border border-neutral-150 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">Foto de Perfil</span>
                
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={selectedAvatar}
                    alt={currentUser.name}
                    className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover shadow-md transition-all duration-300 group-hover:brightness-90"
                  />
                  <div className="absolute inset-0 rounded-full bg-neutral-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 border border-neutral-250 text-neutral-700 bg-white rounded-xl font-black text-[10px] uppercase hover:bg-neutral-50 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Carregar Foto do Computador
                </button>
              </div>

              {/* Preset Avatars Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase text-neutral-600 tracking-wider">Escolha um Avatar Ilustrado</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = selectedAvatar === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedAvatar(preset.url)}
                        title={preset.label}
                        className={`relative rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 shrink-0 ${
                          isSelected
                            ? 'border-emerald-500 shadow-md shadow-emerald-500/20 scale-105'
                            : 'border-transparent hover:border-neutral-200'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full aspect-square object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Seu Nome Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Endereço de E-mail</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold"
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-neutral-50/20">
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-xl font-black border border-emerald-550 transition shadow-lg shadow-emerald-500/10"
              >
                Salvar Alterações
              </button>

              <button
                type="button"
                onClick={() => {
                  onChangeView('settings');
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-3 border border-neutral-250 text-neutral-700 bg-white hover:bg-neutral-50 rounded-xl font-black transition flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                Configurações da Conta
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto sm:ml-auto px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 hover:border-rose-300 rounded-xl font-black transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
