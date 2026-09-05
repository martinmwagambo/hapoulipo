'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Users,
  TrendingUp,
  Send,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { getAuthUser } from '@/lib/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  mockReferredUsers,
  mockCommissions,
  mockAmbassadorStats,
  ReferredUser,
  CommissionEntry,
  AmbassadorStats,
} from '@/lib/mockData';
import Icon from '@/components/ui/AppIcon';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatKES(n: number): string {
  return `KES ${n.toLocaleString('en-KE')}`;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, accent }: StatCardProps) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${accent ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <div>
        <p
          className={`text-2xl font-extrabold font-tabular ${accent ? 'text-primary' : 'text-card-foreground'}`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ReferredUsersTable({ users }: { users: ReferredUser[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? users : users.slice(0, 5);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-card-foreground">Referred Users</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {users.length} total · {users.filter((u) => u.is_active).length} active
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          {users.filter((u) => u.is_active).length} Active
        </span>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Name', 'Role', 'City', 'Joined', 'Orders', 'Status'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span className="font-medium text-card-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === 'vendor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{u.city}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{formatDate(u.joined_at)}</td>
                <td className="px-5 py-3.5 font-tabular font-semibold text-card-foreground">
                  {u.total_orders ?? 0}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
                    />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-border">
        {visible.map((u) => (
          <div key={u.id} className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
              {u.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-card-foreground text-sm">{u.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold capitalize ${u.role === 'vendor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                >
                  {u.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {u.city} · Joined {formatDate(u.joined_at)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
              />
              {u.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
      {users.length > 5 && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Show all {users.length} users
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

const TYPE_CONFIG: Record<CommissionEntry['type'], { label: string; color: string; bg: string }> = {
  signup: { label: 'Signup', color: 'text-blue-700', bg: 'bg-blue-100' },
  order: { label: 'Order', color: 'text-purple-700', bg: 'bg-purple-100' },
  bonus: { label: 'Bonus', color: 'text-amber-700', bg: 'bg-amber-100' },
};

function CommissionHistory({ entries }: { entries: CommissionEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? entries : entries.slice(0, 5);
  const paid = entries.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount_kes, 0);
  const pending = entries
    .filter((e) => e.status === 'pending')
    .reduce((s, e) => s + e.amount_kes, 0);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-card-foreground">Commission History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{entries.length} transactions</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <BadgeCheck size={13} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Paid Out</span>
            </div>
            <p className="text-base font-extrabold font-tabular text-emerald-700">
              {formatKES(paid)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Pending</span>
            </div>
            <p className="text-base font-extrabold font-tabular text-amber-700">
              {formatKES(pending)}
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {visible.map((entry) => {
          const cfg = TYPE_CONFIG[entry.type];
          return (
            <div
              key={entry.id}
              className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}
              >
                <TrendingUp size={15} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {entry.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-extrabold font-tabular text-card-foreground">
                  +{formatKES(entry.amount_kes)}
                </p>
                <span
                  className={`text-xs font-semibold ${entry.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}
                >
                  {entry.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {entries.length > 5 && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={16} /> View all {entries.length} transactions
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AmbassadorDashboardClient() {
  const user = getAuthUser();
  const [copied, setCopied] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>(mockReferredUsers);
  const [commissions, setCommissions] = useState<CommissionEntry[]>(mockCommissions);
  const [stats, setStats] = useState<AmbassadorStats>(mockAmbassadorStats);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;

        // Load referred users from user_profiles
        const { data: referred } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, role, city, created_at, is_active')
          .eq('referred_by', authUser.id)
          .order('created_at', { ascending: false });

        if (referred && referred.length > 0) {
          const mapped: ReferredUser[] = referred.map((r) => ({
            id: r.id,
            name: `${r.first_name} ${r.last_name}`.trim(),
            role: r.role as 'client' | 'vendor',
            city: r.city || 'Kenya',
            joined_at: r.created_at,
            is_active: r.is_active,
            total_orders: 0,
          }));
          setReferredUsers(mapped);
          setStats((prev) => ({
            ...prev,
            total_referrals: mapped.length,
            active_referrals: mapped.filter((u) => u.is_active).length,
          }));
        }

        // Load commissions
        const { data: comms } = await supabase
          .from('commissions')
          .select('*')
          .eq('ambassador_id', authUser.id)
          .order('created_at', { ascending: false });

        if (comms && comms.length > 0) {
          const mappedComms: CommissionEntry[] = comms.map((c) => ({
            id: c.id,
            description: c.description,
            amount_kes: c.amount_kes,
            type: c.commission_type as CommissionEntry['type'],
            date: c.created_at,
            status: c.status as 'paid' | 'pending',
          }));
          setCommissions(mappedComms);
          const totalKes = mappedComms.reduce((s, c) => s + c.amount_kes, 0);
          const pendingKes = mappedComms
            .filter((c) => c.status === 'pending')
            .reduce((s, c) => s + c.amount_kes, 0);
          setStats((prev) => ({
            ...prev,
            total_commissions_kes: totalKes,
            pending_commissions_kes: pendingKes,
          }));
        }
      } catch (e) {
        console.warn('Ambassador dashboard load error:', e);
      }
    }
    loadData();
  }, []);

  const handleCopyCode = () => {
    if (user?.ambassador_code) {
      navigator.clipboard?.writeText(user.ambassador_code)?.catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `Join HapoUlipo — Kenya's local marketplace! Use my code ${user?.ambassador_code ?? ''} when signing up. 🛒`;

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({ title: 'HapoUlipo Referral', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText)?.catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-screen-xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-card-foreground">Ambassador Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-primary">{user?.first_name}</span>!
              Here&apos;s your referral performance.
            </p>
          </div>
          {user?.ambassador_code && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 self-start sm:self-auto">
              <div>
                <p className="text-xs font-semibold text-amber-700 leading-none mb-1">Your Code</p>
                <p className="text-xl font-extrabold text-amber-600 tracking-widest font-tabular leading-none">
                  {user.ambassador_code}
                </p>
              </div>
              <div className="flex gap-1.5 ml-2">
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                  aria-label="Copy code"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  aria-label="Share referral"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Code Uses This Month"
            value={String(stats.code_uses_this_month)}
            sub="Times your code was entered"
            icon={Zap}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            accent
          />
          <StatCard
            label="Invites Sent"
            value={String(stats.invites_sent)}
            sub="Total invitations shared"
            icon={Send}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Active Referrals"
            value={`${stats.active_referrals} / ${stats.total_referrals}`}
            sub="Active out of total referred"
            icon={Users}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            label="Total Commissions"
            value={formatKES(stats.total_commissions_kes)}
            sub={`${formatKES(stats.pending_commissions_kes)} pending`}
            icon={TrendingUp}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <ReferredUsersTable users={referredUsers} />
          </div>
          <div className="xl:col-span-2">
            <CommissionHistory entries={commissions} />
          </div>
        </div>

        {/* Referral tip banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-amber-50 to-amber-100 border border-amber-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
            <Send size={20} className="text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Earn more by referring vendors!</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Vendor signups earn you <span className="font-bold">KES 500</span> per referral.
              Client signups earn <span className="font-bold">KES 200</span>. Share your code today.
            </p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors flex-shrink-0"
          >
            <Send size={15} /> Share Code
          </button>
        </div>
      </main>
    </div>
  );
}
