import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Trophy, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  AlertTriangle,
  FileText,
  Pause,
  Play
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { apiService, isApiSuccess, Exam, ExamAttempt, ApiExamStats } from "../lib/api";
import { toast } from "sonner";

interface MockExamProps {
  onBack: () => void;
  courseId?: number;
}

export function MockExam({ onBack, courseId }: MockExamProps) {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [myAttempts, setMyAttempts] = useState<ExamAttempt[]>([]);
  const [stats, setStats] = useState<ApiExamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>(courseId ? String(courseId) : "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentTab, setCurrentTab] = useState("exams");
  const { user } = useAuth();

  // 获取考试列表
  const fetchExams = async (page = 1, search = "", courseId?: number) => {
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
      
      const response = await apiService.getExams(params);
      
      if (isApiSuccess(response)) {
        setExams(response.data.exams);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
        setCurrentPage(page);
      } else {
        toast.error("获取考试列表失败", { description: response.message });
      }
    } catch (error) {
      console.error("获取考试列表失败:", error);
      toast.error("获取考试列表失败", { description: "请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 获取我的考试记录
  const fetchMyAttempts = async () => {
    try {
      const response = await apiService.getMyExamAttempts({ 
        exam_type: 'final',
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
      const response = await apiService.getMyExamStats();
      
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
        fetchExams(1, "", courseId),
        fetchMyAttempts(),
        fetchStats()
      ]);
    }
  }, [courseId]);

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1);
    const courseId = selectedCourse === "all" ? undefined : parseInt(selectedCourse);
    fetchExams(1, searchTerm, courseId);
  };

  // 重置搜索
  const handleReset = () => {
    setSearchTerm("");
    setSelectedCourse("all");
    setCurrentPage(1);
    fetchExams(1);
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    const courseId = selectedCourse === "all" ? undefined : parseInt(selectedCourse);
    fetchExams(page, searchTerm, courseId);
  };

  // 判断考试状态
  const getExamStatus = (exam: Exam) => {
    // 在本地存储中查找考试进度
    const storageKey = `exam_progress_${exam.exam_id}`;
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.status === 'in_progress') {
        return 'in_progress';
      }
    }
    
    if (exam.is_participated) {
      return 'completed';
    }
    
    return 'not_started';
  };

  // 获取考试状态显示
  const getExamStatusBadge = (exam: Exam) => {
    const status = getExamStatus(exam);
    
    if (status === 'in_progress') {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          进行中
        </Badge>
      );
    } else if (status === 'completed') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          已参加
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        未参加
      </Badge>
    );
  };

  // 获取考试操作按钮
  const getExamActionButton = (exam: Exam) => {
    const status = getExamStatus(exam);
    
    if (status === 'in_progress') {
      return (
        <Button
          variant="default"
          className="w-full"
          onClick={() => handleStartExam(exam.exam_id)}
        >
          <Play className="h-4 w-4 mr-2" />
          继续考试
        </Button>
      );
    } else if (status === 'completed') {
      return (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleViewExam(exam.exam_id)}
        >
          <Eye className="h-4 w-4 mr-2" />
          查看考试
        </Button>
      );
    }
    
    return (
      <Button
        variant="default"
        className="w-full"
        onClick={() => handleStartExam(exam.exam_id)}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        开始考试
      </Button>
    );
  };

  // 查看考试详情
  const handleViewExam = (examId: number) => {
    // 跳转到考试详情页面
    router.push(`/exams/${examId}`);
  };

  // 开始考试
  const handleStartExam = (examId: number) => {
    // 检查是否是继续考试
    const storageKey = `exam_progress_${examId}`;
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.status === 'paused' || progress.status === 'in_progress') {
        // 如果是继续考试，添加continue=true参数
        router.push(`/exams/${examId}?continue=true`);
        return;
      }
    }
    
    // 否则正常跳转到考试详情页面
    router.push(`/exams/${examId}`);
  };

  // 获取考试难度标识
  const getExamLevel = (level: string) => {
    const colors = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'beginner': '初级',
      'intermediate': '中级',
      'advanced': '高级'
    };

    return (
      <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[level as keyof typeof labels] || level}
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

  // 获取通过状态
  const getPassStatus = (score: number, passingScore: number) => {
    if (score >= passingScore) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          通过
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          未通过
        </Badge>
      );
    }
  };

  // 渲染分页控件
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-6 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </Button>
        
        <span className="flex items-center px-3 py-1 bg-gray-100 rounded text-sm">
          {currentPage} / {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          下一页
        </Button>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">请先登录以访问考试功能</p>
          <Button onClick={onBack}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">考试中心</h1>
          <p className="text-muted-foreground">参加考试，检验学习成果</p>
        </div>
        
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>


          {/* 考试列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : exams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">暂无可参加的考试</h3>
                <p className="text-muted-foreground">当前没有可参加的考试，请稍后再查看</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => (
                  <Card key={exam.exam_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{exam.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{exam.course.title}</span>
                        {getExamLevel(exam.course.level)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">状态</span>
                          {getExamStatusBadge(exam)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">题目数量</span>
                          <span className="font-medium">{exam.total_questions} 题</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">考试时长</span>
                          <span className="font-medium">{exam.duration_minutes} 分钟</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">及格分数</span>
                          <span className="font-medium">{exam.passing_score} / {exam.total_score}</span>
                        </div>
                        
                        {getExamActionButton(exam)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {renderPagination()}
            </>
          )}
    </div>
  );
}