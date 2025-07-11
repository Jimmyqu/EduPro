import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ArrowLeft, Clock, FileText, Trophy, AlertCircle, CheckCircle2, XCircle, Eye, Calendar, Timer, Users, Target, BookOpen, Award, History, Play, Pause, RotateCcw, Save, RefreshCw, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth, availableCourses, MockExamProgress, MockExamAttempt } from "../contexts/AuthContext";
import { toast } from "sonner";

interface MockExamQuestion {
  id: string;
  question: string;
  type: "single-choice" | "multiple-choice";
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  subject: string;
}

interface MockExam {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  timeLimit: number;
  totalQuestions: number;
  passingScore: number;
  questions: MockExamQuestion[];
  type: 'practice';
}

interface MockExamHubProps {
  onBack: () => void;
}

type ExamState = 'courseList' | 'examList' | 'preparation' | 'taking' | 'completed' | 'review';

const safeCalculate = (numerator: number, denominator: number, fallback: number = 0): number => {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

const safePercentage = (numerator: number, denominator: number): number => {
  const result = safeCalculate(numerator, denominator, 0) * 100;
  return Math.round(isFinite(result) ? result : 0);
};

const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isFinite(num) ? num : fallback;
};

const isAnswerCorrect = (userAnswer: any, correctAnswer: number | number[]): boolean => {
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(userAnswer)) return false;
    if (userAnswer.length !== correctAnswer.length) return false;
    const sortedUser = [...userAnswer].sort((a, b) => a - b);
    const sortedCorrect = [...correctAnswer].sort((a, b) => a - b);
    return sortedUser.every((answer, index) => answer === sortedCorrect[index]);
  } else {
    return userAnswer === correctAnswer;
  }
};

export function MockExam({ onBack }: MockExamHubProps) {
  const [examState, setExamState] = useState<ExamState>('courseList');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<MockExamAttempt | null>(null);
  const [currentProgress, setCurrentProgress] = useState<MockExamProgress | null>(null);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    user, 
    hasAccess, 
    saveMockExamProgress, 
    getMockExamProgress, 
    deleteMockExamProgress, 
    saveMockExamAttempt, 
    getMockExamAttempts,
    getAllMockExamProgress
  } = useAuth();

  // 定时器效果
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        
        // 保存进度
        if (selectedExam && currentProgress) {
          const updatedProgress = {
            ...currentProgress,
            timeLeft: newTimeLeft,
            answers: answers,
            currentQuestionIndex: currentQuestionIndex
          };
          saveMockExamProgress(updatedProgress);
        }
        
        // 时间警告
        if (newTimeLeft === 300) { // 5分钟警告
          setShowTimeWarning(true);
        }
        
        // 时间到自动提交
        if (newTimeLeft === 0) {
          handleTimeUp();
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timeLeft, selectedExam, currentProgress, answers, currentQuestionIndex]);

  const generateMockExams = (): MockExam[] => {
    const exams: MockExam[] = [];
    
    const examTemplates = {
      'health-manager': [
        { id: 'health-manager-practice-1', title: '健康管理师模拟考试（一）', description: '涵盖健康管理基础理论、风险评估、健康促进等核心知识点', timeLimit: 120, totalQuestions: 100, passingScore: 60, type: 'practice' as const }
      ],
      'mental-health-counselor': [
        { id: 'mental-health-practice-1', title: '心理健康指导模拟考试（一）', description: '心理学基础、咨询理论、评估方法等综合测试', timeLimit: 120, totalQuestions: 100, passingScore: 60, type: 'practice' as const }
      ],
      'rehabilitation-therapist': [
        { id: 'rehabilitation-practice-1', title: '康复理疗师模拟考试（一）', description: '康复医学基础、物理治疗、运动治疗综合考核', timeLimit: 120, totalQuestions: 100, passingScore: 60, type: 'practice' as const }
      ],
      'childcare-specialist': [
        { id: 'childcare-practice-1', title: '育婴员模拟考试（一）', description: '婴幼儿发育特点、营养需求、基础护理技能', timeLimit: 90, totalQuestions: 80, passingScore: 60, type: 'practice' as const }
      ]
    };

    const questionTemplates = [
      { q: "健康管理的核心理念是", type: "single-choice", opts: ["治疗疾病", "预防为主，防治结合", "药物治疗", "手术治疗"], correct: 1, exp: "健康管理强调预防为主、防治结合的理念。", subject: "健康管理基础" },
      { q: "健康管理的主要内容包括哪些", type: "multiple-choice", opts: ["健康评估", "健康咨询", "健康干预", "疾病治疗"], correct: [0, 1, 2], exp: "健康管理主要包括健康评估、健康咨询和健康干预。", subject: "健康管理" }
    ];

    availableCourses.forEach(course => {
      const courseTemplates = examTemplates[course.id as keyof typeof examTemplates];
      if (courseTemplates) {
        courseTemplates.forEach(template => {
          const questions: MockExamQuestion[] = [];
          
          for (let i = 0; i < template.totalQuestions; i++) {
            const templateIndex = i % questionTemplates.length;
            const questionTemplate = questionTemplates[templateIndex];
            
            questions.push({
              id: `${template.id}-q${i + 1}`,
              question: `${questionTemplate.q}？（第${i + 1}题）`,
              type: questionTemplate.type as "single-choice" | "multiple-choice",
              options: questionTemplate.opts,
              correctAnswer: questionTemplate.correct,
              explanation: questionTemplate.exp,
              difficulty: i % 3 === 0 ? "Hard" : i % 3 === 1 ? "Medium" : "Easy",
              subject: questionTemplate.subject
            });
          }

          exams.push({ ...template, courseId: course.id, courseName: course.name, questions });
        });
      }
    });

    return exams;
  };

  const mockExams = generateMockExams();
  
  // 获取用户已报名的课程
  const enrolledCourses = availableCourses.filter(course => 
    user?.enrolledCourses?.includes(course.id)
  );
  
  const getCourseExams = (courseId: string) => mockExams.filter(exam => exam.courseId === courseId);

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourse(courseId);
    setExamState('examList');
  };

  const handleBackToCourseList = () => {
    setSelectedCourse(null);
    setExamState('courseList');
  };

  const handleStartExam = (exam: MockExam) => {
    const existingProgress = getMockExamProgress(exam.id);
    
    if (existingProgress && !existingProgress.isCompleted) {
      // 继续之前的考试
      setSelectedExam(exam);
      setCurrentQuestionIndex(existingProgress.currentQuestionIndex);
      setAnswers(existingProgress.answers);
      setCurrentAnswer(existingProgress.answers[existingProgress.currentQuestionIndex] || null);
      setTimeLeft(existingProgress.timeLeft);
      setCurrentProgress(existingProgress);
      setExamState('taking');
      setIsTimerRunning(true);
    } else {
      // 开始新考试
      const newProgress: MockExamProgress = {
        id: `progress-${exam.id}-${Date.now()}`,
        examId: exam.id,
        examTitle: exam.title,
        courseId: exam.courseId,
        courseName: exam.courseName,
        startTime: new Date().toISOString(),
        lastUpdateTime: new Date().toISOString(),
        currentQuestionIndex: 0,
        answers: new Array(exam.totalQuestions).fill(undefined),
        timeLeft: exam.timeLimit * 60, // 转换为秒
        totalTimeLimit: exam.timeLimit * 60,
        isCompleted: false,
        isPaused: false,
        totalQuestions: exam.totalQuestions
      };
      
      setSelectedExam(exam);
      setCurrentQuestionIndex(0);
      setAnswers(new Array(exam.totalQuestions).fill(undefined));
      setCurrentAnswer(null);
      setTimeLeft(exam.timeLimit * 60);
      setCurrentProgress(newProgress);
      saveMockExamProgress(newProgress);
      setExamState('taking');
      setIsTimerRunning(true);
    }
  };

  const handleContinueExam = (progress: MockExamProgress) => {
    const exam = mockExams.find(e => e.id === progress.examId);
    if (exam) {
      setSelectedExam(exam);
      setCurrentQuestionIndex(progress.currentQuestionIndex);
      setAnswers(progress.answers);
      setCurrentAnswer(progress.answers[progress.currentQuestionIndex] || null);
      setTimeLeft(progress.timeLeft);
      setCurrentProgress(progress);
      setExamState('taking');
      setIsTimerRunning(true);
    }
  };

  const handleAnswerSelect = (answer: any) => {
    setCurrentAnswer(answer);
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    
    // 保存进度
    if (selectedExam && currentProgress) {
      const updatedProgress = {
        ...currentProgress,
        answers: newAnswers,
        lastUpdateTime: new Date().toISOString()
      };
      setCurrentProgress(updatedProgress);
      saveMockExamProgress(updatedProgress);
    }
  };

  const handleNextQuestion = () => {
    if (selectedExam && currentQuestionIndex < selectedExam.totalQuestions - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(answers[nextIndex] || null);
      
      // 保存进度
      if (currentProgress) {
        const updatedProgress = {
          ...currentProgress,
          currentQuestionIndex: nextIndex,
          lastUpdateTime: new Date().toISOString()
        };
        setCurrentProgress(updatedProgress);
        saveMockExamProgress(updatedProgress);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setCurrentAnswer(answers[prevIndex] || null);
      
      // 保存进度
      if (currentProgress) {
        const updatedProgress = {
          ...currentProgress,
          currentQuestionIndex: prevIndex,
          lastUpdateTime: new Date().toISOString()
        };
        setCurrentProgress(updatedProgress);
        saveMockExamProgress(updatedProgress);
      }
    }
  };

  const handlePauseExam = () => {
    setIsTimerRunning(false);
    setShowPauseDialog(true);
  };

  const handleResumeExam = () => {
    setIsTimerRunning(true);
    setShowPauseDialog(false);
  };

  const handleSubmitExam = () => {
    if (!selectedExam || !currentProgress) return;
    
    setIsTimerRunning(false);
    
    // 计算得分
    const answeredQuestions = answers.filter(a => a !== undefined && a !== null);
    const correctAnswers = answers.reduce((count, answer, index) => {
      if (answer !== undefined && answer !== null) {
        return count + (isAnswerCorrect(answer, selectedExam.questions[index].correctAnswer) ? 1 : 0);
      }
      return count;
    }, 0);
    
    const score = answeredQuestions.length > 0 ? Math.round((correctAnswers / answeredQuestions.length) * 100) : 0;
    const passed = score >= selectedExam.passingScore;
    
    // 保存考试记录
    const attempt: MockExamAttempt = {
      id: `attempt-${selectedExam.id}-${Date.now()}`,
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      courseId: selectedExam.courseId,
      courseName: selectedExam.courseName,
      startTime: currentProgress.startTime,
      endTime: new Date().toISOString(),
      timeSpent: currentProgress.totalTimeLimit - timeLeft,
      answers: answers,
      score: score,
      passed: passed,
      isCompleted: true,
      correctAnswers: correctAnswers,
      totalQuestions: selectedExam.totalQuestions,
      passingScore: selectedExam.passingScore
    };
    
    saveMockExamAttempt(attempt);
    
    // 删除进度记录
    deleteMockExamProgress(selectedExam.id);
    
    // 设置当前尝试和显示结果
    setCurrentAttempt(attempt);
    setExamState('completed');
    setShowSubmitDialog(false);
  };

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    toast.warning('考试时间已到！', {
      description: "系统将自动提交您的答案。",
      duration: 5000,
    });
    handleSubmitExam();
  };

  const getCourseStats = (courseId: string) => {
    const courseExams = getCourseExams(courseId);
    const completedExams = courseExams.filter(exam => {
      const attempts = getMockExamAttempts(exam.id);
      return attempts.length > 0;
    }).length;
    return {
      totalExams: courseExams.length,
      completedExams,
      completionRate: safePercentage(completedExams, courseExams.length)
    };
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 课程列表界面 - 只显示已报名的课程
  if (examState === 'courseList') {
    const ongoingProgress = getAllMockExamProgress();

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mt-2">模拟考试</h1>
            <p className="text-gray-600 mt-1">选择课程查看相关模拟考试</p>
          </div>
        </div>

        {ongoingProgress.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-orange-600" />未完成的考试
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ongoingProgress.map(progress => (
                <Card key={progress.id} className="border-orange-200 bg-orange-50 flex flex-col">
                  <CardHeader className="pb-3 flex-grow">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{progress.examTitle}</CardTitle>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">进行中</Badge>
                    </div>
                    <CardDescription className="text-sm">{progress.courseName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>进度</span><span>{progress.currentQuestionIndex + 1}/{progress.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>剩余时间</span><span className="text-orange-600">{formatTime(progress.timeLeft)}</span>
                      </div>
                    </div>
                    <Progress value={safePercentage(progress.currentQuestionIndex + 1, progress.totalQuestions)} className="h-2" />
                    <Button className="w-full" size="sm" onClick={() => handleContinueExam(progress)}>
                      <Play className="h-4 w-4 mr-2" />继续考试
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">选择课程</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map(course => {
              const stats = getCourseStats(course.id);
              
              return (
                <Card 
                  key={course.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" 
                  onClick={() => handleSelectCourse(course.id)}
                >
                  <div className="relative">
                    <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="text-sm opacity-90">{course.category}</div>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">
                        {getCourseExams(course.id).length} 套试卷
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>{getCourseExams(course.id).length} 套试卷</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{stats.completedExams} 已练习</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span>练习模式</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        <span>{stats.completionRate}% 完成度</span>
                      </div>
                    </div>

                    {stats.completedExams > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>练习进度</span><span className="text-blue-600">{stats.completedExams}/{stats.totalExams}</span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                      </div>
                    )}

                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      进入考试
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {enrolledCourses.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">还没有报名课程</h3>
              <p className="text-gray-500 text-center mb-4">
                请联系课程顾问报名您感兴趣的职业培训课程
              </p>
              <Button onClick={() => window.open('tel:400-123-4567')}>
                联系课程顾问
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // 考试列表界面
  if (examState === 'examList' && selectedCourse) {
    const courseExams = getCourseExams(selectedCourse);
    const selectedCourseInfo = availableCourses.find(c => c.id === selectedCourse);

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button onClick={handleBackToCourseList} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回课程列表
            </Button>
            <h1 className="text-3xl mt-2">{selectedCourseInfo?.name} - 模拟考试</h1>
            <p className="text-gray-600 mt-1">选择考试进行模拟测试，检验学习成果</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courseExams.map(exam => {
            const attempts = getMockExamAttempts(exam.id);
            const progress = getMockExamProgress(exam.id);
            const hasProgress = progress && !progress.isCompleted;
            
            return (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <div className="relative">
                  <div className="h-32 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-t-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="text-sm opacity-90">{exam.courseName}</div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary">
                      {hasProgress ? '进行中' : '练习考试'}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="flex-grow">
                  <CardTitle className="text-lg">{exam.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {exam.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>{exam.timeLimit} 分钟</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span>{exam.totalQuestions} 道题</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-600" />
                      <span>及格: {exam.passingScore}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <History className="h-4 w-4 text-purple-600" />
                      <span>{attempts.length} 次尝试</span>
                    </div>
                  </div>

                  {/* 进行中的考试进度 */}
                  {hasProgress && progress && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex justify-between text-sm text-orange-800 mb-2">
                        <span>考试进度</span>
                        <span>{progress.currentQuestionIndex + 1}/{progress.totalQuestions}</span>
                      </div>
                      <Progress 
                        value={safePercentage(progress.currentQuestionIndex + 1, progress.totalQuestions)} 
                        className="h-2 mb-2" 
                      />
                      <div className="text-xs text-orange-600">
                        剩余时间: {formatTime(progress.timeLeft)}
                      </div>
                    </div>
                  )}

                  {/* 最佳成绩显示 */}
                  {attempts.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>最佳成绩</span>
                      <span className={`font-medium ${
                        Math.max(...attempts.map(a => a.score)) >= exam.passingScore ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.max(...attempts.map(a => a.score))}% {Math.max(...attempts.map(a => a.score)) >= exam.passingScore ? '(通过)' : '(未通过)'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button className="flex-1" onClick={() => handleStartExam(exam)}>
                      {hasProgress ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          继续考试
                        </>
                      ) : (
                        <>开始考试</>
                      )}
                    </Button>
                    {attempts.length > 0 && !hasProgress && (
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // 考试进行中界面
  if (examState === 'taking' && selectedExam) {
    const currentQuestion = selectedExam.questions[currentQuestionIndex];
    const answeredCount = answers.filter(a => a !== undefined && a !== null).length;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* 顶部导航和信息 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button onClick={handlePauseExam} variant="outline">
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </Button>
            <div className="text-sm text-gray-600">
              题目 {currentQuestionIndex + 1} / {selectedExam.totalQuestions}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${timeLeft <= 300 ? 'text-red-600' : 'text-gray-600'}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
            <Button onClick={() => setShowSubmitDialog(true)} variant="outline">
              提交考试
            </Button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl">{selectedExam.title}</h1>
            <span className="text-sm text-gray-600">已答: {answeredCount}/{selectedExam.totalQuestions}</span>
          </div>
          <Progress value={(currentQuestionIndex + 1) / selectedExam.totalQuestions * 100} className="h-2" />
        </div>

        {/* 题目 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === "single-choice" ? (
              <RadioGroup
                value={currentAnswer?.toString() || ""}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`option-${index}`}
                      checked={Array.isArray(currentAnswer) && currentAnswer.includes(index)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer, index] : [index];
                          handleAnswerSelect(newAnswer);
                        } else {
                          const newAnswer = Array.isArray(currentAnswer) ? currentAnswer.filter(a => a !== index) : [];
                          handleAnswerSelect(newAnswer.length > 0 ? newAnswer : null);
                        }
                      }}
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            上一题
          </Button>

          <Button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === selectedExam.totalQuestions - 1}
          >
            下一题
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* 暂停对话框 */}
        <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>考试已暂停</DialogTitle>
              <DialogDescription>
                您可以继续考试或退出。退出后您的答案将被保存，可以稍后继续。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => {
                setExamState('courseList');
                setShowPauseDialog(false);
              }} variant="outline">
                退出考试
              </Button>
              <Button onClick={handleResumeExam}>
                继续考试
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 提交确认对话框 */}
        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认提交考试</DialogTitle>
              <DialogDescription>
                您确定要提交考试吗？提交后将无法修改答案。
                <br />
                已答题目：{answeredCount}/{selectedExam.totalQuestions}
                <br />
                剩余时间：{formatTime(timeLeft)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setShowSubmitDialog(false)} variant="outline">
                取消
              </Button>
              <Button onClick={handleSubmitExam}>
                确认提交
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 时间警告对话框 */}
        <Dialog open={showTimeWarning} onOpenChange={setShowTimeWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-orange-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                时间提醒
              </DialogTitle>
              <DialogDescription>
                考试时间还剩5分钟，请抓紧时间完成剩余题目。
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowTimeWarning(false)}>
                知道了
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 考试完成界面
  if (examState === 'completed' && currentAttempt) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            currentAttempt.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {currentAttempt.passed ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <h1 className="text-3xl mb-2">考试完成！</h1>
          <p className="text-gray-600">
            {currentAttempt.passed ? '恭喜您通过了考试！' : '很遗憾，您未能通过考试，请继续努力！'}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>考试成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className={`text-4xl font-bold ${currentAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {currentAttempt.score}%
                </div>
                <div className="text-sm text-gray-600">总得分</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{currentAttempt.correctAnswers}</div>
                <div className="text-sm text-gray-600">正确题数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{currentAttempt.totalQuestions}</div>
                <div className="text-sm text-gray-600">总题数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">{Math.floor(currentAttempt.timeSpent / 60)}</div>
                <div className="text-sm text-gray-600">用时(分钟)</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span>及格线</span>
                <span className="font-medium">{currentAttempt.passingScore}%</span>
              </div>
              <Progress 
                value={currentAttempt.score} 
                className="h-3 mt-2"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>0%</span>
                <span className="text-red-600">{currentAttempt.passingScore}%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button onClick={() => setExamState('courseList')} variant="outline">
            返回考试列表
          </Button>
          <Button onClick={() => {
            if (selectedExam) handleStartExam(selectedExam);
          }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重新考试
          </Button>
        </div>
      </div>
    );
  }

  // 默认加载状态
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在加载...</p>
      </div>
    </div>
  );
}