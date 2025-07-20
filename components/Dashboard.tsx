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
      console.log('准备转换课程进度，myCoursesData:', JSON.stringify(myCoursesData));
      const courseProgress = myCoursesData
        .map(enrollment => {
          console.log('处理单个enrollment:', JSON.stringify(enrollment));
          console.log('enrollment.course:', enrollment.course);
          // 使用id而不是course_id，因为convertApiCourseToLocal已经将course_id转换为id
          console.log('enrollment.course.id:', enrollment.course?.id);
          const progress = convertEnrollmentToProgress(enrollment);
          console.log('转换后的progress:', progress);
          return progress;
        })
        .filter(progress => progress !== null); // 过滤掉转换失败的数据
      
      console.log('最终的courseProgress:', courseProgress);

      // 计算学习统计（使用新的stats数据）
      const studyStats = {
        videosWatched: myCoursesData.reduce((sum, enrollment) => {
          console.log('计算videosWatched:', enrollment.stats?.viewed_videos);
          return sum + (enrollment.stats?.viewed_videos || 0);
        }, 0),
        exercisesCompleted: 0, // 暂未提供练习统计
        pdfsRead: myCoursesData.reduce((sum, enrollment) => {
          console.log('计算pdfsRead:', enrollment.stats?.viewed_documents);
          return sum + (enrollment.stats?.viewed_documents || 0);
        }, 0),
        studyHours: courseProgress.reduce((sum, course) => {
          console.log('计算studyHours:', course?.studyHours);
          return sum + (course?.studyHours || 0);
        }, 0)
      };
      
      console.log('计算得到的studyStats:', studyStats);

      // 更新状态
      const enrolledCourses = myCoursesData.map(c => {
        console.log('提取enrolledCourses的course.id:', c.course?.id);
        return c.course?.id;
      }).filter(id => id !== undefined);
      
      console.log('enrolledCourses:', enrolledCourses);

      setDashboardData({
        user: {
          ...userData,
          studyStats,
          enrolledCourses,
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
  const hasAccess = (courseId: string | number): boolean => {
    // 确保courseId是字符串类型
    const courseIdStr = courseId?.toString();
    // 安全检查
    if (!courseIdStr || !dashboardData.user?.enrolledCourses) {
      return false;
    }
    return dashboardData.user.enrolledCourses.includes(courseIdStr);
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
        // 需要通过的课程，调用申请接口
        response = await apiService.applyCourse(course.course_id, applicationReason);
      } else {
        // 不需要通过的课程，直接选课
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

  // 按权限状态排序课程：可学习程在前，未选课程在后
  const sortedCourses = [...allCourses].sort((a, b) => {
    // 安全检查，确保course_id存在并转换为字符串
    const aId = a.course_id?.toString();
    const bId = b.course_id?.toString();
    
    // 如果id不存在，将其排在后面
    if (!aId) return 1;
    if (!bId) return -1;
    
    const aHasAccess = hasAccess(aId);
    const bHasAccess = hasAccess(bId);
    
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
          
          {/* 学习资源卡片区域 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 学习课件卡片 */}
            <div 
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex flex-col"
              onClick={() => onNavigate('coursewares')}
            >
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5" />
                <h3 className="leading-none">学习课件</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">下载课件材料和参考文档</p>
              <div className="text-xs">教材和课程资料</div>
              <div className="mt-auto pt-2">
                <Button size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('pdfs');
                }}>
                  查看课件
                </Button>
              </div>
            </div>

            {/* 视频学习卡片 */}
            <div 
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex flex-col"
              onClick={() => onNavigate('videos')}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Play className="h-5 w-5" />
                <h3 className="leading-none">视频学习</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">观看专业培训视频课程</p>
              <div className="text-xs">已报名课程</div>
              <div className="mt-auto pt-2">
                <Button size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('videos');
                }}>
                  开始学习
                </Button>
              </div>
            </div>

            {/* 练习测试卡片 */}
            <div 
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex flex-col"
              onClick={() => onNavigate('exercises')}
            >
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-5 w-5" />
                <h3 className="leading-none">练习测试</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">通过测验检验学习成果</p>
              <div className="text-xs">巩固专业知识</div>
              <div className="mt-auto pt-2">
                <Button size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('exercises');
                }}>
                  开始练习
                </Button>
              </div>
            </div>

            {/* 模拟考试卡片 */}
            <div 
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all flex flex-col"
              onClick={() => onNavigate('exams')}
            >
                <div className="flex items-center space-x-2 mb-2">
                <ClipboardCheck className="h-5 w-5" />
                <h3 className="leading-none">模拟考试</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">正式考试模拟，全面评估能力</p>
              <div className="text-xs">检验学习成果</div>
              <div className="mt-auto pt-2">
                <Button size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('exams');
                }}>
                  参加考试
                </Button>
              </div>
            </div>
          </div>

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
                  // 安全检查，确保course_id存在
                  const courseId = course.course_id?.toString();
                  if (!courseId) {
                    console.error('课程缺少course_id:', course);
                    return null; // 跳过没有ID的课程
                  }
                  
                  const hasUserAccess = hasAccess(courseId);
                  const userProgress = courseProgress.find(p => p.courseId === courseId);
                  const userEnrollment = myCourses.find(e => e.course?.id === courseId);
                  
                  // 获取课程状态信息
                  const getEnrollmentStatusBadge = () => {
                    if (hasUserAccess) {
                      return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">可学习</Badge>;
                    }
                    // 移除报名时间检查，课程随时可报名
                    // if (!course.is_enrollment_open) {
                    //   return <Badge variant="outline" className="text-xs">报名已结束</Badge>;
                    // }
                    // if (course.requires_approval) {
                    //   return <Badge variant="secondary" className="text-xs">需要通过</Badge>;
                    // }
                    // return <Badge variant="default" className="text-xs">可直接报名</Badge>;
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
                          // 可学习程，显示课程信息
                          console.log('可学习程:', course);
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
                        {/* <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>学习期限: {course.learning_days} 天</span>
                        </div>
                         */}
                        {hasUserAccess && userEnrollment && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-orange-600">
                              剩余时间: {userEnrollment.remaining_days !== undefined ? `${userEnrollment.remaining_days} 天` : '计算中...'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 可学习显示学习进度 */}
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
                        ) : null}
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
                    // 安全检查，确保course存在
                    if (!enrollment.course) {
                      console.error('enrollment缺少course:', enrollment);
                      return null; // 跳过没有course的enrollment
                    }
                    
                    const courseId = enrollment.course.id;
                    if (!courseId) {
                      console.error('enrollment.course缺少id:', enrollment.course);
                      return null; // 跳过没有id的course
                    }
                    
                    const progress = courseProgress.find(p => p.courseId === courseId);
                    
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
                      <div 
                        key={enrollment.enrollment_id} 
                        className="p-4 border rounded-lg transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{enrollment.course.title}</h4>
                            <p className="text-xs text-gray-500">
                              {enrollment.course.category || '健康管理'}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-2">
                          总体进度: {new Date(enrollment.enrolled_at).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})}日
                        </p>
                        
                        {/* 总体进度条 - 使用stats中的视频和文档数据计算 */}
                        {(() => {
                          // 计算总体进度
                          const totalItems = (enrollment.stats?.total_videos || 0) + (enrollment.stats?.total_documents || 0);
                          const viewedItems = (enrollment.stats?.viewed_videos || 0) + (enrollment.stats?.viewed_documents || 0);
                          const overallProgress = totalItems > 0 ? Math.round((viewedItems / totalItems) * 100) : 0;
                          
                          return (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                              <div 
                                className="bg-primary h-1.5 rounded-full" 
                                style={{ width: `${overallProgress}%` }}
                              ></div>
                            </div>
                          );
                        })()}
                        
                        {/* 学习统计 */}
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div className="text-center">
                            <div className="font-medium">视频</div>
                            <div className="text-gray-700">
                              {enrollment.stats?.viewed_videos || 0}/{enrollment.stats?.total_videos || 0}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-primary h-1 rounded-full" 
                                style={{ 
                                  width: `${enrollment.stats?.total_videos > 0 
                                    ? (enrollment.stats.viewed_videos / enrollment.stats.total_videos) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-medium">练习</div>
                            <div className="text-gray-700">
                              {enrollment.stats?.participated_exercises || 0}/{enrollment.stats?.total_exercises || 0}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-primary h-1 rounded-full" 
                                style={{ 
                                  width: `${enrollment.stats?.total_exercises > 0 
                                    ? (enrollment.stats.participated_exercises / enrollment.stats.total_exercises) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="font-medium">资料</div>
                            <div className="text-gray-700">
                              {enrollment.stats?.viewed_documents || 0}/{enrollment.stats?.total_documents || 0}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div 
                                className="bg-primary h-1 rounded-full" 
                                style={{ 
                                  width: `${enrollment.stats?.total_documents > 0 
                                    ? (enrollment.stats.viewed_documents / enrollment.stats.total_documents) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 学习时长和按钮 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>学习时长: {Math.round(((enrollment.stats?.viewed_videos || 0) * 0.5) + ((enrollment.stats?.viewed_documents || 0) * 0.3))}小时</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onNavigate('videos')}
                            className="h-7 text-xs"
                          >
                            继续学习
                          </Button>
                        </div>
                      </div>
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