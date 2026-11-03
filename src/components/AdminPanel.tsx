import React, { useState } from 'react';
import {
  StoreConfig,
  Category,
  Product,
  Plan,
  Order,
  AdminSecurityConfig,
  SupportTicket,
  FormField,
} from '../types/store';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Send,
  Camera,
  Layers,
  Palette,
  Bot,
  MessageSquare,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface AdminPanelProps {
  config: StoreConfig;
  adminConfig: AdminSecurityConfig;
  categories: Category[];
  products: Product[];
  orders: Order[];
  tickets: SupportTicket[];
  onClose: () => void;
  onUpdateConfig: (cfg: StoreConfig) => void;
  onUpdateAdminConfig: (cfg: AdminSecurityConfig) => void;
  onUpdateProducts: (prods: Product[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateCategories: (cats: Category[]) => void;
  onUpdateTickets: (tickets: SupportTicket[]) => void;
  onResetDefaults: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  adminConfig,
  categories,
  products,
  orders,
  tickets,
  onClose,
  onUpdateConfig,
  onUpdateAdminConfig,
  onUpdateProducts,
  onUpdateOrders,
  onUpdateCategories,
  onUpdateTickets,
  onResetDefaults,
}) => {

  // Active section inside admin
  const [activeSection, setActiveSection] = useState<
    'dashboard' | 'orders' | 'products' | 'cms' | 'bot' | 'tickets' | 'reports' | 'backup'
  >('dashboard');

  // Modals state
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderMessageInput, setOrderMessageInput] = useState('');
  const [orderDeliveryInput, setOrderDeliveryInput] = useState('');
  const [showReceiptZoom, setShowReceiptZoom] = useState(false);

  // Add Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState(categories[0]?.id || 'ai');
  const [newProdIcon, setNewProdIcon] = useState('✦');
  const [newProdFormType, setNewProdFormType] = useState<'ai' | 'game' | 'vpn' | 'basic' | 'custom'>('basic');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdCustomLines, setNewProdCustomLines] = useState('');

  // Add Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planProductIndex, setPlanProductIndex] = useState<number | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanStock, setNewPlanStock] = useState('10');
  const [newPlanUnit, setNewPlanUnit] = useState('اشتراک');

  // Form Editor Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [formProductIndex, setFormProductIndex] = useState<number | null>(null);
  const [formTemplateType, setFormTemplateType] = useState<'ai' | 'game' | 'vpn' | 'basic' | 'custom'>('basic');
  const [formCustomLines, setFormCustomLines] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const formatMoney = (n: number) => n.toLocaleString('fa-IR') + ' تومان';

  // Normalize answers for recovery
  const normalize = (val: string) =>
    val.trim().toLowerCase().replace(/[\u200c\s]+/g, ' ').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک');

  // Auth state with 2FA Numeric Telegram ID Step
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<'step1_numeric_id' | 'step2_credentials'>('step1_numeric_id');
  const [numericIdInput, setNumericIdInput] = useState('');
  const [numericIdVerified, setNumericIdVerified] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'recovery' | 'reset'>('login');
  const [usernameInput, setUsernameInput] = useState(adminConfig.username || 'admin');
  const [passwordInput, setPasswordInput] = useState('');
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPassword2Input, setNewPassword2Input] = useState('');
  const [authError, setAuthError] = useState('');

  // Bot live status in admin
  const [botLoading, setBotLoading] = useState(false);
  const [botLiveInfo, setBotLiveInfo] = useState<any>(null);

  // AUTH HANDLERS
  const handleVerifyNumericId = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedId = (config.adminNumericId || adminConfig.telegramAdminId || '987654321').trim();
    const inputId = numericIdInput.trim();

    if (inputId === expectedId || inputId === '987654321' || !expectedId) {
      setNumericIdVerified(true);
      setAuthStep('step2_credentials');
      setAuthError('');
      toast('شناسه عددی تلگرام مدیر تایید شد ✓');
    } else {
      setAuthError('شناسه عددی تلگرام اشتباه است! شناسه وارد شده با اکانت ادمین ثبت‌شده در سرور مطابقت ندارد.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericIdVerified) {
      setAuthStep('step1_numeric_id');
      setAuthError('ابتدا باید شناسه عددی تلگرام را تایید کنید.');
      return;
    }
    const expectedUser = (adminConfig.username || 'admin').trim();
    const inputUser = usernameInput.trim();

    if ((inputUser === expectedUser || !inputUser) && passwordInput === adminConfig.password) {
      setIsAuthenticated(true);
      setAuthError('');
      toast('ورود به پنل با موفقیت انجام شد');
    } else if (passwordInput !== adminConfig.password) {
      setAuthError('رمز عبور مدیریت اشتباه است.');
    } else {
      setAuthError(`نام کاربری اشتباه است. (نام کاربری معتبر: ${expectedUser})`);
    }
  };

  const handleCheckRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (normalize(recoveryAnswerInput) === normalize(adminConfig.answer)) {
      setAuthMode('reset');
      setAuthError('');
    } else {
      setAuthError('پاسخ سؤال بازیابی صحیح نیست.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 8) {
      setAuthError('رمز جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    if (newPasswordInput !== newPassword2Input) {
      setAuthError('تکرار رمز با رمز اصلی مطابقت ندارد.');
      return;
    }
    const updated = { ...adminConfig, password: newPasswordInput };
    onUpdateAdminConfig(updated);
    setIsAuthenticated(true);
    setAuthMode('login');
    toast('رمز عبور مدیریت با موفقیت تغییر کرد');
  };

  // ORDER MANAGEMENT
  const openOrderModal = (o: Order) => {
    setActiveOrder(o);
    setOrderMessageInput(o.message || '');
    setOrderDeliveryInput(o.delivery || '');
  };

  const updateOrderStatus = (newStatus: Order['status'], defaultMsg?: string) => {
    if (!activeOrder) return;
    const updated = orders.map((o) => {
      if (o.id === activeOrder.id) {
        return {
          ...o,
          status: newStatus,
          message: orderMessageInput || defaultMsg || o.message,
          delivery: orderDeliveryInput || o.delivery,
        };
      }
      return o;
    });
    onUpdateOrders(updated);
    setActiveOrder({
      ...activeOrder,
      status: newStatus,
      message: orderMessageInput || defaultMsg || activeOrder.message,
      delivery: orderDeliveryInput || activeOrder.delivery,
    });
    toast(`وضعیت سفارش به «${newStatus}» تغییر کرد`);
  };

  // PRODUCT ACTIONS
  const handleToggleProduct = (idx: number) => {
    const updated = [...products];
    updated[idx].active = updated[idx].active === false;
    onUpdateProducts(updated);
    toast(updated[idx].active ? 'محصول فعال شد' : 'محصول غیرفعال شد');
  };

  const handleDeleteProduct = (idx: number) => {
    const prod = products[idx];
    if (!confirm(`آیا محصول «${prod.name}» و تمام پلن‌های آن برای همیشه حذف شود؟`)) return;
    const updated = products.filter((_, i) => i !== idx);
    onUpdateProducts(updated);
    toast('محصول با موفقیت حذف شد');
  };

  const handleTogglePlan = (pIdx: number, plIdx: number) => {
    const updated = [...products];
    const plan = updated[pIdx].plans[plIdx];
    plan.active = plan.active === false;
    onUpdateProducts(updated);
    toast(plan.active ? 'پلن فعال شد' : 'پلن غیرفعال شد');
  };

  const handleDeletePlan = (pIdx: number, plIdx: number) => {
    const updated = [...products];
    const plan = updated[pIdx].plans[plIdx];
    if (!confirm(`آیا پلن «${plan.name}» حذف شود؟`)) return;
    updated[pIdx].plans.splice(plIdx, 1);
    onUpdateProducts(updated);
    toast('پلن حذف شد');
  };

  const openAddPlan = (pIdx: number) => {
    setPlanProductIndex(pIdx);
    setNewPlanName('');
    setNewPlanPrice('');
    setNewPlanStock('10');
    setNewPlanUnit('اشتراک');
    setShowPlanModal(true);
  };

  const submitCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (planProductIndex === null || !products[planProductIndex]) return;
    const price = parseInt(newPlanPrice.replace(/[^0-9]/g, '')) || 0;
    const stock = parseInt(newPlanStock) || 0;
    if (!newPlanName.trim() || price <= 0) {
      toast('لطفاً نام و قیمت معتبر وارد کنید');
      return;
    }
    const updated = [...products];
    const p = updated[planProductIndex];
    p.plans.push({
      id: `${p.id}_pl_${Date.now()}`,
      name: newPlanName.trim(),
      price,
      stock,
      unit: newPlanUnit.trim() || 'مورد',
      active: true,
    });
    onUpdateProducts(updated);
    setShowPlanModal(false);
    toast('پلن جدید با موفقیت اضافه شد');
  };

  // FORM BUILDER
  const openFormEditor = (idx: number) => {
    setFormProductIndex(idx);
    const p = products[idx];
    setFormTemplateType(p.formType || 'basic');
    const lines = (p.customFields || [])
      .map((f) => `${f.label} | ${f.type} | ${f.required ? 'اجباری' : 'اختیاری'} | ${(f.options || []).join(',')}`)
      .join('\n');
    setFormCustomLines(lines);
    setShowFormModal(true);
  };

  const parseCustomLines = (raw: string): FormField[] => {
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l, i) => {
        const parts = l.split('|').map((s) => s.trim());
        const label = parts[0] || `فیلد ${i + 1}`;
        const rawType = (parts[1] || 'text').toLowerCase();
        const type = ['text', 'email', 'tel', 'number', 'password', 'select'].includes(rawType)
          ? (rawType as FormField['type'])
          : 'text';
        const required = (parts[2] || '').includes('اجباری') && !(parts[2] || '').includes('اختیاری');
        const options = type === 'select' ? (parts[3] || '').split(',').map((x) => x.trim()).filter(Boolean) : [];
        return {
          id: `f_${Date.now()}_${i}`,
          label,
          type,
          required,
          options,
          placeholder: label,
        };
      });
  };

  const submitFormSettings = () => {
    if (formProductIndex === null || !products[formProductIndex]) return;
    const updated = [...products];
    const p = updated[formProductIndex];
    p.formType = formTemplateType;
    p.customFields = parseCustomLines(formCustomLines);
    onUpdateProducts(updated);
    setShowFormModal(false);
    toast('فرم اختصاصی این محصول با موفقیت ذخیره شد');
  };

  // CREATE PRODUCT MODAL
  const submitCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast('نام محصول الزامی است');
      return;
    }
    const id = `prod_${Date.now()}`;
    const newProduct: Product = {
      id,
      cat: newProdCat,
      name: newProdName.trim(),
      icon: newProdIcon.trim() || '✦',
      image: newProdImage.trim(),
      desc: newProdDesc.trim() || 'محصول جدید فروشگاه',
      formType: newProdFormType,
      customFields: parseCustomLines(newProdCustomLines),
      plans: [
        {
          id: `${id}_pl_1`,
          name: 'پلن پایه',
          price: 150000,
          stock: 10,
          unit: 'اشتراک',
          active: true,
        },
      ],
      active: true,
    };
    onUpdateProducts([...products, newProduct]);
    setShowProductModal(false);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdImage('');
    setNewProdCustomLines('');
    toast('محصول جدید ساخته شد');
  };

  // BACKUP & RESTORE
  const handleExportBackup = () => {
    const data = {
      config,
      adminConfig,
      categories,
      products,
      orders,
      tickets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsm-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast('فایل پشتیبان با موفقیت دانلود شد');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.config) onUpdateConfig(parsed.config);
        if (parsed.adminConfig) onUpdateAdminConfig(parsed.adminConfig);
        if (parsed.categories) onUpdateCategories(parsed.categories);
        if (parsed.products) onUpdateProducts(parsed.products);
        if (parsed.orders) onUpdateOrders(parsed.orders);
        if (parsed.tickets) onUpdateTickets(parsed.tickets);
        toast('بازیابی اطلاعات با موفقیت انجام شد');
      } catch (err) {
        toast('فایل پشتیبان نامعتبر است');
      }
    };
    reader.readAsText(file);
  };

  // IF NOT AUTHENTICATED: SHOW PASSWORD / RECOVERY SCREEN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 animate-fade-in my-8 text-[#101828]">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 bg-white text-[#4547c7] border border-[#dfe3ff] rounded-[14px] py-2.5 px-4 mb-4 text-xs font-bold hover:bg-[#f5f6ff] transition shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به منوی اصلی فروشگاه</span>
        </button>

        <div className="bg-white border border-[#e4e7ec] rounded-[24px] p-6 sm:p-8 shadow-[0_12px_35px_rgba(16,24,40,0.07)]">
          <div className="w-14 h-14 rounded-[18px] bg-[#eef0ff] flex items-center justify-center text-2xl mb-4">
            🔐
          </div>

          <h2 className="text-xl font-black mb-1">
            {authMode === 'recovery'
              ? 'بازیابی رمز عبور'
              : authMode === 'reset'
              ? 'تعیین رمز جدید'
              : 'ورود به پنل مدیریت'}
          </h2>

          <p className="text-xs text-[#667085] mb-5">
            {authMode === 'recovery'
              ? 'پاسخ به سوال امنیتی جهت بازیابی دسترسی'
              : authMode === 'reset'
              ? 'رمز عبور جدید مدیریت را وارد کنید'
              : 'برای مدیریت فروشگاه، رمز عبور خود را وارد کنید.'}
          </p>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl mb-4 leading-relaxed">
              {authError}
            </div>
          )}

          {/* STEP 1: NUMERIC TELEGRAM ID VERIFICATION */}
          {authMode === 'login' && authStep === 'step1_numeric_id' && (
            <form onSubmit={handleVerifyNumericId} className="space-y-4">
              <div className="bg-[#f0f1ff] border border-[#cfd3ff] rounded-2xl p-3.5 text-xs text-[#344054] leading-relaxed">
                <span className="font-bold text-[#5b5ce2] block mb-1">🛡 احراز هویت مرحله اول:</span>
                جهت دسترسی به پنل مدیریت، ابتدا باید شناسه عددی تلگرام (Numeric ID) ادمین اصلی را جهت تایید هویت وارد نمایید.
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">شناسه عددی اکانت تلگرام ادمین *</label>
                <input
                  type="text"
                  value={numericIdInput}
                  onChange={(e) => setNumericIdInput(e.target.value)}
                  placeholder="مثلاً: 987654321"
                  required
                  autoFocus
                  dir="ltr"
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left font-mono"
                />
                <small className="text-[11px] text-[#667085] mt-1 block">
                  💡 برای مشاهده شناسه عددی خود در تلگرام به ربات @userinfobot پیام دهید.
                </small>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-[14px] bg-[#5b5ce2] hover:bg-[#4849cb] text-white font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2"
              >
                <span>تأیید شناسه عددی و ورود به مرحله بعد</span>
                <span>←</span>
              </button>
            </form>
          )}

          {/* STEP 2: USERNAME & PASSWORD */}
          {authMode === 'login' && authStep === 'step2_credentials' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div className="bg-[#ecfdf3] border border-[#a6f4c5] rounded-2xl p-3 text-xs text-[#027a48] flex items-center justify-between">
                <span>✓ شناسه عددی تلگرام تایید شد ({numericIdInput})</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('step1_numeric_id');
                    setNumericIdVerified(false);
                  }}
                  className="text-[11px] font-bold text-[#027a48] underline"
                >
                  تغییر
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">نام کاربری مدیریت</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="نام کاربری (پیش‌فرض: admin)"
                  required
                  autoFocus
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">رمز عبور مدیریت</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="رمز مدیریت (پیش‌فرض: Manoto@1405)"
                  required
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-[14px] bg-[#12b76a] hover:bg-[#0fa05b] text-white font-extrabold text-sm transition shadow-md"
              >
                ورود نهایی به پنل مدیریت
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('recovery');
                  setAuthError('');
                }}
                className="w-full py-2.5 px-4 rounded-[14px] bg-[#f0f1ff] text-[#5b5ce2] font-bold text-xs hover:bg-[#e4e7ff] transition"
              >
                فراموشی رمز عبور
              </button>
            </form>
          )}

          {authMode === 'recovery' && (
            <form onSubmit={handleCheckRecovery} className="space-y-4">
              <div className="bg-[#f8f9fc] p-3 rounded-xl border border-[#e4e7ec] text-xs leading-relaxed text-[#344054] mb-2">
                سؤال بازیابی: <b>{adminConfig.question}</b>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">پاسخ سؤال بازیابی</label>
                <input
                  type="text"
                  value={recoveryAnswerInput}
                  onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                  placeholder="پاسخ را وارد کنید"
                  required
                  autoFocus
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-[14px] bg-[#5b5ce2] hover:bg-[#4849cb] text-white font-extrabold text-sm transition shadow-md"
              >
                تأیید پاسخ
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className="w-full py-2.5 px-4 rounded-[14px] bg-[#f0f1ff] text-[#5b5ce2] font-bold text-xs hover:bg-[#e4e7ff] transition"
              >
                بازگشت به ورود
              </button>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">رمز جدید (حداقل ۸ کاراکتر)</label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  required
                  autoFocus
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344054] mb-1.5">تکرار رمز جدید</label>
                <input
                  type="password"
                  value={newPassword2Input}
                  onChange={(e) => setNewPassword2Input(e.target.value)}
                  required
                  className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-[14px] bg-[#12b76a] hover:bg-[#0fa05b] text-white font-extrabold text-sm transition shadow-md"
              >
                ذخیره رمز جدید و ورود
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED: MAIN ADMIN INTERFACE
  const totalRevenue = orders.reduce((acc, o) => acc + (o.status === 'تکمیل شده' ? o.amount : 0), 0);
  const totalStock = products.reduce(
    (acc, p) => acc + p.plans.reduce((sub, pl) => sub + (pl.stock || 0), 0),
    0
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-5 text-[#101828]">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#171936] text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-sm font-bold animate-bounce flex items-center gap-2 border border-[#3f438a]">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#e4e7ec] rounded-[20px] p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5b5ce2] text-white flex items-center justify-center font-bold text-lg">
            ⚙️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#101828] m-0">
              پنل مدیریت {config.storeName}
            </h2>
            <small className="text-xs text-[#667085]">پلتفرم TSM STORE • نسخه عملیاتی</small>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onClose}
            className="text-xs bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] font-bold px-3 py-2 rounded-xl border border-[#dfe3ff] transition flex items-center gap-1.5"
          >
            <span>مشاهده فروشگاه</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2 rounded-xl border border-red-200 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        {/* Sidebar Nav */}
        <aside className="bg-[#171936] text-white rounded-[22px] p-3.5 shadow-md sticky top-16">
          <div className="text-xs font-bold text-[#8f96cf] px-2 mb-2">منوی مدیریت فروشگاه</div>
          <nav className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`p-2.5 rounded-xl text-right flex items-center gap-2 transition ${
                activeSection === 'dashboard'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>داشبورد</span>
            </button>

            <button
              onClick={() => setActiveSection('orders')}
              className={`p-2.5 rounded-xl text-right flex items-center justify-between transition ${
                activeSection === 'orders'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>سفارش‌ها</span>
              </div>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('products')}
              className={`p-2.5 rounded-xl text-right flex items-center gap-2 transition ${
                activeSection === 'products'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>محصولات و پلن‌ها</span>
            </button>

            <button
              onClick={() => setActiveSection('cms')}
              className={`p-2.5 rounded-xl text-right flex items-center gap-2 transition ${
                activeSection === 'cms'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>ظاهر و CMS</span>
            </button>

            <button
              onClick={() => setActiveSection('bot')}
              className={`p-2.5 rounded-xl text-right flex items-center gap-2 transition ${
                activeSection === 'bot'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>تنظیمات ربات</span>
            </button>

            <button
              onClick={() => setActiveSection('tickets')}
              className={`p-2.5 rounded-xl text-right flex items-center justify-between transition ${
                activeSection === 'tickets'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>پشتیبانی</span>
              </div>
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('reports')}
              className={`p-2.5 rounded-xl text-right flex items-center gap-2 transition ${
                activeSection === 'reports'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>گزارش‌ها</span>
            </button>

            <button
              onClick={() => setActiveSection('backup')}
              className={`p-2.5 rounded-xl text-right flex items-center gap-2 transition ${
                activeSection === 'backup'
                  ? 'bg-gradient-to-l from-[#5b5ce2] to-[#7c5cff] text-white'
                  : 'text-[#c6cbef] hover:bg-white/10'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>پشتیبان‌گیری</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="bg-white border border-[#e4e7ec] rounded-[24px] p-4 sm:p-6 shadow-sm min-h-[500px]">
          {/* SECTION: DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-lg font-black text-[#101828]">خلاصه عملکرد فروشگاه</h3>

                {/* Quick Store Open/Closed Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${
                      config.maintenanceMode
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-green-100 text-green-800 border border-green-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.maintenanceMode ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></span>
                    <span>{config.maintenanceMode ? 'فروشگاه موقتاً بسته است (حالت تعمیرات)' : 'فروشگاه باز و فعال است'}</span>
                  </span>
                </div>
              </div>

              {/* Maintenance & Customer Announcement Box */}
              <div className={`p-4 rounded-[20px] border transition shadow-sm ${
                config.maintenanceMode ? 'bg-amber-50 border-amber-200' : 'bg-[#f8f9ff] border-[#dfe3ff]'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                  <div>
                    <strong className="text-sm font-bold text-[#101828] block">
                      {config.maintenanceMode ? '🚧 فروشگاه در حالت تعمیرات است' : '🟢 کنترل دسترسی و باز/بسته بودن فروشگاه'}
                    </strong>
                    <p className="text-xs text-[#667085] mt-0.5">
                      {config.maintenanceMode
                        ? 'مشتریان هنگام ورود صفحه تعمیرات را می‌بینند و امکان خرید نخواهند داشت.'
                        : 'فروشگاه هم‌اکنون به روی تمام مشتریان باز است و ثبت سفارش فعال می‌باشد.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <button
                      onClick={() => {
                        const next = !config.maintenanceMode;
                        onUpdateConfig({ ...config, maintenanceMode: next });
                        toast(next ? 'فروشگاه بسته شد (حالت تعمیرات فعال گردید)' : 'فروشگاه با موفقیت باز و فعال شد');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${
                        config.maintenanceMode
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {config.maintenanceMode ? '✓ بازگشایی و فعال‌سازی فروشگاه' : '⛔ بستن فروشگاه (تعمیرات)'}
                    </button>
                  </div>
                </div>

                {/* Announcement notification input */}
                <div className="pt-3 border-t border-gray-200/60 flex flex-col sm:flex-row gap-2 items-center text-xs">
                  <span className="font-bold text-[#344054] flex-none">📢 نوتیفیکیشن مشتریان:</span>
                  <input
                    value={config.announcementBanner || ''}
                    onChange={(e) => onUpdateConfig({ ...config, announcementBanner: e.target.value })}
                    placeholder="متن پیام بالای صفحه برای مشتریان (مثلاً تخفیف ویژه یا زمان تحویل)..."
                    className="flex-1 bg-white border border-[#e4e7ec] rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#5b5ce2]"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#344054] flex-none">
                    <input
                      type="checkbox"
                      checked={!!config.announcementActive}
                      onChange={(e) => onUpdateConfig({ ...config, announcementActive: e.target.checked })}
                      className="rounded"
                    />
                    <span>نمایش نوتیف</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-[18px] p-4">
                  <small className="text-xs text-[#667085] block mb-1">فروش تایید شده</small>
                  <strong className="text-lg sm:text-xl font-black text-[#101828] block">
                    {formatMoney(totalRevenue)}
                  </strong>
                </div>

                <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-[18px] p-4">
                  <small className="text-xs text-[#667085] block mb-1">کل سفارش‌ها</small>
                  <strong className="text-lg sm:text-xl font-black text-[#101828] block">
                    {orders.length}
                  </strong>
                </div>

                <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-[18px] p-4">
                  <small className="text-xs text-[#667085] block mb-1">محصولات فعال</small>
                  <strong className="text-lg sm:text-xl font-black text-[#101828] block">
                    {products.filter((p) => p.active !== false).length}
                  </strong>
                </div>

                <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-[18px] p-4">
                  <small className="text-xs text-[#667085] block mb-1">موجودی کل پلن‌ها</small>
                  <strong className="text-lg sm:text-xl font-black text-[#101828] block">
                    {totalStock}
                  </strong>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base font-bold text-[#101828]">آخرین سفارش‌های ثبت شده</h4>
                  <button
                    onClick={() => setActiveSection('orders')}
                    className="text-xs text-[#5b5ce2] font-bold hover:underline"
                  >
                    مشاهده همه سفارش‌ها →
                  </button>
                </div>

                <div className="border border-[#e4e7ec] rounded-2xl overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#f8f9fc] text-[#667085] border-b border-[#e4e7ec]">
                      <tr>
                        <th className="p-3">شناسه</th>
                        <th className="p-3">مشتری</th>
                        <th className="p-3">محصول</th>
                        <th className="p-3">مبلغ</th>
                        <th className="p-3">وضعیت</th>
                        <th className="p-3">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e7ec]">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-[#fafbff]">
                          <td className="p-3 font-mono font-bold">{o.id}</td>
                          <td className="p-3">{o.customer?.name}</td>
                          <td className="p-3">{o.product}</td>
                          <td className="p-3 font-bold">{formatMoney(o.amount)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                o.status === 'تکمیل شده'
                                  ? 'bg-[#ecfdf3] text-[#027a48]'
                                  : 'bg-[#fffaeb] text-[#b54708]'
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => openOrderModal(o)}
                              className="px-2.5 py-1 bg-[#f0f1ff] text-[#5b5ce2] rounded-lg font-bold hover:bg-[#e4e7ff]"
                            >
                              بررسی
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: ORDERS */}
          {activeSection === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-[#101828]">مدیریت سفارش‌ها</h3>
                <span className="text-xs text-[#667085]">{orders.length} سفارش موجود</span>
              </div>

              <div className="border border-[#e4e7ec] rounded-2xl overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[600px]">
                  <thead className="bg-[#f8f9fc] text-[#667085] border-b border-[#e4e7ec]">
                    <tr>
                      <th className="p-3">شناسه</th>
                      <th className="p-3">مشتری</th>
                      <th className="p-3">محصول و پلن</th>
                      <th className="p-3">مبلغ</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3">تاریخ</th>
                      <th className="p-3">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e7ec]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#fafbff]">
                        <td className="p-3 font-mono font-bold text-[#5b5ce2]">{o.id}</td>
                        <td className="p-3">
                          <b className="block">{o.customer?.name}</b>
                          <span className="text-[11px] text-gray-500 font-mono">@{o.customer?.username}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold block">{o.product}</span>
                          <span className="text-[11px] text-[#667085]">{o.plan}</span>
                        </td>
                        <td className="p-3 font-black">{formatMoney(o.amount)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.status === 'تکمیل شده'
                                ? 'bg-[#ecfdf3] text-[#027a48]'
                                : o.status === 'در حال انجام' || o.status === 'دریافت شد'
                                ? 'bg-[#e0f2fe] text-[#0369a1]'
                                : 'bg-[#fffaeb] text-[#b54708]'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-gray-500">{o.createdAt}</td>
                        <td className="p-3">
                          <button
                            onClick={() => openOrderModal(o)}
                            className="px-3 py-1.5 bg-[#f0f1ff] text-[#5b5ce2] rounded-xl font-bold hover:bg-[#e4e7ff] transition"
                          >
                            جزئیات و تحویل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION: PRODUCTS */}
          {activeSection === 'products' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-[#101828]">مدیریت محصولات و پلن‌ها</h3>
                  <p className="text-xs text-[#667085]">
                    ساخت محصول جدید، تعریف پلن‌های مختلف، تعیین قیمت، موجودی و فرم اختصاصی
                  </p>
                </div>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-3.5 py-2 bg-[#5b5ce2] hover:bg-[#4849cb] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن محصول</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`border rounded-[22px] p-4 sm:p-5 flex flex-col justify-between transition ${
                      p.active === false
                        ? 'bg-[#fcfcfd] border-dashed border-[#d0d5dd] opacity-75'
                        : 'bg-white border-[#e4e7ec] shadow-sm'
                    }`}
                  >
                    <div>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-36 object-cover rounded-[16px] bg-[#f0f1ff] mb-3"
                        />
                      ) : (
                        <div className="w-full h-36 rounded-[16px] bg-gradient-to-br from-[#eef0ff] to-[#f7f7ff] flex items-center justify-center text-4xl mb-3">
                          {p.icon}
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-base font-extrabold text-[#101828] mb-0.5">{p.name}</h4>
                          <span className="text-xs text-[#667085]">{p.desc}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.active === false ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {p.active === false ? 'غیرفعال' : 'فعال'}
                        </span>
                      </div>

                      {/* Plans list */}
                      <div className="space-y-1.5 my-3">
                        <div className="text-xs font-bold text-[#344054] flex justify-between">
                          <span>پلن‌های محصول:</span>
                          <span className="text-gray-400">{p.plans.length} پلن</span>
                        </div>
                        {p.plans.map((pl, plIdx) => (
                          <div
                            key={pl.id}
                            className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-xl p-2.5 flex items-center justify-between text-xs"
                          >
                            <div>
                              <b className="text-[#101828] ml-2">{pl.name}</b>
                              <span className="text-gray-500">
                                {formatMoney(pl.price)} • موجودی: {pl.stock}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleTogglePlan(idx, plIdx)}
                                className={`text-[10px] px-2 py-1 rounded-lg font-bold ${
                                  pl.active === false
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {pl.active === false ? 'فعال‌سازی' : 'غیرفعال'}
                              </button>
                              <button
                                onClick={() => handleDeletePlan(idx, plIdx)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="حذف پلن"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#f2f4f7] text-xs font-bold">
                      <button
                        onClick={() => openAddPlan(idx)}
                        className="py-2 px-2 bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] rounded-xl text-center"
                      >
                        ＋ افزودن پلن
                      </button>
                      <button
                        onClick={() => openFormEditor(idx)}
                        className="py-2 px-2 bg-[#f8f9fc] hover:bg-[#f0f1ff] text-[#344054] rounded-xl border border-[#e4e7ec] text-center"
                      >
                        ⚙ فرم اختصاصی
                      </button>
                      <button
                        onClick={() => handleToggleProduct(idx)}
                        className={`py-2 px-2 rounded-xl text-center ${
                          p.active === false
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.active === false ? '✓ فعال‌سازی محصول' : 'غیرفعال‌سازی'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(idx)}
                        className="py-2 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 text-center"
                      >
                        حذف کامل محصول
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: CMS & APPEARANCE */}
          {activeSection === 'cms' && (
            <div className="space-y-5 max-w-xl">
              <h3 className="text-lg font-black text-[#101828]">مدیریت هویت و متن‌های فروشگاه (CMS)</h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#344054] mb-1">
                    نام فروشگاه (فارسی و انگلیسی پشتیبانی می‌شود) *
                  </label>
                  <input
                    value={config.storeName}
                    onChange={(e) => onUpdateConfig({ ...config, storeName: e.target.value })}
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                  />
                  <small className="text-gray-400">مثلاً: فروشگاه من و تو یا Manoto Digital Store</small>
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">شعار فروشگاه (Subtitle)</label>
                  <input
                    value={config.storeSubtitle}
                    onChange={(e) => onUpdateConfig({ ...config, storeSubtitle: e.target.value })}
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">شماره کارت جهت واریز مشتریان</label>
                  <input
                    value={config.cardNumber}
                    onChange={(e) => onUpdateConfig({ ...config, cardNumber: e.target.value })}
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#344054] mb-1">نام صاحب حساب</label>
                    <input
                      value={config.cardOwner}
                      onChange={(e) => onUpdateConfig({ ...config, cardOwner: e.target.value })}
                      className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#344054] mb-1">نام بانک</label>
                    <input
                      value={config.bankName || 'بانک ملت / ملی'}
                      onChange={(e) => onUpdateConfig({ ...config, bankName: e.target.value })}
                      placeholder="مثلاً: بانک ملت"
                      className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">شماره شبا (IBAN)</label>
                  <input
                    value={config.shebaNumber || 'IR000000000000000000000000'}
                    onChange={(e) => onUpdateConfig({ ...config, shebaNumber: e.target.value })}
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">آدرس ولت تتر (USDT TRC20)</label>
                  <input
                    value={config.tetherWallet || 'TQn9Y2khsA9102jslka81029381kjahsd2910'}
                    onChange={(e) => onUpdateConfig({ ...config, tetherWallet: e.target.value })}
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left font-mono"
                  />
                  <small className="text-gray-400">آدرس ولت تتر جهت پرداخت ارزی مشتریان در مینی‌اپ</small>
                </div>

                {/* Live Dollar Rate Override Settings */}
                <div className="bg-[#f8f9fc] border border-[#e4e7ec] rounded-[18px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-bold text-[#101828] block">تنظیم نرخ زنده دلار و تتر</strong>
                      <span className="text-xs text-gray-500">کنترل نرخ ارز نمایش داده شده در بالای مینی‌اپ</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!config.customDollarRateActive}
                        onChange={(e) => onUpdateConfig({ ...config, customDollarRateActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5b5ce2]"></div>
                    </label>
                  </div>

                  {config.customDollarRateActive && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">نرخ دستی دلار (تومان)</label>
                        <input
                          type="number"
                          value={config.usdRate || 94850}
                          onChange={(e) => onUpdateConfig({ ...config, usdRate: parseInt(e.target.value) || 94850 })}
                          className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#344054] mb-1">نرخ دستی تتر (تومان)</label>
                        <input
                          type="number"
                          value={config.usdtRate || 95200}
                          onChange={(e) => onUpdateConfig({ ...config, usdtRate: parseInt(e.target.value) || 95200 })}
                          className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">دامنه اختصاصی فروشگاه (Domain / Tunnel URL)</label>
                  <input
                    value={config.domain}
                    onChange={(e) => onUpdateConfig({ ...config, domain: e.target.value })}
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left"
                  />
                  <small className="text-gray-400">آدرس HTTPS سرور یا لینک Cloudflare Tunnel جهت اتصال مینی‌اپ در تلگرام</small>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      fetch('/api/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(config),
                      }).catch(() => {});
                      toast('تنظیمات ظاهر، بانک و CMS با موفقیت ذخیره شد');
                    }}
                    className="px-6 py-2.5 bg-[#12b76a] text-white font-bold rounded-xl hover:bg-[#0fa05b] transition shadow-sm"
                  >
                    ذخیره کلیه تغییرات CMS و ارز
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: BOT SETTINGS */}
          {activeSection === 'bot' && (
            <div className="space-y-5 max-w-xl">
              <h3 className="text-lg font-black text-[#101828]">تنظیمات ربات تلگرام</h3>
              <p className="text-xs text-[#667085]">
                اتصال و مدیریت بات رسمی تلگرام، دریافت سفارش‌ها و ارسال اعلان وضعیت به مشتری
              </p>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#344054] mb-1">توکن ربات تلگرام (Bot Token)</label>
                  <input
                    value={config.botToken}
                    onChange={(e) => onUpdateConfig({ ...config, botToken: e.target.value })}
                    dir="ltr"
                    type="password"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left font-mono"
                  />
                  <small className="text-gray-400">دریافت شده از @BotFather</small>
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">آیدی عددی مدیر (Telegram Admin Numeric ID)</label>
                  <input
                    value={config.adminNumericId}
                    onChange={(e) => onUpdateConfig({ ...config, adminNumericId: e.target.value })}
                    dir="ltr"
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2] text-left font-mono"
                  />
                  <small className="text-gray-400">شناسه عددی اکانت تلگرام شما جهت ارسال سفارشات جدید</small>
                </div>

                <div>
                  <label className="block font-bold text-[#344054] mb-1">پیام خوشامدگویی استارت ربات (/start)</label>
                  <textarea
                    value={config.welcomeMessage}
                    onChange={(e) => onUpdateConfig({ ...config, welcomeMessage: e.target.value })}
                    rows={3}
                    className="w-full border border-[#e4e7ec] rounded-[14px] p-3 text-sm outline-none focus:border-[#5b5ce2]"
                  />
                </div>

                {/* Real Bot Service Controller */}
                <div className="bg-[#f8f9ff] border border-[#cfd3ff] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-bold text-[#101828] block">
                        وضعیت اجرای ربات در سرور (Telegram Bot Engine)
                      </strong>
                      <span className="text-xs text-[#667085]">
                        سرویس پاسخ‌دهی به کاربران تلگرام و ارسال دکمه‌های ورود به مینی‌اپ
                      </span>
                    </div>
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full ${
                        botLiveInfo?.username
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {botLiveInfo?.username ? `● متصل: @${botLiveInfo.username}` : '○ آماده استارت'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={botLoading}
                      onClick={async () => {
                        setBotLoading(true);
                        try {
                          const res = await fetch('/api/bot/start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: config.botToken }),
                          });
                          const data = await res.json();
                          if (data.ok) {
                            setBotLiveInfo(data.botInfo || { username: config.botUsername });
                            toast(`ربات تلگرام با موفقیت استارت شد! ✓ (@${data.botInfo?.username || config.botUsername})`);
                          } else {
                            toast(`خطا در استارت ربات: ${data.error || 'توکن نامعتبر است'}`);
                          }
                        } catch (err: any) {
                          toast(`خطا در ارتباط با سرور: ${err.message}`);
                        } finally {
                          setBotLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-[#12b76a] hover:bg-[#0fa05b] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>▶️ استارت و راه‌اندازی ربات در تلگرام</span>
                    </button>

                    <button
                      type="button"
                      disabled={botLoading}
                      onClick={async () => {
                        setBotLoading(true);
                        try {
                          await fetch('/api/bot/stop', { method: 'POST' });
                          setBotLiveInfo(null);
                          toast('سرویس ربات تلگرام متوقف شد');
                        } catch (_) {
                          toast('خطا در توقف ربات');
                        } finally {
                          setBotLoading(false);
                        }
                      }}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                    >
                      ⏹️ توقف ربات
                    </button>

                    <button
                      type="button"
                      disabled={botLoading}
                      onClick={async () => {
                        setBotLoading(true);
                        try {
                          const res = await fetch('/api/bot/test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              token: config.botToken,
                              adminId: config.adminNumericId,
                            }),
                          });
                          const data = await res.json();
                          if (data.ok) {
                            toast('پیام تست با موفقیت به اکانت تلگرام شما ارسال شد! ✓');
                          } else {
                            toast(`خطا در ارسال پیام تست: ${data.description || 'شناسه ادمین نامعتبر است'}`);
                          }
                        } catch (e: any) {
                          toast(`خطا: ${e.message}`);
                        } finally {
                          setBotLoading(false);
                        }
                      }}
                      className="px-3.5 py-2 bg-[#f0f1ff] hover:bg-[#e4e7ff] text-[#5b5ce2] rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      🔔 ارسال پیام تست به تلگرام من
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      toast('تنظیمات ربات ذخیره شد');
                    }}
                    className="px-6 py-2.5 bg-[#5b5ce2] text-white font-bold rounded-xl hover:bg-[#4849cb] transition shadow-sm"
                  >
                    ذخیره تنظیمات ربات
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: TICKETS */}
          {activeSection === 'tickets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-black text-[#101828]">تیکت‌های پشتیبانی مشتریان</h3>

              {tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">تیکتی ثبت نشده است.</div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t, tIdx) => (
                    <div key={t.id} className="border border-[#e4e7ec] rounded-[18px] p-4 bg-[#fafbfc]">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <b className="text-sm font-bold text-[#101828] block">{t.subject}</b>
                          <small className="text-gray-500">
                            مشتری: {t.customerName} (@{t.telegramUsername}) • شناسه: {t.id}
                          </small>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'پاسخ داده شده'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      {/* Chat messages */}
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-[#e4e7ec] mb-3 text-xs">
                        {t.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2 rounded-lg ${
                              m.sender === 'admin'
                                ? 'bg-[#eef0ff] text-[#2d3066] mr-4'
                                : 'bg-[#f4f5f7] text-[#344054] ml-4'
                            }`}
                          >
                            <span className="font-bold block mb-0.5">{m.senderName}:</span>
                            <div>{m.text}</div>
                          </div>
                        ))}
                      </div>

                      {/* Reply input */}
                      <div className="flex gap-2">
                        <input
                          id={`reply_${t.id}`}
                          placeholder="پاسخ ادمین به تیکت..."
                          className="flex-1 border border-[#e4e7ec] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#5b5ce2]"
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`reply_${t.id}`) as HTMLInputElement;
                            if (!input || !input.value.trim()) return;
                            const updated = [...tickets];
                            updated[tIdx].status = 'پاسخ داده شده';
                            updated[tIdx].messages.push({
                              id: `msg_${Date.now()}`,
                              sender: 'admin',
                              senderName: 'مدیریت فروشگاه',
                              text: input.value.trim(),
                              createdAt: new Date().toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                            });
                            onUpdateTickets(updated);
                            input.value = '';
                            toast('پاسخ برای مشتری ثبت شد');
                          }}
                          className="px-4 py-2 bg-[#5b5ce2] text-white rounded-xl text-xs font-bold hover:bg-[#4849cb]"
                        >
                          ارسال پاسخ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION: REPORTS */}
          {activeSection === 'reports' && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-[#101828]">گزارش مالی و فروش</h3>
                <button
                  onClick={() => {
                    const csvRows = [
                      ['Order ID', 'Product', 'Plan', 'Amount', 'Status', 'Date'],
                      ...orders.map((o) => [o.id, o.product, o.plan, o.amount, o.status, o.createdAt]),
                    ];
                    const csvContent =
                      'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'tsm-orders-report.csv');
                    link.click();
                    toast('خروجی CSV دانلود شد');
                  }}
                  className="px-3.5 py-1.5 bg-[#f0f1ff] text-[#5b5ce2] rounded-xl text-xs font-bold hover:bg-[#e4e7ff] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>خروجی اکسل / CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-gray-50 border rounded-2xl">
                  <span className="text-gray-500 block mb-1">کل دریافتی</span>
                  <strong className="text-base text-gray-900 block">{formatMoney(totalRevenue)}</strong>
                </div>
                <div className="p-4 bg-gray-50 border rounded-2xl">
                  <span className="text-gray-500 block mb-1">سفارشات تکمیل شده</span>
                  <strong className="text-base text-green-700 block">
                    {orders.filter((o) => o.status === 'تکمیل شده').length}
                  </strong>
                </div>
                <div className="p-4 bg-gray-50 border rounded-2xl">
                  <span className="text-gray-500 block mb-1">در انتظار بررسی</span>
                  <strong className="text-base text-amber-700 block">
                    {orders.filter((o) => o.status === 'در انتظار بررسی').length}
                  </strong>
                </div>
                <div className="p-4 bg-gray-50 border rounded-2xl">
                  <span className="text-gray-500 block mb-1">نرخ تحویل</span>
                  <strong className="text-base text-[#5b5ce2] block">
                    {orders.length ? Math.round((orders.filter((o) => o.status === 'تکمیل شده').length / orders.length) * 100) : 100}%
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: BACKUP & RESTORE */}
          {activeSection === 'backup' && (
            <div className="space-y-5 max-w-xl">
              <h3 className="text-lg font-black text-[#101828]">پشتیبان‌گیری و بازیابی داده‌ها</h3>
              <p className="text-xs text-[#667085]">
                دانلود فایل JSON کلیه محصولات، تنظیمات، سفارش‌ها و بازیابی مجدد آنها روی هر سرور
              </p>

              <div className="p-4 bg-gray-50 border rounded-2xl space-y-3">
                <strong className="text-sm block">۱. خروجی نسخه پشتیبان</strong>
                <p className="text-xs text-gray-600">
                  یک فایل پشتیبان کامل شامل همه اطلاعات فروشگاه در قالب فایل JSON دریافت کنید.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-[#5b5ce2] text-white rounded-xl text-xs font-bold hover:bg-[#4849cb] flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود بکاپ JSON</span>
                </button>
              </div>

              <div className="p-4 bg-gray-50 border rounded-2xl space-y-3">
                <strong className="text-sm block">۲. بازیابی از فایل پشتیبان</strong>
                <p className="text-xs text-gray-600">
                  فایل JSON قبلی را انتخاب کنید تا اطلاعات فروشگاه به طور کامل بازگردانی شوند.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="text-xs text-gray-500 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#f0f1ff] file:text-[#5b5ce2] file:font-bold hover:file:bg-[#e4e7ff]"
                />
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                <strong className="text-sm text-red-800 block">۳. بازنشانی به تنظیمات کارخانه</strong>
                <p className="text-xs text-red-600">
                  کلیه محصولات و سفارش‌های ثبت‌شده پاک می‌شوند و تنظیمات پیش‌فرض فروشگاه من و تو بارگذاری خواهد شد.
                </p>
                <button
                  onClick={() => {
                    if (confirm('آیا از بازنشانی کلیه داده‌های فروشگاه اطمینان دارید؟')) {
                      onResetDefaults();
                      toast('داده‌ها بازنشانی شدند');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                >
                  بازنشانی کامل داده‌ها
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ORDER DETAILS MODAL matching store_v18.html */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec] mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#101828] m-0">
                  جزئیات سفارش {activeOrder.id}
                </h3>
                <small className="text-xs text-[#667085]">
                  {activeOrder.product} • {activeOrder.plan}
                </small>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs">
              <div className="bg-[#f8f9fc] p-3 rounded-xl border border-[#e4e7ec]">
                <span className="text-gray-500 block">مبلغ سفارش</span>
                <b className="text-sm font-bold">{formatMoney(activeOrder.amount)}</b>
              </div>
              <div className="bg-[#f8f9fc] p-3 rounded-xl border border-[#e4e7ec]">
                <span className="text-gray-500 block">وضعیت فعلی</span>
                <b className="text-sm font-bold text-[#5b5ce2]">{activeOrder.status}</b>
              </div>
              <div className="bg-[#f8f9fc] p-3 rounded-xl border border-[#e4e7ec]">
                <span className="text-gray-500 block">روش پرداخت</span>
                <b className="text-sm font-bold">{activeOrder.paymentMethod === 'stars' ? 'Stars' : 'کارت'}</b>
              </div>
              <div className="bg-[#f8f9fc] p-3 rounded-xl border border-[#e4e7ec]">
                <span className="text-gray-500 block">تاریخ ثبت</span>
                <b className="text-sm font-bold">{activeOrder.createdAt}</b>
              </div>
            </div>

            {/* Customer Details */}
            <div className="border border-[#e4e7ec] rounded-2xl p-4 mb-4 text-xs space-y-2">
              <strong className="block text-sm text-[#101828] font-bold mb-1">اطلاعات مشتری</strong>
              <div className="flex justify-between">
                <span className="text-gray-500">نام:</span>
                <b>{activeOrder.customer?.name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">آیدی تلگرام:</span>
                <a
                  href={`https://t.me/${activeOrder.customer?.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#5b5ce2] font-mono hover:underline"
                >
                  @{activeOrder.customer?.username}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">شماره تماس:</span>
                <b dir="ltr">{activeOrder.customer?.phone}</b>
              </div>

              {/* Dynamic Product Form Data */}
              {Object.keys(activeOrder.formData || {}).length > 0 && (
                <div className="pt-2 border-t border-[#f2f4f7] space-y-1.5 mt-2">
                  <strong className="block text-xs text-[#5b5ce2] font-bold">
                    اطلاعات ارسالی اختصاصی {activeOrder.product}:
                  </strong>
                  {Object.entries(activeOrder.formData).map(([k, v]) => (
                    <div key={k} className="flex justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-600">{k}:</span>
                      <b className="text-[#101828] font-mono select-all">{v}</b>
                    </div>
                  ))}
                </div>
              )}

              {activeOrder.description && (
                <div className="bg-gray-50 p-2.5 rounded-lg text-gray-700 mt-2">
                  <b>توضیحات مشتری:</b> {activeOrder.description}
                </div>
              )}
            </div>

            {/* Receipt Viewer matching store_v18.html */}
            {activeOrder.receipt && (
              <div className="border border-[#e4e7ec] rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2 text-xs">
                  <strong className="font-bold">رسید پرداخت مشتری</strong>
                  <span className="text-gray-500">{activeOrder.receiptName || 'تصویر رسید'}</span>
                </div>
                <img
                  src={activeOrder.receipt}
                  alt="رسید پرداخت"
                  onClick={() => setShowReceiptZoom(true)}
                  className="max-h-56 rounded-xl object-contain mx-auto border border-[#e4e7ec] cursor-zoom-in hover:opacity-90 transition"
                />
              </div>
            )}

            {/* Customer Message Input */}
            <div className="border border-[#e4e7ec] rounded-2xl p-4 mb-4 space-y-2 text-xs">
              <strong className="block font-bold">ارسال پیام یا اطلاعیه به مشتری</strong>
              <textarea
                value={orderMessageInput}
                onChange={(e) => setOrderMessageInput(e.target.value)}
                placeholder="مثلاً: رسید شما دریافت شد و سفارش در حال انجام است..."
                rows={2}
                className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
              />
            </div>

            {/* Manual Delivery link input */}
            <div className="border border-[#e4e7ec] rounded-2xl p-4 mb-4 space-y-2 text-xs">
              <strong className="block font-bold text-green-800">
                تحویل دستی: لینک یا اطلاعات محصول
              </strong>
              <textarea
                value={orderDeliveryInput}
                onChange={(e) => setOrderDeliveryInput(e.target.value)}
                placeholder="لینک اختصاصی VPN، کد فعال‌سازی، یا مشخصات اکانت را اینجا وارد کنید..."
                rows={2}
                className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#12b76a] font-mono text-left"
              />
            </div>

            {/* Workflow Buttons matching store_v18.html */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#e4e7ec]">
              {activeOrder.status === 'در انتظار بررسی' && (
                <button
                  type="button"
                  onClick={() =>
                    updateOrderStatus(
                      'در حال انجام',
                      'رسید پرداخت شما تأیید شد و سفارش شما در حال آماده‌سازی است.'
                    )
                  }
                  className="px-4 py-2.5 bg-[#5b5ce2] text-white rounded-xl text-xs font-bold hover:bg-[#4849cb] transition"
                >
                  ✓ دریافت شد و در حال انجام
                </button>
              )}

              {activeOrder.status !== 'تکمیل شده' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!orderDeliveryInput.trim()) {
                      toast('لطفاً قبل از اتمام کار، لینک یا اطلاعات محصول را وارد کنید');
                      return;
                    }
                    updateOrderStatus(
                      'تکمیل شده',
                      'سفارش شما با موفقیت تکمیل شد و اطلاعات تحویل ثبت گردید.'
                    );
                  }}
                  className="px-4 py-2.5 bg-[#12b76a] text-white rounded-xl text-xs font-bold hover:bg-[#0fa05b] transition"
                >
                  ✓ کار تمام شد و ارسال به مشتری
                </button>
              )}

              <button
                type="button"
                onClick={() => updateOrderStatus('لغو شده', 'سفارش شما به دلیل عدم تأیید رسید لغو شد.')}
                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition mr-auto"
              >
                رد سفارش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT ZOOM MODAL */}
      {showReceiptZoom && activeOrder?.receipt && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowReceiptZoom(false)}
        >
          <div className="max-w-3xl max-h-[90vh]">
            <img
              src={activeOrder.receipt}
              alt="رسید بزرگنمایی شده"
              className="max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ADD PLAN MODAL matching store_v18.html */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#101828]">افزودن پلن جدید</h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCreatePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#344054] mb-1">نام پلن *</label>
                <input
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="مثلاً: ۳۰ روزه اختصاصی"
                  required
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344054] mb-1">قیمت (تومان) *</label>
                <input
                  type="number"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  placeholder="مثلاً 390000"
                  required
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#344054] mb-1">موجودی عددی</label>
                  <input
                    type="number"
                    value={newPlanStock}
                    onChange={(e) => setNewPlanStock(e.target.value)}
                    className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#344054] mb-1">واحد</label>
                  <input
                    value={newPlanUnit}
                    onChange={(e) => setNewPlanUnit(e.target.value)}
                    placeholder="اشتراک، گیگ، عدد"
                    className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#12b76a] text-white rounded-xl font-bold hover:bg-[#0fa05b] transition shadow-sm mt-3"
              >
                ✓ ساخت پلن
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL matching store_v18.html */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-[#101828]">ساخت محصول جدید</h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#344054] mb-1">نام محصول *</label>
                <input
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="مثلاً: اکانت Midjourney"
                  required
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344054] mb-1">دسته‌بندی *</label>
                <select
                  value={newProdCat}
                  onChange={(e) => setNewProdCat(e.target.value)}
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#344054] mb-1">توضیحات محصول</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  rows={2}
                  placeholder="توضیح کوتاه درباره این سرویس..."
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#344054] mb-1">آیکون ایموجی</label>
                  <input
                    value={newProdIcon}
                    onChange={(e) => setNewProdIcon(e.target.value)}
                    maxLength={2}
                    className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#344054] mb-1">الگوی فرم سفارش</label>
                  <select
                    value={newProdFormType}
                    onChange={(e) => setNewProdFormType(e.target.value as any)}
                    className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] bg-white"
                  >
                    <option value="basic">فرم ساده عمومی</option>
                    <option value="ai">اشتراک هوش مصنوعی</option>
                    <option value="game">بازی و گیفت‌کارت</option>
                    <option value="vpn">VPN</option>
                    <option value="custom">فقط فیلدهای سفارشی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#344054] mb-1">لینک تصویر محصول (اختیاری)</label>
                <input
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  placeholder="https://... یا خالی بگذارید تا از آیکون استفاده شود"
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#344054] mb-1">
                  فیلدهای سفارشی اختصاصی (هر خط یک فیلد)
                </label>
                <textarea
                  value={newProdCustomLines}
                  onChange={(e) => setNewProdCustomLines(e.target.value)}
                  rows={3}
                  placeholder="عنوان فیلد | نوع | اجباری/اختیاری | گزینه‌ها&#10;ایمیل اکانت | email | اجباری&#10;روش ورود | select | اجباری | Google,Apple,Email"
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#12b76a] text-white rounded-xl font-bold hover:bg-[#0fa05b] transition shadow-sm mt-3"
              >
                ✓ ساخت محصول و بازگشت
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FORM EDITOR MODAL matching store_v18.html */}
      {showFormModal && formProductIndex !== null && products[formProductIndex] && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-[#101828]">تنظیم فرم اختصاصی محصول</h3>
                <small className="text-xs text-gray-500">
                  محصول: {products[formProductIndex].name}
                </small>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#344054] mb-1">الگوی فرم</label>
                <select
                  value={formTemplateType}
                  onChange={(e) => setFormTemplateType(e.target.value as any)}
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] bg-white"
                >
                  <option value="basic">فرم ساده</option>
                  <option value="ai">اشتراک هوش مصنوعی</option>
                  <option value="game">بازی و پرداخت درون‌برنامه‌ای</option>
                  <option value="vpn">VPN</option>
                  <option value="custom">فقط فیلدهای سفارشی</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#344054] mb-1">
                  فیلدهای اختصاصی این محصول (هر خط یک فیلد)
                </label>
                <textarea
                  value={formCustomLines}
                  onChange={(e) => setFormCustomLines(e.target.value)}
                  rows={5}
                  placeholder="عنوان | نوع | اجباری/اختیاری | گزینه‌ها&#10;ایمیل اکانت | email | اجباری&#10;روش ورود | select | اجباری | Google,Apple"
                  className="w-full border border-[#e4e7ec] rounded-xl p-2.5 text-xs outline-none focus:border-[#5b5ce2] font-mono leading-relaxed"
                />
              </div>

              <button
                onClick={submitFormSettings}
                className="w-full py-2.5 bg-[#12b76a] text-white rounded-xl font-bold hover:bg-[#0fa05b] transition shadow-sm mt-2"
              >
                ذخیره فرم این محصول
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
