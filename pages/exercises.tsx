import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ExerciseHub } from '../components/ExerciseHub';
import { CourseCard } from '../components/CourseCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Search, PenTool, Loader2 } from 'lucide-react';
import { apiService, isApiSuccess } from '../lib/api';
import { toast } from 'sonner';

export default function ExercisesPage() {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 获取我的课程列表（包含练习统计信息）
  const fetchCourses = async (search = "") => {
    try {
      setLoading(true);
      
      const response = await apiService.getMyCourses();
      
      if (isApiSuccess(response)) {
        let enrollments = response.data;
        
        // 如果有搜索条件，过滤课程
        if (search.trim()) {
          const searchTerm = search.trim().toLowerCase();
          enrollments = enrollments.filter(enrollment => 
            enrollment.course.title.toLowerCase().includes(searchTerm) ||
            enrollment.course.category?.toLowerCase().includes(searchTerm)
          );
        }
        
        // 只显示有练习的课程
        const coursesWithExercises = enrollments.filter(enrollment => 
          enrollment.stats.total_exercises > 0
        );
        
        setCourses(coursesWithExercises);
      } else {
        toast.error("获取课程列表失败", { description: response.message });
      }
    } catch (error) {
      console.error("获取课程列表失败:", error);
      toast.error("获取课程列表失败", { description: "请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 搜索处理
  const handleSearch = () => {
    fetchCourses(searchTerm);
  };

  // 选择课程
  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
  };

  // 返回课程列表
  const handleBack = () => {
    setSelectedCourseId(null);
  };

  // 返回仪表板
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
      <div className="container mx-auto px-4 py-8">
        {selectedCourseId ? (
          // 二级页面：显示特定课程的练习
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回课程列表
              </Button>
              <h1 className="text-2xl font-bold">课程练习</h1>
            </div>
            <ExerciseHub onBack={handleBack} courseId={selectedCourseId} />
          </div>
        ) : (
          // 一级页面：显示课程卡片
          <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">练习中心</h1>
                <p className="text-gray-600">查看已选课程的练习内容</p>
              </div>
              
              {/* 搜索 */}
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索课程..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={handleSearch} variant="outline">
                  搜索
                </Button>
              </div>
            </div>

            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-lg">加载中...</span>
              </div>
            )}

            {/* 课程卡片列表 */}
            {!loading && (
              <>
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map((enrollment) => (
                      <div key={enrollment.enrollment_id} className="relative">
                        <CourseCard
                          course={{
                            ...enrollment.course,
                            is_enrolled: true
                          }}
                          type="exercises"
                          onSelect={() => handleSelectCourse(enrollment.course.course_id)}
                        />
                        {/* 显示练习统计信息 */}
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          练习: {enrollment.stats.completed_exercises}/{enrollment.stats.participated_exercises}/{enrollment.stats.total_exercises}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <PenTool className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg text-gray-600 mb-2">暂无练习课程</h3>
                      <p className="text-gray-500 text-center mb-4">
                        {searchTerm ? "没有找到匹配的课程" : "您的已选课程中暂无练习内容"}
                      </p>
                      {searchTerm && (
                        <Button onClick={() => {
                          setSearchTerm("");
                          fetchCourses("");
                        }}>
                          清除搜索
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
  );
} 