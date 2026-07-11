import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  QrCode,
  DollarSign,
  User,
  Check,
  Smartphone,
  X,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, OrderItem } from '../types';

interface PdvViewProps {
  products: Product[];
  categories: { id: string; name: string; slug: string }[];
  onCreateOrder: (orderData: any) => void;
  onPayOrder: (orderId: string, method: any, discount: number) => void;
}

export function PdvView({ products, categories: categoriesProp = [], onCreateOrder, onPayOrder }: PdvViewProps) {
  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePdvTab, setActivePdvTab] = useState<'catalog' | 'cart'>('catalog');

  // Cart persistent drafts
  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const cached = localStorage.getItem('gourmet_pdv_cart');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [discountAmount, setDiscountAmount] = useState<number>(() => {
    try {
      const cached = localStorage.getItem('gourmet_pdv_discount');
      return cached ? parseFloat(cached) : 0;
    } catch {
      return 0;
    }
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    return localStorage.getItem('gourmet_pdv_customer') || 'Venda de Balcão';
  });

  // Sync PDV draft states to localStorage
  useEffect(() => {
    localStorage.setItem('gourmet_pdv_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('gourmet_pdv_discount', discountAmount.toString());
  }, [discountAmount]);

  useEffect(() => {
    localStorage.setItem('gourmet_pdv_customer', customerName);
  }, [customerName]);

  // Interactive Product Configuration Dialog
  const [activeConfigProduct, setActiveConfigProduct] = useState<Product | null>(null);
  const [configQuantity, setConfigQuantity] = useState<number>(1);
  const [configSelectedAdditions, setConfigSelectedAdditions] = useState<{ name: string; price: number }[]>([]);
  const [configNotes, setConfigNotes] = useState<string>('');

  // Checkout Payment Dialog
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'cash' | 'pix' | 'split'>('credit');
  const [splitCount, setSplitCount] = useState<number>(2);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Constants categories - dynamically aggregated
  const categories = useMemo(() => {
    const fromProducts = products.map(p => p.category);
    const fromDb = categoriesProp.map(c => c.name);
    return ['Todos', ...Array.from(new Set([...fromProducts, ...fromDb]))];
  }, [products, categoriesProp]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch && p.available;
    });
  }, [products, selectedCategory, searchQuery]);

  // Calculate cart sums
  const cartSubtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.price;
    const additionsPrice = item.selectedAdditions.reduce((s, add) => s + add.price, 0);
    return sum + (basePrice + additionsPrice) * item.quantity;
  }, 0);

  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  // Add item click
  const handleProductClick = (product: Product) => {
    setActiveConfigProduct(product);
    setConfigQuantity(1);
    setConfigSelectedAdditions([]);
    setConfigNotes('');
  };

  const handleToggleAddition = (add: { name: string; price: number }) => {
    const exists = configSelectedAdditions.some(a => a.name === add.name);
    if (exists) {
      setConfigSelectedAdditions(configSelectedAdditions.filter(a => a.name !== add.name));
    } else {
      setConfigSelectedAdditions([...configSelectedAdditions, add]);
    }
  };

  const handleConfirmAddToCart = () => {
    if (!activeConfigProduct) return;

    const newItem: OrderItem = {
      product: activeConfigProduct,
      quantity: configQuantity,
      selectedAdditions: configSelectedAdditions,
      notes: configNotes.trim() || undefined
    };

    setCart([...cart, newItem]);
    setActiveConfigProduct(null);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const handleIncrementQty = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    if (item) {
      item.quantity += 1;
      setCart(updated);
    }
  };

  const handleDecrementQty = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    if (item) {
      if (item.quantity > 1) {
        item.quantity -= 1;
        setCart(updated);
      } else {
        handleRemoveItem(index);
      }
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    setPaymentProcessing(true);

    // Simulate SmartPOS/TeF delay for card, or immediate PIX/Cash
    const delay = paymentMethod === 'credit' || paymentMethod === 'debit' ? 2500 : 1200;

    setTimeout(() => {
      // 1. Create order
      const newOrder = onCreateOrder({
        items: cart,
        subtotal: cartSubtotal,
        discount: discountAmount,
        total: cartTotal,
        status: 'delivered', // fast counter-top sale is delivered immediately
        paymentMethod,
        paymentStatus: 'paid',
        customerName: customerName || 'Venda de Balcão'
      });

      setPaymentProcessing(false);
      setPaymentSuccess(true);

      setTimeout(() => {
        // Reset cart states
        setCart([]);
        setDiscountAmount(0);
        setCustomerName('Venda de Balcão');
        setShowPaymentModal(false);
        setPaymentSuccess(false);
      }, 1500);

    }, delay);
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-12.5rem)] xl:h-[calc(100vh-6rem)] overflow-hidden">
      {/* Toggle tabs for screens below xl */}
      <div className="flex xl:hidden border border-neutral-200 rounded-xl overflow-hidden gap-0 shrink-0">
        <button
          type="button"
          onClick={() => setActivePdvTab('catalog')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all ${
            activePdvTab === 'catalog'
              ? 'bg-emerald-500 text-neutral-950 font-black'
              : 'bg-white text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Cardápio ({filteredProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setActivePdvTab('cart')}
          className={`flex-1 py-3 px-4 text-xs font-black transition-all relative ${
            activePdvTab === 'cart'
              ? 'bg-emerald-500 text-neutral-950 font-black'
              : 'bg-white text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Carrinho ({cart.length})
          {cart.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 bg-rose-600 text-white text-[9px] rounded-full font-black animate-pulse">
              Ativo
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Left Column: Product Selection Area */}
        <div className={`${activePdvTab === 'catalog' ? 'flex' : 'hidden'} xl:flex xl:col-span-2 flex-col gap-4 overflow-y-auto pr-2 pb-6`}>
        {/* Category horizontal bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-neutral-950 font-black border border-emerald-550 shadow-md shadow-emerald-500/10'
                  : 'bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar produto pelo nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl py-3.5 pl-11 pr-4 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-500 transition shadow-sm"
          />
        </div>

        {/* Products Grid */}
        <div id="pdv-products-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.minStock;
            return (
              <motion.div
                whileHover={{ y: -3 }}
                key={p.id}
                onClick={() => handleProductClick(p)}
                className="bg-white rounded-2xl border border-neutral-250 hover:border-emerald-500 p-3.5 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md transition"
              >
                <div className="space-y-3">
                  {/* Photo & stock badge */}
                  <div className="relative h-28 rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black shadow-sm ${
                      isLowStock
                        ? 'bg-rose-100 border border-rose-250 text-rose-900 animate-pulse'
                        : 'bg-neutral-900/85 border border-neutral-750 text-white'
                    }`}>
                      Estoque: {p.stock}
                    </span>
                  </div>

                  {/* Text details */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-neutral-900 group-hover:text-emerald-850 transition leading-tight line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-neutral-600 font-medium leading-normal line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200">
                  <span className="text-sm font-black text-neutral-900">
                    R$ {p.price.toFixed(2)}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center border border-emerald-550 shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 font-black transition">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs text-neutral-600 font-bold">
              Nenhum produto correspondente encontrado nesta categoria.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Checkout Order Summary Panel */}
      <div id="pdv-cart-summary" className={`${activePdvTab === 'cart' ? 'flex' : 'hidden'} xl:flex bg-white border border-neutral-250 rounded-2xl flex-col h-full overflow-hidden shadow-sm`}>
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-neutral-100">
          <div>
            <h3 className="font-black text-neutral-900 text-sm">Resumo da Venda</h3>
            <span className="text-[10px] text-neutral-600 font-bold">PDV Frente de Caixa</span>
          </div>
          <button
            onClick={() => setCart([])}
            className="text-[10px] text-rose-850 hover:text-rose-950 font-black uppercase transition"
          >
            Limpar Carrinho
          </button>
        </div>

        {/* Customer name box */}
        <div className="p-3 bg-emerald-50/20 border-b border-neutral-200 shrink-0 flex items-center gap-2">
          <User className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome do cliente (opcional)"
            className="w-full bg-transparent border-none text-xs font-bold text-neutral-900 focus:outline-none placeholder-neutral-500"
          />
        </div>

        {/* Cart Item Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                <Trash2 className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold text-neutral-600">Seu carrinho de vendas está vazio</p>
              <p className="text-[10px] text-neutral-600 font-medium leading-normal max-w-[200px]">Selecione itens no catálogo ao lado para registrar uma nova venda.</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const additionsSum = item.selectedAdditions.reduce((s, a) => s + a.price, 0);
              const unitTotal = item.product.price + additionsSum;
              return (
                <div key={idx} className="flex gap-3 justify-between items-start pb-3 border-b border-neutral-200">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-extrabold text-neutral-900">
                        {item.product.name}
                      </h4>
                    </div>

                    {/* Additions list */}
                    {item.selectedAdditions.map((a, aIdx) => (
                      <span key={aIdx} className="inline-block bg-neutral-100 border border-neutral-250 text-[9px] text-neutral-800 rounded px-1.5 py-0.5 mr-1 mb-1 font-bold">
                        + {a.name} (R$ {a.price.toFixed(2)})
                      </span>
                    ))}

                    {item.notes && (
                      <p className="text-[10px] text-amber-900 bg-amber-100 border border-amber-250 italic px-1.5 py-0.5 rounded font-bold">
                        Obs: "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-black text-neutral-900">
                      R$ {(unitTotal * item.quantity).toFixed(2)}
                    </span>

                    {/* Increment/decrement buttons */}
                    <div className="flex items-center gap-2 border border-neutral-250 rounded-lg p-0.5 bg-neutral-100">
                      <button
                        onClick={() => handleDecrementQty(idx)}
                        className="p-1 rounded-md text-neutral-800 hover:bg-neutral-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-black text-neutral-900 min-w-[12px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrementQty(idx)}
                        className="p-1 rounded-md text-neutral-800 hover:bg-neutral-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pricing Summary Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-100 shrink-0 space-y-3">
          <div className="space-y-1.5 text-xs font-bold">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>R$ {cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Discount Form */}
            <div className="flex justify-between text-neutral-700 items-center">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-800" />
                Desconto
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-500 font-bold">R$</span>
                <input
                  type="number"
                  min="0"
                  max={cartSubtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.min(cartSubtotal, Number(e.target.value)))}
                  className="w-16 bg-emerald-50/50 border border-emerald-250 rounded px-1.5 py-0.5 text-right font-black text-neutral-900 focus:outline-none"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex justify-between text-neutral-900 text-sm font-black pt-2 border-t border-dashed border-neutral-250">
              <span>Faturar Total</span>
              <span className="text-sm text-emerald-850 px-2 py-0.5 bg-emerald-100 border border-emerald-250 rounded font-black">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 border border-emerald-550"
          >
            <span>Prosseguir para Pagamento</span>
          </button>
        </div>
      </div>
    </div>

      {/* MODAL 1: Product Additions & Configuration */}
      <AnimatePresence>
        {activeConfigProduct && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-neutral-200 shadow-2xl"
            >
              <div className="relative h-44 bg-neutral-200">
                <img
                  src={activeConfigProduct.image}
                  alt={activeConfigProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setActiveConfigProduct(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-850 bg-emerald-100 border border-emerald-250 px-2.5 py-0.5 rounded-full inline-block">
                    {activeConfigProduct.category}
                  </span>
                  <h3 className="text-base font-black text-neutral-900 mt-1">
                    {activeConfigProduct.name}
                  </h3>
                  <p className="text-xs text-neutral-600 font-bold mt-1 leading-normal">
                    {activeConfigProduct.description}
                  </p>
                </div>

                {/* Additions option */}
                {activeConfigProduct.additions && activeConfigProduct.additions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                      Adicionais e Opcionais
                    </span>
                    <div className="space-y-2">
                      {activeConfigProduct.additions.map((add, idx) => {
                        const isChecked = configSelectedAdditions.some(a => a.name === add.name);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleAddition(add)}
                            className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                              isChecked
                                ? 'border-emerald-500 bg-emerald-100 text-emerald-850 font-black'
                                : 'border-neutral-200 hover:bg-neutral-100 text-neutral-850'
                            }`}
                          >
                            <span className="text-xs font-bold">
                              {add.name}
                            </span>
                            <span className="text-xs font-black text-emerald-850 bg-emerald-100 border border-emerald-250 px-2 py-0.5 rounded">
                              + R$ {add.price.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Text Notes */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                    Observações do Preparo
                  </span>
                  <textarea
                    rows={2}
                    placeholder="Ex: sem cebola, ponto bem passado, maionese à parte..."
                    value={configNotes}
                    onChange={(e) => setConfigNotes(e.target.value)}
                    className="w-full text-xs font-bold bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-neutral-900"
                  ></textarea>
                </div>

                {/* Quantity and Action Button */}
                <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                  <div className="flex items-center gap-3 border border-neutral-250 rounded-xl p-1 bg-neutral-100">
                    <button
                      onClick={() => setConfigQuantity(Math.max(1, configQuantity - 1))}
                      className="p-1.5 rounded-lg text-neutral-800 hover:bg-neutral-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-black text-neutral-900 min-w-[20px] text-center">
                      {configQuantity}
                    </span>
                    <button
                      onClick={() => setConfigQuantity(configQuantity + 1)}
                      className="p-1.5 rounded-lg text-neutral-800 hover:bg-neutral-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleConfirmAddToCart}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition border border-emerald-550"
                  >
                    Adicionar • R$ {((activeConfigProduct.price + configSelectedAdditions.reduce((s, a) => s + a.price, 0)) * configQuantity).toFixed(2)}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Interactive Cash Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl relative"
            >
              <button
                onClick={() => !paymentProcessing && setShowPaymentModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-600 hover:bg-neutral-150 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-black text-neutral-900 text-base mb-1">Finalização de Venda</h3>
              <p className="text-xs text-neutral-600 font-bold mb-5">Escolha o método de pagamento preferencial do cliente</p>

              {/* Total display */}
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl text-center space-y-1 mb-5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-600">Valor à cobrar</span>
                <h4 className="text-2xl font-black text-emerald-850 bg-emerald-100 border border-emerald-250 px-3 py-1 rounded-xl inline-block">R$ {cartTotal.toFixed(2)}</h4>
              </div>

              {/* Payment Methods selector */}
              <div className="space-y-2 mb-6">
                {[
                  { id: 'credit', label: 'Cartão Crédito (SmartPOS)', icon: CreditCard },
                  { id: 'debit', label: 'Cartão Débito (SmartPOS)', icon: CreditCard },
                  { id: 'pix', label: 'PIX QR Code Dinâmico', icon: QrCode },
                  { id: 'cash', label: 'Cédula / Dinheiro Físico', icon: DollarSign },
                  { id: 'split', label: 'Dividir Conta (Split Bill)', icon: Users },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-850 font-black'
                          : 'border-neutral-200 text-neutral-850 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold">{method.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-850" />}
                    </div>
                  );
                })}
              </div>

              {/* Split account config view */}
              {paymentMethod === 'split' && (
                <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 space-y-3 mb-6">
                  <div className="flex justify-between items-center text-xs font-extrabold">
                    <span className="text-neutral-800">Dividir em quantas pessoas?</span>
                    <div className="flex items-center gap-2 border border-neutral-250 bg-white rounded p-0.5">
                      <button
                        onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                        className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-xs text-neutral-800 font-black"
                      >
                        -
                      </button>
                      <span className="px-1 text-xs text-neutral-900 font-black">{splitCount}</span>
                      <button
                        onClick={() => setSplitCount(splitCount + 1)}
                        className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-xs text-neutral-800 font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-extrabold border-t border-neutral-250 pt-2.5">
                    <span className="text-neutral-800">Cada pessoa paga:</span>
                    <span className="text-sm text-neutral-900 font-black bg-neutral-200 border border-neutral-300 px-2 py-0.5 rounded">
                      R$ {(cartTotal / splitCount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                {paymentProcessing ? (
                  <div className="py-4 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-neutral-850">
                      {paymentMethod === 'credit' || paymentMethod === 'debit'
                        ? 'Processando transação no SmartPOS... Insira o cartão.'
                        : paymentMethod === 'pix'
                        ? 'Aguardando compensação do PIX QR Code...'
                        : 'Registrando movimentação no caixa físico...'}
                    </p>
                    <p className="text-[10px] text-neutral-600 font-bold">Apenas simulação visual. Não insira dados reais.</p>
                  </div>
                ) : paymentSuccess ? (
                  <div className="py-4 text-center space-y-2 text-emerald-850">
                    <div className="w-12 h-12 bg-emerald-100 border border-emerald-250 rounded-full flex items-center justify-center mx-auto text-emerald-850">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-black text-emerald-850 bg-emerald-100 border border-emerald-250 px-2.5 py-1 rounded-xl inline-block">Pagamento Aprovado com Sucesso!</p>
                    <p className="text-xs text-neutral-600 font-bold">Imprimindo cupom fiscal simulado...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmPayment}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 border border-emerald-550"
                  >
                    <span>Confirmar Pagamento Simulado</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
