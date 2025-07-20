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
  BarChart3,
  Play,
  RotateCcw,
  AlertTriangle
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

  // 开始练习
  const handleStartExercise = (exerciseId: number) => {
    router.push(`/exercises/${exerciseId}/start`);
  };

  // 继续练习
  const handleContinueExercise = (exerciseId: number) => {
    router.push(`/exercises/${exerciseId}/continue`);
  };

  // 继续练习（重做）
  const handleRetakeExercise = (exerciseId: number) => {
    router.push(`/exercises/${exerciseId}/continue`);
  };

  // 浏览模式
  const handleBrowseExercise = (exerciseId: number) => {
    router.push(`/exercises/${exerciseId}/browse`);
  };

  // 错题练习
  const handleWrongQuestions = (exerciseId: number) => {
    router.push(`/exercises/${exerciseId}/wrong-questions`);
  };

  // 获取练习状态和对应的按钮
  const getExerciseStatusAndButtons = (exercise: Exam) => {
    // 查找该练习的最新尝试记录
    const latestAttempt = myAttempts
      .filter(attempt => attempt.exam.exam_id === exercise.exam_id)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

    if (!latestAttempt) {
      // 未开始练习
      return {
        status: (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            未开始
          </Badge>
        ),
        buttons: (
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={() => handleStartExercise(exercise.exam_id)}
            >
              <Play className="h-4 w-4 mr-1" />
              开始练习
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => handleBrowseExercise(exercise.exam_id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              浏览模式
            </Button>
          </div>
        )
      };
    }

    if (latestAttempt.status === 'in_progress') {
      // 已开始但未完成
      return {
        status: (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            进行中
          </Badge>
        ),
        buttons: (
          <div className="flex gap-2">
            <Button 
              className="flex-1"
              onClick={() => handleContinueExercise(exercise.exam_id)}
            >
              <Play className="h-4 w-4 mr-1" />
              继续练习
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => handleBrowseExercise(exercise.exam_id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              浏览模式
            </Button>
          </div>
        )
      };
    }

    if (latestAttempt.status === 'submitted' || latestAttempt.status === 'graded') {
      // 已完成
      const isPassed = latestAttempt.score !== null && 
                      latestAttempt.score !== undefined && 
                      latestAttempt.score >= exercise.passing_score;
      
      return {
        status: (
          <Badge variant="secondary" className={isPassed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            <CheckCircle className="h-3 w-3 mr-1" />
            {isPassed ? "已通过" : "未通过"}
          </Badge>
        ),
        buttons: (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => handleRetakeExercise(exercise.exam_id)}
              >
                <Play className="h-4 w-4 mr-1" />
                继续练习
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => handleBrowseExercise(exercise.exam_id)}
              >
                <Eye className="h-4 w-4 mr-1" />
                浏览模式
              </Button>
            </div>
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => handleWrongQuestions(exercise.exam_id)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              错题练习
            </Button>
          </div>
        )
      };
    }

    // 默认状态
    return {
      status: (
        <Badge variant="outline">
          <Clock className="h-3 w-3 mr-1" />
          未知状态
        </Badge>
      ),
      buttons: (
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => handleBrowseExercise(exercise.exam_id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          浏览模式
        </Button>
      )
    };
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
          <h1 className="text-3xl font-bold">{courseId ? "课程练习" : "练习中心"}</h1>
          <p className="text-muted-foreground">
            {courseId ? "完成课程练习，巩固学习成果" : "通过练习巩固知识，提升专业技能"}
          </p>
        </div>
      </div>

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
              {exercises.map((exercise) => {
                const { status, buttons } = getExerciseStatusAndButtons(exercise);
                
                return (
                  <Card key={exercise.exam_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{exercise.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {exercise.course.title} • {exercise.course.level}
                          </CardDescription>
                        </div>
                        {status}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          {/* <span className="flex items-center text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.duration_minutes} 分钟
                          </span> */}
                          <span className="flex items-center text-muted-foreground">
                            <BookOpen className="h-4 w-4 mr-1" />
                            {exercise.total_questions} 题
                          </span>
                        </div>
{/*                         
                        <div className="flex items-center justify-between text-sm">
                          <span>总分: {exercise.total_score}</span>
                          <span>及格分: {exercise.passing_score}</span>
                        </div> */}

                        {buttons}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
  
    </div>
  );
}