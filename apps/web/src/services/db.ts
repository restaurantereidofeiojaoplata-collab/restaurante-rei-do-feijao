import { Product, Order, Table, Employee, CashRegister, CashTransaction, Notification } from '../types';

// Unsplash high quality food image URLs
const IMAGES = {
  burger_gourmet: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  burger_cheese: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
  pizza_caprese: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
  pizza_pepperoni: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80',
  fritas: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
  suco_laranja: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  refrigerante: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  petit_gateau: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80',
  torta_limao: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80',
  cerveja: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80',
  risoto: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80',
  salmao: 'https://images.unsplash.com/photo-1485921325814-a5341826fb8e?w=400&q=80',
};

const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_TABLES: Table[] = [];

const DEFAULT_EMPLOYEES: Employee[] = [];

const DEFAULT_CASH_REGISTER: CashRegister = {
  isOpen: false,
  initialAmount: 0.00,
  currentAmount: 0.00,
  transactions: []
};

const DEFAULT_ORDERS: Order[] = [];

const DEFAULT_NOTIFICATIONS: Notification[] = [];

export class DBService {
  private static load<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`gourmet_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`gourmet_${key}`, JSON.stringify(value));
      // Notify listeners
      window.dispatchEvent(new CustomEvent('gourmet_db_change', { detail: { key } }));
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  }

  // Subscriptions
  public static subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('gourmet_db_change', handler);
    return () => window.removeEventListener('gourmet_db_change', handler);
  }

  // Getters & Setters
  public static getProducts(): Product[] {
    return this.load<Product[]>('products', DEFAULT_PRODUCTS);
  }

  public static saveProducts(products: Product[]): void {
    this.save('products', products);
  }

  public static getTables(): Table[] {
    return this.load<Table[]>('tables', DEFAULT_TABLES);
  }

  public static saveTables(tables: Table[]): void {
    this.save('tables', tables);
  }

  public static getOrders(): Order[] {
    return this.load<Order[]>('orders', DEFAULT_ORDERS);
  }

  public static saveOrders(orders: Order[]): void {
    this.save('orders', orders);
  }

  public static getEmployees(): Employee[] {
    return this.load<Employee[]>('employees', DEFAULT_EMPLOYEES);
  }

  public static saveEmployees(employees: Employee[]): void {
    this.save('employees', employees);
  }

  public static getCashRegister(): CashRegister {
    return this.load<CashRegister>('cash_register', DEFAULT_CASH_REGISTER);
  }

  public static saveCashRegister(cashRegister: CashRegister): void {
    this.save('cash_register', cashRegister);
  }

  public static getNotifications(): Notification[] {
    return this.load<Notification[]>('notifications', DEFAULT_NOTIFICATIONS);
  }

  public static saveNotifications(notifications: Notification[]): void {
    this.save('notifications', notifications);
  }

  // Core functions helper
  public static resetToDefaults(): void {
    localStorage.removeItem('gourmet_products');
    localStorage.removeItem('gourmet_tables');
    localStorage.removeItem('gourmet_orders');
    localStorage.removeItem('gourmet_employees');
    localStorage.removeItem('gourmet_cash_register');
    localStorage.removeItem('gourmet_notifications');
    this.save('products', DEFAULT_PRODUCTS);
    this.save('tables', DEFAULT_TABLES);
    this.save('orders', DEFAULT_ORDERS);
    this.save('employees', DEFAULT_EMPLOYEES);
    this.save('cash_register', DEFAULT_CASH_REGISTER);
    this.save('notifications', DEFAULT_NOTIFICATIONS);
  }
}
