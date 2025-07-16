import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Play, FileText, BookOpen, Settings, Trophy, TrendingUp, GraduationCap, ClipboardCheck, Lock, AlertCircle, Loader2, Clock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { CourseProgressCard } from "./CourseProgressCard";
import { CourseStatsOverview } from "./CourseStatsOverview";
import { Section } from "../types/navigation";
import { toast } from "sonner";
import { apiService, isApiSuccess } from "../lib/api";
import { 
  ApiUser, 
  ApiCourse, 
  ApiEnrollment, 
  ApiLearningProgress,
  convertApiUserToLocal, 
  convertApiCourseToLocal,
  convertApiEnrollmentToLocal,
  convertApiProgressToLocal,
  convertEnrollmentToProgress 
} from "../types/api";

interface DashboardProps {
  onNavigate: (section: Section) => void;
}

// 定义本地状态类型
interface DashboardData {
  user: any;
  myCourses: any[];
  allCourses: any[];
  courseProgress: any[];
  isLoading: boolean;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user: authUser } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    myCourses: [],
    allCourses: [],
    courseProgress: [],
    isLoading: true
  });

  // 申请报名对话框状态
  const [enrollDialog, setEnrollDialog] = useState<{
    isOpen: boolean;
    course: any;
    applicationReason: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    course: null,
    applicationReason: '',
    isSubmitting: false
  });

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    if (!authUser) return;

    try {
      setDashboardData(prev => ({ ...prev, isLoading: true }));

      // 并行获取所有需要的数据
      const [profileResponse, myCoursesResponse, allCoursesResponse] = await Promise.all([
        apiService.getProfile(),
        apiService.getMyCourses(),
        apiService.getCourses({ per_page: 50 }) // 获取更多课程用于展示
      ]);

      // 检查响应状态
      if (!isApiSuccess(profileResponse)) {
        toast.error("获取用户信息失败", { description: profileResponse.message });
        return;
      }

      if (!isApiSuccess(myCoursesResponse)) {
        toast.error("获取我的课程失败", { description: myCoursesResponse.message });
        return;
      }

      if (!isApiSuccess(allCoursesResponse)) {
        toast.error("获取课程列表失败", { description: allCoursesResponse.message });
        return;
      }

      // 转换用户数据
      const userData = convertApiUserToLocal(profileResponse.data);

      // 转换我的课程数据
      console.log('原始我的课程数据:', myCoursesResponse.data);
      const myCoursesData = myCoursesResponse.data
        .map(convertApiEnrollmentToLocal)
        .filter(enrollment => enrollment !== null); // 过滤掉转换失败的数据
      console.log('转换后的我的课程数据:', myCoursesData);

      // 直接使用新的课程数据（包含报名状态等信息）
      const allCoursesData = allCoursesResponse.data.courses;

      // 直接从enrollment数据创建课程进度信息（使用新的stats字段）
      const courseProgress = myCoursesData
        .map(convertEnrollmentToProgress)
        .filter(progress => progress !== null); // 过滤掉转换失败的数据

      // 计算学习统计（使用新的stats数据）
      const studyStats = {
        videosWatched: myCoursesData.reduce((sum, enrollment) => sum + (enrollment.stats?.viewed_videos || 0), 0),
        exercisesCompleted: 0, // 暂未提供练习统计
        pdfsRead: myCoursesData.reduce((sum, enrollment) => sum + (enrollment.stats?.viewed_documents || 0), 0),
        studyHours: courseProgress.reduce((sum, course) => sum + (course.studyHours || 0), 0)
      };

      // 更新状态
      setDashboardData({
        user: {
          ...userData,
          studyStats,
          enrolledCourses: myCoursesData.map(c => c.course.id),
          courseProgress
        },
        myCourses: myCoursesData,
        allCourses: allCoursesData,
        courseProgress,
        isLoading: false
      });

    } catch (error) {
      console.error("获取仪表板数据失败:", error);
      toast.error("加载数据失败", { description: "请刷新页面重试" });
      setDashboardData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 使用ref防止在严格模式下重复调用API
  const initialFetchRef = useRef<string | null>(null);
  
  // 组件挂载时获取数据
  useEffect(() => {
    // authUser变化或首次加载时获取数据
    // 避免在严格模式下重复调用API
    if (authUser && (!initialFetchRef.current || initialFetchRef.current !== authUser.id)) {
      initialFetchRef.current = authUser.id;
      fetchDashboardData();
    }
  }, [authUser]);

  // 检查用户是否有课程访问权限
  const hasAccess = (courseId: string): boolean => {
    return dashboardData.user?.enrolledCourses?.includes(courseId) || false;
  };

  // 显示权限提示
  const showAccessDeniedAlert = (courseName: string) => {
    toast.error(`您没有权限访问《${courseName}》课程。`, {
      description: "请联系管理员或报名该课程以获取访问权限。",
      duration: 4000,
    });
  };

  // 显示申请报名对话框
  const showEnrollDialog = (course: any) => {
    setEnrollDialog({
      isOpen: true,
      course,
      applicationReason: '',
      isSubmitting: false
    });
  };

  // 确认申请报名处理
  const confirmEnrollCourse = async () => {
    const { course, applicationReason } = enrollDialog;
    
    if (!course) return;
    
    try {
      setEnrollDialog(prev => ({ ...prev, isSubmitting: true }));
      
      let response;
      if (course.requires_approval) {
        // 需要审核的课程，调用申请接口
        response = await apiService.applyCourse(course.course_id, applicationReason);
      } else {
        // 不需要审核的课程，直接选课
        response = await apiService.enrollCourse(course.course_id);
      }
      
      if (isApiSuccess(response)) {
        toast.success(
          course.requires_approval 
            ? `成功提交《${course.title}》课程申请，请等待审核！`
            : `成功选择《${course.title}》课程！`
        );
        setEnrollDialog({
          isOpen: false,
          course: null,
          applicationReason: '',
          isSubmitting: false
        });
        // 重新获取数据
        fetchDashboardData();
      } else {
        toast.error("申请失败", { description: response.message });
        setEnrollDialog(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (error) {
      console.error("申请失败:", error);
      toast.error("申请失败", { description: "请稍后重试" });
      setEnrollDialog(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // 取消申请
  const cancelEnrollCourse = () => {
    setEnrollDialog({
      isOpen: false,
      course: null,
      applicationReason: '',
      isSubmitting: false
    });
  };

  // 加载状态
  if (dashboardData.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">加载中...</span>
        </div>
      </div>
    );
  }

  // 用户数据不存在
  if (!dashboardData.user) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg text-gray-600 mb-2">无法获取用户信息</h3>
            <p className="text-gray-500 text-center mb-4">请重新登录</p>
            <Button onClick={() => window.location.reload()}>刷新页面</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = dashboardData.user;
  const { courseProgress, myCourses, allCourses } = dashboardData;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  const recentCourses = courseProgress
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
    .slice(0, 2);

  // 按权限状态排序课程：已选课程在前，未选课程在后
  const sortedCourses = [...allCourses].sort((a, b) => {
    const aHasAccess = hasAccess(a.course_id.toString());
    const bHasAccess = hasAccess(b.course_id.toString());
    
    if (aHasAccess && !bHasAccess) return -1;
    if (!aHasAccess && bHasAccess) return 1;
    return 0;
  });


  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.fullName} />
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl">{getGreeting()}，{user.fullName}！</h1>
          </div>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">学习概览</TabsTrigger>
          <TabsTrigger value="courses">我的课程</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* Stats Overview - "观看视频"等统计信息 */}
          <CourseStatsOverview courseProgress={courseProgress} />

          {/* Recent Activity */}
          {recentCourses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>最近学习</span>
                </CardTitle>
                <CardDescription>您最近正在学习的课程</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentCourses.map(course => (
                    <CourseProgressCard
                      key={course.courseId}
                      course={course}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {(user.studyStats?.videosWatched >= 10 || user.studyStats?.exercisesCompleted >= 15 || user.studyStats?.studyHours >= 20) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>学习成就</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.studyStats?.videosWatched >= 10 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      视频学习达人
                    </Badge>
                  )}
                  {user.studyStats?.exercisesCompleted >= 15 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      练习专家
                    </Badge>
                  )}
                  {user.studyStats?.studyHours >= 20 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      勤奋学员
                    </Badge>
                  )}
                  {courseProgress.some(course => course.completionPercentage >= 80) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      课程优秀
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Courses Overview - 显示所有课程，区分权限状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <span>课程中心</span>
              </CardTitle>
              <CardDescription>浏览所有可用的职业培训课程</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCourses.map(course => {
                  const hasUserAccess = hasAccess(course.course_id.toString());
                  const userProgress = courseProgress.find(p => p.courseId === course.course_id.toString());
                  const userEnrollment = myCourses.find(e => e.course.course_id === course.course_id);
                  
                  // 获取课程状态信息
                  const getEnrollmentStatusBadge = () => {
                    if (hasUserAccess) {
                      return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">已选课</Badge>;
                    }
                    // 移除报名时间检查，课程随时可报名
                    // if (!course.is_enrollment_open) {
                    //   return <Badge variant="outline" className="text-xs">报名已结束</Badge>;
                    // }
                    if (course.requires_approval) {
                      return <Badge variant="secondary" className="text-xs">需要审核</Badge>;
                    }
                    return <Badge variant="default" className="text-xs">可直接报名</Badge>;
                  };

                  const getLevelBadge = (level: string) => {
                    const levelMap = {
                      'beginner': { label: '初级', variant: 'secondary' as const },
                      'intermediate': { label: '中级', variant: 'default' as const },
                      'advanced': { label: '高级', variant: 'destructive' as const }
                    };
                    const levelInfo = levelMap[level as keyof typeof levelMap];
                    return levelInfo ? (
                      <Badge variant={levelInfo.variant} className="text-xs">{levelInfo.label}</Badge>
                    ) : (
                      <Badge className="text-xs">{level}</Badge>
                    );
                  };

                  const formatDate = (dateString: string) => {
                    return new Date(dateString).toLocaleDateString('zh-CN');
                  };
                  
                                      return (
                      <div 
                        key={course.course_id} 
                      className={`p-4 border rounded-lg transition-all hover:shadow-md flex flex-col cursor-pointer ${
                        hasUserAccess ? 'border-green-200 bg-green-50/30' : 
                        course.can_enroll ? 'border-gray-200 hover:border-blue-300' : 'border-gray-100 bg-gray-50'
                      }`}
                      onClick={() => {
                        if (hasUserAccess) {
                          // 已选课程，显示课程信息
                          console.log('已选课程:', course);
                        } else if (course.can_enroll) {
                          // 未选课程，直接显示报名确认弹窗
                          showEnrollDialog(course);
                        } else {
                          // 不可报名，显示提示
                          toast.error('该课程暂不可报名');
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium ${hasUserAccess ? 'text-gray-900' : 'text-gray-700'}`}>
                          {course.title}
                        </h4>
                        <div className="flex items-center space-x-1 flex-wrap gap-1">
                          {getLevelBadge(course.level)}
                          {getEnrollmentStatusBadge()}
                        </div>
                      </div>
                      
                      {course.category && (
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{course.category}</span>
                        </div>
                      )}
                      
                      <p className={`text-sm mb-3 flex-grow ${hasUserAccess ? 'text-gray-600' : 'text-gray-500'} line-clamp-2`}>
                        {course.description || '暂无课程描述'}
                      </p>
                      
                      {/* 简化的课程信息 */}
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>学习期限: {course.learning_days} 天</span>
                        </div>
                        
                        {hasUserAccess && userEnrollment && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-orange-600">
                              剩余学习天数: {userEnrollment.remaining_days !== undefined ? `${userEnrollment.remaining_days} 天` : '计算中...'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 已选课显示学习进度 */}
                      {hasUserAccess && userProgress && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>学习进度</span>
                            <span>{userProgress.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${userProgress.completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* 课程状态提示 */}
                      {!hasUserAccess && (
                        <div className={`mb-3 p-2 rounded border ${
                          course.can_enroll ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {course.can_enroll ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <span className="text-xs text-blue-700">
                                  {course.requires_approval ? '点击申请报名（需要审核）' : '点击直接报名'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 text-gray-500" />
                                <span className="text-xs text-gray-600">
                                  {!course.is_enrollment_open ? '报名时间已过' : '暂不可报名'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-auto">
                        {hasUserAccess ? (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('videos');
                            }}
                          >
                            开始学习
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            disabled={!course.can_enroll}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (course.can_enroll) {
                                // 直接显示报名确认弹窗
                                showEnrollDialog(course);
                              }
                            }}
                          >
                            {course.can_enroll ? (course.requires_approval ? '申请报名' : '立即报名') : '暂不可报名'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          {myCourses.filter(course => course.approval_status === 'approved').length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl">我的课程</h3>
                  <p className="text-gray-600">查看所有已审核通过的课程和学习进度</p>
                </div>
                <Button onClick={fetchDashboardData} variant="outline">
                  刷新数据
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myCourses
                  .filter(enrollment => enrollment.approval_status === 'approved')
                  .sort((a, b) => {
                    // 按选课时间排序（最新的在前）
                    return new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime();
                  })
                  .map(enrollment => {
                    const progress = courseProgress.find(p => p.courseId === enrollment.course.course_id.toString());
                    
                    // 计算到期时间
                    const getExpiryDate = () => {
                      if (enrollment.valid_until) {
                        return new Date(enrollment.valid_until).toLocaleDateString('zh-CN');
                      }
                      return '计算中...';
                    };
                    
                    // 判断是否即将到期（7天内）
                    const isExpiringSoon = enrollment.remaining_days <= 7 && enrollment.remaining_days > 0;
                    const isExpired = enrollment.remaining_days <= 0;
                    
                    return (
                      <Card key={enrollment.enrollment_id} className="hover:shadow-lg transition-shadow border-green-200 bg-green-50/30">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                            <div className="flex flex-col gap-1">
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                已通过
                              </Badge>
                              {enrollment.course.level && (
                                <Badge variant="outline" className="text-xs">
                                  {enrollment.course.level === 'beginner' ? '初级' :
                                   enrollment.course.level === 'intermediate' ? '中级' : '高级'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            {enrollment.course.description || '暂无课程描述'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* 课程基本信息 */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">学习期限: </span>
                                <span>{enrollment.course.learning_days} 天</span>
                              </div>
                              <div>
                                <span className="text-gray-500">选课时间: </span>
                                <span>{new Date(enrollment.enrolled_at).toLocaleDateString('zh-CN')}</span>
                              </div>
                            </div>
                            
                            {/* 审核通过时间 */}
                            {enrollment.approved_at && (
                              <div className="text-sm">
                                <span className="text-gray-500">审核通过时间: </span>
                                <span>{new Date(enrollment.approved_at).toLocaleDateString('zh-CN')}</span>
                              </div>
                            )}
                            
                            {/* 学习期限信息 */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">到期时间: </span>
                                <span className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                                  {getExpiryDate()}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">剩余天数: </span>
                                <span className={
                                  isExpired ? 'text-red-600 font-medium' :
                                  isExpiringSoon ? 'text-orange-600 font-medium' : 'text-green-600'
                                }>
                                  {isExpired ? '已过期' : `${enrollment.remaining_days} 天`}
                                </span>
                              </div>
                            </div>
                            
                            {/* 过期警告 */}
                            {isExpiringSoon && !isExpired && (
                              <div className="bg-orange-100 border border-orange-200 rounded p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-orange-600" />
                                  <span className="text-orange-800">
                                    课程即将到期，请抓紧时间学习！
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {isExpired && (
                              <div className="bg-red-100 border border-red-200 rounded p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-red-800">
                                    课程学习期限已过期，无法继续学习
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* 学习进度 */}
                            {progress && (
                              <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>学习进度</span>
                                  <span>{progress.completionPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${progress.completionPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {/* 操作按钮 */}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                onClick={() => onNavigate('videos')} 
                                className="flex-1"
                                disabled={isExpired}
                              >
                                {isExpired ? '课程已过期' : '开始学习'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg text-gray-600 mb-2">还没有选择任何课程</h3>
                <p className="text-gray-500 text-center mb-4">
                  请选择您感兴趣的职业培训课程开始学习
                </p>
                <div className="flex space-x-4">
                  <Button onClick={() => onNavigate('videos')}>
                    浏览课程内容
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={fetchDashboardData}
                  >
                    刷新数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 申请报名对话框 */}
      <Dialog open={enrollDialog.isOpen} onOpenChange={(open) => !open && cancelEnrollCourse()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {enrollDialog.course?.requires_approval ? '申请报名课程' : '确认选择课程'}
            </DialogTitle>
            <DialogDescription>
              {enrollDialog.course && (
                <div className="space-y-2">
                  <div>课程名称：《{enrollDialog.course.title}》</div>
                  <div>学习期限：{enrollDialog.course.learning_days} 天</div>
                  <div>难度等级：{
                    enrollDialog.course.level === 'beginner' ? '初级' :
                    enrollDialog.course.level === 'intermediate' ? '中级' : '高级'
                  }</div>
                  {enrollDialog.course.requires_approval && (
                    <div className="text-orange-600">
                      ⚠️ 该课程需要管理员审核，请填写申请理由
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {enrollDialog.course?.requires_approval && (
            <div className="space-y-2">
              <Label htmlFor="applicationReason">申请理由 *</Label>
              <Textarea
                id="applicationReason"
                placeholder="请简要说明您的学习目标和申请理由..."
                value={enrollDialog.applicationReason}
                onChange={(e) => setEnrollDialog(prev => ({ 
                  ...prev, 
                  applicationReason: e.target.value 
                }))}
                className="min-h-[80px]"
              />
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={cancelEnrollCourse}
              disabled={enrollDialog.isSubmitting}
            >
              取消
            </Button>
            <Button 
              onClick={confirmEnrollCourse}
              disabled={
                enrollDialog.isSubmitting || 
                (enrollDialog.course?.requires_approval && !enrollDialog.applicationReason.trim())
              }
            >
              {enrollDialog.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {enrollDialog.course?.requires_approval ? '提交申请中...' : '选课中...'}
                </>
              ) : (
                enrollDialog.course?.requires_approval ? '提交申请' : '确认选择'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}