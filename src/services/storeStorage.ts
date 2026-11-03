import {
  Category,
  Product,
  Order,
  StoreConfig,
  AdminSecurityConfig,
  SupportTicket,
  SystemDiagnosticStatus,
} from '../types/store';
import {
  initialCategories,
  initialConfig,
  initialAdminConfig,
  initialProducts,
  initialOrders,
  initialTickets,
} from '../data/initialData';

const STORAGE_KEYS = {
  CONFIG: 'tsm_store_config_v1',
  ADMIN_AUTH: 'manoto_admin_security_v4',
  CATEGORIES: 'tsm_categories_v1',
  PRODUCTS: 'tsm_products_v1',
  ORDERS: 'tsm_orders_v1',
  TICKETS: 'tsm_tickets_v1',
  USER_SESSION: 'tsm_user_session_v1',
};

export const getStoredConfig = (): StoreConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return initialConfig;
};

export const saveStoredConfig = (config: StoreConfig): void => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
};

export const getStoredAdminConfig = (): AdminSecurityConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return initialAdminConfig;
};

export const saveStoredAdminConfig = (cfg: AdminSecurityConfig): void => {
  localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(cfg));
};

export const getStoredCategories = (): Category[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return initialCategories;
};

export const saveStoredCategories = (cats: Category[]): void => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
};

export const getStoredProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return initialProducts;
};

export const saveStoredProducts = (products: Product[]): void => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

export const getStoredOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return initialOrders;
};

export const saveStoredOrders = (orders: Order[]): void => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const getStoredTickets = (): SupportTicket[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return initialTickets;
};

export const saveStoredTickets = (tickets: SupportTicket[]): void => {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
};

export const getSystemStatus = (config: StoreConfig): SystemDiagnosticStatus => {
  return {
    domain: config.domain || 'shop.example.com',
    ssl: config.domain ? 'Active' : 'Not Installed',
    botStatus: config.botToken ? 'Connected' : 'Not Configured',
    serviceStatus: 'Running',
    backendPort: config.backendPort || 3000,
    publicHttps: config.publicPort || 443,
    diskUsage: '14.2 GB / 40 GB (35%)',
    ramUsage: '482 MB / 2048 MB (24%)',
    nodeVersion: 'v22.23.3',
    database: 'SQLite/JSON Local',
    connectionMode: config.connectionMode === 'tunnel' ? 'Cloudflare Tunnel' : 'Direct Nginx',
    uptimeSeconds: Math.floor((Date.now() - 1730000000000) / 1000) % 86400 + 4200,
  };
};

export const resetToDefaults = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.ORDERS);
  localStorage.removeItem(STORAGE_KEYS.TICKETS);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
};
