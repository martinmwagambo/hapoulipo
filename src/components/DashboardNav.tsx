'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Bell,
  ChevronDown,
  User,
  Settings,
  ShoppingBag,
  Bike,
  LayoutDashboard,
  Truck,
  ShieldCheck,
  Star,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { getAuthUser, clearAuthUser } from '@/lib/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { getCartItems } from '@/lib/cartStore';

export default function DashboardNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const { signOut } = useAuth();
  const user = getAuthUser();

  useEffect(() => {
    const syncCartCount = () =>
      setCartCount(getCartItems().reduce((sum, item) => sum + item.quantity, 0));
    syncCartCount();

    window.addEventListener('storage', syncCartCount);
    window.addEventListener('focus', syncCartCount);

    return () => {
      window.removeEventListener('storage', syncCartCount);
      window.removeEventListener('focus', syncCartCount);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      clearAuthUser();
    }
    router.push('/');
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const ROLE_COLORS: Record<string, string> = {
    vendor: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    ambassador: 'bg-amber-100 text-amber-700',
    admin: 'bg-red-100 text-red-700',
    towing: 'bg-purple-100 text-purple-700',
    garage: 'bg-indigo-100 text-indigo-700',
    rider: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <nav
      className="sticky top-0 z-40 border-b border-white/10 px-4 lg:px-8 h-16 flex items-center justify-between"
      style={{ backgroundColor: '#1a2744' }}
    >
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-3">
        <AppLogo size={38} className="rounded-lg overflow-hidden" />
        <div className="hidden sm:block">
          <span className="font-bold text-base text-white tracking-tight leading-none block">
            Hapo Ulipo Services
          </span>
          <span className="text-xs font-medium leading-none" style={{ color: '#f07c2a' }}>
            Anything. Anytime. Right at your door.
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          onClick={() => setNotificationsOpen((value) => !value)}
          className="relative p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-150"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
        >
          <Bell size={20} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#f07c2a' }}
          />
        </button>
        {notificationsOpen && (
          <div className="absolute right-24 top-14 z-50 w-72 rounded-2xl border border-border bg-card p-4 text-card-foreground card-shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Notifications</p>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">You have no new notifications.</p>
          </div>
        )}

        {user?.role === 'client' && (
          <button
            onClick={() => router.push('/checkout')}
            className="relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            aria-label="View cart"
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="rounded-full bg-[#f07c2a] px-2 py-0.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-150"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: '#2d8a4e' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-white leading-none">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-white/60 capitalize mt-0.5">{user?.role}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-white/60 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-card rounded-2xl border border-border card-shadow-md z-50 animate-slide-up overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-bold text-card-foreground">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  {user?.role && (
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {user.role}
                    </span>
                  )}
                </div>
                {/* Actions */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                  >
                    <User size={16} className="text-muted-foreground" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                  >
                    <Settings size={16} className="text-muted-foreground" /> Settings
                  </button>
                  {user?.role === 'vendor' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/vendor-orders');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                    >
                      <ShoppingBag size={16} className="text-muted-foreground" /> My Orders
                    </button>
                  )}
                  {user?.role === 'client' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/client-orders');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                    >
                      <ShoppingBag size={16} className="text-muted-foreground" /> My Orders
                    </button>
                  )}
                  {user?.role === 'rider' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/rider-dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-muted-foreground" /> My Dashboard
                    </button>
                  )}
                  {(user?.role === 'towing' || user?.role === 'garage') && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/provider-dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                    >
                      <Truck size={16} className="text-muted-foreground" /> Provider Dashboard
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/admin');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <ShieldCheck size={16} className="text-red-600" /> Admin Portal
                    </button>
                  )}
                  {user?.role === 'ambassador' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/ambassador-dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                    >
                      <Star size={16} className="text-amber-600" /> Ambassador Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/bike-delivery');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-card-foreground hover:bg-muted transition-colors"
                  >
                    <Bike size={16} className="text-muted-foreground" /> Bike Delivery
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
