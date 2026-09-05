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
  generateAmbassadorCode,
  type User,
  type UserRole,
  type VendorItem,
} from '@/lib/mockData';
import {
  getAllRidersAsync,
  updateRiderAvailabilityAsync,
  deleteRiderByUserIdAsync,
  registerRiderAsync,
  getAllDeliveryRequestsAsync,
  updateDeliveryRequestStatusAsync,
  type DeliveryRider,
  type DeliveryRequest,
} from '@/lib/deliveryStore';
import {
  getAllOrdersAsync,
  updateOrderStatusAsync,
  type VendorOrder,
  type VendorOrderStatus,
} from '@/lib/ordersStore';
import {
  getAllItemsAsync,
  toggleAvailabilityAsync,
  deleteItemAsync,
} from '@/lib/vendorItemsStore';
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
  Edit3,
  ShoppingBag,
  Package,
  Download,
  Truck,
  DollarSign,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Modal from '@/components/ui/Modal';

const ROLE_COLORS: Record<string, string> = {
  vendor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  client: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  ambassador: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  admin: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  rider: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  towing: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  garage: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
};

function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function AdminContent() {
  // Main Section Navigation
  const [activeSection, setActiveSection] = useState<'users' | 'orders' | 'catalog'>('users');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [riders, setRiders] = useState<DeliveryRider[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [catalogItems, setCatalogItems] = useState<VendorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User Section Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleTab, setSelectedRoleTab] = useState<
    'all' | 'vendor' | 'client' | 'rider' | 'ambassador' | 'provider' | 'admin'
  >('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending_location'>('all');

  // Orders Section Filters
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');
  const [ordersSubTab, setOrdersSubTab] = useState<'store' | 'dispatch'>('store');

  // Catalog Section Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditingSaving, setIsEditingSaving] = useState(false);

  // Item deletion state
  const [deleteItemTarget, setDeleteItemTarget] = useState<VendorItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Add User Form State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
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

  // Load all platform data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [freshUsers, freshRiders, freshOrders, freshRequests, freshItems] = await Promise.all([
        getAllUsersAsync(),
        getAllRidersAsync(),
        getAllOrdersAsync(),
        getAllDeliveryRequestsAsync(),
        getAllItemsAsync(),
      ]);
      setUsers(freshUsers);
      setRiders(freshRiders);
      setOrders(freshOrders);
      setDeliveryRequests(freshRequests);
      setCatalogItems(freshItems);
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
    window.addEventListener('vendor-items-updated', handleUpdates);

    return () => {
      window.removeEventListener('hapo-users-updated', handleUpdates);
      window.removeEventListener('storage', handleUpdates);
      window.removeEventListener('vendor-items-updated', handleUpdates);
    };
  }, [refreshData]);

  // Statistics summary
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.is_active).length;
    const inactiveUsers = users.filter((u) => !u.is_active).length;
    const vendors = users.filter((u) => u.role === 'vendor').length;
    const clients = users.filter((u) => u.role === 'client').length;
    const bikeRiders = riders.length;
    const ambassadors = users.filter((u) => u.role === 'ambassador').length;
    const providers = users.filter((u) => u.role === 'towing' || u.role === 'garage').length;
    const admins = users.filter((u) => u.role === 'admin').length;

    const totalOrders = orders.length;
    const totalGrossRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalDeliveries = deliveryRequests.length;
    const totalProducts = catalogItems.length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      vendors,
      clients,
      bikeRiders,
      ambassadors,
      providers,
      admins,
      totalOrders,
      totalGrossRevenue,
      totalDeliveries,
      totalProducts,
    };
  }, [users, riders, orders, deliveryRequests, catalogItems]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (selectedRoleTab === 'vendor' && user.role !== 'vendor') return false;
      if (selectedRoleTab === 'client' && user.role !== 'client') return false;
      if (selectedRoleTab === 'rider' && user.role !== 'rider') return false;
      if (selectedRoleTab === 'ambassador' && user.role !== 'ambassador') return false;
      if (selectedRoleTab === 'admin' && user.role !== 'admin') return false;
      if (selectedRoleTab === 'provider' && user.role !== 'towing' && user.role !== 'garage')
        return false;

      if (statusFilter === 'active' && !user.is_active) return false;
      if (statusFilter === 'inactive' && user.is_active) return false;
      if (statusFilter === 'pending_location' && user.location_confirmed) return false;

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

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (ordersSearch.trim()) {
        const q = ordersSearch.toLowerCase().trim();
        return (
          o.orderId.toLowerCase().includes(q) ||
          o.itemName.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.buyerEmail.toLowerCase().includes(q) ||
          o.buyerPhone.toLowerCase().includes(q) ||
          o.deliveryAddress.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, orderStatusFilter, ordersSearch]);

  // Filtered delivery requests
  const filteredDeliveryRequests = useMemo(() => {
    return deliveryRequests.filter((r) => {
      if (ordersSearch.trim()) {
        const q = ordersSearch.toLowerCase().trim();
        return (
          r.id.toLowerCase().includes(q) ||
          r.clientName.toLowerCase().includes(q) ||
          r.clientPhone.toLowerCase().includes(q) ||
          r.pickupAddress.toLowerCase().includes(q) ||
          r.deliveryAddress.toLowerCase().includes(q) ||
          (r.orderId && r.orderId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [deliveryRequests, ordersSearch]);

  // Filtered catalog items
  const filteredCatalogItems = useMemo(() => {
    return catalogItems.filter((item) => {
      if (catalogCategory !== 'all' && item.category !== catalogCategory) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        return (
          item.item_name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.vendor_name && item.vendor_name.toLowerCase().includes(q)) ||
          (item.city && item.city.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [catalogItems, catalogCategory, catalogSearch]);

  // Actions: Delete User (with self-delete guard)
  const handleDeleteUserConfirm = async () => {
    if (!deleteTarget) return;
    if (currentUser?.id === deleteTarget.id) {
      showToast('Safety check: You cannot delete your own active administrator account.', 'error');
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    const targetId = deleteTarget.id;
    const targetName = `${deleteTarget.first_name} ${deleteTarget.last_name}`;

    try {
      await deleteUserAsync(targetId);
      if (deleteTarget.role === 'rider') {
        await deleteRiderByUserIdAsync(targetId);
        setRiders((prev) => prev.filter((r) => r.userId !== targetId && r.id !== targetId));
      }
      setUsers((prev) => prev.filter((u) => u.id !== targetId));
      showToast(`Account for ${targetName} deleted successfully.`, 'success');
      if (viewingUser?.id === targetId) setViewingUser(null);
      if (editingUser?.id === targetId) setEditingUser(null);
    } catch {
      showToast('Unable to delete account. Please refresh and try again.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Actions: Toggle Active/Inactive (with self-deactivate guard)
  const handleToggleActive = async (user: User) => {
    if (currentUser?.id === user.id) {
      showToast('Safety check: You cannot deactivate your own active administrator account.', 'error');
      return;
    }

    const nextStatus = !user.is_active;
    try {
      await updateUserAsync(user.id, { is_active: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
      if (viewingUser?.id === user.id) {
        setViewingUser({ ...viewingUser, is_active: nextStatus });
      }
      if (editingUser?.id === user.id) {
        setEditingUser({ ...editingUser, is_active: nextStatus });
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

  // Actions: Create New User (with ambassador code & rider registration)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.first_name.trim() || !newUserForm.email.trim()) {
      showToast('First name and email are required.', 'error');
      return;
    }

    setIsSubmittingNewUser(true);
    try {
      const newId = `user-${Date.now()}`;
      const code = newUserForm.role === 'ambassador' ? generateAmbassadorCode() : undefined;

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
        ambassador_code: code,
        is_active: newUserForm.is_active,
        location_confirmed: true,
      };

      await addUserAsync(createdUser);

      // If creating a rider, also register in delivery fleet
      if (newUserForm.role === 'rider') {
        const newRider = await registerRiderAsync({
          userId: newId,
          name: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
          phone: createdUser.phone || '+254700000000',
          email: createdUser.email,
          bikeType: 'motorcycle',
          serviceAreas: [createdUser.city || 'Nairobi'],
          pricePerKm: 50,
          basePrice: 100,
          isAvailable: true,
          city: createdUser.city || 'Nairobi',
        });
        setRiders((prev) => [newRider, ...prev]);
      }

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
      showToast(
        `User ${createdUser.first_name} created successfully as ${createdUser.role}!`,
        'success'
      );
    } catch {
      showToast('Failed to create user account.', 'error');
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Actions: Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editingUser.first_name.trim() || !editingUser.email.trim()) {
      showToast('First name and email are required.', 'error');
      return;
    }

    setIsEditingSaving(true);
    try {
      const updates: Partial<User> = {
        first_name: editingUser.first_name.trim(),
        last_name: editingUser.last_name.trim(),
        email: editingUser.email.trim().toLowerCase(),
        phone: editingUser.phone?.trim() || '',
        whatsapp_number: editingUser.whatsapp_number?.trim() || undefined,
        city: editingUser.city?.trim() || 'Nairobi',
        role: editingUser.role,
        is_active: editingUser.is_active,
        location_confirmed: editingUser.location_confirmed,
      };

      // Auto-assign ambassador code if converting to ambassador without code
      if (editingUser.role === 'ambassador' && !editingUser.ambassador_code) {
        updates.ambassador_code = generateAmbassadorCode();
      }

      await updateUserAsync(editingUser.id, updates);

      // If updated to rider, make sure they are registered
      if (editingUser.role === 'rider') {
        const existingRider = riders.find((r) => r.userId === editingUser.id || r.id === editingUser.id);
        if (!existingRider) {
          const registered = await registerRiderAsync({
            userId: editingUser.id,
            name: `${updates.first_name} ${updates.last_name}`.trim(),
            phone: updates.phone || '+254700000000',
            email: updates.email || '',
            bikeType: 'motorcycle',
            serviceAreas: [updates.city || 'Nairobi'],
            pricePerKm: 50,
            basePrice: 100,
            isAvailable: true,
            city: updates.city || 'Nairobi',
          });
          setRiders((prev) => [registered, ...prev]);
        }
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...updates } : u))
      );
      if (viewingUser?.id === editingUser.id) {
        setViewingUser({ ...viewingUser, ...updates });
      }
      setEditingUser(null);
      showToast(`Account for ${updates.first_name} updated successfully.`, 'success');
    } catch {
      showToast('Failed to save user updates.', 'error');
    } finally {
      setIsEditingSaving(false);
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

  // Actions: Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: VendorOrderStatus) => {
    try {
      const ok = await updateOrderStatusAsync(orderId, newStatus);
      if (ok) {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
        );
        showToast(`Order ${orderId} updated to ${newStatus.toUpperCase()}.`, 'success');
      } else {
        showToast('Failed to update order status.', 'error');
      }
    } catch {
      showToast('Error updating order status.', 'error');
    }
  };

  // Actions: Update Delivery Request Status
  const handleUpdateDeliveryStatus = async (requestId: string, newStatus: DeliveryRequest['status']) => {
    try {
      const ok = await updateDeliveryRequestStatusAsync(requestId, newStatus);
      if (ok) {
        setDeliveryRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
        );
        showToast(`Dispatch request ${requestId} updated to ${newStatus.toUpperCase()}.`, 'success');
      } else {
        showToast('Failed to update dispatch request.', 'error');
      }
    } catch {
      showToast('Error updating dispatch status.', 'error');
    }
  };

  // Actions: Toggle Item Availability
  const handleToggleItemAvailability = async (item: VendorItem) => {
    try {
      await toggleAvailabilityAsync(item.id);
      setCatalogItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      );
      showToast(
        `Item "${item.item_name}" is now ${!item.is_available ? 'AVAILABLE' : 'UNAVAILABLE'}.`,
        'info'
      );
    } catch {
      showToast('Failed to update product availability.', 'error');
    }
  };

  // Actions: Delete Item
  const handleDeleteItemConfirm = async () => {
    if (!deleteItemTarget) return;
    setIsDeletingItem(true);
    try {
      await deleteItemAsync(deleteItemTarget.id);
      setCatalogItems((prev) => prev.filter((i) => i.id !== deleteItemTarget.id));
      showToast(`Product "${deleteItemTarget.item_name}" removed from marketplace.`, 'success');
    } catch {
      showToast('Failed to remove product.', 'error');
    } finally {
      setIsDeletingItem(false);
      setDeleteItemTarget(null);
    }
  };

  // Export handlers
  const handleExportUsers = () => {
    const data = filteredUsers.map((u) => ({
      ID: u.id,
      Name: `${u.first_name} ${u.last_name}`.trim(),
      Email: u.email,
      Phone: u.phone,
      Role: u.role,
      City: u.city || '',
      Active: u.is_active ? 'Yes' : 'No',
      LocationConfirmed: u.location_confirmed ? 'Yes' : 'No',
      AmbassadorCode: u.ambassador_code || '',
    }));
    downloadCSV(`hapo_users_${new Date().toISOString().slice(0, 10)}.csv`, data);
    showToast('Exported users to CSV successfully.', 'success');
  };

  const handleExportOrders = () => {
    const data = filteredOrders.map((o) => ({
      OrderID: o.orderId,
      ItemName: o.itemName,
      Quantity: o.quantity,
      PriceKES: o.itemPrice,
      TotalKES: o.totalAmount,
      VendorPayoutKES: o.vendorPayout,
      BuyerName: o.buyerName,
      BuyerPhone: o.buyerPhone,
      BuyerEmail: o.buyerEmail,
      DeliveryAddress: o.deliveryAddress,
      Status: o.status,
      PaymentMethod: o.paymentMethod,
      CreatedAt: o.createdAt,
    }));
    downloadCSV(`hapo_orders_${new Date().toISOString().slice(0, 10)}.csv`, data);
    showToast('Exported orders to CSV successfully.', 'success');
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shadow-sm">
              <ShieldCheck size={26} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-card-foreground">Administrator Command Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                  Live Operations
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Oversee users & roles, delivery dispatch fleet, customer orders, and marketplace vendor catalog.
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

        {/* Top Platform Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
          {[
            {
              label: 'Total Accounts',
              value: stats.totalUsers,
              icon: Users,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-950/40',
            },
            {
              label: 'Active Accounts',
              value: stats.activeUsers,
              icon: CheckCircle2,
              color: 'text-green-600 dark:text-green-400',
              bg: 'bg-green-50 dark:bg-green-950/40',
            },
            {
              label: 'Delivery Fleet',
              value: `${stats.bikeRiders} Riders`,
              icon: Bike,
              color: 'text-teal-600 dark:text-teal-400',
              bg: 'bg-teal-50 dark:bg-teal-950/40',
            },
            {
              label: 'Total Orders',
              value: stats.totalOrders,
              icon: ShoppingBag,
              color: 'text-indigo-600 dark:text-indigo-400',
              bg: 'bg-indigo-50 dark:bg-indigo-950/40',
            },
            {
              label: 'Gross Volume',
              value: `KES ${stats.totalGrossRevenue.toLocaleString()}`,
              icon: DollarSign,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            },
            {
              label: 'Listed Products',
              value: stats.totalProducts,
              icon: Package,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-950/40',
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
              <p className={`text-xl font-black font-tabular mt-2 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Primary Dashboard Section Switcher */}
        <div className="flex items-center gap-2 border-b border-border mb-6">
          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
              activeSection === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <Users size={18} />
            <span>Accounts & Delivery Fleet</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('orders')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
              activeSection === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <ShoppingBag size={18} />
            <span>Orders & Deliveries</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('catalog')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition ${
              activeSection === 'catalog'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'
            }`}
          >
            <Package size={18} />
            <span>Product Catalog</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted">
              {catalogItems.length}
            </span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 1: ACCOUNTS & FLEET
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'users' && (
          <div>
            {/* Filter and Search Controls */}
            <div className="card p-4 mb-6 space-y-4">
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Status:
                    </span>
                    {(
                      [
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
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

                  <button
                    onClick={handleExportUsers}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-card-foreground text-xs font-bold hover:bg-muted transition"
                    title="Download users as CSV"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Role Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border pt-3">
                {[
                  { key: 'all', label: 'All Accounts', count: users.length },
                  { key: 'vendor', label: 'Vendors', count: stats.vendors },
                  { key: 'client', label: 'Clients', count: stats.clients },
                  { key: 'rider', label: 'Bike Riders', count: stats.bikeRiders },
                  { key: 'ambassador', label: 'Ambassadors', count: stats.ambassadors },
                  { key: 'provider', label: 'Service Providers', count: stats.providers },
                  { key: 'admin', label: 'Admins', count: stats.admins },
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
                      ? 'All User Accounts'
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
                                : 'Platform Administrators'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showing {filteredUsers.length} account{filteredUsers.length !== 1 ? 's' : ''} matching criteria
                  </p>
                </div>

                {selectedRoleTab === 'rider' && (
                  <span className="text-xs text-muted-foreground bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 px-3 py-1 rounded-lg font-medium">
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
                            <p className="text-xs">Try adjusting your search query or filters.</p>
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
                                      <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 px-1.5 py-0.5 rounded font-bold border border-red-200 dark:border-red-800">
                                        YOU (ACTIVE)
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  Confirmed
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmLocation(user)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition shadow-sm"
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
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

                                {/* Edit User Profile */}
                                <button
                                  type="button"
                                  onClick={() => setEditingUser({ ...user })}
                                  className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-card-foreground hover:bg-muted transition"
                                  title="Edit user details and role"
                                >
                                  <Edit3 size={15} />
                                </button>

                                {/* Activate / Deactivate Toggle Button (guarded for self) */}
                                <button
                                  type="button"
                                  disabled={isCurrentUser}
                                  onClick={() => handleToggleActive(user)}
                                  title={
                                    isCurrentUser
                                      ? 'You cannot deactivate your own active admin account'
                                      : user.is_active
                                        ? 'Deactivate account'
                                        : 'Activate account'
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                                    isCurrentUser
                                      ? 'border-border bg-muted/40 text-muted-foreground opacity-40 cursor-not-allowed'
                                      : user.is_active
                                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                        : 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800'
                                  }`}
                                >
                                  {user.is_active ? 'Deactivate' : 'Activate'}
                                </button>

                                {/* Delete User Account Button (guarded for self) */}
                                <button
                                  type="button"
                                  disabled={isCurrentUser}
                                  onClick={() => setDeleteTarget(user)}
                                  title={
                                    isCurrentUser
                                      ? 'You cannot delete your own active admin account'
                                      : 'Delete account permanently'
                                  }
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition shadow-sm ${
                                    isCurrentUser
                                      ? 'border-border bg-muted/40 text-muted-foreground opacity-40 cursor-not-allowed'
                                      : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                                  }`}
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

            {/* Rider Delivery Fleet Dispatch Oversight Section */}
            {(selectedRoleTab === 'rider' || selectedRoleTab === 'all') && riders.length > 0 && (
              <div className="mt-8 card overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-teal-50/50 dark:bg-teal-950/20 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-teal-950 dark:text-teal-200 flex items-center gap-2">
                      <Bike size={18} className="text-teal-600 dark:text-teal-400" />
                      Active Delivery Rider Fleet Roster
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Monitor delivery pricing, vehicle types, service areas, and availability dispatch status.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {riders.filter((r) => r.isAvailable).length} Available for Dispatch
                  </span>
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
                                r.isAvailable
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
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
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 2: ORDERS & DELIVERIES
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'orders' && (
          <div className="space-y-6">
            {/* Orders Controls */}
            <div className="card p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search orders by item, buyer, address, or ID..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {ordersSearch && (
                    <button
                      onClick={() => setOrdersSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Status:
                    </span>
                    {(
                      [
                        { key: 'all', label: 'All Orders' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'shipped', label: 'Shipped' },
                        { key: 'delivered', label: 'Delivered' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.key}
                        onClick={() => setOrderStatusFilter(st.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          orderStatusFilter === st.key
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExportOrders}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-card-foreground text-xs font-bold hover:bg-muted transition"
                    title="Export Orders CSV"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Sub-tab: Store Orders vs Delivery Dispatch */}
              <div className="flex items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('store')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    ordersSubTab === 'store'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Vendor Store Orders ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersSubTab('dispatch')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    ordersSubTab === 'dispatch'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Bike Delivery Dispatch ({deliveryRequests.length})
                </button>
              </div>
            </div>

            {/* Store Orders Table */}
            {ordersSubTab === 'store' && (
              <div className="card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold text-card-foreground">
                    Marketplace Customer Orders
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Total Volume: KES {filteredOrders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Order & Item</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Customer Details</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Delivery Address</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Total Amount</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                            No orders matching current criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((o) => (
                          <tr key={o.orderId} className="hover:bg-muted/30 transition">
                            <td className="px-5 py-3">
                              <p className="font-mono text-xs font-bold text-primary">{o.orderId}</p>
                              <p className="font-semibold text-card-foreground">{o.itemName}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {o.quantity} × KES {o.itemPrice}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-bold text-card-foreground">{o.buyerName}</p>
                              <p className="text-xs text-muted-foreground">{o.buyerPhone}</p>
                              <p className="text-xs text-muted-foreground">{o.buyerEmail}</p>
                            </td>
                            <td className="px-5 py-3 text-xs text-card-foreground max-w-xs">
                              <p className="font-medium">{o.deliveryAddress}</p>
                              {o.shippingNote && (
                                <p className="text-[11px] text-muted-foreground italic mt-0.5">
                                  "{o.shippingNote}"
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-bold text-card-foreground">
                                KES {o.totalAmount.toLocaleString()}
                              </p>
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                                {o.paymentMethod}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                  o.status === 'delivered'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                                    : o.status === 'shipped'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <select
                                value={o.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(o.orderId, e.target.value as VendorOrderStatus)
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="pending">Pending</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Delivery Dispatch Table */}
            {ordersSubTab === 'dispatch' && (
              <div className="card overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-base font-bold text-card-foreground">
                    On-Demand Bike Delivery Dispatch Requests
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {filteredDeliveryRequests.length} active dispatches
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Request ID</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Client</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Route</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Distance & Fee</th>
                        <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Update</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredDeliveryRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                            No dispatch requests recorded.
                          </td>
                        </tr>
                      ) : (
                        filteredDeliveryRequests.map((r) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition">
                            <td className="px-5 py-3 font-mono text-xs font-bold text-teal-600">
                              {r.id}
                              {r.orderId && (
                                <p className="text-[11px] text-muted-foreground font-normal">
                                  Order: {r.orderId}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-bold text-card-foreground">{r.clientName}</p>
                              <p className="text-xs text-muted-foreground">{r.clientPhone}</p>
                            </td>
                            <td className="px-5 py-3 text-xs max-w-xs">
                              <p className="text-muted-foreground">
                                <span className="font-bold text-card-foreground">From:</span> {r.pickupAddress}
                              </p>
                              <p className="text-muted-foreground mt-0.5">
                                <span className="font-bold text-card-foreground">To:</span> {r.deliveryAddress}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              <p className="font-bold text-card-foreground">KES {r.deliveryFee}</p>
                              <p className="text-xs text-muted-foreground font-mono">{r.estimatedDistanceKm} km</p>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                  r.status === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : r.status === 'picked_up' || r.status === 'accepted'
                                      ? 'bg-blue-100 text-blue-800'
                                      : r.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <select
                                value={r.status}
                                onChange={(e) =>
                                  handleUpdateDeliveryStatus(r.id, e.target.value as DeliveryRequest['status'])
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 3: PRODUCT CATALOG
        ═══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'catalog' && (
          <div className="space-y-6">
            {/* Catalog Controls */}
            <div className="card p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Search products by title, vendor, or city..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Category:
                  </span>
                  {[
                    'all',
                    'Food',
                    'Pharmacy',
                    'Groceries',
                    'Electronics',
                    'Clothing',
                    'Other',
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCatalogCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                        catalogCategory === cat
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Catalog Table */}
            <div className="card overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-bold text-card-foreground">
                  Vendor Products & Inventory Roster
                </h3>
                <span className="text-xs text-muted-foreground">
                  Showing {filteredCatalogItems.length} products
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase">Product Details</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase">Category</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase">Vendor</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase">Price & City</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase">Stock Status</th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCatalogItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          <Package size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                          <p className="font-semibold">No products found</p>
                          <p className="text-xs">Try selecting a different category or search keyword.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCatalogItems.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {item.images?.[0] ? (
                                <img
                                  src={item.images[0]}
                                  alt={item.item_name}
                                  className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                                  <Package size={20} />
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-card-foreground">{item.item_name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-card-foreground">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-card-foreground">{item.vendor_name || 'Vendor'}</p>
                            {item.vendor_whatsapp && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {item.vendor_whatsapp}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-card-foreground">KES {item.price_kes.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{item.city || 'Nairobi'}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                item.is_available
                                  ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                              }`}
                            >
                              {item.is_available ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleItemAvailability(item)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                                  item.is_available
                                    ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
                                }`}
                              >
                                {item.is_available ? 'Mark Out of Stock' : 'Mark Available'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteItemTarget(item)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Delete product"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
        message={`Are you sure you want to permanently delete the account for ${deleteTarget?.first_name} ${deleteTarget?.last_name} (${deleteTarget?.email})? This action cannot be undone and will immediately remove their profile and associated fleet records.`}
        confirmLabel="Delete Account"
        isLoading={isDeleting}
      />

      {/* ─── MODAL 2: Confirm Delete Product ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteItemTarget}
        onClose={() => setDeleteItemTarget(null)}
        onConfirm={handleDeleteItemConfirm}
        title="Delete Product Listing"
        message={`Are you sure you want to permanently remove "${deleteItemTarget?.item_name}" from the marketplace?`}
        confirmLabel="Delete Product"
        isLoading={isDeletingItem}
      />

      {/* ─── MODAL 3: View User Details ──────────────────────────────────────── */}
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
              {currentUser?.id !== viewingUser.id ? (
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
              ) : (
                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                  Active (Your Account)
                </span>
              )}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingUser;
                    setViewingUser(null);
                    setEditingUser({ ...target });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition"
                >
                  <Edit3 size={14} />
                  Edit Profile
                </button>

                {currentUser?.id !== viewingUser.id && (
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
                )}
              </div>

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

      {/* ─── MODAL 4: Edit User Details ──────────────────────────────────────── */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Edit User Account: ${editingUser.first_name} ${editingUser.last_name}`}
          size="md"
        >
          <form onSubmit={handleSaveEditUser} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.first_name}
                  onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editingUser.last_name}
                  onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
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
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={editingUser.whatsapp_number || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Account Role *
                </label>
                <select
                  value={editingUser.role}
                  disabled={currentUser?.id === editingUser.id}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                >
                  <option value="client">Client</option>
                  <option value="vendor">Vendor</option>
                  <option value="rider">Bike Rider</option>
                  <option value="ambassador">Ambassador</option>
                  <option value="towing">Towing Provider</option>
                  <option value="garage">Garage Provider</option>
                  <option value="admin">Administrator</option>
                </select>
                {currentUser?.id === editingUser.id && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    (Cannot demote your own admin account)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  value={editingUser.city || 'Nairobi'}
                  onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {editingUser.role === 'ambassador' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Ambassador Referral Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingUser.ambassador_code || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, ambassador_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HAPKEN123"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, ambassador_code: generateAmbassadorCode() })}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-border hover:bg-muted whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingUser.is_active}
                  disabled={currentUser?.id === editingUser.id}
                  onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs font-semibold text-card-foreground">Account Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingUser.location_confirmed}
                  onChange={(e) => setEditingUser({ ...editingUser, location_confirmed: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs font-semibold text-card-foreground">Location Verified</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditingSaving}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-95 transition disabled:opacity-50"
              >
                {isEditingSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── MODAL 5: Add New User ─────────────────────────────────────────── */}
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

            {newUserForm.role === 'ambassador' && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                ✨ A unique ambassador referral code (e.g. HAPABC123) will be automatically generated.
              </p>
            )}

            {newUserForm.role === 'rider' && (
              <p className="text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/30 p-2.5 rounded-xl border border-teal-200 dark:border-teal-800">
                🏍️ This account will be automatically enrolled in the active Bike Delivery Fleet.
              </p>
            )}

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
