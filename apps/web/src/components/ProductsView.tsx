import { useState, FormEvent } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  AlertTriangle,
  Coins,
  TrendingUp,
  Percent,
  X,
  Upload,
  Link,
  Loader2,
  Image as ImageIcon,
  ShoppingBag,
  Tag,
  Calendar
} from 'lucide-react';
import { AdminPasswordModal } from './AdminPasswordModal';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface ProductsViewProps {
  products: Product[];
  currentUser?: any;
  categories: { id: string; name: string; slug: string; type?: string }[];
  onAddProduct: (prod: any) => void;
  onUpdateProduct: (id: string, updated: any) => void;
  onDeleteProduct: (id: string, adminPassword?: string) => Promise<void>;
  onAddCategory: (name: string, type?: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string, isActive?: boolean) => Promise<void>;
  onDeleteCategory: (id: string, adminPassword?: string) => Promise<void>;
  verifyAdminPassword: (password: string, action: string, description: string) => Promise<void>;
  cashRegister?: { isOpen: boolean; currentAmount: number; transactions: any[] };
  onAddCashTransaction?: (type: 'in' | 'out', amount: number, description: string, category: 'sale' | 'supply' | 'withdrawal' | 'expense') => void;
}

export function ProductsView({
  products,
  currentUser,
  categories = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  verifyAdminPassword,
  cashRegister,
  onAddCashTransaction
}: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'additions' | 'stock' | 'categories'>('catalog');

  // Category management states (Enriched)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');

  // Delete authorization state (Enriched)
  const [deleteType, setDeleteType] = useState<'product' | 'addition' | 'category' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteAuth, setShowDeleteAuth] = useState(false);

  // Inbound stock modal states (Enriched)
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [selectedInboundProductId, setSelectedInboundProductId] = useState('');
  const [inboundBrand, setInboundBrand] = useState('');
  const [inboundExpiration, setInboundExpiration] = useState('');
  const [inboundQty, setInboundQty] = useState(5);
  const [inboundCost, setInboundCost] = useState(50);

  // Add / Edit Modal configuration
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategoryType, setSelectedCategoryType] = useState<'product' | 'insumo' | 'supplier'>('product');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Hambúrgueres');
  const [formPrice, setFormPrice] = useState(0);
  const [formCost, setFormCost] = useState(0);
  const [formStock, setFormStock] = useState(0);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');

  // Form Image Upload States (Enriched)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const optimizeImage = (file: File) => {
    if (!file) return;
    setIsCompressing(true);
    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsCompressing(false);
          return;
        }

        // Downscale maintaining aspect ratio, max dimension 800px
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.75 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setFormImage(compressedBase64);

        // Calculate compressed size in bytes
        const stringLength = compressedBase64.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = Math.round(stringLength * 3 / 4);
        setCompressedSize(sizeInBytes);
        setIsCompressing(false);
      };
      img.onerror = () => {
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  // Adicionais & Combos States
  const [additionsList, setAdditionsList] = useState([
    { id: 'a1', name: 'Bacon Extra Crocante', price: 6.00, category: 'Hambúrgueres' },
    { id: 'a2', name: 'Queijo Cheddar Inglês', price: 5.00, category: 'Hambúrgueres' },
    { id: 'a3', name: 'Borda Recheada Catupiry', price: 12.00, category: 'Pizzas' },
    { id: 'a4', name: 'Maionese Verde da Casa', price: 3.00, category: 'Acompanhamentos' },
  ]);
  const [showAddAdditionModal, setShowAddAdditionModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState(3.00);
  const [addCategory, setAddCategory] = useState('Hambúrgueres');

  const [combosList, setCombosList] = useState([
    { id: 'c1', name: 'Combo Casal Burger + Fritas + 2 Refri', price: 119.90, description: '2 Hambúrgueres Gourmet Trufados, 1 Batata Rústica, 2 Refrigerantes Lata.' },
    { id: 'c2', name: 'Combo Família Pizza Suprema + Refri 2L', price: 89.95, description: '1 Pizza Pepperoni Supreme, 1 Pizza Caprese di Bufala, 1 Refrigerante 2L.' },
  ]);
  const [showAddComboModal, setShowAddComboModal] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboPrice, setComboPrice] = useState(49.90);
  const [comboDesc, setComboDesc] = useState('');

  // Suppliers & Stock management states
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; cnpj: string; phone: string; category: string }[]>([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCategory, setSupCategory] = useState('Bebidas');

  const [stockHistory, setStockHistory] = useState<{ id: string; productName: string; type: string; quantity: number; reason: string; date: string; operator: string }[]>([]);

  const [selectedStockProductId, setSelectedStockProductId] = useState(products[0]?.id || '');
  const [stockTxType, setStockTxType] = useState<'in' | 'out'>('in');
  const [stockTxQty, setStockTxQty] = useState<number>(10);
  const [stockTxReason, setStockTxReason] = useState('Compra de Insumo');
  const [selectedSupplierId, setSelectedSupplierId] = useState('s1');

  // Category filters
  // Dynamically mapping categories from props
  const dynamicCategories = ['Todos', ...categories.map(c => c.name)];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate stats
  const averageCostMarkup = products.reduce((acc, p) => {
    if (p.cost > 0) {
      const markup = ((p.price - p.cost) / p.cost) * 100;
      return acc + markup;
    }
    return acc;
  }, 0) / products.length;

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Hambúrgueres');
    setFormPrice(25.00);
    setFormCost(8.00);
    setFormStock(20);
    setFormMinStock(5);
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'); // general default salad photo
    setShowFormModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(p.price);
    setFormCost(p.cost);
    setFormStock(p.stock);
    setFormMinStock(p.minStock);
    setFormDescription(p.description);
    setFormImage(p.image);
    setUploadMethod(p.image && p.image.startsWith('data:') ? 'file' : 'url');
    setOriginalSize(null);
    setCompressedSize(null);
    setShowFormModal(true);
  };

  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) return;

    const payload = {
      name: formName.trim(),
      category: formCategory,
      price: Number(formPrice),
      cost: Number(formCost),
      stock: Number(formStock),
      minStock: Number(formMinStock),
      description: formDescription.trim(),
      image: formImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
      available: true
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
    } else {
      onAddProduct(payload);
    }

    setShowFormModal(false);
  };

  // Add addition helper
  const handleAddAddition = (e: FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    const newAdd = {
      id: `a_${Date.now()}`,
      name: addName.trim(),
      price: Number(addPrice),
      category: addCategory
    };
    setAdditionsList([...additionsList, newAdd]);
    setAddName('');
    setAddPrice(3.00);
    setShowAddAdditionModal(false);
  };

  // Add combo helper
  const handleAddCombo = (e: FormEvent) => {
    e.preventDefault();
    if (!comboName.trim()) return;
    const newCombo = {
      id: `c_${Date.now()}`,
      name: comboName.trim(),
      price: Number(comboPrice),
      description: comboDesc.trim()
    };
    setCombosList([...combosList, newCombo]);
    setComboName('');
    setComboPrice(49.90);
    setComboDesc('');
    setShowAddComboModal(false);
  };

  // Add supplier helper
  const handleAddSupplier = (e: FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    const newSup = {
      id: `s_${Date.now()}`,
      name: supName.trim(),
      cnpj: supCnpj.trim() || '12.345.678/0001-90',
      phone: supPhone.trim() || '(11) 99999-8888',
      category: supCategory
    };
    setSuppliers([...suppliers, newSup]);
    setSupName('');
    setSupCnpj('');
    setSupPhone('');
    setShowAddSupplierModal(false);
  };

  // Register stock movement
  const handleRegisterInboundStock = (e: FormEvent) => {
    e.preventDefault();
    const productToUpdate = products.find(p => p.id === selectedInboundProductId);
    if (!productToUpdate) return;

    // 1. Update product stock in DB
    const newStock = productToUpdate.stock + inboundQty;
    onUpdateProduct(selectedInboundProductId, { stock: newStock });

    // 2. Add log record to local stock history
    const brandText = inboundBrand ? ` (Marca: ${inboundBrand})` : '';
    const expiryText = inboundExpiration ? ` - Val.: ${inboundExpiration}` : '';
    const newLog = {
      id: `h_${Date.now()}`,
      productName: productToUpdate.name,
      type: 'in',
      quantity: inboundQty,
      reason: `Compra de Insumo${brandText}${expiryText} (Custo: R$ ${inboundCost.toFixed(2)})`,
      date: 'Agora mesmo',
      operator: currentUser?.name || 'Operador'
    };
    setStockHistory([newLog, ...stockHistory]);

    // 3. Register cash transaction if register is open
    if (onAddCashTransaction) {
      if (cashRegister && cashRegister.isOpen) {
        onAddCashTransaction(
          'out',
          inboundCost,
          `Compra de Insumo: ${productToUpdate.name}${brandText}${expiryText}`,
          'expense'
        );
      } else {
        alert(
          'Atenção: O caixa está fechado. A movimentação financeira não pôde ser lançada automaticamente no caixa do dia. Por favor, abra o caixa na aba Financeiro primeiro.'
        );
      }
    }

    setShowInboundModal(false);
  };

  const handleRegisterStockTx = (e: FormEvent) => {
    e.preventDefault();
    const productToUpdate = products.find(p => p.id === selectedStockProductId);
    if (!productToUpdate) return;

    const diff = stockTxType === 'in' ? stockTxQty : -stockTxQty;
    const newStock = Math.max(0, productToUpdate.stock + diff);

    // Call state update
    onUpdateProduct(selectedStockProductId, { stock: newStock });

    // Find supplier
    const sup = suppliers.find(s => s.id === selectedSupplierId);

    // Add log
    const newLog = {
      id: `h_${Date.now()}`,
      productName: productToUpdate.name,
      type: stockTxType,
      quantity: stockTxQty,
      reason: `${stockTxReason}${sup ? ` (${sup.name})` : ''}`,
      date: 'Agora mesmo',
      operator: currentUser?.name || 'Operador'
    };
    setStockHistory([newLog, ...stockHistory]);
  };

  return (
    <div className="space-y-6">
      {/* Visual Analytics top grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-neutral-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-850 border border-emerald-250 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-neutral-600">Total de Pratos</span>
            <h4 className="text-lg font-black text-neutral-900">{products.length} itens no menu</h4>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-850 border border-emerald-250 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-neutral-600">Markup Médio (ROI)</span>
            <h4 className="text-lg font-black text-neutral-900">+{averageCostMarkup.toFixed(0)}% de lucro</h4>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-850 border border-rose-250 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-neutral-600">Insumos Críticos</span>
            <h4 className="text-lg font-black text-neutral-900">
              {products.filter(p => p.stock <= p.minStock).length} itens exigem compra
            </h4>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-neutral-200 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'catalog'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Cardápio & Estoque Geral
        </button>
        <button
          onClick={() => setActiveSubTab('additions')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'additions'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Adicionais & Combos de Produtos
        </button>
        <button
          onClick={() => setActiveSubTab('stock')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'stock'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Movimentações, Compras & Fornecedores
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === 'categories'
              ? 'border-emerald-500 text-emerald-850'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Gerenciar Categorias
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* Control Actions Panel */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar item pelo nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-emerald-50/50 border border-emerald-200 rounded-xl py-2.5 pl-4 pr-10 text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
                >
                  {dynamicCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="w-full md:w-auto py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center justify-center gap-2 shrink-0 border border-emerald-550"
            >
              <Plus className="w-4 h-4 font-black text-neutral-950" />
              <span>Cadastrar Novo Produto</span>
            </button>
          </div>

          {/* Catalog Table */}
          <div id="products-table-container" className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 text-neutral-750 uppercase tracking-wider text-[10px] font-black border-b border-neutral-200">
                    <th className="py-4 px-6">Produto</th>
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Preço de Custo</th>
                    <th className="py-4 px-6">Preço de Venda</th>
                    <th className="py-4 px-6">Estoque Atual</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-bold text-neutral-800">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock <= p.minStock;
                    const markup = p.cost > 0 ? ((p.price - p.cost) / p.cost) * 100 : 0;
                    return (
                      <tr key={p.id} className="hover:bg-emerald-50/20 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="font-extrabold text-neutral-900">{p.name}</h4>
                              <p className="text-[10px] text-neutral-600 font-bold max-w-[200px] truncate leading-normal">
                                {p.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-emerald-100 text-[10px] px-2 py-1 rounded border border-emerald-250 text-emerald-850 font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-neutral-700 font-bold">R$ {p.cost.toFixed(2)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-black text-neutral-900">R$ {p.price.toFixed(2)}</span>
                            <span className="text-[9px] text-emerald-850 bg-emerald-100 border border-emerald-250 px-1.5 py-0.5 rounded font-black block flex items-center gap-0.5 w-fit">
                              <TrendingUp className="w-2.5 h-2.5" />
                              +{markup.toFixed(0)}% ROI
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                              <span className={isLowStock ? 'text-rose-700 font-black' : 'text-neutral-800'}>
                                {p.stock} unidades
                              </span>
                            </div>
                            {isLowStock && (
                              <span className="text-[9px] text-rose-700 font-extrabold bg-rose-100 border border-rose-250 px-2 py-1 rounded-xl flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                Abaixo do mínimo ({p.minStock})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-neutral-950 border border-neutral-250 transition font-bold"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-250 transition font-bold"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Catalog Cards */}
            <div className="block md:hidden divide-y divide-neutral-200">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.minStock;
                const markup = p.cost > 0 ? ((p.price - p.cost) / p.cost) * 100 : 0;
                return (
                  <div key={p.id} className="p-4 space-y-4 hover:bg-neutral-50/50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-neutral-900 text-xs leading-tight">{p.name}</h4>
                          <span className="inline-block bg-emerald-100 text-[9px] px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800 font-bold">
                            {p.category}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons with larger touch targets for mobile accessibility */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-850 border border-neutral-250 transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-250 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-black text-neutral-400 block mb-0.5">Preço Custo</span>
                        <span className="text-neutral-700 font-bold">R$ {p.cost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-neutral-400 block mb-0.5">Preço Venda</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-neutral-900">R$ {p.price.toFixed(2)}</span>
                          <span className="text-[8px] text-emerald-850 bg-emerald-100 border border-emerald-200 px-1 rounded font-black flex items-center gap-0.5">
                            <TrendingUp className="w-2.5 h-2.5" />
                            +{markup.toFixed(0)}% ROI
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-black text-neutral-400 block mb-1">Estoque Disponível</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isLowStock ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                          <span className={isLowStock ? 'text-rose-700 font-black' : 'text-neutral-800 font-bold'}>
                            {p.stock} unidades
                          </span>
                        </div>
                      </div>
                      {isLowStock && (
                        <div className="text-right shrink-0">
                          <span className="text-[9px] text-rose-800 font-extrabold bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-700" />
                            Abaixo do mín. ({p.minStock})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="py-12 text-center text-xs text-neutral-500 font-bold">
                  Nenhum produto correspondente encontrado nesta categoria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'additions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adicionais Panel */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Adicionais e Ingredientes Extra</h3>
                <p className="text-[10px] text-neutral-600 font-bold">Ingredientes opcionais oferecidos aos clientes nas comandas e PDV</p>
              </div>
              <button
                onClick={() => setShowAddAdditionModal(true)}
                className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold rounded-lg border border-emerald-550 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-200">
              {additionsList.map(add => (
                <div key={add.id} className="p-3 flex justify-between items-center text-xs hover:bg-emerald-50/10">
                  <div>
                    <h4 className="font-bold text-neutral-900">{add.name}</h4>
                    <span className="text-[10px] text-neutral-500 font-bold px-1.5 py-0.5 bg-neutral-100 border border-neutral-250 rounded block w-fit mt-1">{add.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-neutral-950">R$ {add.price.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        setDeleteType('addition');
                        setDeleteTargetId(add.id);
                        setShowDeleteAuth(true);
                      }}
                      className="p-1.5 text-neutral-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combos Panel */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Combos e Ofertas de Produtos</h3>
                <p className="text-[10px] text-neutral-600 font-bold">Ofertas fechadas de produtos agrupados com descontos especiais</p>
              </div>
              <button
                onClick={() => setShowAddComboModal(true)}
                className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold rounded-lg border border-emerald-550 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="space-y-3">
              {combosList.map(combo => (
                <div key={combo.id} className="p-3 bg-emerald-50/20 border border-emerald-150 rounded-xl flex justify-between items-start text-xs">
                  <div className="space-y-1">
                    <h4 className="font-black text-neutral-900">{combo.name}</h4>
                    <p className="text-[10px] text-neutral-600 font-bold leading-relaxed">{combo.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="font-black text-emerald-850 px-2 py-0.5 bg-emerald-100 border border-emerald-250 rounded">R$ {combo.price.toFixed(2)}</span>
                    <button
                      onClick={() => setCombosList(combosList.filter(item => item.id !== combo.id))}
                      className="p-1.5 text-neutral-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input form for stock changes */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4 lg:col-span-1">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm">Registrar Entrada / Saída de Estoque</h3>
                <p className="text-[10px] text-neutral-600 font-bold">Faça o lançamento manual de mercadorias no sistema</p>
              </div>

              <form onSubmit={handleRegisterStockTx} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-600">Produto Alvo</label>
                  <select
                    value={selectedStockProductId}
                    onChange={(e) => setSelectedStockProductId(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Atual: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Tipo de Lançamento</label>
                    <select
                      value={stockTxType}
                      onChange={(e) => setStockTxType(e.target.value as any)}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                    >
                      <option value="in">Entrada (+)</option>
                      <option value="out">Saída (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={stockTxQty}
                      onChange={(e) => setStockTxQty(Number(e.target.value))}
                      className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-600">Fornecedor Associado (Opcional)</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-600">Motivo / Notas</label>
                  <input
                    type="text"
                    required
                    value={stockTxReason}
                    onChange={(e) => setStockTxReason(e.target.value)}
                    placeholder="Ex: Nota Fiscal nº 3254, perda por validade"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl border border-emerald-550 transition shadow-lg shadow-emerald-500/10 mt-1"
                >
                  Registrar Movimentação
                </button>
              </form>
            </div>

            {/* List of Suppliers */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-sm">Cadastro de Fornecedores & Insumos</h3>
                  <p className="text-[10px] text-neutral-600 font-bold">Parceiros comerciais e registro de compras financeiras de estoque</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedInboundProductId(products[0]?.id || '');
                      setInboundBrand('');
                      setInboundExpiration('');
                      setInboundQty(5);
                      setInboundCost(50);
                      setShowInboundModal(true);
                    }}
                    className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-bold rounded-lg border border-emerald-550 transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Lançar Compra</span>
                  </button>
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-250 text-neutral-800 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Fornecedor</span>
                </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs font-bold">
                  <thead>
                    <tr className="bg-emerald-50/50 text-neutral-700 uppercase text-[9px] tracking-wider border-b border-neutral-200">
                      <th className="py-3 px-4">Fornecedor</th>
                      <th className="py-3 px-4">CNPJ</th>
                      <th className="py-3 px-4">Telefone</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-250 text-neutral-800">
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-emerald-50/10">
                        <td className="py-3 px-4 text-neutral-900 font-black">{s.name}</td>
                        <td className="py-3 px-4 font-normal text-neutral-600">{s.cnpj}</td>
                        <td className="py-3 px-4">{s.phone}</td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] text-emerald-850 font-bold">{s.category}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSuppliers(suppliers.filter(item => item.id !== s.id))}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Log of stock changes */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm">Histórico Recente de Alterações de Estoque</h3>
              <p className="text-[10px] text-neutral-600 font-bold">Auditoria de movimentações e suprimento de compras</p>
            </div>

            <div className="space-y-2.5">
              {stockHistory.map(log => (
                <div key={log.id} className="p-3 border border-neutral-150 rounded-xl flex items-center justify-between text-xs font-bold hover:bg-neutral-50 transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${log.type === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <h4 className="text-neutral-900 font-black">{log.productName}</h4>
                      <p className="text-[10px] text-neutral-600 font-normal">Motivo: {log.reason} • Registrado por: {log.operator}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold ${log.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {log.type === 'in' ? '+' : '-'}{log.quantity} unidades
                    </span>
                    <span className="text-[9px] text-neutral-500 block font-normal">{log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL (Add & Edit combined) - Enriched */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-neutral-200 shadow-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden"
            >
              {/* Left Column: Form Fields */}
              <div className="flex-1 space-y-4 md:w-3/5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-base mb-0.5">
                      {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Item'}
                    </h3>
                    <p className="text-[10px] text-neutral-600 font-bold">
                      {editingProduct ? `Editando: ${editingProduct.name}` : 'Insira os dados do insumo ou prato do cardápio'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="p-1.5 rounded-full text-neutral-600 hover:bg-neutral-100 transition md:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Name */}
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Nome do prato *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: Pizza Portuguesa"
                        className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition text-neutral-900 font-bold"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Categoria *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition text-neutral-900 font-bold cursor-pointer"
                      >
                        {categories.map(c => c.name).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Current stock */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Estoque atual *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition text-neutral-900 font-bold"
                      />
                    </div>

                    {/* Cost Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Preço de custo (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        value={formCost}
                        onChange={(e) => setFormCost(Number(e.target.value))}
                        className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition text-neutral-900 font-bold"
                      />
                    </div>

                    {/* Selling Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Preço de venda (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        min="0.01"
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition text-neutral-900 font-bold"
                      />
                    </div>

                    {/* Min Stock warning */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Estoque de Alerta *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formMinStock}
                        onChange={(e) => setFormMinStock(Number(e.target.value))}
                        className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition text-neutral-900 font-bold"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Descrição / Ingredientes</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Molho artesanal, muçarela premium, orégano chileno..."
                      className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition text-neutral-900 font-bold resize-none h-14"
                    ></textarea>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Image Upload & Compression */}
              <div className="md:w-2/5 flex flex-col justify-between bg-neutral-50/80 border border-neutral-200 rounded-2xl p-5 space-y-4 shrink-0">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Mídia do Produto</h4>
                  <p className="text-[9px] text-neutral-400 font-bold">Foto real do item para o cardápio e PDV</p>
                </div>

                {/* Upload Method Toggle */}
                <div className="flex bg-neutral-200/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      uploadMethod === 'file' ? 'bg-white text-neutral-950 font-black shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('url')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      uploadMethod === 'url' ? 'bg-white text-neutral-950 font-black shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span>Link URL</span>
                  </button>
                </div>

                {/* Main Upload Area */}
                <div className="flex-1 flex flex-col justify-center">
                  {uploadMethod === 'file' ? (
                    <div className="space-y-3">
                      {formImage && !isCompressing ? (
                        <div className="relative group rounded-xl overflow-hidden border border-neutral-250 bg-white p-1.5 shadow-sm">
                          <img
                            src={formImage}
                            alt="Preview do produto"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormImage('');
                              setOriginalSize(null);
                              setCompressedSize(null);
                            }}
                            className="absolute top-3 right-3 bg-neutral-950/80 hover:bg-neutral-950 text-white p-1.5 rounded-full shadow-md transition cursor-pointer"
                            title="Remover Imagem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {originalSize && compressedSize && (
                            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-150 rounded-lg text-[9px] text-emerald-800 font-bold leading-normal space-y-0.5 animate-fadeIn">
                              <div className="flex justify-between">
                                <span>Original:</span>
                                <span className="font-extrabold text-neutral-500 line-through">{(originalSize / 1024).toFixed(0)} KB</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Otimizado:</span>
                                <span className="font-extrabold text-emerald-950">{(compressedSize / 1024).toFixed(0)} KB</span>
                              </div>
                              <div className="text-center font-black pt-1 border-t border-emerald-250/60 mt-1 uppercase text-emerald-850 text-[8px] tracking-wide">
                                Redução de {(((originalSize - compressedSize) / originalSize) * 100).toFixed(0)}% com upscale inteligente
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragActive(true);
                          }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              optimizeImage(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => document.getElementById('product-file-input')?.click()}
                          className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer transition select-none ${
                            dragActive ? 'border-emerald-500 bg-emerald-50/30' : 'border-neutral-350 hover:border-emerald-500 bg-white shadow-sm'
                          }`}
                        >
                          <input
                            id="product-file-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                optimizeImage(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                          {isCompressing ? (
                            <div className="space-y-2 text-center">
                              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                              <span className="text-[10px] text-neutral-600 font-extrabold">Otimizando imagem...</span>
                            </div>
                          ) : (
                            <div className="space-y-1 text-center">
                              <Upload className="w-7 h-7 text-neutral-400 mx-auto mb-1" />
                              <span className="text-[10px] text-neutral-800 font-black block">Arrastar Imagem</span>
                              <span className="text-[8.5px] text-neutral-500 font-bold block">ou clique para fazer upload</span>
                              <span className="text-[7.5px] text-neutral-400 font-bold block mt-1">Compressão automática para salvar espaço</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-neutral-500">Link Remoto</label>
                        <input
                          type="text"
                          value={formImage}
                          onChange={(e) => setFormImage(e.target.value)}
                          placeholder="Ex: https://images.unsplash.com/..."
                          className="w-full bg-white border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 text-neutral-900 font-bold text-[10px]"
                        />
                      </div>
                      {formImage && (
                        <div className="rounded-xl overflow-hidden border border-neutral-200 bg-white p-1.5 shadow-sm">
                          <img
                            src={formImage}
                            alt="Preview da URL"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white border border-neutral-200 rounded-xl w-full text-left space-y-1 text-[9px] font-bold text-neutral-500">
                  <span className="font-black text-neutral-600 block uppercase tracking-wider text-[8px] mb-0.5">Dica Profissional</span>
                  Imagens otimizadas reduzem o consumo de internet móvel dos tablets de atendimento e aceleram a abertura do PDV em 5x.
                </div>
              </div>

              {/* Desktop Close Icon button */}
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="hidden md:block absolute top-4 right-4 p-1.5 rounded-full text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      
      {/* Modal: Add Addition */}
        {showAddAdditionModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 border border-neutral-250 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddAdditionModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-neutral-900 text-sm mb-4">Adicionar Novo Adicional</h3>
              <form onSubmit={handleAddAddition} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Nome do Ingrediente</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Ex: Catupiry Original"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={addPrice}
                    onChange={(e) => setAddPrice(Number(e.target.value))}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Categoria Associada</label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    {categories.map(c => c.name).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl border border-emerald-550 transition"
                >
                  Confirmar Adição
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Add Combo */}
        {showAddComboModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 border border-neutral-250 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddComboModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-neutral-900 text-sm mb-4">Adicionar Novo Combo</h3>
              <form onSubmit={handleAddCombo} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Nome do Combo</label>
                  <input
                    type="text"
                    required
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    placeholder="Ex: Combo Smash + Batata"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={comboPrice}
                    onChange={(e) => setComboPrice(Number(e.target.value))}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Descrição dos Itens do Combo</label>
                  <textarea
                    rows={3}
                    required
                    value={comboDesc}
                    onChange={(e) => setComboDesc(e.target.value)}
                    placeholder="Quais pratos e bebidas compõem esse combo..."
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl border border-emerald-550 transition"
                >
                  Confirmar Combo
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal: Add Supplier */}
        {showAddSupplierModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 border border-neutral-250 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="font-extrabold text-neutral-900 text-sm mb-4">Adicionar Novo Fornecedor</h3>
              <form onSubmit={handleAddSupplier} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Razão Social / Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="Ex: Distribuidora de Gás São Jorge"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">CNPJ</label>
                  <input
                    type="text"
                    required
                    value={supCnpj}
                    onChange={(e) => setSupCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Telefone</label>
                  <input
                    type="text"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="Ex: (11) 98888-7777"
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-500">Categoria de Insumo</label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value)}
                    className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    {categories.filter(c => c.type === 'supplier').length === 0 ? (
                      <>
                        <option value="Geral">Geral</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Carnes e Frios">Carnes e Frios</option>
                        <option value="Verduras e Legumes">Verduras e Legumes</option>
                        <option value="Embalagens">Embalagens</option>
                        <option value="Gás e Utensílios">Gás e Utensílios</option>
                      </>
                    ) : (
                      categories.filter(c => c.type === 'supplier').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl border border-emerald-550 transition"
                >
                  Salvar Fornecedor
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm">Gerenciador de Categorias</h3>
              <p className="text-[10px] text-neutral-600 font-bold">Crie, edite e organize os agrupamentos de pratos do cardápio, insumos do estoque e fornecedores</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryFormName('');
                setShowCategoryModal(true);
              }}
              className="w-full md:w-auto py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 border border-emerald-550 cursor-pointer"
            >
              <Plus className="w-4 h-4 font-black" />
              <span>Nova Categoria</span>
            </button>
          </div>

          {/* Sub-tabs Selector for Category Types */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200 w-full max-w-2xl shadow-sm">
            <button
              onClick={() => setSelectedCategoryType('product')}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition cursor-pointer ${
                selectedCategoryType === 'product'
                  ? 'bg-white text-emerald-850 shadow border border-neutral-250/30'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Categorias do Cardápio
            </button>
            <button
              onClick={() => setSelectedCategoryType('insumo')}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition cursor-pointer ${
                selectedCategoryType === 'insumo'
                  ? 'bg-white text-emerald-850 shadow border border-neutral-250/30'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Categorias de Insumos
            </button>
            <button
              onClick={() => setSelectedCategoryType('supplier')}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition cursor-pointer ${
                selectedCategoryType === 'supplier'
                  ? 'bg-white text-emerald-850 shadow border border-neutral-250/30'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Categorias de Fornecedores
            </button>
          </div>

          {/* Categories Table */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 text-neutral-750 uppercase tracking-wider text-[10px] font-black border-b border-neutral-200">
                    <th className="py-4 px-6">Categoria</th>
                    <th className="py-4 px-6">Slug</th>
                    <th className="py-4 px-6">Vínculos Relacionais</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-bold text-neutral-800">
                  {categories.filter(c => (c.type || 'product') === selectedCategoryType).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-neutral-500 font-bold">
                        Nenhuma categoria deste tipo cadastrada. Clique em "+ Nova Categoria" para registrar.
                      </td>
                    </tr>
                  ) : (
                    categories.filter(c => (c.type || 'product') === selectedCategoryType).map((c) => {
                      let linkedText = '';
                      if (selectedCategoryType === 'product') {
                        const linkedCount = products.filter(
                          (p) => p.category && p.category.toLowerCase() === c.name.toLowerCase()
                        ).length;
                        linkedText = `${linkedCount} ${linkedCount === 1 ? 'produto no menu' : 'produtos no menu'}`;
                      } else if (selectedCategoryType === 'insumo') {
                        const linkedCount = products.filter(
                          (p) => p.category && p.category.toLowerCase() === c.name.toLowerCase()
                        ).length;
                        linkedText = `${linkedCount} ${linkedCount === 1 ? 'insumo de estoque' : 'insumos de estoque'}`;
                      } else if (selectedCategoryType === 'supplier') {
                        const linkedCount = suppliers.filter(
                          (s) => s.category && s.category.toLowerCase() === c.name.toLowerCase()
                        ).length;
                        linkedText = `${linkedCount} ${linkedCount === 1 ? 'fornecedor parceiro' : 'fornecedores parceiros'}`;
                      }

                      return (
                        <tr key={c.id} className="hover:bg-emerald-50/20 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                              <span className="text-neutral-900 font-extrabold">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-neutral-500 font-mono text-[10px]">
                            {c.slug}
                          </td>
                          <td className="py-4 px-6 text-neutral-600">
                            {linkedText}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setEditingCategory({ id: c.id, name: c.name });
                                  setCategoryFormName(c.name);
                                  setShowCategoryModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-250 transition font-bold cursor-pointer"
                                title="Renomear Categoria"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteType('category');
                                  setDeleteTargetId(c.id);
                                  setShowDeleteAuth(true);
                                }}
                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-250 transition font-bold cursor-pointer"
                                title="Excluir Categoria"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR COMPRA DE INSUMOS */}
      <AnimatePresence>
        {showInboundModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowInboundModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-neutral-200 pb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-850">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-sm">Registrar Compra de Insumos</h3>
                  <p className="text-[10px] text-neutral-600 font-bold">Entrada de estoque com lançamento automático no financeiro</p>
                </div>
              </div>

              <form onSubmit={handleRegisterInboundStock} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-neutral-600">Insumo / Produto Alvo *</label>
                  <select
                    value={selectedInboundProductId}
                    onChange={(e) => setSelectedInboundProductId(e.target.value)}
                    className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Marca / Fabricante *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Tio João, Nestlé..."
                      value={inboundBrand}
                      onChange={(e) => setInboundBrand(e.target.value)}
                      className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Data de Validade *</label>
                    <input
                      type="date"
                      required
                      value={inboundExpiration}
                      onChange={(e) => setInboundExpiration(e.target.value)}
                      className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Qtd. Adicionada *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={inboundQty}
                      onChange={(e) => setInboundQty(Number(e.target.value))}
                      className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-600">Valor Gasto (R$) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={inboundCost}
                      onChange={(e) => setInboundCost(Number(e.target.value))}
                      className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none text-neutral-900 font-bold"
                    />
                  </div>
                </div>

                {cashRegister && !cashRegister.isOpen && (
                  <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-250 p-3 rounded-xl flex items-start gap-1.5 font-bold leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Atenção: O caixa está fechado. A compra será registrada no estoque, mas o lançamento financeiro automático de despesa ficará pendente. Abra o caixa primeiro para vincular.</span>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInboundModal(false)}
                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Lançar Entrada
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE SEGURANÇA: EXCLUSÃO COM SENHA DE ADMIN */}
      <AdminPasswordModal
        isOpen={showDeleteAuth}
        onClose={() => {
          setShowDeleteAuth(false);
          setDeleteTargetId(null);
          setDeleteType(null);
        }}
        onConfirm={async (password) => {
          if (!deleteTargetId || !deleteType) return;

          if (deleteType === 'product') {
            await onDeleteProduct(deleteTargetId, password);
          } else if (deleteType === 'category') {
            await onDeleteCategory(deleteTargetId, password);
          } else if (deleteType === 'addition') {
            const target = additionsList.find(a => a.id === deleteTargetId);
            const name = target ? target.name : 'Adicional';
            await verifyAdminPassword(
              password,
              'delete_addition',
              `Excluiu o adicional "${name}" (ID: ${deleteTargetId})`
            );
            setAdditionsList(prev => prev.filter(item => item.id !== deleteTargetId));
          }
        }}
        description={
          deleteType === 'product' ? "Digite a senha do administrador para autorizar a exclusão permanente do produto no banco de dados." :
          deleteType === 'category' ? "Digite a senha do administrador para autorizar a exclusão permanente da categoria no banco de dados." :
          "Digite a senha do administrador para autorizar a exclusão permanente deste adicional."
        }
      />

      {/* MODAL: CADASTRAR/EDITAR CATEGORIA */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-neutral-200 shadow-2xl space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-neutral-200 pb-2">
                <h3 className="font-extrabold text-neutral-900 text-base">
                  {editingCategory ? 'Renomear Categoria' : 'Nova Categoria'}
                </h3>
                <p className="text-[10px] text-neutral-600 font-bold">
                  {editingCategory ? `Renomeando: ${editingCategory.name}` : 'Cadastre uma nova classificação para seus produtos'}
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!categoryFormName.trim()) return;

                  if (editingCategory) {
                    await onUpdateCategory(editingCategory.id, categoryFormName);
                  } else {
                    await onAddCategory(categoryFormName, selectedCategoryType);
                  }
                  setShowCategoryModal(false);
                }}
                className="space-y-4 text-xs font-semibold"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Nome da Categoria *</label>
                  <input
                    type="text"
                    required
                    value={categoryFormName}
                    onChange={(e) => setCategoryFormName(e.target.value)}
                    placeholder="Ex: Drinks, Pratos Executivos..."
                    className="w-full bg-emerald-50/30 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition text-neutral-900 font-bold"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    {editingCategory ? 'Salvar Nome' : 'Criar Categoria'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
