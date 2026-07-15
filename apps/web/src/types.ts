/**
 * Types for the Premium Restaurant Management System
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
  image: string;
  description: string;
  available: boolean;
  additions?: { name: string; price: number }[];
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedAdditions: { name: string; price: number }[];
  notes?: string;
}

export interface Order {
  id: string;
  code: string; // e.g. #ORD-1234
  tableId?: string;
  tableName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: 'credit' | 'debit' | 'cash' | 'pix' | 'split';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  customerName?: string;
  cardMachineId?: string;
}


export interface Comanda {
  id: string;
  mesaId: string;
  cliente: string;
  telefone?: string;
  quantidadePessoas: number;
  garcomId?: string;
  observacoes?: string;
  items: OrderItem[];
  status: 'active' | 'billing' | 'paid';
  criadaEmISO: string;
  totalBill: number;
}

export interface EventoHistorico {
  id: string;
  mesaId: string;
  comandaId?: string;
  tipo: string; // 'create' | 'edit' | 'status' | 'comanda_open' | 'comanda_add_item' | 'comanda_transfer' | 'comanda_move_item' | 'comanda_merge' | 'comanda_split' | 'payment' | 'close'
  descricao: string;
  timestampISO: string;
  autor: string;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billing' | 'cleaning' | 'reserved' | 'blocked' | 'maintenance';
  currentOrderId?: string;
  totalBill?: number;
  occupiedSince?: string;
  name?: string;
  area?: string; // 'Salão Principal' | 'Varanda' | 'Área Externa' | 'VIP' | 'Piso Superior'
  color?: string; // hex or name
  observation?: string;
  comandas?: Comanda[];
  history?: EventoHistorico[];
  shape?: 'circle' | 'square' | 'rectangle' | 'booth';
  isVip?: boolean;
  isReservable?: boolean;
  preferredWaiterId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  shift: 'morning' | 'evening' | 'night' | 'off';
  avatar: string;
  termsAccepted?: boolean;
}

export interface CashRegister {
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  initialAmount: number;
  currentAmount: number;
  transactions: CashTransaction[];
}

export interface CashTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  description: string;
  category: 'sale' | 'supply' | 'withdrawal' | 'expense';
  timestamp: string;
  operator: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}
