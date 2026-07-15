import { useState, FormEvent, useEffect } from 'react';
import { api } from '../services/api';
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
  Lock,
  Unlock,
  Calendar,
  Layers,
  FileText,
  User,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CashRegister, CashTransaction } from '../types';


interface FinanceViewProps {
  cashRegister: CashRegister;
  onOpenCashRegister: (amount: number) => void;
  onCloseCashRegister: () => void;
  onAddCashTransaction: (type: 'in' | 'out', amount: number, desc: string, cat: any) => void;
  bills: any[];
  onAddBill: (bill: any) => void;
  onToggleBillStatus: (id: string) => void;
  onDeleteBill: (id: string) => void;
  orders: any[];
}

export function FinanceView({
  cashRegister,
  onOpenCashRegister,
  onCloseCashRegister,
  onAddCashTransaction,
  bills = [],
  onAddBill,
  onToggleBillStatus,
  onDeleteBill,
  orders = []
}: FinanceViewProps) {
  // Sub-tabs: 'cashflow' | 'bills' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'cashflow' | 'bills' | 'reports'>('cashflow');

  const [dbTransactions, setDbTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await api.get('/payments/transactions');
      if (Array.isArray(data)) {
        setDbTransactions(data);
      }
    } catch (e) {
      console.error('Erro ao buscar transações:', e);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeSubTab]);


  // Opening drawer initial amount state
  const [openingAmount, setOpeningAmount] = useState<number>(0);

  // Supply / withdrawal dialog state
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [txAmount, setTxAmount] = useState<number>(100);
  const [txDesc, setTxDesc] = useState<string>('');
  const [txCategory, setTxCategory] = useState<'supply' | 'withdrawal' | 'expense'>('supply');

  // Bills UI modal state
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState(100);
  const [billDueDate, setBillDueDate] = useState('2026-07-15');
  const [billType, setBillType] = useState<'payable' | 'receivable'>('payable');
  const [billCategory, setBillCategory] = useState('Geral');

  // Calculations
  const salesCount = orders.filter(o => o.paymentStatus === 'paid').length;
  const totalSales = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const totalSupplies = cashRegister.transactions
    .filter(t => t.category === 'supply')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = cashRegister.transactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calc actual credit/debit/pix totals with fees deduction
  const totalPix = cashRegister.transactions
    .filter(t => t.category === 'sale' && t.description.toLowerCase().includes('pix'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCreditCard = cashRegister.transactions
    .filter(t => t.category === 'sale' && (t.description.toLowerCase().includes('credit') || t.description.toLowerCase().includes('crédito')))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebitCard = cashRegister.transactions
    .filter(t => t.category === 'sale' && (t.description.toLowerCase().includes('debit') || t.description.toLowerCase().includes('débito')))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalGenericCard = cashRegister.transactions
    .filter(t => t.category === 'sale' && (t.description.toLowerCase().includes('card') || t.description.toLowerCase().includes('cartão')) && !t.description.toLowerCase().includes('credit') && !t.description.toLowerCase().includes('crédito') && !t.description.toLowerCase().includes('debit') && !t.description.toLowerCase().includes('débito'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCard = totalCreditCard + totalDebitCard + totalGenericCard;

  const totalCashSales = cashRegister.transactions
    .filter(t => t.category === 'sale' && !t.description.toLowerCase().includes('pix') && !t.description.toLowerCase().includes('card') && !t.description.toLowerCase().includes('cartão') && !t.description.toLowerCase().includes('credit') && !t.description.toLowerCase().includes('crédito') && !t.description.toLowerCase().includes('debit') && !t.description.toLowerCase().includes('débito'))
    .reduce((sum, t) => sum + t.amount, 0);

  // Calcule dynamic card processing fees from transactions list
  const totalProcessingFees = dbTransactions
    .filter(tx => tx.status === 'APPROVED')
    .reduce((sum, tx) => {
      const amount = tx.amountInCents / 100;
      const isPix = tx.provider === 'PIX' || tx.providerTransactionId?.toLowerCase().includes('pix') || tx.rawPayload?.provider === 'PIX';
      const isCredit = tx.rawPayload?.method === 'CREDIT' || tx.providerTransactionId?.toLowerCase().includes('credit') || tx.rawPayload?.provider === 'CREDIT';

      let feePercent = 0;
      if (tx.cardMachineId && tx.cardMachineName) {
        // Use joined card machine fees
        if (isPix) feePercent = tx.pixFee;
        else if (isCredit) feePercent = tx.creditFee;
        else feePercent = tx.debitFee;
      } else {
        // Fallback to global setting percents
        const creditFeePercent = parseFloat(localStorage.getItem('gourmet_settings_credit_fee') || '2.5');
        const debitFeePercent = parseFloat(localStorage.getItem('gourmet_settings_debit_fee') || '1.5');
        const pixFeePercent = parseFloat(localStorage.getItem('gourmet_settings_pix_fee') || '0');

        if (isPix) feePercent = pixFeePercent;
        else if (isCredit) feePercent = creditFeePercent;
        else feePercent = debitFeePercent;
      }

      return sum + (amount * (feePercent / 100));
    }, 0);


  const cashAmount = (cashRegister.isOpen ? cashRegister.initialAmount : 0) + totalSupplies + totalCashSales - totalWithdrawals;


  const handleOpenRegister = (e: FormEvent) => {
    e.preventDefault();
    onOpenCashRegister(Number(openingAmount));
  };

  const handleCreateTransaction = (e: FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0 || !txDesc.trim()) return;

    onAddCashTransaction(txType, Number(txAmount), txDesc.trim(), txCategory);
    setShowTransactionModal(false);
    setTxAmount(100);
    setTxDesc('');
  };

  const handleTriggerTxModal = (type: 'in' | 'out') => {
    setTxType(type);
    setTxCategory(type === 'in' ? 'supply' : 'withdrawal');
    setShowTransactionModal(true);
  };

  const handleAddBill = (e: FormEvent) => {
    e.preventDefault();
    if (!billTitle.trim() || billAmount <= 0) return;

    onAddBill({
      title: billTitle.trim(),
      amount: Number(billAmount),
      dueDate: billDueDate,
      type: billType,
      category: billCategory
    });
    setBillTitle('');
    setBillAmount(100);
    setShowAddBillModal(false);
  };

  const handleToggleBillStatus = (billId: string) => {
    onToggleBillStatus(billId);
  };

  const handleDeleteBill = (billId: string) => {
    onDeleteBill(billId);
  };


  // CSV Exporter for Transactions
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Data;Tipo;Categoria;Descricao;Operador;Valor\r\n';
      
      cashRegister.transactions.forEach(t => {
        const typeStr = t.type === 'in' ? 'Entrada' : 'Saida';
        const formattedDate = new Date(t.timestamp).toLocaleDateString('pt-BR');
        const row = `"${formattedDate}";"${typeStr}";"${t.category}";"${t.description.replace(/"/g, '""')}";"${t.operator}";"${t.amount.toFixed(2)}"`;
        csvContent += row + '\r\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `DRE_FluxoCaixa_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('CSV export failure', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual top bar for tabs */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('cashflow')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'cashflow'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Caixa Operacional & Extrato
        </button>
        <button
          onClick={() => setActiveSubTab('bills')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'bills'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Contas a Pagar & Receber
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          DRE & Relatórios de Gestão
        </button>
      </div>

      {activeSubTab === 'cashflow' && (
        <div className="space-y-6">
          {/* 1. Cash Register Open/Close Controller */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Register State Card */}
            <div id="finance-cash-card" className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-neutral-900 text-sm">Caixa Operacional</h3>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                  cashRegister.isOpen
                    ? 'bg-emerald-100 border-emerald-250 text-emerald-800'
                    : 'bg-rose-100 border-rose-250 text-rose-800'
                }`}>
                  {cashRegister.isOpen ? 'Aberto' : 'Fechado'}
                </span>
              </div>

              {cashRegister.isOpen ? (
                <div className="space-y-5">
                  <div className="space-y-1 text-center bg-emerald-50/50 p-4 rounded-2xl border border-emerald-150">
                    <span className="text-[10px] font-black uppercase text-emerald-800">Saldo Atual em Dinheiro</span>
                    <h4 className="text-2.5xl font-black text-emerald-950">
                      R$ {cashRegister.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h4>
                    {cashRegister.openedAt && (
                      <span className="text-[9px] text-emerald-700 block font-bold">
                        Aberto em: {new Date(cashRegister.openedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTriggerTxModal('in')}
                      className="py-2.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-250 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Suprimento</span>
                    </button>
                    <button
                      onClick={() => handleTriggerTxModal('out')}
                      className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-850 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-rose-250 shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                      <span>Sangria</span>
                    </button>
                  </div>

                  <button
                    onClick={onCloseCashRegister}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 hover:text-rose-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-neutral-250 shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Fechar Turno de Caixa</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOpenRegister} className="space-y-4">
                  <div className="p-4 bg-rose-100 border border-rose-250 text-rose-900 rounded-2xl flex items-start gap-2.5 shadow-sm shadow-rose-500/5">
                    <Lock className="w-5 h-5 shrink-0 mt-0.5 text-rose-700 font-bold" />
                    <p className="text-[11px] leading-relaxed font-bold">
                      O Caixa está fechado. Para faturar pedidos no PDV e mesas, você deve abrir um novo turno informando o fundo de troco inicial.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-600 uppercase">Fundo de troco inicial (R$)</label>
                    <input
                       type="number"
                       min="0"
                       required
                       value={openingAmount}
                       onChange={(e) => setOpeningAmount(Number(e.target.value))}
                       className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4 text-neutral-950 font-black" />
                    <span>Abrir Turno do Caixa</span>
                  </button>
                </form>
              )}
            </div>

            {/* Sales Conciliation Overview Sidecard */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Resumo da Conciliação de Vendas</h3>
                <p className="text-xs text-neutral-600 font-bold">Conciliação em tempo real agregada por canais de pagamento</p>
              </div>

              {/* Conciliation cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 my-3">
                {[
                  { label: 'Total Dinheiro', value: cashAmount, icon: DollarSign, color: 'text-emerald-800 bg-emerald-100 border border-emerald-250 shadow-sm' },
                  { label: 'Compensado PIX', value: totalPix, icon: FileText, color: 'text-teal-850 bg-teal-100 border border-teal-250 shadow-sm' },
                  { label: 'Cartões SmartPOS', value: totalCard, icon: Layers, color: 'text-blue-850 bg-blue-100 border border-blue-250 shadow-sm' }
                ].map((col, idx) => (
                  <div key={idx} className="p-3 border border-neutral-200 rounded-2xl space-y-1.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${col.color}`}>
                      <col.icon className="w-4 h-4 font-bold" />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase block truncate">{col.label}</span>
                      <span className="text-xs font-black text-neutral-900">
                        R$ {col.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Calendar className="w-4 h-4" />
                  <span>Sessão de Caixa Ativa</span>
                </div>
                <span className="text-neutral-900 font-black">
                  {salesCount} vendas conciliadas automaticamente
                </span>
              </div>
            </div>
          </div>

          {/* 2. Transaction ledger table */}
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Extrato de Lançamentos de Caixa</h3>
                <p className="text-xs text-neutral-600 font-bold">Registro completo de depósitos, retiradas, suprimentos e vendas</p>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 text-neutral-750 uppercase tracking-wider text-[10px] font-black border-b border-neutral-200">
                    <th className="py-4 px-6">Data/Hora</th>
                    <th className="py-4 px-6">Tipo</th>
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Descrição</th>
                    <th className="py-4 px-6">Operador</th>
                    <th className="py-4 px-6 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-semibold text-neutral-800">
                  {cashRegister.transactions.map((tx) => {
                    const isDeposit = tx.type === 'in';
                    const categoriesLabel = {
                      sale: 'Venda Comercial',
                      supply: 'Aporte de Caixa',
                      withdrawal: 'Retirada Sangria',
                      expense: 'Despesa Avulsa'
                    };
                    return (
                      <tr key={tx.id} className="hover:bg-emerald-50/20 transition border-b border-neutral-100">
                        <td className="py-4 px-6 text-neutral-500 font-bold">
                          {new Date(tx.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isDeposit
                              ? 'bg-emerald-100 border-emerald-250 text-emerald-800'
                              : 'bg-rose-100 border-rose-250 text-rose-800'
                          }`}>
                            {isDeposit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isDeposit ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-neutral-700 font-bold">{categoriesLabel[tx.category] || tx.category}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-neutral-900 font-bold">{tx.description}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-neutral-700 font-bold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-neutral-500" />
                            {tx.operator}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-black ${isDeposit ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isDeposit ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}

                  {cashRegister.transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-neutral-500 font-bold">
                        Nenhuma transação financeira registrada neste turno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Layout */}
            <div className="block md:hidden divide-y divide-neutral-200">
              {cashRegister.transactions.map((tx) => {
                const isDeposit = tx.type === 'in';
                const categoriesLabel = {
                  sale: 'Venda Comercial',
                  supply: 'Aporte de Caixa',
                  withdrawal: 'Retirada Sangria',
                  expense: 'Despesa Avulsa'
                };
                return (
                  <div key={tx.id} className="p-4 space-y-3 hover:bg-neutral-50/50 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 font-bold">
                        {new Date(tx.timestamp).toLocaleString('pt-BR')}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${
                        isDeposit
                          ? 'bg-emerald-100 border-emerald-250 text-emerald-800'
                          : 'bg-rose-100 border-rose-250 text-rose-800'
                      }`}>
                        {isDeposit ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                        {isDeposit ? 'Entrada' : 'Saída'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-black text-neutral-400">Categoria:</span>
                        <span className="text-neutral-700 font-bold">{categoriesLabel[tx.category] || tx.category}</span>
                      </div>
                      <div className="text-neutral-900 font-bold text-xs">{tx.description}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100">
                      <span className="text-neutral-600 font-bold flex items-center gap-1 text-[11px]">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        {tx.operator}
                      </span>
                      <span className={`font-black text-sm ${isDeposit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isDeposit ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {cashRegister.transactions.length === 0 && (
                <div className="py-12 text-center text-xs text-neutral-550 font-bold">
                  Nenhuma transação financeira registrada neste turno.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'bills' && (
        <div className="space-y-6">
          {/* Header Action Panel for Bills */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm">Contas a Pagar & Receber</h3>
              <p className="text-[10px] text-neutral-600 font-bold">Gerencie as obrigações de despesas fixas/fornecedores e receitas extraordinárias</p>
            </div>
            <button
              onClick={() => setShowAddBillModal(true)}
              className="w-full md:w-auto py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 border border-emerald-550"
            >
              <Plus className="w-4 h-4 font-black" />
              <span>Lançar Nova Conta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contas a Pagar Panel */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-xs font-black uppercase text-rose-800 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded">Contas a Pagar (Despesas)</span>
              </div>

              <div className="space-y-3">
                {bills.filter(b => b.type === 'payable').map(bill => (
                  <div key={bill.id} className="p-3 border border-neutral-150 hover:border-neutral-350 rounded-xl flex items-center justify-between text-xs hover:bg-neutral-50/20 transition">
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900">{bill.title}</h4>
                      <p className="text-[10px] text-neutral-600 font-semibold">
                        Vence em: {new Date(bill.dueDate).toLocaleDateString('pt-BR')} • Categoria: {bill.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-0.5">
                        <span className="font-black text-rose-750 block">R$ {bill.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleToggleBillStatus(bill.id)}
                          className={`text-[9px] font-black px-2 py-0.5 rounded border transition ${
                            bill.status === 'paid'
                              ? 'bg-emerald-100 border-emerald-250 text-emerald-850'
                              : 'bg-amber-100 border-amber-250 text-amber-900 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          {bill.status === 'paid' ? 'Pago' : 'Marcar como Pago'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-1 text-neutral-500 hover:text-rose-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contas a Receber Panel */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <span className="text-xs font-black uppercase text-emerald-850 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded">Contas a Receber (Receitas)</span>
              </div>

              <div className="space-y-3">
                {bills.filter(b => b.type === 'receivable').map(bill => (
                  <div key={bill.id} className="p-3 border border-neutral-150 hover:border-neutral-350 rounded-xl flex items-center justify-between text-xs hover:bg-neutral-50/20 transition">
                    <div className="space-y-1">
                      <h4 className="font-bold text-neutral-900">{bill.title}</h4>
                      <p className="text-[10px] text-neutral-600 font-semibold">
                        Vence em: {new Date(bill.dueDate).toLocaleDateString('pt-BR')} • Categoria: {bill.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-0.5">
                        <span className="font-black text-emerald-850 block">R$ {bill.amount.toFixed(2)}</span>
                        <button
                          onClick={() => handleToggleBillStatus(bill.id)}
                          className={`text-[9px] font-black px-2 py-0.5 rounded border transition ${
                            bill.status === 'paid'
                              ? 'bg-emerald-100 border-emerald-250 text-emerald-850'
                              : 'bg-amber-100 border-amber-250 text-amber-900 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          {bill.status === 'paid' ? 'Recebido' : 'Marcar Recebido'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="p-1 text-neutral-500 hover:text-rose-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Analytical Overview Cards */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-5 items-center justify-between">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm">Demonstrativo de Resultados de Exercício (DRE)</h3>
              <p className="text-[10px] text-neutral-600 font-bold">Análise completa de lucratividade, margem de markup e fluxo de vendas</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black rounded-xl border border-emerald-550 transition flex items-center gap-2 shadow-md"
            >
              <span>Exportar Dados para Planilha (CSV)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-800">Faturamento Bruto</span>
              <h4 className="text-lg font-black text-emerald-950">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              <span className="text-[9px] text-emerald-700 block font-bold">Somatória de vendas PDV e comanda</span>
            </div>

            <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase text-amber-800">Taxas da Máquina</span>
              <h4 className="text-lg font-black text-amber-950">R$ {totalProcessingFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              <span className="text-[9px] text-amber-700 block font-bold">Descontos das adquirentes</span>
            </div>

            <div className="bg-rose-50 border border-rose-250 p-4 rounded-xl space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase text-rose-800">Total de Despesas</span>
              <h4 className="text-lg font-black text-rose-950">R$ {totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              <span className="text-[9px] text-rose-700 block font-bold">Sangrias e custos operacionais</span>
            </div>

            <div className="bg-emerald-100 border border-emerald-300 p-4 rounded-xl space-y-1 shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-900">Resultado Líquido</span>
              <h4 className="text-lg font-black text-emerald-950">R$ {(totalSales - totalWithdrawals - totalProcessingFees).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              <span className="text-[9px] text-emerald-800 block font-bold">Lucro real deduzido de taxas</span>
            </div>
          </div>


          {/* Premium Visual SVG Charts and Metrics Section */}
          {(() => {
            const salesByDay = [0, 0, 0, 0, 0, 0, 0];
            orders.filter(o => o.paymentStatus === 'paid').forEach(o => {
              try {
                const day = new Date(o.createdAt).getDay();
                salesByDay[day] += o.total;
              } catch {}
            });
            const weekdaySales = [
              salesByDay[1], // Mon
              salesByDay[2], // Tue
              salesByDay[3], // Wed
              salesByDay[4], // Thu
              salesByDay[5], // Fri
              salesByDay[6], // Sat
              salesByDay[0]  // Sun
            ];

            const maxDayVal = Math.max(...weekdaySales, 100);
            const chartPoints = weekdaySales.map((val, idx) => {
              const x = 40 + (idx * 45);
              const y = 130 - ((val / maxDayVal) * 90);
              return `${x},${y}`;
            }).join(' ');
            const chartAreaPoints = `40,130 ${chartPoints} 310,130`;

            const totalPixVal = totalPix;
            const totalCardVal = totalCard;
            const totalCashVal = Math.max(0, cashAmount);
            const sumMethods = totalPixVal + totalCardVal + totalCashVal || 1;
            const pctPix = Math.round((totalPixVal / sumMethods) * 100);
            const pctCard = Math.round((totalCardVal / sumMethods) * 100);
            const pctCash = Math.round((totalCashVal / sumMethods) * 100);

            const salesTarget = 5000;
            const pctTarget = Math.min(100, Math.round((totalSales / salesTarget) * 100));

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
                {/* SVG Trend Chart */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider text-emerald-800">Faturamento da Semana (R$)</h4>
                    <p className="text-[10px] text-neutral-500 font-bold">Gráfico linear de vendas liquidadas de Segunda a Domingo</p>
                  </div>
                  <div className="pt-2">
                    <svg viewBox="0 0 350 160" className="w-full h-44">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="40" y1="40" x2="310" y2="40" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3" />
                      <line x1="40" y1="85" x2="310" y2="85" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3" />
                      <line x1="40" y1="130" x2="310" y2="130" stroke="#e5e7eb" strokeWidth="1.5" />
                      
                      {/* Gradient Fill Area */}
                      <polygon points={chartAreaPoints} fill="url(#chartGrad)" />
                      
                      {/* Main Polyline */}
                      <polyline points={chartPoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      
                      {/* Circles for points */}
                      {weekdaySales.map((val, idx) => {
                        const x = 40 + (idx * 45);
                        const y = 130 - ((val / maxDayVal) * 90);
                        return (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
                            <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-black fill-neutral-700 bg-white px-1 shadow-sm opacity-0 group-hover:opacity-100 transition duration-200">
                              R${val.toFixed(0)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Day Labels */}
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((label, idx) => (
                        <text key={idx} x={40 + (idx * 45)} y="148" textAnchor="middle" className="text-[9px] font-bold fill-neutral-400">
                          {label}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Progress bars & Target */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider text-emerald-800">Mix de Pagamentos & Metas</h4>
                      <p className="text-[10px] text-neutral-500 font-bold">Resumo proporcional de recebimentos e meta de vendas diária</p>
                    </div>

                    {/* Progress bars */}
                    <div className="space-y-3">
                      {/* PIX */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-teal-600" /> PIX</span>
                          <span className="font-black text-neutral-800">{pctPix}% (R$ {totalPixVal.toFixed(0)})</span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200">
                          <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctPix}%` }}></div>
                        </div>
                      </div>

                      {/* Cartão */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-blue-600" /> Cartão</span>
                          <span className="font-black text-neutral-800">{pctCard}% (R$ {totalCardVal.toFixed(0)})</span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctCard}%` }}></div>
                        </div>
                      </div>

                      {/* Dinheiro */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-neutral-600">
                          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Dinheiro</span>
                          <span className="font-black text-neutral-800">{pctCash}% (R$ {totalCashVal.toFixed(0)})</span>
                        </div>
                        <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctCash}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Tracker */}
                  <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-2xl space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-emerald-900 uppercase">
                      <span>Meta de Vendas Diária</span>
                      <span>{pctTarget}% (R$ {totalSales.toFixed(0)} / R$ {salesTarget})</span>
                    </div>
                    <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${pctTarget}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Card Machines Detailed Transaction Log */}
                <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-4 mt-6">
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider text-emerald-800">Histórico de Transações do Caixa (Cartão & Pix)</h4>
                    <p className="text-[10px] text-neutral-500 font-bold">Listagem completa e detalhada de pagamentos processados por maquininhas vinculadas ao banco de dados.</p>
                  </div>

                  {transactionsLoading ? (
                    <div className="text-center py-8 text-neutral-500 font-bold text-[10px]">Buscando transações no banco...</div>
                  ) : dbTransactions.length === 0 ? (
                    <div className="text-center py-8 bg-neutral-50 border border-dashed border-neutral-250 rounded-2xl text-neutral-500 font-bold text-[10px]">
                      Nenhuma transação de cartão ou Pix registrada no banco de dados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-neutral-200 rounded-2xl bg-white">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-neutral-200">
                            <th className="p-3 font-black text-neutral-700 uppercase">Data/Hora</th>
                            <th className="p-3 font-black text-neutral-700 uppercase">Maquininha Utilizada</th>
                            <th className="p-3 font-black text-neutral-700 uppercase">Método</th>
                            <th className="p-3 font-black text-neutral-700 uppercase">Código Ref.</th>
                            <th className="p-3 font-black text-neutral-700 uppercase text-right">Valor Bruto</th>
                            <th className="p-3 font-black text-neutral-700 uppercase text-center">Taxa Aplicada</th>
                            <th className="p-3 font-black text-neutral-700 uppercase text-right">Líquido Recebido</th>
                            <th className="p-3 font-black text-neutral-700 uppercase text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbTransactions.map((tx) => {
                            const amount = tx.amountInCents / 100;
                            const isPix = tx.provider === 'PIX' || tx.providerTransactionId?.toLowerCase().includes('pix') || tx.rawPayload?.provider === 'PIX';
                            const isCredit = tx.rawPayload?.method === 'CREDIT' || tx.providerTransactionId?.toLowerCase().includes('credit') || tx.rawPayload?.provider === 'CREDIT';

                            let feePercent = 0;
                            if (tx.cardMachineId && tx.cardMachineName) {
                              if (isPix) feePercent = tx.pixFee;
                              else if (isCredit) feePercent = tx.creditFee;
                              else feePercent = tx.debitFee;
                            } else {
                              const creditFeePercent = parseFloat(localStorage.getItem('gourmet_settings_credit_fee') || '2.5');
                              const debitFeePercent = parseFloat(localStorage.getItem('gourmet_settings_debit_fee') || '1.5');
                              const pixFeePercent = parseFloat(localStorage.getItem('gourmet_settings_pix_fee') || '0');

                              if (isPix) feePercent = pixFeePercent;
                              else if (isCredit) feePercent = creditFeePercent;
                              else feePercent = debitFeePercent;
                            }

                            const feeValue = amount * (feePercent / 100);
                            const netValue = amount - feeValue;

                            return (
                              <tr key={tx.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                                <td className="p-3 font-bold text-neutral-500 whitespace-nowrap">
                                  {new Date(tx.occurredAt).toLocaleDateString('pt-BR')} às {new Date(tx.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="p-3">
                                  {tx.cardMachineName ? (
                                    <div>
                                      <span className="font-black text-neutral-900">{tx.cardMachineName}</span>
                                      <span className="text-[9px] text-neutral-500 block">Mod: {tx.cardMachineModel} (S/N: {tx.cardMachineSerial})</span>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-400 italic">Terminal Manual/Config. Geral</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className="font-extrabold text-neutral-800">{isPix ? 'PIX' : isCredit ? 'CRÉDITO' : 'DÉBITO'}</span>
                                </td>
                                <td className="p-3 font-mono text-neutral-600 truncate max-w-[120px]" title={tx.providerTransactionId}>
                                  {tx.providerTransactionId || '-'}
                                </td>
                                <td className="p-3 font-black text-right text-neutral-900">
                                  R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <span className="font-bold text-amber-800 bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-lg font-mono">
                                    {feePercent.toFixed(2)}% (R$ {feeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                  </span>
                                </td>
                                <td className="p-3 font-black text-right text-emerald-950">
                                  R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                                    tx.status === 'APPROVED'
                                      ? 'bg-emerald-100 border-emerald-250 text-emerald-800'
                                      : 'bg-rose-100 border-rose-250 text-rose-800'
                                  }`}>
                                    {tx.status === 'APPROVED' ? 'Aprovado' : 'Recusado'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}


      {/* DIALOG: Supply / Withdrawal Form */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 bg-neutral-950/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-250 shadow-2xl relative"
            >
              <button
                onClick={() => setShowTransactionModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition border border-transparent hover:border-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-extrabold text-neutral-900 text-base mb-1">
                {txType === 'in' ? 'Registrar Suprimento (Entrada)' : 'Registrar Sangria (Saída)'}
              </h3>
              <p className="text-xs text-neutral-600 font-bold mb-5">
                {txType === 'in'
                  ? 'Adicione notas físicas ao caixa para facilitar troco.'
                  : 'Retire cédulas de segurança para depósito bancário ou pagamento emergencial.'}
              </p>

              <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs font-semibold">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Valor do lançamento (R$)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Categoria de Lançamento</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    {txType === 'in' ? (
                      <option value="supply">Suprimento / Troco</option>
                    ) : (
                      <>
                        <option value="withdrawal">Sangria de Segurança</option>
                        <option value="expense">Pagamento Despesa Avulsa</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Justificativa / Descrição</label>
                  <input
                    type="text"
                    required
                    value={txDesc}
                    onChange={(e) => setTxDesc(e.target.value)}
                    placeholder="Ex: Sangria para depósito, compra de coentro..."
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                 <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition mt-2 border border-emerald-550"
                >
                  Confirmar Operação no Caixa
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Add Bill */}
        {showAddBillModal && (
          <div className="fixed inset-0 bg-neutral-950/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 border border-neutral-250 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddBillModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-extrabold text-neutral-900 text-base mb-1">Novo Lançamento Financeiro</h3>
              <p className="text-xs text-neutral-600 font-bold mb-4">Adicione obrigações a pagar ou direitos a receber</p>

              <form onSubmit={handleAddBill} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-600">Título / Descrição</label>
                  <input
                    type="text"
                    required
                    value={billTitle}
                    onChange={(e) => setBillTitle(e.target.value)}
                    placeholder="Ex: Aluguel de Equipamentos"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Valor (R$)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={billAmount}
                      onChange={(e) => setBillAmount(Number(e.target.value))}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Data de Vencimento</label>
                    <input
                      type="date"
                      required
                      value={billDueDate}
                      onChange={(e) => setBillDueDate(e.target.value)}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Tipo de Fluxo</label>
                    <select
                      value={billType}
                      onChange={(e) => setBillType(e.target.value as any)}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                    >
                      <option value="payable">Conta a Pagar (Débito)</option>
                      <option value="receivable">Conta a Receber (Crédito)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Categoria</label>
                    <input
                      type="text"
                      required
                      value={billCategory}
                      onChange={(e) => setBillCategory(e.target.value)}
                      placeholder="Ex: Fornecedor, Impostos"
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl border border-emerald-550 transition shadow-lg"
                >
                  Lançar Conta
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
