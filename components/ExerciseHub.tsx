import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, CheckCircle, XCircle, Trophy, BookOpen, RotateCcw, History, Brain, Target, Eye, AlertCircle, ChevronLeft, ChevronRight, List, Filter, TrendingUp, TrendingDown, Minus, Users, Star, Clock, RefreshCw } from "lucide-react";
import { useAuth, availableCourses, ExerciseProgress, ExerciseAttempt } from "../contexts/AuthContext";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  type: "single-choice" | "multiple-choice";
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  chapter: string;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterName: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: Question[];
  totalQuestions: number;
}

interface ExerciseHubProps {
  onBack: () => void;
}

type ExerciseMode = 'practice' | 'review' | 'wrongQuestions' | 'browse';
type BrowseFilter = 'all' | 'answered' | 'wrong' | 'unanswered';

// 安全的数学计算函数
const safeCalculate = (numerator: number, denominator: number, fallback: number = 0): number => {
  if (!isFinite(numerator) || !isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

// 安全的百分比计算
const safePercentage = (numerator: number, denominator: number): number => {
  const result = safeCalculate(numerator, denominator, 0) * 100;
  return Math.round(isFinite(result) ? result : 0);
};

// 安全的数值验证
const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isFinite(num) ? num : fallback;
};

// 比较答案是否正确（支持单选和多选）
const isAnswerCorrect = (userAnswer: any, correctAnswer: number | number[]): boolean => {
  if (Array.isArray(correctAnswer)) {
    // 多选题比较
    if (!Array.isArray(userAnswer)) return false;
    if (userAnswer.length !== correctAnswer.length) return false;
    const sortedUser = [...userAnswer].sort((a, b) => a - b);
    const sortedCorrect = [...correctAnswer].sort((a, b) => a - b);
    return sortedUser.every((answer, index) => answer === sortedCorrect[index]);
  } else {
    // 单选题比较
    return userAnswer === correctAnswer;
  }
};

export function ExerciseHub({ onBack }: ExerciseHubProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [currentTab, setCurrentTab] = useState("practice");
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode>('practice');
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [browseFilter, setBrowseFilter] = useState<BrowseFilter>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [progressKey, setProgressKey] = useState(0);
  const [realTimeStats, setRealTimeStats] = useState<{answered: number, wrong: number, correct: number} | null>(null);
  const { user, hasAccess, getExerciseProgress, updateExerciseProgress, saveExerciseAttempt, getQuestionDifficulty, getQuestionStats } = useAuth();

  // 监听用户变化，刷新进度
  useEffect(() => {
    setProgressKey(prev => prev + 1);
    if (selectedExercise) {
      updateRealTimeStats();
    }
  }, [user, selectedExercise]);

  // 实时更新统计数据
  const updateRealTimeStats = () => {
    if (!selectedExercise) return;
    
    const progress = getExerciseProgress(selectedExercise.id);
    if (progress && Array.isArray(progress.answers)) {
      const answered = progress.answers.filter(a => a !== undefined && a !== null).length;
      const wrong = progress.answers.reduce((count, answer, index) => {
        if (answer !== undefined && answer !== null && index < selectedExercise.questions.length) {
          const isWrong = !isAnswerCorrect(answer, selectedExercise.questions[index].correctAnswer);
          return count + (isWrong ? 1 : 0);
        }
        return count;
      }, 0);
      const correct = Math.max(0, answered - wrong);
      
      setRealTimeStats({ 
        answered: safeNumber(answered), 
        wrong: safeNumber(wrong), 
        correct: safeNumber(correct) 
      });
    } else {
      setRealTimeStats({ answered: 0, wrong: 0, correct: 0 });
    }
  };

  // 生成大量题库 - 包含单选和多选题
  const generateQuestions = (): Exercise[] => {
    const exercises: Exercise[] = [];
    
    const courseQuestions = {
      'health-manager': {
        chapters: [
          { id: 'basic-concepts', name: '健康管理基础概念', questionCount: 50 },
          { id: 'risk-assessment', name: '健康风险评估', questionCount: 45 }
        ],
        questionTemplates: [
          { q: "健康管理的核心理念是什么？", type: "single-choice", opts: ["治疗疾病", "预防为主，防治结合", "药物治疗", "手术治疗"], correct: 1, exp: "健康管理强调预防为主、防治结合的理念。" },
          { q: "健康管理的主要内容包括哪些？", type: "multiple-choice", opts: ["健康评估", "健康咨询", "健康干预", "疾病治疗"], correct: [0, 1, 2], exp: "健康管理主要包括健康评估、健康咨询和健康干预。" }
        ]
      },
      'mental-health-counselor': {
        chapters: [
          { id: 'psychology-basics', name: '心理学基础理论', questionCount: 60 }
        ],
        questionTemplates: [
          { q: "心理咨询的基本原则不包括？", type: "single-choice", opts: ["保密原则", "自愿原则", "强制原则", "专业原则"], correct: 2, exp: "心理咨询强调自愿参与。" }
        ]
      },
      'childcare-specialist': {
        chapters: [
          { id: 'infant-development', name: '婴幼儿发展特点', questionCount: 40 }
        ],
        questionTemplates: [
          { q: "新生儿的正常体温范围是？", type: "single-choice", opts: ["35.5-36.5℃", "36.0-37.0℃", "36.5-37.5℃", "37.0-38.0℃"], correct: 2, exp: "新生儿正常体温范围为36.5-37.5℃。" }
        ]
      },
      'rehabilitation-therapist': {
        chapters: [
          { id: 'anatomy-physiology', name: '解剖生理学基础', questionCount: 65 }
        ],
        questionTemplates: [
          { q: "康复医学的主要目标是？", type: "single-choice", opts: ["治愈疾病", "减轻痛苦", "恢复功能", "预防复发"], correct: 2, exp: "康复医学的主要目标是恢复功能。" }
        ]
      }
    };

    availableCourses.forEach(course => {
      const courseData = courseQuestions[course.id as keyof typeof courseQuestions];
      if (courseData) {
        courseData.chapters.forEach(chapter => {
          const questions: Question[] = [];
          
          for (let i = 1; i <= chapter.questionCount; i++) {
            const templateIndex = (i - 1) % courseData.questionTemplates.length;
            const template = courseData.questionTemplates[templateIndex];
            const questionId = `${chapter.id}-q${i}`;
            
            questions.push({
              id: questionId,
              question: `${template.q} (第${i}题)`,
              type: template.type as "single-choice" | "multiple-choice",
              options: template.opts,
              correctAnswer: template.correct,
              explanation: template.exp,
              difficulty: getQuestionDifficulty(questionId),
              chapter: chapter.name
            });
          }

          exercises.push({
            id: `${course.id}-${chapter.id}`,
            title: chapter.name,
            description: `${course.name} - ${chapter.name}章节练习，共${chapter.questionCount}道题`,
            courseId: course.id,
            courseName: course.name,
            chapterId: chapter.id,
            chapterName: chapter.name,
            difficulty: "Medium",
            questions,
            totalQuestions: chapter.questionCount
          });
        });
      }
    });

    return exercises;
  };

  const exercises = generateQuestions();

  // 获取用户已报名的课程
  const enrolledCourses = availableCourses.filter(course => 
    user?.enrolledCourses?.includes(course.id)
  );

  // 获取错题
  const getWrongQuestions = (exerciseId: string): Question[] => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return [];
    
    const progress = getExerciseProgress(exerciseId);
    if (!progress || !Array.isArray(progress.answers)) return [];
    
    return exercise.questions.filter((question, index) => {
      const userAnswer = progress.answers[index];
      return userAnswer !== undefined && userAnswer !== null && 
             !isAnswerCorrect(userAnswer, question.correctAnswer);
    });
  };

  // 处理练习选择
  const handleStartExercise = (exercise: Exercise, mode: ExerciseMode = 'practice') => {
    setExerciseMode(mode);
    setSelectedExercise(exercise);
    setShowResults(false);
    setCurrentAnswer(null);
    setShowFeedback(false);
    
    // 根据模式设置不同的题目
    if (mode === 'wrongQuestions') {
      const wrongQuestions = getWrongQuestions(exercise.id);
      if (wrongQuestions.length === 0) {
        toast.success('当前练习没有错题！', {
          description: "恭喜您！这个练习的所有题目都已答对。",
          duration: 3000,
        });
        return;
      }
      setReviewQuestions(wrongQuestions);
      setSelectedAnswers(new Array(wrongQuestions.length).fill(null));
      setCurrentQuestionIndex(0);
    } else {
      // 加载已有进度
      const progress = getExerciseProgress(exercise.id);
      if (progress && Array.isArray(progress.answers)) {
        setSelectedAnswers(progress.answers);
        setCurrentQuestionIndex(progress.lastQuestionIndex || 0);
      } else {
        setSelectedAnswers(new Array(exercise.totalQuestions).fill(null));
        setCurrentQuestionIndex(0);
      }
    }
  };

  // 处理课程选择
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  // 获取课程统计信息
  const getCourseStats = (courseId: string) => {
    const courseExercises = exercises.filter(ex => ex.courseId === courseId);
    const totalQuestions = courseExercises.reduce((sum, ex) => safeNumber(ex.totalQuestions, 0) + sum, 0);
    const completedExercises = courseExercises.filter(ex => {
      const progress = getExerciseProgress(ex.id);
      return progress?.isCompleted;
    }).length;
    
    return {
      totalExercises: courseExercises.length,
      totalQuestions: safeNumber(totalQuestions),
      completedExercises: safeNumber(completedExercises),
      completionRate: safePercentage(completedExercises, courseExercises.length)
    };
  };

  // 获取练习统计信息
  const getExerciseStats = (exercise: Exercise) => {
    const progress = getExerciseProgress(exercise.id);
    if (!progress || !Array.isArray(progress.answers)) {
      return { answered: 0, wrong: 0, total: safeNumber(exercise.totalQuestions, 0) };
    }
    
    const answeredCount = progress.answers.filter(a => a !== undefined && a !== null).length;
    const wrongCount = progress.answers.reduce((count, answer, index) => {
      if (answer !== undefined && answer !== null && index < exercise.questions.length) {
        const isWrong = !isAnswerCorrect(answer, exercise.questions[index].correctAnswer);
        return count + (isWrong ? 1 : 0);
      }
      return count;
    }, 0);
    
    return {
      answered: safeNumber(answeredCount),
      wrong: safeNumber(wrongCount),
      total: safeNumber(exercise.totalQuestions, 0)
    };
  };

  // 处理答案选择
  const handleAnswerSelect = (answer: any) => {
    setCurrentAnswer(answer);
  };

  // 处理答案提交
  const handleSubmitAnswer = () => {
    if (!selectedExercise || 
        currentAnswer === null || 
        currentAnswer === undefined ||
        (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      console.log('提交答案失败：缺少必要条件', {
        selectedExercise: !!selectedExercise,
        currentAnswer,
        currentQuestionIndex,
        isArray: Array.isArray(currentAnswer),
        arrayLength: Array.isArray(currentAnswer) ? currentAnswer.length : 'N/A'
      });
      return;
    }

    console.log('开始提交答案：', {
      exerciseId: selectedExercise.id,
      questionIndex: currentQuestionIndex,
      answer: currentAnswer
    });

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setSelectedAnswers(newAnswers);

    const currentQuestion = exerciseMode === 'wrongQuestions' 
      ? reviewQuestions[currentQuestionIndex]
      : selectedExercise.questions[currentQuestionIndex];
    const isCorrect = isAnswerCorrect(currentAnswer, currentQuestion.correctAnswer);

    console.log('答案验证结果：', {
      questionId: currentQuestion.id,
      userAnswer: currentAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect
    });

    // 保存答题记录
    const attempt: ExerciseAttempt = {
      exerciseId: selectedExercise.id,
      questionId: currentQuestion.id,
      selectedAnswer: currentAnswer,
      isCorrect,
      attemptTime: new Date().toISOString()
    };
    
    try {
      saveExerciseAttempt(attempt);
      console.log('答题记录已保存');
    } catch (error) {
      console.error('保存答题记录失败：', error);
    }

    // 更新练习进度
    const answeredCount = newAnswers.filter(a => a !== null && a !== undefined).length;
    const correctCount = newAnswers.reduce((count, answer, index) => {
      if (answer !== null && answer !== undefined && index < selectedExercise.questions.length) {
        const isQuestionCorrect = isAnswerCorrect(answer, selectedExercise.questions[index].correctAnswer);
        return count + (isQuestionCorrect ? 1 : 0);
      }
      return count;
    }, 0);

    const progressUpdate: Partial<ExerciseProgress> = {
      courseId: selectedExercise.courseId,
      chapterId: selectedExercise.chapterId,
      totalQuestions: selectedExercise.totalQuestions,
      completedQuestions: answeredCount,
      correctAnswers: correctCount,
      lastQuestionIndex: currentQuestionIndex,
      answers: newAnswers,
      isCompleted: answeredCount === selectedExercise.totalQuestions,
      score: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    };

    console.log('更新练习进度：', progressUpdate);

    try {
      updateExerciseProgress(selectedExercise.id, progressUpdate);
      console.log('练习进度已更新');
      
      // 更新实时统计
      updateRealTimeStats();
      
      setShowFeedback(true);
      console.log('答案提交完成，显示反馈');
    } catch (error) {
      console.error('更新练习进度失败：', error);
    }
  };

  // 处理下一题
  const handleNextQuestion = () => {
    const totalQuestions = exerciseMode === 'wrongQuestions' 
      ? reviewQuestions.length 
      : selectedExercise!.questions.length;
      
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(selectedAnswers[currentQuestionIndex + 1] || null);
      setShowFeedback(false);
    } else {
      // 完成练习，显示结果
      setShowResults(true);
    }
  };

  // 处理上一题
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(selectedAnswers[currentQuestionIndex - 1] || null);
      setShowFeedback(false);
    }
  };

  // 重新开始练习
  const handleRestartExercise = () => {
    const totalQuestions = exerciseMode === 'wrongQuestions' 
      ? reviewQuestions.length 
      : selectedExercise!.totalQuestions;
    setSelectedAnswers(new Array(totalQuestions).fill(null));
    setCurrentQuestionIndex(0);
    setCurrentAnswer(null);
    setShowFeedback(false);
    setShowResults(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 如果没有选择课程，显示已报名的课程列表
  if (!selectedCourse) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl mt-2">练习中心</h1>
            <p className="text-gray-600 mt-1">选择课程开始练习</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(course => {
            const stats = getCourseStats(course.id);
            
            return (
              <Card 
                key={course.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" 
                onClick={() => handleCourseSelect(course.id)}
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
                      {stats.totalExercises} 套练习
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
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span>{stats.totalExercises} 套练习</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{stats.completedExercises} 已完成</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <span>{stats.totalQuestions} 道题目</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span>{stats.completionRate}% 完成度</span>
                    </div>
                  </div>

                  {stats.completedExercises > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>练习进度</span>
                        <span className="text-blue-600">
                          {stats.completedExercises}/{stats.totalExercises}
                        </span>
                      </div>
                      <Progress value={stats.completionRate} className="h-2" />
                    </div>
                  )}
                  
                  <Button className="w-full">开始练习</Button>
                </CardContent>
              </Card>
            );
          })}
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

  // 如果正在做练习，显示练习界面
  if (selectedExercise && !showResults) {
    const currentQuestion = exerciseMode === 'wrongQuestions' 
      ? reviewQuestions[currentQuestionIndex]
      : selectedExercise.questions[currentQuestionIndex];
    const totalQuestions = exerciseMode === 'wrongQuestions' 
      ? reviewQuestions.length 
      : selectedExercise.totalQuestions;
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => setSelectedExercise(null)} variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回练习列表
          </Button>
          <div className="text-sm text-gray-600">
            题目 {currentQuestionIndex + 1} / {totalQuestions}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl">{selectedExercise.title}</h1>
            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty}
            </Badge>
          </div>
          <Progress value={(currentQuestionIndex + 1) / totalQuestions * 100} className="h-2" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        console.log('多选题选择变化：', { index, checked, currentAnswer });
                        if (checked) {
                          const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer, index] : [index];
                          console.log('添加选项，新答案：', newAnswer);
                          handleAnswerSelect(newAnswer);
                        } else {
                          const newAnswer = Array.isArray(currentAnswer) ? currentAnswer.filter(a => a !== index) : [];
                          console.log('移除选项，新答案：', newAnswer);
                          handleAnswerSelect(newAnswer.length > 0 ? newAnswer : []);
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

            {showFeedback && (
              <div className={`p-4 rounded-lg ${
                isAnswerCorrect(currentAnswer, currentQuestion.correctAnswer) 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {isAnswerCorrect(currentAnswer, currentQuestion.correctAnswer) ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    isAnswerCorrect(currentAnswer, currentQuestion.correctAnswer) 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {isAnswerCorrect(currentAnswer, currentQuestion.correctAnswer) ? '回答正确！' : '回答错误'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            上一题
          </Button>

          <div className="flex space-x-2">
            {!showFeedback ? (
              <Button 
                onClick={handleSubmitAnswer} 
                disabled={
                  currentAnswer === null || 
                  currentAnswer === undefined || 
                  (Array.isArray(currentAnswer) && currentAnswer.length === 0)
                }
              >
                提交答案
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex === totalQuestions - 1 ? '查看结果' : '下一题'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 显示练习结果
  if (showResults && selectedExercise) {
    const correctCount = selectedAnswers.reduce((count, answer, index) => {
      if (answer !== null && answer !== undefined) {
        const question = exerciseMode === 'wrongQuestions' 
          ? reviewQuestions[index]
          : selectedExercise.questions[index];
        return count + (isAnswerCorrect(answer, question.correctAnswer) ? 1 : 0);
      }
      return count;
    }, 0);
    const totalAnswered = selectedAnswers.filter(a => a !== null && a !== undefined).length;
    const score = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-3xl mb-2">练习完成！</h1>
          <p className="text-gray-600">恭喜您完成了《{selectedExercise.title}》的练习</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>练习成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{score}%</div>
                <div className="text-sm text-gray-600">总得分</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-gray-600">正确题数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{totalAnswered - correctCount}</div>
                <div className="text-sm text-gray-600">错误题数</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{totalAnswered}</div>
                <div className="text-sm text-gray-600">总答题数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button onClick={handleRestartExercise} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            重新练习
          </Button>
          <Button onClick={() => setSelectedExercise(null)}>
            返回练习列表
          </Button>
        </div>
      </div>
    );
  }

  // 如果没有选择练习，显示练习列表
  if (!selectedExercise) {
    const courseExercises = exercises.filter(ex => ex.courseId === selectedCourse);
    const selectedCourseInfo = availableCourses.find(c => c.id === selectedCourse);

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button onClick={() => setSelectedCourse(null)} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回课程选择
            </Button>
            <h1 className="text-3xl mt-2">{selectedCourseInfo?.name} - 练习中心</h1>
            <p className="text-gray-600 mt-1">选择练习模式开始学习</p>
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="practice">练习模式</TabsTrigger>
            <TabsTrigger value="review">复习模式</TabsTrigger>
            <TabsTrigger value="wrong">错题练习</TabsTrigger>
            <TabsTrigger value="browse">题目浏览</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseExercises.map(exercise => {
                const stats = getExerciseStats(exercise);
                const progressInfo = getExerciseProgress(exercise.id);
                
                return (
                  <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                        <Badge className={getDifficultyColor(exercise.difficulty)}>
                          {exercise.difficulty}
                        </Badge>
                      </div>
                      <CardDescription>{exercise.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                          <div className="text-gray-600">总题数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
                          <div className="text-gray-600">已答题</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
                          <div className="text-gray-600">错题数</div>
                        </div>
                      </div>

                      {progressInfo && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>练习进度</span>
                            <span className="text-blue-600">
                              {safePercentage(stats.answered, stats.total)}%
                            </span>
                          </div>
                          <Progress value={safePercentage(stats.answered, stats.total)} className="h-2" />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleStartExercise(exercise, 'practice')}
                          className="flex-1"
                        >
                          开始练习
                        </Button>
                        {progressInfo && (
                          <Button 
                            onClick={() => handleStartExercise(exercise, 'practice')}
                            variant="outline"
                            className="flex-1"
                          >
                            继续练习
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseExercises.map(exercise => {
                const stats = getExerciseStats(exercise);
                const progressInfo = getExerciseProgress(exercise.id);
                
                return (
                  <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                        <Badge variant="secondary">
                          <History className="h-3 w-3 mr-1" />
                          复习模式
                        </Badge>
                      </div>
                      <CardDescription>重新练习已完成的题目</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                          <div className="text-gray-600">总题数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
                          <div className="text-gray-600">已答题</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {progressInfo?.score || 0}%
                          </div>
                          <div className="text-gray-600">正确率</div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleStartExercise(exercise, 'review')}
                        className="w-full"
                        disabled={!progressInfo || stats.answered === 0}
                      >
                        <History className="h-4 w-4 mr-2" />
                        开始复习
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="wrong" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseExercises.map(exercise => {
                const stats = getExerciseStats(exercise);
                const wrongQuestions = getWrongQuestions(exercise.id);
                
                return (
                  <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          错题练习
                        </Badge>
                      </div>
                      <CardDescription>专门练习做错的题目</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{stats.wrong}</div>
                          <div className="text-gray-600">错题数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{wrongQuestions.length}</div>
                          <div className="text-gray-600">可练习</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                          <div className="text-gray-600">总题数</div>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleStartExercise(exercise, 'wrongQuestions')}
                        className="w-full"
                        disabled={wrongQuestions.length === 0}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        错题练习
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">题目浏览</h3>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <select 
                  value={browseFilter} 
                  onChange={(e) => setBrowseFilter(e.target.value as BrowseFilter)}
                  className="border rounded px-2 py-1"
                >
                  <option value="all">全部题目</option>
                  <option value="answered">已答题目</option>
                  <option value="wrong">错题</option>
                  <option value="unanswered">未答题目</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {courseExercises.map(exercise => {
                const progress = getExerciseProgress(exercise.id);
                const filteredQuestions = exercise.questions.filter((question, index) => {
                  const userAnswer = progress?.answers?.[index];
                  const hasAnswered = userAnswer !== undefined && userAnswer !== null;
                  const isWrong = hasAnswered && !isAnswerCorrect(userAnswer, question.correctAnswer);
                  
                  switch (browseFilter) {
                    case 'answered': return hasAnswered;
                    case 'wrong': return isWrong;
                    case 'unanswered': return !hasAnswered;
                    default: return true;
                  }
                });

                return (
                  <Card key={exercise.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                        <Badge variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          {filteredQuestions.length} 题
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredQuestions.map((question, index) => {
                          const globalIndex = exercise.questions.indexOf(question);
                          const userAnswer = progress?.answers?.[globalIndex];
                          const hasAnswered = userAnswer !== undefined && userAnswer !== null;
                          const isCorrect = hasAnswered && isAnswerCorrect(userAnswer, question.correctAnswer);
                          const isExpanded = expandedQuestions.has(question.id);

                          return (
                            <div key={question.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-sm font-medium">第{globalIndex + 1}题</span>
                                    <Badge className={getDifficultyColor(question.difficulty)}>
                                      {question.difficulty}
                                    </Badge>
                                    {hasAnswered && (
                                      <Badge variant={isCorrect ? "default" : "destructive"}>
                                        {isCorrect ? "正确" : "错误"}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700">{question.question}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedQuestions);
                                    if (isExpanded) {
                                      newExpanded.delete(question.id);
                                    } else {
                                      newExpanded.add(question.id);
                                    }
                                    setExpandedQuestions(newExpanded);
                                  }}
                                >
                                  {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                              </div>

                              {isExpanded && (
                                <div className="mt-4 space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center space-x-2">
                                      <span className="text-sm font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                                      <span className="text-sm">{option}</span>
                                      {Array.isArray(question.correctAnswer) 
                                        ? question.correctAnswer.includes(optionIndex) && (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          )
                                        : question.correctAnswer === optionIndex && (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                          )
                                      }
                                    </div>
                                  ))}
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                    <strong>解析：</strong>{question.explanation}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}