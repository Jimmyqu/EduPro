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
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { apiService } from '@/lib/api';
import type { ApiExamDetail, Question, ExamQuestion, SubmitResult, QuestionResult } from '@/lib/api';
import ExerciseResult from './ExerciseResult';

interface UserAnswer {
  questionId: number;
  answer: string;
}

export default function ExerciseWrongQuestions() {
  const router = useRouter();
  const { id } = router.query;
  
  const [exercise, setExercise] = useState<ApiExamDetail | null>(null);
  const [wrongQuestions, setWrongQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    if (id) {
      loadWrongQuestions();
    }
  }, [id]);

  const loadWrongQuestions = async () => {
    try {
      setLoading(true);
      
      // 获取练习详情（包含用户答案和正确性信息）
      const exerciseResponse = await apiService.getExerciseDetail(Number(id));
      if (!exerciseResponse.data) {
        setError('练习不存在');
        return;
      }
      
      setExercise(exerciseResponse.data);
      
      // 获取所有已答题的题目
      const allAnsweredQuestions = exerciseResponse.data.questions?.filter(
        (examQuestion: ExamQuestion) => examQuestion.user_answer !== undefined
      ) || [];
      
      if (allAnsweredQuestions.length === 0) {
        setError('您还没有完成过这个练习');
        return;
      }
      
      // 检查是否有错题
      const actualWrongQuestions = allAnsweredQuestions.filter(q => q.is_correct === false);
      
      if (actualWrongQuestions.length === 0) {
        setError('恭喜！您在这个练习中没有错题');
        return;
      }
      
      // 显示所有已答题的题目（包括正确和错误的）
      setWrongQuestions(allAnsweredQuestions);
      
      // 初始化用户答案：
      // - 正确的题目保持原答案且不可修改
      // - 错误的题目清空答案让用户重新作答
      setUserAnswers(allAnsweredQuestions.map(q => ({ 
        questionId: q.question.question_id, 
        answer: q.is_correct ? q.user_answer || '' : '' // 正确的保持原答案，错误的清空
      })));
    } catch (err) {
      setError('加载错题失败');
      console.error('Error loading wrong questions:', err);
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
            newAnswers = [...currentAnswers, optionKey];
          } else {
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
    if (!wrongQuestions || wrongQuestions.length === 0) return null;
    return wrongQuestions[currentQuestionIndex] || null;
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
    if (wrongQuestions) {
      setCurrentQuestionIndex(prev => Math.min(wrongQuestions.length - 1, prev + 1));
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    
    // 只检查原本答错的题目
    const wrongQuestionsOnly = wrongQuestions.filter(q => !q.is_correct);
    
    userAnswers.forEach(userAnswer => {
      const question = wrongQuestionsOnly.find(q => q.question.question_id === userAnswer.questionId);
      if (question && question.question.correct_answer) {
        // 标准化答案进行比较
        const userAns = userAnswer.answer.trim().toLowerCase();
        const correctAns = question.question.correct_answer.trim().toLowerCase();
        
        if (userAns === correctAns) {
          correct++;
        }
      }
    });
    
    setCorrectCount(correct);
    return correct;
  };

  const handleSubmitWrongQuestions = async () => {
    if (!wrongQuestions) return;
    
    // 只检查错误题目的答题情况
    const wrongQuestionsOnly = wrongQuestions.filter(q => !q.is_correct);
    const wrongQuestionAnswers = userAnswers.filter(ua => 
      wrongQuestionsOnly.some(q => q.question.question_id === ua.questionId)
    );
    
    const unansweredWrongCount = wrongQuestionAnswers.filter(ua => ua.answer.trim() === '').length;
    if (unansweredWrongCount > 0) {
      setConfirmDialogConfig({
        title: '确认提交',
        description: `还有 ${unansweredWrongCount} 道错题未重新回答，确定要提交吗？`,
        onConfirm: () => {
          setShowConfirmDialog(false);
          performWrongQuestionsSubmit();
        }
      });
      setShowConfirmDialog(true);
      return;
    }

    performWrongQuestionsSubmit();
  };

  const performWrongQuestionsSubmit = async () => {
    if (!wrongQuestions || !exercise) return;

    try {
      setIsSubmitting(true);
      
      // 准备所有题目的答案（包括正确和错误的题目）
      // 对于已答对的题目，使用原来的答案
      // 对于错误的题目，使用新的答案
      const allAnswers = wrongQuestions.map(q => {
        const userAnswer = userAnswers.find(ua => ua.questionId === q.question.question_id);
        return {
          questionId: q.question.question_id,
          // 如果是已答对的题目，使用原来的答案；否则使用新的答案
          answer: q.is_correct ? (q.user_answer || '') : (userAnswer?.answer || '')
        };
      });
      
      // 调用submit接口提交所有答案
      const response = await apiService.submitExercise(Number(id), allAnswers);
      
      if (response.code === 200 && response.data) {
        setSubmitResult(response.data);
        setIsCompleted(true);
      } else {
        setError(response.message || '提交失败，请重试');
      }
    } catch (err) {
      console.error('Error submitting wrong questions:', err);
      setError('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载错题中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">错题练习</h1>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!exercise || !wrongQuestions || wrongQuestions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">错题练习</h1>
          </div>
          
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium mb-2">太棒了！</h3>
              <p className="text-gray-600">您在这个练习中没有错题，继续保持！</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const currentAnswer = getCurrentAnswer();
  const answeredCount = getAnsweredCount();
  const totalQuestions = wrongQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  if (isCompleted && submitResult) {
    const handleRetry = () => {
      setIsCompleted(false);
      setSubmitResult(null);
      setCurrentQuestionIndex(0);
      // 重置时保持正确题目的答案，清空错误题目的答案
      setUserAnswers(wrongQuestions.map(q => ({ 
        questionId: q.question.question_id, 
        answer: q.is_correct ? q.user_answer || '' : ''
      })));
    };

    return (
      <ExerciseResult 
        submitResult={submitResult} 
        exercise={exercise}
        onRetry={handleRetry}
        mode="wrong-questions"
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              {exercise.title} - 错题练习
            </h1>
            <p className="text-gray-600">{exercise.course.title}</p>
          </div>
          
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            错题练习
          </Badge>
        </div>

        {/* 练习信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              错题信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">总题数：</span>
                <span className="font-medium">{totalQuestions}</span>
              </div>
              <div>
                <span className="text-green-600">已答对：</span>
                <span className="font-medium text-green-600">
                  {wrongQuestions.filter(q => q.is_correct).length}
                </span>
              </div>
              <div>
                <span className="text-red-600">需重答：</span>
                <span className="font-medium text-red-600">
                  {wrongQuestions.filter(q => !q.is_correct).length}
                </span>
              </div>
              <div>
                <span className="text-orange-600">已重答：</span>
                <span className="font-medium text-orange-600">
                  {wrongQuestions.filter(q => !q.is_correct && userAnswers.find(ua => ua.questionId === q.question.question_id)?.answer.trim() !== '').length}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-xs text-gray-500 mb-2">
                错题重答进度: {Math.round((wrongQuestions.filter(q => !q.is_correct && userAnswers.find(ua => ua.questionId === q.question.question_id)?.answer.trim() !== '').length / Math.max(wrongQuestions.filter(q => !q.is_correct).length, 1)) * 100)}%
              </div>
              <Progress 
                value={(wrongQuestions.filter(q => !q.is_correct && userAnswers.find(ua => ua.questionId === q.question.question_id)?.answer.trim() !== '').length / Math.max(wrongQuestions.filter(q => !q.is_correct).length, 1)) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* 题目区域 */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>第 {currentQuestionIndex + 1} 题</span>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {['single_choice', 'multiple_choice', 'true_false'].includes(currentQuestion.question.question_type) ? '选择题' : '主观题'}
                  </Badge>
                  <Badge 
                    variant={currentQuestion.is_correct ? "default" : "destructive"}
                    className={currentQuestion.is_correct ? "bg-green-600" : "bg-red-600"}
                  >
                    {currentQuestion.is_correct ? "已答对" : "需重答"}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{currentQuestion.question.content}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 显示题目状态 */}
              {currentQuestion.is_correct && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">此题已答对，无需重新作答</span>
                  </div>
                </div>
              )}
              
              {currentQuestion.question.question_type === 'multiple_choice' ? (
                // 多选题使用复选框
                <div className="space-y-3">
                  {currentQuestion.question.options && Object.entries(currentQuestion.question.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${key}`}
                        checked={isMultipleChoiceOptionSelected(currentQuestion.question.question_id, key)}
                        onCheckedChange={(checked) => 
                          !currentQuestion.is_correct && handleMultipleChoiceChange(currentQuestion.question.question_id, key, checked as boolean)
                        }
                        disabled={currentQuestion.is_correct}
                      />
                      <Label 
                        htmlFor={`option-${key}`} 
                        className={`flex-1 ${currentQuestion.is_correct ? 'cursor-default text-gray-600' : 'cursor-pointer'}`}
                      >
                        {key}. {value}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : ['single_choice', 'true_false'].includes(currentQuestion.question.question_type) ? (
                // 单选题使用单选按钮
                <RadioGroup
                  value={currentAnswer}
                  onValueChange={(value) => !currentQuestion.is_correct && handleAnswerChange(currentQuestion.question.question_id, value)}
                  className="space-y-3"
                  disabled={currentQuestion.is_correct}
                >
                  {currentQuestion.question.options && Object.entries(currentQuestion.question.options).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={key} 
                        id={`option-${key}`} 
                        disabled={currentQuestion.is_correct}
                      />
                      <Label 
                        htmlFor={`option-${key}`} 
                        className={`flex-1 ${currentQuestion.is_correct ? 'cursor-default text-gray-600' : 'cursor-pointer'}`}
                      >
                        {key}. {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder={currentQuestion.is_correct ? "此题已答对" : "请输入您的答案..."}
                  value={currentAnswer}
                  onChange={(e) => !currentQuestion.is_correct && handleAnswerChange(currentQuestion.question.question_id, e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={currentQuestion.is_correct}
                  readOnly={currentQuestion.is_correct}
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
              onClick={handleSubmitWrongQuestions}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? '提交中...' : '提交答案'}
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
              {wrongQuestions.map((examQuestion, index) => {
                const isAnswered = userAnswers.find(ua => ua.questionId === examQuestion.question.question_id)?.answer.trim() !== '';
                const isCurrent = index === currentQuestionIndex;
                const isCorrect = examQuestion.is_correct;
                
                return (
                  <Button
                    key={examQuestion.question.question_id}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`h-8 w-8 p-0 ${
                      isCurrent ? 'ring-2 ring-orange-500' : ''
                    } ${
                      !isCurrent && isCorrect ? 'bg-green-100 text-green-700 border-green-300' : ''
                    } ${
                      !isCurrent && !isCorrect && isAnswered ? 'bg-orange-100 text-orange-700 border-orange-300' : ''
                    } ${
                      !isCurrent && !isCorrect && !isAnswered ? 'bg-red-100 text-red-700 border-red-300' : ''
                    }`}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-600 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-600 rounded"></div>
                <span>当前题目</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>已答对</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span>错题已重答</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>错题待重答</span>
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