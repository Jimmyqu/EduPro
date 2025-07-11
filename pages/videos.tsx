import React from 'react';
import { useRouter } from 'next/router';
import { VideoLibrary } from '../components/VideoLibrary';

export default function VideosPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return <VideoLibrary onBack={handleBack} />;
} 