import React from 'react';
import Layout from '@/components/Layout';
import CoursesList from '@/components/CoursesList';

const CoursesPage: React.FC = () => {
  return (
    <Layout>
      <CoursesList />
    </Layout>
  );
};

export default CoursesPage; 