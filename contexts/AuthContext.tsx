import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiAdapter, initializeApi } from '../lib/apiAdapter';
import { toast } from 'sonner';

export interface CourseProgress {
  courseId: string;
  courseName: string;
  category: string;
  totalVideos: number;
  watchedVideos: number;
  totalExercises: number;
  completedExercises: number;
  totalPDFs: number;
  readPDFs: number;
  studyHours: number;
  lastActivity: string;
  completionPercentage: number;
  remainingDays?: number; // 剩余学习天数
}

export interface CourseEnrollment {
  courseId: string;
  courseName: string;
  category: string;
  enrollmentDate: string;
  validUntil: string;
  examDate: string;
  status: 'active' | 'expired' | 'completed';
  paymentAmount: number;
  paymentDate: string;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  description: string;
  totalVideos: number;
  totalExercises: number;
  totalPDFs: number;
  estimatedHours: number;
  subCourses: SubCourse[];
}

export interface SubCourse {
  id: string;
  name: string;
  type: 'theory' | 'practice';
  parentCourseId: string;
  videoCount: number;
  description: string;
}

export interface ExerciseAttempt {
  exerciseId: string;
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  attemptTime: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  courseId: string;
  chapterId: string;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  lastQuestionIndex: number;
  answers: number[];
  attempts: ExerciseAttempt[];
  startTime: string;
  lastUpdateTime: string;
  isCompleted: boolean;
  score?: number;
}

// 模拟考试进度数据结构
export interface MockExamProgress {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  courseName: string;
  startTime: string;
  lastUpdateTime: string;
  currentQuestionIndex: number;
  answers: (number | undefined)[];
  timeLeft: number; // 剩余秒数
  totalTimeLimit: number; // 总时长（秒）
  isCompleted: boolean;
  isPaused: boolean;
  totalQuestions: number;
}

// 模拟考试完成记录
export interface MockExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  courseName: string;
  startTime: string;
  endTime: string;
  timeSpent: number; // 秒
  answers: number[];
  score: number;
  passed: boolean;
  isCompleted: boolean;
  correctAnswers: number;
  totalQuestions: number;
  passingScore: number;
}

// 全局题目统计数据
export interface QuestionStats {
  questionId: string;
  totalAttempts: number;
  wrongAttempts: number;
  wrongRate: number;
  currentDifficulty: 'Easy' | 'Medium' | 'Hard';
  originalDifficulty: 'Easy' | 'Medium' | 'Hard';
  lastUpdated: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  joinDate: string;
  avatar?: string;
  studyStats: {
    videosWatched: number;
    exercisesCompleted: number;
    pdfsRead: number;
    studyHours: number;
  };
  enrolledCourses: string[];
  courseProgress: CourseProgress[];
  courseEnrollments: CourseEnrollment[];
  exerciseProgress: ExerciseProgress[];
  mockExamProgress: MockExamProgress[]; // 新增：模拟考试进度
  mockExamAttempts: MockExamAttempt[]; // 新增：模拟考试完成记录
  preferences: {
    preferredSubjects: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
  };
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  updateCourseProgress: (courseId: string, updates: Partial<CourseProgress>) => void;
  updateExerciseProgress: (exerciseId: string, updates: Partial<ExerciseProgress>) => void;
  getExerciseProgress: (exerciseId: string) => ExerciseProgress | null;
  saveExerciseAttempt: (attempt: ExerciseAttempt) => void;
  getQuestionDifficulty: (questionId: string) => 'Easy' | 'Medium' | 'Hard';
  updateQuestionStats: (questionId: string, isCorrect: boolean) => void;
  getQuestionStats: (questionId: string) => QuestionStats | null;
  // 新增：模拟考试相关方法
  saveMockExamProgress: (progress: MockExamProgress) => void;
  getMockExamProgress: (examId: string) => MockExamProgress | null;
  deleteMockExamProgress: (examId: string) => void;
  saveMockExamAttempt: (attempt: MockExamAttempt) => void;
  getMockExamAttempts: (examId: string) => MockExamAttempt[];
  getAllMockExamProgress: () => MockExamProgress[];
  isLoading: boolean;
  availableCourses: Course[];
  hasAccess: (courseId: string) => boolean;
}

interface RegisterData {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 可用课程列表 - 删除母婴护理课程
export const availableCourses: Course[] = [
  {
    id: 'health-manager',
    name: '健康管理师',
    category: '健康管理',
    description: '学习健康评估、健康指导、健康危险因素干预等专业技能',
    totalVideos: 48,
    totalExercises: 20,
    totalPDFs: 15,
    estimatedHours: 80,
    subCourses: [
      {
        id: 'health-manager-theory',
        name: '健康管理师理论课',
        type: 'theory',
        parentCourseId: 'health-manager',
        videoCount: 24,
        description: '健康管理基础理论、政策法规、评估方法'
      },
      {
        id: 'health-manager-practice',
        name: '健康管理师实操课',
        type: 'practice',
        parentCourseId: 'health-manager',
        videoCount: 24,
        description: '健康档案管理、风险评估实操、干预方案制定'
      }
    ]
  },
  {
    id: 'mental-health-counselor',
    name: '心理健康指导',
    category: '心理健康',
    description: '掌握心理咨询基础理论、心理评估和心理干预技术',
    totalVideos: 56,
    totalExercises: 25,
    totalPDFs: 18,
    estimatedHours: 90,
    subCourses: [
      {
        id: 'mental-health-theory',
        name: '心理健康指导理论课',
        type: 'theory',
        parentCourseId: 'mental-health-counselor',
        videoCount: 28,
        description: '心理学基础、咨询理论、心理健康评估'
      },
      {
        id: 'mental-health-practice',
        name: '心理健康指导实操课',
        type: 'practice',
        parentCourseId: 'mental-health-counselor',
        videoCount: 28,
        description: '咨询技术练习、案例分析、实际操作演练'
      }
    ]
  },
  {
    id: 'childcare-specialist',
    name: '育婴员',
    category: '母婴护理',
    description: '学习婴幼儿护理、营养喂养、早期教育等专业知识',
    totalVideos: 40,
    totalExercises: 18,
    totalPDFs: 12,
    estimatedHours: 60,
    subCourses: [
      {
        id: 'childcare-theory',
        name: '育婴员理论课',
        type: 'theory',
        parentCourseId: 'childcare-specialist',
        videoCount: 20,
        description: '婴幼儿发育特点、营养需求、教育理念'
      },
      {
        id: 'childcare-practice',
        name: '育婴员实操课',
        type: 'practice',
        parentCourseId: 'childcare-specialist',
        videoCount: 20,
        description: '护理技能操作、喂养实操、早教活动设计'
      }
    ]
  },
  {
    id: 'rehabilitation-therapist',
    name: '康复理疗师',
    category: '康复医学',
    description: '掌握康复评估、物理治疗、运动治疗等康复技术',
    totalVideos: 64,
    totalExercises: 28,
    totalPDFs: 22,
    estimatedHours: 100,
    subCourses: [
      {
        id: 'rehabilitation-theory',
        name: '康复理疗师理论课',
        type: 'theory',
        parentCourseId: 'rehabilitation-therapist',
        videoCount: 32,
        description: '康复医学基础、解剖生理、康复评估理论'
      },
      {
        id: 'rehabilitation-practice',
        name: '康复理疗师实操课',
        type: 'practice',
        parentCourseId: 'rehabilitation-therapist',
        videoCount: 32,
        description: '物理治疗技术、运动康复实操、设备使用'
      }
    ]
  }
];

// 全局题目统计数据存储
let globalQuestionStats: Map<string, QuestionStats> = new Map();

// 初始化题目统计数据
const initializeQuestionStats = () => {
  // 加载本地存储的统计数据
  const savedStats = localStorage.getItem('questionStats');
  if (savedStats) {
    try {
      const statsArray = JSON.parse(savedStats);
      globalQuestionStats = new Map(statsArray);
    } catch (error) {
      console.error('Failed to load question stats:', error);
    }
  }
};

// 保存题目统计数据到本地存储
const saveQuestionStats = () => {
  try {
    const statsArray = Array.from(globalQuestionStats.entries());
    localStorage.setItem('questionStats', JSON.stringify(statsArray));
  } catch (error) {
    console.error('Failed to save question stats:', error);
  }
};

// 计算题目难度
const calculateDifficulty = (wrongRate: number): 'Easy' | 'Medium' | 'Hard' => {
  if (wrongRate <= 0.3) return 'Easy';
  if (wrongRate <= 0.6) return 'Medium';
  return 'Hard';
};

// 小兔子头像URL
const rabbitAvatarUrl = "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&h=200&fit=crop&crop=face";

// 生成课程报名信息
const generateCourseEnrollments = (enrolledCourses: string[]): CourseEnrollment[] => {
  const baseDate = new Date('2024-10-15');
  const enrollments: CourseEnrollment[] = [];
  
  enrolledCourses.forEach((courseId, index) => {
    const course = availableCourses.find(c => c.id === courseId);
    if (course) {
      const enrollmentDate = new Date(baseDate);
      enrollmentDate.setDate(baseDate.getDate() + index * 7); // 每周报名一个课程
      
      const validUntil = new Date(enrollmentDate);
      validUntil.setFullYear(validUntil.getFullYear() + 1); // 有效期1年
      
      const examDate = new Date(validUntil);
      examDate.setDate(examDate.getDate() - 30); // 考试时间在有效期前30天
      
      const now = new Date();
      let status: 'active' | 'expired' | 'completed' = 'active';
      if (now > validUntil) {
        status = 'expired';
      } else if (now > examDate && Math.random() > 0.5) {
        status = 'completed';
      }
      
      enrollments.push({
        courseId,
        courseName: course.name,
        category: course.category,
        enrollmentDate: enrollmentDate.toISOString().split('T')[0],
        validUntil: validUntil.toISOString().split('T')[0],
        examDate: examDate.toISOString().split('T')[0],
        status,
        paymentAmount: 2980 + index * 200, // 不同课程不同价格
        paymentDate: enrollmentDate.toISOString().split('T')[0]
      });
    }
  });
  
  return enrollments;
};



// Helper function to ensure user has all required fields and clean up invalid course data
const ensureUserCompatibility = (user: any): User => {
  const enrolledCourses = user.enrolledCourses || [];
  
  // 过滤courseProgress，只保留用户有权限且课程仍然存在的记录
  const validCourseProgress = (user.courseProgress || []).filter((progress: CourseProgress) => {
    const courseExists = availableCourses.find(c => c.id === progress.courseId);
    const hasPermission = enrolledCourses.includes(progress.courseId);
    return courseExists && hasPermission;
  });
  
  // 过滤courseEnrollments，只保留课程仍然存在的记录
  const validCourseEnrollments = (user.courseEnrollments || []).filter((enrollment: CourseEnrollment) => {
    const courseExists = availableCourses.find(c => c.id === enrollment.courseId);
    const hasPermission = enrolledCourses.includes(enrollment.courseId);
    return courseExists && hasPermission;
  });
  
  return {
    id: user.id || '',
    username: user.username || '',
    email: user.email || '',
    fullName: user.fullName || '',
    joinDate: user.joinDate || new Date().toISOString().split('T')[0],
    avatar: rabbitAvatarUrl, // 统一使用小兔子头像
    studyStats: {
      videosWatched: user.studyStats?.videosWatched || 0,
      exercisesCompleted: user.studyStats?.exercisesCompleted || 0,
      pdfsRead: user.studyStats?.pdfsRead || 0,
      studyHours: user.studyStats?.studyHours || 0,
    },
    enrolledCourses: enrolledCourses,
    courseProgress: validCourseProgress,
    courseEnrollments: validCourseEnrollments.length > 0 ? validCourseEnrollments : generateCourseEnrollments(enrolledCourses),
    exerciseProgress: user.exerciseProgress || [],
    mockExamProgress: user.mockExamProgress || [], // 新增字段
    mockExamAttempts: user.mockExamAttempts || [], // 新增字段
    preferences: {
      preferredSubjects: user.preferences?.preferredSubjects || [],
      difficulty: user.preferences?.difficulty || 'Medium'
    }
  };
};



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      // 初始化API连接
      await initializeApi();
      
      // 初始化题目统计数据
      initializeQuestionStats();
      
      // 检查本地存储中是否有用户登录信息
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          const compatibleUser = ensureUserCompatibility(userData);
          setUser(compatibleUser);
        } catch (error) {
          console.error('Failed to parse saved user data:', error);
          localStorage.removeItem('currentUser');
        }
      }
      setIsLoading(false);
    };
    
    initialize();
  }, []);

  const hasAccess = (courseId: string): boolean => {
    if (!user) return false;
    return user.enrolledCourses.includes(courseId);
  };

  const getExerciseProgress = (exerciseId: string): ExerciseProgress | null => {
    if (!user) return null;
    
    const progress = user.exerciseProgress.find(progress => progress.exerciseId === exerciseId);
    
    console.log('=== getExerciseProgress Debug ===');
    console.log('查找练习ID:', exerciseId);
    console.log('用户练习进度数组:', user.exerciseProgress);
    console.log('找到的进度:', progress);
    
    return progress || null;
  };

  const getQuestionDifficulty = (questionId: string): 'Easy' | 'Medium' | 'Hard' => {
    const stats = globalQuestionStats.get(questionId);
    if (!stats) {
      // 新题目，默认为简单
      return 'Easy';
    }
    return stats.currentDifficulty;
  };

  const getQuestionStats = (questionId: string): QuestionStats | null => {
    return globalQuestionStats.get(questionId) || null;
  };

  const updateQuestionStats = (questionId: string, isCorrect: boolean) => {
    const currentStats = globalQuestionStats.get(questionId);
    
    if (currentStats) {
      // 更新现有统计
      const newTotalAttempts = currentStats.totalAttempts + 1;
      const newWrongAttempts = currentStats.wrongAttempts + (isCorrect ? 0 : 1);
      const newWrongRate = newWrongAttempts / newTotalAttempts;
      const newDifficulty = calculateDifficulty(newWrongRate);
      
      const updatedStats: QuestionStats = {
        ...currentStats,
        totalAttempts: newTotalAttempts,
        wrongAttempts: newWrongAttempts,
        wrongRate: newWrongRate,
        currentDifficulty: newDifficulty,
        lastUpdated: new Date().toISOString()
      };
      
      globalQuestionStats.set(questionId, updatedStats);
    } else {
      // 创建新的统计记录
      const newStats: QuestionStats = {
        questionId,
        totalAttempts: 1,
        wrongAttempts: isCorrect ? 0 : 1,
        wrongRate: isCorrect ? 0 : 1,
        currentDifficulty: isCorrect ? 'Easy' : 'Easy', // 单次答题不足以判断困难度
        originalDifficulty: 'Easy',
        lastUpdated: new Date().toISOString()
      };
      
      globalQuestionStats.set(questionId, newStats);
    }
    
    // 保存到本地存储
    saveQuestionStats();
  };

  const updateExerciseProgress = (exerciseId: string, updates: Partial<ExerciseProgress>) => {
    if (!user) return;

    console.log('=== updateExerciseProgress Debug ===');
    console.log('更新练习ID:', exerciseId);
    console.log('更新数据:', updates);
    console.log('当前用户练习进度:', user.exerciseProgress);

    const existingProgressIndex = user.exerciseProgress.findIndex(p => p.exerciseId === exerciseId);
    let updatedExerciseProgress;

    if (existingProgressIndex !== -1) {
      // 更新现有进度 - 使用深度合并避免数据丢失
      const existingProgress = user.exerciseProgress[existingProgressIndex];
      const mergedProgress = {
        ...existingProgress,
        ...updates,
        lastUpdateTime: new Date().toISOString(),
        // 确保数组字段正确处理
        answers: updates.answers !== undefined ? updates.answers : existingProgress.answers,
        attempts: updates.attempts !== undefined ? updates.attempts : existingProgress.attempts,
      };
      
      updatedExerciseProgress = user.exerciseProgress.map((progress, index) =>
        index === existingProgressIndex ? mergedProgress : progress
      );
      
      console.log('更新现有进度:', mergedProgress);
    } else {
      // 创建新的进度记录
      const newProgress: ExerciseProgress = {
        exerciseId,
        courseId: updates.courseId || '',
        chapterId: updates.chapterId || '',
        totalQuestions: updates.totalQuestions || 0,
        completedQuestions: updates.completedQuestions || 0,
        correctAnswers: updates.correctAnswers || 0,
        lastQuestionIndex: updates.lastQuestionIndex || 0,
        answers: updates.answers || [],
        attempts: updates.attempts || [],
        startTime: updates.startTime || new Date().toISOString(),
        lastUpdateTime: new Date().toISOString(),
        isCompleted: updates.isCompleted || false,
        score: updates.score,
        ...updates
      };
      
      updatedExerciseProgress = [...user.exerciseProgress, newProgress];
      
      console.log('创建新进度:', newProgress);
    }

    // 立即更新用户数据
    const updatedUser = { ...user, exerciseProgress: updatedExerciseProgress };
    setUser(updatedUser);
    
    console.log('更新后的用户数据:', updatedUser);
    
    // 保存到本地存储
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      console.log('已保存到localStorage');
    } catch (error) {
      console.error('保存到localStorage失败:', error);
    }
    


    // 验证保存结果
    setTimeout(() => {
      const verifyProgress = getExerciseProgress(exerciseId);
      console.log('验证保存结果:', verifyProgress);
    }, 100);
  };

  const saveExerciseAttempt = (attempt: ExerciseAttempt) => {
    if (!user) return;

    console.log('=== saveExerciseAttempt Debug ===');
    console.log('保存答题记录:', attempt);

    // 更新题目统计
    updateQuestionStats(attempt.questionId, attempt.isCorrect);

    const exerciseProgress = user.exerciseProgress.find(p => p.exerciseId === attempt.exerciseId);
    if (exerciseProgress) {
      const updatedAttempts = [...exerciseProgress.attempts, attempt];
      updateExerciseProgress(attempt.exerciseId, { attempts: updatedAttempts });
      console.log('已更新答题记录，总记录数:', updatedAttempts.length);
    } else {
      console.log('未找到对应的练习进度');
    }
  };

  // 新增：模拟考试进度相关方法
  const saveMockExamProgress = (progress: MockExamProgress) => {
    if (!user) return;

    console.log('=== saveMockExamProgress Debug ===');
    console.log('保存考试进度:', progress);

    const existingProgressIndex = user.mockExamProgress.findIndex(p => p.examId === progress.examId);
    let updatedMockExamProgress;

    if (existingProgressIndex !== -1) {
      // 更新现有进度
      updatedMockExamProgress = user.mockExamProgress.map((p, index) =>
        index === existingProgressIndex ? { ...progress, lastUpdateTime: new Date().toISOString() } : p
      );
    } else {
      // 创建新的进度记录
      updatedMockExamProgress = [...user.mockExamProgress, progress];
    }

    // 立即更新用户数据
    const updatedUser = { ...user, mockExamProgress: updatedMockExamProgress };
    setUser(updatedUser);

    // 保存到本地存储
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('保存考试进度到localStorage失败:', error);
    }

    console.log('考试进度已保存');
  };

  const getMockExamProgress = (examId: string): MockExamProgress | null => {
    if (!user) return null;
    return user.mockExamProgress.find(p => p.examId === examId) || null;
  };

  const deleteMockExamProgress = (examId: string) => {
    if (!user) return;

    const updatedMockExamProgress = user.mockExamProgress.filter(p => p.examId !== examId);
    const updatedUser = { ...user, mockExamProgress: updatedMockExamProgress };
    setUser(updatedUser);

    // 保存到本地存储
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('删除考试进度时保存到localStorage失败:', error);
    }
  };

  const saveMockExamAttempt = (attempt: MockExamAttempt) => {
    if (!user) return;

    const updatedMockExamAttempts = [...user.mockExamAttempts, attempt];
    const updatedUser = { ...user, mockExamAttempts: updatedMockExamAttempts };
    setUser(updatedUser);

    // 保存到本地存储
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('保存考试记录到localStorage失败:', error);
    }
  };

  const getMockExamAttempts = (examId: string): MockExamAttempt[] => {
    if (!user) return [];
    return user.mockExamAttempts.filter(attempt => attempt.examId === examId && attempt.isCompleted);
  };

  const getAllMockExamProgress = (): MockExamProgress[] => {
    if (!user) return [];
    return user.mockExamProgress.filter(progress => !progress.isCompleted);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await apiAdapter.login(username, password);
      
      if (result.success && result.user) {
        const compatibleUser = ensureUserCompatibility(result.user);
        setUser(compatibleUser);
        localStorage.setItem('currentUser', JSON.stringify(compatibleUser));
        
        toast.success('登录成功', {
          description: `欢迎回来，${compatibleUser.fullName}！`,
          duration: 3000,
        });
        
        setIsLoading(false);
        return true;
      } else {
        toast.error('登录失败', {
          description: result.error || '用户名或密码错误',
          duration: 4000,
        });
        
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败', {
        description: '网络连接错误，请稍后重试',
        duration: 4000,
      });
      
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await apiAdapter.register(userData);
      
      if (result.success && result.user) {
        const compatibleUser = ensureUserCompatibility(result.user);
        setUser(compatibleUser);
        localStorage.setItem('currentUser', JSON.stringify(compatibleUser));
        
        toast.success('注册成功', {
          description: `欢迎加入，${compatibleUser.fullName}！`,
          duration: 3000,
        });
        
        setIsLoading(false);
        return true;
      } else {
        toast.error('注册失败', {
          description: result.error || '注册过程中发生错误',
          duration: 4000,
        });
        
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('注册失败', {
        description: '网络连接错误，请稍后重试',
        duration: 4000,
      });
      
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiAdapter.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    localStorage.removeItem('currentUser');
    
    toast.info('已退出登录', {
      description: '感谢您的使用，期待下次再见！',
      duration: 3000,
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const updateCourseProgress = (courseId: string, updates: Partial<CourseProgress>) => {
    if (!user) return;
    
    const existingProgressIndex = user.courseProgress.findIndex(p => p.courseId === courseId);
    let updatedCourseProgress;
    
    if (existingProgressIndex !== -1) {
      updatedCourseProgress = user.courseProgress.map((progress, index) =>
        index === existingProgressIndex ? { ...progress, ...updates } : progress
      );
    } else {
      const newProgress: CourseProgress = {
        courseId,
        courseName: updates.courseName || '',
        category: updates.category || '',
        totalVideos: updates.totalVideos || 0,
        watchedVideos: updates.watchedVideos || 0,
        totalExercises: updates.totalExercises || 0,
        completedExercises: updates.completedExercises || 0,
        totalPDFs: updates.totalPDFs || 0,
        readPDFs: updates.readPDFs || 0,
        studyHours: updates.studyHours || 0,
        lastActivity: new Date().toISOString().split('T')[0],
        completionPercentage: updates.completionPercentage || 0,
        ...updates
      };
      updatedCourseProgress = [...user.courseProgress, newProgress];
    }
    
    updateUser({ courseProgress: updatedCourseProgress });
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    updateCourseProgress,
    updateExerciseProgress,
    getExerciseProgress,
    saveExerciseAttempt,
    getQuestionDifficulty,
    updateQuestionStats,
    getQuestionStats,
    saveMockExamProgress,
    getMockExamProgress,
    deleteMockExamProgress,
    saveMockExamAttempt,
    getMockExamAttempts,
    getAllMockExamProgress,
    isLoading,
    availableCourses,
    hasAccess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}