import React from 'react';
import { useRouter } from 'next/router';
import { PDFLibrary } from '../components/PDFLibrary';

export default function PDFsPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <PDFLibrary onBack={handleBack} />;
} 