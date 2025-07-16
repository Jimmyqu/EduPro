import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Trophy, 
  Users, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService, isApiSuccess, Exam, ExamAttempt, ApiExerciseStats } from "../lib/api";
import { toast } from "sonner";

interface ExerciseHubProps {
  onBack: () => void;
  courseId?: number;
}

export function ExerciseHub({ onBack, courseId }: ExerciseHubProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exam[]>([]);
  const [myAttempts, setMyAttempts] = useState<ExamAttempt[]>([]);
  const [stats, setStats] = useState<ApiExerciseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentTab, setCurrentTab] = useState("exercises");
  const { user } = useAuth();

  // 获取练习列表
  const fetchExercises = async (page = 1, search = "", courseId?: number) => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        per_page: 12,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      
      if (courseId && courseId > 0) {
        params.course_id = courseId;
      }
      
      const response = await apiService.getExercises(params);
      
      if (isApiSuccess(response)) {
        setExercises(response.data.exams);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
        setCurrentPage(page);
      } else {
        toast.error("获取练习列表失败", { description: response.message });
      }
    } catch (error) {
      console.error("获取练习列表失败:", error);
      toast.error("获取练习列表失败", { description: "请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 获取我的考试记录
  const fetchMyAttempts = async () => {
    try {
      const response = await apiService.getMyExamAttempts({ 
        exam_type: 'exercise',
        per_page: 50 
      });
      
      if (isApiSuccess(response)) {
        setMyAttempts(response.data.attempts);
      } else {
        toast.error("获取考试记录失败", { description: response.message });
      }
    } catch (error) {
      console.error("获取考试记录失败:", error);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await apiService.getMyExerciseStats();
      
      if (isApiSuccess(response)) {
        setStats(response.data);
      } else {
        console.error("获取统计信息失败:", response.message);
      }
    } catch (error) {
      console.error("获取统计信息失败:", error);
    }
  };

  // 初始化数据
  const initialFetchRef = useRef(false);
  
  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      Promise.all([
        fetchExercises(1, "", courseId),
        fetchMyAttempts(),
        fetchStats()
      ]);
    }
  }, [courseId]);

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    const courseId = selectedCourse === "all" ? undefined : parseInt(selectedCourse);
    fetchExercises(1, searchTerm, courseId);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchTerm("");
    setSelectedCourse("all");
    setCurrentPage(1);
    fetchExercises(1);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    const courseId = selectedCourse === "all" ? undefined : parseInt(selectedCourse);
    fetchExercises(page, searchTerm, courseId);
  };

  // 查看练习详情
  const handleViewExercise = (exerciseId: number) => {
    // 跳转到练习详情页面
    router.push(`/exercises/${exerciseId}`);
  };

  // 获取练习状态显示
  const getExerciseStatus = (exercise: Exam) => {
    if (exercise.is_participated) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          已参与
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        未参与
      </Badge>
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取得分颜色
  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return "text-green-600";
    } else if (score >= passingScore * 0.8) {
      return "text-yellow-600";
    } else {
      return "text-red-600";
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">请先登录以访问练习功能</p>
          <Button onClick={onBack}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">练习中心</h1>
          <p className="text-muted-foreground">通过练习巩固知识，提升专业技能</p>
        </div>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总练习数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_exercises}</div>
              <p className="text-xs text-muted-foreground">已参与的练习</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed_exercises}</div>
              <p className="text-xs text-muted-foreground">达到及格线的练习</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">完成率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completion_rate}%</div>
              <p className="text-xs text-muted-foreground">练习完成率</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="exercises">全部练习</TabsTrigger>
          <TabsTrigger value="attempts">我的记录</TabsTrigger>
        </TabsList>

        {/* 全部练习 */}
        <TabsContent value="exercises" className="space-y-6">
          {/* 搜索和筛选 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索练习标题或课程名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="gap-2">
                    <Search className="h-4 w-4" />
                    搜索
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="gap-2">
                    <Filter className="h-4 w-4" />
                    重置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 练习列表 */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : exercises.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">暂无练习</h3>
                <p className="text-muted-foreground">当前没有找到相关练习，请稍后再试</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exercises.map((exercise) => (
                  <Card key={exercise.exam_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{exercise.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {exercise.course.title} • {exercise.course.level}
                          </CardDescription>
                        </div>
                        {getExerciseStatus(exercise)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.duration_minutes} 分钟
                          </span>
                          <span className="flex items-center text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {exercise.total_questions} 题
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>总分: {exercise.total_score}</span>
                          <span>及格分: {exercise.passing_score}</span>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => handleViewExercise(exercise.exam_id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          查看详情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    共 {total} 个练习，第 {currentPage} / {totalPages} 页
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 我的记录 */}
        <TabsContent value="attempts" className="space-y-6">
          {myAttempts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">暂无练习记录</h3>
                <p className="text-muted-foreground">您还没有参与任何练习，快去开始练习吧！</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAttempts.map((attempt) => (
                <Card key={attempt.attempt_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{attempt.exam.title}</CardTitle>
                    <CardDescription>{attempt.exam.course.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">状态</span>
                        <Badge variant={
                          attempt.status === 'graded' ? 'default' :
                          attempt.status === 'submitted' ? 'secondary' : 'outline'
                        }>
                          {attempt.status === 'graded' ? '已评分' :
                           attempt.status === 'submitted' ? '已提交' : '进行中'}
                        </Badge>
                      </div>
                      
                      {attempt.score !== null && attempt.score !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">得分</span>
                          <span className={`font-medium ${getScoreColor(attempt.score, attempt.exam.passing_score)}`}>
                            {attempt.score} / {attempt.exam.total_score}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">开始时间</span>
                        <span className="text-sm">{formatDate(attempt.start_time)}</span>
                      </div>
                      
                      {attempt.submit_time && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">提交时间</span>
                          <span className="text-sm">{formatDate(attempt.submit_time)}</span>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => toast.info("详情查看功能开发中")}
                      >
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}