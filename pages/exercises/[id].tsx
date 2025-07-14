import { GetServerSideProps } from 'next';
import ExerciseDetail from '@/components/ExerciseDetail';
import Layout from '@/components/Layout';

interface ExerciseDetailPageProps {
  id: string;
}

export default function ExerciseDetailPage({ id }: ExerciseDetailPageProps) {
  return (
      <ExerciseDetail />
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  return {
    props: {
      id: id as string,
    },
  };
}; 