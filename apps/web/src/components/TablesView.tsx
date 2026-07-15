import { useState, useEffect, FormEvent } from 'react';
import {
  Grid,
  List,
  Map,
  Users,
  Clock,
  Plus,
  Trash2,
  DollarSign,
  UtensilsCrossed,
  Search,
  Check,
  CheckCircle,
  Sparkles,
  X,
  Edit2,
  Copy,
  ArrowLeftRight,
  Divide,
  Merge,
  History,
  Lock,
  Wrench,
  AlertTriangle,
  ChevronRight,
  CornerDownRight,
  Calendar,
  Layers,
  MessageSquare,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Table, Product, Order, OrderItem, Comanda, EventoHistorico, Employee } from '../types';

interface TablesViewProps {
  tables: Table[];
  products: Product[];
  orders: Order[];
  employees: Employee[];
  currentUser: Employee | null;
  onCreateOrder: (orderData: any) => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onPayOrder: (orderId: string, method: any, discount: number) => void;
  onUpdateTableStatus: (tableId: string, status: any, orderId?: string, totalBill?: number) => void;
}

export function TablesView({
  tables,
  products,
  orders,
  employees = [],
  currentUser,
  onCreateOrder,
  onUpdateOrderStatus,
  onPayOrder,
  onUpdateTableStatus
}: TablesViewProps) {
  // Enhanced tables state loaded from localStorage or initialized
  const [enhancedTables, setEnhancedTables] = useState<Table[]>([]);

  // Selected table detail view state
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Layout switcher: 'grid' | 'list' | 'map'
  const [activeLayout, setActiveLayout] = useState<'grid' | 'list' | 'map'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  // Multi-comanda active selection
  const [activeComandaId, setActiveComandaId] = useState<string | null>(null);

  // In-app Notification simulation toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // MODAL SWITCHERS & FORM STATES
  // 1. Create Table Modal Form States (Enriched)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState(4);
  const [newTableArea, setNewTableArea] = useState('Salão Principal');
  const [newTableColor, setNewTableColor] = useState('#10b981');
  const [newTableObs, setNewTableObs] = useState('');
  const [newTableStatus, setNewTableStatus] = useState<Table['status']>('available');
  const [newTableShape, setNewTableShape] = useState<'circle' | 'square' | 'rectangle' | 'booth'>('square');
  const [newTableIsVip, setNewTableIsVip] = useState<boolean>(false);
  const [newTableIsReservable, setNewTableIsReservable] = useState<boolean>(true);
  const [newTableWaiterId, setNewTableWaiterId] = useState<string>('');
  const [customAreaText, setCustomAreaText] = useState('');
  const [showCustomAreaInput, setShowCustomAreaInput] = useState(false);

  // 2. Edit Table Modal (Enriched)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableNum, setEditTableNum] = useState('');
  const [editTableCap, setEditTableCap] = useState(4);
  const [editTableArea, setEditTableArea] = useState('Salão Principal');
  const [editTableColor, setEditTableColor] = useState('#10b981');
  const [editTableObs, setEditTableObs] = useState('');
  const [editTableStatus, setEditTableStatus] = useState<Table['status']>('available');
  const [editTableShape, setEditTableShape] = useState<'circle' | 'square' | 'rectangle' | 'booth'>('square');
  const [editTableIsVip, setEditTableIsVip] = useState<boolean>(false);
  const [editTableIsReservable, setEditTableIsReservable] = useState<boolean>(true);
  const [editTableWaiterId, setEditTableWaiterId] = useState<string>('');
  const [editCustomAreaText, setEditCustomAreaText] = useState('');
  const [editShowCustomAreaInput, setEditShowCustomAreaInput] = useState(false);

  // 3. Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

  // 4. Nova Comanda Modal
  const [showComandaModal, setShowComandaModal] = useState(false);
  const [comandaClient, setComandaClient] = useState('');
  const [comandaPhone, setComandaPhone] = useState('');
  const [comandaPeople, setComandaPeople] = useState(2);
  const [comandaWaiter, setComandaWaiter] = useState('e3'); // default waiter Juliana Lima
  const [comandaObs, setComandaObs] = useState('');

  // 5. Transfer Comanda Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetTableId, setTransferTargetTableId] = useState('');

  // 6. Move Items Modal
  const [showMoveItemsModal, setShowMoveItemsModal] = useState(false);
  const [moveSelectedItemId, setMoveSelectedItemId] = useState('');
  const [moveQuantity, setMoveQuantity] = useState(1);
  const [moveTargetComandaId, setMoveTargetComandaId] = useState('');

  // 7. Merge Comandas Modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetComandaId, setMergeTargetComandaId] = useState('');

  // 8. Separate Comanda Modal
  const [showSeparateModal, setShowSeparateModal] = useState(false);
  const [separateSelectedItemId, setSeparateSelectedItemId] = useState('');
  const [separateQuantity, setSeparateQuantity] = useState(1);
  const [separateNewClient, setSeparateNewClient] = useState('');

  // 9. Local Comanda product search & catalog adder
  const [comandaSearchQuery, setComandaSearchQuery] = useState('');

  // 10. Direct payment / checkout flow inside details
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'cash' | 'pix'>('pix');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [comandaSplitPayment, setComandaSplitPayment] = useState(false);
  const [comandaSplitCount, setComandaSplitCount] = useState(2);


  // Default areas
  const areas = ['Salão Principal', 'Varanda', 'Área Externa', 'VIP', 'Piso Superior', 'Balcão'];

  // Default waiters mock (Carlos Ramos, Bruna Reis, etc.)
  const waiters = [
    { id: 'e1', name: 'Ana Souza' },
    { id: 'e2', name: 'Carlos Ramos' },
    { id: 'e3', name: 'Juliana Lima' },
    { id: 'e4', name: 'Matheus Costa' },
    { id: 'e5', name: 'Bruna Reis' }
  ];

  // Colors list for visual custom tags
  const tableColors = [
    { label: 'Esmeralda', value: '#10b981' },
    { label: 'Azul Celeste', value: '#3b82f6' },
    { label: 'Ouro Âmbar', value: '#f59e0b' },
    { label: 'Roxo VIP', value: '#8b5cf6' },
    { label: 'Rosa Premium', value: '#ec4899' },
    { label: 'Grafite', value: '#6b7280' }
  ];

  // Reset payment split configurations on active comanda change
  useEffect(() => {
    setComandaSplitPayment(false);
    setComandaSplitCount(2);
    setDiscountAmount(0);
    setShowPaymentFlow(false);
  }, [activeComandaId]);

  // Initialize enhanced tables
  useEffect(() => {
    const stored = localStorage.getItem('gourmet_enhanced_tables_v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setEnhancedTables(parsed);
          return;
        }
      } catch (e) {
        console.error('Falha ao decodificar tabelas salvas. Resetando...', e);
      }
    }

    // Prepopulate
    const initial = tables.map((t) => {
      let area = 'Salão Principal';
      let color = '#10b981';
      if (t.id === 't3') { area = 'Área Externa'; color = '#3b82f6'; }
      else if (t.id === 't5') { area = 'Varanda'; color = '#f59e0b'; }
      else if (t.id === 't6') { area = 'VIP'; color = '#8b5cf6'; }
      else if (t.id === 't7') { area = 'VIP'; color = '#8b5cf6'; }
      else if (t.id === 't8') { area = 'Piso Superior'; color = '#ec4899'; }
      else if (t.id === 't9' || t.id === 't10') { area = 'Balcão'; color = '#6b7280'; }

      const comandas: Comanda[] = [];
      if (t.status === 'occupied' || t.status === 'billing') {
        const activeOrder = orders.find(o => o.id === t.currentOrderId);
        comandas.push({
          id: `c_init_${t.id}`,
          mesaId: t.id,
          cliente: activeOrder?.customerName || 'Cliente Principal',
          telefone: '(11) 99999-0000',
          quantidadePessoas: t.capacity,
          items: activeOrder?.items || [],
          status: t.status === 'billing' ? 'billing' : 'active',
          criadaEmISO: activeOrder?.createdAt || new Date().toISOString(),
          totalBill: t.totalBill || 0
        });
      }

      const history: EventoHistorico[] = [
        {
          id: `h_init_${t.id}`,
          mesaId: t.id,
          tipo: 'create',
          descricao: `Mesa ${t.number} inicializada no sistema.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        }
      ];

      return {
        ...t,
        name: `Mesa ${t.number}`,
        area,
        color,
        observation: '',
        comandas,
        history
      };
    });

    setEnhancedTables(initial);
    localStorage.setItem('gourmet_enhanced_tables_v2', JSON.stringify(initial));
  }, [tables]);

  // Toast notifier helper
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Safe State Update Handler
  const saveState = (updated: Table[]) => {
    setEnhancedTables(updated);
    localStorage.setItem('gourmet_enhanced_tables_v2', JSON.stringify(updated));
  };

  // Find currently selected table
  const currentTable = enhancedTables.find(t => t.id === selectedTableId) || null;

  // Active comanda
  const activeComanda = currentTable?.comandas?.find(c => c.id === activeComandaId) || currentTable?.comandas?.[0] || null;

  // 5.1 CRIAR MESA
  const handleCreateTable = (e: FormEvent) => {
    e.preventDefault();
    if (!newTableNum) {
      notify('Número da mesa é obrigatório!', 'error');
      return;
    }

    // Check uniqueness
    const exists = enhancedTables.some(t => t.number === newTableNum);
    if (exists) {
      notify(`Já existe uma mesa cadastrada com o número ${newTableNum}!`, 'error');
      return;
    }

    const newId = `t_${Date.now()}`;
    const newTable: Table = {
      id: newId,
      number: newTableNum,
      capacity: Number(newTableCap) || 4,
      status: newTableStatus,
      name: `Mesa ${newTableNum}`,
      area: newTableArea,
      color: newTableColor,
      observation: newTableObs,
      comandas: [],
      history: [
        {
          id: `h_${Date.now()}`,
          mesaId: newId,
          tipo: 'create',
          descricao: `Mesa ${newTableNum} criada com capacidade de ${newTableCap} pessoas no setor ${newTableArea}.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        }
      ]
    };

    const updated = [...enhancedTables, newTable];
    saveState(updated);
    setShowCreateModal(false);
    // Reset fields
    setNewTableNum('');
    setNewTableCap(4);
    setNewTableObs('');
    notify(`Mesa ${newTableNum} criada com sucesso!`, 'success');
  };

  // 5.2 EDITAR MESA
  const handleEditTable = (e: FormEvent) => {
    e.preventDefault();
    if (!editingTableId) return;

    const target = enhancedTables.find(t => t.id === editingTableId);
    if (!target) return;

    // Check if duplicate number
    const duplicate = enhancedTables.some(t => t.number === editTableNum && t.id !== editingTableId);
    if (duplicate) {
      notify(`Já existe outra mesa com o número ${editTableNum}!`, 'error');
      return;
    }

    const updated = enhancedTables.map(t => {
      if (t.id === editingTableId) {
        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          tipo: 'edit',
          descricao: `Configurações atualizadas: Número: ${editTableNum}, Capacidade: ${editTableCap}, Setor: ${editTableArea}.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        const finalArea = editShowCustomAreaInput && editCustomAreaText.trim() ? editCustomAreaText.trim() : editTableArea;
        return {
          ...t,
          number: editTableNum,
          name: `Mesa ${editTableNum}`,
          capacity: Number(editTableCap),
          area: finalArea,
          color: editTableColor,
          observation: editTableObs,
          status: editTableStatus,
          shape: editTableShape,
          isVip: editTableIsVip,
          isReservable: editTableIsReservable,
          preferredWaiterId: editTableWaiterId || undefined,
          history: [...history, log]
        };
      }
      return t;
    });

    saveState(updated);
    setShowEditModal(false);
    notify(`Mesa ${editTableNum} atualizada com sucesso!`, 'success');
  };

  // 5.3 EXCLUIR MESA
  const handleDeleteTable = () => {
    if (!deletingTableId) return;
    const target = enhancedTables.find(t => t.id === deletingTableId);
    if (!target) return;

    if (target.status !== 'available' && target.status !== 'cleaning') {
      notify('Apenas mesas livres ou em higienização podem ser excluídas!', 'error');
      return;
    }

    const updated = enhancedTables.filter(t => t.id !== deletingTableId);
    saveState(updated);
    setShowDeleteModal(false);
    setSelectedTableId(null);
    notify(`Mesa ${target.number} removida do mapa com sucesso!`, 'success');
  };

  // 5.4 DUPLICAR MESA
  const handleDuplicateTable = (table: Table) => {
    // Generate next available number
    const numbers = enhancedTables.map(t => parseInt(t.number)).filter(n => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumStr = String(maxNum + 1).padStart(2, '0');

    const newId = `t_${Date.now()}`;
    const duplicated: Table = {
      ...table,
      id: newId,
      number: nextNumStr,
      name: `Mesa ${nextNumStr}`,
      status: 'available',
      currentOrderId: undefined,
      totalBill: undefined,
      comandas: [],
      history: [
        {
          id: `h_${Date.now()}`,
          mesaId: newId,
          tipo: 'create',
          descricao: `Mesa duplicada a partir da Mesa ${table.number}. Nova numeração: ${nextNumStr}.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        }
      ]
    };

    const updated = [...enhancedTables, duplicated];
    saveState(updated);
    notify(`Mesa ${table.number} duplicada com sucesso para a Mesa ${nextNumStr}!`, 'success');
  };

  // 5.5 ALTERAR STATUS MANUALMENTE
  const handleStatusChange = (tableId: string, newStatus: Table['status']) => {
    const table = enhancedTables.find(t => t.id === tableId);
    if (!table) return;

    // Check rules: Cannot set Libre if comandas are active
    if (newStatus === 'available' && table.comandas && table.comandas.length > 0) {
      notify('Não é possível liberar a mesa pois ainda existem comandas de clientes ativas!', 'error');
      return;
    }

    const updated = enhancedTables.map(t => {
      if (t.id === tableId) {
        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          tipo: 'status',
          descricao: `Status alterado manualmente para "${newStatus.toUpperCase()}".`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };
        return {
          ...t,
          status: newStatus,
          history: [...history, log]
        };
      }
      return t;
    });

    saveState(updated);
    onUpdateTableStatus(tableId, newStatus);
    notify(`Mesa ${table.number} alterada para status: ${newStatus}`, 'info');
  };

  // 5.6 ABRIR NOVA COMANDA
  const handleCreateComanda = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTableId) return;

    if (!comandaClient) {
      notify('Nome do cliente responsável é obrigatório!', 'error');
      return;
    }

    const newComanda: Comanda = {
      id: `c_${Date.now()}`,
      mesaId: selectedTableId,
      cliente: comandaClient,
      telefone: comandaPhone || undefined,
      quantidadePessoas: Number(comandaPeople) || 1,
      garcomId: comandaWaiter,
      observacoes: comandaObs || undefined,
      items: [],
      status: 'active',
      criadaEmISO: new Date().toISOString(),
      totalBill: 0
    };

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = t.comandas || [];
        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          comandaId: newComanda.id,
          tipo: 'comanda_open',
          descricao: `Nova comanda aberta para o cliente "${comandaClient}" (${comandaPeople} pessoas).`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return {
          ...t,
          status: 'occupied' as const,
          comandas: [...comandas, newComanda],
          history: [...history, log]
        };
      }
      return t;
    });

    saveState(updated);
    onUpdateTableStatus(selectedTableId, 'occupied');
    setShowComandaModal(false);
    // Reset fields
    setComandaClient('');
    setComandaPhone('');
    setComandaPeople(2);
    setComandaObs('');
    notify(`Comanda aberta para ${comandaClient}!`, 'success');
  };

  // 5.8 RENOMEAR / EDITAR COMANDA
  const handleEditComandaDetails = (comandaId: string, newName: string, newPhone: string, newObs: string) => {
    if (!selectedTableId || !newName) return;

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = (t.comandas || []).map(c => {
          if (c.id === comandaId) {
            return {
              ...c,
              cliente: newName,
              telefone: newPhone || undefined,
              observacoes: newObs || undefined
            };
          }
          return c;
        });

        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          comandaId,
          tipo: 'edit',
          descricao: `Comanda de cliente renomeada/editada para "${newName}".`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return {
          ...t,
          comandas,
          history: [...history, log]
        };
      }
      return t;
    });

    saveState(updated);
    notify('Detalhes da comanda atualizados!', 'success');
  };

  // 5.9 TRANSFERIR COMANDA PARA OUTRA MESA
  const handleTransferComanda = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || !activeComanda || !transferTargetTableId) return;

    const targetTable = enhancedTables.find(t => t.id === transferTargetTableId);
    if (!targetTable) return;

    if (targetTable.status === 'blocked' || targetTable.status === 'maintenance') {
      notify('A mesa de destino está bloqueada ou em manutenção!', 'error');
      return;
    }

    // Move comanda from source to target table
    const updated = enhancedTables.map(t => {
      // 1. Remove from source
      if (t.id === selectedTableId) {
        const remainingComandas = (t.comandas || []).filter(c => c.id !== activeComanda.id);
        const newStatus = remainingComandas.length === 0 ? ('available' as const) : t.status;
        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          comandaId: activeComanda.id,
          tipo: 'comanda_transfer',
          descricao: `Comanda de "${activeComanda.cliente}" transferida para a Mesa ${targetTable.number}.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return {
          ...t,
          status: newStatus,
          comandas: remainingComandas,
          history: [...history, log]
        };
      }

      // 2. Add to target
      if (t.id === transferTargetTableId) {
        const comandas = t.comandas || [];
        const transferred = { ...activeComanda, mesaId: t.id };
        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          comandaId: activeComanda.id,
          tipo: 'comanda_transfer',
          descricao: `Recebeu comanda de "${activeComanda.cliente}" transferida da Mesa ${currentTable?.number || ''}.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return {
          ...t,
          status: 'occupied' as const,
          comandas: [...comandas, transferred],
          history: [...history, log]
        };
      }

      return t;
    });

    saveState(updated);
    onUpdateTableStatus(transferTargetTableId, 'occupied');
    // If source became empty, set it to cleaning or available
    const srcTable = updated.find(t => t.id === selectedTableId);
    if (srcTable && srcTable.comandas?.length === 0) {
      onUpdateTableStatus(selectedTableId, 'available');
    }

    setShowTransferModal(false);
    setSelectedTableId(transferTargetTableId); // Auto navigate to target table details
    notify(`Comanda de ${activeComanda.cliente} transferida para a Mesa ${targetTable.number}!`, 'success');
  };

  // 5.10 MOVER ITENS ENTRE COMANDAS (Mesa atual)
  const handleMoveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || !activeComanda || !moveSelectedItemId || !moveTargetComandaId) return;

    const sourceItemIndex = activeComanda.items.findIndex(item => item.product.id === moveSelectedItemId);
    if (sourceItemIndex === -1) return;

    const sourceItem = activeComanda.items[sourceItemIndex];
    if (moveQuantity > sourceItem.quantity) {
      notify('Quantidade a mover excede a disponível!', 'error');
      return;
    }

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = (t.comandas || []).map(c => {
          // Source comanda: deduct quantity
          if (c.id === activeComanda.id) {
            const items = c.items.map(item => {
              if (item.product.id === moveSelectedItemId) {
                return { ...item, quantity: item.quantity - moveQuantity };
              }
              return item;
            }).filter(item => item.quantity > 0);

            const totalBill = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

            return { ...c, items, totalBill };
          }

          // Target comanda: add quantity
          if (c.id === moveTargetComandaId) {
            const items = [...c.items];
            const targetItemIndex = items.findIndex(item => item.product.id === moveSelectedItemId);

            if (targetItemIndex > -1) {
              items[targetItemIndex] = {
                ...items[targetItemIndex],
                quantity: items[targetItemIndex].quantity + moveQuantity
              };
            } else {
              items.push({
                ...sourceItem,
                quantity: moveQuantity
              });
            }

            const totalBill = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

            return { ...c, items, totalBill };
          }

          return c;
        });

        // Sum overall total bill for parent Table
        const grandTotal = comandas.reduce((sum, c) => sum + c.totalBill, 0);

        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          tipo: 'comanda_move_item',
          descricao: `Movido ${moveQuantity}x de "${sourceItem.product.name}" da comanda "${activeComanda.cliente}" para comanda do ID ${moveTargetComandaId}.`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return { ...t, comandas, totalBill: grandTotal, history: [...history, log] };
      }
      return t;
    });

    saveState(updated);
    setShowMoveItemsModal(false);
    notify('Itens movidos de comanda com sucesso!', 'success');
  };

  // 5.11 UNIR COMANDAS (Mesa atual)
  const handleMergeComandas = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || !activeComanda || !mergeTargetComandaId) return;

    const targetComanda = currentTable?.comandas?.find(c => c.id === mergeTargetComandaId);
    if (!targetComanda) return;

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = (t.comandas || []).map(c => {
          // Keep the target comanda and absorb activeComanda items
          if (c.id === mergeTargetComandaId) {
            const items = [...c.items];
            activeComanda.items.forEach(srcItem => {
              const matchIdx = items.findIndex(item => item.product.id === srcItem.product.id);
              if (matchIdx > -1) {
                items[matchIdx] = {
                  ...items[matchIdx],
                  quantity: items[matchIdx].quantity + srcItem.quantity
                };
              } else {
                items.push(srcItem);
              }
            });

            const mergedNotes = [c.observacoes, activeComanda.observacoes].filter(Boolean).join(' | ');
            const totalBill = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

            return {
              ...c,
              items,
              observacoes: mergedNotes || undefined,
              totalBill
            };
          }
          return c;
        }).filter(c => c.id !== activeComanda.id); // Remove merged comanda

        const grandTotal = comandas.reduce((sum, c) => sum + c.totalBill, 0);
        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          tipo: 'comanda_merge',
          descricao: `Uniu a comanda de "${activeComanda.cliente}" à comanda de "${targetComanda.cliente}".`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return { ...t, comandas, totalBill: grandTotal, history: [...history, log] };
      }
      return t;
    });

    saveState(updated);
    setActiveComandaId(mergeTargetComandaId);
    setShowMergeModal(false);
    notify(`Comandas unificadas sob o nome de ${targetComanda.cliente}!`, 'success');
  };

  // 5.12 SEPARAR COMANDA (Mesa atual - Gera nova comanda)
  const handleSeparateComanda = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || !activeComanda || !separateSelectedItemId || !separateNewClient) return;

    const sourceItemIndex = activeComanda.items.findIndex(item => item.product.id === separateSelectedItemId);
    if (sourceItemIndex === -1) return;

    const sourceItem = activeComanda.items[sourceItemIndex];
    if (separateQuantity > sourceItem.quantity) {
      notify('Quantidade excede o disponível!', 'error');
      return;
    }

    const newComandaId = `c_${Date.now()}`;
    const newComanda: Comanda = {
      id: newComandaId,
      mesaId: selectedTableId,
      cliente: separateNewClient,
      quantidadePessoas: 1,
      items: [{
        ...sourceItem,
        quantity: separateQuantity
      }],
      status: 'active',
      criadaEmISO: new Date().toISOString(),
      totalBill: sourceItem.product.price * separateQuantity
    };

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = (t.comandas || []).map(c => {
          if (c.id === activeComanda.id) {
            const items = c.items.map(item => {
              if (item.product.id === separateSelectedItemId) {
                return { ...item, quantity: item.quantity - separateQuantity };
              }
              return item;
            }).filter(item => item.quantity > 0);

            const totalBill = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            return { ...c, items, totalBill };
          }
          return c;
        });

        const updatedComandas = [...comandas, newComanda];
        const grandTotal = updatedComandas.reduce((sum, c) => sum + c.totalBill, 0);

        const history = t.history || [];
        const log: EventoHistorico = {
          id: `h_${Date.now()}`,
          mesaId: t.id,
          tipo: 'comanda_split',
          descricao: `Separou ${separateQuantity}x de "${sourceItem.product.name}" da comanda de "${activeComanda.cliente}" para nova comanda de "${separateNewClient}".`,
          timestampISO: new Date().toISOString(),
          autor: 'Ana Souza (Administrador)'
        };

        return { ...t, comandas: updatedComandas, totalBill: grandTotal, history: [...history, log] };
      }
      return t;
    });

    saveState(updated);
    setShowSeparateModal(false);
    setActiveComandaId(newComandaId);
    setSeparateNewClient('');
    notify(`Nova comanda criada com sucesso para ${separateNewClient}!`, 'success');
  };

  // Add Item to existing Comanda Cart
  const handleAddItemToComanda = (prod: Product) => {
    if (!selectedTableId || !activeComanda) return;

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = (t.comandas || []).map(c => {
          if (c.id === activeComanda.id) {
            const items = [...c.items];
            const matchIdx = items.findIndex(item => item.product.id === prod.id);

            if (matchIdx > -1) {
              items[matchIdx] = {
                ...items[matchIdx],
                quantity: items[matchIdx].quantity + 1
              };
            } else {
              items.push({
                product: prod,
                quantity: 1,
                selectedAdditions: []
              });
            }

            const totalBill = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            return { ...c, items, totalBill };
          }
          return c;
        });

        const grandTotal = comandas.reduce((sum, c) => sum + c.totalBill, 0);
        return { ...t, comandas, totalBill: grandTotal };
      }
      return t;
    });

    saveState(updated);
    notify(`1x "${prod.name}" adicionado à comanda de ${activeComanda.cliente}!`, 'success');
  };

  // Remove Item from existing Comanda Cart
  const handleRemoveItemFromComanda = (prodId: string) => {
    if (!selectedTableId || !activeComanda) return;

    const updated = enhancedTables.map(t => {
      if (t.id === selectedTableId) {
        const comandas = (t.comandas || []).map(c => {
          if (c.id === activeComanda.id) {
            const items = c.items.map(item => {
              if (item.product.id === prodId) {
                return { ...item, quantity: item.quantity - 1 };
              }
              return item;
            }).filter(item => item.quantity > 0);

            const totalBill = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            return { ...c, items, totalBill };
          }
          return c;
        });

        const grandTotal = comandas.reduce((sum, c) => sum + c.totalBill, 0);
        return { ...t, comandas, totalBill: grandTotal };
      }
      return t;
    });

    saveState(updated);
  };

  // Pay/Close specific active comanda
  const handlePayActiveComanda = () => {
    if (!selectedTableId || !activeComanda) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      const finalAmount = Math.max(0, activeComanda.totalBill - discountAmount);

      // Create a global paid order so it reflects on sales statistics
      const itemsSubtotal = activeComanda.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      onCreateOrder({
        tableId: selectedTableId,
        tableName: currentTable?.name || `Mesa`,
        items: activeComanda.items,
        subtotal: itemsSubtotal,
        discount: discountAmount,
        total: finalAmount,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod,
        customerName: activeComanda.cliente
      });

      // Update local enhanced lists (remove the paid comanda)
      const updated = enhancedTables.map(t => {
        if (t.id === selectedTableId) {
          const remainingComandas = (t.comandas || []).filter(c => c.id !== activeComanda.id);
          const grandTotal = remainingComandas.reduce((sum, c) => sum + c.totalBill, 0);

          // If no comandas left, status is 'cleaning' or 'available'
          const nextStatus = remainingComandas.length === 0 ? ('cleaning' as const) : t.status;

          const history = t.history || [];
          const log: EventoHistorico = {
            id: `h_${Date.now()}`,
            mesaId: t.id,
            comandaId: activeComanda.id,
            tipo: 'payment',
            descricao: `Comanda de "${activeComanda.cliente}" fechada e paga via ${paymentMethod.toUpperCase()}. Valor: R$ ${finalAmount.toFixed(2)}.`,
            timestampISO: new Date().toISOString(),
            autor: 'Ana Souza (Administrador)'
          };

          return {
            ...t,
            status: nextStatus,
            comandas: remainingComandas,
            totalBill: grandTotal,
            history: [...history, log]
          };
        }
        return t;
      });

      saveState(updated);

      // Tell parent about the status change
      const matchedTable = updated.find(t => t.id === selectedTableId)!;
      onUpdateTableStatus(selectedTableId, matchedTable.status, undefined, matchedTable.totalBill);

      setIsProcessingPayment(false);
      setShowPaymentFlow(false);
      setDiscountAmount(0);
      notify(`Comanda de ${activeComanda.cliente} paga e encerrada!`, 'success');
    }, 1500);
  };

  // FILTERED TABLES GENERATOR
  const getFilteredTables = () => {
    return enhancedTables.filter(t => {
      // 1. Search Query
      const matchSearch =
        t.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.area && t.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.comandas && t.comandas.some(c => c.cliente.toLowerCase().includes(searchQuery.toLowerCase())));

      // 2. Status Filter
      let matchStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'has_comandas') {
          matchStatus = !!(t.comandas && t.comandas.length > 0);
        } else if (statusFilter === 'billing_status') {
          matchStatus = t.status === 'billing' || !!(t.comandas && t.comandas.some(c => c.status === 'billing'));
        } else {
          matchStatus = t.status === statusFilter;
        }
      }

      // 3. Area Filter
      let matchArea = true;
      if (areaFilter !== 'all') {
        matchArea = t.area === areaFilter;
      }

      return matchSearch && matchStatus && matchArea;
    });
  };

  const filteredTables = getFilteredTables();

  const getStatusLabel = (status: Table['status']) => {
    const labels: Record<Table['status'], string> = {
      available: 'Disponível',
      occupied: 'Ocupada',
      billing: 'Conta',
      cleaning: 'Higienização',
      reserved: 'Reservada',
      blocked: 'Bloqueada',
      maintenance: 'Manutenção'
    };
    return labels[status] || status;
  };

  const getStatusBadgeStyle = (status: Table['status']) => {
    const styles: Record<Table['status'], string> = {
      available: 'bg-emerald-100 border-emerald-250 text-emerald-800',
      occupied: 'bg-amber-100 border-amber-250 text-amber-950',
      billing: 'bg-blue-100 border-blue-250 text-blue-900',
      cleaning: 'bg-neutral-100 border-neutral-300 text-neutral-800',
      reserved: 'bg-indigo-100 border-indigo-200 text-indigo-800',
      blocked: 'bg-rose-100 border-rose-200 text-rose-800',
      maintenance: 'bg-orange-100 border-orange-250 text-orange-950'
    };
    return styles[status] || 'bg-neutral-100 text-neutral-800';
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Toast System Popup Overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-black border border-white/20 text-neutral-900 ${
              toastType === 'success' ? 'bg-emerald-400' : toastType === 'error' ? 'bg-rose-400' : 'bg-blue-400'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR AND FILTERS WITH RESPONSIVE TOUCH CARDS */}
      <div className="bg-white border border-neutral-200 p-4 rounded-2xl flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-850 flex items-center justify-center border border-emerald-250">
              <Layers className="w-5 h-5 font-black" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-900 text-sm">Controle de Mesas & Comandas v2</h3>
              <p className="text-[10px] text-neutral-600 font-bold">Gestão completa de múltiplos clientes por mesa, divisão de contas e setores</p>
            </div>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            {/* View layout toggle */}
            <div className="bg-neutral-100 p-1 rounded-xl border border-neutral-200 flex gap-0.5">
              <button
                onClick={() => setActiveLayout('grid')}
                className={`p-2 rounded-lg transition ${activeLayout === 'grid' ? 'bg-white text-emerald-850 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                title="Visualização em Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveLayout('list')}
                className={`p-2 rounded-lg transition ${activeLayout === 'list' ? 'bg-white text-emerald-850 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                title="Visualização em Lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveLayout('map')}
                className={`p-2 rounded-lg transition ${activeLayout === 'map' ? 'bg-white text-emerald-850 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}
                title="Mapa de Setores"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>

            {/* Nova Mesa */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-initial py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 border border-emerald-550"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Mesa</span>
            </button>
          </div>
        </div>

        {/* Search Input and Advanced Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar mesa, cliente ou comanda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold text-neutral-800"
            >
              <option value="all">Todos os Status</option>
              <option value="available">Status: Livres</option>
              <option value="occupied">Status: Ocupadas</option>
              <option value="billing_status">Status: Pedindo Conta</option>
              <option value="cleaning">Status: Higienização</option>
              <option value="reserved">Status: Reservadas</option>
              <option value="blocked">Status: Bloqueadas</option>
              <option value="maintenance">Status: Em Manutenção</option>
              <option value="has_comandas">Com Comandas Abertas</option>
            </select>
          </div>

          <div className="flex gap-2">
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold text-neutral-800"
            >
              <option value="all">Todas as Áreas / Setores</option>
              {areas.map(a => (
                <option key={a} value={a}>Setor: {a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LAYOUT RENDERER 1: GRID VIEWS */}
      {activeLayout === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTables.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-neutral-200 rounded-3xl space-y-2">
              <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-600 font-bold">Nenhuma mesa encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            filteredTables.map((table) => {
              const activeComandasCount = table.comandas?.length || 0;
              const hasBilling = table.status === 'billing' || table.comandas?.some(c => c.status === 'billing');

              return (
                <motion.div
                  whileHover={{ y: -3 }}
                  key={table.id}
                  onClick={() => {
                    setSelectedTableId(table.id);
                    // Select first comanda if available
                    if (table.comandas && table.comandas.length > 0) {
                      setActiveComandaId(table.comandas[0].id);
                    } else {
                      setActiveComandaId(null);
                    }
                  }}
                  className={`rounded-2xl border p-4 flex flex-col justify-between h-44 cursor-pointer shadow-sm hover:shadow-md transition bg-white relative overflow-hidden`}
                  style={{ borderLeftColor: table.color, borderLeftWidth: '5px' }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 block truncate max-w-[80px]">
                      {table.area || 'Salão'}
                    </span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${getStatusBadgeStyle(table.status)}`}>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>

                  {/* Visual 2D Table Shape inside layout grid */}
                  <div className="flex flex-col items-center justify-center py-1.5 relative">
                    {/* Chairs surrounding table layout */}
                    <div className="relative flex items-center justify-center w-14 h-14">
                      {Array.from({ length: Math.min(table.capacity, 8) }).map((_, idx, arr) => {
                        const total = arr.length;
                        const angle = (idx * 360) / total;
                        const radius = table.shape === 'rectangle' ? 24 : 20;
                        const style = {
                          position: 'absolute' as const,
                          transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                        };
                        return (
                          <div
                            key={idx}
                            style={style}
                            className={`w-1.5 h-1.5 rounded-full ${
                              table.status === 'occupied' ? 'bg-rose-400 border-rose-500' :
                              table.status === 'billing' ? 'bg-blue-400 border-blue-500 animate-pulse' :
                              'bg-neutral-300 border-neutral-400'
                            } border-[0.5px]`}
                          />
                        );
                      })}

                      {/* Central Table Block */}
                      <div
                        className={`w-10 h-10 flex flex-col items-center justify-center border-2 font-black text-[10px] text-neutral-800 bg-neutral-50 shadow-sm relative transition duration-300 shrink-0 ${
                          table.shape === 'circle' ? 'rounded-full' :
                          table.shape === 'rectangle' ? 'w-14 h-8 rounded-lg' :
                          table.shape === 'booth' ? 'rounded-xl border-dashed' :
                          'rounded-xl' // square
                        }`}
                        style={{ borderColor: table.color }}
                      >
                        <span className="text-neutral-900 font-extrabold text-[10px]">{table.number}</span>
                        {table.isVip && (
                          <span className="absolute -top-1.5 -right-1.5 text-[8px] text-amber-500 font-extrabold bg-amber-50 border border-amber-250 p-0.5 rounded-full shadow-sm" title="VIP VIP">★</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-neutral-500 mt-2.5 block">
                      Capacidade: {table.capacity}p {table.isReservable === false && '• S/ Reserva'}
                    </span>
                  </div>

                  {/* Multi comandas badges */}
                  <div className="space-y-1">
                    {activeComandasCount > 0 ? (
                      <div className="flex items-center justify-between text-[10px] font-bold text-neutral-700 bg-emerald-50/50 p-1 px-1.5 rounded-lg border border-emerald-100">
                        <span className="truncate">
                          {activeComandasCount === 1 ? table.comandas![0].cliente : `${activeComandasCount} Comandas`}
                        </span>
                        <span className="text-emerald-850 font-black shrink-0">
                          R$ {(table.comandas?.reduce((sum, c) => sum + c.totalBill, 0) || 0).toFixed(0)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-[9px] font-bold text-neutral-500 py-1 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg">
                        Livre
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* LAYOUT RENDERER 2: LIST VIEW */}
      {activeLayout === 'list' && (
        <div className="space-y-3 md:space-y-0">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 uppercase text-[9px] font-black border-b border-neutral-200">
                    <th className="py-3 px-4">Mesa</th>
                    <th className="py-3 px-4">Setor / Área</th>
                    <th className="py-3 px-4">Capacidade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Comandas Ativas</th>
                    <th className="py-3 px-4 text-right">Faturamento Consolidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-800 font-semibold">
                  {filteredTables.map((table) => {
                    const bill = table.comandas?.reduce((sum, c) => sum + c.totalBill, 0) || 0;
                    return (
                      <tr
                        key={table.id}
                        onClick={() => {
                          setSelectedTableId(table.id);
                          if (table.comandas && table.comandas.length > 0) {
                            setActiveComandaId(table.comandas[0].id);
                          } else {
                            setActiveComandaId(null);
                          }
                        }}
                        className="hover:bg-neutral-50/50 cursor-pointer transition border-b border-neutral-100"
                      >
                        <td className="py-3.5 px-4 font-black text-neutral-900">Mesa {table.number}</td>
                        <td className="py-3.5 px-4 text-neutral-600">{table.area}</td>
                        <td className="py-3.5 px-4">{table.capacity} pessoas</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getStatusBadgeStyle(table.status)}`}>
                            {getStatusLabel(table.status)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {table.comandas && table.comandas.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {table.comandas.map(c => (
                                <span key={c.id} className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  {c.cliente}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px] font-normal">Nenhuma</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-neutral-900">
                          R$ {bill.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden space-y-3.5">
            {filteredTables.map((table) => {
              const bill = table.comandas?.reduce((sum, c) => sum + c.totalBill, 0) || 0;
              return (
                <div
                  key={table.id}
                  onClick={() => {
                    setSelectedTableId(table.id);
                    if (table.comandas && table.comandas.length > 0) {
                      setActiveComandaId(table.comandas[0].id);
                    } else {
                      setActiveComandaId(null);
                    }
                  }}
                  className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm hover:border-emerald-500 active:bg-neutral-50 transition cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-neutral-900">Mesa {table.number}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${getStatusBadgeStyle(table.status)}`}>
                      {getStatusLabel(table.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-black text-neutral-400 block mb-0.5">Setor / Área</span>
                      <span className="text-neutral-700 font-bold">{table.area}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-neutral-400 block mb-0.5">Capacidade</span>
                      <span className="text-neutral-700 font-bold">{table.capacity} pessoas</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-black text-neutral-400 block mb-1">Comandas Ativas</span>
                      {table.comandas && table.comandas.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {table.comandas.map(c => (
                            <span key={c.id} className="bg-emerald-100 border border-emerald-250 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-black">
                              {c.cliente}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-500 font-medium">Nenhuma</span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-black text-neutral-400 block mb-0.5">Consolidado</span>
                      <span className="font-extrabold text-emerald-800 text-sm">
                        R$ {bill.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LAYOUT RENDERER 3: SECTOR MAP VIEW */}
      {activeLayout === 'map' && (
        <div className="space-y-6">
          {areas.map((area) => {
            const tablesInArea = filteredTables.filter(t => t.area === area);
            if (tablesInArea.length === 0) return null;

            return (
              <div key={area} className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-150 pb-2">
                  <span className="text-[11px] font-black uppercase text-emerald-850 tracking-wider">
                    {area}
                  </span>
                  <span className="text-[10px] text-neutral-600 font-bold">
                    {tablesInArea.length} mesas ativas
                  </span>
                </div>

                {/* Simulated Visual Restaurant Floor Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {tablesInArea.map((table) => {
                    const activeComandasCount = table.comandas?.length || 0;
                    return (
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        key={table.id}
                        onClick={() => {
                          setSelectedTableId(table.id);
                          if (table.comandas && table.comandas.length > 0) {
                            setActiveComandaId(table.comandas[0].id);
                          } else {
                            setActiveComandaId(null);
                          }
                        }}
                        className={`aspect-square rounded-full border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition relative hover:shadow-md ${
                          table.status === 'occupied' ? 'bg-amber-50 border-amber-500' :
                          table.status === 'billing' ? 'bg-blue-50 border-blue-500 animate-pulse' :
                          table.status === 'cleaning' ? 'bg-neutral-50 border-neutral-400' : 'bg-white border-emerald-500'
                        }`}
                      >
                        <h4 className="font-black text-sm text-neutral-900 leading-tight">Mesa {table.number}</h4>
                        <span className="text-[8px] text-neutral-500 font-bold">{table.capacity}p</span>

                        {activeComandasCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 border border-emerald-600 text-neutral-950 rounded-full flex items-center justify-center text-[9px] font-black shadow-md">
                            {activeComandasCount}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE ACTION DRAWER/DIALOG OVERLAY FOR MOBILE & DESKTOP (V2 EXTREME) */}
      <AnimatePresence>
        {selectedTableId && currentTable && (
          <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-[32px] md:rounded-[32px] max-w-4xl w-full h-[90vh] md:h-[85vh] overflow-hidden border border-neutral-200 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
                    style={{ backgroundColor: currentTable.color }}
                  >
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-neutral-900 text-base">
                        Mesa {currentTable.number}
                      </h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${getStatusBadgeStyle(currentTable.status)}`}>
                        {getStatusLabel(currentTable.status)}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-600 font-bold">
                      Setor: {currentTable.area} • Capacidade: {currentTable.capacity} pessoas • Observações: {currentTable.observation || 'Nenhuma'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditTableNum(currentTable.number);
                      setEditTableCap(currentTable.capacity);
                      setEditTableArea(currentTable.area || 'Salão Principal');
                      setEditTableColor(currentTable.color || '#10b981');
                      setEditTableObs(currentTable.observation || '');
                      setEditTableStatus(currentTable.status);
                      setEditTableShape(currentTable.shape || 'square');
                      setEditTableIsVip(currentTable.isVip || false);
                      setEditTableIsReservable(currentTable.isReservable !== false);
                      setEditTableWaiterId(currentTable.preferredWaiterId || '');
                      setEditCustomAreaText('');
                      setEditShowCustomAreaInput(false);
                      setEditingTableId(currentTable.id);
                      setShowEditModal(true);
                    }}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
                    title="Editar Configurações da Mesa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicateTable(currentTable)}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
                    title="Duplicar Mesa"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setDeletingTableId(currentTable.id);
                      setShowDeleteModal(true);
                    }}
                    disabled={currentTable.status !== 'available' && currentTable.status !== 'cleaning'}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 disabled:opacity-45 disabled:hover:bg-rose-50 transition border border-rose-100"
                    title="Excluir Mesa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTableId(null);
                      setShowPaymentFlow(false);
                    }}
                    className="p-2 rounded-xl hover:bg-neutral-200 text-neutral-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TWO PANEL RESPONSIVE MANAGEMENT GRID */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                
                {/* LEFT COLUMN: ACTIVE CLIENTS & COMANDAS LIST (5 COLS) */}
                <div className="lg:col-span-5 border-r border-neutral-200 flex flex-col overflow-y-auto p-4 space-y-4">
                  
                  {/* Rapid Status Manual Switcher */}
                  <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200 space-y-2">
                    <span className="text-[9px] font-black uppercase text-neutral-600 block">Alterar Status da Mesa Manualmente</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'available', label: 'Livre' },
                        { id: 'cleaning', label: 'Limpeza' },
                        { id: 'reserved', label: 'Reserva' },
                        { id: 'blocked', label: 'Bloquear' },
                        { id: 'maintenance', label: 'Manutenção' }
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => handleStatusChange(currentTable.id, st.id as any)}
                          className={`py-1.5 px-2 rounded-lg text-[9px] font-black border transition uppercase tracking-wide ${
                            currentTable.status === st.id
                              ? 'bg-neutral-800 text-white border-neutral-800'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                      Comandas de Clientes ({currentTable.comandas?.length || 0})
                    </h4>
                    <button
                      onClick={() => setShowComandaModal(true)}
                      className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg text-[10px] font-black transition flex items-center gap-1 shadow-sm border border-emerald-550"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Abrir Comanda</span>
                    </button>
                  </div>

                  {/* Render the comandas list */}
                  <div className="space-y-2 max-h-60 lg:max-h-none overflow-y-auto pr-1">
                    {!currentTable.comandas || currentTable.comandas.length === 0 ? (
                      <div className="py-8 text-center bg-neutral-50 border border-dashed border-neutral-250 rounded-2xl space-y-2">
                        <UtensilsCrossed className="w-6 h-6 text-neutral-400 mx-auto" />
                        <p className="text-[11px] text-neutral-500 font-bold">Nenhum cliente ou comanda aberta nesta mesa.</p>
                      </div>
                    ) : (
                      currentTable.comandas.map((comanda) => {
                        const isSelected = activeComanda?.id === comanda.id;
                        return (
                          <div
                            key={comanda.id}
                            onClick={() => {
                              setActiveComandaId(comanda.id);
                              setShowPaymentFlow(false);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                : 'bg-white border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <h5 className="text-xs font-black text-neutral-900 truncate max-w-[150px]">
                                {comanda.cliente}
                              </h5>
                              <span className="text-[10px] text-neutral-600 font-bold block">
                                Garçom: {waiters.find(w => w.id === comanda.garcomId)?.name || 'Atendente'}
                              </span>
                              <span className="text-[9px] text-neutral-500 block">
                                {comanda.quantidadePessoas} pessoas • Aberto às: {new Date(comanda.criadaEmISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="text-right space-y-1">
                              <span className="text-xs font-black text-neutral-900 block">
                                R$ {comanda.totalBill.toFixed(2)}
                              </span>
                              <span className="text-[9px] bg-emerald-100 text-emerald-850 px-1.5 py-0.5 rounded font-black uppercase">
                                Ativa
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* TIMELINE / HISTORY EVENT SYSTEM (5.13) */}
                  <div className="border-t border-neutral-200 pt-3 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <History className="w-4 h-4 text-emerald-850" />
                      <h4 className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">Histórico / Auditoria</h4>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {currentTable.history?.slice().reverse().map((ev) => (
                        <div key={ev.id} className="text-[10px] font-bold text-neutral-600 border-l border-neutral-300 pl-2.5 pb-2 relative">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute -left-[4px] top-1" />
                          <div className="flex justify-between items-center text-[9px] text-neutral-500">
                            <span>{ev.autor}</span>
                            <span>{new Date(ev.timestampISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-neutral-850 mt-0.5">{ev.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: ACTIVE COMANDA ACTIONS, PRODUCTS & CHECKOUT (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col overflow-y-auto p-4 md:p-6 space-y-4">
                  {activeComanda ? (
                    <>
                      {showPaymentFlow ? (
                        /* ENHANCED CHECKOUT FLOW */
                        <div className="space-y-4 max-w-md mx-auto w-full">
                          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                            <span className="text-xs font-black uppercase text-neutral-700">Encerrar comanda de {activeComanda.cliente}</span>
                            <button
                              onClick={() => setShowPaymentFlow(false)}
                              className="text-[11px] font-extrabold text-emerald-700 hover:underline"
                            >
                              Voltar ao Consumo
                            </button>
                          </div>

                          <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex justify-between items-center">
                            <span className="text-xs font-bold text-neutral-700">Total a Pagar (com descontos):</span>
                            <span className="text-lg font-black text-emerald-800 bg-white border border-emerald-250 px-3 py-1 rounded-xl">
                              R$ {Math.max(0, activeComanda.totalBill - discountAmount).toFixed(2)}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-neutral-600">Meio de Pagamento</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'credit', label: 'Crédito' },
                                { id: 'debit', label: 'Débito' },
                                { id: 'pix', label: 'PIX QR' },
                                { id: 'cash', label: 'Dinheiro' }
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => setPaymentMethod(m.id as any)}
                                  className={`p-3 rounded-xl border text-xs font-black transition ${
                                    paymentMethod === m.id
                                      ? 'border-emerald-500 bg-emerald-100 text-emerald-850'
                                      : 'border-neutral-250 bg-white hover:bg-neutral-50 text-neutral-800'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-neutral-100">
                            <span className="text-neutral-700">Conceder Desconto Extra</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-500 font-bold">R$</span>
                              <input
                                type="number"
                                min="0"
                                max={activeComanda.totalBill}
                                value={discountAmount || ''}
                                onChange={(e) => setDiscountAmount(Math.min(activeComanda.totalBill, Number(e.target.value)))}
                                className="w-24 bg-emerald-50/50 border border-emerald-200 rounded-lg p-2 text-right font-black text-neutral-900"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Split comanda payment equally */}
                          <div className="pt-2 border-t border-neutral-100 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-neutral-700">Dividir esta Comanda igualmente?</span>
                              <button
                                onClick={() => setComandaSplitPayment(!comandaSplitPayment)}
                                className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase transition ${
                                  comandaSplitPayment
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-850'
                                    : 'bg-white border-neutral-250 text-neutral-600 hover:bg-neutral-50'
                                }`}
                              >
                                {comandaSplitPayment ? 'Sim' : 'Não'}
                              </button>
                            </div>

                            {comandaSplitPayment && (
                              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 space-y-2.5 transition">
                                <div className="flex justify-between items-center text-xs font-bold">
                                  <span className="text-neutral-600">Nº de Pessoas:</span>
                                  <div className="flex items-center gap-1.5 border border-neutral-250 bg-white rounded p-0.5">
                                    <button
                                      onClick={() => setComandaSplitCount(Math.max(2, comandaSplitCount - 1))}
                                      className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-xs text-neutral-800 font-black"
                                    >
                                      -
                                    </button>
                                    <span className="px-1 text-xs text-neutral-900 font-black">{comandaSplitCount}</span>
                                    <button
                                      onClick={() => setComandaSplitCount(comandaSplitCount + 1)}
                                      className="px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded text-xs text-neutral-800 font-black"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-black border-t border-neutral-200 pt-2 text-neutral-800">
                                  <span>Cada pessoa paga:</span>
                                  <span className="text-emerald-850 bg-emerald-100 border border-emerald-250 px-2 py-0.5 rounded font-black text-xs">
                                    R$ {(Math.max(0, activeComanda.totalBill - discountAmount) / comandaSplitCount).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>


                          <button
                            onClick={handlePayActiveComanda}
                            disabled={isProcessingPayment}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1 border border-emerald-550"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{isProcessingPayment ? 'Processando transação...' : 'Confirmar e Fechar Comanda'}</span>
                          </button>
                        </div>
                      ) : (
                        /* COMANDA PRODUCTS REVIEW AND ACTIONS PANEL */
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-150 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                              <span className="text-[8px] bg-emerald-500 text-neutral-950 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                Comanda Ativa
                              </span>
                              <h4 className="text-sm font-black text-neutral-900 mt-1">{activeComanda.cliente}</h4>
                              <p className="text-[10px] text-neutral-600 font-bold mt-0.5">Responsável pelo consumo</p>
                            </div>

                            <div className="flex flex-row md:flex-col justify-between items-end">
                              <span className="text-[10px] text-neutral-500 font-bold uppercase">Total Acumulado</span>
                              <span className="text-lg font-black text-neutral-900">R$ {activeComanda.totalBill.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* ACTION PANEL BUTTONS (Transfer, Merge, Move, Separate) */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button
                              onClick={() => setShowTransferModal(true)}
                              className="py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-250 text-[10px] font-black rounded-xl transition flex items-center justify-center gap-1.5"
                              title="Transferir para outra mesa"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              <span>Transferir</span>
                            </button>

                            <button
                              disabled={activeComanda.items.length === 0}
                              onClick={() => {
                                setMoveQuantity(1);
                                setMoveSelectedItemId(activeComanda.items[0]?.product.id || '');
                                setShowMoveItemsModal(true);
                              }}
                              className="py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-45 text-neutral-800 border border-neutral-250 text-[10px] font-black rounded-xl transition flex items-center justify-center gap-1.5"
                              title="Mover itens para outra comanda"
                            >
                              <CornerDownRight className="w-3.5 h-3.5" />
                              <span>Mover Itens</span>
                            </button>

                            <button
                              disabled={(currentTable.comandas?.length || 0) < 2}
                              onClick={() => setShowMergeModal(true)}
                              className="py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-45 text-neutral-800 border border-neutral-250 text-[10px] font-black rounded-xl transition flex items-center justify-center gap-1.5"
                              title="Unificar com outra comanda desta mesa"
                            >
                              <Merge className="w-3.5 h-3.5" />
                              <span>Unificar</span>
                            </button>

                            <button
                              disabled={activeComanda.items.length === 0}
                              onClick={() => {
                                setSeparateQuantity(1);
                                setSeparateSelectedItemId(activeComanda.items[0]?.product.id || '');
                                setShowSeparateModal(true);
                              }}
                              className="py-2 px-2.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-45 text-neutral-800 border border-neutral-250 text-[10px] font-black rounded-xl transition flex items-center justify-center gap-1.5"
                              title="Separar comanda gerando nova"
                            >
                              <Divide className="w-3.5 h-3.5" />
                              <span>Separar</span>
                            </button>
                          </div>

                          {/* COMANDA PRODUCTS LIST */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wider block">Produtos Lançados</span>
                            
                            {activeComanda.items.length === 0 ? (
                              <div className="p-6 text-center border border-dashed border-neutral-250 rounded-2xl text-neutral-500 font-bold text-xs">
                                Sem pratos nesta comanda ainda. Selecione do cardápio rápido abaixo para adicionar.
                              </div>
                            ) : (
                              <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 max-h-48 overflow-y-auto pr-1">
                                {activeComanda.items.map((item, idx) => (
                                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50">
                                    <div className="flex items-center gap-2.5">
                                      <img src={item.product.image} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                      <div>
                                        <span className="font-bold text-neutral-900 block">{item.product.name}</span>
                                        <span className="text-[10px] text-neutral-600 block font-bold">R$ {item.product.price.toFixed(2)} cada</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                                        <button
                                          onClick={() => handleRemoveItemFromComanda(item.product.id)}
                                          className="w-5 h-5 bg-white text-neutral-850 hover:bg-rose-100 font-black rounded flex items-center justify-center"
                                        >
                                          -
                                        </button>
                                        <span className="px-1.5 font-black text-xs text-neutral-900">{item.quantity}</span>
                                        <button
                                          onClick={() => handleAddItemToComanda(item.product)}
                                          className="w-5 h-5 bg-white text-neutral-850 hover:bg-emerald-100 font-black rounded flex items-center justify-center"
                                        >
                                          +
                                        </button>
                                      </div>

                                      <span className="font-black text-neutral-900 shrink-0 min-w-[60px] text-right">
                                        R$ {(item.product.price * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* QUICK CATALOG LAUNCH ADDER */}
                          <div className="border-t border-neutral-200 pt-3 space-y-3">
                            <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wider block">Adicionar Produtos Rapidademente</span>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-3.5 h-3.5" />
                              <input
                                type="text"
                                placeholder="Filtrar pratos/bebidas..."
                                value={comandaSearchQuery}
                                onChange={(e) => setComandaSearchQuery(e.target.value)}
                                className="w-full text-xs font-bold bg-neutral-50 border border-neutral-200 rounded-xl py-2 pl-9 pr-4 focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                              {products
                                .filter(p => p.name.toLowerCase().includes(comandaSearchQuery.toLowerCase()))
                                .map((p) => (
                                  <div
                                    key={p.id}
                                    onClick={() => handleAddItemToComanda(p)}
                                    className="p-2 border border-neutral-200 rounded-xl hover:bg-emerald-50/25 flex items-center justify-between cursor-pointer transition text-[11px] font-bold"
                                  >
                                    <span className="truncate max-w-[140px] text-neutral-850">{p.name}</span>
                                    <span className="text-[10px] text-emerald-850 bg-emerald-100 border border-emerald-250 px-1.5 py-0.5 rounded shrink-0">
                                      + R$ {p.price.toFixed(0)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* BOTTOM CHECKOUT CALL */}
                          <div className="pt-4 border-t border-neutral-200 flex justify-end">
                            <button
                              onClick={() => setShowPaymentFlow(true)}
                              disabled={activeComanda.items.length === 0}
                              className="w-full md:w-auto py-3 px-6 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-45 text-neutral-950 font-black text-xs rounded-xl shadow-lg transition border border-emerald-550 flex items-center justify-center gap-1"
                            >
                              <DollarSign className="w-4 h-4" />
                              <span>Receber Conta / Checkout</span>
                            </button>
                          </div>

                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-3">
                      <UtensilsCrossed className="w-12 h-12 text-neutral-300" />
                      <h4 className="font-black text-neutral-850">Nenhuma comanda selecionada</h4>
                      <p className="text-xs text-neutral-500 font-bold max-w-sm">
                        Para gerenciar pratos, transferências ou pagamentos, abra ou selecione uma comanda ativa na coluna ao lado.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: CADASTRAR MESA (5.1) - Enriched */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-neutral-200 shadow-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden"
            >
              {/* Left Column: Form Config */}
              <div className="flex-1 space-y-4 md:w-3/5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                  <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-850" />
                    <span>Cadastrar Nova Mesa</span>
                  </h4>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 md:hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateTable} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Número da Mesa *</label>
                      <input
                        type="text"
                        placeholder="Ex: 11"
                        required
                        value={newTableNum}
                        onChange={(e) => setNewTableNum(e.target.value)}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Capacidade (Pessoas) *</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        required
                        value={newTableCap}
                        onChange={(e) => setNewTableCap(Number(e.target.value))}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                  </div>

                  {/* Area Selector and Waiter */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Área / Setor *</label>
                      <select
                        value={showCustomAreaInput ? "custom" : newTableArea}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setShowCustomAreaInput(true);
                          } else {
                            setShowCustomAreaInput(false);
                            setNewTableArea(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                      >
                        {areas.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                        <option value="custom">+ Cadastrar Novo Setor...</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Garçom Principal</label>
                      <select
                        value={newTableWaiterId}
                        onChange={(e) => setNewTableWaiterId(e.target.value)}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                      >
                        <option value="">Nenhum (Livre)</option>
                        {employees.filter(e => e.role === 'waiter' || e.role === 'admin').map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {showCustomAreaInput && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[10px] font-black uppercase text-emerald-850">Nome do Novo Setor *</label>
                      <input
                        type="text"
                        placeholder="Ex: Jardim de Inverno"
                        required
                        value={customAreaText}
                        onChange={(e) => setCustomAreaText(e.target.value)}
                        className="w-full text-xs font-bold bg-neutral-50 border border-emerald-300 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                  )}

                  {/* Table Shape selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Formato da Mesa</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'square', label: 'Quadrada' },
                        { value: 'circle', label: 'Redonda' },
                        { value: 'rectangle', label: 'Retangular' },
                        { value: 'booth', label: 'Banqueta' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          onClick={() => setNewTableShape(item.value as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition ${
                            newTableShape === item.value
                              ? 'bg-emerald-500 border-emerald-600 text-neutral-950 font-black shadow-sm'
                              : 'bg-neutral-50 border-neutral-250 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles VIP and Online booking */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-2 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTableIsVip}
                        onChange={(e) => setNewTableIsVip(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/10 border-neutral-300 rounded"
                      />
                      <div>
                        <span className="text-xs font-black text-neutral-800 block">Mesa VIP</span>
                        <span className="text-[8px] text-neutral-500 font-bold">Atendimento exclusivo</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTableIsReservable}
                        onChange={(e) => setNewTableIsReservable(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/10 border-neutral-300 rounded"
                      />
                      <div>
                        <span className="text-xs font-black text-neutral-800 block">Reservável</span>
                        <span className="text-[8px] text-neutral-500 font-bold">Ativa para reservas</span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Cor do Tag de Identificação</label>
                    <div className="flex gap-2 justify-between flex-wrap">
                      {tableColors.map((col) => (
                        <button
                          type="button"
                          key={col.value}
                          onClick={() => setNewTableColor(col.value)}
                          className={`w-7.5 h-7.5 rounded-full border-2 transition ${
                            newTableColor === col.value ? 'border-neutral-900 scale-110 shadow-sm' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: col.value }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Observações Extras</label>
                    <textarea
                      placeholder="Instruções adicionais da mesa (ex: Perto da tomada, vista varanda...)"
                      maxLength={150}
                      value={newTableObs}
                      onChange={(e) => setNewTableObs(e.target.value)}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition h-14 resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-neutral-200 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Cadastrar Mesa
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Visual Layout Preview */}
              <div className="hidden md:flex md:w-2/5 bg-neutral-50/80 border border-neutral-200 rounded-2xl p-5 flex-col items-center justify-center text-center space-y-4 shrink-0">
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Preview 2D do Salão</h5>
                  <p className="text-[9px] text-neutral-400 font-bold">Visualização do ícone da mesa na planta de mesas</p>
                </div>

                <div className="flex-1 w-full flex items-center justify-center min-h-[160px] relative">
                  <div className="relative flex items-center justify-center">
                    {Array.from({ length: Math.min(newTableCap, 12) }).map((_, idx, arr) => {
                      const total = arr.length;
                      const angle = (idx * 360) / total;
                      const radius = newTableShape === 'rectangle' ? 44 : 36;
                      const style = {
                        position: 'absolute' as const,
                        transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                      };
                      return (
                        <div
                          key={idx}
                          style={style}
                          className="w-3.5 h-3.5 rounded-full bg-neutral-300 border border-neutral-400 shadow-sm"
                        />
                      );
                    })}

                    <div
                      className={`w-20 h-20 bg-white border-4 flex flex-col items-center justify-center shadow-lg font-black text-xs transition duration-300 relative ${
                        newTableShape === 'circle' ? 'rounded-full' :
                        newTableShape === 'rectangle' ? 'w-28 h-16 rounded-xl' :
                        newTableShape === 'booth' ? 'rounded-2xl border-dashed' :
                        'rounded-2xl' // square
                      }`}
                      style={{ borderColor: newTableColor }}
                    >
                      <span className="text-neutral-900 font-extrabold text-sm">Mesa {newTableNum || '?'}</span>
                      <span className="text-[9px] font-bold text-neutral-500">{newTableCap} Lugares</span>

                      {newTableIsVip && (
                        <span className="absolute -top-2.5 -right-2.5 text-xs text-amber-500 font-extrabold bg-amber-50 border border-amber-250 px-1 py-0.5 rounded-full shadow-sm animate-bounce">★</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-neutral-200 rounded-xl w-full text-left space-y-1">
                  <div className="text-[9px] font-black uppercase text-neutral-400">Atributos</div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    • Setor: <strong className="text-neutral-900">{showCustomAreaInput && customAreaText ? customAreaText : newTableArea}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    • Garçom: <strong className="text-neutral-900">{newTableWaiterId ? (employees.find(e => e.id === newTableWaiterId)?.name || 'Livre') : 'Livre'}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    • Reservas: <strong className="text-neutral-900">{newTableIsReservable ? 'Ativas' : 'Desativadas'}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDITAR CONFIGURAÇÕES DA MESA (5.2) - Enriched */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-neutral-200 shadow-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden"
            >
              {/* Left Column: Edit Form */}
              <div className="flex-1 space-y-4 md:w-3/5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                  <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-emerald-850" />
                    <span>Editar Configurações da Mesa</span>
                  </h4>
                  <button type="button" onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 md:hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditTable} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Número da Mesa</label>
                      <input
                        type="text"
                        required
                        value={editTableNum}
                        onChange={(e) => setEditTableNum(e.target.value)}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Capacidade (Pessoas)</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        required
                        value={editTableCap}
                        onChange={(e) => setEditTableCap(Number(e.target.value))}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                  </div>

                  {/* Area and Waiter */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Área / Setor</label>
                      <select
                        value={editShowCustomAreaInput ? "custom" : editTableArea}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setEditShowCustomAreaInput(true);
                          } else {
                            setEditShowCustomAreaInput(false);
                            setEditTableArea(e.target.value);
                          }
                        }}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                      >
                        {areas.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                        <option value="custom">+ Cadastrar Novo Setor...</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-neutral-600">Garçom Principal</label>
                      <select
                        value={editTableWaiterId}
                        onChange={(e) => setEditTableWaiterId(e.target.value)}
                        className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                      >
                        <option value="">Nenhum (Livre)</option>
                        {employees.filter(e => e.role === 'waiter' || e.role === 'admin').map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editShowCustomAreaInput && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[10px] font-black uppercase text-emerald-850">Nome do Novo Setor *</label>
                      <input
                        type="text"
                        placeholder="Ex: Sala VIP Reservada"
                        required
                        value={editCustomAreaText}
                        onChange={(e) => setEditCustomAreaText(e.target.value)}
                        className="w-full text-xs font-bold bg-neutral-50 border border-emerald-300 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 transition"
                      />
                    </div>
                  )}

                  {/* Table Shape selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Formato da Mesa</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'square', label: 'Quadrada' },
                        { value: 'circle', label: 'Redonda' },
                        { value: 'rectangle', label: 'Retangular' },
                        { value: 'booth', label: 'Banqueta' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.value}
                          onClick={() => setEditTableShape(item.value as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition ${
                            editTableShape === item.value
                              ? 'bg-emerald-500 border-emerald-600 text-neutral-950 font-black shadow-sm'
                              : 'bg-neutral-50 border-neutral-250 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles VIP and Online booking */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-2 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTableIsVip}
                        onChange={(e) => setEditTableIsVip(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/10 border-neutral-300 rounded"
                      />
                      <div>
                        <span className="text-xs font-black text-neutral-800 block">Mesa VIP</span>
                        <span className="text-[8px] text-neutral-500 font-bold">Atendimento exclusivo</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl transition cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editTableIsReservable}
                        onChange={(e) => setEditTableIsReservable(e.target.checked)}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500/10 border-neutral-300 rounded"
                      />
                      <div>
                        <span className="text-xs font-black text-neutral-800 block">Reservável</span>
                        <span className="text-[8px] text-neutral-500 font-bold">Ativa para reservas</span>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Cor do Tag</label>
                    <div className="flex gap-2 justify-between flex-wrap">
                      {tableColors.map((col) => (
                        <button
                          type="button"
                          key={col.value}
                          onClick={() => setEditTableColor(col.value)}
                          className={`w-7.5 h-7.5 rounded-full border-2 transition ${
                            editTableColor === col.value ? 'border-neutral-900 scale-110 shadow-sm' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: col.value }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Observações Extras</label>
                    <textarea
                      placeholder="Observações ou detalhes físicos da mesa..."
                      maxLength={150}
                      value={editTableObs}
                      onChange={(e) => setEditTableObs(e.target.value)}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 transition h-14 resize-none"
                    />
                  </div>

                  {/* Capacity warning indicator */}
                  {currentTable && currentTable.comandas && currentTable.comandas.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[10px] text-amber-900 font-bold leading-normal">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Atenção: Esta mesa possui comandas ativas neste momento. Certifique-se de que a nova capacidade acomoda o grupo atual de clientes.
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-neutral-200 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Visual Layout Preview */}
              <div className="hidden md:flex md:w-2/5 bg-neutral-50/80 border border-neutral-200 rounded-2xl p-5 flex-col items-center justify-center text-center space-y-4 shrink-0">
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Preview 2D do Salão</h5>
                  <p className="text-[9px] text-neutral-400 font-bold">Visualização do ícone da mesa na planta de mesas</p>
                </div>

                <div className="flex-1 w-full flex items-center justify-center min-h-[160px] relative">
                  <div className="relative flex items-center justify-center">
                    {Array.from({ length: Math.min(editTableCap, 12) }).map((_, idx, arr) => {
                      const total = arr.length;
                      const angle = (idx * 360) / total;
                      const radius = editTableShape === 'rectangle' ? 44 : 36;
                      const style = {
                        position: 'absolute' as const,
                        transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
                      };
                      return (
                        <div
                          key={idx}
                          style={style}
                          className="w-3.5 h-3.5 rounded-full bg-neutral-300 border border-neutral-400 shadow-sm"
                        />
                      );
                    })}

                    <div
                      className={`w-20 h-20 bg-white border-4 flex flex-col items-center justify-center shadow-lg font-black text-xs transition duration-300 relative ${
                        editTableShape === 'circle' ? 'rounded-full' :
                        editTableShape === 'rectangle' ? 'w-28 h-16 rounded-xl' :
                        editTableShape === 'booth' ? 'rounded-2xl border-dashed' :
                        'rounded-2xl' // square
                      }`}
                      style={{ borderColor: editTableColor }}
                    >
                      <span className="text-neutral-900 font-extrabold text-sm">Mesa {editTableNum || '?'}</span>
                      <span className="text-[9px] font-bold text-neutral-500">{editTableCap} Lugares</span>

                      {editTableIsVip && (
                        <span className="absolute -top-2.5 -right-2.5 text-xs text-amber-500 font-extrabold bg-amber-50 border border-amber-250 px-1 py-0.5 rounded-full shadow-sm animate-bounce">★</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-neutral-200 rounded-xl w-full text-left space-y-1">
                  <div className="text-[9px] font-black uppercase text-neutral-400">Atributos</div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    • Setor: <strong className="text-neutral-900">{editShowCustomAreaInput && editCustomAreaText ? editCustomAreaText : editTableArea}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    • Garçom: <strong className="text-neutral-900">{editTableWaiterId ? (employees.find(e => e.id === editTableWaiterId)?.name || 'Livre') : 'Livre'}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-neutral-700">
                    • Reservas: <strong className="text-neutral-900">{editTableIsReservable ? 'Ativas' : 'Desativadas'}</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: EXCLUIR MESA CONFIRMAÇÃO (5.3) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-neutral-200 shadow-2xl space-y-4 text-center"
            >
              <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
              <div>
                <h4 className="font-black text-neutral-900">Deseja realmente excluir esta mesa?</h4>
                <p className="text-xs text-neutral-600 font-bold mt-1 leading-normal">
                  Esta ação é irreversível. Todas as configurações do tag da mesa serão removidas permanentemente.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-250 text-neutral-800 font-bold text-xs rounded-xl transition border border-neutral-200"
                >
                  Não, Cancelar
                </button>
                <button
                  onClick={handleDeleteTable}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/10 transition"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ABRIR NOVA COMANDA WIZARD (5.6) */}
      <AnimatePresence>
        {showComandaModal && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-850" />
                  <span>Abrir Comanda para Mesa</span>
                </h4>
                <button onClick={() => setShowComandaModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateComanda} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Nome do Cliente Responsável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fernanda Montenegro"
                    value={comandaClient}
                    onChange={(e) => setComandaClient(e.target.value)}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={comandaPhone}
                      onChange={(e) => setComandaPhone(e.target.value)}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Quantidade de Pessoas</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={comandaPeople}
                      onChange={(e) => setComandaPeople(Number(e.target.value))}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Garçom / Atendente Responsável</label>
                  <select
                    value={comandaWaiter}
                    onChange={(e) => setComandaWaiter(e.target.value)}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                  >
                    {waiters.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Observações / Restrições do Grupo</label>
                  <textarea
                    placeholder="Ex: Crianças de colo, alergias a glúten etc."
                    value={comandaObs}
                    onChange={(e) => setComandaObs(e.target.value)}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none h-16 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowComandaModal(false)}
                    className="flex-1 py-2.5 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Confirmar Abertura
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: TRANSFERIR COMANDA DE MESA (5.9) */}
      <AnimatePresence>
        {showTransferModal && activeComanda && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-850" />
                  <span>Transferir Comanda</span>
                </h4>
                <button onClick={() => setShowTransferModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTransferComanda} className="space-y-4">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-neutral-500 block">Comanda a ser transferida:</span>
                  <span className="font-black text-neutral-900 text-sm">{activeComanda.cliente}</span>
                  <span className="font-bold text-emerald-850 block">Mesa Atual: Mesa {currentTable?.number}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Selecione a Mesa de Destino</label>
                  <select
                    required
                    value={transferTargetTableId}
                    onChange={(e) => setTransferTargetTableId(e.target.value)}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-3 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Escolha uma Mesa Disponível --</option>
                    {enhancedTables
                      .filter(t => t.id !== selectedTableId && t.status !== 'blocked' && t.status !== 'maintenance')
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          Mesa {t.number} ({t.area} • Cap: {t.capacity}p) - Status: {getStatusLabel(t.status)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2.5 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!transferTargetTableId}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-neutral-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Confirmar Transferência
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: MOVER ITENS DE COMANDA (5.10) */}
      <AnimatePresence>
        {showMoveItemsModal && activeComanda && currentTable && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                  <CornerDownRight className="w-4 h-4 text-emerald-850" />
                  <span>Mover Itens de Comanda</span>
                </h4>
                <button onClick={() => setShowMoveItemsModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleMoveItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Selecione o Item da Comanda</label>
                  <select
                    required
                    value={moveSelectedItemId}
                    onChange={(e) => {
                      setMoveSelectedItemId(e.target.value);
                      setMoveQuantity(1);
                    }}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                  >
                    {activeComanda.items.map(item => (
                      <option key={item.product.id} value={item.product.id}>
                        {item.product.name} (Disponível: {item.quantity}x)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Quantidade a Mover</label>
                    <input
                      type="number"
                      min="1"
                      max={activeComanda.items.find(i => i.product.id === moveSelectedItemId)?.quantity || 1}
                      required
                      value={moveQuantity}
                      onChange={(e) => setMoveQuantity(Number(e.target.value))}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Comanda Destino</label>
                    <select
                      required
                      value={moveTargetComandaId}
                      onChange={(e) => setMoveTargetComandaId(e.target.value)}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                    >
                      <option value="">-- Escolha a Comanda --</option>
                      {currentTable.comandas?.filter(c => c.id !== activeComanda.id).map(c => (
                        <option key={c.id} value={c.id}>
                          Comanda de: {c.cliente}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMoveItemsModal(false)}
                    className="flex-1 py-2.5 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!moveTargetComandaId || activeComanda.items.length === 0}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-neutral-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Confirmar Envio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 7: UNIFICAR COMANDAS (5.11) */}
      <AnimatePresence>
        {showMergeModal && activeComanda && currentTable && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                  <Merge className="w-4 h-4 text-emerald-850" />
                  <span>Unificar Comandas (Mesclar)</span>
                </h4>
                <button onClick={() => setShowMergeModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleMergeComandas} className="space-y-4">
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-neutral-500 block">Comanda ativa a ser mesclada e removida:</span>
                  <span className="font-black text-neutral-950">{activeComanda.cliente} (R$ {activeComanda.totalBill.toFixed(2)})</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Unificar e absorver na comanda:</label>
                  <select
                    required
                    value={mergeTargetComandaId}
                    onChange={(e) => setMergeTargetComandaId(e.target.value)}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-3 focus:outline-none"
                  >
                    <option value="">-- Escolha o Cliente Destinatário Principal --</option>
                    {currentTable.comandas?.filter(c => c.id !== activeComanda.id).map(c => (
                      <option key={c.id} value={c.id}>
                        Comanda: {c.cliente} (R$ {c.totalBill.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMergeModal(false)}
                    className="flex-1 py-2.5 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!mergeTargetComandaId}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-45 disabled:hover:bg-emerald-500 text-neutral-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Unificar Contas
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 8: SEPARAR COMANDA (5.12) */}
      <AnimatePresence>
        {showSeparateModal && activeComanda && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                <h4 className="font-black text-neutral-900 text-sm flex items-center gap-1.5">
                  <Divide className="w-4 h-4 text-emerald-850" />
                  <span>Separar Itens (Gerar Nova Comanda)</span>
                </h4>
                <button onClick={() => setShowSeparateModal(false)} className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSeparateComanda} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-neutral-600">Selecione o Prato para Desmembrar</label>
                  <select
                    required
                    value={separateSelectedItemId}
                    onChange={(e) => {
                      setSeparateSelectedItemId(e.target.value);
                      setSeparateQuantity(1);
                    }}
                    className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                  >
                    {activeComanda.items.map(item => (
                      <option key={item.product.id} value={item.product.id}>
                        {item.product.name} (Disponível: {item.quantity}x)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Quantidade a Separar</label>
                    <input
                      type="number"
                      min="1"
                      max={activeComanda.items.find(i => i.product.id === separateSelectedItemId)?.quantity || 1}
                      required
                      value={separateQuantity}
                      onChange={(e) => setSeparateQuantity(Number(e.target.value))}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-neutral-600">Nome do Novo Cliente</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={separateNewClient}
                      onChange={(e) => setSeparateNewClient(e.target.value)}
                      className="w-full text-xs font-bold bg-neutral-50 border border-neutral-250 rounded-xl p-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSeparateModal(false)}
                    className="flex-1 py-2.5 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!separateNewClient || activeComanda.items.length === 0}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-45 disabled:hover:bg-emerald-500 text-neutral-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Separar e Gerar Conta
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
