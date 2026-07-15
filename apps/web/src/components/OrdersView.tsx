import { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Check,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  XCircle,
  AlertTriangle,
  FlameKindling,
  ConciergeBell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: any) => void;
}

export function OrdersView({ orders, onUpdateOrderStatus }: OrdersViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all_active' | 'pending' | 'preparing' | 'ready' | 'delivered'>('all_active');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timeTick, setTimeTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);


  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (activeFilter === 'all_active') {
      return o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
    }
    return o.status === activeFilter;
  });

  const getStatusStyle = (status: Order['status']) => {
    const styles = {
      pending: { bg: 'bg-rose-100 border-rose-250 text-rose-850 font-bold', label: 'Pendente' },
      preparing: { bg: 'bg-amber-100 border-amber-250 text-amber-900 font-bold', label: 'Em Preparo' },
      ready: { bg: 'bg-blue-100 border-blue-250 text-blue-900 font-bold', label: 'Pronto (Balcão)' },
      delivered: { bg: 'bg-emerald-100 border-emerald-250 text-emerald-800 font-bold', label: 'Entregue' },
      cancelled: { bg: 'bg-neutral-150 border-neutral-300 text-neutral-800 font-bold', label: 'Cancelado' }
    };
    return styles[status] || styles.pending;
  };

  const getActionButton = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return {
          label: 'Iniciar Preparo',
          color: 'bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black border border-emerald-550 shadow-emerald-500/10',
          nextStatus: 'preparing' as const
        };
      case 'preparing':
        return {
          label: 'Pronto (Liberar)',
          color: 'bg-blue-500 hover:bg-blue-600 text-neutral-950 font-black border border-blue-550 shadow-blue-500/10',
          nextStatus: 'ready' as const
        };
      case 'ready':
        return {
          label: 'Entregar Pedido',
          color: 'bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black border border-emerald-550 shadow-emerald-500/10',
          nextStatus: 'delivered' as const
        };
      default:
        return null;
    }
  };

  // Human friendly elapsed time
  const getElapsedTime = (isoString: string) => {
    const created = new Date(isoString).getTime();
    const now = Date.now();
    const diffMins = Math.floor((now - created) / 60000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins === 1) return 'Há 1 minuto';
    return `Há ${diffMins} minutos`;
  };

  return (
    <div className="space-y-6">
      {/* Kitchen Alert controls */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-250 font-bold">
            <FlameKindling className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-neutral-900 text-sm">Monitor da Cozinha</h3>
            <p className="text-[10px] text-neutral-600 font-bold">Controle em tempo real da linha de montagem e balcão</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition shadow-sm ${
              soundEnabled
                ? 'bg-emerald-100 border-emerald-250 text-emerald-850'
                : 'bg-neutral-100 border-neutral-250 text-neutral-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-800" /> : <VolumeX className="w-4 h-4 text-neutral-600" />}
            <span className="inline-block">{soundEnabled ? 'Campainha Ativa' : 'Campainha Silenciada'}</span>
          </button>
        </div>
      </div>

      {/* Filter Menu Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {[
          { id: 'all_active', label: 'Pedidos Ativos' },
          { id: 'pending', label: 'Aguardando Preparo' },
          { id: 'preparing', label: 'Na Cozinha' },
          { id: 'ready', label: 'Prontos para Saída' },
          { id: 'delivered', label: 'Entregues' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveFilter(btn.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 border ${
              activeFilter === btn.id
                ? 'bg-emerald-500 border-emerald-550 text-neutral-950 font-black shadow-md shadow-emerald-500/10'
                : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Orders Grid Display */}
      <div id="orders-list-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => {
            const action = getActionButton(order);
            const statusConfig = getStatusStyle(order.status);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={order.id}
                className="bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col h-[320px] justify-between overflow-hidden"
              >
                {/* Order Top Summary */}
                <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-50">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                      {order.code}
                    </span>
                    {(() => {
                      const created = new Date(order.createdAt).getTime();
                      const now = Date.now();
                      const diffMins = Math.floor((now - created) / 60000);
                      
                      let slaColor = 'text-emerald-800 bg-emerald-50 border-emerald-150';
                      if (diffMins >= 10 && diffMins < 20) {
                        slaColor = 'text-amber-800 bg-amber-50 border-amber-200';
                      } else if (diffMins >= 20) {
                        slaColor = 'text-rose-800 bg-rose-50 border-rose-200 animate-pulse';
                      }
                      
                      return (
                        <span className={`text-[9px] font-black flex items-center gap-1 px-1.5 py-0.5 rounded border ${slaColor} transition duration-300 select-none`}>
                          <Clock className="w-3 h-3" />
                          {getElapsedTime(order.createdAt)}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-black text-emerald-850 px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded-md inline-block">
                      {order.tableName || 'Venda de Balcão'}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border block ${statusConfig.bg}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Items detail central panel */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="space-y-1 pb-2 border-b border-neutral-200 last:border-none">
                      <div className="flex justify-between text-xs font-bold text-neutral-800">
                        <span>{item.quantity}x {item.product.name}</span>
                      </div>

                      {/* Additions list */}
                      {item.selectedAdditions.map((add, addIdx) => (
                        <span key={addIdx} className="inline-block text-[10px] text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded font-bold mr-2">
                          + {add.name}
                        </span>
                      ))}

                      {item.notes && (
                        <div className="mt-1 p-2 rounded-xl bg-amber-100 border border-amber-250 text-[10px] text-amber-900 font-bold italic flex items-start gap-1 shadow-sm shadow-amber-500/5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-800" />
                          <span>Obs: "{item.notes}"</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom interactive progress triggers */}
                <div className="p-4 border-t border-neutral-200 bg-neutral-50 shrink-0 flex gap-2">
                  {/* Cancel Button */}
                  {(order.status === 'pending' || order.status === 'preparing') && (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                      className="p-2.5 rounded-xl border border-neutral-250 text-neutral-750 hover:text-rose-800 hover:bg-rose-100 bg-white transition shrink-0 font-bold"
                      title="Cancelar Pedido"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  {action ? (
                    <button
                      onClick={() => {
                        // Sound click effect simulation
                        if (soundEnabled) {
                          try {
                            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(650, audioCtx.currentTime); // high ping
                            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.15);
                          } catch (e) {
                            console.log('Audio simulation blocked');
                          }
                        }
                        onUpdateOrderStatus(order.id, action.nextStatus);
                      }}
                      className={`flex-1 py-3 px-4 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg border border-transparent ${action.color}`}
                    >
                      <span>{action.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : order.status === 'delivered' ? (
                    <div className="w-full py-2.5 text-center text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-250 rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
                      <Check className="w-4 h-4 text-emerald-800 font-bold" />
                      <span>Pedido Entregue e Concluído</span>
                    </div>
                  ) : (
                    <div className="w-full py-2.5 text-center text-xs font-bold text-neutral-700 bg-neutral-100 rounded-xl border border-neutral-250">
                      <span>Sem ações disponíveis</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-neutral-600 bg-white border border-neutral-200 rounded-2xl p-6 font-bold shadow-sm">
            Não há pedidos correspondentes a este filtro no momento.
          </div>
        )}
      </div>
    </div>
  );
}
