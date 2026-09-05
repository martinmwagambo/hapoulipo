'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Shield,
  Moon,
  Globe,
  Smartphone,
  ChevronRight,
  KeyRound,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { getAuthUser } from '@/lib/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserAsync } from '@/lib/mockData';
import Modal from '@/components/ui/Modal';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold text-card-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    orderUpdates: true,
    marketingEmails: false,
    twoFactor: false,
    darkMode: false,
    language: 'English',
  });

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const u = getAuthUser();
    if (!u) {
      router.push('/');
      return;
    }

    const savedTheme = localStorage.getItem('hapo-theme');
    const isDark = savedTheme === 'dark' || document.documentElement.classList.contains('dark');

    // Load saved settings from localStorage
    const saved = localStorage.getItem('hapo_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...parsed, darkMode: isDark });
      } catch {
        setSettings((s) => ({ ...s, darkMode: isDark }));
      }
    } else {
      setSettings((s) => ({ ...s, darkMode: isDark }));
    }

    setMounted(true);
  }, [router]);

  const update = (key: keyof typeof settings, value: boolean | string) => {
    if (key === 'darkMode') {
      const isDark = Boolean(value);
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('hapo-theme', isDark ? 'dark' : 'light');
    }

    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('hapo_settings', JSON.stringify(next));
      return next;
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (!user) {
      setPasswordError('User session not found.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserAsync(user.id, { password: newPassword });
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch {
      setPasswordError('Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        {/* Notifications */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <Bell size={18} className="text-primary" />
            <h2 className="font-bold text-card-foreground">Notifications</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Manage how you receive alerts and updates
          </p>
          <div className="divide-y divide-border">
            <ToggleRow
              label="Email Notifications"
              description="Receive updates and alerts via email"
              checked={settings.emailNotifications}
              onChange={(v) => update('emailNotifications', v)}
            />
            <ToggleRow
              label="Push Notifications"
              description="Get real-time alerts on your device"
              checked={settings.pushNotifications}
              onChange={(v) => update('pushNotifications', v)}
            />
            <ToggleRow
              label="Order Updates"
              description="Be notified when order status changes"
              checked={settings.orderUpdates}
              onChange={(v) => update('orderUpdates', v)}
            />
            <ToggleRow
              label="Marketing Emails"
              description="Receive promotions and platform news"
              checked={settings.marketingEmails}
              onChange={(v) => update('marketingEmails', v)}
            />
          </div>
        </div>

        {/* Security */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <Shield size={18} className="text-blue-600" />
            <h2 className="font-bold text-card-foreground">Security</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Keep your account safe</p>
          <div className="divide-y divide-border">
            <ToggleRow
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              checked={settings.twoFactor}
              onChange={(v) => update('twoFactor', v)}
            />
          </div>
          <div className="mt-3">
            <button
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess(false);
                setIsPasswordModalOpen(true);
              }}
              className="flex items-center justify-between w-full py-3 text-sm text-card-foreground hover:text-primary transition-colors group"
            >
              <span className="font-medium">Change Password</span>
              <ChevronRight
                size={16}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <Moon size={18} className="text-amber-500" />
            <h2 className="font-bold text-card-foreground">Appearance</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Customize how the app looks</p>
          <div className="divide-y divide-border">
            <ToggleRow
              label="Dark Mode"
              description="Switch between light and dark theme"
              checked={settings.darkMode}
              onChange={(v) => update('darkMode', v)}
            />
          </div>
        </div>

        {/* Language */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-2.5 mb-4">
            <Globe size={18} className="text-primary" />
            <h2 className="font-bold text-card-foreground">Language & Region</h2>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Display Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => update('language', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option>English</option>
              <option>Swahili</option>
            </select>
          </div>
        </div>

        {/* App info */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Smartphone size={18} className="text-muted-foreground" />
            <h2 className="font-bold text-card-foreground">About</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App Name</span>
              <span className="font-medium text-card-foreground">Hapo Ulipo Services</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-card-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium text-card-foreground">Web</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPasswordModalOpen(false)}
          title="Change Password"
          size="sm"
        >
          <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={16} />
                Password updated successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <KeyRound size={15} /> Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
