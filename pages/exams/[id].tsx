import { GetServerSideProps } from 'next';
import ExamDetail from '@/components/ExamDetail';
import Layout from '@/components/Layout';

interface ExamDetailPageProps {
  id: string;
}

export default function ExamDetailPage({ id }: ExamDetailPageProps) {
  return (
      <ExamDetail />
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