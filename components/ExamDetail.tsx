import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Timer, BookOpen } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { ApiExamDetail, Question, ExamQuestion } from '@/lib/api';

interface UserAnswer {
  questionId: number;
  answer: string;
}

export default function ExamDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [exam, setExam] = useState<ApiExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadExamDetail();
    }
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (examStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // 时间到，自动提交
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStarted, timeRemaining]);

  const loadExamDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamDetail(Number(id));
      if (response.data) {
        setExam(response.data);
        
        // 初始化用户答案数组
        if (response.data.questions) {
          setUserAnswers(response.data.questions.map(q => ({ questionId: q.question.question_id, answer: '' })));
        }
      }
    } catch (err) {
      setError('加载考试详情失败');
      console.error('Error loading exam detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    if (exam?.duration_minutes) {
      setTimeRemaining(exam.duration_minutes * 60); // 转换为秒
    }
    setExamStarted(true);
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers(prev =>
      prev.map(ua =>
        ua.questionId === questionId ? { ...ua, answer } : ua
      )
    );
  };

  const handleMultipleChoiceChange = (questionId: number, optionKey: string, checked: boolean) => {
    setUserAnswers(prev =>
      prev.map(ua => {
        if (ua.questionId === questionId) {
          const currentAnswers = ua.answer ? ua.answer.split(',') : [];
          let newAnswers;
          
          if (checked) {
            // 添加选项
            newAnswers = [...currentAnswers, optionKey];
          } else {
            // 移除选项
            newAnswers = currentAnswers.filter(a => a !== optionKey);
          }
          
          return { ...ua, answer: newAnswers.join(',') };
        }
        return ua;
      })
    );
  };

  const isMultipleChoiceOptionSelected = (questionId: number, optionKey: string): boolean => {
    const userAnswer = userAnswers.find(ua => ua.questionId === questionId);
    if (!userAnswer?.answer) return false;
    return userAnswer.answer.split(',').includes(optionKey);
  };

  const getCurrentQuestion = (): ExamQuestion | null => {
    if (!exam?.questions || exam.questions.length === 0) return null;
    return exam.questions[currentQuestionIndex] || null;
  };

  const getCurrentAnswer = (): string => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return '';
    
    const userAnswer = userAnswers.find(ua => ua.questionId === currentQuestion.question.question_id);
    return userAnswer?.answer || '';
  };

  const getAnsweredCount = (): number => {
    return userAnswers.filter(ua => ua.answer.trim() !== '').length;
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextQuestion = () => {
    if (exam?.questions) {
      setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1));
    }
  };

  const handleSubmitExam = async () => {
    if (!exam) return;
    
    try {
      setIsSubmitting(true);
      
      // 调用提交API
      const response = await apiService.submitExam(exam.exam_id, userAnswers);
      
      if (response.code === 200) {
        setIsSubmitted(true);
        setExamStarted(false);
        // 提交成功，不需要alert，会显示成功页面
              } else {
          setError(response.message || '提交失败，请重试');
        }
      } catch (err) {
        console.error('Error submitting exam:', err);
        setError('网络错误，请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-lg mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">考试不存在</p>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = getCurrentAnswer();
  const answeredCount = getAnsweredCount();
  const totalQuestions = exam.questions?.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">考试提交成功！</h1>
            <p className="text-gray-600">您的考试答案已成功提交，请等待评分结果</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">考试总结</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">考试名称：</span>
                <span className="font-medium">{exam.title}</span>
              </div>
              <div>
                <span className="text-gray-600">考试类型：</span>
                <span className="font-medium">
                                         {exam.exam_type === 'exercise' ? '练习' : '期末考试'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">题目总数：</span>
                <span className="font-medium">{totalQuestions}</span>
              </div>
              <div>
                <span className="text-gray-600">已回答：</span>
                <span className="font-medium">{answeredCount}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/exams')}
              variant="outline"
            >
              返回考试列表
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 考试开始前的介绍页面
  if (!examStarted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* 头部导航 */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            
            <div className="flex-1">
                           <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
             <p className="text-gray-600">{exam.course.title}</p>
            </div>
            
            <Badge variant={exam.is_participated ? "default" : "secondary"}>
              {exam.is_participated ? "已参与" : "未参与"}
            </Badge>
          </div>

          {/* 考试信息卡片 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                考试信息
              </CardTitle>
              <CardDescription>请仔细阅读以下考试信息，确认后开始考试</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">考试类型</span>
                    <p className="font-medium">
                      {exam.exam_type === 'exercise' ? '练习' : '期末考试'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">题目数量</span>
                    <p className="font-medium">{totalQuestions} 题</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">考试时长</span>
                    <p className="font-medium">{exam.duration_minutes || 60} 分钟</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">满分</span>
                    <p className="font-medium">{exam.total_score || 100} 分</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">及格分数</span>
                    <p className="font-medium">{exam.passing_score || 60} 分</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">考试状态</span>
                    <Badge variant={exam.is_participated ? "default" : "secondary"}>
                      {exam.is_participated ? "已参与" : "未参与"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 考试说明 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>考试说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <p>考试开始后计时开始，请合理安排答题时间</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <p>考试过程中可以切换题目，建议先完成有把握的题目</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <p>时间到达后系统将自动提交，请注意时间管理</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <p>提交后无法修改答案，请仔细检查后再提交</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 开始考试按钮 */}
          <div className="text-center">
            <Button
              onClick={startExam}
              disabled={exam.is_participated}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              {exam.is_participated ? '已参与过此考试' : '开始考试'}
            </Button>
            
            {exam.is_participated && (
              <p className="mt-3 text-sm text-gray-600">
                您已经参与过此考试，如需查看结果请前往考试记录页面
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 考试进行中页面
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 考试头部信息 */}
        <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
                         <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
             <p className="text-sm text-gray-600">{exam.course.title}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-lg font-bold text-red-600">
                <Timer className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xs text-gray-600">剩余时间</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {answeredCount}/{totalQuestions}
              </div>
              <p className="text-xs text-gray-600">已完成</p>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">答题进度</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* 题目区域 */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>第 {currentQuestionIndex + 1} 题</span>
                                 <Badge variant="outline">
                   {['single_choice', 'multiple_choice', 'true_false'].includes(currentQuestion.question.question_type) ? '选择题' : '主观题'}
                 </Badge>
              </CardTitle>
                             <CardDescription>{currentQuestion.question.content}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentQuestion.question.question_type === 'multiple_choice' ? (
                // 多选题使用复选框
                <div className="space-y-3">
                  {currentQuestion.question.options && Object.entries(currentQuestion.question.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${key}`}
                        checked={isMultipleChoiceOptionSelected(currentQuestion.question.question_id, key)}
                        onCheckedChange={(checked) => 
                          handleMultipleChoiceChange(currentQuestion.question.question_id, key, checked as boolean)
                        }
                      />
                      <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                        {key}. {value}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : ['single_choice', 'true_false'].includes(currentQuestion.question.question_type) ? (
                // 单选题使用单选按钮
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.question.question_id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.question.options && Object.entries(currentQuestion.question.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={`option-${key}`} />
                      <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                        {key}. {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                 <Textarea
                   placeholder="请输入您的答案..."
                   value={currentAnswer}
                   onChange={(e) => handleAnswerChange(currentQuestion.question.question_id, e.target.value)}
                   className="min-h-[120px] resize-none"
                 />
               )}
            </CardContent>
          </Card>
        )}

        {/* 导航按钮 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            上一题
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
            >
              下一题
            </Button>
            
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              提交考试
            </Button>
          </div>
        </div>

        {/* 题目导航 */}
        <Card>
          <CardHeader>
            <CardTitle>题目导航</CardTitle>
          </CardHeader>
          <CardContent>
                         <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
               {exam.questions?.map((examQuestion, index) => {
                 const isAnswered = userAnswers.find(ua => ua.questionId === examQuestion.question.question_id)?.answer.trim() !== '';
                 const isCurrent = index === currentQuestionIndex;
                 
                 return (
                   <Button
                     key={examQuestion.question.question_id}
                     variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                     size="sm"
                     onClick={() => setCurrentQuestionIndex(index)}
                     className={`h-8 w-8 p-0 ${
                       isCurrent ? 'ring-2 ring-blue-500' : ''
                     } ${
                       isAnswered && !isCurrent ? 'bg-green-100 text-green-700 border-green-300' : ''
                     }`}
                   >
                     {index + 1}
                   </Button>
                 );
               })}
            </div>
            
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>当前题目</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>已回答</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-gray-300 rounded"></div>
                <span>未回答</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提交确认对话框 */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认提交考试</DialogTitle>
              <DialogDescription>
                您确定要提交考试吗？提交后将无法修改答案。
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">已回答题目：</span>
                  <span className="font-medium">{answeredCount}/{totalQuestions}</span>
                </div>
                <div>
                  <span className="text-gray-600">剩余时间：</span>
                  <span className="font-medium">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              
              {answeredCount < totalQuestions && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    还有 {totalQuestions - answeredCount} 道题未回答，确定要提交吗？
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                继续考试
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleSubmitExam();
                }}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? '提交中...' : '确认提交'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 