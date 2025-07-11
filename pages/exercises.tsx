import React from 'react';
import { useRouter } from 'next/router';
import { ExerciseHub } from '../components/ExerciseHub';

export default function ExercisesPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <ExerciseHub onBack={handleBack} />;
} 