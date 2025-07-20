import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ExerciseContinuePage() {
  const router = useRouter();
  const { id } = router.query;
  
  useEffect(() => {
    if (id) {
      // 重定向到练习详情页面（继续练习）
      router.replace(`/exercises/${id}`);
    }
  }, [id, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">正在恢复练习...</p>
        </div>
      </div>
    </div>
  );
}