import React from 'react';
import { useRouter } from 'next/router';
import { MockExam } from '../components/MockExam';

export default function ExamsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <MockExam onBack={handleBack} />;
} 