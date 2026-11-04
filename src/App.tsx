/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  StoreConfig,
  Category,
  Product,
  Order,
  AdminSecurityConfig,
  SupportTicket,
} from './types/store';
import {
  getStoredConfig,
  saveStoredConfig,
  getStoredAdminConfig,
  saveStoredAdminConfig,
  getStoredCategories,
  saveStoredCategories,
  getStoredProducts,
  saveStoredProducts,
  getStoredOrders,
  saveStoredOrders,
  getStoredTickets,
  saveStoredTickets,
  resetToDefaults,
} from './services/storeStorage';
import { HeaderNav } from './components/HeaderNav';
import { CustomerStore } from './components/CustomerStore';
import { AdminPanel } from './components/AdminPanel';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { ServerInstallerCli } from './components/ServerInstallerCli';

export default function App() {
  // Store persistent states
  const [config, setConfig] = useState<StoreConfig>(getStoredConfig);
  const [adminConfig, setAdminConfig] = useState<AdminSecurityConfig>(getStoredAdminConfig);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [orders, setOrders] = useState<Order[]>(getStoredOrders);
  const [tickets, setTickets] = useState<SupportTicket[]>(getStoredTickets);

  // Active top-level mode
  const [currentView, setCurrentView] = useState<'store' | 'bot' | 'cli'>('store');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Listen for Alt+A shortcut to open Admin Panel (from store_v18.html)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update handlers with automatic storage persistence
  const handleUpdateConfig = (newCfg: StoreConfig) => {
    setConfig(newCfg);
    saveStoredConfig(newCfg);
  };

  const handleUpdateAdminConfig = (newCfg: AdminSecurityConfig) => {
    setAdminConfig(newCfg);
    saveStoredAdminConfig(newCfg);
  };

  const handleUpdateProducts = (newProds: Product[]) => {
    setProducts(newProds);
    saveStoredProducts(newProds);
  };

  const handleUpdateOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    saveStoredOrders(newOrders);
  };

  const handleUpdateCategories = (newCats: Category[]) => {
    setCategories(newCats);
    saveStoredCategories(newCats);
  };

  const handleUpdateTickets = (newTickets: SupportTicket[]) => {
    setTickets(newTickets);
    saveStoredTickets(newTickets);
  };

  const handleCreateOrder = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveStoredOrders(updated);

    // Also decrease stock for the chosen plan
    const updatedProducts = products.map((p) => {
      if (p.id === newOrder.productId) {
        return {
          ...p,
          plans: p.plans.map((pl) => {
            if (pl.id === newOrder.planId || pl.name === newOrder.plan) {
              return { ...pl, stock: Math.max(0, pl.stock - 1) };
            }
            return pl;
          }),
        };
      }
      return p;
    });
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
  };

  const handleCreateTicket = (newTicket: SupportTicket) => {
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveStoredTickets(updated);
  };

  const handleResetFactory = () => {
    resetToDefaults();
    setConfig(getStoredConfig());
    setAdminConfig(getStoredAdminConfig());
    setCategories(getStoredCategories());
    setProducts(getStoredProducts());
    setOrders(getStoredOrders());
    setTickets(getStoredTickets());
    setIsAdminOpen(false);
  };

  // Check if developer tools mode is requested via URL query e.g. ?dev=true
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=true');

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col text-[#101828]">
      {/* Dev Switcher ONLY shown if ?dev=true is present; customer never sees this */}
      {isDevMode && (
        <HeaderNav
          currentView={currentView}
          onSelectView={(v) => {
            setCurrentView(v);
            setIsAdminOpen(false);
          }}
          config={config}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      )}

      {/* Main App Body */}
      <div className="flex-1 pb-6">
        {isAdminOpen ? (
          <AdminPanel
            config={config}
            adminConfig={adminConfig}
            categories={categories}
            products={products}
            orders={orders}
            tickets={tickets}
            onClose={() => setIsAdminOpen(false)}
            onUpdateConfig={handleUpdateConfig}
            onUpdateAdminConfig={handleUpdateAdminConfig}
            onUpdateProducts={handleUpdateProducts}
            onUpdateOrders={handleUpdateOrders}
            onUpdateCategories={handleUpdateCategories}
            onUpdateTickets={handleUpdateTickets}
            onResetDefaults={handleResetFactory}
          />
        ) : (
          <>
            {currentView === 'store' && (
              <CustomerStore
                config={config}
                categories={categories}
                products={products}
                orders={orders}
                tickets={tickets}
                onOpenAdmin={() => setIsAdminOpen(true)}
                onCreateOrder={handleCreateOrder}
                onCreateTicket={handleCreateTicket}
              />
            )}

            {currentView === 'bot' && (
              <TelegramBotSimulator
                config={config}
                orders={orders}
                onOpenStore={() => setCurrentView('store')}
                onOpenSupport={() => {
                  setCurrentView('store');
                }}
              />
            )}

            {currentView === 'cli' && (
              <ServerInstallerCli
                config={config}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
