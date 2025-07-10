import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Play, FileText, BookOpen, Settings, Trophy, TrendingUp, GraduationCap, ClipboardCheck, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { CourseProgressCard } from "./CourseProgressCard";
import { CourseStatsOverview } from "./CourseStatsOverview";

type Section = 'dashboard' | 'pdfs' | 'videos' | 'exercises' | 'exams' | 'profile';

interface DashboardProps {
  onNavigate: (section: Section | string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user, availableCourses, hasAccess } = useAuth();

  if (!user) return null;

  // Safe access to courseProgress with default empty array
  const courseProgress = user.courseProgress || [];
  const enrolledCourses = user.enrolledCourses || [];

  // 显示权限提示
  const showAccessDeniedAlert = (courseName: string) => {
    alert(`您没有权限访问《${courseName}》课程。`);
  };

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
      subtitle: `${enrolledCourses.length} 门已报名课程`
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

  // 获取已报名的课程信息
  const enrolledCourseDetails = availableCourses.filter(course => 
    enrolledCourses.includes(course.id)
  );

  // 按权限状态排序课程：有权限的在前，无权限的在后
  const sortedCourses = [...availableCourses].sort((a, b) => {
    const aHasAccess = hasAccess(a.id);
    const bHasAccess = hasAccess(b.id);
    
    // 如果权限状态不同，有权限的排在前面
    if (aHasAccess && !bHasAccess) return -1;
    if (!aHasAccess && bHasAccess) return 1;
    
    // 如果权限状态相同，按原始顺序排列
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
            <p className="text-gray-600">继续您的职业培训学习</p>
          </div>
        </div>
        
        <Button 
          onClick={() => onNavigate('profile')} 
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>个人资料</span>
        </Button>
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
                        <div>预计学时：{course.estimatedHours}小时</div>
                        <div>视频：{course.totalVideos}个 | 练习：{course.totalExercises}套</div>
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

                      {/* 未报名课程显示权限提示 */}
                      {!hasUserAccess && (
                        <div 
                          className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded cursor-pointer hover:bg-amber-100 transition-colors"
                          onClick={() => showAccessDeniedAlert(course.name)}
                        >
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="text-xs text-amber-700">点击了解详情</span>
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
                            variant="outline" 
                            className="flex-1"
                            onClick={() => showAccessDeniedAlert(course.name)}
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            查看详情
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
          {courseProgress.filter(course => hasAccess(course.courseId)).length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl">我的课程进度</h3>
                  <p className="text-gray-600">查看所有已报名课程的详细学习进度</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courseProgress
                  .filter(course => hasAccess(course.courseId))
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
                <h3 className="text-lg text-gray-600 mb-2">还没有开始学习课程</h3>
                <p className="text-gray-500 text-center mb-4">
                  请联系课程顾问报名您感兴趣的职业培训课程
                </p>
                <div className="flex space-x-4">
                  <Button onClick={() => onNavigate('videos')}>
                    浏览课程内容
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('tel:400-123-4567')}
                  >
                    联系课程顾问
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}