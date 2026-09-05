'use client';

import React from 'react';
import RoleGuard from '@/components/RoleGuard';
import DashboardNav from '@/components/DashboardNav';
import { ToastProvider } from '@/components/ui/Toast';
import ProviderDashboardClient from './components/ProviderDashboardClient';

function ProviderDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <ProviderDashboardClient />
    </div>
  );
}

export default function ProviderDashboard() {
  return (
    <ToastProvider>
      {/* Allow both towing and garage roles */}
      <RoleGuard allowedRole={['towing', 'garage']}>
        <ProviderDashboardPage />
      </RoleGuard>
    </ToastProvider>
  );
}
