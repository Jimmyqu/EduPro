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
}

export interface ApiCoursewareListResponse {
  coursewares: ApiCourseware[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiCourseDetail extends ApiCourse {
  coursewares: ApiCourseware[];
  is_enrolled: boolean;
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

export function convertApiCoursewareToLocal(apiCourseware: ApiCourseware) {
  return {
    id: apiCourseware.courseware_id.toString(),
    courseware_id: apiCourseware.courseware_id,
    title: apiCourseware.title,
    content_url: apiCourseware.content_url,
    duration_minutes: apiCourseware.duration_minutes,
    order_index: apiCourseware.order_index,
    course: apiCourseware.course ? convertApiCourseToLocal(apiCourseware.course) : undefined,
    is_enrolled: apiCourseware.is_enrolled || false,
    // 判断课件类型
    type: apiCourseware.content_url?.endsWith('.mp4') ? 'video' : 
          apiCourseware.content_url?.endsWith('.pdf') ? 'pdf' : 'other'
  };
}

export function convertApiEnrollmentToLocal(apiEnrollment: ApiEnrollment) {
  return {
    enrollment_id: apiEnrollment.enrollment_id,
    course: convertApiCourseToLocal(apiEnrollment.course),
    enrolled_at: apiEnrollment.enrolled_at,
    status: apiEnrollment.status,
    stats: apiEnrollment.stats
  };
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
  const { course, stats, enrolled_at } = enrollment;
  
  // 计算完成百分比
  const completionPercentage = stats.total_coursewares > 0 
    ? Math.round((stats.completed_coursewares / stats.total_coursewares) * 100)
    : 0;

  return {
    courseId: course.id.toString(),
    courseName: course.name,
    category: course.category || '未分类',
    totalVideos: stats.total_videos,
    watchedVideos: stats.viewed_videos,
    totalExercises: 0, // 暂未提供练习统计
    completedExercises: 0,
    totalPDFs: stats.total_documents,
    readPDFs: stats.viewed_documents,
    studyHours: Math.round((stats.completed_coursewares * 0.5)), // 估算学习时长：每个课件0.5小时
    lastActivity: enrolled_at, // 使用选课时间作为最后活动时间
    completionPercentage
  };
} 