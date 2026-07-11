import { AlertTriangle, ShieldX, RefreshCw, WifiOff, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface SimulatorProps {
  onResolve: () => void;
}

export function OfflineBanner({ onResolve }: SimulatorProps) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 z-50 sticky top-0 shadow-md"
    >
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Você está visualizando o sistema no modo offline (Simulação). Algumas alterações podem não sincronizar.</span>
      <button
        onClick={onResolve}
        className="ml-3 px-2 py-0.5 bg-white text-amber-600 rounded text-xs hover:bg-amber-50 transition font-bold"
      >
        Conectar
      </button>
    </motion.div>
  );
}

export function SessionExpiredScreen({ onResolve }: SimulatorProps) {
  return (
    <div className="fixed inset-0 bg-neutral-950/25 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-neutral-150 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-6 border border-amber-100">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 tracking-tight mb-2">
          Sessão Expirada
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          Por motivos de segurança, sua sessão de login foi encerrada após um período de inatividade. Por favor, reautentique-se para continuar operando o caixa e comandas.
        </p>
        <button
          onClick={onResolve}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/10 transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Fazer Login Novamente</span>
        </button>
      </motion.div>
    </div>
  );
}

export function AccessDeniedScreen({ onResolve }: SimulatorProps) {
  return (
    <div className="fixed inset-0 bg-neutral-950/25 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-neutral-150 text-center"
      >
        <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
          <ShieldX className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 tracking-tight mb-2">
          Acesso Negado
        </h2>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          Sua conta atual não possui privilégios de Administrador ou Gerente necessários para acessar esta página financeira e relatórios de auditoria.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onResolve}
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 px-4 rounded-xl transition border border-neutral-200"
          >
            Liberar Acesso
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function ServerErrorScreen({ onResolve }: SimulatorProps) {
  return (
    <div className="fixed inset-0 bg-neutral-50 flex items-center justify-center z-50 p-4 font-mono text-left">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-2xl w-full bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xl text-neutral-800 text-xs md:text-sm leading-relaxed overflow-hidden"
      >
        <div className="flex items-center gap-2 text-rose-600 font-bold border-b border-neutral-150 pb-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
          <span>HTTP 500: INTERNAL_SERVER_ERROR</span>
        </div>

        <div className="text-neutral-600 space-y-2 mb-6 bg-neutral-50 p-4 rounded-xl border border-neutral-150 font-mono">
          <p className="text-neutral-800 font-bold">Traceback (most recent call last):</p>
          <p>File "/app/server.ts", line 144, in handleRoute</p>
          <p className="text-rose-600 font-bold">  db.connect().then(syncSchema).catch(throwConnectionError);</p>
          <p className="font-bold">DatabaseError: Connection timed out after 5000ms</p>
          <p className="text-neutral-400">  at PostgreSQLConnector.connect (/app/node_modules/pg/lib/connection.js:42)</p>
          <p className="text-neutral-400">  at async Server.init (/app/server.ts:32)</p>
        </div>

        <div className="bg-amber-50/65 p-3 rounded-xl border border-amber-100 text-amber-800 mb-6 text-xs leading-normal">
          <span className="text-amber-600 font-bold">INFO:</span> Simulação ativa de falha do servidor. Este erro simula falhas de conexão de infraestrutura física.
        </div>

        <div className="flex justify-end gap-3 font-sans">
          <button
            onClick={onResolve}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Auto-Corrigir Servidor (Self-Heal)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
