import React from 'react';
import RoleGuard from '@/components/RoleGuard';
import { ToastProvider } from '@/components/ui/Toast';
import AmbassadorDashboardClient from './components/AmbassadorDashboardClient';

export default function AmbassadorDashboardPage() {
  return (
    <ToastProvider>
      <RoleGuard allowedRole="ambassador">
        <AmbassadorDashboardClient />
      </RoleGuard>
    </ToastProvider>
  );
}
