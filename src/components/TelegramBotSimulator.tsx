import React, { useState } from 'react';
import { StoreConfig, Order } from '../types/store';
import { Send, Bot, Check, CheckCheck, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

interface TelegramBotSimulatorProps {
  config: StoreConfig;
  orders: Order[];
  onOpenStore: () => void;
  onOpenSupport: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  buttons?: { text: string; action: () => void; icon?: string }[];
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  config,
  orders,
  onOpenStore,
  onOpenSupport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      text: '/start',
      time: '12:00',
    },
    {
      id: 'm2',
      sender: 'bot',
      text: `${config.welcomeMessage || 'سلام! به فروشگاه من و تو خوش آمدید.'}\n\nجهت خرید آسان محصولات دیجیتال، هوش مصنوعی، بازی و VPN یا دریافت پشتیبانی از دکمه‌های زیر استفاده کنید:`,
      time: '12:00',
      buttons: [
        {
          text: '🛍 ورود به فروشگاه (Mini App)',
          action: onOpenStore,
          icon: '🛍',
        },
        {
          text: '🎧 ورود به بخش پشتیبانی',
          action: onOpenSupport,
          icon: '🎧',
        },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputVal('');

    // Bot response logic
    setTimeout(() => {
      const respTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      let botText = '';
      let botButtons: ChatMessage['buttons'] = undefined;

      if (userText === '/start') {
        botText = `${config.welcomeMessage}\n\nاز طریق منوی زیر وارد فروشگاه شوید:`;
        botButtons = [
          { text: '🛍 ورود به فروشگاه (Mini App)', action: onOpenStore },
          { text: '🎧 ورود به بخش پشتیبانی', action: onOpenSupport },
        ];
      } else if (userText.toLowerCase() === '/orders' || userText.includes('سفارش')) {
        const lastOrder = orders[0];
        if (lastOrder) {
          botText = `🧾 آخرین سفارش شما:\nکد: ${lastOrder.id}\nمحصول: ${lastOrder.product} (${lastOrder.plan})\nوضعیت: ${lastOrder.status}\nمبلغ: ${lastOrder.amount.toLocaleString('fa-IR')} تومان`;
          if (lastOrder.delivery) {
            botText += `\n\n✓ اطلاعات تحویل:\n${lastOrder.delivery}`;
          }
        } else {
          botText = 'شما هنوز سفارشی در این بات ثبت نکرده‌اید.';
        }
        botButtons = [{ text: '🛍 باز کردن فروشگاه', action: onOpenStore }];
      } else if (userText.toLowerCase() === '/help' || userText.includes('راهنما')) {
        botText = `راهنمای بات ${config.storeName}:\n/start - شروع مجدد و مشاهده دکمه‌ها\n/orders - پیگیری آخرین سفارش\n/help - راهنما\n\nبرای خرید مستقیم دکمه «ورود به فروشگاه» را بزنید.`;
        botButtons = [{ text: '🛍 ورود به فروشگاه', action: onOpenStore }];
      } else {
        botText = `پیام شما دریافت شد. همکاران ما در بخش پشتیبانی پاسخ خواهند داد. همچنین می‌توانید با دکمه زیر مستقیماً تیکت ثبت کنید:`;
        botButtons = [
          { text: '🎧 ثبت تیکت پشتیبانی', action: onOpenSupport },
          { text: '🛍 ورود به فروشگاه', action: onOpenStore },
        ];
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: botText,
          time: respTime,
          buttons: botButtons,
        },
      ]);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `m_${Date.now()}`,
        sender: 'bot',
        text: `سلام! به ربات تلگرام ${config.storeName} خوش آمدید.`,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        buttons: [
          { text: '🛍 ورود به فروشگاه', action: onOpenStore },
          { text: '🎧 پشتیبانی', action: onOpenSupport },
        ],
      },
    ]);
  };

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-5 text-[#101828]">
      {/* Telegram App Container */}
      <div className="bg-[#0e1621] text-white rounded-[26px] shadow-2xl border border-[#232e3c] overflow-hidden flex flex-col h-[680px]">
        {/* Telegram Chat Header */}
        <div className="bg-[#17212b] px-4 py-3 border-b border-[#232e3c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#5b5ce2] to-[#7c5cff] flex items-center justify-center text-white font-black text-lg shadow-md">
                م
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#17212b]"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-white">{config.storeName}</span>
                <span className="bg-[#5b5ce2]/20 text-[#a5b4fc] text-[9px] font-bold px-1.5 py-0.2 rounded border border-[#5b5ce2]/40">
                  BOT
                </span>
              </div>
              <span className="text-[11px] text-[#6c7883] block">bot • @{config.botUsername}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="شروع مجدد چت"
              className="p-2 rounded-xl bg-[#232e3c] hover:bg-[#2c394b] text-gray-300 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telegram Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0e1621] bg-opacity-95" dir="rtl">
          <div className="text-center my-2">
            <span className="bg-[#182533] text-gray-400 text-[10px] px-3 py-1 rounded-full border border-[#232e3c]">
              امروز • وضعیت اتصال بات: فعال (Active)
            </span>
          </div>

          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} max-w-[85%] ${
                  isUser ? 'mr-auto' : 'ml-auto'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#2b5278] text-white rounded-br-none shadow-sm'
                      : 'bg-[#182533] text-gray-100 rounded-bl-none border border-[#232e3c] shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400">
                    <span>{m.time}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-[#64b5f6]" />}
                  </div>
                </div>

                {/* Inline Keyboard Buttons */}
                {m.buttons && m.buttons.length > 0 && (
                  <div className="w-full grid gap-1.5 mt-2">
                    {m.buttons.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={btn.action}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2d3a4b] text-[#6ab2f2] font-bold text-xs border border-[#2f3e50] flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        <span>{btn.text}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Telegram Message Input Bar */}
        <form
          onSubmit={handleSend}
          className="bg-[#17212b] p-2.5 border-t border-[#232e3c] flex items-center gap-2"
          dir="rtl"
        >
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="پیام یا دستور /start یا /orders..."
            className="flex-1 bg-[#242f3d] border border-[#2f3e50] rounded-2xl py-2.5 px-4 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#5b5ce2]"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-2xl bg-[#5b5ce2] hover:bg-[#4849cb] text-white flex items-center justify-center transition shadow-md flex-none"
          >
            <Send className="w-4 h-4 -rotate-90" />
          </button>
        </form>
      </div>

      <div className="mt-3 text-center text-xs text-gray-500">
        💡 این محیط شبیه‌ساز واقعی ربات تلگرام است. کلیک روی «ورود به فروشگاه» Mini App را اجرا می‌کند.
      </div>
    </div>
  );
};
