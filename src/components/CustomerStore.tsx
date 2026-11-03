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
} from 'lucide-react';

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
  const [view, setView] = useState<'home' | 'product' | 'checkout' | 'orders' | 'support' | 'success'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCard, setCopiedCard] = useState(false);

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

      {/* VIEW: ORDERS TRACKING */}
      {view === 'orders' && (
        <div className="animate-fade-in max-w-2xl mx-auto">
          <button
            onClick={() => setView('home')}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-white to-[#f5f6ff] text-[#4547c7] border border-[#dfe3ff] rounded-[14px] py-2.5 px-4 mb-4 text-xs sm:text-sm font-extrabold shadow-sm hover:bg-[#eef0ff] transition"
          >
            <span>← بازگشت به فروشگاه</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#101828]">سفارش‌های من</h2>
            <span className="text-xs text-[#667085]">{orders.length} سفارش ثبت شده</span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white border border-[#e4e7ec] rounded-[22px] p-8 text-center text-[#667085]">
              شما هنوز سفارشی ثبت نکرده‌اید.
            </div>
          ) : (
            <div className="grid gap-3">
              {orders.map((o) => {
                const isCompleted = o.status === 'تکمیل شده';
                const isProcessing = o.status === 'در حال انجام' || o.status === 'دریافت شد';

                return (
                  <div
                    key={o.id}
                    className="bg-white border border-[#e4e7ec] rounded-[20px] p-4 sm:p-5 shadow-sm"
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
                      <span>کد: {o.id}</span>
                      <span>پلن: {o.plan}</span>
                      <span>تاریخ: {o.createdAt}</span>
                    </div>

                    <div className="text-sm font-black text-[#5b5ce2] mb-3">
                      {formatMoney(o.amount)}
                    </div>

                    {/* Delivery / Message box if admin provided details */}
                    {o.delivery && (
                      <div className="mt-2 p-3.5 bg-[#ecfdf3] border border-[#a6f4c5] rounded-xl text-xs sm:text-sm">
                        <strong className="block text-[#027a48] font-bold mb-1">
                          ✓ اطلاعات و لینک تحویل سفارش:
                        </strong>
                        <div className="bg-white p-2.5 rounded-lg border border-[#a6f4c5] font-mono text-left text-xs break-all text-[#101828]">
                          {o.delivery}
                        </div>
                      </div>
                    )}

                    {o.message && (
                      <div className="mt-2 p-3 bg-[#f8f9fc] border border-[#e4e7ec] rounded-xl text-xs text-[#344054]">
                        <b>پیام پشتیبانی:</b> {o.message}
                      </div>
                    )}
                  </div>
                );
              })}
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
