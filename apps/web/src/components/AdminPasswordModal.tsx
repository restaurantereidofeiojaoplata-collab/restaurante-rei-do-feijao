import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function AdminPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Autorização Requerida",
  description = "Digite a senha do administrador para autorizar a exclusão deste item e gerar o registro no histórico de auditoria."
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err?.message || "Senha incorreta ou erro na autorização do administrador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4 animate-fadeIn">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-neutral-200 shadow-2xl space-y-4 relative"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 border border-rose-250 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse text-rose-750" />
              </div>
              <div>
                <h3 className="font-black text-neutral-900 text-sm">{title}</h3>
                <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider">Ação de Auditoria</p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 font-semibold leading-relaxed">
              {description}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-neutral-600">Senha do Administrador *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-rose-50/10 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 transition text-neutral-900 font-bold"
                />
              </div>

              {error && (
                <div className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-750 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {loading ? 'Validando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
