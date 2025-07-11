import React from 'react';
import { useRouter } from 'next/router';
import { UserProfile } from '../components/UserProfile';

export default function ProfilePage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return <UserProfile onBack={handleBack} />;
} 