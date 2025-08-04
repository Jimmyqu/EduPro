// API响应相关类型定义，与后端保持一致

export interface ApiUser {
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

export interface ApiCourse {
  course_id: number;
  title: string;
  description?: string;
  cover_image_url?: string;
  creator?: ApiUser;
  category?: string;
  level: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCourseware {
  courseware_id: number;
  title: string;
  content_url?: string;
  duration_minutes?: number;
  order_index: number;
  course?: ApiCourse;
  is_enrolled?: boolean;
  category?: string;
}

export interface ApiCoursewareListResponse {
  coursewares: ApiCourseware[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}



export interface ApiCourseStats {
  total_videos: number;
  total_documents: number;
  viewed_videos: number;
  viewed_documents: number;
  total_coursewares: number;
  completed_coursewares: number;
}

export interface ApiEnrollment {
  enrollment_id: number;
  course: ApiCourse;
  enrolled_at: string;
  status: string;
  approval_status: string;
  approved_by?: ApiUser;
  approved_at?: string;
  rejection_reason?: string;
  valid_until?: string;
  is_valid: boolean;
  days_until_expiry?: number;
  remaining_days: number;
  stats: ApiCourseStats;
}

export interface ApiLearningProgress {
  progress_id: number;
  courseware: ApiCourseware;
  status: string;
  last_viewed_at?: string;
  progress_detail?: any;
}

// 转换函数：将API数据转换为前端显示格式
export function convertApiUserToLocal(apiUser: ApiUser) {
  return {
    id: apiUser.user_id.toString(),
    username: apiUser.username,
    email: apiUser.email || '',
    fullName: apiUser.full_name,
    avatar: apiUser.avatar_url,
    joinDate: apiUser.created_at,
    role: apiUser.role,
    status: apiUser.status
  };
}

export function convertApiCourseToLocal(apiCourse: ApiCourse) {
  return {
    id: apiCourse.course_id.toString(),
    name: apiCourse.title,
    title: apiCourse.title,
    description: apiCourse.description || '',
    category: apiCourse.category || '未分类',
    level: apiCourse.level,
    status: apiCourse.status,
    cover_image_url: apiCourse.cover_image_url,
    created_at: apiCourse.created_at,
    updated_at: apiCourse.updated_at,
    creator: apiCourse.creator ? convertApiUserToLocal(apiCourse.creator) : undefined
  };
}

// 获取内容类型的辅助函数
function getContentType(url: string | null | undefined): string {
  if (!url) return 'other';
  
  const fileName = url.toLowerCase();
  
  // 视频格式
  const videoExtensions = ['.mp4', '.flv', '.avi', '.mov', '.wmv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'];
  if (videoExtensions.some(ext => fileName.endsWith(ext))) {
    return 'video';
  }
  
  // PDF格式
  if (fileName.endsWith('.pdf')) {
    return 'pdf';
  }
  
  // 音频格式
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.wma', '.m4a'];
  if (audioExtensions.some(ext => fileName.endsWith(ext))) {
    return 'audio';
  }
  
  // 文档格式
  const docExtensions = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'];
  if (docExtensions.some(ext => fileName.endsWith(ext))) {
    return 'document';
  }
  
  return 'other';
}

export function convertApiCoursewareToLocal(apiCourseware: ApiCourseware) {
  return {
    id: apiCourseware.courseware_id.toString(),
    courseware_id: apiCourseware.courseware_id,
    title: apiCourseware.title,
    content_url: apiCourseware.content_url,
    duration_minutes: apiCourseware.duration_minutes,
    order_index: apiCourseware.order_index,
    category: apiCourseware.category,
    course: apiCourseware.course ? convertApiCourseToLocal(apiCourseware.course) : undefined,
    is_enrolled: apiCourseware.is_enrolled || false,
    // 使用改进的类型判断逻辑
    type: getContentType(apiCourseware.content_url)
  };
}

export function convertApiEnrollmentToLocal(apiEnrollment: ApiEnrollment) {
  console.log('convertApiEnrollmentToLocal 输入:', apiEnrollment);
  
  if (!apiEnrollment) {
    console.error('convertApiEnrollmentToLocal: apiEnrollment is undefined');
    return null;
  }

  if (!apiEnrollment.course) {
    console.error('convertApiEnrollmentToLocal: course is undefined', apiEnrollment);
    return null;
  }

  const result = {
    enrollment_id: apiEnrollment.enrollment_id,
    course: convertApiCourseToLocal(apiEnrollment.course),
    enrolled_at: apiEnrollment.enrolled_at,
    status: apiEnrollment.status,
    approval_status: apiEnrollment.approval_status,
    approved_by: apiEnrollment.approved_by ? convertApiUserToLocal(apiEnrollment.approved_by) : undefined,
    approved_at: apiEnrollment.approved_at,
    rejection_reason: apiEnrollment.rejection_reason,
    valid_until: apiEnrollment.valid_until,
    is_valid: apiEnrollment.is_valid,
    days_until_expiry: apiEnrollment.days_until_expiry,
    remaining_days: apiEnrollment.remaining_days,
    stats: apiEnrollment.stats
  };
  
  console.log('convertApiEnrollmentToLocal 输出:', result);
  return result;
}

// 计算课程学习进度的辅助函数
export function calculateCourseProgress(progressList: ApiLearningProgress[]): number {
  if (!progressList || progressList.length === 0) return 0;
  
  const completedCount = progressList.filter(p => p.status === 'completed').length;
  return Math.round((completedCount / progressList.length) * 100);
}

// 将API学习进度转换为前端格式
export function convertApiProgressToLocal(
  course: ApiCourse, 
  progressList: ApiLearningProgress[]
) {
  const completionPercentage = calculateCourseProgress(progressList);
  const completedCourseware = progressList.filter(p => p.status === 'completed').length;
  const lastActivity = progressList
    .filter(p => p.last_viewed_at)
    .sort((a, b) => new Date(b.last_viewed_at!).getTime() - new Date(a.last_viewed_at!).getTime())[0]?.last_viewed_at || course.created_at;

  return {
    courseId: course.course_id.toString(),
    courseName: course.title,
    category: course.category || '未分类',
    totalVideos: progressList.length, // 暂时用课件数量代替
    watchedVideos: completedCourseware,
    totalExercises: 0, // API暂未提供
    completedExercises: 0,
    totalPDFs: 0, // API暂未提供
    readPDFs: 0,
    studyHours: 0, // API暂未提供
    lastActivity,
    completionPercentage
  };
}

// 从enrollment数据直接创建课程进度信息（使用新的stats字段）
export function convertEnrollmentToProgress(enrollment: any) {
  // 添加安全检查
  if (!enrollment) {
    console.error('convertEnrollmentToProgress: enrollment is undefined');
    return null;
  }

  // 提前检查course对象
  if (!enrollment.course) {
    console.error('convertEnrollmentToProgress: course is undefined', enrollment);
    return null;
  }

  // 检查course.id (注意：这里使用id而不是course_id，因为convertApiCourseToLocal已经转换过)
  if (!enrollment.course.id && enrollment.course.id !== '0') {
    console.error('convertEnrollmentToProgress: course.id is undefined', enrollment.course);
    return null;
  }

  const { course, stats, enrolled_at, remaining_days } = enrollment;
  
  // 检查stats是否存在
  if (!stats) {
    console.error('convertEnrollmentToProgress: stats is undefined', enrollment);
    return null;
  }
  
  // 计算完成百分比
  const completionPercentage = stats.total_coursewares > 0 
    ? Math.round((stats.completed_coursewares / stats.total_coursewares) * 100)
    : 0;

  try {
    return {
      courseId: course.id, // 使用id而不是course_id
      courseName: course.title || course.name || '未知课程',
      category: course.category || '未分类',
      totalVideos: stats.total_videos || 0,
      watchedVideos: stats.viewed_videos || 0,
      totalExercises: 0, // 暂未提供练习统计
      completedExercises: 0,
      totalPDFs: stats.total_documents || 0,
      readPDFs: stats.viewed_documents || 0,
      studyHours: Math.round(((stats.completed_coursewares || 0) * 0.5)), // 估算学习时长：每个课件0.5小时
      lastActivity: enrolled_at || new Date().toISOString(), // 使用选课时间作为最后活动时间
      completionPercentage,
      remainingDays: remaining_days || 0 // 添加剩余学习天数
    };
  } catch (error) {
    console.error('convertEnrollmentToProgress: 转换过程出错', error, enrollment);
    return null;
  }
} 

// ==================== 练习和考试相关类型 ====================

// 题目类型
export interface ApiQuestion {
  question_id: number;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer';
  content: string;
  options?: Record<string, string>;
  difficulty: number;
  creator?: ApiUser;
}

// 考试题目
export interface ApiExamQuestion {
  exam_question_id: number;
  question: ApiQuestion;
  score: number;
  order_index: number;
}

// 考试/练习基本信息
export interface ApiExam {
  exam_id: number;
  title: string;
  exam_type: 'exercise' | 'final';
  duration_minutes: number;
  total_score: number;
  passing_score: number;
  creator?: ApiUser;
  status: string;
  course: ApiCourse;
  total_questions: number;
  is_participated: boolean;
}

// 考试列表响应
export interface ApiExamListResponse {
  exams: ApiExam[];
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
  creator?: ApiUser;
  status: string;
  course: ApiCourse;
  questions: ApiExamQuestion[];
  is_participated: boolean;
}

// 答题记录
export interface ApiAnswerRecord {
  answer_id: number;
  question: ApiQuestion;
  student_answer?: string;
  is_correct?: boolean;
  score_awarded?: number;
}

// 考试记录
export interface ApiExamAttempt {
  attempt_id: number;
  exam: ApiExam;
  start_time: string;
  submit_time?: string;
  score?: number;
  status: 'in_progress' | 'submitted' | 'graded';
}

// 考试记录列表响应
export interface ApiExamAttemptListResponse {
  attempts: ApiExamAttempt[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// 考试记录详情
export interface ApiExamAttemptDetail {
  attempt_id: number;
  exam: ApiExam;
  start_time: string;
  submit_time?: string;
  score?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answer_records: ApiAnswerRecord[];
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