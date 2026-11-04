export interface BotButtonConfig {
  storeButtonText: string;
  storeButtonActive: boolean;
  supportButtonText: string;
  supportButtonActive: boolean;
  supportAction: 'miniapp' | 'telegram';
  supportTelegramUrl?: string;
  bannerImage?: string;
  welcomeMessage?: string;
}

export interface StoreConfig {
  storeName: string;
  storeSubtitle: string;
  platformName: string;
  domain: string;
  backendPort: number;
  publicPort: number;
  connectionMode: 'tunnel' | 'proxy' | 'direct';
  botToken: string;
  botUsername: string;
  adminNumericId: string;
  welcomeMessage: string;
  supportMessage: string;
  cardOwner: string;
  cardNumber: string;
  primaryColor: string;
  secondaryColor: string;
  starsPaymentEnabled?: boolean;
  cardPaymentEnabled: boolean;
  adminUsername?: string;
  maintenanceMode: boolean;
  maintenanceTitle?: string;
  maintenanceMessage?: string;
  announcementActive?: boolean;
  announcementBanner?: string;
  botPollingActive?: boolean;
  botStatus?: 'online' | 'offline' | 'error';
  botLastError?: string;
  usdRate?: number;
  usdtRate?: number;
  customDollarRateActive?: boolean;
  shebaNumber?: string;
  bankName?: string;
  publicAppUrl?: string;
  botButtons?: BotButtonConfig;
}

export interface CustomerProfile {
  id: string; // numeric Telegram ID
  name: string;
  username: string;
  phone: string;
  bio: string;
  photoUrl?: string;
  vipTier: 'عادی' | 'نقره‌ای' | 'طلایی' | 'VIP';
  orderCount: number;
  accountStatus: 'فعال' | 'ویژه' | 'احراز شده';
  joinedDate: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  active: boolean;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'password' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Product {
  id: string;
  cat: string;
  name: string;
  icon: string;
  image: string;
  desc: string;
  formType: 'ai' | 'game' | 'vpn' | 'basic' | 'custom';
  customFields: FormField[];
  plans: Plan[];
  active: boolean;
}

export interface Order {
  id: string;
  product: string;
  productId: string;
  plan: string;
  planId?: string;
  amount: number;
  status: 'در انتظار بررسی' | 'در حال انجام' | 'دریافت شد' | 'آماده تحویل' | 'تکمیل شده' | 'لغو شده';
  customer: {
    name: string;
    username: string;
    phone: string;
  };
  receipt: string;
  receiptName?: string;
  paymentMethod: 'card' | 'stars';
  formData: Record<string, string>;
  accountName?: string;
  accountInfo?: string;
  description?: string;
  message?: string;
  delivery?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  telegramUsername: string;
  subject: string;
  status: 'در انتظار پاسخ' | 'پاسخ داده شده' | 'بسته شده';
  createdAt: string;
  messages: {
    id: string;
    sender: 'customer' | 'admin';
    senderName: string;
    text: string;
    createdAt: string;
    attachment?: string;
  }[];
}

export interface AdminSecurityConfig {
  username?: string;
  password: string;
  question: string;
  answer: string;
  telegramAdminId: string;
}

export interface SystemDiagnosticStatus {
  domain: string;
  ssl: 'Active' | 'Not Installed' | 'Pending';
  botStatus: 'Connected' | 'Not Configured' | 'Polling Error';
  serviceStatus: 'Running' | 'Stopped';
  backendPort: number;
  publicHttps: number;
  diskUsage: string;
  ramUsage: string;
  nodeVersion: string;
  database: 'SQLite/JSON Local' | 'PostgreSQL';
  connectionMode: string;
  uptimeSeconds: number;
}
