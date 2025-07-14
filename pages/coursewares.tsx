import React from 'react';
import Layout from '../components/Layout';
import { CoursewaresList } from '../components/CoursewaresList';

export default function CoursewaresPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <CoursewaresList />
      </div>
    </Layout>
  );
} 