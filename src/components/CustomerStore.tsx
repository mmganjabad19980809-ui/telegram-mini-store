import React, { useState, useMemo } from 'react';
import {
  StoreConfig,
  Category,
  Product,
  Plan,
  Order,
  FormField,
  SupportTicket,
} from '../types/store';
import {
  Search,
  Receipt,
  Settings,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Shield,
  Send,
  HelpCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
  Phone,
  ShieldCheck,
  FileText,
  RefreshCw,
  Calculator,
  Edit3,
  MessageCircle,
} from 'lucide-react';
import { CustomerProfile } from '../types/store';

interface CustomerStoreProps {
  config: StoreConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  tickets: SupportTicket[];
  onOpenAdmin: () => void;
  onCreateOrder: (order: Order) => void;
  onCreateTicket: (ticket: SupportTicket) => void;
}

export const CustomerStore: React.FC<CustomerStoreProps> = ({
  config,
  categories,
  products,
  orders,
  tickets,
  onOpenAdmin,
  onCreateOrder,
  onCreateTicket,
}) => {
  // Navigation inside the store
  const [view, setView] = useState<'home' | 'product' | 'checkout' | 'orders' | 'profile' | 'support' | 'success'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Live Currency Exchange Rates State (from public API or admin config)
  const [liveRates, setLiveRates] = useState<{
    usdPrice: number;
    usdtPrice: number;
    change24h: string;
    high24h: number;
    low24h: number;
    source: string;
    lastUpdate: string;
  }>({
    usdPrice: config.usdRate || 94850,
    usdtPrice: config.usdtRate || 95200,
    change24h: '+1.2%',
    high24h: (config.usdRate || 94850) + 500,
    low24h: (config.usdRate || 94850) - 400,
    source: 'سامانه لحظه‌ای ارز آزاد و تتر',
    lastUpdate: new Date().toLocaleTimeString('fa-IR'),
  });
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcAmount, setCalcAmount] = useState('10');
  const [calcCurrency, setCalcCurrency] = useState<'usd' | 'toman'>('usd');

  // Customer Profile State (with Telegram WebApp sync)
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(() => {
    // Try to auto-read from Telegram WebApp SDK if loaded inside Telegram
    const tgUser = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;
    return {
      id: tgUser?.id ? String(tgUser.id) : (config.adminNumericId ? '689234812' : '987654321'),
      name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'کاربر تلگرام',
      username: tgUser?.username ? `@${tgUser.username}` : '@customer',
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      bio: 'علاقه‌مند به خدمات دیجیتال و اینترنت آزاد',
      photoUrl: tgUser?.photo_url || '',
      vipTier: 'طلایی',
      walletBalanceToman: 75000,
      walletBalanceUsdt: 8.5,
      joinedDate: '۱۴۰۴/۱۰/۱۲',
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(customerProfile.name);
  const [editPhone, setEditPhone] = useState(customerProfile.phone);
  const [editBio, setEditBio] = useState(customerProfile.bio);
  const [profileSubTab, setProfileSubTab] = useState<'orders' | 'info' | 'wallet'>('orders');

  // Fetch Live Rates
  const refreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      const res = await fetch('/api/rates/usd');
      if (res.ok) {
        const data = await res.json();
        setLiveRates({
          ...data,
          lastUpdate: new Date().toLocaleTimeString('fa-IR'),
        });
        showToast('نرخ لحظه‌ای ارز با موفقیت به‌روزرسانی شد');
      }
    } catch (_) {
      // simulated fluctuation
      const base = 94850 + Math.floor(Math.sin(Date.now() / 30000) * 150);
      setLiveRates((prev) => ({
        ...prev,
        usdPrice: base,
        usdtPrice: base + 350,
        lastUpdate: new Date().toLocaleTimeString('fa-IR'),
      }));
    } finally {
      setTimeout(() => setIsRefreshingRates(false), 600);
    }
  };

  React.useEffect(() => {
    refreshRates();
    const interval = setInterval(refreshRates, 120000);
    return () => clearInterval(interval);
  }, []);

  // Save Customer Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...customerProfile,
      name: editName.trim() || customerProfile.name,
      phone: editPhone.trim() || customerProfile.phone,
      bio: editBio.trim() || customerProfile.bio,
    };
    setCustomerProfile(updated);
    setIsEditingProfile(false);
    showToast('مشخصات پروفایل با موفقیت ذخیره شد');

    try {
      await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (_) {}
  };

  // Checkout Form State
  const [custName, setCustName] = useState('');
  const [custTelegram, setCustTelegram] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'stars'>('card');
  const [productFormData, setProductFormData] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);

  // Support Ticket Form State
  const [supportName, setSupportName] = useState('');
  const [supportUsername, setSupportUsername] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  const copyCardNumber = () => {
    navigator.clipboard.writeText(config.cardNumber.replace(/[^0-9]/g, ''));
    setCopiedCard(true);
    showToast('شماره کارت کپی شد');
    setTimeout(() => setCopiedCard(false), 2500);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.active === false) return false;
      if (activeCategory && p.cat !== activeCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q)
      );
    });
  }, [products, activeCategory, searchQuery]);

  // Open Product
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start Checkout
  const handleStartCheckout = (plan: Plan) => {
    if (!selectedProduct) return;
    if (plan.stock <= 0 || plan.active === false) {
      showToast('این پلن در حال حاضر موجود نیست');
      return;
    }
    setSelectedPlan(plan);
    setProductFormData({});
    setReceiptFile('');
    setReceiptFileName('');
    setOrderNotes('');
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Receipt Upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری انتخاب کنید');
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setReceiptFile(ev.target.result as string);
        showToast('رسید با موفقیت انتخاب شد');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPlan) return;

    if (!custName.trim() || !custTelegram.trim() || !custPhone.trim()) {
      showToast('لطفاً نام، آیدی تلگرام و شماره تماس را وارد کنید');
      return;
    }

    if (paymentMethod === 'card' && !receiptFile) {
      showToast('لطفاً تصویر رسید پرداخت را آپلود کنید');
      return;
    }

    // Required field validation for product-specific forms
    const requiredFields = getProductFormFields(selectedProduct).filter((f) => f.required);
    for (const f of requiredFields) {
      if (!productFormData[f.label] || !productFormData[f.label].trim()) {
        showToast(`فیلد «${f.label}» الزامی است`);
        return;
      }
    }

    const orderId = `#MT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      product: selectedProduct.name,
      productId: selectedProduct.id,
      plan: selectedPlan.name,
      planId: selectedPlan.id,
      amount: selectedPlan.price,
      status: 'در انتظار بررسی',
      paymentMethod,
      customer: {
        name: custName.trim(),
        username: custTelegram.trim().replace(/^@/, ''),
        phone: custPhone.trim(),
      },
      receipt: receiptFile || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      receiptName: receiptFileName || 'receipt.jpg',
      formData: productFormData,
      accountName: productFormData['نام اکانت VPN'] || '',
      accountInfo: Object.entries(productFormData)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
      description: orderNotes.trim(),
      message: '',
      delivery: '',
      createdAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    onCreateOrder(newOrder);
    setLastCreatedOrder(newOrder);
    setView('success');
    showToast('سفارش شما با موفقیت ثبت شد');
  };

  // Support Ticket Submit
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportUsername.trim() || !supportSubject.trim() || !supportMessage.trim()) {
      showToast('لطفاً تمام فیلدهای تیکت را کامل کنید');
      return;
    }

    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      customerName: supportName.trim(),
      telegramUsername: supportUsername.trim().replace(/^@/, ''),
      subject: supportSubject.trim(),
      status: 'در انتظار پاسخ',
      createdAt: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'customer',
          senderName: supportName.trim(),
          text: supportMessage.trim(),
          createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    onCreateTicket(newTicket);
    setSupportSubject('');
    setSupportMessage('');
    showToast('تیکت شما با موفقیت ثبت شد');
  };

  // Generate form fields for current product based on category & customFields
  const getProductFormFields = (p: Product): FormField[] => {
    const fields: FormField[] = [];
    if (p.formType === 'vpn' || p.cat === 'vpn') {
      fields.push({
        id: 'vpnAccountName',
        label: 'نام اکانت VPN',
        type: 'text',
        required: true,
        placeholder: 'نام دلخواه شما برای کانفیگ VPN',
      });
    } else if (p.formType === 'ai' || p.cat === 'ai') {
      fields.push(
        {
          id: 'loginMethod',
          label: 'روش ورود اکانت',
          type: 'select',
          required: true,
          options: ['Google / Gmail', 'ایمیل اختصاصی اکانت', 'Apple ID', 'سایر روش‌ها'],
        },
        {
          id: 'accountEmail',
          label: 'ایمیل اکانت',
          type: 'email',
          required: true,
          placeholder: 'name@example.com',
        },
        {
          id: 'accountPassword',
          label: 'رمز عبور اکانت',
          type: 'password',
          required: true,
          placeholder: 'رمز عبور اکانت جهت فعال‌سازی پلن',
        },
        {
          id: 'accountUsername',
          label: 'نام کاربری / شناسه (در صورت وجود)',
          type: 'text',
          required: false,
          placeholder: 'اختیاری',
        }
      );
    } else if (p.formType === 'game' || p.cat === 'game' || p.cat === 'battle') {
      fields.push(
        {
          id: 'playerId',
          label: 'شناسه بازیکن / UID داخل بازی',
          type: 'text',
          required: true,
          placeholder: 'شناسه عددی اکانت در بازی',
        },
        {
          id: 'loginPlatform',
          label: 'پلتفرم ورود به اکانت',
          type: 'select',
          required: true,
          options: ['Activision', 'Google Play', 'Apple Game Center', 'Facebook', 'Xbox / PSN'],
        }
      );
    }

    // Custom fields from product editor
    if (p.customFields && Array.isArray(p.customFields)) {
      p.customFields.forEach((cf) => fields.push(cf));
    }

    return fields;
  };

  // Dismiss announcement state
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  return (
    <div className="max-w-[1100px] mx-auto p-3 sm:p-5 text-[#101828]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#171936] text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-sm font-bold animate-bounce flex items-center gap-2 border border-[#3f438a]">
          <Sparkles className="w-4 h-4 text-[#7c5cff]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Customer Announcement Banner */}
      {config.announcementActive && config.announcementBanner && !announcementDismissed && (
        <div className="mb-4 bg-gradient-to-r from-[#5b5ce2] to-[#7c5cff] text-white px-4 py-2.5 rounded-2xl shadow-sm flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animate-fade-in border border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-base">📢</span>
            <span>{config.announcementBanner}</span>
          </div>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="text-white/80 hover:text-white px-2 py-0.5 rounded-lg text-xs"
            title="بستن اطلاعیه"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAINTENANCE MODE SCREEN */}
      {config.maintenanceMode && view === 'home' && (
        <div className="animate-fade-in my-6">
          <header className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#5b5ce2] to-[#7c5cff] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#5b5ce233]">
                م
              </div>
              <div>
                <h1 className="text-lg font-black text-[#101828] m-0">{config.storeName}</h1>
                <p className="text-xs text-[#667085] m-0 mt-0.5">{config.storeSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('orders')}
                className="w-11 h-11 rounded-[14px] bg-white border border-[#e4e7ec] flex items-center justify-center text-lg hover:bg-[#f5f6ff] transition shadow-sm"
                title="سفارش‌های من"
              >
                🧾
              </button>
              <button
                onClick={() => setView('support')}
                className="w-11 h-11 rounded-[14px] bg-white border border-[#e4e7ec] flex items-center justify-center text-lg hover:bg-[#f5f6ff] transition shadow-sm"
                title="پشتیبانی"
              >
                🎧
              </button>
              <button
                onClick={onOpenAdmin}
                className="w-11 h-11 rounded-[14px] bg-white border border-[#e4e7ec] flex items-center justify-center text-lg hover:bg-[#f5f6ff] transition shadow-sm"
                title="ورود به مدیریت"
              >
                ⚙️
              </button>
            </div>
          </header>

          <div className="bg-white border-2 border-dashed border-[#cfd3ff] rounded-[28px] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-md">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-4xl mx-auto mb-4 border border-amber-200 shadow-sm animate-pulse">
              🚧
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full mb-3 inline-block">
              فروشگاه موقتاً بسته است
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#101828] mb-3">
              {config.maintenanceTitle || 'فروشگاه در حال به‌روزرسانی است'}
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-6 max-w-lg mx-auto">
              {config.maintenanceMessage ||
                'کاربر گرامی، جهت ارتقا و به‌روزرسانی سرور، فروشگاه موقتاً غیرفعال شده است. به زودی در دسترس شما خواهیم بود.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => setView('orders')}
                className="py-3 px-5 bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] font-bold rounded-xl text-xs sm:text-sm transition"
              >
                🧾 پیگیری سفارش‌های قبلی
              </button>
              <button
                onClick={() => setView('support')}
                className="py-3 px-5 bg-[#5b5ce2] hover:bg-[#4849cb] text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm"
              >
                🎧 ارتباط با پشتیبانی
              </button>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 text-[11px] text-gray-400">
              مدیر فروشگاه هستید؟ با کلید میانبر <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-gray-600">Alt + A</kbd> وارد پنل مدیریت شوید.
            </div>
          </div>
        </div>
      )}

      {/* VIEW: HOME */}
      {view === 'home' && !config.maintenanceMode && (
        <div className="animate-fade-in">
          {/* Topbar matching store_v18.html */}
          <header className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#5b5ce2] to-[#7c5cff] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#5b5ce233]">
                م
              </div>
              <div>
                <h1 className="text-lg font-black text-[#101828] m-0">{config.storeName}</h1>
                <p className="text-xs text-[#667085] m-0 mt-0.5">{config.storeSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('profile')}
                className="h-11 px-3 rounded-[14px] bg-white border border-[#e4e7ec] flex items-center gap-2 hover:bg-[#f5f6ff] transition shadow-sm"
                title="پروفایل کاربری"
              >
                {customerProfile.photoUrl ? (
                  <img src={customerProfile.photoUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#eef0ff] text-[#5b5ce2] flex items-center justify-center text-xs font-bold">
                    👤
                  </span>
                )}
                <span className="text-xs font-extrabold text-[#344054] hidden sm:inline">{customerProfile.name}</span>
              </button>
              <button
                onClick={() => setView('support')}
                className="w-11 h-11 rounded-[14px] bg-white border border-[#e4e7ec] flex items-center justify-center text-lg hover:bg-[#f5f6ff] transition shadow-sm"
                title="پشتیبانی"
              >
                🎧
              </button>
              <button
                onClick={onOpenAdmin}
                className="w-11 h-11 rounded-[14px] bg-white border border-[#e4e7ec] flex items-center justify-center text-lg hover:bg-[#f5f6ff] transition shadow-sm"
                title="ورود به مدیریت"
              >
                ⚙️
              </button>
            </div>
          </header>

          {/* LIVE DOLLAR & TETHER RATES TICKER */}
          <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-[#334155] rounded-[22px] p-3.5 sm:p-4 mb-5 text-white shadow-lg relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>نرخ زنده ارز و تتر:</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-[#ffffff10] px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-emerald-400 font-bold">💵 دلار آزاد:</span>
                  <b className="text-sm font-black text-white">{liveRates.usdPrice.toLocaleString('fa-IR')}</b>
                  <span className="text-[10px] text-gray-300">تومان</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#ffffff10] px-3 py-1.5 rounded-xl border border-white/10 hidden sm:flex">
                  <span className="text-cyan-400 font-bold">🪙 تتر (USDT):</span>
                  <b className="text-sm font-black text-white">{liveRates.usdtPrice.toLocaleString('fa-IR')}</b>
                  <span className="text-[10px] text-gray-300">تومان</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
                  title="ماشین‌حساب تبدیل ارز"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">محاسبه‌گر</span>
                </button>
                <button
                  onClick={refreshRates}
                  disabled={isRefreshingRates}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition"
                  title="به‌روزرسانی قیمت"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Currency Converter Dropdown */}
            {showCalculator && (
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center text-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">مبلغ:</span>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-24 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-white text-center font-bold"
                  />
                  <select
                    value={calcCurrency}
                    onChange={(e: any) => setCalcCurrency(e.target.value)}
                    className="bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-white"
                  >
                    <option value="usd">دلار ($)</option>
                    <option value="toman">تومان</option>
                  </select>
                </div>
                <div className="sm:col-span-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-2 text-center text-emerald-300 font-bold">
                  {calcCurrency === 'usd'
                    ? `${(parseFloat(calcAmount || '0') * liveRates.usdPrice).toLocaleString('fa-IR')} تومان معادل ${calcAmount} دلار`
                    : `$${(parseFloat(calcAmount || '0') / (liveRates.usdPrice || 1)).toFixed(2)} دلار معادل ${parseFloat(calcAmount || '0').toLocaleString('fa-IR')} تومان`}
                </div>
              </div>
            )}
          </div>

          {/* Hero Banner matching store_v18.html */}
          <section className="hero-gradient text-white rounded-[28px] p-6 sm:p-8 shadow-[0_12px_35px_rgba(16,24,40,0.07)] mb-6">
            <h2 className="text-2xl sm:text-3xl font-black mb-2">چی لازم داری؟</h2>
            <p className="text-xs sm:text-sm text-[#d8dbff] leading-relaxed max-w-xl">
              محصولت رو انتخاب کن، پلن مناسب رو بردار و بقیه مراحل رو خیلی ساده انجام بده.
            </p>

            <div className="relative mt-5">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی محصول، اشتراک یا بازی..."
                className="w-full bg-[#ffffff16] border border-[#ffffff25] rounded-[15px] py-3.5 px-4 pr-11 text-white placeholder-[#cdd0ee] text-sm outline-none focus:border-white transition"
              />
              <Search className="w-5 h-5 text-[#cdd0ee] absolute right-3.5 top-3.5" />
            </div>
          </section>

          {/* Categories Grid */}
          <div className="flex items-center justify-between my-5">
            <h3 className="text-base sm:text-lg font-bold text-[#101828]">دسته‌بندی‌ها</h3>
            {activeCategory ? (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs text-[#5b5ce2] font-bold hover:underline"
              >
                نمایش همه محصولات
              </button>
            ) : (
              <span className="text-xs text-[#667085]">همه محصولات</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            {categories.map((c) => {
              const isSelected = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(isSelected ? null : c.id)}
                  className={`bg-white border rounded-[22px] p-4 text-right flex flex-col justify-between min-h-[125px] transition-all shadow-[0_12px_35px_rgba(16,24,40,0.05)] hover:-translate-y-0.5 ${
                    isSelected ? 'border-[#5b5ce2] ring-2 ring-[#5b5ce2]/20 bg-[#f8f9ff]' : 'border-[#e4e7ec]'
                  }`}
                >
                  <span className="text-3xl mb-2">{c.icon}</span>
                  <div>
                    <b className="block text-sm sm:text-base font-extrabold text-[#101828] mb-0.5">{c.name}</b>
                    <small className="text-xs text-[#667085]">
                      {products.filter((p) => p.cat === c.id && p.active !== false).length} محصول
                    </small>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Popular Products Title */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-[#101828]">
              {activeCategory ? `محصولات دسته «${categories.find((c) => c.id === activeCategory)?.name}»` : 'محبوب‌ترین‌ها'}
            </h3>
            <span className="text-xs text-[#667085]">{filteredProducts.length} محصول موجود</span>
          </div>

          {/* Products Grid matching store_v18.html */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-8 text-center text-[#667085]">
              محصولی با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const activePlans = p.plans.filter((x) => x.active !== false);
                const minPrice = activePlans.length ? Math.min(...activePlans.map((x) => x.price)) : 0;

                return (
                  <article
                    key={p.id}
                    className="bg-white border border-[#e4e7ec] rounded-[22px] p-4 sm:p-5 shadow-[0_12px_35px_rgba(16,24,40,0.06)] flex flex-col justify-between hover:shadow-lg transition"
                  >
                    <div>
                      {/* Product Image */}
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-44 object-cover rounded-[18px] bg-[#f0f1ff] mb-3.5"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-44 rounded-[18px] bg-gradient-to-br from-[#eef0ff] to-[#f7f7ff] flex items-center justify-center text-4xl mb-3.5">
                          {p.icon}
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-[15px] bg-[#eef0ff] flex items-center justify-center text-2xl flex-none overflow-hidden">
                          {p.icon}
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-[#101828] mb-0.5">{p.name}</h4>
                          <small className="text-xs text-[#667085] line-clamp-1">{p.desc}</small>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#f2f4f7]">
                      <div className="text-lg font-black text-[#101828] flex items-baseline justify-between">
                        <span>{activePlans.length > 0 ? formatMoney(minPrice) : 'بدون پلن'}</span>
                        <span className="text-xs font-normal text-[#667085]">
                          {activePlans.length > 0 ? 'شروع قیمت' : 'ناموجود'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenProduct(p)}
                        className="w-full py-3 px-4 rounded-[14px] mt-3 bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] font-bold text-sm transition"
                      >
                        مشاهده پلن‌ها ({activePlans.length})
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PRODUCT DETAILS & PLAN SELECTOR */}
      {view === 'product' && selectedProduct && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-white to-[#f5f6ff] text-[#4547c7] border border-[#dfe3ff] rounded-[14px] py-2.5 px-4 mb-4 text-xs sm:text-sm font-extrabold shadow-sm hover:bg-[#eef0ff] transition"
          >
            <span>← بازگشت به فروشگاه</span>
          </button>

          <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-5 sm:p-7 shadow-[0_12px_35px_rgba(16,24,40,0.07)]">
            {selectedProduct.image && (
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-56 object-cover rounded-[18px] bg-[#f0f1ff] mb-4"
              />
            )}

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-14 h-14 rounded-[16px] bg-[#eef0ff] flex items-center justify-center text-3xl">
                {selectedProduct.icon}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#101828] mb-1">{selectedProduct.name}</h2>
                <small className="text-xs sm:text-sm text-[#667085] leading-relaxed block">{selectedProduct.desc}</small>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#f2f4f7] pt-5 mt-4 mb-3">
              <h3 className="text-base font-extrabold text-[#101828]">پلن موردنظر را انتخاب کنید</h3>
              <span className="text-xs text-[#667085]">
                {selectedProduct.plans.filter((p) => p.active !== false).length} پلن فعال
              </span>
            </div>

            <div className="grid gap-2.5">
              {selectedProduct.plans
                .filter((p) => p.active !== false)
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-[#e4e7ec] p-4 rounded-[16px] hover:border-[#5b5ce2] transition bg-white"
                  >
                    <div>
                      <b className="text-sm sm:text-base font-bold text-[#101828] block">{plan.name}</b>
                      <small className="text-xs text-[#667085]">
                        {formatMoney(plan.price)} • موجودی: {plan.stock} {plan.unit}
                      </small>
                    </div>

                    <button
                      onClick={() => handleStartCheckout(plan)}
                      disabled={plan.stock <= 0}
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-[12px] text-xs sm:text-sm font-bold transition ${
                        plan.stock > 0
                          ? 'bg-[#5b5ce2] hover:bg-[#4849cb] text-white shadow-md'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {plan.stock > 0 ? 'انتخاب و خرید' : 'ناموجود'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CHECKOUT */}
      {view === 'checkout' && selectedProduct && selectedPlan && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <button
            onClick={() => setView('product')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-white to-[#f5f6ff] text-[#4547c7] border border-[#dfe3ff] rounded-[14px] py-2.5 px-4 mb-4 text-xs sm:text-sm font-extrabold shadow-sm hover:bg-[#eef0ff] transition"
          >
            <span>← بازگشت به انتخاب پلن</span>
          </button>

          <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-5 sm:p-7 shadow-[0_12px_35px_rgba(16,24,40,0.07)]">
            <h2 className="text-xl sm:text-2xl font-black text-[#101828] mt-0 mb-4">تکمیل سفارش</h2>

            {/* Stepper */}
            <div className="flex gap-2 mb-6">
              <span className="h-1.5 flex-1 rounded-full bg-[#5b5ce2]"></span>
              <span className="h-1.5 flex-1 rounded-full bg-[#5b5ce2]"></span>
              <span className="h-1.5 flex-1 rounded-full bg-[#5b5ce2]"></span>
            </div>

            {/* Order Summary */}
            <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-[17px] p-4 mb-6 grid gap-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-[#667085]">محصول</span>
                <b>{selectedProduct.name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">پلن انتخابی</span>
                <b>{selectedPlan.name}</b>
              </div>
              <div className="flex justify-between font-black text-sm sm:text-base border-t border-[#e4e7ec] pt-2.5 text-[#101828]">
                <span>مبلغ قابل پرداخت</span>
                <span className="text-[#5b5ce2]">{formatMoney(selectedPlan.price)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder}>
              {/* Payment Method Selector */}
              <h3 className="text-sm sm:text-base font-extrabold text-[#101828] mb-2.5">
                ۱. انتخاب روش پرداخت
              </h3>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-[14px] border text-center font-bold text-xs sm:text-sm transition ${
                    paymentMethod === 'card'
                      ? 'border-[#5b5ce2] bg-[#f0f1ff] text-[#5b5ce2]'
                      : 'border-[#e4e7ec] text-[#667085]'
                  }`}
                >
                  💳 کارت‌به‌کارت
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stars')}
                  className={`p-3 rounded-[14px] border text-center font-bold text-xs sm:text-sm transition ${
                    paymentMethod === 'stars'
                      ? 'border-[#5b5ce2] bg-[#f0f1ff] text-[#5b5ce2]'
                      : 'border-[#e4e7ec] text-[#667085]'
                  }`}
                >
                  ⭐️ Telegram Stars
                </button>
              </div>

              {/* Card-to-Card details */}
              {paymentMethod === 'card' ? (
                <div className="border-2 border-dashed border-[#cfd3ff] rounded-[18px] p-5 text-center bg-[#f8f8ff] mb-6">
                  <span className="text-xs text-[#667085] block mb-1">شماره کارت جهت واریز</span>
                  <strong className="text-base sm:text-lg tracking-wider text-[#101828] font-black block my-1">
                    {config.cardNumber}
                  </strong>
                  <small className="text-xs text-[#667085] block mb-3">به نام {config.cardOwner}</small>

                  <button
                    type="button"
                    onClick={copyCardNumber}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#cfd3ff] rounded-xl text-xs font-bold text-[#5b5ce2] hover:bg-[#eef0ff] transition"
                  >
                    {copiedCard ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCard ? 'کپی شد' : 'کپی شماره کارت'}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-[#fff9e6] border border-[#ffe082] rounded-[18px] p-4 text-xs leading-relaxed text-[#8d6e00] mb-6">
                  ⭐️ پرداخت مستقیم تلگرام استارز (XTR). پس از تأیید در بات تلگرام، سفارش شما بدون نیاز به بررسی دستی فعال خواهد شد.
                </div>
              )}

              {/* Customer Information */}
              <h3 className="text-sm sm:text-base font-extrabold text-[#101828] mb-3">
                ۲. اطلاعات مشتری
              </h3>
              <div className="grid gap-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">نام و نام خانوادگی *</label>
                  <input
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    required
                    placeholder="مثلاً نیما امیری"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">آیدی تلگرام *</label>
                  <input
                    value={custTelegram}
                    onChange={(e) => setCustTelegram(e.target.value)}
                    required
                    placeholder="@username"
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">شماره تماس *</label>
                  <input
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    required
                    type="tel"
                    placeholder="09123456789"
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left"
                  />
                </div>
              </div>

              {/* Dynamic Product Fields */}
              <h3 className="text-sm sm:text-base font-extrabold text-[#101828] mb-3">
                ۳. اطلاعات اختصاصی {selectedProduct.name}
              </h3>
              <div className="grid gap-3 mb-6">
                {getProductFormFields(selectedProduct).map((f) => (
                  <div key={f.id}>
                    <label className="block text-xs font-bold text-[#344054] mb-1.5">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>

                    {f.type === 'select' ? (
                      <select
                        value={productFormData[f.label] || ''}
                        onChange={(e) =>
                          setProductFormData({ ...productFormData, [f.label]: e.target.value })
                        }
                        required={f.required}
                        className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm bg-white outline-none focus:border-[#5b5ce2]"
                      >
                        <option value="">انتخاب کنید</option>
                        {f.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type || 'text'}
                        value={productFormData[f.label] || ''}
                        onChange={(e) =>
                          setProductFormData({ ...productFormData, [f.label]: e.target.value })
                        }
                        required={f.required}
                        placeholder={f.placeholder}
                        className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                      />
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1.5">توضیحات تکمیلی (اختیاری)</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="اگر نکته‌ای هست که ادمین باید بداند بنویسید..."
                    rows={2}
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              {paymentMethod === 'card' && (
                <div className="mb-6">
                  <h3 className="text-sm sm:text-base font-extrabold text-[#101828] mb-2.5">
                    ۴. تصویر رسید پرداخت *
                  </h3>
                  <div className="border border-[#e4e7ec] rounded-[16px] p-4 bg-[#fafbfc]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      required={!receiptFile}
                      className="text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#5b5ce2] file:text-white hover:file:bg-[#4849cb] cursor-pointer"
                    />

                    {receiptFile && (
                      <div className="mt-3">
                        <span className="text-xs text-green-700 font-bold block mb-1">
                          ✓ تصویر رسید انتخاب شد ({receiptFileName})
                        </span>
                        <img
                          src={receiptFile}
                          alt="پیش‌نمایش رسید"
                          className="max-h-48 rounded-xl object-contain border border-[#e4e7ec]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-[14px] bg-[#12b76a] hover:bg-[#0fa05b] text-white font-extrabold text-sm sm:text-base transition shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ثبت نهایی سفارش و ارسال برای ادمین</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: ORDER SUCCESS */}
      {view === 'success' && lastCreatedOrder && (
        <div className="animate-fade-in max-w-xl mx-auto bg-white border border-[#e4e7ec] rounded-[22px] p-8 text-center shadow-[0_12px_35px_rgba(16,24,40,0.07)]">
          <div className="w-16 h-16 bg-[#ecfdf3] text-[#12b76a] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
            ✓
          </div>
          <h2 className="text-2xl font-black text-[#101828] mb-2">سفارش شما با موفقیت ثبت شد</h2>
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-4">
            رسید و اطلاعات سفارش به دست ادمین رسید. به محض تایید و آماده‌سازی، اطلاعات تحویل در بخش پیگیری سفارش قرار می‌گیرد.
          </p>

          <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-xl p-3.5 mb-6 text-sm">
            <span className="text-[#667085] block text-xs mb-1">شناسه سفارش شما:</span>
            <strong className="text-lg text-[#5b5ce2] font-black">{lastCreatedOrder.id}</strong>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setView('orders')}
              className="flex-1 py-3 px-4 bg-[#5b5ce2] hover:bg-[#4849cb] text-white font-bold rounded-xl text-sm transition"
            >
              مشاهده وضعیت سفارش‌ها
            </button>
            <button
              onClick={() => setView('home')}
              className="flex-1 py-3 px-4 bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] font-bold rounded-xl text-sm transition"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        </div>
      )}

      {/* VIEW: CUSTOMER PROFILE & ORDERS */}
      {(view === 'profile' || view === 'orders') && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-white to-[#f5f6ff] text-[#4547c7] border border-[#dfe3ff] rounded-[14px] py-2.5 px-4 mb-4 text-xs sm:text-sm font-extrabold shadow-sm hover:bg-[#eef0ff] transition"
          >
            <span>← بازگشت به فروشگاه</span>
          </button>

          {/* Customer Profile Header Card */}
          <div className="bg-white border border-[#e4e7ec] rounded-[24px] p-5 sm:p-7 shadow-[0_12px_35px_rgba(16,24,40,0.06)] mb-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 border-b border-[#f2f4f7]">
              {/* Avatar */}
              <div className="relative">
                {customerProfile.photoUrl ? (
                  <img
                    src={customerProfile.photoUrl}
                    alt={customerProfile.name}
                    className="w-20 h-20 rounded-[22px] object-cover border-2 border-[#5b5ce2] shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-[#5b5ce2] to-[#7c5cff] text-white flex items-center justify-center text-3xl font-black shadow-md shadow-[#5b5ce233]">
                    {customerProfile.name ? customerProfile.name.slice(0, 1) : '👤'}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                  آنلاین
                </span>
              </div>

              {/* Info */}
              <div className="text-center sm:text-right flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-black text-[#101828] m-0">{customerProfile.name}</h2>
                  <span className="bg-[#f0f1ff] text-[#5b5ce2] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#cfd3ff]">
                    {customerProfile.vipTier}
                  </span>
                </div>

                <div className="text-xs text-[#667085] flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <span className="font-mono text-[#5b5ce2] font-bold">{customerProfile.username}</span>
                  <span>•</span>
                  <span>عضویت: {customerProfile.joinedDate}</span>
                </div>

                {/* Numeric Telegram ID pill with copy button */}
                <div className="inline-flex items-center gap-2 bg-[#f8f9fc] border border-[#e4e7ec] rounded-xl px-3 py-1 text-xs">
                  <span className="text-[#667085]">شناسه عددی تلگرام:</span>
                  <span className="font-mono font-bold text-[#101828]">{customerProfile.id}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(customerProfile.id);
                      setCopiedId(true);
                      showToast('شناسه عددی تلگرام کپی شد');
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="text-[#5b5ce2] hover:text-[#4344b5] transition ml-1"
                    title="کپی شناسه عددی"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Edit Profile Toggle Button */}
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3.5 py-2 rounded-xl border border-[#e4e7ec] text-xs font-bold text-[#344054] hover:bg-[#f8f9fc] transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#5b5ce2]" />
                <span>{isEditingProfile ? 'انصراف' : 'ویرایش مشخصات'}</span>
              </button>
            </div>

            {/* Quick Wallet & Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
              <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-2xl p-3 text-center sm:text-right">
                <span className="text-[11px] text-[#667085] block mb-0.5">موجودی کیف پول</span>
                <b className="text-sm font-black text-[#5b5ce2] block">{formatMoney(customerProfile.walletBalanceToman)}</b>
              </div>
              <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-2xl p-3 text-center sm:text-right">
                <span className="text-[11px] text-[#667085] block mb-0.5">اعتبار دلاری (USDT)</span>
                <b className="text-sm font-black text-cyan-600 block">{customerProfile.walletBalanceUsdt} USDT</b>
              </div>
              <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-2xl p-3 text-center sm:text-right col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[#667085] block mb-0.5">تعداد سفارش‌ها</span>
                <b className="text-sm font-black text-[#101828] block">{orders.length} سفارش ثبت شده</b>
              </div>
            </div>

            {/* Edit Profile Form Popup/Section */}
            {isEditingProfile && (
              <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-[#f2f4f7] grid gap-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#344054] mb-1">نام کامل</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="نام و نام خانوادگی"
                      className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#344054] mb-1">شماره تماس (جهت اطلاع‌رسانی سفارش)</label>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                      className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1">بیوگرافی / یادداشت شخصی</label>
                  <input
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="یک متن کوتاه درباره خودتان..."
                    className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#5b5ce2] text-white text-xs font-bold hover:bg-[#4849cb] transition"
                  >
                    ذخیره تغییرات
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Subtabs inside Profile */}
          <div className="flex gap-2 mb-4 bg-white p-1.5 rounded-[18px] border border-[#e4e7ec] shadow-sm">
            <button
              onClick={() => setProfileSubTab('orders')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                profileSubTab === 'orders'
                  ? 'bg-[#5b5ce2] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سفارش‌های من ({orders.length})</span>
            </button>
            <button
              onClick={() => setProfileSubTab('info')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                profileSubTab === 'info'
                  ? 'bg-[#5b5ce2] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>اطلاعات کاربری</span>
            </button>
            <button
              onClick={() => setProfileSubTab('wallet')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                profileSubTab === 'wallet'
                  ? 'bg-[#5b5ce2] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>کیف پول</span>
            </button>
          </div>

          {/* SUBTAB 1: ORDERS LIST */}
          {profileSubTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-8 text-center text-[#667085]">
                  <p className="mb-3">هنوز سفارشی برای این حساب ثبت نشده است.</p>
                  <button
                    onClick={() => setView('home')}
                    className="px-5 py-2.5 rounded-xl bg-[#5b5ce2] text-white text-xs font-bold hover:bg-[#4849cb] transition"
                  >
                    شروع خرید از فروشگاه
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {orders.map((o) => {
                    const isCompleted = o.status === 'تکمیل شده';
                    const isProcessing = o.status === 'در حال انجام' || o.status === 'دریافت شد';

                    return (
                      <div
                        key={o.id}
                        className="bg-white border border-[#e4e7ec] rounded-[22px] p-4 sm:p-5 shadow-sm hover:border-[#cfd3ff] transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <b className="text-sm sm:text-base font-extrabold text-[#101828]">{o.product}</b>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              isCompleted
                                ? 'bg-[#ecfdf3] text-[#067647]'
                                : isProcessing
                                ? 'bg-[#e0f2fe] text-[#0369a1]'
                                : 'bg-[#fffaeb] text-[#b54708]'
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>

                        <div className="text-xs text-[#667085] flex flex-wrap gap-x-4 gap-y-1 mb-2">
                          <span>کد پیگیری: <b className="text-[#101828]">{o.id}</b></span>
                          <span>پلن: {o.plan}</span>
                          <span>تاریخ: {o.createdAt}</span>
                        </div>

                        <div className="text-sm font-black text-[#5b5ce2] mb-3">
                          {formatMoney(o.amount)}
                        </div>

                        {/* Delivery Payload box with Copy */}
                        {o.delivery && (
                          <div className="mt-2 p-3.5 bg-[#ecfdf3] border border-[#a6f4c5] rounded-xl text-xs sm:text-sm">
                            <div className="flex items-center justify-between mb-1.5">
                              <strong className="text-[#027a48] font-bold">
                                ✓ اطلاعات تحویل داده شده (کانفیگ / اکانت):
                              </strong>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(o.delivery || '');
                                  showToast('اطلاعات تحویل در حافظه کپی شد');
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#027a48] bg-white px-2 py-0.5 rounded-md border border-[#a6f4c5] hover:bg-[#ecfdf3]"
                              >
                                <Copy className="w-3 h-3" />
                                <span>کپی</span>
                              </button>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-[#a6f4c5] font-mono text-left text-xs break-all text-[#101828]">
                              {o.delivery}
                            </div>
                          </div>
                        )}

                        {o.message && (
                          <div className="mt-2 p-3 bg-[#f8f9fc] border border-[#e4e7ec] rounded-xl text-xs text-[#344054]">
                            <b>پیام مدیریت:</b> {o.message}
                          </div>
                        )}

                        {o.receipt && (
                          <div className="mt-2 text-left">
                            <span className="text-[11px] text-[#667085]">رسید پرداخت آپلود شده: </span>
                            <a
                              href={o.receipt}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#5b5ce2] font-bold hover:underline"
                            >
                              مشاهده رسید
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 2: ACCOUNT INFO */}
          {profileSubTab === 'info' && (
            <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-5 shadow-sm space-y-3.5 text-xs sm:text-sm">
              <h3 className="text-base font-bold text-[#101828] mb-3">مشخصات هویتی و امنیتی</h3>

              <div className="flex justify-between py-2 border-b border-[#f2f4f7]">
                <span className="text-[#667085]">نام و نام خانوادگی:</span>
                <b className="text-[#101828]">{customerProfile.name}</b>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f2f4f7]">
                <span className="text-[#667085]">آیدی تلگرام:</span>
                <b className="text-[#5b5ce2] font-mono">{customerProfile.username}</b>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f2f4f7]">
                <span className="text-[#667085]">شناسه عددی (Numeric ID):</span>
                <b className="text-[#101828] font-mono">{customerProfile.id}</b>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f2f4f7]">
                <span className="text-[#667085]">شماره تماس تایید شده:</span>
                <b className="text-[#101828]">{customerProfile.phone || 'ثبت نشده (جهت ثبت دکمه ویرایش را بزنید)'}</b>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f2f4f7]">
                <span className="text-[#667085]">سطح وفاداری مشتری:</span>
                <b className="text-[#5b5ce2]">{customerProfile.vipTier}</b>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-[#667085]">بیوگرافی / یادداشت:</span>
                <span className="text-[#344054] max-w-xs text-left">{customerProfile.bio}</span>
              </div>
            </div>
          )}

          {/* SUBTAB 3: WALLET & FINANCE */}
          {profileSubTab === 'wallet' && (
            <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-5 shadow-sm space-y-4">
              <div className="bg-gradient-to-br from-[#5b5ce2] to-[#7c5cff] text-white p-5 rounded-[20px] shadow-md">
                <span className="text-xs text-[#d8dbff] block mb-1">موجودی کیف پول شما:</span>
                <div className="text-2xl font-black mb-2">{formatMoney(customerProfile.walletBalanceToman)}</div>
                <div className="text-sm font-bold text-cyan-200">معادل تقریبی: {customerProfile.walletBalanceUsdt} USDT (تتر)</div>
              </div>

              <div className="p-4 bg-[#f8f9fc] border border-[#e4e7ec] rounded-xl text-xs leading-relaxed text-[#475467]">
                💡 جهت شارژ مستقیم کیف پول خود می‌توانید از طریق درگاه آنلاین شاپرک، کارت‌به‌کارت و یا واریز تتر (USDT-TRC20) اقدام نمایید. با موجودی کیف پول، تمام سفارش‌ها به صورت آنی و بدون وقفه تایید خواهند شد.
              </div>

              <button
                onClick={() => setView('support')}
                className="w-full py-3 rounded-xl bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>درخواست افزایش موجودی / هماهنگی با پشتیبانی</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: SUPPORT */}
      {view === 'support' && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-white to-[#f5f6ff] text-[#4547c7] border border-[#dfe3ff] rounded-[14px] py-2.5 px-4 mb-4 text-xs sm:text-sm font-extrabold shadow-sm hover:bg-[#eef0ff] transition"
          >
            <span>← بازگشت به فروشگاه</span>
          </button>

          <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-5 sm:p-7 shadow-[0_12px_35px_rgba(16,24,40,0.07)] mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#101828] mb-1">پشتیبانی و تیکت</h2>
            <p className="text-xs sm:text-sm text-[#667085] mb-5">
              سوال یا مشکلی در خرید داری؟ فرم زیر را پر کن تا کارشناسان ما در سریع‌ترین زمان پاسخ دهند.
            </p>

            <form onSubmit={handleSupportSubmit} className="grid gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1">نام شما *</label>
                  <input
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    required
                    placeholder="مثلاً علی رضایی"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#344054] mb-1">آیدی تلگرام *</label>
                  <input
                    value={supportUsername}
                    onChange={(e) => setSupportUsername(e.target.value)}
                    required
                    placeholder="@username"
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">موضوع تیکت *</label>
                <input
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  required
                  placeholder="مثلاً راهنمایی فعال‌سازی اکانت"
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1">متن پیام *</label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="مشکل یا سوال خود را کامل توضیح دهید..."
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-[14px] bg-[#5b5ce2] hover:bg-[#4849cb] text-white font-extrabold text-sm transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>ارسال تیکت به پشتیبانی</span>
              </button>
            </form>
          </div>

          {/* Ticket history */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[#101828]">تیکت‌های شما</h3>
            {tickets.map((t) => (
              <div key={t.id} className="bg-white border border-[#e4e7ec] rounded-[18px] p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-sm font-bold text-[#101828]">{t.subject}</strong>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf3] text-[#027a48]">
                    {t.status}
                  </span>
                </div>
                <div className="text-xs text-[#667085] mb-3">شناسه: {t.id} • تاریخ: {t.createdAt}</div>

                <div className="space-y-2 border-t border-[#f2f4f7] pt-2.5">
                  {t.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        m.sender === 'admin'
                          ? 'bg-[#eef0ff] border border-[#c7cbff] text-[#2d3066]'
                          : 'bg-[#f8f9fc] text-[#344054]'
                      }`}
                    >
                      <div className="font-bold mb-0.5 flex justify-between">
                        <span>{m.senderName}:</span>
                        <span className="text-[10px] text-gray-500 font-normal">{m.createdAt}</span>
                      </div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
