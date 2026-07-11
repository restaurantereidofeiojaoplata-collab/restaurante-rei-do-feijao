import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  UtensilsCrossed,
  LayoutGrid,
  Users,
  Coins,
  ArrowRight,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Order, CashRegister, Table, Employee } from '../types';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  cashRegister: CashRegister;
  tables: Table[];
  employees: Employee[];
  onChangeView: (view: any) => void;
}

export function DashboardView({ products, orders, cashRegister, tables, employees, onChangeView }: DashboardViewProps) {
  // Onboarding steps calculations
  const steps = [
    {
      id: 'products',
      title: 'Configurar Cardápio',
      description: 'Cadastre categorias e os produtos (comidas e bebidas) do estabelecimento.',
      completed: products.length > 0,
      icon: UtensilsCrossed,
      actionText: 'Ir para Cardápio',
      view: 'products'
    },
    {
      id: 'tables',
      title: 'Configurar Salão',
      description: 'Cadastre as mesas e as áreas físicas para acomodação no salão.',
      completed: tables.length > 0,
      icon: LayoutGrid,
      actionText: 'Configurar Mesas',
      view: 'tables'
    },
    {
      id: 'employees',
      title: 'Equipe Operacional',
      description: 'Adicione garçons, operadores de caixa ou gerentes no sistema.',
      completed: employees.length > 1, // 1 admin + additional workers
      icon: Users,
      actionText: 'Cadastrar Equipe',
      view: 'employees'
    },
    {
      id: 'cashRegister',
      title: 'Abertura de Caixa',
      description: 'Inicie o turno operacional abrindo o caixa com um fundo de troco.',
      completed: cashRegister.isOpen,
      icon: Coins,
      actionText: 'Gerenciar Caixa',
      view: 'finance'
    },
    {
      id: 'orders',
      title: 'Lançar Primeiro Pedido',
      description: 'Faça um pedido de teste nas mesas ou PDV para ver o sistema em ação.',
      completed: orders.length > 0,
      icon: ShoppingBag,
      actionText: 'Ir para PDV',
      view: 'pdv'
    }
  ];

  const completedStepsCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedStepsCount / steps.length) * 100);
  // Calculations
  const totalSales = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready').length;

  const averageTicket = completedOrders > 0 ? totalSales / completedOrders : 0;

  // Low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Best selling products - dynamically calculated from orders
  const salesMap: Record<string, { name: string; sales: number; revenue: number }> = {};
  orders
    .filter(o => o.paymentStatus === 'paid')
    .forEach(order => {
      order.items.forEach(item => {
        const prodName = item.product?.name || 'Item Desconhecido';
        if (!salesMap[prodName]) {
          salesMap[prodName] = { name: prodName, sales: 0, revenue: 0 };
        }
        salesMap[prodName].sales += item.quantity;
        salesMap[prodName].revenue += ((item.product?.price || 0) * item.quantity);
      });
    });

  const sortedProducts = Object.values(salesMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 4);

  const totalItemSales = sortedProducts.reduce((sum, item) => sum + item.sales, 0);

  const bestSellers = sortedProducts.map(item => ({
    name: item.name,
    sales: item.sales,
    percentage: totalItemSales > 0 ? Math.round((item.sales / totalItemSales) * 100) : 0,
    revenue: item.revenue
  }));

  // Hourly sales buckets
  const hourBuckets = [
    { label: '08:00', startHour: 8, endHour: 10, value: 0 },
    { label: '10:00', startHour: 10, endHour: 12, value: 0 },
    { label: '12:00', startHour: 12, endHour: 14, value: 0 },
    { label: '14:00', startHour: 14, endHour: 16, value: 0 },
    { label: '16:00', startHour: 16, endHour: 18, value: 0 },
    { label: '18:00', startHour: 18, endHour: 20, value: 0 },
    { label: '20:00', startHour: 20, endHour: 22, value: 0 },
    { label: '22:00', startHour: 22, endHour: 24, value: 0 },
  ];

  orders
    .filter(o => o.paymentStatus === 'paid')
    .forEach(order => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      const bucket = hourBuckets.find(b => hour >= b.startHour && hour < b.endHour);
      if (bucket) {
        bucket.value += order.total;
      }
    });

  const maxVal = Math.max(...hourBuckets.map(b => b.value), 100);

  // System logs - dynamically calculated from orders and state
  const systemLogs: { id: string; type: string; text: string; time: string; icon: any }[] = [];

  if (cashRegister.isOpen) {
    systemLogs.push({
      id: 'log_cash_open',
      type: 'success',
      text: `Turno de caixa aberto com fundo de troco de R$ ${cashRegister.initialAmount.toFixed(2)}`,
      time: 'Ativo',
      icon: CheckCircle
    });
  } else {
    systemLogs.push({
      id: 'log_cash_closed',
      type: 'warning',
      text: 'O caixa operacional encontra-se FECHADO no momento.',
      time: 'Status',
      icon: XCircle
    });
  }

  orders.slice(-2).reverse().forEach((o, index) => {
    let logText = `Pedido ${o.code} foi enviado para a cozinha.`;
    let logType = 'info';
    let logIcon = Clock;

    if (o.status === 'delivered') {
      logText = `Pedido ${o.code} pago e entregue no valor de R$ ${o.total.toFixed(2)}.`;
      logType = 'success';
      logIcon = DollarSign;
    } else if (o.status === 'ready') {
      logText = `Pedido ${o.code} está pronto para entrega.`;
      logType = 'success';
      logIcon = CheckCircle;
    } else if (o.status === 'cancelled') {
      logText = `Pedido ${o.code} foi cancelado pelo operador.`;
      logType = 'warning';
      logIcon = XCircle;
    }

    systemLogs.push({
      id: `log_ord_${o.id}_${index}`,
      type: logType,
      text: logText,
      time: new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      icon: logIcon
    });
  });

  lowStockProducts.slice(0, 1).forEach(p => {
    systemLogs.push({
      id: `log_stock_${p.id}`,
      type: 'warning',
      text: `Estoque de "${p.name}" atingiu nível crítico (${p.stock} un.)`,
      time: 'Alerta',
      icon: AlertTriangle
    });
  });

  return (
    <div className="space-y-6">
      {/* Guia de Utilização (Onboarding Guide) */}
      <div id="onboarding-guide" className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-neutral-900 flex items-center gap-2">
              Guia de Configuração e Boas-Vindas 🚀
            </h2>
            <p className="text-xs text-neutral-600 font-bold">
              Complete estes 5 passos fundamentais para configurar seu restaurante e iniciar as operações no GourmetOS.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Progresso</span>
              <p className="text-xs font-black text-neutral-800">{completedStepsCount} de 5 concluídos ({progressPercent}%)</p>
            </div>
            <div className="relative w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Onboarding Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={step.id}
                whileHover={{ y: -2 }}
                className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  step.completed
                    ? 'bg-emerald-50/20 border-emerald-500/25'
                    : 'bg-neutral-50/50 border-neutral-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      step.completed
                        ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                        : 'bg-neutral-100 border-neutral-200 text-neutral-500'
                    }`}>
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>
                    {step.completed ? (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-2.5 h-2.5" />
                        Pronto
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-150">
                        Pendente
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-neutral-950 uppercase tracking-tight">{step.title}</h4>
                    <p className="text-[10px] text-neutral-600 font-bold leading-relaxed">{step.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => onChangeView(step.view)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    step.completed
                      ? 'bg-neutral-150 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-250'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm shadow-emerald-500/5'
                  }`}
                >
                  <span>{step.completed ? 'Visualizar' : step.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div id="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI: Faturamento */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Faturamento</span>
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
              R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.4% vs ontem</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        {/* KPI: Pedidos Entregues */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Entregues hoje</span>
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
              {completedOrders}
            </h3>
            <span className="text-xs text-neutral-600 font-bold">
              {activeOrdersCount} ativos na cozinha
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </motion.div>

        {/* KPI: Ticket Médio */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ticket Médio</span>
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
              R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-emerald-700 font-extrabold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2% esta semana</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center shadow-sm">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </motion.div>

        {/* KPI: Alerta Estoque */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onChangeView('products')}
          className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition ${
            lowStockProducts.length > 0
              ? 'border-rose-300 bg-rose-50/60'
              : 'border-neutral-200'
          }`}
        >
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Alertas Estoque</span>
            <h3 className={`text-2xl font-black tracking-tight ${lowStockProducts.length > 0 ? 'text-rose-600' : 'text-neutral-900'}`}>
              {lowStockProducts.length} itens
            </h3>
            <span className="text-xs text-neutral-600 font-bold">
              {lowStockProducts.length > 0 ? 'Exige reposição imediata' : 'Tudo sob controle'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            lowStockProducts.length > 0
              ? 'bg-rose-100 border-rose-200 text-rose-700 font-bold'
              : 'bg-neutral-100 border-neutral-200 text-neutral-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Charts & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (Elegant SVG Layout) */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-base">Faturamento por Horário</h3>
              <p className="text-xs text-neutral-600 font-bold">Desempenho de vendas no dia de hoje</p>
            </div>
            <span className="text-xs font-bold text-emerald-850 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Tempo Real
            </span>
          </div>

          {/* Scrollable Container wrapper for small screens */}
          <div className="overflow-x-auto scrollbar-none pb-1">
            {/* Premium Animated SVG Bar Chart */}
            <div className="h-64 flex items-end justify-between pt-6 px-2 relative min-w-[500px] md:min-w-0">
              {/* Chart Grid Lines */}
              <div className="absolute inset-x-0 top-6 border-t border-neutral-200 text-[10px] text-neutral-600 font-bold pt-1 pointer-events-none">R$ {maxVal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div className="absolute inset-x-0 top-24 border-t border-neutral-200 text-[10px] text-neutral-600 font-bold pt-1 pointer-events-none">R$ {(maxVal * 0.75).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div className="absolute inset-x-0 top-44 border-t border-neutral-200 text-[10px] text-neutral-600 font-bold pt-1 pointer-events-none">R$ {(maxVal * 0.5).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
              <div className="absolute inset-x-0 bottom-12 border-t border-neutral-200 text-[10px] text-neutral-600 font-bold pt-1 pointer-events-none">R$ {(maxVal * 0.25).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
 
              {/* Bars */}
              {hourBuckets.map((bar, idx) => {
                const heightPercent = (bar.value / maxVal) * 80; // keep max height 80% of container
                const hasValue = bar.value > 0;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 group z-10 w-full">
                    <div className="relative w-8 sm:w-10 flex items-end h-44 justify-center">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-6 scale-0 group-hover:scale-100 transition-all duration-200 bg-neutral-900 text-white text-[10px] px-2 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                        R$ {bar.value.toFixed(2)}
                      </div>
                      {/* Bar graphic */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: idx * 0.05, duration: 0.6 }}
                        className={`w-full rounded-t-lg transition-colors border ${
                          hasValue
                            ? 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                            : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-150'
                        }`}
                      ></motion.div>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-600 whitespace-nowrap">{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Best Selling Items Sidecard */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-neutral-900 text-base flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-emerald-600 font-extrabold" />
              Mais Vendidos do Dia
            </h3>
            <p className="text-xs text-neutral-600 font-bold">Produtos com maior volume de pedidos</p>
          </div>

          <div className="space-y-4 flex-1 mt-3">
            {bestSellers.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-neutral-900 truncate max-w-[180px]">{item.name}</span>
                  <span className="text-neutral-700">{item.sales} und.</span>
                </div>
                <div className="h-2.5 w-full bg-emerald-100/40 border border-emerald-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                    className="h-full bg-emerald-600 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-600 font-bold">
                  <span>Porcentagem do total: {item.percentage}%</span>
                  <span className="font-extrabold text-neutral-900">R$ {item.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts and Live Logs Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Widget */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-base">Alerta de Insumos</h3>
              <p className="text-xs text-neutral-600 font-bold">Produtos abaixo do estoque mínimo</p>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                Atenção
              </span>
            )}
          </div>

          <div className="divide-y divide-neutral-200">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500 font-bold">
                Parabéns! Todos os produtos estão com níveis saudáveis de estoque.
              </div>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{p.name}</h4>
                      <p className="text-[10px] text-neutral-600 font-bold">{p.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 block">{p.stock} restantes</span>
                    <span className="text-[9px] text-neutral-600 font-bold">Min: {p.minStock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Auditoria / Event Logs Feed */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-neutral-900 text-base">Log de Operações Recentes</h3>
            <p className="text-xs text-neutral-600 font-bold">Auditoria instantânea de caixa e comandas</p>
          </div>

          <div className="space-y-3.5 mt-2">
            {systemLogs.map(log => {
              const LogIcon = log.icon;
              const typeColors = {
                success: 'bg-emerald-100 border border-emerald-200 text-emerald-850 font-bold',
                warning: 'bg-amber-100 border border-amber-200 text-amber-850 font-bold',
                info: 'bg-blue-100 border border-blue-200 text-blue-850 font-bold',
              };
              return (
                <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/30 transition border border-transparent hover:border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeColors[log.type as keyof typeof typeColors]}`}>
                      <LogIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-neutral-800">
                      {log.text}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-600 font-bold whitespace-nowrap">
                    {log.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
