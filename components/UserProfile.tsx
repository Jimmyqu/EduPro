import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, BookOpen, Calendar, Clock, CheckCircle, XCircle, Trophy, AlertCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { apiService, CourseEnrollmentApplication, isApiSuccess } from '../lib/api';
import { convertApiEnrollmentToLocal } from '../types/api';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<CourseEnrollmentApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  // 我的课程数据
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myCoursesLoading, setMyCoursesLoading] = useState(true);
  const [myCoursesError, setMyCoursesError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
    fetchMyCourses();
  }, [currentPage]);

  const fetchMyCourses = async () => {
    setMyCoursesLoading(true);
    setMyCoursesError(null);
    
    try {
      const response = await apiService.getMyCourses();
      
      if (isApiSuccess(response)) {
        const coursesData = response.data
          .map(convertApiEnrollmentToLocal)
          .filter(enrollment => enrollment !== null && enrollment.approval_status === 'approved');
        setMyCourses(coursesData);
      } else {
        setMyCoursesError(response.message);
      }
    } catch (err) {
      console.error('获取我的课程失败:', err);
      setMyCoursesError('获取我的课程失败，请稍后重试');
    } finally {
      setMyCoursesLoading(false);
    }
  };

  const fetchApplications = async () => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    
    try {
      const response = await apiService.getMyApplications({
        page: currentPage,
        per_page: perPage
      });
      
      if (isApiSuccess(response)) {
        setApplications(response.data.applications);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
      } else {
        setApplicationsError(response.message);
      }
    } catch (err) {
      console.error('获取申请记录失败:', err);
      setApplicationsError('获取申请记录失败，请稍后重试');
    } finally {
      setApplicationsLoading(false);
    }
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'completed': return <Trophy className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '学习中';
      case 'expired': return '已过期';
      case 'completed': return '已完成';
      default: return '未知状态';
    }
  };

  const getApplicationStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        label: '待审核',
        variant: 'secondary' as const,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        description: '申请已提交，等待管理员审核'
      },
      approved: {
        icon: CheckCircle,
        label: '已通过',
        variant: 'default' as const,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        description: '申请已通过，可以开始学习'
      },
      rejected: {
        icon: XCircle,
        label: '已拒绝',
        variant: 'destructive' as const,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        description: '申请被拒绝，请查看拒绝原因'
      },
      cancelled: {
        icon: AlertCircle,
        label: '已取消',
        variant: 'outline' as const,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        description: '申请已取消'
      }
    };

    return configs[status as keyof typeof configs] || {
      icon: AlertCircle,
      label: status,
      variant: 'outline' as const,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      description: ''
    };
  };

  const isExamUpcoming = (examDate: string) => {
    const exam = new Date(examDate);
    const now = new Date();
    const diffTime = exam.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const getDaysUntilExam = (examDate: string) => {
    const exam = new Date(examDate);
    const now = new Date();
    const diffTime = exam.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 小兔子头像URL
  const rabbitAvatarUrl = "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&h=200&fit=crop&crop=face";

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="courses">课程信息</TabsTrigger>
            <TabsTrigger value="applications">申请记录</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  个人信息
                </CardTitle>
                <CardDescription>
                  您的基本信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={rabbitAvatarUrl} alt={user.fullName} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl">{user.fullName}</h3>
                    <p className="text-gray-600">@{user.username}</p>
                    <p className="text-sm text-gray-500">
                      加入时间: {formatDate(user.joinDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">姓名</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{user.fullName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">用户名</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{user.username}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">注册时间</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{formatDate(user.joinDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">已通过课程</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{myCourses.length} 门课程</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  我的课程
                </CardTitle>
                <CardDescription>
                  查看您已审核通过的课程信息、学习期限和到期时间
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myCoursesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">加载中...</p>
                  </div>
                ) : myCoursesError ? (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{myCoursesError}</AlertDescription>
                    </Alert>
                    <Button onClick={fetchMyCourses} variant="outline">
                      重新加载
                    </Button>
                  </div>
                ) : myCourses.length > 0 ? (
                  <div className="space-y-4">
                    {myCourses.map((enrollment, index) => {
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
                        <Card key={enrollment.enrollment_id} className="border-l-4 border-l-green-500">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                  <h4 className="text-lg font-semibold">{enrollment.course.title}</h4>
                                  {enrollment.course.category && (
                                    <Badge variant="secondary">{enrollment.course.category}</Badge>
                                  )}
                                  <Badge variant="outline">
                                    {enrollment.course.level === 'beginner' ? '初级' :
                                     enrollment.course.level === 'intermediate' ? '中级' : '高级'}
                                  </Badge>
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    已通过
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">选课时间</p>
                                      <p className="font-medium text-gray-900">{formatDate(enrollment.enrolled_at)}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                      <Clock className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">到期时间</p>
                                      <p className={`font-medium ${
                                        isExpired ? 'text-red-600' : 
                                        isExpiringSoon ? 'text-orange-600' : 'text-gray-900'
                                      }`}>
                                        {getExpiryDate()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                      <Trophy className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600">剩余天数</p>
                                      <p className={`font-medium ${
                                        isExpired ? 'text-red-600' : 
                                        isExpiringSoon ? 'text-orange-600' : 'text-green-600'
                                      }`}>
                                        {isExpired ? '已过期' : `${enrollment.remaining_days} 天`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 审核通过时间 */}
                                {enrollment.approved_at && (
                                  <div className="mt-4 text-sm text-gray-600">
                                    <span className="font-medium">审核通过时间: </span>
                                    {formatDateTime(enrollment.approved_at)}
                                  </div>
                                )}
                                
                                {/* 学习期限警告 */}
                                {isExpiringSoon && !isExpired && (
                                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <AlertCircle className="h-5 w-5 text-orange-600" />
                                      <div>
                                        <p className="font-medium text-orange-800">学习提醒</p>
                                        <p className="text-sm text-orange-700">
                                          课程将在 {enrollment.remaining_days} 天后到期，请抓紧时间完成学习。
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {isExpired && (
                                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <XCircle className="h-5 w-5 text-red-600" />
                                      <div>
                                        <p className="font-medium text-red-800">课程已过期</p>
                                        <p className="text-sm text-red-700">
                                          该课程的学习期限已过期，无法继续访问课程内容。
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* 操作按钮 */}
                                {!isExpired && (
                                  <div className="mt-4">
                                    <Button 
                                      onClick={() => console.log('选课信息:', enrollment)}
                                      className="w-full"
                                    >
                                      查看课程
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-600 mb-2">暂无已通过的课程</h3>
                    <p className="text-gray-500 mb-4">
                      您还没有已审核通过的课程，请先申请课程并等待审核通过
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                      浏览课程列表
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  课程申请记录
                </CardTitle>
                <CardDescription>
                  查看您的课程报名申请记录和审核状态
                  {total > 0 && <span className="ml-2">• 共 {total} 条申请记录</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">加载中...</p>
                  </div>
                ) : applicationsError ? (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{applicationsError}</AlertDescription>
                    </Alert>
                    <Button onClick={fetchApplications} variant="outline">
                      重新加载
                    </Button>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-600 mb-2">暂无申请记录</h3>
                    <p className="text-gray-500 mb-4">
                      您还没有申请任何课程，快去浏览课程列表吧！
                    </p>
                    <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                      浏览课程
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => {
                      const statusConfig = getApplicationStatusConfig(application.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <Card key={application.application_id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">
                                  {application.course.title}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                  <span>{application.course.category}</span>
                                  <span>•</span>
                                  <span>{application.course.level === 'beginner' ? '初级' : 
                                         application.course.level === 'intermediate' ? '中级' : '高级'}</span>
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                                  <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                                </div>
                                <Badge variant={statusConfig.variant}>
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">申请时间:</span>
                                  <span className="text-gray-600">
                                    {formatDateTime(application.applied_at)}
                                  </span>
                                </div>

                                {application.reviewed_at && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">审核时间:</span>
                                    <span className="text-gray-600">
                                      {formatDateTime(application.reviewed_at)}
                                    </span>
                                  </div>
                                )}

                                {application.reviewer && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">审核人:</span>
                                    <span className="text-gray-600">
                                      {application.reviewer.full_name}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {application.application_reason && (
                                  <div>
                                    <label className="text-sm font-medium">申请理由:</label>
                                    <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                                      {application.application_reason}
                                    </p>
                                  </div>
                                )}

                                {application.review_comment && (
                                  <div>
                                    <label className="text-sm font-medium">审核意见:</label>
                                    <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                                      {application.review_comment}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t">
                              <p className="text-sm text-gray-500">
                                {statusConfig.description}
                              </p>
                            </div>

                            {application.status === 'approved' && (
                              <div className="pt-2">
                                <Button 
                                  onClick={() => console.log('申请信息:', application)}
                                  className="w-full"
                                >
                                  查看课程
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}