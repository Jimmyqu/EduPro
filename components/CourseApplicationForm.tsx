import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiService, Course, ApplicationStatusResponse, isApiSuccess } from '@/lib/api';

interface CourseApplicationFormProps {
  course: Course;
  onApplicationSubmitted?: (success: boolean, message: string) => void;
}

const CourseApplicationForm: React.FC<CourseApplicationFormProps> = ({
  course,
  onApplicationSubmitted
}) => {
  const [applicationReason, setApplicationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取申请状态
  React.useEffect(() => {
    const fetchApplicationStatus = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getCourseApplicationStatus(course.course_id);
        if (isApiSuccess(response)) {
          setApplicationStatus(response.data);
        }
      } catch (error) {
        console.error('获取申请状态失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationStatus();
  }, [course.course_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course.can_enroll) {
      onApplicationSubmitted?.(false, '当前课程不接受报名');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;
      
      if (course.requires_approval) {
        // 需要通过，提交申请
        response = await apiService.applyCourse(course.course_id, applicationReason);
      } else {
        // 不需要通过，直接选课
        response = await apiService.enrollCourse(course.course_id);
      }
      
      if (isApiSuccess(response)) {
        onApplicationSubmitted?.(true, response.message);
        // 重新获取申请状态
        const statusResponse = await apiService.getCourseApplicationStatus(course.course_id);
        if (isApiSuccess(statusResponse)) {
          setApplicationStatus(statusResponse.data);
        }
      } else {
        onApplicationSubmitted?.(false, response.message);
      }
    } catch (error) {
      console.error('申请失败:', error);
      onApplicationSubmitted?.(false, '申请失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: '待审核', variant: 'secondary' as const },
      'approved': { label: '已通过', variant: 'default' as const },
      'rejected': { label: '已拒绝', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    return statusInfo ? (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    ) : (
      <Badge>{status}</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 课程状态信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            课程报名信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 移除报名时间显示，课程随时可报名 */}
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Label className="text-sm font-medium">学习期限</Label>
              <p className="text-sm text-muted-foreground">
                {course.learning_days} 天
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="text-sm font-medium">已报名人数</Label>
              <p className="text-sm text-muted-foreground">
                {course.current_student_count} 人
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <Label className="text-sm font-medium">审核要求</Label>
              <p className="text-sm text-muted-foreground">
                {course.requires_approval ? '需要管理员审核' : '免审核'}
              </p>
            </div>
          </div>

          {/* 移除报名时间状态提示 */}

          {/* 移除人数限制检查 */}
        </CardContent>
      </Card>

      {/* 申请状态 */}
      {applicationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>申请状态</CardTitle>
          </CardHeader>
          <CardContent>
            {applicationStatus.has_enrolled ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">已成功选课</span>
                  {getStatusBadge(applicationStatus.enrollment?.approval_status || '')}
                </div>
                
                {applicationStatus.enrollment && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {applicationStatus.enrollment.approved_at && (
                      <p>通过时间: {formatDate(applicationStatus.enrollment.approved_at)}</p>
                    )}
                    {applicationStatus.enrollment.valid_until && (
                      <p>学习有效期至: {formatDate(applicationStatus.enrollment.valid_until)}</p>
                    )}
                    {applicationStatus.enrollment.days_until_expiry !== undefined && (
                      <p>剩余天数: {applicationStatus.enrollment.days_until_expiry} 天</p>
                    )}
                  </div>
                )}
              </div>
            ) : applicationStatus.has_applied ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">已提交申请</span>
                  {getStatusBadge(applicationStatus.application?.status || '')}
                </div>
                
                {applicationStatus.application && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>申请时间: {formatDate(applicationStatus.application.applied_at)}</p>
                    {applicationStatus.application.application_reason && (
                      <p>申请理由: {applicationStatus.application.application_reason}</p>
                    )}
                    {applicationStatus.application.review_comment && (
                      <p>审核意见: {applicationStatus.application.review_comment}</p>
                    )}
                    {applicationStatus.application.reviewed_at && (
                      <p>审核时间: {formatDate(applicationStatus.application.reviewed_at)}</p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* 申请表单 */}
      {(!applicationStatus?.has_enrolled && !applicationStatus?.has_applied) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {course.requires_approval ? '申请报名' : '立即选课'}
            </CardTitle>
            <CardDescription>
              {course.requires_approval 
                ? '请填写申请理由，提交后等待管理员审核'
                : '此课程无需审核，可以直接选课'
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {course.requires_approval && (
                <div className="space-y-2">
                  <Label htmlFor="applicationReason">申请理由</Label>
                  <Textarea
                    id="applicationReason"
                    placeholder="请简述您申请本课程的理由，如学习目标、相关背景等..."
                    value={applicationReason}
                    onChange={(e) => setApplicationReason(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {!course.can_enroll && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {/* 移除报名时间检查 */}
                    当前课程不可报名
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting || !course.can_enroll}
                className="w-full"
              >
                {isSubmitting ? '提交中...' : (
                  course.requires_approval ? '提交申请' : '立即选课'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
};

export default CourseApplicationForm; 