import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Calendar,
  Search, 
  Filter,
  CheckCircle,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiService, Course, CourseListResponse, isApiSuccess } from '@/lib/api';

export function CoursesList() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchTerm, selectedCategory, selectedLevel]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: currentPage,
        per_page: 999
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (selectedLevel) {
        params.level = selectedLevel;
      }

      const response = await apiService.getCourses(params);

      if (isApiSuccess(response)) {
        setCourses(response.data.courses);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);

        // 提取所有分类
        const allCategories = response.data.courses
          .map(course => course.category)
          .filter((category, index, array) => 
            category && array.indexOf(category) === index
          ) as string[];
        setCategories(allCategories);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('获取课程列表失败:', err);
      setError('获取课程列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCourses();
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getLevelBadge = (level: string) => {
    const levelMap = {
      'beginner': { label: '初级', variant: 'secondary' as const },
      'intermediate': { label: '中级', variant: 'default' as const },
      'advanced': { label: '高级', variant: 'destructive' as const }
    };
    
    const levelInfo = levelMap[level as keyof typeof levelMap];
    return levelInfo ? (
      <Badge variant={levelInfo.variant}>{levelInfo.label}</Badge>
    ) : (
      <Badge>{level}</Badge>
    );
  };

  const getEnrollmentStatusBadge = (course: Course) => {
    if (!course.can_enroll) {
      return <Badge variant="outline">报名已结束</Badge>;
    }
    if (course.requires_approval) {
      return <Badge variant="secondary">需要通过</Badge>;
    }
    return <Badge variant="default">可直接报名</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchCourses} className="mt-4">
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">课程列表</h1>
          <p className="text-muted-foreground mt-1">
            浏览所有可选课程，找到最适合您的学习内容
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          共 {total} 门课程
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索课程</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索课程名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">课程分类</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">难度级别</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="选择难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部难度</SelectItem>
                  <SelectItem value="beginner">初级</SelectItem>
                  <SelectItem value="intermediate">中级</SelectItem>
                  <SelectItem value="advanced">高级</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">操作</label>
              <div className="flex gap-2">
                <Button onClick={handleSearch} size="sm" className="flex-1">
                  搜索
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
                  重置
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 课程网格 */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">暂无课程</h3>
                <p className="text-muted-foreground">
                  没有找到符合条件的课程，请尝试调整筛选条件
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.course_id} 
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {course.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getLevelBadge(course.level)}
                      {getEnrollmentStatusBadge(course)}
                    </div>
                  </div>
                </div>
                
                <CardDescription className="line-clamp-2">
                  {course.description || '暂无课程描述'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {course.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.category}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {course.current_student_count} 人可学习
                    </span>
                  </div>

                  {course.creator && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>教师: {course.creator.full_name}</span>
                    </div>
                  )}


                </div>

                {/* 课程状态指示 */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      课程可学习 {course.learning_days} 天
                    </span>
                    
                    {course.requires_approval && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">需要通过</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant={course.can_enroll ? "default" : "secondary"}
                  disabled={!course.can_enroll}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 移除课程详情页面跳转
                    console.log('课程信息:', course);
                  }}
                >
                  {course.can_enroll ? '查看课程' : '暂不可报名'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, currentPage - 2) + i;
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default CoursesList; 