import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, BookOpen, Calendar, Clock, CheckCircle, XCircle, Trophy, AlertCircle } from 'lucide-react';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user, logout } = useAuth();

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

  // 小兔子头像URL
  const rabbitAvatarUrl = "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&h=200&fit=crop&crop=face";

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="courses">课程信息</TabsTrigger>
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
                    <label className="text-sm font-medium text-gray-700">已报名课程</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{user.enrolledCourses.length} 门课程</p>
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
                  课程注册信息
                </CardTitle>
                <CardDescription>
                  查看您已注册的课程、有效期和考试安排
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.courseEnrollments && user.courseEnrollments.length > 0 ? (
                    user.courseEnrollments.map((enrollment, index) => (
                      <Card key={enrollment.courseId} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-4">
                                <h4 className="text-lg font-semibold">{enrollment.courseName}</h4>
                                <Badge variant="secondary">{enrollment.category}</Badge>
                                <Badge className={getStatusColor(enrollment.status)}>
                                  {getStatusIcon(enrollment.status)}
                                  <span className="ml-1">{getStatusText(enrollment.status)}</span>
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">注册时间</p>
                                    <p className="font-medium text-gray-900">{formatDate(enrollment.enrollmentDate)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">有效期至</p>
                                    <p className="font-medium text-gray-900">{formatDate(enrollment.validUntil)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <Trophy className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">考试时间</p>
                                    <p className="font-medium text-gray-900">{formatDate(enrollment.examDate)}</p>
                                    {isExamUpcoming(enrollment.examDate) && (
                                      <p className="text-xs text-red-600 font-medium">
                                        还有 {getDaysUntilExam(enrollment.examDate)} 天
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isExamUpcoming(enrollment.examDate) && (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    <div>
                                      <p className="font-medium text-yellow-800">考试提醒</p>
                                      <p className="text-sm text-yellow-700">
                                        距离考试还有 {getDaysUntilExam(enrollment.examDate)} 天，请抓紧时间复习准备。
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg text-gray-600 mb-2">暂无课程注册信息</h3>
                      <p className="text-gray-500 mb-4">
                        您还没有注册任何课程，请联系课程顾问了解更多信息
                      </p>
                      <Button onClick={() => window.open('tel:400-123-4567')}>
                        联系课程顾问
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}