'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import DashboardNav from '@/components/DashboardNav';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { getAuthUser } from '@/lib/authStore';
import {
  getAllUsersAsync,
  deleteUserAsync,
  updateUserAsync,
  addUserAsync,
  type User,
  type UserRole,
} from '@/lib/mockData';
import { getAllRidersAsync, updateRiderAvailabilityAsync, type DeliveryRider } from '@/lib/deliveryStore';
import {
  Users,
  Store,
  ShieldCheck,
  Bike,
  Star,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';

const ROLE_COLORS: Record<string, string> = {
  vendor: 'bg-blue-100 text-blue-800 border-blue-200',
  client: 'bg-green-100 text-green-800 border-green-200',
  ambassador: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-red-100 text-red-800 border-red-200',
  rider: 'bg-teal-100 text-teal-800 border-teal-200',
  towing: 'bg-purple-100 text-purple-800 border-purple-200',
  garage: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

function AdminContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleTab, setSelectedRoleTab] = useState<
    'all' | 'vendor' | 'client' | 'rider' | 'ambassador' | 'provider' | 'admin'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_location'>('all');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'client' as UserRole,
    password: '',
    city: 'Nairobi',
    whatsapp_number: '',
    is_active: true,
  });

  const { showToast } = useToast();
  const currentUser = getAuthUser();

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [freshUsers, freshRiders] = await Promise.all([
        getAllUsersAsync(),
        getAllRidersAsync(),
      ]);
      setUsers(freshUsers);
      setRiders(freshRiders);
    } catch {
      showToast('Error refreshing data. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void refreshData();
    const handleUpdates = () => {
      void refreshData();
    };

    window.addEventListener('hapo-users-updated', handleUpdates);
    window.addEventListener('storage', handleUpdates);

    return () => {
      window.removeEventListener('hapo-users-updated', handleUpdates);
      window.removeEventListener('storage', handleUpdates);
    };
  }, [refreshData]);

  // Statistics calculation
  const totals = useMemo(() => {
    const totalCount = users.length;
    const activeCount = users.filter((u) => u.is_active).length;
    const inactiveCount = users.filter((u) => !u.is_active).length;
    const vendorCount = users.filter((u) => u.role === 'vendor').length;
    const clientCount = users.filter((u) => u.role === 'client').length;
    const riderCount = users.filter((u) => u.role === 'rider').length;
    const ambassadorCount = users.filter((u) => u.role === 'ambassador').length;
    const providerCount = users.filter((u) => u.role === 'towing' || u.role === 'garage').length;

    return {
      totalUsers: totalCount,
      activeUsers: activeCount,
      inactiveUsers: inactiveCount,
      vendors: vendorCount,
      clients: clientCount,
      riders: riderCount,
      ambassadors: ambassadorCount,
      providers: providerCount,
      deliveryRiders: riders.length,
    };
  }, [users, riders]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role tab filter
      if (selectedRoleTab === 'vendor' && user.role !== 'vendor') return false;
      if (selectedRoleTab === 'client' && user.role !== 'client') return false;
      if (selectedRoleTab === 'rider' && user.role !== 'rider') return false;
      if (selectedRoleTab === 'ambassador' && user.role !== 'ambassador') return false;
      if (selectedRoleTab === 'admin' && user.role !== 'admin') return false;
      if (
        selectedRoleTab === 'provider' &&
        user.role !== 'towing' &&
        user.role !== 'garage'
      )
        return false;

      // Status filter
      if (statusFilter === 'active' && !user.is_active) return false;
      if (statusFilter === 'inactive' && user.is_active) return false;
      if (statusFilter === 'pending_location' && user.location_confirmed) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const city = (user.city || '').toLowerCase();
        const code = (user.ambassador_code || '').toLowerCase();
        const id = (user.id || '').toLowerCase();

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          city.includes(query) ||
          code.includes(query) ||
          id.includes(query)
        );
      }

      return true;
    });
  }, [users, selectedRoleTab, statusFilter, searchQuery]);

  // Actions: Delete User
  const handleDeleteUserConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const targetId = deleteTarget.id;
    const targetName = `${deleteTarget.first_name} ${deleteTarget.last_name}`;

    try {
      await deleteUserAsync(targetId);
      setUsers((prev) => prev.filter((u) => u.id !== targetId));
      showToast(`Account for ${targetName} deleted successfully.`, 'success');
      if (viewingUser?.id === targetId) {
        setViewingUser(null);
      }
    } catch {
      showToast('Unable to delete account. Please refresh and try again.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Actions: Toggle Active/Inactive
  const handleToggleActive = async (user: User) => {
    const nextStatus = !user.is_active;

    try {
      await updateUserAsync(user.id, { is_active: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
      if (viewingUser?.id === user.id) {
        setViewingUser({ ...viewingUser, is_active: nextStatus });
      }
      showToast(
        `Account for ${user.first_name} is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}.`,
        nextStatus ? 'success' : 'info'
      );
    } catch {
      showToast('Unable to update status. Please try again.', 'error');
    }
  };

  // Actions: Confirm Location
  const handleConfirmLocation = async (user: User) => {
    try {
      await updateUserAsync(user.id, { location_confirmed: true });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, location_confirmed: true } : u))
      );
      if (viewingUser?.id === user.id) {
        setViewingUser({ ...viewingUser, location_confirmed: true });
      }
      showToast(`Location verified & confirmed for ${user.first_name}.`, 'success');
    } catch {
      showToast('Unable to confirm location. Please try again.', 'error');
    }
  };

  // Actions: Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.first_name.trim() || !newUserForm.email.trim()) {
      showToast('First name and email are required.', 'error');
      return;
    }

    setIsSubmittingNewUser(true);
    try {
      const newId = `user-${Date.now()}`;
      const createdUser: User = {
        id: newId,
        first_name: newUserForm.first_name.trim(),
        last_name: newUserForm.last_name.trim(),
        email: newUserForm.email.trim().toLowerCase(),
        phone: newUserForm.phone.trim(),
        role: newUserForm.role,
        password: newUserForm.password || 'password123',
        city: newUserForm.city.trim() || 'Nairobi',
        whatsapp_number: newUserForm.whatsapp_number.trim() || newUserForm.phone.trim() || undefined,
        is_active: newUserForm.is_active,
        location_confirmed: true,
      };

      await addUserAsync(createdUser);
      setUsers((prev) => [createdUser, ...prev]);
      setIsAddUserOpen(false);
      setNewUserForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'client',
        password: '',
        city: 'Nairobi',
        whatsapp_number: '',
        is_active: true,
      });
      showToast(`User ${createdUser.first_name} created successfully!`, 'success');
    } catch {
      showToast('Failed to create user account.', 'error');
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Actions: Toggle Rider Availability
  const handleToggleRiderAvailability = async (rider: DeliveryRider) => {
    const nextAvailability = !rider.isAvailable;
    setRiders((prev) =>
      prev.map((r) => (r.id === rider.id ? { ...r, isAvailable: nextAvailability } : r))
    );
    try {
      await updateRiderAvailabilityAsync(rider.id, nextAvailability);
      showToast(
        `Rider ${rider.name} marked as ${nextAvailability ? 'AVAILABLE' : 'OFFLINE'}.`,
        'info'
      );
    } catch {
      showToast('Failed to update rider status.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
              <ShieldCheck size={26} className="text-red-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-card-foreground">Admin Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                  Live Control
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage accounts, activate/deactivate users, verify locations, and oversee operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-card-foreground text-sm font-semibold hover:bg-muted transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin text-primary' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-95 transition"
            >
              <UserPlus size={16} />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
          {[
            {
              label: 'Total Users',
              value: totals.totalUsers,
              icon: Users,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'Active Accounts',
              value: totals.activeUsers,
              icon: CheckCircle2,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Deactivated',
              value: totals.inactiveUsers,
              icon: XCircle,
              color: 'text-red-600',
              bg: 'bg-red-50',
            },
            {
              label: 'Vendors',
              value: totals.vendors,
              icon: Store,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
            {
              label: 'Bike Riders',
              value: totals.riders,
              icon: Bike,
              color: 'text-teal-600',
              bg: 'bg-teal-50',
            },
            {
              label: 'Ambassadors',
              value: totals.ambassadors,
              icon: Star,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="card p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={16} className={stat.color} />
                </div>
              </div>
              <p className={`text-2xl font-black font-tabular mt-2 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter and Search Controls */}
        <div className="card p-4 mb-6 space-y-4">
          {/* Top filter row: Search & Status dropdown */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search by name, email, phone, city, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Status:
              </span>
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'active', label: 'Active Only' },
                  { key: 'inactive', label: 'Deactivated' },
                  { key: 'pending_location', label: 'Pending Location' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === tab.key
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border pt-3">
            {[
              { key: 'all', label: 'All Accounts', count: users.length },
              { key: 'vendor', label: 'Vendors', count: totals.vendors },
              { key: 'client', label: 'Clients', count: totals.clients },
              { key: 'rider', label: 'Bike Riders', count: totals.riders },
              { key: 'ambassador', label: 'Ambassadors', count: totals.ambassadors },
              { key: 'provider', label: 'Service Providers', count: totals.providers },
              { key: 'admin', label: 'Admins', count: users.filter((u) => u.role === 'admin').length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedRoleTab(tab.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedRoleTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-card-foreground'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    selectedRoleTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-background text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Users Table Card */}
        <div className="card overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-card-foreground">
                {selectedRoleTab === 'all'
                  ? 'All Accounts'
                  : selectedRoleTab === 'vendor'
                    ? 'Registered Vendors'
                    : selectedRoleTab === 'client'
                      ? 'Registered Clients'
                      : selectedRoleTab === 'rider'
                        ? 'Delivery Bike Riders'
                        : selectedRoleTab === 'ambassador'
                          ? 'Ambassadors'
                          : selectedRoleTab === 'provider'
                            ? 'Garage & Towing Providers'
                            : 'Administrators'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching criteria
              </p>
            </div>

            {selectedRoleTab === 'rider' && (
              <span className="text-xs text-muted-foreground bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1 rounded-lg font-medium">
                🏍️ {riders.length} registered bike fleet active
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    City / Location
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Account Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Admin Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={32} className="text-muted-foreground/50" />
                        <p className="font-semibold text-card-foreground">No accounts found</p>
                        <p className="text-xs">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isCurrentUser = currentUser?.id === user.id;
                    return (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        {/* User Details */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                              {user.first_name?.[0]?.toUpperCase() || 'U'}
                              {user.last_name?.[0]?.toUpperCase() || ''}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-card-foreground">
                                  {user.first_name} {user.last_name}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              {user.phone && (
                                <p className="text-[11px] text-muted-foreground/80 font-mono mt-0.5">
                                  {user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                              ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* City / Location */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-card-foreground">
                              {user.city || '—'}
                            </span>
                            {user.location_lat && user.location_lng ? (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {user.location_lat.toFixed(4)}, {user.location_lng.toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-600 font-medium">
                                No GPS Set
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Verification & Location status */}
                        <td className="px-5 py-3.5">
                          {user.location_confirmed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Confirmed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConfirmLocation(user)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition shadow-sm"
                              title="Click to confirm location"
                            >
                              <AlertTriangle size={12} className="text-amber-600" />
                              Confirm Loc
                            </button>
                          )}
                        </td>

                        {/* Account Status */}
                        <td className="px-5 py-3.5">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-600" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* View Profile details */}
                            <button
                              type="button"
                              onClick={() => setViewingUser(user)}
                              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-card-foreground hover:bg-muted transition"
                              title="View account details"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Activate / Deactivate Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(user)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                user.is_active
                                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
                              }`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Delete User Account Button (High Priority) */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(user)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-300 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition shadow-sm"
                              title="Delete account permanently"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rider Oversight Section (when Rider tab or All tab is selected) */}
        {selectedRoleTab === 'rider' && riders.length > 0 && (
          <div className="mt-8 card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-teal-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-teal-950 flex items-center gap-2">
                  <Bike size={18} className="text-teal-600" />
                  Active Rider Delivery Fleet & Dispatch Status
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitor delivery rates, vehicle types, service areas, and availability
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Rider</th>
                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Bike Type</th>
                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Service Areas</th>
                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Pricing</th>
                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Rating / Deliveries</th>
                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Availability</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {riders.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition">
                      <td className="px-5 py-3 font-semibold text-card-foreground">
                        {r.name}
                        <p className="text-xs text-muted-foreground font-normal">{r.phone}</p>
                      </td>
                      <td className="px-5 py-3 capitalize text-muted-foreground">{r.bikeType}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {r.serviceAreas?.join(', ') || r.city || 'Nairobi'}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        KES {r.basePrice} base + KES {r.pricePerKm}/km
                      </td>
                      <td className="px-5 py-3 text-xs">
                        ⭐ {r.rating || 5.0} ({r.totalDeliveries || 0} completed)
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            r.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.isAvailable ? 'Available' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleRiderAvailability(r)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border hover:bg-muted"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL 1: Confirm Delete User ────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUserConfirm}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for ${deleteTarget?.first_name} ${deleteTarget?.last_name} (${deleteTarget?.email})? This action cannot be undone and will immediately remove their profile.`}
        confirmLabel="Delete Account"
        isLoading={isDeleting}
      />

      {/* ─── MODAL 2: View User Details ──────────────────────────────────────── */}
      {viewingUser && (
        <Modal
          isOpen={true}
          onClose={() => setViewingUser(null)}
          title={`User Profile: ${viewingUser.first_name} ${viewingUser.last_name}`}
          size="md"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  {viewingUser.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-card-foreground text-base">
                    {viewingUser.first_name} {viewingUser.last_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{viewingUser.email}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                  ROLE_COLORS[viewingUser.role] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {viewingUser.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/50 p-3 rounded-xl">
                <p className="text-muted-foreground font-semibold">User ID</p>
                <p className="font-mono text-card-foreground mt-0.5 break-all">{viewingUser.id}</p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl">
                <p className="text-muted-foreground font-semibold">Phone Number</p>
                <p className="font-mono text-card-foreground mt-0.5">
                  {viewingUser.phone || 'Not provided'}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl">
                <p className="text-muted-foreground font-semibold">WhatsApp Number</p>
                <p className="font-mono text-card-foreground mt-0.5">
                  {viewingUser.whatsapp_number || viewingUser.phone || 'Not provided'}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded-xl">
                <p className="text-muted-foreground font-semibold">City / Location</p>
                <p className="text-card-foreground font-medium mt-0.5">
                  {viewingUser.city || 'Nairobi'}
                </p>
              </div>
              {viewingUser.ambassador_code && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl col-span-2">
                  <p className="text-amber-800 font-semibold">Ambassador Referral Code</p>
                  <p className="font-mono font-bold text-amber-900 mt-0.5">
                    {viewingUser.ambassador_code}
                  </p>
                </div>
              )}
              {viewingUser.referred_by && (
                <div className="bg-muted/50 p-3 rounded-xl col-span-2">
                  <p className="text-muted-foreground font-semibold">Referred By</p>
                  <p className="font-mono text-card-foreground mt-0.5">{viewingUser.referred_by}</p>
                </div>
              )}
            </div>

            {/* Account Status Flags */}
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <div>
                <p className="text-xs font-bold text-card-foreground">Account Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {viewingUser.is_active ? 'Account is active and can sign in.' : 'Account is deactivated.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(viewingUser)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  viewingUser.is_active
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                }`}
              >
                {viewingUser.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
              <div>
                <p className="text-xs font-bold text-card-foreground">Location Verification</p>
                <p className="text-[11px] text-muted-foreground">
                  {viewingUser.location_confirmed
                    ? 'Location confirmed and calibrated.'
                    : 'Location confirmation is pending.'}
                </p>
              </div>
              {!viewingUser.location_confirmed && (
                <button
                  type="button"
                  onClick={() => handleConfirmLocation(viewingUser)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Confirm Location
                </button>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(viewingUser);
                  setViewingUser(null);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-bold hover:bg-red-600 hover:text-white transition"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL 3: Add New User ─────────────────────────────────────────── */}
      {isAddUserOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddUserOpen(false)}
          title="Create New User Account"
          size="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amina"
                  value={newUserForm.first_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wanjiku"
                  value={newUserForm.last_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="user@hapo.co.ke"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+254712345678"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Account Role *
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="client">Client</option>
                  <option value="vendor">Vendor</option>
                  <option value="rider">Bike Rider</option>
                  <option value="ambassador">Ambassador</option>
                  <option value="towing">Towing Provider</option>
                  <option value="garage">Garage Provider</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  placeholder="Nairobi"
                  value={newUserForm.city}
                  onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Defaults to password123"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="new-active"
                type="checkbox"
                checked={newUserForm.is_active}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded accent-primary"
              />
              <label htmlFor="new-active" className="text-xs font-semibold text-card-foreground">
                Set account as Active immediately
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingNewUser}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50"
              >
                {isSubmittingNewUser ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <RoleGuard allowedRole="admin">
        <AdminContent />
      </RoleGuard>
    </ToastProvider>
  );
}
