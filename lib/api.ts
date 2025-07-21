// API 配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 统一响应结构（对应后端ApiResponse）
export interface ApiResponse<T = any> {
  code: number;        // 状态码：200成功，-1错误
  data?: T;           // 实际数据
  message: string;    // 响应消息
}

// 用户相关类型
export interface User {
  user_id: number;
  username: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 登录响应数据
export interface LoginData {
  access_token: string;
  refresh_token: string;
  user: User;
}

// 课程相关类型
export interface Course {
  course_id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
  creator?: User;
  category?: string;
  level: string;
  status: string;
  
  // 移除所有时间和人数限制相关字段
  // enrollment_start_date?: string;
  // enrollment_end_date?: string;
  // course_start_date?: string;
  // course_end_date?: string;
  // max_students?: number;
  
  // 新增：学习天数
  learning_days: number;
  requires_approval: boolean;
  current_student_count: number;
  // 移除报名时间和课程时间检查
  // is_enrollment_open: boolean;
  // is_course_active: boolean;
  can_enroll: boolean;
  
  created_at: string;
  updated_at: string;
}

// 课程列表响应
export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 课件类型
export interface Courseware {
  courseware_id: number;
  title: string;
  content_url?: string;
  duration_minutes?: number;
  order_index: number;
  course?: Course;
  is_enrolled?: boolean;
}

// 课件列表响应
export interface CoursewareListResponse {
  coursewares: Courseware[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}



// 选课记录
// 课程统计信息
export interface CourseStats {
  // PDF课件统计
  total_pdfs: number;
  completed_pdfs: number;
  
  // 视频统计
  total_videos: number;
  completed_videos: number;
  
  // 练习统计
  total_exercises: number;
  completed_exercises: number;
  participated_exercises: number;
  
  // 考试统计
  total_exams: number;
  completed_exams: number;
  participated_exams: number;
  
  // 总体统计（保持向后兼容）
  total_documents: number;
  viewed_videos: number;
  viewed_documents: number;
  total_coursewares: number;
  completed_coursewares: number;
}

export interface Enrollment {
  enrollment_id: number;
  course: Course;
  enrolled_at: string;
  status: string;
  
  // 审核相关字段
  approval_status: string;
  approved_by?: User;
  approved_at?: string;
  rejection_reason?: string;
  valid_until?: string;
  is_valid: boolean;
  days_until_expiry?: number;
  
  // 新增：剩余学习天数
  remaining_days: number;
  
  stats: CourseStats;
}

// 学习进度
export interface LearningProgress {
  progress_id: number;
  courseware: Courseware;
  status: string;
  last_viewed_at?: string;
  progress_detail?: any;
}

// 请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  full_name: string;
  email?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// OSS签名URL响应类型
export interface OSSSignedUrlResponse {
  url: string;
  expires_in: number;
}

// 课程报名申请相关类型
export interface CourseEnrollmentApplication {
  application_id: number;
  student: User;
  course: Course;
  application_reason?: string;
  status: string;
  reviewer?: User;
  review_comment?: string;
  reviewed_at?: string;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationListResponse {
  applications: CourseEnrollmentApplication[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CourseApplicationRequest {
  course_id: number;
  application_reason?: string;
}

export interface ApplicationReviewRequest {
  action: 'approve' | 'reject';
  review_comment?: string;
  valid_until?: string;
}

export interface ApplicationStatusResponse {
  has_enrolled: boolean;
  has_applied?: boolean;
  enrollment_status?: string;
  application_status?: string;
  enrollment?: {
    enrollment_id: number;
    approval_status: string;
    approved_at?: string;
    rejection_reason?: string;
    valid_until?: string;
    is_valid: boolean;
    days_until_expiry?: number;
  };
  application?: {
    application_id: number;
    status: string;
    application_reason?: string;
    review_comment?: string;
    applied_at: string;
    reviewed_at?: string;
  };
}

// ==================== 练习和考试相关类型 ====================

// 题目类型
export interface Question {
  question_id: number;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer';
  content: string;
  options?: Record<string, string>;
  correct_answer?: string;  // 正确答案（浏览模式下可见）
  analysis?: string;        // 题目解析（浏览模式下可见）
  explanation?: string;     // 兼容旧版本的解析字段
  difficulty: number;
  creator?: User;
  knowledge_points?: string[]; // 相关知识点
}

// 考试题目（包含用户答案信息）
export interface ExamQuestion {
  exam_question_id: number;
  question: Question;
  score: number;
  order_index: number;
  user_answer?: string; // 用户的答案
  is_correct?: boolean; // 是否答对
  score_awarded?: number; // 获得的分数
}

// 考试/练习基本信息
export interface Exam {
  exam_id: number;
  title: string;
  exam_type: 'exercise' | 'final';
  duration_minutes: number;
  total_score: number;
  passing_score: number;
  creator?: User;
  status: string;
  course: Course;
  total_questions: number;
  is_participated: boolean;
}

// 考试列表响应
export interface ApiExamListResponse {
  exams: Exam[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 考试详情响应
export interface ApiExamDetail {
  exam_id: number;
  title: string;
  exam_type: 'exercise' | 'final';
  duration_minutes: number;
  total_score: number;
  passing_score: number;
  creator?: User;
  status: string;
  course: Course;
  questions: ExamQuestion[];
  is_participated: boolean;
}

// 练习详情响应（继承考试详情）
export interface ExerciseDetail extends ApiExamDetail {}

// 答题记录
export interface AnswerRecord {
  answer_id: number;
  question: Question;
  student_answer?: string;
  is_correct?: boolean;
  score_awarded?: number;
}

// 考试记录
export interface ExamAttempt {
  attempt_id: number;
  exam: Exam;
  start_time: string;
  submit_time?: string;
  score?: number;
  status: 'in_progress' | 'submitted' | 'graded';
}

// 考试记录列表响应
export interface ApiExamAttemptListResponse {
  attempts: ExamAttempt[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 考试记录详情
export interface ApiExamAttemptDetail {
  attempt_id: number;
  exam: Exam;
  start_time: string;
  submit_time?: string;
  score?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answer_records: AnswerRecord[];
}

// 练习统计
export interface ApiExerciseStats {
  total_exercises: number;
  completed_exercises: number;
  completion_rate: number;
  exercises: {
    exam_id: number;
    exam__title: string;
    exam__course__title: string;
    attempt_count: number;
    best_score: number;
    latest_attempt: string;
  }[];
}

// 考试统计
export interface ApiExamStats {
  total_exams: number;
  passed_exams: number;
  pass_rate: number;
  exams: {
    exam_id: number;
    exam__title: string;
    exam__course__title: string;
    attempt_count: number;
    best_score: number;
    latest_attempt: string;
  }[];
}

export interface QuestionResult {
  question_id: number;
  question_content: string;
  question_type: string;
  options?: Record<string, string>;
  correct_answer: string;
  student_answer: string;
  is_correct: boolean;
  score_awarded: number;
  total_score: number;
  analysis?: string;
}

export interface SubmitResult {
  attempt_id: number;
  total_score: number;
  max_score: number;
  pass_status: boolean;
  question_results: QuestionResult[];
  summary: {
    total_questions: number;
    correct_count: number;
    wrong_count: number;
    accuracy_rate: number;
    pass_score: number;
  };
}

// HTTP 请求工具函数
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 添加认证token（如果存在）
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response:`, data);
    
    return data; // 后端直接返回ApiResponse格式
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    
    return {
      code: -1,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// API 服务函数
export const apiService = {
  // ==================== 认证相关 ====================
  
  // 用户登录
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginData>> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // 用户注册
  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 用户登出
  async logout(): Promise<ApiResponse> {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  // 获取用户信息
  async getProfile(): Promise<ApiResponse<User>> {
    return apiRequest('/auth/profile');
  },

  // 更新用户信息
  async updateProfile(updates: UserUpdateRequest): Promise<ApiResponse<User>> {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // 修改密码
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  // ==================== 课程相关 ====================
  
  // 获取课程列表
  async getCourses(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    level?: string;
  }): Promise<ApiResponse<CourseListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.category) queryParams.append('category', params.category);
      if (params.level) queryParams.append('level', params.level);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/courses?${queryString}` : '/courses';
    
    return apiRequest(endpoint);
  },



  // 选课
  async enrollCourse(courseId: number): Promise<ApiResponse> {
    return apiRequest(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  },

  // 退课
  async unenrollCourse(courseId: number): Promise<ApiResponse> {
    return apiRequest(`/courses/${courseId}/unenroll`, {
      method: 'POST',
    });
  },

  // 申请报名课程
  async applyCourse(courseId: number, applicationReason?: string): Promise<ApiResponse> {
    return apiRequest(`/courses/${courseId}/apply`, {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        application_reason: applicationReason
      }),
    });
  },

  // 获取课程申请状态
  async getCourseApplicationStatus(courseId: number): Promise<ApiResponse<ApplicationStatusResponse>> {
    return apiRequest(`/courses/${courseId}/application-status`);
  },

  // 获取我的申请记录
  async getMyApplications(params?: {
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<ApplicationListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/my-applications?${queryString}` : '/my-applications';
    
    return apiRequest(endpoint);
  },

  // ==================== 课件相关 ====================
  
  // 获取课件列表
  async getCoursewares(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    course_id?: number;
  }): Promise<ApiResponse<CoursewareListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.course_id) queryParams.append('course_id', params.course_id.toString());
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/coursewares?${queryString}` : '/coursewares';
    
    return apiRequest(endpoint);
  },

  // ==================== 我的课程 ====================
  
  // 获取我的课程
  async getMyCourses(): Promise<ApiResponse<Enrollment[]>> {
    return apiRequest('/my-courses');
  },

  // 获取课程学习进度
  async getCourseProgress(courseId: number): Promise<ApiResponse<LearningProgress[]>> {
    return apiRequest(`/my-courses/${courseId}/progress`);
  },

  // 更新课件学习进度
  async updateCoursewareProgress(
    courseId: number, 
    coursewareId: number, 
    status: 'not_started' | 'in_progress' | 'completed' = 'completed'
  ): Promise<ApiResponse> {
    return apiRequest(`/my-courses/${courseId}/courseware/${coursewareId}/progress`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // ==================== OSS相关 ====================
  
  // 获取OSS文件签名URL
  async getOSSSignedUrl(key: string): Promise<ApiResponse<OSSSignedUrlResponse>> {
    return apiRequest(`/oss/signed-url?key=${encodeURIComponent(key)}`);
  },

  // ==================== 练习和考试相关 ====================
  
  // 获取练习列表
  async getExercises(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    course_id?: number;
  }): Promise<ApiResponse<ApiExamListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.course_id) queryParams.append('course_id', params.course_id.toString());
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exercises?${queryString}` : '/exercises';
    
    return apiRequest(endpoint);
  },

  // 获取考试列表
  async getExams(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    course_id?: number;
  }): Promise<ApiResponse<ApiExamListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.course_id) queryParams.append('course_id', params.course_id.toString());
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exams?${queryString}` : '/exams';
    
    return apiRequest(endpoint);
  },

  // 获取练习详情
  async getExerciseDetail(exerciseId: number): Promise<ApiResponse<ApiExamDetail>> {
    return apiRequest(`/exercises/${exerciseId}`);
  },

  // 获取练习浏览模式详情
  async getExerciseBrowse(exerciseId: number): Promise<ApiResponse<ApiExamDetail>> {
    return apiRequest(`/exercises/${exerciseId}/browse`);
  },

  // 获取考试详情
  async getExamDetail(examId: number): Promise<ApiResponse<ApiExamDetail>> {
    return apiRequest(`/exams/${examId}`);
  },

  // 获取我的考试记录
  async getMyExamAttempts(params?: {
    page?: number;
    per_page?: number;
    exam_type?: string;
  }): Promise<ApiResponse<ApiExamAttemptListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.exam_type) queryParams.append('exam_type', params.exam_type);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/my-exam-attempts?${queryString}` : '/my-exam-attempts';
    
    return apiRequest(endpoint);
  },

  // 获取考试记录详情
  async getExamAttemptDetail(attemptId: number): Promise<ApiResponse<ApiExamAttemptDetail>> {
    return apiRequest(`/my-exam-attempts/${attemptId}`);
  },

  // 获取我的练习统计
  async getMyExerciseStats(): Promise<ApiResponse<ApiExerciseStats>> {
    return apiRequest('/my-exercises');
  },

  // 获取我的考试统计
  async getMyExamStats(): Promise<ApiResponse<ApiExamStats>> {
    return apiRequest('/my-exams');
  },

  // ==================== 练习和考试提交 ====================
  
  // 提交练习答案
  async submitExercise(exerciseId: number, answers: Array<{questionId: number, answer: string}>): Promise<ApiResponse<SubmitResult>> {
    return apiRequest(`/exercises/${exerciseId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  // 提交考试答案
  async submitExam(examId: number, answers: Array<{questionId: number, answer: string}>): Promise<ApiResponse<ExamAttempt>> {
    return apiRequest(`/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },



  // ==================== 测试相关 ====================
  
  // 健康检查
  async healthCheck(): Promise<ApiResponse> {
    return apiRequest('/test');
  },

  // 认证测试
  async testAuth(): Promise<ApiResponse> {
    return apiRequest('/test/auth');
  },
};

// 工具函数：检查API连接
export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await apiService.healthCheck();
    return response.code === 200;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
}

// 工具函数：设置认证token
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

// 工具函数：获取认证token
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

// 工具函数：检查响应是否成功
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.code === 200;
} 