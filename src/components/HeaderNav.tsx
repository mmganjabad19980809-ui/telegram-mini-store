import React from 'react';
import { Smartphone, Bot, Terminal, ShieldCheck, ShoppingBag, Globe, Cpu } from 'lucide-react';
import { StoreConfig } from '../types/store';

interface HeaderNavProps {
  currentView: 'store' | 'bot' | 'cli';
  onSelectView: (view: 'store' | 'bot' | 'cli') => void;
  config: StoreConfig;
  onOpenAdmin: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentView,
  onSelectView,
  config,
  onOpenAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#171936] text-white border-b border-[#2d3066] shadow-md px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Platform Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5b5ce2] to-[#7c5cff] flex items-center justify-center font-black text-white text-base shadow-lg shadow-[#5b5ce244]">
              TSM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white">TSM STORE</span>
                <span className="bg-[#12b76a]/20 text-[#12b76a] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#12b76a]/30">
                  v1.8
                </span>
              </div>
              <p className="text-[11px] text-[#9ca3cf]">
                هویت فعال: <strong className="text-white font-medium">{config.storeName}</strong>
              </p>
            </div>
          </div>

          {/* Quick System Indicators (Mobile right side) */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onOpenAdmin}
              className="text-xs bg-[#ffffff15] hover:bg-[#ffffff25] text-white px-2.5 py-1 rounded-lg border border-[#ffffff20] flex items-center gap-1 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#a5b4fc]" />
              <span>مدیریت</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#0f1124] p-1 rounded-xl border border-[#2d3066] w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => onSelectView('store')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'store'
                ? 'bg-gradient-to-r from-[#5b5ce2] to-[#7c5cff] text-white shadow-md'
                : 'text-[#a2a7cf] hover:text-white hover:bg-[#ffffff10]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>مینی‌اپ تلگرام</span>
          </button>

          <button
            onClick={() => onSelectView('bot')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'bot'
                ? 'bg-gradient-to-r from-[#5b5ce2] to-[#7c5cff] text-white shadow-md'
                : 'text-[#a2a7cf] hover:text-white hover:bg-[#ffffff10]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>شبیه‌ساز ربات</span>
          </button>

          <button
            onClick={() => onSelectView('cli')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentView === 'cli'
                ? 'bg-gradient-to-r from-[#5b5ce2] to-[#7c5cff] text-white shadow-md'
                : 'text-[#a2a7cf] hover:text-white hover:bg-[#ffffff10]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>ترمینال سرور TSM</span>
          </button>
        </div>

        {/* Desktop Quick Info & Admin */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3cf] bg-[#0f1124] px-2.5 py-1 rounded-lg border border-[#2d3066]">
            <Globe className="w-3 h-3 text-[#12b76a]" />
            <span>Port: {config.backendPort}</span>
            <span className="text-gray-500">•</span>
            <span>Tunnel: 443</span>
          </div>

          <button
            onClick={onOpenAdmin}
            className="text-xs bg-gradient-to-r from-[#ffffff18] to-[#ffffff25] hover:bg-[#ffffff30] text-white px-3 py-1.5 rounded-lg border border-[#ffffff30] flex items-center gap-1.5 font-bold transition shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#a5b4fc]" />
            <span>پنل مدیریت</span>
          </button>
        </div>
      </div>
    </header>
  );
};
