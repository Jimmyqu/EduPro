import { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Timer, BookOpen, Pause, Play, XCircle, Trophy } from 'lucide-react';
import { apiService, isApiSuccess } from '@/lib/api';
import type { ApiExamDetail, Question, ExamQuestion, ApiExamAttemptDetail, ExamAttempt, AnswerRecord } from '@/lib/api';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface UserAnswer {
  questionId: number;
  answer: string;
}

// 工具函数：根据后端attempt和exam计算剩余时间（秒）
function getRemainingTime(attempt: any, exam: any): number {
  if (!attempt || !exam) return 0;
  let remain = exam.duration_minutes * 60 - (attempt.total_elapsed_seconds || 0);
  if (attempt.status === 'in_progress' && attempt.last_resume_time) {
    const lastResume = new Date(attempt.last_resume_time).getTime();
    const now = Date.now();
    remain -= Math.floor((now - lastResume) / 1000);
  }
  return remain > 0 ? remain : 0;
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
  const [isPaused, setIsPaused] = useState(false);
  const [examProgress, setExamProgress] = useState<{
    status: 'not_started' | 'in_progress' | 'paused' | 'submitted';
    timeRemaining: number;
    answers: UserAnswer[];
    currentQuestionIndex: number;
  } | null>(null);
  
  // 考试记录相关状态
  const [examAttempt, setExamAttempt] = useState<ExamAttempt | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<ApiExamAttemptDetail | null>(null);
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = useState(false);
  
  // 对话框状态
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      // 只加载考试详情，答案恢复在 loadExamDetail 中处理
      loadExamDetail();
      
      // 恢复其他考试进度（时间、当前题目索引等）
      const storageKey = `exam_progress_${id}`;
      const savedProgress = localStorage.getItem(storageKey);
      
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          setExamProgress(progress);
          
          if (progress.status === 'in_progress' || progress.status === 'paused') {
            // 直接使用保存的剩余时间，不进行调整
            setTimeRemaining(progress.timeRemaining);
            // 注意：不再在这里设置 userAnswers，而是在 loadExamDetail 中处理
            setCurrentQuestionIndex(progress.currentQuestionIndex);
            setExamStarted(true);
            
            // 检查URL中是否有continue=true参数，如果有则自动开始计时
            const shouldContinue = router.query.continue === 'true';
            if (shouldContinue && progress.status === 'paused') {
              // 如果是从"继续考试"按钮进入的，自动开始计时
              setIsPaused(false);
              // 更新本地存储中的状态
              const updatedProgress = {
                ...progress,
                status: 'in_progress',
                savedAt: new Date().getTime() // 更新保存时间戳
              };
              localStorage.setItem(storageKey, JSON.stringify(updatedProgress));
              toast.success("考试已自动恢复", { description: "计时已开始" });
            } else {
              setIsPaused(progress.status === 'paused');
            }
          }
        } catch (error) {
          console.error('恢复考试进度失败:', error);
        }
      }
    }
  }, [id, router.query.continue]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (examStarted && timeRemaining > 0 && !isPaused) {
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
  }, [examStarted, timeRemaining, isPaused]);
  
  // 添加页面刷新/离开事件监听
  // 只保留 beforeunload 自动暂停
  useEffect(() => {
    if (!id || !examStarted || isPaused || timeRemaining <= 0) return;
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      await apiService.pauseExam(Number(id));
      // 立即保存当前进度，并将状态设置为暂停
      if (id) {
        const savedAt = new Date().getTime();
        const progress = {
          status: 'paused',
          timeRemaining,
          answers: userAnswers,
          currentQuestionIndex,
          savedAt
        };
        const storageKey = `exam_progress_${id}`;
        localStorage.setItem(storageKey, JSON.stringify(progress));
      }
      const message = "离开页面将暂停考试，您的答案已保存。";
      e.returnValue = message;
      return message;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examStarted, isPaused, timeRemaining, id, userAnswers, currentQuestionIndex]);
  
  // 保存考试进度到本地存储
  const saveExamProgress = () => {
    if (!id) return;
    
    // 记录保存时间戳
    const savedAt = new Date().getTime();
    
    const progress = {
      status: isPaused ? 'paused' : 'in_progress',
      timeRemaining,
      answers: userAnswers,
      currentQuestionIndex,
      savedAt // 添加保存时间戳
    };
    
    const storageKey = `exam_progress_${id}`;
    localStorage.setItem(storageKey, JSON.stringify(progress));
  };

  // 保存用户答案到本地存储
  const saveAnswers = (newAnswers: UserAnswer[]) => {
    if (!id) return;
    
    const storageKey = `exam_progress_${id}`;
    const savedProgress = localStorage.getItem(storageKey);
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        progress.answers = newAnswers;
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (error) {
        console.error('保存答案失败:', error);
      }
    } else {
      // 如果没有保存的进度，创建一个新的
      const savedAt = new Date().getTime();
      
      const progress = {
        status: isPaused ? 'paused' : 'in_progress',
        timeRemaining,
        answers: newAnswers,
        currentQuestionIndex,
        savedAt
      };
      
      localStorage.setItem(storageKey, JSON.stringify(progress));
    }
  };

  const loadExamDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamDetail(Number(id));
      
      if (isApiSuccess(response)) {
        setExam(response.data);
        
        // 检查本地存储中是否有保存的答案
        let savedAnswers: UserAnswer[] | null = null;
        if (id) {
          const storageKey = `exam_progress_${id}`;
          const savedProgress = localStorage.getItem(storageKey);
          
          if (savedProgress) {
            try {
              const progress = JSON.parse(savedProgress);
              if (progress.answers && progress.answers.length > 0) {
                savedAnswers = progress.answers;
              }
            } catch (error) {
              console.error('解析保存的答案失败:', error);
            }
          }
        }
        
        // 初始化用户答案数组
        if (response.data.questions) {
          if (savedAnswers) {
            // 使用保存的答案，但确保所有题目都有对应的答案对象
            const questionIds = response.data.questions.map(q => q.question.question_id);
            const answersMap = new Map(savedAnswers.map(a => [a.questionId, a]));
            
            const mergedAnswers = questionIds.map(qId => {
              return answersMap.has(qId) 
                ? answersMap.get(qId)! 
                : { questionId: qId, answer: '' };
            });
            
            setUserAnswers(mergedAnswers);
          } else {
            // 没有保存的答案，使用空答案初始化
            setUserAnswers(response.data.questions.map(q => ({ questionId: q.question.question_id, answer: '' })));
          }
        }
        
        // 检查是否已参加过该考试
        if (response.data.is_participated) {
          // 获取考试记录
          await loadExamAttempts();
        } else {
          // 直接开始考试
          setExamStarted(true);
        }
      } else {
        setError(response.message || '加载考试详情失败');
      }
    } catch (err) {
      setError('加载考试详情失败');
      console.error('Error loading exam detail:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 获取考试记录
  const loadExamAttempts = async () => {
    try {
      if (!id) return;
      
      const response = await apiService.getMyExamAttempts({ 
        exam_type: 'final',
        per_page: 50
      });
      
      console.log(response.data);
      if (isApiSuccess(response)) {
        // 查找当前考试的记录
        const attempt = response.data.attempts.find(a => a.exam.exam_id === Number(id));
        
        if (attempt) {
          setExamAttempt(attempt);
          
          // 如果考试已提交或已评分，获取详情
          if (attempt.status === 'submitted' || attempt.status === 'expired') {
            setHasSubmittedAttempt(true);
            await loadExamAttemptDetail(attempt.attempt_id);
          } else if (attempt.status === 'in_progress') {
            // 如果考试正在进行中，直接进入考试模式
            setExamStarted(true);
          }
        }
      }
    } catch (error) {
      console.error('获取考试记录失败:', error);
    }
  };
  
  // 获取考试记录详情
  const loadExamAttemptDetail = async (attemptId: number) => {
    try {
      const response = await apiService.getExamAttemptDetail(attemptId);
      
      if (isApiSuccess(response)) {
        setAttemptDetail(response.data);
      }
    } catch (error) {
      console.error('获取考试记录详情失败:', error);
    }
  };

  // 新增：点击开始考试时调用后端接口
  const handleStartExam = async () => {
    if (!exam) return;
    setLoading(true);
    const response = await apiService.startExam(exam.exam_id);
    setLoading(false);
    if (isApiSuccess(response)) {
      await fetchExamAttempt();
      setExamStarted(true);
      setIsPaused(false);
      toast.success('考试已开始');
    } else {
      toast.error(response.message || '考试启动失败');
    }
  };
  
  // 暂停考试
  const pauseExam = () => {
    // 显示暂停对话框
    setShowPauseDialog(true);
    // 先暂停计时
    setIsPaused(true);
  };
  
  // 继续考试
  const resumeExam = async () => {
    if (!id) return;
    await apiService.resumeExam(Number(id));
    setIsPaused(false);
    setShowPauseDialog(false);
    toast.success('考试已继续');
  };
  
  // 退出考试
  const exitExam = async () => {
    if (!id) return;
    await apiService.pauseExam(Number(id));
    // 保存当前考试进度
    saveExamProgress();
    toast.info("考试已暂停", { description: "您的答案已保存，可以稍后继续" });
    // 返回考试列表页面
    router.push('/exams');
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers(prev => {
      const newAnswers = prev.map(ua =>
        ua.questionId === questionId ? { ...ua, answer } : ua
      );
      
      // 保存答案到本地存储
      setTimeout(() => saveAnswers(newAnswers), 0);
      
      return newAnswers;
    });
  };

  const handleMultipleChoiceChange = (questionId: number, optionKey: string, checked: boolean) => {
    setUserAnswers(prev => {
      const newAnswers = prev.map(ua => {
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
      });
      
      // 保存答案到本地存储
      setTimeout(() => saveAnswers(newAnswers), 0);
      
      return newAnswers;
    });
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

  // 新增：后端考试状态同步
  const fetchExamAttempt = async () => {
    if (!id) return;
    try {
      const response = await apiService.getExamAttempt(Number(id));

      console.log(response.data);
      if (isApiSuccess(response) && response.data) {
        const attempt = response.data;
        setExamAttempt(attempt);
        // 统一用工具函数计算剩余时间
        setTimeRemaining(getRemainingTime(attempt, exam));
        setExamStarted(attempt.status === 'in_progress');
        setIsPaused((attempt.status as any) === 'paused');
        // 自动恢复
        if ((attempt.status as any) === 'paused') {
          await apiService.resumeExam(Number(id));
          setIsPaused(false);
          setExamStarted(true);
          toast.success('考试已自动恢复');
        }
      }
    } catch (e) {
      // 忽略未开始考试的情况
    }
  };

  // 页面加载时只需await fetchExamAttempt()
  useEffect(() => {
    if (id && exam) {
      fetchExamAttempt();
    }
  }, [id, exam]);

  // 新增：页面失焦/visibilitychange自动暂停
  // 移除 blur/visibilitychange 自动暂停

  // 新增：页面focus或点击继续自动恢复
  const handleResume = async () => {
    if (!id) return;
    await apiService.resumeExam(Number(id));
    setIsPaused(false);
    setExamStarted(true);
    toast.success('考试已恢复');
  };

  // 新增：倒计时归零时自动超时交卷
  // useEffect(() => {
  //   console.log(examStarted, timeRemaining, isPaused);
  //   if (examStarted && timeRemaining === 0 && !isPaused) {
  //     handleExpireExam();
  //   }
  //   // eslint-disable-next-line
  // }, [examStarted, timeRemaining, isPaused]);

  // // 新增：超时交卷API
  // const handleExpireExam = async () => {
  //   if (!id) return;
  //   await apiService.expireExam(Number(id));
  //   setIsSubmitted(true);
  //   setExamStarted(false);
  //   toast.info('考试已超时交卷');
  // };

  // 修改handleSubmitExam为后端联动
  const handleSubmitExam = async () => {
    if (!exam) return;
    try {
      setIsSubmitting(true);
      const response = await apiService.submitExam(exam.exam_id, userAnswers);
      if (response.code === 200) {
        setIsSubmitted(true);
        setExamStarted(false);
        // 提交后自动加载attemptDetail用于renderExamResult
        if (response.data && response.data.attempt_id) {
          await loadExamAttemptDetail(response.data.attempt_id);
          setHasSubmittedAttempt(true);
        }
        if (id) {
          const storageKey = `exam_progress_${id}`;
          localStorage.removeItem(storageKey);
        }
      } else {
        setError(response.message || '提交失败，请重试');
      }
    } catch (err) {
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

  // 渲染考试结果和答案解析
  const renderExamResult = () => {
    if (!attemptDetail || !exam) return null;
    
    const correctCount = attemptDetail.answer_records.filter(record => record.is_correct).length;
    const wrongCount = attemptDetail.answer_records.filter(record => record.is_correct === false).length;
    const totalQuestions = attemptDetail.answer_records.length;
    const accuracyRate = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = attemptDetail.score !== undefined && exam.passing_score !== undefined && attemptDetail.score >= exam.passing_score;
    
    return (
      <div className="space-y-6">
        {/* 考试结果概览 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              考试结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold mb-1">
                    {attemptDetail.score} / {exam.total_score}
                  </div>
                  <div className="text-sm text-gray-600">总分</div>
                </div>
                
                <div className="flex justify-between">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-green-600">{correctCount}</div>
                    <div className="text-xs text-gray-600">正确</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-red-600">{wrongCount}</div>
                    <div className="text-xs text-gray-600">错误</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">{accuracyRate}%</div>
                    <div className="text-xs text-gray-600">正确率</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">考试状态</span>
                  <Badge variant={isPassed ? "default" : "destructive"} className={isPassed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {isPassed ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> 通过</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> 未通过</>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">及格分数</span>
                  <span className="font-medium">{exam.passing_score}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">开始时间</span>
                  <span className="text-sm">{new Date(attemptDetail.start_time).toLocaleString('zh-CN')}</span>
                </div>
                
                {attemptDetail.submit_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">提交时间</span>
                    <span className="text-sm">{new Date(attemptDetail.submit_time).toLocaleString('zh-CN')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 题目详情和解析 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">题目解析</h2>
          
          {attemptDetail.answer_records.map((record, index) => (
            <Card key={`${record.answer_id}-${index}`} className={`border-l-4 ${record.is_correct ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>第 {index + 1} 题</span>
                  <Badge variant={record.is_correct ? "outline" : "outline"} className={record.is_correct ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                    {record.is_correct ? '正确' : '错误'}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base font-normal text-black">{record.question.content}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 选项 */}
                {record.question.options && Object.entries(record.question.options).map(([key, value]) => {
                  const isCorrectOption = record.question.correct_answer === key;
                  const isSelectedOption = record.student_answer === key;
                  
                  return (
                    <div 
                      key={key} 
                      className={`p-3 rounded-md ${
                        isCorrectOption ? 'bg-green-50 border border-green-200' : 
                        isSelectedOption && !isCorrectOption ? 'bg-red-50 border border-red-200' : 
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {isSelectedOption && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <span className="font-medium">{key}. </span>
                          <span>{value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* 用户答案（非选择题） */}
                {!record.question.options && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">您的答案：</span>
                      <p className="p-3 bg-gray-50 rounded-md mt-1">{record.student_answer || '未作答'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">正确答案：</span>
                      <p className="p-3 bg-green-50 rounded-md mt-1">{record.question.correct_answer}</p>
                    </div>
                  </div>
                )}
                
                {/* 解析 */}
                {(record.question.analysis || record.question.explanation) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm font-medium text-blue-800 mb-1">解析：</div>
                    <div className="text-sm text-blue-900">{record.question.analysis || record.question.explanation}</div>
                  </div>
                )}
                
                {/* 得分 */}
                <div className="flex justify-end">
                  <Badge variant="outline" className="bg-gray-50">
                    得分: {record.score_awarded || 0} / {exam.questions.find(q => q.question.question_id === record.question.question_id)?.score || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push('/exams')}>
            返回考试列表
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            返回首页
          </Button>
        </div>
      </div>
    );
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

  // 已提交考试显示结果
  if (hasSubmittedAttempt && attemptDetail) {
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
              <h1 className="text-2xl font-bold text-gray-900">{exam?.title}</h1>
              <p className="text-gray-600">{exam?.course.title}</p>
            </div>
          </div>
          
          {renderExamResult()}
        </div>
      </div>
    );
  }
  
  // 刚刚提交考试成功
  if (isSubmitted && attemptDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderExamResult()}
        </div>
      </div>
    );
  }

  // 查看考试时，若状态为submitted或expired，直接显示结果
  if ((examAttempt && (examAttempt.status === 'submitted' || examAttempt.status === 'expired')) && attemptDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {renderExamResult()}
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
              <div className={`flex items-center gap-1 text-lg font-bold ${isPaused ? 'text-gray-600' : 'text-red-600'}`}>
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
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={isPaused ? resumeExam : pauseExam}
              className={isPaused ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  继续
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  暂停
                </>
              )}
            </Button>
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

        {/* 暂停对话框 */}
        <Dialog open={showPauseDialog} onOpenChange={(open) => {
          if (!open) {
            // 如果对话框关闭，恢复考试
            resumeExam();
          }
          setShowPauseDialog(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>考试已暂停</DialogTitle>
              <DialogDescription>
                您可以继续考试或退出。退出后您的答案将被保存，可以稍后继续。
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
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={exitExam}
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              >
                退出考试
              </Button>
              <Button
                onClick={resumeExam}
                className="bg-blue-600 hover:bg-blue-700"
              >
                继续考试
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 