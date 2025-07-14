import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Play, FileText, BookOpen, Settings, Trophy, TrendingUp, GraduationCap, ClipboardCheck, Lock, AlertCircle, Loader2 } from "lucide-react";
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

  // 确认对话框状态
  const [enrollDialog, setEnrollDialog] = useState<{
    isOpen: boolean;
    courseId: string;
    courseName: string;
  }>({
    isOpen: false,
    courseId: '',
    courseName: ''
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
      const myCoursesData = myCoursesResponse.data.map(convertApiEnrollmentToLocal);

      // 转换所有课程数据
      const allCoursesData = allCoursesResponse.data.courses.map(convertApiCourseToLocal);

      // 直接从enrollment数据创建课程进度信息（使用新的stats字段）
      const courseProgress = myCoursesData.map(convertEnrollmentToProgress);

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

  // 显示选课确认对话框
  const showEnrollDialog = (courseId: string, courseName: string) => {
    setEnrollDialog({
      isOpen: true,
      courseId,
      courseName
    });
  };

  // 确认选课处理
  const confirmEnrollCourse = async () => {
    const { courseId, courseName } = enrollDialog;
    
    try {
      setEnrollDialog(prev => ({ ...prev, isOpen: false }));
      
      const response = await apiService.enrollCourse(parseInt(courseId));
      if (isApiSuccess(response)) {
        toast.success(`成功选择《${courseName}》课程！`);
        // 重新获取数据
        fetchDashboardData();
      } else {
        toast.error("选课失败", { description: response.message });
      }
    } catch (error) {
      console.error("选课失败:", error);
      toast.error("选课失败", { description: "请稍后重试" });
    }
  };

  // 取消选课
  const cancelEnrollCourse = () => {
    setEnrollDialog({
      isOpen: false,
      courseId: '',
      courseName: ''
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

  const features = [
    {
      title: "学习课件",
      description: "下载课件材料和参考文档",
      icon: FileText,
      action: () => onNavigate('pdfs'),
      buttonText: "查看课件",
      subtitle: "教材和辅导资料"
    },
    {
      title: "视频学习",
      description: "观看专业培训视频课程",
      icon: Play,
      action: () => onNavigate('videos'),
      buttonText: "开始学习",
      subtitle: `${user.enrolledCourses?.length || 0} 门已报名课程`
    },
    {
      title: "练习测试",
      description: "通过测验检验学习成果",
      icon: BookOpen,
      action: () => onNavigate('exercises'),
      buttonText: "开始练习",
      subtitle: "巩固专业知识"
    },
    {
      title: "模拟考试",
      description: "正式考试模拟，全面评估能力",
      icon: ClipboardCheck,
      action: () => onNavigate('exams'),
      buttonText: "参加考试",
      subtitle: "检验学习成果"
    }
  ];

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
    const aHasAccess = hasAccess(a.id);
    const bHasAccess = hasAccess(b.id);
    
    if (aHasAccess && !bHasAccess) return -1;
    if (!aHasAccess && bHasAccess) return 1;
    return 0;
  });

  // 功能卡片组件
  const FeaturesGrid = ({ className = "" }: { className?: string }) => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="flex-grow">
              <div className="flex items-center space-x-2">
                <Icon className={`h-6 w-6 ${
                  feature.title === '模拟考试' ? 'text-orange-600' : 'text-blue-600'
                }`} />
                <CardTitle>{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
              <Badge variant="outline" className="w-fit">
                {feature.subtitle}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={feature.action} 
                className="w-full"
                variant={feature.title === '模拟考试' ? 'default' : 'default'}
              >
                {feature.buttonText}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

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
          {/* Features Grid - 移动端显示在"观看视频"统计之前 */}
          <div className="md:hidden">
            <FeaturesGrid />
          </div>

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

          {/* Features Grid - 桌面端显示在原位置 */}
          <div className="hidden md:block">
            <FeaturesGrid />
          </div>

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
                  const hasUserAccess = hasAccess(course.id);
                  const userProgress = courseProgress.find(p => p.courseId === course.id);
                  
                  return (
                    <div 
                      key={course.id} 
                      className={`p-4 border rounded-lg transition-all hover:shadow-md flex flex-col ${
                        hasUserAccess ? 'border-gray-200 hover:border-blue-300' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium ${hasUserAccess ? 'text-gray-900' : 'text-gray-600'}`}>
                          {course.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {hasUserAccess ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              已报名
                            </Badge>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Lock className="h-3 w-3 text-gray-400" />
                              <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                                未报名
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge variant="secondary" className="mb-2 text-xs w-fit">
                        {course.category}
                      </Badge>
                      
                      <p className={`text-sm mb-3 flex-grow ${hasUserAccess ? 'text-gray-600' : 'text-gray-500'}`}>
                        {course.description}
                      </p>
                      
                      <div className="text-xs text-gray-500 space-y-1 mb-3">
                        <div>课程级别：{course.level}</div>
                        <div>创建时间：{new Date(course.created_at).toLocaleDateString()}</div>
                      </div>

                      {/* 已报名课程显示学习进度 */}
                      {hasUserAccess && userProgress && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>学习进度</span>
                            <span>{userProgress.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${userProgress.completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* 未报名课程显示选课按钮 */}
                      {!hasUserAccess && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-blue-700">点击下方按钮选择此课程</span>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-auto">
                        {hasUserAccess ? (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onNavigate('videos')}
                          >
                            开始学习
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => showEnrollDialog(course.id, course.name)}
                          >
                            选择课程
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
          {courseProgress.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl">我的课程进度</h3>
                  <p className="text-gray-600">查看所有已报名课程的详细学习进度</p>
                </div>
                <Button onClick={fetchDashboardData} variant="outline">
                  刷新数据
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courseProgress
                  .sort((a, b) => b.completionPercentage - a.completionPercentage)
                  .map(course => (
                    <CourseProgressCard
                      key={course.courseId}
                      course={course}
                      onNavigate={onNavigate}
                    />
                  ))}
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

      {/* 选课确认对话框 */}
      <AlertDialog open={enrollDialog.isOpen} onOpenChange={(open) => !open && cancelEnrollCourse()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认选择课程</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要选择《{enrollDialog.courseName}》课程吗？
              <br />
              选择后您将可以访问该课程的所有学习资料和练习内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelEnrollCourse}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmEnrollCourse}>
              确认选择
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}