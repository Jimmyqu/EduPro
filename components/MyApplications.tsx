import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiService, CourseEnrollmentApplication, ApplicationListResponse, isApiSuccess } from '@/lib/api';

const MyApplications: React.FC = () => {
  const [applications, setApplications] = useState<CourseEnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    fetchApplications();
  }, [currentPage]);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    
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
        setError(response.message);
      }
    } catch (err) {
      console.error('获取申请记录失败:', err);
      setError('获取申请记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
        <Button 
          onClick={fetchApplications} 
          className="mt-4"
        >
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的申请</h1>
          <p className="text-muted-foreground mt-1">
            查看您的课程报名申请记录和状态
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          共 {total} 条申请记录
        </div>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">暂无申请记录</h3>
                <p className="text-muted-foreground">
                  您还没有申请任何课程，快去浏览课程列表吧！
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/coursewares'}
                variant="outline"
              >
                浏览课程
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={application.application_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
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
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">申请时间:</span>
                        <span className="text-muted-foreground">
                          {formatDate(application.applied_at)}
                        </span>
                      </div>

                      {application.reviewed_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">审核时间:</span>
                          <span className="text-muted-foreground">
                            {formatDate(application.reviewed_at)}
                          </span>
                        </div>
                      )}

                      {application.reviewer && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">审核人:</span>
                          <span className="text-muted-foreground">
                            {application.reviewer.full_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {application.application_reason && (
                        <div>
                          <label className="text-sm font-medium">申请理由:</label>
                          <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                            {application.application_reason}
                          </p>
                        </div>
                      )}

                      {application.review_comment && (
                        <div>
                          <label className="text-sm font-medium">审核意见:</label>
                          <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                            {application.review_comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      {statusConfig.description}
                    </p>
                  </div>

                  {application.status === 'approved' && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => console.log('课程申请信息:', application)}
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
    </div>
  );
};

export default MyApplications; 