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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { ApiExamDetail, Question, ExamQuestion, SubmitResult, QuestionResult } from '@/lib/api';
import ExerciseResult from './ExerciseResult';

interface UserAnswer {
  questionId: number;
  answer: string;
}

export default function ExerciseDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [exercise, setExercise] = useState<ApiExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (id) {
      loadExerciseDetail();
    }
  }, [id]);

  const loadExerciseDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExerciseDetail(Number(id));
      if (response.data) {
        setExercise(response.data);
      }
      
      // 初始化用户答案数组，如果有上一次的答案则预填充
      if (response.data?.questions) {
        setUserAnswers(response.data.questions.map(q => ({ 
          questionId: q.question.question_id, 
          answer: q.user_answer || '' // 使用上一次的答案，如果没有则为空
        })));
      }
    } catch (err) {
      setError('加载练习详情失败');
      console.error('Error loading exercise detail:', err);
    } finally {
      setLoading(false);
    }
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
    if (!exercise?.questions || exercise.questions.length === 0) return null;
    return exercise.questions[currentQuestionIndex] || null;
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
    if (exercise?.questions) {
      setCurrentQuestionIndex(prev => Math.min(exercise.questions.length - 1, prev + 1));
    }
  };

  const handleSubmitExercise = async () => {
    if (!exercise) return;
    
    const unansweredCount = userAnswers.filter(ua => ua.answer.trim() === '').length;
    if (unansweredCount > 0) {
      setConfirmDialogConfig({
        title: '确认提交',
        description: `还有 ${unansweredCount} 道题未回答，确定要提交吗？`,
        onConfirm: () => {
          setShowConfirmDialog(false);
          performSubmit();
        }
      });
      setShowConfirmDialog(true);
      return;
    }

    performSubmit();
  };

  const performSubmit = async () => {
    if (!exercise) return;

    try {
      setIsSubmitting(true);
      
      // 调用提交API
      const response = await apiService.submitExercise(exercise.exam_id, userAnswers);
      
      if (response.code === 200 && response.data) {
        setSubmitResult(response.data);
        setIsSubmitted(true);
        // 提交成功，不需要alert，会显示成功页面
      } else {
        setError(response.message || '提交失败，请重试');
      }
    } catch (err) {
      console.error('Error submitting exercise:', err);
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
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

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">练习不存在</p>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = getCurrentAnswer();
  const answeredCount = getAnsweredCount();
  const totalQuestions = exercise.questions?.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (isSubmitted && submitResult) {
    const handleRetry = () => {
      setIsSubmitted(false);
      setSubmitResult(null);
      // 重置状态，允许重新作答
      setUserAnswers(exercise.questions?.map(q => ({ questionId: q.question.question_id, answer: '' })) || []);
      setCurrentQuestionIndex(0);
    };

    return (
      <ExerciseResult 
        submitResult={submitResult} 
        exercise={exercise}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">{exercise.title}</h1>
            <p className="text-gray-600">{exercise.course.title}</p>
          </div>
          
          <Badge variant={exercise.is_participated ? "default" : "secondary"}>
            {exercise.is_participated ? "已参与" : "未参与"}
          </Badge>
        </div>

        {/* 练习信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              练习信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">题目数量：</span>
                <span className="font-medium">{totalQuestions}</span>
              </div>
              <div>
                <span className="text-gray-600">已回答：</span>
                <span className="font-medium">{answeredCount}/{totalQuestions}</span>
              </div>
              <div>
                <span className="text-gray-600">完成进度：</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
            </div>
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
        <div className="flex items-center justify-between">
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
              onClick={handleSubmitExercise}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? '提交中...' : '提交练习'}
            </Button>
          </div>
        </div>

        {/* 题目导航 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>题目导航</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {exercise.questions?.map((examQuestion, index) => {
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

        {/* 确认对话框 */}
        <ConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title={confirmDialogConfig.title}
          description={confirmDialogConfig.description}
          onConfirm={confirmDialogConfig.onConfirm}
          confirmText="确定提交"
          cancelText="继续答题"
        />
      </div>
    </div>
  );
} 