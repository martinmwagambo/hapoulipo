'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Briefcase, ArrowLeft, Edit2, Save, X, Loader2 } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserAsync } from '@/lib/mockData';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
  });
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      city: user.city ?? '',
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMessage('');

    try {
      const updates = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
      };

      await updateProfile(updates);
      await updateUserAsync(user.id, updates);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrorMessage('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setForm({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      city: user.city ?? '',
    });
    setEditing(false);
    setErrorMessage('');
  };

  const ROLE_COLORS: Record<string, string> = {
    vendor: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    ambassador: 'bg-amber-100 text-amber-700',
    admin: 'bg-red-100 text-red-700',
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'U';

  if (!user) return null;

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

        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: '#2d8a4e' }}
              >
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-card-foreground">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.role && (
                  <span
                    className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {user.role}
                  </span>
                )}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors"
              >
                <Edit2 size={14} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* Success banner */}
        {saved && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            ✓ Profile updated successfully
          </div>
        )}

        {/* Profile details */}
        <div className="card p-6">
          <h2 className="font-bold text-card-foreground mb-5">Personal Information</h2>
          <div className="space-y-5">
            {/* First name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-sm text-card-foreground">
                    <User size={15} className="text-muted-foreground flex-shrink-0" />
                    {user.first_name || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                ) : (
                  <div className="flex items-center gap-2.5 text-sm text-card-foreground">
                    <User size={15} className="text-muted-foreground flex-shrink-0" />
                    {user.last_name || (
                      <span className="text-muted-foreground italic">Not set</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2.5 text-sm text-card-foreground">
                <Mail size={15} className="text-muted-foreground flex-shrink-0" />
                {user.email || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+254 700 000 000"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : (
                <div className="flex items-center gap-2.5 text-sm text-card-foreground">
                  <Phone size={15} className="text-muted-foreground flex-shrink-0" />
                  {user.phone || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </div>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                City
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Nairobi"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : (
                <div className="flex items-center gap-2.5 text-sm text-card-foreground">
                  <MapPin size={15} className="text-muted-foreground flex-shrink-0" />
                  {user.city || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </div>
              )}
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Role
              </label>
              <div className="flex items-center gap-2.5 text-sm text-card-foreground">
                <Briefcase size={15} className="text-muted-foreground flex-shrink-0" />
                <span className="capitalize">{user.role}</span>
                <span className="text-xs text-muted-foreground">(cannot be changed)</span>
              </div>
            </div>
          </div>

          {/* Edit actions */}
          {editing && (
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X size={15} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
