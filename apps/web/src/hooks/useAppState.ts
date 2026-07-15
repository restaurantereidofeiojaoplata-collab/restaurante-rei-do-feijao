import { useState, useEffect } from 'react';
import { DBService } from '../services/db';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { Product, Order, Table, Employee, CashRegister, CashTransaction, Notification, OrderItem } from '../types';
import { secureStorage } from '../utils/crypto';
import { playChimeSound } from '../utils/audio';

export type ViewType =
  | 'dashboard'
  | 'pdv'
  | 'tables'
  | 'orders'
  | 'products'
  | 'employees'
  | 'finance'
  | 'settings';

export interface AppState {
  products: Product[];
  tables: Table[];
  orders: Order[];
  employees: Employee[];
  cashRegister: CashRegister;
  notifications: Notification[];
  activeView: ViewType;
  currentUser: Employee | null;
  // Simulation conditions
  isOffline: boolean;
  isSessionExpired: boolean;
  isAccessDenied: boolean;
  is500Error: boolean;
  isDarkMode: boolean;
}

export function useAppState() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; type?: string }[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(() => DBService.getEmployees());
  const [cashRegister, setCashRegister] = useState<CashRegister>(() => DBService.getCashRegister());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  // Local-only state for routing, dark mode, simulated states, and currentUser
  const [activeView, setActiveView] = useState<ViewType>(() => {
    return (secureStorage.getItem('gourmet_view') as ViewType) || 'dashboard';
  });
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const cached = secureStorage.getItem('gourmet_user');
    const token = secureStorage.getItem('gourmet_token');
    if (cached && token) return JSON.parse(cached);
    return null;
  });

  const [isOffline, setIsOffline] = useState(() => secureStorage.getItem('gourmet_sim_offline') === 'true');
  const [isSessionExpired, setIsSessionExpired] = useState(() => secureStorage.getItem('gourmet_sim_session_expired') === 'true');
  const [isAccessDenied, setIsAccessDenied] = useState(() => secureStorage.getItem('gourmet_sim_access_denied') === 'true');
  const [is500Error, setIs500Error] = useState(() => secureStorage.getItem('gourmet_sim_500') === 'true');
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Number of device access requests awaiting admin approval
  const [pendingDeviceCount, setPendingDeviceCount] = useState(0);

  // Sync state from API on mount, login and WS updates
  const syncData = async () => {
    const cachedUser = secureStorage.getItem('gourmet_user');
    if (!cachedUser) return;
    
    try {
      const user = JSON.parse(cachedUser);
      const isAdmin = user.permissions?.includes('system:admin');

      const promises: Promise<any>[] = [
        api.get('/products/categories'),
        api.get('/tables'),
        api.get('/orders'),
        api.get('/settings').catch(() => ({})),
      ];

      if (isAdmin) {
        promises.push(api.get('/device-sessions/pending'));
      }

      const results = await Promise.all(promises);
      const categoriesData = results[0];
      const tablesData = results[1];
      const ordersData = results[2];
      const settingsData = results[3] || {};
      const pendingDevices = isAdmin ? results[4] : [];

      // Sincronizar configurações do banco para o localStorage
      Object.entries(settingsData).forEach(([key, val]) => {
        if (typeof key === 'string' && typeof val === 'string') {
          localStorage.setItem(key, val);
        }
      });

      if (isAdmin && pendingDevices) {
        setPendingDeviceCount(pendingDevices.length);
      }


      // Fase 2: buscar produtos (depende das categorias para mapear)
      const productsData = await api.get('/products');

      // Formatar produtos
      const formattedProducts: Product[] = productsData.map((p: any) => {
        const cat = categoriesData.find((c: any) => c.id === p.categoryId);
        return {
          id: p.id,
          name: p.name,
          price: p.unitAmountInCents / 100,
          cost: 0,
          category: cat ? cat.name : 'Geral',
          stock: 99,
          minStock: 5,
          image: p.image ?? 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
          description: p.description ?? '',
          available: p.isActive
        };
      });

      // Formatar mesas
      const formattedTables: Table[] = tablesData.map((t: any) => {
        const isOccupied = t.activeSession !== null;
        return {
          id: t.id,
          number: t.number,
          capacity: 4,
          status: isOccupied ? 'occupied' : 'available',
          totalBill: t.totalBillInCents / 100,
          currentOrderId: t.currentOrderId,
          occupiedSince: t.activeSession?.openedAt,
          area: 'Salão Principal',
          color: '#10b981'
        };
      });

      // Formatar pedidos (usa formattedProducts para enriquecer itens)
      const formattedOrders: Order[] = ordersData.map((o: any) => {
        return {
          id: o.id,
          code: o.orderNumber,
          tableId: o.tableSessionId ?? undefined,
          tableName: o.tableSessionId ? 'Mesa' : undefined,
          items: o.items.map((item: any) => {
            const matchingProduct = formattedProducts.find(p => p.name === item.nameSnapshot) || {
              id: item.id,
              name: item.nameSnapshot,
              price: item.unitAmountInCents / 100,
              cost: 0,
              category: 'Geral',
              stock: 99,
              minStock: 5,
              image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
              description: '',
              available: true
            };
            return {
              product: matchingProduct,
              quantity: item.quantity,
              selectedAdditions: [],
              notes: item.notes ?? undefined
            };
          }),
          subtotal: o.subtotalAmountInCents / 100,
          discount: o.discountAmountInCents / 100,
          total: o.totalAmountInCents / 100,
          status: o.status.toLowerCase(),
          paymentStatus: o.status === 'PAID' ? 'paid' : 'pending',
          createdAt: o.createdAt
        };
      });

      // Atualizar todos os estados de uma vez
      setCategories(categoriesData);
      setProducts(formattedProducts);
      setTables(formattedTables);
      setOrders(formattedOrders);

      // 1. Sincronizar Contas a Pagar/Receber do banco
      try {
        const billsData = await api.get('/bills');
        setBills(billsData.map((b: any) => ({
          id: b.id,
          title: b.title,
          amount: b.amountInCents / 100,
          dueDate: b.dueDate.split('T')[0],
          status: b.status,
          type: b.type,
          category: b.category
        })));
      } catch (err) {
        console.error('Erro ao sincronizar contas a pagar/receber:', err);
      }

      // 2. Sincronizar Caixa Operacional do banco
      try {
        const registers = await api.get('/cash-registers');
        const defaultRegister = registers[0];
        if (defaultRegister) {
          const activeSession = await api.get(`/cash-registers/sessions/active?registerId=${defaultRegister.id}`);
          if (activeSession) {
            const movements = await api.get(`/cash-registers/sessions/${activeSession.id}/movements`);
            
            const transactions = movements.map((mov: any) => {
              const op = employees.find(e => e.id === mov.performedById)?.name || 'Operador';
              
              let type: 'in' | 'out' = 'in';
              let category: 'supply' | 'withdrawal' | 'sale' | 'expense' = 'supply';
              
              if (mov.type === 'OPENING_BALANCE' || mov.type === 'SUPRIMENTO') {
                type = 'in';
                category = 'supply';
              } else if (mov.type === 'PAYMENT') {
                type = 'in';
                category = 'sale';
              } else if (mov.type === 'SANGRIA') {
                type = 'out';
                category = 'withdrawal';
              } else if (mov.type === 'REFUND') {
                type = 'out';
                category = 'expense';
              }
              
              return {
                id: mov.id,
                type,
                amount: mov.amountInCents / 100,
                description: mov.notes || '',
                category,
                timestamp: mov.createdAt,
                operator: op
              };
            });
            
            transactions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            let currentAmount = activeSession.openingBalanceInCents / 100;
            for (const m of movements) {
              if (m.type === 'SUPRIMENTO' || m.type === 'PAYMENT') {
                currentAmount += m.amountInCents / 100;
              } else if (m.type === 'SANGRIA' || m.type === 'REFUND') {
                currentAmount -= m.amountInCents / 100;
              }
            }
            
            setCashRegister({
              isOpen: true,
              openedAt: activeSession.openedAt,
              initialAmount: activeSession.openingBalanceInCents / 100,
              currentAmount,
              transactions
            });
          } else {
            setCashRegister({ isOpen: false, initialAmount: 0, currentAmount: 0, transactions: [] });
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar caixa do servidor:', err);
      }

    } catch (err) {
      console.error('[API Sync Error]', err);
    }
  };


  // Manage WebSocket connection based on logged-in user
  useEffect(() => {
    if (currentUser && (currentUser as any).restaurantId) {
      const socket = socketService.connect((currentUser as any).restaurantId);
      
      const handleOrderUpdated = (data: any) => {
        console.log('[WebSocket] Order updated:', data);
        addNotification('Pedido Atualizado', `Pedido foi modificado no servidor.`, 'info');
        syncData();
      };

      const handleKitchenTicketUpdated = (data: any) => {
        console.log('[WebSocket] Kitchen ticket updated:', data);
        const statusMap: Record<string, string> = {
          PENDING: 'Pendente',
          PREPARING: 'Em Preparação',
          READY: 'Pronto para Entrega',
          DELIVERED: 'Entregue'
        };
        addNotification(
          'KDS - Cozinha', 
          `Pedido na cozinha avançou para "${statusMap[data.status] || data.status}".`, 
          data.status === 'READY' ? 'success' : 'info'
        );
        syncData();
      };

      // Handle new device access requests — show badge + notification to admin
      const handleDeviceAccessRequest = (data: any) => {
        const isAdmin = (currentUser as any).permissions?.includes('system:admin');
        if (!isAdmin) return;
        setPendingDeviceCount(prev => prev + 1);
        const locInfo = data.location ? ` em ${data.location}` : '';
        addNotification(
          '🔐 Novo Dispositivo',
          `${data.userName || 'Um usuário'} está solicitando acesso de um novo dispositivo${locInfo} (${data.ipAddress || 'IP desconhecido'}).`,
          'warning'
        );
      };

      socketService.on('order_updated', handleOrderUpdated);
      socketService.on('kitchen_ticket_updated', handleKitchenTicketUpdated);
      socketService.on('device:access_request', handleDeviceAccessRequest);

      return () => {
        socketService.off('order_updated', handleOrderUpdated);
        socketService.off('kitchen_ticket_updated', handleKitchenTicketUpdated);
        socketService.off('device:access_request', handleDeviceAccessRequest);
      };
    } else {
      socketService.disconnect();
    }
  }, [currentUser]);

  // listen to unauthorized 401 events from the api service
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      secureStorage.removeItem('gourmet_user');
      secureStorage.removeItem('gourmet_token');
    };
    window.addEventListener('gourmet_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('gourmet_unauthorized', handleUnauthorized);
  }, []);

  // Fetch initial data on mount/login
  useEffect(() => {
    if (currentUser) {
      syncData();
    }
  }, [currentUser]);

  // Update dark mode class on HTML element - locked to light/white theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Route updates
  const changeView = (view: ViewType) => {
    const allowed = (currentUser as any)?.allowedViews;
    if (allowed && allowed.length > 0 && !allowed.includes(view)) {
      const fallbackView = allowed[0] as ViewType;
      if (fallbackView) {
        setActiveView(fallbackView);
        secureStorage.setItem('gourmet_view', fallbackView);
        return;
      }
    }
    setActiveView(view);
    secureStorage.setItem('gourmet_view', view);
  };

  // Redirect to first allowed view if initial view is restricted
  useEffect(() => {
    if (currentUser) {
      const allowed = (currentUser as any).allowedViews;
      if (allowed && allowed.length > 0 && !allowed.includes(activeView)) {
        const fallbackView = allowed[0] as ViewType;
        if (fallbackView) {
          setActiveView(fallbackView);
          secureStorage.setItem('gourmet_view', fallbackView);
        }
      }
    }
  }, [currentUser]);

  // User actions
  const login = (employee: Employee) => {
    setCurrentUser(employee);
    secureStorage.setItem('gourmet_user', JSON.stringify(employee));
  };

  const updateProfile = (updatedUser: Partial<Employee>) => {
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      setCurrentUser(newUser);
      secureStorage.setItem('gourmet_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setProducts([]);
    setTables([]);
    setOrders([]);
    setEmployees([]);
    setCashRegister({ isOpen: false, initialAmount: 0, currentAmount: 0, transactions: [] });
    setNotifications([]);
    secureStorage.removeItem('gourmet_user');
    secureStorage.removeItem('gourmet_token');
    window.location.href = '/'; // Hard reload to clear socket connections and active timers
  };

  // Toggle simulators
  const toggleOffline = () => {
    const val = !isOffline;
    setIsOffline(val);
    secureStorage.setItem('gourmet_sim_offline', String(val));
    if (val) addNotification('Simulação Offline', 'O sistema entrou em modo sem conexão.', 'error');
  };

  const toggleSessionExpired = () => {
    const val = !isSessionExpired;
    setIsSessionExpired(val);
    secureStorage.setItem('gourmet_sim_session_expired', String(val));
  };

  const toggleAccessDenied = () => {
    const val = !isAccessDenied;
    setIsAccessDenied(val);
    secureStorage.setItem('gourmet_sim_access_denied', String(val));
  };

  const toggle500Error = () => {
    const val = !is500Error;
    setIs500Error(val);
    secureStorage.setItem('gourmet_sim_500', String(val));
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Products Operations
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const categoriesList = await api.get('/products/categories');
      let category = categoriesList.find((c: any) => c.name.toLowerCase() === product.category.toLowerCase());
      if (!category) {
        category = await api.post('/products/categories', {
          name: product.category,
          slug: product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isActive: true
        });
      }

      await api.post('/products', {
        categoryId: category.id,
        name: product.name,
        slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        unitAmountInCents: Math.round(product.price * 100),
        description: product.description,
        isActive: product.available
      });

      addNotification('Produto Cadastrado', `"${product.name}" foi adicionado ao catálogo.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error adding product:', err);
      addNotification('Erro ao cadastrar', 'Não foi possível cadastrar o produto no servidor.', 'error');
    }
  };

  const updateProduct = async (id: string, updated: Partial<Product>) => {
    try {
      const payload: any = {};
      if (updated.name) {
        payload.name = updated.name;
        payload.slug = updated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      if (updated.price !== undefined) {
        payload.unitAmountInCents = Math.round(updated.price * 100);
      }
      if (updated.description !== undefined) {
        payload.description = updated.description;
      }
      if (updated.available !== undefined) {
        payload.isActive = updated.available;
      }

      if (updated.category) {
        const categoriesList = await api.get('/products/categories');
        let category = categoriesList.find((c: any) => c.name.toLowerCase() === updated.category!.toLowerCase());
        if (!category) {
          category = await api.post('/products/categories', {
            name: updated.category,
            slug: updated.category!.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            isActive: true
          });
        }
        payload.categoryId = category.id;
      }

      await api.patch(`/products/${id}`, payload);
      addNotification('Produto Atualizado', `O produto foi modificado com sucesso.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error updating product:', err);
      addNotification('Erro ao atualizar', 'Não foi possível salvar as alterações do produto.', 'error');
    }
  };

  const deleteProduct = async (id: string, adminPassword?: string) => {
    try {
      await api.delete(`/products/${id}`, {
        body: JSON.stringify({ adminPassword })
      });
      setProducts(prev => prev.filter(p => p.id !== id));
      addNotification('Produto Excluído', 'O produto foi excluído permanentemente.', 'success');
      await syncData();
    } catch (err) {
      console.error('Error deleting product:', err);
      addNotification('Erro ao excluir', 'Senha incorreta ou erro no servidor.', 'error');
      throw err;
    }
  };

  // Categories Operations (Enriched)
  const addCategory = async (name: string, type = 'product') => {
    try {
      const newCat = await api.post('/products/categories', {
        name: name.trim(),
        slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        isActive: true,
        type
      });
      setCategories(prev => [...prev, newCat]);
      addNotification('Categoria Criada', `A categoria "${name}" foi criada com sucesso.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error adding category:', err);
      addNotification('Erro ao criar categoria', 'Não foi possível cadastrar a categoria.', 'error');
    }
  };

  const updateCategory = async (id: string, name: string, isActive = true) => {
    try {
      const updatedCat = await api.patch(`/products/categories/${id}`, {
        name: name.trim(),
        slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
        isActive
      });
      setCategories(prev => prev.map(c => c.id === id ? updatedCat : c));
      addNotification('Categoria Atualizada', `A categoria foi atualizada com sucesso.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error updating category:', err);
      addNotification('Erro ao atualizar categoria', 'Não foi possível salvar as alterações da categoria.', 'error');
    }
  };

  const deleteCategory = async (id: string, adminPassword?: string) => {
    try {
      await api.delete(`/products/categories/${id}`, {
        body: JSON.stringify({ adminPassword })
      });
      setCategories(prev => prev.filter(c => c.id !== id));
      addNotification('Categoria Excluída', 'A categoria foi excluída com sucesso.', 'success');
      await syncData();
    } catch (err) {
      console.error('Error deleting category:', err);
      addNotification('Erro ao excluir', 'Senha incorreta ou erro no servidor.', 'error');
      throw err;
    }
  };

  const verifyAdminPassword = async (password: string, action: string, description: string) => {
    try {
      await api.post('/auth/verify-admin-password', { password, action, description });
      await syncData();
    } catch (err: any) {
      console.error('Error verifying admin password:', err);
      throw err;
    }
  };

  // Tables & Comandas Operations
  const updateTableStatus = async (id: string, status: Table['status'], currentOrderId?: string, totalBill?: number) => {
    const originalTables = [...tables];

    // Optimistically update tables state immediately (0ms latency UI response)
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status,
          currentOrderId: currentOrderId !== undefined ? currentOrderId : t.currentOrderId,
          totalBill: totalBill !== undefined ? totalBill : t.totalBill
        };
      }
      return t;
    }));

    try {
      const table = originalTables.find(t => t.id === id);
      if (!table) return;

      if (status === 'occupied' && table.status === 'available') {
        // Open table session via API
        await api.post(`/tables/${id}/session`);
      } else if (status === 'available' || status === 'cleaning') {
        // Close session. Find active session first
        const rawTables = await api.get('/tables');
        const matched = rawTables.find((t: any) => t.id === id);
        if (matched && matched.activeSession) {
          await api.post(`/tables/session/${matched.activeSession.id}/close`);
        }
      }

      await syncData();
    } catch (err) {
      // Revert local state to original on API error
      setTables(originalTables);
      console.error('Error updating table status:', err);
      addNotification('Erro de Mesa', 'Não foi possível alterar o status da mesa no servidor.', 'error');
    }
  };

  // Orders Operations
  const createOrder = async (orderData: Omit<Order, 'id' | 'code' | 'createdAt'>): Promise<any> => {
    try {
      let tableSessionId: string | null = null;
      if (orderData.tableId) {
        const rawTables = await api.get('/tables');
        const matchedTable = rawTables.find((tb: any) => tb.id === orderData.tableId);
        if (matchedTable && matchedTable.activeSession) {
          tableSessionId = matchedTable.activeSession.id;
        } else {
          const newSession = await api.post(`/tables/${orderData.tableId}/session`);
          tableSessionId = newSession.id;
        }
      }

      // 1. Create order
      const order = await api.post('/orders', {
        tableSessionId,
        origin: orderData.tableId ? 'TABLE' : 'COUNTER',
        discountAmountInCents: Math.round(orderData.discount * 100),
        serviceFeeAmountInCents: 0
      });

      // 2. Add items
      await api.post(`/orders/${order.id}/items`, {
        items: orderData.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes || null
        }))
      });

      // 3. Send to kitchen
      await api.post(`/orders/${order.id}/send-to-kitchen`);

      // 4. Auto-pay if paymentStatus is paid
      if (orderData.paymentStatus === 'paid') {
        const methodMap: Record<string, string> = {
          pix: 'PIX',
          money: 'CASH',
          card: 'CREDIT_CARD',
          credit: 'CREDIT_CARD',
          debit: 'DEBIT_CARD',
          cash: 'CASH'
        };
        const backendMethod = methodMap[orderData.paymentMethod || 'money'] || 'CASH';
        const provider = backendMethod === 'CASH' ? 'CASH' : 'MANUAL';

        const intent = await api.post('/payments/intents', {
          orderId: order.id,
          provider,
          method: backendMethod,
          amountInCents: Math.round(orderData.total * 100)
        });

        await api.post(`/payments/intents/${intent.id}/process`);
      }

      addNotification('Novo Pedido', `Pedido criado com sucesso.`, 'success');
      await syncData();
      return order;
    } catch (err) {
      console.error('Error creating order:', err);
      addNotification('Erro ao criar pedido', 'Não foi possível cadastrar o pedido no servidor.', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const originalOrders = [...orders];

    // Optimistically update orders in local state immediately (0ms latency UI response)
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status };
      }
      return o;
    }));

    try {
      if (status === 'cancelled') {
        await api.post(`/orders/${orderId}/cancel-request`);
        addNotification('Pedido Cancelado', 'O pedido foi cancelado com sucesso.', 'error');
      }
      await syncData();
    } catch (err) {
      // Revert local state on API error
      setOrders(originalOrders);
      console.error('Error updating order status:', err);
      addNotification('Erro no Pedido', 'Não foi possível alterar o status do pedido.', 'error');
    }
  };

  // Pay an order directly (e.g. from POS or Table Checkout modal)
  const payOrder = async (orderId: string, method: Order['paymentMethod'], discount: number = 0) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const methodMap: Record<string, string> = {
        pix: 'PIX',
        money: 'CASH',
        card: 'CREDIT_CARD',
        credit: 'CREDIT_CARD',
        debit: 'DEBIT_CARD',
        cash: 'CASH'
      };

      const backendMethod = methodMap[method || 'money'] || 'CASH';
      const provider = backendMethod === 'CASH' ? 'CASH' : 'MANUAL';

      // 1. Create Payment Intent
      const intent = await api.post('/payments/intents', {
        orderId,
        provider,
        method: backendMethod,
        amountInCents: Math.round((order.subtotal - discount) * 100)
      });

      // 2. Process Intent
      await api.post(`/payments/intents/${intent.id}/process`);

      addNotification('Pagamento Confirmado', `Pedido pago via ${method?.toUpperCase()}.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error paying order:', err);
      addNotification('Erro no Pagamento', 'Não foi possível processar o pagamento no servidor.', 'error');
    }
  };

  // Employees Operations
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...emp,
      id: `e_${Date.now()}`
    };
    const newList = [...employees, newEmp];
    setEmployees(newList);
    DBService.saveEmployees(newList);
    addNotification('Colaborador Adicionado', `"${emp.name}" cadastrado como ${emp.role}.`, 'success');
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    const list = employees.map(e => e.id === id ? { ...e, ...updated } : e);
    setEmployees(list);
    DBService.saveEmployees(list);
  };

  const deleteEmployee = (id: string) => {
    const list = employees.filter(e => e.id !== id);
    setEmployees(list);
    DBService.saveEmployees(list);
  };

  // Cash Register Operations
  const openCashRegister = async (initialAmount: number) => {
    try {
      const registers = await api.get('/cash-registers');
      const defaultRegister = registers[0];
      if (!defaultRegister) return;
      
      await api.post('/cash-registers/sessions/open', {
        cashRegisterId: defaultRegister.id,
        openingBalanceInCents: Math.round(initialAmount * 100)
      });
      
      addNotification('Caixa Aberto', `Caixa aberto com sucesso no servidor.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error opening cash register:', err);
      addNotification('Erro de Caixa', 'Não foi possível abrir o caixa no servidor.', 'error');
    }
  };

  const closeCashRegister = async () => {
    try {
      const registers = await api.get('/cash-registers');
      const defaultRegister = registers[0];
      if (!defaultRegister) return;
      
      const activeSession = await api.get(`/cash-registers/sessions/active?registerId=${defaultRegister.id}`);
      if (!activeSession) return;
      
      await api.post(`/cash-registers/sessions/${activeSession.id}/close`, {
        closingBalanceInCents: Math.round(cashRegister.currentAmount * 100),
        notes: 'Fechamento de turno'
      });
      
      addNotification('Caixa Fechado', `Caixa fechado com sucesso no servidor.`, 'info');
      await syncData();
    } catch (err) {
      console.error('Error closing cash register:', err);
      addNotification('Erro de Caixa', 'Não foi possível fechar o caixa no servidor.', 'error');
    }
  };

  const addCashTransaction = async (
    type: 'in' | 'out',
    amount: number,
    description: string,
    category: CashTransaction['category']
  ) => {
    try {
      const registers = await api.get('/cash-registers');
      const defaultRegister = registers[0];
      if (!defaultRegister) return;
      
      const activeSession = await api.get(`/cash-registers/sessions/active?registerId=${defaultRegister.id}`);
      if (!activeSession) return;
      
      const path = category === 'supply' ? 'suprimento' : 'sangria';
      await api.post(`/cash-registers/sessions/${activeSession.id}/${path}`, {
        amountInCents: Math.round(amount * 100),
        notes: description
      });
      
      addNotification('Movimentação Registrada', `Lançamento de R$ ${amount.toFixed(2)} registrado com sucesso.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error adding cash transaction:', err);
      addNotification('Erro de Caixa', 'Não foi possível registrar a movimentação no servidor.', 'error');
    }
  };

  // Bills Operations (Contas a Pagar/Receber)
  const addBill = async (billData: any) => {
    try {
      await api.post('/bills', {
        title: billData.title,
        amountInCents: Math.round(billData.amount * 100),
        dueDate: billData.dueDate,
        type: billData.type,
        category: billData.category
      });
      addNotification('Conta Lançada', `Conta "${billData.title}" adicionada com sucesso.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error adding bill:', err);
      addNotification('Erro Financeiro', 'Não foi possível lançar a conta no servidor.', 'error');
    }
  };

  const toggleBillStatus = async (billId: string) => {
    try {
      const matched = bills.find(b => b.id === billId);
      if (!matched) return;
      
      const nextStatus = matched.status === 'pending' ? 'paid' : 'pending';
      await api.patch(`/bills/${billId}`, { status: nextStatus });
      
      // If paid and cash register is open, auto-register in cash register
      if (nextStatus === 'paid' && cashRegister.isOpen) {
        const type = matched.type === 'receivable' ? 'in' : 'out';
        const category = matched.type === 'receivable' ? 'supply' : 'expense';
        await addCashTransaction(type, matched.amount, `${matched.type === 'receivable' ? 'Recebimento' : 'Pagamento'}: ${matched.title}`, category);
      }
      
      addNotification('Conta Atualizada', `Status alterado para ${nextStatus === 'paid' ? 'pago' : 'pendente'}.`, 'success');
      await syncData();
    } catch (err) {
      console.error('Error toggling bill status:', err);
      addNotification('Erro Financeiro', 'Não foi possível atualizar o status da conta no servidor.', 'error');
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      await api.delete(`/bills/${billId}`);
      addNotification('Conta Removida', 'Lançamento financeiro deletado com sucesso.', 'info');
      await syncData();
    } catch (err) {
      console.error('Error deleting bill:', err);
      addNotification('Erro Financeiro', 'Não foi possível remover a conta do servidor.', 'error');
    }
  };


  // Notifications Operations
  const addNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: `n_${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    const list = [newNotif, ...notifications].slice(0, 50);
    DBService.saveNotifications(list);
    setNotifications(list);
    
    // Play native synth chime based on type
    playChimeSound(type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
  };


  const markAllNotificationsRead = () => {
    const list = notifications.map(n => ({ ...n, read: true }));
    DBService.saveNotifications(list);
    setNotifications(list);
  };

  const clearNotifications = () => {
    DBService.saveNotifications([]);
    setNotifications([]);
  };


  const resetAllData = () => {
    DBService.resetToDefaults();
    addNotification('Sistema Reiniciado', 'O banco de dados de simulação foi redefinido para o padrão.', 'info');
  };

  return {
    products,
    categories,
    tables,
    orders,
    employees,
    cashRegister,
    notifications,
    activeView,
    currentUser,
    isOffline,
    isSessionExpired,
    isAccessDenied,
    is500Error,
    isDarkMode,

    changeView,
    login,
    logout,
    updateProfile,
    toggleOffline,
    toggleSessionExpired,
    toggleAccessDenied,
    toggle500Error,
    toggleTheme,

    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    verifyAdminPassword,

    updateTableStatus,

    createOrder,
    updateOrderStatus,
    payOrder,

    addEmployee,
    updateEmployee,
    deleteEmployee,

    openCashRegister,
    closeCashRegister,
    addCashTransaction,

    bills,
    addBill,
    toggleBillStatus,
    deleteBill,

    addNotification,
    markAllNotificationsRead,
    clearNotifications,
    resetAllData,

    pendingDeviceCount,
    setPendingDeviceCount
  };
}

