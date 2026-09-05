'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';
import { getAuthUser } from '@/lib/authStore';
import { getRoleDashboard } from '@/lib/mockData';
import type { UserRole } from '@/lib/mockData';

interface RoleGuardProps {
  allowedRole: UserRole | UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied' | 'unauthenticated'>(
    'loading'
  );
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      setStatus('unauthenticated');
      setTimeout(() => router.replace('/'), 2000);
      return;
    }
    setUserRole(user.role);
    const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (allowed.includes(user.role as UserRole)) {
      setStatus('allowed');
    } else {
      setStatus('denied');
      setTimeout(() => router.replace(getRoleDashboard(user.role as UserRole)), 2500);
    }
  }, [allowedRole, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-muted-foreground font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <ShieldX size={32} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-card-foreground mb-2">Session Expired</h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to continue. Redirecting you now...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ShieldX size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-card-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-1">
            You don't have access to this section.
          </p>
          {userRole && (
            <p className="text-sm text-primary font-medium">
              Redirecting you to your {userRole} dashboard...
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
