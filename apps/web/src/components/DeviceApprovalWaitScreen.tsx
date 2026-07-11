import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldX, Clock, Smartphone, Wifi } from 'lucide-react';
import { socketService } from '../services/socket';

interface DeviceApprovalWaitScreenProps {
  deviceSessionId: string;
  restaurantId: string;
  restaurantSlug: string;
  onApproved: (allowedViews: string[]) => void;
  onRejected: () => void;
  onCancel: () => void;
}

export function DeviceApprovalWaitScreen({
  deviceSessionId,
  restaurantId,
  restaurantSlug,
  onApproved,
  onRejected,
  onCancel
}: DeviceApprovalWaitScreenProps) {
  const [status, setStatus] = useState<'waiting' | 'approved' | 'rejected'>('waiting');
  const [dots, setDots] = useState('');

  // Animate waiting dots
  useEffect(() => {
    if (status !== 'waiting') return;
    const iv = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(iv);
  }, [status]);

  // Listen for admin WS decision
  useEffect(() => {
    // Connect socket using restaurantId as room key (no token yet, use public listener)
    const socket = socketService.connectPublic(restaurantId);

    const handleApproved = (data: { sessionId: string; allowedViews: string[] }) => {
      if (data.sessionId !== deviceSessionId) return;
      setStatus('approved');
      setTimeout(() => onApproved(data.allowedViews || []), 1800);
    };

    const handleRejected = (data: { sessionId: string }) => {
      if (data.sessionId !== deviceSessionId) return;
      setStatus('rejected');
    };

    socketService.on('device:approved', handleApproved);
    socketService.on('device:rejected', handleRejected);

    return () => {
      socketService.off('device:approved', handleApproved);
      socketService.off('device:rejected', handleRejected);
    };
  }, [deviceSessionId, restaurantId, onApproved]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-sm bg-white border border-neutral-200 rounded-[32px] p-8 shadow-2xl text-center space-y-6"
      >
        {/* Icon area */}
        <AnimatePresence mode="wait">
          {status === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Pulsing device icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center">
                  <Smartphone className="w-9 h-9 text-amber-500" />
                </div>
              </div>
              {/* Wifi waves animation */}
              <div className="flex items-end gap-1 h-6">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-emerald-500 rounded-full"
                    animate={{ height: ['6px', `${i * 6}px`, '6px'] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.15, ease: 'easeInOut' }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {status === 'approved' && (
            <motion.div
              key="approved"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
            </motion.div>
          )}

          {status === 'rejected' && (
            <motion.div
              key="rejected"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center">
                <ShieldX className="w-10 h-10 text-rose-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text content */}
        <div className="space-y-2">
          <h1 className="text-xl font-black text-neutral-900">
            {status === 'waiting' && 'Aguardando aprovação'}
            {status === 'approved' && 'Acesso aprovado!'}
            {status === 'rejected' && 'Acesso negado'}
          </h1>
          <p className="text-sm text-neutral-500 font-medium leading-relaxed">
            {status === 'waiting' && (
              <>
                Este dispositivo é novo no sistema.<br />
                O administrador foi notificado e precisa aprovar o acesso{dots}
              </>
            )}
            {status === 'approved' && 'Entrando no sistema. Aguarde um momento...'}
            {status === 'rejected' && 'O administrador negou o acesso deste dispositivo. Entre em contato para mais informações.'}
          </p>
        </div>

        {/* Status indicator */}
        {status === 'waiting' && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
              Pendente de aprovação
            </span>
          </div>
        )}

        {status === 'approved' && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
            <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
              Conectando...
            </span>
          </div>
        )}

        {/* Cancel or retry */}
        {status === 'waiting' && (
          <button
            onClick={onCancel}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition underline underline-offset-2"
          >
            Cancelar e voltar ao login
          </button>
        )}

        {status === 'rejected' && (
          <button
            onClick={onCancel}
            className="w-full py-3 px-4 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-black text-sm rounded-xl transition"
          >
            Voltar ao Login
          </button>
        )}

        {/* Branding */}
        <div className="text-[10px] text-neutral-400 font-bold border-t border-neutral-100 pt-4">
          GourmetOS · {restaurantSlug}
        </div>
      </motion.div>
    </div>
  );
}
