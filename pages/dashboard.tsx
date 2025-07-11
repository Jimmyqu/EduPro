import React from 'react';
import { useRouter } from 'next/router';
import { Dashboard } from '../components/Dashboard';
import { Section, sectionRoutes } from '../types/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const handleNavigate = (section: Section) => {
    router.push(sectionRoutes[section]);
  };

  return <Dashboard onNavigate={handleNavigate} />;
} 